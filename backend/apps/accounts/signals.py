from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import CustomerProfile, User


@receiver(post_save, sender=User)
def create_customer_profile(sender, instance, created, **kwargs):
    """Every user gets a profile row, whether created via the API, the admin
    panel, or `createsuperuser` — keeps `user.profile` reliably available
    everywhere instead of call sites having to get_or_create defensively."""
    if created:
        CustomerProfile.objects.get_or_create(user=instance)
