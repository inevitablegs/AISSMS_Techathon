import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLearning } from '../../context/LearningContext';
import axios from '../../axiosConfig';
import DiagnosticQuiz from './DiagnosticQuiz';
import TeachingModule from './TeachingModule';
import PracticeSession from './PracticeSession';
import MasteryCheck from './MasteryCheck';
import LearningProgress from './LearningProgress';

const AdaptiveLearning = ({ subject } = {}) => {
    const [step, setStep] = useState('select'); // select, diagnostic, teaching, practice, mastery, progress
    const [availableConcepts, setAvailableConcepts] = useState([]);
    const [currentAtomId, setCurrentAtomId] = useState(null);
    
    const navigate = useNavigate();
    const { 
        startLearningSession, 
        currentSession, 
        loadLearningProgress 
    } = useLearning();

    const fetchConcepts = useCallback(async () => {
        try {
            const subjectFilter = typeof subject === 'string' ? subject.trim() : '';
            const url = subjectFilter
                ? `/auth/api/concepts/?subject=${encodeURIComponent(subjectFilter)}`
                : '/auth/api/concepts/';

            const response = await axios.get(url);
            setAvailableConcepts(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error('Failed to fetch concepts:', error);

            // Fallback (keeps the UI usable if backend concepts aren't set up yet)
            const fallback = [
                { id: 1, name: 'Memory Organization', subject: 'Microprocessor' },
                { id: 2, name: 'Address Space', subject: 'Microprocessor' },
                { id: 3, name: 'Cache Memory', subject: 'Computer Architecture' },
            ];
            const subjectFilter = typeof subject === 'string' ? subject.trim().toLowerCase() : '';
            setAvailableConcepts(
                subjectFilter
                    ? fallback.filter((c) => (c.subject || '').toLowerCase().includes(subjectFilter))
                    : fallback
            );
        }
    }, [subject]);

    useEffect(() => {
        // Load available concepts
        fetchConcepts();
    }, [fetchConcepts]);

    const handleConceptSelect = async (concept) => {
        const result = await startLearningSession(concept.id);
        
        if (result.success) {
            setStep('diagnostic');
        }
    };

    const handleDiagnosticComplete = (results) => {
        const nextAtom = results?.next_atom;
        if (nextAtom) {
            setCurrentAtomId(nextAtom);
            setStep('teaching');
            return;
        }

        // No weak atoms identified; go to progress summary instead of calling teaching/null.
        setCurrentAtomId(null);
        setStep('progress');
        loadLearningProgress();
    };

    const handleTeachingComplete = (atomId) => {
        setCurrentAtomId(atomId);
        setStep('practice');
    };

    const handlePracticeComplete = (atomId, masteryAchieved) => {
        if (masteryAchieved) {
            setStep('mastery');
        } else {
            // Continue practice
            setStep('practice');
        }
    };

    const handleMasteryComplete = () => {
        // Check if more atoms to learn
        setStep('progress');
        loadLearningProgress();
    };

    const handleContinue = () => {
        setStep('select');
    };

    const renderStep = () => {
        switch (step) {
            case 'select':
                return (
                    <div className="max-w-4xl mx-auto py-8">
                        <h1 className="text-3xl font-bold mb-6">Choose a Concept to Learn</h1>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {availableConcepts.map(concept => (
                                <div
                                    key={concept.id}
                                    onClick={() => handleConceptSelect(concept)}
                                    className="bg-white p-6 rounded-lg shadow-md cursor-pointer hover:shadow-lg transition"
                                >
                                    <h3 className="text-xl font-semibold mb-2">{concept.name}</h3>
                                    <p className="text-gray-600">{concept.subject}</p>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="mt-6 text-blue-600 hover:text-blue-800"
                        >
                            ← Back to Dashboard
                        </button>
                    </div>
                );

            case 'diagnostic':
                return (
                    <DiagnosticQuiz
                        sessionId={currentSession?.session_id}
                        questions={currentSession?.diagnostic_questions || []}
                        onComplete={handleDiagnosticComplete}
                    />
                );

            case 'teaching':
                return (
                    <TeachingModule
                        atomId={currentAtomId}
                        onComplete={handleTeachingComplete}
                    />
                );

            case 'practice':
                return (
                    <PracticeSession
                        atomId={currentAtomId}
                        onComplete={handlePracticeComplete}
                    />
                );

            case 'mastery':
                return (
                    <MasteryCheck
                        atomId={currentAtomId}
                        onComplete={handleMasteryComplete}
                    />
                );

            case 'progress':
                return (
                    <LearningProgress
                        onContinue={handleContinue}
                    />
                );

            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <h1 className="text-2xl font-bold text-gray-900">
                        Adaptive Learning Studio
                    </h1>
                </div>
            </nav>
            
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {renderStep()}
            </main>
        </div>
    );
};

export default AdaptiveLearning;