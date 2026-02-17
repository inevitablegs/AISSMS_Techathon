import json
import os
from typing import Dict, List, Optional
from groq import Groq
import google.generativeai as genai
from django.conf import settings

class QuestionGenerator:
    """Generate questions and atoms for learning using AI"""
    
    def __init__(self):
        # Initialize Groq client
        groq_key = getattr(settings, 'GROQ_API_KEY', '')
        self.groq_client = Groq(api_key=groq_key) if groq_key else None
        
        # Initialize Gemini client
        gemini_key = getattr(settings, 'GOOGLE_API_KEY', '')
        if gemini_key:
            genai.configure(api_key=gemini_key)
            self.gemini_model = genai.GenerativeModel('gemini-2.5-flash')
        else:
            self.gemini_model = None
    
    def generate_atoms(self, subject: str, concept: str) -> List[str]:
        """
        Generate atomic concepts using Gemini
        
        Args:
            subject: Subject name (e.g., 'Microprocessor')
            concept: Concept name (e.g., 'Memory Organization')
        
        Returns:
            List of atomic concept names
        """
        if not self.gemini_model:
            # Fallback atoms if Gemini not available
            return self._get_fallback_atoms(subject, concept)
        
        prompt = f"""
        You are generating atomic sub-concepts for curriculum design.

        Subject: {subject}
        Concept: {concept}

        You must follow ALL rules strictly.

        STRICT RULES:

        1. Generate EXACTLY between 4 and 6 atoms.
        2. Each atom must be:
        - A noun or noun phrase only.
        - Maximum 4 words.
        - No verbs.
        - No full sentences.
        3. All atoms must belong to the SAME abstraction level.
        (Do NOT mix structure, mechanism, and abstraction.)
        4. Do NOT generate:
        - Parent–child pairs
        - General-to-specific relationships
        - Negation pairs (pre/non, with/without, static/dynamic)
        - Overlapping concepts
        - Duplicates
        5. Each atom must be independently assessable.
        6. Do NOT include the concept name itself.
        7. No explanations.
        8. No numbering.
        9. No markdown.
        10. Output STRICT JSON only.

        Output format:

        {{
            "atoms": [
                "Atom 1",
                "Atom 2",
                "Atom 3",
                "Atom 4"
            ]
        }}

        If rules cannot be satisfied, return:
        {{"atoms": []}}
        """
        
        try:
            response = self.gemini_model.generate_content(prompt)
            
            # Extract JSON from response
            text = response.text
            if "```" in text:
                text = text.split("```")[1]
                if text.startswith("json"):
                    text = text[4:]
            
            result = json.loads(text.strip())
            atoms = result.get("atoms", [])
            
            # Validate atom count
            if len(atoms) < 4 or len(atoms) > 6:
                return self._get_fallback_atoms(subject, concept)
            
            return atoms
            
        except Exception as e:
            print(f"Error generating atoms: {e}")
            return self._get_fallback_atoms(subject, concept)
    
    def generate_questions(self, subject: str, concept: str, atom: str,
                          need_easy: int, need_medium: int) -> List[Dict]:
        """
        Generate questions for an atom using Groq
        
        Args:
            subject: Subject name
            concept: Concept name
            atom: Atomic concept name
            need_easy: Number of easy questions needed
            need_medium: Number of medium questions needed
        
        Returns:
            List of question dictionaries
        """
        if not self.groq_client or (need_easy == 0 and need_medium == 0):
            return self._get_fallback_questions(atom, need_easy, need_medium)
        
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
        5. Do NOT use:
        - "All of the above"
        - "None of the above"
        - Multiple correct answers
        - Tricky wording
        6. No explanations.
        7. No numbering.
        8. No markdown.
        9. Maximum 25 words per question text.
        10. Create meaningful, clearly phrased questions using complete sentences.
        11. Each question must be fully understandable independently.
        12. Do NOT use vague references like:
        - "this concept"
        - "the above"
        - "it"
        - "this method"
        13. The question must explicitly include the relevant domain term from the Atomic Concept.
        14. Avoid ambiguous wording and incomplete fragments.
        15. The question must make sense without any external context.
        16. Each question must explicitly contain the name of the Atomic Concept within the question text.

        DIFFICULTY REQUIREMENTS:
        {chr(10).join(req_lines)}
        - No hard questions

        COGNITIVE DISTRIBUTION:
        EASY (4 total):
        - 2 recall
        - 2 apply

        MEDIUM (4 total):
        - 2 apply
        - 2 analyze

        TIME CONSTRAINTS:
        - recall → 20–40 seconds
        - apply → 40–90 seconds
        - analyze → 90–150 seconds

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
                    "options": [
                        "Option A",
                        "Option B",
                        "Option C",
                        "Option D"
                    ],
                    "correct_index": 1
                }}
            ]
        }}

        If constraints cannot be satisfied, return:
        {{"questions": []}}
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
            return self._get_fallback_questions(atom, need_easy, need_medium)
    
    def _get_fallback_atoms(self, subject: str, concept: str) -> List[str]:
        """Provide fallback atoms when AI generation fails"""
        # Common fallback atoms based on concept
        fallbacks = {
            "Memory Organization": [
                "Address Space",
                "Memory Hierarchy",
                "Cache Memory",
                "RAM vs ROM",
                "Memory Mapping"
            ],
            "Address Space": [
                "Address Lines",
                "Memory Locations",
                "Address Decoding",
                "Word Size",
                "Byte Addressing"
            ],
            "Cache Memory": [
                "Cache Levels",
                "Cache Hit/Miss",
                "Cache Mapping",
                "Replacement Policy",
                "Write Policy"
            ]
        }
        
        # Try to find matching fallback
        for key, atoms in fallbacks.items():
            if key.lower() in concept.lower():
                return atoms
        
        # Generic fallback
        return [
            f"{concept} Basics",
            f"{concept} Structure",
            f"{concept} Operations",
            f"{concept} Applications",
            f"{concept} Limitations"
        ]
    
    def _get_fallback_questions(self, atom: str, need_easy: int, need_medium: int) -> List[Dict]:
        """Provide fallback questions when AI generation fails"""
        questions = []
        
        # Generate easy questions
        for i in range(need_easy):
            questions.append({
                "difficulty": "easy",
                "cognitive_operation": "recall",
                "estimated_time": 30,
                "question": f"What is the primary function of {atom}?",
                "options": [
                    f"To manage {atom} operations",
                    "To store data permanently",
                    "To execute instructions",
                    "To control peripherals"
                ],
                "correct_index": 0
            })
        
        # Generate medium questions
        for i in range(need_medium):
            questions.append({
                "difficulty": "medium",
                "cognitive_operation": "apply",
                "estimated_time": 60,
                "question": f"In a computer system, how does {atom} affect performance?",
                "options": [
                    f"By optimizing {atom} access",
                    "By increasing clock speed",
                    "By reducing power consumption",
                    "By adding more cores"
                ],
                "correct_index": 0
            })
        
        return questions
    
    def generate_complete_concept(self, subject: str, concept: str) -> Dict:
        """
        Generate complete concept with atoms and questions
        
        Args:
            subject: Subject name
            concept: Concept name
        
        Returns:
            Dictionary with atoms and questions
        """
        # Generate atoms
        atoms = self.generate_atoms(subject, concept)
        
        result = {
            "concept": concept,
            "subject": subject,
            "atoms": {}
        }
        
        # Generate questions for each atom
        for atom in atoms:
            # Generate 2 easy and 2 medium questions per atom
            questions = self.generate_questions(subject, concept, atom, 2, 2)
            result["atoms"][atom] = {
                "name": atom,
                "questions": questions
            }
        
        return result