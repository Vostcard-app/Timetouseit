/**
 * Form Section Component
 * Container for grouping related form fields
 */

import React from 'react';
import type { BaseComponentProps } from '../../types/components';
import { spacing, colors, borderRadius, typography } from '../../styles/designTokens';
import { textStyles, combineStyles } from '../../styles/componentStyles';

export interface FormSectionProps extends BaseComponentProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

export const FormSection: React.FC<FormSectionProps> = ({
  title,
  description,
  children,
  collapsible = false,
  defaultCollapsed = false,
  className,
  style
}) => {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);

  return (
    <div
      className={className}
      style={combineStyles(
        {
          marginBottom: spacing.lg,
          padding: spacing.lg,
          backgroundColor: colors.white,
          border: `1px solid ${colors.gray[200]}`,
          borderRadius: borderRadius.lg,
        },
        style
      )}
    >
      {title && (
        <div
          style={{
            marginBottom: description ? spacing.sm : spacing.md,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h3 style={textStyles.heading3}>{title}</h3>
          {collapsible && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: typography.fontSize.lg,
                color: colors.gray[600],
                padding: spacing.xs,
              }}
              aria-label={isCollapsed ? 'Expand section' : 'Collapse section'}
            >
              {isCollapsed ? '▼' : '▲'}
            </button>
          )}
        </div>
      )}
      {description && !isCollapsed && (
        <p
          style={{
            marginBottom: spacing.md,
            fontSize: typography.fontSize.sm,
            color: colors.gray[600],
          }}
        >
          {description}
        </p>
      )}
      {!isCollapsed && children}
    </div>
  );
};
