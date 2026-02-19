import React, { createContext, useCallback, useMemo, useState, useContext } from 'react';
import axios from '../axiosConfig';

const LearningContext = createContext(null);

export const LearningProvider = ({ children }) => {
    const [currentSession, setCurrentSession] = useState(null);
    const [currentAtom, setCurrentAtom] = useState(null);
    const [learningProgress, setLearningProgress] = useState(null);
    const [loading, setLoading] = useState(false);
    const [knowledgeLevel, setKnowledgeLevel] = useState('intermediate');

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
        try {
            const response = await axios.post('/auth/api/start-teaching-session/', {
                concept_id: conceptId,
                knowledge_level: level
            });
            
            setCurrentSession(response.data);
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
        try {
            const response = await axios.post('/auth/api/teaching-content/', {
                session_id: session_id,
                atom_id: atom_id
            });
            
            setCurrentAtom({
                id: atom_id,
                ...response.data
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
    const generateQuestionsFromTeaching = useCallback(async ({ session_id, atom_id }) => {
        setLoading(true);
        try {
            const response = await axios.post('/auth/api/generate-questions-from-teaching/', {
                session_id: session_id,
                atom_id: atom_id
            });
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

    // Submit answer for an atom question
    const submitAtomAnswer = useCallback(async ({ session_id, atom_id, question_index, selected, time_taken }) => {
        try {
            const response = await axios.post('/auth/api/submit-atom-answer/', {
                session_id: session_id,
                atom_id: atom_id,
                question_index: question_index,
                selected: selected,
                time_taken: time_taken
            });
            return { success: true, data: response.data };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to submit answer'
            };
        }
    }, []);

    // Complete atom and determine next action
    const completeAtom = useCallback(async ({ session_id, atom_id, continue_learning }) => {
        try {
            const response = await axios.post('/auth/api/complete-atom/', {
                session_id: session_id,
                atom_id: atom_id,
                continue_learning: continue_learning
            });
            
            return { success: true, data: response.data };
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

    const value = useMemo(() => ({
        // State
        currentSession,
        currentAtom,
        learningProgress,
        loading,
        knowledgeLevel,
        
        // Setters
        setKnowledgeLevel,
        
        // Core methods
        generateConcept,
        startTeachingSession,
        getTeachingContent,
        generateQuestionsFromTeaching,
        submitAtomAnswer,
        completeAtom,
        loadLearningProgress
        
    }), [
        currentSession,
        currentAtom,
        learningProgress,
        loading,
        knowledgeLevel,
        generateConcept,
        startTeachingSession,
        getTeachingContent,
        generateQuestionsFromTeaching,
        submitAtomAnswer,
        completeAtom,
        loadLearningProgress
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