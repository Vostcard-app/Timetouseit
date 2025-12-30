/**
 * LoadingFallback Component
 * Loading component for Suspense boundaries
 */

import React from 'react';
import LoadingSpinner from './LoadingSpinner';

interface LoadingFallbackProps {
  message?: string;
}

/**
 * Loading fallback for lazy-loaded components
 */
const LoadingFallback: React.FC<LoadingFallbackProps> = ({ message = 'Loading...' }) => {
  return (
    <div
      style={{
        minHeight: '50vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '1rem',
        backgroundColor: '#f5f5f5',
      }}
    >
      <LoadingSpinner size="large" message={message} />
    </div>
  );
};

export default LoadingFallback;

