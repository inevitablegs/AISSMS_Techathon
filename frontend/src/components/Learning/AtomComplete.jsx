// frontend/src/components/Learning/AtomComplete.jsx

import React from 'react';
import { useLearning } from '../../context/LearningContext';

const AtomComplete = ({ atom, onContinue }) => {
    const { atomMastery, currentTheta, answers } = useLearning();

    // Calculate stats
    const totalQuestions = answers.length;
    const correctCount = answers.filter(a => a.correct).length;
    const accuracy = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;
    const avgTime = answers.length > 0 
        ? Math.round(answers.reduce((sum, a) => sum + a.time_taken, 0) / answers.length) 
        : 0;

    return (
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            {/* Success Icon */}
            <div className="mb-6">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full">
                    <span className="text-5xl">🎉</span>
                </div>
            </div>

            <h2 className="text-3xl font-bold text-gray-800 mb-2">Atom Complete!</h2>
            <p className="text-xl text-green-600 mb-8">You've mastered: {atom?.name}</p>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                        {Math.round(atomMastery * 100)}%
                    </div>
                    <div className="text-sm text-gray-600">Final Mastery</div>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                        {accuracy.toFixed(0)}%
                    </div>
                    <div className="text-sm text-gray-600">Accuracy</div>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                        {correctCount}/{totalQuestions}
                    </div>
                    <div className="text-sm text-gray-600">Correct</div>
                </div>
                
                <div className="bg-orange-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                        {avgTime}s
                    </div>
                    <div className="text-sm text-gray-600">Avg Time</div>
                </div>
            </div>

            {/* Theta Change */}
            <div className="mb-8 p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">Ability (θ) Progress</div>
                <div className="text-2xl font-bold text-gray-800">
                    {currentTheta.toFixed(2)}
                </div>
            </div>

            {/* Continue Button */}
            <button
                onClick={onContinue}
                className="px-8 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
            >
                Continue to Next Atom →
            </button>

            <p className="mt-4 text-sm text-gray-500">
                You're making great progress! Keep going.
            </p>
        </div>
    );
};

export default AtomComplete;