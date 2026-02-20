import React, { useEffect, useState } from 'react';
import { useTeacher } from '../../context/TeacherContext';
import TeacherNavbar from './TeacherNavbar';

const QuestionManagement = () => {
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all');
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState(null);
    const [concepts, setConcepts] = useState([]);
    const [addForm, setAddForm] = useState({
        atom_id: '', question_text: '', options: ['', '', '', ''],
        correct_index: 0, difficulty: 'medium', cognitive_operation: 'apply'
    });
    const [editForm, setEditForm] = useState({
        edited_question_text: '', edited_options: ['', '', '', ''], edited_correct_index: 0
    });
    const { teacherAxios } = useTeacher();

    useEffect(() => {
        fetchData();
    }, [filterStatus]);

    const fetchData = async () => {
        try {
            const [qRes, cRes] = await Promise.all([
                teacherAxios.get(`/auth/api/teacher/questions/?status=${filterStatus}`),
                teacherAxios.get('/auth/api/teacher/concepts/'),
            ]);
            setQuestions(qRes.data);
            setConcepts(cRes.data);
        } catch (err) {
            console.error('Failed to fetch:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (questionId, action, feedback = '') => {
        try {
            const payload = { question_id: questionId, action, feedback };
            if (action === 'edit' && editingQuestion) {
                payload.edited_question_text = editForm.edited_question_text;
                payload.edited_options = editForm.edited_options;
                payload.edited_correct_index = editForm.edited_correct_index;
            }
            await teacherAxios.post('/auth/api/teacher/question-approve/', payload);
            setEditingQuestion(null);
            fetchData();
        } catch (err) {
            console.error('Failed:', err);
        }
    };

    const handleAddQuestion = async () => {
        try {
            await teacherAxios.post('/auth/api/teacher/question-add/', {
                ...addForm,
                options: addForm.options.filter(o => o.trim()),
            });
            setShowAddForm(false);
            setAddForm({ atom_id: '', question_text: '', options: ['', '', '', ''], correct_index: 0, difficulty: 'medium', cognitive_operation: 'apply' });
            fetchData();
        } catch (err) {
            console.error('Failed to add question:', err);
        }
    };

    const startEditing = (q) => {
        setEditingQuestion(q.id);
        setEditForm({
            edited_question_text: q.question_text,
            edited_options: [...(q.options || [])],
            edited_correct_index: q.correct_index,
        });
    };

    const statusColors = {
        pending: 'bg-amber-500/10 text-amber-500',
        approved: 'bg-emerald-500/10 text-emerald-500',
        rejected: 'bg-error/10 text-error',
        edited: 'bg-blue-500/10 text-blue-500',
        disabled: 'bg-surface-alt text-theme-text-muted',
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-theme-bg flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-theme-bg">
            <TeacherNavbar />
            <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-theme-text">❓ Question Management</h1>
                        <p className="text-theme-text-secondary mt-1">Review, approve, edit, and create questions</p>
                    </div>
                    <div className="flex gap-2">
                        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-3 py-2 rounded-lg bg-surface border border-theme-border text-theme-text text-sm">
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                            <option value="edited">Edited</option>
                            <option value="disabled">Disabled</option>
                        </select>
                        <button onClick={() => setShowAddForm(!showAddForm)}
                            className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg text-sm font-semibold hover:opacity-90">
                            + Add Question
                        </button>
                    </div>
                </div>

                {/* Add Question Form */}
                {showAddForm && (
                    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-theme-xl p-6 mb-6">
                        <h3 className="font-bold text-theme-text mb-4">➕ Add New Question</h3>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-theme-text mb-1">Atom</label>
                                <select value={addForm.atom_id} onChange={(e) => setAddForm({ ...addForm, atom_id: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg bg-surface border border-theme-border text-theme-text text-sm">
                                    <option value="">Select Atom</option>
                                    {concepts.flatMap(c => c.atoms?.map(a => (
                                        <option key={a.id} value={a.id}>{c.name} → {a.name}</option>
                                    )))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-sm font-medium text-theme-text mb-1">Difficulty</label>
                                    <select value={addForm.difficulty} onChange={(e) => setAddForm({ ...addForm, difficulty: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg bg-surface border border-theme-border text-theme-text text-sm">
                                        <option value="easy">Easy</option>
                                        <option value="medium">Medium</option>
                                        <option value="hard">Hard</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-theme-text mb-1">Type</label>
                                    <select value={addForm.cognitive_operation} onChange={(e) => setAddForm({ ...addForm, cognitive_operation: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg bg-surface border border-theme-border text-theme-text text-sm">
                                        <option value="recall">Recall</option>
                                        <option value="apply">Apply</option>
                                        <option value="analyze">Analyze</option>
                                    </select>
                                </div>
                            </div>
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-theme-text mb-1">Question Text</label>
                                <textarea value={addForm.question_text} onChange={(e) => setAddForm({ ...addForm, question_text: e.target.value })}
                                    rows={2} className="w-full px-3 py-2 rounded-lg bg-surface border border-theme-border text-theme-text text-sm" />
                            </div>
                            {addForm.options.map((opt, i) => (
                                <div key={i}>
                                    <label className="block text-sm font-medium text-theme-text mb-1">
                                        Option {i + 1} {i === addForm.correct_index && '✅'}
                                    </label>
                                    <div className="flex gap-2">
                                        <input value={opt}
                                            onChange={(e) => {
                                                const opts = [...addForm.options];
                                                opts[i] = e.target.value;
                                                setAddForm({ ...addForm, options: opts });
                                            }}
                                            className="flex-1 px-3 py-2 rounded-lg bg-surface border border-theme-border text-theme-text text-sm" />
                                        <button onClick={() => setAddForm({ ...addForm, correct_index: i })}
                                            className={`px-3 py-2 rounded-lg text-xs font-medium ${
                                                i === addForm.correct_index ? 'bg-emerald-500 text-white' : 'bg-surface-alt text-theme-text-muted'
                                            }`}>
                                            Correct
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 flex gap-2">
                            <button onClick={handleAddQuestion} className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-semibold">Add Question</button>
                            <button onClick={() => setShowAddForm(false)} className="px-4 py-2 bg-surface-alt text-theme-text rounded-lg text-sm">Cancel</button>
                        </div>
                    </div>
                )}

                {/* Questions List */}
                <div className="space-y-4">
                    {questions.length === 0 ? (
                        <div className="bg-surface rounded-theme-xl shadow-theme border border-theme-border p-12 text-center">
                            <div className="text-5xl mb-4">📋</div>
                            <h3 className="text-lg font-semibold text-theme-text">No questions found</h3>
                            <p className="text-theme-text-muted">Try changing the filter or add a new question</p>
                        </div>
                    ) : (
                        questions.map(q => (
                            <div key={q.id} className="bg-surface rounded-theme-xl shadow-theme border border-theme-border overflow-hidden">
                                <div className="p-6">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[q.approval_status] || statusColors.pending}`}>
                                                    {q.approval_status}
                                                </span>
                                                <span className="text-xs text-theme-text-muted">{q.concept_name} → {q.atom_name}</span>
                                                <span className="text-xs text-theme-text-muted">· {q.difficulty} · {q.cognitive_operation}</span>
                                            </div>

                                            {editingQuestion === q.id ? (
                                                <div className="space-y-3">
                                                    <textarea value={editForm.edited_question_text}
                                                        onChange={(e) => setEditForm({ ...editForm, edited_question_text: e.target.value })}
                                                        rows={2} className="w-full px-3 py-2 rounded-lg bg-surface-alt border border-theme-border text-theme-text text-sm" />
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {editForm.edited_options.map((opt, i) => (
                                                            <div key={i} className="flex gap-1">
                                                                <input value={opt}
                                                                    onChange={(e) => {
                                                                        const opts = [...editForm.edited_options];
                                                                        opts[i] = e.target.value;
                                                                        setEditForm({ ...editForm, edited_options: opts });
                                                                    }}
                                                                    className="flex-1 px-2 py-1.5 rounded-lg bg-surface-alt border border-theme-border text-theme-text text-xs" />
                                                                <button onClick={() => setEditForm({ ...editForm, edited_correct_index: i })}
                                                                    className={`px-2 py-1.5 rounded-lg text-xs ${
                                                                        i === editForm.edited_correct_index ? 'bg-emerald-500 text-white' : 'bg-surface-alt text-theme-text-muted'
                                                                    }`}>✓</button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button onClick={() => handleApprove(q.id, 'edit')}
                                                            className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-xs font-semibold">Save Edit</button>
                                                        <button onClick={() => setEditingQuestion(null)}
                                                            className="px-3 py-1.5 bg-surface-alt text-theme-text rounded-lg text-xs">Cancel</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <p className="text-theme-text font-medium">{q.question_text}</p>
                                                    <div className="mt-2 grid grid-cols-2 gap-2">
                                                        {q.options?.map((opt, i) => (
                                                            <div key={i} className={`px-3 py-2 rounded-lg text-sm ${
                                                                i === q.correct_index
                                                                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 font-medium'
                                                                    : 'bg-surface-alt text-theme-text-secondary'
                                                            }`}>
                                                                {String.fromCharCode(65 + i)}. {opt}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action buttons */}
                                    {editingQuestion !== q.id && (
                                        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-theme-border">
                                            {q.approval_status !== 'approved' && (
                                                <button onClick={() => handleApprove(q.id, 'approve')}
                                                    className="px-3 py-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg text-xs font-semibold hover:bg-emerald-500/20 transition-colors">
                                                    ✅ Approve
                                                </button>
                                            )}
                                            {q.approval_status !== 'rejected' && (
                                                <button onClick={() => handleApprove(q.id, 'reject')}
                                                    className="px-3 py-1.5 bg-error/10 text-error rounded-lg text-xs font-semibold hover:bg-error/20 transition-colors">
                                                    ❌ Reject
                                                </button>
                                            )}
                                            <button onClick={() => startEditing(q)}
                                                className="px-3 py-1.5 bg-blue-500/10 text-blue-500 rounded-lg text-xs font-semibold hover:bg-blue-500/20 transition-colors">
                                                ✏️ Edit
                                            </button>
                                            {q.approval_status !== 'disabled' && (
                                                <button onClick={() => handleApprove(q.id, 'disable')}
                                                    className="px-3 py-1.5 bg-surface-alt text-theme-text-muted rounded-lg text-xs font-semibold hover:bg-surface-alt/80 transition-colors">
                                                    🚫 Disable
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    {q.approval_feedback && (
                                        <div className="mt-3 p-2 rounded-lg bg-surface-alt text-xs text-theme-text-muted">
                                            <strong>Feedback:</strong> {q.approval_feedback}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </main>
        </div>
    );
};

export default QuestionManagement;
