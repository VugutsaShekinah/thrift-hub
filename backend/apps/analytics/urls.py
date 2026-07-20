from django.urls import path

from . import views

analytics_urlpatterns = [
    path("sales/", views.SalesAnalyticsView.as_view(), name="analytics-sales"),
    path("inventory/", views.InventoryAnalyticsView.as_view(), name="analytics-inventory"),
    path("suppliers/", views.SupplierPerformanceView.as_view(), name="analytics-suppliers"),
    path("customers/", views.CustomerAnalyticsView.as_view(), name="analytics-customers"),
]
