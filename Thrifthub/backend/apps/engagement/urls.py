from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register("wishlist", views.WishlistViewSet, basename="wishlist")
router.register("reviews", views.ReviewViewSet, basename="review")

engagement_urlpatterns = router.urls
