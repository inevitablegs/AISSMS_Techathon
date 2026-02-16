import json
import random
from typing import Dict, List, Optional, Tuple, Any
from django.conf import settings
from groq import Groq

from .models import TeachingAtomState, LearningPhase, PacingDecision, ErrorType
from .knowledge_tracing import (
    bkt_update, irt_probability, update_theta,
    classify_behavior, update_mastery_from_behavior, classify_error_type
)

class AdaptiveLearningEngine:
    """Main adaptive learning engine"""
    
    def __init__(self):
        self.groq_client = None
        groq_key = getattr(settings, 'GROQ_API_KEY', '')
        if groq_key:
            self.groq_client = Groq(api_key=groq_key)
    
    def generate_teaching_content(self, atom_name: str, subject: str, 
                                  concept: str) -> Dict[str, str]:
        """
        Generate teaching content for an atom using Groq
        """
        if not self.groq_client:
            # Fallback content
            return {
                "explanation": f"{atom_name} is a fundamental concept in {concept}.",
                "example": f"Example of {atom_name} in practice.",
                "analogy": f"Think of {atom_name} like organizing information.",
                "misconception": f"Don't confuse {atom_name} with related concepts."
            }
        
        prompt = f"""
        You are creating a short teaching module for a single atomic concept.
        
        Subject: {subject}
        Concept: {concept}
        Atomic Concept: {atom_name}
        
        Generate:
        1. A clear, simple explanation (2-3 sentences max)
        2. One concrete example
        3. One analogy from everyday life
        4. One common misconception to watch out for
        
        Rules:
        - ONE idea only
        - No jargon without explanation
        - Make it memorable
        
        Return STRICT JSON:
        {{
            "explanation": "Clear explanation here",
            "example": "Concrete example here",
            "analogy": "Everyday analogy here",
            "misconception": "Common mistake students make"
        }}
        """
        
        try:
            response = self.groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=500,
            )
            
            raw_text = response.choices[0].message.content
            # Extract JSON from response (handle markdown code blocks)
            if "```" in raw_text:
                raw_text = raw_text.split("```")[1]
                if raw_text.startswith("json"):
                    raw_text = raw_text[4:]
            
            return json.loads(raw_text.strip())
        except Exception as e:
            print(f"Warning: Could not generate teaching content: {e}")
            return {
                "explanation": f"{atom_name} is a key concept.",
                "example": f"Example of {atom_name}.",
                "analogy": f"Think of {atom_name} like a system.",
                "misconception": f"Common mistake with {atom_name}."
            }
    
    def get_adaptive_hint(self, question: Dict, error_count: int, 
                         atom_name: str, question_text: str) -> str:
        """
        Get adaptive hint based on error count and question content
        """
        hints = [
            "Think about what the question is asking.",
            f"Consider how this relates to {atom_name}.",
        ]
        
        # More specific hints based on question content
        q_text = question_text.lower()
        
        if "address" in q_text:
            hints.append("With N address lines, you can access 2^N locations.")
            hints.append("Each address line DOUBLES the possible memory size.")
        
        if "cache" in q_text or "ram" in q_text:
            hints.append("Cache is closer to the CPU and faster, but smaller than RAM.")
            hints.append("Think of the hierarchy: CPU → Cache → RAM → Disk")
        
        if "rom" in q_text:
            hints.append("ROM retains data even when power is off.")
            hints.append("ROM typically stores the bootloader/firmware.")
        
        if "mapping" in q_text or "share" in q_text:
            hints.append("Different memory types can use different address ranges.")
            hints.append("For example: 0000-7FFF might be ROM, 8000-FFFF might be RAM.")
        
        # Escalate hints based on error count
        hint_level = min(error_count, len(hints) - 1)
        return hints[hint_level]
    
    def determine_pacing(self, diagnostic_results: Dict) -> str:
        """
        Determine learning pace based on diagnostic results
        """
        accuracy = diagnostic_results.get('accuracy', 0)
        
        if accuracy < 0.4:
            return PacingDecision.SHARP_SLOWDOWN.value
        elif accuracy < 0.7:
            return PacingDecision.SLOW_DOWN.value
        else:
            return PacingDecision.SPEED_UP.value
    
    def get_contextual_analogy(self, atom_name: str, concept: str) -> Dict:
        """
        Get contextual analogy to reduce abstraction fatigue
        """
        analogies = {
            "address space": {
                "analogy": "Think of address space like house numbers on a street. Each house needs a unique number.",
                "scenario": "16-bit addresses = streets numbered 0000 to FFFF - 65,536 possible houses!"
            },
            "memory hierarchy": {
                "analogy": "Cache = kitchen counter (fast). RAM = refrigerator (slower, bigger). Storage = grocery store (slowest).",
                "scenario": "When cooking, keep frequently used spices on the counter."
            },
            "cache": {
                "analogy": "CPU = Player, Cache = Bat in hand, RAM = Kit bag",
                "scenario": "Keep your favorite bat in hand for quick access."
            },
            "rom": {
                "analogy": "ROM = cookbook printed in ink - recipes don't change, always there.",
                "scenario": "BIOS = restaurant's signature recipes stored permanently."
            },
            "memory mapping": {
                "analogy": "Memory mapping = assigning shelves to departments. Manager (CPU) just uses shelf numbers.",
                "scenario": "Shelf 0000-7FFF = cookbook department (ROM), 8000-FFFF = ingredients (RAM)."
            }
        }
        
        # Try to find a matching analogy
        atom_lower = atom_name.lower()
        for key, value in analogies.items():
            if key in atom_lower or key in concept.lower():
                return value
        
        # Default
        return {
            "analogy": f"Think of {atom_name} like organizing your desk. Things you use often are within reach.",
            "scenario": f"The more you practice, the more natural this becomes."
        }
    
    def check_mastery_threshold(self, atom_state: TeachingAtomState,
                               questions_answered: List[Dict]) -> Tuple[bool, float]:
        """
        Check if atom has reached mastery threshold
        """
        if not questions_answered:
            return False, atom_state.mastery_score
        
        # Calculate recent accuracy
        recent_questions = questions_answered[-3:] if len(questions_answered) > 3 else questions_answered
        recent_correct = sum(1 for q in recent_questions if q.get('correct', False))
        recent_accuracy = recent_correct / len(recent_questions) if recent_questions else 0
        
        # Check conditions
        mastery_conditions = [
            atom_state.mastery_score >= 0.7,
            recent_accuracy >= 0.8,
            atom_state.streak >= 2
        ]
        
        mastery_achieved = all(mastery_conditions)
        
        if mastery_achieved:
            atom_state.phase = LearningPhase.MASTERY_CHECK
        
        return mastery_achieved, atom_state.mastery_score