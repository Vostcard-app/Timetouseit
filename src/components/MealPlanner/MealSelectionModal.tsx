/**
 * Meal Selection Modal
 * Shows list of meals for a specific date and meal type when multiple meals exist
 */

import React from 'react';
import type { MealType, PlannedMeal } from '../../types';
import { format } from 'date-fns';
import { BaseModal } from '../ui/BaseModal';
import { combineStyles, buttonStyles, cardStyles, textStyles } from '../../styles/componentStyles';
import { colors, spacing, borderRadius } from '../../styles/designTokens';

const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner'
};

interface MealSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date;
  mealType: MealType;
  meals: PlannedMeal[];
  onMealClick: (meal: PlannedMeal) => void;
}

export const MealSelectionModal: React.FC<MealSelectionModalProps> = ({
  isOpen,
  onClose,
  date,
  mealType,
  meals,
  onMealClick
}) => {
  const title = `${MEAL_TYPE_LABELS[mealType]} - ${format(date, 'EEEE, MMMM d, yyyy')}`;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="medium"
    >
      <div style={{ marginBottom: spacing.md }}>
        <p style={combineStyles(textStyles.bodySmall, { margin: 0 })}>
          {meals.length} meal{meals.length !== 1 ? 's' : ''} planned
        </p>
      </div>

      {/* Meals List */}
      {meals.length === 0 ? (
        <div style={{ textAlign: 'center', padding: spacing['2xl'], color: colors.gray[500] }}>
          <p style={combineStyles(textStyles.body, { margin: 0 })}>No meals planned</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md, marginBottom: spacing.lg }}>
          {meals.map((meal) => {
            const dishes = meal.dishes || [];
            return (
              <div
                key={meal.id}
                onClick={() => onMealClick(meal)}
                style={combineStyles(
                  cardStyles.base,
                  {
                    padding: spacing.lg,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    backgroundColor: colors.gray[50],
                    borderColor: colors.gray[200]
                  }
                )}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.gray[100];
                  e.currentTarget.style.borderColor = colors.primary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = colors.gray[50];
                  e.currentTarget.style.borderColor = colors.gray[200];
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    {dishes.length === 0 ? (
                      <p style={combineStyles(textStyles.body, { margin: 0, color: colors.gray[400], fontStyle: 'italic' })}>
                        No dishes planned
                      </p>
                    ) : dishes.length === 1 ? (
                      <h3 style={combineStyles(textStyles.heading3, { margin: 0 })}>
                        {dishes[0].dishName}
                      </h3>
                    ) : (
                      <div>
                        <h3 style={combineStyles(textStyles.body, { margin: `0 0 ${spacing.sm} 0`, fontWeight: 600, color: colors.gray[500] })}>
                          {dishes.length} dishes
                        </h3>
                        <ul style={{ margin: 0, paddingLeft: spacing.lg, listStyle: 'disc' }}>
                          {dishes.map((dish) => (
                            <li key={dish.id} style={combineStyles(textStyles.bodySmall, { marginBottom: spacing.xs })}>
                              {dish.dishName}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {dishes.length > 0 && (
                      <p style={combineStyles(textStyles.bodySmall, { margin: `${spacing.sm} 0 0 0` })}>
                        {dishes.reduce((total, dish) => total + (dish.recipeIngredients?.length || 0), 0)} total ingredient{dishes.reduce((total, dish) => total + (dish.recipeIngredients?.length || 0), 0) !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                  {dishes.length > 1 && (
                    <span
                      style={combineStyles(
                        {
                          fontSize: '0.75rem',
                          padding: `${spacing.xs} ${spacing.sm}`,
                          borderRadius: borderRadius.full,
                          fontWeight: 600,
                          backgroundColor: colors.primary,
                          color: colors.white,
                          marginLeft: spacing.md
                        }
                      )}
                    >
                      {dishes.length} dishes
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: spacing.lg }}>
        <button
          onClick={onClose}
          style={combineStyles(buttonStyles.secondary)}
        >
          Close
        </button>
      </div>
    </BaseModal>
  );
};
