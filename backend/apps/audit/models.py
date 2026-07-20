from django.db import models


class AuditLog(models.Model):
    """Who changed what, when — for the sensitive fields called out in
    docs/01-requirements-analysis.md FR-31 (price, stock, order status,
    user role). Append-only: never updated or deleted by application code."""

    user = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, null=True, blank=True, related_name="audit_logs"
    )
    action = models.CharField(max_length=100, help_text='e.g. "product.price_changed"')
    model_name = models.CharField(max_length=100)
    object_id = models.CharField(max_length=50)
    changes = models.JSONField(default=dict, blank=True, help_text="{'field': {'old': ..., 'new': ...}}")
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "audit_logs"
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["model_name", "object_id"])]

    def __str__(self):
        return f"{self.action} on {self.model_name}#{self.object_id}"
