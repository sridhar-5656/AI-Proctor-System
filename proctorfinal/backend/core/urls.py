from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("accounts.urls")),
    path("api/", include("exams.urls")),
    path("api/", include("proctoring.urls")),
    path("api/", include("violations.urls")),
    path("api/", include("reports.urls")),
    path("api/", include("questions.urls")),
    path("api/", include("results.urls")),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
