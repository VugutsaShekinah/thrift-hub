from datetime import timedelta

from django.db.models import Avg, Count, DecimalField, F, Sum
from django.db.models.functions import Coalesce, TruncDate
from django.utils import timezone
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.catalog.models import Product, Supplier
from apps.core.permissions import IsStaff
from apps.orders.models import Order, OrderItem

PERIOD_DAYS = {"7d": 7, "30d": 30, "90d": 90}


class SalesAnalyticsView(APIView):
    """Revenue trend + top sellers, the backbone of the admin dashboard
    (FR-30). Cancelled orders are excluded since they were never fulfilled
    revenue; refunded orders are still counted (the sale happened) — a
    deliberate choice worth revisiting once real refund volume exists."""

    permission_classes = [IsStaff]

    def get(self, request):
        period = request.query_params.get("period", "30d")
        qs = Order.objects.exclude(status=Order.Status.CANCELLED)
        if period in PERIOD_DAYS:
            since = timezone.now() - timedelta(days=PERIOD_DAYS[period])
            qs = qs.filter(placed_at__gte=since)

        totals = qs.aggregate(
            revenue_kes=Coalesce(Sum("total_kes"), 0, output_field=DecimalField(max_digits=12, decimal_places=2)),
            order_count=Count("id"),
            average_order_value_kes=Coalesce(
                Avg("total_kes"), 0, output_field=DecimalField(max_digits=12, decimal_places=2)
            ),
        )

        daily = (
            qs.annotate(day=TruncDate("placed_at"))
            .values("day")
            .annotate(revenue_kes=Sum("total_kes"), order_count=Count("id"))
            .order_by("day")
        )

        line_revenue = F("price_kes_snapshot") * F("quantity")
        top_products = (
            OrderItem.objects.filter(order__in=qs)
            .values("product_id", "title_snapshot")
            .annotate(units_sold=Sum("quantity"), revenue_kes=Sum(line_revenue))
            .order_by("-revenue_kes")[:10]
        )
        top_categories = (
            OrderItem.objects.filter(order__in=qs, product__isnull=False)
            .values(category=F("product__category__name"))
            .annotate(revenue_kes=Sum(line_revenue))
            .order_by("-revenue_kes")[:10]
        )

        return Response(
            {
                "period": period,
                "totals": totals,
                "daily": list(daily),
                "top_products": list(top_products),
                "top_categories": list(top_categories),
            }
        )


class InventoryAnalyticsView(APIView):
    permission_classes = [IsStaff]

    def get(self, request):
        active = Product.objects.filter(is_active=True)
        stock_value = active.aggregate(
            value=Coalesce(
                Sum(F("selling_price_kes") * F("quantity")), 0, output_field=DecimalField(max_digits=14, decimal_places=2)
            )
        )["value"]

        by_category = (
            active.values(category_name=F("category__name"))
            .annotate(
                product_count=Count("id"),
                stock_value_kes=Sum(F("selling_price_kes") * F("quantity")),
            )
            .order_by("-product_count")
        )

        return Response(
            {
                "active_product_count": active.count(),
                "low_stock_count": Product.objects.filter(quantity__gt=0, quantity__lte=2).count(),
                "sold_out_count": Product.objects.filter(quantity=0).count(),
                "total_stock_value_kes": stock_value,
                "by_category": list(by_category),
            }
        )


class SupplierPerformanceView(APIView):
    """FR-20: batches supplied, items listed from those batches, and total
    sourcing spend per supplier, so staff can see which suppliers yield the
    best cost-per-item and sell-through."""

    permission_classes = [IsStaff]

    def get(self, request):
        suppliers = (
            Supplier.objects.annotate(
                batch_count=Count("bale_batches", distinct=True),
                total_cost_kes=Coalesce(
                    Sum("bale_batches__cost_kes"), 0, output_field=DecimalField(max_digits=12, decimal_places=2)
                ),
                items_listed=Count("bale_batches__products", distinct=True),
                items_sold=Count("bale_batches__products__order_items", distinct=True),
            )
            .values(
                "id", "name", "county", "rating", "batch_count",
                "total_cost_kes", "items_listed", "items_sold",
            )
            .order_by("-total_cost_kes")
        )
        return Response(list(suppliers))
