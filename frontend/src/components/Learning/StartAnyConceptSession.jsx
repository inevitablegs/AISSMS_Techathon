// frontend/src/components/Learning/StartAnyConceptSession.jsx - Add axios import

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLearning } from "../../context/LearningContext";
import axios from "../../axiosConfig"; // Add this import
import DiagnosticQuiz from "./DiagnosticQuiz";
import TeachingModule from "./TeachingModule";
import LearningFlow from "./LearningFlow";

const KNOWLEDGE_LEVELS = [
  {
    value: "zero",
    label: "Zero Knowledge",
    description: "Completely new to this concept",
    emoji: "🌱",
  },
  {
    value: "beginner",
    label: "Beginner",
    description: "Have heard of it, but never really learned",
    emoji: "🌿",
  },
  {
    value: "intermediate",
    label: "Intermediate",
    description: "Know the basics, want to deepen understanding",
    emoji: "🌳",
  },
  {
    value: "advanced",
    label: "Advanced",
    description: "Strong foundation, ready for complex applications",
    emoji: "🏆",
  },
];

const StartAnyConceptSession = () => {
  const [step, setStep] = useState("input"); // input, atoms_preview, diagnostic, teaching, practice
  const [subject, setSubject] = useState("");
  const [concept, setConcept] = useState("");
  const [knowledgeLevel, setKnowledgeLevel] = useState("intermediate");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sessionData, setSessionData] = useState(null);
  const [currentAtomIndex, setCurrentAtomIndex] = useState(0);
  const [atomsList, setAtomsList] = useState([]);

  const navigate = useNavigate();
  const { startLearningSession, getTeachingContent, submitDiagnostic } =
    useLearning();

  // frontend/src/components/Learning/StartAnyConceptSession.jsx - Update handleGenerateConcept

  const handleGenerateConcept = async () => {
        if (!subject.trim() || !concept.trim()) {
            setError('Please enter both subject and concept');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Generate concept
            const response = await axios.post('/auth/api/generate-concept/', {
                subject: subject.trim(),
                concept: concept.trim()
            });

            if (response.data.success) {
                // Start learning session
                const sessionResult = await startLearningSession(
                    response.data.concept_id,
                    knowledgeLevel
                );

                if (sessionResult.success) {
                    setSessionData(sessionResult.data);
                    setStep('learning');
                } else {
                    setError(sessionResult.error || 'Failed to start learning session');
                }
            } else {
                setError(response.data.error || 'Failed to generate concept');
            }
        } catch (err) {
            console.error('Error:', err);
            setError(err.response?.data?.error || 'Failed to generate concept');
        } finally {
            setLoading(false);
        }
    };


  
  const handleStartLearning = () => {
    setStep("diagnostic");
  };

  const handleDiagnosticComplete = (results) => {
    console.log("Diagnostic complete:", results);
    setStep("teaching");
    // Start with first atom
    if (atomsList.length > 0) {
      getTeachingContent(atomsList[0].id);
    }
  };

  const handleAtomComplete = async (atomId) => {
    if (currentAtomIndex < atomsList.length - 1) {
      const nextIndex = currentAtomIndex + 1;
      setCurrentAtomIndex(nextIndex);
      await getTeachingContent(atomsList[nextIndex].id);
    } else {
      // All atoms completed
      setStep("complete");
    }
  };

  // Render based on current step

if (step === 'learning' && sessionData) {
        return (
            <LearningFlow
                sessionData={sessionData}
                onComplete={() => navigate('/dashboard')}
            />
        );
    }

  if (step === "atoms_preview") {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-3xl font-bold mb-4">Your Learning Path</h2>

          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-lg">
              <span className="font-semibold">Subject:</span> {subject}
            </p>
            <p className="text-lg">
              <span className="font-semibold">Concept:</span> {concept}
            </p>
            <p className="text-lg">
              <span className="font-semibold">Your Level:</span>{" "}
              {KNOWLEDGE_LEVELS.find((l) => l.value === knowledgeLevel)?.emoji}{" "}
              {KNOWLEDGE_LEVELS.find((l) => l.value === knowledgeLevel)?.label}
            </p>
          </div>

          <h3 className="text-xl font-semibold mb-4">
            We'll learn these concepts:
          </h3>

          <div className="space-y-3 mb-8">
            {atomsList.map((atom, index) => (
              <div
                key={atom.id}
                className="flex items-center p-3 bg-gray-50 rounded-lg"
              >
                <span className="text-2xl mr-4">{index + 1}.</span>
                <div className="flex-1">
                  <p className="font-medium text-lg">{atom.name}</p>
                  <p className="text-sm text-gray-600">
                    {index === 0
                      ? "🎯 Starting point"
                      : index === atomsList.length - 1
                        ? "🏁 Final concept"
                        : "→ Building block"}
                  </p>
                </div>
                <span className="text-green-500">✓ Ready</span>
              </div>
            ))}
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setStep("input")}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              ← Back
            </button>
            <button
              onClick={handleStartLearning}
              className="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700"
            >
              Start Learning Journey →
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === "diagnostic") {
    return (
      <DiagnosticQuiz
        sessionId={sessionData?.session_id}
        questions={sessionData?.diagnostic_questions}
        knowledgeLevel={knowledgeLevel}
        onComplete={handleDiagnosticComplete}
      />
    );
  }

  if (step === "teaching") {
    const currentAtom = atomsList[currentAtomIndex];
    return (
      <div>
        <div className="max-w-4xl mx-auto mb-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-gray-600">
            Progress: {currentAtomIndex + 1} of {atomsList.length} concepts
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${((currentAtomIndex + 1) / atomsList.length) * 100}%`,
              }}
            ></div>
          </div>
        </div>
        <TeachingModule
          atomId={currentAtom?.id}
          onComplete={handleAtomComplete}
        />
      </div>
    );
  }

  if (step === "complete") {
    return (
      <div className="max-w-2xl mx-auto text-center p-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-3xl font-bold mb-4">Congratulations!</h2>
          <p className="text-xl mb-6">
            You've completed all concepts in {concept}!
          </p>
          <div className="space-y-4 mb-8">
            <p className="text-gray-700">
              Your mastery level:{" "}
              <span className="font-bold text-green-600">Strong</span>
            </p>
          </div>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => navigate("/dashboard")}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Back to Dashboard
            </button>
            <button
              onClick={() => {
                setStep("input");
                setSubject("");
                setConcept("");
                setAtomsList([]);
                setCurrentAtomIndex(0);
              }}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
            >
              Learn Another Concept
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Input step
  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-3xl font-bold mb-6">Start Learning Any Concept</h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g., Microprocessor, Mathematics, Physics"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Concept
            </label>
            <input
              type="text"
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              placeholder="e.g., Memory Organization, Calculus, Quantum Mechanics"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Your Current Knowledge Level
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {KNOWLEDGE_LEVELS.map((level) => (
                <button
                  key={level.value}
                  onClick={() => setKnowledgeLevel(level.value)}
                  className={`p-4 border-2 rounded-lg text-left transition ${
                    knowledgeLevel === level.value
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-blue-300"
                  }`}
                  disabled={loading}
                >
                  <div className="flex items-start">
                    <span className="text-2xl mr-3">{level.emoji}</span>
                    <div>
                      <p className="font-semibold">{level.label}</p>
                      <p className="text-sm text-gray-600">
                        {level.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerateConcept}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Generating...
              </span>
            ) : (
              "Generate Learning Path →"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StartAnyConceptSession;
