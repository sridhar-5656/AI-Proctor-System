from django.db.models import Count,Q
from exams.models import Attempt
from violations.models import Violation
from .models import Result

def grade_from_pct(p):
    if p>=90: return "A+"
    if p>=80: return "A"
    if p>=70: return "B"
    if p>=60: return "C"
    if p>=50: return "D"
    return "F"

def compute_result(attempt):
    from questions.models import Answer, Question
    exam=attempt.exam
    total_marks=sum(q.marks for q in Question.objects.filter(exam=exam)) or 0
    obtained=sum(a.marks_obtained for a in Answer.objects.filter(attempt=attempt))
    pct=round((obtained/total_marks*100) if total_marks>0 else 0,2)
    viol=Violation.objects.filter(user=attempt.user,exam=exam)
    vc=viol.aggregate(high=Count("id",filter=Q(severity="high")),medium=Count("id",filter=Q(severity="medium")),low=Count("id",filter=Q(severity="low")))
    total_v=viol.count(); risk=(vc["high"]*3)+(vc["medium"]*2)+(vc["low"]*1)
    integrity=round(max(0,100-risk*5),2)
    result,_=Result.objects.update_or_create(attempt=attempt,defaults={
        "exam":exam,"total_marks":total_marks,"obtained_marks":round(obtained,2),
        "percentage":pct,"grade":grade_from_pct(pct),"total_violations":total_v,
        "high_violations":vc["high"],"medium_violations":vc["medium"],"low_violations":vc["low"],
        "risk_score":risk,"integrity_score":integrity})
    attempt.score=round(obtained,2); attempt.save()
    _recalc_ranks(exam); return result

def _recalc_ranks(exam):
    for rank,r in enumerate(Result.objects.filter(exam=exam).order_by("-percentage"),1):
        r.rank=rank; r.save(update_fields=["rank"])
