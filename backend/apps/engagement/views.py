from rest_framework import mixins, permissions, viewsets

from apps.core.permissions import IsOwner

from .models import Review, Wishlist
from .serializers import ReviewSerializer, WishlistSerializer


class WishlistViewSet(
    mixins.ListModelMixin, mixins.CreateModelMixin, mixins.DestroyModelMixin, viewsets.GenericViewSet
):
    serializer_class = WishlistSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            Wishlist.objects.filter(user=self.request.user)
            .select_related("product__category")
            .prefetch_related("product__images")
        )


class ReviewViewSet(viewsets.ModelViewSet):
    serializer_class = ReviewSerializer
    filterset_fields = ["product"]
    owner_field = "user"

    def get_permissions(self):
        if self.action in ("update", "partial_update", "destroy"):
            return [permissions.IsAuthenticated(), IsOwner()]
        if self.action == "create":
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        return Review.objects.select_related("user", "product").filter(is_approved=True)
