import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../axiosConfig';
import { useLearning } from '../../context/LearningContext';

import DiagnosticQuiz from './DiagnosticQuiz';
import TeachingModule from './TeachingModule';
import PracticeSession from './PracticeSession';
import MasteryCheck from './MasteryCheck';
import LearningProgress from './LearningProgress';

const StartAnyConceptSession = () => {
    const navigate = useNavigate();
    const { startLearningSession, currentSession, loadLearningProgress } = useLearning();

    const [subject, setSubject] = useState('');
    const [concept, setConcept] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const [step, setStep] = useState('form'); // form, diagnostic, teaching, practice, mastery, progress
    const [currentAtomId, setCurrentAtomId] = useState(null);
    const [atomSequence, setAtomSequence] = useState([]);
    const [atomIndex, setAtomIndex] = useState(0);

    const handleStart = async (e) => {
        e.preventDefault();
        setError('');

        const trimmedSubject = subject.trim();
        const trimmedConcept = concept.trim();

        if (!trimmedSubject || !trimmedConcept) {
            setError('Please enter both subject and concept.');
            return;
        }

        setSubmitting(true);
        try {
            const genResp = await axios.post('/auth/api/generate-concept/', {
                subject: trimmedSubject,
                concept: trimmedConcept
            });

            const conceptId = genResp?.data?.concept_id;
            if (!conceptId) {
                throw new Error('Concept generation did not return concept_id');
            }

            const sessionResult = await startLearningSession(conceptId);
            if (!sessionResult.success) {
                setError(sessionResult.error || 'Failed to start session');
                return;
            }

            setStep('diagnostic');
        } catch (err) {
            const apiError = err?.response?.data?.error;
            setError(apiError || err?.message || 'Failed to start session');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDiagnosticComplete = (results) => {
        const seq = Array.isArray(results?.atom_sequence) ? results.atom_sequence : [];
        const fallback = results?.next_atom ? [results.next_atom] : [];
        const finalSeq = seq.length ? seq : fallback;

        if (!finalSeq.length) {
            setCurrentAtomId(null);
            setAtomSequence([]);
            setAtomIndex(0);
            setStep('progress');
            loadLearningProgress();
            return;
        }

        setAtomSequence(finalSeq);
        setAtomIndex(0);
        setCurrentAtomId(finalSeq[0]);
        setStep('teaching');
    };

    const handleTeachingComplete = (atomId) => {
        setCurrentAtomId(atomId);
        setStep('practice');
    };

    const handlePracticeComplete = (atomId, masteryAchieved) => {
        if (masteryAchieved) {
            setStep('mastery');
        } else {
            setStep('practice');
        }
    };

    const handleMasteryComplete = (passed) => {
        if (!passed) {
            setStep('practice');
            return;
        }

        const nextIndex = atomIndex + 1;
        if (nextIndex < atomSequence.length) {
            setAtomIndex(nextIndex);
            setCurrentAtomId(atomSequence[nextIndex]);
            setStep('teaching');
            return;
        }

        setStep('progress');
        loadLearningProgress();
    };

    const handleContinue = () => {
        navigate('/dashboard');
    };

    const renderStep = () => {
        switch (step) {
            case 'form':
                return (
                    <div className="max-w-2xl mx-auto">
                        <div className="mb-6">
                            <h1 className="text-3xl font-bold text-gray-900">Start a Session (Any Concept)</h1>
                            <p className="text-gray-600 mt-2">
                                Enter a subject and concept. We’ll generate atomic concepts and practice questions, then start your session.
                            </p>
                        </div>

                        <form onSubmit={handleStart} className="bg-white rounded-lg shadow p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                                <input
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g., Microprocessor"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Concept</label>
                                <input
                                    value={concept}
                                    onChange={(e) => setConcept(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g., Cache Memory"
                                />
                            </div>

                            {error && (
                                <div className="p-3 rounded bg-red-50 border border-red-200 text-red-700 text-sm">
                                    {error}
                                </div>
                            )}

                            <div className="flex items-center space-x-3">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded disabled:opacity-50"
                                >
                                    {submitting ? 'Starting…' : 'Start Session'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => navigate('/dashboard')}
                                    className="text-gray-700 hover:text-gray-900"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
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
                return <TeachingModule atomId={currentAtomId} onComplete={handleTeachingComplete} />;

            case 'practice':
                return <PracticeSession atomId={currentAtomId} onComplete={handlePracticeComplete} />;

            case 'mastery':
                return <MasteryCheck atomId={currentAtomId} onComplete={handleMasteryComplete} />;

            case 'progress':
                return <LearningProgress onContinue={handleContinue} />;

            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900">Learning Session</h1>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="text-sm text-blue-600 hover:text-blue-800"
                    >
                        ← Back to Dashboard
                    </button>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {renderStep()}
            </main>
        </div>
    );
};

export default StartAnyConceptSession;
