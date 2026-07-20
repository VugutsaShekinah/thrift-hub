from .middleware import get_current_ip, get_current_user
from .models import AuditLog


def log_action(action, instance, changes=None):
    AuditLog.objects.create(
        user=get_current_user(),
        action=action,
        model_name=instance.__class__.__name__,
        object_id=str(instance.pk),
        changes=changes or {},
        ip_address=get_current_ip(),
    )
