import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-bg-main">
      <div className="text-center">
        <h1 className="text-9xl font-heading font-bold text-gray-200 mb-4">404</h1>
        <h2 className="text-2xl font-heading font-bold text-text-main mb-4">Page not found</h2>
        <p className="text-text-muted mb-8">The page you're looking for doesn't exist or has been moved.</p>
        <Link
          to="/"
          className="px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
