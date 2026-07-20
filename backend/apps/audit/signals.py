from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver

from apps.accounts.models import User
from apps.catalog.models import Product
from apps.orders.models import Order

from .services import log_action

TRACKED_FIELDS = {
    Product: ["selling_price_kes", "quantity", "is_active"],
    Order: ["status"],
    User: ["role", "is_staff", "is_superuser"],
}


def _compute_diff(sender, instance):
    """Diffs the incoming instance against its current DB row for the
    fields we care about. Run in pre_save (before the write lands) but the
    resulting log entry is only written in post_save, so a save that raises
    partway through never produces a phantom audit entry."""
    if not instance.pk:
        return {}
    try:
        old = sender.objects.get(pk=instance.pk)
    except sender.DoesNotExist:
        return {}

    changes = {}
    for field in TRACKED_FIELDS[sender]:
        old_value, new_value = getattr(old, field), getattr(instance, field)
        if old_value != new_value:
            changes[field] = {"old": str(old_value), "new": str(new_value)}
    return changes


def _make_handlers(model, label):
    @receiver(pre_save, sender=model, weak=False)
    def _stash(sender, instance, **kwargs):
        instance._audit_changes = _compute_diff(sender, instance)

    @receiver(post_save, sender=model, weak=False)
    def _log(sender, instance, created, **kwargs):
        changes = getattr(instance, "_audit_changes", None)
        if not created and changes:
            log_action(f"{label}.updated", instance, changes)

    return _stash, _log


_product_handlers = _make_handlers(Product, "product")
_order_handlers = _make_handlers(Order, "order")
_user_handlers = _make_handlers(User, "user")
