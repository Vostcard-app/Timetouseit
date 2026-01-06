/**
 * Shelf Life Service
 * Provides USDA/NCHFP-based shelf life calculations for dry/canned goods
 * Uses comprehensive dry goods data table in conjunction with FoodKeeper and other sources
 */

import { addDays } from 'date-fns';
import type { FoodKeeperItem } from '../types';
import dryGoodsData from '../data/dryGoodsShelfLife.json';

export interface DryGoodsShelfLife {
  name: string;
  category: string;
  pantryDaysMin: number | null;
  pantryDaysMax: number | null;
  pantryDays: number; // Recommended shelf life in days
  notes: string;
  qualityMessage: string;
}

export interface ShelfLifeResult {
  expirationDate: Date;
  qualityMessage: string;
  notes?: string;
  source: 'dryGoodsTable' | 'foodKeeper' | 'default';
}

// Load dry goods data
const dryGoodsShelfLife: DryGoodsShelfLife[] = dryGoodsData as DryGoodsShelfLife[];

/**
 * Find a dry/canned goods item in the shelf life table
 * Uses fuzzy matching to find similar items
 */
export function findDryGoodsItem(itemName: string): DryGoodsShelfLife | null {
  if (!itemName || !itemName.trim()) {
    return null;
  }

  const normalizedName = itemName.trim().toLowerCase();

  // First, try exact match (case-insensitive)
  const exactMatch = dryGoodsShelfLife.find(
    item => item.name.toLowerCase() === normalizedName
  );

  if (exactMatch) {
    return exactMatch;
  }

  // Try category-based matching
  const categoryKeywords: Record<string, string[]> = {
    'Canned': ['canned', 'can', 'tin'],
    'Grains': ['rice', 'pasta', 'noodles', 'spaghetti', 'macaroni', 'penne', 'fettuccine'],
    'Legumes': ['beans', 'lentils', 'chickpeas', 'black beans', 'kidney beans'],
    'Baking': ['flour', 'sugar', 'baking powder', 'baking soda'],
    'Condiments': ['honey', 'salt', 'peanut butter', 'vinegar', 'soy sauce'],
    'Oils': ['oil', 'vegetable oil', 'canola oil', 'olive oil'],
    'Breakfast': ['cereal', 'oatmeal', 'oats'],
    'Snacks': ['crackers', 'chips', 'pretzels'],
    'Spices': ['spice', 'herb', 'pepper', 'cumin', 'paprika', 'oregano'],
    'Dairy': ['powdered milk', 'milk powder'],
    'Beverages': ['coffee', 'tea', 'instant coffee']
  };

  // Check category keywords
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    for (const keyword of keywords) {
      if (normalizedName.includes(keyword)) {
        const categoryMatch = dryGoodsShelfLife.find(item => item.category === category);
        if (categoryMatch) {
          return categoryMatch;
        }
      }
    }
  }

  // Try fuzzy matching (substring match)
  const fuzzyMatches = dryGoodsShelfLife
    .filter(item => {
      const itemNameLower = item.name.toLowerCase();
      return itemNameLower.includes(normalizedName) || normalizedName.includes(itemNameLower);
    })
    .sort((a, b) => {
      // Prefer shorter names (more specific matches)
      const aStartsWith = a.name.toLowerCase().startsWith(normalizedName);
      const bStartsWith = b.name.toLowerCase().startsWith(normalizedName);
      
      if (aStartsWith && !bStartsWith) return -1;
      if (!aStartsWith && bStartsWith) return 1;
      
      return a.name.length - b.name.length;
    });

  return fuzzyMatches.length > 0 ? fuzzyMatches[0] : null;
}

/**
 * Get shelf life for dry/canned goods using USDA/NCHFP guidelines
 * Returns expiration date and quality message
 */
export function getDryGoodsShelfLife(
  itemName: string,
  foodKeeperItem?: FoodKeeperItem | null
): ShelfLifeResult | null {
  // First, try FoodKeeper data if available (it's the primary source)
  if (foodKeeperItem?.pantryDays && foodKeeperItem.pantryDays > 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expirationDate = addDays(today, foodKeeperItem.pantryDays);
    
    return {
      expirationDate,
      qualityMessage: `Best quality by ${expirationDate.toLocaleDateString()}; often safe beyond if stored properly`,
      source: 'foodKeeper'
    };
  }

  // Fall back to dry goods table
  const dryGoodsItem = findDryGoodsItem(itemName);
  
  if (dryGoodsItem) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expirationDate = addDays(today, dryGoodsItem.pantryDays);
    
    // Format quality message with date
    const qualityMessage = dryGoodsItem.qualityMessage.replace(
      '{date}',
      expirationDate.toLocaleDateString()
    );
    
    return {
      expirationDate,
      qualityMessage,
      notes: dryGoodsItem.notes,
      source: 'dryGoodsTable'
    };
  }

  // Default fallback for dry/canned goods (conservative estimate)
  // Use 1 year (365 days) as a safe default for unknown dry/canned items
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expirationDate = addDays(today, 365);
  
  return {
    expirationDate,
    qualityMessage: `Best quality by ${expirationDate.toLocaleDateString()}; often safe beyond if stored properly`,
    source: 'default'
  };
}

/**
 * Get suggested expiration date for dry/canned goods
 * This is the main function to use when calculating expiration dates
 */
export function getSuggestedDryGoodsExpirationDate(
  itemName: string,
  foodKeeperItem?: FoodKeeperItem | null
): Date | null {
  const result = getDryGoodsShelfLife(itemName, foodKeeperItem);
  return result ? result.expirationDate : null;
}

