/**
 * Input Component
 * Standardized input component with label, error, and helper text
 */

import React from 'react';
import type { InputProps as BaseInputProps } from '../../types/components';
import { inputBase, text, margin, combineStyles } from '../../utils/styles';
import { theme } from '../../styles/theme';

interface InputProps extends BaseInputProps {
  id?: string;
  name?: string;
}

/**
 * Input component with label, error display, and helper text
 */
const Input: React.FC<InputProps> = ({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  error,
  required = false,
  disabled = false,
  helperText,
  autoFocus = false,
  maxLength,
  className = '',
  id,
  name,
  'data-testid': testId,
  ...props
}) => {
  const inputId = id || `input-${name || Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={className} style={margin('md')} data-testid={testId ? `${testId}-wrapper` : undefined}>
      {label && (
        <label
          htmlFor={inputId}
          style={combineStyles(
            { display: 'block' },
            margin('sm'),
            text('sm', 'medium', theme.colors.gray[700])
          )}
        >
          {label}
          {required && <span style={{ color: theme.colors.ERROR, marginLeft: theme.spacing.xs }}>*</span>}
        </label>
      )}
      <input
        id={inputId}
        name={name}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        autoFocus={autoFocus}
        maxLength={maxLength}
        data-testid={testId}
        style={inputBase(!!error, disabled)}
        onFocus={(e) => {
          e.target.style.borderColor = error ? theme.colors.ERROR : theme.colors.PRIMARY;
        }}
        onBlur={(e) => {
          e.target.style.borderColor = error ? theme.colors.ERROR : theme.colors.gray[300];
        }}
        {...props}
      />
      {error && (
        <p
          style={{
            margin: '0.25rem 0 0 0',
            fontSize: '0.875rem',
            color: '#ef4444',
          }}
          data-testid={testId ? `${testId}-error` : undefined}
        >
          {error}
        </p>
      )}
      {helperText && !error && (
        <p
          style={{
            margin: '0.25rem 0 0 0',
            fontSize: '0.875rem',
            color: '#6b7280',
          }}
          data-testid={testId ? `${testId}-helper` : undefined}
        >
          {helperText}
        </p>
      )}
    </div>
  );
};

export default Input;

