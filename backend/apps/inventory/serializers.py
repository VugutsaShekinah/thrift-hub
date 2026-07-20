from rest_framework import serializers

from apps.catalog.models import Product

from .models import StockMovement


class StockMovementSerializer(serializers.ModelSerializer):
    product_title = serializers.CharField(source="product.title", read_only=True)

    class Meta:
        model = StockMovement
        fields = [
            "id", "product", "product_title", "change_type", "quantity_delta",
            "reference", "note", "created_by", "created_at",
        ]
        read_only_fields = ["id", "created_by", "created_at"]

    def validate_product(self, value):
        return value

    def validate(self, attrs):
        if attrs["change_type"] == StockMovement.ChangeType.ADJUSTMENT and attrs["quantity_delta"] == 0:
            raise serializers.ValidationError("Adjustment must have a non-zero quantity delta.")
        return attrs


class LowStockProductSerializer(serializers.ModelSerializer):
    category = serializers.CharField(source="category.name", read_only=True)

    class Meta:
        model = Product
        fields = ["id", "title", "slug", "category", "quantity", "selling_price_kes", "is_active"]
