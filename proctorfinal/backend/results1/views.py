from rest_framework import generics, permissions
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from accounts.permissions import IsAdmin
from exams.models import Attempt
from .models import Result, VideoFrame
from .serializers import ResultSerializer, VideoFrameSerializer
from .services import compute_result


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def finalise_result(request):
    """POST /api/finalise-result/ — compute and save result on exam submit."""
    try:
        attempt = Attempt.objects.get(pk=request.data.get("attempt_id"), user=request.user)
    except Attempt.DoesNotExist:
        return Response({"error": "Attempt not found."}, status=404)
    result = compute_result(attempt)
    return Response(ResultSerializer(result).data, status=201)


class ResultListView(generics.ListAPIView):
    """GET /api/results/?exam_id=X  — ADMIN ONLY."""
    serializer_class   = ResultSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        qs = Result.objects.select_related("attempt__user", "exam").all()
        exam_id = self.request.query_params.get("exam_id")
        if exam_id:
            qs = qs.filter(exam_id=exam_id)
        return qs.order_by("rank")


class LeaderboardView(generics.ListAPIView):
    """GET /api/leaderboard/?exam_id=X  — ADMIN ONLY."""
    serializer_class   = ResultSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        exam_id = self.request.query_params.get("exam_id")
        return Result.objects.select_related("attempt__user", "exam").filter(
            exam_id=exam_id
        ).order_by("rank")


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def upload_frame(request):
    """
    POST /api/upload-frame/
    Accepts both:
      - JPEG snapshots (every 30s, file_type=snapshot)
      - WebM video clips (on violation or every 60s, file_type=video)
    """
    attempt_id = request.data.get("attempt_id")
    # Accept either "image" (old) or "file" (new) field name
    uploaded   = request.FILES.get("file") or request.FILES.get("image")
    file_type  = request.data.get("file_type", "snapshot")
    note       = request.data.get("note", "")

    if not attempt_id or not uploaded:
        return Response({"error": "attempt_id and file required."}, status=400)

    try:
        attempt = Attempt.objects.get(pk=attempt_id, user=request.user)
    except Attempt.DoesNotExist:
        return Response({"error": "Attempt not found."}, status=404)

    frame = VideoFrame.objects.create(
        attempt=attempt,
        file=uploaded,
        file_type=file_type,
        note=note[:500],   # truncate safely
    )
    return Response(VideoFrameSerializer(frame, context={"request": request}).data, status=201)


class VideoFrameListView(generics.ListAPIView):
    """GET /api/frames/?attempt_id=X  — ADMIN ONLY."""
    serializer_class   = VideoFrameSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        qs         = VideoFrame.objects.all()
        attempt_id = self.request.query_params.get("attempt_id")
        file_type  = self.request.query_params.get("file_type")
        if attempt_id: qs = qs.filter(attempt_id=attempt_id)
        if file_type:  qs = qs.filter(file_type=file_type)
        return qs

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx
