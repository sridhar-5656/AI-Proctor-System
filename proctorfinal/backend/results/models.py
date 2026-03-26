from django.db import models
from exams.models import Exam, Attempt

class Result(models.Model):
    attempt=models.OneToOneField(Attempt,on_delete=models.CASCADE,related_name="result")
    exam=models.ForeignKey(Exam,on_delete=models.CASCADE,related_name="results")
    total_marks=models.FloatField(default=0); obtained_marks=models.FloatField(default=0)
    percentage=models.FloatField(default=0); rank=models.PositiveIntegerField(null=True,blank=True)
    grade=models.CharField(max_length=5,blank=True)
    total_violations=models.PositiveIntegerField(default=0)
    high_violations=models.PositiveIntegerField(default=0)
    medium_violations=models.PositiveIntegerField(default=0)
    low_violations=models.PositiveIntegerField(default=0)
    risk_score=models.FloatField(default=0); integrity_score=models.FloatField(default=100)
    created_at=models.DateTimeField(auto_now_add=True); updated_at=models.DateTimeField(auto_now=True)
    class Meta:
        db_table="results"; ordering=["-percentage"]

class VideoFrame(models.Model):
    attempt=models.ForeignKey(Attempt,on_delete=models.CASCADE,related_name="video_frames")
    image=models.ImageField(upload_to="frames/%Y/%m/%d/")
    timestamp=models.DateTimeField(auto_now_add=True)
    note=models.CharField(max_length=100,blank=True)
    class Meta:
        db_table="video_frames"; ordering=["-timestamp"]
