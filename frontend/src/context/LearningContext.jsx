// frontend/src/context/LearningContext.jsx - Enhanced version

import React, { createContext, useCallback, useMemo, useState, useContext, useRef } from 'react';
import axios from '../axiosConfig';

const LearningContext = createContext(null);

export const LearningProvider = ({ children }) => {
    const [currentSession, setCurrentSession] = useState(null);
    const [currentAtom, setCurrentAtom] = useState(null);
    const [learningProgress, setLearningProgress] = useState(null);
    const [loading, setLoading] = useState(false);
    const [knowledgeLevel, setKnowledgeLevel] = useState('intermediate');
    
    // Real-time tracking
    const [currentQuestions, setCurrentQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState([]);
    const [atomMastery, setAtomMastery] = useState(0.3);
    const [currentTheta, setCurrentTheta] = useState(0.0);
    const [pacingDecision, setPacingDecision] = useState('stay');
    const [nextAction, setNextAction] = useState('continue_practice');
    const [showTeaching, setShowTeaching] = useState(false);
    const [teachingContent, setTeachingContent] = useState(null);
    const [metrics, setMetrics] = useState({});
    
    // Timers
    const questionStartTime = useRef(null);
    const [timeSpent, setTimeSpent] = useState(0);

    // Generate atoms for a concept (no questions)
    const generateConcept = useCallback(async (subject, concept, knowledgeLevel = 'intermediate') => {
        setLoading(true);
        try {
            const response = await axios.post('/auth/api/generate-concept/', {
                subject: subject,
                concept: concept,
                knowledge_level: knowledgeLevel
            });
            return { success: true, data: response.data };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to generate concept'
            };
        } finally {
            setLoading(false);
        }
    }, []);

    // Start teaching session for a concept
    const startTeachingSession = useCallback(async (conceptId, level = 'intermediate') => {
        setLoading(true);
        setKnowledgeLevel(level);
        setAnswers([]);
        setAtomMastery(0.3);
        setPacingDecision('stay');
        
        try {
            const response = await axios.post('/auth/api/start-teaching-session/', {
                concept_id: conceptId,
                knowledge_level: level
            });
            
            setCurrentSession(response.data);
            
            // If there's a current atom, set it
            if (response.data.current_atom) {
                setCurrentAtom(response.data.current_atom);
            }
            
            return { success: true, data: response.data };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to start session'
            };
        } finally {
            setLoading(false);
        }
    }, []);

    // Get teaching content for an atom
    const getTeachingContent = useCallback(async ({ session_id, atom_id }) => {
        setLoading(true);
        setShowTeaching(true);
        try {
            const response = await axios.post('/auth/api/teaching-content/', {
                session_id: session_id,
                atom_id: atom_id
            });

            // Normalize payload: backend may nest under teaching_content
            const raw = response.data?.teaching_content || response.data || {};
            const examples = Array.isArray(raw.examples) ? raw.examples : [];

            const normalized = {
                explanation: raw.explanation || '',
                example: raw.example || examples[0] || '',
                analogy: raw.analogy || '',
                misconception: raw.misconception || examples[2] || '',
                practical_application: raw.practical_application || examples[1] || '',
                examples: examples
            };

            setTeachingContent(normalized);
            setCurrentAtom({
                id: atom_id,
                name: response.data?.atom_name || response.data?.name || raw.atom_name || raw.name,
            });
            
            return { success: true, data: response.data };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to get teaching content'
            };
        } finally {
            setLoading(false);
        }
    }, []);

    // Generate questions based on teaching content
    const generateQuestionsFromTeaching = useCallback(async ({ session_id, atom_id, force_new = false }) => {
        setLoading(true);
        try {
            const response = await axios.post('/auth/api/generate-questions-from-teaching/', {
                session_id: session_id,
                atom_id: atom_id,
                force_new: force_new
            });
            
            setCurrentQuestions(response.data.questions || []);
            setCurrentQuestionIndex(0);
            
            // Start timer for first question
            questionStartTime.current = Date.now();
            
            return { success: true, data: response.data };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to generate questions'
            };
        } finally {
            setLoading(false);
        }
    }, []);

    // Submit answer for an atom question with REAL-TIME updates
    const submitAtomAnswer = useCallback(async ({ 
        session_id, 
        atom_id, 
        question_index, 
        selected,
        forceTimeTaken = null
    }) => {
        // Calculate time taken if not provided
        let time_taken = forceTimeTaken;
        if (time_taken === null && questionStartTime.current) {
            time_taken = Math.round((Date.now() - questionStartTime.current) / 1000);
        } else if (time_taken === null) {
            time_taken = 30; // Default fallback
        }
        
        try {
            const response = await axios.post('/auth/api/submit-atom-answer/', {
                session_id: session_id,
                atom_id: atom_id,
                question_index: question_index,
                selected: selected,
                time_taken: time_taken
            });
            
            const data = response.data;
            
            // REAL-TIME UI UPDATES based on response
            setAtomMastery(data.updated_mastery);
            setCurrentTheta(data.updated_theta);
            setPacingDecision(data.pacing_decision);
            setNextAction(data.next_action);
            setMetrics(data.metrics || {});
            
            // Store answer
            const newAnswer = {
                question_index,
                selected,
                correct: data.correct,
                error_type: data.error_type,
                time_taken,
                mastery_after: data.updated_mastery,
                pacing_decision: data.pacing_decision
            };
            
            setAnswers(prev => [...prev, newAnswer]);
            
            // Check if atom is complete
            if (data.atom_complete) {
                // Move to next atom or show completion
                if (data.next_atom) {
                    setCurrentAtom(prev => ({
                        ...prev,
                        next_atom: data.next_atom
                    }));
                }
            }
            
            // Update session data with pacing info
            setCurrentSession(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    last_pacing: data.pacing_decision,
                    current_mastery: data.updated_mastery,
                    current_theta: data.updated_theta
                };
            });
            
            return { success: true, data };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to submit answer'
            };
        }
    }, []);

    // Start next question with timer
    const nextQuestion = useCallback(() => {
        if (currentQuestionIndex < currentQuestions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            questionStartTime.current = Date.now();
        }
    }, [currentQuestionIndex, currentQuestions.length]);

    // Complete atom and determine next action
    const completeAtom = useCallback(async ({ session_id, atom_id, continue_learning }) => {
        try {
            const response = await axios.post('/auth/api/complete-atom/', {
                session_id: session_id,
                atom_id: atom_id,
                continue_learning: continue_learning
            });
            
            const data = response.data;
            
            // Handle next steps based on pacing
            if (data.next_action === 'next_atom' && data.next_atom) {
                setCurrentAtom(data.next_atom);
                setShowTeaching(true); // Show teaching for next atom
                setCurrentQuestions([]);
                setAnswers([]);
            } else if (data.concept_complete) {
                // All atoms complete
                setCurrentAtom(null);
                setCurrentSession(null);
            }
            
            return { success: true, data };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to complete atom'
            };
        }
    }, []);

    // Load learning progress
    const loadLearningProgress = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get('/auth/api/progress/');
            setLearningProgress(response.data);
            return { success: true, data: response.data };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to load progress'
            };
        } finally {
            setLoading(false);
        }
    }, []);

    // Reset for new atom
    const resetForNewAtom = useCallback(() => {
        setCurrentQuestions([]);
        setCurrentQuestionIndex(0);
        setAnswers([]);
        setShowTeaching(true);
        setPacingDecision('stay');
        questionStartTime.current = null;
    }, []);

    const value = useMemo(() => ({
        // State
        currentSession,
        currentAtom,
        learningProgress,
        loading,
        knowledgeLevel,
        
        // Real-time tracking
        currentQuestions,
        currentQuestionIndex,
        answers,
        atomMastery,
        currentTheta,
        pacingDecision,
        nextAction,
        showTeaching,
        teachingContent,
        metrics,
        timeSpent,
        
        // Setters
        setKnowledgeLevel,
        setShowTeaching,
        
        // Core methods
        generateConcept,
        startTeachingSession,
        getTeachingContent,
        generateQuestionsFromTeaching,
        submitAtomAnswer,
        completeAtom,
        loadLearningProgress,
        nextQuestion,
        resetForNewAtom
        
    }), [
        currentSession,
        currentAtom,
        learningProgress,
        loading,
        knowledgeLevel,
        currentQuestions,
        currentQuestionIndex,
        answers,
        atomMastery,
        currentTheta,
        pacingDecision,
        nextAction,
        showTeaching,
        teachingContent,
        metrics,
        timeSpent,
        generateConcept,
        startTeachingSession,
        getTeachingContent,
        generateQuestionsFromTeaching,
        submitAtomAnswer,
        completeAtom,
        loadLearningProgress,
        nextQuestion,
        resetForNewAtom
    ]);

    return (
        <LearningContext.Provider value={value}>
            {children}
        </LearningContext.Provider>
    );
};

export const useLearning = () => {
    const context = useContext(LearningContext);
    if (!context) {
        throw new Error('useLearning must be used within a LearningProvider');
    }
    return context;
};