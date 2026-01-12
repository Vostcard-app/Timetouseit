/**
 * Save Dish Modal
 * Modal for saving a dish with dish name, ingredient selection, shopping list, and reservation options
 */

import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../firebase/firebaseConfig';
import type { MealType, FoodItem, ShoppingListItem } from '../../types';
import { useIngredientAvailability } from '../../hooks/useIngredientAvailability';
import { showToast } from '../Toast';

interface SaveDishModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    dishName: string;
    ingredients: string[];
    ingredientsToReserve: string[];
    ingredientsForShoppingList: string[];
    additionalIngredients: string[];
    targetListId: string;
  }) => Promise<void>;
  ingredients: string[];
  selectedDate: Date;
  mealType: MealType;
  recipeUrl?: string | null;
  importedRecipeTitle?: string | null;
}

export const SaveDishModal: React.FC<SaveDishModalProps> = ({
  isOpen,
  onClose,
  onSave,
  ingredients,
  selectedDate,
  mealType,
  recipeUrl,
  importedRecipeTitle
}) => {
  const [user] = useAuthState(auth);
  const [dishName, setDishName] = useState('');
  const [selectedForShoppingList, setSelectedForShoppingList] = useState<Set<number>>(new Set());
  const [selectedToReserve, setSelectedToReserve] = useState<Set<number>>(new Set());
  const [additionalIngredients, setAdditionalIngredients] = useState<string[]>([]);
  const [newIngredient, setNewIngredient] = useState('');
  const [saving, setSaving] = useState(false);

  // Combine original ingredients with additional ones
  const allIngredients = [...ingredients, ...additionalIngredients];

  // Use ingredient availability hook
  const {
    ingredientStatuses,
    loading: loadingIngredients,
    userShoppingLists,
    targetListId,
    setTargetListId
  } = useIngredientAvailability(
    allIngredients,
    { isOpen: isOpen && allIngredients.length > 0 }
  );

  // Reset state when modal closes or initialize dish name from imported recipe
  useEffect(() => {
    if (!isOpen) {
      setDishName('');
      setSelectedForShoppingList(new Set());
      setSelectedToReserve(new Set());
      setAdditionalIngredients([]);
      setNewIngredient('');
      setSaving(false);
    } else if (importedRecipeTitle && !dishName.trim()) {
      // Initialize dish name from imported recipe if available
      setDishName(importedRecipeTitle);
    }
  }, [isOpen, importedRecipeTitle]);

  // Set default selections for shopping list (missing items)
  useEffect(() => {
    if (ingredientStatuses.length === 0 || selectedForShoppingList.size > 0) return;
    
    const missingIndices = ingredientStatuses
      .filter(item => item.status === 'missing')
      .map(item => item.index);
    
    if (missingIndices.length > 0) {
      setSelectedForShoppingList(new Set(missingIndices));
    }
  }, [ingredientStatuses.length]);

  // Set default selections for reservation (available items)
  useEffect(() => {
    if (ingredientStatuses.length === 0 || selectedToReserve.size > 0) return;
    
    const availableIndices = ingredientStatuses
      .filter(item => item.status === 'available' || item.status === 'partial')
      .map(item => item.index);
    
    if (availableIndices.length > 0) {
      setSelectedToReserve(new Set(availableIndices));
    }
  }, [ingredientStatuses.length]);

  const toggleShoppingList = (index: number) => {
    const newSelected = new Set(selectedForShoppingList);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedForShoppingList(newSelected);
  };

  const toggleReserve = (index: number) => {
    const newSelected = new Set(selectedToReserve);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedToReserve(newSelected);
  };

  const handleAddIngredient = () => {
    if (!newIngredient.trim()) {
      showToast('Please enter an ingredient name', 'warning');
      return;
    }

    const trimmed = newIngredient.trim();
    if (allIngredients.includes(trimmed)) {
      showToast('This ingredient is already in the list', 'warning');
      return;
    }

    setAdditionalIngredients([...additionalIngredients, trimmed]);
    setNewIngredient('');
  };

  const handleSave = async () => {
    if (!dishName.trim()) {
      showToast('Please enter a dish name', 'error');
      return;
    }

    if (selectedForShoppingList.size > 0 && !targetListId) {
      showToast('Please select a shopping list to add ingredients', 'error');
      return;
    }

    setSaving(true);
    try {
      const ingredientsToReserve = Array.from(selectedToReserve)
        .map(index => allIngredients[index])
        .filter(Boolean);

      const ingredientsForShoppingList = Array.from(selectedForShoppingList)
        .map(index => allIngredients[index])
        .filter(Boolean);

      await onSave({
        dishName: dishName.trim(),
        ingredients: allIngredients,
        ingredientsToReserve,
        ingredientsForShoppingList,
        additionalIngredients,
        targetListId: targetListId || ''
      });
    } catch (error) {
      console.error('Error saving dish:', error);
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1005,
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
          maxWidth: '700px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600' }}>Save Dish</h2>
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
          {/* Dish Name */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="dishName" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>
              Dish Name <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              id="dishName"
              type="text"
              value={dishName}
              onChange={(e) => setDishName(e.target.value)}
              placeholder="e.g., Homemade Tortilla Soup"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '1rem',
                color: '#1f2937',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Ingredients List */}
          {allIngredients.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem', fontWeight: '600', color: '#1f2937' }}>
                Ingredients ({allIngredients.length})
              </h3>
              
              {loadingIngredients ? (
                <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '0.875rem' }}>Checking ingredient availability...</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {ingredientStatuses.map((item) => {
                    const ingredient = allIngredients[item.index];
                    const isAvailable = item.status === 'available' || item.status === 'partial';
                    const isMissing = item.status === 'missing';
                    
                    return (
                      <div
                        key={item.index}
                        style={{
                          padding: '1rem',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                          backgroundColor: '#f9fafb'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                          <span style={{ fontSize: '1rem', fontWeight: '500', color: '#1f2937' }}>
                            {ingredient}
                          </span>
                          <span style={{
                            fontSize: '0.75rem',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '12px',
                            fontWeight: '500',
                            backgroundColor: isAvailable ? '#d1fae5' : isMissing ? '#fee2e2' : '#fef3c7',
                            color: isAvailable ? '#065f46' : isMissing ? '#991b1b' : '#92400e'
                          }}>
                            {item.status === 'available' ? 'Available' : item.status === 'partial' ? 'Partial' : 'Missing'}
                          </span>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '1.5rem' }}>
                          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={selectedForShoppingList.has(item.index)}
                              onChange={() => toggleShoppingList(item.index)}
                              style={{
                                marginRight: '0.5rem',
                                width: '1.25rem',
                                height: '1.25rem',
                                cursor: 'pointer'
                              }}
                            />
                            <span style={{ fontSize: '0.875rem', color: '#374151' }}>Add to Shopping List</span>
                          </label>
                          
                          {isAvailable && (
                            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={selectedToReserve.has(item.index)}
                                onChange={() => toggleReserve(item.index)}
                                style={{
                                  marginRight: '0.5rem',
                                  width: '1.25rem',
                                  height: '1.25rem',
                                  cursor: 'pointer'
                                }}
                              />
                              <span style={{ fontSize: '0.875rem', color: '#374151' }}>Reserve from My Ingredients</span>
                            </label>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Shopping List Selection */}
          {selectedForShoppingList.size > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', fontSize: '0.875rem' }}>
                Add selected to shopping list:
              </label>
              <select
                value={targetListId || ''}
                onChange={(e) => setTargetListId(e.target.value)}
                disabled={loadingIngredients}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  backgroundColor: loadingIngredients ? '#f3f4f6' : '#ffffff'
                }}
              >
                <option value="">Select a shopping list...</option>
                {userShoppingLists.map(list => (
                  <option key={list.id} value={list.id}>
                    {list.name} {list.isDefault ? '(Default)' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Add Ingredient */}
          <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>
              Add Ingredient
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                value={newIngredient}
                onChange={(e) => setNewIngredient(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddIngredient();
                  }
                }}
                placeholder="Enter ingredient name"
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  color: '#1f2937'
                }}
              />
              <button
                onClick={handleAddIngredient}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#002B4D',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ 
          padding: '1.5rem', 
          borderTop: '1px solid #e5e7eb', 
          display: 'flex', 
          gap: '0.75rem', 
          justifyContent: 'flex-end' 
        }}>
          <button
            onClick={onClose}
            disabled={saving}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#f3f4f6',
              color: '#1f2937',
              border: 'none',
              borderRadius: '6px',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.5 : 1
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!dishName.trim() || saving || (selectedForShoppingList.size > 0 && !targetListId)}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: (!dishName.trim() || saving || (selectedForShoppingList.size > 0 && !targetListId)) ? '#9ca3af' : '#002B4D',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: (!dishName.trim() || saving || (selectedForShoppingList.size > 0 && !targetListId)) ? 'not-allowed' : 'pointer'
            }}
          >
            {saving ? 'Saving...' : 'Save Dish'}
          </button>
        </div>
      </div>
    </div>
  );
};
