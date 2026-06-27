import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import InterviewRoom from './pages/InterviewRoom';
import FeedbackView from './pages/FeedbackView';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent" />
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Redirect component for already logged-in users
const AuthRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent" />
      </div>
    );
  }

  return isAuthenticated ? <Navigate to="/" replace /> : children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Protected Main Application Routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/interview/:id"
                element={
                  <ProtectedRoute>
                    <InterviewRoom />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/feedback/:id"
                element={
                  <ProtectedRoute>
                    <FeedbackView />
                  </ProtectedRoute>
                }
              />

              {/* Public Auth Routes */}
              <Route
                path="/login"
                element={
                  <AuthRoute>
                    <Login />
                  </AuthRoute>
                }
              />
              <Route
                path="/register"
                element={
                  <AuthRoute>
                    <Register />
                  </AuthRoute>
                }
              />

              {/* Fallback Catch-All Route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
