from rest_framework.permissions import SAFE_METHODS, BasePermission


class IsStaffOrReadOnly(BasePermission):
    """Public read access; writes restricted to Inventory Staff/Admin."""

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_authenticated and request.user.is_staff)


class IsStaff(BasePermission):
    """Back-office resources (suppliers, bale batches) that customers should
    never see, not even read-only — unlike IsStaffOrReadOnly's public catalog."""

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_staff)


class IsAdminOnly(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_superuser)


class IsOwner(BasePermission):
    """Object-level permission: the requesting user must own the resource via
    an `owner_field` attribute on the view (defaults to "user")."""

    def has_object_permission(self, request, view, obj):
        owner_field = getattr(view, "owner_field", "user")
        return getattr(obj, owner_field, None) == request.user
