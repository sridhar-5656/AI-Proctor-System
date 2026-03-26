from django.urls import path
from . import views
urlpatterns = [
    path("proctor/status/", views.proctor_status, name="proctor_status"),
]
