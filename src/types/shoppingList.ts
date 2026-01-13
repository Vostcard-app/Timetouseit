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
  quantity?: number; // Quantity of the item (defaults to 1)
  // Recipe import tracking
  source?: string; // e.g., "recipe_import"
  mealId?: string; // Link to planned meal
}

