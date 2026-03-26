from django.urls import path
from . import views
urlpatterns = [
    path("exams/",           views.ExamListCreateView.as_view(), name="exam_list"),
    path("exams/<int:pk>/",  views.ExamDetailView.as_view(),    name="exam_detail"),
    path("start-exam/",      views.start_exam,                  name="start_exam"),
    path("submit-exam/",     views.submit_exam,                 name="submit_exam"),
    path("attempts/",        views.AttemptListView.as_view(),   name="attempt_list"),
]
