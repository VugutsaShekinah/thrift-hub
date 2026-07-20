from .base import *  # noqa: F401,F403

DEBUG = False

# Fast, insecure hasher — only ever used for the automated test suite.
PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]

# Tests must never hit a real payment gateway or send real email.
PAYMENT_PROVIDER = "mock"
EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"

REFRESH_TOKEN_COOKIE_SECURE = False
