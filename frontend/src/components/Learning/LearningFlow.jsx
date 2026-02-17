// frontend/src/components/Learning/LearningFlow.jsx

import React, { useState, useEffect } from 'react';
import { useLearning } from '../../context/LearningContext';
import TeachingModule from './TeachingModule';
import DiagnosticQuiz from './DiagnosticQuiz';
import PracticeSession from './PracticeSession';

const LearningFlow = ({ sessionData, onComplete }) => {
    const [currentAtomIndex, setCurrentAtomIndex] = useState(0);
    const [currentPhase, setCurrentPhase] = useState('teaching'); // teaching, diagnostic, practice, complete
    const [atoms, setAtoms] = useState([]);
    const [currentAtom, setCurrentAtom] = useState(null);
    const [diagnosticQuestions, setDiagnosticQuestions] = useState([]);
    
    const { 
        getTeachingContent, 
        markAtomTaught, 
        getDiagnosticQuestions,
        submitDiagnosticAnswer,
        completeDiagnostic,
        loading 
    } = useLearning();

    useEffect(() => {
        if (sessionData?.atoms) {
            setAtoms(sessionData.atoms);
            setCurrentAtom(sessionData.current_atom);
            
            // Find index of current atom
            const index = sessionData.atoms.findIndex(
                a => a.id === sessionData.current_atom?.id
            );
            setCurrentAtomIndex(index >= 0 ? index : 0);
        }
    }, [sessionData]);

    useEffect(() => {
        if (currentAtom) {
            // Load teaching content when atom changes
            getTeachingContent(currentAtom.id);
        }
    }, [currentAtom, getTeachingContent]);

    const handleTeachingComplete = async (atomId, timeSpent) => {
        // Mark atom as taught and move to diagnostic
        const result = await markAtomTaught(atomId, timeSpent);
        
        if (result.success) {
            setCurrentPhase('diagnostic');
            
            // Load diagnostic questions
            const questionsResult = await getDiagnosticQuestions(atomId);
            if (questionsResult.success) {
                setDiagnosticQuestions(questionsResult.data.questions);
            }
        }
    };

    const handleDiagnosticComplete = async (results) => {
        // Submit diagnostic results and determine next steps
        const result = await completeDiagnostic(currentAtom.id, results.answers);
        
        if (result.success) {
            if (result.data.next_phase === 'complete') {
                // Move to next atom or finish
                handleAtomComplete();
            } else {
                // Need practice
                setCurrentPhase('practice');
            }
        }
    };

    const handlePracticeComplete = () => {
        handleAtomComplete();
    };

    const handleAtomComplete = () => {
        // Check if there are more atoms
        if (currentAtomIndex < atoms.length - 1) {
            // Move to next atom
            const nextIndex = currentAtomIndex + 1;
            setCurrentAtomIndex(nextIndex);
            setCurrentAtom(atoms[nextIndex]);
            setCurrentPhase('teaching');
            setDiagnosticQuestions([]);
        } else {
            // All atoms completed
            setCurrentPhase('complete');
            if (onComplete) {
                onComplete();
            }
        }
    };

    const getProgress = () => {
        const completed = atoms.filter(a => a.phase === 'complete').length;
        return {
            completed,
            total: atoms.length,
            percentage: (completed / atoms.length) * 100
        };
    };

    const progress = getProgress();

    // Render progress bar
    const renderProgressBar = () => (
        <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">
                    Progress: {progress.completed} of {progress.total} concepts
                </span>
                <span className="text-sm font-medium text-blue-600">
                    {Math.round(progress.percentage)}%
                </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${progress.percentage}%` }}
                ></div>
            </div>
        </div>
    );

    // Render current atom info
    const renderAtomInfo = () => (
        <div className="mb-4 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-800">
                Current Concept: {currentAtom?.name}
            </h3>
            <p className="text-sm text-blue-600">
                Phase: {currentPhase === 'teaching' ? '📚 Learning' : 
                       currentPhase === 'diagnostic' ? '📝 Diagnostic' : 
                       currentPhase === 'practice' ? '💪 Practice' : '✅ Complete'}
            </p>
        </div>
    );

    if (!currentAtom) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-600">Loading learning session...</p>
            </div>
        );
    }

    if (currentPhase === 'teaching') {
        return (
            <div className="max-w-4xl mx-auto">
                {renderProgressBar()}
                {renderAtomInfo()}
                <TeachingModule
                    atomId={currentAtom.id}
                    onComplete={handleTeachingComplete}
                />
            </div>
        );
    }

    if (currentPhase === 'diagnostic') {
        return (
            <div className="max-w-4xl mx-auto">
                {renderProgressBar()}
                {renderAtomInfo()}
                <DiagnosticQuiz
                    atomId={currentAtom.id}
                    questions={diagnosticQuestions}
                    onSubmitAnswer={submitDiagnosticAnswer}
                    onComplete={handleDiagnosticComplete}
                />
            </div>
        );
    }

    if (currentPhase === 'practice') {
        return (
            <div className="max-w-4xl mx-auto">
                {renderProgressBar()}
                {renderAtomInfo()}
                <PracticeSession
                    atomId={currentAtom.id}
                    onComplete={handlePracticeComplete}
                />
            </div>
        );
    }

    if (currentPhase === 'complete') {
        return (
            <div className="max-w-2xl mx-auto text-center p-8">
                <div className="bg-white rounded-lg shadow-lg p-8">
                    <div className="text-6xl mb-4">🎉</div>
                    <h2 className="text-3xl font-bold mb-4">Congratulations!</h2>
                    <p className="text-xl mb-6">
                        You've mastered all concepts!
                    </p>
                    <div className="space-y-4 mb-8">
                        <p className="text-gray-700">
                            Total concepts learned: <span className="font-bold text-green-600">{progress.total}</span>
                        </p>
                        <p className="text-gray-700">
                            Mastery level: <span className="font-bold text-green-600">Strong</span>
                        </p>
                    </div>
                    <button
                        onClick={() => window.location.href = '/dashboard'}
                        className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return null;
};

export default LearningFlow;