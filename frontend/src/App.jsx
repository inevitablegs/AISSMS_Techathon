import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import LearningRoute from './components/Learning/LearningRoute';
import StartAnyConceptSessionRoute from './components/Learning/StartAnyConceptSessionRoute';


function App() {
    return (
        <Router>
            <AuthProvider>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    
                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute>
                                <Dashboard />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/learn"
                        element={
                            <ProtectedRoute>
                                <LearningRoute />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/learn/:subject"
                        element={
                            <ProtectedRoute>
                                <LearningRoute />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/learn/start"
                        element={
                            <ProtectedRoute>
                                <StartAnyConceptSessionRoute />
                            </ProtectedRoute>
                        }
                    />
                </Routes>
            </AuthProvider>
        </Router>
    );
}

export default App;