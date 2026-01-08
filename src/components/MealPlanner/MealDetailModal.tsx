/**
 * Meal Detail Modal
 * Displays meal information with recipe link, ingredients, edit and delete functionality
 */

import React, { useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../firebase/firebaseConfig';
import { mealPlanningService, shoppingListService } from '../../services';
import type { PlannedMeal, MealType } from '../../types';
import { showToast } from '../Toast';
import { format } from 'date-fns';

interface MealDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  meal: PlannedMeal | null;
  onMealDeleted?: () => void; // Callback to refresh calendar
}

const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner'
};

export const MealDetailModal: React.FC<MealDetailModalProps> = ({
  isOpen,
  onClose,
  meal,
  onMealDeleted
}) => {
  const [user] = useAuthState(auth);
  const [deleting, setDeleting] = useState(false);

  if (!isOpen || !meal) return null;

  const handleDelete = async () => {
    if (!user || !meal) {
      showToast('Please log in to delete meals', 'error');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete "${meal.recipeTitle || meal.mealName}"? This will also remove associated ingredients from your shopping list.`)) {
      return;
    }

    setDeleting(true);
    try {
      // Delete all shopping list items associated with this meal
      await shoppingListService.deleteShoppingListItemsByMealId(user.uid, meal.id);

      // Get the meal plan for this week
      const weekStart = new Date(meal.date);
      weekStart.setDate(meal.date.getDate() - meal.date.getDay()); // Start of week (Sunday)
      weekStart.setHours(0, 0, 0, 0);

      const mealPlan = await mealPlanningService.getMealPlan(user.uid, weekStart);
      
      if (mealPlan) {
        // Remove the meal from the plan
        const updatedMeals = mealPlan.meals.filter(m => m.id !== meal.id);
        await mealPlanningService.updateMealPlan(mealPlan.id, { meals: updatedMeals });
      }

      showToast('Meal deleted successfully', 'success');
      onMealDeleted?.(); // Refresh calendar
      onClose();
    } catch (error) {
      console.error('Error deleting meal:', error);
      showToast('Failed to delete meal. Please try again.', 'error');
      setDeleting(false);
    }
  };

  const handleEdit = () => {
    // Placeholder for edit functionality
    showToast('Edit functionality coming soon', 'info');
  };

  const displayName = meal.recipeTitle || meal.mealName;
  const ingredients = meal.recipeIngredients || meal.suggestedIngredients || [];

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
        zIndex: 1003,
        padding: '1rem'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          maxWidth: '600px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600' }}>
            {MEAL_TYPE_LABELS[meal.mealType]}
          </h2>
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

        {/* Content */}
        <div style={{ padding: '1.5rem' }}>
          {/* Meal Name */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600', color: '#1f2937' }}>
              {displayName}
            </h3>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#6b7280' }}>
              {format(meal.date, 'EEEE, MMMM d, yyyy')}
            </p>
          </div>

          {/* Recipe Link */}
          {meal.recipeSourceUrl && (
            <div style={{ marginBottom: '1.5rem' }}>
              <a
                href={meal.recipeSourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-block',
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#002B4D',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                View Recipe: {displayName}
              </a>
            </div>
          )}

          {/* Ingredients */}
          {ingredients.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ marginBottom: '0.75rem', fontSize: '1rem', fontWeight: '600', color: '#1f2937' }}>
                Ingredients ({ingredients.length})
              </h4>
              <div style={{ 
                border: '1px solid #e5e7eb', 
                borderRadius: '6px', 
                padding: '0.75rem',
                maxHeight: '300px',
                overflowY: 'auto',
                backgroundColor: '#f9fafb'
              }}>
                <ul style={{ margin: 0, paddingLeft: '1.5rem', listStyle: 'disc' }}>
                  {ingredients.map((ingredient, index) => (
                    <li key={index} style={{ marginBottom: '0.5rem', fontSize: '0.875rem', color: '#1f2937' }}>
                      {ingredient}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button
              onClick={handleEdit}
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
              Edit
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: deleting ? '#9ca3af' : '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: deleting ? 'not-allowed' : 'pointer'
              }}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
