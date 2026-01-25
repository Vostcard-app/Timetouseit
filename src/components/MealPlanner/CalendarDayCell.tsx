/**
 * Calendar Day Cell Component
 * Individual day cell in the calendar grid
 */

import React from 'react';
import { format, isSameDay, startOfDay } from 'date-fns';
import type { MealType, PlannedMeal } from '../../types';
import { CalendarMealBadges } from './CalendarMealBadges';

interface CalendarDayCellProps {
  day: Date;
  currentDate: Date;
  meals: PlannedMeal[];
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
}

export const CalendarDayCell: React.FC<CalendarDayCellProps> = ({
  day,
  currentDate,
  meals,
  isDragging,
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
  
  return (
    <div
      onClick={() => {
        if (!isDragging) {
          onDayClick(normalizedDay);
        }
      }}
      onDragOver={(e) => {
        // Handle drag over for each meal type
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
        padding: '0.25rem',
        border: isDropTarget ? '2px solid #10b981' : (isInvalidDrop ? '2px solid #ef4444' : '1px solid #e5e7eb'),
        borderRadius: '4px',
        backgroundColor: isDropTarget ? '#f0fdf4' : (isInvalidDrop ? '#fef2f2' : (isToday ? '#f0f8ff' : (isCurrentMonth ? '#ffffff' : '#f9fafb'))),
        cursor: isDragging ? (isDropTarget ? 'copy' : (isInvalidDrop ? 'not-allowed' : 'pointer')) : 'pointer',
        transition: 'all 0.2s',
        position: 'relative',
        opacity: isCurrentMonth ? 1 : 0.5,
        minWidth: 0,
        overflow: 'hidden'
      }}
      onMouseEnter={(e) => {
        if (!isDragging) {
          e.currentTarget.style.backgroundColor = isToday ? '#e0f2fe' : (isCurrentMonth ? '#f3f4f6' : '#f9fafb');
          e.currentTarget.style.borderColor = '#002B4D';
        }
      }}
      onMouseLeave={(e) => {
        if (!isDragging) {
          e.currentTarget.style.backgroundColor = isToday ? '#f0f8ff' : (isCurrentMonth ? '#ffffff' : '#f9fafb');
          e.currentTarget.style.borderColor = '#e5e7eb';
        }
      }}
    >
      <div style={{
        fontSize: '0.75rem',
        fontWeight: isToday ? 700 : (isCurrentMonth ? 500 : 400),
        color: isCurrentMonth ? '#1f2937' : '#9ca3af',
        marginBottom: '0.25rem'
      }}>
        {format(day, 'd')}
      </div>
      
      {/* Meal Indicators - Tappable Letters */}
      {meals.length > 0 && (
        <CalendarMealBadges
          meals={meals}
          date={normalizedDay}
          isDragging={isDragging}
          onMealTypeClick={onMealTypeClick}
        />
      )}
      
      {/* Drop zone indicators for empty meal types */}
      {isDragging && draggedMeal && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.25rem' }}>
          {(['breakfast', 'lunch', 'dinner'] as MealType[]).map(mealType => {
            const hasMealOfType = meals.some(m => m.mealType === mealType);
            // Only show drop zone if this meal type is empty and matches the dragged meal type
            if (hasMealOfType || mealType !== draggedMeal.meal.mealType) return null;
            
            const isTarget = dragOverDate && isSameDay(dragOverDate, normalizedDay) && dragOverMealType === mealType;
            
            const MEAL_TYPE_ABBREVIATIONS: Record<MealType, string> = {
              breakfast: 'B',
              lunch: 'L',
              dinner: 'D'
            };
            
            return (
              <div
                key={mealType}
                style={{
                  fontSize: '0.75rem',
                  padding: '0.25rem 0.5rem',
                  backgroundColor: isTarget ? '#10b981' : '#e5e7eb',
                  color: isTarget ? '#ffffff' : '#9ca3af',
                  borderRadius: '4px',
                  border: isTarget ? '2px dashed #10b981' : '1px dashed #d1d5db',
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
