/**
 * AI Usage Types
 * Track token usage for AI features
 */

export type AIFeature = 
  | 'ingredient_parsing' 
  | 'label_scanning' 
  | 'category_detection' 
  | 'meal_planning' 
  | 'expiration_helper';

export interface AIUsageRecord {
  id: string;
  userId: string;
  feature: AIFeature;
  model: string; // e.g., 'gpt-3.5-turbo', 'gpt-4o-mini'
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  timestamp: Date;
  metadata?: Record<string, any>; // Optional additional data
}

export interface AIUsageData {
  userId: string;
  feature: AIFeature;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  metadata?: Record<string, any>;
}

export interface AggregatedTokenUsage {
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  requestCount: number;
  byFeature: Record<AIFeature, {
    totalTokens: number;
    requestCount: number;
  }>;
  byModel: Record<string, {
    totalTokens: number;
    requestCount: number;
  }>;
}
