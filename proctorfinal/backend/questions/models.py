from django.db import models
from exams.models import Exam, Attempt

class Question(models.Model):
    TYPES=[("mcq","Multiple Choice"),("true_false","True / False"),("short","Short Answer")]
    exam         = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name="questions")
    text         = models.TextField()
    qtype        = models.CharField(max_length=20, choices=TYPES, default="mcq")
    marks        = models.PositiveIntegerField(default=1)
    order        = models.PositiveIntegerField(default=1)
    model_answer = models.TextField(blank=True, help_text="Expected answer — shown to student after submission")
    created_at   = models.DateTimeField(auto_now_add=True)
    class Meta:
        db_table = "questions"
        ordering = ["order"]
    def __str__(self): return f"Q{self.order}: {self.text[:60]}"

class Choice(models.Model):
    question   = models.ForeignKey(Question, on_delete=models.CASCADE, related_name="choices")
    text       = models.CharField(max_length=500)
    is_correct = models.BooleanField(default=False)
    class Meta:
        db_table = "choices"
    def __str__(self): return f"{self.text} ({'correct' if self.is_correct else 'wrong'})"

class Answer(models.Model):
    attempt         = models.ForeignKey(Attempt,  on_delete=models.CASCADE, related_name="answers")
    question        = models.ForeignKey(Question, on_delete=models.CASCADE, related_name="answers")
    selected        = models.ForeignKey(Choice,   on_delete=models.SET_NULL, null=True, blank=True)
    text_answer     = models.TextField(blank=True)
    is_correct      = models.BooleanField(default=False)
    marks_obtained  = models.FloatField(default=0)
    graded_by_admin = models.BooleanField(default=False)
    answered_at     = models.DateTimeField(auto_now_add=True)
    class Meta:
        db_table = "answers"
        unique_together = [["attempt","question"]]
    def __str__(self): return f"{self.attempt.user.name} - Q{self.question.order}"
