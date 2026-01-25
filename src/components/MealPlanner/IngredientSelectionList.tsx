/**
 * Ingredient Selection List Component
 * Reusable list for displaying selectable ingredients with checkboxes
 */

import React from 'react';
import type { FoodCategory } from '../../utils/categoryUtils';
import { colors, spacing } from '../../styles/designTokens';

export interface IngredientItem {
  id: string;
  name: string;
  source: 'bestBySoon' | 'shopList' | 'perishable' | 'dryCanned';
  bestByDate?: Date | null;
  category?: FoodCategory;
  originalItemId?: string;
  isReserved?: boolean;
}

interface IngredientSelectionListProps {
  ingredients: IngredientItem[];
  selectedIngredients: Set<string>;
  onToggle: (ingredientId: string) => void;
  maxSelections?: number;
  onCategoryChange?: (ingredientId: string, newCategory: FoodCategory) => void;
  editingCategoryItemId: string | null;
  onSetEditingCategoryItemId: (id: string | null) => void;
  categoryOptions: FoodCategory[];
}

export const IngredientSelectionList: React.FC<IngredientSelectionListProps> = ({
  ingredients,
  selectedIngredients,
  onToggle,
  maxSelections = 3,
  onCategoryChange,
  editingCategoryItemId,
  onSetEditingCategoryItemId,
  categoryOptions,
}) => {
  const canSelect = (ingredientId: string) => {
    return selectedIngredients.size < maxSelections || selectedIngredients.has(ingredientId);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
      {ingredients.map(ingredient => (
        <label
          key={ingredient.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: spacing.md,
            cursor: canSelect(ingredient.id) ? 'pointer' : 'not-allowed',
            borderRadius: '4px',
            backgroundColor: selectedIngredients.has(ingredient.id) ? '#f0f8ff' : 'transparent',
            opacity: canSelect(ingredient.id) ? 1 : 0.5
          }}
        >
          <input
            type="checkbox"
            checked={selectedIngredients.has(ingredient.id)}
            onChange={() => onToggle(ingredient.id)}
            disabled={!canSelect(ingredient.id)}
            style={{
              marginRight: spacing.md,
              width: '1.25rem',
              height: '1.25rem',
              cursor: canSelect(ingredient.id) ? 'pointer' : 'not-allowed'
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', flex: 1, gap: spacing.sm }}>
            <span style={{ flex: 1, fontSize: '1rem', color: ingredient.isReserved ? colors.gray[400] : colors.gray[900] }}>
              {ingredient.name}
            </span>
            {ingredient.originalItemId && onCategoryChange && (
              <div style={{ position: 'relative' }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSetEditingCategoryItemId(editingCategoryItemId === ingredient.id ? null : ingredient.id);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: spacing.xs,
                    display: 'flex',
                    alignItems: 'center',
                    color: colors.gray[500]
                  }}
                  title="Edit category"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
                {editingCategoryItemId === ingredient.id && (
                  <div style={{
                    position: 'absolute',
                    right: 0,
                    top: '100%',
                    marginTop: spacing.xs,
                    backgroundColor: colors.white,
                    border: `1px solid ${colors.gray[300]}`,
                    borderRadius: '6px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    zIndex: 1000,
                    minWidth: '150px'
                  }}>
                    <select
                      value={ingredient.category || 'Other'}
                      onChange={(e) => {
                        onCategoryChange(ingredient.id, e.target.value as FoodCategory);
                        onSetEditingCategoryItemId(null);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      onBlur={() => onSetEditingCategoryItemId(null)}
                      style={{
                        width: '100%',
                        padding: `${spacing.sm} ${spacing.md}`,
                        backgroundColor: colors.white,
                        color: colors.gray[900],
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        cursor: 'pointer'
                      }}
                      autoFocus
                    >
                      {categoryOptions.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>
        </label>
      ))}
    </div>
  );
};
