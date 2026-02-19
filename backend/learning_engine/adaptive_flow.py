# backend/learning_engine/adaptive_flow.py - Enhanced with pacing engine

import json
import random
from typing import Dict, List, Optional, Tuple, Any
from django.conf import settings
from groq import Groq
from .models import TeachingAtomState, LearningPhase
from .knowledge_tracing import calculate_updated_mastery, classify_error_type
from .pacing_engine import PacingEngine, PacingContext, PacingDecision, NextAction

class AdaptiveLearningEngine:
    """Enhanced adaptive learning engine with real-time mastery and strict pacing"""
    
    def __init__(self):
        self.groq_client = None
        groq_key = getattr(settings, 'GROQ_API_KEY', '')
        if groq_key:
            self.groq_client = Groq(api_key=groq_key)
        
        self.pacing_engine = PacingEngine()

    def determine_pacing(self, diagnostic_results: Dict, knowledge_level: str) -> str:
        """
        Compatibility helper for legacy callers.
        Translates aggregate diagnostics into a PacingContext and returns a pacing decision string.
        """
        accuracy = float(diagnostic_results.get('accuracy', 0))
        mastery = float(diagnostic_results.get('mastery', 0))
        streak = int(diagnostic_results.get('streak', 0))
        error_types = diagnostic_results.get('error_types', []) or []
        theta = float(diagnostic_results.get('theta', 0.0))
        questions_answered = int(diagnostic_results.get('questions_answered', 0))

        context = PacingContext(
            accuracy=accuracy,
            mastery_score=mastery,
            streak=streak,
            error_types=error_types,
            theta=theta,
            questions_answered=questions_answered,
            knowledge_level=knowledge_level,
            phase=diagnostic_results.get('phase', 'practice')
        )

        pacing_decision, _next_action, _reasoning = self.pacing_engine.decide_pacing(context)
        return pacing_decision.value if hasattr(pacing_decision, 'value') else pacing_decision
    
    def process_answer(self, 
                      atom_state: TeachingAtomState,
                      theta: float,
                      question: Dict[str, Any],
                      selected_answer: int,
                      time_taken: float,
                      knowledge_level: str,
                      questions_history: List[Dict]) -> Dict[str, Any]:
        """
        Process a single answer with real-time mastery update and pacing decision
        
        Args:
            atom_state: Current atom state
            theta: Current ability estimate
            question: Question that was answered
            selected_answer: User's answer index
            time_taken: Time taken in seconds
            knowledge_level: Self-reported knowledge level
            questions_history: List of previous questions/answers
        
        Returns:
            Dict with updated state and next actions
        """
        # Determine correctness
        correct = (selected_answer == question.get('correct_index', -1))
        
        # Classify error type if wrong
        error_type = None
        if not correct:
            error_type = classify_error_type(
                question, selected_answer, time_taken, atom_state.name
            )
        
        # REAL-TIME MASTERY UPDATE (after EVERY answer)
        new_mastery, new_theta, metrics = calculate_updated_mastery(
            current_mastery=atom_state.mastery_score,
            current_theta=theta,
            question=question,
            correct=correct,
            time_taken=time_taken,
            error_type=error_type
        )
        
        # Update atom state
        atom_state.mastery_score = new_mastery
        
        if correct:
            atom_state.streak = atom_state.streak + 1 if atom_state.streak > 0 else 1
        else:
            atom_state.streak = atom_state.streak - 1 if atom_state.streak < 0 else -1
        
        if error_type:
            atom_state.error_history.append(error_type)
        
        # Calculate recent metrics for pacing
        recent_questions = questions_history[-5:] if questions_history else []
        recent_correct = sum(1 for q in recent_questions if q.get('correct', False))
        recent_accuracy = recent_correct / len(recent_questions) if recent_questions else (1.0 if correct else 0.0)
        
        # Get recent error types
        recent_errors = [e for e in atom_state.error_history[-5:] if e]
        
        # Create pacing context
        pacing_context = PacingContext(
            accuracy=recent_accuracy,
            mastery_score=new_mastery,
            streak=atom_state.streak,
            error_types=recent_errors,
            theta=new_theta,
            questions_answered=len(questions_history) + 1,
            knowledge_level=knowledge_level,
            phase=atom_state.phase.value if hasattr(atom_state.phase, 'value') else atom_state.phase
        )
        
        # Get pacing decision
        pacing_decision, next_action, reasoning = self.pacing_engine.decide_pacing(pacing_context)
        
        # Determine next difficulty based on ability and pacing
        next_difficulty = self.pacing_engine.get_next_difficulty(
            new_theta, pacing_decision, knowledge_level
        )
        
        # Check if atom is complete
        atom_complete = self._check_atom_complete(atom_state, pacing_context)
        
        # Prepare result
        result = {
            'correct': correct,
            'error_type': error_type,
            'updated_mastery': new_mastery,
            'updated_theta': new_theta,
            'metrics': metrics,
            'pacing_decision': pacing_decision.value if hasattr(pacing_decision, 'value') else pacing_decision,
            'next_action': next_action.value if hasattr(next_action, 'value') else next_action,
            'next_difficulty': next_difficulty,
            'reasoning': reasoning,
            'atom_complete': atom_complete,
            'streak': atom_state.streak
        }
        
        # Add specific recommendations
        if next_action == NextAction.RETEACH:
            result['recommendation'] = 'review_teaching'
            result['message'] = "Let's review the teaching material again."
        elif next_action == NextAction.ADVANCE_NEXT_ATOM:
            result['recommendation'] = 'advance'
            result['message'] = "Great job! Ready for the next concept."
        elif pacing_decision == PacingDecision.SHARP_SLOWDOWN:
            result['recommendation'] = 'easier_questions'
            result['message'] = "Let's try some easier questions to build confidence."
        elif pacing_decision == PacingDecision.SPEED_UP:
            result['recommendation'] = 'challenge'
            result['message'] = "You're doing great! Ready for a challenge?"
        
        return result
    
    def _check_atom_complete(self, atom_state: TeachingAtomState, 
                            context: PacingContext) -> bool:
        """
        Check if atom should be marked complete based on mastery, not question count
        """
        # Mastery threshold (can be adjusted)
        MASTERY_THRESHOLD = 0.7

        # Need at least one response to evaluate
        if context.questions_answered < 1:
            return False
        
        # Check mastery
        if atom_state.mastery_score < MASTERY_THRESHOLD:
            return False
        
        # Check recent performance
        if context.accuracy < 0.75:
            return False
        
        # Check streak
        if context.streak < 2:
            return False
        
        # Check for conceptual errors
        if any(e in ['conceptual', 'structural'] for e in context.error_types[-3:] if context.error_types):
            return False
        
        # All conditions met
        return True
    
    def select_next_questions(self, 
                             atom_state: TeachingAtomState,
                             theta: float,
                             pacing_decision: PacingDecision,
                             knowledge_level: str,
                             available_questions: Dict[str, List[Dict]]) -> List[Dict]:
        """
        Select next questions based on ability, not fixed counts
        """
        selected = []
        
        # Determine target difficulty based on theta
        if theta < -0.3:
            target_difficulty = 'easy'
        elif theta < 0.6:
            target_difficulty = 'medium'
        else:
            target_difficulty = 'hard'
        
        # Adjust based on pacing
        if pacing_decision == PacingDecision.SHARP_SLOWDOWN:
            # Focus on easy questions
            target_difficulty = 'easy'
            count = 3
        elif pacing_decision == PacingDecision.SLOW_DOWN:
            # Mix of easy and medium
            easy_count = 2
            medium_count = 1
        elif pacing_decision == PacingDecision.STAY:
            # Mix based on ability
            if target_difficulty == 'easy':
                easy_count, medium_count, hard_count = 2, 1, 0
            elif target_difficulty == 'medium':
                easy_count, medium_count, hard_count = 1, 2, 0
            else:  # hard
                easy_count, medium_count, hard_count = 0, 2, 1
        else:  # SPEED_UP
            # Challenge with harder questions
            if target_difficulty == 'easy':
                easy_count, medium_count, hard_count = 1, 2, 0
            elif target_difficulty == 'medium':
                easy_count, medium_count, hard_count = 0, 2, 1
            else:  # hard
                easy_count, medium_count, hard_count = 0, 1, 2
        
        # Select questions (up to available)
        for difficulty, count in [('easy', easy_count), ('medium', medium_count), ('hard', hard_count)]:
            if count > 0 and difficulty in available_questions:
                pool = available_questions[difficulty]
                # Select without replacement
                to_select = min(count, len(pool))
                if to_select > 0:
                    selected.extend(random.sample(pool, to_select))
        
        return selected
    
    def generate_teaching_content(self, atom_name: str, subject: str, 
                                  concept: str, knowledge_level: str,
                                  error_history: List[str] = None) -> Dict[str, str]:
        """
        Generate personalized teaching content based on knowledge level and error history
        """
        # If reteaching due to errors, focus on problem areas
        if error_history and len(error_history) > 0:
            recent_errors = error_history[-3:]
            error_focus = self._get_error_focus(recent_errors)
        else:
            error_focus = None
        
        if not self.groq_client:
            return self._get_fallback_content(atom_name, concept, knowledge_level, error_focus)
        
        level_descriptions = {
            'zero': "Complete beginner - needs fundamental concepts explained from scratch",
            'beginner': "Has basic understanding but needs clear explanations and examples",
            'intermediate': "Knows the basics - needs deeper insights and applications",
            'advanced': "Strong understanding - needs advanced concepts and edge cases"
        }
        
        error_context = ""
        if error_focus:
            error_context = f"""
            The student has struggled with these types of errors recently:
            {', '.join(error_focus)}
            
            Please address these specific difficulties in your explanation.
            """
        
        prompt = f"""
        You are creating a personalized teaching module for a single atomic concept.
        
        Subject: {subject}
        Concept: {concept}
        Atomic Concept: {atom_name}
        Student Knowledge Level: {level_descriptions.get(knowledge_level, 'intermediate')}
        
        {error_context}
        
        Generate:
        1. A clear explanation tailored to their knowledge level (2-4 sentences)
        2. A concrete example relevant to their level
        3. An analogy from everyday life that matches their understanding
        4. A common misconception to watch out for
        5. A practical application or "why this matters"
        
        Rules:
        - ONE idea only
        - No jargon without explanation
        - Make it memorable and relevant
        - If advanced, include edge cases or limitations
        - If reteaching, explain in a different way than before
        
        Return STRICT JSON:
        {{
            "explanation": "Clear explanation here",
            "example": "Concrete example here",
            "analogy": "Everyday analogy here",
            "misconception": "Common mistake students make",
            "practical_application": "Why this matters in real life"
        }}
        """
        
        try:
            response = self.groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=800,
            )
            
            raw_text = response.choices[0].message.content
            if "```" in raw_text:
                raw_text = raw_text.split("```")[1]
                if raw_text.startswith("json"):
                    raw_text = raw_text[4:]
            
            return json.loads(raw_text.strip())
        except Exception as e:
            print(f"Warning: Could not generate teaching content: {e}")
            return self._get_fallback_content(atom_name, concept, knowledge_level, error_focus)
    
    def _get_error_focus(self, error_types: List[str]) -> List[str]:
        """Convert error types to focus areas for teaching"""
        focus_map = {
            'conceptual': 'fundamental concepts',
            'structural': 'relationships between ideas',
            'procedural': 'step-by-step processes',
            'factual': 'key facts and definitions',
            'guessing': 'building confidence with basics'
        }
        return [focus_map.get(e, e) for e in error_types if e in focus_map]
    
    def _get_fallback_content(self, atom_name: str, concept: str, level: str, 
                             error_focus: List[str] = None) -> Dict:
        """Enhanced fallback content"""
        focus_text = ""
        if error_focus:
            focus_text = f" focusing on {', '.join(error_focus)}"
        
        if level == 'advanced':
            return {
                "explanation": f"{atom_name} represents an advanced aspect of {concept} with complex interactions and edge cases{focus_text}.",
                "example": f"Advanced example: In production systems, {atom_name} manifests through...",
                "analogy": f"Think of {atom_name} like a sophisticated system where multiple components interact.",
                "misconception": f"Even experts sometimes confuse {atom_name} with similar advanced concepts.",
                "practical_application": f"Understanding {atom_name} helps in optimizing system performance."
            }
        elif level == 'intermediate':
            return {
                "explanation": f"{atom_name} is a key component of {concept} that builds on foundational knowledge{focus_text}.",
                "example": f"Example: When working with {concept}, {atom_name} helps you...",
                "analogy": f"Think of {atom_name} like a well-organized tool in your toolkit.",
                "misconception": f"Don't confuse {atom_name} with its related concepts.",
                "practical_application": f"Mastering {atom_name} improves your problem-solving efficiency."
            }
        else:  # zero or beginner
            return {
                "explanation": f"{atom_name} is a fundamental building block of {concept}. It's like learning a basic rule{focus_text}.",
                "example": f"Simple example: Just like learning the alphabet before writing words, {atom_name} comes first.",
                "analogy": f"Think of {atom_name} like learning to crawl before you walk.",
                "misconception": f"Beginners often think {atom_name} is harder than it really is.",
                "practical_application": f"Understanding {atom_name} opens the door to mastering {concept}."
            }