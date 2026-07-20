import uuid

from django.core.validators import MinValueValidator
from django.db import models

from apps.core.models import TimeStampedModel


class Coupon(TimeStampedModel):
    class DiscountType(models.TextChoices):
        PERCENTAGE = "percentage", "Percentage"
        FIXED = "fixed", "Fixed amount (KES)"

    code = models.CharField(max_length=30, unique=True)
    discount_type = models.CharField(max_length=10, choices=DiscountType.choices)
    discount_value = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    min_order_value_kes = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    max_uses = models.PositiveIntegerField(null=True, blank=True, help_text="Blank = unlimited.")
    times_used = models.PositiveIntegerField(default=0)
    valid_from = models.DateTimeField()
    valid_until = models.DateTimeField()
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "coupons"

    def __str__(self):
        return self.code


class Promotion(TimeStampedModel):
    title = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    category = models.ForeignKey(
        "catalog.Category", on_delete=models.CASCADE, null=True, blank=True,
        related_name="promotions", help_text="Blank = storewide promotion.",
    )
    discount_percentage = models.DecimalField(max_digits=5, decimal_places=2, validators=[MinValueValidator(0)])
    banner_image = models.ImageField(upload_to="promotions/", null=True, blank=True)
    starts_at = models.DateTimeField()
    ends_at = models.DateTimeField()
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "promotions"
        ordering = ["-starts_at"]

    def __str__(self):
        return self.title


class Order(TimeStampedModel):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending payment"
        PAID = "paid", "Paid"
        PROCESSING = "processing", "Processing"
        SHIPPED = "shipped", "Shipped"
        DELIVERED = "delivered", "Delivered"
        CANCELLED = "cancelled", "Cancelled"
        REFUNDED = "refunded", "Refunded"

    class PaymentMethod(models.TextChoices):
        MPESA = "mpesa", "M-Pesa"
        COD = "cod", "Cash on Delivery"
        CARD = "card", "Card"

    order_number = models.CharField(max_length=20, unique=True, editable=False)
    user = models.ForeignKey("accounts.User", on_delete=models.PROTECT, related_name="orders")
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.PENDING)
    coupon = models.ForeignKey(Coupon, on_delete=models.SET_NULL, null=True, blank=True, related_name="orders")
    payment_method = models.CharField(max_length=10, choices=PaymentMethod.choices)

    subtotal_kes = models.DecimalField(max_digits=10, decimal_places=2)
    discount_kes = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    shipping_fee_kes = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_kes = models.DecimalField(max_digits=10, decimal_places=2)

    # Shipping snapshot — deliberately NOT a FK to Address (see docs/02-system-design.md §4.1)
    shipping_name = models.CharField(max_length=150)
    shipping_phone = models.CharField(max_length=20)
    shipping_county = models.CharField(max_length=100)
    shipping_town = models.CharField(max_length=100)
    shipping_street = models.CharField(max_length=255)

    placed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "orders"
        ordering = ["-placed_at"]
        indexes = [models.Index(fields=["user", "status"])]

    def __str__(self):
        return self.order_number

    def save(self, *args, **kwargs):
        if not self.order_number:
            self.order_number = f"TH-{uuid.uuid4().hex[:10].upper()}"
        super().save(*args, **kwargs)


class OrderItem(TimeStampedModel):
    """Snapshots title/price/condition at purchase time so historical orders
    stay accurate even if the live Product row later changes or is delisted."""

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(
        "catalog.Product", on_delete=models.SET_NULL, null=True, blank=True, related_name="order_items"
    )
    title_snapshot = models.CharField(max_length=200)
    price_kes_snapshot = models.DecimalField(max_digits=10, decimal_places=2)
    condition_snapshot = models.CharField(max_length=20, blank=True)
    quantity = models.PositiveIntegerField(default=1)

    class Meta:
        db_table = "order_items"

    def __str__(self):
        return f"{self.title_snapshot} x{self.quantity}"

    @property
    def line_total_kes(self):
        return self.price_kes_snapshot * self.quantity


class Payment(TimeStampedModel):
    class Provider(models.TextChoices):
        MPESA = "mpesa", "M-Pesa"
        COD = "cod", "Cash on Delivery"
        CARD = "card", "Card"

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        SUCCESS = "success", "Success"
        FAILED = "failed", "Failed"

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="payments")
    provider = models.CharField(max_length=10, choices=Provider.choices)
    amount_kes = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    provider_reference = models.CharField(max_length=100, blank=True)
    raw_response = models.JSONField(null=True, blank=True)
    confirmed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "payments"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Payment<{self.order.order_number}: {self.status}>"


class ReturnRequest(TimeStampedModel):
    class Status(models.TextChoices):
        REQUESTED = "requested", "Requested"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"
        COMPLETED = "completed", "Completed"

    order_item = models.ForeignKey(OrderItem, on_delete=models.CASCADE, related_name="return_requests")
    reason = models.TextField()
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.REQUESTED)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "return_requests"

    def __str__(self):
        return f"Return<{self.order_item}>"
