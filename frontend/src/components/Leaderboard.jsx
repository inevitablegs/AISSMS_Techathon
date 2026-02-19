import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from '../axiosConfig';

const Leaderboard = () => {
    const [leaderboard, setLeaderboard] = useState([]);
    const [myXP, setMyXP] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [lbRes, xpRes] = await Promise.all([
                    axios.get('/auth/api/leaderboard/'),
                    axios.get('/auth/api/my-xp/'),
                ]);
                setLeaderboard(lbRes.data);
                setMyXP(xpRes.data);
            } catch (err) {
                console.error('Failed to fetch leaderboard:', err);
                setError('Failed to load leaderboard');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const getRankBadge = (rank) => {
        if (rank === 1) return '🥇';
        if (rank === 2) return '🥈';
        if (rank === 3) return '🥉';
        return `#${rank}`;
    };

    const getRankColor = (rank) => {
        if (rank === 1) return 'bg-yellow-50 border-yellow-400';
        if (rank === 2) return 'bg-gray-50 border-gray-400';
        if (rank === 3) return 'bg-orange-50 border-orange-400';
        return 'bg-white border-gray-200';
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="text-xl text-gray-600">Loading leaderboard...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Navigation */}
            <nav className="bg-white shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <h1 className="text-xl font-semibold text-gray-800">
                                🏆 Leaderboard
                            </h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                            >
                                ← Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                        {error}
                    </div>
                )}

                {/* My XP Card */}
                {myXP && (
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-lg p-6 mb-6 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-indigo-100 text-sm font-medium">Your XP</p>
                                <p className="text-4xl font-bold">{myXP.total_xp} XP</p>
                                <p className="text-indigo-200 mt-1">
                                    Rank #{myXP.rank} of {myXP.total_users} learners
                                </p>
                            </div>
                            <div className="text-right space-y-1">
                                <div className="text-sm">
                                    <span className="text-indigo-200">Questions:</span>{' '}
                                    <span className="font-semibold">{myXP.questions_xp} XP</span>
                                </div>
                                <div className="text-sm">
                                    <span className="text-indigo-200">Atoms:</span>{' '}
                                    <span className="font-semibold">{myXP.atoms_xp} XP</span>
                                </div>
                                <div className="text-sm">
                                    <span className="text-indigo-200">Concepts:</span>{' '}
                                    <span className="font-semibold">{myXP.concepts_xp} XP</span>
                                </div>
                            </div>
                        </div>

                        {/* XP Breakdown Bar */}
                        <div className="mt-4">
                            <div className="flex h-3 rounded-full overflow-hidden bg-indigo-700">
                                {myXP.total_xp > 0 && (
                                    <>
                                        <div
                                            className="bg-green-400"
                                            style={{ width: `${(myXP.questions_xp / myXP.total_xp) * 100}%` }}
                                            title="Questions XP"
                                        />
                                        <div
                                            className="bg-yellow-400"
                                            style={{ width: `${(myXP.atoms_xp / myXP.total_xp) * 100}%` }}
                                            title="Atoms XP"
                                        />
                                        <div
                                            className="bg-pink-400"
                                            style={{ width: `${(myXP.concepts_xp / myXP.total_xp) * 100}%` }}
                                            title="Concepts XP"
                                        />
                                    </>
                                )}
                            </div>
                            <div className="flex justify-between text-xs mt-1 text-indigo-200">
                                <span>🟢 Questions</span>
                                <span>🟡 Atoms</span>
                                <span>🩷 Concepts</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* XP Rules */}
                <div className="bg-white rounded-xl shadow p-4 mb-6">
                    <h3 className="font-semibold text-gray-700 mb-2">How to earn XP</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-sm">
                        <div className="bg-green-50 rounded-lg p-2">
                            <div className="font-bold text-green-700">+1 XP</div>
                            <div className="text-gray-500">Easy Q</div>
                        </div>
                        <div className="bg-yellow-50 rounded-lg p-2">
                            <div className="font-bold text-yellow-700">+2 XP</div>
                            <div className="text-gray-500">Medium Q</div>
                        </div>
                        <div className="bg-red-50 rounded-lg p-2">
                            <div className="font-bold text-red-700">+3 XP</div>
                            <div className="text-gray-500">Hard Q</div>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-2">
                            <div className="font-bold text-blue-700">+5/10 XP</div>
                            <div className="text-gray-500">Atom ✓</div>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-2">
                            <div className="font-bold text-purple-700">+25/50 XP</div>
                            <div className="text-gray-500">Concept ✓</div>
                        </div>
                    </div>
                </div>

                {/* Leaderboard Table */}
                <div className="bg-white rounded-xl shadow overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-800">Top Learners</h2>
                    </div>

                    {leaderboard.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            No learners yet. Be the first to earn XP!
                        </div>
                    ) : (
                        <ul className="divide-y divide-gray-100">
                            {leaderboard.map((entry) => (
                                <li
                                    key={entry.username}
                                    className={`flex items-center justify-between px-6 py-4 transition border-l-4 ${
                                        entry.is_current_user
                                            ? 'bg-indigo-50 border-indigo-500'
                                            : getRankColor(entry.rank)
                                    }`}
                                >
                                    <div className="flex items-center space-x-4">
                                        <span className="text-2xl w-10 text-center">
                                            {getRankBadge(entry.rank)}
                                        </span>
                                        <div>
                                            <p className={`font-medium ${entry.is_current_user ? 'text-indigo-700' : 'text-gray-800'}`}>
                                                {entry.first_name || entry.username}
                                                {entry.last_name ? ` ${entry.last_name}` : ''}
                                                {entry.is_current_user && (
                                                    <span className="ml-2 text-xs bg-indigo-200 text-indigo-800 px-2 py-0.5 rounded-full">
                                                        You
                                                    </span>
                                                )}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                Q: {entry.questions_xp} · A: {entry.atoms_xp} · C: {entry.concepts_xp}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xl font-bold text-gray-800">
                                            {entry.total_xp}
                                        </span>
                                        <span className="text-sm text-gray-500 ml-1">XP</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Leaderboard;
