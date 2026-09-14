import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../api/auth';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await authService.forgotPassword(email);
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-bg-main">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-border-hairline text-center">
          <h2 className="text-2xl font-heading font-bold text-text-main mb-2">Check your email</h2>
          <p className="text-sm text-text-muted mb-6">
            If an account exists for {email}, we've sent a password reset link to your inbox.
          </p>
          <Link
            to="/login"
            className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
          >
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-bg-main">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-border-hairline shadow-sm">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-heading font-bold text-text-main mb-2">Reset Password</h2>
          <p className="text-sm text-text-muted">Enter your email and we'll send you a link to reset your password.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-xs rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-text-muted mb-1">Email Address</label>
            <input
              required
              type="email"
              className="w-full px-4 py-2 rounded-lg border border-border-hairline focus:ring-1 focus:ring-primary outline-none text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@example.com"
            />
          </div>

          <button
            disabled={loading}
            type="submit"
            className="w-full py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 mt-4"
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
        <div className="text-center mt-6">
          <Link to="/login" className="text-xs text-text-muted hover:text-primary font-medium">
            Return to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
