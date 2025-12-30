/**
 * useShoppingList Hook
 * Manages shopping list state and operations
 * 
 * @example
 * ```tsx
 * const { 
 *   items, 
 *   lists, 
 *   selectedList, 
 *   loading,
 *   addItem,
 *   removeItem,
 *   selectList 
 * } = useShoppingList(user);
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import type { User } from 'firebase/auth';
import { shoppingListService, shoppingListsService, userSettingsService } from '../services';
import type { ShoppingListItem, ShoppingList } from '../types';
import { STORAGE_KEYS } from '../constants';

const LAST_LIST_STORAGE_KEY = STORAGE_KEYS.LAST_SHOPPING_LIST_ID;

interface UseShoppingListReturn {
  items: ShoppingListItem[];
  lists: ShoppingList[];
  selectedList: ShoppingList | null;
  selectedListId: string | null;
  loading: boolean;
  addItem: (name: string, crossedOff?: boolean) => Promise<string>;
  removeItem: (itemId: string) => Promise<void>;
  updateItemCrossedOff: (itemId: string, crossedOff: boolean) => Promise<void>;
  updateItemName: (itemId: string, name: string) => Promise<void>;
  selectList: (listId: string) => Promise<void>;
  createList: (name: string) => Promise<string>;
}

/**
 * Hook for managing shopping list state
 */
export function useShoppingList(user: User | null): UseShoppingListReturn {
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load shopping lists
  useEffect(() => {
    if (!user) {
      setLists([]);
      setLoading(false);
      return;
    }

    const unsubscribe = shoppingListsService.subscribeToShoppingLists(
      user.uid,
      (updatedLists: ShoppingList[]) => {
        setLists(updatedLists);
        
        // Auto-select default list if no list is selected
        if (!selectedListId && updatedLists.length > 0) {
          const defaultList = updatedLists.find((list) => list.isDefault) || updatedLists[0];
          if (defaultList) {
            setSelectedListId(defaultList.id);
            localStorage.setItem(LAST_LIST_STORAGE_KEY, defaultList.id);
          }
        }
      }
    );

    return () => unsubscribe();
  }, [user, selectedListId]);

  // Load selected list from settings
  useEffect(() => {
    if (!user || lists.length === 0) return;

    const loadSelectedList = async () => {
      try {
        const settings = await userSettingsService.getUserSettings(user.uid);
        const lastUsedId = settings?.lastUsedShoppingListId;
        
        if (lastUsedId) {
          const listExists = lists.some((list) => list.id === lastUsedId);
          if (listExists) {
            setSelectedListId(lastUsedId);
            localStorage.setItem(LAST_LIST_STORAGE_KEY, lastUsedId);
            return;
          }
        }

        // Fallback to default or first list
        const defaultList = lists.find((list) => list.isDefault) || lists[0];
        if (defaultList) {
          setSelectedListId(defaultList.id);
          localStorage.setItem(LAST_LIST_STORAGE_KEY, defaultList.id);
        }
      } catch (error) {
        console.error('Error loading selected list:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSelectedList();
  }, [user, lists]);

  // Subscribe to items for selected list
  useEffect(() => {
    if (!user || !selectedListId) {
      setItems([]);
      return;
    }

    const unsubscribe = shoppingListService.subscribeToShoppingList(
      user.uid,
      selectedListId,
      (updatedItems: ShoppingListItem[]) => {
        setItems(updatedItems);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, selectedListId]);

  const addItem = useCallback(
    async (name: string, crossedOff = false): Promise<string> => {
      if (!user || !selectedListId) {
        throw new Error('User or list not selected');
      }
      return await shoppingListService.addShoppingListItem(
        user.uid,
        selectedListId,
        name,
        crossedOff
      );
    },
    [user, selectedListId]
  );

  const removeItem = useCallback(
    async (itemId: string): Promise<void> => {
      await shoppingListService.deleteShoppingListItem(itemId);
    },
    []
  );

  const updateItemCrossedOff = useCallback(
    async (itemId: string, crossedOff: boolean): Promise<void> => {
      await shoppingListService.updateShoppingListItemCrossedOff(itemId, crossedOff);
    },
    []
  );

  const updateItemName = useCallback(
    async (itemId: string, name: string): Promise<void> => {
      await shoppingListService.updateShoppingListItemName(itemId, name);
    },
    []
  );

  const selectList = useCallback(
    async (listId: string): Promise<void> => {
      if (!user) return;
      
      setSelectedListId(listId);
      localStorage.setItem(LAST_LIST_STORAGE_KEY, listId);
      await userSettingsService.setLastUsedShoppingList(user.uid, listId);
    },
    [user]
  );

  const createList = useCallback(
    async (name: string): Promise<string> => {
      if (!user) {
        throw new Error('User not authenticated');
      }
      const listId = await shoppingListsService.createShoppingList(user.uid, name);
      await selectList(listId);
      return listId;
    },
    [user, selectList]
  );

  const selectedList = lists.find((list) => list.id === selectedListId) || null;

  return {
    items,
    lists,
    selectedList,
    selectedListId,
    loading,
    addItem,
    removeItem,
    updateItemCrossedOff,
    updateItemName,
    selectList,
    createList,
  };
}

