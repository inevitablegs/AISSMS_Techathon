import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { TeacherProvider } from './context/TeacherContext';
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

// Teacher imports
import TeacherLogin from './components/Teacher/TeacherLogin';
import TeacherRegister from './components/Teacher/TeacherRegister';
import TeacherDashboard from './components/Teacher/TeacherDashboard';
import StudentAnalytics from './components/Teacher/StudentAnalytics';
import ContentManagement from './components/Teacher/ContentManagement';
import QuestionManagement from './components/Teacher/QuestionManagement';
import ClassAnalytics from './components/Teacher/ClassAnalytics';
import GoalsManagement from './components/Teacher/GoalsManagement';
import TeacherProtectedRoute from './components/Teacher/TeacherProtectedRoute';

function App() {
    return (
        <ThemeProvider>
            <Router>
                <AuthProvider>
                    <Routes>
                        {/* Student Routes */}
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

                        {/* Teacher Routes */}
                        <Route path="/teacher/login" element={
                            <TeacherProvider><TeacherLogin /></TeacherProvider>
                        } />
                        <Route path="/teacher/register" element={
                            <TeacherProvider><TeacherRegister /></TeacherProvider>
                        } />
                        <Route path="/teacher/dashboard" element={
                            <TeacherProvider><TeacherProtectedRoute><TeacherDashboard /></TeacherProtectedRoute></TeacherProvider>
                        } />
                        <Route path="/teacher/students" element={
                            <TeacherProvider><TeacherProtectedRoute><StudentAnalytics /></TeacherProtectedRoute></TeacherProvider>
                        } />
                        <Route path="/teacher/content" element={
                            <TeacherProvider><TeacherProtectedRoute><ContentManagement /></TeacherProtectedRoute></TeacherProvider>
                        } />
                        <Route path="/teacher/questions" element={
                            <TeacherProvider><TeacherProtectedRoute><QuestionManagement /></TeacherProtectedRoute></TeacherProvider>
                        } />
                        <Route path="/teacher/analytics" element={
                            <TeacherProvider><TeacherProtectedRoute><ClassAnalytics /></TeacherProtectedRoute></TeacherProvider>
                        } />
                        <Route path="/teacher/goals" element={
                            <TeacherProvider><TeacherProtectedRoute><GoalsManagement /></TeacherProtectedRoute></TeacherProvider>
                        } />
                    </Routes>
                         <AIAssistantPage /> 
                </AuthProvider>
            </Router>
        </ThemeProvider>
    );
}

export default App;