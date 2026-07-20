from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register("categories", views.CategoryViewSet, basename="category")
router.register("suppliers", views.SupplierViewSet, basename="supplier")
router.register("bale-batches", views.BaleBatchViewSet, basename="bale-batch")
router.register("products", views.ProductViewSet, basename="product")

catalog_urlpatterns = router.urls
