/**
 * Best By Date Helper Service
 * Handles AI-powered best by date suggestions
 */

import { suggestExpirationDate } from './openaiService';
import { useCredit, hasAvailableCredits } from './expirationCreditService';
import { logServiceError } from './baseService';
import type { UseCreditResult } from '../types/credits';

export interface ExpirationSuggestionResult {
  success: boolean;
  expirationDate?: Date; // Keep for backward compatibility, maps to bestByDate
  reasoning?: string;
  creditsRemaining?: number;
  error?: string;
}

/**
 * Get AI-suggested best by date for an item
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
        error: 'No best by date helper credits available. Please purchase credits to continue.'
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
    
    // Parse the best by date (AI service returns expirationDate which maps to bestByDate)
    const expirationDate = new Date(aiResult.expirationDate);
    if (isNaN(expirationDate.getTime())) {
      throw new Error('Invalid date returned from AI');
    }

    return {
      success: true,
      expirationDate, // Maps to bestByDate in the calling code
      reasoning: aiResult.reasoning,
      creditsRemaining: creditResult.remaining.freeCreditsRemaining + creditResult.remaining.paidCredits
    };
  } catch (error: unknown) {
    logServiceError('getExpirationSuggestion', 'expirationHelper', error, { itemName, storageType });
    return {
      success: false,
      error: error?.message || 'Failed to get best by date suggestion. Please try again.'
    };
  }
}

