from django.urls import path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register("stock-movements", views.StockMovementViewSet, basename="stock-movement")

inventory_urlpatterns = router.urls + [
    path("low-stock/", views.LowStockView.as_view(), name="inventory-low-stock"),
]
