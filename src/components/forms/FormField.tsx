/**
 * Form Field Component
 * Reusable form field wrapper with label, error, and helper text
 */

import React from 'react';
import type { FormFieldProps } from '../../types/components';
import { spacing, colors, typography } from '../../styles/designTokens';
import { textStyles, combineStyles } from '../../styles/componentStyles';

export interface FormFieldComponentProps extends FormFieldProps {
  children: React.ReactNode;
}

export const FormField: React.FC<FormFieldComponentProps> = ({
  label,
  error,
  required,
  disabled,
  helperText,
  children,
  className,
  style
}) => {
  return (
    <div
      className={className}
      style={combineStyles(
        {
          marginBottom: spacing.md,
          width: '100%',
        },
        style
      )}
    >
      {label && (
        <label
          style={combineStyles(
            textStyles.label,
            {
              display: 'block',
              marginBottom: spacing.xs,
            },
            disabled && { opacity: 0.6 }
          )}
        >
          {label}
          {required && (
            <span style={{ color: colors.error, marginLeft: spacing.xs }}>*</span>
          )}
        </label>
      )}
      {children}
      {error && (
        <div
          style={{
            marginTop: spacing.xs,
            fontSize: typography.fontSize.sm,
            color: colors.error,
          }}
        >
          {error}
        </div>
      )}
      {helperText && !error && (
        <div
          style={{
            marginTop: spacing.xs,
            fontSize: typography.fontSize.sm,
            color: colors.gray[600],
          }}
        >
          {helperText}
        </div>
      )}
    </div>
  );
};
