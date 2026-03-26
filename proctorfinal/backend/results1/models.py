from django.db import models
from exams.models import Exam, Attempt


class Result(models.Model):
    attempt        = models.OneToOneField(Attempt, on_delete=models.CASCADE, related_name="result")
    exam           = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name="results")
    total_marks    = models.FloatField(default=0)
    obtained_marks = models.FloatField(default=0)
    percentage     = models.FloatField(default=0)
    rank           = models.PositiveIntegerField(null=True, blank=True)
    grade          = models.CharField(max_length=5, blank=True)
    total_violations  = models.PositiveIntegerField(default=0)
    high_violations   = models.PositiveIntegerField(default=0)
    medium_violations = models.PositiveIntegerField(default=0)
    low_violations    = models.PositiveIntegerField(default=0)
    risk_score     = models.FloatField(default=0)
    integrity_score = models.FloatField(default=100)
    created_at     = models.DateTimeField(auto_now_add=True)
    updated_at     = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "results"
        ordering = ["-percentage"]


class VideoFrame(models.Model):
    """
    Stores both JPEG snapshots (every 30s) and WebM video clips.
    Uses FileField instead of ImageField so .webm files are accepted.
    """
    TYPES = [
        ("snapshot", "JPEG Snapshot"),
        ("video",    "WebM Video Clip"),
    ]
    attempt    = models.ForeignKey(Attempt, on_delete=models.CASCADE, related_name="video_frames")
    file       = models.FileField(upload_to="recordings/%Y/%m/%d/")   # accepts any file type
    file_type  = models.CharField(max_length=10, choices=TYPES, default="snapshot")
    timestamp  = models.DateTimeField(auto_now_add=True)
    note       = models.CharField(max_length=500, blank=True)

    class Meta:
        db_table = "video_frames"
        ordering = ["-timestamp"]

    def __str__(self):
        return f"{self.file_type} — {self.attempt.user.name} @ {self.timestamp}"
