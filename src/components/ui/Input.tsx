/**
 * Input Component
 * Standardized input component with label, error, and helper text
 */

import React from 'react';
import type { InputProps as BaseInputProps } from '../../types/components';

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
    <div className={className} style={{ marginBottom: '1rem' }} data-testid={testId ? `${testId}-wrapper` : undefined}>
      {label && (
        <label
          htmlFor={inputId}
          style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: '500',
            color: '#374151',
          }}
        >
          {label}
          {required && <span style={{ color: '#ef4444', marginLeft: '0.25rem' }}>*</span>}
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
        style={{
          width: '100%',
          padding: '0.5rem 0.75rem',
          fontSize: '1rem',
          border: `1px solid ${error ? '#ef4444' : '#d1d5db'}`,
          borderRadius: '6px',
          backgroundColor: disabled ? '#f3f4f6' : '#ffffff',
          color: '#1f2937',
          transition: 'border-color 0.2s',
        }}
        onFocus={(e) => {
          e.target.style.borderColor = error ? '#ef4444' : '#002B4D';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = error ? '#ef4444' : '#d1d5db';
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

