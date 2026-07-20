from apps.core.exceptions import DomainError


def get_verified_purchase(user, product):
    """BR-2: a review may only be written against an OrderItem whose order
    has reached `delivered`. Import deferred to avoid a module-level
    circular import between engagement and orders."""
    from apps.orders.models import Order, OrderItem

    order_item = (
        OrderItem.objects.filter(order__user=user, product=product, order__status=Order.Status.DELIVERED)
        .order_by("-created_at")
        .first()
    )
    if not order_item:
        raise DomainError(
            "You can only review a product after it has been delivered to you.",
            code="review_not_verified_purchase",
        )
    return order_item
