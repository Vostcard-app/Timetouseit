/**
 * Style Helper Functions
 * Utility functions for creating and combining styles
 * Uses design tokens and component styles for consistency
 */

import type { CSSProperties } from 'react';
import { colors, spacing, typography, borderRadius, shadows, transitions } from '../styles/designTokens';
import { buttonStyles, inputStyles, cardStyles, modalStyles, badgeStyles, listItemStyles, containerStyles, textStyles } from '../styles/componentStyles';

/**
 * Get spacing value
 */
export function getSpacing(size: keyof typeof spacing | number): string {
  if (typeof size === 'number') {
    return `${size}px`;
  }
  return spacing[size];
}

/**
 * Create button style with variant
 */
export function button(
  variant: 'primary' | 'secondary' | 'danger' | 'success' | 'text' = 'primary',
  disabled = false,
  customStyles?: CSSProperties
): CSSProperties {
  const baseStyle = buttonStyles[variant];
  return {
    ...baseStyle,
    ...(disabled && buttonStyles.disabled),
    ...customStyles,
  };
}

/**
 * Create input style
 */
export function input(
  error = false,
  disabled = false,
  focused = false,
  customStyles?: CSSProperties
): CSSProperties {
  return {
    ...inputStyles.base,
    ...(error && inputStyles.error),
    ...(disabled && inputStyles.disabled),
    ...(focused && inputStyles.focused),
    ...customStyles,
  };
}

/**
 * Create card style
 */
export function card(
  variant: 'base' | 'elevated' | 'flat' = 'base',
  hoverable = false,
  customStyles?: CSSProperties
): CSSProperties {
  return {
    ...cardStyles[variant],
    ...(hoverable && cardStyles.hover),
    ...customStyles,
  };
}

/**
 * Create modal overlay style
 */
export function modalOverlay(customStyles?: CSSProperties): CSSProperties {
  return {
    ...modalStyles.overlay,
    ...customStyles,
  };
}

/**
 * Create modal content style
 */
export function modalContent(customStyles?: CSSProperties): CSSProperties {
  return {
    ...modalStyles.content,
    ...customStyles,
  };
}

/**
 * Create badge style
 */
export function badge(
  variant: 'success' | 'error' | 'info' = 'info',
  customStyles?: CSSProperties
): CSSProperties {
  return {
    ...badgeStyles.base,
    ...badgeStyles[variant],
    ...customStyles,
  };
}

/**
 * Create list item style
 */
export function listItem(
  hoverable = false,
  selected = false,
  customStyles?: CSSProperties
): CSSProperties {
  return {
    ...listItemStyles.base,
    ...(hoverable && listItemStyles.hover),
    ...(selected && listItemStyles.selected),
    ...customStyles,
  };
}

/**
 * Create container style
 */
export function container(
  type: 'page' | 'section' | 'centered' = 'page',
  customStyles?: CSSProperties
): CSSProperties {
  return {
    ...containerStyles[type],
    ...customStyles,
  };
}

/**
 * Create text style
 */
export function text(
  variant: 'heading1' | 'heading2' | 'heading3' | 'body' | 'bodySmall' | 'label' = 'body',
  customStyles?: CSSProperties
): CSSProperties {
  return {
    ...textStyles[variant],
    ...customStyles,
  };
}

/**
 * Combine multiple style objects (last one wins for conflicts)
 */
export function combineStyles(...styles: (CSSProperties | undefined | null | false)[]): CSSProperties {
  return Object.assign({}, ...styles.filter(Boolean));
}

/**
 * Create flexbox style
 */
export function flex(
  direction: 'row' | 'column' = 'row',
  align: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline' = 'flex-start',
  justify: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly' = 'flex-start',
  gap?: keyof typeof spacing | number
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
 * Create grid style
 */
export function grid(
  columns?: number | string,
  gap?: keyof typeof spacing | number,
  customStyles?: CSSProperties
): CSSProperties {
  return {
    display: 'grid',
    ...(columns && { gridTemplateColumns: typeof columns === 'number' ? `repeat(${columns}, 1fr)` : columns }),
    ...(gap !== undefined && { gap: getSpacing(gap) }),
    ...customStyles,
  };
}

/**
 * Create hover effect style
 * Note: Actual hover state should be handled via onMouseEnter/onMouseLeave
 * This just provides the base transition
 */
export function hover(
  baseStyle: CSSProperties
): CSSProperties {
  return {
    ...baseStyle,
    transition: `all ${transitions.normal}`,
  };
}

/**
 * Export design tokens for direct access
 */
export { colors, spacing, typography, borderRadius, shadows, transitions };
