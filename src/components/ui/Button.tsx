/**
 * Button Component
 * Standardized button component with variants and sizes
 */

import React from 'react';
import type { ButtonProps as BaseButtonProps } from '../../types/components';
import { buttonBase, combineStyles } from '../../utils/styles';
import { theme } from '../../styles/theme';

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
  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      backgroundColor: theme.colors.PRIMARY,
      color: '#ffffff',
    },
    secondary: {
      backgroundColor: theme.colors.SECONDARY,
      color: '#ffffff',
    },
    danger: {
      backgroundColor: theme.colors.ERROR,
      color: '#ffffff',
    },
    text: {
      backgroundColor: 'transparent',
      color: theme.colors.PRIMARY,
      padding: theme.spacing.sm,
    },
  };

  const sizeStyles: Record<string, React.CSSProperties> = {
    small: {
      padding: `${theme.spacing.xs} ${theme.spacing.md}`,
      fontSize: theme.typography.fontSize.sm,
    },
    medium: {
      padding: `${theme.spacing.sm} ${theme.spacing.md}`,
      fontSize: theme.typography.fontSize.base,
    },
    large: {
      padding: `${theme.spacing.lg} ${theme.spacing.xl}`,
      fontSize: theme.typography.fontSize.lg,
    },
  };

  const combinedStyles: React.CSSProperties = combineStyles(
    buttonBase(disabled || loading),
    variantStyles[variant],
    sizeStyles[size],
    { width: fullWidth ? '100%' : 'auto' }
  );

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

