import {
  Timestamp,
  onSnapshot,
  type QuerySnapshot,
  type DocumentData
} from 'firebase/firestore';
import type { UserItem, UserItemData } from '../types';
import { transformSnapshot, transformDocument, cleanFirestoreData, logServiceOperation, logServiceError, handleSubscriptionError } from './baseService';
import { toServiceError } from './errors';
import { buildUserQueryWithOrder, buildQueryWithFilters, buildUserQuery } from './firestoreQueryBuilder';
import { getDateFieldsForCollection } from '../utils/firestoreDateUtils';
import { collection, doc, addDoc, updateDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

/**
 * User Items Service
 * Handles operations for user items (master list of items)
 */
export const userItemsService = {
  /**
   * Get all user items
   */
  async getUserItems(userId: string): Promise<UserItem[]> {
    logServiceOperation('getUserItems', 'userItems', { userId });

    try {
      const q = buildUserQueryWithOrder('userItems', userId, 'lastUsed', 'desc');
      const querySnapshot = await getDocs(q);
      const dateFields = getDateFieldsForCollection('userItems');
      return transformSnapshot<UserItem>(querySnapshot, dateFields);
    } catch (error) {
      logServiceError('getUserItems', 'userItems', error, { userId });
      throw toServiceError(error, 'userItems');
    }
  },

  /**
   * Get user item by name
   */
  async getUserItemByName(userId: string, name: string): Promise<UserItem | null> {
    logServiceOperation('getUserItemByName', 'userItems', { userId, name });

    try {
      const q = buildQueryWithFilters('userItems', userId, [['name', '==', name]]);
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }
      
      const dateFields = getDateFieldsForCollection('userItems');
      return transformDocument<UserItem>(querySnapshot.docs[0], dateFields);
    } catch (error) {
      logServiceError('getUserItemByName', 'userItems', error, { userId, name });
      throw toServiceError(error, 'userItems');
    }
  },

  /**
   * Create or update user item by name
   */
  async createOrUpdateUserItem(userId: string, data: UserItemData): Promise<string> {
    logServiceOperation('createOrUpdateUserItem', 'userItems', { userId, name: data.name });

    try {
      const existing = await this.getUserItemByName(userId, data.name);
      
      if (existing) {
        // Update existing item
        const docRef = doc(db, 'userItems', existing.id);
        const updateData: Record<string, unknown> = {
          expirationLength: data.expirationLength,
          category: data.category || null,
          lastUsed: new Date() // Will be converted to Timestamp
        };
        if (data.isDryCanned !== undefined) {
          updateData.isDryCanned = data.isDryCanned;
        }
        
        const cleanUpdateData = cleanFirestoreData(updateData);
        // Convert Date to Timestamp
        if (cleanUpdateData.lastUsed instanceof Date) {
          cleanUpdateData.lastUsed = Timestamp.fromDate(cleanUpdateData.lastUsed);
        }
        
        await updateDoc(docRef, cleanUpdateData);
        return existing.id;
      } else {
        // Create new item
        const itemData: Record<string, unknown> = {
          userId,
          name: data.name,
          expirationLength: data.expirationLength,
          createdAt: new Date(), // Will be converted to Timestamp
          lastUsed: new Date() // Will be converted to Timestamp
        };
        
        if (data.category !== undefined) {
          itemData.category = data.category;
        }
        if (data.isDryCanned !== undefined) {
          itemData.isDryCanned = data.isDryCanned;
        }
        
        const cleanData = cleanFirestoreData(itemData);
        // Convert Dates to Timestamps
        if (cleanData.createdAt instanceof Date) {
          cleanData.createdAt = Timestamp.fromDate(cleanData.createdAt);
        }
        if (cleanData.lastUsed instanceof Date) {
          cleanData.lastUsed = Timestamp.fromDate(cleanData.lastUsed);
        }
        
        const docRef = await addDoc(collection(db, 'userItems'), cleanData);
        return docRef.id;
      }
    } catch (error) {
      logServiceError('createOrUpdateUserItem', 'userItems', error, { userId, name: data.name });
      throw toServiceError(error, 'userItems');
    }
  },

  /**
   * Update user item by ID
   */
  async updateUserItem(itemId: string, data: Partial<UserItemData>): Promise<void> {
    logServiceOperation('updateUserItem', 'userItems', { itemId });
    
    try {
      const docRef = doc(db, 'userItems', itemId);
      const updateData = cleanFirestoreData({
        ...(data.name !== undefined && { name: data.name }),
        ...(data.expirationLength !== undefined && { expirationLength: data.expirationLength }),
        ...(data.category !== undefined && { category: data.category || null })
      });
      
      await updateDoc(docRef, updateData);
    } catch (error) {
      logServiceError('updateUserItem', 'userItems', error, { itemId });
      throw toServiceError(error, 'userItems');
    }
  },

  /**
   * Update all user items with the same name
   */
  async updateAllUserItemsByName(userId: string, name: string, data: Partial<UserItemData>): Promise<void> {
    logServiceOperation('updateAllUserItemsByName', 'userItems', { userId, name });

    try {
      const q = buildQueryWithFilters('userItems', userId, [['name', '==', name]]);
      const querySnapshot = await getDocs(q);
      
      const updatePromises = querySnapshot.docs.map(doc => {
        const updateData = cleanFirestoreData({
          ...(data.name !== undefined && { name: data.name }),
          ...(data.expirationLength !== undefined && { expirationLength: data.expirationLength }),
          ...(data.category !== undefined && { category: data.category || null })
        });
        return updateDoc(doc.ref, updateData);
      });
      
      await Promise.all(updatePromises);
    } catch (error) {
      logServiceError('updateAllUserItemsByName', 'userItems', error, { userId, name });
      throw toServiceError(error, 'userItems');
    }
  },

  /**
   * Subscribe to user items changes
   */
  subscribeToUserItems(
    userId: string,
    callback: (items: UserItem[]) => void
  ): () => void {
    logServiceOperation('subscribeToUserItems', 'userItems', { userId });
    
    const dateFields = getDateFieldsForCollection('userItems');
    
    // Try the query with orderBy first
    const q = buildUserQueryWithOrder('userItems', userId, 'lastUsed', 'desc');
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const items = transformSnapshot<UserItem>(snapshot, dateFields);
        callback(items);
      },
      (error) => {
        handleSubscriptionError(
          error,
          'userItems',
          userId,
          () => {
            // Fallback query without orderBy
            return getDocs(buildUserQuery('userItems', userId));
          },
          (snapshot) => {
            const items = transformSnapshot<UserItem>(snapshot, dateFields);
            // Sort by lastUsed descending manually since we can't orderBy in query
            items.sort((a, b) => {
              if (!a.lastUsed && !b.lastUsed) return 0;
              if (!a.lastUsed) return 1;
              if (!b.lastUsed) return -1;
              return b.lastUsed.getTime() - a.lastUsed.getTime();
            });
            callback(items);
          }
        );
        callback([]); // Return empty array so app doesn't break
      }
    );
    
    return unsubscribe;
  }
};

