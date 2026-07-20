from rest_framework import generics

from apps.core.permissions import IsAdminOnly

from .models import AuditLog
from .serializers import AuditLogSerializer


class AuditLogListView(generics.ListAPIView):
    queryset = AuditLog.objects.select_related("user").all()
    serializer_class = AuditLogSerializer
    permission_classes = [IsAdminOnly]
    filterset_fields = ["model_name", "action", "object_id"]
