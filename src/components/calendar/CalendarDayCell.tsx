/**
 * Calendar Day Cell Component
 * Individual day cell in the calendar grid
 */

import React from 'react';
import { format, isSameDay, startOfDay } from 'date-fns';
import type { MealType, PlannedMeal } from '../../types';
import { CalendarMealBadges } from './CalendarMealBadges';
import { colors, spacing, borderRadius } from '../../styles/designTokens';
import { combineStyles, textStyles } from '../../styles/componentStyles';

interface CalendarDayCellProps {
  day: Date;
  currentDate: Date;
  meals: PlannedMeal[];
  isDragging?: boolean;
  draggedMeal?: { meal: PlannedMeal; sourceDate: Date } | null;
  dragOverDate?: Date | null;
  dragOverMealType?: MealType | null;
  onDayClick: (date: Date) => void;
  onMealTypeClick: (date: Date, mealType: MealType, event: React.MouseEvent) => void;
  onDragOver: (date: Date, mealType: MealType, e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (date: Date, mealType: MealType, e: React.DragEvent) => void;
  canDropMeal: (date: Date, mealType: MealType) => boolean;
}

export const CalendarDayCell: React.FC<CalendarDayCellProps> = ({
  day,
  currentDate,
  meals,
  isDragging = false,
  draggedMeal,
  dragOverDate,
  dragOverMealType,
  onDayClick,
  onMealTypeClick,
  onDragOver,
  onDragLeave,
  onDrop,
  canDropMeal
}) => {
  const normalizedDay = startOfDay(day);
  const isToday = isSameDay(normalizedDay, startOfDay(new Date()));
  const isCurrentMonth = (
    normalizedDay.getMonth() === currentDate.getMonth() && 
    normalizedDay.getFullYear() === currentDate.getFullYear()
  );
  
  // Check if this day is a valid drop target for each meal type
  const canDropBreakfast = isDragging && draggedMeal && canDropMeal(normalizedDay, 'breakfast');
  const canDropLunch = isDragging && draggedMeal && canDropMeal(normalizedDay, 'lunch');
  const canDropDinner = isDragging && draggedMeal && canDropMeal(normalizedDay, 'dinner');
  const isDropTarget = canDropBreakfast || canDropLunch || canDropDinner;
  const isInvalidDrop = isDragging && draggedMeal && !isDropTarget && 
    (dragOverDate && isSameDay(dragOverDate, normalizedDay));

  const MEAL_TYPE_ABBREVIATIONS: Record<MealType, string> = {
    breakfast: 'B',
    lunch: 'L',
    dinner: 'D'
  };

  return (
    <div
      onClick={() => {
        if (!isDragging) {
          onDayClick(normalizedDay);
        }
      }}
      onDragOver={(e) => {
        if (isDragging && draggedMeal) {
          const mealType = draggedMeal.meal.mealType;
          onDragOver(normalizedDay, mealType, e);
        }
      }}
      onDragLeave={onDragLeave}
      onDrop={(e) => {
        if (isDragging && draggedMeal) {
          const mealType = draggedMeal.meal.mealType;
          onDrop(normalizedDay, mealType, e);
        }
      }}
      style={{
        minHeight: '80px',
        padding: spacing.xs,
        border: isDropTarget ? `2px solid ${colors.success}` : (isInvalidDrop ? `2px solid ${colors.error}` : `1px solid ${colors.gray[200]}`),
        borderRadius: borderRadius.sm,
        backgroundColor: isDropTarget ? colors.statusBg.bestBySoon : (isInvalidDrop ? '#fef2f2' : (isToday ? '#f0f8ff' : (isCurrentMonth ? colors.white : colors.gray[50]))),
        cursor: isDragging ? (isDropTarget ? 'copy' : (isInvalidDrop ? 'not-allowed' : 'pointer')) : 'pointer',
        transition: 'all 0.2s',
        position: 'relative',
        opacity: isCurrentMonth ? 1 : 0.5,
        minWidth: 0,
        overflow: 'hidden'
      }}
      onMouseEnter={(e) => {
        if (!isDragging) {
          e.currentTarget.style.backgroundColor = isToday ? '#e0f2fe' : (isCurrentMonth ? colors.gray[100] : colors.gray[50]);
          e.currentTarget.style.borderColor = colors.primary;
        }
      }}
      onMouseLeave={(e) => {
        if (!isDragging) {
          e.currentTarget.style.backgroundColor = isToday ? '#f0f8ff' : (isCurrentMonth ? colors.white : colors.gray[50]);
          e.currentTarget.style.borderColor = colors.gray[200];
        }
      }}
    >
      <div style={combineStyles(
        textStyles.bodySmall,
        {
          fontSize: '0.75rem',
          fontWeight: isToday ? 700 : (isCurrentMonth ? 500 : 400),
          color: isCurrentMonth ? colors.gray[900] : colors.gray[400],
          marginBottom: spacing.xs
        }
      )}>
        {format(day, 'd')}
      </div>
      
      {/* Meal Indicators */}
      {meals.length > 0 && (
        <CalendarMealBadges
          meals={meals}
          onMealTypeClick={(mealType, event) => onMealTypeClick(normalizedDay, mealType, event)}
          isDragging={isDragging}
        />
      )}
      
      {/* Drop zone indicators for empty meal types */}
      {isDragging && draggedMeal && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs, marginTop: spacing.xs }}>
          {(['breakfast', 'lunch', 'dinner'] as MealType[]).map(mealType => {
            const hasMealOfType = meals.some(m => m.mealType === mealType);
            if (hasMealOfType || mealType !== draggedMeal.meal.mealType) return null;
            
            const isTarget = dragOverDate && isSameDay(dragOverDate, normalizedDay) && dragOverMealType === mealType;
            
            return (
              <div
                key={mealType}
                style={{
                  fontSize: '0.75rem',
                  padding: `${spacing.xs} ${spacing.sm}`,
                  backgroundColor: isTarget ? colors.success : colors.gray[200],
                  color: isTarget ? colors.white : colors.gray[500],
                  borderRadius: borderRadius.sm,
                  border: isTarget ? `2px dashed ${colors.success}` : `1px dashed ${colors.gray[300]}`,
                  textAlign: 'center',
                  opacity: isTarget ? 1 : 0.5
                }}
              >
                Drop {MEAL_TYPE_ABBREVIATIONS[mealType]} here
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
