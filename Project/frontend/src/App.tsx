import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import MachineList from './pages/MachineList';
import AddMachine from './pages/AddMachine';
import Prediction from './pages/Prediction';
import PredictionHistory from './pages/PredictionHistory';
import Reports from './pages/Reports';
import Profile from './pages/Profile';
import Settings from './pages/Settings';

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Dashboard Layout Routes */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="machines" element={<MachineList />} />
            <Route path="add-machine" element={<AddMachine />} />
            <Route path="predict" element={<Prediction />} />
            <Route path="history" element={<PredictionHistory />} />
            <Route path="reports" element={<Reports />} />
            <Route path="profile" element={<Profile />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Fallback route */}
          <Route path="*" element={<Login />} />
        </Routes>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
