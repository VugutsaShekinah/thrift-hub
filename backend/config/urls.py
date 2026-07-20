"""
Root URL configuration for ThriftHub KE.

Each Django app owns its own `urls.py`; this file only assembles the
`/api/<app>/` prefixes. Apps are wired in here as they're built out
(see docs/02-system-design.md §5 for the full intended API surface).
"""
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

from apps.accounts.urls import account_urlpatterns, auth_urlpatterns
from apps.analytics.urls import analytics_urlpatterns
from apps.audit.urls import audit_urlpatterns
from apps.catalog.urls import catalog_urlpatterns
from apps.engagement.urls import engagement_urlpatterns
from apps.inventory.urls import inventory_urlpatterns
from apps.orders.urls import orders_urlpatterns

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include(auth_urlpatterns)),
    path("api/accounts/", include(account_urlpatterns)),
    path("api/catalog/", include(catalog_urlpatterns)),
    path("api/inventory/", include(inventory_urlpatterns)),
    path("api/orders/", include(orders_urlpatterns)),
    path("api/engagement/", include(engagement_urlpatterns)),
    path("api/analytics/", include(analytics_urlpatterns)),
    path("api/audit/", include(audit_urlpatterns)),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
