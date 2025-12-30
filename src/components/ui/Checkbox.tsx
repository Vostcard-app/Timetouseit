/**
 * Checkbox Component
 * Standardized checkbox component with label
 */

import React from 'react';
import type { CheckboxProps as BaseCheckboxProps } from '../../types/components';

interface CheckboxProps extends BaseCheckboxProps {
  id?: string;
  name?: string;
}

/**
 * Checkbox component with label
 */
const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onChange,
  label,
  disabled = false,
  className = '',
  id,
  name,
  'data-testid': testId,
  ...props
}) => {
  const checkboxId = id || `checkbox-${name || Math.random().toString(36).substr(2, 9)}`;

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: '0.5rem',
      }}
      data-testid={testId ? `${testId}-wrapper` : undefined}
    >
      <input
        id={checkboxId}
        name={name}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        data-testid={testId}
        style={{
          width: '1rem',
          height: '1rem',
          marginRight: '0.5rem',
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
        {...props}
      />
      {label && (
        <label
          htmlFor={checkboxId}
          style={{
            fontSize: '1rem',
            color: disabled ? '#9ca3af' : '#1f2937',
            cursor: disabled ? 'not-allowed' : 'pointer',
          }}
        >
          {label}
        </label>
      )}
    </div>
  );
};

export default Checkbox;

