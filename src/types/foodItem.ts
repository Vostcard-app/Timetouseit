/**
 * Food Item Types
 */

export interface FoodItem {
  id: string;
  userId: string;
  name: string;
  barcode?: string;
  bestByDate?: Date; // Optional - frozen items use thawDate instead
  thawDate?: Date; // For frozen items
  addedDate: Date;
  photoUrl?: string;
  quantity?: number;
  quantityUnit?: string; // Unit for quantity (cans, packages, cups, boxes, bags, bottles, jars, units)
  category?: string;
  status: 'fresh' | 'bestBySoon' | 'pastBestBy';
  reminderSent?: boolean;
  notes?: string;
  isFrozen?: boolean;
  freezeCategory?: string;
  isDryCanned?: boolean; // Explicitly mark as dry/canned goods
  usedByMeals?: string[]; // Array of meal IDs that use this item
}

export interface FoodItemData {
  name: string;
  barcode?: string;
  bestByDate?: Date; // Optional - frozen items use thawDate instead
  thawDate?: Date; // For frozen items
  photoUrl?: string;
  quantity?: number;
  quantityUnit?: string; // Unit for quantity (cans, packages, cups, boxes, bags, bottles, jars, units)
  category?: string;
  notes?: string;
  isFrozen?: boolean;
  freezeCategory?: string;
  isDryCanned?: boolean; // Explicitly mark as dry/canned goods
  usedByMeals?: string[]; // Array of meal IDs that use this item
}

export type FoodItemStatus = 'fresh' | 'bestBySoon' | 'pastBestBy';

export interface FoodKeeperItem {
  name: string;
  category: string;
  refrigeratorDays?: number | null;
  freezerDays?: number | null;
  pantryDays?: number | null;
}

