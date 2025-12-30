/**
 * Loading Spinner Component
 * Standardized loading indicator component
 */

import React from 'react';
import type { LoadingProps } from '../../types/components';

/**
 * Loading spinner component with size variants
 */
const LoadingSpinner: React.FC<LoadingProps> = ({
  size = 'medium',
  message,
  className = '',
  'data-testid': testId,
}) => {
  const sizeStyles: Record<string, { width: string; height: string; borderWidth: string }> = {
    small: { width: '1rem', height: '1rem', borderWidth: '2px' },
    medium: { width: '2rem', height: '2rem', borderWidth: '3px' },
    large: { width: '3rem', height: '3rem', borderWidth: '4px' },
  };

  const styles = sizeStyles[size];

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
      }}
      data-testid={testId}
    >
      <div
        style={{
          width: styles.width,
          height: styles.height,
          border: `${styles.borderWidth} solid #e5e7eb`,
          borderTop: `${styles.borderWidth} solid #002B4D`,
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }}
      />
      {message && (
        <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>{message}</p>
      )}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default LoadingSpinner;

