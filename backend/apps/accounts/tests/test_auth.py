import pytest
from django.urls import reverse

from apps.accounts.models import User
from tests.factories import UserFactory

pytestmark = pytest.mark.django_db


class TestRegistration:
    def test_register_creates_user_and_profile(self, api_client):
        response = api_client.post(
            reverse("auth-register"),
            {
                "email": "newuser@example.com",
                "password": "StrongPass123!",
                "phone_number": "+254712345678",
                "first_name": "New",
                "last_name": "User",
            },
        )
        assert response.status_code == 201
        assert "access" in response.data
        user = User.objects.get(email="newuser@example.com")
        assert user.profile is not None  # auto-created via signal
        assert user.check_password("StrongPass123!")

    def test_register_rejects_weak_password(self, api_client):
        response = api_client.post(
            reverse("auth-register"),
            {
                "email": "weak@example.com",
                "password": "1234",
                "phone_number": "+254712345679",
                "first_name": "Weak",
                "last_name": "Pass",
            },
        )
        assert response.status_code == 400
        assert "password" in response.data

    def test_register_rejects_duplicate_email(self, api_client, user):
        response = api_client.post(
            reverse("auth-register"),
            {
                "email": user.email,
                "password": "StrongPass123!",
                "phone_number": "+254712399999",
                "first_name": "Dup",
                "last_name": "User",
            },
        )
        assert response.status_code == 400
        assert "email" in response.data

    def test_register_rejects_invalid_kenyan_phone_format(self, api_client):
        response = api_client.post(
            reverse("auth-register"),
            {
                "email": "badphone@example.com",
                "password": "StrongPass123!",
                "phone_number": "0712345678",  # missing +254
                "first_name": "Bad",
                "last_name": "Phone",
            },
        )
        assert response.status_code == 400
        assert "phone_number" in response.data


class TestLoginLogoutRefresh:
    def test_login_sets_httponly_refresh_cookie_not_in_body(self, api_client):
        UserFactory(email="login@example.com", password="StrongPass123!")
        response = api_client.post(
            reverse("auth-login"), {"email": "login@example.com", "password": "StrongPass123!"}
        )
        assert response.status_code == 200
        assert "access" in response.data
        assert "refresh" not in response.data  # never returned in the JSON body
        assert "refresh_token" in response.cookies
        assert response.cookies["refresh_token"]["httponly"] is True

    def test_login_rejects_wrong_password(self, api_client):
        UserFactory(email="login2@example.com", password="StrongPass123!")
        response = api_client.post(
            reverse("auth-login"), {"email": "login2@example.com", "password": "WrongPassword!"}
        )
        assert response.status_code == 401

    def test_refresh_without_cookie_returns_401(self, api_client):
        response = api_client.post(reverse("auth-token-refresh"))
        assert response.status_code == 401

    def test_refresh_then_logout_clears_cookie(self, api_client):
        UserFactory(email="cycle@example.com", password="StrongPass123!")
        login = api_client.post(
            reverse("auth-login"), {"email": "cycle@example.com", "password": "StrongPass123!"}
        )
        access = login.data["access"]

        refresh = api_client.post(reverse("auth-token-refresh"))
        assert refresh.status_code == 200
        assert "access" in refresh.data

        logout = api_client.post(
            reverse("auth-logout"), HTTP_AUTHORIZATION=f"Bearer {access}"
        )
        assert logout.status_code == 204

        second_refresh = api_client.post(reverse("auth-token-refresh"))
        assert second_refresh.status_code == 401


class TestMeAndAddresses:
    def test_me_requires_authentication(self, api_client):
        response = api_client.get(reverse("account-me"))
        assert response.status_code == 401

    def test_me_returns_own_profile(self, auth_client, user):
        response = auth_client.get(reverse("account-me"))
        assert response.status_code == 200
        assert response.data["email"] == user.email

    def test_user_cannot_access_another_users_address(self, auth_client, user):
        from tests.factories import AddressFactory

        other_user = UserFactory()
        other_address = AddressFactory(user=other_user)

        response = auth_client.get(f"/api/accounts/addresses/{other_address.id}/")
        assert response.status_code == 404  # filtered out of queryset entirely
