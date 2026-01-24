/**
 * Recipe Import Service
 * Handles recipe import from URLs and recipe site management
 */

import type { RecipeSite, RecipeImportResult } from '../types/recipeImport';
import type { FoodItem, ShoppingListItem, PlannedMeal } from '../types';
import { recipeSiteService } from './recipeSiteService';
import { foodItemService } from './foodItemService';
import { shoppingListService } from './shoppingListService';
import { userSettingsService } from './userSettingsService';
import { logServiceOperation, logServiceError } from './baseService';
import { parseIngredientQuantity, normalizeItemName } from '../utils/ingredientQuantityParser';

/**
 * Recipe Import Service
 */
export const recipeImportService = {
  /**
   * Import recipe from URL
   * @param url - Recipe URL to import
   * @param userId - Optional user ID to check premium status
   */
  async importRecipe(url: string, userId?: string): Promise<RecipeImportResult> {
    logServiceOperation('importRecipe', 'recipeImport', { url, userId });

    try {
      // Check premium status if userId provided
      let isPremium = false;
      if (userId) {
        try {
          isPremium = await userSettingsService.isPremiumUser(userId);
        } catch (error) {
          console.error('Error checking premium status:', error);
          // Continue with non-premium flow if check fails
        }
      }

      const response = await fetch('/.netlify/functions/recipe-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          url,
          userId: userId || null,
          isPremium 
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Failed to import recipe: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      logServiceError('importRecipe', 'recipeImport', error, { url, userId });
      throw error;
    }
  },

  /**
   * Get all recipe sites
   */
  async getRecipeSites(): Promise<RecipeSite[]> {
    return recipeSiteService.getRecipeSites();
  },

  /**
   * Get enabled recipe sites only
   */
  async getEnabledRecipeSites(): Promise<RecipeSite[]> {
    return recipeSiteService.getEnabledRecipeSites();
  },

  /**
   * Build search URL for a recipe site
   */
  buildSearchUrl(site: RecipeSite, query: string): string {
    // If no search template URL or no {query} placeholder, just return base URL
    if (!site.searchTemplateUrl || !site.searchTemplateUrl.includes('{query}')) {
      return site.baseUrl;
    }
    
    const encodedQuery = encodeURIComponent(query);
    return site.searchTemplateUrl.replace('{query}', encodedQuery);
  },

  /**
   * Generate suggested query from best by soon items
   * Returns top 1-2 best by soon items as a search query
   */
  generateSuggestedQuery(bestBySoonItems: FoodItem[]): string {
    if (bestBySoonItems.length === 0) {
      return '';
    }

    // Get top 1-2 items (sorted by best by date, closest first)
    const sorted = [...bestBySoonItems]
      .filter(item => item.bestByDate || item.thawDate)
      .sort((a, b) => {
        const dateA = a.bestByDate || a.thawDate || new Date(0);
        const dateB = b.bestByDate || b.thawDate || new Date(0);
        return dateA.getTime() - dateB.getTime();
      })
      .slice(0, 2)
      .map(item => item.name);

    return sorted.join(' ');
  },

  /**
   * Check if ingredient is available in pantry
   * Simple case-insensitive substring matching
   */
  checkIngredientAvailability(
    ingredient: string,
    pantryItems: FoodItem[]
  ): 'have' | 'missing' {
    const normalizedIngredient = ingredient.toLowerCase().trim();
    
    // Remove common measurement words for better matching
    const measurementWords = ['cup', 'cups', 'tbsp', 'tsp', 'oz', 'lb', 'lbs', 'g', 'kg', 'ml', 'l', 'piece', 'pieces', 'clove', 'cloves'];
    const cleanedIngredient = measurementWords.reduce((text, word) => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      return text.replace(regex, '').trim();
    }, normalizedIngredient);

    const hasIngredient = pantryItems.some(item => {
      const normalizedItemName = item.name.toLowerCase();
      return (
        cleanedIngredient.includes(normalizedItemName) ||
        normalizedItemName.includes(cleanedIngredient) ||
        normalizedIngredient.includes(normalizedItemName) ||
        normalizedItemName.includes(normalizedIngredient)
      );
    });

    return hasIngredient ? 'have' : 'missing';
  },

  /**
   * Check ingredient availability with detailed matching information
   * Returns matching items and counts for dashboard cross-reference
   * Excludes pantry items that are already in the shopping list
   * Accounts for reserved quantities from other planned meals
   */
  checkIngredientAvailabilityDetailed(
    ingredient: string,
    pantryItems: FoodItem[],
    shoppingListItems: ShoppingListItem[] = [],
    reservedQuantitiesMap: Record<string, number> = {}
  ): {
    status: 'available' | 'missing' | 'partial' | 'reserved';
    matchingItems: FoodItem[];
    count: number;
    availableQuantity: number; // Total available quantity across all matches
    neededQuantity: number | null; // Quantity needed from ingredient string
  } {
    // Parse quantity and item name from ingredient
    const parsed = parseIngredientQuantity(ingredient);
    const neededQuantity = parsed.quantity;
    const normalizedItemName = normalizeItemName(parsed.itemName);
    
    // Get shopping list item names (normalized, excluding crossed-off items)
    const shoppingListItemNames = shoppingListItems
      .filter(item => !item.crossedOff)
      .map(item => normalizeItemName(item.name));
    
    // Helper function to check if a pantry item name matches any shopping list item
    const isInShoppingList = (pantryItemName: string): boolean => {
      const normalizedPantryName = normalizeItemName(pantryItemName);
      return shoppingListItemNames.some(shoppingName => {
        // Check for exact match or substring match
        return normalizedPantryName === shoppingName ||
               normalizedPantryName.includes(shoppingName) ||
               shoppingName.includes(normalizedPantryName);
      });
    };
    
    // Find matching items (excluding those in shopping list)
    const matchingItems: FoodItem[] = [];
    let totalAvailableQuantity = 0;
    
    pantryItems.forEach(item => {
      // Skip if this pantry item is already in the shopping list
      if (isInShoppingList(item.name)) {
        return;
      }
      
      const normalizedPantryName = normalizeItemName(item.name);
      const pantryItemWords = normalizedPantryName.split(/\s+/);
      const ingredientWords = normalizedItemName.split(/\s+/);
      
      let isMatch = false;
      
      // Check for exact match
      if (normalizedItemName === normalizedPantryName || normalizedPantryName === normalizedItemName) {
        isMatch = true;
      }
      // Check if ingredient contains item name or vice versa
      else if (normalizedItemName.includes(normalizedPantryName) || normalizedPantryName.includes(normalizedItemName)) {
        isMatch = true;
      }
      // Check for word overlap (at least 2 words match)
      else {
        const matchingWords = pantryItemWords.filter(word => 
          word.length > 2 && ingredientWords.some(ingWord => 
            ingWord.includes(word) || word.includes(ingWord)
          )
        );
        
        if (matchingWords.length >= Math.min(2, pantryItemWords.length)) {
          isMatch = true;
        }
      }
      
      if (isMatch) {
        matchingItems.push(item);
        
        // Calculate available quantity for this item
        const pantryQuantity = item.quantity || 1; // Default to 1 if no quantity specified
        const reservedQty = reservedQuantitiesMap[normalizedPantryName] || 0;
        const availableQty = Math.max(0, pantryQuantity - reservedQty);
        totalAvailableQuantity += availableQty;
      }
    });

    const count = matchingItems.length;
    
    // Determine status based on available quantity vs needed quantity
    if (count === 0) {
      return { 
        status: 'missing', 
        matchingItems: [], 
        count: 0,
        availableQuantity: 0,
        neededQuantity
      };
    }
    
    // If no quantity specified, treat as available if we have matches
    if (neededQuantity === null) {
      // If we have matching items but no available quantity, they're reserved
      if (count > 0 && totalAvailableQuantity === 0) {
        return {
          status: 'reserved',
          matchingItems,
          count,
          availableQuantity: 0,
          neededQuantity: null
        };
      }
      return {
        status: totalAvailableQuantity > 0 ? 'available' : 'missing',
        matchingItems,
        count,
        availableQuantity: totalAvailableQuantity,
        neededQuantity: null
      };
    }
    
    // Check if we have enough quantity
    if (totalAvailableQuantity >= neededQuantity) {
      return {
        status: 'available',
        matchingItems,
        count,
        availableQuantity: totalAvailableQuantity,
        neededQuantity
      };
    } else if (totalAvailableQuantity > 0) {
      return {
        status: 'partial',
        matchingItems,
        count,
        availableQuantity: totalAvailableQuantity,
        neededQuantity
      };
    } else if (count > 0) {
      // We have matching items but they're all reserved
      return {
        status: 'reserved',
        matchingItems,
        count,
        availableQuantity: 0,
        neededQuantity
      };
    } else {
      return {
        status: 'missing',
        matchingItems,
        count,
        availableQuantity: 0,
        neededQuantity
      };
    }
  },

  /**
   * Calculate reserved quantities from all planned meals
   * Returns a map of normalized item names to reserved quantities
   */
  calculateReservedQuantities(
    plannedMeals: PlannedMeal[],
    pantryItems: FoodItem[]
  ): Record<string, number> {
    const reservedMap: Record<string, number> = {};
    
    plannedMeals.forEach(meal => {
      // Process dishes first (new structure)
      if (meal.dishes && meal.dishes.length > 0) {
        meal.dishes.forEach(dish => {
          const ingredients = dish.recipeIngredients || [];
          
          ingredients.forEach(ingredient => {
            const parsed = parseIngredientQuantity(ingredient);
            if (parsed.quantity === null) return; // Skip ingredients without quantities
            
            const normalizedItemName = normalizeItemName(parsed.itemName);
            const neededQty = parsed.quantity;
            
            // Find matching pantry items
            const matchingItems = pantryItems.filter(item => {
              const normalizedPantryName = normalizeItemName(item.name);
              const pantryWords = normalizedPantryName.split(/\s+/);
              const ingredientWords = normalizedItemName.split(/\s+/);
              
              // Exact match
              if (normalizedItemName === normalizedPantryName) return true;
              
              // Substring match
              if (normalizedItemName.includes(normalizedPantryName) || normalizedPantryName.includes(normalizedItemName)) {
                return true;
              }
              
              // Word overlap
              const matchingWords = pantryWords.filter(word => 
                word.length > 2 && ingredientWords.some(ingWord => 
                  ingWord.includes(word) || word.includes(ingWord)
                )
              );
              
              return matchingWords.length >= Math.min(2, pantryWords.length);
            });
            
            // Reserve quantity from matching pantry items
            let remainingNeeded = neededQty;
            matchingItems.forEach(item => {
              if (remainingNeeded <= 0) return;
              
              const pantryQty = item.quantity || 1;
              const normalizedPantryName = normalizeItemName(item.name);
              const alreadyReserved = reservedMap[normalizedPantryName] || 0;
              const available = Math.max(0, pantryQty - alreadyReserved);
              
              if (available > 0) {
                const toReserve = Math.min(remainingNeeded, available);
                reservedMap[normalizedPantryName] = (reservedMap[normalizedPantryName] || 0) + toReserve;
                remainingNeeded -= toReserve;
              }
            });
          });
        });
      }
      
      // Legacy support: also process meal-level ingredients
      const legacyIngredients = meal.recipeIngredients || meal.suggestedIngredients || [];
      legacyIngredients.forEach(ingredient => {
        const parsed = parseIngredientQuantity(ingredient);
        if (parsed.quantity === null) return; // Skip ingredients without quantities
        
        const normalizedItemName = normalizeItemName(parsed.itemName);
        const neededQty = parsed.quantity;
        
        // Find matching pantry items
        const matchingItems = pantryItems.filter(item => {
          const normalizedPantryName = normalizeItemName(item.name);
          const pantryWords = normalizedPantryName.split(/\s+/);
          const ingredientWords = normalizedItemName.split(/\s+/);
          
          // Exact match
          if (normalizedItemName === normalizedPantryName) return true;
          
          // Substring match
          if (normalizedItemName.includes(normalizedPantryName) || normalizedPantryName.includes(normalizedItemName)) {
            return true;
          }
          
          // Word overlap
          const matchingWords = pantryWords.filter(word => 
            word.length > 2 && ingredientWords.some(ingWord => 
              ingWord.includes(word) || word.includes(ingWord)
            )
          );
          
          return matchingWords.length >= Math.min(2, pantryWords.length);
        });
        
        // Reserve quantity from matching pantry items
        let remainingNeeded = neededQty;
        matchingItems.forEach(item => {
          if (remainingNeeded <= 0) return;
          
          const pantryQty = item.quantity || 1;
          const normalizedPantryName = normalizeItemName(item.name);
          const alreadyReserved = reservedMap[normalizedPantryName] || 0;
          const available = Math.max(0, pantryQty - alreadyReserved);
          
          if (available > 0) {
            const toReserve = Math.min(remainingNeeded, available);
            reservedMap[normalizedPantryName] = (reservedMap[normalizedPantryName] || 0) + toReserve;
            remainingNeeded -= toReserve;
          }
        });
      });
    });
    
    return reservedMap;
  },

  /**
   * Calculate reserved quantities for a single meal
   * Used when saving a meal to store reservedQuantities
   */
  calculateMealReservedQuantities(
    ingredients: string[],
    pantryItems: FoodItem[]
  ): Record<string, number> {
    const reservedMap: Record<string, number> = {};
    
    ingredients.forEach(ingredient => {
      const parsed = parseIngredientQuantity(ingredient);
      if (parsed.quantity === null) return; // Skip ingredients without quantities
      
      const normalizedItemName = normalizeItemName(parsed.itemName);
      const neededQty = parsed.quantity;
      
      // Find matching pantry items
      const matchingItems = pantryItems.filter(item => {
        const normalizedPantryName = normalizeItemName(item.name);
        const pantryWords = normalizedPantryName.split(/\s+/);
        const ingredientWords = normalizedItemName.split(/\s+/);
        
        // Exact match
        if (normalizedItemName === normalizedPantryName) return true;
        
        // Substring match
        if (normalizedItemName.includes(normalizedPantryName) || normalizedPantryName.includes(normalizedItemName)) {
          return true;
        }
        
        // Word overlap
        const matchingWords = pantryWords.filter(word => 
          word.length > 2 && ingredientWords.some(ingWord => 
            ingWord.includes(word) || word.includes(ingWord)
          )
        );
        
        return matchingWords.length >= Math.min(2, pantryWords.length);
      });
      
      // Reserve quantity from matching pantry items
      let remainingNeeded = neededQty;
      matchingItems.forEach(item => {
        if (remainingNeeded <= 0) return;
        
        const pantryQty = item.quantity || 1;
        const normalizedPantryName = normalizeItemName(item.name);
        const alreadyReserved = reservedMap[normalizedPantryName] || 0;
        const available = Math.max(0, pantryQty - alreadyReserved);
        
        if (available > 0) {
          const toReserve = Math.min(remainingNeeded, available);
          reservedMap[normalizedPantryName] = (reservedMap[normalizedPantryName] || 0) + toReserve;
          remainingNeeded -= toReserve;
        }
      });
    });
    
    return reservedMap;
  },

  /**
   * Claim items from dashboard/pantry for a meal
   * Matches ingredients to pantry items and marks them as used by the meal
   * Returns the IDs of claimed items
   */
  async claimItemsForMeal(
    userId: string,
    mealId: string,
    ingredients: string[],
    pantryItems: FoodItem[],
    reservedQuantities: Record<string, number>
  ): Promise<string[]> {
    const claimedItemIds: string[] = [];
    
    for (const ingredient of ingredients) {
      const parsed = parseIngredientQuantity(ingredient);
      const normalizedItemName = normalizeItemName(parsed.itemName);
      const neededQty = parsed.quantity || 1;
      
      // Find matching pantry items using fuzzy matching
      const matchingItems = pantryItems.filter(item => {
        const normalizedPantryName = normalizeItemName(item.name);
        
        // Exact match
        if (normalizedItemName === normalizedPantryName) return true;
        
        // Substring match
        if (normalizedItemName.includes(normalizedPantryName) || normalizedPantryName.includes(normalizedItemName)) {
          return true;
        }
        
        // Word overlap
        const pantryWords = normalizedPantryName.split(/\s+/).filter(w => w.length > 2);
        const ingredientWords = normalizedItemName.split(/\s+/).filter(w => w.length > 2);
        
        if (pantryWords.length === 0 || ingredientWords.length === 0) return false;
        
        const matchingWords = pantryWords.filter(word => 
          ingredientWords.some(ingWord => 
            ingWord.includes(word) || word.includes(ingWord)
          )
        );
        
        return matchingWords.length >= Math.min(2, pantryWords.length);
      });
      
      // Claim items based on needed quantity
      let remainingNeeded = neededQty;
      for (const item of matchingItems) {
        if (remainingNeeded <= 0) break;
        
        // Skip if already claimed by this meal
        if (item.usedByMeals?.includes(mealId)) {
          continue;
        }
        
        const itemQty = item.quantity || 1;
        const normalizedPantryName = normalizeItemName(item.name);
        const reservedQty = reservedQuantities[normalizedPantryName] || 0;
        const availableQty = Math.max(0, itemQty - reservedQty);
        
        if (availableQty > 0) {
          // Claim this item
          const currentUsedByMeals = item.usedByMeals || [];
          if (!currentUsedByMeals.includes(mealId)) {
            await foodItemService.updateFoodItemUsedByMeals(userId, item.id, [...currentUsedByMeals, mealId]);
            claimedItemIds.push(item.id);
          }
          
          const toClaim = Math.min(remainingNeeded, availableQty);
          remainingNeeded -= toClaim;
        }
      }
    }
    
    return claimedItemIds;
  },

  /**
   * Claim shopping list items for a meal
   * Returns the IDs of claimed shopping list items
   */
  async claimShoppingListItemsForMeal(
    userId: string,
    mealId: string,
    ingredients: string[],
    shoppingListItems: ShoppingListItem[]
  ): Promise<string[]> {
    const claimedItemIds: string[] = [];
    
    for (const ingredient of ingredients) {
      const parsed = parseIngredientQuantity(ingredient);
      const normalizedItemName = normalizeItemName(parsed.itemName);
      
      // Find matching shopping list items
      const matchingItems = shoppingListItems.filter(item => {
        if (item.crossedOff) return false; // Don't claim crossed-off items
        if (item.mealId && item.mealId !== mealId) return false; // Already claimed by another meal
        
        const normalizedListItemName = normalizeItemName(item.name);
        
        // Exact match
        if (normalizedItemName === normalizedListItemName) return true;
        
        // Substring match
        if (normalizedItemName.includes(normalizedListItemName) || normalizedListItemName.includes(normalizedItemName)) {
          return true;
        }
        
        // Word overlap
        const listWords = normalizedListItemName.split(/\s+/).filter(w => w.length > 2);
        const ingredientWords = normalizedItemName.split(/\s+/).filter(w => w.length > 2);
        
        if (listWords.length === 0 || ingredientWords.length === 0) return false;
        
        const matchingWords = listWords.filter(word => 
          ingredientWords.some(ingWord => 
            ingWord.includes(word) || word.includes(ingWord)
          )
        );
        
        return matchingWords.length >= Math.min(2, listWords.length);
      });
      
      // Claim matching shopping list items
      for (const item of matchingItems) {
        if (!item.mealId) {
          // Update shopping list item to link it to this meal
          await shoppingListService.updateShoppingListItem(userId, item.id, { mealId });
          claimedItemIds.push(item.id);
        } else if (item.mealId === mealId && !claimedItemIds.includes(item.id)) {
          // Already linked to this meal, just add to claimed list
          claimedItemIds.push(item.id);
        }
      }
    }
    
    return claimedItemIds;
  }
};

