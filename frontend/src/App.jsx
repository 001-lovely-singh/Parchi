import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import PatientDashboard from './pages/PatientDashboard';
import SummaryPage from './pages/SummaryPage';
import ClinicDashboard from './pages/ClinicDashboard';
import NotFound from './pages/NotFound';

const PrivateRoute = ({ children, role }) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          {/* Better way to handle role-based dashboards */}
          <Route
            path="/patient-dashboard"
            element={
              <PrivateRoute role="patient">
                <PatientDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/patient-dashboard/summary"
            element={
              <PrivateRoute role="patient">
                <SummaryPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/clinic-dashboard"
            element={
              <PrivateRoute role="clinic">
                <ClinicDashboard />
              </PrivateRoute>
            }
          />

          {/* Redirect /dashboard based on role */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <RoleBasedRedirect />
              </PrivateRoute>
            }
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

const RoleBasedRedirect = () => {
  const { user } = useAuth();
  return user.role === 'patient' ? <Navigate to="/patient-dashboard" replace /> : <Navigate to="/clinic-dashboard" replace />;
};

export default App;
