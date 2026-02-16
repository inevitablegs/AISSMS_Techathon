from dataclasses import dataclass
from typing import List, Dict, Optional
from enum import Enum

class LearningPhase(str, Enum):
    DIAGNOSTIC = "diagnostic"
    TEACHING = "teaching"
    PRACTICE = "practice"
    REINFORCEMENT = "reinforcement"
    MASTERY_CHECK = "mastery_check"
    COMPLETE = "complete"

class ErrorType(str, Enum):
    CONCEPTUAL = "conceptual"
    PROCEDURAL = "procedural"
    FACTUAL = "factual"
    GUESSING = "guessing"
    STRUCTURAL = "structural"
    ATTENTIONAL = "attentional"

class PacingDecision(str, Enum):
    SPEED_UP = "speed_up"
    SLOW_DOWN = "slow_down"
    SHARP_SLOWDOWN = "sharp_slowdown"
    STAY = "stay"
    REINFORCE = "reinforce"
    ADVANCE = "advance"
    RETREAT = "retreat"

@dataclass
class TeachingAtomState:
    """Represents a teaching atom's state in memory"""
    id: int
    name: str
    mastery_score: float = 0.3
    phase: LearningPhase = LearningPhase.DIAGNOSTIC
    streak: int = 0
    hint_usage: int = 0
    error_history: List[str] = None
    retention_verified: bool = False
    
    def __post_init__(self):
        if self.error_history is None:
            self.error_history = []
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'mastery_score': self.mastery_score,
            'phase': self.phase.value if hasattr(self.phase, 'value') else self.phase,
            'streak': self.streak,
            'hint_usage': self.hint_usage,
            'retention_verified': self.retention_verified,
            'error_history': self.error_history[-5:]
        }