/**
 * FreezeSection Component
 * Handles freeze checkbox and category selector
 */

import React from 'react';
import { freezeCategoryLabels, type FreezeCategory } from '../../data/freezeGuidelines';

interface FreezeSectionProps {
  isFrozen: boolean;
  freezeCategory: FreezeCategory | null;
  thawDate: Date | undefined;
  isDisabled?: boolean;
  onFreezeToggle: (frozen: boolean) => void;
  onFreezeCategoryChange: (category: FreezeCategory) => void;
}

export const FreezeSection: React.FC<FreezeSectionProps> = ({
  isFrozen,
  freezeCategory,
  thawDate,
  isDisabled = false,
  onFreezeToggle,
  onFreezeCategoryChange
}) => {
  return (
    <>
      {/* Freeze Checkbox */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: isDisabled ? 'not-allowed' : 'pointer' }}>
          <input
            type="checkbox"
            checked={isFrozen}
            disabled={isDisabled}
            onChange={(e) => onFreezeToggle(e.target.checked)}
            style={{
              width: '1.25rem',
              height: '1.25rem',
              cursor: isDisabled ? 'not-allowed' : 'pointer',
              opacity: isDisabled ? 0.5 : 1
            }}
          />
          <span style={{ fontSize: '1rem', fontWeight: '500' }}>
            Freeze this item
          </span>
        </label>
      </div>

      {/* Freeze Category Dropdown */}
      {isFrozen && (
        <div style={{ marginBottom: '1.5rem' }}>
          <label htmlFor="freezeCategory" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '1rem' }}>
            Freeze Category *
          </label>
          <select
            id="freezeCategory"
            value={freezeCategory || ''}
            onChange={(e) => onFreezeCategoryChange(e.target.value as FreezeCategory)}
            required={isFrozen}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '1rem',
              backgroundColor: 'white',
              cursor: 'pointer'
            }}
          >
            <option value="">Select a category</option>
            {Object.entries(freezeCategoryLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Thaw Date Field (for frozen items) */}
      {isFrozen && thawDate && (
        <div style={{ marginBottom: '1.5rem' }}>
          <label htmlFor="thawDate" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '1rem' }}>
            Thaw Date *
          </label>
          <input
            type="date"
            id="thawDate"
            name="thawDate"
            value={thawDate.toISOString().split('T')[0]}
            disabled
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '1rem',
              backgroundColor: '#f3f4f6',
              cursor: 'not-allowed'
            }}
          />
          <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
            Thaw date is calculated from the selected freeze category
          </p>
        </div>
      )}
    </>
  );
};

