from django.urls import path
from .views import (
    # Auth views
    GetConceptResourcesView, RegisterView, LoginView, DashboardView,
    
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

    # Teacher views
    TeacherRegisterView, TeacherLoginView, TeacherDashboardView,
    TeacherStudentListView, TeacherStudentDetailView,
    TeacherContentListView, TeacherContentDetailView,
    TeacherQuestionListView, TeacherQuestionApproveView, TeacherAddQuestionView,
    TeacherOverrideListView, TeacherOverrideDeactivateView,
    TeacherGoalListView, TeacherGoalUpdateView,
    TeacherClassAnalyticsView,
    TeacherConceptManageView, TeacherAtomManageView,
    CheckTeacherView,
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

    # ==================== TEACHER ENDPOINTS ====================
    path('api/teacher/register/', TeacherRegisterView.as_view(), name='teacher_register'),
    path('api/teacher/login/', TeacherLoginView.as_view(), name='teacher_login'),
    path('api/teacher/dashboard/', TeacherDashboardView.as_view(), name='teacher_dashboard'),
    path('api/teacher/check/', CheckTeacherView.as_view(), name='check_teacher'),

    # Student analytics
    path('api/teacher/students/', TeacherStudentListView.as_view(), name='teacher_students'),
    path('api/teacher/student-detail/', TeacherStudentDetailView.as_view(), name='teacher_student_detail'),

    # Content management
    path('api/teacher/content/', TeacherContentListView.as_view(), name='teacher_content'),
    path('api/teacher/content-detail/', TeacherContentDetailView.as_view(), name='teacher_content_detail'),

    # Question management
    path('api/teacher/questions/', TeacherQuestionListView.as_view(), name='teacher_questions'),
    path('api/teacher/question-approve/', TeacherQuestionApproveView.as_view(), name='teacher_question_approve'),
    path('api/teacher/question-add/', TeacherAddQuestionView.as_view(), name='teacher_add_question'),

    # Student intervention
    path('api/teacher/overrides/', TeacherOverrideListView.as_view(), name='teacher_overrides'),
    path('api/teacher/override-deactivate/', TeacherOverrideDeactivateView.as_view(), name='teacher_override_deactivate'),

    # Goals & deadlines
    path('api/teacher/goals/', TeacherGoalListView.as_view(), name='teacher_goals'),
    path('api/teacher/goal-update/', TeacherGoalUpdateView.as_view(), name='teacher_goal_update'),

    # Class analytics
    path('api/teacher/class-analytics/', TeacherClassAnalyticsView.as_view(), name='teacher_class_analytics'),

    # Knowledge graph management
    path('api/teacher/concepts/', TeacherConceptManageView.as_view(), name='teacher_concepts'),
    path('api/teacher/atoms/', TeacherAtomManageView.as_view(), name='teacher_atoms'),
]