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
    try: attempt=Attempt.objects.get(pk=request.data.get("attempt_id"),user=request.user)
    except Attempt.DoesNotExist: return Response({"error":"Attempt not found."},status=404)
    result=compute_result(attempt)
    return Response(ResultSerializer(result).data,status=201)

class ResultListView(generics.ListAPIView):
    serializer_class=ResultSerializer; permission_classes=[IsAdmin]
    def get_queryset(self):
        qs=Result.objects.select_related("attempt__user","exam").all()
        exam_id=self.request.query_params.get("exam_id")
        if exam_id: qs=qs.filter(exam_id=exam_id)
        return qs.order_by("rank")

class LeaderboardView(generics.ListAPIView):
    serializer_class=ResultSerializer; permission_classes=[IsAdmin]
    def get_queryset(self):
        exam_id=self.request.query_params.get("exam_id")
        return Result.objects.select_related("attempt__user","exam").filter(exam_id=exam_id).order_by("rank")

@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
@parser_classes([MultiPartParser,FormParser])
def upload_frame(request):
    attempt_id=request.data.get("attempt_id"); image=request.FILES.get("image")
    if not attempt_id or not image: return Response({"error":"attempt_id and image required."},status=400)
    try: attempt=Attempt.objects.get(pk=attempt_id,user=request.user)
    except Attempt.DoesNotExist: return Response({"error":"Attempt not found."},status=404)
    frame=VideoFrame.objects.create(attempt=attempt,image=image,note=request.data.get("note",""))
    return Response(VideoFrameSerializer(frame).data,status=201)

class VideoFrameListView(generics.ListAPIView):
    serializer_class=VideoFrameSerializer; permission_classes=[IsAdmin]
    def get_queryset(self):
        qs=VideoFrame.objects.all()
        attempt_id=self.request.query_params.get("attempt_id")
        if attempt_id: qs=qs.filter(attempt_id=attempt_id)
        return qs
