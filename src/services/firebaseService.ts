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
  QuerySnapshot
} from 'firebase/firestore';
import type { DocumentData } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase/firebaseConfig';
import type { FoodItem, FoodItemData, UserSettings } from '../types';

// Food Items Service
export const foodItemService = {
  // Get all food items for a user
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

  // Subscribe to food items changes
  subscribeToFoodItems(
    userId: string,
    callback: (items: FoodItem[]) => void
  ): () => void {
    const q = query(
      collection(db, 'foodItems'),
      where('userId', '==', userId),
      orderBy('expirationDate', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        expirationDate: doc.data().expirationDate.toDate(),
        addedDate: doc.data().addedDate.toDate()
      })) as FoodItem[];
      callback(items);
    });

    return unsubscribe;
  },

  // Add a new food item
  async addFoodItem(userId: string, data: FoodItemData, status: 'fresh' | 'expiring_soon' | 'expired'): Promise<string> {
    const docRef = await addDoc(collection(db, 'foodItems'), {
      userId,
      ...data,
      expirationDate: Timestamp.fromDate(data.expirationDate),
      addedDate: Timestamp.now(),
      status,
      reminderSent: false
    });
    return docRef.id;
  },

  // Update a food item
  async updateFoodItem(itemId: string, updates: Partial<FoodItemData & { status: string; reminderSent?: boolean }>): Promise<void> {
    const docRef = doc(db, 'foodItems', itemId);
    const updateData: any = { ...updates };
    
    if (updates.expirationDate) {
      updateData.expirationDate = Timestamp.fromDate(updates.expirationDate);
    }
    
    await updateDoc(docRef, updateData);
  },

  // Delete a food item
  async deleteFoodItem(itemId: string): Promise<void> {
    await deleteDoc(doc(db, 'foodItems', itemId));
  },

  // Upload photo
  async uploadPhoto(userId: string, file: File): Promise<string> {
    const storageRef = ref(storage, `foodItems/${userId}/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  }
};

// User Settings Service
export const userSettingsService = {
  // Get user settings
  async getUserSettings(userId: string): Promise<UserSettings | null> {
    const docRef = doc(db, 'userSettings', userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as UserSettings;
    }
    return null;
  },

  // Create or update user settings
  async updateUserSettings(settings: UserSettings): Promise<void> {
    const docRef = doc(db, 'userSettings', settings.userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      await updateDoc(docRef, settings as any);
    } else {
      await addDoc(collection(db, 'userSettings'), settings);
    }
  }
};

