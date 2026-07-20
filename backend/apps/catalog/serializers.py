from rest_framework import serializers

from .models import BaleBatch, Category, Product, ProductImage, Supplier


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "slug", "parent", "description", "image", "is_active"]
        read_only_fields = ["id", "slug"]


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ["id", "image", "alt_text", "is_primary", "sort_order"]
        read_only_fields = ["id"]


class ProductListSerializer(serializers.ModelSerializer):
    """Lean payload for catalog listing pages — avoids shipping full
    descriptions/image sets for grids of 20+ products per page."""

    category = serializers.SlugRelatedField(slug_field="slug", read_only=True)
    primary_image = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id", "title", "slug", "category", "brand", "size", "gender",
            "condition", "selling_price_kes", "is_featured", "quantity",
            "primary_image",
        ]

    def get_primary_image(self, obj):
        image = obj.primary_image
        if not image:
            return None
        request = self.context.get("request")
        url = image.image.url
        return request.build_absolute_uri(url) if request else url


class ProductDetailSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    is_low_stock = serializers.ReadOnlyField()
    average_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id", "title", "slug", "description", "category", "brand", "size",
            "gender", "condition", "color", "material", "selling_price_kes",
            "quantity", "is_active", "is_featured", "view_count", "is_low_stock",
            "images", "average_rating", "review_count", "created_at",
        ]

    def get_average_rating(self, obj):
        approved = [r.rating for r in obj.reviews.filter(is_approved=True)]
        return round(sum(approved) / len(approved), 1) if approved else None

    def get_review_count(self, obj):
        return obj.reviews.filter(is_approved=True).count()


class ProductWriteSerializer(serializers.ModelSerializer):
    """Staff-only create/update — separate from the read serializers so
    public responses can never accidentally include write-only concerns
    like `bale_batch` cost linkage."""

    class Meta:
        model = Product
        fields = [
            "id", "title", "description", "category", "bale_batch", "brand",
            "size", "gender", "condition", "color", "material",
            "selling_price_kes", "quantity", "is_active", "is_featured",
        ]
        read_only_fields = ["id"]


class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = [
            "id", "name", "contact_person", "phone_number", "email",
            "county", "notes", "rating", "is_active", "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class BaleBatchSerializer(serializers.ModelSerializer):
    supplier_name = serializers.CharField(source="supplier.name", read_only=True)
    items_listed_count = serializers.ReadOnlyField()
    cost_per_item_kes = serializers.ReadOnlyField()

    class Meta:
        model = BaleBatch
        fields = [
            "id", "supplier", "supplier_name", "category", "batch_code",
            "date_received", "cost_kes", "weight_kg", "item_count_estimated",
            "notes", "items_listed_count", "cost_per_item_kes", "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def create(self, validated_data):
        validated_data["received_by"] = self.context["request"].user
        return super().create(validated_data)
