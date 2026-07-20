from django.db import transaction

from apps.core.exceptions import DomainError

from .models import StockMovement


@transaction.atomic
def adjust_stock(product, delta, change_type, reference="", note="", user=None, lock=True):
    """Single choke point for every stock change: writes the audit ledger row
    and updates the denormalized Product.quantity in the same transaction.

    `lock=True` takes a row-level lock (SELECT ... FOR UPDATE) on the product
    first, which is what closes the double-sell race on unique (qty=1) items
    when two checkouts hit the same product concurrently (BR-7).
    """
    if lock:
        from apps.catalog.models import Product

        product = Product.objects.select_for_update().get(pk=product.pk)

    new_quantity = product.quantity + delta
    if new_quantity < 0:
        raise DomainError(
            f"Insufficient stock for '{product.title}': have {product.quantity}, requested {-delta}.",
            code="insufficient_stock",
        )

    product.quantity = new_quantity
    product.save(update_fields=["quantity", "is_active", "updated_at"])

    StockMovement.objects.create(
        product=product,
        change_type=change_type,
        quantity_delta=delta,
        reference=reference,
        note=note,
        created_by=user,
    )
    return product
