/**
 * Credit Types
 */

export interface ExpirationCredits {
  freeCreditsRemaining: number;
  paidCredits: number;
  totalUses: number;
  trialEndDate?: Date;
  daysRemaining?: number;
}

export interface UseCreditResult {
  success: boolean;
  usedFree: boolean;
  remaining: ExpirationCredits;
  daysLeft?: number;
  error?: string;
}

