import React, { useEffect } from 'react';
import { useLearning } from '../../context/LearningContext';

const LearningProgress = ({ onContinue }) => {
    const { learningProgress, loadLearningProgress, loading } = useLearning();

    useEffect(() => {
        loadLearningProgress();
    }, [loadLearningProgress]);

    const getPhaseIcon = (phase) => {
        const icons = {
            'complete': '✅',
            'teaching': '📚',
            'diagnostic': '📝',
            'not_started': '⭕'
        };
        return icons[phase] || '📌';
    };

    const getPhaseColor = (phase) => {
        const colors = {
            'complete': 'text-green-600',
            'teaching': 'text-blue-600',
            'diagnostic': 'text-purple-600',
            'not_started': 'text-gray-400'
        };
        return colors[phase] || 'text-gray-600';
    };

    if (loading && !learningProgress) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-600">Loading progress...</p>
            </div>
        );
    }

    if (!learningProgress) {
        return (
            <div className="text-center py-12">
                <p className="text-red-600">Failed to load progress.</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8">Your Learning Progress</h2>

            {/* Stats Cards */}
            <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-blue-50 p-4 rounded-lg text-center">
                        <p className="text-2xl font-bold text-blue-600">
                            {Math.round(learningProgress.overall_mastery * 100)}%
                        </p>
                        <p className="text-sm text-gray-600">Overall Mastery</p>
                    </div>
                    
                    <div className="bg-green-50 p-4 rounded-lg text-center">
                        <p className="text-2xl font-bold text-green-600">
                            {learningProgress.total_atoms || 0}
                        </p>
                        <p className="text-sm text-gray-600">Total Atoms</p>
                    </div>
                    
                    <div className="bg-orange-50 p-4 rounded-lg text-center">
                        <p className="text-2xl font-bold text-orange-600">
                            {learningProgress.learning_streak || 0} 🔥
                        </p>
                        <p className="text-sm text-gray-600">Learning Streak</p>
                    </div>
                </div>

                {/* Theta Score */}
                <div className="border-t pt-6">
                    <div className="flex justify-between items-center">
                        <span className="text-gray-700 font-medium">Ability (θ):</span>
                        <span className="text-lg font-semibold text-purple-600">
                            {learningProgress.overall_theta?.toFixed(2) || '0.00'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Concepts */}
            <h3 className="text-xl font-bold mb-4">Concepts</h3>
            
            {learningProgress.concepts?.map((concept, idx) => (
                <div key={idx} className="bg-white rounded-lg shadow-lg p-6 mb-4">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-lg font-semibold">{concept.name}</h4>
                        <span className="text-sm text-gray-500">
                            {concept.mastered_count}/{concept.total_count} mastered
                        </span>
                    </div>

                    <div className="space-y-3">
                        {concept.atoms.map((atom, atomIdx) => (
                            <div key={atomIdx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center">
                                    <span className="text-xl mr-3">{getPhaseIcon(atom.phase)}</span>
                                    <div>
                                        <p className="font-medium">{atom.name}</p>
                                        <p className="text-xs text-gray-500">
                                            Mastery: {Math.round(atom.mastery * 100)}%
                                            {atom.streak > 0 && ` • Streak: ${atom.streak}`}
                                        </p>
                                    </div>
                                </div>
                                <span className={`text-sm font-medium ${getPhaseColor(atom.phase)}`}>
                                    {atom.phase === 'complete' ? 'Mastered' : 
                                     atom.phase === 'teaching' ? 'Learning' :
                                     atom.phase === 'diagnostic' ? 'In Progress' : 'Not Started'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            <div className="flex justify-center mt-8">
                <button
                    onClick={onContinue}
                    className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700"
                >
                    Continue Learning
                </button>
            </div>
        </div>
    );
};

export default LearningProgress;