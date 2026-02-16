import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
    return (
        <div className="min-h-screen bg-gradient-to-r from-blue-500 to-purple-600">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <nav className="flex justify-between items-center py-6">
                    <div className="text-white text-2xl font-bold">
                        Student Portal
                    </div>
                    <div className="space-x-4">
                        <Link
                            to="/login"
                            className="text-white hover:text-gray-200 px-3 py-2 rounded-md text-sm font-medium"
                        >
                            Login
                        </Link>
                        <Link
                            to="/register"
                            className="bg-white text-blue-600 hover:bg-gray-100 px-4 py-2 rounded-md text-sm font-medium"
                        >
                            Register
                        </Link>
                    </div>
                </nav>

                <main className="mt-20">
                    <div className="text-center">
                        <h1 className="text-4xl tracking-tight font-extrabold text-white sm:text-5xl md:text-6xl">
                            <span className="block">Welcome to Student Portal</span>
                            <span className="block text-3xl mt-3">Your one-stop solution for student management</span>
                        </h1>
                        <p className="mt-3 max-w-md mx-auto text-base text-gray-100 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
                            Access your courses, track assignments, and stay updated with upcoming events. 
                            Join thousands of students already using our platform.
                        </p>
                        <div className="mt-10 flex justify-center gap-4">
                            <Link
                                to="/register"
                                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-gray-50 md:text-lg"
                            >
                                Get Started
                            </Link>
                            <Link
                                to="/login"
                                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-800 bg-opacity-60 hover:bg-opacity-70 md:text-lg"
                            >
                                Sign In
                            </Link>
                        </div>
                    </div>

                    <div className="mt-20 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="bg-white rounded-lg shadow-lg p-6">
                            <div className="text-blue-600 text-2xl mb-4">📚</div>
                            <h3 className="text-xl font-semibold mb-2">Course Management</h3>
                            <p className="text-gray-600">
                                Easily manage and track all your courses in one place.
                            </p>
                        </div>
                        <div className="bg-white rounded-lg shadow-lg p-6">
                            <div className="text-blue-600 text-2xl mb-4">📝</div>
                            <h3 className="text-xl font-semibold mb-2">Assignment Tracking</h3>
                            <p className="text-gray-600">
                                Keep track of your assignments and never miss a deadline.
                            </p>
                        </div>
                        <div className="bg-white rounded-lg shadow-lg p-6">
                            <div className="text-blue-600 text-2xl mb-4">📅</div>
                            <h3 className="text-xl font-semibold mb-2">Event Calendar</h3>
                            <p className="text-gray-600">
                                Stay updated with upcoming academic events and deadlines.
                            </p>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Home;