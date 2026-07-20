from django.conf import settings


def set_refresh_cookie(response, refresh_token):
    response.set_cookie(
        key=settings.REFRESH_TOKEN_COOKIE,
        value=str(refresh_token),
        httponly=True,
        secure=getattr(settings, "REFRESH_TOKEN_COOKIE_SECURE", True),
        samesite=settings.REFRESH_TOKEN_COOKIE_SAMESITE,
        path=settings.REFRESH_TOKEN_COOKIE_PATH,
        max_age=int(settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"].total_seconds()),
    )


def clear_refresh_cookie(response):
    response.delete_cookie(key=settings.REFRESH_TOKEN_COOKIE, path=settings.REFRESH_TOKEN_COOKIE_PATH)
