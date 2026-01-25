/**
 * Meal Plan Inventory
 * Logic for calculating available inventory and waste risk items
 */

import type { MealPlan, FoodItem } from '../types';
import { foodItemService } from './foodItemService';
import { logServiceOperation, logServiceError } from './baseService';
import { toServiceError } from './errors';

/**
 * Recalculate inventory accounting for planned usage
 */
export async function recalculateInventory(
  userId: string,
  mealPlanId: string,
  plan: MealPlan | null
): Promise<FoodItem[]> {
  logServiceOperation('recalculateInventory', 'mealPlans', { userId, mealPlanId });

  try {
    if (!plan) {
      // Return all items if no plan
      return await foodItemService.getFoodItems(userId);
    }

    // Get all items
    const allItems = await foodItemService.getFoodItems(userId);
    
    // Get items that are "reserved" for confirmed or non-skipped meals
    const reservedItemIds = new Set<string>();
    plan.meals
      .filter(meal => meal.confirmed && !meal.skipped)
      .forEach(meal => {
        // Legacy support: check dishes for claimed items
        meal.dishes?.forEach(dish => {
          dish.claimedItemIds?.forEach(itemId => reservedItemIds.add(itemId));
        });
        // Legacy: also check meal-level claimedItemIds
        meal.claimedItemIds?.forEach(itemId => reservedItemIds.add(itemId));
      });

    // Return all items (reserved items are still available, just tracked)
    // In a more sophisticated system, we might track quantities
    return allItems;
  } catch (error) {
    logServiceError('recalculateInventory', 'mealPlans', error, { userId });
    throw toServiceError(error, 'mealPlans');
  }
}

/**
 * Get items at risk of expiring before being used
 */
export async function getWasteRiskItems(
  userId: string,
  mealPlanId: string,
  plan: MealPlan | null
): Promise<FoodItem[]> {
  logServiceOperation('getWasteRiskItems', 'mealPlans', { userId, mealPlanId });

  try {
    if (!plan) {
      return [];
    }

    const allItems = await foodItemService.getFoodItems(userId);
    const now = new Date();
    
    // Find items that expire before they're planned to be used
    const wasteRiskItems: FoodItem[] = [];
    
    for (const item of allItems) {
      const expDate = item.bestByDate || item.thawDate;
      if (!expDate) continue;

      // Find when this item is planned to be used
      const plannedUse = plan.meals
        .filter(meal => {
          if (meal.skipped) return false;
          // Check dishes for claimed items
          const claimedInDish = meal.dishes?.some(dish => dish.claimedItemIds?.includes(item.id));
          // Legacy: also check meal-level claimedItemIds
          const claimedInMeal = meal.claimedItemIds?.includes(item.id);
          return claimedInDish || claimedInMeal;
        })
        .sort((a, b) => a.date.getTime() - b.date.getTime())[0];

      if (!plannedUse) {
        // Item not planned - check if it expires soon
        const daysUntilExp = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysUntilExp <= 3) {
          wasteRiskItems.push(item);
        }
      } else if (expDate < plannedUse.date) {
        // Item expires before planned use
        wasteRiskItems.push(item);
      }
    }

    return wasteRiskItems;
  } catch (error) {
    logServiceError('getWasteRiskItems', 'mealPlans', error, { userId });
    throw toServiceError(error, 'mealPlans');
  }
}
