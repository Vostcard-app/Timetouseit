/**
 * Form Validation Utilities
 * Shared validation functions for forms
 */

/**
 * Validate email format
 */
export function validateEmail(email: string): string | null {
  if (!email) {
    return 'Email is required';
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Please enter a valid email address';
  }
  return null;
}

/**
 * Validate required field
 */
export function validateRequired(value: string | number | null | undefined, fieldName: string): string | null {
  if (value === null || value === undefined || value === '') {
    return `${fieldName} is required`;
  }
  return null;
}

/**
 * Validate minimum length
 */
export function validateMinLength(value: string, minLength: number, fieldName: string): string | null {
  if (value.length < minLength) {
    return `${fieldName} must be at least ${minLength} characters`;
  }
  return null;
}

/**
 * Validate maximum length
 */
export function validateMaxLength(value: string, maxLength: number, fieldName: string): string | null {
  if (value.length > maxLength) {
    return `${fieldName} must be no more than ${maxLength} characters`;
  }
  return null;
}

/**
 * Validate number range
 */
export function validateNumberRange(
  value: number,
  min: number,
  max: number,
  fieldName: string
): string | null {
  if (value < min || value > max) {
    return `${fieldName} must be between ${min} and ${max}`;
  }
  return null;
}

/**
 * Validate URL format
 */
export function validateUrl(url: string): string | null {
  if (!url) {
    return null; // URL is optional in most cases
  }
  try {
    new URL(url);
    return null;
  } catch {
    return 'Please enter a valid URL';
  }
}

/**
 * Validate date is in the future
 */
export function validateFutureDate(date: Date, fieldName: string): string | null {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  if (date < now) {
    return `${fieldName} must be in the future`;
  }
  return null;
}

/**
 * Validate date is in the past
 */
export function validatePastDate(date: Date, fieldName: string): string | null {
  const now = new Date();
  now.setHours(23, 59, 59, 999);
  if (date > now) {
    return `${fieldName} must be in the past`;
  }
  return null;
}

/**
 * Combine multiple validators
 */
export function validate(
  value: unknown,
  validators: Array<(value: unknown) => string | null>
): string | null {
  for (const validator of validators) {
    const error = validator(value);
    if (error) {
      return error;
    }
  }
  return null;
}

/**
 * Create a validator that checks if value matches a pattern
 */
export function validatePattern(
  value: string,
  pattern: RegExp,
  errorMessage: string
): string | null {
  if (!pattern.test(value)) {
    return errorMessage;
  }
  return null;
}
