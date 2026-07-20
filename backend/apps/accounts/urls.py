from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

auth_urlpatterns = [
    path("register/", views.RegisterView.as_view(), name="auth-register"),
    path("login/", views.LoginView.as_view(), name="auth-login"),
    path("logout/", views.LogoutView.as_view(), name="auth-logout"),
    path("token/refresh/", views.CookieTokenRefreshView.as_view(), name="auth-token-refresh"),
    path("password-reset/", views.PasswordResetRequestView.as_view(), name="auth-password-reset"),
    path(
        "password-reset/confirm/",
        views.PasswordResetConfirmView.as_view(),
        name="auth-password-reset-confirm",
    ),
]

router = DefaultRouter()
router.register("addresses", views.AddressViewSet, basename="address")

account_urlpatterns = [
    path("me/", views.MeView.as_view(), name="account-me"),
    path("change-password/", views.ChangePasswordView.as_view(), name="account-change-password"),
    path("", include(router.urls)),
]
