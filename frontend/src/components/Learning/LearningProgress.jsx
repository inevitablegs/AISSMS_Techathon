import React, { useEffect } from 'react';
import { useLearning } from '../../context/LearningContext';

const LearningProgress = ({ onContinue }) => {
    const { learningProgress, loadLearningProgress, loading } = useLearning();

    useEffect(() => {
        loadLearningProgress();
    }, [loadLearningProgress]);

    const getPhaseIcon = (phase) => {
        const icons = {
            complete: '✅',
            mastery_check: '🔄',
            practice: '📝',
            teaching: '📚',
            reinforcement: '⚠️',
            diagnostic: '⏳'
        };
        return icons[phase] || '📌';
    };

    const getPhaseColor = (phase) => {
        const colors = {
            complete: 'text-green-600',
            mastery_check: 'text-blue-600',
            practice: 'text-purple-600',
            teaching: 'text-orange-600',
            reinforcement: 'text-red-600',
            diagnostic: 'text-gray-600'
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

            <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
                <div className="grid grid-cols-2 gap-8 mb-8">
                    <div className="text-center">
                        <p className="text-gray-600 mb-2">Overall Mastery</p>
                        <div className="relative pt-1">
                            <div className="flex mb-2 items-center justify-between">
                                <div>
                                    <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-green-600 bg-green-200">
                                        Progress
                                    </span>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs font-semibold inline-block text-green-600">
                                        {Math.round(learningProgress.overall_mastery * 100)}%
                                    </span>
                                </div>
                            </div>
                            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-green-200">
                                <div
                                    style={{ width: `${learningProgress.overall_mastery * 100}%` }}
                                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500"
                                ></div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="text-center">
                        <p className="text-gray-600 mb-2">Learning Streak</p>
                        <p className="text-3xl font-bold text-orange-500">
                            {learningProgress.learning_streak || 0} 🔥
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="bg-blue-50 p-4 rounded-lg text-center">
                        <p className="text-2xl font-bold text-blue-600">
                            {learningProgress.total_atoms || 0}
                        </p>
                        <p className="text-sm text-gray-600">Total Atoms</p>
                    </div>
                    
                    <div className="bg-green-50 p-4 rounded-lg text-center">
                        <p className="text-2xl font-bold text-green-600">
                            {learningProgress.concepts?.reduce((acc, c) => acc + c.mastered_count, 0) || 0}
                        </p>
                        <p className="text-sm text-gray-600">Mastered</p>
                    </div>
                    
                    <div className="bg-purple-50 p-4 rounded-lg text-center">
                        <p className="text-2xl font-bold text-purple-600">
                            {learningProgress.concepts?.length || 0}
                        </p>
                        <p className="text-sm text-gray-600">Concepts</p>
                    </div>
                </div>
            </div>

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
                                            {atom.hint_usage > 0 && ` • Hints: ${atom.hint_usage}`}
                                        </p>
                                    </div>
                                </div>
                                <span className={`text-sm font-medium ${getPhaseColor(atom.phase)}`}>
                                    {atom.phase.replace('_', ' ')}
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

            <div className="mt-6 text-sm text-gray-500 text-center">
                <p>ℹ️ Keep practicing to maintain retention and build streaks!</p>
            </div>
        </div>
    );
};

export default LearningProgress;