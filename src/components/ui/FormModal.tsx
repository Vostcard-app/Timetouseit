/**
 * Form Modal Component
 * Modal wrapper specifically for forms with submit/cancel buttons
 */

import React from 'react';
import { BaseModal, type BaseModalProps } from './BaseModal';
import { buttonStyles, combineStyles } from '../../styles/componentStyles';
import { spacing } from '../../styles/designTokens';

export interface FormModalProps extends Omit<BaseModalProps, 'footer'> {
  onSubmit?: () => void;
  onCancel?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  submitDisabled?: boolean;
  submitVariant?: 'primary' | 'secondary' | 'danger' | 'success';
  showCancel?: boolean;
}

/**
 * Form Modal with built-in submit/cancel footer
 */
export const FormModal: React.FC<FormModalProps> = ({
  onSubmit,
  onCancel,
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  submitDisabled = false,
  submitVariant = 'primary',
  showCancel = true,
  onClose,
  ...baseModalProps
}) => {
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      onClose();
    }
  };

  const footer = (
    <div style={{ display: 'flex', gap: spacing.md, justifyContent: 'flex-end' }}>
      {showCancel && (
        <button
          onClick={handleCancel}
          disabled={submitDisabled}
          style={combineStyles(
            buttonStyles.secondary,
            submitDisabled && buttonStyles.disabled
          )}
        >
          {cancelLabel}
        </button>
      )}
      {onSubmit && (
        <button
          onClick={onSubmit}
          disabled={submitDisabled}
          style={combineStyles(
            buttonStyles[submitVariant],
            submitDisabled && buttonStyles.disabled
          )}
        >
          {submitLabel}
        </button>
      )}
    </div>
  );

  return (
    <BaseModal
      {...baseModalProps}
      onClose={onClose}
      footer={footer}
    />
  );
};
