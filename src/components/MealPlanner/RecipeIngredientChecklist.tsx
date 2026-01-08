/**
 * Recipe Ingredient Checklist Component
 * Displays recipe ingredients with pantry matching and shopping list integration
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../firebase/firebaseConfig';
import { foodItemService } from '../../services';
import { recipeImportService } from '../../services';
import { shoppingListService, shoppingListsService } from '../../services';
import type { FoodItem, ShoppingListItem } from '../../types';
import { showToast } from '../Toast';

interface RecipeIngredientChecklistProps {
  ingredients: string[];
  mealId?: string;
  onClose: () => void;
}

export const RecipeIngredientChecklist: React.FC<RecipeIngredientChecklistProps> = ({
  ingredients,
  mealId,
  onClose
}) => {
  const [user] = useAuthState(auth);
  const [pantryItems, setPantryItems] = useState<FoodItem[]>([]);
  const [shopListItems, setShopListItems] = useState<ShoppingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIngredients, setSelectedIngredients] = useState<Set<number>>(new Set());
  const [addingToShoppingList, setAddingToShoppingList] = useState(false);
  const [targetListId, setTargetListId] = useState<string | null>(null);
  const [userShoppingLists, setUserShoppingLists] = useState<any[]>([]);

  // Load pantry items (dashboard items)
  useEffect(() => {
    if (!user) return;

    const unsubscribe = foodItemService.subscribeToFoodItems(user.uid, (items) => {
      setPantryItems(items);
    });

    return () => unsubscribe();
  }, [user]);

  // Load shopping lists and default shop list items
  useEffect(() => {
    if (!user) return;

    const loadShoppingLists = async () => {
      try {
        const lists = await shoppingListsService.getShoppingLists(user.uid);
        setUserShoppingLists(lists);
        
        // Set default list
        const defaultList = lists.find(list => list.isDefault) || lists[0];
        if (defaultList) {
          setTargetListId(defaultList.id);
          
          // Load shop list items
          const items = await shoppingListService.getShoppingListItems(user.uid, defaultList.id);
          // Only include non-crossed-off items
          setShopListItems(items.filter(item => !item.crossedOff));
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading shopping lists:', error);
        setLoading(false);
      }
    };

    loadShoppingLists();
  }, [user]);

  // Combine pantry items and shop list items for checking
  const allAvailableItems = useMemo(() => {
    const combined: FoodItem[] = [...pantryItems];
    // Add shop list items as FoodItem-like objects
    shopListItems.forEach(item => {
      combined.push({
        id: item.id,
        name: item.name
      } as FoodItem);
    });
    return combined;
  }, [pantryItems, shopListItems]);

  // Check ingredient availability against both pantry and shop list
  // Filter out ingredients that exist in either, showing only missing ones
  const filteredIngredients = useMemo(() => {
    return ingredients
      .map((ingredient, index) => {
        // Check against combined list (pantry + shop list)
        const status = recipeImportService.checkIngredientAvailability(ingredient, allAvailableItems);
        
        // Ingredient is available if it's found in pantry OR shop list
        const isAvailable = status === 'have';
        
        return {
          ingredient,
          index,
          isAvailable,
          originalIndex: index
        };
      })
      .filter(item => !item.isAvailable); // Only show missing ingredients
  }, [ingredients, allAvailableItems]);

  // Check ingredient availability for display (for the filtered list)
  const ingredientStatus = useMemo(() => {
    return filteredIngredients.map((item) => {
      // All items in filtered list are missing (we filtered out available ones)
      return { ingredient: item.ingredient, status: 'missing' as const, originalIndex: item.originalIndex };
    });
  }, [filteredIngredients]);

  // Set default selections (all filtered ingredients are missing, so select all)
  useEffect(() => {
    if (loading || selectedIngredients.size > 0) return;

    const missingIndices = ingredientStatus.map(item => item.originalIndex);
    setSelectedIngredients(new Set(missingIndices));
  }, [ingredientStatus, loading]);

  const toggleIngredient = (index: number) => {
    const newSelected = new Set(selectedIngredients);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedIngredients(newSelected);
  };

  const handleAddToShoppingList = async () => {
    if (!user || !targetListId) {
      showToast('Please select a shopping list', 'error');
      return;
    }

    const selectedItems = Array.from(selectedIngredients)
      .map(index => ingredients[index])
      .filter(Boolean);

    if (selectedItems.length === 0) {
      showToast('Please select at least one ingredient', 'error');
      return;
    }

    if (ingredientStatus.length === 0) {
      showToast('All ingredients are already available', 'info');
      onClose();
      return;
    }

    setAddingToShoppingList(true);

    try {
      // Add each selected ingredient to the shopping list
      for (const ingredient of selectedItems) {
        await shoppingListService.addShoppingListItem(
          user.uid,
          targetListId,
          ingredient,
          false,
          'recipe_import',
          mealId
        );
      }

      showToast(`Added ${selectedItems.length} ingredient(s) to shopping list`, 'success');
      onClose();
    } catch (error) {
      console.error('Error adding ingredients to shopping list:', error);
      showToast('Failed to add ingredients to shopping list', 'error');
    } finally {
      setAddingToShoppingList(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Loading pantry items...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem', maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: '600' }}>
        Add Ingredients to Shopping List
      </h2>

      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
          Select Shopping List:
        </label>
        <select
          value={targetListId || ''}
          onChange={(e) => setTargetListId(e.target.value)}
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '1rem'
          }}
        >
          <option value="">Select a list...</option>
          {userShoppingLists.map(list => (
            <option key={list.id} value={list.id}>
              {list.name} {list.isDefault ? '(Default)' : ''}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <p style={{ marginBottom: '1rem', color: '#6b7280', fontSize: '0.875rem' }}>
          Select ingredients to add to your shopping list. Items already in your dashboard or shop list have been filtered out.
        </p>
        {ingredientStatus.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#f9fafb', borderRadius: '6px' }}>
            <p style={{ color: '#6b7280', margin: 0 }}>
              All ingredients are already available in your dashboard or shop list!
            </p>
          </div>
        ) : (
          <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '0.5rem' }}>
            {ingredientStatus.map(({ ingredient, originalIndex }) => (
              <label
                key={originalIndex}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.75rem',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  marginBottom: '0.25rem',
                  backgroundColor: selectedIngredients.has(originalIndex) ? '#f3f4f6' : 'transparent',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!selectedIngredients.has(originalIndex)) {
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!selectedIngredients.has(originalIndex)) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedIngredients.has(originalIndex)}
                  onChange={() => toggleIngredient(originalIndex)}
                  style={{
                    marginRight: '0.75rem',
                    width: '1.25rem',
                    height: '1.25rem',
                    cursor: 'pointer'
                  }}
                />
                <span style={{ flex: 1, fontSize: '1rem' }}>{ingredient}</span>
                <span
                  style={{
                    fontSize: '0.875rem',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    fontWeight: '500',
                    backgroundColor: '#fee2e2',
                    color: '#991b1b'
                  }}
                >
                  Missing
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
        <button
          onClick={onClose}
          disabled={addingToShoppingList}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#f3f4f6',
            color: '#1f2937',
            border: 'none',
            borderRadius: '6px',
            fontSize: '1rem',
            fontWeight: '500',
            cursor: addingToShoppingList ? 'not-allowed' : 'pointer',
            opacity: addingToShoppingList ? 0.5 : 1
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleAddToShoppingList}
          disabled={addingToShoppingList || !targetListId || selectedIngredients.size === 0}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: addingToShoppingList || !targetListId || selectedIngredients.size === 0 ? '#9ca3af' : '#002B4D',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '1rem',
            fontWeight: '500',
            cursor: addingToShoppingList || !targetListId || selectedIngredients.size === 0 ? 'not-allowed' : 'pointer'
          }}
        >
          {addingToShoppingList ? 'Adding...' : `Add ${selectedIngredients.size} Item(s)`}
        </button>
      </div>
    </div>
  );
};

