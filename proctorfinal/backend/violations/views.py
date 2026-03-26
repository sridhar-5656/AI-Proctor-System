from rest_framework import generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from accounts.permissions import IsAdmin
from exams.models import Exam, Attempt
from .models import Violation, Log
from .serializers import ViolationSerializer, LogSerializer
from .services import record_violation

@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def report_violation(request):
    exam_id    = request.data.get("exam_id")
    vtype      = request.data.get("violation_type")
    attempt_id = request.data.get("attempt_id")
    try:
        exam    = Exam.objects.get(pk=exam_id)
        attempt = Attempt.objects.get(pk=attempt_id) if attempt_id else None
    except Exception as e:
        return Response({"error":str(e)}, status=404)
    v, count, action = record_violation(request.user, exam, vtype, attempt)
    return Response({"id":v.id,"count":count,"action":action,"severity":v.severity})

class ViolationListView(generics.ListAPIView):
    serializer_class   = ViolationSerializer
    permission_classes = [IsAdmin]
    def get_queryset(self):
        qs = Violation.objects.select_related("user","exam").all()
        exam_id = self.request.query_params.get("exam_id")
        if exam_id: qs = qs.filter(exam_id=exam_id)
        return qs

class LogListView(generics.ListAPIView):
    serializer_class   = LogSerializer
    permission_classes = [IsAdmin]
    queryset = Log.objects.all()
