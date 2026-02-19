import json
import logging
from django.utils import timezone
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken

from .models import (
    Concept, TeachingAtom, Question, StudentProgress, 
    LearningSession, LearningProfile, KnowledgeLevel
)
from .serializers import (
    RegisterSerializer, UserSerializer, ConceptSerializer,
    TeachingAtomSerializer, QuestionSerializer
)
from learning_engine.question_generator import QuestionGenerator
from learning_engine.adaptive_flow import AdaptiveLearningEngine
from learning_engine.knowledge_tracing import (
    bkt_update, update_theta, classify_behavior, 
    update_mastery_from_behavior, classify_error_type
)

logger = logging.getLogger(__name__)

# ==================== AUTH VIEWS ====================

class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({
                'user': UserSerializer(user).data,
                'message': 'User created successfully'
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        
        user = authenticate(username=username, password=password)
        
        if user:
            refresh = RefreshToken.for_user(user)
            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': UserSerializer(user).data
            })
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)


class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            profile = request.user.learning_profile
        except:
            profile = LearningProfile.objects.create(user=request.user)
        
        return Response({
            'user': UserSerializer(request.user).data,
            'dashboard_data': {
                'learning_streak': profile.learning_streak,
                'total_time_spent': profile.total_time_spent,
                'overall_theta': profile.overall_theta
            },
            'message': f'Welcome back, {request.user.first_name}!'
        })


# ==================== CONCEPT MANAGEMENT ====================

class ConceptListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        concepts = Concept.objects.all()
        serializer = ConceptSerializer(concepts, many=True)
        return Response(serializer.data)


class GenerateConceptView(APIView):
    """Step 1: Generate atoms for a concept (no questions yet)"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        subject = request.data.get('subject')
        concept_name = request.data.get('concept')
        knowledge_level = request.data.get('knowledge_level', 'intermediate')
        
        if not subject or not concept_name:
            return Response({'error': 'Subject and concept are required'}, status=400)
        
        # Check if concept already exists for this user
        concept, created = Concept.objects.get_or_create(
            name=concept_name,
            subject=subject,
            created_by=request.user,
            defaults={'description': f'{concept_name} in {subject}'}
        )
        
        # Generate atoms using AI
        generator = QuestionGenerator()
        atoms = generator.generate_atoms(subject, concept_name)
        
        if not atoms:
            return Response({'error': 'Failed to generate atoms'}, status=500)
        
        # Create atom records (without questions)
        atom_objects = []
        for i, atom_name in enumerate(atoms):
            atom, _ = TeachingAtom.objects.get_or_create(
                name=atom_name,
                concept=concept,
                defaults={'order': i}
            )
            atom_objects.append({
                'id': atom.id,
                'name': atom.name,
                'order': atom.order
            })
        
        return Response({
            'concept_id': concept.id,
            'concept_name': concept.name,
            'subject': concept.subject,
            'atoms': atom_objects,
            'knowledge_level': knowledge_level,
            'message': f'Generated {len(atoms)} atoms for {concept_name}'
        })


# ==================== TEACHING-FIRST FLOW WITH PACING ====================

class StartTeachingSessionView(APIView):
    """Step 2: Start a learning session for a concept"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        concept_id = request.data.get('concept_id')
        knowledge_level = request.data.get('knowledge_level', 'intermediate')
        
        try:
            concept = Concept.objects.get(id=concept_id)
        except Concept.DoesNotExist:
            return Response({'error': 'Concept not found'}, status=404)
        
        # Create learning session
        session = LearningSession.objects.create(
            user=request.user,
            concept=concept,
            knowledge_level=knowledge_level,
            session_data={
                'current_atom_index': 0,
                'completed_atoms': [],
                'current_phase': 'teaching',
                'pacing_history': [],
                'performance_history': []
            }
        )
        
        # Get or create atom progress records
        atoms = TeachingAtom.objects.filter(concept=concept).order_by('order')
        atom_list = []
        
        for atom in atoms:
            progress, _ = StudentProgress.objects.get_or_create(
                user=request.user,
                atom=atom,
                defaults={'phase': 'teaching'}
            )
            atom_list.append({
                'id': atom.id,
                'name': atom.name,
                'phase': progress.phase,
                'mastery_score': progress.mastery_score,
                'order': atom.order
            })
        
        # Determine initial pacing based on knowledge level
        engine = AdaptiveLearningEngine()
        initial_pacing = engine.determine_pacing(
            diagnostic_results={'accuracy': 0.5},  # Default
            knowledge_level=knowledge_level
        )
        
        return Response({
            'session_id': session.id,
            'concept_id': concept.id,
            'concept_name': concept.name,
            'atoms': atom_list,
            'knowledge_level': knowledge_level,
            'current_atom_index': 0,
            'initial_pacing': initial_pacing,
            'pacing_recommendation': self._get_pacing_message(initial_pacing)
        })
    
    def _get_pacing_message(self, pacing):
        messages = {
            'sharp_slowdown': 'Take it very slow - focus on fundamentals',
            'slow_down': 'Take your time with each concept',
            'stay': 'Maintain your current pace',
            'speed_up': "You're ready to move faster!"
        }
        return messages.get(pacing, 'Learn at your own pace')


