/**
 * Base Service Class
 * Abstract base class for Firestore services with common patterns
 */

import type { QuerySnapshot, DocumentData } from 'firebase/firestore';
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import {
  handleSubscriptionError,
  cleanFirestoreData,
  transformDocument,
  transformSnapshot,
  logServiceOperation,
  logServiceError
} from './baseService';
import { toServiceError, FirestoreError } from './errors';

export interface ServiceOptions {
  dateFields?: string[];
  collectionName: string;
}

/**
 * Abstract base class for Firestore services
 */
export abstract class BaseService<T extends { id: string }> {
  protected collectionName: string;
  protected dateFields: string[];

  constructor(options: ServiceOptions) {
    this.collectionName = options.collectionName;
    this.dateFields = options.dateFields || ['createdAt', 'addedDate', 'lastUsed'];
  }

  /**
   * Transform Firestore document to typed object
   */
  protected transformDocument(doc: { id: string; data: () => DocumentData }): T {
    return transformDocument<T>(doc, this.dateFields);
  }

  /**
   * Transform Firestore snapshot to typed array
   */
  protected transformSnapshot(snapshot: QuerySnapshot<DocumentData>): T[] {
    return transformSnapshot<T>(snapshot, this.dateFields);
  }

  /**
   * Get a document by ID
   */
  async getById(id: string): Promise<T | null> {
    logServiceOperation('getById', this.collectionName, { id });

    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      return this.transformDocument(docSnap);
    } catch (error) {
      logServiceError('getById', this.collectionName, error, { id });
      throw toServiceError(error, this.collectionName);
    }
  }

  /**
   * Get all documents for a user
   */
  async getAll(userId: string): Promise<T[]> {
    logServiceOperation('getAll', this.collectionName, { userId });

    try {
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId)
      );

      const snapshot = await getDocs(q);
      return this.transformSnapshot(snapshot);
    } catch (error) {
      logServiceError('getAll', this.collectionName, error, { userId });
      throw toServiceError(error, this.collectionName);
    }
  }

  /**
   * Create a new document
   */
  async create(data: Omit<T, 'id'>): Promise<string> {
    logServiceOperation('create', this.collectionName, { data });

    try {
      const cleanData = cleanFirestoreData(data as Record<string, unknown>);
      const docRef = await addDoc(collection(db, this.collectionName), cleanData);
      return docRef.id;
    } catch (error) {
      logServiceError('create', this.collectionName, error, { data });
      throw toServiceError(error, this.collectionName);
    }
  }

  /**
   * Update a document
   */
  async update(id: string, updates: Partial<T>): Promise<void> {
    logServiceOperation('update', this.collectionName, { id, updates });

    try {
      const docRef = doc(db, this.collectionName, id);
      const cleanData = cleanFirestoreData(updates as Record<string, unknown>);
      await updateDoc(docRef, cleanData);
    } catch (error) {
      logServiceError('update', this.collectionName, error, { id, updates });
      throw toServiceError(error, this.collectionName);
    }
  }

  /**
   * Delete a document
   */
  async delete(id: string): Promise<void> {
    logServiceOperation('delete', this.collectionName, { id });

    try {
      const docRef = doc(db, this.collectionName, id);
      await deleteDoc(docRef);
    } catch (error) {
      logServiceError('delete', this.collectionName, error, { id });
      throw toServiceError(error, this.collectionName);
    }
  }

  /**
   * Handle subscription errors (to be used by subclasses)
   */
  protected handleSubscriptionError(
    error: unknown,
    userId?: string,
    fallbackQuery?: () => QuerySnapshot<DocumentData> | Promise<QuerySnapshot<DocumentData>>,
    fallbackCallback?: (snapshot: QuerySnapshot<DocumentData>) => void
  ): void {
    handleSubscriptionError(error, this.collectionName, userId, fallbackQuery, fallbackCallback);
  }
}
