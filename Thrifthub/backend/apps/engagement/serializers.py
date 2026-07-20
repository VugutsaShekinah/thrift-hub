from rest_framework import serializers
from rest_framework.validators import UniqueTogetherValidator

from apps.catalog.models import Product
from apps.catalog.serializers import ProductListSerializer

from . import services
from .models import Review, Wishlist


class WishlistSerializer(serializers.ModelSerializer):
    product = ProductListSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.filter(is_active=True), source="product", write_only=True
    )
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())

    class Meta:
        model = Wishlist
        fields = ["id", "product", "product_id", "user", "created_at"]
        validators = [
            UniqueTogetherValidator(
                queryset=Wishlist.objects.all(),
                fields=["user", "product_id"],
                message="This product is already in your wishlist.",
            )
        ]


class ReviewSerializer(serializers.ModelSerializer):
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())
    reviewer_name = serializers.CharField(source="user.full_name", read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(), source="product", write_only=True
    )
    product_title = serializers.CharField(source="product.title", read_only=True)

    class Meta:
        model = Review
        fields = [
            "id", "product_id", "product_title", "user", "reviewer_name",
            "rating", "comment", "is_approved", "created_at",
        ]
        read_only_fields = ["id", "is_approved", "created_at"]
        validators = [
            UniqueTogetherValidator(
                queryset=Review.objects.all(),
                fields=["user", "product_id"],
                message="You've already reviewed this product.",
            )
        ]

    def create(self, validated_data):
        order_item = services.get_verified_purchase(validated_data["user"], validated_data["product"])
        validated_data["order_item"] = order_item
        return super().create(validated_data)
