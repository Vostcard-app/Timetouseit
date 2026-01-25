/**
 * Day Meals Modal
 * Shows all meals and dishes for a specific day
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

interface DayMealsModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date;
  meals: PlannedMeal[];
  onDishClick: (dish: Dish, meal: PlannedMeal) => void;
  onAddDish: (mealType: MealType) => void;
  onAddMeal: () => void;
}

export const DayMealsModal: React.FC<DayMealsModalProps> = ({
  isOpen,
  onClose,
  date,
  meals,
  onDishClick,
  onAddDish,
  onAddMeal
}) => {

  // Group meals by meal type
  const mealsByType: Record<MealType, PlannedMeal | null> = {
    breakfast: null,
    lunch: null,
    dinner: null
  };

  meals.forEach(meal => {
    mealsByType[meal.mealType] = meal;
  });

  const mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner'];
  const title = `Meals for ${format(date, 'EEEE, MMMM d, yyyy')}`;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="large"
    >

      {/* Meals by Type */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg, marginBottom: spacing.xl }}>
        {mealTypes.map((mealType) => {
          const meal = mealsByType[mealType];
          const dishes = meal?.dishes || [];

          return (
            <div
              key={mealType}
              style={{
                border: `1px solid ${colors.gray[200]}`,
                borderRadius: borderRadius.lg,
                overflow: 'hidden'
              }}
            >
              {/* Meal Type Header */}
              <div
                style={{
                  padding: spacing.md,
                  backgroundColor: colors.gray[50],
                  borderBottom: dishes.length > 0 ? `1px solid ${colors.gray[200]}` : 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <h3 style={combineStyles(textStyles.heading3, { margin: 0 })}>
                  {MEAL_TYPE_LABELS[mealType]}
                </h3>
                {dishes.length > 0 && (
                  <span style={combineStyles(textStyles.bodySmall)}>
                    {dishes.length} dish{dishes.length !== 1 ? 'es' : ''}
                  </span>
                )}
              </div>

              {/* Dishes List */}
              {dishes.length > 0 ? (
                <div style={{ padding: spacing.sm }}>
                  {dishes.map((dish) => (
                    <div
                      key={dish.id}
                      onClick={() => meal && onDishClick(dish, meal)}
                      style={combineStyles(
                        cardStyles.base,
                        {
                          padding: spacing.md,
                          marginBottom: spacing.sm,
                          backgroundColor: dish.completed ? colors.statusBg.bestBySoon : colors.white,
                          borderColor: colors.gray[200],
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }
                      )}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = dish.completed ? colors.success : colors.gray[100];
                        e.currentTarget.style.borderColor = colors.primary;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = dish.completed ? colors.statusBg.bestBySoon : colors.white;
                        e.currentTarget.style.borderColor = colors.gray[200];
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <h4 style={combineStyles(textStyles.body, { margin: 0, fontWeight: 600 })}>
                            {dish.dishName}
                          </h4>
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
              ) : (
                <div style={combineStyles(textStyles.bodySmall, { padding: spacing.md, textAlign: 'center' })}>
                  No dishes planned
                </div>
              )}

              {/* Add Dish Button */}
              <div style={{ padding: `${spacing.sm} ${spacing.md}`, borderTop: `1px solid ${colors.gray[200]}`, textAlign: 'right' }}>
                <button
                  onClick={() => onAddDish(mealType)}
                  style={combineStyles(buttonStyles.primary, { fontSize: '0.875rem', padding: `${spacing.sm} ${spacing.md}` })}
                >
                  + Add Dish
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: spacing.md, marginTop: spacing.lg }}>
        <button
          onClick={onClose}
          style={buttonStyles.secondary}
        >
          Close
        </button>
        {meals.length === 0 && (
          <button
            onClick={onAddMeal}
            style={buttonStyles.primary}
          >
            Add Meal
          </button>
        )}
      </div>
    </BaseModal>
  );
};
