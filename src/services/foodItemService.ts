import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  onSnapshot,
  QuerySnapshot
} from 'firebase/firestore';
import type { DocumentData } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase/firebaseConfig';
import type { FoodItem, FoodItemData } from '../types';
import { analyticsService } from './analyticsService';

/**
 * Food Items Service
 * Handles all CRUD operations for food items
 */
export const foodItemService = {
  /**
   * Get all food items for a user
   */
  async getFoodItems(userId: string): Promise<FoodItem[]> {
    const q = query(
      collection(db, 'foodItems'),
      where('userId', '==', userId),
      orderBy('expirationDate', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      expirationDate: doc.data().expirationDate.toDate(),
      addedDate: doc.data().addedDate.toDate()
    })) as FoodItem[];
  },

  /**
   * Subscribe to food items changes
   */
  subscribeToFoodItems(
    userId: string,
    callback: (items: FoodItem[]) => void
  ): () => void {
    const q = query(
      collection(db, 'foodItems'),
      where('userId', '==', userId)
      // Note: Can't orderBy expirationDate since frozen items don't have it
      // Will need to sort in memory instead
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const items = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            expirationDate: data.expirationDate ? data.expirationDate.toDate() : undefined,
            thawDate: data.thawDate ? data.thawDate.toDate() : undefined,
            addedDate: data.addedDate.toDate()
          };
        }) as FoodItem[];
        callback(items);
      },
      (error) => {
        // Handle Firestore errors gracefully
        console.error('❌ Firestore query error:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Full error object:', JSON.stringify(error, null, 2));
        
        // Track sync failure
        if (userId) {
          analyticsService.trackQuality(userId, 'sync_failed', {
            errorType: error.code || 'unknown',
            errorMessage: error.message || 'Unknown Firestore error',
            action: 'subscribe_food_items',
          });
        }
        
        // If index is missing or still building
        if (error.code === 'failed-precondition') {
          // Only log once to reduce console noise
          if (!window.__firestoreIndexWarningShown) {
            console.warn('⚠️ Firestore index required for food items query.');
            console.warn('📋 Create the index here:', error.message.match(/https:\/\/[^\s]+/)?.[0] || 'Firebase Console → Firestore → Indexes');
            console.warn('💡 The app will work, but food items won\'t load until the index is created and enabled.');
            console.warn('💡 If you just created the index, wait 2-5 minutes for it to build, then refresh.');
            window.__firestoreIndexWarningShown = true;
          }
          callback([]); // Return empty array so app doesn't break
        } else {
          // For other errors, log them normally
          console.error('Error in food items subscription:', error);
          callback([]); // Still return empty array to prevent app crash
        }
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
    
    // Remove undefined fields (Firestore doesn't allow undefined)
    const cleanData: Record<string, unknown> = {
      userId,
      name: data.name,
      addedDate: Timestamp.now(),
      status,
      reminderSent: false
    };
    
    // For frozen items: save thawDate, for non-frozen: save expirationDate
    if (data.isFrozen && data.thawDate) {
      cleanData.thawDate = Timestamp.fromDate(data.thawDate);
      // Don't include expirationDate for frozen items
    } else if (data.expirationDate) {
      cleanData.expirationDate = Timestamp.fromDate(data.expirationDate);
    }
    
    if (data.barcode) cleanData.barcode = data.barcode;
    if (data.photoUrl) cleanData.photoUrl = data.photoUrl;
    if (data.quantity) cleanData.quantity = data.quantity;
    if (data.category) cleanData.category = data.category;
    if (data.notes) cleanData.notes = data.notes;
    if (data.isFrozen !== undefined) cleanData.isFrozen = data.isFrozen;
    if (data.freezeCategory) cleanData.freezeCategory = data.freezeCategory;
    
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
    const docRef = doc(db, 'foodItems', itemId);
    
    // Filter out undefined values (Firestore doesn't allow undefined)
    const updateData: Record<string, unknown> = {};
    Object.keys(updates).forEach(key => {
      const value = updates[key as keyof typeof updates];
      if (value !== undefined) {
        updateData[key] = value;
      }
    });
    
    // Convert Date objects to Firestore Timestamps
    if (updateData.expirationDate && updateData.expirationDate instanceof Date) {
      updateData.expirationDate = Timestamp.fromDate(updateData.expirationDate);
    }
    if (updateData.thawDate && updateData.thawDate instanceof Date) {
      updateData.thawDate = Timestamp.fromDate(updateData.thawDate);
    }
    
    await updateDoc(docRef, updateData);
  },

  /**
   * Delete a food item
   */
  async deleteFoodItem(itemId: string): Promise<void> {
    await deleteDoc(doc(db, 'foodItems', itemId));
  },

  /**
   * Upload photo for a food item
   */
  async uploadPhoto(userId: string, file: File): Promise<string> {
    const storageRef = ref(storage, `foodItems/${userId}/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    const photoUrl = await getDownloadURL(storageRef);
    return photoUrl;
  }
};

