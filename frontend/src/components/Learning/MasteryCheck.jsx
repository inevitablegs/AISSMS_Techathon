import React, { useState, useEffect } from 'react';
import { useLearning } from '../../context/LearningContext';

const MasteryCheck = ({ atomId, onComplete }) => {
    const [questions, setQuestions] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState([]);
    const [showResults, setShowResults] = useState(false);

    const { getPracticeQuestions, submitPracticeAnswer } = useLearning();

    useEffect(() => {
        loadMasteryQuestions();
    }, [atomId]);

    const loadMasteryQuestions = async () => {
        // Get mixed difficulty questions for mastery check
        const easyResult = await getPracticeQuestions(atomId, 'easy', 1);
        const mediumResult = await getPracticeQuestions(atomId, 'medium', 1);
        
        const allQuestions = [
            ...(easyResult.success ? easyResult.data.questions : []),
            ...(mediumResult.success ? mediumResult.data.questions : [])
        ];
        
        setQuestions(allQuestions);
    };

    const handleAnswer = async (selected, timeTaken) => {
        const result = await submitPracticeAnswer(
            questions[currentIndex].id,
            selected,
            timeTaken,
            false
        );

        const newAnswers = [...answers, {
            question_id: questions[currentIndex].id,
            correct: result.success ? result.data.correct : false,
            selected: selected
        }];
        setAnswers(newAnswers);

        if (currentIndex < questions.length - 1) {
            setCurrentIndex(currentIndex + 1);
        } else {
            setShowResults(true);
        }
    };

    if (questions.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-600">Loading mastery check...</p>
            </div>
        );
    }

    if (showResults) {
        const correctCount = answers.filter(a => a.correct).length;
        const passed = correctCount >= 2; // Pass if at least 2 correct

        return (
            <div className="max-w-2xl mx-auto text-center">
                <h2 className="text-3xl font-bold mb-6">Mastery Check Complete</h2>
                
                <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
                    <p className="text-xl mb-4">
                        You got {correctCount} out of {questions.length} correct
                    </p>
                    
                    {passed ? (
                        <div>
                            <div className="text-6xl mb-4">🎉</div>
                            <p className="text-lg text-green-600 mb-4">
                                Congratulations! You've mastered this concept!
                            </p>
                        </div>
                    ) : (
                        <div>
                            <div className="text-6xl mb-4">📚</div>
                            <p className="text-lg text-orange-600 mb-4">
                                Let's do a bit more practice to solidify your understanding.
                            </p>
                        </div>
                    )}
                </div>

                <button
                    onClick={() => onComplete(passed)}
                    className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700"
                >
                    {passed ? 'Continue to Next Concept' : 'Continue Practice'}
                </button>
            </div>
        );
    }

    const currentQuestion = questions[currentIndex];

    return (
        <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold mb-2">Mastery Check</h2>
            <p className="text-gray-600 mb-8">
                Question {currentIndex + 1} of {questions.length}
            </p>

            <div className="bg-white rounded-lg shadow-lg p-8">
                <h3 className="text-xl mb-6">{currentQuestion.question}</h3>

                <div className="space-y-3">
                    {currentQuestion.options.map((option, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleAnswer(idx, 30)} // Simplified time tracking
                            className="w-full text-left p-4 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition"
                        >
                            <span className="font-medium mr-3">
                                {String.fromCharCode(65 + idx)}.
                            </span>
                            {option}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MasteryCheck;