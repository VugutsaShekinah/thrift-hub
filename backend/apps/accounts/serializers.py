from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import Address, CustomerProfile, User


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])

    class Meta:
        model = User
        fields = ["id", "email", "password", "phone_number", "first_name", "last_name"]

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class CustomerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerProfile
        fields = ["date_of_birth", "gender", "newsletter_opt_in", "loyalty_points"]
        read_only_fields = ["loyalty_points"]


class UserSerializer(serializers.ModelSerializer):
    profile = CustomerProfileSerializer(required=False)
    full_name = serializers.ReadOnlyField()

    class Meta:
        model = User
        fields = [
            "id", "email", "full_name", "first_name", "last_name",
            "phone_number", "role", "avatar", "profile", "created_at",
        ]
        read_only_fields = ["id", "email", "role", "created_at"]

    def update(self, instance, validated_data):
        profile_data = validated_data.pop("profile", None)
        instance = super().update(instance, validated_data)
        if profile_data:
            CustomerProfileSerializer().update(instance.profile, profile_data)
        return instance


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, validators=[validate_password])

    def validate_current_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")
        return value


class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = [
            "id", "label", "recipient_name", "phone_number", "county",
            "town", "street_address", "building", "is_default", "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True, validators=[validate_password])
