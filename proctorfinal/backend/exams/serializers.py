from rest_framework import serializers
from .models import Exam, Attempt

class ExamSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source="created_by.name", read_only=True)
    class Meta:
        model  = Exam
        fields = ("id","title","description","duration","start_time","end_time","status","created_by","created_by_name","created_at")
        read_only_fields = ("id","created_by","created_at")

class AttemptSerializer(serializers.ModelSerializer):
    user_name  = serializers.CharField(source="user.name",  read_only=True)
    exam_title = serializers.CharField(source="exam.title", read_only=True)
    class Meta:
        model  = Attempt
        fields = ("id","user","user_name","exam","exam_title","start_time","end_time","score","status")
        read_only_fields = ("id","user","start_time")
