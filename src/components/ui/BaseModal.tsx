/**
 * Base Modal Component
 * Enhanced modal with common patterns and styling from design system
 */

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { modalStyles, combineStyles } from '../../styles/componentStyles';
import { colors, spacing, zIndex } from '../../styles/designTokens';

export interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string | React.ReactNode;
  children: React.ReactNode;
  size?: 'small' | 'medium' | 'large' | 'full';
  showCloseButton?: boolean;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  footer?: React.ReactNode;
  className?: string;
  'data-testid'?: string;
}

/**
 * Base Modal with common functionality
 * Uses design system styles and provides consistent modal behavior
 */
export const BaseModal: React.FC<BaseModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'medium',
  showCloseButton = true,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  footer,
  className = '',
  'data-testid': testId,
}) => {
  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, closeOnEscape]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeStyles: Record<string, React.CSSProperties> = {
    small: { maxWidth: '400px' },
    medium: { maxWidth: '600px' },
    large: { maxWidth: '900px' },
    full: { maxWidth: '95vw', maxHeight: '95vh' },
  };

  const modalContent = (
    <div
      style={combineStyles(modalStyles.overlay, { zIndex: zIndex.modal })}
      onClick={closeOnBackdropClick ? onClose : undefined}
      data-testid={testId ? `${testId}-backdrop` : undefined}
    >
      <div
        style={combineStyles(
          modalStyles.content,
          sizeStyles[size],
          { maxHeight: '90vh' }
        )}
        onClick={(e) => e.stopPropagation()}
        className={className}
        data-testid={testId}
      >
        {(title || showCloseButton) && (
          <div style={modalStyles.header}>
            {title && (
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600, color: colors.gray[900] }}>
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: colors.gray[500],
                  padding: spacing.xs,
                  lineHeight: 1,
                }}
                aria-label="Close modal"
              >
                ×
              </button>
            )}
          </div>
        )}
        <div style={{ padding: spacing.xl }}>{children}</div>
        {footer && <div style={modalStyles.footer}>{footer}</div>}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
