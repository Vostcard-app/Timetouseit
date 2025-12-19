export interface FoodItem {
  id: string;
  userId: string;
  name: string;
  barcode?: string;
  expirationDate: Date;
  addedDate: Date;
  photoUrl?: string;
  quantity?: number;
  category?: string;
  status: 'fresh' | 'expiring_soon' | 'expired';
  reminderSent?: boolean;
  notes?: string;
}

export interface FoodItemData {
  name: string;
  barcode?: string;
  expirationDate: Date;
  photoUrl?: string;
  quantity?: number;
  category?: string;
  notes?: string;
}

export interface ShoppingListItem {
  id: string;
  userId: string;
  name: string;
  createdAt: Date;
}

export interface UserSettings {
  userId: string;
  reminderDays: number; // Days before expiration to send reminder
  notificationsEnabled: boolean;
  defaultCategory?: string;
}

export type FoodItemStatus = 'fresh' | 'expiring_soon' | 'expired';

