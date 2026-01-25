/**
 * Ingredient Category Filter Component
 * Dropdown filter for filtering ingredients by category
 */

import React from 'react';
import type { FoodCategory } from '../../utils/categoryUtils';
import { inputStyles } from '../../styles/componentStyles';

interface IngredientCategoryFilterProps {
  value: string;
  onChange: (value: string) => void;
  categoryOptions: FoodCategory[];
}

export const IngredientCategoryFilter: React.FC<IngredientCategoryFilterProps> = ({
  value,
  onChange,
  categoryOptions,
}) => {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{ 
        display: 'block', 
        marginBottom: '0.5rem', 
        fontSize: '0.875rem', 
        fontWeight: 500, 
        color: '#1f2937' 
      }}>
        Filter Perishables:
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={inputStyles.base}
      >
        <option value="all">All Categories</option>
        {categoryOptions.map(cat => (
          <option key={cat} value={cat}>{cat}</option>
        ))}
      </select>
    </div>
  );
};
