import React, { useState, useEffect } from 'react';

const QuestionsFromTeaching = ({ 
    questions, 
    atomName, 
    sessionId,
    atomId,
    onAnswerSubmit, 
    onComplete,
    loading,
    pacing 
}) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState(null);
    const [answerSubmitted, setAnswerSubmitted] = useState(false);
    const [result, setResult] = useState(null);
    const [startTime, setStartTime] = useState(Date.now());
    const [answers, setAnswers] = useState([]);
    const [showContinue, setShowContinue] = useState(false);

    useEffect(() => {
        // Reset timer when question changes
        setStartTime(Date.now());
        setSelectedOption(null);
        setAnswerSubmitted(false);
        setResult(null);
        setShowContinue(false);
    }, [currentIndex]);

    const currentQuestion = questions[currentIndex];
    const isLast = currentIndex === questions.length - 1;

    // Get pacing-based styling
    const getPacingColor = () => {
        const colors = {
            'sharp_slowdown': 'red',
            'slow_down': 'orange',
            'stay': 'blue',
            'speed_up': 'green'
        };
        return colors[pacing] || 'blue';
    };

    const getPacingMessage = () => {
        const messages = {
            'sharp_slowdown': 'Take your time, think carefully',
            'slow_down': 'Read each option thoroughly',
            'stay': 'Answer at your normal pace',
            'speed_up': 'Try to answer confidently and quickly'
        };
        return messages[pacing] || '';
    };

    const handleOptionSelect = (index) => {
        if (!answerSubmitted) {
            setSelectedOption(index);
        }
    };

    const handleSubmit = async () => {
        if (selectedOption === null) return;

        const timeTaken = Math.round((Date.now() - startTime) / 1000);
        
        setAnswerSubmitted(true);
        
        const result = await onAnswerSubmit(
            currentIndex,
            selectedOption,
            timeTaken
        );

        if (result.success) {
            setResult(result.data);
            
            // Store answer
            setAnswers(prev => [...prev, {
                questionIndex: currentIndex,
                selected: selectedOption,
                correct: result.data.correct,
                mastery_after: result.data.new_mastery,
                behavior: result.data.behavior,
                time_taken: timeTaken
            }]);

            // Auto-show continue button after short delay
            setTimeout(() => {
                setShowContinue(true);
            }, 1500);
        } else {
            setAnswerSubmitted(false);
            // Show error but don't ask to continue
            console.error('Answer submission failed:', result.error);
        }
    };

    const handleContinue = () => {
        if (isLast) {
            // NO ALERT! Just call onComplete and let the system decide
            onComplete();
        } else {
            setCurrentIndex(prev => prev + 1);
        }
    };

    if (!currentQuestion) {
        return (
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                <p className="text-red-600">No questions available.</p>
            </div>
        );
    }

    // Calculate progress
    const progress = ((currentIndex + 1) / questions.length) * 100;
    const pacingColor = getPacingColor();

    return (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Header with pacing */}
            <div className={`bg-gradient-to-r from-${pacingColor}-600 to-${pacingColor}-800 px-6 py-4`}>
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-white">Assessment: {atomName}</h2>
                        <p className={`text-${pacingColor}-100 text-sm mt-1`}>
                            Question {currentIndex + 1} of {questions.length}
                        </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium bg-${pacingColor}-100 text-${pacingColor}-800`}>
                        {getPacingMessage()}
                    </span>
                </div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-gray-200 h-2">
                <div 
                    className={`bg-${pacingColor}-600 h-2 transition-all duration-300`}
                    style={{ width: `${progress}%` }}
                ></div>
            </div>

            {/* Question content */}
            <div className="p-6">
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${pacingColor}-100 text-${pacingColor}-800`}>
                            Difficulty: {currentQuestion.difficulty}
                        </span>
                        <span className="text-sm text-gray-500">
                            ⏱️ {currentQuestion.estimated_time}s
                        </span>
                    </div>
                    
                    <p className="text-lg text-gray-800 font-medium">
                        {currentQuestion.question}
                    </p>
                </div>

                {/* Options */}
                <div className="space-y-3 mb-6">
                    {currentQuestion.options.map((option, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleOptionSelect(idx)}
                            disabled={answerSubmitted}
                            className={`w-full text-left p-4 rounded-lg border-2 transition ${
                                selectedOption === idx
                                    ? answerSubmitted
                                        ? result?.correct
                                            ? 'border-green-500 bg-green-50'
                                            : result?.correct_index === idx
                                            ? 'border-green-500 bg-green-50'
                                            : 'border-red-500 bg-red-50'
                                        : `border-${pacingColor}-500 bg-${pacingColor}-50`
                                    : answerSubmitted && result?.correct_index === idx
                                    ? 'border-green-500 bg-green-50'
                                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                        >
                            <span className="font-medium">{String.fromCharCode(65 + idx)}.</span>
                            <span className="ml-2">{option}</span>
                            {answerSubmitted && result?.correct_index === idx && (
                                <span className="float-right text-green-600">✓ Correct</span>
                            )}
                            {answerSubmitted && selectedOption === idx && !result?.correct && (
                                <span className="float-right text-red-600">✗ Incorrect</span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Answer feedback */}
                {result && (
                    <div className={`mb-6 p-4 rounded-lg ${
                        result.correct ? 'bg-green-50 border border-green-200' : 'bg-orange-50 border border-orange-200'
                    }`}>
                        <p className={`font-medium ${
                            result.correct ? 'text-green-800' : 'text-orange-800'
                        }`}>
                            {result.correct ? '✅ Correct!' : '❌ Not quite right'}
                        </p>
                        <div className="mt-2 text-sm">
                            <p className="text-gray-600">
                                Mastery: {Math.round(result.new_mastery * 100)}% 
                                {result.improvement > 0 && (
                                    <span className="text-green-600 ml-2">
                                        ↑ +{Math.round(result.improvement * 100)}%
                                    </span>
                                )}
                            </p>
                            {result.streak > 0 && (
                                <p className="text-orange-600 mt-1">🔥 Streak: {result.streak}</p>
                            )}
                            {result.behavior && (
                                <p className="text-purple-600 mt-1">
                                    Behavior: {result.behavior.replace('_', ' ')}
                                </p>
                            )}
                            {result.error_type && (
                                <p className="text-red-600 mt-1">
                                    Error type: {result.error_type}
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Action buttons */}
                {!answerSubmitted ? (
                    <button
                        onClick={handleSubmit}
                        disabled={selectedOption === null || loading}
                        className={`w-full bg-${pacingColor}-600 hover:bg-${pacingColor}-700 text-white font-bold py-3 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        Submit Answer
                    </button>
                ) : showContinue && (
                    <button
                        onClick={handleContinue}
                        disabled={loading}
                        className={`w-full bg-${pacingColor}-600 hover:bg-${pacingColor}-700 text-white font-bold py-3 px-4 rounded-lg transition`}
                    >
                        {isLast ? 'Complete Assessment' : 'Next Question'}
                    </button>
                )}

                {/* Progress indicator */}
                <div className="mt-4 text-center text-sm text-gray-500">
                    {!isLast && answerSubmitted && showContinue && (
                        <p>Question {currentIndex + 1} of {questions.length} completed</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QuestionsFromTeaching;