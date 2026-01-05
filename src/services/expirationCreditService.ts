/**
 * Expiration Credit Service
 * Manages credits for AI expiration date helper feature
 */

import { getExpirationCredits, updateExpirationCredits, initializeExpirationCredits } from '../storage/db';
import type { ExpirationCredits, UseCreditResult } from '../types/credits';

const TRIAL_DAYS = 30;

/**
 * Get current user's expiration credits from IndexedDB
 */
export async function getCredits(): Promise<ExpirationCredits> {
  try {
    const credits = await getExpirationCredits();
    const now = Date.now();
    
    // Calculate days remaining in trial
    let daysRemaining: number | undefined;
    if (credits.trialEndDate) {
      const diffMs = credits.trialEndDate - now;
      daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    } else if (credits.freeCreditsRemaining > 0 || credits.totalUses === 0) {
      // Trial hasn't started yet or still has free credits
      daysRemaining = TRIAL_DAYS;
    }
    
    return {
      freeCreditsRemaining: credits.freeCreditsRemaining,
      paidCredits: credits.paidCredits,
      totalUses: credits.totalUses,
      trialEndDate: credits.trialEndDate ? new Date(credits.trialEndDate) : undefined,
      daysRemaining
    };
  } catch (error) {
    console.error('[ExpirationCredits] Error getting credits:', error);
    // Initialize if doesn't exist
    const credits = await initializeExpirationCredits();
    return {
      freeCreditsRemaining: credits.freeCreditsRemaining,
      paidCredits: credits.paidCredits,
      totalUses: credits.totalUses,
      daysRemaining: TRIAL_DAYS
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
    const now = Date.now();
    
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

    // Check if trial has expired
    if (currentCredits.trialEndDate && currentCredits.trialEndDate < now) {
      // Trial expired, only paid credits work
      if (currentCredits.paidCredits === 0) {
        const credits = await getCredits();
        return {
          success: false,
          usedFree: false,
          remaining: credits,
          error: 'Trial expired. Please purchase credits to continue.'
        };
      }
    }

    const usedFree = currentCredits.freeCreditsRemaining > 0;
    
    // Set trial end date on first use if not set
    let trialEndDate = currentCredits.trialEndDate;
    if (!trialEndDate && usedFree) {
      trialEndDate = now + (TRIAL_DAYS * 24 * 60 * 60 * 1000);
    }
    
    await updateExpirationCredits({
      totalUses: (currentCredits.totalUses || 0) + 1,
      freeCreditsRemaining: usedFree 
        ? Math.max(0, currentCredits.freeCreditsRemaining - 1)
        : currentCredits.freeCreditsRemaining,
      paidCredits: usedFree
        ? currentCredits.paidCredits
        : Math.max(0, currentCredits.paidCredits - 1),
      trialEndDate: trialEndDate
    });

    const remaining = await getCredits();
    return {
      success: true,
      usedFree,
      remaining,
      daysLeft: remaining.daysRemaining
    };
  } catch (error: any) {
    console.error('[ExpirationCredits] Error using credit:', error);
    const currentCredits = await getCredits().catch(() => ({ 
      freeCreditsRemaining: 0, 
      paidCredits: 0, 
      totalUses: 0,
      daysRemaining: 0
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

