import logging

from rest_framework.views import exception_handler

logger = logging.getLogger("thrifthub")


class DomainError(Exception):
    """Raised by service-layer code for business-rule violations (e.g. out of
    stock, invalid coupon). Caught by the custom exception handler and turned
    into a clean 400 response instead of leaking a stack trace."""

    def __init__(self, message, code="domain_error"):
        self.message = message
        self.code = code
        super().__init__(message)


def custom_exception_handler(exc, context):
    if isinstance(exc, DomainError):
        return _domain_error_response(exc)

    response = exception_handler(exc, context)

    if response is not None:
        return response

    # Unhandled exception: log with context, still return a generic 500 body
    # rather than letting DEBUG-mode HTML or a bare traceback reach the client.
    logger.exception("Unhandled exception in %s", context.get("view"))
    return None


def _domain_error_response(exc):
    from rest_framework.response import Response

    return Response({"detail": exc.message, "code": exc.code}, status=400)
