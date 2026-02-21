from django.urls import path
from .views import (
    # Auth views
    AIDoubtAssistantView, GetConceptResourcesView, RegisterView, LoginView, DashboardView,
    
    # Concept management
    ConceptListView, GenerateConceptView,
    
    # Teaching-first flow views
    StartTeachingSessionView, GetTeachingContentView,
    GenerateQuestionsFromTeachingView, SubmitAtomAnswerView,
    CompleteAtomView, GetLearningProgressView,
    GenerateInitialQuizView, SubmitInitialQuizAnswerView, CompleteInitialQuizView,
    GenerateFinalChallengeView, CompleteFinalChallengeView,

    # Enhanced pacing engine views
    GetVelocityGraphView, GetFatigueStatusView, RecordBreakView,
    RetentionCheckView, RecordHintUsageView,

    # Leaderboard views
    LeaderboardView, MyXPView,

    # Concept final challenge views
    GenerateConceptFinalChallengeView, SubmitConceptFinalAnswerView,
    CompleteConceptFinalChallengeView,
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
    path('api/initial-quiz/', GenerateInitialQuizView.as_view(), name='generate_initial_quiz'),
    path('api/submit-initial-quiz-answer/', SubmitInitialQuizAnswerView.as_view(), name='submit_initial_quiz_answer'),
    path('api/complete-initial-quiz/', CompleteInitialQuizView.as_view(), name='complete_initial_quiz'),
    path('api/teaching-content/', GetTeachingContentView.as_view(), name='teaching_content'),
    path('api/generate-questions-from-teaching/', GenerateQuestionsFromTeachingView.as_view(), name='generate_questions_from_teaching'),
    path('api/submit-atom-answer/', SubmitAtomAnswerView.as_view(), name='submit_atom_answer'),
    path('api/complete-atom/', CompleteAtomView.as_view(), name='complete_atom'),
    path('api/final-challenge/', GenerateFinalChallengeView.as_view(), name='generate_final_challenge'),
    path('api/complete-final-challenge/', CompleteFinalChallengeView.as_view(), name='complete_final_challenge'),
    
    # Progress
    path('api/progress/', GetLearningProgressView.as_view(), name='learning_progress'),
    
    path('api/concept-resources/', GetConceptResourcesView.as_view(), name='concept_resources'),

    # Enhanced pacing engine endpoints
    path('api/velocity-graph/', GetVelocityGraphView.as_view(), name='velocity_graph'),
    path('api/fatigue-status/', GetFatigueStatusView.as_view(), name='fatigue_status'),
    path('api/record-break/', RecordBreakView.as_view(), name='record_break'),
    path('api/retention-check/', RetentionCheckView.as_view(), name='retention_check'),
    path('api/record-hint/', RecordHintUsageView.as_view(), name='record_hint'),

    # Leaderboard endpoints
    path('api/leaderboard/', LeaderboardView.as_view(), name='leaderboard'),
    path('api/my-xp/', MyXPView.as_view(), name='my_xp'),

    # Concept final challenge endpoints
    path('api/concept-final-challenge/', GenerateConceptFinalChallengeView.as_view(), name='generate_concept_final_challenge'),
    path('api/submit-concept-final-answer/', SubmitConceptFinalAnswerView.as_view(), name='submit_concept_final_answer'),
    path('api/complete-concept-final-challenge/', CompleteConceptFinalChallengeView.as_view(), name='complete_concept_final_challenge'),
    path("ai-assistant/", AIDoubtAssistantView.as_view(), name="ai_assistant"),
]