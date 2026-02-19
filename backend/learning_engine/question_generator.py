# backend/learning_engine/question_generator.py - Complete fixed version

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
            print("Gemini model not available, using fallback atoms")
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
                print(f"Invalid atom count: {len(atoms)}, using fallback")
                return self._get_fallback_atoms(subject, concept)
            
            return atoms
            
        except Exception as e:
            print(f"Error generating atoms: {e}")
            return self._get_fallback_atoms(subject, concept)
    
    # backend/learning_engine/question_generator.py - Updated method

    def generate_questions(self, subject: str, concept: str, atom: str,
                        target_difficulty: str, count: int, 
                        knowledge_level: str = 'intermediate',
                        error_focus: List[str] = None) -> List[Dict]:
        """
        Generate questions for an atom with dynamic difficulty
        
        Args:
            subject: Subject name
            concept: Concept name
            atom: Atomic concept name
            target_difficulty: Specific difficulty to generate ('easy', 'medium', 'hard')
            count: Number of questions needed
            knowledge_level: Student's knowledge level
            error_focus: Optional list of error types to address
        
        Returns:
            List of question dictionaries
        """
        print(f"Generating {count} {target_difficulty} questions for atom: {atom}")
        
        if not self.groq_client or count == 0:
            return self._get_fallback_questions(atom, target_difficulty, count, knowledge_level)
        
        # Adjust based on knowledge level
        level_adjustments = {
            'zero': {
                'cognitive': ['recall'],
                'time_factor': 1.5,
                'complexity': 'very simple, foundational',
                'hint_level': 'detailed'
            },
            'beginner': {
                'cognitive': ['recall', 'apply'],
                'time_factor': 1.2,
                'complexity': 'straightforward',
                'hint_level': 'clear'
            },
            'intermediate': {
                'cognitive': ['recall', 'apply', 'analyze'],
                'time_factor': 1.0,
                'complexity': 'moderate',
                'hint_level': 'moderate'
            },
            'advanced': {
                'cognitive': ['apply', 'analyze'],
                'time_factor': 0.8,
                'complexity': 'challenging',
                'hint_level': 'subtle'
            }
        }
        
        adj = level_adjustments.get(knowledge_level, level_adjustments['intermediate'])
        
        # Determine cognitive operations for this difficulty
        if target_difficulty == 'easy':
            allowed_cognitive = ['recall']
        elif target_difficulty == 'medium':
            allowed_cognitive = ['recall', 'apply']
        else:  # hard
            allowed_cognitive = ['apply', 'analyze']
        
        # Add error focus if provided
        error_context = ""
        if error_focus:
            error_context = f"""
            Focus on addressing these common errors:
            {', '.join(error_focus)}
            
            Create questions that help the student overcome these specific difficulties.
            """
        
        prompt = f"""
        You are generating multiple-choice assessment questions.
        
        Subject: {subject}
        Concept: {concept}
        Atomic Concept: {atom}
        Student Level: {knowledge_level.upper()}
        Target Difficulty: {target_difficulty.upper()}
        
        Generate EXACTLY {count} {target_difficulty} question(s) with these characteristics:
        - Complexity: {adj['complexity']}
        - Cognitive levels: {', '.join(allowed_cognitive)}
        - Hint level: {adj['hint_level']}
        
        {error_context}
        
        Each question must:
        - Have exactly 4 options
        - Be clearly worded and self-contained
        - Test understanding, not trickery
        - Include the atomic concept explicitly
        - Maximum 25 words per question text
        - For {target_difficulty} questions, the difficulty should be appropriate:
            * Easy: Direct recall, simple application
            * Medium: Requires understanding, some analysis
            * Hard: Complex application, synthesis of ideas
        
        Each question MUST include:
        - "difficulty": "{target_difficulty}"
        - "cognitive_operation": one of {allowed_cognitive}
        - "estimated_time": integer (seconds) - recall: 20-40, apply: 40-90, analyze: 90-150
        - "question": string
        - "options": array of exactly 4 strings
        - "correct_index": integer (0-3)
        
        OUTPUT STRICT JSON ONLY:
        
        {{
            "questions": [
                {{
                    "difficulty": "{target_difficulty}",
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
            if "```" in raw_text:
                raw_text = raw_text.split("```")[1]
                if raw_text.startswith("json"):
                    raw_text = raw_text[4:]
            
            result = json.loads(raw_text.strip())
            questions = result.get("questions", [])
            
            # Adjust estimated time based on knowledge level
            for q in questions:
                q['estimated_time'] = int(q.get('estimated_time', 60) * adj['time_factor'])
            
            print(f"Generated {len(questions)} {target_difficulty} questions")
            return questions
            
        except Exception as e:
            print(f"Error generating questions: {e}")
            return self._get_fallback_questions(atom, target_difficulty, count, knowledge_level)
    
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
    
    def _get_fallback_questions(self, atom: str, need_easy: int, need_medium: int, level: str = 'intermediate') -> List[Dict]:
        """Provide fallback questions when AI generation fails"""
        questions = []
        
        # Generate easy questions
        for i in range(need_easy):
            questions.append({
                "difficulty": "easy",
                "cognitive_operation": "recall",
                "estimated_time": 30,
                "question": f"What is the primary purpose of {atom}?",
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
                "question": f"Which scenario best demonstrates the application of {atom}?",
                "options": [
                    f"When implementing {atom} in a real system",
                    "During basic operations",
                    "In simple calculations",
                    "At the start of processing"
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
        print(f"Generating complete concept for {subject} - {concept}")
        
        # Generate atoms
        atoms = self.generate_atoms(subject, concept)
        print(f"Generated {len(atoms)} atoms: {atoms}")
        
        result = {
            "concept": concept,
            "subject": subject,
            "atoms": {}
        }
        
        # Generate questions for each atom
        for atom in atoms:
            print(f"Generating questions for atom: {atom}")
            # Generate 2 easy and 2 medium questions per atom
            questions = self.generate_questions(
                subject=subject,
                concept=concept,
                atom=atom,
                need_easy=2,
                need_medium=2,
                knowledge_level='intermediate'  # Default level
            )
            
            result["atoms"][atom] = {
                "name": atom,
                "questions": questions
            }
            
            print(f"Generated {len(questions)} questions for {atom}")
        
        return result
    
    
    
    def generate_questions_from_teaching(self, subject, concept, atom, teaching_content, 
                                        need_easy=1, need_medium=2, need_hard=0, 
                                        knowledge_level='intermediate'):
        """
        Generate questions based on the teaching content that was shown
        
        Args:
            subject: Subject name
            concept: Concept name
            atom: Atomic concept name
            teaching_content: Dict with explanation, analogy, examples
            need_easy: Number of easy questions
            need_medium: Number of medium questions
            need_hard: Number of hard questions
            knowledge_level: Student's knowledge level
        
        Returns:
            List of question dictionaries
        """
        print(f"Generating questions from teaching for atom: {atom}")
        
        if not self.groq_client:
            print("Groq client not available, using fallback")
            return self._get_fallback_questions_from_teaching(atom, need_easy, need_medium, need_hard)
        
        total_needed = need_easy + need_medium + need_hard
        
        # Extract teaching content
        explanation = teaching_content.get('explanation', '')
        analogy = teaching_content.get('analogy', '')
        examples = teaching_content.get('examples', [])
        
        examples_text = "\n".join([f"- {ex}" for ex in examples if ex])
        
        prompt = f"""
        You are generating assessment questions based on specific teaching content that was just shown to a student.
        
        Subject: {subject}
        Concept: {concept}
        Atomic Concept: {atom}
        Student Level: {knowledge_level.upper()}
        
        TEACHING CONTENT SHOWN TO STUDENT:
        
        Explanation:
        {explanation}
        
        Analogy:
        {analogy}
        
        Examples/Applications:
        {examples_text}
        
        TASK:
        Generate EXACTLY {total_needed} multiple-choice questions that test understanding of the teaching content above.
        
        Question Distribution:
        - Easy: {need_easy} question(s) - Direct recall from the explanation
        - Medium: {need_medium} question(s) - Apply the concept to new situations
        - Hard: {need_hard} question(s) - Analyze relationships or troubleshoot
        
        RULES:
        1. Each question must be answerable based SOLELY on the teaching content provided
        2. Test genuine understanding, not trickery
        3. Questions should build upon what was taught
        4. Include the analogy or examples where appropriate
        5. Each question must have exactly 4 options
        6. One clearly correct answer, three plausible distractors
        
        OUTPUT STRICT JSON ONLY:
        
        {{
            "questions": [
                {{
                    "difficulty": "easy",
                    "cognitive_operation": "recall",
                    "estimated_time": 30,
                    "question": "Based on the explanation, what is the main purpose of {atom}?",
                    "options": [
                        "Option A based on teaching",
                        "Option B based on teaching", 
                        "Option C based on teaching",
                        "Option D based on teaching"
                    ],
                    "correct_index": 0
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
            if "```" in raw_text:
                raw_text = raw_text.split("```")[1]
                if raw_text.startswith("json"):
                    raw_text = raw_text[4:]
            
            result = json.loads(raw_text.strip())
            questions = result.get("questions", [])
            
            print(f"Generated {len(questions)} questions from teaching")
            return questions
            
        except Exception as e:
            print(f"Error generating questions from teaching: {e}")
            return self._get_fallback_questions_from_teaching(atom, need_easy, need_medium, need_hard)

    def _get_fallback_questions_from_teaching(self, atom, need_easy, need_medium, need_hard):
        """Fallback questions based on teaching content"""
        questions = []
        
        # Easy questions
        for i in range(need_easy):
            questions.append({
                "difficulty": "easy",
                "cognitive_operation": "recall",
                "estimated_time": 30,
                "question": f"What is the main purpose of {atom}?",
                "options": [
                    f"To {atom.lower()} efficiently",
                    "To store data permanently",
                    "To execute instructions",
                    "To control peripherals"
                ],
                "correct_index": 0
            })
        
        # Medium questions
        for i in range(need_medium):
            questions.append({
                "difficulty": "medium",
                "cognitive_operation": "apply",
                "estimated_time": 60,
                "question": f"Which scenario best demonstrates the application of {atom}?",
                "options": [
                    f"When implementing {atom} in a real system",
                    "During basic operations",
                    "In simple calculations",
                    "At the start of processing"
                ],
                "correct_index": 0
            })
        
        # Hard questions
        for i in range(need_hard):
            questions.append({
                "difficulty": "hard",
                "cognitive_operation": "analyze",
                "estimated_time": 90,
                "question": f"What would happen if {atom} was implemented incorrectly?",
                "options": [
                    "System performance would degrade",
                    "Nothing would change",
                    "The system would run faster",
                    "Data would be more secure"
                ],
                "correct_index": 0
            })
        
        return questions