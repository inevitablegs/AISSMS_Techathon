from django.urls import path
from .views import (
    CompleteDiagnosticView, GetDiagnosticQuestionsView, MarkAtomTaughtView, RegisterView, LoginView, DashboardView,
    ConceptListView, StartLearningSessionView, SubmitDiagnosticAnswerView, SubmitDiagnosticView,
    GetTeachingContentView, GetPracticeQuestionsView, SubmitPracticeAnswerView,
    GetHintView, GetLearningProgressView,
    GenerateConceptView, GetAtomsView
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
    
    # Atom generation endpoints
    path('api/generate-concept/', GenerateConceptView.as_view(), name='generate_concept'),
    path('api/concepts/<int:concept_id>/atoms/', GetAtomsView.as_view(), name='get_atoms'),
    
    
    path('api/teaching/<int:atom_id>/', GetTeachingContentView.as_view(), name='teaching_content'),
    
    # Teaching-first flow endpoints
    
    path('api/mark-atom-taught/', MarkAtomTaughtView.as_view(), name='mark_atom_taught'),
    path('api/diagnostic-questions/<int:atom_id>/', GetDiagnosticQuestionsView.as_view(), name='diagnostic_questions'),
    path('api/submit-diagnostic-answer/', SubmitDiagnosticAnswerView.as_view(), name='submit_diagnostic_answer'),
    path('api/complete-diagnostic/', CompleteDiagnosticView.as_view(), name='complete_diagnostic'),
    
    # Keep existing endpoints for backward compatibility
    path('api/teaching/<int:atom_id>/', GetTeachingContentView.as_view(), name='teaching_content'),
]