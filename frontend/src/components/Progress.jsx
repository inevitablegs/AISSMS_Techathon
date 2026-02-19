import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from '../axiosConfig';

const Progress = () => {
    const [progress, setProgress] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProgress = async () => {
            try {
                const res = await axios.get('/auth/api/progress/');
                setProgress(res.data);
            } catch (err) {
                console.error('Failed to fetch progress:', err);
                setError('Failed to load progress data');
            } finally {
                setLoading(false);
            }
        };
        fetchProgress();
    }, []);

    const getPhaseIcon = (phase) => {
        const icons = { complete: '✅', teaching: '📚', diagnostic: '📝', not_started: '⭕' };
        return icons[phase] || '📌';
    };

    const getPhaseLabel = (phase) => {
        const labels = { complete: 'Mastered', teaching: 'Learning', diagnostic: 'In Progress', not_started: 'Not Started' };
        return labels[phase] || phase;
    };

    const getPhaseColor = (phase) => {
        const colors = { complete: 'text-green-600', teaching: 'text-blue-600', diagnostic: 'text-purple-600', not_started: 'text-gray-400' };
        return colors[phase] || 'text-gray-600';
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="text-xl text-gray-600 animate-pulse">Loading your progress...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                    <p className="text-red-600 text-lg mb-4">{error}</p>
                    <button onClick={() => navigate('/dashboard')} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    const p = progress;
    const masteryPct = Math.round((p.overall_mastery || 0) * 100);

    return (
        <div className="min-h-screen bg-gray-100 py-8 px-4">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Your Learning Progress</h1>
                        <p className="text-gray-500 mt-1">Track your mastery, XP, and study stats</p>
                    </div>
                    <button onClick={() => navigate('/dashboard')} className="bg-white text-gray-700 px-5 py-2 rounded-lg shadow hover:shadow-md border border-gray-200 font-medium transition">
                        ← Dashboard
                    </button>
                </div>

                {/* ─── XP Summary Card ─── */}
                <div className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 rounded-2xl shadow-lg p-6 mb-8 text-white">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold">⚡ Experience Points</h2>
                        <span className="text-3xl font-extrabold">{p.xp?.total_xp || 0} XP</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white/20 backdrop-blur rounded-lg p-3 text-center">
                            <p className="text-2xl font-bold">{p.xp?.questions_xp || 0}</p>
                            <p className="text-xs opacity-90">Questions XP</p>
                        </div>
                        <div className="bg-white/20 backdrop-blur rounded-lg p-3 text-center">
                            <p className="text-2xl font-bold">{p.xp?.atoms_xp || 0}</p>
                            <p className="text-xs opacity-90">Atoms XP</p>
                        </div>
                        <div className="bg-white/20 backdrop-blur rounded-lg p-3 text-center">
                            <p className="text-2xl font-bold">{p.xp?.concepts_xp || 0}</p>
                            <p className="text-xs opacity-90">Concepts XP</p>
                        </div>
                    </div>
                </div>

                {/* ─── Overview Stats ─── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {/* Overall Mastery */}
                    <div className="bg-white rounded-xl shadow p-5 text-center">
                        <div className="relative inline-flex items-center justify-center w-16 h-16 mb-2">
                            <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#3b82f6" strokeWidth="3"
                                    strokeDasharray={`${masteryPct} ${100 - masteryPct}`} strokeLinecap="round" />
                            </svg>
                            <span className="absolute text-sm font-bold text-blue-600">{masteryPct}%</span>
                        </div>
                        <p className="text-xs text-gray-500 font-medium">Overall Mastery</p>
                    </div>

                    {/* Learning Streak */}
                    <div className="bg-white rounded-xl shadow p-5 text-center">
                        <p className="text-3xl font-bold text-orange-500 mb-1">{p.learning_streak || 0} 🔥</p>
                        <p className="text-xs text-gray-500 font-medium">Day Streak</p>
                    </div>

                    {/* Ability Score */}
                    <div className="bg-white rounded-xl shadow p-5 text-center">
                        <p className="text-3xl font-bold text-purple-600 mb-1">{p.overall_theta?.toFixed(2) || '0.00'}</p>
                        <p className="text-xs text-gray-500 font-medium">Ability (θ)</p>
                    </div>

                    {/* Accuracy */}
                    <div className="bg-white rounded-xl shadow p-5 text-center">
                        <p className="text-3xl font-bold text-green-600 mb-1">{Math.round((p.overall_accuracy || 0) * 100)}%</p>
                        <p className="text-xs text-gray-500 font-medium">Overall Accuracy</p>
                    </div>
                </div>

                {/* ─── Study Stats ─── */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">📊 Study Statistics</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                        <StatBox label="Sessions" value={p.total_sessions || 0} color="blue" />
                        <StatBox label="Questions Answered" value={p.total_questions_answered || 0} color="indigo" />
                        <StatBox label="Correct Answers" value={p.total_correct_answers || 0} color="green" />
                        <StatBox label="Hints Used" value={p.total_hints_used || 0} color="amber" />
                        <StatBox label="Time Spent" value={`${Math.round((p.total_time_spent || 0) / 60)}m`} color="rose" />
                    </div>
                </div>

                {/* ─── Atoms & Concepts Overview ─── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-3">🧩 Atoms</h3>
                        <div className="flex items-end gap-3">
                            <span className="text-4xl font-extrabold text-blue-600">{p.mastered_atoms || 0}</span>
                            <span className="text-gray-400 text-lg mb-1">/ {p.total_atoms || 0} mastered</span>
                        </div>
                        {p.total_atoms > 0 && (
                            <div className="mt-3 w-full bg-gray-200 rounded-full h-3">
                                <div className="bg-blue-500 h-3 rounded-full transition-all" style={{ width: `${Math.round((p.mastered_atoms / p.total_atoms) * 100)}%` }} />
                            </div>
                        )}
                    </div>
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-3">📦 Concepts</h3>
                        <div className="flex items-end gap-3">
                            <span className="text-4xl font-extrabold text-green-600">{p.concepts_completed || 0}</span>
                            <span className="text-gray-400 text-lg mb-1">/ {p.concepts_started || 0} completed</span>
                        </div>
                        {p.concepts_started > 0 && (
                            <div className="mt-3 w-full bg-gray-200 rounded-full h-3">
                                <div className="bg-green-500 h-3 rounded-full transition-all" style={{ width: `${Math.round((p.concepts_completed / p.concepts_started) * 100)}%` }} />
                            </div>
                        )}
                    </div>
                </div>

                {/* ─── Per-Concept Breakdown ─── */}
                {p.concepts && p.concepts.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-lg font-bold text-gray-800 mb-4">📚 Concept Breakdown</h2>
                        {p.concepts.map((concept, idx) => (
                            <div key={idx} className="bg-white rounded-xl shadow-lg p-6 mb-4">
                                <div className="flex items-center justify-between mb-2">
                                    <div>
                                        <h4 className="text-md font-semibold text-gray-800">{concept.name}</h4>
                                        <p className="text-xs text-gray-400">{concept.subject}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-lg font-bold text-blue-600">{concept.mastery_pct || 0}%</span>
                                        <p className="text-xs text-gray-400">{concept.mastered_count}/{concept.total_count} atoms</p>
                                    </div>
                                </div>
                                {/* Mastery bar */}
                                <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                                    <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${concept.mastery_pct || 0}%` }} />
                                </div>
                                {/* Atoms */}
                                <div className="space-y-2">
                                    {concept.atoms.map((atom, aIdx) => (
                                        <div key={aIdx} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg">{getPhaseIcon(atom.phase)}</span>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-700">{atom.name}</p>
                                                    <p className="text-xs text-gray-400">
                                                        {Math.round(atom.mastery * 100)}% mastery
                                                        {atom.streak > 0 && ` · ${atom.streak} streak`}
                                                        {atom.error_count > 0 && ` · ${atom.error_count} errors`}
                                                        {atom.last_practiced && ` · Last: ${new Date(atom.last_practiced).toLocaleDateString()}`}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className={`text-xs font-semibold ${getPhaseColor(atom.phase)}`}>
                                                {getPhaseLabel(atom.phase)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ─── Recent Sessions ─── */}
                {p.recent_sessions && p.recent_sessions.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-lg font-bold text-gray-800 mb-4">🕒 Recent Sessions</h2>
                        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                                    <tr>
                                        <th className="px-4 py-3 text-left">Concept</th>
                                        <th className="px-4 py-3 text-left">Subject</th>
                                        <th className="px-4 py-3 text-center">Questions</th>
                                        <th className="px-4 py-3 text-center">Accuracy</th>
                                        <th className="px-4 py-3 text-center">Duration</th>
                                        <th className="px-4 py-3 text-right">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {p.recent_sessions.map((s, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 font-medium text-gray-800">{s.concept_name}</td>
                                            <td className="px-4 py-3 text-gray-500">{s.subject || '—'}</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="text-green-600 font-medium">{s.correct_answers}</span>
                                                <span className="text-gray-400">/{s.questions_answered}</span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`font-medium ${s.accuracy >= 0.8 ? 'text-green-600' : s.accuracy >= 0.5 ? 'text-yellow-600' : 'text-red-500'}`}>
                                                    {Math.round(s.accuracy * 100)}%
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center text-gray-500">
                                                {s.duration_mins ? `${s.duration_mins}m` : '—'}
                                            </td>
                                            <td className="px-4 py-3 text-right text-gray-400 text-xs">
                                                {new Date(s.start_time).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ─── Empty state ─── */}
                {(!p.concepts || p.concepts.length === 0) && (
                    <div className="bg-white rounded-xl shadow-lg p-12 text-center mb-8">
                        <p className="text-5xl mb-4">📖</p>
                        <h3 className="text-xl font-bold text-gray-700 mb-2">No learning data yet</h3>
                        <p className="text-gray-500 mb-6">Start a learning session to track your progress!</p>
                        <button onClick={() => navigate('/learn/start')} className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition">
                            Start Learning
                        </button>
                    </div>
                )}

                {/* Bottom actions */}
                <div className="flex justify-center gap-4 pb-8">
                    <button onClick={() => navigate('/learn/start')} className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition">
                        Continue Learning
                    </button>
                    <button onClick={() => navigate('/leaderboard')} className="bg-white text-gray-700 px-8 py-3 rounded-lg font-semibold border border-gray-200 hover:shadow-md transition">
                        View Leaderboard
                    </button>
                </div>
            </div>
        </div>
    );
};

const StatBox = ({ label, value, color }) => (
    <div className={`bg-${color}-50 rounded-lg p-3 text-center`}>
        <p className={`text-xl font-bold text-${color}-600`}>{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
    </div>
);

export default Progress;
