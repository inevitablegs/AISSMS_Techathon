// frontend/src/components/Learning/TeachingFirstFlow.jsx - COMPLETE REWRITTEN VERSION

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLearning } from '../../context/LearningContext';
import TeachingModule from './TeachingModule';
import QuestionsFromTeaching from './QuestionsFromTeaching';
import AtomComplete from './AtomComplete';
import AtomReview from './AtomReview';
import FatigueIndicator from './FatigueIndicator';
import LearningVelocityGraph from './LearningVelocityGraph';
// Inline WeakTopicDetector component
import { AlertCircle, Target, TrendingUp, BookOpen, RefreshCw } from 'lucide-react';

const WeakTopicDetector = ({ conceptData, sessionId, onReviewStart }) => {
    const [showDetails, setShowDetails] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    // NOTE: If you want to use fetchWeakTopics, weakTopics, loading from context, add:
    // const { fetchWeakTopics, weakTopics, loading } = useLearning();

    // Get color based on mastery score
    const getMasteryColor = (score) => {
        if (score >= 0.7) return 'text-emerald-500';
        if (score >= 0.5) return 'text-yellow-500';
        if (score >= 0.3) return 'text-orange-500';
        return 'text-error';
    };

    // Get background color based on mastery score
    const getMasteryBgColor = (score) => {
        if (score >= 0.7) return 'bg-emerald-500/10';
        if (score >= 0.5) return 'bg-yellow-500/10';
        if (score >= 0.3) return 'bg-orange-500/10';
        return 'bg-error/10';
    };

    // Get progress bar color
    const getProgressColor = (score) => {
        if (score >= 0.7) return 'bg-emerald-500';
        if (score >= 0.5) return 'bg-yellow-500';
        if (score >= 0.3) return 'bg-orange-500';
        return 'bg-error';
    };

    // If no concept data or no weakest atom, don't render
    if (!conceptData || !conceptData.weakest_atom) {
        return null;
    }

    const { weakest_atom, lowest_mastery, final_mastery, accuracy, passed } = conceptData;

    return (
        <div className="bg-surface rounded-theme-xl shadow-theme-lg border border-theme-border overflow-hidden animate-fade-in-up">
            {/* Header */}
            <div className="gradient-primary px-6 py-4 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Target className="w-6 h-6" />
                    <div>
                        <h3 className="font-semibold text-lg">Topic Mastery Analysis</h3>
                        <p className="text-sm text-white/80">Personalized learning insights</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="px-3 py-1 bg-white/20 rounded-theme-lg text-sm font-medium hover:bg-white/30 transition-colors"
                >
                    {showDetails ? 'Hide Details' : 'View Details'}
                </button>
            </div>

            {/* Main Content */}
            <div className="p-6">
                {/* Overall Performance */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-surface-alt rounded-theme-lg p-4">
                        <p className="text-sm text-theme-text-muted mb-1">Final Mastery</p>
                        <p className="text-2xl font-bold text-theme-text">
                            {Math.round(final_mastery * 100)}%
                        </p>
                        <div className="w-full h-2 bg-theme-border rounded-full mt-2">
                            <div
                                className="h-full bg-primary rounded-full transition-all duration-500"
                                style={{ width: `${final_mastery * 100}%` }}
                            />
                        </div>
                    </div>

                    <div className="bg-surface-alt rounded-theme-lg p-4">
                        <p className="text-sm text-theme-text-muted mb-1">Challenge Accuracy</p>
                        <p className="text-2xl font-bold text-theme-text">
                            {Math.round(accuracy * 100)}%
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                            <span className={`text-sm font-medium ${passed ? 'text-emerald-500' : 'text-error'}`}>
                                {passed ? '✓ Passed' : '✗ Needs Work'}
                            </span>
                        </div>
                    </div>

                    <div className="bg-surface-alt rounded-theme-lg p-4">
                        <p className="text-sm text-theme-text-muted mb-1">Concept Mastery</p>
                        <p className="text-2xl font-bold text-theme-text">
                            {Math.round(conceptData.concept_mastery * 100)}%
                        </p>
                        <p className="text-xs text-theme-text-muted mt-2">
                            Average of all atoms
                        </p>
                    </div>
                </div>

                {/* Weakest Topic Alert */}
                <div className={`${getMasteryBgColor(lowest_mastery)} rounded-theme-lg p-5 border ${getMasteryColor(lowest_mastery).replace('text', 'border')}/20`}>
                    <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-full ${getMasteryBgColor(lowest_mastery)}`}>
                            <AlertCircle className={`w-6 h-6 ${getMasteryColor(lowest_mastery)}`} />
                        </div>

                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="font-semibold text-theme-text">Weakest Topic Identified</h4>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getMasteryBgColor(lowest_mastery)} ${getMasteryColor(lowest_mastery)}`}>
                                    Priority Review
                                </span>
                            </div>

                            <p className="text-lg font-bold text-theme-text mb-2">
                                {weakest_atom}
                            </p>

                            <div className="flex items-center gap-4 mb-3">
                                <div className="flex-1">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-theme-text-muted">Current Mastery</span>
                                        <span className={`font-medium ${getMasteryColor(lowest_mastery)}`}>
                                            {Math.round(lowest_mastery * 100)}%
                                        </span>
                                    </div>
                                    <div className="w-full h-2 bg-theme-border rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${getProgressColor(lowest_mastery)} transition-all duration-500`}
                                            style={{ width: `${lowest_mastery * 100}%` }}
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={() => onReviewStart?.(weakest_atom)}
                                    className="px-4 py-2 gradient-primary text-white rounded-theme-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Review Now
                                </button>
                            </div>

                            {/* Recommendation */}
                            <div className="mt-4 p-3 bg-theme-bg rounded-theme-lg border border-theme-border">
                                <p className="text-sm text-theme-text">
                                    {conceptData.recommendation}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Detailed Analysis (Conditional) */}
                {showDetails && (
                    <div className="mt-6 animate-fade-in">
                        <h4 className="font-semibold text-theme-text mb-3 flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-primary" />
                            Learning Recommendations
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-surface-alt rounded-theme-lg p-4">
                                <h5 className="font-medium text-theme-text mb-2">Focus Areas</h5>
                                <ul className="space-y-2">
                                    <li className="flex items-start gap-2 text-sm text-theme-text-secondary">
                                        <span className="text-primary mt-1">•</span>
                                        <span>Review fundamental concepts of "{weakest_atom}"</span>
                                    </li>
                                    <li className="flex items-start gap-2 text-sm text-theme-text-secondary">
                                        <span className="text-primary mt-1">•</span>
                                        <span>Practice with targeted exercises</span>
                                    </li>
                                    <li className="flex items-start gap-2 text-sm text-theme-text-secondary">
                                        <span className="text-primary mt-1">•</span>
                                        <span>Watch video explanations for better understanding</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="bg-surface-alt rounded-theme-lg p-4">
                                <h5 className="font-medium text-theme-text mb-2">Mastery Gap</h5>
                                <div className="space-y-3">
                                    <div>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-theme-text-muted">Current</span>
                                            <span className="text-orange-500">{Math.round(lowest_mastery * 100)}%</span>
                                        </div>
                                        <div className="w-full h-2 bg-theme-border rounded-full overflow-hidden">
                                            <div className="h-full bg-orange-500" style={{ width: `${lowest_mastery * 100}%` }} />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-theme-text-muted">Target</span>
                                            <span className="text-emerald-500">70%</span>
                                        </div>
                                        <div className="w-full h-2 bg-theme-border rounded-full overflow-hidden">
                                            <div className="h-full bg-emerald-500" style={{ width: '70%' }} />
                                        </div>
                                    </div>
                                    <p className="text-xs text-theme-text-muted mt-2">
                                        Need to improve by {Math.max(0, 70 - lowest_mastery * 100).toFixed(0)}% to reach mastery
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const TeachingFirstFlow = ({ conceptId }) => {
    const navigate = useNavigate();

    // Core state
    const [currentAtomData, setCurrentAtomData] = useState(null);
    const [sessionStarted, setSessionStarted] = useState(false);
    const [flowState, setFlowState] = useState('initializing'); // initializing, initial_quiz, teaching, questions, review, final_challenge, concept_final_challenge, complete, concept_complete
    const [reviewMetrics, setReviewMetrics] = useState(null);
    const [error, setError] = useState(null);
    const [retryCount, setRetryCount] = useState(0);
    const [initialQuestions, setInitialQuestions] = useState([]);
    const [finalRecommendation, setFinalRecommendation] = useState('');
    const [nextAtomAfterFinal, setNextAtomAfterFinal] = useState(null);
    const [conceptFinalResult, setConceptFinalResult] = useState(null);

    // Get all context values
    const {
        // State
        currentSession,
        currentAtom,
        showTeaching,
        setShowTeaching,
        currentQuestions,
        teachingContent,
        pacingDecision,
        nextAction,
        atomMastery,
        currentTheta,
        answers,
        metrics,
        loading,

        // Methods
        startTeachingSession,
        getTeachingContent,
        generateQuestionsFromTeaching,
        generateInitialQuiz,
        submitInitialQuizAnswer,
        completeInitialQuiz,
        generateFinalChallenge,
        completeFinalChallenge,
        submitAtomAnswer,
        completeAtom,
        loadLearningProgress,
        resetForNewAtom,

        // Enhanced pacing engine
        fatigueLevel,
        velocityData,
        retentionAction,
        hintWarning,
        engagementScore,
        masteryVerdict,
        recordBreak,
        checkRetention,
        recordHint,

        // Concept final challenge
        generateConceptFinalChallenge,
        submitConceptFinalAnswer,
        completeConceptFinalChallenge,
    } = useLearning();

    const [currentSubject, setCurrentSubject] = useState('');
    const [currentConceptName, setCurrentConceptName] = useState('');

    // When starting the session, store the subject and concept
    useEffect(() => {
        if (currentSession) {
            setCurrentSubject(currentSession.subject || '');
            setCurrentConceptName(currentSession.concept_name || '');
        }
    }, [currentSession]);

    // Refs for tracking
    const sessionIdRef = useRef(null);
    const conceptIdRef = useRef(conceptId);
    const flowStateRef = useRef(flowState);

    // Update ref when flowState changes
    useEffect(() => {
        flowStateRef.current = flowState;
    }, [flowState]);

    // Initialize session
    useEffect(() => {
        const initSession = async () => {
            if (!conceptId || sessionStarted) return;

            setFlowState('initializing');
            setError(null);

            try {
                console.log('Starting teaching session for concept:', conceptId);
                const result = await startTeachingSession(conceptId, 'intermediate');

                if (result.success && result.data) {
                    console.log('Session started:', result.data);
                    sessionIdRef.current = result.data.session_id;
                    setSessionStarted(true);

                    // Prefer current_atom from backend, otherwise fallback to first atom in list
                    const firstAtom = result.data.current_atom
                        || (Array.isArray(result.data.atoms) && result.data.atoms.length > 0
                            ? result.data.atoms[0]
                            : null);

                    if (!firstAtom) {
                        setError('No atoms available for this concept');
                        setFlowState('error');
                        return;
                    }

                    // Generate initial quiz before teaching
                    const quizResult = await generateInitialQuiz({
                        session_id: result.data.session_id
                    });

                    if (quizResult.success && quizResult.data?.questions?.length > 0) {
                        setInitialQuestions(quizResult.data.questions);
                        setCurrentAtomData(firstAtom);
                        setFlowState('initial_quiz');
                    } else {
                        setError(quizResult.error || 'Failed to generate initial quiz');
                        setFlowState('error');
                    }
                } else {
                    setError(result.error || 'Failed to start session');
                    setFlowState('error');
                }
            } catch (err) {
                console.error('Error starting session:', err);
                setError('Failed to start learning session');
                setFlowState('error');
            }
        };

        initSession();
    }, [conceptId, sessionStarted, startTeachingSession, generateInitialQuiz, getTeachingContent]);

    // Handle starting an atom
    const handleStartAtom = useCallback(async (atom) => {
        if (!currentSession?.session_id) {
            console.error('No active session');
            return;
        }

        setFlowState('loading');
        setError(null);

        try {
            console.log('Getting teaching content for atom:', atom.id);
            const result = await getTeachingContent({
                session_id: currentSession.session_id,
                atom_id: atom.id
            });

            if (result.success) {
                setCurrentAtomData(atom);
                setFlowState('teaching');
            } else {
                setError(result.error || 'Failed to load teaching content');
                setFlowState('error');
            }
        } catch (err) {
            console.error('Error getting teaching content:', err);
            setError('Failed to load teaching content');
            setFlowState('error');
        }
    }, [currentSession, getTeachingContent]);

    // Handle continue to questions
    const handleContinueToQuestions = useCallback(async () => {
        if (!currentSession?.session_id || !currentAtomData?.id) {
            console.error('Missing session or atom data');
            return;
        }

        setFlowState('loading');
        setError(null);

        try {
            console.log('Generating questions for atom:', currentAtomData.id);
            const result = await generateQuestionsFromTeaching({
                session_id: currentSession.session_id,
                atom_id: currentAtomData.id
            });

            if (result.success && result.data.questions?.length > 0) {
                setFlowState('questions');
            } else {
                setError('No questions generated');
                setFlowState('error');
            }
        } catch (err) {
            console.error('Error generating questions:', err);
            setError('Failed to generate questions');
            setFlowState('error');
        }
    }, [currentSession, currentAtomData, generateQuestionsFromTeaching]);

    const handleInitialQuizComplete = useCallback(async () => {
        if (!currentSession?.session_id || !currentAtomData?.id) return;

        const result = await completeInitialQuiz({ session_id: currentSession.session_id });
        if (!result.success) {
            setError('Failed to complete initial quiz');
            setFlowState('error');
            return;
        }

        // After initial quiz, load teaching content
        const contentResult = await getTeachingContent({
            session_id: currentSession.session_id,
            atom_id: currentAtomData.id
        });

        if (contentResult.success) {
            setFlowState('teaching');
        } else {
            setError(contentResult.error || 'Failed to load teaching content');
            setFlowState('error');
        }
    }, [currentSession, currentAtomData, completeInitialQuiz, getTeachingContent]);

    // Handle back to teaching
    const handleBackToTeaching = useCallback(() => {
        setFlowState('teaching');
    }, []);

    // Handle answer submission (wrapped to work with QuestionsFromTeaching)
    const handleSubmitAnswer = useCallback(async (payload) => {
        if (!currentSession?.session_id || !currentAtomData?.id) {
            return { success: false, error: 'No active session' };
        }

        return await submitAtomAnswer({
            session_id: payload.session_id || currentSession.session_id,
            atom_id: payload.atom_id || currentAtomData.id,
            question_index: payload.question_index,
            selected: payload.selected,
            forceTimeTaken: payload.time_taken,
            question_set: payload.question_set || 'teaching'
        });
    }, [currentSession, currentAtomData, submitAtomAnswer]);

    // Handle questions complete
    const handleQuestionsComplete = useCallback(async () => {
        if (!currentSession?.session_id || !currentAtomData?.id) return;

        console.log('Questions completed. Finalizing atom...');
        setFlowState('completing');

        try {
            const completeResult = await completeAtom({
                session_id: currentSession.session_id,
                atom_id: currentAtomData.id,
                continue_learning: true
            });

            if (!completeResult.success) {
                setError('Failed to complete atom');
                setFlowState('error');
                return;
            }

            const data = completeResult.data;

            if (data.all_completed || data.next_action?.action === 'concept_complete' || data.concept_final_challenge_ready) {
                // All atoms done — trigger concept final challenge
                await launchConceptFinalChallenge();
                return;
            }

            const action = data.next_action?.action;
            const reviewActions = new Set([
                'review_current',
                'recommend_review',
                'recommend_practice'
            ]);

            if (reviewActions.has(action)) {
                // Build review metrics from latest answers
                const totalAnswers = answers.length;
                const correctCount = answers.filter(a => a.correct).length;
                const accuracy = totalAnswers > 0 ? correctCount / totalAnswers : 0;

                const errorCounts = {
                    conceptual: answers.filter(a => a.error_type === 'conceptual').length,
                    procedural: answers.filter(a => a.error_type === 'procedural').length,
                    factual: answers.filter(a => a.error_type === 'factual').length,
                    guessing: answers.filter(a => a.error_type === 'guessing').length,
                    attentional: answers.filter(a => a.error_type === 'attentional').length
                };

                setReviewMetrics({
                    accuracy,
                    final_mastery: atomMastery,
                    error_count: totalAnswers - correctCount,
                    conceptual_errors: errorCounts.conceptual,
                    procedural_errors: errorCounts.procedural,
                    factual_errors: errorCounts.factual,
                    guessing_errors: errorCounts.guessing,
                    attentional_errors: errorCounts.attentional,
                    time_ratio: answers.length > 0
                        ? answers.reduce((sum, a) => sum + (a.time_taken / 60), 0) / answers.length
                        : 1.0,
                    theta_change: data.metrics?.theta_change || metrics?.theta_change || 0
                });

                setFlowState('review');
                return;
            }

            if (action === 'final_challenge') {
                const finalResult = await generateFinalChallenge({
                    session_id: currentSession.session_id,
                    atom_id: currentAtomData.id
                });

                if (finalResult.success) {
                    setFlowState('final_challenge');
                } else {
                    setError('Failed to generate final challenge');
                    setFlowState('error');
                }
                return;
            }

            if (data.next_atom) {
                setCurrentAtomData(data.next_atom);
                setFlowState('teaching');
                resetForNewAtom();
                return;
            }

            // Default fallback
            setFlowState('concept_complete');
        } catch (err) {
            console.error('Error completing atom:', err);
            setError('Failed to complete atom');
            setFlowState('error');
        }
    }, [currentSession, currentAtomData, answers, atomMastery, metrics, completeAtom, resetForNewAtom, generateFinalChallenge]);

    // Launch concept final challenge (after all atoms done)
    const launchConceptFinalChallenge = useCallback(async () => {
        if (!currentSession?.session_id) return;
        setFlowState('loading');
        setError(null);
        resetForNewAtom(); // clear previous question state
        try {
            const result = await generateConceptFinalChallenge({
                session_id: currentSession.session_id,
                concept_id: conceptId,
            });
            if (result.success && result.data.questions?.length > 0) {
                setFlowState('concept_final_challenge');
            } else {
                setError('Failed to generate concept final challenge');
                setFlowState('error');
            }
        } catch (err) {
            console.error('Error launching concept final challenge:', err);
            setError('Failed to generate concept final challenge');
            setFlowState('error');
        }
    }, [currentSession, conceptId, generateConceptFinalChallenge, resetForNewAtom]);

    const handleFinalChallengeComplete = useCallback(async () => {
        if (!currentSession?.session_id || !currentAtomData?.id) return;

        const result = await completeFinalChallenge({
            session_id: currentSession.session_id,
            atom_id: currentAtomData.id
        });

        if (!result.success) {
            setError('Failed to complete final challenge');
            setFlowState('error');
            return;
        }

        if (result.data.all_completed || result.data.concept_final_challenge_ready) {
            await launchConceptFinalChallenge();
            return;
        }

        if (!result.data.mastered || result.data.next_action === 'review_current') {
            setFinalRecommendation(result.data.recommendation || 'Let\'s review and retry this atom.');
            setFlowState('teaching');
            return;
        }

        setFinalRecommendation(result.data.recommendation || '');
        setNextAtomAfterFinal(result.data.next_atom || null);
        setFlowState('complete');
    }, [currentSession, currentAtomData, completeFinalChallenge, launchConceptFinalChallenge]);

    // Handle concept final challenge questions complete
    const handleConceptFinalChallengeComplete = useCallback(async () => {
        if (!currentSession?.session_id) return;
        setFlowState('completing');

        try {
            const result = await completeConceptFinalChallenge({
                session_id: currentSession.session_id,
                concept_id: conceptId,
            });

            if (!result.success) {
                setError('Failed to complete concept final challenge');
                setFlowState('error');
                return;
            }

            setConceptFinalResult(result.data);
            setFlowState('concept_complete');
        } catch (err) {
            console.error('Error completing concept final challenge:', err);
            setError('Failed to complete concept final challenge');
            setFlowState('error');
        }
    }, [currentSession, conceptId, completeConceptFinalChallenge]);

    // Handle review complete
    const handleReviewComplete = useCallback(async (action) => {
        if (!currentSession?.session_id || !currentAtomData?.id) return;

        console.log('Review complete with action:', action);

        if (action === 'reteach') {
            // Show teaching again (with focus on problem areas)
            setFlowState('loading');

            try {
                await getTeachingContent({
                    session_id: currentSession.session_id,
                    atom_id: currentAtomData.id
                });
                setFlowState('teaching');
            } catch (err) {
                console.error('Error reteaching:', err);
                setError('Failed to load teaching content');
                setFlowState('error');
            }

        } else if (action === 'practice') {
            // Generate new practice questions
            setFlowState('loading');

            try {
                await generateQuestionsFromTeaching({
                    session_id: currentSession.session_id,
                    atom_id: currentAtomData.id,
                    force_new: true
                });
                setFlowState('questions');
            } catch (err) {
                console.error('Error generating practice questions:', err);
                setError('Failed to generate questions');
                setFlowState('error');
            }

        } else if (action === 'skip') {
            // Force continue despite low mastery
            setFlowState('completing');

            try {
                const completeResult = await completeAtom({
                    session_id: currentSession.session_id,
                    atom_id: currentAtomData.id,
                    continue_learning: true,
                    force_continue: true
                });

                if (completeResult.success) {
                    if (completeResult.data.next_atom) {
                        setCurrentAtomData(completeResult.data.next_atom);
                        setFlowState('teaching');
                        resetForNewAtom();
                    } else {
                        setFlowState('concept_complete');
                    }
                } else {
                    setError('Failed to continue');
                    setFlowState('error');
                }
            } catch (err) {
                console.error('Error skipping review:', err);
                setError('Failed to continue');
                setFlowState('error');
            }
        }
    }, [currentSession, currentAtomData, getTeachingContent, generateQuestionsFromTeaching, completeAtom, resetForNewAtom]);

    // Handle atom complete - continue or go to dashboard
    const handleAtomCompleteContinue = useCallback(() => {
        if (nextAtomAfterFinal) {
            setCurrentAtomData(nextAtomAfterFinal);
            setFlowState('teaching');
            setFinalRecommendation('');
            setNextAtomAfterFinal(null);
            resetForNewAtom();
        } else {
            navigate('/dashboard');
        }
    }, [nextAtomAfterFinal, navigate, resetForNewAtom]);

    // Handle retry after error
    const handleRetry = useCallback(() => {
        setRetryCount(prev => prev + 1);
        setError(null);
        setSessionStarted(false); // Force re-initialization
    }, []);

    // Handle back to dashboard
    const handleBackToDashboard = useCallback(() => {
        navigate('/dashboard');
    }, [navigate]);

    // Loading state
    if (flowState === 'initializing' || (loading && flowState !== 'error')) {
        return (
            <div className="min-h-screen bg-theme-bg flex items-center justify-center">
                <div className="text-center">
                    <div className="text-xl text-theme-text-secondary mb-4">Preparing your adaptive learning session...</div>
                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="mt-4 text-sm text-theme-text-muted">Analyzing concept structure</p>
                </div>
            </div>
        );
    }

    // Error state
    if (flowState === 'error' && error) {
        return (
            <div className="min-h-screen bg-theme-bg flex items-center justify-center">
                <div className="text-center max-w-md p-8 bg-surface rounded-theme-xl shadow-theme-lg border border-theme-border">
                    <div className="text-5xl mb-4">😕</div>
                    <h2 className="text-2xl font-bold text-error mb-2">Something went wrong</h2>
                    <p className="text-theme-text-secondary mb-6">{error}</p>
                    <div className="space-y-3">
                        <button
                            onClick={handleRetry}
                            className="w-full px-4 py-2 gradient-primary text-white rounded-theme-lg hover:shadow-theme-lg transition-all"
                        >
                            Try Again
                        </button>
                        <button
                            onClick={handleBackToDashboard}
                            className="w-full px-4 py-2 bg-theme-bg text-theme-text-secondary rounded-theme-lg hover:bg-theme-border transition-colors"
                        >
                            Back to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // No session
    if (!currentSession) {
        return (
            <div className="min-h-screen bg-theme-bg flex items-center justify-center">
                <div className="text-center max-w-md p-8 bg-surface rounded-theme-xl shadow-theme-lg border border-theme-border">
                    <div className="text-5xl mb-4">🔍</div>
                    <h2 className="text-2xl font-bold text-theme-text mb-2">No Active Session</h2>
                    <p className="text-theme-text-secondary mb-6">We couldn't find an active learning session.</p>
                    <button
                        onClick={handleBackToDashboard}
                        className="px-4 py-2 gradient-primary text-white rounded-theme-lg hover:shadow-theme-lg transition-all"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-theme-bg py-8">
            <div className="max-w-4xl mx-auto px-4">
                {/* Session Header with Real-time Stats */}
                <div className="mb-6 bg-surface rounded-theme-xl shadow-theme border border-theme-border p-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-xl font-bold text-theme-text">
                                {currentSession.concept_name || 'Learning Session'}
                            </h1>
                            <p className="text-sm text-theme-text-muted">
                                {flowState === 'teaching' && '📖 Learning new concept'}
                                {flowState === 'questions' && '✍️ Answering questions'}
                                {flowState === 'review' && '🔄 Reviewing material'}
                                {flowState === 'complete' && '✅ Atom complete'}
                                {flowState === 'concept_final_challenge' && '🏆 Concept Final Challenge'}
                                {flowState === 'concept_complete' && '🎉 Concept mastered!'}
                                {flowState === 'loading' && '⏳ Loading...'}
                            </p>
                        </div>

                        {/* Real-time Stats */}
                        <div className="flex space-x-4">
                            <div className="text-center">
                                <div className="text-xs text-theme-text-muted">Mastery</div>
                                <div className="text-xl font-bold text-primary">
                                    {Math.round(atomMastery * 100)}%
                                </div>
                                <div className="w-20 h-1 bg-theme-border rounded-full mt-1">
                                    <div
                                        className="h-1 gradient-primary rounded-full transition-all duration-300"
                                        style={{ width: `${atomMastery * 100}%` }}
                                    ></div>
                                </div>
                            </div>

                            <div className="text-center">
                                <div className="text-xs text-theme-text-muted">Ability (θ)</div>
                                <div className="text-xl font-bold text-violet-500">
                                    {currentTheta.toFixed(2)}
                                </div>
                            </div>

                            {pacingDecision && pacingDecision !== 'stay' && (
                                <div className="text-center">
                                    <div className="text-xs text-theme-text-muted">Pace</div>
                                    <div className={`text-sm font-bold px-2 py-1 rounded-theme ${pacingDecision === 'speed_up' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                                            pacingDecision === 'slow_down' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                                                pacingDecision === 'sharp_slowdown' ? 'bg-error/10 text-error' :
                                                    'bg-theme-bg text-theme-text'
                                        }`}>
                                        {pacingDecision === 'speed_up' && '⚡ Speed Up'}
                                        {pacingDecision === 'slow_down' && '🐢 Slow Down'}
                                        {pacingDecision === 'sharp_slowdown' && '⚠️ Careful'}
                                    </div>
                                </div>
                            )}

                            {answers.length > 0 && (
                                <div className="text-center">
                                    <div className="text-xs text-theme-text-muted">Questions</div>
                                    <div className="text-lg font-bold text-theme-text">
                                        {answers.length}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Fatigue indicator + Velocity graph row */}
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <FatigueIndicator />
                            {retentionAction && (
                                <div className="mt-1 text-xs text-orange-500 font-medium">
                                    🔁 {typeof retentionAction === 'string' ? retentionAction : 'Retention review recommended'}
                                </div>
                            )}
                            {hintWarning && (
                                <div className="mt-1 text-xs text-amber-500 font-medium">
                                    💡 {hintWarning}
                                </div>
                            )}
                        </div>
                        <LearningVelocityGraph sessionId={currentSession?.session_id} />
                    </div>
                </div>

                {/* Main Content - Flow-based rendering */}
                <div className="transition-all duration-300">
                    {/* Initial Diagnostic Quiz */}
                    {flowState === 'initial_quiz' && initialQuestions.length > 0 && (
                        <QuestionsFromTeaching
                            questions={initialQuestions}
                            atomName={`${currentSession.concept_name} Diagnostic`}
                            sessionId={currentSession.session_id}
                            atomId={currentAtomData?.id}
                            onComplete={handleInitialQuizComplete}
                            onBackToTeaching={handleBackToDashboard}
                            onSubmitAnswer={submitInitialQuizAnswer}
                            showMetrics={false}
                        />
                    )}

                    {/* Teaching Module */}
                    {flowState === 'teaching' && teachingContent && currentAtomData && (
                        <TeachingModule
                            atom={currentAtomData}
                            subject={currentSubject}  // Pass subject
                            concept={currentConceptName}
                            teachingContent={teachingContent}
                            onContinue={handleContinueToQuestions}
                            onBack={handleBackToDashboard}
                            showBackButton={true}
                            pacingDecision={pacingDecision}
                            currentMastery={atomMastery}
                        />
                    )}

                    {/* Questions Module */}
                    {flowState === 'questions' && currentQuestions?.length > 0 && currentAtomData && (
                        <QuestionsFromTeaching
                            questions={currentQuestions}
                            atomName={currentAtomData.name}
                            sessionId={currentSession.session_id}
                            atomId={currentAtomData.id}
                            onComplete={handleQuestionsComplete}
                            onBackToTeaching={handleBackToTeaching}
                            onSubmitAnswer={handleSubmitAnswer}
                            currentMastery={atomMastery}
                            pacingDecision={pacingDecision}
                        />
                    )}

                    {/* Review Module */}
                    {flowState === 'review' && reviewMetrics && currentAtomData && (
                        <AtomReview
                            atom={currentAtomData}
                            metrics={reviewMetrics}
                            onComplete={handleReviewComplete}
                            onSkip={() => handleReviewComplete('skip')}
                        />
                    )}

                    {/* Final Challenge */}
                    {flowState === 'final_challenge' && currentQuestions?.length > 0 && currentAtomData && (
                        <QuestionsFromTeaching
                            questions={currentQuestions}
                            atomName={`${currentAtomData.name} Final Challenge`}
                            sessionId={currentSession.session_id}
                            atomId={currentAtomData.id}
                            onComplete={handleFinalChallengeComplete}
                            onBackToTeaching={handleBackToTeaching}
                            onSubmitAnswer={(payload) => submitAtomAnswer({ ...payload, question_set: 'final' })}
                            showMetrics={false}
                        />
                    )}

                    {/* Atom Complete Module */}
                    {flowState === 'complete' && currentAtomData && (
                        <AtomComplete
                            atom={currentAtomData}
                            onContinue={handleAtomCompleteContinue}
                            recommendation={finalRecommendation}
                            mastery={atomMastery}
                            accuracy={answers.length > 0 ? answers.filter(a => a.correct).length / answers.length : 0}
                            totalQuestions={answers.length}
                        />
                    )}

                    {/* Concept Final Challenge */}
                    {flowState === 'concept_final_challenge' && currentQuestions?.length > 0 && (
                        <QuestionsFromTeaching
                            questions={currentQuestions}
                            atomName={`${currentSession.concept_name || 'Concept'} — Final Challenge`}
                            sessionId={currentSession.session_id}
                            atomId={null}
                            onComplete={handleConceptFinalChallengeComplete}
                            onBackToTeaching={handleBackToDashboard}
                            onSubmitAnswer={(payload) =>
                                submitConceptFinalAnswer({
                                    session_id: currentSession.session_id,
                                    question_index: payload.question_index,
                                    selected: payload.selected,
                                    time_taken: payload.time_taken,
                                })
                            }
                            showMetrics={false}
                        />
                    )}

                    {/* Concept Complete */}
                    {flowState === 'concept_complete' && (
                        <div className="bg-surface rounded-theme-xl shadow-theme-lg border border-theme-border p-12 text-center animate-scale-in">
                            <div className="text-6xl mb-4">{conceptFinalResult?.passed ? '🏆' : '📚'}</div>
                            <h2 className="text-3xl font-bold text-theme-text mb-2">
                                {conceptFinalResult?.passed ? 'Concept Mastered!' : 'Almost There!'}
                            </h2>
                            <p className="text-lg text-theme-text-secondary mb-6">
                                {conceptFinalResult?.recommendation || "You've completed all atoms in this concept."}
                            </p>

                            {/* Final Stats */}
                            {conceptFinalResult && (
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-xl mx-auto mb-8">
                                    <div className="bg-primary/10 p-4 rounded-theme-lg">
                                        <div className="text-2xl font-bold text-primary">
                                            {Math.round((conceptFinalResult.accuracy || 0) * 100)}%
                                        </div>
                                        <div className="text-sm text-theme-text-muted">Challenge Score</div>
                                    </div>
                                    <div className="bg-emerald-500/10 p-4 rounded-theme-lg">
                                        <div className="text-2xl font-bold text-emerald-500">
                                            {conceptFinalResult.correct}/{conceptFinalResult.total}
                                        </div>
                                        <div className="text-sm text-theme-text-muted">Correct</div>
                                    </div>
                                    <div className="bg-violet-500/10 p-4 rounded-theme-lg">
                                        <div className="text-2xl font-bold text-violet-500">
                                            {Math.round((conceptFinalResult.final_mastery || 0) * 100)}%
                                        </div>
                                        <div className="text-sm text-theme-text-muted">Final Mastery</div>
                                    </div>
                                    <div className="bg-amber-500/10 p-4 rounded-theme-lg">
                                        <div className="text-2xl font-bold text-amber-500">
                                            +{conceptFinalResult.concept_xp || 0}
                                        </div>
                                        <div className="text-sm text-theme-text-muted">XP Earned</div>
                                    </div>
                                </div>
                            )}

                            {!conceptFinalResult && (
                                <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mb-8">
                                    <div className="bg-primary/10 p-4 rounded-theme-lg">
                                        <div className="text-2xl font-bold text-primary">
                                            {Math.round(atomMastery * 100)}%
                                        </div>
                                        <div className="text-sm text-theme-text-muted">Mastery</div>
                                    </div>
                                    <div className="bg-emerald-500/10 p-4 rounded-theme-lg">
                                        <div className="text-2xl font-bold text-emerald-500">
                                            {currentTheta.toFixed(2)}
                                        </div>
                                        <div className="text-sm text-theme-text-muted">Ability (θ)</div>
                                    </div>
                                    <div className="bg-violet-500/10 p-4 rounded-theme-lg">
                                        <div className="text-2xl font-bold text-violet-500">
                                            {answers.length}
                                        </div>
                                        <div className="text-sm text-theme-text-muted">Questions</div>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-center space-x-4">
                                <button
                                    onClick={handleBackToDashboard}
                                    className="px-8 py-3 bg-emerald-500 text-white rounded-theme-lg font-semibold hover:bg-emerald-600 transition-colors"
                                >
                                    Return to Dashboard
                                </button>
                                <button
                                    onClick={() => navigate('/leaderboard')}
                                    className="px-8 py-3 bg-amber-500 text-white rounded-theme-lg font-semibold hover:bg-amber-600 transition-colors"
                                >
                                    🏆 Leaderboard
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Loading State for transitions */}
                    {flowState === 'loading' && (
                        <div className="bg-surface rounded-theme-xl shadow-theme border border-theme-border p-12 text-center">
                            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-theme-text-muted">Loading next content...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TeachingFirstFlow;