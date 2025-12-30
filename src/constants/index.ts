/**
 * Application Constants
 */

// Storage Keys
export const STORAGE_KEYS = {
  LAST_SHOPPING_LIST_ID: 'tossittime:lastShoppingListId',
} as const;

// Default Values
export const DEFAULTS = {
  REMINDER_DAYS: 7,
  SHOPPING_LIST_NAME: 'Shop list',
} as const;

// Theme Colors
export const COLORS = {
  PRIMARY: '#002B4D',
  SECONDARY: '#6b7280',
  SUCCESS: '#10b981',
  WARNING: '#eab308',
  ERROR: '#ef4444',
  EXPIRING_SOON: '#eab308',
  EXPIRED: '#ef4444',
  FRESH: '#6b7280',
  THAW: '#F4A261',
  FREEZE: '#3b82f6',
} as const;

// Status Colors
export const STATUS_COLORS = {
  expiring_soon: '#eab308',
  expired: '#ef4444',
  fresh: '#6b7280',
} as const;

// Status Background Colors
export const STATUS_BG_COLORS = {
  expiring_soon: '#fef9c3',
  expired: '#fee2e2',
  fresh: '#f3f4f6',
} as const;

