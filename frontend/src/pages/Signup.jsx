import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import RoleToggle from '../components/RoleToggle';
import ClinicCodeBox from '../components/ClinicCodeBox';

const Signup = () => {
  const [role, setRole] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    dateOfBirth: '',
    gender: '',
    clinicName: '',
  });
  const [clinicCode, setClinicCode] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!role) {
      setError('Please select whether you are a Patient or a Clinic');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const data = await authService.signup({ ...formData, role });
      signup(data.user, data.token);
      if (role === 'clinic') {
        setClinicCode(data.user.clinicCode);
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong during signup');
    } finally {
      setLoading(false);
    }
  };

  if (clinicCode) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-bg-main">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-border-hairline text-center">
          <h2 className="text-2xl font-heading font-bold text-text-main mb-2">Welcome to Parchi</h2>
          <p className="text-sm text-text-muted mb-6">Your clinic account has been created successfully.</p>
          <ClinicCodeBox code={clinicCode} />
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-8 w-full py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-bg-main">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-border-hairline shadow-soft">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-heading font-bold text-text-main mb-2">Create Account</h2>
          <p className="text-sm text-text-muted">Join Parchi to start tracking your health trends.</p>
        </div>

        <div className="mb-8">
          <RoleToggle selectedRole={role} onRoleChange={setRole} />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-xs rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">Full Name</label>
            <input
              required
              type="text"
              className="w-full px-4 py-2 rounded-lg border border-border-hairline focus:ring-1 focus:ring-primary outline-none text-sm"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">Email Address</label>
            <input
              required
              type="email"
              className="w-full px-4 py-2 rounded-lg border border-border-hairline focus:ring-1 focus:ring-primary outline-none text-sm"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="john@example.com"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">Password</label>
            <input
              required
              type="password"
              className="w-full px-4 py-2 rounded-lg border border-border-hairline focus:ring-1 focus:ring-primary outline-none text-sm"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
            />
          </div>

          {role === 'patient' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Date of Birth</label>
                <input
                  required
                  type="date"
                  className="w-full px-4 py-2 rounded-lg border border-border-hairline focus:ring-1 focus:ring-primary outline-none text-sm"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Gender</label>
                <select
                  required
                  className="w-full px-4 py-2 rounded-lg border border-border-hairline focus:ring-1 focus:ring-primary outline-none text-sm bg-white"
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                >
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          )}

          {role === 'clinic' && (
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1">Clinic Name</label>
              <input
                required
                type="text"
                className="w-full px-4 py-2 rounded-lg border border-border-hairline focus:ring-1 focus:ring-primary outline-none text-sm"
                value={formData.clinicName}
                onChange={(e) => setFormData({ ...formData, clinicName: e.target.value })}
                placeholder="City General Hospital"
              />
            </div>
          )}

          <button
            disabled={loading}
            type="submit"
            className="w-full py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 mt-4"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-xs text-text-muted mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-primary font-medium hover:underline">
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
