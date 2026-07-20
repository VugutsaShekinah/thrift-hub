import pytest

from apps.orders.models import Order
from tests.factories import AddressFactory, CouponFactory, ProductFactory

pytestmark = pytest.mark.django_db


def _checkout_payload(product, address, **overrides):
    payload = {
        "items": [{"product_id": product.id, "quantity": 1}],
        "payment_method": "mpesa",
        "address_id": address.id,
    }
    payload.update(overrides)
    return payload


class TestCheckout:
    def test_requires_authentication(self, api_client):
        product = ProductFactory(quantity=2)
        response = api_client.post(
            "/api/orders/checkout/",
            {"items": [{"product_id": product.id, "quantity": 1}], "payment_method": "mpesa"},
            format="json",
        )
        assert response.status_code == 401

    def test_successful_checkout_decrements_stock_and_marks_paid(self, auth_client, user):
        product = ProductFactory(quantity=2, selling_price_kes="1000.00")
        address = AddressFactory(user=user)

        response = auth_client.post(
            "/api/orders/checkout/", _checkout_payload(product, address), format="json"
        )

        assert response.status_code == 201
        assert response.data["status"] == "paid"
        assert response.data["subtotal_kes"] == "1000.00"
        product.refresh_from_db()
        assert product.quantity == 1

    def test_checkout_rejects_insufficient_stock(self, auth_client, user):
        product = ProductFactory(quantity=1)
        address = AddressFactory(user=user)

        response = auth_client.post(
            "/api/orders/checkout/",
            _checkout_payload(product, address, items=[{"product_id": product.id, "quantity": 5}]),
            format="json",
        )

        assert response.status_code == 400
        assert response.data["code"] == "insufficient_stock"

    def test_checkout_applies_valid_coupon(self, auth_client, user):
        product = ProductFactory(quantity=2, selling_price_kes="1000.00")
        address = AddressFactory(user=user)
        coupon = CouponFactory(discount_type="percentage", discount_value="10.00")

        response = auth_client.post(
            "/api/orders/checkout/",
            _checkout_payload(product, address, coupon_code=coupon.code),
            format="json",
        )

        assert response.status_code == 201
        assert response.data["discount_kes"] == "100.00"

    def test_checkout_rejects_expired_coupon(self, auth_client, user):
        from django.utils import timezone

        product = ProductFactory(quantity=2)
        address = AddressFactory(user=user)
        expired = CouponFactory(valid_until=timezone.now() - timezone.timedelta(days=1))

        response = auth_client.post(
            "/api/orders/checkout/",
            _checkout_payload(product, address, coupon_code=expired.code),
            format="json",
        )

        assert response.status_code == 400
        assert response.data["code"] == "coupon_expired"

    def test_cod_checkout_leaves_order_processing_with_pending_payment(self, auth_client, user):
        product = ProductFactory(quantity=2)
        address = AddressFactory(user=user)

        response = auth_client.post(
            "/api/orders/checkout/",
            _checkout_payload(product, address, payment_method="cod"),
            format="json",
        )

        assert response.status_code == 201
        assert response.data["status"] == "processing"
        assert response.data["payments"][0]["status"] == "pending"


class TestOrderStatusTransitions:
    def _place_order(self, auth_client, user):
        product = ProductFactory(quantity=2)
        address = AddressFactory(user=user)
        response = auth_client.post(
            "/api/orders/checkout/", _checkout_payload(product, address), format="json"
        )
        return response.data["order_number"]

    def test_customer_cannot_update_order_status(self, auth_client, user):
        order_number = self._place_order(auth_client, user)
        response = auth_client.patch(f"/api/orders/{order_number}/status/", {"status": "shipped"})
        assert response.status_code == 403

    def test_staff_can_advance_status(self, auth_client, user, staff_client):
        order_number = self._place_order(auth_client, user)
        response = staff_client.patch(f"/api/orders/{order_number}/status/", {"status": "processing"})
        assert response.status_code == 200
        assert response.data["status"] == "processing"

    def test_invalid_transition_is_rejected(self, auth_client, user, staff_client):
        order_number = self._place_order(auth_client, user)  # status = paid
        response = staff_client.patch(f"/api/orders/{order_number}/status/", {"status": "delivered"})
        assert response.status_code == 400

    def test_cancelling_restocks_the_product(self, auth_client, user, staff_client):
        product = ProductFactory(quantity=2)
        address = AddressFactory(user=user)
        checkout_response = auth_client.post(
            "/api/orders/checkout/", _checkout_payload(product, address), format="json"
        )
        order_number = checkout_response.data["order_number"]
        product.refresh_from_db()
        assert product.quantity == 1

        response = staff_client.patch(f"/api/orders/{order_number}/status/", {"status": "cancelled"})

        assert response.status_code == 200
        product.refresh_from_db()
        assert product.quantity == 2


class TestOrderVisibility:
    def test_customer_only_sees_own_orders(self, auth_client, user):
        from tests.factories import UserFactory

        other_user = UserFactory()
        other_address = AddressFactory(user=other_user)
        product = ProductFactory(quantity=2)

        from apps.orders import services as order_services

        order_services.checkout(
            user=other_user,
            items=[{"product_id": product.id, "quantity": 1}],
            shipping_info={
                "recipient_name": other_address.recipient_name,
                "phone_number": other_address.phone_number,
                "county": other_address.county,
                "town": other_address.town,
                "street_address": other_address.street_address,
            },
            payment_method=Order.PaymentMethod.MPESA,
        )

        response = auth_client.get("/api/orders/")
        assert response.status_code == 200
        assert response.data["count"] == 0
