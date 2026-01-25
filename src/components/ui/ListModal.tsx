/**
 * List Modal Component
 * Modal for displaying lists of items with optional actions
 */

import React from 'react';
import { BaseModal, type BaseModalProps } from './BaseModal';
import { listItemStyles, combineStyles } from '../../styles/componentStyles';
import { spacing } from '../../styles/designTokens';

export interface ListModalProps<T> extends Omit<BaseModalProps, 'children'> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  emptyMessage?: string;
  onItemClick?: (item: T, index: number) => void;
  selectedIndex?: number;
}

/**
 * List Modal for displaying scrollable lists
 */
export function ListModal<T>({
  items,
  renderItem,
  emptyMessage = 'No items to display',
  onItemClick,
  selectedIndex,
  size = 'medium',
  ...baseModalProps
}: ListModalProps<T>) {
  return (
    <BaseModal
      {...baseModalProps}
      size={size}
    >
      <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
        {items.length === 0 ? (
          <div style={{ padding: spacing.xl, textAlign: 'center', color: '#6b7280' }}>
            {emptyMessage}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {items.map((item, index) => (
              <div
                key={index}
                onClick={() => onItemClick?.(item, index)}
                style={combineStyles(
                  listItemStyles.base,
                  onItemClick && listItemStyles.hover,
                  selectedIndex === index && listItemStyles.selected
                )}
              >
                {renderItem(item, index)}
              </div>
            ))}
          </div>
        )}
      </div>
    </BaseModal>
  );
}
