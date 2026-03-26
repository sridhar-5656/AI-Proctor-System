from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from accounts.permissions import IsAdmin
from django.db.models import Count, Q
from exams.models import Exam, Attempt
from violations.models import Violation
from accounts.models import User

@api_view(["GET"])
@permission_classes([IsAdmin])
def overall_report(request):
    total_students   = User.objects.filter(role="student").count()
    total_exams      = Exam.objects.count()
    total_attempts   = Attempt.objects.count()
    total_violations = Violation.objects.count()
    risk_score       = min(100, total_violations * 2)
    violations_by_type = list(
        Violation.objects.values("type").annotate(count=Count("id")).order_by("-count")
    )
    attempt_status = list(
        Attempt.objects.values("status").annotate(count=Count("id"))
    )
    top_violators = list(
        Violation.objects.values("user__id","user__name","user__email")
        .annotate(total=Count("id")).order_by("-total")[:10]
    )
    return Response({
        "summary":{
            "total_students":   total_students,
            "total_exams":      total_exams,
            "total_attempts":   total_attempts,
            "total_violations": total_violations,
            "risk_score":       risk_score,
        },
        "violations_by_type": violations_by_type,
        "attempt_status":     attempt_status,
        "top_violators":      top_violators,
    })
