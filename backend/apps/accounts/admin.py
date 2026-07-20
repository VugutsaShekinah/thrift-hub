from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .models import Address, CustomerProfile, User


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    ordering = ["-created_at"]
    list_display = ["email", "full_name", "phone_number", "role", "is_staff", "is_active"]
    list_filter = ["role", "is_staff", "is_superuser", "is_active"]
    search_fields = ["email", "phone_number", "first_name", "last_name"]
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Personal info", {"fields": ("first_name", "last_name", "phone_number", "avatar")}),
        ("Role & permissions", {
            "fields": ("role", "is_active", "is_staff", "is_superuser", "groups", "user_permissions"),
        }),
        ("Important dates", {"fields": ("last_login",)}),
    )
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("email", "phone_number", "first_name", "last_name", "password1", "password2"),
        }),
    )


@admin.register(CustomerProfile)
class CustomerProfileAdmin(admin.ModelAdmin):
    list_display = ["user", "gender", "loyalty_points", "newsletter_opt_in"]
    search_fields = ["user__email"]


@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    list_display = ["user", "label", "recipient_name", "town", "county", "is_default"]
    list_filter = ["county", "is_default"]
    search_fields = ["recipient_name", "user__email"]
