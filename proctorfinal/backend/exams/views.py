from django.utils import timezone
from rest_framework import generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from accounts.permissions import IsAdmin
from .models import Exam, Attempt
from .serializers import ExamSerializer, AttemptSerializer

class ExamListCreateView(generics.ListCreateAPIView):
    serializer_class = ExamSerializer
    def get_permissions(self):
        return [IsAdmin()] if self.request.method == "POST" else [permissions.IsAuthenticated()]
    def get_queryset(self):
        if self.request.user.is_admin: return Exam.objects.all()
        return Exam.objects.filter(status__in=["scheduled","active"])
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

class ExamDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Exam.objects.all()
    serializer_class = ExamSerializer
    def get_permissions(self):
        if self.request.method in ("PUT","PATCH","DELETE"): return [IsAdmin()]
        return [permissions.IsAuthenticated()]

@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def start_exam(request):
    try: exam = Exam.objects.get(pk=request.data.get("exam_id"))
    except Exam.DoesNotExist: return Response({"error":"Exam not found."}, status=404)
    attempt, created = Attempt.objects.get_or_create(user=request.user, exam=exam)
    return Response(AttemptSerializer(attempt).data, status=201 if created else 200)

@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def submit_exam(request):
    try: attempt = Attempt.objects.get(pk=request.data.get("attempt_id"), user=request.user)
    except Attempt.DoesNotExist: return Response({"error":"Not found."}, status=404)
    attempt.status   = "completed"
    attempt.end_time = timezone.now()
    attempt.score    = request.data.get("score")
    attempt.save()
    return Response(AttemptSerializer(attempt).data)

class AttemptListView(generics.ListAPIView):
    serializer_class = AttemptSerializer
    def get_queryset(self):
        if self.request.user.is_admin: return Attempt.objects.select_related("user","exam").all()
        return Attempt.objects.filter(user=self.request.user).select_related("exam")
