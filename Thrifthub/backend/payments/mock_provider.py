import uuid

from .base import PaymentProvider, PaymentResult


class MockProvider(PaymentProvider):
    """Instant, deterministic 'success' (or 'pending' for COD) — used for
    local development and the automated test suite so neither depends on
    real M-Pesa sandbox credentials or network access."""

    def charge(self, order, **kwargs):
        if order.payment_method == order.PaymentMethod.COD:
            return PaymentResult(status="pending", reference=f"COD-{order.order_number}")
        return PaymentResult(status="success", reference=f"MOCK-{uuid.uuid4().hex[:12].upper()}")
