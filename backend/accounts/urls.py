from django.urls import path
from .views import (
    # Auth views
    RegisterView, LoginView, DashboardView,
    
    # Concept management
    ConceptListView, GenerateConceptView,
    
    # Teaching-first flow views
    StartTeachingSessionView, GetTeachingContentView,
    GenerateQuestionsFromTeachingView, SubmitAtomAnswerView,
    CompleteAtomView, GetLearningProgressView
)

urlpatterns = [
    # Auth endpoints
    path('api/register/', RegisterView.as_view(), name='register'),
    path('api/login/', LoginView.as_view(), name='login'),
    path('api/dashboard/', DashboardView.as_view(), name='dashboard'),
    
    # Concept management
    path('api/concepts/', ConceptListView.as_view(), name='concepts'),
    path('api/generate-concept/', GenerateConceptView.as_view(), name='generate_concept'),
    
    # Teaching-first flow endpoints
    path('api/start-teaching-session/', StartTeachingSessionView.as_view(), name='start_teaching_session'),
    path('api/teaching-content/', GetTeachingContentView.as_view(), name='teaching_content'),
    path('api/generate-questions-from-teaching/', GenerateQuestionsFromTeachingView.as_view(), name='generate_questions_from_teaching'),
    path('api/submit-atom-answer/', SubmitAtomAnswerView.as_view(), name='submit_atom_answer'),
    path('api/complete-atom/', CompleteAtomView.as_view(), name='complete_atom'),
    
    # Progress
    path('api/progress/', GetLearningProgressView.as_view(), name='learning_progress'),
]