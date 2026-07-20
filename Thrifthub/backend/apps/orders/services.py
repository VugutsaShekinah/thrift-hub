from decimal import Decimal

from django.conf import settings
from django.db import transaction
from django.utils import timezone

from apps.catalog.models import Product
from apps.core.exceptions import DomainError
from apps.inventory import services as inventory_services
from apps.inventory.models import StockMovement
from payments.factory import get_payment_provider

from .models import Coupon, Order, OrderItem, Payment

ALLOWED_STATUS_TRANSITIONS = {
    Order.Status.PENDING: {Order.Status.PAID, Order.Status.PROCESSING, Order.Status.CANCELLED},
    Order.Status.PAID: {Order.Status.PROCESSING, Order.Status.CANCELLED, Order.Status.REFUNDED},
    Order.Status.PROCESSING: {Order.Status.SHIPPED, Order.Status.CANCELLED, Order.Status.REFUNDED},
    Order.Status.SHIPPED: {Order.Status.DELIVERED, Order.Status.REFUNDED},
    Order.Status.DELIVERED: {Order.Status.REFUNDED},
    Order.Status.CANCELLED: set(),
    Order.Status.REFUNDED: set(),
}

RESTOCKING_STATUSES = {Order.Status.CANCELLED, Order.Status.REFUNDED}


TWO_PLACES = Decimal("0.01")


def calculate_discount(coupon: Coupon, subtotal):
    if coupon.discount_type == Coupon.DiscountType.PERCENTAGE:
        return (subtotal * coupon.discount_value / 100).quantize(TWO_PLACES)
    return min(coupon.discount_value, subtotal)


def validate_coupon(code, subtotal, lock=False):
    """BR-3: not expired, under its usage cap, and the order meets the
    coupon's minimum spend. `lock=True` takes a row lock — used at
    checkout time (not at cart-preview time) to close the race where two
    concurrent orders both redeem the last use of a limited coupon."""
    qs = Coupon.objects.select_for_update() if lock else Coupon.objects
    try:
        coupon = qs.get(code__iexact=code, is_active=True)
    except Coupon.DoesNotExist:
        raise DomainError("Invalid or inactive coupon code.", code="invalid_coupon")

    now = timezone.now()
    if not (coupon.valid_from <= now <= coupon.valid_until):
        raise DomainError("This coupon is not currently valid.", code="coupon_expired")
    if coupon.max_uses is not None and coupon.times_used >= coupon.max_uses:
        raise DomainError("This coupon has reached its usage limit.", code="coupon_exhausted")
    if subtotal < coupon.min_order_value_kes:
        raise DomainError(
            f"This coupon requires a minimum order of KES {coupon.min_order_value_kes}.",
            code="coupon_min_order_not_met",
        )
    return coupon


def calculate_shipping_fee(amount_after_discount):
    if amount_after_discount >= Decimal(str(settings.FREE_SHIPPING_THRESHOLD_KES)):
        return Decimal("0.00")
    return Decimal(str(settings.DEFAULT_SHIPPING_FEE_KES))


@transaction.atomic
def checkout(*, user, items, shipping_info, payment_method, coupon_code=None, mpesa_phone=None):
    """The core commerce-loop transaction: validates stock, locks and
    decrements it, applies any coupon, computes totals, creates the Order +
    OrderItems, and charges via the configured payment provider — all in
    one atomic block so a failure at any step (out of stock, invalid
    coupon, payment failure) leaves no partial order or stock drift behind.
    """
    if not items:
        raise DomainError("Cannot checkout an empty cart.", code="empty_cart")

    order_items_data = []
    subtotal = 0
    for item in items:
        product = Product.objects.select_for_update().get(pk=item["product_id"])
        quantity = item["quantity"]
        if not product.is_active or product.quantity < quantity:
            raise DomainError(
                f"'{product.title}' no longer has {quantity} unit(s) available.",
                code="insufficient_stock",
            )
        line_total = product.selling_price_kes * quantity
        subtotal += line_total
        order_items_data.append((product, quantity))

    discount = 0
    coupon = None
    if coupon_code:
        coupon = validate_coupon(coupon_code, subtotal, lock=True)
        discount = calculate_discount(coupon, subtotal)

    shipping_fee = calculate_shipping_fee(subtotal - discount)
    total = subtotal - discount + shipping_fee

    order = Order.objects.create(
        user=user,
        coupon=coupon,
        payment_method=payment_method,
        subtotal_kes=subtotal,
        discount_kes=discount,
        shipping_fee_kes=shipping_fee,
        total_kes=total,
        shipping_name=shipping_info["recipient_name"],
        shipping_phone=shipping_info["phone_number"],
        shipping_county=shipping_info["county"],
        shipping_town=shipping_info["town"],
        shipping_street=shipping_info["street_address"],
    )

    for product, quantity in order_items_data:
        OrderItem.objects.create(
            order=order,
            product=product,
            title_snapshot=product.title,
            price_kes_snapshot=product.selling_price_kes,
            condition_snapshot=product.condition,
            quantity=quantity,
        )
        inventory_services.adjust_stock(
            product=product,
            delta=-quantity,
            change_type=StockMovement.ChangeType.SALE,
            reference=order.order_number,
            user=user,
            lock=False,  # already locked above in this same transaction
        )

    if coupon:
        Coupon.objects.filter(pk=coupon.pk).update(times_used=coupon.times_used + 1)

    provider = get_payment_provider()
    result = provider.charge(order, phone_number=mpesa_phone)

    payment = Payment.objects.create(
        order=order,
        provider=payment_method,
        amount_kes=total,
        status=Payment.Status.SUCCESS if result.status == "success" else Payment.Status.PENDING,
        provider_reference=result.reference,
        raw_response=result.raw,
        confirmed_at=timezone.now() if result.status == "success" else None,
    )

    order.status = Order.Status.PAID if result.status == "success" else Order.Status.PROCESSING
    order.save(update_fields=["status", "updated_at"])

    return order


@transaction.atomic
def transition_order_status(order, new_status, user=None):
    allowed = ALLOWED_STATUS_TRANSITIONS.get(order.status, set())
    if new_status not in allowed:
        raise DomainError(
            f"Cannot move an order from '{order.status}' to '{new_status}'.",
            code="invalid_status_transition",
        )

    if new_status in RESTOCKING_STATUSES:
        for item in order.items.select_related("product"):
            if item.product is not None:
                inventory_services.adjust_stock(
                    product=item.product,
                    delta=item.quantity,
                    change_type=StockMovement.ChangeType.RETURN,
                    reference=order.order_number,
                    note=f"Order {new_status}",
                    user=user,
                )

    order.status = new_status
    order.save(update_fields=["status", "updated_at"])
    return order
