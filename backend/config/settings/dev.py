from .base import *  # noqa: F401,F403

DEBUG = True

REST_FRAMEWORK["DEFAULT_RENDERER_CLASSES"] = (
    "rest_framework.renderers.JSONRenderer",
    "rest_framework.renderers.BrowsableAPIRenderer",
)

# Cookies are not marked Secure in dev because local HTTP (no TLS) is normal here.
REFRESH_TOKEN_COOKIE_SECURE = False
