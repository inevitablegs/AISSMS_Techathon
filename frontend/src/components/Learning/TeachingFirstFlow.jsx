// frontend/src/components/Learning/TeachingFirstFlow.jsx - COMPLETE REWRITTEN VERSION

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLearning } from '../../context/LearningContext';
import TeachingModule from './TeachingModule';
import QuestionsFromTeaching from './QuestionsFromTeaching';
import AtomComplete from './AtomComplete';
import AtomReview from './AtomReview';

const TeachingFirstFlow = ({ conceptId }) => {
    const navigate = useNavigate();
    
    // Core state
    const [currentAtomData, setCurrentAtomData] = useState(null);
    const [sessionStarted, setSessionStarted] = useState(false);
    const [flowState, setFlowState] = useState('initializing'); // initializing, initial_quiz, teaching, questions, review, final_challenge, complete, concept_complete
    const [reviewMetrics, setReviewMetrics] = useState(null);
    const [error, setError] = useState(null);
    const [retryCount, setRetryCount] = useState(0);
    const [initialQuestions, setInitialQuestions] = useState([]);
    const [finalRecommendation, setFinalRecommendation] = useState('');
    const [nextAtomAfterFinal, setNextAtomAfterFinal] = useState(null);
    
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
        resetForNewAtom
    } = useLearning();

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

            if (data.all_completed || data.next_action?.action === 'concept_complete') {
                setFlowState('concept_complete');
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

        if (result.data.all_completed) {
            setFlowState('concept_complete');
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
    }, [currentSession, currentAtomData, completeFinalChallenge, resetForNewAtom]);

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
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="text-xl text-gray-600 mb-4">Preparing your adaptive learning session...</div>
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="mt-4 text-sm text-gray-500">Analyzing concept structure</p>
                </div>
            </div>
        );
    }

    // Error state
    if (flowState === 'error' && error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center max-w-md p-8 bg-white rounded-lg shadow-lg">
                    <div className="text-5xl mb-4">😕</div>
                    <h2 className="text-2xl font-bold text-red-600 mb-2">Something went wrong</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <div className="space-y-3">
                        <button 
                            onClick={handleRetry}
                            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Try Again
                        </button>
                        <button 
                            onClick={handleBackToDashboard}
                            className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
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
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center max-w-md p-8 bg-white rounded-lg shadow-lg">
                    <div className="text-5xl mb-4">🔍</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">No Active Session</h2>
                    <p className="text-gray-600 mb-6">We couldn't find an active learning session.</p>
                    <button 
                        onClick={handleBackToDashboard}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4">
                {/* Session Header with Real-time Stats */}
                <div className="mb-6 bg-white rounded-lg shadow p-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-xl font-bold text-gray-800">
                                {currentSession.concept_name || 'Learning Session'}
                            </h1>
                            <p className="text-sm text-gray-500">
                                {flowState === 'teaching' && '📖 Learning new concept'}
                                {flowState === 'questions' && '✍️ Answering questions'}
                                {flowState === 'review' && '🔄 Reviewing material'}
                                {flowState === 'complete' && '✅ Atom complete'}
                                {flowState === 'concept_complete' && '🎉 Concept mastered!'}
                                {flowState === 'loading' && '⏳ Loading...'}
                            </p>
                        </div>
                        
                        {/* Real-time Stats */}
                        <div className="flex space-x-4">
                            <div className="text-center">
                                <div className="text-xs text-gray-500">Mastery</div>
                                <div className="text-xl font-bold text-blue-600">
                                    {Math.round(atomMastery * 100)}%
                                </div>
                                <div className="w-20 h-1 bg-gray-200 rounded-full mt-1">
                                    <div 
                                        className="h-1 bg-blue-600 rounded-full transition-all duration-300"
                                        style={{ width: `${atomMastery * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                            
                            <div className="text-center">
                                <div className="text-xs text-gray-500">Ability (θ)</div>
                                <div className="text-xl font-bold text-purple-600">
                                    {currentTheta.toFixed(2)}
                                </div>
                            </div>
                            
                            {pacingDecision && pacingDecision !== 'stay' && (
                                <div className="text-center">
                                    <div className="text-xs text-gray-500">Pace</div>
                                    <div className={`text-sm font-bold px-2 py-1 rounded ${
                                        pacingDecision === 'speed_up' ? 'bg-green-100 text-green-800' :
                                        pacingDecision === 'slow_down' ? 'bg-yellow-100 text-yellow-800' :
                                        pacingDecision === 'sharp_slowdown' ? 'bg-red-100 text-red-800' :
                                        'bg-gray-100 text-gray-800'
                                    }`}>
                                        {pacingDecision === 'speed_up' && '⚡ Speed Up'}
                                        {pacingDecision === 'slow_down' && '🐢 Slow Down'}
                                        {pacingDecision === 'sharp_slowdown' && '⚠️ Careful'}
                                    </div>
                                </div>
                            )}
                            
                            {answers.length > 0 && (
                                <div className="text-center">
                                    <div className="text-xs text-gray-500">Questions</div>
                                    <div className="text-lg font-bold text-gray-700">
                                        {answers.length}
                                    </div>
                                </div>
                            )}
                        </div>
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
                    
                    {/* Concept Complete */}
                    {flowState === 'concept_complete' && (
                        <div className="bg-white rounded-lg shadow-lg p-12 text-center">
                            <div className="text-6xl mb-4">🏆</div>
                            <h2 className="text-3xl font-bold text-gray-800 mb-2">
                                Concept Mastered!
                            </h2>
                            <p className="text-xl text-gray-600 mb-8">
                                You've completed all atoms in this concept
                            </p>
                            
                            {/* Final Stats */}
                            <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mb-8">
                                <div className="bg-blue-50 p-4 rounded-lg">
                                    <div className="text-2xl font-bold text-blue-600">
                                        {Math.round(atomMastery * 100)}%
                                    </div>
                                    <div className="text-sm text-gray-600">Final Mastery</div>
                                </div>
                                <div className="bg-green-50 p-4 rounded-lg">
                                    <div className="text-2xl font-bold text-green-600">
                                        {currentTheta.toFixed(2)}
                                    </div>
                                    <div className="text-sm text-gray-600">Ability (θ)</div>
                                </div>
                                <div className="bg-purple-50 p-4 rounded-lg">
                                    <div className="text-2xl font-bold text-purple-600">
                                        {answers.length}
                                    </div>
                                    <div className="text-sm text-gray-600">Questions</div>
                                </div>
                            </div>
                            
                            <button
                                onClick={handleBackToDashboard}
                                className="px-8 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
                            >
                                Return to Dashboard
                            </button>
                        </div>
                    )}
                    
                    {/* Loading State for transitions */}
                    {flowState === 'loading' && (
                        <div className="bg-white rounded-lg shadow-lg p-12 text-center">
                            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-gray-600">Loading next content...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TeachingFirstFlow;