from django.contrib import admin

from .models import BaleBatch, Category, Product, ProductImage, Supplier


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ["name", "parent", "is_active"]
    prepopulated_fields = {"slug": ("name",)}
    search_fields = ["name"]


@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ["name", "contact_person", "phone_number", "county", "rating", "is_active"]
    search_fields = ["name", "contact_person"]


@admin.register(BaleBatch)
class BaleBatchAdmin(admin.ModelAdmin):
    list_display = ["batch_code", "supplier", "category", "date_received", "cost_kes", "items_listed_count"]
    list_filter = ["supplier", "category"]
    search_fields = ["batch_code"]


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ["title", "category", "selling_price_kes", "quantity", "is_active", "is_featured"]
    list_filter = ["category", "gender", "condition", "is_active", "is_featured"]
    search_fields = ["title", "brand", "slug"]
    prepopulated_fields = {"slug": ("title",)}
    inlines = [ProductImageInline]
