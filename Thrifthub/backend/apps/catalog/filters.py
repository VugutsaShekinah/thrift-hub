import django_filters as filters

from .models import Product


class ProductFilter(filters.FilterSet):
    category = filters.CharFilter(field_name="category__slug")
    size = filters.CharFilter(field_name="size", lookup_expr="iexact")
    brand = filters.CharFilter(field_name="brand", lookup_expr="icontains")
    condition = filters.ChoiceFilter(choices=Product.Condition.choices)
    gender = filters.ChoiceFilter(choices=Product.Gender.choices)
    price_min = filters.NumberFilter(field_name="selling_price_kes", lookup_expr="gte")
    price_max = filters.NumberFilter(field_name="selling_price_kes", lookup_expr="lte")
    is_featured = filters.BooleanFilter(field_name="is_featured")

    class Meta:
        model = Product
        fields = ["category", "size", "brand", "condition", "gender", "is_featured"]
