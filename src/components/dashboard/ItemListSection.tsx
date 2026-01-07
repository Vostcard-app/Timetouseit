/**
 * ItemListSection Component
 * Renders the filtered item list
 */

import React from 'react';
import SwipeableListItem from '../ui/SwipeableListItem';
import type { FoodItem } from '../../types';
import type { StorageTabType } from '../../hooks/useStorageTabs';

type FilterType = 'all' | 'expiring_soon' | 'expired';

interface ItemListSectionProps {
  items: FoodItem[];
  filter: FilterType;
  storageTab: StorageTabType;
  onItemClick: (item: FoodItem) => void;
  onItemDelete: (itemId: string) => void;
  onItemFreeze?: (item: FoodItem) => void;
}

export const ItemListSection: React.FC<ItemListSectionProps> = ({
  items,
  filter,
  storageTab,
  onItemClick,
  onItemDelete,
  onItemFreeze
}) => {
  if (items.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
        <p style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>
          {filter === 'all' 
            ? `No ${storageTab === 'perishable' ? 'perishable' : 'dry/canned'} items yet.`
            : `No ${filter.replace('_', ' ')} ${storageTab === 'perishable' ? 'perishable' : 'dry/canned'} items.`}
        </p>
        <p style={{ marginBottom: '1.5rem' }}>
          {filter === 'all' 
            ? `Add your first ${storageTab === 'perishable' ? 'perishable' : 'dry/canned'} item to start tracking expiration dates!`
            : 'Try a different filter.'}
        </p>
      </div>
    );
  }

  return (
    <div>
      {items.map((item) => (
        <SwipeableListItem
          key={item.id}
          item={item}
          onDelete={() => onItemDelete(item.id)}
          onClick={() => onItemClick(item)}
          onFreeze={onItemFreeze ? () => onItemFreeze(item) : undefined}
        />
      ))}
    </div>
  );
};

