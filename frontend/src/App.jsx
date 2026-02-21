import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import LearningRoute from './components/Learning/LearningRoute';
import StartAnyConceptSessionRoute from './components/Learning/StartAnyConceptSessionRoute';
import Leaderboard from './components/Leaderboard';
import Progress from './components/Progress';
import AIAssistantPage from './pages/AIAssistantPage.jsx';

function App() {
    return (
        <ThemeProvider>
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
                            path="/leaderboard"
                            element={
                                <ProtectedRoute>
                                    <Leaderboard />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/progress"
                            element={
                                <ProtectedRoute>
                                    <Progress />
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/learn/:conceptId"
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
                         <AIAssistantPage /> 
                </AuthProvider>
            </Router>
        </ThemeProvider>
    );
}

export default App;