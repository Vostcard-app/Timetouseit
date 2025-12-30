import {
  doc,
  getDoc,
  setDoc,
  updateDoc
} from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import type { UserSettings, FirestoreUpdateData } from '../types';

/**
 * User Settings Service
 * Handles user settings operations
 */
export const userSettingsService = {
  /**
   * Get user settings
   */
  async getUserSettings(userId: string): Promise<UserSettings | null> {
    const docRef = doc(db, 'userSettings', userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as UserSettings;
    }
    return null;
  },

  /**
   * Create or update user settings
   */
  async updateUserSettings(settings: UserSettings): Promise<void> {
    const docRef = doc(db, 'userSettings', settings.userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      await updateDoc(docRef, settings as FirestoreUpdateData<UserSettings>);
    } else {
      // Use setDoc to create with userId as document ID
      await setDoc(docRef, settings);
    }
  },

  /**
   * Set last used shopping list
   */
  async setLastUsedShoppingList(userId: string, listId: string): Promise<void> {
    const settings = await this.getUserSettings(userId);
    if (settings) {
      await this.updateUserSettings({ ...settings, lastUsedShoppingListId: listId });
    } else {
      await this.updateUserSettings({
        userId,
        reminderDays: 7,
        notificationsEnabled: true,
        lastUsedShoppingListId: listId
      });
    }
  }
};

