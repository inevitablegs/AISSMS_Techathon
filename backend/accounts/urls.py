from django.urls import path
from .views import (
    RegisterView, LoginView, DashboardView,
    ConceptListView, StartLearningSessionView, SubmitDiagnosticView,
    GetTeachingContentView, GetPracticeQuestionsView, SubmitPracticeAnswerView,
    GetHintView, GetLearningProgressView
)

urlpatterns = [
    path('api/register/', RegisterView.as_view(), name='register'),
    path('api/login/', LoginView.as_view(), name='login'),
    path('api/dashboard/', DashboardView.as_view(), name='dashboard'),
    
    # Learning endpoints
    path('api/concepts/', ConceptListView.as_view(), name='concepts'),
    path('api/start-session/', StartLearningSessionView.as_view(), name='start_session'),
    path('api/submit-diagnostic/', SubmitDiagnosticView.as_view(), name='submit_diagnostic'),
    path('api/teaching/<int:atom_id>/', GetTeachingContentView.as_view(), name='teaching_content'),
    path('api/practice/<int:atom_id>/', GetPracticeQuestionsView.as_view(), name='practice_questions'),
    path('api/submit-answer/', SubmitPracticeAnswerView.as_view(), name='submit_answer'),
    path('api/get-hint/', GetHintView.as_view(), name='get_hint'),
    path('api/progress/', GetLearningProgressView.as_view(), name='learning_progress'),
]