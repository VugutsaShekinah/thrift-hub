from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.core.validators import RegexValidator
from django.db import models

from apps.core.models import TimeStampedModel

from .managers import UserManager

kenyan_phone_validator = RegexValidator(
    regex=r"^\+254[17]\d{8}$",
    message="Phone number must be in the format +2547XXXXXXXX or +2541XXXXXXXX.",
)


class User(AbstractBaseUser, PermissionsMixin, TimeStampedModel):
    """Email-first custom user. Role is denormalized alongside is_staff/
    is_superuser purely for readable admin display and audit logging; the
    actual authorization decisions still rely on is_staff/is_superuser."""

    class Role(models.TextChoices):
        CUSTOMER = "customer", "Customer"
        STAFF = "staff", "Inventory Staff"
        ADMIN = "admin", "Admin"

    email = models.EmailField(unique=True)
    phone_number = models.CharField(
        max_length=13, unique=True, validators=[kenyan_phone_validator]
    )
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    role = models.CharField(max_length=10, choices=Role.choices, default=Role.CUSTOMER)
    avatar = models.ImageField(upload_to="avatars/%Y/%m/", null=True, blank=True)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["phone_number", "first_name", "last_name"]

    class Meta:
        db_table = "users"
        ordering = ["-created_at"]

    def __str__(self):
        return self.email

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()


class CustomerProfile(TimeStampedModel):
    class Gender(models.TextChoices):
        MALE = "male", "Male"
        FEMALE = "female", "Female"
        OTHER = "other", "Other"
        UNSPECIFIED = "unspecified", "Prefer not to say"

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=15, choices=Gender.choices, default=Gender.UNSPECIFIED)
    newsletter_opt_in = models.BooleanField(default=False)
    loyalty_points = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "customer_profiles"

    def __str__(self):
        return f"Profile<{self.user.email}>"


class Address(TimeStampedModel):
    """Saved delivery address. Orders snapshot their own shipping fields at
    checkout time (see orders.Order) so edits/deletes here never rewrite
    historical order data."""

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="addresses")
    label = models.CharField(max_length=50, default="Home")
    recipient_name = models.CharField(max_length=150)
    phone_number = models.CharField(max_length=13, validators=[kenyan_phone_validator])
    county = models.CharField(max_length=100)
    town = models.CharField(max_length=100)
    street_address = models.CharField(max_length=255)
    building = models.CharField(max_length=100, blank=True)
    is_default = models.BooleanField(default=False)

    class Meta:
        db_table = "addresses"
        ordering = ["-is_default", "-created_at"]

    def __str__(self):
        return f"{self.label} — {self.recipient_name}, {self.town}"

    def save(self, *args, **kwargs):
        if self.is_default:
            Address.objects.filter(user=self.user, is_default=True).exclude(pk=self.pk).update(
                is_default=False
            )
        super().save(*args, **kwargs)
