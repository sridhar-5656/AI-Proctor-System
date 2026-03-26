from django.urls import path
from . import views
urlpatterns = [
    path("report/", views.overall_report, name="overall_report"),
]
