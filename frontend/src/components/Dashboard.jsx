import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LearningProvider } from '../context/LearningContext';
import AdaptiveLearning from './Learning/AdaptiveLearning';
import axios from '../axiosConfig';

const Dashboard = () => {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showLearning, setShowLearning] = useState(false);
    
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const response = await axios.get('/auth/api/dashboard/');
            setDashboardData(response.data);
            setLoading(false);
        } catch (error) {
            setError('Failed to fetch dashboard data');
            setLoading(false);
            
            if (error.response?.status === 401) {
                logout();
                navigate('/login');
            }
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-xl text-gray-600">Loading...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-xl text-red-600">{error}</div>
            </div>
        );
    }

    if (showLearning) {
        return (
            <LearningProvider>
                <AdaptiveLearning />
            </LearningProvider>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <nav className="bg-white shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <h1 className="text-xl font-semibold text-gray-800">
                                Student Dashboard
                            </h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="text-gray-700">
                                Welcome, {user?.first_name}!
                            </span>
                            <button
                                onClick={() => setShowLearning(true)}
                                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                            >
                                Start Learning
                            </button>
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
                    <div className="border-4 border-dashed border-gray-200 rounded-lg p-6">
                        <h2 className="text-2xl font-bold mb-4">
                            {dashboardData?.message}
                        </h2>
                        
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            <div className="bg-white overflow-hidden shadow rounded-lg">
                                <div className="px-4 py-5 sm:p-6">
                                    <dt className="text-sm font-medium text-gray-500 truncate">
                                        Total Courses
                                    </dt>
                                    <dd className="mt-1 text-3xl font-semibold text-gray-900">
                                        {dashboardData?.dashboard_data?.total_courses}
                                    </dd>
                                </div>
                            </div>

                            <div className="bg-white overflow-hidden shadow rounded-lg">
                                <div className="px-4 py-5 sm:p-6">
                                    <dt className="text-sm font-medium text-gray-500 truncate">
                                        Completed Assignments
                                    </dt>
                                    <dd className="mt-1 text-3xl font-semibold text-gray-900">
                                        {dashboardData?.dashboard_data?.completed_assignments}
                                    </dd>
                                </div>
                            </div>

                            <div className="bg-white overflow-hidden shadow rounded-lg">
                                <div className="px-4 py-5 sm:p-6">
                                    <dt className="text-sm font-medium text-gray-500 truncate">
                                        Upcoming Events
                                    </dt>
                                    <dd className="mt-1 text-3xl font-semibold text-gray-900">
                                        {dashboardData?.dashboard_data?.upcoming_events}
                                    </dd>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
                            <div className="px-4 py-5 sm:px-6">
                                <h3 className="text-lg leading-6 font-medium text-gray-900">
                                    Quick Actions
                                </h3>
                            </div>
                            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <button
                                        onClick={() => setShowLearning(true)}
                                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg text-center"
                                    >
                                        🎯 Start Adaptive Learning
                                    </button>
                                    <button
                                        className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg text-center"
                                    >
                                        📊 View Progress
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
                            <div className="px-4 py-5 sm:px-6">
                                <h3 className="text-lg leading-6 font-medium text-gray-900">
                                    User Information
                                </h3>
                            </div>
                            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                                <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                                    <div className="sm:col-span-1">
                                        <dt className="text-sm font-medium text-gray-500">
                                            Username
                                        </dt>
                                        <dd className="mt-1 text-sm text-gray-900">
                                            {user?.username}
                                        </dd>
                                    </div>
                                    <div className="sm:col-span-1">
                                        <dt className="text-sm font-medium text-gray-500">
                                            Email
                                        </dt>
                                        <dd className="mt-1 text-sm text-gray-900">
                                            {user?.email}
                                        </dd>
                                    </div>
                                    <div className="sm:col-span-1">
                                        <dt className="text-sm font-medium text-gray-500">
                                            First Name
                                        </dt>
                                        <dd className="mt-1 text-sm text-gray-900">
                                            {user?.first_name}
                                        </dd>
                                    </div>
                                    <div className="sm:col-span-1">
                                        <dt className="text-sm font-medium text-gray-500">
                                            Last Name
                                        </dt>
                                        <dd className="mt-1 text-sm text-gray-900">
                                            {user?.last_name}
                                        </dd>
                                    </div>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;