class GetTeachingContentView(APIView):
    """Step 3: Get teaching content for an atom"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        session_id = request.data.get('session_id')
        atom_id = request.data.get('atom_id')
        
        try:
            session = LearningSession.objects.get(id=session_id, user=request.user)
            atom = TeachingAtom.objects.get(id=atom_id)
        except (LearningSession.DoesNotExist, TeachingAtom.DoesNotExist):
            return Response({'error': 'Session or atom not found'}, status=404)
        
        # Get or create progress
        progress, _ = StudentProgress.objects.get_or_create(
            user=request.user,
            atom=atom,
            defaults={'phase': 'teaching'}
        )
        
        # Get pacing from session data
        session_data = session.session_data
        pacing_history = session_data.get('pacing_history', [])
        current_pacing = pacing_history[-1] if pacing_history else 'stay'
        
        # Generate teaching content if not already cached
        if not atom.explanation:
            engine = AdaptiveLearningEngine()
            
            # Adjust teaching based on pacing
            level_adjustment = self._adjust_for_pacing(session.knowledge_level, current_pacing)
            
            teaching_content = engine.generate_teaching_content(
                atom_name=atom.name,
                subject=atom.concept.subject,
                concept=atom.concept.name,
                knowledge_level=level_adjustment
            )
            
            # Save to atom for future use
            atom.explanation = teaching_content.get('explanation', '')
            atom.analogy = teaching_content.get('analogy', '')
            atom.examples = [teaching_content.get('example', '')]
            atom.save()
        else:
            teaching_content = {
                'explanation': atom.explanation,
                'analogy': atom.analogy,
                'examples': atom.examples
            }
        
        # Update session data
        session_data['current_atom_index'] = atom.order
        session_data['current_phase'] = 'teaching'
        session.session_data = session_data
        session.save()
        
        return Response({
            'atom_id': atom.id,
            'atom_name': atom.name,
            'teaching_content': teaching_content,
            'phase': progress.phase,
            'current_pacing': current_pacing
        })
    
    def _adjust_for_pacing(self, base_level, pacing):
        """Adjust knowledge level based on pacing"""
        if pacing == 'sharp_slowdown':
            # Treat as more beginner
            if base_level == 'advanced':
                return 'intermediate'
            elif base_level == 'intermediate':
                return 'beginner'
            else:
                return 'zero'
        elif pacing == 'slow_down':
            # Slightly reduce level
            if base_level == 'advanced':
                return 'intermediate'
            elif base_level == 'intermediate':
                return 'beginner'
        elif pacing == 'speed_up':
            # Slightly increase level
            if base_level == 'beginner':
                return 'intermediate'
            elif base_level == 'intermediate':
                return 'advanced'
        
        return base_level


class GenerateQuestionsFromTeachingView(APIView):
    """Step 4: Generate questions after teaching with pacing consideration"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        session_id = request.data.get('session_id')
        atom_id = request.data.get('atom_id')
        
        try:
            session = LearningSession.objects.get(id=session_id, user=request.user)
            atom = TeachingAtom.objects.get(id=atom_id)
        except (LearningSession.DoesNotExist, TeachingAtom.DoesNotExist):
            return Response({'error': 'Session or atom not found'}, status=404)
        
        # Get progress
        progress, _ = StudentProgress.objects.get_or_create(
            user=request.user,
            atom=atom
        )
        
        # Update phase
        progress.phase = 'diagnostic'
        progress.save()
        
        # Get current pacing
        session_data = session.session_data
        pacing_history = session_data.get('pacing_history', [])
        current_pacing = pacing_history[-1] if pacing_history else 'stay'
        
        # Check if questions already exist
        questions = Question.objects.filter(atom=atom)
        
        if not questions.exists():
            # Generate questions based on knowledge level AND pacing
            generator = QuestionGenerator()
            
            # Determine question distribution based on knowledge level and pacing
            level_config = self._get_question_distribution(session.knowledge_level, current_pacing)
            
            # Generate questions
            generated = generator.generate_questions(
                subject=atom.concept.subject,
                concept=atom.concept.name,
                atom=atom.name,
                need_easy=level_config['easy'],
                need_medium=level_config['medium'],
                # need_hard=level_config.get('hard', 0),
                knowledge_level=session.knowledge_level
            )
            
            # Save questions to database
            for q_data in generated:
                Question.objects.create(
                    atom=atom,
                    difficulty=q_data['difficulty'],
                    cognitive_operation=q_data['cognitive_operation'],
                    estimated_time=self._adjust_time_for_pacing(
                        q_data['estimated_time'], 
                        current_pacing
                    ),
                    question_text=q_data['question'],
                    options=q_data['options'],
                    correct_index=q_data['correct_index']
                )
            
            questions = Question.objects.filter(atom=atom)
        
        # Prepare response
        questions_data = []
        for q in questions:
            q_dict = q.to_dict()
            # Remove correct index for client
            q_dict.pop('correct_index', None)
            questions_data.append(q_dict)
        
        # Update session
        session_data['current_phase'] = 'questions'
        session.session_data = session_data
        session.save()
        
        return Response({
            'atom_id': atom.id,
            'atom_name': atom.name,
            'questions': questions_data,
            'total_questions': len(questions_data),
            'current_pacing': current_pacing
        })
    
    def _get_question_distribution(self, knowledge_level, pacing):
        """Get question distribution based on level and pacing"""
        base_configs = {
            'zero': {'easy': 4, 'medium': 0, 'hard': 0},
            'beginner': {'easy': 3, 'medium': 1, 'hard': 0},
            'intermediate': {'easy': 2, 'medium': 2, 'hard': 0},
            'advanced': {'easy': 1, 'medium': 2, 'hard': 1}
        }
        
        config = base_configs.get(knowledge_level, base_configs['intermediate']).copy()
        
        # Adjust based on pacing
        if pacing == 'sharp_slowdown':
            # More easy questions
            config['easy'] += 1
            if config['medium'] > 0:
                config['medium'] -= 1
        elif pacing == 'slow_down':
            # Shift towards easier
            if config['medium'] > 0 and config['easy'] < 4:
                config['medium'] -= 1
                config['easy'] += 1
        elif pacing == 'speed_up':
            # Add a challenge
            if config['hard'] < 2 and config['easy'] > 0:
                config['easy'] -= 1
                config['hard'] += 1
        
        return config
    
    def _adjust_time_for_pacing(self, base_time, pacing):
        """Adjust allowed time based on pacing"""
        multipliers = {
            'sharp_slowdown': 1.5,  # More time
            'slow_down': 1.2,        # Extra time
            'stay': 1.0,              # Normal time
            'speed_up': 0.8           # Less time (challenge)
        }
        return int(base_time * multipliers.get(pacing, 1.0))


