/**
 * QuantitySection Component
 * Handles quantity input with spinner controls
 */

import React from 'react';

const QUANTITY_UNITS = [
  { value: 'cans', label: 'Cans' },
  { value: 'packages', label: 'Packages' },
  { value: 'cups', label: 'Cups' },
  { value: 'boxes', label: 'Boxes' },
  { value: 'bags', label: 'Bags' },
  { value: 'bottles', label: 'Bottles' },
  { value: 'jars', label: 'Jars' },
  { value: 'servings', label: 'Servings' },
  { value: 'units', label: 'Units' }
] as const;

interface QuantitySectionProps {
  quantity: number;
  quantityUnit: string;
  onQuantityChange: (quantity: number) => void;
  onQuantityUnitChange: (unit: string) => void;
  onIncrement: () => void;
  onDecrement: () => void;
}

export const QuantitySection: React.FC<QuantitySectionProps> = ({
  quantity,
  quantityUnit,
  onQuantityChange,
  onQuantityUnitChange,
  onIncrement,
  onDecrement
}) => {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <label htmlFor="quantity" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '1rem' }}>
        Quantity
      </label>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'stretch' }}>
        <div style={{ position: 'relative', flex: '1' }}>
          <input
            type="number"
            id="quantity"
            name="quantity"
            min="1"
            value={quantity || 1}
            onChange={(e) => onQuantityChange(parseInt(e.target.value) || 1)}
            style={{
              width: '100%',
              padding: '0.75rem 2.5rem 0.75rem 0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '1rem',
              MozAppearance: 'textfield',
              WebkitAppearance: 'none',
              appearance: 'none'
            }}
          />
          <div style={{
            position: 'absolute',
            right: '0',
            top: '0',
            bottom: '0',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            borderLeft: '1px solid #d1d5db',
            borderRadius: '0 6px 6px 0',
            overflow: 'hidden'
          }}>
            <button
              type="button"
              onClick={onIncrement}
              style={{
                flex: '1',
                width: '2rem',
                backgroundColor: 'transparent',
                border: 'none',
                padding: '0',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                color: '#4b5563',
                lineHeight: '1',
                height: '50%'
              }}
              aria-label="Increase quantity"
            >
              ▲
            </button>
            <button
              type="button"
              onClick={onDecrement}
              style={{
                flex: '1',
                width: '2rem',
                backgroundColor: 'transparent',
                border: 'none',
                padding: '0',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                color: '#4b5563',
                lineHeight: '1',
                height: '50%'
              }}
              aria-label="Decrease quantity"
            >
              ▼
            </button>
          </div>
        </div>
        <select
          id="quantityUnit"
          name="quantityUnit"
          value={quantityUnit || 'units'}
          onChange={(e) => onQuantityUnitChange(e.target.value)}
          style={{
            padding: '0.75rem',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '1rem',
            backgroundColor: 'white',
            cursor: 'pointer',
            minWidth: '120px'
          }}
        >
          {QUANTITY_UNITS.map(unit => (
            <option key={unit.value} value={unit.value}>
              {unit.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

