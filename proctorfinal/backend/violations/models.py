from django.db import models
from django.conf import settings
from exams.models import Exam, Attempt

class Violation(models.Model):
    SEVERITY=[("low","Low"),("medium","Medium"),("high","High")]
    TYPES=[
        ("no_face","No Face"),("multiple_faces","Multiple Faces"),
        ("looking_away","Looking Away"),("eye_closed","Eyes Closed"),
        ("phone_detected","Phone Detected"),("book_detected","Book Detected"),
        ("background_noise","Background Noise"),("speech_detected","Speech Detected"),
        ("tab_switch","Tab Switch"),("fullscreen_exit","Fullscreen Exit"),("copy_paste","Copy Paste"),
    ]
    user      = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="violations")
    exam      = models.ForeignKey(Exam,    on_delete=models.CASCADE, related_name="violations")
    attempt   = models.ForeignKey(Attempt, on_delete=models.SET_NULL, null=True, blank=True)
    type      = models.CharField(max_length=50, choices=TYPES)
    severity  = models.CharField(max_length=10, choices=SEVERITY, default="low")
    timestamp = models.DateTimeField(auto_now_add=True)
    details   = models.JSONField(default=dict, blank=True)
    class Meta:
        db_table = "violations"
        ordering = ["-timestamp"]

class Log(models.Model):
    message    = models.TextField()
    level      = models.CharField(max_length=10, default="info")
    user       = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    exam       = models.ForeignKey(Exam, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        db_table = "logs"
        ordering = ["-created_at"]
