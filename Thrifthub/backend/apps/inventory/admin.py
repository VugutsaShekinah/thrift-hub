from django.contrib import admin

from .models import StockMovement


@admin.register(StockMovement)
class StockMovementAdmin(admin.ModelAdmin):
    list_display = ["product", "change_type", "quantity_delta", "reference", "created_by", "created_at"]
    list_filter = ["change_type"]
    search_fields = ["product__title", "reference"]
    readonly_fields = [f.name for f in StockMovement._meta.fields]

    def has_change_permission(self, request, obj=None):
        return False
