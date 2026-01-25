/**
 * Category Service
 * Handles AI-powered and fallback category detection for food items
 */

import { userSettingsService } from './userSettingsService';
import { aiUsageService } from './aiUsageService';
import { detectCategory, type FoodCategory } from '../utils/categoryUtils';
import { logServiceOperation, logServiceError } from './baseService';

export const categoryService = {
  /**
   * Detect category for a food item using AI for Premium users, fallback to keyword matching
   */
  async detectCategoryWithAI(itemName: string, userId?: string): Promise<FoodCategory> {
    logServiceOperation('detectCategoryWithAI', 'categoryService', { itemName, userId });

    if (!itemName || !itemName.trim()) {
      return 'Other';
    }

    // Check if user is Premium
    let isPremium = false;
    if (userId) {
      try {
        isPremium = await userSettingsService.isPremiumUser(userId);
      } catch (error) {
        console.error('Error checking premium status:', error);
        // Continue with non-premium flow if check fails
      }
    }

    // If Premium, try AI categorization
    if (isPremium) {
      try {
        const response = await fetch('/.netlify/functions/ai-category-detector', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ itemName: itemName.trim(), userId })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.category) {
            // Validate category is one of the allowed values
            const validCategories: FoodCategory[] = ['Proteins', 'Vegetables', 'Fruits', 'Dairy', 'Leftovers', 'Other'];
            if (validCategories.includes(data.category as FoodCategory)) {
              // Record token usage if available
              if (data.usage && userId) {
                try {
                  await aiUsageService.recordAIUsage(userId, {
                    feature: 'category_detection',
                    model: 'gpt-3.5-turbo',
                    promptTokens: data.usage.promptTokens || 0,
                    completionTokens: data.usage.completionTokens || 0,
                    totalTokens: data.usage.totalTokens || 0
                  });
                } catch (usageError) {
                  // Don't fail the request if usage recording fails
                  console.error('Failed to record AI usage:', usageError);
                }
              }
              
              logServiceOperation('detectCategoryWithAI', 'categoryService', { 
                itemName, 
                category: data.category, 
                method: 'AI' 
              });
              return data.category as FoodCategory;
            }
          }
        }
      } catch (error) {
        console.error('AI category detection failed, falling back to keyword matching:', error);
        logServiceError('detectCategoryWithAI', 'categoryService', error, { itemName, userId });
        // Fall through to keyword-based detection
      }
    }

    // Fallback to keyword-based detection (for non-premium users or if AI fails)
    const category = detectCategory(itemName);
    logServiceOperation('detectCategoryWithAI', 'categoryService', { 
      itemName, 
      category, 
      method: 'keyword' 
    });
    return category;
  }
};
