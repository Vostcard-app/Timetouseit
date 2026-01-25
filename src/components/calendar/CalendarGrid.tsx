/**
 * Calendar Grid Component
 * Month view grid with day headers and cells
 */

import React from 'react';
import type { MealType, PlannedMeal } from '../../types';
import { CalendarDayCell } from './CalendarDayCell';
import { colors, spacing, borderRadius } from '../../styles/designTokens';

interface CalendarGridProps {
  currentDate: Date;
  monthDays: Date[];
  mealsByDay: Map<string, PlannedMeal[]>;
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

const DAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  currentDate,
  monthDays,
  mealsByDay,
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
  const getMealsForDay = (day: Date): PlannedMeal[] => {
    const dayKey = day.toISOString().split('T')[0];
    return mealsByDay.get(dayKey) || [];
  };

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', 
      gap: spacing.xs,
      border: `1px solid ${colors.gray[200]}`,
      borderRadius: borderRadius.lg,
      padding: spacing.xs,
      backgroundColor: colors.white,
      width: '100%',
      boxSizing: 'border-box',
      overflowX: 'auto'
    }}>
      {/* Day Headers */}
      {DAY_HEADERS.map(day => (
        <div
          key={day}
          style={{
            padding: `${spacing.sm} ${spacing.xs}`,
            textAlign: 'center',
            fontWeight: 600,
            fontSize: '0.75rem',
            color: colors.gray[500],
            borderBottom: `1px solid ${colors.gray[200]}`,
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {day}
        </div>
      ))}

      {/* Calendar Days */}
      {monthDays.map((day, index) => {
        const dayMeals = getMealsForDay(day);
        
        return (
          <CalendarDayCell
            key={index}
            day={day}
            currentDate={currentDate}
            meals={dayMeals}
            isDragging={isDragging}
            draggedMeal={draggedMeal}
            dragOverDate={dragOverDate}
            dragOverMealType={dragOverMealType}
            onDayClick={onDayClick}
            onMealTypeClick={onMealTypeClick}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            canDropMeal={canDropMeal}
          />
        );
      })}
    </div>
  );
};
