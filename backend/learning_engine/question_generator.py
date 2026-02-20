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

    @staticmethod
    def _validate_questions(questions: list) -> list:
        """
        Validate and sanitise AI-generated questions.
        - Ensures correct_index is an int within [0, len(options)-1]
        - Ensures options is a list of exactly 4 strings
        - Drops any malformed question instead of passing it through
        """
        validated = []
        for q in questions:
            opts = q.get('options')
            if not isinstance(opts, list) or len(opts) != 4:
                continue  # Skip malformed question

            ci = q.get('correct_index')
            try:
                ci = int(ci)
            except (TypeError, ValueError):
                ci = 0  # Fallback to first option

            if ci < 0 or ci >= len(opts):
                ci = 0  # Clamp to safe default

            q['correct_index'] = ci
            validated.append(q)
        return validated
    
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
            You are an experienced teacher creating high-quality conceptual assessment questions to evaluate deep student understanding.

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

            CRITICAL QUALITY REQUIREMENTS:

            The goal is to test CONCEPTUAL UNDERSTANDING, not memorization.

            Each question MUST:

            - Be written like an experienced teacher checking real understanding
            - Require thinking, reasoning, or application — NOT simple definition recall
            - Be scenario-based, example-based, comparison-based, or reasoning-based whenever possible
            - Explicitly involve the atomic concept in a meaningful way
            - Avoid trivial, obvious, or keyword-matching questions
            - Avoid fill-in-the-blank style

            OPTIONS REQUIREMENTS (VERY IMPORTANT):

            Each question must have exactly 4 options where:

            - All options are plausible and believable
            - All options belong to the SAME conceptual category
            - Incorrect options must reflect common student misconceptions or mistakes
            - Avoid joke options, extreme options, or obviously wrong answers
            - Avoid options that differ only in grammar or wording tricks

            QUESTION LENGTH:

            - 10 to 35 words REQUIRED
            - Must be self-contained and clear

            DIFFICULTY REQUIREMENTS:

            For {target_difficulty} questions:

            Easy:
            - Simple scenario or example
            - Direct conceptual application

            Medium:
            - Requires reasoning, interpretation, or comparison

            Hard:
            - Multi-step reasoning, prediction, or analysis


            Each question MUST include:

            - "difficulty": "{target_difficulty}"
            - "cognitive_operation": one of {allowed_cognitive}
            - "estimated_time": integer (seconds)
                recall: 20-40
                apply: 40-90
                analyze: 90-150
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
                max_tokens=2048,
            )
            
            raw_text = response.choices[0].message.content
            if "```" in raw_text:
                raw_text = raw_text.split("```")[1]
                if raw_text.startswith("json"):
                    raw_text = raw_text[4:]
            
            result = json.loads(raw_text.strip())
            questions = result.get("questions", [])

            # Validate correct_index and options for every question
            questions = self._validate_questions(questions)
            
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
    
    def _get_fallback_questions(self, atom: str, target_difficulty: str, count: int,
                                level: str = 'intermediate') -> List[Dict]:
        """Provide fallback questions when AI generation fails"""
        questions = []

        for _ in range(count):
            if target_difficulty == 'easy':
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
            elif target_difficulty == 'medium':
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
            else:
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
            questions = []
            questions.extend(self.generate_questions(
                subject=subject,
                concept=concept,
                atom=atom,
                target_difficulty='easy',
                count=2,
                knowledge_level='intermediate'
            ))
            questions.extend(self.generate_questions(
                subject=subject,
                concept=concept,
                atom=atom,
                target_difficulty='medium',
                count=2,
                knowledge_level='intermediate'
            ))
            
            result["atoms"][atom] = {
                "name": atom,
                "questions": questions
            }
            
            print(f"Generated {len(questions)} questions for {atom}")
        
        return result
    
    
    
    def generate_initial_quiz(self, subject: str, concept: str,
                              knowledge_level: str = 'intermediate',
                              count: int = 5) -> List[Dict]:
        """
        Simple diagnostic quiz based only on subject/concept/knowledge level.
        Uses the same question generator with atom=concept for simplicity.
        """
        easy_count = max(1, count // 2)
        medium_count = max(0, count - easy_count)

        questions = []
        questions.extend(self.generate_questions(
            subject=subject,
            concept=concept,
            atom=concept,
            target_difficulty='easy',
            count=easy_count,
            knowledge_level=knowledge_level
        ))
        if medium_count > 0:
            questions.extend(self.generate_questions(
                subject=subject,
                concept=concept,
                atom=concept,
                target_difficulty='medium',
                count=medium_count,
                knowledge_level=knowledge_level
            ))

        return questions

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
            You are an experienced teacher generating conceptual assessment questions to verify whether a student truly understood the concept that was just taught.

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

            Generate EXACTLY {total_needed} multiple-choice questions that test CONCEPTUAL UNDERSTANDING of "{atom}" based on the teaching content.

            IMPORTANT:

            The goal is NOT to test memory of the explanation, analogy, or examples.

            The goal is to test whether the student understood the underlying CONCEPT.


            CRITICAL RULES:

            1. DO NOT ask questions about the analogy itself
            2. DO NOT ask questions about the specific examples themselves
            3. DO NOT ask questions that require recalling sentences from the explanation

            4. Instead, create NEW conceptual situations where the student must APPLY the concept

            5. Questions must test:

            - understanding of how the concept works
            - when the concept applies
            - when the concept does NOT apply
            - consequences of using or misusing the concept

            6. Each question must be meaningful, realistic, and require thinking

            7. Avoid definition questions starting with:

            - What is
            - Define
            - Identify

            8. Each question must be 18–35 words

            9. Each question must have exactly 4 options

            10. All options must be:

            - plausible
            - same conceptual category
            - based on realistic student mistakes or misconceptions

            11. Avoid obvious wrong answers


            DIFFICULTY DISTRIBUTION:

            Easy ({need_easy}):

            - Simple conceptual application

            Medium ({need_medium}):

            - Requires reasoning or interpretation

            Hard ({need_hard}):

            - Requires deeper reasoning, prediction, or identifying incorrect application



            OUTPUT STRICT JSON ONLY:

            {{
                "questions": [
                    {{
                        "difficulty": "easy",
                        "cognitive_operation": "apply",
                        "estimated_time": 40,
                        "question": "Question text here?",
                        "options": [
                            "Option A",
                            "Option B",
                            "Option C",
                            "Option D"
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
                max_tokens=2048,
            )
            
            raw_text = response.choices[0].message.content
            if "```" in raw_text:
                raw_text = raw_text.split("```")[1]
                if raw_text.startswith("json"):
                    raw_text = raw_text[4:]
            
            result = json.loads(raw_text.strip())
            questions = result.get("questions", [])

            # Validate correct_index and options for every question
            questions = self._validate_questions(questions)
            
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