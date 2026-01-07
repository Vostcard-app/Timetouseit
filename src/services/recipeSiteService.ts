/**
 * Recipe Site Service
 * Handles CRUD operations for recipe_sites collection
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
  orderBy,
  Timestamp,
  onSnapshot,
  type QuerySnapshot,
  type DocumentData
} from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import type { RecipeSite, RecipeSiteData } from '../types/recipeImport';
import { transformDocument, transformSnapshot, cleanFirestoreData, logServiceOperation, logServiceError, handleSubscriptionError } from './baseService';
import { toServiceError } from './errors';

/**
 * Recipe Site Service
 */
export const recipeSiteService = {
  /**
   * Get all recipe sites
   */
  async getRecipeSites(): Promise<RecipeSite[]> {
    logServiceOperation('getRecipeSites', 'recipe_sites', {});

    try {
      const q = query(
        collection(db, 'recipe_sites'),
        orderBy('label', 'asc')
      );
      const snapshot = await getDocs(q);
      return transformSnapshot<RecipeSite>(snapshot, ['createdAt', 'updatedAt']);
    } catch (error) {
      logServiceError('getRecipeSites', 'recipe_sites', error);
      throw toServiceError(error, 'recipe_sites');
    }
  },

  /**
   * Get enabled recipe sites only
   */
  async getEnabledRecipeSites(): Promise<RecipeSite[]> {
    logServiceOperation('getEnabledRecipeSites', 'recipe_sites', {});

    try {
      const q = query(
        collection(db, 'recipe_sites'),
        orderBy('enabled', 'desc'),
        orderBy('label', 'asc')
      );
      const snapshot = await getDocs(q);
      const allSites = transformSnapshot<RecipeSite>(snapshot, ['createdAt', 'updatedAt']);
      return allSites.filter(site => site.enabled);
    } catch (error) {
      logServiceError('getEnabledRecipeSites', 'recipe_sites', error);
      throw toServiceError(error, 'recipe_sites');
    }
  },

  /**
   * Get a single recipe site by ID
   */
  async getRecipeSite(id: string): Promise<RecipeSite | null> {
    logServiceOperation('getRecipeSite', 'recipe_sites', { id });

    try {
      const docRef = doc(db, 'recipe_sites', id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }

      return transformDocument<RecipeSite>(docSnap, ['createdAt', 'updatedAt']);
    } catch (error) {
      logServiceError('getRecipeSite', 'recipe_sites', error, { id });
      throw toServiceError(error, 'recipe_sites');
    }
  },

  /**
   * Create a new recipe site
   */
  async createRecipeSite(data: RecipeSiteData): Promise<string> {
    logServiceOperation('createRecipeSite', 'recipe_sites', { label: data.label });

    try {
      const now = Timestamp.now();
      const siteData = {
        ...cleanFirestoreData(data as unknown as Record<string, unknown>),
        createdAt: now,
        updatedAt: now
      };

      const docRef = await addDoc(collection(db, 'recipe_sites'), siteData);
      return docRef.id;
    } catch (error) {
      logServiceError('createRecipeSite', 'recipe_sites', error, { label: data.label });
      throw toServiceError(error, 'recipe_sites');
    }
  },

  /**
   * Update a recipe site
   */
  async updateRecipeSite(id: string, data: Partial<RecipeSiteData>): Promise<void> {
    logServiceOperation('updateRecipeSite', 'recipe_sites', { id, data });

    try {
      const docRef = doc(db, 'recipe_sites', id);
      const updateData = {
        ...cleanFirestoreData(data as unknown as Record<string, unknown>),
        updatedAt: Timestamp.now()
      };

      await updateDoc(docRef, updateData);
    } catch (error) {
      logServiceError('updateRecipeSite', 'recipe_sites', error, { id });
      throw toServiceError(error, 'recipe_sites');
    }
  },

  /**
   * Delete a recipe site
   */
  async deleteRecipeSite(id: string): Promise<void> {
    logServiceOperation('deleteRecipeSite', 'recipe_sites', { id });

    try {
      const docRef = doc(db, 'recipe_sites', id);
      await deleteDoc(docRef);
    } catch (error) {
      logServiceError('deleteRecipeSite', 'recipe_sites', error, { id });
      throw toServiceError(error, 'recipe_sites');
    }
  },

  /**
   * Subscribe to recipe sites changes
   */
  subscribeToRecipeSites(callback: (sites: RecipeSite[]) => void): () => void {
    logServiceOperation('subscribeToRecipeSites', 'recipe_sites', {});

    const q = query(
      collection(db, 'recipe_sites'),
      orderBy('label', 'asc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const sites = transformSnapshot<RecipeSite>(snapshot, ['createdAt', 'updatedAt']);
        callback(sites);
      },
      (error) => {
        handleSubscriptionError(
          error,
          'recipe_sites',
          undefined,
          () => {
            const fallbackQ = query(collection(db, 'recipe_sites'));
            return getDocs(fallbackQ);
          },
          (snapshot) => {
            const sites = transformSnapshot<RecipeSite>(snapshot, ['createdAt', 'updatedAt']);
            callback(sites);
          }
        );
        callback([]);
      }
    );

    return unsubscribe;
  }
};

