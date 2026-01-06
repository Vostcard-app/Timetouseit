/**
 * Expiration Credit Service
 * Manages credits for AI expiration date helper feature
 */

import { getExpirationCredits, updateExpirationCredits, initializeExpirationCredits } from '../storage/db';
import type { ExpirationCredits, UseCreditResult } from '../types/credits';

/**
 * Get current user's expiration credits from IndexedDB
 */
export async function getCredits(): Promise<ExpirationCredits> {
  try {
    const credits = await getExpirationCredits();
    return {
      freeCreditsRemaining: credits.freeCreditsRemaining,
      paidCredits: credits.paidCredits,
      totalUses: credits.totalUses
    };
  } catch (error) {
    console.error('[ExpirationCredits] Error getting credits:', error);
    // Initialize if doesn't exist
    const credits = await initializeExpirationCredits();
    return {
      freeCreditsRemaining: credits.freeCreditsRemaining,
      paidCredits: credits.paidCredits,
      totalUses: credits.totalUses
    };
  }
}

/**
 * Check if user has any available credits (free or paid)
 */
export async function hasAvailableCredits(): Promise<boolean> {
  const credits = await getCredits();
  return credits.freeCreditsRemaining > 0 || credits.paidCredits > 0;
}

/**
 * Use an expiration credit (deducts free first, then paid)
 * Returns whether a free credit was used and remaining credits
 */
export async function useCredit(): Promise<UseCreditResult> {
  try {
    const currentCredits = await getExpirationCredits();
    
    // Check if any credits available
    if (currentCredits.freeCreditsRemaining === 0 && currentCredits.paidCredits === 0) {
      const credits = await getCredits();
      return {
        success: false,
        usedFree: false,
        remaining: credits,
        error: 'No expiration helper credits available. Please purchase credits to continue.'
      };
    }

    const usedFree = currentCredits.freeCreditsRemaining > 0;
    
    await updateExpirationCredits({
      totalUses: (currentCredits.totalUses || 0) + 1,
      freeCreditsRemaining: usedFree 
        ? Math.max(0, currentCredits.freeCreditsRemaining - 1)
        : currentCredits.freeCreditsRemaining,
      paidCredits: usedFree
        ? currentCredits.paidCredits
        : Math.max(0, currentCredits.paidCredits - 1)
    });

    const remaining = await getCredits();
    return {
      success: true,
      usedFree,
      remaining
    };
  } catch (error: any) {
    console.error('[ExpirationCredits] Error using credit:', error);
    const currentCredits = await getCredits().catch(() => ({ 
      freeCreditsRemaining: 0, 
      paidCredits: 0, 
      totalUses: 0
    }));
    return {
      success: false,
      usedFree: false,
      remaining: currentCredits,
      error: error?.message || 'Failed to use credit'
    };
  }
}

/**
 * Add paid expiration credits (called after successful payment)
 */
export async function addPaidCredits(amount: number): Promise<void> {
  try {
    const currentCredits = await getExpirationCredits();
    await updateExpirationCredits({
      paidCredits: (currentCredits.paidCredits || 0) + amount
    });
  } catch (error) {
    console.error('[ExpirationCredits] Error adding paid credits:', error);
    throw error;
  }
}

/**
 * Initialize expiration credits for new user
 */
export async function initializeCredits(): Promise<void> {
  try {
    await initializeExpirationCredits();
  } catch (error) {
    console.error('[ExpirationCredits] Error initializing credits:', error);
    // Don't throw - this is called during registration and shouldn't fail signup
  }
}

