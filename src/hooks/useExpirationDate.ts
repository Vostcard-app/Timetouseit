/**
 * useExpirationDate Hook
 * Handles expiration date logic including FoodKeeper suggestions, AI helper, and dry goods shelf life
 */

import { useState, useEffect } from 'react';
import { addDays } from 'date-fns';
import { getSuggestedExpirationDate, findFoodItem } from '../services/foodkeeperService';
import { getDryGoodsShelfLife } from '../services/shelfLifeService';
import { getExpirationSuggestion } from '../services/expirationHelperService';
import { hasAvailableCredits } from '../services/expirationCreditService';
import { showToast } from '../components/Toast';
import type { UserItem } from '../types';

interface UseExpirationDateProps {
  itemName: string;
  isFrozen: boolean;
  isDryCanned?: boolean;
  userItems: UserItem[];
  hasManuallyChangedDate: boolean;
  initialItem?: { expirationDate?: Date } | null;
  onExpirationDateChange: (date: Date | undefined) => void;
}

export function useExpirationDate({
  itemName,
  isFrozen,
  isDryCanned = false,
  userItems,
  hasManuallyChangedDate,
  initialItem,
  onExpirationDateChange
}: UseExpirationDateProps) {
  const [suggestedExpirationDate, setSuggestedExpirationDate] = useState<Date | null>(null);
  const [qualityMessage, setQualityMessage] = useState<string | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [hasCredits, setHasCredits] = useState(true);

  // Check if credits are available
  useEffect(() => {
    const checkCredits = async () => {
      try {
        const available = await hasAvailableCredits();
        setHasCredits(available);
      } catch (error) {
        console.error('Error checking credits:', error);
        setHasCredits(false);
      }
    };
    checkCredits();
  }, []);

  // Calculate suggested expiration date based on item name and storage type
  useEffect(() => {
    if (itemName.trim()) {
      const storageType = isFrozen ? 'freezer' : (isDryCanned ? 'pantry' : 'refrigerator');
      
      // First check userItems for a matching item
      const normalizedName = itemName.trim().toLowerCase();
      const userItem = userItems.find(
        item => item.name.trim().toLowerCase() === normalizedName
      );
      
      let suggestion: Date | null = null;
      let qualityMsg: string | null = null;
      
      if (userItem && !isFrozen) {
        // Use user's custom expirationLength
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        suggestion = addDays(today, userItem.expirationLength);
      } else {
        // Fall back to foodkeeper.json or shelfLifeService
        const foodKeeperItem = findFoodItem(itemName.trim());
        suggestion = getSuggestedExpirationDate(itemName.trim(), storageType);
        
        // For dry/canned goods, get quality message from shelfLifeService
        if (isDryCanned && storageType === 'pantry') {
          const shelfLifeResult = getDryGoodsShelfLife(itemName.trim(), foodKeeperItem || null);
          if (shelfLifeResult && shelfLifeResult.qualityMessage) {
            qualityMsg = shelfLifeResult.qualityMessage;
          }
        }
      }
      
      setSuggestedExpirationDate(suggestion);
      setQualityMessage(qualityMsg);
      
      // Auto-apply suggestion if available and user hasn't manually changed the date
      if (suggestion && !hasManuallyChangedDate && !isFrozen) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        // Only auto-apply for new items (not when editing)
        if (!initialItem) {
          onExpirationDateChange(suggestion);
        }
      }
    } else {
      setSuggestedExpirationDate(null);
      setQualityMessage(null);
    }
  }, [itemName, isDryCanned, isFrozen, hasManuallyChangedDate, initialItem, userItems, onExpirationDateChange]);

  // Handle AI Expiration Helper
  const handleExpirationHelper = async () => {
    if (!itemName.trim()) {
      showToast('Please enter an item name first', 'warning');
      return;
    }

    if (isFrozen) {
      showToast('Expiration Helper is for non-frozen items only', 'warning');
      return;
    }

    setIsLoadingAI(true);
    try {
      const storageType = isDryCanned ? 'pantry' : 'refrigerator';
      const result = await getExpirationSuggestion(itemName.trim(), storageType, false);
      
      if (result.success && result.expirationDate) {
        onExpirationDateChange(result.expirationDate);
        showToast(result.message || 'Expiration date updated', 'success');
      } else {
        showToast(result.message || 'Failed to get expiration suggestion', 'error');
      }
    } catch (error) {
      console.error('Error getting expiration suggestion:', error);
      showToast('Failed to get expiration suggestion', 'error');
    } finally {
      setIsLoadingAI(false);
    }
  };

  return {
    suggestedExpirationDate,
    qualityMessage,
    isLoadingAI,
    hasCredits,
    handleExpirationHelper
  };
}

