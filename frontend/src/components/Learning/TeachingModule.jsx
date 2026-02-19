import React, { useState, useEffect } from 'react';
import { useLearning } from '../../context/LearningContext';

const TeachingModule = ({ atom, sessionId, onFinish, loading, pacing }) => {
    const [teachingContent, setTeachingContent] = useState(null);
    const [contentLoading, setContentLoading] = useState(true);
    const [error, setError] = useState('');
    const [showAnalogy, setShowAnalogy] = useState(false);
    const [showMisconception, setShowMisconception] = useState(false);
    
    const { getTeachingContent } = useLearning();

    useEffect(() => {
        const loadTeachingContent = async () => {
            if (!atom || !sessionId) return;
            
            setContentLoading(true);
            const result = await getTeachingContent({
                session_id: sessionId,
                atom_id: atom.id
            });
            
            if (result.success) {
                setTeachingContent(result.data.teaching_content);
            } else {
                setError(result.error || 'Failed to load teaching content');
            }
            setContentLoading(false);
        };

        loadTeachingContent();
    }, [atom, sessionId, getTeachingContent]);

    // Get pacing-based styling
    const getPacingMessage = () => {
        const messages = {
            'sharp_slowdown': 'Take your time with this - focus on understanding each part',
            'slow_down': 'Read carefully, don\'t rush',
            'stay': 'Learn at your normal pace',
            'speed_up': 'You can move through this quickly'
        };
        return messages[pacing] || 'Learn at your own pace';
    };

    const getPacingColor = () => {
        const colors = {
            'sharp_slowdown': 'bg-red-50 border-red-200 text-red-700',
            'slow_down': 'bg-orange-50 border-orange-200 text-orange-700',
            'stay': 'bg-blue-50 border-blue-200 text-blue-700',
            'speed_up': 'bg-green-50 border-green-200 text-green-700'
        };
        return colors[pacing] || 'bg-gray-50 border-gray-200 text-gray-700';
    };

    if (contentLoading || loading) {
        return (
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Preparing your learning material...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white rounded-lg shadow-lg p-8">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            </div>
        );
    }

    if (!teachingContent) {
        return (
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                <p className="text-gray-600">No teaching content available.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Header with pacing */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white">{atom.name}</h2>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPacingColor()}`}>
                        {getPacingMessage()}
                    </span>
                </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
                {/* Explanation */}
                <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                        <span className="bg-blue-100 text-blue-800 p-2 rounded-full mr-2">📚</span>
                        Explanation
                    </h3>
                    <p className="text-gray-700 leading-relaxed pl-10">
                        {teachingContent.explanation}
                    </p>
                </div>

                {/* Example */}
                {teachingContent.examples && teachingContent.examples.length > 0 && (
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                            <span className="bg-green-100 text-green-800 p-2 rounded-full mr-2">💡</span>
                            Example
                        </h3>
                        <p className="text-gray-700 leading-relaxed pl-10 bg-green-50 p-4 rounded-lg">
                            {teachingContent.examples[0]}
                        </p>
                    </div>
                )}

                {/* Analogy (toggle) */}
                {teachingContent.analogy && (
                    <div>
                        <button
                            onClick={() => setShowAnalogy(!showAnalogy)}
                            className="flex items-center text-gray-600 hover:text-blue-600 transition-colors"
                        >
                            <span className="bg-purple-100 text-purple-800 p-2 rounded-full mr-2">
                                🔄
                            </span>
                            <span className="font-medium">
                                {showAnalogy ? 'Hide Analogy' : 'Show Analogy'}
                            </span>
                        </button>
                        
                        {showAnalogy && (
                            <div className="mt-3 pl-10 bg-purple-50 p-4 rounded-lg">
                                <p className="text-gray-700 italic">
                                    {teachingContent.analogy}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Misconception (toggle) */}
                {teachingContent.misconception && (
                    <div>
                        <button
                            onClick={() => setShowMisconception(!showMisconception)}
                            className="flex items-center text-gray-600 hover:text-blue-600 transition-colors"
                        >
                            <span className="bg-red-100 text-red-800 p-2 rounded-full mr-2">
                                ⚠️
                            </span>
                            <span className="font-medium">
                                {showMisconception ? 'Hide Common Mistake' : 'Show Common Mistake'}
                            </span>
                        </button>
                        
                        {showMisconception && (
                            <div className="mt-3 pl-10 bg-red-50 p-4 rounded-lg border border-red-200">
                                <p className="text-red-700">
                                    {teachingContent.misconception}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Practical Application */}
                {teachingContent.practical_application && (
                    <div className="bg-yellow-50 p-4 rounded-lg">
                        <h3 className="font-semibold text-yellow-800 mb-2 flex items-center">
                            <span className="mr-2">✨</span>
                            Why This Matters
                        </h3>
                        <p className="text-yellow-700">
                            {teachingContent.practical_application}
                        </p>
                    </div>
                )}

                {/* Take Assessment Button */}
                <div className="pt-6 border-t border-gray-200">
                    <button
                        onClick={onFinish}
                        disabled={loading}
                        className={`w-full font-bold py-3 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed ${
                            pacing === 'sharp_slowdown' 
                                ? 'bg-orange-600 hover:bg-orange-700 text-white'
                                : pacing === 'speed_up'
                                ? 'bg-green-600 hover:bg-green-700 text-white'
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                    >
                        {loading ? 'Preparing assessment...' : 'I Understand - Take Assessment'}
                    </button>
                    
                    {/* Pacing tip */}
                    <p className="text-sm text-gray-500 text-center mt-3">
                        {pacing === 'sharp_slowdown' && '💡 Take your time with the questions'}
                        {pacing === 'slow_down' && '⏸️ Read each question carefully'}
                        {pacing === 'stay' && '📝 Answer at your normal pace'}
                        {pacing === 'speed_up' && '⚡ Challenge yourself to answer quickly'}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default TeachingModule;