import factory
from django.utils import timezone

from apps.accounts.models import Address, User
from apps.catalog.models import BaleBatch, Category, Product, Supplier
from apps.orders.models import Coupon


class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = User
        skip_postgeneration_save = True

    email = factory.Sequence(lambda n: f"user{n}@example.com")
    phone_number = factory.Sequence(lambda n: f"+25471{n:07d}")
    first_name = "Test"
    last_name = "User"

    @factory.post_generation
    def password(self, create, extracted, **kwargs):
        self.set_password(extracted or "TestPass123!")
        if create:
            self.save()


class StaffUserFactory(UserFactory):
    is_staff = True
    role = User.Role.STAFF


class AdminUserFactory(UserFactory):
    is_staff = True
    is_superuser = True
    role = User.Role.ADMIN


class AddressFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Address

    user = factory.SubFactory(UserFactory)
    label = "Home"
    recipient_name = "Jane Doe"
    phone_number = "+254712345678"
    county = "Nairobi"
    town = "Westlands"
    street_address = "Waiyaki Way"


class CategoryFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Category

    name = factory.Sequence(lambda n: f"Category {n}")


class SupplierFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Supplier

    name = factory.Sequence(lambda n: f"Supplier {n}")
    county = "Nairobi"


class BaleBatchFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = BaleBatch

    supplier = factory.SubFactory(SupplierFactory)
    batch_code = factory.Sequence(lambda n: f"BALE-{n:04d}")
    date_received = factory.LazyFunction(lambda: timezone.now().date())
    cost_kes = "20000.00"
    weight_kg = "80.00"
    item_count_estimated = 50


class ProductFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Product

    title = factory.Sequence(lambda n: f"Product {n}")
    category = factory.SubFactory(CategoryFactory)
    brand = "Generic"
    size = "M"
    selling_price_kes = "1000.00"
    quantity = 5
    is_active = True


class CouponFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Coupon

    code = factory.Sequence(lambda n: f"COUPON{n}")
    discount_type = Coupon.DiscountType.PERCENTAGE
    discount_value = "10.00"
    valid_from = factory.LazyFunction(lambda: timezone.now() - timezone.timedelta(days=1))
    valid_until = factory.LazyFunction(lambda: timezone.now() + timezone.timedelta(days=30))
