from django.contrib.auth.models import User
from django.db.models import Q
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import RegisterSerializer, UserSerializer

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerializer

class LoginView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        identifier = (
            request.data.get('username')
            or request.data.get('email')
            or request.data.get('identifier')
        )
        password = request.data.get('password')

        if isinstance(identifier, str):
            identifier = identifier.strip()
        
        if not identifier or not password:
            return Response(
                {'error': 'Please provide both username/email and password'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = User.objects.filter(
            Q(username__iexact=identifier) | Q(email__iexact=identifier)
        ).first()
        
        if user is None:
            return Response(
                {'error': 'Invalid credentials'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        if not user.is_active:
            return Response(
                {'error': 'Account is disabled'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        if not user.check_password(password):
            return Response(
                {'error': 'Invalid credentials'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': UserSerializer(user).data
        })

class DashboardView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        user = request.user
        return Response({
            'message': f'Welcome to your dashboard, {user.first_name}!',
            'user': UserSerializer(user).data,
            'dashboard_data': {
                'total_courses': 5,
                'completed_assignments': 3,
                'upcoming_events': 2
            }
        })
        
        
        
from django.contrib.auth.models import User
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import (
    LearningProfile, Concept, TeachingAtom, 
    Question, StudentProgress, LearningSession
)
from .serializers import (
    ConceptSerializer, TeachingAtomSerializer, 
    QuestionSerializer, StudentProgressSerializer,
    LearningSessionSerializer
)
from learning_engine.adaptive_flow import AdaptiveLearningEngine
import json

# ... existing views ...

class ConceptListView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        subject = request.query_params.get('subject', '')
        access_filter = Q(created_by__isnull=True) | Q(created_by=request.user)
        concepts_qs = Concept.objects.filter(access_filter)
        concepts = concepts_qs.filter(subject__icontains=subject) if subject else concepts_qs
        serializer = ConceptSerializer(concepts, many=True)
        return Response(serializer.data)

class StartLearningSessionView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        concept_id = request.data.get('concept_id')
        
        try:
            concept = Concept.objects.get(
                Q(id=concept_id) & (Q(created_by__isnull=True) | Q(created_by=request.user))
            )
            
            # Create learning session
            session = LearningSession.objects.create(
                user=request.user,
                concept=concept
            )
            
            # Initialize progress for all atoms in this concept
            atoms = TeachingAtom.objects.filter(concept=concept)
            for atom in atoms:
                StudentProgress.objects.get_or_create(
                    user=request.user,
                    atom=atom,
                    defaults={'phase': 'diagnostic'}
                )
            
            # Diagnostic: 1 easy + 1 medium random question per atom
            import random

            def pick_random_question(atom_obj, difficulty, exclude_ids=None):
                exclude_ids = exclude_ids or []
                qs = Question.objects.filter(atom=atom_obj, difficulty=difficulty).exclude(id__in=exclude_ids)
                ids = list(qs.values_list('id', flat=True))
                if not ids:
                    return None
                return Question.objects.get(id=random.choice(ids))

            diagnostic_questions = []
            for atom in atoms:
                picked_ids = []

                easy_q = pick_random_question(atom, 'easy')
                if easy_q is not None:
                    picked_ids.append(easy_q.id)
                    q_dict = easy_q.to_dict()
                    q_dict['atom_id'] = atom.id
                    q_dict['atom_name'] = atom.name
                    diagnostic_questions.append(q_dict)

                medium_q = pick_random_question(atom, 'medium', exclude_ids=picked_ids)
                if medium_q is None:
                    # Fallback if no medium exists
                    medium_q = pick_random_question(atom, 'easy', exclude_ids=picked_ids)
                if medium_q is not None:
                    q_dict = medium_q.to_dict()
                    q_dict['atom_id'] = atom.id
                    q_dict['atom_name'] = atom.name
                    diagnostic_questions.append(q_dict)

            random.shuffle(diagnostic_questions)
            
            return Response({
                'session_id': session.id,
                'diagnostic_questions': diagnostic_questions,
                'total_atoms': atoms.count(),
                'total_diagnostic_questions': len(diagnostic_questions)
            })
            
        except Concept.DoesNotExist:
            return Response({'error': 'Concept not found'}, status=404)

class SubmitDiagnosticView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        session_id = request.data.get('session_id')
        answers = request.data.get('answers', [])
        
        try:
            session = LearningSession.objects.get(id=session_id, user=request.user)
            
            # Process answers and update progress
            results = {
                'correct': 0,
                'total': len(answers),
                'by_atom': {},
                'weak_atoms': []
            }
            
            for answer in answers:
                question_id = answer.get('question_id')
                selected = answer.get('selected')
                time_taken = answer.get('time_taken', 30)
                
                try:
                    question = Question.objects.get(id=question_id)
                    correct = (selected == question.correct_index)
                    
                    if correct:
                        results['correct'] += 1
                    
                    # Update atom stats
                    atom_id = question.atom_id
                    if atom_id not in results['by_atom']:
                        results['by_atom'][atom_id] = {'correct': 0, 'total': 0}
                    
                    results['by_atom'][atom_id]['total'] += 1
                    if correct:
                        results['by_atom'][atom_id]['correct'] += 1
                    
                    # Update progress
                    progress, _ = StudentProgress.objects.get_or_create(
                        user=request.user,
                        atom=question.atom
                    )
                    
                    # Simple BKT update
                    if not correct:
                        if time_taken < question.estimated_time * 0.5:
                            error_type = 'guessing'
                        else:
                            error_type = 'conceptual'
                        
                        error_history = progress.error_history or []
                        error_history.append(error_type)
                        progress.error_history = error_history[-10:]  # Keep last 10
                        progress.save()
                    
                except Question.DoesNotExist:
                    pass
            
            # Identify weak atoms
            accuracy = results['correct'] / results['total'] if results['total'] > 0 else 0

            # Build weak->strong sequence across ALL atoms in this concept
            concept_atom_ids = list(
                TeachingAtom.objects.filter(concept=session.concept).values_list('id', flat=True)
            )

            atom_accuracy = {}
            for atom_id in concept_atom_ids:
                stats = results['by_atom'].get(atom_id, {'correct': 0, 'total': 0})
                if stats['total'] > 0:
                    atom_accuracy[atom_id] = stats['correct'] / stats['total']
                else:
                    atom_accuracy[atom_id] = 0

            weak_threshold = 0.5
            results['weak_atoms'] = [aid for aid in concept_atom_ids if atom_accuracy.get(aid, 0) < weak_threshold]

            atom_sequence = sorted(
                concept_atom_ids,
                key=lambda aid: (atom_accuracy.get(aid, 0), aid)
            )

            # Move all atoms into teaching phase (we'll traverse weak->strong)
            StudentProgress.objects.filter(user=request.user, atom_id__in=concept_atom_ids).update(phase='teaching')
            
            # Update session stats
            session.questions_answered = results['total']
            session.correct_answers = results['correct']
            session.session_data = results
            session.save()
            
            # Determine pacing
            if accuracy < 0.4:
                pacing = 'sharp_slowdown'
            elif accuracy < 0.7:
                pacing = 'slow_down'
            else:
                pacing = 'speed_up'
            
            return Response({
                'accuracy': accuracy,
                'weak_atoms': results['weak_atoms'],
                'pacing': pacing,
                'next_atom': atom_sequence[0] if atom_sequence else None,
                'atom_sequence': atom_sequence,
                'atom_accuracy': atom_accuracy
            })
            
        except LearningSession.DoesNotExist:
            return Response({'error': 'Session not found'}, status=404)

class GetTeachingContentView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, atom_id):
        try:
            atom = TeachingAtom.objects.select_related('concept').get(
                Q(id=atom_id)
                & (Q(concept__created_by__isnull=True) | Q(concept__created_by=request.user))
            )
            
            # If no content, generate it using Groq (you'll need to implement this)
            if not atom.explanation:
                # Call learning engine to generate content
                engine = AdaptiveLearningEngine()
                content = engine.generate_teaching_content(
                    atom.name, 
                    atom.concept.subject, 
                    atom.concept.name
                )
                
                atom.explanation = content.get('explanation', '')
                atom.analogy = content.get('analogy', '')
                atom.examples = [content.get('example', ''), content.get('misconception', '')]
                atom.save()
            
            return Response({
                'id': atom.id,
                'name': atom.name,
                'explanation': atom.explanation,
                'analogy': atom.analogy,
                'examples': atom.examples
            })
            
        except TeachingAtom.DoesNotExist:
            return Response({'error': 'Atom not found'}, status=404)

class GetPracticeQuestionsView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, atom_id):
        difficulty = request.query_params.get('difficulty', 'easy')
        count = int(request.query_params.get('count', 3))
        
        try:
            atom = TeachingAtom.objects.select_related('concept').get(
                Q(id=atom_id)
                & (Q(concept__created_by__isnull=True) | Q(concept__created_by=request.user))
            )
            
            # Get questions of appropriate difficulty
            questions = Question.objects.filter(
                atom=atom,
                difficulty=difficulty
            )[:count]
            
            # Get student progress for adaptive hint level
            progress = StudentProgress.objects.get(
                user=request.user,
                atom=atom
            )
            
            questions_data = []
            for q in questions:
                q_dict = q.to_dict()
                # Don't send correct index to frontend for practice
                del q_dict['correct_index']
                q_dict['hint_level'] = progress.hint_usage
                questions_data.append(q_dict)
            
            return Response({
                'questions': questions_data,
                'hint_usage': progress.hint_usage,
                'mastery_score': progress.mastery_score
            })
            
        except (TeachingAtom.DoesNotExist, StudentProgress.DoesNotExist):
            return Response({'error': 'Not found'}, status=404)

class SubmitPracticeAnswerView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        question_id = request.data.get('question_id')
        selected = request.data.get('selected')
        time_taken = request.data.get('time_taken', 30)
        hint_used = request.data.get('hint_used', False)
        
        try:
            question = Question.objects.select_related('atom__concept').get(
                Q(id=question_id)
                & (Q(atom__concept__created_by__isnull=True) | Q(atom__concept__created_by=request.user))
            )
            correct = (selected == question.correct_index)
            
            # Get or create progress
            progress, _ = StudentProgress.objects.get_or_create(
                user=request.user,
                atom=question.atom
            )
            
            # Update hint usage
            if hint_used:
                progress.hint_usage += 1
            
            # Update mastery score using BKT
            from learning_engine.knowledge_tracing import bkt_update
            
            old_mastery = progress.mastery_score
            new_mastery = bkt_update(old_mastery, correct)
            progress.mastery_score = new_mastery
            
            # Update streak
            if correct:
                progress.streak += 1
            else:
                progress.streak = 0
                
                # Track error
                error_history = progress.error_history or []
                error_history.append({
                    'question_id': question_id,
                    'time_taken': time_taken,
                    'difficulty': question.difficulty
                })
                progress.error_history = error_history[-5:]
            
            progress.times_practiced += 1
            progress.save()
            
            # Determine next difficulty
            if new_mastery > 0.7 and progress.streak > 2:
                next_difficulty = 'medium'
            else:
                next_difficulty = 'easy'
            
            # Check if mastery achieved
            mastery_achieved = new_mastery >= 0.7 and progress.streak >= 2
            
            if mastery_achieved and progress.phase == 'practice':
                progress.phase = 'mastery_check'
                progress.save()
            
            return Response({
                'correct': correct,
                'mastery_score': new_mastery,
                'mastery_achieved': mastery_achieved,
                'next_difficulty': next_difficulty,
                'streak': progress.streak
            })
            
        except Question.DoesNotExist:
            return Response({'error': 'Question not found'}, status=404)

class GetHintView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        question_id = request.data.get('question_id')
        error_count = request.data.get('error_count', 0)
        
        try:
            question = Question.objects.select_related('atom__concept').get(
                Q(id=question_id)
                & (Q(atom__concept__created_by__isnull=True) | Q(atom__concept__created_by=request.user))
            )
            
            # Progressive hint system
            hints = [
                "Think about what the question is asking.",
                f"Consider how this relates to {question.atom.name}.",
            ]
            
            # Add specific hints based on question content
            q_text = question.question_text.lower()
            
            if "address" in q_text:
                hints.append("With N address lines, you can access 2^N locations.")
                hints.append("Each address line DOUBLES the possible memory size.")
            
            if "cache" in q_text:
                hints.append("Cache is closer to the CPU and faster, but smaller than RAM.")
                hints.append("Think of the hierarchy: CPU → Cache → RAM → Disk")
            
            if "mapping" in q_text:
                hints.append("Different memory types can use different address ranges.")
                hints.append("For example: 0000-7FFF might be ROM, 8000-FFFF might be RAM.")
            
            hint_level = min(error_count, len(hints) - 1)
            
            return Response({
                'hint': hints[hint_level],
                'hint_level': hint_level
            })
            
        except Question.DoesNotExist:
            return Response({'error': 'Question not found'}, status=404)

class GetLearningProgressView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        # Ensure user has a learning profile (older users may not)
        try:
            profile = request.user.learning_profile
        except Exception:
            profile, _ = LearningProfile.objects.get_or_create(user=request.user)

        # Get all progress for user
        progress = StudentProgress.objects.filter(user=request.user).select_related('atom__concept')
        
        # Group by concept
        concepts = {}
        for p in progress:
            concept_name = p.atom.concept.name
            if concept_name not in concepts:
                concepts[concept_name] = {
                    'name': concept_name,
                    'atoms': [],
                    'mastered_count': 0,
                    'total_count': 0
                }
            
            atom_data = {
                'name': p.atom.name,
                'mastery': p.mastery_score,
                'phase': p.phase,
                'streak': p.streak,
                'hint_usage': p.hint_usage,
                'retention_verified': p.retention_verified
            }
            
            concepts[concept_name]['atoms'].append(atom_data)
            concepts[concept_name]['total_count'] += 1
            if p.phase == 'complete':
                concepts[concept_name]['mastered_count'] += 1
        
        # Calculate overall mastery
        total_atoms = len(progress)
        if total_atoms > 0:
            overall_mastery = sum(p.mastery_score for p in progress) / total_atoms
        else:
            overall_mastery = 0
        
        return Response({
            'concepts': list(concepts.values()),
            'overall_mastery': overall_mastery,
            'total_atoms': total_atoms,
            'learning_streak': profile.learning_streak
        })
        
        
        
from learning_engine.question_generator import QuestionGenerator

class GenerateConceptView(APIView):
    """Generate atoms and questions for a concept"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        subject = request.data.get('subject')
        concept = request.data.get('concept')

        if isinstance(subject, str):
            subject = subject.strip()
        if isinstance(concept, str):
            concept = concept.strip()
        
        if not subject or not concept:
            return Response(
                {'error': 'Please provide both subject and concept'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Check DB first to avoid regenerating the same concept.
            from accounts.models import Concept, TeachingAtom, Question

            existing = (
                Concept.objects.filter(
                    name=concept,
                    subject=subject,
                    created_by__in=[request.user, None],
                )
                .order_by('-created_by')  # user-owned preferred over global
                .first()
            )

            if existing is not None:
                existing_atoms = list(
                    TeachingAtom.objects.filter(concept=existing)
                    .order_by('order', 'id')
                    .values_list('name', flat=True)
                )
                if existing_atoms:
                    return Response({
                        'success': True,
                        'concept_id': existing.id,
                        'atoms': existing_atoms,
                        'cached': True,
                    })

            # Not found (or empty) -> generate now.
            generator = QuestionGenerator()
            result = generator.generate_complete_concept(subject, concept)
            
            # Create or get concept (always save as user-owned for new generations)
            concept_obj, _created = Concept.objects.get_or_create(
                name=concept,
                subject=subject,
                created_by=request.user,
                defaults={'difficulty': 'medium'}
            )
            
            # Save atoms and questions
            for atom_name, atom_data in result['atoms'].items():
                atom_obj, _ = TeachingAtom.objects.get_or_create(
                    name=atom_name,
                    concept=concept_obj
                )
                
                for q_data in atom_data['questions']:
                    Question.objects.get_or_create(
                        atom=atom_obj,
                        question_text=q_data['question'],
                        defaults={
                            'difficulty': q_data['difficulty'],
                            'cognitive_operation': q_data['cognitive_operation'],
                            'estimated_time': q_data['estimated_time'],
                            'options': q_data['options'],
                            'correct_index': q_data['correct_index']
                        }
                    )
            
            return Response({
                'success': True,
                'concept_id': concept_obj.id,
                'atoms': list(result['atoms'].keys())
            })
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class GetAtomsView(APIView):
    """Get atoms for a concept"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, concept_id):
        try:
            from accounts.models import Concept, TeachingAtom
            
            concept = Concept.objects.get(
                Q(id=concept_id) & (Q(created_by__isnull=True) | Q(created_by=request.user))
            )
            atoms = TeachingAtom.objects.filter(concept=concept).values('id', 'name', 'order')
            
            return Response({
                'concept': concept.name,
                'atoms': list(atoms)
            })
            
        except Concept.DoesNotExist:
            return Response(
                {'error': 'Concept not found'},
                status=status.HTTP_404_NOT_FOUND
            )