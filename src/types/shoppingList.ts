/**
 * Shopping List Types
 */

export interface ShoppingList {
  id: string;
  userId: string;
  name: string;
  createdAt: Date;
  isDefault?: boolean;
}

export interface ShoppingListItem {
  id: string;
  userId: string;
  listId: string;
  name: string;
  createdAt: Date;
  crossedOff?: boolean;
  crossedOffAt?: Date; // When the item was crossed off (for "last 10 removed" ordering)
  quantity?: number; // Quantity of the item (defaults to 1)
  quantityUnit?: string; // Unit abbreviation (c, pt, qt, gal, oz, lb, g, kg, ml, l/L) - only standard measurements
  // Recipe import tracking
  source?: string; // e.g., "recipe_import"
  mealId?: string; // Link to planned meal
}

