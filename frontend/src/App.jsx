import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
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

                        {/* Teacher Routes — single shared TeacherProvider */}
                        <Route element={<TeacherProvider><Outlet /></TeacherProvider>}>
                            <Route path="/teacher/login" element={<TeacherLogin />} />
                            <Route path="/teacher/register" element={<TeacherRegister />} />
                            <Route path="/teacher/dashboard" element={
                                <TeacherProtectedRoute><TeacherDashboard /></TeacherProtectedRoute>
                            } />
                            <Route path="/teacher/students" element={
                                <TeacherProtectedRoute><StudentAnalytics /></TeacherProtectedRoute>
                            } />
                            <Route path="/teacher/content" element={
                                <TeacherProtectedRoute><ContentManagement /></TeacherProtectedRoute>
                            } />
                            <Route path="/teacher/questions" element={
                                <TeacherProtectedRoute><QuestionManagement /></TeacherProtectedRoute>
                            } />
                            <Route path="/teacher/analytics" element={
                                <TeacherProtectedRoute><ClassAnalytics /></TeacherProtectedRoute>
                            } />
                            <Route path="/teacher/goals" element={
                                <TeacherProtectedRoute><GoalsManagement /></TeacherProtectedRoute>
                            } />
                        </Route>
                    </Routes>
                         <AIAssistantPage /> 
                </AuthProvider>
            </Router>
        </ThemeProvider>
    );
}

export default App;