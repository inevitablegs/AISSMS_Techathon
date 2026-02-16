import React, { useState, useEffect } from 'react';
import { useLearning } from '../../context/LearningContext';

const DiagnosticQuiz = ({ sessionId, questions, onComplete }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState([]);
    const [timeStart, setTimeStart] = useState(null);
    const [selected, setSelected] = useState(null);
    const [submitted, setSubmitted] = useState(false);

    const { submitDiagnostic, loading } = useLearning();

    useEffect(() => {
        setTimeStart(Date.now());
    }, [currentIndex]);

    const currentQuestion = questions[currentIndex];

    const handleOptionSelect = (index) => {
        if (!submitted) {
            setSelected(index);
        }
    };

    const handleSubmit = () => {
        if (selected === null) return;

        const timeTaken = (Date.now() - timeStart) / 1000; // in seconds

        const answer = {
            question_id: currentQuestion.id,
            selected: selected,
            time_taken: timeTaken
        };

        const newAnswers = [...answers, answer];
        setAnswers(newAnswers);
        setSubmitted(true);

        if (currentIndex < questions.length - 1) {
            setTimeout(() => {
                setCurrentIndex(currentIndex + 1);
                setSelected(null);
                setSubmitted(false);
            }, 1000);
        } else {
            // All questions answered, submit diagnostic
            submitDiagnostic(sessionId, newAnswers).then(result => {
                if (result.success) {
                    onComplete(result.data);
                }
            });
        }
    };

    if (!questions || questions.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-600">No diagnostic questions available.</p>
            </div>
        );
    }

    if (currentIndex >= questions.length) {
        return (
            <div className="text-center py-12">
                <p className="text-lg">Analyzing your responses...</p>
            </div>
        );
    }

    const isLast = currentIndex === questions.length - 1;

    return (
        <div className="max-w-3xl mx-auto">
            <div className="mb-8">
                <h2 className="text-2xl font-bold mb-2">Diagnostic Quiz</h2>
                <p className="text-gray-600">
                    Question {currentIndex + 1} of {questions.length}
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-4">
                    <div
                        className="bg-blue-600 h-2.5 rounded-full transition-all"
                        style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                    ></div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-8">
                <div className="mb-6">
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                        currentQuestion.difficulty === 'easy' 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                    }`}>
                        {currentQuestion.difficulty}
                    </span>
                    <span className="ml-2 text-sm text-gray-500">
                        ~{currentQuestion.estimated_time}s
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
                            } ${
                                submitted && idx === currentQuestion.correct_index
                                    ? 'bg-green-100 border-green-500'
                                    : submitted && selected === idx && idx !== currentQuestion.correct_index
                                    ? 'bg-red-100 border-red-500'
                                    : ''
                            }`}
                        >
                            <span className="font-medium mr-3">
                                {String.fromCharCode(65 + idx)}.
                            </span>
                            {option}
                        </button>
                    ))}
                </div>

                {submitted && (
                    <div className={`mt-6 p-4 rounded-lg ${
                        selected === currentQuestion.correct_index
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                    }`}>
                        {selected === currentQuestion.correct_index
                            ? '✅ Correct!'
                            : `❌ The correct answer is: ${
                                currentQuestion.options[currentQuestion.correct_index]
                              }`}
                    </div>
                )}

                {!submitted && (
                    <button
                        onClick={handleSubmit}
                        disabled={selected === null}
                        className="mt-6 w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Submit Answer
                    </button>
                )}

                {submitted && !isLast && (
                    <button
                        onClick={() => {
                            setCurrentIndex(currentIndex + 1);
                            setSelected(null);
                            setSubmitted(false);
                        }}
                        className="mt-6 w-full bg-gray-600 text-white py-3 rounded-lg font-semibold hover:bg-gray-700"
                    >
                        Next Question
                    </button>
                )}

                {submitted && isLast && loading && (
                    <div className="mt-6 text-center">
                        <p className="text-gray-600">Processing results...</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DiagnosticQuiz;