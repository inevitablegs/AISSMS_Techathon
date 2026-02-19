// frontend/src/components/Learning/TeachingModule.jsx - Enhanced version

import React, { useState, useEffect } from 'react';
import { useLearning } from '../../context/LearningContext';
import ExternalResources from './ExternalResources.jsx'

const TeachingModule = ({ 
    atom, 
    subject,     
    concept,
    teachingContent, 
    onContinue, 
    onBack,
    showBackButton = true 
}) => {
    const { currentSession } = useLearning();
    const [showDetails, setShowDetails] = useState({});
    const { pacingDecision, atomMastery, currentTheta } = useLearning();

    const displaySubject = subject || currentSession?.subject || '';
    const displayConcept = concept || currentSession?.concept_name || '';

    // If no teaching content, show loading or fallback
    if (!teachingContent) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-600">Loading teaching content...</p>
            </div>
        );
    }

    const {
        explanation,
        example,
        analogy,
        misconception,
        practical_application
    } = teachingContent;

    const toggleDetail = (key) => {
        setShowDetails(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    // Get adaptive message based on pacing
    const getAdaptiveMessage = () => {
        if (pacingDecision === 'sharp_slowdown') {
            return "Let's really focus on the fundamentals here. Take your time.";
        } else if (pacingDecision === 'slow_down') {
            return "We'll go through this carefully. No rush.";
        } else if (pacingDecision === 'speed_up') {
            return "You're ready for this! Let's move efficiently.";
        }
        return "Let's learn this concept step by step.";
    };

    return (
        <div className="bg-white rounded-lg shadow-lg p-8">
            {/* Header with real-time mastery */}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">{atom.name}</h2>
                    <p className="text-sm text-gray-500 mt-1">{getAdaptiveMessage()}</p>
                </div>
                
                {/* Mastery Indicator */}
                <div className="bg-blue-50 px-4 py-2 rounded-lg">
                    <div className="text-xs text-gray-500">Current Mastery</div>
                    <div className="text-xl font-bold text-blue-600">
                        {Math.round(atomMastery * 100)}%
                    </div>
                </div>
            </div>

            {/* Pacing Indicator */}
            {pacingDecision && pacingDecision !== 'stay' && (
                <div className={`mb-4 p-2 rounded-lg text-sm ${
                    pacingDecision === 'speed_up' ? 'bg-green-100 text-green-800' :
                    pacingDecision === 'slow_down' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                }`}>
                    <span className="font-medium">Pacing: </span>
                    {pacingDecision === 'speed_up' && '⚡ Moving faster - you\'re ready!'}
                    {pacingDecision === 'slow_down' && '🐢 Taking it slower - let\'s build foundation'}
                    {pacingDecision === 'sharp_slowdown' && '⚠️ Really focusing on basics'}
                </div>
            )}

            {/* Main Explanation */}
            <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2 flex items-center">
                    <span className="bg-blue-100 text-blue-800 p-1 rounded mr-2">📖</span>
                    Explanation
                </h3>
                <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-gray-800">{explanation}</p>
                </div>
            </div>

            <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2 flex items-center">
                    <span className="bg-blue-100 text-blue-800 p-1 rounded mr-2">📖</span>
                    External
                </h3>
                <div className="bg-blue-50 p-4 rounded-lg">
                    {/* External Resources - only show if we have subject and concept */}
                    {displaySubject && displayConcept && (
                        <ExternalResources 
                            subject={displaySubject}
                            concept={displayConcept}
                            atomName={atom?.name}
                        />
                    )}
                </div>
            </div>

            

            {/* Collapsible Sections */}
            <div className="space-y-3">
                {/* Example */}
                <div className="border rounded-lg overflow-hidden">
                    <button
                        onClick={() => toggleDetail('example')}
                        className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100"
                    >
                        <span className="font-medium flex items-center">
                            <span className="text-green-600 mr-2">💡</span>
                            Example
                        </span>
                        <span>{showDetails.example ? '▼' : '▶'}</span>
                    </button>
                    {showDetails.example && (
                        <div className="p-4 bg-white">
                            <p className="text-gray-700">{example}</p>
                        </div>
                    )}
                </div>

                {/* Analogy */}
                <div className="border rounded-lg overflow-hidden">
                    <button
                        onClick={() => toggleDetail('analogy')}
                        className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100"
                    >
                        <span className="font-medium flex items-center">
                            <span className="text-purple-600 mr-2">🔄</span>
                            Analogy
                        </span>
                        <span>{showDetails.analogy ? '▼' : '▶'}</span>
                    </button>
                    {showDetails.analogy && (
                        <div className="p-4 bg-white">
                            <p className="text-gray-700">{analogy}</p>
                        </div>
                    )}
                </div>

                {/* Common Misconception */}
                {misconception && (
                    <div className="border rounded-lg overflow-hidden">
                        <button
                            onClick={() => toggleDetail('misconception')}
                            className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100"
                        >
                            <span className="font-medium flex items-center">
                                <span className="text-red-600 mr-2">⚠️</span>
                                Common Misconception
                            </span>
                            <span>{showDetails.misconception ? '▼' : '▶'}</span>
                        </button>
                        {showDetails.misconception && (
                            <div className="p-4 bg-white">
                                <p className="text-gray-700">{misconception}</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Practical Application */}
                {practical_application && (
                    <div className="border rounded-lg overflow-hidden">
                        <button
                            onClick={() => toggleDetail('practical')}
                            className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100"
                        >
                            <span className="font-medium flex items-center">
                                <span className="text-orange-600 mr-2">🚀</span>
                                Why This Matters
                            </span>
                            <span>{showDetails.practical ? '▼' : '▶'}</span>
                        </button>
                        {showDetails.practical && (
                            <div className="p-4 bg-white">
                                <p className="text-gray-700">{practical_application}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Progress indicator */}
            <div className="mt-6">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Ready for questions?</span>
                    <span>Mastery needed: 70%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, atomMastery * 100)}%` }}
                    ></div>
                </div>
            </div>

            

            {/* Continue Button */}
            <div className="mt-6 flex justify-between">
                {showBackButton && (
                    <button
                        onClick={onBack}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                        ← Back
                    </button>
                )}
                <button
                    onClick={onContinue}
                    className="ml-auto px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                    Continue to Questions →
                </button>
            </div>

            {/* Learning Tip */}
            <div className="mt-4 text-xs text-gray-400 text-center">
                <span>✨ Read carefully - questions will be based on this material</span>
            </div>
        </div>
    );
};

export default TeachingModule;