import json
from typing import Dict, List, Optional
from groq import Groq

class QuestionGenerator:
    """Generate questions for atoms using Groq"""
    
    def __init__(self, groq_client: Optional[Groq] = None):
        self.groq_client = groq_client
    
    def generate_questions(self, subject: str, concept: str, atom: str,
                          need_easy: int, need_medium: int) -> List[Dict]:
        """
        Generate questions for an atom
        """
        if not self.groq_client or (need_easy == 0 and need_medium == 0):
            return []
        
        total_needed = need_easy + need_medium
        
        req_lines = []
        if need_easy:
            req_lines.append(f"- {need_easy} easy question(s)")
        if need_medium:
            req_lines.append(f"- {need_medium} medium question(s)")
        
        prompt = f"""
        You are generating multiple-choice assessment questions.
        
        Subject: {subject}
        Concept: {concept}
        Atomic Concept: {atom}
        
        You MUST follow ALL rules strictly.
        
        STRUCTURE RULES:
        1. Generate EXACTLY {total_needed} MCQ questions.
        2. Each question must assess ONLY the given Atomic Concept.
        3. Each question must have EXACTLY 4 options.
        4. EXACTLY 1 correct option per question.
        5. No "All of the above" or "None of the above".
        6. Maximum 25 words per question.
        7. Each question must explicitly include the atomic concept name.
        
        DIFFICULTY REQUIREMENTS:
        {chr(10).join(req_lines)}
        
        COGNITIVE DISTRIBUTION:
        EASY: 2 recall, 2 apply
        MEDIUM: 2 apply, 2 analyze
        
        TIME CONSTRAINTS:
        recall → 20–40 seconds
        apply → 40–90 seconds
        analyze → 90–150 seconds
        
        Each question MUST include:
        - "difficulty": easy | medium
        - "cognitive_operation": recall | apply | analyze
        - "estimated_time": integer (seconds)
        - "question": string
        - "options": array of exactly 4 strings
        - "correct_index": integer (0–3)
        
        OUTPUT STRICT JSON ONLY:
        {{
            "questions": [
                {{
                    "difficulty": "easy",
                    "cognitive_operation": "recall",
                    "estimated_time": 30,
                    "question": "Question text here?",
                    "options": ["A", "B", "C", "D"],
                    "correct_index": 1
                }}
            ]
        }}
        """
        
        try:
            response = self.groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=1024,
            )
            
            raw_text = response.choices[0].message.content
            # Extract JSON
            if "```" in raw_text:
                raw_text = raw_text.split("```")[1]
                if raw_text.startswith("json"):
                    raw_text = raw_text[4:]
            
            result = json.loads(raw_text.strip())
            return result.get("questions", [])
            
        except Exception as e:
            print(f"Error generating questions: {e}")
            return []