/**
 * Component Styles
 * Reusable style objects for common UI components
 * These can be used directly or combined with other styles
 */

import type { CSSProperties } from 'react';
import { colors, spacing, typography, borderRadius, shadows, transitions } from './designTokens';

/**
 * Combine multiple style objects (last one wins for conflicts)
 */
export function combineStyles(...styles: (CSSProperties | undefined | null | false)[]): CSSProperties {
  return Object.assign({}, ...styles.filter(Boolean));
}

/**
 * Button Variants
 */
export const buttonStyles = {
  primary: {
    backgroundColor: colors.primary,
    color: colors.white,
    border: 'none',
    borderRadius: borderRadius.md,
    padding: `${spacing.sm} ${spacing.md}`,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    cursor: 'pointer',
    transition: `all ${transitions.normal}`,
  } as CSSProperties,
  
  secondary: {
    backgroundColor: colors.gray[200],
    color: colors.gray[800],
    border: `1px solid ${colors.gray[300]}`,
    borderRadius: borderRadius.md,
    padding: `${spacing.sm} ${spacing.md}`,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    cursor: 'pointer',
    transition: `all ${transitions.normal}`,
  } as CSSProperties,
  
  danger: {
    backgroundColor: colors.error,
    color: colors.white,
    border: 'none',
    borderRadius: borderRadius.md,
    padding: `${spacing.sm} ${spacing.md}`,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    cursor: 'pointer',
    transition: `all ${transitions.normal}`,
  } as CSSProperties,
  
  success: {
    backgroundColor: colors.success,
    color: colors.white,
    border: 'none',
    borderRadius: borderRadius.md,
    padding: `${spacing.sm} ${spacing.md}`,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    cursor: 'pointer',
    transition: `all ${transitions.normal}`,
  } as CSSProperties,
  
  text: {
    backgroundColor: 'transparent',
    color: colors.primary,
    border: 'none',
    padding: spacing.sm,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    cursor: 'pointer',
    textDecoration: 'none',
  } as CSSProperties,
  
  disabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  } as CSSProperties,
};

/**
 * Input Variants
 */
export const inputStyles = {
  base: {
    width: '100%',
    padding: `${spacing.sm} ${spacing.md}`,
    fontSize: typography.fontSize.base,
    border: `1px solid ${colors.gray[300]}`,
    borderRadius: borderRadius.md,
    backgroundColor: colors.white,
    color: colors.gray[800],
    transition: `border-color ${transitions.normal}`,
    outline: 'none',
  } as CSSProperties,
  
  error: {
    border: `2px solid ${colors.error}`,
  } as CSSProperties,
  
  disabled: {
    backgroundColor: colors.gray[100],
    cursor: 'not-allowed',
    opacity: 0.6,
  } as CSSProperties,
  
  focused: {
    border: `2px solid ${colors.primary}`,
  } as CSSProperties,
};

/**
 * Card Variants
 */
export const cardStyles = {
  base: {
    backgroundColor: colors.white,
    border: `1px solid ${colors.gray[200]}`,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    boxShadow: shadows.md,
  } as CSSProperties,
  
  elevated: {
    backgroundColor: colors.white,
    border: `1px solid ${colors.gray[200]}`,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    boxShadow: shadows.lg,
  } as CSSProperties,
  
  flat: {
    backgroundColor: colors.white,
    border: `1px solid ${colors.gray[200]}`,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    boxShadow: 'none',
  } as CSSProperties,
  
  hover: {
    cursor: 'pointer',
    transition: `transform ${transitions.normal}, box-shadow ${transitions.normal}`,
  } as CSSProperties,
};

/**
 * Modal Styles
 */
export const modalStyles = {
  overlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  } as CSSProperties,
  
  content: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    maxWidth: '90vw',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: shadows.xl,
  } as CSSProperties,
  
  header: {
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottom: `1px solid ${colors.gray[200]}`,
  } as CSSProperties,
  
  footer: {
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTop: `1px solid ${colors.gray[200]}`,
    display: 'flex',
    gap: spacing.md,
    justifyContent: 'flex-end',
  } as CSSProperties,
};

/**
 * Badge/Status Styles
 */
export const badgeStyles = {
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: `${spacing.xs} ${spacing.sm}`,
    borderRadius: borderRadius.full,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  } as CSSProperties,
  
  success: {
    backgroundColor: colors.statusBg.bestBySoon,
    color: colors.status.bestBySoon,
  } as CSSProperties,
  
  error: {
    backgroundColor: colors.statusBg.pastBestBy,
    color: colors.status.pastBestBy,
  } as CSSProperties,
  
  info: {
    backgroundColor: colors.gray[100],
    color: colors.gray[700],
  } as CSSProperties,
};

/**
 * List Item Styles
 */
export const listItemStyles = {
  base: {
    padding: spacing.md,
    borderBottom: `1px solid ${colors.gray[200]}`,
    display: 'flex',
    alignItems: 'center',
    gap: spacing.md,
  } as CSSProperties,
  
  hover: {
    backgroundColor: colors.gray[50],
    cursor: 'pointer',
    transition: `background-color ${transitions.fast}`,
  } as CSSProperties,
  
  selected: {
    backgroundColor: colors.gray[100],
  } as CSSProperties,
};

/**
 * Container Styles
 */
export const containerStyles = {
  page: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: spacing.md,
    width: '100%',
    boxSizing: 'border-box' as const,
  } as CSSProperties,
  
  section: {
    marginBottom: spacing.xl,
  } as CSSProperties,
  
  centered: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  } as CSSProperties,
};

/**
 * Typography Styles
 */
export const textStyles = {
  heading1: {
    fontSize: typography.fontSize['4xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[900],
    lineHeight: typography.lineHeight.tight,
  } as CSSProperties,
  
  heading2: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.gray[900],
    lineHeight: typography.lineHeight.tight,
  } as CSSProperties,
  
  heading3: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray[800],
    lineHeight: typography.lineHeight.normal,
  } as CSSProperties,
  
  body: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.normal,
    color: colors.gray[700],
    lineHeight: typography.lineHeight.normal,
  } as CSSProperties,
  
  bodySmall: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.normal,
    color: colors.gray[600],
    lineHeight: typography.lineHeight.normal,
  } as CSSProperties,
  
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.gray[700],
  } as CSSProperties,
};
