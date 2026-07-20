from rest_framework import serializers

from .models import Coupon, Order, OrderItem, Payment, Promotion


class CartItemInputSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1, default=1)


class CheckoutSerializer(serializers.Serializer):
    items = CartItemInputSerializer(many=True)
    payment_method = serializers.ChoiceField(choices=Order.PaymentMethod.choices)
    coupon_code = serializers.CharField(required=False, allow_blank=True)
    mpesa_phone = serializers.CharField(required=False, allow_blank=True)

    # Either an existing saved address...
    address_id = serializers.IntegerField(required=False)
    # ...or an inline shipping address supplied at checkout time.
    recipient_name = serializers.CharField(required=False)
    phone_number = serializers.CharField(required=False)
    county = serializers.CharField(required=False)
    town = serializers.CharField(required=False)
    street_address = serializers.CharField(required=False)

    def validate(self, attrs):
        if "address_id" not in attrs:
            required_inline = ["recipient_name", "phone_number", "county", "town", "street_address"]
            missing = [f for f in required_inline if not attrs.get(f)]
            if missing:
                raise serializers.ValidationError(
                    {"address_id": f"Provide address_id or all of: {', '.join(required_inline)}."}
                )
        return attrs


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = [
            "id", "product", "title_snapshot", "price_kes_snapshot",
            "condition_snapshot", "quantity", "line_total_kes",
        ]


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ["id", "provider", "amount_kes", "status", "provider_reference", "confirmed_at"]


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    payments = PaymentSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            "id", "order_number", "status", "payment_method", "subtotal_kes",
            "discount_kes", "shipping_fee_kes", "total_kes", "shipping_name",
            "shipping_phone", "shipping_county", "shipping_town", "shipping_street",
            "placed_at", "items", "payments",
        ]


class OrderStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Order.Status.choices)


class CouponValidateSerializer(serializers.Serializer):
    code = serializers.CharField()
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2)


class CouponSerializer(serializers.ModelSerializer):
    class Meta:
        model = Coupon
        fields = [
            "id", "code", "discount_type", "discount_value", "min_order_value_kes",
            "max_uses", "times_used", "valid_from", "valid_until", "is_active",
        ]
        read_only_fields = ["id", "times_used"]


class PromotionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Promotion
        fields = [
            "id", "title", "description", "category", "discount_percentage",
            "banner_image", "starts_at", "ends_at", "is_active",
        ]
        read_only_fields = ["id"]
