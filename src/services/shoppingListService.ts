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
import type { ShoppingListItem } from '../types';

/**
 * Shopping List Service
 * Handles operations for individual shopping list items
 */
export const shoppingListService = {
  /**
   * Get all shopping list items for a specific list
   */
  async getShoppingListItems(userId: string, listId: string): Promise<ShoppingListItem[]> {
    const q = query(
      collection(db, 'shoppingList'),
      where('userId', '==', userId),
      where('listId', '==', listId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate()
    })) as ShoppingListItem[];
  },

  /**
   * Subscribe to shopping list changes
   */
  subscribeToShoppingList(
    userId: string,
    listId: string,
    callback: (items: ShoppingListItem[]) => void
  ): () => void {
    const q = query(
      collection(db, 'shoppingList'),
      where('userId', '==', userId),
      where('listId', '==', listId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const items = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt.toDate()
        })) as ShoppingListItem[];
        callback(items);
      },
      (error) => {
        if (error.code === 'failed-precondition') {
          if (!window.__shoppingListIndexWarningShown) {
            const indexUrl = error.message.match(/https:\/\/[^\s]+/)?.[0];
            console.warn('⚠️ Firestore index required for shopping list query.');
            if (indexUrl) {
              console.warn('📋 Create the index here:', indexUrl);
            } else {
              console.warn('📋 Go to Firebase Console → Firestore → Indexes to create the index.');
            }
            console.warn('💡 Shopping list items won\'t load until the index is created and enabled.');
            window.__shoppingListIndexWarningShown = true;
          }
          callback([]); // Return empty array so app doesn't break
        } else {
          console.error('Error in shopping list subscription:', error);
          callback([]);
        }
      }
    );

    return unsubscribe;
  },

  /**
   * Add item to shopping list
   */
  async addShoppingListItem(userId: string, listId: string, name: string, crossedOff?: boolean): Promise<string> {
    const cleanData: Record<string, unknown> = {
      userId,
      listId,
      name,
      createdAt: Timestamp.now()
    };
    
    if (crossedOff !== undefined) {
      cleanData.crossedOff = crossedOff;
    }
    
    const docRef = await addDoc(collection(db, 'shoppingList'), cleanData);
    return docRef.id;
  },

  /**
   * Update crossedOff status of a shopping list item
   */
  async updateShoppingListItemCrossedOff(itemId: string, crossedOff: boolean): Promise<void> {
    await updateDoc(doc(db, 'shoppingList', itemId), {
      crossedOff
    });
  },

  /**
   * Update name of a shopping list item
   */
  async updateShoppingListItemName(itemId: string, name: string): Promise<void> {
    await updateDoc(doc(db, 'shoppingList', itemId), {
      name
    });
  },

  /**
   * Delete item from shopping list
   */
  async deleteShoppingListItem(itemId: string): Promise<void> {
    await deleteDoc(doc(db, 'shoppingList', itemId));
  }
};

