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
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-theme-text-muted">Loading teaching content...</p>
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
        <div className="bg-surface rounded-theme-xl shadow-theme border border-theme-border p-8">
            {/* Header with real-time mastery */}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-theme-text">{atom.name}</h2>
                    <p className="text-sm text-theme-text-muted mt-1">{getAdaptiveMessage()}</p>
                </div>
                
                {/* Mastery Indicator */}
                <div className="bg-primary/10 px-4 py-2 rounded-theme-lg">
                    <div className="text-xs text-theme-text-muted">Current Mastery</div>
                    <div className="text-xl font-bold text-primary">
                        {Math.round(atomMastery * 100)}%
                    </div>
                </div>
            </div>

            {/* Pacing Indicator */}
            {pacingDecision && pacingDecision !== 'stay' && (
                <div className={`mb-4 p-2 rounded-theme-lg text-sm ${
                    pacingDecision === 'speed_up' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                    pacingDecision === 'slow_down' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                    'bg-error/10 text-error'
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
                    <span className="bg-primary/10 text-primary p-1 rounded-theme mr-2">📖</span>
                    Explanation
                </h3>
                <div className="bg-primary/5 p-4 rounded-theme-lg border border-primary/10">
                    <p className="text-theme-text">{explanation}</p>
                </div>
            </div>

            <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2 flex items-center">
                    <span className="bg-primary/10 text-primary p-1 rounded-theme mr-2">📖</span>
                    External
                </h3>
                <div className="bg-primary/5 p-4 rounded-theme-lg border border-primary/10">
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
                <div className="border border-theme-border rounded-theme-lg overflow-hidden">
                    <button
                        onClick={() => toggleDetail('example')}
                        className="w-full flex justify-between items-center p-4 bg-theme-bg hover:bg-theme-border/50 transition-colors"
                    >
                        <span className="font-medium flex items-center text-theme-text">
                            <span className="text-emerald-500 mr-2">💡</span>
                            Example
                        </span>
                        <span className="text-theme-text-muted">{showDetails.example ? '▼' : '▶'}</span>
                    </button>
                    {showDetails.example && (
                        <div className="p-4 bg-surface border-t border-theme-border">
                            <p className="text-theme-text-secondary">{example}</p>
                        </div>
                    )}
                </div>

                {/* Analogy */}
                <div className="border border-theme-border rounded-theme-lg overflow-hidden">
                    <button
                        onClick={() => toggleDetail('analogy')}
                        className="w-full flex justify-between items-center p-4 bg-theme-bg hover:bg-theme-border/50 transition-colors"
                    >
                        <span className="font-medium flex items-center text-theme-text">
                            <span className="text-violet-500 mr-2">🔄</span>
                            Analogy
                        </span>
                        <span className="text-theme-text-muted">{showDetails.analogy ? '▼' : '▶'}</span>
                    </button>
                    {showDetails.analogy && (
                        <div className="p-4 bg-surface border-t border-theme-border">
                            <p className="text-theme-text-secondary">{analogy}</p>
                        </div>
                    )}
                </div>

                {/* Common Misconception */}
                {misconception && (
                    <div className="border border-theme-border rounded-theme-lg overflow-hidden">
                        <button
                            onClick={() => toggleDetail('misconception')}
                            className="w-full flex justify-between items-center p-4 bg-theme-bg hover:bg-theme-border/50 transition-colors"
                        >
                            <span className="font-medium flex items-center text-theme-text">
                                <span className="text-error mr-2">⚠️</span>
                                Common Misconception
                            </span>
                            <span className="text-theme-text-muted">{showDetails.misconception ? '▼' : '▶'}</span>
                        </button>
                        {showDetails.misconception && (
                            <div className="p-4 bg-surface border-t border-theme-border">
                                <p className="text-theme-text-secondary">{misconception}</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Practical Application */}
                {practical_application && (
                    <div className="border border-theme-border rounded-theme-lg overflow-hidden">
                        <button
                            onClick={() => toggleDetail('practical')}
                            className="w-full flex justify-between items-center p-4 bg-theme-bg hover:bg-theme-border/50 transition-colors"
                        >
                            <span className="font-medium flex items-center text-theme-text">
                                <span className="text-orange-500 mr-2">🚀</span>
                                Why This Matters
                            </span>
                            <span className="text-theme-text-muted">{showDetails.practical ? '▼' : '▶'}</span>
                        </button>
                        {showDetails.practical && (
                            <div className="p-4 bg-surface border-t border-theme-border">
                                <p className="text-theme-text-secondary">{practical_application}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Progress indicator */}
            <div className="mt-6">
                <div className="flex justify-between text-sm text-theme-text-muted mb-1">
                    <span>Ready for questions?</span>
                    <span>Mastery needed: 70%</span>
                </div>
                <div className="w-full bg-theme-border rounded-full h-2">
                    <div 
                        className="gradient-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, atomMastery * 100)}%` }}
                    ></div>
                </div>
            </div>

            

            {/* Continue Button */}
            <div className="mt-6 flex justify-between">
                {showBackButton && (
                    <button
                        onClick={onBack}
                        className="px-4 py-2 bg-theme-bg text-theme-text-secondary rounded-theme-lg hover:bg-theme-border transition-colors"
                    >
                        ← Back
                    </button>
                )}
                <button
                    onClick={onContinue}
                    className="ml-auto px-6 py-2 bg-emerald-500 text-white rounded-theme-lg hover:bg-emerald-600 transition-colors"
                >
                    Continue to Questions →
                </button>
            </div>

            {/* Learning Tip */}
            <div className="mt-4 text-xs text-theme-text-muted text-center">
                <span>✨ Read carefully - questions will be based on this material</span>
            </div>
        </div>
    );
};

export default TeachingModule;