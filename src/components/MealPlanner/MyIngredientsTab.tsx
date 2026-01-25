/**
 * My Ingredients Tab Component
 * Displays ingredients from dashboard, shop list, etc. with category filtering
 */

import React from 'react';
import { IngredientCategoryFilter } from './IngredientCategoryFilter';
import { IngredientSelectionList, type IngredientItem } from './IngredientSelectionList';
import type { FoodCategory } from '../../utils/categoryUtils';
import { textStyles } from '../../styles/componentStyles';
import { spacing } from '../../styles/designTokens';

interface MyIngredientsTabProps {
  loading: boolean;
  groupedIngredients: {
    bestBySoon: IngredientItem[];
    shopList: IngredientItem[];
    perishable: IngredientItem[];
    dryCanned: IngredientItem[];
  };
  selectedIngredients: Set<string>;
  onToggleIngredient: (ingredientId: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (value: string) => void;
  categoryOptions: FoodCategory[];
  editingCategoryItemId: string | null;
  onSetEditingCategoryItemId: (id: string | null) => void;
  onCategoryChange: (ingredientId: string, newCategory: FoodCategory) => void;
  getSourceLabel: (source: IngredientItem['source']) => string;
}

export const MyIngredientsTab: React.FC<MyIngredientsTabProps> = ({
  loading,
  groupedIngredients,
  selectedIngredients,
  onToggleIngredient,
  categoryFilter,
  onCategoryFilterChange,
  categoryOptions,
  editingCategoryItemId,
  onSetEditingCategoryItemId,
  onCategoryChange,
  getSourceLabel,
}) => {
  if (loading) {
    return <p style={{ textAlign: 'center', color: '#6b7280' }}>Loading ingredients...</p>;
  }

  return (
    <div>
      <IngredientCategoryFilter
        value={categoryFilter}
        onChange={onCategoryFilterChange}
        categoryOptions={categoryOptions}
      />
      
      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {/* Use Soon */}
        {groupedIngredients.bestBySoon.length > 0 && (
          <div style={{ marginBottom: spacing.lg }}>
            <h4 style={textStyles.heading3}>
              {getSourceLabel('bestBySoon')}
            </h4>
            <IngredientSelectionList
              ingredients={groupedIngredients.bestBySoon}
              selectedIngredients={selectedIngredients}
              onToggle={onToggleIngredient}
              onCategoryChange={onCategoryChange}
              editingCategoryItemId={editingCategoryItemId}
              onSetEditingCategoryItemId={onSetEditingCategoryItemId}
              categoryOptions={categoryOptions}
            />
          </div>
        )}

        {/* Perishable Items */}
        {groupedIngredients.perishable.length > 0 && (
          <div style={{ marginBottom: spacing.lg }}>
            <h4 style={textStyles.heading3}>
              {getSourceLabel('perishable')}
            </h4>
            <IngredientSelectionList
              ingredients={groupedIngredients.perishable}
              selectedIngredients={selectedIngredients}
              onToggle={onToggleIngredient}
              onCategoryChange={onCategoryChange}
              editingCategoryItemId={editingCategoryItemId}
              onSetEditingCategoryItemId={onSetEditingCategoryItemId}
              categoryOptions={categoryOptions}
            />
          </div>
        )}

        {/* Dry/Canned Items */}
        {groupedIngredients.dryCanned.length > 0 && (
          <div style={{ marginBottom: spacing.lg }}>
            <h4 style={textStyles.heading3}>
              {getSourceLabel('dryCanned')}
            </h4>
            <IngredientSelectionList
              ingredients={groupedIngredients.dryCanned}
              selectedIngredients={selectedIngredients}
              onToggle={onToggleIngredient}
              onCategoryChange={onCategoryChange}
              editingCategoryItemId={editingCategoryItemId}
              onSetEditingCategoryItemId={onSetEditingCategoryItemId}
              categoryOptions={categoryOptions}
            />
          </div>
        )}

        {/* Shop List */}
        {groupedIngredients.shopList.length > 0 && (
          <div style={{ marginBottom: spacing.lg }}>
            <h4 style={textStyles.heading3}>
              {getSourceLabel('shopList')}
            </h4>
            <IngredientSelectionList
              ingredients={groupedIngredients.shopList}
              selectedIngredients={selectedIngredients}
              onToggle={onToggleIngredient}
              onCategoryChange={onCategoryChange}
              editingCategoryItemId={editingCategoryItemId}
              onSetEditingCategoryItemId={onSetEditingCategoryItemId}
              categoryOptions={categoryOptions}
            />
          </div>
        )}
      </div>
    </div>
  );
};
