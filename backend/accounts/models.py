from django.db import models
from django.contrib.auth.models import User
import json

class LearningProfile(models.Model):
    """Student's learning profile and progress"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='learning_profile')
    overall_theta = models.FloatField(default=0.0)  # IRT ability parameter
    current_subject = models.CharField(max_length=100, blank=True)
    current_concept = models.CharField(max_length=100, blank=True)
    learning_streak = models.IntegerField(default=0)
    total_time_spent = models.IntegerField(default=0)  # in minutes
    last_active = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'learning_profile'

class Concept(models.Model):
    """Learning concepts and atoms"""
    DIFFICULTY_CHOICES = [
        ('easy', 'Easy'),
        ('medium', 'Medium'),
        ('hard', 'Hard'),
    ]
    
    name = models.CharField(max_length=200)
    subject = models.CharField(max_length=100)
    created_by = models.ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='created_concepts'
    )
    description = models.TextField(blank=True)
    prerequisites = models.ManyToManyField('self', symmetrical=False, blank=True)
    difficulty = models.CharField(max_length=10, choices=DIFFICULTY_CHOICES, default='medium')
    order = models.IntegerField(default=0)
    
    class Meta:
        ordering = ['subject', 'order']
        unique_together = ['name', 'subject', 'created_by']

class TeachingAtom(models.Model):
    """Atomic learning units"""
    PHASE_CHOICES = [
        ('diagnostic', 'Diagnostic'),
        ('teaching', 'Teaching'),
        ('practice', 'Practice'),
        ('reinforcement', 'Reinforcement'),
        ('mastery_check', 'Mastery Check'),
        ('complete', 'Complete'),
    ]
    
    name = models.CharField(max_length=200)
    concept = models.ForeignKey(Concept, on_delete=models.CASCADE, related_name='atoms')
    explanation = models.TextField(blank=True)
    analogy = models.TextField(blank=True)
    examples = models.JSONField(default=list)
    order = models.IntegerField(default=0)
    
    class Meta:
        ordering = ['concept', 'order']

class Question(models.Model):
    """Practice questions"""
    DIFFICULTY_CHOICES = [
        ('easy', 'Easy'),
        ('medium', 'Medium'),
        ('hard', 'Hard'),
    ]
    
    COGNITIVE_CHOICES = [
        ('recall', 'Recall'),
        ('apply', 'Apply'),
        ('analyze', 'Analyze'),
    ]
    
    atom = models.ForeignKey(TeachingAtom, on_delete=models.CASCADE, related_name='questions')
    difficulty = models.CharField(max_length=10, choices=DIFFICULTY_CHOICES)
    cognitive_operation = models.CharField(max_length=10, choices=COGNITIVE_CHOICES)
    estimated_time = models.IntegerField(default=60)  # in seconds
    question_text = models.TextField()
    options = models.JSONField(default=list)
    correct_index = models.IntegerField()
    
    def to_dict(self):
        return {
            'id': self.id,
            'difficulty': self.difficulty,
            'cognitive_operation': self.cognitive_operation,
            'estimated_time': self.estimated_time,
            'question': self.question_text,
            'options': self.options,
            'correct_index': self.correct_index,
        }

class StudentProgress(models.Model):
    """Track student progress on atoms — enriched for 10-feature pacing engine."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='progress')
    atom = models.ForeignKey(TeachingAtom, on_delete=models.CASCADE)
    mastery_score = models.FloatField(default=0.3)
    phase = models.CharField(max_length=20, choices=TeachingAtom.PHASE_CHOICES, default='diagnostic')
    streak = models.IntegerField(default=0)
    hint_usage = models.IntegerField(default=0)
    error_history = models.JSONField(default=list)
    retention_verified = models.BooleanField(default=False)
    last_practiced = models.DateTimeField(auto_now=True)
    times_practiced = models.IntegerField(default=0)

    # ── Feature 2: per-atom learning speed ──
    time_per_question = models.JSONField(default=list, blank=True)  # list of floats (seconds)

    # ── Feature 6: retention tracking ──
    retention_score = models.FloatField(default=1.0)
    retention_checks_passed = models.IntegerField(default=0)
    retention_checks_failed = models.IntegerField(default=0)
    next_review_at = models.DateTimeField(null=True, blank=True)

    # ── Feature 10: velocity snapshots ──
    velocity_snapshots = models.JSONField(default=list, blank=True)

    class Meta:
        unique_together = ['user', 'atom']


    
class KnowledgeLevel(models.TextChoices):
    ZERO = 'zero', 'Zero Knowledge'
    BEGINNER = 'beginner', 'Beginner'
    INTERMEDIATE = 'intermediate', 'Intermediate'
    ADVANCED = 'advanced', 'Advanced'


class LearningSession(models.Model):
    """Track learning sessions — enriched for 10-feature pacing engine."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='learning_sessions')
    concept = models.ForeignKey(Concept, on_delete=models.CASCADE)
    start_time = models.DateTimeField(auto_now_add=True)
    end_time = models.DateTimeField(null=True, blank=True)
    questions_answered = models.IntegerField(default=0)
    correct_answers = models.IntegerField(default=0)
    hints_used = models.IntegerField(default=0)
    session_data = models.JSONField(default=dict)
    knowledge_level = models.CharField(
        max_length=20,
        choices=KnowledgeLevel.choices,
        default=KnowledgeLevel.ZERO
    )
    user_feedback = models.JSONField(default=dict)

    # ── Feature 8: fatigue tracking ──
    fatigue_level = models.CharField(max_length=20, default='fresh')   # fresh|mild|moderate|high|critical
    break_count = models.IntegerField(default=0)
    last_break_at = models.DateTimeField(null=True, blank=True)

    # ── Feature 9: engagement ──
    engagement_score = models.FloatField(default=0.7)
    consecutive_skips = models.IntegerField(default=0)

    # ── Feature 10: session-level velocity snapshots ──
    velocity_data = models.JSONField(default=list, blank=True)  
    



