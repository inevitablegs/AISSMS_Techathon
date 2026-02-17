import React, { createContext, useCallback, useMemo, useState, useContext } from 'react';
import axios from '../axiosConfig';

const LearningContext = createContext(null);

export const LearningProvider = ({ children }) => {
    const [currentSession, setCurrentSession] = useState(null);
    const [diagnosticResults, setDiagnosticResults] = useState(null);
    const [currentAtom, setCurrentAtom] = useState(null);
    const [learningProgress, setLearningProgress] = useState(null);
    const [loading, setLoading] = useState(false);
    const [knowledgeLevel, setKnowledgeLevel] = useState('intermediate');
    const [learningPace, setLearningPace] = useState('normal');
    const [masteryData, setMasteryData] = useState({});


    const startLearningSession = useCallback(async (conceptId, level = 'intermediate') => {
        setLoading(true);
        setKnowledgeLevel(level);
        try {
            const response = await axios.post('/auth/api/start-session/', {
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

    const submitDiagnostic = useCallback(async (sessionId, answers) => {
        setLoading(true);
        try {
            const response = await axios.post('/auth/api/submit-diagnostic/', {
                session_id: sessionId,
                answers: answers
            });
            setDiagnosticResults(response.data);
            setLearningPace(response.data.pacing || 'normal');
            
            // Track weak atoms for mastery management
            if (response.data.weak_atoms) {
                const weakMap = {};
                response.data.weak_atoms.forEach(id => {
                    weakMap[id] = { status: 'needs_attention', attempts: 0 };
                });
                setMasteryData(weakMap);
            }
            
            return { success: true, data: response.data };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to submit diagnostic'
            };
        } finally {
            setLoading(false);
        }
    }, []);

    const getMasteryRecommendation = useCallback((atomId) => {
        const data = masteryData[atomId];
        if (!data) return { action: 'proceed', confidence: 'high' };
        
        if (data.status === 'needs_attention' && data.attempts > 2) {
            return { action: 'review', confidence: 'low' };
        }
        
        return { action: 'proceed', confidence: 'medium' };
    }, [masteryData]);
    

    const normalizePositiveInt = (value) => {
        const num = typeof value === 'string' ? Number(value) : value;
        if (!Number.isInteger(num) || num <= 0) return null;
        return num;
    };

    const markAtomTaught = useCallback(async (atomId, timeSpent) => {
        try {
            const response = await axios.post('/auth/api/mark-atom-taught/', {
                atom_id: atomId,
                time_spent: timeSpent
            });
            return { success: true, data: response.data };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to mark atom as taught'
            };
        }
    }, []);

    const getDiagnosticQuestions = useCallback(async (atomId) => {
        try {
            const response = await axios.get(`/auth/api/diagnostic-questions/${atomId}/`);
            return { success: true, data: response.data };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to get diagnostic questions'
            };
        }
    }, []);

    const submitDiagnosticAnswer = useCallback(async (questionId, selected, timeTaken) => {
        try {
            const response = await axios.post('/auth/api/submit-diagnostic-answer/', {
                question_id: questionId,
                selected: selected,
                time_taken: timeTaken
            });
            return { success: true, data: response.data };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to submit answer'
            };
        }
    }, []);

    const completeDiagnostic = useCallback(async (atomId, answers) => {
        try {
            const response = await axios.post('/auth/api/complete-diagnostic/', {
                atom_id: atomId,
                answers: answers
            });
            return { success: true, data: response.data };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to complete diagnostic'
            };
        }
    }, []);

    const getTeachingContent = useCallback(async (atomId) => {
        const normalizedAtomId = normalizePositiveInt(atomId);
        if (normalizedAtomId === null) {
            return { success: false, error: 'Invalid atom id. Please restart the session step.' };
        }

        setLoading(true);
        try {
            const response = await axios.get(`/auth/api/teaching/${normalizedAtomId}/`);
            setCurrentAtom({
                id: normalizedAtomId,
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

    const getPracticeQuestions = useCallback(async (atomId, difficulty = 'easy', count = 3) => {
        setLoading(true);
        try {
            const response = await axios.get(
                `/auth/api/practice/${atomId}/?difficulty=${difficulty}&count=${count}`
            );
            return { success: true, data: response.data };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to get practice questions'
            };
        } finally {
            setLoading(false);
        }
    }, []);

    const submitPracticeAnswer = useCallback(async (questionId, selected, timeTaken, hintUsed = false) => {
        try {
            const response = await axios.post('/auth/api/submit-answer/', {
                question_id: questionId,
                selected: selected,
                time_taken: timeTaken,
                hint_used: hintUsed
            });
            return { success: true, data: response.data };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to submit answer'
            };
        }
    }, []);

    const getHint = useCallback(async (questionId, errorCount = 0) => {
        try {
            const response = await axios.post('/auth/api/get-hint/', {
                question_id: questionId,
                error_count: errorCount
            });
            return { success: true, data: response.data };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.error || 'Failed to get hint'
            };
        }
    }, []);

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
        currentSession,
        diagnosticResults,
        currentAtom,
        learningProgress,
        loading,
        startLearningSession,
        submitDiagnostic,
        getTeachingContent,
        getPracticeQuestions,
        submitPracticeAnswer,
        getHint,
        loadLearningProgress,
        knowledgeLevel,
        learningPace,
        masteryData,
        setKnowledgeLevel,
        startLearningSession,
        submitDiagnostic,
        getMasteryRecommendation,
        markAtomTaught,
        getDiagnosticQuestions,
        submitDiagnosticAnswer,
        completeDiagnostic
    }), [
        currentSession,
        diagnosticResults,
        currentAtom,
        learningProgress,
        loading,
        startLearningSession,
        submitDiagnostic,
        getTeachingContent,
        getPracticeQuestions,
        submitPracticeAnswer,
        getHint,
        loadLearningProgress,
        knowledgeLevel,
        learningPace,
        masteryData,
        startLearningSession,
        submitDiagnostic,
        getMasteryRecommendation,
        markAtomTaught,
        getDiagnosticQuestions,
        submitDiagnosticAnswer,
        completeDiagnostic
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