from django.conf import settings

from .mock_provider import MockProvider


def get_payment_provider():
    if settings.PAYMENT_PROVIDER == "mpesa":
        from .mpesa_provider import MpesaProvider

        return MpesaProvider()
    return MockProvider()
