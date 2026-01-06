/**
 * Expiration Helper Service
 * Handles AI-powered expiration date suggestions
 */

import { suggestExpirationDate } from './openaiService';
import { useCredit, hasAvailableCredits } from './expirationCreditService';
import type { UseCreditResult } from '../types/credits';

export interface ExpirationSuggestionResult {
  success: boolean;
  expirationDate?: Date;
  reasoning?: string;
  creditsRemaining?: number;
  error?: string;
}

/**
 * Get AI-suggested expiration date for an item
 * This will use a credit and call the AI service
 */
export async function getExpirationSuggestion(
  itemName: string,
  storageType: 'refrigerator' | 'freezer' | 'pantry',
  isLeftover: boolean = false
): Promise<ExpirationSuggestionResult> {
  try {
    // Check if credits available
    const hasCredits = await hasAvailableCredits();
    if (!hasCredits) {
      return {
        success: false,
        error: 'No expiration helper credits available. Please purchase credits to continue.'
      };
    }

    // Use a credit
    const creditResult: UseCreditResult = await useCredit();
    if (!creditResult.success) {
      return {
        success: false,
        error: creditResult.error || 'Failed to use credit'
      };
    }

    // Call AI service
    const aiResult = await suggestExpirationDate(itemName, storageType, isLeftover);
    
    // Parse the expiration date
    const expirationDate = new Date(aiResult.expirationDate);
    if (isNaN(expirationDate.getTime())) {
      throw new Error('Invalid date returned from AI');
    }

    return {
      success: true,
      expirationDate,
      reasoning: aiResult.reasoning,
      creditsRemaining: creditResult.remaining.freeCreditsRemaining + creditResult.remaining.paidCredits
    };
  } catch (error: any) {
    console.error('[ExpirationHelper] Error getting suggestion:', error);
    return {
      success: false,
      error: error?.message || 'Failed to get expiration suggestion. Please try again.'
    };
  }
}

