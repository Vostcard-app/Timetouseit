/**
 * Meal Plan Generator
 * Logic for generating meal suggestions and creating meal plans
 */

import { addDays, format, isSameDay } from 'date-fns';
import type { MealSuggestion, PlannedMeal, MealType, LeftoverMeal } from '../types';
import { generateMealSuggestions } from './openaiService';
import { mealProfileService } from './mealProfileService';
import { leftoverMealService } from './leftoverMealService';
import { foodItemService } from './foodItemService';
import { logServiceOperation, logServiceError } from './baseService';
import { toServiceError } from './errors';

/**
 * Generate 3 meal suggestions for a specific day
 */
export async function generateDailySuggestions(
  userId: string,
  date: Date,
  mealType: MealType,
  servingSize?: number,
  dietApproach?: string,
  dietStrict?: boolean
): Promise<MealSuggestion[]> {
  logServiceOperation('generateDailySuggestions', 'mealPlans', { userId, date, mealType });

  try {
    // Get user profile
    const profile = await mealProfileService.getMealProfile(userId);
    if (!profile) {
      throw new Error('Meal profile not found. Please set up your meal preferences first.');
    }

    // Get expiring items (next 7-14 days)
    const allItems = await foodItemService.getFoodItems(userId);
    const now = new Date();
    const twoWeeksFromNow = addDays(now, 14);
    
    const expiringItems = allItems.filter(item => {
      const expDate = item.bestByDate || item.thawDate;
      if (!expDate) return false;
      return expDate >= now && expDate <= twoWeeksFromNow;
    });

    // Get leftover meals (gracefully handle if index not created yet)
    let leftoverMeals: LeftoverMeal[] = [];
    try {
      leftoverMeals = await leftoverMealService.getLeftoverMeals(
        userId,
        date,
        date
      );
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

    // Get schedule for this day
    const daySchedule = await mealProfileService.getEffectiveSchedule(userId, date);

    // Build context for AI - focused on this specific day and meal type
    const bestBySoonItemsMapped = expiringItems.map(item => ({
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
        dislikedFoods: profile.dislikedFoods,
        foodPreferences: profile.foodPreferences,
        dietApproach: dietApproach === undefined 
          ? profile.dietApproach 
          : (dietApproach === '' ? undefined : dietApproach),
        dietStrict: dietStrict !== undefined ? dietStrict : profile.dietStrict,
        favoriteMeals: profile.favoriteMeals || [],
        servingSize: servingSize || profile.servingSize || 2,
        mealDurationPreferences: profile.mealDurationPreferences
      },
      schedule: [daySchedule],
      currentInventory: allItems.map(item => ({
        id: item.id,
        name: item.name,
        bestByDate: item.bestByDate,
        thawDate: item.thawDate
      }))
    };

    // Generate suggestions for this specific day and meal type
    const allSuggestions = await generateMealSuggestions(context, mealType);
    
    // Filter to only this meal type and limit to 3
    const filtered = allSuggestions
      .filter(s => s.mealType === mealType && isSameDay(new Date(s.date), date))
      .slice(0, 3);

    // If we don't have 3 suggestions, generate more based on preferences only
    if (filtered.length < 3 && expiringItems.length === 0) {
      // Generate preference-based suggestions
      const prefContext = {
        ...context,
        expiringItems: [],
        bestBySoonItems: [],
        currentInventory: []
      };
      const prefSuggestions = await generateMealSuggestions(prefContext);
      const prefFiltered = prefSuggestions
        .filter(s => s.mealType === mealType && isSameDay(new Date(s.date), date))
        .slice(0, 3 - filtered.length);
      filtered.push(...prefFiltered);
    }

    return filtered.slice(0, 3);
  } catch (error) {
    logServiceError('generateDailySuggestions', 'mealPlans', error, { userId });
    throw toServiceError(error, 'mealPlans');
  }
}

/**
 * Generate meal suggestions using AI (legacy method - kept for compatibility)
 */
export async function generateMealSuggestionsForWeek(
  userId: string,
  weekStartDate: Date
): Promise<MealSuggestion[]> {
  logServiceOperation('generateMealSuggestionsForWeek', 'mealPlans', { userId, weekStartDate });

  try {
    // Get user profile
    const profile = await mealProfileService.getMealProfile(userId);
    if (!profile) {
      throw new Error('Meal profile not found. Please set up your meal preferences first.');
    }

    // Get expiring items (next 7-14 days)
    const allItems = await foodItemService.getFoodItems(userId);
    const now = new Date();
    const twoWeeksFromNow = addDays(now, 14);
    
    const expiringItems = allItems.filter(item => {
      const expDate = item.bestByDate || item.thawDate;
      if (!expDate) return false;
      return expDate >= now && expDate <= twoWeeksFromNow;
    });

    // Get leftover meals (gracefully handle if index not created yet)
    const weekEndDate = addDays(weekStartDate, 7);
    let leftoverMeals: LeftoverMeal[] = [];
    try {
      leftoverMeals = await leftoverMealService.getLeftoverMeals(
        userId,
        weekStartDate,
        weekEndDate
      );
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

    // Get schedule for each day of the week
    const schedule = [];
    for (let i = 0; i < 7; i++) {
      const date = addDays(weekStartDate, i);
      const daySchedule = await mealProfileService.getEffectiveSchedule(userId, date);
      schedule.push(daySchedule);
    }

    // Build context for AI
    const bestBySoonItemsMapped = expiringItems.map(item => ({
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
        dislikedFoods: profile.dislikedFoods,
        foodPreferences: profile.foodPreferences,
        dietApproach: profile.dietApproach,
        dietStrict: profile.dietStrict,
        favoriteMeals: profile.favoriteMeals || [],
        servingSize: profile.servingSize || 2,
        mealDurationPreferences: profile.mealDurationPreferences
      },
      schedule,
      currentInventory: allItems.map(item => ({
        id: item.id,
        name: item.name,
        bestByDate: item.bestByDate,
        thawDate: item.thawDate
      }))
    };

    // Generate suggestions
    const suggestions = await generateMealSuggestions(context);
    return suggestions;
  } catch (error) {
    logServiceError('generateMealSuggestionsForWeek', 'mealPlans', error, { userId });
    throw toServiceError(error, 'mealPlans');
  }
}

/**
 * Create planned meals from suggestions
 */
export async function createPlannedMealsFromSuggestions(
  userId: string,
  selectedMeals: MealSuggestion[]
): Promise<PlannedMeal[]> {
  logServiceOperation('createPlannedMealsFromSuggestions', 'mealPlans', { userId });

  try {
    // Get profile for meal duration preferences
    const profile = await mealProfileService.getMealProfile(userId);
    const mealDurations = profile?.mealDurationPreferences || {
      breakfast: 20,
      lunch: 30,
      dinner: 40
    };

    // Convert suggestions to planned meals
    // First, get schedules for all days
    const schedulePromises = selectedMeals.map(suggestion => 
      mealProfileService.getEffectiveSchedule(userId, new Date(suggestion.date))
    );
    const schedules = await Promise.all(schedulePromises);

    const plannedMeals: PlannedMeal[] = selectedMeals.map((suggestion, index) => {
      const schedule = schedules[index];
      const finishBy = schedule.meals.find(m => m.type === suggestion.mealType)?.finishBy || '18:00';

      // Calculate start cooking time
      const duration = mealDurations[suggestion.mealType] || 30;
      const [hours, minutes] = finishBy.split(':').map(Number);
      const finishDateTime = new Date(suggestion.date);
      finishDateTime.setHours(hours, minutes, 0, 0);
      const startDateTime = new Date(finishDateTime.getTime() - duration * 60 * 1000);
      const startCookingAt = format(startDateTime, 'HH:mm');

      return {
        id: `meal-${index}-${Date.now()}`,
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

    return plannedMeals;
  } catch (error) {
    logServiceError('createPlannedMealsFromSuggestions', 'mealPlans', error, { userId });
    throw toServiceError(error, 'mealPlans');
  }
}
