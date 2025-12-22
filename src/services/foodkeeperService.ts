import { addDays } from 'date-fns';
import type { FoodKeeperItem } from '../types';
import foodkeeperData from '../data/foodkeeper.json';

// Load FoodKeeper data
const foodKeeperItems: FoodKeeperItem[] = foodkeeperData as FoodKeeperItem[];

/**
 * Find a food item in the FoodKeeper dataset using exact match first, then fuzzy match
 */
export const findFoodItem = (query: string): FoodKeeperItem | null => {
  if (!query || !query.trim()) {
    return null;
  }

  const normalizedQuery = query.trim().toLowerCase();

  // First, try exact match (case-insensitive)
  const exactMatch = foodKeeperItems.find(
    item => item.name.toLowerCase() === normalizedQuery
  );

  if (exactMatch) {
    return exactMatch;
  }

  // If no exact match, try fuzzy matching (substring match)
  const fuzzyMatches = foodKeeperItems
    .filter(item => item.name.toLowerCase().includes(normalizedQuery))
    .sort((a, b) => {
      // Prefer shorter names (more specific matches)
      // Also prefer matches that start with the query
      const aStartsWith = a.name.toLowerCase().startsWith(normalizedQuery);
      const bStartsWith = b.name.toLowerCase().startsWith(normalizedQuery);
      
      if (aStartsWith && !bStartsWith) return -1;
      if (!aStartsWith && bStartsWith) return 1;
      
      return a.name.length - b.name.length;
    });

  return fuzzyMatches.length > 0 ? fuzzyMatches[0] : null;
};

/**
 * Find multiple food items in the FoodKeeper dataset matching the query
 * Returns up to 10 matches sorted by relevance
 */
export const findFoodItems = (query: string, limit: number = 10): FoodKeeperItem[] => {
  if (!query || !query.trim()) {
    return [];
  }

  const normalizedQuery = query.trim().toLowerCase();

  // Get all matches
  const matches = foodKeeperItems
    .filter(item => item.name.toLowerCase().includes(normalizedQuery))
    .map(item => {
      const nameLower = item.name.toLowerCase();
      let score = 0;
      
      // Exact match gets highest score
      if (nameLower === normalizedQuery) {
        score = 1000;
      }
      // Starts with query gets high score
      else if (nameLower.startsWith(normalizedQuery)) {
        score = 500;
      }
      // Contains query gets lower score
      else {
        score = 100;
      }
      
      // Prefer shorter names (more specific)
      score -= item.name.length;
      
      return { item, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(result => result.item);

  return matches;
};

/**
 * Get suggested expiration date based on FoodKeeper data
 * Defaults to refrigerator storage time
 */
export const getSuggestedExpirationDate = (
  foodName: string,
  storageType: 'refrigerator' | 'freezer' | 'pantry' = 'refrigerator'
): Date | null => {
  const item = findFoodItem(foodName);
  
  if (!item) {
    return null;
  }

  let storageDays: number | null | undefined;

  switch (storageType) {
    case 'refrigerator':
      storageDays = item.refrigeratorDays;
      break;
    case 'freezer':
      storageDays = item.freezerDays;
      break;
    case 'pantry':
      storageDays = item.pantryDays;
      break;
  }

  // If no storage time available, invalid, or zero/negative, return null
  if (!storageDays || storageDays <= 0) {
    return null;
  }

  // Calculate expiration date: today + storage days
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return addDays(today, storageDays);
};

/**
 * Load FoodKeeper data (for future use if we need to reload or update)
 */
export const loadFoodKeeperData = (): FoodKeeperItem[] => {
  return foodKeeperItems;
};

