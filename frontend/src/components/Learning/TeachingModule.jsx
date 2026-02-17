// frontend/src/components/Learning/TeachingModule.jsx - Enhanced version

import React, { useCallback, useEffect, useState } from 'react';
import { useLearning } from '../../context/LearningContext';

const TeachingModule = ({ atomId, onComplete }) => {
    const [content, setContent] = useState(null);
    const [error, setError] = useState('');
    const [showSections, setShowSections] = useState({
        example: false,
        analogy: false,
        application: false
    });
    const [timeSpent, setTimeSpent] = useState(0);
    
    const { getTeachingContent, loading } = useLearning();

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeSpent(prev => prev + 1);
        }, 1000);
        
        return () => clearInterval(timer);
    }, []);

    const loadContent = useCallback(async () => {
        const result = await getTeachingContent(atomId);
        if (result.success) {
            setContent(result.data);
        } else {
            setError(result.error || 'Failed to load content.');
        }
    }, [atomId, getTeachingContent]);

    const [startTime] = useState(Date.now());

    const handleContinue = () => {
        const timeSpent = Math.floor((Date.now() - startTime) / 1000);
        onComplete(atomId, timeSpent);
    };

    useEffect(() => {
        setContent(null);
        setError('');
        setShowSections({ example: false, analogy: false, application: false });
        setTimeSpent(0);

        if (atomId === null || atomId === undefined) {
            setError('No teaching atom selected. Please restart this learning step.');
            return;
        }

        loadContent();
    }, [atomId, loadContent]);

    const toggleSection = (section) => {
        setShowSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    

    if (loading && !content) {
        return (
            <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading teaching content...</p>
            </div>
        );
    }

    if (!content) {
        return (
            <div className="text-center py-12">
                <p className="text-red-600">{error || 'Failed to load content.'}</p>
                <button
                    onClick={loadContent}
                    className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                    Try Again
                </button>
            </div>
        );
    }

    const getLevelBadge = () => {
        const badges = {
            zero: { text: '🌱 Beginner Friendly', class: 'bg-green-100 text-green-800' },
            beginner: { text: '🌿 Building Foundation', class: 'bg-blue-100 text-blue-800' },
            intermediate: { text: '🌳 Deepening Understanding', class: 'bg-purple-100 text-purple-800' },
            advanced: { text: '🏆 Advanced Concepts', class: 'bg-orange-100 text-orange-800' }
        };
        return badges[content.knowledge_level] || badges.intermediate;
    };

    const levelBadge = getLevelBadge();

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-4 flex justify-between items-center">
                <div>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${levelBadge.class}`}>
                        {levelBadge.text}
                    </span>
                </div>
                <span className="text-sm text-gray-500">
                    ⏱️ {Math.floor(timeSpent / 60)}:{(timeSpent % 60).toString().padStart(2, '0')}
                </span>
            </div>

            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
                    <h2 className="text-3xl font-bold text-white mb-2">{content.name}</h2>
                    {content.progress_hint && (
                        <p className="text-blue-100">{content.progress_hint}</p>
                    )}
                </div>

                {/* Main Content */}
                <div className="p-8">
                    {/* Core Explanation */}
                    <div className="mb-8">
                        <h3 className="text-xl font-semibold mb-4 flex items-center">
                            <span className="bg-blue-100 text-blue-800 p-2 rounded-full mr-3">📚</span>
                            Core Concept
                        </h3>
                        <p className="text-lg text-gray-700 leading-relaxed">{content.explanation}</p>
                    </div>

                    {/* Interactive Sections */}
                    <div className="space-y-4">
                        {/* Example Section */}
                        <div className="border rounded-lg overflow-hidden">
                            <button
                                onClick={() => toggleSection('example')}
                                className="w-full px-6 py-4 bg-gray-50 hover:bg-gray-100 flex justify-between items-center text-left"
                            >
                                <span className="font-semibold flex items-center">
                                    <span className="text-2xl mr-3">💡</span>
                                    See Example
                                </span>
                                <span className="text-2xl">{showSections.example ? '▼' : '▶'}</span>
                            </button>
                            {showSections.example && (
                                <div className="p-6 bg-blue-50">
                                    <p className="text-gray-800">{content.examples?.[0]}</p>
                                </div>
                            )}
                        </div>

                        {/* Analogy Section */}
                        <div className="border rounded-lg overflow-hidden">
                            <button
                                onClick={() => toggleSection('analogy')}
                                className="w-full px-6 py-4 bg-gray-50 hover:bg-gray-100 flex justify-between items-center text-left"
                            >
                                <span className="font-semibold flex items-center">
                                    <span className="text-2xl mr-3">🔄</span>
                                    Real-World Analogy
                                </span>
                                <span className="text-2xl">{showSections.analogy ? '▼' : '▶'}</span>
                            </button>
                            {showSections.analogy && (
                                <div className="p-6 bg-purple-50">
                                    <p className="text-gray-800 italic">"{content.analogy}"</p>
                                </div>
                            )}
                        </div>

                        {/* Practical Application */}
                        {content.examples?.[1] && (
                            <div className="border rounded-lg overflow-hidden">
                                <button
                                    onClick={() => toggleSection('application')}
                                    className="w-full px-6 py-4 bg-gray-50 hover:bg-gray-100 flex justify-between items-center text-left"
                                >
                                    <span className="font-semibold flex items-center">
                                        <span className="text-2xl mr-3">🎯</span>
                                        Why This Matters
                                    </span>
                                    <span className="text-2xl">{showSections.application ? '▼' : '▶'}</span>
                                </button>
                                {showSections.application && (
                                    <div className="p-6 bg-green-50">
                                        <p className="text-gray-800">{content.examples[1]}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Common Misconception */}
                        {content.examples?.[2] && (
                            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <h4 className="font-semibold text-yellow-800 mb-2 flex items-center">
                                    <span className="text-xl mr-2">⚠️</span>
                                    Watch Out!
                                </h4>
                                <p className="text-gray-700">{content.examples[2]}</p>
                            </div>
                        )}
                    </div>

                    {/* Comprehension Check */}
                    <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold mb-2">Quick Check:</h4>
                        <p className="text-gray-700">
                            Can you explain {content.name} in your own words?
                        </p>
                    </div>

                    {/* Continue Button */}
                    <button
                        onClick={handleContinue}
                        className="w-full mt-8 bg-green-600 text-white py-4 rounded-lg font-semibold text-lg hover:bg-green-700 transition flex items-center justify-center"
                    >
                        I Understand, Let's Practice 
                        <span className="ml-2">→</span>
                    </button>

                    {/* Progress Tip */}
                    {timeSpent > 120 && (
                        <p className="mt-4 text-sm text-gray-500 text-center">
                            💡 Take your time - understanding now saves time later!
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TeachingModule;