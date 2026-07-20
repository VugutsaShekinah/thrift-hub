from django.core.validators import MinValueValidator
from django.db import models
from django.utils.text import slugify

from apps.core.models import TimeStampedModel


class Category(TimeStampedModel):
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=120, unique=True, blank=True)
    parent = models.ForeignKey(
        "self", on_delete=models.CASCADE, null=True, blank=True, related_name="children"
    )
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to="categories/", null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "categories"
        ordering = ["name"]
        verbose_name_plural = "categories"

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class Supplier(TimeStampedModel):
    name = models.CharField(max_length=150)
    contact_person = models.CharField(max_length=150, blank=True)
    phone_number = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    county = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)
    rating = models.DecimalField(
        max_digits=3, decimal_places=2, default=0,
        validators=[MinValueValidator(0)],
        help_text="0-5 supplier quality rating, maintained by staff from batch outcomes.",
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "suppliers"
        ordering = ["name"]

    def __str__(self):
        return self.name


class BaleBatch(TimeStampedModel):
    supplier = models.ForeignKey(Supplier, on_delete=models.PROTECT, related_name="bale_batches")
    category = models.ForeignKey(
        Category, on_delete=models.SET_NULL, null=True, blank=True, related_name="bale_batches"
    )
    batch_code = models.CharField(max_length=40, unique=True)
    date_received = models.DateField()
    cost_kes = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    weight_kg = models.DecimalField(max_digits=6, decimal_places=2, validators=[MinValueValidator(0)])
    item_count_estimated = models.PositiveIntegerField(default=0)
    received_by = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True, blank=True, related_name="received_batches"
    )
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "bale_batches"
        ordering = ["-date_received"]

    def __str__(self):
        return self.batch_code

    @property
    def items_listed_count(self):
        return self.products.count()

    @property
    def cost_per_item_kes(self):
        listed = self.items_listed_count
        if listed == 0:
            return None
        return self.cost_kes / listed


class Product(TimeStampedModel):
    class Gender(models.TextChoices):
        MEN = "men", "Men"
        WOMEN = "women", "Women"
        UNISEX = "unisex", "Unisex"
        KIDS = "kids", "Kids"

    class Condition(models.TextChoices):
        NEW_WITH_TAGS = "new_with_tags", "New with tags"
        EXCELLENT = "excellent", "Excellent"
        GOOD = "good", "Good"
        FAIR = "fair", "Fair"

    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True, blank=True)
    description = models.TextField(blank=True)
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name="products")
    bale_batch = models.ForeignKey(
        BaleBatch, on_delete=models.SET_NULL, null=True, blank=True, related_name="products"
    )
    brand = models.CharField(max_length=100, blank=True)
    size = models.CharField(max_length=20, blank=True)
    gender = models.CharField(max_length=10, choices=Gender.choices, default=Gender.UNISEX)
    condition = models.CharField(max_length=20, choices=Condition.choices, default=Condition.GOOD)
    color = models.CharField(max_length=50, blank=True)
    material = models.CharField(max_length=100, blank=True)

    selling_price_kes = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])

    quantity = models.PositiveIntegerField(default=1)
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    view_count = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "products"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["is_active", "category"]),
            models.Index(fields=["is_active", "is_featured"]),
        ]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.title)
            slug = base_slug
            suffix = 1
            while Product.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                suffix += 1
                slug = f"{base_slug}-{suffix}"
            self.slug = slug
        super().save(*args, **kwargs)

    @property
    def is_low_stock(self):
        return 0 < self.quantity <= 2

    @property
    def primary_image(self):
        return self.images.filter(is_primary=True).first() or self.images.first()


class ProductImage(TimeStampedModel):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(upload_to="products/%Y/%m/")
    alt_text = models.CharField(max_length=200, blank=True)
    is_primary = models.BooleanField(default=False)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "product_images"
        ordering = ["sort_order", "created_at"]

    def __str__(self):
        return f"Image for {self.product.title}"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        if self.is_primary:
            ProductImage.objects.filter(product=self.product, is_primary=True).exclude(pk=self.pk).update(
                is_primary=False
            )
