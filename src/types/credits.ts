/**
 * Credit Types
 */

export interface ExpirationCredits {
  freeCreditsRemaining: number;
  paidCredits: number;
  totalUses: number;
}

export interface UseCreditResult {
  success: boolean;
  usedFree: boolean;
  remaining: ExpirationCredits;
  error?: string;
}

