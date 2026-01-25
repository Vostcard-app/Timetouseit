/**
 * Dish List Modal
 * Shows list of dishes for a specific meal type on a date
 */

import React from 'react';
import type { MealType, PlannedMeal, Dish } from '../../types';
import { format } from 'date-fns';
import { BaseModal } from '../ui/BaseModal';
import { combineStyles, buttonStyles, cardStyles, textStyles } from '../../styles/componentStyles';
import { colors, spacing, borderRadius } from '../../styles/designTokens';

const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner'
};

interface DishListModalProps {
  isOpen: boolean;
  onClose: () => void;
  meal: PlannedMeal | null;
  date: Date;
  mealType: MealType;
  onDishClick: (dish: Dish) => void;
  onAddDish: () => void;
}

export const DishListModal: React.FC<DishListModalProps> = ({
  isOpen,
  onClose,
  meal,
  date,
  mealType,
  onDishClick,
  onAddDish
}) => {
  const dishes = meal?.dishes || [];
  const title = `${MEAL_TYPE_LABELS[mealType]} - ${format(date, 'EEEE, MMMM d, yyyy')}`;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="medium"
    >

      {/* Dishes List */}
      {dishes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: spacing['2xl'], color: colors.gray[500] }}>
          <p style={combineStyles(textStyles.body, { margin: 0 })}>No dishes planned yet</p>
          <p style={combineStyles(textStyles.bodySmall, { margin: `${spacing.sm} 0 0 0` })}>Add a dish to get started</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md, marginBottom: spacing.lg }}>
          {dishes.map((dish) => (
            <div
              key={dish.id}
              onClick={() => onDishClick(dish)}
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
                  <h3 style={combineStyles(textStyles.heading3, { margin: 0 })}>
                    {dish.dishName}
                  </h3>
                  {dish.recipeTitle && dish.recipeTitle !== dish.dishName && (
                    <p style={combineStyles(textStyles.bodySmall, { margin: `${spacing.xs} 0 0 0` })}>
                      {dish.recipeTitle}
                    </p>
                  )}
                  <p style={combineStyles(textStyles.bodySmall, { margin: `${spacing.sm} 0 0 0` })}>
                    {dish.recipeIngredients.length} ingredient{dish.recipeIngredients.length !== 1 ? 's' : ''}
                  </p>
                </div>
                {dish.completed && (
                  <span
                    style={combineStyles(
                      {
                        fontSize: '0.75rem',
                        padding: `${spacing.xs} ${spacing.sm}`,
                        borderRadius: borderRadius.full,
                        fontWeight: 600,
                        backgroundColor: colors.success,
                        color: colors.white,
                        marginLeft: spacing.md
                      }
                    )}
                  >
                    Completed
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: spacing.md, marginTop: spacing.lg }}>
        <button
          onClick={onClose}
          style={buttonStyles.secondary}
        >
          Back
        </button>
        <button
          onClick={onAddDish}
          style={buttonStyles.primary}
        >
          Add Dish
        </button>
      </div>
    </BaseModal>
  );
};
