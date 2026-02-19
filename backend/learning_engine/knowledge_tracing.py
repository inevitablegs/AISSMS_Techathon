import math
from typing import Dict, Any, Optional

def bkt_update(p_know: float, correct: bool, p_slip: float = 0.1, 
               p_guess: float = 0.2, p_learn: float = 0.15) -> float:
    """
    Bayesian Knowledge Tracing update
    
    Args:
        p_know: Current probability student knows the skill
        correct: Whether answer was correct
        p_slip: Probability of slip (wrong despite knowing)
        p_guess: Probability of guess (correct despite not knowing)
        p_learn: Probability of learning after opportunity
    
    Returns:
        Updated probability of knowledge
    """
    if correct:
        numerator = p_know * (1 - p_slip)
        denominator = numerator + (1 - p_know) * p_guess
    else:
        numerator = p_know * p_slip
        denominator = numerator + (1 - p_know) * (1 - p_guess)
    
    posterior = numerator / denominator if denominator != 0 else p_know
    
    # Learning transition
    updated = posterior + (1 - posterior) * p_learn
    
    return min(1.0, max(0.0, updated))

def irt_probability(theta: float, b: float, a: float = 1.0) -> float:
    """
    Item Response Theory 2PL model
    
    Args:
        theta: Student ability
        b: Item difficulty
        a: Item discrimination
    
    Returns:
        Probability of correct response
    """
    return 1 / (1 + math.exp(-a * (theta - b)))

def update_theta(theta: float, correct: bool, b: float, 
                 a: float = 1.0, lr: float = 0.4) -> float:
    """
    Update theta using gradient of log-likelihood
    
    Args:
        theta: Current ability estimate
        correct: Whether answer was correct
        b: Item difficulty
        a: Item discrimination
        lr: Learning rate
    
    Returns:
        Updated ability estimate
    """
    predicted = irt_probability(theta, b, a)
    actual = 1.0 if correct else 0.0
    
    # Simple gradient update
    theta = theta + lr * (actual - predicted)
    
    return theta

def classify_behavior(correct: bool, time_taken: float, 
                      estimated_time: int) -> str:
    """
    Classify student behavior based on correctness and time
    
    Args:
        correct: Whether answer was correct
        time_taken: Actual time taken in seconds
        estimated_time: Expected time in seconds
    
    Returns:
        Behavior classification
    """
    if estimated_time <= 0:
        return "normal_correct" if correct else "confused"
        
    ratio = time_taken / estimated_time
    
    if correct:
        if ratio < 0.7:
            return "strong_mastery"
        elif ratio > 1.3:
            return "weak_mastery"
        else:
            return "normal_correct"
    else:
        if ratio < 0.7:
            return "guessing"
        else:
            return "confused"

def update_mastery_from_behavior(score: float, behavior: str) -> float:
    """
    Update mastery score based on behavior classification
    
    Args:
        score: Current mastery score
        behavior: Behavior classification
    
    Returns:
        Updated mastery score
    """
    weights = {
        "strong_mastery": 2.0,
        "normal_correct": 1.0,
        "weak_mastery": 0.5,
        "guessing": -1.0,
        "confused": -0.5,
    }
    
    # Convert to 0-1 range update
    update = weights.get(behavior, 0) * 0.05
    return min(1.0, max(0.0, score + update))

def classify_error_type(question: Dict[str, Any], answer: int, 
                       time_taken: float, atom_name: str) -> Optional[str]:
    """
    Classify error type based on question, answer, and timing
    
    Args:
        question: Question dictionary
        answer: Selected answer index
        time_taken: Time taken in seconds
        atom_name: Name of the teaching atom
    
    Returns:
        Error type string or None if correct
    """
    correct = (answer == question.get('correct_index'))
    estimated = question.get('estimated_time', 60)
    time_ratio = time_taken / estimated if estimated > 0 else 1.0
    
    if not correct:
        # Fast wrong = guessing
        if time_ratio < 0.5:
            return "guessing"
        
        # Slow wrong on easy question = conceptual
        if question.get('difficulty') == 'easy' and time_ratio > 1.3:
            return "conceptual"
        
        # Check for structural errors
        q_text = question.get('question', '').lower()
        if any(term in q_text for term in ['mapping', 'between', 'versus', 'vs', 'relationship']):
            return "structural"
        
        # Check if it's a factual error
        if question.get('difficulty') == 'easy':
            return "factual"
        
        # Default
        return "procedural"
    
    # Even correct answers can indicate issues
    if correct and time_ratio < 0.3:
        return "attentional"
    
    return None


# backend/learning_engine/knowledge_tracing.py

def classify_error_type(question, answer, time_taken, atom_name):
    """Classify error type based on question, answer, and timing"""
    if answer == -1:  # No answer
        return "no_answer"
    
    estimated = question.get('estimated_time', 60)
    time_ratio = time_taken / estimated if estimated > 0 else 1.0
    
    # Fast wrong = guessing
    if time_ratio < 0.5:
        return "guessing"
    
    # Slow wrong on easy question = conceptual
    if question.get('difficulty') == 'easy' and time_ratio > 1.3:
        return "conceptual"
    
    # Check for structural errors based on question content
    q_text = question.get('question', '').lower()
    if any(term in q_text for term in ['compare', 'contrast', 'difference', 'relationship']):
        return "structural"
    
    # Check if it's a factual error
    if question.get('difficulty') == 'easy':
        return "factual"
    
    # Default
    return "procedural"

def bkt_update(p_know, correct, p_slip=0.1, p_guess=0.2, p_learn=0.15):
    """Bayesian Knowledge Tracing update"""
    if correct:
        numerator = p_know * (1 - p_slip)
        denominator = numerator + (1 - p_know) * p_guess
    else:
        numerator = p_know * p_slip
        denominator = numerator + (1 - p_know) * (1 - p_guess)
    
    posterior = numerator / denominator if denominator != 0 else p_know
    
    # Learning transition
    updated = posterior + (1 - posterior) * p_learn
    
    return min(1.0, max(0.0, updated))

def update_theta(theta, correct, b=0.0, a=1.0, lr=0.4):
    """Update IRT theta parameter"""
    import math
    
    # IRT probability
    def irt_prob(theta, b, a):
        return 1 / (1 + math.exp(-a * (theta - b)))
    
    predicted = irt_prob(theta, b, a)
    actual = 1.0 if correct else 0.0
    
    # Gradient update
    theta = theta + lr * (actual - predicted)
    
    return theta