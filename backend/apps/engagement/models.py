from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from apps.core.models import TimeStampedModel


class Wishlist(TimeStampedModel):
    user = models.ForeignKey("accounts.User", on_delete=models.CASCADE, related_name="wishlist_items")
    product = models.ForeignKey("catalog.Product", on_delete=models.CASCADE, related_name="wishlisted_by")

    class Meta:
        db_table = "wishlist_items"
        unique_together = ("user", "product")
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.email} ♥ {self.product.title}"


class Review(TimeStampedModel):
    """BR-2: only created for a (user, product) pair backed by a delivered
    OrderItem — enforced in the service/serializer layer, not the DB, since
    it requires checking the related order's status at write time."""

    product = models.ForeignKey("catalog.Product", on_delete=models.CASCADE, related_name="reviews")
    user = models.ForeignKey("accounts.User", on_delete=models.CASCADE, related_name="reviews")
    order_item = models.ForeignKey(
        "orders.OrderItem", on_delete=models.SET_NULL, null=True, blank=True, related_name="review"
    )
    rating = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.TextField(blank=True)
    is_approved = models.BooleanField(default=True)

    class Meta:
        db_table = "reviews"
        unique_together = ("user", "product")
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.product.title}: {self.rating}★ by {self.user.email}"
