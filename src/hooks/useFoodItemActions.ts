/**
 * useFoodItemActions Hook
 * Handles food item actions: delete, freeze, edit
 */

import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase/firebaseConfig';
import { foodItemService } from '../services/foodItemService';
import { analyticsService } from '../services/analyticsService';
import { notRecommendedToFreeze } from '../data/freezeGuidelines';
import { logServiceError } from '../services/baseService';
import type { FoodItem } from '../types';

export function useFoodItemActions(foodItems: FoodItem[]) {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  const [showFreezeWarning, setShowFreezeWarning] = useState(false);
  const [pendingFreezeItem, setPendingFreezeItem] = useState<FoodItem | null>(null);

  const handleDelete = useCallback(async (itemId: string) => {
    // Track engagement: core_action_used (toss)
    if (user) {
      const item = foodItems.find(i => i.id === itemId);
      await analyticsService.trackEngagement(user.uid, 'core_action_used', {
        action: 'toss',
        itemId,
        itemName: item?.name,
      });
    }
    
    try {
      await foodItemService.deleteFoodItem(itemId);
    } catch (error) {
      logServiceError('deleteFoodItem', 'foodItems', error, { itemId });
      alert('Failed to delete item. Please try again.');
    }
  }, [user, foodItems]);

  const handleItemClick = useCallback((item: FoodItem) => {
    navigate('/add', { state: { editingItem: item } });
  }, [navigate]);

  const handleFreezeItem = useCallback((item: FoodItem) => {
    // Track engagement: core_action_used (freeze)
    if (user) {
      analyticsService.trackEngagement(user.uid, 'core_action_used', {
        action: 'freeze',
        itemId: item.id,
        itemName: item.name,
      });
    }
    
    const normalizedName = item.name.trim().toLowerCase();
    const isNotRecommended = notRecommendedToFreeze.some(listItem => {
      const normalizedItem = listItem.toLowerCase();
      return normalizedItem === normalizedName || normalizedName.includes(normalizedItem);
    });
    
    if (isNotRecommended) {
      // Show warning modal
      setPendingFreezeItem(item);
      setShowFreezeWarning(true);
      return;
    } else {
      // Navigate directly
      navigate('/add', { state: { editingItem: item, forceFreeze: true } });
    }
  }, [navigate, user]);

  const handleDismissFreezeWarning = useCallback(() => {
    setShowFreezeWarning(false);
    setPendingFreezeItem(null);
  }, []);

  const handleProceedWithFreeze = useCallback(() => {
    if (pendingFreezeItem) {
      navigate('/add', { state: { editingItem: pendingFreezeItem, forceFreeze: true } });
    }
    setShowFreezeWarning(false);
    setPendingFreezeItem(null);
  }, [navigate, pendingFreezeItem]);

  return {
    handleDelete,
    handleItemClick,
    handleFreezeItem,
    showFreezeWarning,
    pendingFreezeItem,
    handleDismissFreezeWarning,
    handleProceedWithFreeze
  };
}

