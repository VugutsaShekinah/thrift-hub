from django.urls import path
from rest_framework.routers import SimpleRouter

from . import views

# SimpleRouter (not DefaultRouter) deliberately — DefaultRouter adds an
# auto-generated API-root view at "^$" for EVERY router instance, and with
# two routers mounted under the same "/api/orders/" prefix those root views
# collide (the first one always wins, shadowing the second router's list
# route entirely). SimpleRouter skips that root view, which we don't need.
#
# Coupons/promotions are mounted BEFORE the order router below: OrderViewSet
# is registered at the empty prefix so an order's detail route is
# `/api/orders/<order_number>/`, and its catch-all `(?P<order_number>)`
# pattern would otherwise shadow `/api/orders/coupons/` etc. if tried first.
misc_router = SimpleRouter()
misc_router.register("coupons", views.CouponViewSet, basename="coupon")
misc_router.register("promotions", views.PromotionViewSet, basename="promotion")

order_router = SimpleRouter()
order_router.register("", views.OrderViewSet, basename="order")

orders_urlpatterns = [
    path("checkout/", views.CheckoutView.as_view(), name="order-checkout"),
    path("coupons/validate/", views.CouponValidateView.as_view(), name="coupon-validate"),
    *misc_router.urls,
    *order_router.urls,
]
