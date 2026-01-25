/**
 * Meal Plan Replanner
 * Logic for replanning meals after unplanned events
 */

import { addDays, format, isSameDay, startOfWeek } from 'date-fns';
import type { MealPlan, PlannedMeal, UnplannedEvent, LeftoverMeal, FoodItem } from '../types';
import { replanMeals } from './openaiService';
import { mealProfileService } from './mealProfileService';
import { leftoverMealService } from './leftoverMealService';
import { logServiceOperation, logServiceError } from './baseService';
import { toServiceError } from './errors';
import { recalculateInventory, getWasteRiskItems } from './mealPlanInventory';

/**
 * Replan meals after unplanned event
 */
export async function replanMealsAfterEvent(
  userId: string,
  currentPlan: MealPlan,
  unplannedEvent: UnplannedEvent
): Promise<MealPlan> {
  logServiceOperation('replanMealsAfterEvent', 'mealPlans', { userId });

  try {
    // Identify skipped meals
    const skippedMeals = currentPlan.meals.filter(meal =>
      isSameDay(meal.date, unplannedEvent.date) &&
      unplannedEvent.mealTypes.includes(meal.mealType)
    );

    // Recalculate inventory
    const availableItems = await recalculateInventory(userId, currentPlan.id, currentPlan);
    
    // Get waste risk items
    const wasteRiskItems = await getWasteRiskItems(userId, currentPlan.id, currentPlan);

    // Get profile and leftovers
    const profile = await mealProfileService.getMealProfile(userId);
    const weekStart = startOfWeek(unplannedEvent.date, { weekStartsOn: 0 });
    const weekEnd = addDays(weekStart, 7);
    
    // Get leftover meals (gracefully handle if index not created yet)
    let leftoverMeals: LeftoverMeal[] = [];
    try {
      leftoverMeals = await leftoverMealService.getLeftoverMeals(userId, weekStart, weekEnd);
    } catch (error: unknown) {
      // If index error, continue without leftover meals
      const err = error as { code?: string; message?: string };
      if (err?.code === 'failed-precondition' && err?.message?.includes('index')) {
        logServiceOperation('getLeftoverMeals', 'leftoverMeals', { 
          note: 'Index not created yet, continuing without leftover meals' 
        });
      } else {
        throw error; // Re-throw other errors
      }
    }

    // Get schedule
    const schedule = [];
    for (let i = 0; i < 7; i++) {
      const date = addDays(weekStart, i);
      const daySchedule = await mealProfileService.getEffectiveSchedule(userId, date);
      schedule.push(daySchedule);
    }

    // Build replanning context
    const bestBySoonItemsMapped = availableItems
      .filter(item => {
        const expDate = item.bestByDate || item.thawDate;
        return expDate && expDate <= addDays(new Date(), 14);
      })
      .map(item => ({
        id: item.id,
        name: item.name,
        bestByDate: item.bestByDate,
        thawDate: item.thawDate,
        category: item.category
      }));
    const context = {
      expiringItems: bestBySoonItemsMapped,
      bestBySoonItems: bestBySoonItemsMapped,
      leftoverMeals,
      userPreferences: {
        dislikedFoods: profile?.dislikedFoods || [],
        foodPreferences: profile?.foodPreferences || [],
        dietApproach: profile?.dietApproach,
        dietStrict: profile?.dietStrict,
        favoriteMeals: profile?.favoriteMeals || [],
        servingSize: profile?.servingSize || 2,
        mealDurationPreferences: profile?.mealDurationPreferences || {
          breakfast: 20,
          lunch: 30,
          dinner: 40
        }
      },
      schedule,
      currentInventory: availableItems.map(item => ({
        id: item.id,
        name: item.name,
        bestByDate: item.bestByDate,
        thawDate: item.thawDate
      })),
      skippedMeals,
      wasteRiskItems: wasteRiskItems.map(item => ({
        id: item.id,
        name: item.name,
        bestByDate: item.bestByDate,
        thawDate: item.thawDate,
        daysUntilBestBy: item.bestByDate
          ? Math.ceil((item.bestByDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          : item.thawDate
          ? Math.ceil((item.thawDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          : 999
      })),
      unplannedEvent
    };

    // Generate new suggestions
    const newSuggestions = await replanMeals(context);

    // Mark skipped meals
    const updatedMeals = currentPlan.meals.map(meal => {
      if (skippedMeals.some(sm => sm.id === meal.id)) {
        return { ...meal, skipped: true };
      }
      return meal;
    });

    // Add new meal suggestions
    const profileForDurations = profile || {
      mealDurationPreferences: { breakfast: 20, lunch: 30, dinner: 40 }
    };

    const newPlannedMeals: PlannedMeal[] = newSuggestions.map((suggestion, index) => {
      const finishBy = '18:00'; // Will be resolved from schedule
      const duration = profileForDurations.mealDurationPreferences[suggestion.mealType] || 30;
      const finishDateTime = new Date(suggestion.date);
      const [hours, minutes] = finishBy.split(':').map(Number);
      finishDateTime.setHours(hours, minutes, 0, 0);
      const startDateTime = new Date(finishDateTime.getTime() - duration * 60 * 1000);
      const startCookingAt = format(startDateTime, 'HH:mm');

      return {
        id: `meal-${Date.now()}-${index}`,
        date: new Date(suggestion.date),
        mealType: suggestion.mealType,
        finishBy,
        startCookingAt,
        confirmed: false,
        skipped: false,
        isLeftover: false,
        dishes: []
      };
    });

    // Resolve finishBy times
    const resolvedNewMeals = await Promise.all(
      newPlannedMeals.map(async (meal) => {
        const schedule = await mealProfileService.getEffectiveSchedule(userId, meal.date);
        const scheduledMeal = schedule.meals.find(m => m.type === meal.mealType);
        if (scheduledMeal) {
          const finishBy = scheduledMeal.finishBy;
          const [hours, minutes] = finishBy.split(':').map(Number);
          const finishDateTime = new Date(meal.date);
          finishDateTime.setHours(hours, minutes, 0, 0);
          const duration = profileForDurations.mealDurationPreferences[meal.mealType] || 30;
          const startDateTime = new Date(finishDateTime.getTime() - duration * 60 * 1000);
          return {
            ...meal,
            finishBy,
            startCookingAt: format(startDateTime, 'HH:mm')
          };
        }
        return meal;
      })
    );

    // Combine updated and new meals
    const allMeals = [...updatedMeals, ...resolvedNewMeals];

    return {
      ...currentPlan,
      meals: allMeals
    };
  } catch (error) {
    logServiceError('replanMealsAfterEvent', 'mealPlans', error, { userId });
    throw toServiceError(error, 'mealPlans');
  }
}
