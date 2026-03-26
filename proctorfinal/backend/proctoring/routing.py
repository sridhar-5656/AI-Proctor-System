from django.urls import path
from . import consumers
websocket_urlpatterns = [
    path("ws/proctor/<str:exam_id>/", consumers.ProctorConsumer.as_asgi()),
]
