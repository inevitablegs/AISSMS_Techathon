import React, { useEffect, useState } from 'react';
import { useTeacher } from '../../context/TeacherContext';
import TeacherNavbar from './TeacherNavbar';

const ClassAnalytics = () => {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [expandedConcept, setExpandedConcept] = useState(null);
    const { teacherAxios } = useTeacher();

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const res = await teacherAxios.get('/auth/api/teacher/class-analytics/');
            setAnalytics(res.data);
        } catch (err) {
            console.error('Failed to fetch analytics:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-theme-bg flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const overall = analytics?.overall || {};
    const concepts = analytics?.concepts || [];

    return (
        <div className="min-h-screen bg-theme-bg">
            <TeacherNavbar />
            <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-theme-text">📈 Class Analytics</h1>
                    <p className="text-theme-text-secondary mt-1">Detailed performance breakdown across all concepts and atoms</p>
                </div>

                {/* Overall Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: 'Avg Mastery', value: `${(overall.avg_mastery * 100).toFixed(0)}%`, icon: '📊', color: 'from-emerald-500 to-teal-600' },
                        { label: 'Atoms Completed', value: overall.total_completions || 0, icon: '✅', color: 'from-blue-500 to-indigo-600' },
                        { label: 'Total Sessions', value: overall.total_sessions || 0, icon: '📅', color: 'from-violet-500 to-purple-600' },
                        { label: 'Questions Answered', value: overall.total_questions_answered || 0, icon: '❓', color: 'from-amber-500 to-orange-600' },
                    ].map((stat, i) => (
                        <div key={i} className={`bg-gradient-to-br ${stat.color} text-white rounded-theme-xl p-5 shadow-theme`}>
                            <div className="text-2xl mb-1">{stat.icon}</div>
                            <div className="text-2xl font-bold">{stat.value}</div>
                            <div className="text-sm text-white/70">{stat.label}</div>
                        </div>
                    ))}
                </div>

                {/* Concept Breakdown */}
                <div className="space-y-4">
                    {concepts.length === 0 ? (
                        <div className="bg-surface rounded-theme-xl shadow-theme border border-theme-border p-12 text-center">
                            <div className="text-5xl mb-4">📚</div>
                            <h3 className="text-lg font-semibold text-theme-text">No analytics data yet</h3>
                            <p className="text-theme-text-muted">Students need to start learning for analytics to appear</p>
                        </div>
                    ) : (
                        concepts.map(concept => (
                            <div key={concept.concept_id} className="bg-surface rounded-theme-xl shadow-theme border border-theme-border overflow-hidden">
                                <button
                                    onClick={() => setExpandedConcept(expandedConcept === concept.concept_id ? null : concept.concept_id)}
                                    className="w-full px-6 py-5 flex items-center justify-between hover:bg-surface-alt/50 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-bold ${
                                            concept.overall_mastery >= 0.7 ? 'bg-emerald-500' :
                                            concept.overall_mastery >= 0.4 ? 'bg-amber-500' : 'bg-error'
                                        }`}>
                                            {(concept.overall_mastery * 100).toFixed(0)}%
                                        </div>
                                        <div className="text-left">
                                            <h3 className="font-bold text-theme-text text-lg">{concept.concept_name}</h3>
                                            <p className="text-sm text-theme-text-muted">{concept.subject} · {concept.atoms?.length || 0} atoms</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="w-32 bg-surface-alt rounded-full h-3 hidden sm:block">
                                            <div
                                                className={`h-3 rounded-full transition-all duration-500 ${
                                                    concept.overall_mastery >= 0.7 ? 'bg-emerald-500' :
                                                    concept.overall_mastery >= 0.4 ? 'bg-amber-500' : 'bg-error'
                                                }`}
                                                style={{ width: `${Math.max(concept.overall_mastery * 100, 3)}%` }}
                                            />
                                        </div>
                                        <svg className={`w-5 h-5 text-theme-text-muted transition-transform ${
                                            expandedConcept === concept.concept_id ? 'rotate-180' : ''
                                        }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </button>

                                {expandedConcept === concept.concept_id && concept.atoms && (
                                    <div className="border-t border-theme-border">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="bg-surface-alt">
                                                        <th className="text-left px-6 py-3 font-medium text-theme-text-muted">Atom</th>
                                                        <th className="text-left px-4 py-3 font-medium text-theme-text-muted">Avg Mastery</th>
                                                        <th className="text-left px-4 py-3 font-medium text-theme-text-muted">Students</th>
                                                        <th className="text-left px-4 py-3 font-medium text-theme-text-muted">Completed</th>
                                                        <th className="text-left px-4 py-3 font-medium text-theme-text-muted">Struggling</th>
                                                        <th className="text-left px-4 py-3 font-medium text-theme-text-muted">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-theme-border">
                                                    {concept.atoms.map(atom => (
                                                        <tr key={atom.atom_id} className="hover:bg-surface-alt/50">
                                                            <td className="px-6 py-3 font-medium text-theme-text">{atom.atom_name}</td>
                                                            <td className="px-4 py-3">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-16 bg-surface-alt rounded-full h-2">
                                                                        <div
                                                                            className={`h-2 rounded-full ${
                                                                                atom.avg_mastery >= 0.7 ? 'bg-emerald-500' :
                                                                                atom.avg_mastery >= 0.4 ? 'bg-amber-500' : 'bg-error'
                                                                            }`}
                                                                            style={{ width: `${Math.max(atom.avg_mastery * 100, 4)}%` }}
                                                                        />
                                                                    </div>
                                                                    <span className="text-theme-text font-medium">{(atom.avg_mastery * 100).toFixed(0)}%</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3 text-theme-text">{atom.total_students}</td>
                                                            <td className="px-4 py-3">
                                                                <span className="text-emerald-500 font-medium">{atom.completed}</span>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                {atom.struggling > 0 ? (
                                                                    <span className="text-error font-medium">{atom.struggling}</span>
                                                                ) : (
                                                                    <span className="text-emerald-500">0</span>
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                {atom.avg_mastery < 0.4 && (
                                                                    <span className="text-xs px-2 py-1 bg-error/10 text-error rounded-full font-medium">
                                                                        ⚠️ Needs attention
                                                                    </span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Concept Summary */}
                                        <div className="px-6 py-4 bg-surface-alt/50 flex items-center justify-between text-sm">
                                            <span className="text-theme-text-muted">
                                                {concept.overall_mastery < 0.4
                                                    ? '🔴 This concept needs to be re-taught'
                                                    : concept.overall_mastery < 0.7
                                                    ? '🟡 Some students are struggling'
                                                    : '🟢 Students are performing well'}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </main>
        </div>
    );
};

export default ClassAnalytics;
