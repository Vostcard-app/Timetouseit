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
import { db } from '../firebase/firebaseConfig';
import type { ShoppingList, ErrorWithCode } from '../types';

/**
 * Shopping Lists Service
 * Handles operations for shopping list collections
 */
export const shoppingListsService = {
  /**
   * Get all shopping lists for a user
   */
  async getShoppingLists(userId: string): Promise<ShoppingList[]> {
    const q = query(
      collection(db, 'shoppingLists'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate()
    })) as ShoppingList[];
  },

  /**
   * Subscribe to shopping lists changes
   */
  subscribeToShoppingLists(
    userId: string,
    callback: (lists: ShoppingList[]) => void
  ): () => void {
    const q = query(
      collection(db, 'shoppingLists'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const lists = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt.toDate()
        })) as ShoppingList[];
        callback(lists);
      },
      (error: Error) => {
        // Check if it's an index error
        const errWithCode = error as ErrorWithCode;
        if (errWithCode?.code === 'failed-precondition' && error?.message?.includes('index')) {
          console.warn('⚠️ Firestore index required for shopping lists query.');
          if (error.message.includes('create_composite')) {
            const indexUrl = error.message.match(/https:\/\/[^\s]+/)?.[0];
            if (indexUrl) {
              console.warn('📋 Create the index here:', indexUrl);
            }
          }
          console.warn('💡 The app will work, but shopping lists won\'t load until the index is created.');
        } else {
          console.error('Error in shopping lists subscription:', error);
        }
        callback([]);
      }
    );
    return unsubscribe;
  },

  /**
   * Create a new shopping list
   */
  async createShoppingList(userId: string, name: string, isDefault: boolean = false): Promise<string> {
    const cleanData: Record<string, unknown> = {
      userId,
      name,
      createdAt: Timestamp.now(),
      isDefault
    };
    try {
      const docRef = await addDoc(collection(db, 'shoppingLists'), cleanData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating shopping list:', error);
      throw error;
    }
  },

  /**
   * Update shopping list
   */
  async updateShoppingList(listId: string, data: Partial<ShoppingList>): Promise<void> {
    try {
      const docRef = doc(db, 'shoppingLists', listId);
      const updateData: Record<string, unknown> = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.isDefault !== undefined) updateData.isDefault = data.isDefault;
      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error('Error updating shopping list:', error);
      throw error;
    }
  },

  /**
   * Delete shopping list
   */
  async deleteShoppingList(listId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'shoppingLists', listId));
    } catch (error) {
      console.error('Error deleting shopping list:', error);
      throw error;
    }
  },

  /**
   * Get or create default "shop list"
   */
  async getDefaultShoppingList(userId: string): Promise<string> {
    try {
      // Try to find existing default list
      const q = query(
        collection(db, 'shoppingLists'),
        where('userId', '==', userId),
        where('isDefault', '==', true)
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        return querySnapshot.docs[0].id;
      }

      // Try to find list named "Shop list"
      const nameQuery = query(
        collection(db, 'shoppingLists'),
        where('userId', '==', userId),
        where('name', '==', 'Shop list')
      );
      const nameSnapshot = await getDocs(nameQuery);
      
      if (!nameSnapshot.empty) {
        // Mark it as default
        const listId = nameSnapshot.docs[0].id;
        await this.updateShoppingList(listId, { isDefault: true });
        return listId;
      }

      // Create default "Shop list"
      return await this.createShoppingList(userId, 'Shop list', true);
    } catch (error) {
      console.error('Error getting default shopping list:', error);
      throw error;
    }
  }
};

