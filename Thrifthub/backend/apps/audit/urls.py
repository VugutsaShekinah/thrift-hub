from django.urls import path

from . import views

audit_urlpatterns = [
    path("logs/", views.AuditLogListView.as_view(), name="audit-logs"),
]
