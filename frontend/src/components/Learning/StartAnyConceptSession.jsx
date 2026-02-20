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
            navigate(`/learn/${generatedAtoms.concept_id}`, {
                state: { knowledge_level: formData.knowledge_level }
            });
        }
    };

    const knowledgeLevels = [
        { value: 'zero', label: 'Zero Knowledge (Complete Beginner)' },
        { value: 'beginner', label: 'Beginner (Some basic understanding)' },
        { value: 'intermediate', label: 'Intermediate (Comfortable with basics)' },
        { value: 'advanced', label: 'Advanced (Strong understanding)' }
    ];

    return (
        <div className="min-h-screen bg-theme-bg py-12">
            <div className="max-w-2xl mx-auto px-4">
                <div className="bg-surface rounded-theme-xl shadow-theme-lg border border-theme-border p-8 animate-fade-in-up">
                    <h1 className="text-2xl font-bold text-theme-text mb-6">
                        Start New Learning Session
                    </h1>

                    {!generatedAtoms ? (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Subject */}
                            <div>
                                <label className="block text-sm font-medium text-theme-text-secondary mb-2">
                                    Subject *
                                </label>
                                <input
                                    type="text"
                                    name="subject"
                                    value={formData.subject}
                                    onChange={handleChange}
                                    required
                                    placeholder="e.g., Microprocessor, Mathematics, Physics"
                                    className="w-full px-4 py-2 bg-theme-bg border border-theme-border rounded-theme-lg focus:ring-2 focus:ring-primary/50 focus:border-primary text-theme-text placeholder:text-theme-text-muted transition-colors"
                                />
                            </div>

                            {/* Concept */}
                            <div>
                                <label className="block text-sm font-medium text-theme-text-secondary mb-2">
                                    Concept *
                                </label>
                                <input
                                    type="text"
                                    name="concept"
                                    value={formData.concept}
                                    onChange={handleChange}
                                    required
                                    placeholder="e.g., Memory Organization, Calculus, Quantum Mechanics"
                                    className="w-full px-4 py-2 bg-theme-bg border border-theme-border rounded-theme-lg focus:ring-2 focus:ring-primary/50 focus:border-primary text-theme-text placeholder:text-theme-text-muted transition-colors"
                                />
                            </div>

                            {/* Knowledge Level */}
                            <div>
                                <label className="block text-sm font-medium text-theme-text-secondary mb-2">
                                    Your Knowledge Level *
                                </label>
                                <select
                                    name="knowledge_level"
                                    value={formData.knowledge_level}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 bg-theme-bg border border-theme-border rounded-theme-lg focus:ring-2 focus:ring-primary/50 focus:border-primary text-theme-text transition-colors"
                                >
                                    {knowledgeLevels.map(level => (
                                        <option key={level.value} value={level.value}>
                                            {level.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {error && (
                                <div className="bg-error/10 border border-error/30 text-error px-4 py-3 rounded-theme-lg">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full gradient-primary text-white font-bold py-3 px-4 rounded-theme-lg hover:shadow-theme-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Generating atoms...' : 'Generate Learning Path'}
                            </button>

                            <button
                                type="button"
                                onClick={() => navigate('/dashboard')}
                                className="w-full bg-theme-bg hover:bg-theme-border text-theme-text-secondary font-bold py-3 px-4 rounded-theme-lg transition-colors"
                            >
                                Back to Dashboard
                            </button>
                        </form>
                    ) : (
                        <div className="space-y-6">
                            {/* Success message */}
                            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-theme-lg p-6">
                                <h3 className="text-lg font-semibold text-emerald-600 dark:text-emerald-400 mb-2">
                                    ✓ Learning Path Generated!
                                </h3>
                                <p className="text-emerald-600 dark:text-emerald-400">
                                    We've created {generatedAtoms.atoms.length} atomic concepts for "{generatedAtoms.concept_name}".
                                </p>
                            </div>

                            {/* Atoms list */}
                            <div>
                                <h4 className="font-medium text-theme-text-secondary mb-3">Atomic Concepts:</h4>
                                <div className="space-y-2">
                                    {generatedAtoms.atoms.map((atom, index) => (
                                        <div 
                                            key={atom.id}
                                            className="flex items-center p-3 bg-theme-bg rounded-theme-lg"
                                        >
                                            <span className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold mr-3">
                                                {index + 1}
                                            </span>
                                            <span className="text-theme-text">{atom.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Start learning button */}
                            <button
                                onClick={handleStartLearning}
                                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-4 rounded-theme-lg transition-colors"
                            >
                                Start Learning Now
                            </button>

                            {/* Note */}
                            <p className="text-sm text-theme-text-muted text-center">
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