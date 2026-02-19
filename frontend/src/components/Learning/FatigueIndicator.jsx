import React from 'react';
import { useLearning } from '../../context/LearningContext';

const FATIGUE_CONFIG = {
  fresh:    { color: 'bg-green-500',  text: 'Fresh',    icon: '🟢', bar: 'w-1/5' },
  mild:     { color: 'bg-yellow-400', text: 'Mild',     icon: '🟡', bar: 'w-2/5' },
  moderate: { color: 'bg-orange-400', text: 'Moderate', icon: '🟠', bar: 'w-3/5' },
  high:     { color: 'bg-red-400',    text: 'High',     icon: '🔴', bar: 'w-4/5' },
  critical: { color: 'bg-red-600',    text: 'Critical', icon: '⛔', bar: 'w-full' },
};

export default function FatigueIndicator() {
  const { fatigueLevel, showBreakModal, setShowBreakModal, recordBreak, currentSession } = useLearning();

  const cfg = FATIGUE_CONFIG[fatigueLevel] || FATIGUE_CONFIG.fresh;

  const handleTakeBreak = async () => {
    if (currentSession?.session_id) {
      await recordBreak(currentSession.session_id);
    }
    setShowBreakModal(false);
  };

  return (
    <>
      {/* Compact indicator bar */}
      <div className="flex items-center gap-2 text-xs">
        <span>{cfg.icon}</span>
        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div className={`h-full ${cfg.color} ${cfg.bar} transition-all duration-500 rounded-full`} />
        </div>
        <span className="text-gray-500 font-medium">{cfg.text}</span>
      </div>

      {/* Break modal */}
      {showBreakModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm mx-4 text-center">
            <div className="text-4xl mb-3">😮‍💨</div>
            <h3 className="text-lg font-semibold mb-1">You seem tired</h3>
            <p className="text-sm text-gray-500 mb-4">
              Your response times and accuracy suggest fatigue. A short break can boost retention by up to 20%.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleTakeBreak}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
              >
                Take a 5-min break
              </button>
              <button
                onClick={() => setShowBreakModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
