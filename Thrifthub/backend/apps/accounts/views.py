from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework import generics, permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from apps.core.permissions import IsOwner

from .auth_cookies import clear_refresh_cookie, set_refresh_cookie
from .models import Address, User
from .serializers import (
    AddressSerializer,
    ChangePasswordSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    RegisterSerializer,
    UserSerializer,
)
from .tokens import ThriftHubTokenObtainPairSerializer

reset_token_generator = PasswordResetTokenGenerator()


def _issue_tokens_response(user, status_code):
    """Shared by register/login: issues an access token in the JSON body and
    sets the refresh token as an httpOnly cookie (see docs/02-system-design.md
    §6 for why the refresh token never touches JS-readable storage)."""
    refresh = RefreshToken.for_user(user)
    refresh["role"] = user.role
    refresh["is_staff"] = user.is_staff
    access = refresh.access_token
    access["role"] = user.role
    access["is_staff"] = user.is_staff
    access["full_name"] = user.full_name

    response = Response(
        {"access": str(access), "user": UserSerializer(user).data},
        status=status_code,
    )
    set_refresh_cookie(response, refresh)
    return response


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return _issue_tokens_response(user, status.HTTP_201_CREATED)


class LoginView(TokenObtainPairView):
    """Wraps SimpleJWT's TokenObtainPairView to move the refresh token into
    an httpOnly cookie instead of returning it in the JSON body."""

    serializer_class = ThriftHubTokenObtainPairSerializer
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        tokens = serializer.validated_data
        user = serializer.user

        response = Response(
            {"access": tokens["access"], "user": UserSerializer(user).data},
            status=status.HTTP_200_OK,
        )
        set_refresh_cookie(response, tokens["refresh"])
        return response


class CookieTokenRefreshView(APIView):
    """Reads the refresh token from the httpOnly cookie (never the request
    body), rotates it, and writes the new one back to the cookie."""

    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        raw_refresh = request.COOKIES.get("refresh_token")
        if not raw_refresh:
            return Response({"detail": "Refresh token missing."}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            refresh = RefreshToken(raw_refresh)
            access = refresh.access_token
        except TokenError:
            response = Response({"detail": "Refresh token invalid or expired."}, status=status.HTTP_401_UNAUTHORIZED)
            clear_refresh_cookie(response)
            return response

        response = Response({"access": str(access)}, status=status.HTTP_200_OK)

        try:
            refresh.blacklist()
        except AttributeError:
            pass  # blacklist app not enabled — rotation still works, just not revocation

        user = User.objects.filter(pk=refresh["user_id"]).first()
        new_refresh = RefreshToken.for_user(user) if user else refresh
        set_refresh_cookie(response, new_refresh)
        return response


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        raw_refresh = request.COOKIES.get("refresh_token")
        if raw_refresh:
            try:
                RefreshToken(raw_refresh).blacklist()
            except (TokenError, AttributeError):
                pass
        response = Response(status=status.HTTP_204_NO_CONTENT)
        clear_refresh_cookie(response)
        return response


class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = ChangePasswordSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data["new_password"])
        request.user.save(update_fields=["password"])
        return Response({"detail": "Password updated."}, status=status.HTTP_200_OK)


class PasswordResetRequestView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"

    def post(self, request, *args, **kwargs):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]

        user = User.objects.filter(email__iexact=email).first()
        if user:
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = reset_token_generator.make_token(user)
            reset_link = f"{self._frontend_url()}/reset-password?uid={uid}&token={token}"
            message = render_to_string(
                "accounts/password_reset_email.txt",
                {"user": user, "reset_link": reset_link},
            )
            send_mail(
                subject="Reset your ThriftHub KE password",
                message=message,
                from_email=None,
                recipient_list=[user.email],
            )
        # Always the same response whether or not the email exists, so the
        # endpoint can't be used to enumerate registered addresses.
        return Response(
            {"detail": "If that email is registered, a reset link has been sent."},
            status=status.HTTP_200_OK,
        )

    @staticmethod
    def _frontend_url():
        from django.conf import settings

        return settings.FRONTEND_URL


class PasswordResetConfirmView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"

    def post(self, request, *args, **kwargs):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            user_id = force_str(urlsafe_base64_decode(data["uid"]))
            user = User.objects.get(pk=user_id)
        except (User.DoesNotExist, ValueError, TypeError, OverflowError):
            return Response({"detail": "Invalid reset link."}, status=status.HTTP_400_BAD_REQUEST)

        if not reset_token_generator.check_token(user, data["token"]):
            return Response({"detail": "Invalid or expired reset link."}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(data["new_password"])
        user.save(update_fields=["password"])
        return Response({"detail": "Password has been reset."}, status=status.HTTP_200_OK)


class AddressViewSet(viewsets.ModelViewSet):
    serializer_class = AddressSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwner]
    owner_field = "user"

    def get_queryset(self):
        return Address.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
