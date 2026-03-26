from rest_framework import serializers
from .models import Result, VideoFrame


class ResultSerializer(serializers.ModelSerializer):
    student_name   = serializers.CharField(source="attempt.user.name",  read_only=True)
    student_email  = serializers.CharField(source="attempt.user.email", read_only=True)
    exam_title     = serializers.CharField(source="exam.title",         read_only=True)
    attempt_status = serializers.CharField(source="attempt.status",     read_only=True)

    class Meta:
        model  = Result
        fields = (
            "id", "attempt", "exam", "exam_title",
            "student_name", "student_email", "attempt_status",
            "total_marks", "obtained_marks", "percentage", "rank", "grade",
            "total_violations", "high_violations", "medium_violations", "low_violations",
            "risk_score", "integrity_score", "created_at",
        )


class VideoFrameSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()

    class Meta:
        model  = VideoFrame
        fields = ("id", "attempt", "file", "file_url", "file_type", "timestamp", "note")

    def get_file_url(self, obj):
        request = self.context.get("request")
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return obj.file.url if obj.file else None
