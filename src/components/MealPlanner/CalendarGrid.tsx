/**
 * Calendar Grid Component
 * Month view grid with day cells
 */

import React from 'react';
import { eachDayOfInterval, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import type { MealType, PlannedMeal } from '../../types';
import { CalendarDayCell } from './CalendarDayCell';
import { spacing, colors, borderRadius } from '../../styles/designTokens';

interface CalendarGridProps {
  currentDate: Date;
  allPlannedMeals: PlannedMeal[];
  isDragging: boolean;
  draggedMeal: { meal: PlannedMeal; sourceDate: Date } | null;
  dragOverDate: Date | null;
  dragOverMealType: MealType | null;
  onDayClick: (date: Date) => void;
  onMealTypeClick: (date: Date, mealType: MealType, event: React.MouseEvent) => void;
  onDragOver: (date: Date, mealType: MealType, e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (date: Date, mealType: MealType, e: React.DragEvent) => void;
  canDropMeal: (date: Date, mealType: MealType) => boolean;
  getMealsForDay: (date: Date) => PlannedMeal[];
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  currentDate,
  allPlannedMeals,
  isDragging,
  draggedMeal,
  dragOverDate,
  dragOverMealType,
  onDayClick,
  onMealTypeClick,
  onDragOver,
  onDragLeave,
  onDrop,
  canDropMeal,
  getMealsForDay
}) => {
  // Generate calendar days for current month
  const monthCalendarDays = React.useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentDate]);

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', 
      gap: '0.25rem',
      border: `1px solid ${colors.gray[200]}`,
      borderRadius: borderRadius.lg,
      padding: '0.25rem',
      backgroundColor: colors.white,
      width: '100%',
      boxSizing: 'border-box',
      overflowX: 'auto'
    }}>
      {/* Day Headers */}
      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
        <div
          key={day}
          style={{
            padding: `${spacing.sm} 0.25rem`,
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
      {monthCalendarDays.map((day, index) => {
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
