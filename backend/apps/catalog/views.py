from django.db.models import F
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.core.permissions import IsStaff, IsStaffOrReadOnly
from apps.inventory.models import StockMovement

from .filters import ProductFilter
from .models import BaleBatch, Category, Product, ProductImage, Supplier
from .serializers import (
    BaleBatchSerializer,
    CategorySerializer,
    ProductDetailSerializer,
    ProductImageSerializer,
    ProductListSerializer,
    ProductWriteSerializer,
    SupplierSerializer,
)


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.select_related("parent").all()
    serializer_class = CategorySerializer
    permission_classes = [IsStaffOrReadOnly]
    lookup_field = "slug"
    filterset_fields = ["parent", "is_active"]
    search_fields = ["name"]

    def get_queryset(self):
        qs = super().get_queryset()
        if not (self.request.user and self.request.user.is_staff):
            qs = qs.filter(is_active=True)
        return qs


class ProductViewSet(viewsets.ModelViewSet):
    permission_classes = [IsStaffOrReadOnly]
    lookup_field = "slug"
    filterset_class = ProductFilter
    search_fields = ["title", "description", "brand"]
    ordering_fields = ["selling_price_kes", "created_at", "view_count"]
    ordering = ["-created_at"]

    def get_queryset(self):
        qs = Product.objects.select_related("category", "bale_batch").prefetch_related("images", "reviews")
        if not (self.request.user and self.request.user.is_staff):
            qs = qs.filter(is_active=True)
        return qs

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return ProductWriteSerializer
        if self.action == "list":
            return ProductListSerializer
        return ProductDetailSerializer

    def perform_create(self, serializer):
        product = serializer.save()
        if product.quantity > 0:
            StockMovement.objects.create(
                product=product,
                change_type=StockMovement.ChangeType.INTAKE,
                quantity_delta=product.quantity,
                reference=product.bale_batch.batch_code if product.bale_batch else "manual-intake",
                created_by=self.request.user,
            )

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        Product.objects.filter(pk=instance.pk).update(view_count=F("view_count") + 1)
        instance.refresh_from_db(fields=["view_count"])
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @action(detail=True, methods=["get"])
    def related(self, request, slug=None):
        product = self.get_object()
        related = (
            self.get_queryset()
            .filter(category=product.category, is_active=True)
            .exclude(pk=product.pk)[:8]
        )
        serializer = ProductListSerializer(related, many=True, context={"request": request})
        return Response(serializer.data)

    @action(detail=True, methods=["get"])
    def reviews(self, request, slug=None):
        from apps.engagement.models import Review
        from apps.engagement.serializers import ReviewSerializer

        product = self.get_object()
        qs = Review.objects.filter(product=product, is_approved=True).select_related("user")
        page = self.paginate_queryset(qs)
        serializer = ReviewSerializer(page or qs, many=True)
        return self.get_paginated_response(serializer.data) if page is not None else Response(serializer.data)

    @action(detail=True, methods=["post"], permission_classes=[IsStaffOrReadOnly])
    def images(self, request, slug=None):
        product = self.get_object()
        serializer = ProductImageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(product=product)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer
    permission_classes = [IsStaff]
    search_fields = ["name", "contact_person"]
    filterset_fields = ["is_active", "county"]


class BaleBatchViewSet(viewsets.ModelViewSet):
    queryset = BaleBatch.objects.select_related("supplier", "category").all()
    serializer_class = BaleBatchSerializer
    permission_classes = [IsStaff]
    filterset_fields = ["supplier", "category"]
    search_fields = ["batch_code"]
