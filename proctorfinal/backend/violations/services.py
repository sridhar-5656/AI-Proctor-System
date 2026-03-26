from .models import Violation, Log
from django.conf import settings

def record_violation(user, exam, violation_type, attempt=None, details=None):
    severity_map = {
        "no_face":"low","multiple_faces":"high","looking_away":"medium",
        "eye_closed":"medium","phone_detected":"high","book_detected":"high",
        "background_noise":"medium","speech_detected":"medium",
        "tab_switch":"medium","fullscreen_exit":"low","copy_paste":"medium",
    }
    severity = severity_map.get(violation_type, "low")
    v = Violation.objects.create(
        user=user, exam=exam, attempt=attempt,
        type=violation_type, severity=severity, details=details or {}
    )
    count = Violation.objects.filter(user=user, exam=exam).count()
    action = None
    if count >= settings.VIOLATION_AUTO_SUBMIT_THRESHOLD:
        action = "auto_submit"
        if attempt:
            attempt.status = "auto_submitted"
            attempt.save()
    elif count >= settings.VIOLATION_SUSPICIOUS_THRESHOLD:
        action = "mark_suspicious"
        if attempt:
            attempt.status = "suspicious"
            attempt.save()
    elif count >= settings.VIOLATION_WARNING_THRESHOLD:
        action = "show_warning"
    return v, count, action
