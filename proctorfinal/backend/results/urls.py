from django.urls import path
from . import views
urlpatterns = [
    path("finalise-result/", views.finalise_result,            name="finalise_result"),
    path("results/",         views.ResultListView.as_view(),   name="result_list"),
    path("leaderboard/",     views.LeaderboardView.as_view(),  name="leaderboard"),
    path("upload-frame/",    views.upload_frame,               name="upload_frame"),
    path("frames/",          views.VideoFrameListView.as_view(),name="frame_list"),
]
