import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from '../axiosConfig';

const Dashboard = () => {
    const [concepts, setConcepts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [subjects, setSubjects] = useState([]);
    
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const fetchConcepts = useCallback(async () => {
        try {
            const response = await axios.get('/auth/api/concepts/');
            setConcepts(response.data);
            
            // Extract unique subjects
            const uniqueSubjects = [...new Set(response.data.map(c => c.subject))];
            setSubjects(uniqueSubjects);
        } catch (err) {
            console.error('Failed to fetch concepts:', err);
            setError('Failed to load concepts');
            
            if (err.response?.status === 401) {
                logout();
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    }, [logout, navigate]);

    useEffect(() => {
        fetchConcepts();
    }, [fetchConcepts]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleStartLearning = (conceptId) => {
        navigate(`/learn/${conceptId}`);
    };

    const handleStartAnyConcept = () => {
        navigate('/learn/start');
    };

    const handleViewProgress = () => {
        navigate('/progress');
    };

    const filteredConcepts = selectedSubject
        ? concepts.filter(c => c.subject === selectedSubject)
        : concepts;

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-xl text-gray-600">Loading...</div>
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
                                Adaptive Learning System
                            </h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="text-gray-700">
                                Welcome, {user?.first_name || user?.username}!
                            </span>
                            <button
                                onClick={handleLogout}
                                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                            {error}
                        </div>
                    )}

                    {/* Quick Actions */}
                    <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
                        <div className="px-4 py-5 sm:px-6">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">
                                Quick Actions
                            </h3>
                        </div>
                        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                <button
                                    onClick={handleStartAnyConcept}
                                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg text-center transition"
                                >
                                    ▶ Start New Session
                                </button>

                                <button
                                    onClick={handleViewProgress}
                                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg text-center transition"
                                >
                                    📊 View Progress
                                </button>

                                <button
                                    onClick={() => window.location.reload()}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg text-center transition"
                                >
                                    🔄 Refresh
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Concepts Section */}
                    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                            <div>
                                <h3 className="text-lg leading-6 font-medium text-gray-900">
                                    Available Concepts
                                </h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    Select a concept to start learning
                                </p>
                            </div>
                            
                            {/* Subject Filter */}
                            {subjects.length > 0 && (
                                <div className="w-64">
                                    <select
                                        value={selectedSubject}
                                        onChange={(e) => setSelectedSubject(e.target.value)}
                                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                                    >
                                        <option value="">All Subjects</option>
                                        {subjects.map(subject => (
                                            <option key={subject} value={subject}>
                                                {subject}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                        
                        <div className="border-t border-gray-200">
                            {filteredConcepts.length === 0 ? (
                                <div className="text-center py-12">
                                    <p className="text-gray-500">No concepts available.</p>
                                    <p className="text-sm text-gray-400 mt-2">
                                        Click "Start New Session" to create your first concept!
                                    </p>
                                </div>
                            ) : (
                                <ul className="divide-y divide-gray-200">
                                    {filteredConcepts.map((concept) => (
                                        <li key={concept.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-blue-600 truncate">
                                                        {concept.name}
                                                    </p>
                                                    <div className="mt-2 flex items-center text-sm text-gray-500">
                                                        <span className="truncate">{concept.subject}</span>
                                                        <span className="mx-2">•</span>
                                                        <span className="capitalize">
                                                            Difficulty: {concept.difficulty}
                                                        </span>
                                                        {concept.description && (
                                                            <>
                                                                <span className="mx-2">•</span>
                                                                <span className="truncate">{concept.description}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="ml-4 flex-shrink-0">
                                                    <button
                                                        onClick={() => handleStartLearning(concept.id)}
                                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                    >
                                                        Start Learning
                                                    </button>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>

                    {/* Learning Tips */}
                    <div className="mt-6 bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-blue-700">
                                    <strong>How it works:</strong> For each concept, you'll learn one atomic piece at a time, 
                                    then take a short quiz. The system adapts to your pace and mastery level.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;