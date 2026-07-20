from django.db import models

from apps.core.models import TimeStampedModel


class StockMovement(TimeStampedModel):
    """Append-only ledger of every quantity change. `Product.quantity` is a
    denormalized running total kept in sync by `services.adjust_stock`; this
    table is the audit trail behind it (satisfies both the "Inventory" and
    part of the "Audit Logs" requirements for stock specifically)."""

    class ChangeType(models.TextChoices):
        INTAKE = "intake", "Bale intake"
        SALE = "sale", "Sale"
        RETURN = "return", "Customer return"
        ADJUSTMENT = "adjustment", "Manual adjustment"
        DAMAGE = "damage", "Damage / write-off"

    product = models.ForeignKey(
        "catalog.Product", on_delete=models.CASCADE, related_name="stock_movements"
    )
    change_type = models.CharField(max_length=20, choices=ChangeType.choices)
    quantity_delta = models.IntegerField(help_text="Positive for stock in, negative for stock out.")
    reference = models.CharField(max_length=100, blank=True, help_text="Order number or batch code.")
    note = models.CharField(max_length=255, blank=True)
    created_by = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True, blank=True, related_name="stock_movements"
    )

    class Meta:
        db_table = "stock_movements"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.product.title}: {self.quantity_delta:+d} ({self.change_type})"
