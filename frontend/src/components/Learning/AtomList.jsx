import React from 'react';

const AtomList = ({ atoms, onStartAtom, conceptName, completedCount }) => {
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

    return (
        <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-2">{conceptName}</h2>
            <p className="text-gray-600 mb-6">
                Completed {completedCount} of {atoms.length} concepts
            </p>

            <div className="space-y-3 mb-8">
                {atoms.map((atom) => (
                    <div
                        key={atom.id}
                        className={`flex items-center justify-between p-4 rounded-lg border ${
                            atom.phase === 'not_started'
                                ? 'border-gray-200 bg-gray-50'
                                : atom.phase === 'complete'
                                ? 'border-green-200 bg-green-50'
                                : 'border-blue-200 bg-blue-50'
                        }`}
                    >
                        <div className="flex items-center">
                            <span className="text-2xl mr-4">{getPhaseIcon(atom.phase)}</span>
                            <div>
                                <p className="font-medium text-lg">{atom.name}</p>
                                <p className={`text-sm ${getPhaseColor(atom.phase)}`}>
                                    {atom.phase === 'complete' && '✓ Mastered'}
                                    {atom.phase === 'teaching' && '📖 Learning in progress'}
                                    {atom.phase === 'diagnostic' && '📝 Questions ready'}
                                    {atom.phase === 'not_started' && '⏳ Not started'}
                                </p>
                                {atom.mastery_score > 0 && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        Mastery: {Math.round(atom.mastery_score * 100)}%
                                    </p>
                                )}
                            </div>
                        </div>
                        
                        {atom.phase === 'not_started' && (
                            <button
                                onClick={() => onStartAtom(atom)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                Start Learning
                            </button>
                        )}
                        
                        {atom.phase === 'teaching' && (
                            <button
                                onClick={() => onStartAtom(atom)}
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                            >
                                Continue
                            </button>
                        )}
                        
                        {atom.phase === 'complete' && (
                            <span className="text-green-600 font-medium">✓ Completed</span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AtomList;