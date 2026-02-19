# backend/learning_engine/pacing_engine.py - NEW FILE

from typing import Dict, List, Optional, Tuple
from enum import Enum
from dataclasses import dataclass


class PacingDecision(str, Enum):
    SPEED_UP = "speed_up"
    STAY = "stay"
    SLOW_DOWN = "slow_down"
    SHARP_SLOWDOWN = "sharp_slowdown"


class NextAction(str, Enum):
    CONTINUE_PRACTICE = "continue_practice"
    RETEACH = "reteach"
    ADVANCE_NEXT_ATOM = "advance_next_atom"
    MASTERY_CHECK = "mastery_check"
    COMPLETE_ATOM = "complete_atom"


@dataclass
class PacingContext:
    """Context for pacing decisions"""
    accuracy: float  # Recent accuracy (0-1)
    mastery_score: float  # Current mastery (0-1)
    streak: int  # Current correct streak
    error_types: List[str]  # Recent error types
    theta: float  # Ability parameter
    questions_answered: int  # Total questions in this atom
    knowledge_level: str  # Initial self-reported level
    phase: str  # Current learning phase


class PacingEngine:
    """
    Strict pacing decision engine with formal rules
    """
    
    def __init__(self):
        # Thresholds by knowledge level
        self.accuracy_thresholds = {
            'zero': {'speed_up': 0.8, 'stay': 0.6, 'slow_down': 0.4, 'sharp_slowdown': 0.25},
            'beginner': {'speed_up': 0.8, 'stay': 0.6, 'slow_down': 0.45, 'sharp_slowdown': 0.3},
            'intermediate': {'speed_up': 0.85, 'stay': 0.7, 'slow_down': 0.55, 'sharp_slowdown': 0.4},
            'advanced': {'speed_up': 0.9, 'stay': 0.8, 'slow_down': 0.65, 'sharp_slowdown': 0.5}
        }
        
        self.mastery_thresholds = {
            'zero': {'speed_up': 0.7, 'stay': 0.5, 'slow_down': 0.35, 'sharp_slowdown': 0.2},
            'beginner': {'speed_up': 0.75, 'stay': 0.55, 'slow_down': 0.4, 'sharp_slowdown': 0.25},
            'intermediate': {'speed_up': 0.8, 'stay': 0.6, 'slow_down': 0.45, 'sharp_slowdown': 0.3},
            'advanced': {'speed_up': 0.85, 'stay': 0.7, 'slow_down': 0.55, 'sharp_slowdown': 0.4}
        }
        
        # Error type weights for pacing
        self.error_weights = {
            'guessing': 1.2,      # Makes slowdown more likely
            'attentional': 0.8,    # Less impact
            'factual': 1.0,
            'procedural': 1.3,
            'conceptual': 1.8,     # Strongest impact
            'structural': 1.5
        }
    
    def decide_pacing(self, context: PacingContext) -> Tuple[PacingDecision, NextAction, Dict]:
        """
        Make strict pacing decision based on formal rules
        
        Returns:
            Tuple of (pacing_decision, next_action, reasoning)
        """
        # Extract context
        level = context.knowledge_level
        accuracy = context.accuracy
        mastery = context.mastery_score
        streak = context.streak
        error_types = context.error_types
        phase = context.phase
        q_count = context.questions_answered
        
        # Get thresholds for this knowledge level
        acc_thresh = self.accuracy_thresholds.get(level, self.accuracy_thresholds['intermediate'])
        mas_thresh = self.mastery_thresholds.get(level, self.mastery_thresholds['intermediate'])
        
        # Initialize reasoning
        reasoning = {
            'accuracy': accuracy,
            'mastery': mastery,
            'streak': streak,
            'primary_factors': [],
            'error_analysis': {}
        }
        
        # Analyze recent errors
        if error_types:
            error_counts = {}
            for err in error_types[-5:]:  # Last 5 errors
                error_counts[err] = error_counts.get(err, 0) + 1
            
            reasoning['error_analysis'] = error_counts
            
            # Check for severe error patterns
            conceptual_errors = error_counts.get('conceptual', 0)
            structural_errors = error_counts.get('structural', 0)
            repeated_errors = len(error_types) >= 3 and len(set(error_types[-3:])) <= 2
        
        # STEP 1: Check for critical conditions
        critical_conditions = []
        
        # Conceptual errors in last 3 questions
        if any(e in ['conceptual', 'structural'] for e in error_types[-3:] if error_types):
            critical_conditions.append('conceptual_error')
        
        # Very low accuracy
        if accuracy < acc_thresh['sharp_slowdown']:
            critical_conditions.append('very_low_accuracy')
        
        # Very low mastery
        if mastery < mas_thresh['sharp_slowdown']:
            critical_conditions.append('very_low_mastery')
        
        # Negative streak (multiple wrong)
        if streak < -2:  # 2 or more wrong in a row
            critical_conditions.append('negative_streak')
        
        # If any critical condition, sharp slowdown
        if critical_conditions:
            reasoning['primary_factors'] = critical_conditions
            reasoning['severity'] = 'critical'
            
            # Determine next action
            if phase in ['diagnostic', 'teaching'] and mastery < 0.3:
                next_action = NextAction.RETEACH
            elif phase == 'practice':
                next_action = NextAction.RETEACH
            else:
                next_action = NextAction.CONTINUE_PRACTICE
            
            return PacingDecision.SHARP_SLOWDOWN, next_action, reasoning
        
        # STEP 2: Check moderate conditions
        moderate_conditions = []
        
        if accuracy < acc_thresh['slow_down']:
            moderate_conditions.append('low_accuracy')
        
        if mastery < mas_thresh['slow_down']:
            moderate_conditions.append('low_mastery')
        
        if streak < 0:  # Currently on wrong answer
            moderate_conditions.append('negative_streak_start')
        
        # Procedural errors indicate need for practice
        if error_types and error_types[-1] in ['procedural', 'factual']:
            moderate_conditions.append('procedural_error')
        
        if moderate_conditions:
            reasoning['primary_factors'] = moderate_conditions
            reasoning['severity'] = 'moderate'
            return PacingDecision.SLOW_DOWN, NextAction.CONTINUE_PRACTICE, reasoning
        
        # STEP 3: Check speed-up conditions
        speed_conditions = []
        
        if accuracy >= acc_thresh['speed_up']:
            speed_conditions.append('high_accuracy')
        
        if mastery >= mas_thresh['speed_up']:
            speed_conditions.append('high_mastery')
        
        if streak >= 3:  # Strong streak
            speed_conditions.append('strong_streak')
        
        # For speed-up, need at least 2 conditions
        if len(speed_conditions) >= 2:
            reasoning['primary_factors'] = speed_conditions
            reasoning['severity'] = 'positive'
            
            # Check if ready to advance
            if mastery >= 0.7 and accuracy >= 0.8 and streak >= 2:
                # Ready to move to next phase or atom
                if phase == 'diagnostic':
                    next_action = NextAction.ADVANCE_NEXT_ATOM
                elif phase == 'teaching':
                    next_action = NextAction.ADVANCE_NEXT_ATOM
                elif phase == 'practice' and mastery >= 0.8:
                    next_action = NextAction.MASTERY_CHECK
                else:
                    next_action = NextAction.CONTINUE_PRACTICE
            else:
                next_action = NextAction.CONTINUE_PRACTICE
            
            return PacingDecision.SPEED_UP, next_action, reasoning
        
        # STEP 4: Default - stay
        reasoning['primary_factors'] = ['normal_performance']
        reasoning['severity'] = 'normal'
        return PacingDecision.STAY, NextAction.CONTINUE_PRACTICE, reasoning
    
    def get_next_difficulty(self, theta: float, current_pacing: PacingDecision, 
                           knowledge_level: str) -> str:
        """
        Select next difficulty based on ability and pacing
        """
        # Map theta to base difficulty
        if theta < -0.5:
            base_difficulty = 'easy'
        elif theta < 0.5:
            base_difficulty = 'medium'
        else:
            base_difficulty = 'hard'
        
        # Adjust based on pacing
        pacing_adjustments = {
            PacingDecision.SPEED_UP: {'easy': 'medium', 'medium': 'hard', 'hard': 'hard'},
            PacingDecision.STAY: {'easy': 'easy', 'medium': 'medium', 'hard': 'medium'},
            PacingDecision.SLOW_DOWN: {'easy': 'easy', 'medium': 'easy', 'hard': 'medium'},
            PacingDecision.SHARP_SLOWDOWN: {'easy': 'easy', 'medium': 'easy', 'hard': 'easy'}
        }
        
        adjustment = pacing_adjustments.get(current_pacing, {})
        next_difficulty = adjustment.get(base_difficulty, base_difficulty)
        
        # Adjust for knowledge level
        if knowledge_level == 'zero' and next_difficulty == 'hard':
            next_difficulty = 'medium'
        elif knowledge_level == 'advanced' and next_difficulty == 'easy':
            next_difficulty = 'medium'
        
        return next_difficulty
    
    def should_reteach(self, context: PacingContext) -> bool:
        """
        Determine if reteaching is needed
        """
        error_types = context.error_types[-3:] if context.error_types else []
        
        # Conditions for reteaching
        conditions = [
            # Conceptual errors in last 3 questions
            any(e in ['conceptual', 'structural'] for e in error_types),
            # Very low mastery
            context.mastery_score < 0.3,
            # Multiple wrong in a row with low mastery
            context.streak < -2 and context.mastery_score < 0.5,
            # Low accuracy with conceptual errors
            context.accuracy < 0.4 and 'conceptual' in error_types
        ]
        
        return any(conditions)
    
    def should_advance(self, context: PacingContext) -> bool:
        """
        Determine if student should advance to next atom
        """
        conditions = [
            context.mastery_score >= 0.7,
            context.accuracy >= 0.8,
            context.streak >= 2,
            context.questions_answered >= 4,  # Minimum practice
            # No conceptual errors recently
            'conceptual' not in (context.error_types[-3:] if context.error_types else [])
        ]
        
        # Need at least 3 conditions including mastery and accuracy
        return sum(conditions) >= 3 and conditions[0] and conditions[1]