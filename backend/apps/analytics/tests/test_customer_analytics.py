import pytest

from apps.orders.models import Order
from tests.factories import AddressFactory, ProductFactory

pytestmark = pytest.mark.django_db


def _place_order(user, product, status=Order.Status.PAID):
    order = Order.objects.create(
        user=user,
        status=status,
        payment_method=Order.PaymentMethod.MPESA,
        subtotal_kes=product.selling_price_kes,
        total_kes=product.selling_price_kes,
        shipping_name="Test",
        shipping_phone="+254712345678",
        shipping_county="Nairobi",
        shipping_town="Westlands",
        shipping_street="Waiyaki Way",
    )
    return order


class TestCustomerAnalyticsPermissions:
    def test_requires_authentication(self, api_client):
        response = api_client.get("/api/analytics/customers/")
        assert response.status_code == 401

    def test_customer_cannot_view(self, auth_client):
        response = auth_client.get("/api/analytics/customers/")
        assert response.status_code == 403

    def test_staff_can_view(self, staff_client):
        response = staff_client.get("/api/analytics/customers/")
        assert response.status_code == 200


class TestCustomerAnalyticsData:
    def test_counts_total_and_repeat_customers(self, staff_client, user):
        product = ProductFactory(quantity=10)
        AddressFactory(user=user)

        _place_order(user, product)
        _place_order(user, product)  # second order makes this a repeat customer

        response = staff_client.get("/api/analytics/customers/")

        assert response.status_code == 200
        assert response.data["total_customers"] >= 1
        assert response.data["repeat_customers"] == 1
        assert response.data["top_customers"][0]["user__id"] == user.id

    def test_cancelled_orders_do_not_count_toward_repeat_status(self, staff_client, user):
        product = ProductFactory(quantity=10)
        _place_order(user, product, status=Order.Status.CANCELLED)
        _place_order(user, product, status=Order.Status.CANCELLED)

        response = staff_client.get("/api/analytics/customers/")

        assert response.data["repeat_customers"] == 0
