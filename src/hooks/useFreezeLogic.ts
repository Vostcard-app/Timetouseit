/**
 * useFreezeLogic Hook
 * Handles freeze category selection and thaw date calculation
 */

import { useState, useEffect } from 'react';
import { addMonths } from 'date-fns';
import { freezeGuidelines, notRecommendedToFreeze, type FreezeCategory } from '../data/freezeGuidelines';

interface UseFreezeLogicProps {
  itemName: string;
  isFrozen: boolean;
  initialFreezeCategory?: FreezeCategory;
  onThawDateChange: (date: Date | undefined) => void;
  onExpirationDateChange: (date: Date | undefined) => void;
}

export function useFreezeLogic({
  itemName,
  isFrozen,
  initialFreezeCategory,
  onThawDateChange,
  onExpirationDateChange
}: UseFreezeLogicProps) {
  const [freezeCategory, setFreezeCategory] = useState<FreezeCategory | null>(initialFreezeCategory || null);
  const [showFreezeWarning, setShowFreezeWarning] = useState(false);

  // Check if item is not recommended to freeze
  const isNotRecommendedToFreeze = notRecommendedToFreeze.some(
    item => itemName.toLowerCase().includes(item.toLowerCase())
  );

  // Calculate thaw date when freeze category changes
  useEffect(() => {
    if (isFrozen && freezeCategory) {
      const bestQualityMonths = freezeGuidelines[freezeCategory];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const thawDate = addMonths(today, bestQualityMonths);
      
      onThawDateChange(thawDate);
      onExpirationDateChange(undefined); // Remove expirationDate for frozen items
    } else if (!isFrozen) {
      onThawDateChange(undefined);
      onExpirationDateChange(new Date()); // Ensure expirationDate exists for non-frozen
    }
  }, [isFrozen, freezeCategory, onThawDateChange, onExpirationDateChange]);

  const handleFreezeToggle = (frozen: boolean) => {
    if (frozen && isNotRecommendedToFreeze) {
      setShowFreezeWarning(true);
    } else {
      setShowFreezeWarning(false);
    }
  };

  const handleDismissFreezeWarning = () => {
    setShowFreezeWarning(false);
  };

  const handleProceedWithFreeze = () => {
    setShowFreezeWarning(false);
  };

  return {
    freezeCategory,
    setFreezeCategory,
    showFreezeWarning,
    isNotRecommendedToFreeze,
    handleFreezeToggle,
    handleDismissFreezeWarning,
    handleProceedWithFreeze
  };
}