class SubmitAtomAnswerView(APIView):
    """Step 5: Submit answer and update mastery with pacing"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        session_id = request.data.get('session_id')
        atom_id = request.data.get('atom_id')
        question_index = request.data.get('question_index')
        selected = request.data.get('selected')
        time_taken = request.data.get('time_taken', 30)
        
        try:
            session = LearningSession.objects.get(id=session_id, user=request.user)
            atom = TeachingAtom.objects.get(id=atom_id)
            questions = list(Question.objects.filter(atom=atom).order_by('id'))
            
            if question_index >= len(questions):
                return Response({'error': 'Invalid question index'}, status=400)
            
            question = questions[question_index]
        except (LearningSession.DoesNotExist, TeachingAtom.DoesNotExist):
            return Response({'error': 'Session or atom not found'}, status=404)
        
        # Get progress
        progress, _ = StudentProgress.objects.get_or_create(
            user=request.user,
            atom=atom
        )
        
        # Check if correct
        is_correct = (selected == question.correct_index)
        
        # Classify behavior (considers time)
        behavior = classify_behavior(
            correct=is_correct,
            time_taken=time_taken,
            estimated_time=question.estimated_time
        )
        
        # Classify error type if incorrect
        error_type = None
        if not is_correct:
            error_type = classify_error_type(
                question={'question': question.question_text, 'difficulty': question.difficulty},
                answer=selected,
                time_taken=time_taken,
                atom_name=atom.name
            )
            if error_type:
                progress.error_history.append(error_type)
        
        # Update mastery score using BKT
        old_mastery = progress.mastery_score
        
        # Adjust BKT parameters based on pacing
        session_data = session.session_data
        pacing_history = session_data.get('pacing_history', [])
        current_pacing = pacing_history[-1] if pacing_history else 'stay'
        
        bkt_params = self._get_bkt_params_for_pacing(current_pacing)
        
        progress.mastery_score = bkt_update(
            p_know=progress.mastery_score,
            correct=is_correct,
            p_slip=bkt_params['slip'],
            p_guess=bkt_params['guess'],
            p_learn=bkt_params['learn']
        )
        
        # Update streak
        if is_correct:
            progress.streak += 1
        else:
            progress.streak = 0
        
        progress.times_practiced += 1
        progress.save()
        
        # Update user's overall theta
        profile = request.user.learning_profile
        profile.overall_theta = update_theta(
            theta=profile.overall_theta,
            correct=is_correct,
            b=0.5 if question.difficulty == 'medium' else (0 if question.difficulty == 'easy' else 1.0),
            a=1.0
        )
        profile.save()
        
        # Update session stats
        session.questions_answered += 1
        if is_correct:
            session.correct_answers += 1
        
        # Store performance in session data
        performance = session_data.get('performance_history', [])
        performance.append({
            'atom_id': atom.id,
            'question_index': question_index,
            'correct': is_correct,
            'time_taken': time_taken,
            'behavior': behavior,
            'mastery_after': progress.mastery_score
        })
        session_data['performance_history'] = performance[-10:]  # Keep last 10
        session.session_data = session_data
        session.save()
        
        # Check if this was the last question
        is_last = (question_index == len(questions) - 1)
        
        return Response({
            'correct': is_correct,
            'correct_index': question.correct_index if not is_correct else None,
            'new_mastery': progress.mastery_score,
            'old_mastery': old_mastery,
            'improvement': progress.mastery_score - old_mastery,
            'streak': progress.streak,
            'behavior': behavior,
            'error_type': error_type,
            'is_last': is_last,
            'current_pacing': current_pacing
        })
    
    def _get_bkt_params_for_pacing(self, pacing):
        """Adjust BKT parameters based on pacing"""
        params = {
            'sharp_slowdown': {'slip': 0.15, 'guess': 0.25, 'learn': 0.10},  # More cautious
            'slow_down': {'slip': 0.12, 'guess': 0.22, 'learn': 0.12},       # Slightly cautious
            'stay': {'slip': 0.10, 'guess': 0.20, 'learn': 0.15},             # Default
            'speed_up': {'slip': 0.08, 'guess': 0.18, 'learn': 0.18}          # Faster learning
        }
        return params.get(pacing, params['stay'])


class CompleteAtomView(APIView):
    """Step 6: Complete atom - CALCULATE EVERYTHING and DECIDE next action"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        session_id = request.data.get('session_id')
        atom_id = request.data.get('atom_id')
        
        try:
            session = LearningSession.objects.get(id=session_id, user=request.user)
            atom = TeachingAtom.objects.get(id=atom_id)
            progress = StudentProgress.objects.get(user=request.user, atom=atom)
        except (LearningSession.DoesNotExist, TeachingAtom.DoesNotExist, StudentProgress.DoesNotExist):
            return Response({'error': 'Session, atom, or progress not found'}, status=404)
        
        # ========== STEP 1: COLLECT ALL PERFORMANCE DATA ==========
        
        # Get all questions for this atom
        questions = list(Question.objects.filter(atom=atom).order_by('id'))
        
        # Get performance history for this atom from session
        session_data = session.session_data
        performance = session_data.get('performance_history', [])
        atom_performance = [p for p in performance if p.get('atom_id') == atom.id]
        
        # Calculate detailed metrics
        total_questions = len(questions)
        answered_questions = len(atom_performance)
        
        if answered_questions == 0:
            return Response({'error': 'No questions answered for this atom'}, status=400)
        
        # Basic metrics
        correct_count = sum(1 for p in atom_performance if p['correct'])
        accuracy = correct_count / answered_questions
        
        # Time metrics
        time_taken_list = [p.get('time_taken', 30) for p in atom_performance]
        avg_time_per_question = sum(time_taken_list) / len(time_taken_list)
        
        estimated_times = [q.estimated_time for q in questions]
        total_estimated_time = sum(estimated_times)
        total_time_taken = sum(time_taken_list)
        time_ratio = total_time_taken / total_estimated_time if total_estimated_time > 0 else 1.0
        
        # ========== STEP 2: CALCULATE BKT PARAMETERS ==========
        
        # Current mastery from BKT (already updated per question)
        current_mastery = progress.mastery_score
        
        # Calculate learning rate (how fast they improved)
        if len(atom_performance) >= 2:
            first_mastery = atom_performance[0].get('mastery_before', 0.3)
            last_mastery = atom_performance[-1].get('mastery_after', current_mastery)
            learning_rate = (last_mastery - first_mastery) / len(atom_performance)
        else:
            learning_rate = 0.15  # Default
        
        # Calculate slip probability (wrong when they know)
        # Look for patterns: correct then wrong on similar difficulty
        slip_events = 0
        for i, p in enumerate(atom_performance):
            if not p['correct'] and i > 0 and atom_performance[i-1]['correct']:
                # Wrong after being correct - possible slip
                slip_events += 1
        slip_prob = slip_events / max(answered_questions, 1)
        
        # Calculate guess probability (correct when they don't know)
        # Look for fast correct answers when mastery was low
        guess_events = 0
        for i, p in enumerate(atom_performance):
            if p['correct'] and p.get('mastery_before', 0.3) < 0.4 and p.get('time_taken', 30) < 10:
                # Fast correct when mastery low - possible guess
                guess_events += 1
        guess_prob = guess_events / max(answered_questions, 1)
        
        # ========== STEP 3: CALCULATE THETA (IRT ABILITY) ==========
        
        # Current theta from user profile
        current_theta = request.user.learning_profile.overall_theta
        
        # Calculate theta change
        theta_before = session_data.get('theta_before_atom', current_theta)
        
        # Update theta based on performance
        question_difficulties = []
        for i, q in enumerate(questions):
            if i < len(atom_performance):
                # Map difficulty to numeric value
                if q.difficulty == 'easy':
                    b = -0.5
                elif q.difficulty == 'medium':
                    b = 0.5
                else:  # hard
                    b = 1.5
                question_difficulties.append(b)
        
        # Calculate theta update using IRT
        from learning_engine.knowledge_tracing import update_theta
        
        theta_updates = []
        for i, p in enumerate(atom_performance):
            if i < len(question_difficulties):
                new_theta = update_theta(
                    theta=current_theta,
                    correct=p['correct'],
                    b=question_difficulties[i],
                    a=1.0,
                    lr=0.2
                )
                theta_updates.append(new_theta)
        
        # Final theta after atom
        final_theta = theta_updates[-1] if theta_updates else current_theta
        theta_change = final_theta - current_theta
        
        # ========== STEP 4: ANALYZE ERROR PATTERNS ==========
        
        # Classify error types
        error_types = progress.error_history[-10:]  # Last 10 errors
        
        conceptual_errors = sum(1 for e in error_types if e == 'conceptual')
        procedural_errors = sum(1 for e in error_types if e == 'procedural')
        factual_errors = sum(1 for e in error_types if e == 'factual')
        guessing_errors = sum(1 for e in error_types if e == 'guessing')
        
        # Calculate error severity
        error_severity = 'low'
        if conceptual_errors >= 2:
            error_severity = 'high'
        elif conceptual_errors >= 1 or procedural_errors >= 2:
            error_severity = 'medium'
        
        # ========== STEP 5: CALCULATE MASTERY CONFIDENCE ==========
        
        # Mastery confidence based on consistency
        if len(atom_performance) >= 3:
            recent_performance = atom_performance[-3:]
            recent_correct = sum(1 for p in recent_performance if p['correct'])
            consistency = recent_correct / 3
            
            if consistency >= 0.67 and current_mastery >= 0.7:
                mastery_confidence = 'high'
            elif consistency >= 0.5 or current_mastery >= 0.6:
                mastery_confidence = 'medium'
            else:
                mastery_confidence = 'low'
        else:
            mastery_confidence = 'low' if current_mastery < 0.6 else 'medium'
        
        # ========== STEP 6: DETERMINE PACING DECISION ==========
        
        # Prepare diagnostic results for pacing engine
        diagnostic_results = {
            'accuracy': accuracy,
            'mastery': current_mastery,
            'streak': progress.streak,
            'error_types': error_types[-3:],
            'time_ratio': time_ratio,
            'learning_rate': learning_rate,
            'theta_change': theta_change,
            'consistency': consistency if len(atom_performance) >= 3 else 0.5
        }
        
        engine = AdaptiveLearningEngine()
        pacing = engine.determine_pacing(
            diagnostic_results=diagnostic_results,
            knowledge_level=session.knowledge_level
        )
        
        # ========== STEP 7: MAKE AUTOMATIC DECISION ==========
        
        # Mark atom as complete
        progress.phase = 'complete'
        progress.retention_verified = True
        progress.save()
        
        # Update user's theta
        profile = request.user.learning_profile
        profile.overall_theta = final_theta
        profile.save()
        
        # Update session data
        completed = session_data.get('completed_atoms', [])
        if atom.id not in completed:
            completed.append(atom.id)
        session_data['completed_atoms'] = completed
        
        # Store all calculated metrics
        session_data['last_atom_metrics'] = {
            'atom_id': atom.id,
            'accuracy': accuracy,
            'final_mastery': current_mastery,
            'theta_before': current_theta,
            'theta_after': final_theta,
            'theta_change': theta_change,
            'avg_time': avg_time_per_question,
            'time_ratio': time_ratio,
            'learning_rate': learning_rate,
            'slip_prob': slip_prob,
            'guess_prob': guess_prob,
            'error_types': error_types[-5:],
            'mastery_confidence': mastery_confidence
        }
        
        # Get next atom
        next_atom = TeachingAtom.objects.filter(
            concept=atom.concept,
            order__gt=atom.order
        ).order_by('order').first()
        
        all_atoms = TeachingAtom.objects.filter(concept=atom.concept).count()
        all_completed = len(completed) >= all_atoms
        
        # ========== STEP 8: DETERMINE NEXT ACTION (AUTOMATIC) ==========
        
        next_action = 'unknown'
        action_reason = ''
        
        if all_completed:
            # All atoms done
            next_action = 'concept_complete'
            action_reason = 'All atoms in this concept have been mastered.'
            
            # End session
            session.end_time = timezone.now()
            session.save()
            
        else:
            # Decide based on metrics
            if current_mastery < 0.5 or accuracy < 0.4 or conceptual_errors >= 2:
                # Poor performance - FORCE REVIEW
                next_action = 'review_current'
                action_reason = 'Mastery too low - review required before proceeding'
                
            elif current_mastery < 0.7 or accuracy < 0.7:
                # Marginal performance - offer choice but with strong recommendation
                if pacing == 'sharp_slowdown':
                    next_action = 'recommend_review'
                    action_reason = 'Performance suggests you need more practice'
                elif pacing == 'slow_down':
                    next_action = 'recommend_practice'
                    action_reason = 'Additional practice would be beneficial'
                else:
                    next_action = 'optional_continue'
                    action_reason = 'You can continue, but review is optional'
                    
            elif current_mastery >= 0.8 and accuracy >= 0.8:
                # Excellent performance - AUTO ADVANCE
                next_action = 'auto_advance'
                action_reason = 'Excellent mastery - automatically advancing'
                
            elif current_mastery >= 0.7 and accuracy >= 0.75 and time_ratio < 1.2:
                # Good performance - recommend advance
                next_action = 'recommend_advance'
                action_reason = 'Good performance - ready for next concept'
                
            else:
                # Default - let user decide but with recommendation
                if next_atom:
                    next_action = 'user_choice'
                    action_reason = 'Ready to continue?'
            
            # If there's no next atom, handle that
            if not next_atom:
                next_action = 'concept_complete'
                action_reason = 'No more atoms in this concept'
        
        # Store pacing decision
        pacing_history = session_data.get('pacing_history', [])
        pacing_history.append({
            'atom_id': atom.id,
            'pacing': pacing,
            'accuracy': accuracy,
            'mastery': current_mastery,
            'theta': final_theta,
            'next_action': next_action,
            'timestamp': str(timezone.now())
        })
        session_data['pacing_history'] = pacing_history
        session_data['last_pacing'] = pacing
        session.session_data = session_data
        session.save()
        
        # ========== STEP 9: BUILD COMPREHENSIVE RESPONSE ==========
        
        response_data = {
            # Atom completion status
            'atom_completed': True,
            'atom_id': atom.id,
            'atom_name': atom.name,
            
            # ===== ALL CALCULATED METRICS =====
            'metrics': {
                # Basic performance
                'accuracy': accuracy,
                'correct_count': correct_count,
                'total_questions': answered_questions,
                
                # BKT parameters
                'final_mastery': current_mastery,
                'mastery_improvement': current_mastery - session_data.get('initial_mastery', 0.3),
                'learning_rate': learning_rate,
                'slip_probability': slip_prob,
                'guess_probability': guess_prob,
                
                # IRT theta
                'theta_before': current_theta,
                'theta_after': final_theta,
                'theta_change': theta_change,
                
                # Time analysis
                'avg_time_per_question': avg_time_per_question,
                'total_time_taken': total_time_taken,
                'total_estimated_time': total_estimated_time,
                'time_ratio': time_ratio,
                'time_efficiency': 'fast' if time_ratio < 0.8 else 'normal' if time_ratio < 1.2 else 'slow',
                
                # Error analysis
                'error_count': len(error_types),
                'conceptual_errors': conceptual_errors,
                'procedural_errors': procedural_errors,
                'factual_errors': factual_errors,
                'guessing_errors': guessing_errors,
                'error_severity': error_severity,
                
                # Confidence
                'mastery_confidence': mastery_confidence,
                'consistency': consistency if len(atom_performance) >= 3 else None,
            },
            
            # ===== PACING DECISION =====
            'pacing': {
                'decision': pacing,
                'explanation': self._get_pacing_explanation(pacing, diagnostic_results),
                'recommendation': self._get_pacing_recommendation(pacing, accuracy, current_mastery),
                'icon': self._get_pacing_icon(pacing),
                'color': self._get_pacing_color(pacing)
            },
            
            # ===== NEXT ACTION (AUTOMATIC) =====
            'next_action': {
                'action': next_action,
                'reason': action_reason,
                'auto_proceed': next_action in ['auto_advance', 'review_current', 'concept_complete'],
                'user_choice_required': next_action in ['user_choice', 'optional_continue', 'recommend_practice', 'recommend_review', 'recommend_advance']
            },
            
            # Next atom if applicable
            'next_atom': None,
            'all_completed': all_completed
        }
        
        # Add next atom info if exists
        if next_atom and not all_completed:
            next_progress = StudentProgress.objects.get(user=request.user, atom=next_atom)
            response_data['next_atom'] = {
                'id': next_atom.id,
                'name': next_atom.name,
                'phase': next_progress.phase,
                'order': next_atom.order,
                'current_mastery': next_progress.mastery_score
            }
        
        # Add completion message
        if all_completed:
            response_data['completion_message'] = '🎉 Congratulations! You have mastered all atoms in this concept!'
            
            # Calculate overall concept mastery
            concept_atoms = TeachingAtom.objects.filter(concept=atom.concept)
            concept_mastery = sum(StudentProgress.objects.get(user=request.user, atom=a).mastery_score for a in concept_atoms) / len(concept_atoms)
            response_data['concept_mastery'] = concept_mastery
        
        return Response(response_data)
    
    def _get_pacing_explanation(self, pacing, results):
        """Get detailed explanation for pacing decision"""
        accuracy = results.get('accuracy', 0)
        mastery = results.get('mastery', 0)
        
        if pacing == 'sharp_slowdown':
            return f"Critical: {accuracy:.0%} accuracy and {mastery:.0%} mastery indicate fundamental gaps"
        elif pacing == 'slow_down':
            return f"Caution: {accuracy:.0%} accuracy suggests need for more careful learning"
        elif pacing == 'stay':
            return f"Balanced: {accuracy:.0%} accuracy shows good progress at current pace"
        elif pacing == 'speed_up':
            return f"Excellent: {accuracy:.0%} accuracy shows readiness for faster pace"
        return "Continue at current pace"
    
    def _get_pacing_recommendation(self, pacing, accuracy, mastery):
        """Get human-readable recommendation"""
        recommendations = {
            'sharp_slowdown': f'⚠️ URGENT: Review required. Score: {accuracy:.0%}, Mastery: {mastery:.0%}',
            'slow_down': f'⏸️ Slow down and practice more. Score: {accuracy:.0%}',
            'stay': f'👉 Keep going at this pace. Score: {accuracy:.0%}',
            'speed_up': f'🚀 Accelerate! You\'re ready. Score: {accuracy:.0%}'
        }
        return recommendations.get(pacing, 'Continue learning')
    
    def _get_pacing_icon(self, pacing):
        icons = {
            'sharp_slowdown': '⚠️',
            'slow_down': '⏸️',
            'stay': '👉',
            'speed_up': '🚀'
        }
        return icons.get(pacing, '•')
    
    def _get_pacing_color(self, pacing):
        colors = {
            'sharp_slowdown': 'red',
            'slow_down': 'orange',
            'stay': 'blue',
            'speed_up': 'green'
        }
        return colors.get(pacing, 'gray')

