import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { Toaster } from 'react-hot-toast';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';

// Routes
import ProtectedRoute from './routes/ProtectedRoute';

// Public Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import Unauthorized from './pages/Unauthorized';
import NotFound from './pages/NotFound';

// Protected Pages
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import MachineManagement from './pages/MachineManagement';
import MachineDetails from './pages/MachineDetails';
import SensorData from './pages/SensorData';
import Predictions from './pages/Predictions';
import FailureBlackBox from './pages/FailureBlackBox';
import Maintenance from './pages/Maintenance';
import Reports from './pages/Reports';

const AuthRedirectRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

const AppContent = () => {
  const { theme } = useTheme();

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          className: 'font-sans text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100',
          duration: 3500,
          style: {
            background: theme === 'dark' ? '#0f172a' : '#ffffff',
            color: theme === 'dark' ? '#f8fafc' : '#1e293b',
            border: theme === 'dark' ? '1px solid #1e293b' : '1px solid #e2e8f0'
          }
        }}
      />
      
      <BrowserRouter>
        <Routes>
          {/* Public Landings */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Auth Pages (redirect to dashboard if already logged in) */}
          <Route
            path="/login"
            element={
              <AuthRedirectRoute>
                <LoginPage />
              </AuthRedirectRoute>
            }
          />
          <Route
            path="/register"
            element={
              <AuthRedirectRoute>
                <RegisterPage />
              </AuthRedirectRoute>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <AuthRedirectRoute>
                <ForgotPasswordPage />
              </AuthRedirectRoute>
            }
          />

          {/* Dashboard console (Protected for Authenticated Session) */}
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/machines" element={<MachineManagement />} />
              <Route path="/machines/:id" element={<MachineDetails />} />
              <Route path="/sensor-data" element={<SensorData />} />
              <Route path="/predictions" element={<Predictions />} />
              <Route path="/blackbox" element={<FailureBlackBox />} />
              <Route path="/maintenance" element={<Maintenance />} />
              <Route path="/profile" element={<Profile />} />

              {/* Reports (Admin & Engineer Only role guard) */}
              <Route element={<ProtectedRoute allowedRoles={['Admin', 'Engineer']} />}>
                <Route path="/reports" element={<Reports />} />
              </Route>
            </Route>
          </Route>

          {/* 404 Catch All */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </>
  );
};

const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
