from rest_framework import mixins, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.catalog.models import Product
from apps.core.permissions import IsStaff

from . import services
from .models import StockMovement
from .serializers import LowStockProductSerializer, StockMovementSerializer


class StockMovementViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.CreateModelMixin, viewsets.GenericViewSet):
    """Read + create only — the ledger is append-only, so update/destroy are
    intentionally not exposed (see docs/02-system-design.md §4.1)."""

    queryset = StockMovement.objects.select_related("product", "created_by").all()
    serializer_class = StockMovementSerializer
    permission_classes = [IsStaff]
    filterset_fields = ["product", "change_type"]

    def perform_create(self, serializer):
        product = serializer.validated_data["product"]
        services.adjust_stock(
            product=product,
            delta=serializer.validated_data["quantity_delta"],
            change_type=serializer.validated_data["change_type"],
            reference=serializer.validated_data.get("reference", ""),
            note=serializer.validated_data.get("note", ""),
            user=self.request.user,
        )


class LowStockView(APIView):
    """Surfaces both low-stock (1-2 units left) and sold-out (0, inactive)
    products so staff can prioritize replenishment / re-batching."""

    permission_classes = [IsStaff]

    def get(self, request):
        low = Product.objects.filter(quantity__gt=0, quantity__lte=2).select_related("category")
        sold_out = Product.objects.filter(quantity=0).select_related("category").order_by("-updated_at")[:50]
        return Response(
            {
                "low_stock": LowStockProductSerializer(low, many=True).data,
                "sold_out": LowStockProductSerializer(sold_out, many=True).data,
            }
        )
