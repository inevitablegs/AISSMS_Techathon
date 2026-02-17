# backend/learning_engine/adaptive_flow.py - Enhanced version

import json
import random
from typing import Dict, List, Optional, Tuple, Any
from django.conf import settings
from groq import Groq
from .models import TeachingAtomState, LearningPhase

class AdaptiveLearningEngine:
    """Enhanced adaptive learning engine with knowledge levels"""
    
    def __init__(self):
        self.groq_client = None
        groq_key = getattr(settings, 'GROQ_API_KEY', '')
        if groq_key:
            self.groq_client = Groq(api_key=groq_key)
    
    def generate_teaching_content(self, atom_name: str, subject: str, 
                                  concept: str, knowledge_level: str) -> Dict[str, str]:
        """
        Generate teaching content for an atom based on knowledge level
        """
        if not self.groq_client:
            return self._get_fallback_content(atom_name, concept, knowledge_level)
        
        level_descriptions = {
            'zero': "Complete beginner - needs fundamental concepts explained from scratch",
            'beginner': "Has basic understanding but needs clear explanations and examples",
            'intermediate': "Knows the basics - needs deeper insights and applications",
            'advanced': "Strong understanding - needs advanced concepts and edge cases"
        }
        
        prompt = f"""
        You are creating a personalized teaching module for a single atomic concept.
        
        Subject: {subject}
        Concept: {concept}
        Atomic Concept: {atom_name}
        Student Knowledge Level: {level_descriptions.get(knowledge_level, 'intermediate')}
        
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
            return self._get_fallback_content(atom_name, concept, knowledge_level)
    
    def _get_fallback_content(self, atom_name: str, concept: str, level: str) -> Dict:
        """Fallback content based on knowledge level"""
        if level == 'advanced':
            return {
                "explanation": f"{atom_name} represents an advanced aspect of {concept} with complex interactions and edge cases.",
                "example": f"Advanced example: In production systems, {atom_name} manifests through...",
                "analogy": f"Think of {atom_name} like a sophisticated system where multiple components interact.",
                "misconception": f"Even experts sometimes confuse {atom_name} with similar advanced concepts.",
                "practical_application": f"Understanding {atom_name} helps in optimizing system performance."
            }
        elif level == 'intermediate':
            return {
                "explanation": f"{atom_name} is a key component of {concept} that builds on foundational knowledge.",
                "example": f"Example: When working with {concept}, {atom_name} helps you...",
                "analogy": f"Think of {atom_name} like a well-organized tool in your toolkit.",
                "misconception": f"Don't confuse {atom_name} with its related concepts.",
                "practical_application": f"Mastering {atom_name} improves your problem-solving efficiency."
            }
        else:  # zero or beginner
            return {
                "explanation": f"{atom_name} is a fundamental building block of {concept}. It's like learning a basic rule.",
                "example": f"Simple example: Just like learning the alphabet before writing words, {atom_name} comes first.",
                "analogy": f"Think of {atom_name} like learning to crawl before you walk.",
                "misconception": f"Beginners often think {atom_name} is harder than it really is.",
                "practical_application": f"Understanding {atom_name} opens the door to mastering {concept}."
            }
    
    def determine_pacing(self, diagnostic_results: Dict, knowledge_level: str) -> str:
        """
        Determine learning pace based on diagnostic results and initial knowledge level
        """
        accuracy = diagnostic_results.get('accuracy', 0)
        
        # Adjust thresholds based on knowledge level
        if knowledge_level == 'advanced':
            if accuracy < 0.6:
                return 'slow_down'
            elif accuracy < 0.8:
                return 'stay'
            else:
                return 'speed_up'
        elif knowledge_level == 'intermediate':
            if accuracy < 0.5:
                return 'slow_down'
            elif accuracy < 0.75:
                return 'stay'
            else:
                return 'speed_up'
        else:  # zero or beginner
            if accuracy < 0.4:
                return 'sharp_slowdown'
            elif accuracy < 0.7:
                return 'slow_down'
            else:
                return 'speed_up'
    
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