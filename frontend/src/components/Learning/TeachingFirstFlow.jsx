import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLearning } from "../../context/LearningContext";
import TeachingModule from "./TeachingModule";
import QuestionsFromTeaching from "./QuestionsFromTeaching";
import AtomComplete from "./AtomComplete";
import AtomReview from "./AtomReview"; // New component for forced review

const TeachingFirstFlow = ({ conceptId }) => {
  const [session, setSession] = useState(null);
  const [atoms, setAtoms] = useState([]);
  const [currentAtom, setCurrentAtom] = useState(null);
  const [currentPhase, setCurrentPhase] = useState("teaching");
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [knowledgeLevel, setKnowledgeLevel] = useState("intermediate");
  const [pacingData, setPacingData] = useState({
    currentPacing: "stay",
    pacingHistory: [],
    recommendations: [],
  });
  const [atomMetrics, setAtomMetrics] = useState(null);
  const [nextAction, setNextAction] = useState(null);
  const [showDecisionDialog, setShowDecisionDialog] = useState(false);

  const navigate = useNavigate();
  const {
    startTeachingSession,
    getTeachingContent,
    generateQuestionsFromTeaching,
    submitAtomAnswer,
    completeAtom,
  } = useLearning();

  // Initialize session on mount
  useEffect(() => {
    const initSession = async () => {
      if (!conceptId) {
        setError("No concept selected");
        setLoading(false);
        return;
      }

      setLoading(true);
      const result = await startTeachingSession(conceptId, knowledgeLevel);

      if (result.success) {
        setSession(result.data);
        setAtoms(result.data.atoms);
        setCurrentPhase("teaching");

        setPacingData((prev) => ({
          ...prev,
          currentPacing: result.data.initial_pacing || "stay",
        }));

        if (result.data.atoms.length > 0) {
          setCurrentAtom(result.data.atoms[0]);
        }
      } else {
        setError(result.error || "Failed to start session");
      }
      setLoading(false);
    };

    initSession();
  }, [conceptId, startTeachingSession, knowledgeLevel]);

  const handleStartLearning = async (atom) => {
    setLoading(true);
    setCurrentAtom(atom);

    const result = await getTeachingContent({
      session_id: session.session_id,
      atom_id: atom.id,
    });

    if (result.success) {
      setCurrentPhase("teaching");
      if (result.data.current_pacing) {
        setPacingData((prev) => ({
          ...prev,
          currentPacing: result.data.current_pacing,
        }));
      }
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const handleQuestionsComplete = async () => {
    // NO PARAMETERS - system decides everything
    setLoading(true);

    const result = await completeAtom({
      session_id: session.session_id,
      atom_id: currentAtom.id,
      // NO continue_learning parameter!
    });

    if (result.success) {
      const data = result.data;

      // Store all metrics and decisions
      setAtomMetrics(data.metrics);
      setNextAction(data.next_action);

      // Update pacing history
      setPacingData((prev) => ({
        currentPacing: data.pacing.decision,
        pacingHistory: [
          ...prev.pacingHistory,
          {
            atomId: currentAtom.id,
            atomName: currentAtom.name,
            pacing: data.pacing.decision,
            accuracy: data.metrics.accuracy,
            mastery: data.metrics.final_mastery,
            thetaChange: data.metrics.theta_change,
            recommendation: data.pacing.recommendation,
            nextAction: data.next_action.action,
          },
        ],
        lastRecommendation: data.pacing.recommendation,
      }));

      // Update atoms list
      setAtoms((prev) =>
        prev.map((a) =>
          a.id === currentAtom.id
            ? {
                ...a,
                phase: "complete",
                mastery_score: data.metrics.final_mastery,
              }
            : a,
        ),
      );

      // ===== HANDLE AUTOMATIC NEXT ACTION =====

      if (data.all_completed) {
        // All atoms done - show completion
        setCurrentPhase("complete");
      } else if (data.next_action.action === "review_current") {
        // FORCE REVIEW - poor performance
        setCurrentPhase("review");
        setShowDecisionDialog(true);
      } else if (data.next_action.action === "auto_advance") {
        // AUTO ADVANCE - excellent performance - NO USER INPUT
        setCurrentAtom(data.next_atom);
        setCurrentPhase("teaching");
        setQuestions([]);
      } else if (
        data.next_action.action === "recommend_review" ||
        data.next_action.action === "recommend_practice"
      ) {
        // Strong recommendation - show dialog but don't force
        setShowDecisionDialog(true);
      } else if (data.next_action.action === "recommend_advance") {
        // Recommend advance - show dialog
        setShowDecisionDialog(true);
      } else if (data.next_action.action === "user_choice") {
        // Let user decide - show dialog
        setShowDecisionDialog(true);
      } else if (data.next_atom) {
        // Default - move to next automatically
        setCurrentAtom(data.next_atom);
        setCurrentPhase("teaching");
        setQuestions([]);
      }
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const handleFinishTeaching = async () => {
    setLoading(true);

    const result = await generateQuestionsFromTeaching({
      session_id: session.session_id,
      atom_id: currentAtom.id,
    });

    if (result.success) {
      setQuestions(result.data.questions);
      setCurrentPhase("questions");
      if (result.data.current_pacing) {
        setPacingData((prev) => ({
          ...prev,
          currentPacing: result.data.current_pacing,
        }));
      }
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const handleAnswerSubmit = async (questionIndex, selected, timeTaken) => {
    const result = await submitAtomAnswer({
      session_id: session.session_id,
      atom_id: currentAtom.id,
      question_index: questionIndex,
      selected: selected,
      time_taken: timeTaken,
    });

    if (result.success && result.data.current_pacing) {
      setPacingData((prev) => ({
        ...prev,
        currentPacing: result.data.current_pacing,
      }));
    }

    return result;
  };

  // Handle atom completion with AUTOMATIC decision making
  const handleAtomComplete = async () => {
    setLoading(true);

    const result = await completeAtom({
      session_id: session.session_id,
      atom_id: currentAtom.id,
      // NO continue_learning parameter - system decides!
    });

    if (result.success) {
      const data = result.data;

      // Store all metrics and decisions
      setAtomMetrics(data.metrics);
      setNextAction(data.next_action);

      // Update pacing history
      setPacingData((prev) => ({
        currentPacing: data.pacing.decision,
        pacingHistory: [
          ...prev.pacingHistory,
          {
            atomId: currentAtom.id,
            atomName: currentAtom.name,
            pacing: data.pacing.decision,
            accuracy: data.metrics.accuracy,
            mastery: data.metrics.final_mastery,
            thetaChange: data.metrics.theta_change,
            recommendation: data.pacing.recommendation,
            nextAction: data.next_action.action,
          },
        ],
        lastRecommendation: data.pacing.recommendation,
      }));

      // Update atoms list
      setAtoms((prev) =>
        prev.map((a) =>
          a.id === currentAtom.id
            ? {
                ...a,
                phase: "complete",
                mastery_score: data.metrics.final_mastery,
              }
            : a,
        ),
      );

      // ===== HANDLE AUTOMATIC NEXT ACTION =====

      if (data.all_completed) {
        // All atoms done - show completion
        setCurrentPhase("complete");
      } else if (data.next_action.action === "review_current") {
        // FORCE REVIEW - poor performance
        setCurrentPhase("review");
        setShowDecisionDialog(true);
      } else if (data.next_action.action === "auto_advance") {
        // AUTO ADVANCE - excellent performance
        // Show brief success message then auto-advance
        setTimeout(() => {
          setCurrentAtom(data.next_atom);
          setCurrentPhase("teaching");
          setQuestions([]);
        }, 2000);
      } else if (
        data.next_action.action === "recommend_review" ||
        data.next_action.action === "recommend_practice"
      ) {
        // Strong recommendation but not forced
        setShowDecisionDialog(true);
        // Store that we'll wait for user decision
      } else if (data.next_action.action === "recommend_advance") {
        // Recommend advance but allow choice
        setShowDecisionDialog(true);
      } else if (
        data.next_action.action === "user_choice" ||
        data.next_action.action === "optional_continue"
      ) {
        // Let user decide
        setShowDecisionDialog(true);
      } else {
        // Default - move to next if available
        if (data.next_atom) {
          setCurrentAtom(data.next_atom);
          setCurrentPhase("teaching");
          setQuestions([]);
        }
      }
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  // Handle user decision when choice is given
  const handleUserDecision = (decision) => {
    setShowDecisionDialog(false);

    if (decision === "review") {
      // User chooses to review
      setCurrentPhase("teaching"); // Go back to teaching
    } else if (decision === "practice") {
      // Generate more practice questions
      // This would need a new API call
      setCurrentPhase("questions");
    } else if (decision === "continue") {
      // Continue to next atom
      if (nextAction?.next_atom) {
        setCurrentAtom(nextAction.next_atom);
        setCurrentPhase("teaching");
        setQuestions([]);
      }
    } else if (decision === "stop") {
      // Stop for now
      navigate("/dashboard");
    }
  };

  const getPacingColor = (pacing) => {
    const colors = {
      sharp_slowdown: "text-red-600 bg-red-100",
      slow_down: "text-orange-600 bg-orange-100",
      stay: "text-blue-600 bg-blue-100",
      speed_up: "text-green-600 bg-green-100",
    };
    return colors[pacing] || "text-gray-600 bg-gray-100";
  };

  if (loading && !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl text-gray-600 mb-4">Loading session...</div>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg max-w-md">
          <h3 className="font-bold mb-2">Error</h3>
          <p>{error}</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!session || !currentAtom) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">
            No atoms available for this concept.
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const completedCount = atoms.filter((a) => a.phase === "complete").length;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header with Metrics */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                {session.concept_name}
              </h1>
              <p className="text-gray-600 mt-1">
                Level:{" "}
                <span className="capitalize font-medium">
                  {session.knowledge_level}
                </span>
              </p>
            </div>

            {/* Pacing Indicator */}
            <div
              className={`px-4 py-2 rounded-lg ${getPacingColor(pacingData.currentPacing)}`}
            >
              <span className="font-bold flex items-center">
                {pacingData.currentPacing === "sharp_slowdown" && "⚠️"}
                {pacingData.currentPacing === "slow_down" && "⏸️"}
                {pacingData.currentPacing === "stay" && "👉"}
                {pacingData.currentPacing === "speed_up" && "🚀"}
                <span className="ml-2 capitalize">
                  {typeof pacingData?.currentPacing === "object"
                    ? (pacingData.currentPacing.pacing || "stay").replace(
                        "_",
                        " ",
                      )
                    : (pacingData?.currentPacing || "stay").replace("_", " ")}
                </span>
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Progress</span>
              <span>
                {completedCount} of {atoms.length} completed
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${(completedCount / atoms.length) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Decision Dialog */}
        {showDecisionDialog && nextAction && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md">
              <h3 className="text-xl font-bold mb-2">Next Action Required</h3>

              {/* Show metrics summary */}
              {atomMetrics && (
                <div className="bg-gray-50 p-3 rounded mb-4 text-sm">
                  <p>Accuracy: {Math.round(atomMetrics.accuracy * 100)}%</p>
                  <p>Mastery: {Math.round(atomMetrics.final_mastery * 100)}%</p>
                  <p>θ Change: {atomMetrics.theta_change.toFixed(2)}</p>
                  <p>Time Ratio: {atomMetrics.time_ratio.toFixed(2)}x</p>
                </div>
              )}

              <p className="text-gray-700 mb-4">{nextAction.reason}</p>

              <div className="space-y-2">
                {nextAction.action === "review_current" && (
                  <>
                    <button
                      onClick={() => handleUserDecision("review")}
                      className="w-full bg-orange-600 text-white py-2 rounded hover:bg-orange-700"
                    >
                      Review This Concept
                    </button>
                  </>
                )}

                {nextAction.action === "recommend_review" && (
                  <>
                    <button
                      onClick={() => handleUserDecision("review")}
                      className="w-full bg-orange-600 text-white py-2 rounded hover:bg-orange-700"
                    >
                      Review Recommended
                    </button>
                    <button
                      onClick={() => handleUserDecision("continue")}
                      className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                    >
                      Continue Anyway
                    </button>
                  </>
                )}

                {nextAction.action === "recommend_advance" && (
                  <>
                    <button
                      onClick={() => handleUserDecision("continue")}
                      className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
                    >
                      Continue to Next
                    </button>
                    <button
                      onClick={() => handleUserDecision("practice")}
                      className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                    >
                      More Practice
                    </button>
                  </>
                )}

                {nextAction.action === "user_choice" && (
                  <>
                    <button
                      onClick={() => handleUserDecision("continue")}
                      className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
                    >
                      Continue to Next
                    </button>
                    <button
                      onClick={() => handleUserDecision("stop")}
                      className="w-full bg-gray-600 text-white py-2 rounded hover:bg-gray-700"
                    >
                      Stop for Now
                    </button>
                  </>
                )}

                <button
                  onClick={() => setShowDecisionDialog(false)}
                  className="w-full bg-gray-200 text-gray-800 py-2 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main content based on phase */}
        {currentPhase === "teaching" && (
          <TeachingModule
            atom={currentAtom}
            sessionId={session.session_id}
            onFinish={handleFinishTeaching}
            loading={loading}
            pacing={pacingData.currentPacing}
          />
        )}

        {currentPhase === "questions" && (
          <QuestionsFromTeaching
            questions={questions}
            atomName={currentAtom.name}
            sessionId={session.session_id}
            atomId={currentAtom.id}
            onAnswerSubmit={handleAnswerSubmit}
            onComplete={handleAtomComplete} // This now calls completeAtom without user prompt
            loading={loading}
            pacing={pacingData.currentPacing}
          />
        )}

        {currentPhase === "complete" && (
          <AtomComplete
            atoms={atoms}
            pacingHistory={pacingData.pacingHistory}
            metrics={{
              averageMastery:
                atoms.reduce((acc, a) => acc + (a.mastery_score || 0), 0) /
                atoms.length,
              completedCount,
              totalCount: atoms.length,
            }}
            onBackToDashboard={() => navigate("/dashboard")}
            onStartNewConcept={() => navigate("/learn/start")}
          />
        )}
      </div>
    </div>
  );
};

export default TeachingFirstFlow;
