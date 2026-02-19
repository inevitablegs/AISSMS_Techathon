import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLearning } from '../../context/LearningContext';

const StartAnyConceptSession = () => {
    const [formData, setFormData] = useState({
        subject: '',
        concept: '',
        knowledge_level: 'intermediate'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [generatedAtoms, setGeneratedAtoms] = useState(null);
    
    const navigate = useNavigate();
    const { generateConcept } = useLearning();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await generateConcept(
            formData.subject,
            formData.concept,
            formData.knowledge_level
        );

        if (result.success) {
            setGeneratedAtoms(result.data);
        } else {
            setError(result.error || 'Failed to generate concept');
        }

        setLoading(false);
    };

    const handleStartLearning = () => {
        if (generatedAtoms) {
            navigate(`/learn/${generatedAtoms.concept_id}`);
        }
    };

    const knowledgeLevels = [
        { value: 'zero', label: 'Zero Knowledge (Complete Beginner)' },
        { value: 'beginner', label: 'Beginner (Some basic understanding)' },
        { value: 'intermediate', label: 'Intermediate (Comfortable with basics)' },
        { value: 'advanced', label: 'Advanced (Strong understanding)' }
    ];

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-2xl mx-auto px-4">
                <div className="bg-white rounded-lg shadow-lg p-8">
                    <h1 className="text-2xl font-bold text-gray-800 mb-6">
                        Start New Learning Session
                    </h1>

                    {!generatedAtoms ? (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Subject */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Subject *
                                </label>
                                <input
                                    type="text"
                                    name="subject"
                                    value={formData.subject}
                                    onChange={handleChange}
                                    required
                                    placeholder="e.g., Microprocessor, Mathematics, Physics"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            {/* Concept */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Concept *
                                </label>
                                <input
                                    type="text"
                                    name="concept"
                                    value={formData.concept}
                                    onChange={handleChange}
                                    required
                                    placeholder="e.g., Memory Organization, Calculus, Quantum Mechanics"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            {/* Knowledge Level */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Your Knowledge Level *
                                </label>
                                <select
                                    name="knowledge_level"
                                    value={formData.knowledge_level}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    {knowledgeLevels.map(level => (
                                        <option key={level.value} value={level.value}>
                                            {level.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {error && (
                                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Generating atoms...' : 'Generate Learning Path'}
                            </button>

                            <button
                                type="button"
                                onClick={() => navigate('/dashboard')}
                                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-4 rounded-lg transition"
                            >
                                Back to Dashboard
                            </button>
                        </form>
                    ) : (
                        <div className="space-y-6">
                            {/* Success message */}
                            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                                <h3 className="text-lg font-semibold text-green-800 mb-2">
                                    ✓ Learning Path Generated!
                                </h3>
                                <p className="text-green-700">
                                    We've created {generatedAtoms.atoms.length} atomic concepts for "{generatedAtoms.concept_name}".
                                </p>
                            </div>

                            {/* Atoms list */}
                            <div>
                                <h4 className="font-medium text-gray-700 mb-3">Atomic Concepts:</h4>
                                <div className="space-y-2">
                                    {generatedAtoms.atoms.map((atom, index) => (
                                        <div 
                                            key={atom.id}
                                            className="flex items-center p-3 bg-gray-50 rounded-lg"
                                        >
                                            <span className="w-8 h-8 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center font-bold mr-3">
                                                {index + 1}
                                            </span>
                                            <span className="text-gray-800">{atom.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Start learning button */}
                            <button
                                onClick={handleStartLearning}
                                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition"
                            >
                                Start Learning Now
                            </button>

                            {/* Note */}
                            <p className="text-sm text-gray-500 text-center">
                                You'll learn each concept one by one, with teaching followed by assessment.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StartAnyConceptSession;