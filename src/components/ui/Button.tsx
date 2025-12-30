/**
 * Button Component
 * Standardized button component with variants and sizes
 */

import React from 'react';
import type { ButtonProps as BaseButtonProps } from '../../types/components';

interface ButtonProps extends BaseButtonProps {
  loading?: boolean;
  fullWidth?: boolean;
}

/**
 * Button component with standardized styling and variants
 */
const Button: React.FC<ButtonProps> = ({
  onClick,
  disabled,
  type = 'button',
  variant = 'primary',
  size = 'medium',
  children,
  className = '',
  loading = false,
  fullWidth = false,
  'data-testid': testId,
  ...props
}) => {
  const baseStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    borderRadius: '6px',
    fontWeight: '500',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s',
    opacity: disabled || loading ? 0.6 : 1,
    width: fullWidth ? '100%' : 'auto',
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      backgroundColor: '#002B4D',
      color: '#ffffff',
    },
    secondary: {
      backgroundColor: '#6b7280',
      color: '#ffffff',
    },
    danger: {
      backgroundColor: '#ef4444',
      color: '#ffffff',
    },
    text: {
      backgroundColor: 'transparent',
      color: '#002B4D',
      padding: '0.5rem',
    },
  };

  const sizeStyles: Record<string, React.CSSProperties> = {
    small: {
      padding: '0.375rem 0.75rem',
      fontSize: '0.875rem',
    },
    medium: {
      padding: '0.5rem 1rem',
      fontSize: '1rem',
    },
    large: {
      padding: '0.75rem 1.5rem',
      fontSize: '1.125rem',
    },
  };

  const combinedStyles: React.CSSProperties = {
    ...baseStyles,
    ...variantStyles[variant],
    ...sizeStyles[size],
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={className}
      data-testid={testId}
      style={combinedStyles}
      {...props}
    >
      {loading ? 'Loading...' : children}
    </button>
  );
};

export default Button;

