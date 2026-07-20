import pytest

from apps.core.exceptions import DomainError
from apps.inventory import services
from apps.inventory.models import StockMovement
from tests.factories import ProductFactory

pytestmark = pytest.mark.django_db


class TestAdjustStock:
    def test_intake_increases_quantity_and_writes_ledger_row(self):
        product = ProductFactory(quantity=0, is_active=False)

        services.adjust_stock(product, delta=5, change_type=StockMovement.ChangeType.INTAKE)

        product.refresh_from_db()
        assert product.quantity == 5
        assert product.stock_movements.count() == 1
        assert product.stock_movements.first().quantity_delta == 5

    def test_sale_decreases_quantity(self):
        product = ProductFactory(quantity=3)

        services.adjust_stock(product, delta=-1, change_type=StockMovement.ChangeType.SALE)

        product.refresh_from_db()
        assert product.quantity == 2

    def test_cannot_oversell_below_zero(self):
        product = ProductFactory(quantity=1)

        with pytest.raises(DomainError):
            services.adjust_stock(product, delta=-2, change_type=StockMovement.ChangeType.SALE)

        product.refresh_from_db()
        assert product.quantity == 1  # unchanged — the whole adjustment rolled back

    def test_quantity_hitting_zero_deactivates_product(self):
        product = ProductFactory(quantity=1, is_active=True)

        services.adjust_stock(product, delta=-1, change_type=StockMovement.ChangeType.SALE)

        product.refresh_from_db()
        assert product.quantity == 0
        assert product.is_active is False


class TestLowStockPermissions:
    def test_customer_cannot_view_low_stock(self, auth_client):
        response = auth_client.get("/api/inventory/low-stock/")
        assert response.status_code == 403

    def test_staff_can_view_low_stock(self, staff_client):
        ProductFactory(quantity=1)
        response = staff_client.get("/api/inventory/low-stock/")
        assert response.status_code == 200
        assert len(response.data["low_stock"]) == 1
