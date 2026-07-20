import pytest

from apps.catalog.models import Product
from tests.factories import CategoryFactory, ProductFactory

pytestmark = pytest.mark.django_db


class TestProductVisibility:
    def test_public_list_only_shows_active_products(self, api_client):
        ProductFactory(is_active=True, title="Active Jacket")
        ProductFactory(is_active=False, title="Inactive Jacket")

        response = api_client.get("/api/catalog/products/")

        assert response.status_code == 200
        titles = [p["title"] for p in response.data["results"]]
        assert "Active Jacket" in titles
        assert "Inactive Jacket" not in titles

    def test_staff_sees_inactive_products_too(self, staff_client):
        ProductFactory(is_active=False, title="Inactive Jacket")

        response = staff_client.get("/api/catalog/products/")

        titles = [p["title"] for p in response.data["results"]]
        assert "Inactive Jacket" in titles


class TestProductWritePermissions:
    def test_anonymous_cannot_create_product(self, api_client):
        category = CategoryFactory()
        response = api_client.post(
            "/api/catalog/products/",
            {"title": "New Item", "category": category.id, "selling_price_kes": "500.00", "quantity": 1},
        )
        assert response.status_code == 401

    def test_regular_customer_cannot_create_product(self, auth_client):
        category = CategoryFactory()
        response = auth_client.post(
            "/api/catalog/products/",
            {"title": "New Item", "category": category.id, "selling_price_kes": "500.00", "quantity": 1},
        )
        assert response.status_code == 403

    def test_staff_can_create_product_and_it_writes_stock_movement(self, staff_client):
        category = CategoryFactory()
        response = staff_client.post(
            "/api/catalog/products/",
            {"title": "New Item", "category": category.id, "selling_price_kes": "500.00", "quantity": 3},
        )
        assert response.status_code == 201
        product = Product.objects.get(title="New Item")
        assert product.stock_movements.count() == 1
        assert product.stock_movements.first().change_type == "intake"


class TestProductFilteringAndSearch:
    def test_filter_by_category_slug(self, api_client):
        jeans = CategoryFactory(name="Jeans")
        shirts = CategoryFactory(name="Shirts")
        ProductFactory(category=jeans, title="Blue Jeans")
        ProductFactory(category=shirts, title="White Shirt")

        response = api_client.get(f"/api/catalog/products/?category={jeans.slug}")

        titles = [p["title"] for p in response.data["results"]]
        assert titles == ["Blue Jeans"]

    def test_filter_by_price_range(self, api_client):
        ProductFactory(title="Cheap", selling_price_kes="200.00")
        ProductFactory(title="Expensive", selling_price_kes="5000.00")

        response = api_client.get("/api/catalog/products/?price_min=1000")

        titles = [p["title"] for p in response.data["results"]]
        assert titles == ["Expensive"]

    def test_search_by_title(self, api_client):
        ProductFactory(title="Levi's 501 Jeans")
        ProductFactory(title="Nike Jacket")

        response = api_client.get("/api/catalog/products/?search=Levi")

        titles = [p["title"] for p in response.data["results"]]
        assert titles == ["Levi's 501 Jeans"]


class TestProductQuantityBusinessRule:
    def test_product_auto_deactivates_when_quantity_hits_zero(self):
        product = ProductFactory(quantity=1, is_active=True)
        product.quantity = 0
        product.save()
        product.refresh_from_db()
        assert product.is_active is False
