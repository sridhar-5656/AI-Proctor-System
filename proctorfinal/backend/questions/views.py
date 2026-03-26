from rest_framework import generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from accounts.permissions import IsAdmin
from exams.models import Attempt
from .models import Question, Choice, Answer
from .serializers import (QuestionAdminSerializer, QuestionStudentSerializer,
    QuestionCreateSerializer, AnswerSerializer, AnswerSubmitSerializer, AdminGradeSerializer)

class QuestionListCreateView(generics.ListCreateAPIView):
    def get_serializer_class(self):
        if self.request.method == "POST": return QuestionCreateSerializer
        return QuestionAdminSerializer if self.request.user.is_admin else QuestionStudentSerializer
    def get_permissions(self):
        return [IsAdmin()] if self.request.method == "POST" else [permissions.IsAuthenticated()]
    def get_queryset(self):
        qs = Question.objects.prefetch_related("choices").all()
        exam_id = self.request.query_params.get("exam_id")
        if exam_id: qs = qs.filter(exam_id=exam_id)
        return qs

class QuestionDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Question.objects.prefetch_related("choices").all()
    def get_serializer_class(self):
        return QuestionCreateSerializer if self.request.method in ("PATCH","PUT") else QuestionAdminSerializer
    def get_permissions(self):
        if self.request.method in ("PATCH","PUT","DELETE"): return [IsAdmin()]
        return [permissions.IsAuthenticated()]

@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def submit_answer(request):
    s = AnswerSubmitSerializer(data=request.data)
    s.is_valid(raise_exception=True)
    d = s.validated_data
    try:
        attempt  = Attempt.objects.get(pk=d["attempt_id"], user=request.user)
        question = Question.objects.prefetch_related("choices").get(pk=d["question_id"])
    except Exception as e:
        return Response({"error":str(e)}, status=404)
    selected=None; is_correct=False; marks=0
    if question.qtype == "short":
        is_correct=False; marks=0
    elif d.get("choice_id"):
        try:
            selected=Choice.objects.get(pk=d["choice_id"],question=question)
            is_correct=selected.is_correct
            marks=float(question.marks) if is_correct else 0
        except Choice.DoesNotExist: pass
    answer,_=Answer.objects.update_or_create(
        attempt=attempt, question=question,
        defaults={"selected":selected,"text_answer":d.get("text_answer",""),
                  "is_correct":is_correct,"marks_obtained":marks,"graded_by_admin":False})
    return Response(AnswerSerializer(answer).data, status=201)

@api_view(["POST"])
@permission_classes([IsAdmin])
def grade_answer(request):
    s = AdminGradeSerializer(data=request.data)
    s.is_valid(raise_exception=True)
    d = s.validated_data
    try: answer = Answer.objects.select_related("question").get(pk=d["answer_id"])
    except Answer.DoesNotExist: return Response({"error":"Answer not found."}, status=404)
    max_marks=float(answer.question.marks); marks=min(d["marks"],max_marks)
    is_correct=d.get("is_correct")
    if is_correct is None: is_correct = marks >= max_marks
    answer.marks_obtained=marks; answer.is_correct=is_correct; answer.graded_by_admin=True
    answer.save()
    return Response(AnswerSerializer(answer).data)

class AnswerListView(generics.ListAPIView):
    serializer_class = AnswerSerializer
    def get_queryset(self):
        qs=Answer.objects.select_related("question","selected","attempt__user").all()
        attempt_id=self.request.query_params.get("attempt_id")
        question_id=self.request.query_params.get("question_id")
        if attempt_id:  qs=qs.filter(attempt_id=attempt_id)
        if question_id: qs=qs.filter(question_id=question_id)
        if not self.request.user.is_admin: qs=qs.filter(attempt__user=self.request.user)
        return qs

@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def my_exam_result(request, attempt_id):
    try: attempt=Attempt.objects.get(pk=attempt_id, user=request.user)
    except Attempt.DoesNotExist: return Response({"error":"Not found."}, status=404)
    if attempt.status == "in_progress":
        return Response({"error":"Exam still in progress."}, status=400)
    answers=Answer.objects.filter(attempt=attempt).select_related("question","selected")
    q_all=Question.objects.filter(exam=attempt.exam).prefetch_related("choices")
    total=sum(q.marks for q in q_all)
    obtained=sum(a.marks_obtained for a in answers)
    amap={a.question_id:a for a in answers}
    rows=[]
    for q in q_all:
        a=amap.get(q.id)
        cc=q.choices.filter(is_correct=True).first()
        rows.append({
            "question_order": q.order, "question_text": q.text,
            "question_type":  q.qtype, "marks": q.marks,
            "model_answer":   q.model_answer,
            "correct_answer": cc.text if cc else None,
            "your_answer":    (a.text_answer if q.qtype=="short" else (a.selected.text if a and a.selected else None)) if a else None,
            "is_correct":     a.is_correct if a else False,
            "marks_obtained": a.marks_obtained if a else 0,
            "graded_by_admin":a.graded_by_admin if a else False,
            "pending_grade":  q.qtype=="short" and a and not a.graded_by_admin,
        })
    return Response({"attempt_id":attempt.id,"exam_title":attempt.exam.title,
        "status":attempt.status,"total_marks":total,
        "obtained_marks":round(obtained,2),
        "percentage":round((obtained/total*100) if total else 0,2),"answers":rows})