class GetLearningProgressView(APIView):
    """Get overall learning progress with pacing history"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        profile = request.user.learning_profile
        
        # Get all progress records
        progress_records = StudentProgress.objects.filter(
            user=request.user
        ).select_related('atom__concept')
        
        # Get recent sessions for pacing analysis
        recent_sessions = LearningSession.objects.filter(
            user=request.user
        ).order_by('-start_time')[:5]
        
        pacing_trend = []
        for session in recent_sessions:
            session_data = session.session_data
            pacing_history = session_data.get('pacing_history', [])
            if pacing_history:
                pacing_trend.append({
                    'concept': session.concept.name,
                    'date': session.start_time,
                    'final_pacing': pacing_history[-1].get('pacing') if pacing_history else None
                })
        
        # Group by concept
        concepts_data = {}
        for p in progress_records:
            concept_name = p.atom.concept.name
            if concept_name not in concepts_data:
                concepts_data[concept_name] = {
                    'name': concept_name,
                    'subject': p.atom.concept.subject,
                    'atoms': [],
                    'mastered_count': 0,
                    'total_count': 0
                }
            
            concepts_data[concept_name]['atoms'].append({
                'name': p.atom.name,
                'mastery': p.mastery_score,
                'phase': p.phase,
                'streak': p.streak,
                'hint_usage': p.hint_usage,
                'error_count': len(p.error_history)
            })
            concepts_data[concept_name]['total_count'] += 1
            if p.phase == 'complete':
                concepts_data[concept_name]['mastered_count'] += 1
        
        # Calculate overall mastery
        if progress_records:
            overall_mastery = sum(p.mastery_score for p in progress_records) / len(progress_records)
        else:
            overall_mastery = 0
        
        return Response({
            'overall_mastery': overall_mastery,
            'overall_theta': profile.overall_theta,
            'learning_streak': profile.learning_streak,
            'concepts': list(concepts_data.values()),
            'total_atoms': progress_records.count(),
            'pacing_trend': pacing_trend,
            'recommended_pacing': self._get_recommended_pacing(pacing_trend)
        })
    
    def _get_recommended_pacing(self, pacing_trend):
        """Analyze pacing trend to give overall recommendation"""
        if not pacing_trend:
            return 'start'
        
        pacings = [p['final_pacing'] for p in pacing_trend if p['final_pacing']]
        if not pacings:
            return 'normal'
        
        # Count occurrences
        sharp_count = pacings.count('sharp_slowdown')
        slow_count = pacings.count('slow_down')
        speed_count = pacings.count('speed_up')
        
        if sharp_count > len(pacings) / 2:
            return 'needs_foundation'
        elif slow_count > len(pacings) / 2:
            return 'cautious'
        elif speed_count > len(pacings) / 2:
            return 'accelerated'
        else:
            return 'balanced'