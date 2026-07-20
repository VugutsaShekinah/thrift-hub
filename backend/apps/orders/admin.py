from django.contrib import admin

from .models import Coupon, Order, OrderItem, Payment, Promotion, ReturnRequest


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ["product", "title_snapshot", "price_kes_snapshot", "condition_snapshot", "quantity"]


class PaymentInline(admin.TabularInline):
    model = Payment
    extra = 0
    readonly_fields = ["provider", "amount_kes", "status", "provider_reference", "confirmed_at"]


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ["order_number", "user", "status", "payment_method", "total_kes", "placed_at"]
    list_filter = ["status", "payment_method"]
    search_fields = ["order_number", "user__email"]
    readonly_fields = ["order_number", "placed_at"]
    inlines = [OrderItemInline, PaymentInline]


@admin.register(Coupon)
class CouponAdmin(admin.ModelAdmin):
    list_display = ["code", "discount_type", "discount_value", "times_used", "max_uses", "is_active"]
    search_fields = ["code"]


@admin.register(Promotion)
class PromotionAdmin(admin.ModelAdmin):
    list_display = ["title", "category", "discount_percentage", "starts_at", "ends_at", "is_active"]


@admin.register(ReturnRequest)
class ReturnRequestAdmin(admin.ModelAdmin):
    list_display = ["order_item", "status", "created_at", "resolved_at"]
    list_filter = ["status"]
