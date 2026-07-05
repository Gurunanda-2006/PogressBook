/**
 * App.jsx — Router Setup
 * 
 * This is the top-level component that defines all the routes.
 * It wraps everything in the GoogleOAuthProvider (for the Sign-In button)
 * and AuthProvider (for our own session management).
 * 
 * Route structure:
 *   /login          → LoginPage (public)
 *   /               → ProtectedRoute wrapper (requires auth)
 *     /todos        → TodoPage
 *     /tracking     → WorkTrackingPage
 *     /finance      → FinancePage
 *     /dashboard    → DashboardPage
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import TodoPage from './pages/TodoPage';
import WorkTrackingPage from './pages/WorkTrackingPage';
import FinancePage from './pages/FinancePage';
import DashboardPage from './pages/DashboardPage';
import './App.css';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public route */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected routes — wrapped in Layout for nav */}
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/todos" element={<TodoPage />} />
                <Route path="/tracking" element={<WorkTrackingPage />} />
                <Route path="/finance" element={<FinancePage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
              </Route>
            </Route>

            {/* Default redirect */}
            <Route path="*" element={<Navigate to="/todos" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
