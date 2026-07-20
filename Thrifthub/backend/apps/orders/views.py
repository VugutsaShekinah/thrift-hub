from django.utils import timezone
from rest_framework import mixins, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import Address
from apps.core.exceptions import DomainError
from apps.core.permissions import IsStaff, IsStaffOrReadOnly

from . import services
from .models import Coupon, Order, Promotion
from .serializers import (
    CheckoutSerializer,
    CouponSerializer,
    CouponValidateSerializer,
    OrderSerializer,
    OrderStatusUpdateSerializer,
    PromotionSerializer,
)


class CheckoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = CheckoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        shipping_info = self._resolve_shipping_info(request, data)

        order = services.checkout(
            user=request.user,
            items=[{"product_id": i["product_id"], "quantity": i["quantity"]} for i in data["items"]],
            shipping_info=shipping_info,
            payment_method=data["payment_method"],
            coupon_code=data.get("coupon_code") or None,
            mpesa_phone=data.get("mpesa_phone") or None,
        )
        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)

    @staticmethod
    def _resolve_shipping_info(request, data):
        if "address_id" in data:
            try:
                address = Address.objects.get(pk=data["address_id"], user=request.user)
            except Address.DoesNotExist:
                raise DomainError("Address not found.", code="address_not_found")
            return {
                "recipient_name": address.recipient_name,
                "phone_number": address.phone_number,
                "county": address.county,
                "town": address.town,
                "street_address": address.street_address,
            }
        return {
            "recipient_name": data["recipient_name"],
            "phone_number": data["phone_number"],
            "county": data["county"],
            "town": data["town"],
            "street_address": data["street_address"],
        }


class OrderViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = "order_number"
    filterset_fields = ["status"]

    def get_queryset(self):
        qs = Order.objects.select_related("user", "coupon").prefetch_related("items", "payments")
        if self.request.user.is_staff:
            return qs
        return qs.filter(user=self.request.user)

    @action(detail=True, methods=["patch"], permission_classes=[IsStaff])
    def status(self, request, order_number=None):
        order = self.get_object()
        serializer = OrderStatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        updated = services.transition_order_status(
            order, serializer.validated_data["status"], user=request.user
        )
        return Response(OrderSerializer(updated).data)


class CouponValidateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = CouponValidateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        coupon = services.validate_coupon(
            serializer.validated_data["code"], serializer.validated_data["subtotal"]
        )
        discount = services.calculate_discount(coupon, serializer.validated_data["subtotal"])
        return Response({"valid": True, "discount_kes": discount, "coupon": CouponSerializer(coupon).data})


class CouponViewSet(viewsets.ModelViewSet):
    queryset = Coupon.objects.all()
    serializer_class = CouponSerializer
    permission_classes = [IsStaff]
    search_fields = ["code"]


class PromotionViewSet(viewsets.ModelViewSet):
    serializer_class = PromotionSerializer
    permission_classes = [IsStaffOrReadOnly]
    filterset_fields = ["category", "is_active"]

    def get_queryset(self):
        qs = Promotion.objects.select_related("category").all()
        if not (self.request.user and self.request.user.is_staff):
            now = timezone.now()
            qs = qs.filter(is_active=True, starts_at__lte=now, ends_at__gte=now)
        return qs
