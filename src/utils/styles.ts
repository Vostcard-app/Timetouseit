/**
 * Style Utilities
 * Helper functions for creating consistent styles
 */

import type { CSSProperties } from 'react';
import { theme } from '../styles/theme';
import type { Spacing } from '../styles/theme';

/**
 * Get spacing value from theme
 */
export function getSpacing(size: Spacing | number): string {
  if (typeof size === 'number') {
    return `${size}px`;
  }
  return theme.spacing[size];
}

/**
 * Create padding style object
 */
export function padding(
  all?: Spacing | number,
  vertical?: Spacing | number,
  horizontal?: Spacing | number,
  top?: Spacing | number,
  right?: Spacing | number,
  bottom?: Spacing | number,
  left?: Spacing | number
): CSSProperties {
  if (all !== undefined && vertical === undefined && horizontal === undefined) {
    return { padding: getSpacing(all) };
  }
  if (vertical !== undefined && horizontal !== undefined) {
    return {
      paddingTop: getSpacing(vertical),
      paddingBottom: getSpacing(vertical),
      paddingLeft: getSpacing(horizontal),
      paddingRight: getSpacing(horizontal),
    };
  }
  if (top !== undefined || right !== undefined || bottom !== undefined || left !== undefined) {
    return {
      ...(top !== undefined && { paddingTop: getSpacing(top) }),
      ...(right !== undefined && { paddingRight: getSpacing(right) }),
      ...(bottom !== undefined && { paddingBottom: getSpacing(bottom) }),
      ...(left !== undefined && { paddingLeft: getSpacing(left) }),
    };
  }
  return {};
}

/**
 * Create margin style object
 */
export function margin(
  all?: Spacing | number,
  vertical?: Spacing | number,
  horizontal?: Spacing | number,
  top?: Spacing | number,
  right?: Spacing | number,
  bottom?: Spacing | number,
  left?: Spacing | number
): CSSProperties {
  if (all !== undefined && vertical === undefined && horizontal === undefined) {
    return { margin: getSpacing(all) };
  }
  if (vertical !== undefined && horizontal !== undefined) {
    return {
      marginTop: getSpacing(vertical),
      marginBottom: getSpacing(vertical),
      marginLeft: getSpacing(horizontal),
      marginRight: getSpacing(horizontal),
    };
  }
  if (top !== undefined || right !== undefined || bottom !== undefined || left !== undefined) {
    return {
      ...(top !== undefined && { marginTop: getSpacing(top) }),
      ...(right !== undefined && { marginRight: getSpacing(right) }),
      ...(bottom !== undefined && { marginBottom: getSpacing(bottom) }),
      ...(left !== undefined && { marginLeft: getSpacing(left) }),
    };
  }
  return {};
}

/**
 * Create flexbox style object
 */
export function flex(
  direction: 'row' | 'column' = 'row',
  align: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline' = 'flex-start',
  justify: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly' = 'flex-start',
  gap?: Spacing | number
): CSSProperties {
  return {
    display: 'flex',
    flexDirection: direction,
    alignItems: align,
    justifyContent: justify,
    ...(gap !== undefined && { gap: getSpacing(gap) }),
  };
}

/**
 * Create card style object
 */
export function card(hasHover = false): CSSProperties {
  return {
    backgroundColor: '#ffffff',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.md,
    boxShadow: theme.shadows.md,
    ...(hasHover && {
      cursor: 'pointer',
      transition: `transform ${theme.transitions.normal}, box-shadow ${theme.transitions.normal}`,
    }),
  };
}

/**
 * Create button base style
 */
export function buttonBase(disabled = false): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    borderRadius: theme.borderRadius.md,
    fontWeight: theme.typography.fontWeight.medium,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: `all ${theme.transitions.normal}`,
    opacity: disabled ? 0.6 : 1,
  };
}

/**
 * Create input base style
 */
export function inputBase(error = false, disabled = false): CSSProperties {
  return {
    width: '100%',
    padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
    fontSize: theme.typography.fontSize.base,
    border: `1px solid ${error ? theme.colors.ERROR : theme.colors.gray[300]}`,
    borderRadius: theme.borderRadius.md,
    backgroundColor: disabled ? theme.colors.gray[100] : '#ffffff',
    color: theme.colors.gray[800],
    transition: `border-color ${theme.transitions.normal}`,
  };
}

/**
 * Create text style object
 */
export function text(
  size: keyof typeof theme.typography.fontSize = 'base',
  weight: keyof typeof theme.typography.fontWeight = 'normal',
  color?: string
): CSSProperties {
  return {
    fontSize: theme.typography.fontSize[size],
    fontWeight: theme.typography.fontWeight[weight],
    ...(color && { color }),
  };
}

/**
 * Combine multiple style objects
 */
export function combineStyles(...styles: (CSSProperties | undefined | null | false)[]): CSSProperties {
  return Object.assign({}, ...styles.filter(Boolean));
}

