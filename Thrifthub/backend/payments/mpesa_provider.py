import base64
import datetime

import requests
from django.conf import settings

from apps.core.exceptions import DomainError

from .base import PaymentProvider, PaymentResult

DARAJA_BASE_URLS = {
    "sandbox": "https://sandbox.safaricom.co.ke",
    "production": "https://api.safaricom.co.ke",
}


class MpesaProvider(PaymentProvider):
    """Safaricom Daraja STK Push adapter. Requires MPESA_* env vars (see
    backend/.env.example) and a publicly reachable MPESA_CALLBACK_URL —
    neither is available in this dev environment, so this class is wired
    up but only exercised once real credentials + a public HTTPS callback
    are configured (PAYMENT_PROVIDER=mpesa)."""

    def __init__(self):
        self.base_url = DARAJA_BASE_URLS.get(settings.MPESA_ENV, DARAJA_BASE_URLS["sandbox"])

    def _access_token(self):
        response = requests.get(
            f"{self.base_url}/oauth/v1/generate?grant_type=client_credentials",
            auth=(settings.MPESA_CONSUMER_KEY, settings.MPESA_CONSUMER_SECRET),
            timeout=10,
        )
        response.raise_for_status()
        return response.json()["access_token"]

    def charge(self, order, phone_number=None, **kwargs):
        if not phone_number:
            raise DomainError("An M-Pesa phone number is required.", code="mpesa_phone_required")

        timestamp = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
        password = base64.b64encode(
            f"{settings.MPESA_SHORTCODE}{settings.MPESA_PASSKEY}{timestamp}".encode()
        ).decode()

        payload = {
            "BusinessShortCode": settings.MPESA_SHORTCODE,
            "Password": password,
            "Timestamp": timestamp,
            "TransactionType": "CustomerPayBillOnline",
            "Amount": int(order.total_kes),
            "PartyA": phone_number,
            "PartyB": settings.MPESA_SHORTCODE,
            "PhoneNumber": phone_number,
            "CallBackURL": settings.MPESA_CALLBACK_URL,
            "AccountReference": order.order_number,
            "TransactionDesc": f"ThriftHub KE order {order.order_number}",
        }
        response = requests.post(
            f"{self.base_url}/mpesa/stkpush/v1/processrequest",
            json=payload,
            headers={"Authorization": f"Bearer {self._access_token()}"},
            timeout=15,
        )
        response.raise_for_status()
        data = response.json()
        return PaymentResult(status="pending", reference=data.get("CheckoutRequestID", ""), raw=data)
