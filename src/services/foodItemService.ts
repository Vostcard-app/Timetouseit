import {
  Timestamp,
  onSnapshot,
  type QuerySnapshot,
  type DocumentData
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase/firebaseConfig';
import type { FoodItem, FoodItemData } from '../types';
import { analyticsService } from './analyticsService';
import { transformSnapshot, cleanFirestoreData, logServiceOperation, logServiceError, handleSubscriptionError } from './baseService';
import { toServiceError } from './errors';
import { buildUserQueryWithOrder, buildUserQuery } from './firestoreQueryBuilder';
import { getDateFieldsForCollection } from '../utils/firestoreDateUtils';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

/**
 * Food Items Service
 * Handles all CRUD operations for food items
 */
export const foodItemService = {
  /**
   * Get all food items for a user
   */
  async getFoodItems(userId: string): Promise<FoodItem[]> {
    logServiceOperation('getFoodItems', 'foodItems', { userId });

    try {
      const q = buildUserQueryWithOrder('foodItems', userId, 'expirationDate', 'asc');
      const querySnapshot = await getDocs(q);
      const dateFields = getDateFieldsForCollection('foodItems');
      return transformSnapshot<FoodItem>(querySnapshot, dateFields);
    } catch (error) {
      logServiceError('getFoodItems', 'foodItems', error, { userId });
      throw toServiceError(error, 'foodItems');
    }
  },

  /**
   * Subscribe to food items changes
   */
  subscribeToFoodItems(
    userId: string,
    callback: (items: FoodItem[]) => void
  ): () => void {
    logServiceOperation('subscribeToFoodItems', 'foodItems', { userId });

    // Note: Can't orderBy expirationDate since frozen items don't have it
    // Will need to sort in memory instead
    const q = buildUserQuery('foodItems', userId);
    const dateFields = getDateFieldsForCollection('foodItems');

    const unsubscribe = onSnapshot(
      q,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const items = transformSnapshot<FoodItem>(snapshot, dateFields);
        callback(items);
      },
      (error) => {
        handleSubscriptionError(
          error,
          'foodItems',
          userId,
          () => {
            // Fallback query without orderBy
            const fallbackQ = buildUserQuery('foodItems', userId);
            return getDocs(fallbackQ);
          },
          (snapshot) => {
            const items = transformSnapshot<FoodItem>(snapshot, dateFields);
            callback(items);
          }
        );
        callback([]); // Return empty array so app doesn't break
      }
    );

    return unsubscribe;
  },

  /**
   * Add a new food item
   */
  async addFoodItem(userId: string, data: FoodItemData, status: 'fresh' | 'expiring_soon' | 'expired'): Promise<string> {
    // Check if this is the first item with expiration/thaw date (activation event)
    const hasDate = (data.isFrozen && data.thawDate) || (!data.isFrozen && data.expirationDate);
    let isActivation = false;
    let timeToActivation: number | null = null;
    
    if (hasDate) {
      // Check if user has any existing food items with dates
      const existingItemsQuery = query(
        collection(db, 'foodItems'),
        where('userId', '==', userId)
      );
      const existingSnapshot = await getDocs(existingItemsQuery);
      
      // Check if any existing items have expiration or thaw dates
      const hasExistingItemsWithDates = existingSnapshot.docs.some(doc => {
        const itemData = doc.data();
        return itemData.expirationDate || itemData.thawDate;
      });
      
      if (!hasExistingItemsWithDates) {
        // This is the first item with a date - activation event!
        isActivation = true;
        
        // Calculate time to activation
        const signupTime = await analyticsService.getUserSignupTime(userId);
        if (signupTime) {
          timeToActivation = Math.floor((Date.now() - signupTime.getTime()) / 1000); // seconds
        }
      }
    }
    
    // Prepare data for Firestore
    const itemData: Record<string, unknown> = {
      userId,
      name: data.name,
      addedDate: new Date(), // Will be converted to Timestamp
      status,
      reminderSent: false
    };
    
    // For frozen items: save thawDate, for non-frozen: save expirationDate
    if (data.isFrozen && data.thawDate) {
      itemData.thawDate = data.thawDate; // Will be converted to Timestamp
      // Don't include expirationDate for frozen items
    } else if (data.expirationDate) {
      itemData.expirationDate = data.expirationDate; // Will be converted to Timestamp
    }
    
    // Add optional fields
    if (data.barcode !== undefined) itemData.barcode = data.barcode;
    if (data.photoUrl !== undefined) itemData.photoUrl = data.photoUrl;
    if (data.quantity !== undefined) itemData.quantity = data.quantity;
    if (data.quantityUnit !== undefined) itemData.quantityUnit = data.quantityUnit;
    if (data.category !== undefined) itemData.category = data.category;
    if (data.notes !== undefined) itemData.notes = data.notes;
    if (data.isFrozen !== undefined) itemData.isFrozen = data.isFrozen;
    if (data.freezeCategory !== undefined) itemData.freezeCategory = data.freezeCategory;
    if (data.isDryCanned !== undefined) itemData.isDryCanned = data.isDryCanned;
    
    // Clean and convert dates to Timestamps
    const cleanData = cleanFirestoreData(itemData);
    
    // Convert Date objects to Timestamps
    if (cleanData.addedDate instanceof Date) {
      cleanData.addedDate = Timestamp.fromDate(cleanData.addedDate);
    }
    if (cleanData.expirationDate instanceof Date) {
      cleanData.expirationDate = Timestamp.fromDate(cleanData.expirationDate);
    }
    if (cleanData.thawDate instanceof Date) {
      cleanData.thawDate = Timestamp.fromDate(cleanData.thawDate);
    }
    
    const docRef = await addDoc(collection(db, 'foodItems'), cleanData);
    
    // Track activation event if this is the first item with a date
    if (isActivation) {
      await analyticsService.trackActivation(userId, {
        itemId: docRef.id,
        itemName: data.name,
        timeToActivation: timeToActivation ?? undefined
      });
    }
    
    return docRef.id;
  },

  /**
   * Update a food item
   */
  async updateFoodItem(itemId: string, updates: Partial<FoodItemData & { status?: 'fresh' | 'expiring_soon' | 'expired'; reminderSent?: boolean }>): Promise<void> {
    logServiceOperation('updateFoodItem', 'foodItems', { itemId });
    
    try {
      const docRef = doc(db, 'foodItems', itemId);
      
      // Filter out undefined values (Firestore doesn't allow undefined)
      const updateData = cleanFirestoreData(updates as Record<string, unknown>);
      
      // Convert Date objects to Firestore Timestamps
      if (updateData.expirationDate && updateData.expirationDate instanceof Date) {
        updateData.expirationDate = Timestamp.fromDate(updateData.expirationDate);
      }
      if (updateData.thawDate && updateData.thawDate instanceof Date) {
        updateData.thawDate = Timestamp.fromDate(updateData.thawDate);
      }
      
      await updateDoc(docRef, updateData);
    } catch (error) {
      logServiceError('updateFoodItem', 'foodItems', error, { itemId });
      throw toServiceError(error, 'foodItems');
    }
  },

  /**
   * Delete a food item
   */
  async deleteFoodItem(itemId: string): Promise<void> {
    logServiceOperation('deleteFoodItem', 'foodItems', { itemId });
    
    try {
      await deleteDoc(doc(db, 'foodItems', itemId));
    } catch (error) {
      logServiceError('deleteFoodItem', 'foodItems', error, { itemId });
      throw toServiceError(error, 'foodItems');
    }
  },

  /**
   * Upload photo for a food item
   */
  async uploadPhoto(userId: string, file: File): Promise<string> {
    logServiceOperation('uploadPhoto', 'foodItems', { userId, fileName: file.name });
    
    try {
      const storageRef = ref(storage, `foodItems/${userId}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const photoUrl = await getDownloadURL(storageRef);
      return photoUrl;
    } catch (error) {
      logServiceError('uploadPhoto', 'foodItems', error, { userId, fileName: file.name });
      throw toServiceError(error, 'foodItems');
    }
  }
};

