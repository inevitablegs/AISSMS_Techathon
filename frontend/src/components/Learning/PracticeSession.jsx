import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLearning } from '../../context/LearningContext';

const PracticeSession = ({ atomId, onComplete }) => {
    const [questions, setQuestions] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selected, setSelected] = useState(null);
    const [submitted, setSubmitted] = useState(false);
    const [hint, setHint] = useState(null);
    const [errorCount, setErrorCount] = useState(0);
    const [lastAnswerCorrect, setLastAnswerCorrect] = useState(null);
    const [sessionData, setSessionData] = useState({
        questionsAnswered: [],
        masteryScore: 0,
        streak: 0
    });

    const questionStartRef = useRef(0);

    const { getPracticeQuestions, submitPracticeAnswer, getHint, loading } = useLearning();

    const loadQuestions = useCallback(async (difficulty = 'easy') => {
        const result = await getPracticeQuestions(atomId, difficulty, 3);
        if (result.success) {
            setQuestions(result.data.questions);
            setSessionData(prev => ({
                ...prev,
                masteryScore: result.data.mastery_score
            }));

            setCurrentIndex(0);
            setSelected(null);
            setSubmitted(false);
            setHint(null);
            setLastAnswerCorrect(null);
            questionStartRef.current = Date.now();
        }
    }, [atomId, getPracticeQuestions]);

    useEffect(() => {
        loadQuestions();
    }, [loadQuestions]);

    useEffect(() => {
        questionStartRef.current = Date.now();
    }, [currentIndex, questions]);

    const currentQuestion = questions[currentIndex];

    const handleOptionSelect = (index) => {
        if (!submitted) {
            setSelected(index);
        }
    };

    const handleSubmit = async () => {
        if (selected === null) return;

        const timeTaken = (Date.now() - questionStartRef.current) / 1000;
        const result = await submitPracticeAnswer(
            currentQuestion.id,
            selected,
            timeTaken,
            hint !== null
        );

        if (result.success) {
            setSubmitted(true);
            setLastAnswerCorrect(result.data.correct);
            setSessionData(prev => ({
                ...prev,
                masteryScore: result.data.mastery_score,
                streak: result.data.streak
            }));

            if (!result.data.correct) {
                setErrorCount(prev => prev + 1);
            } else {
                setErrorCount(0);
            }

            if (result.data.mastery_achieved) {
                setTimeout(() => {
                    onComplete(atomId, true);
                }, 2000);
            } else if (currentIndex < questions.length - 1) {
                setTimeout(() => {
                    setCurrentIndex(currentIndex + 1);
                    setSelected(null);
                    setSubmitted(false);
                    setHint(null);
                    setLastAnswerCorrect(null);
                }, 1500);
            } else {
                // End of questions, load more
                setTimeout(() => {
                    loadQuestions(result.data.next_difficulty);
                }, 1500);
            }
        }
    };

    const handleGetHint = async () => {
        if (hint) return; // Already showing hint

        const result = await getHint(currentQuestion.id, errorCount);
        if (result.success) {
            setHint(result.data.hint);
        }
    };

    if (!questions || questions.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-600">Loading practice questions...</p>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto">
            <div className="mb-8">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold">Practice Session</h2>
                    <div className="text-right">
                        <p className="text-sm text-gray-600">Mastery Score</p>
                        <div className="flex items-center">
                            <div className="w-32 bg-gray-200 rounded-full h-2.5 mr-2">
                                <div
                                    className="bg-green-600 h-2.5 rounded-full"
                                    style={{ width: `${sessionData.masteryScore * 100}%` }}
                                ></div>
                            </div>
                            <span className="text-sm font-medium">
                                {Math.round(sessionData.masteryScore * 100)}%
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Streak: {sessionData.streak} 🔥
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-8">
                <div className="mb-6 flex justify-between items-center">
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                        currentQuestion.difficulty === 'easy' 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                    }`}>
                        {currentQuestion.difficulty}
                    </span>
                    <span className="text-sm text-gray-500">
                        {currentQuestion.cognitive_operation}
                    </span>
                </div>

                <h3 className="text-xl mb-6">{currentQuestion.question}</h3>

                <div className="space-y-3">
                    {currentQuestion.options.map((option, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleOptionSelect(idx)}
                            disabled={submitted}
                            className={`w-full text-left p-4 rounded-lg border transition ${
                                selected === idx
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 hover:border-blue-300'
                            }`}
                        >
                            <span className="font-medium mr-3">
                                {String.fromCharCode(65 + idx)}.
                            </span>
                            {option}
                        </button>
                    ))}
                </div>

                {hint && (
                    <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-yellow-800">
                            <span className="font-bold">Hint:</span> {hint}
                        </p>
                    </div>
                )}

                {submitted && (
                    <div className={`mt-4 p-4 rounded-lg ${
                        lastAnswerCorrect
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                    }`}>
                        {lastAnswerCorrect ? '✅ Correct!' : '❌ Try again next time!'}
                    </div>
                )}

                <div className="mt-6 flex space-x-4">
                    {!submitted && (
                        <>
                            <button
                                onClick={handleSubmit}
                                disabled={selected === null}
                                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Submit Answer
                            </button>
                            
                            <button
                                onClick={handleGetHint}
                                disabled={hint !== null}
                                className="px-6 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 disabled:opacity-50"
                            >
                                💡 Hint
                            </button>
                        </>
                    )}
                </div>

                {submitted && loading && (
                    <p className="text-center text-gray-600 mt-4">Loading next question...</p>
                )}
            </div>

            <div className="mt-4 text-sm text-gray-500">
                <p>ℹ️ You can use hints if stuck, but they'll affect your mastery score.</p>
            </div>
        </div>
    );
};

export default PracticeSession;