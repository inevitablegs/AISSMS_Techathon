import React from 'react';
import { useNavigate } from 'react-router-dom';

const AtomComplete = ({ atoms, pacingHistory, metrics, onBackToDashboard, onStartNewConcept }) => {
    const navigate = useNavigate();
    
    const completedCount = atoms.filter(a => a.phase === 'complete').length;
    const totalCount = atoms.length;
    const percentage = Math.round((completedCount / totalCount) * 100);
    
    // Get final pacing decision from history
    const lastPacing = pacingHistory.length > 0 
        ? pacingHistory[pacingHistory.length - 1] 
        : null;

    // Calculate mastery distribution
    const highMastery = atoms.filter(a => a.mastery_score >= 0.8).length;
    const mediumMastery = atoms.filter(a => a.mastery_score >= 0.6 && a.mastery_score < 0.8).length;
    const lowMastery = atoms.filter(a => a.mastery_score < 0.6).length;

    const getPacingMessage = (pacing) => {
        const messages = {
            'sharp_slowdown': 'Critical: Significant gaps detected. Recommended to review fundamentals.',
            'slow_down': 'Caution: Performance indicates need for slower pace with more practice.',
            'stay': 'Balanced: Good progress. Continue at current pace.',
            'speed_up': 'Excellent: Strong performance. Ready for accelerated learning!'
        };
        return messages[pacing] || 'Great job completing this concept!';
    };

    const getPacingColor = (pacing) => {
        const colors = {
            'sharp_slowdown': 'text-red-600 bg-red-100 border-red-200',
            'slow_down': 'text-orange-600 bg-orange-100 border-orange-200',
            'stay': 'text-blue-600 bg-blue-100 border-blue-200',
            'speed_up': 'text-green-600 bg-green-100 border-green-200'
        };
        return colors[pacing] || 'text-gray-600 bg-gray-100 border-gray-200';
    };

    const getPacingIcon = (pacing) => {
        const icons = {
            'sharp_slowdown': '⚠️',
            'slow_down': '⏸️',
            'stay': '👉',
            'speed_up': '🚀'
        };
        return icons[pacing] || '✅';
    };

    return (
        <div className="bg-white rounded-lg shadow-lg p-8">
            {/* Header */}
            <div className="text-center mb-8">
                <span className="text-6xl">🎉</span>
                <h2 className="text-2xl font-bold text-gray-800 mt-4">
                    Concept Complete!
                </h2>
                <p className="text-gray-600">
                    You've mastered all atoms in this concept
                </p>
            </div>

            {/* Overall Progress */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold text-blue-600">{percentage}%</p>
                    <p className="text-sm text-gray-600">Completion</p>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold text-green-600">
                        {Math.round(metrics.averageMastery * 100)}%
                    </p>
                    <p className="text-sm text-gray-600">Average Mastery</p>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                    <p className="text-2xl font-bold text-purple-600">
                        {completedCount}/{totalCount}
                    </p>
                    <p className="text-sm text-gray-600">Atoms Mastered</p>
                </div>
            </div>

            {/* Mastery Distribution */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-3">Mastery Distribution</h3>
                <div className="space-y-2">
                    <div>
                        <div className="flex justify-between text-sm mb-1">
                            <span>High Mastery (≥80%)</span>
                            <span className="font-medium text-green-600">{highMastery}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                                className="bg-green-600 h-2 rounded-full"
                                style={{ width: `${(highMastery / totalCount) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between text-sm mb-1">
                            <span>Medium Mastery (60-79%)</span>
                            <span className="font-medium text-yellow-600">{mediumMastery}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                                className="bg-yellow-600 h-2 rounded-full"
                                style={{ width: `${(mediumMastery / totalCount) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between text-sm mb-1">
                            <span>Low Mastery (&lt;60%)</span>
                            <span className="font-medium text-red-600">{lowMastery}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                                className="bg-red-600 h-2 rounded-full"
                                style={{ width: `${(lowMastery / totalCount) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Final Pacing Decision */}
            {lastPacing && (
                <div className={`mb-6 p-4 rounded-lg border ${getPacingColor(lastPacing.pacing)}`}>
                    <div className="flex items-center mb-2">
                        <span className="text-2xl mr-2">{getPacingIcon(lastPacing.pacing)}</span>
                        <h3 className="font-semibold text-lg">Final Pacing Decision</h3>
                    </div>
                    <p className="mb-3">{getPacingMessage(lastPacing.pacing)}</p>
                    
                    {/* Last Atom Performance */}
                    <div className="mt-3 text-sm">
                        <p className="font-medium">Last Atom: {lastPacing.atomName}</p>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                            <div>
                                <span className="text-gray-600">Accuracy:</span>
                                <span className="ml-2 font-medium">{Math.round(lastPacing.accuracy * 100)}%</span>
                            </div>
                            <div>
                                <span className="text-gray-600">Mastery:</span>
                                <span className="ml-2 font-medium">{Math.round(lastPacing.mastery * 100)}%</span>
                            </div>
                            {lastPacing.thetaChange && (
                                <div className="col-span-2">
                                    <span className="text-gray-600">θ Change:</span>
                                    <span className={`ml-2 font-medium ${lastPacing.thetaChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {lastPacing.thetaChange > 0 ? '+' : ''}{lastPacing.thetaChange.toFixed(2)}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Pacing History Timeline */}
            {pacingHistory.length > 1 && (
                <div className="mb-6">
                    <h3 className="font-semibold text-gray-700 mb-3">Learning Journey</h3>
                    <div className="relative">
                        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                        <div className="space-y-4">
                            {pacingHistory.map((item, idx) => (
                                <div key={idx} className="relative pl-10">
                                    <div className={`absolute left-2 w-4 h-4 rounded-full mt-1 
                                        ${item.pacing === 'sharp_slowdown' ? 'bg-red-500' :
                                          item.pacing === 'slow_down' ? 'bg-orange-500' :
                                          item.pacing === 'stay' ? 'bg-blue-500' :
                                          'bg-green-500'}`}>
                                    </div>
                                    <div className="bg-gray-50 p-2 rounded">
                                        <p className="font-medium">{item.atomName}</p>
                                        <div className="flex text-xs text-gray-500 mt-1">
                                            <span className="mr-3">Pacing: {item.pacing.replace('_', ' ')}</span>
                                            <span className="mr-3">Accuracy: {Math.round(item.accuracy * 100)}%</span>
                                            <span>Mastery: {Math.round(item.mastery * 100)}%</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Recommendations */}
            {lastPacing && (
                <div className="mb-6 p-4 bg-indigo-50 rounded-lg">
                    <h3 className="font-semibold text-indigo-800 mb-2">📋 Recommendations</h3>
                    <ul className="text-sm text-indigo-700 space-y-1 list-disc list-inside">
                        {lastPacing.pacing === 'sharp_slowdown' && (
                            <>
                                <li>Review atoms with mastery below 60%</li>
                                <li>Take detailed notes on challenging concepts</li>
                                <li>Consider revisiting fundamentals before new concepts</li>
                            </>
                        )}
                        {lastPacing.pacing === 'slow_down' && (
                            <>
                                <li>Practice with additional questions for weak areas</li>
                                <li>Spend more time on analogies and examples</li>
                                <li>Take short breaks between study sessions</li>
                            </>
                        )}
                        {lastPacing.pacing === 'stay' && (
                            <>
                                <li>Continue with current study routine</li>
                                <li>Regular review to maintain retention</li>
                                <li>Good balance of speed and accuracy</li>
                            </>
                        )}
                        {lastPacing.pacing === 'speed_up' && (
                            <>
                                <li>Ready for more challenging concepts</li>
                                <li>Try explaining concepts to others</li>
                                <li>Explore advanced applications</li>
                            </>
                        )}
                    </ul>
                </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
                <button
                    onClick={onStartNewConcept}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition"
                >
                    🚀 Start New Concept
                </button>
                
                <button
                    onClick={onBackToDashboard}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition"
                >
                    📊 Back to Dashboard
                </button>

                {/* Review weak atoms if any */}
                {lowMastery > 0 && (
                    <button
                        onClick={() => {
                            // This would need to be implemented to review weak atoms
                            alert('Review feature coming soon!');
                        }}
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-4 rounded-lg transition"
                    >
                        ⚠️ Review {lowMastery} Weak Atom{lowMastery > 1 ? 's' : ''}
                    </button>
                )}
            </div>

            {/* Learning Statistics Summary */}
            <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="font-semibold text-gray-700 mb-3 text-center">Learning Statistics</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-center">
                        <p className="text-gray-500">Total Atoms</p>
                        <p className="text-xl font-bold text-gray-800">{totalCount}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-gray-500">Mastered</p>
                        <p className="text-xl font-bold text-green-600">{highMastery + mediumMastery}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-gray-500">Need Review</p>
                        <p className="text-xl font-bold text-orange-600">{lowMastery}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-gray-500">Final Pace</p>
                        <p className={`text-xl font-bold capitalize ${
                            lastPacing?.pacing === 'sharp_slowdown' ? 'text-red-600' :
                            lastPacing?.pacing === 'slow_down' ? 'text-orange-600' :
                            lastPacing?.pacing === 'stay' ? 'text-blue-600' :
                            'text-green-600'
                        }`}>
                            {lastPacing?.pacing?.replace('_', ' ') || 'N/A'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Encouragement Message */}
            <div className="mt-6 text-center">
                <p className="text-sm text-gray-500">
                    {lowMastery === 0 
                        ? '🌟 Exceptional work! You\'ve mastered all concepts thoroughly!'
                        : lowMastery <= 2
                        ? '👍 Good progress! A quick review will help solidify your understanding.'
                        : '💪 Keep going! Regular practice will help improve your mastery.'}
                </p>
            </div>
        </div>
    );
};

export default AtomComplete;