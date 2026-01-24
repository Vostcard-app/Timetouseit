/**
 * Meal Selection Modal
 * Shows list of meals for a specific date and meal type when multiple meals exist
 */

import React from 'react';
import type { MealType, PlannedMeal } from '../../types';
import { format } from 'date-fns';

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
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '2rem',
          maxWidth: '600px',
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600', color: '#1f2937' }}>
              {MEAL_TYPE_LABELS[mealType]}
            </h2>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#6b7280' }}>
              {format(date, 'EEEE, MMMM d, yyyy')}
            </p>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#6b7280' }}>
              {meals.length} meal{meals.length !== 1 ? 's' : ''} planned
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#6b7280',
              padding: '0.25rem 0.5rem'
            }}
          >
            ×
          </button>
        </div>

        {/* Meals List */}
        {meals.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: '#6b7280' }}>
            <p style={{ margin: 0, fontSize: '1rem' }}>No meals planned</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
            {meals.map((meal) => {
              const dishes = meal.dishes || [];
              return (
                <div
                  key={meal.id}
                  onClick={() => onMealClick(meal)}
                  style={{
                    padding: '1.25rem',
                    backgroundColor: '#f9fafb',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f3f4f6';
                    e.currentTarget.style.borderColor = '#002B4D';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                    e.currentTarget.style.borderColor = '#e5e7eb';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      {dishes.length === 0 ? (
                        <p style={{ margin: 0, fontSize: '1rem', color: '#9ca3af', fontStyle: 'italic' }}>
                          No dishes planned
                        </p>
                      ) : dishes.length === 1 ? (
                        <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600', color: '#1f2937' }}>
                          {dishes[0].dishName}
                        </h3>
                      ) : (
                        <div>
                          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: '600', color: '#6b7280' }}>
                            {dishes.length} dishes
                          </h3>
                          <ul style={{ margin: 0, paddingLeft: '1.5rem', listStyle: 'disc' }}>
                            {dishes.map((dish) => (
                              <li key={dish.id} style={{ fontSize: '0.875rem', color: '#1f2937', marginBottom: '0.25rem' }}>
                                {dish.dishName}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {dishes.length > 0 && (
                        <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#6b7280' }}>
                          {dishes.reduce((total, dish) => total + (dish.recipeIngredients?.length || 0), 0)} total ingredient{dishes.reduce((total, dish) => total + (dish.recipeIngredients?.length || 0), 0) !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                    {dishes.length > 1 && (
                      <span
                        style={{
                          fontSize: '0.75rem',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '12px',
                          fontWeight: '600',
                          backgroundColor: '#002B4D',
                          color: '#ffffff',
                          marginLeft: '1rem'
                        }}
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

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#f3f4f6',
              color: '#1f2937',
              border: 'none',
              borderRadius: '6px',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
