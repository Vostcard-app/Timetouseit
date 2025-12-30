/**
 * Select Component
 * Standardized select/dropdown component with label and error display
 */

import type { SelectProps as BaseSelectProps } from '../../types/components';

/**
 * Select component with label, error display, and helper text
 */
function Select<T = string>({
  label,
  value,
  onChange,
  options,
  placeholder,
  error,
  required = false,
  disabled = false,
  helperText,
  className = '',
  'data-testid': testId,
  ...props
}: BaseSelectProps<T>) {
  const selectId = `select-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={className} style={{ marginBottom: '1rem' }} data-testid={testId ? `${testId}-wrapper` : undefined}>
      {label && (
        <label
          htmlFor={selectId}
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
      <select
        id={selectId}
        value={value as string}
        onChange={(e) => onChange(e.target.value as T)}
        required={required}
        disabled={disabled}
        data-testid={testId}
        style={{
          width: '100%',
          padding: '0.5rem 0.75rem',
          fontSize: '1rem',
          border: `1px solid ${error ? '#ef4444' : '#d1d5db'}`,
          borderRadius: '6px',
          backgroundColor: disabled ? '#f3f4f6' : '#ffffff',
          color: '#1f2937',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'border-color 0.2s',
        }}
        onFocus={(e) => {
          e.target.style.borderColor = error ? '#ef4444' : '#002B4D';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = error ? '#ef4444' : '#d1d5db';
        }}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option
            key={String(option.value)}
            value={String(option.value)}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
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
}

export default Select;

