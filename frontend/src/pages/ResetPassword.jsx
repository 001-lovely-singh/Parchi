import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { authService } from '../api/auth';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ newPassword: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await authService.resetPassword(token, formData.newPassword);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired token');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-bg-main">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-border-hairline text-center">
          <h2 className="text-2xl font-heading font-bold text-text-main mb-2">Password Reset Successful</h2>
          <p className="text-sm text-text-muted mb-6">Your password has been updated. You can now log in to your account.</p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
          >
            Log In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-bg-main">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-border-hairline shadow-sm">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-heading font-bold text-text-main mb-2">Set New Password</h2>
          <p className="text-sm text-text-muted">Please enter a strong password for your account.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-xs rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">New Password</label>
            <input
              required
              type="password"
              className="w-full px-4 py-2 rounded-lg border border-border-hairline focus:ring-1 focus:ring-primary outline-none text-sm"
              value={formData.newPassword}
              onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">Confirm Password</label>
            <input
              required
              type="password"
              className="w-full px-4 py-2 rounded-lg border border-border-hairline focus:ring-1 focus:ring-primary outline-none text-sm"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="••••••••"
            />
          </div>

          <button
            disabled={loading}
            type="submit"
            className="w-full py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 mt-4"
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
