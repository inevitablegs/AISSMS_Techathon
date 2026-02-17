// frontend/src/components/Learning/DiagnosticQuiz.jsx - Updated version

import React, { useState, useEffect } from 'react';

const DiagnosticQuiz = ({ atomId, questions, onSubmitAnswer, onComplete }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState([]);
    const [startTime, setStartTime] = useState(Date.now());
    const [showFeedback, setShowFeedback] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState('');

    useEffect(() => {
        setStartTime(Date.now());
    }, [currentIndex]);

    const handleAnswer = async (selectedIndex) => {
        const timeTaken = Math.floor((Date.now() - startTime) / 1000);
        const currentQuestion = questions[currentIndex];
        
        // Submit answer
        const result = await onSubmitAnswer(
            currentQuestion.id,
            selectedIndex,
            timeTaken
        );

        const isCorrect = result.success ? result.data.correct : false;
        
        // Store answer
        const newAnswers = [...answers, {
            question_id: currentQuestion.id,
            selected: selectedIndex,
            correct: isCorrect,
            time_taken: timeTaken
        }];
        
        setAnswers(newAnswers);
        
        // Show feedback
        setFeedbackMessage(isCorrect ? '✅ Correct!' : '❌ Not quite. Keep learning!');
        setShowFeedback(true);
        
        // Move to next question after delay
        setTimeout(() => {
            setShowFeedback(false);
            
            if (currentIndex < questions.length - 1) {
                setCurrentIndex(currentIndex + 1);
            } else {
                // All questions answered
                onComplete({
                    atom_id: atomId,
                    answers: newAnswers,
                    total_correct: newAnswers.filter(a => a.correct).length,
                    total_questions: newAnswers.length
                });
            }
        }, 1500);
    };

    if (!questions || questions.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-600">Loading diagnostic questions...</p>
            </div>
        );
    }

    const currentQuestion = questions[currentIndex];
    const progress = ((currentIndex + 1) / questions.length) * 100;

    return (
        <div className="max-w-3xl mx-auto p-6">
            <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">
                        Question {currentIndex + 1} of {questions.length}
                    </span>
                    <span className="text-sm font-medium text-blue-600">
                        {Math.round(progress)}% Complete
                    </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-8">
                <div className="mb-4 flex items-center justify-between">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        currentQuestion.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                        currentQuestion.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                    }`}>
                        {currentQuestion.difficulty?.charAt(0).toUpperCase() + currentQuestion.difficulty?.slice(1) || 'Medium'}
                    </span>
                    <span className="text-sm text-gray-500">
                        ⏱️ {currentQuestion.estimated_time || 60}s
                    </span>
                </div>

                <p className="text-2xl mb-8">{currentQuestion.question}</p>

                <div className="space-y-3">
                    {currentQuestion.options?.map((option, idx) => {
                        const isSelected = answers[currentIndex]?.selected === idx;
                        
                        let buttonClass = "w-full text-left p-4 rounded-lg border-2 transition ";
                        
                        if (showFeedback) {
                            if (isSelected) {
                                buttonClass += answers[currentIndex]?.correct 
                                    ? "border-green-500 bg-green-50" 
                                    : "border-red-500 bg-red-50";
                            } else {
                                buttonClass += "border-gray-200 opacity-50";
                            }
                        } else {
                            buttonClass += "border-gray-200 hover:border-blue-500 hover:bg-blue-50";
                        }
                        
                        return (
                            <button
                                key={idx}
                                onClick={() => !showFeedback && handleAnswer(idx)}
                                disabled={showFeedback}
                                className={buttonClass}
                            >
                                <span className="font-medium mr-3">
                                    {String.fromCharCode(65 + idx)}.
                                </span>
                                {option}
                            </button>
                        );
                    })}
                </div>

                {showFeedback && (
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg text-center">
                        <p className={`text-lg font-semibold ${
                            feedbackMessage.includes('✅') ? 'text-green-600' : 'text-orange-600'
                        }`}>
                            {feedbackMessage}
                        </p>
                    </div>
                )}
            </div>

            <div className="mt-4 text-sm text-gray-500 text-center">
                <p>💡 Take your time - understanding now prevents mistakes later!</p>
            </div>
        </div>
    );
};

export default DiagnosticQuiz;