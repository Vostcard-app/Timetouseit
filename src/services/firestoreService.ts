/**
 * Firestore Service Base Utilities
 * Standardized patterns for Firestore operations across all services
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  onSnapshot,
  type Query,
  type QuerySnapshot,
  type DocumentData
} from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import {
  transformDocument,
  transformSnapshot,
  cleanFirestoreData,
  handleSubscriptionError,
  logServiceOperation,
  logServiceError
} from './baseService';
import { toServiceError } from './errors';

/**
 * Collection-specific date field mappings
 */
export const COLLECTION_DATE_FIELDS: Record<string, string[]> = {
  foodItems: ['expirationDate', 'thawDate', 'addedDate'],
  userItems: ['createdAt', 'lastUsed'],
  shoppingLists: ['createdAt', 'updatedAt'],
  userSettings: ['createdAt', 'updatedAt'],
  mealPlans: ['createdAt', 'date', 'updatedAt'],
  mealProfiles: ['createdAt', 'updatedAt']
};

/**
 * Standardized CRUD operations for Firestore collections
 */
export class FirestoreService<T extends { id: string }> {
  private collectionName: string;
  private dateFields: string[];

  constructor(
    collectionName: string,
    dateFields: string[] = COLLECTION_DATE_FIELDS[collectionName] || ['createdAt', 'updatedAt']
  ) {
    this.collectionName = collectionName;
    this.dateFields = dateFields;
  }

  /**
   * Get collection reference
   */
  getCollection() {
    return collection(db, this.collectionName);
  }

  /**
   * Get document reference
   */
  getDocRef(id: string) {
    return doc(db, this.collectionName, id);
  }

  /**
   * Create a user-scoped query
   */
  createUserQuery(userId: string, orderByField?: string, orderDirection: 'asc' | 'desc' = 'asc'): Query<DocumentData> {
    const baseQuery = query(
      this.getCollection(),
      where('userId', '==', userId)
    );

    if (orderByField) {
      return query(baseQuery, orderBy(orderByField, orderDirection));
    }

    return baseQuery;
  }

  /**
   * Get all documents for a user
   */
  async getAll(userId: string, orderByField?: string): Promise<T[]> {
    logServiceOperation('getAll', this.collectionName, { userId, orderByField });

    try {
      const q = this.createUserQuery(userId, orderByField);
      const snapshot = await getDocs(q);
      return transformSnapshot<T>(snapshot, this.dateFields);
    } catch (error) {
      logServiceError('getAll', this.collectionName, error, { userId });
      throw toServiceError(error, this.collectionName);
    }
  }

  /**
   * Get a single document by ID
   */
  async getById(id: string): Promise<T | null> {
    logServiceOperation('getById', this.collectionName, { id });

    try {
      const docRef = this.getDocRef(id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }

      return transformDocument<T>(docSnap, this.dateFields);
    } catch (error) {
      logServiceError('getById', this.collectionName, error, { id });
      throw toServiceError(error, this.collectionName);
    }
  }

  /**
   * Subscribe to user's documents
   */
  subscribe(
    userId: string,
    callback: (items: T[]) => void,
    orderByField?: string,
    fallbackQuery?: () => QuerySnapshot<DocumentData>
  ): () => void {
    logServiceOperation('subscribe', this.collectionName, { userId, orderByField });

    const q = this.createUserQuery(userId, orderByField);

    const unsubscribe = onSnapshot(
      q,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const items = transformSnapshot<T>(snapshot, this.dateFields);
        callback(items);
      },
      (error) => {
        handleSubscriptionError(
          error,
          this.collectionName,
          userId,
          fallbackQuery,
          (snapshot) => {
            const items = transformSnapshot<T>(snapshot, this.dateFields);
            callback(items);
          }
        );
        callback([]); // Return empty array so app doesn't break
      }
    );

    return unsubscribe;
  }

  /**
   * Create a new document
   */
  async create(data: Omit<T, 'id'>, userId?: string): Promise<string> {
    logServiceOperation('create', this.collectionName, { userId });

    try {
      // Prepare data for Firestore
      const firestoreData = this.prepareDataForFirestore(data, userId);
      const docRef = await addDoc(this.getCollection(), firestoreData);
      return docRef.id;
    } catch (error) {
      logServiceError('create', this.collectionName, error, { userId });
      throw toServiceError(error, this.collectionName);
    }
  }

  /**
   * Update an existing document
   */
  async update(id: string, updates: Partial<T>): Promise<void> {
    logServiceOperation('update', this.collectionName, { id });

    try {
      const docRef = this.getDocRef(id);
      const firestoreData = this.prepareDataForFirestore(updates);
      await updateDoc(docRef, firestoreData);
    } catch (error) {
      logServiceError('update', this.collectionName, error, { id });
      throw toServiceError(error, this.collectionName);
    }
  }

  /**
   * Delete a document
   */
  async delete(id: string): Promise<void> {
    logServiceOperation('delete', this.collectionName, { id });

    try {
      await deleteDoc(this.getDocRef(id));
    } catch (error) {
      logServiceError('delete', this.collectionName, error, { id });
      throw toServiceError(error, this.collectionName);
    }
  }

  /**
   * Prepare data for Firestore (convert Dates to Timestamps, clean undefined values)
   */
  private prepareDataForFirestore(data: Partial<T> | Omit<T, 'id'>, userId?: string): Record<string, unknown> {
    const prepared: Record<string, unknown> = {};

    // Add userId if provided
    if (userId) {
      prepared.userId = userId;
    }

    // Copy all fields, converting Dates to Timestamps
    Object.keys(data).forEach(key => {
      const value = (data as Record<string, unknown>)[key];
      
      // Skip undefined values
      if (value === undefined) {
        return;
      }

      // Convert Date objects to Timestamps
      if (value instanceof Date) {
        prepared[key] = Timestamp.fromDate(value);
      } else {
        prepared[key] = value;
      }
    });

    // Clean undefined values (shouldn't be any at this point, but just in case)
    return cleanFirestoreData(prepared);
  }
}

/**
 * Helper to create a Firestore service instance
 */
export function createFirestoreService<T extends { id: string }>(
  collectionName: string,
  dateFields?: string[]
): FirestoreService<T> {
  return new FirestoreService<T>(collectionName, dateFields);
}

