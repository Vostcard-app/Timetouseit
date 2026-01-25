/**
 * Calendar Meal Badges Component
 * Displays meal type badges (B/L/D) for a day
 */

import React from 'react';
import type { MealType, PlannedMeal } from '../../types';
import { colors, spacing } from '../../styles/designTokens';

const MEAL_TYPE_ABBREVIATIONS: Record<MealType, string> = {
  breakfast: 'B',
  lunch: 'L',
  dinner: 'D'
};

interface CalendarMealBadgesProps {
  meals: PlannedMeal[];
  onMealTypeClick: (mealType: MealType, event: React.MouseEvent) => void;
  isDragging?: boolean;
}

export const CalendarMealBadges: React.FC<CalendarMealBadgesProps> = ({
  meals,
  onMealTypeClick,
  isDragging = false
}) => {
  // Group meals by meal type
  const mealsByType: Record<MealType, PlannedMeal[]> = {
    breakfast: [],
    lunch: [],
    dinner: []
  };
  
  meals.forEach(meal => {
    if (meal.dishes && meal.dishes.length > 0) {
      mealsByType[meal.mealType].push(meal);
    }
  });
  
  const mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner'];

  return (
    <div style={{ display: 'flex', flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' }}>
      {mealTypes.map(mealType => {
        const mealsOfType = mealsByType[mealType];
        if (mealsOfType.length === 0) return null;
        
        const mealCount = mealsOfType.length;
        const hasMultipleMeals = mealCount > 1;
        
        return (
          <div
            key={mealType}
            onClick={(e) => {
              if (!isDragging) {
                onMealTypeClick(mealType, e);
              }
            }}
            style={{
              position: 'relative',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: colors.primary,
              color: colors.white,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.65rem',
              fontWeight: 600,
              cursor: isDragging ? 'default' : 'pointer',
              userSelect: 'none',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (!isDragging) {
                e.currentTarget.style.backgroundColor = '#003d6b';
                e.currentTarget.style.transform = 'scale(1.1)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isDragging) {
                e.currentTarget.style.backgroundColor = colors.primary;
                e.currentTarget.style.transform = 'scale(1)';
              }
            }}
            title={hasMultipleMeals 
              ? `${MEAL_TYPE_ABBREVIATIONS[mealType]}: ${mealCount} meals - Tap to select`
              : `${MEAL_TYPE_ABBREVIATIONS[mealType]}: ${mealsOfType[0].dishes?.[0]?.dishName || 'Tap to view'}`
            }
          >
            {MEAL_TYPE_ABBREVIATIONS[mealType]}
            {hasMultipleMeals && (
              <span
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  width: '14px',
                  height: '14px',
                  borderRadius: '50%',
                  backgroundColor: colors.error,
                  color: colors.white,
                  fontSize: '0.6rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `1px solid ${colors.white}`
                }}
              >
                {mealCount}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};
