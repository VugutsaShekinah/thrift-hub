from rest_framework import serializers

from .models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source="user.email", read_only=True, default=None)

    class Meta:
        model = AuditLog
        fields = ["id", "action", "model_name", "object_id", "changes", "user_email", "ip_address", "created_at"]
