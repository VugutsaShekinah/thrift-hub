import pytest

from apps.orders.models import Order, OrderItem
from tests.factories import ProductFactory

pytestmark = pytest.mark.django_db


def _make_delivered_order_item(user, product):
    order = Order.objects.create(
        user=user,
        status=Order.Status.DELIVERED,
        payment_method=Order.PaymentMethod.MPESA,
        subtotal_kes=product.selling_price_kes,
        total_kes=product.selling_price_kes,
        shipping_name="Jane Doe",
        shipping_phone="+254712345678",
        shipping_county="Nairobi",
        shipping_town="Westlands",
        shipping_street="Waiyaki Way",
    )
    return OrderItem.objects.create(
        order=order,
        product=product,
        title_snapshot=product.title,
        price_kes_snapshot=product.selling_price_kes,
        quantity=1,
    )


class TestReviewVerifiedPurchase:
    def test_cannot_review_without_a_delivered_order(self, auth_client):
        product = ProductFactory()
        response = auth_client.post(
            "/api/engagement/reviews/", {"product_id": product.id, "rating": 5, "comment": "Nice"}
        )
        assert response.status_code == 400
        assert response.data["code"] == "review_not_verified_purchase"

    def test_can_review_after_delivery(self, auth_client, user):
        product = ProductFactory()
        _make_delivered_order_item(user, product)

        response = auth_client.post(
            "/api/engagement/reviews/", {"product_id": product.id, "rating": 5, "comment": "Great!"}
        )

        assert response.status_code == 201
        assert response.data["rating"] == 5

    def test_cannot_review_same_product_twice(self, auth_client, user):
        product = ProductFactory()
        _make_delivered_order_item(user, product)
        auth_client.post("/api/engagement/reviews/", {"product_id": product.id, "rating": 5, "comment": "1st"})

        response = auth_client.post(
            "/api/engagement/reviews/", {"product_id": product.id, "rating": 4, "comment": "2nd"}
        )

        assert response.status_code == 400

    def test_rating_must_be_within_1_to_5(self, auth_client, user):
        product = ProductFactory()
        _make_delivered_order_item(user, product)

        response = auth_client.post(
            "/api/engagement/reviews/", {"product_id": product.id, "rating": 7, "comment": "Too high"}
        )

        assert response.status_code == 400


class TestWishlist:
    def test_add_and_list_wishlist(self, auth_client):
        product = ProductFactory()
        response = auth_client.post("/api/engagement/wishlist/", {"product_id": product.id})
        assert response.status_code == 201

        response = auth_client.get("/api/engagement/wishlist/")
        assert response.data["count"] == 1

    def test_cannot_add_same_product_twice(self, auth_client):
        product = ProductFactory()
        auth_client.post("/api/engagement/wishlist/", {"product_id": product.id})
        response = auth_client.post("/api/engagement/wishlist/", {"product_id": product.id})
        assert response.status_code == 400

    def test_wishlist_requires_authentication(self, api_client):
        response = api_client.get("/api/engagement/wishlist/")
        assert response.status_code == 401
