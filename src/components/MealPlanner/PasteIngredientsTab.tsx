/**
 * Paste Ingredients Tab Component
 * Handles pasting ingredients and showing availability status
 */

import React from 'react';
import { IngredientChecklist } from './IngredientChecklist';
import type { IngredientStatus } from '../../hooks/useIngredientAvailability';
import { inputStyles } from '../../styles/componentStyles';
import { textStyles } from '../../styles/componentStyles';
import { spacing } from '../../styles/designTokens';

interface PasteIngredientsTabProps {
  pastedIngredients: string;
  onPastedIngredientsChange: (value: string) => void;
  parsedIngredients: string[];
  selectedPastedIngredientIndices: Set<number>;
  onTogglePastedIngredient: (index: number) => void;
  loadingPastedIngredients: boolean;
  pastedIngredientStatuses: IngredientStatus[];
}

export const PasteIngredientsTab: React.FC<PasteIngredientsTabProps> = ({
  pastedIngredients,
  onPastedIngredientsChange,
  parsedIngredients,
  selectedPastedIngredientIndices,
  onTogglePastedIngredient,
  loadingPastedIngredients,
  pastedIngredientStatuses,
}) => {
  return (
    <div>
      <label htmlFor="pastedIngredients" style={{ display: 'block', marginBottom: spacing.sm, fontSize: '0.875rem', fontWeight: 500, color: '#374151' }}>
        Add Ingredients
      </label>
      <textarea
        id="pastedIngredients"
        value={pastedIngredients}
        onChange={(e) => onPastedIngredientsChange(e.target.value)}
        placeholder="Paste or type ingredients here, one per line or separated by commas...&#10;Example:&#10;2 cups flour&#10;1 cup sugar&#10;3 eggs"
        style={{
          ...inputStyles.base,
          minHeight: '150px',
          resize: 'vertical' as const,
          fontFamily: 'inherit',
          marginBottom: spacing.md
        }}
      />
      {parsedIngredients.length > 0 && (
        <div>
          <h4 style={textStyles.heading3}>
            Parsed Ingredients ({selectedPastedIngredientIndices.size} of {parsedIngredients.length} selected)
          </h4>
          {loadingPastedIngredients ? (
            <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '0.875rem' }}>Checking ingredient availability...</p>
          ) : (
            <IngredientChecklist
              ingredientStatuses={pastedIngredientStatuses}
              selectedIngredientIndices={selectedPastedIngredientIndices}
              onToggleIngredient={onTogglePastedIngredient}
            />
          )}
        </div>
      )}
    </div>
  );
};
