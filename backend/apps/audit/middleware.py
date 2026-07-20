import threading

_thread_locals = threading.local()


def get_current_user():
    return getattr(_thread_locals, "user", None)


def get_current_ip():
    return getattr(_thread_locals, "ip", None)


class CurrentUserMiddleware:
    """Stashes the requesting user/IP in thread-local storage so model
    signal handlers (which only receive the instance, not the request) can
    still attribute an AuditLog entry to whoever made the change."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        user = getattr(request, "user", None)
        _thread_locals.user = user if user and user.is_authenticated else None
        _thread_locals.ip = request.META.get("REMOTE_ADDR")
        try:
            response = self.get_response(request)
        finally:
            _thread_locals.user = None
            _thread_locals.ip = None
        return response
