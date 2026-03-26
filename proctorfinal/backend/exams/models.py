from django.db import models
from django.conf import settings
from django.utils import timezone

class Exam(models.Model):
    STATUS=[("draft","Draft"),("scheduled","Scheduled"),("active","Active"),("completed","Completed")]
    title       = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    duration    = models.PositiveIntegerField()
    start_time  = models.DateTimeField()
    end_time    = models.DateTimeField()
    status      = models.CharField(max_length=20, choices=STATUS, default="scheduled")
    created_by  = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="created_exams")
    created_at  = models.DateTimeField(auto_now_add=True)
    class Meta:
        db_table = "exams"
        ordering = ["-created_at"]
    def __str__(self): return self.title
    @property
    def is_active(self):
        n = timezone.now()
        return self.start_time <= n <= self.end_time

class Attempt(models.Model):
    STATUS=[("in_progress","In Progress"),("completed","Completed"),("suspicious","Suspicious"),("auto_submitted","Auto Submitted")]
    user       = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="attempts")
    exam       = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name="attempts")
    start_time = models.DateTimeField(auto_now_add=True)
    end_time   = models.DateTimeField(null=True, blank=True)
    score      = models.FloatField(null=True, blank=True)
    status     = models.CharField(max_length=20, choices=STATUS, default="in_progress")
    class Meta:
        db_table = "attempts"
        unique_together = [["user","exam"]]
