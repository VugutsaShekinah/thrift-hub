from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional


@dataclass
class PaymentResult:
    status: str  # "success" | "pending" | "failed"
    reference: str
    raw: Optional[dict] = None


class PaymentProvider(ABC):
    """Every payment method (M-Pesa, Cash on Delivery, future card gateway)
    implements this so `orders.services.checkout` never has to branch on
    provider-specific details. See docs/01-requirements-analysis.md §6 for
    why this exists: no live Daraja credentials are available in this
    environment, so dev/test run against MockProvider while production
    swaps in MpesaProvider via the PAYMENT_PROVIDER env var."""

    @abstractmethod
    def charge(self, order, **kwargs) -> PaymentResult:
        ...
