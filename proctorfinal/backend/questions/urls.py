from django.urls import path
from . import views
urlpatterns = [
    path("questions/",                  views.QuestionListCreateView.as_view(), name="question_list"),
    path("questions/<int:pk>/",         views.QuestionDetailView.as_view(),     name="question_detail"),
    path("submit-answer/",              views.submit_answer,                    name="submit_answer"),
    path("grade-answer/",               views.grade_answer,                     name="grade_answer"),
    path("answers/",                    views.AnswerListView.as_view(),         name="answer_list"),
    path("my-result/<int:attempt_id>/", views.my_exam_result,                  name="my_result"),
]
