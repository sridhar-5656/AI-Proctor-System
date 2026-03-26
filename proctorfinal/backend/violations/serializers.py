from rest_framework import serializers
from .models import Violation, Log

class ViolationSerializer(serializers.ModelSerializer):
    user_name  = serializers.CharField(source="user.name",  read_only=True)
    exam_title = serializers.CharField(source="exam.title", read_only=True)
    class Meta:
        model  = Violation
        fields = ("id","user","user_name","exam","exam_title","attempt","type","severity","timestamp","details")
        read_only_fields = ("id","timestamp")

class LogSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Log
        fields = ("id","message","level","user","exam","created_at")
