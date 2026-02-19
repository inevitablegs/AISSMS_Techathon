import React from 'react';

const AtomReview = ({ atom, metrics, onComplete, onSkip }) => {

    return (
        <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Review Required: {atom.name}</h2>
            
            {/* Performance Summary */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-red-800 mb-2">Performance Analysis</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="text-gray-600">Accuracy</p>
                        <p className="text-xl font-bold text-red-600">
                            {Math.round(metrics.accuracy * 100)}%
                        </p>
                    </div>
                    <div>
                        <p className="text-gray-600">Mastery</p>
                        <p className="text-xl font-bold text-orange-600">
                            {Math.round(metrics.final_mastery * 100)}%
                        </p>
                    </div>
                    <div>
                        <p className="text-gray-600">Time Ratio</p>
                        <p className="text-xl font-bold text-blue-600">
                            {metrics.time_ratio.toFixed(2)}x
                        </p>
                    </div>
                    <div>
                        <p className="text-gray-600">θ Change</p>
                        <p className={`text-xl font-bold ${metrics.theta_change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {metrics.theta_change > 0 ? '+' : ''}{metrics.theta_change.toFixed(2)}
                        </p>
                    </div>
                </div>
            </div>

            {/* Error Analysis */}
            {metrics.error_count > 0 && (
                <div className="mb-6">
                    <h3 className="font-semibold mb-2">Error Types:</h3>
                    <div className="space-y-2">
                        {metrics.conceptual_errors > 0 && (
                            <div className="bg-purple-50 p-2 rounded">
                                <span className="font-medium">Conceptual:</span> {metrics.conceptual_errors} errors
                            </div>
                        )}
                        {metrics.procedural_errors > 0 && (
                            <div className="bg-blue-50 p-2 rounded">
                                <span className="font-medium">Procedural:</span> {metrics.procedural_errors} errors
                            </div>
                        )}
                        {metrics.factual_errors > 0 && (
                            <div className="bg-green-50 p-2 rounded">
                                <span className="font-medium">Factual:</span> {metrics.factual_errors} errors
                            </div>
                        )}
                        {metrics.guessing_errors > 0 && (
                            <div className="bg-yellow-50 p-2 rounded">
                                <span className="font-medium">Guessing:</span> {metrics.guessing_errors} errors
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Review Options */}
            <div className="space-y-3">
                <button
                    onClick={() => onComplete('reteach')}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700"
                >
                    Review Teaching Material
                </button>
                <button
                    onClick={() => onComplete('practice')}
                    className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700"
                >
                    Practice with New Questions
                </button>
                <button
                    onClick={onSkip}
                    className="w-full bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300"
                >
                    Skip Review (Not Recommended)
                </button>
            </div>
        </div>
    );
};

export default AtomReview;