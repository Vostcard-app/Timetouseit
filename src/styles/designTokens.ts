/**
 * Design Tokens
 * Core design values for colors, spacing, typography, etc.
 * These are the foundational design values used throughout the application.
 */

import { COLORS, STATUS_COLORS, STATUS_BG_COLORS } from '../constants';

/**
 * Color Palette
 */
export const colors = {
  // Primary brand colors
  primary: COLORS.PRIMARY, // #002B4D - Main brand blue
  secondary: COLORS.SECONDARY, // #6b7280 - Gray
  
  // Semantic colors
  success: COLORS.SUCCESS, // #10b981 - Green
  warning: COLORS.WARNING, // #eab308 - Yellow
  error: COLORS.ERROR, // #ef4444 - Red
  
  // Status colors
  status: STATUS_COLORS,
  statusBg: STATUS_BG_COLORS,
  
  // Gray scale
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
  
  // Special colors
  thaw: COLORS.THAW, // #F4A261
  freeze: COLORS.FREEZE, // #3b82f6
  
  // Common colors
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
} as const;

/**
 * Spacing Scale (4px base unit)
 */
export const spacing = {
  0: '0',
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '3rem',   // 48px
  '3xl': '4rem',   // 64px
} as const;

/**
 * Typography Scale
 */
export const typography = {
  fontFamily: {
    sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
  },
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

/**
 * Border Radius Scale
 */
export const borderRadius = {
  none: '0',
  sm: '0.25rem',   // 4px
  md: '0.375rem',  // 6px
  lg: '0.5rem',    // 8px
  xl: '0.75rem',   // 12px
  '2xl': '1rem',   // 16px
  full: '9999px',
} as const;

/**
 * Shadow Scale
 */
export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 1px 3px rgba(0, 0, 0, 0.1)',
  lg: '0 4px 12px rgba(0, 0, 0, 0.15)',
  xl: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
} as const;

/**
 * Z-Index Scale
 */
export const zIndex = {
  base: 0,
  dropdown: 1000,
  modal: 1000,
  tooltip: 1100,
  notification: 1200,
} as const;

/**
 * Transition Durations
 */
export const transitions = {
  fast: '0.15s',
  normal: '0.2s',
  slow: '0.3s',
} as const;

/**
 * Breakpoints for Responsive Design
 */
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;
