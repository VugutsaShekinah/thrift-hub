import pytest
from rest_framework.test import APIClient

from tests.factories import AdminUserFactory, StaffUserFactory, UserFactory


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def user(db):
    return UserFactory()


@pytest.fixture
def staff_user(db):
    return StaffUserFactory()


@pytest.fixture
def admin_user(db):
    return AdminUserFactory()


def authenticated_client(django_user):
    client = APIClient()
    client.force_authenticate(user=django_user)
    return client


@pytest.fixture
def auth_client(user):
    return authenticated_client(user)


@pytest.fixture
def staff_client(staff_user):
    return authenticated_client(staff_user)


@pytest.fixture
def admin_client_jwt(admin_user):
    return authenticated_client(admin_user)
