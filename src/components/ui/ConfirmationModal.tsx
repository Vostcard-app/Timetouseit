/**
 * Confirmation Modal Component
 * Modal for confirmation dialogs (delete, confirm actions, etc.)
 */

import React from 'react';
import { BaseModal, type BaseModalProps } from './BaseModal';
import { buttonStyles, combineStyles, textStyles } from '../../styles/componentStyles';
import { spacing } from '../../styles/designTokens';

export interface ConfirmationModalProps extends Omit<BaseModalProps, 'children' | 'footer'> {
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  variant?: 'danger' | 'warning' | 'info';
  confirmDisabled?: boolean;
}

/**
 * Confirmation Modal for user confirmations
 */
export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'info',
  confirmDisabled = false,
  onClose,
  size = 'small',
  ...baseModalProps
}) => {
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      onClose();
    }
  };

  const confirmButtonVariant = variant === 'danger' ? 'danger' : variant === 'warning' ? 'secondary' : 'primary';

  const footer = (
    <div style={{ display: 'flex', gap: spacing.md, justifyContent: 'flex-end' }}>
      <button
        onClick={handleCancel}
        disabled={confirmDisabled}
        style={combineStyles(
          buttonStyles.secondary,
          confirmDisabled && buttonStyles.disabled
        )}
      >
        {cancelLabel}
      </button>
      <button
        onClick={onConfirm}
        disabled={confirmDisabled}
        style={combineStyles(
          buttonStyles[confirmButtonVariant],
          confirmDisabled && buttonStyles.disabled
        )}
      >
        {confirmLabel}
      </button>
    </div>
  );

  return (
    <BaseModal
      {...baseModalProps}
      onClose={onClose}
      size={size}
      footer={footer}
    >
      <p style={textStyles.body}>{message}</p>
    </BaseModal>
  );
};
