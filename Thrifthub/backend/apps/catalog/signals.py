from django.db.models.signals import pre_save
from django.dispatch import receiver

from .models import Product


@receiver(pre_save, sender=Product)
def deactivate_when_out_of_stock(sender, instance, **kwargs):
    """BR-1 (docs/01-requirements-analysis.md): a product whose quantity
    reaches 0 is automatically taken off public listings rather than staff
    having to remember to flip `is_active` by hand."""
    if instance.quantity <= 0:
        instance.is_active = False
