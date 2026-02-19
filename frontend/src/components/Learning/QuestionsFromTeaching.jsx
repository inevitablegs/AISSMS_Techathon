// frontend/src/components/Learning/QuestionsFromTeaching.jsx - Enhanced version

import React, { useState, useEffect } from 'react';
import { useLearning } from '../../context/LearningContext';

const QuestionsFromTeaching = ({ 
    questions, 
    atomName,
    sessionId,
    atomId,
    onComplete,
    onBackToTeaching,
    onSubmitAnswer,
    showMetrics = true
}) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState(null);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [feedback, setFeedback] = useState(null);
    const [startTime, setStartTime] = useState(Date.now());
    const [showPacingAlert, setShowPacingAlert] = useState(false);
    
    const { 
        submitAtomAnswer, 
        nextQuestion,
        atomMastery, 
        currentTheta,
        pacingDecision,
        nextAction,
        metrics,
        loading 
    } = useLearning();

    const submitFn = onSubmitAnswer || submitAtomAnswer;

    const currentQuestion = questions[currentIndex];

    // Reset timer when question changes
    useEffect(() => {
        setStartTime(Date.now());
        setSelectedOption(null);
        setIsSubmitted(false);
        setFeedback(null);
        setShowPacingAlert(false);
    }, [currentIndex]);

    // Handle pacing decision alerts
    useEffect(() => {
        if (pacingDecision && isSubmitted) {
            setShowPacingAlert(true);
            
            // Auto-hide after 3 seconds
            const timer = setTimeout(() => {
                setShowPacingAlert(false);
            }, 3000);
            
            return () => clearTimeout(timer);
        }
    }, [pacingDecision, isSubmitted]);

    const handleOptionSelect = (index) => {
        if (!isSubmitted) {
            setSelectedOption(index);
        }
    };

    const handleSubmit = async () => {
        if (selectedOption === null) return;
        
        const timeTaken = Math.round((Date.now() - startTime) / 1000);
        
        const result = await submitFn({
            session_id: sessionId,
            atom_id: atomId,
            question_index: currentIndex,
            selected: selectedOption,
            time_taken: timeTaken
        });
        
        if (result.success) {
            const data = result.data;
            setIsSubmitted(true);
            
            // Set feedback based on result
            setFeedback({
                correct: data.correct,
                error_type: data.error_type,
                message: data.correct ? '✅ Correct!' : '❌ Not quite right',
                mastery_change: data.metrics?.mastery_change?.toFixed(2) || '0',
                theta_change: data.metrics?.theta_change?.toFixed(2) || '0',
                explanation: data.explanation || '',
                correct_index: data.correct_index
            });
        }
    };

    const handleNext = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
            nextQuestion();
        } else {
            // All questions completed
            onComplete();
        }
    };

    const getPacingMessage = () => {
        switch(pacingDecision) {
            case 'speed_up':
                return '⚡ You\'re doing great! Ready for a challenge!';
            case 'slow_down':
                return '🐢 Let\'s take it a bit slower.';
            case 'sharp_slowdown':
                return '⚠️ Let\'s review the basics.';
            case 'stay':
            default:
                return '👍 Keep going at this pace.';
        }
    };

    const getPacingColor = () => {
        switch(pacingDecision) {
            case 'speed_up': return 'bg-green-100 text-green-800 border-green-300';
            case 'slow_down': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
            case 'sharp_slowdown': return 'bg-red-100 text-red-800 border-red-300';
            default: return 'bg-blue-100 text-blue-800 border-blue-300';
        }
    };

    if (!currentQuestion) {
        return (
            <div className="text-center py-8">
                <p className="text-gray-600">No questions available.</p>
            </div>
        );
    }

    const correctIndex = feedback?.correct_index ?? currentQuestion.correct_index;

    return (
        <div className="bg-white rounded-lg shadow-lg p-6">
            {/* Real-time Mastery Display */}
            {showMetrics && (
            <div className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-100">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-sm font-semibold text-gray-600">REAL-TIME MASTERY</h3>
                        <div className="flex items-center space-x-4 mt-2">
                            <div>
                                <span className="text-2xl font-bold text-blue-600">
                                    {Math.round(atomMastery * 100)}%
                                </span>
                                <span className="text-sm text-gray-500 ml-2">mastery</span>
                            </div>
                            <div className="w-px h-8 bg-gray-300"></div>
                            <div>
                                <span className="text-xl font-semibold text-purple-600">
                                    θ = {currentTheta.toFixed(2)}
                                </span>
                                <span className="text-sm text-gray-500 ml-2">ability</span>
                            </div>
                        </div>
                    </div>
                    
                    {/* Pacing Badge */}
                    {showMetrics && pacingDecision && (
                        <div className={`px-3 py-1 rounded-full border ${getPacingColor()}`}>
                            <span className="text-sm font-medium">
                                {pacingDecision.replace('_', ' ').toUpperCase()}
                            </span>
                        </div>
                    )}
                </div>
                
                {/* Progress Bar */}
                <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                            style={{ width: `${atomMastery * 100}%` }}
                        ></div>
                    </div>
                </div>
            </div>
            )}

            {/* Pacing Alert */}
            {showMetrics && showPacingAlert && (
                <div className={`mb-4 p-3 rounded-lg border ${getPacingColor()} animate-pulse`}>
                    <p className="text-sm font-medium">{getPacingMessage()}</p>
                </div>
            )}

            {/* Question Header */}
            <div className="mb-4 flex justify-between items-center">
                <div>
                    <span className="text-sm text-gray-500">
                        Question {currentIndex + 1} of {questions.length}
                    </span>
                    <h2 className="text-xl font-bold mt-1">{atomName}</h2>
                </div>
                <div className="flex space-x-2">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        currentQuestion.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                        currentQuestion.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                    }`}>
                        {currentQuestion.difficulty?.toUpperCase()}
                    </span>
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-semibold">
                        {currentQuestion.cognitive_operation?.toUpperCase()}
                    </span>
                </div>
            </div>

            {/* Question Text */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-lg">{currentQuestion.question}</p>
            </div>

            {/* Options */}
            <div className="space-y-3 mb-6">
                {currentQuestion.options?.map((option, index) => (
                    <button
                        key={index}
                        onClick={() => handleOptionSelect(index)}
                        disabled={isSubmitted}
                        className={`w-full text-left p-4 rounded-lg border-2 transition ${
                            selectedOption === index
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        } ${
                            isSubmitted && index === correctIndex
                                ? 'border-green-500 bg-green-50'
                                : isSubmitted && selectedOption === index && selectedOption !== correctIndex
                                ? 'border-red-500 bg-red-50'
                                : ''
                        }`}
                    >
                        <span className="font-medium mr-2">
                            {String.fromCharCode(65 + index)}.
                        </span>
                        {option}
                    </button>
                ))}
            </div>

            {/* Feedback Section */}
            {feedback && (
                <div className={`mb-4 p-4 rounded-lg ${
                    feedback.correct ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}>
                    <div className="flex justify-between items-center">
                        <div>
                            <p className={`font-semibold ${
                                feedback.correct ? 'text-green-700' : 'text-red-700'
                            }`}>
                                {feedback.message}
                            </p>
                            {!feedback.correct && feedback.error_type && (
                                <p className="text-sm text-gray-600 mt-1">
                                    Error type: <span className="font-medium capitalize">{feedback.error_type}</span>
                                </p>
                            )}
                            {!feedback.correct && feedback.explanation && (
                                <p className="text-sm text-gray-600 mt-1">
                                    {feedback.explanation}
                                </p>
                            )}
                        </div>
                        <div className="text-right">
                            {showMetrics && (
                                <>
                                    <p className="text-sm text-gray-600">
                                        Mastery: <span className="font-bold text-blue-600">{feedback.mastery_change}</span>
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        θ: <span className="font-bold text-purple-600">{feedback.theta_change}</span>
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between">
                <button
                    onClick={onBackToTeaching}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                    ← Back to Teaching
                </button>
                
                {!isSubmitted ? (
                    <button
                        onClick={handleSubmit}
                        disabled={selectedOption === null || loading}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Submitting...' : 'Submit Answer'}
                    </button>
                ) : (
                    <button
                        onClick={handleNext}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                        {currentIndex < questions.length - 1 ? 'Next Question →' : 'Complete Atom →'}
                    </button>
                )}
            </div>

            {/* Learning Metrics */}
            {showMetrics && Object.keys(metrics).length > 0 && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-600 mb-2">Learning Metrics</h4>
                    <div className="grid grid-cols-4 gap-2 text-xs">
                        <div className="bg-gray-50 p-2 rounded">
                            <span className="text-gray-500">Confidence:</span>
                            <span className="ml-1 font-bold">{(metrics.confidence * 100).toFixed(0)}%</span>
                        </div>
                        <div className="bg-gray-50 p-2 rounded">
                            <span className="text-gray-500">Quality:</span>
                            <span className="ml-1 font-bold">{metrics.performance_quality?.toFixed(2)}</span>
                        </div>
                        <div className="bg-gray-50 p-2 rounded">
                            <span className="text-gray-500">Learning rate:</span>
                            <span className="ml-1 font-bold">{metrics.learning_rate?.toFixed(2)}</span>
                        </div>
                        <div className="bg-gray-50 p-2 rounded">
                            <span className="text-gray-500">Next:</span>
                            <span className="ml-1 font-bold capitalize">{nextAction?.replace('_', ' ')}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuestionsFromTeaching;