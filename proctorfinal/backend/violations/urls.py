from django.urls import path
from . import views
urlpatterns = [
    path("violation/",   views.report_violation,         name="report_violation"),
    path("violations/",  views.ViolationListView.as_view(), name="violation_list"),
    path("logs/",        views.LogListView.as_view(),    name="log_list"),
]
