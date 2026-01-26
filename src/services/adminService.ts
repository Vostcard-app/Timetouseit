import { doc, getDocs, collection, query, where, deleteDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../firebase/firebaseConfig';
import { aiUsageService } from './aiUsageService';
import { calculateModelCost } from '../utils/aiCostCalculator';
import type { UserCostBreakdown } from '../components/admin/AdminCostBreakdown';
import type { UserInfo } from '../components/admin/AdminUserManagement';

// Configure admin emails here
const ADMIN_EMAILS = [
  'info@vostcard.com',
  // Add more admin emails as needed
];

export const adminService = {
  // Check if current user is admin
  async isAdmin(userId?: string, email?: string | null): Promise<boolean> {
    if (!userId && !email) return false;
    
    // Check email-based admin list
    if (email && ADMIN_EMAILS.includes(email.toLowerCase())) {
      return true;
    }
    
    // Could also check Firestore admin document if needed
    // For now, using email-based approach for simplicity
    return false;
  },

  // Get all users (admin only)
  // Note: This returns a minimal user list. For full user info with stats, use the Admin page's loadData function
  async getAllUsers(): Promise<Array<{ uid: string; email?: string; username?: string }>> {
    // Note: Firebase Auth doesn't provide a direct way to list all users
    // We'll need to collect user data from Firestore collections
    // This gets users from foodItems collection
    const foodItemsSnapshot = await getDocs(collection(db, 'foodItems'));
    const userIds = new Set<string>();
    
    foodItemsSnapshot.forEach(doc => {
      const userId = doc.data().userId;
      if (userId) userIds.add(userId);
    });
    
    // Also check userSettings
    const settingsSnapshot = await getDocs(collection(db, 'userSettings'));
    settingsSnapshot.forEach(doc => {
      userIds.add(doc.id);
    });
    
    // Get user info from auth (limited - we can only get current user)
    // For full user list, you'd need a Cloud Function or Admin SDK
    const users = Array.from(userIds).map(uid => ({
      uid,
      // We can't get email from client-side, would need backend
    }));
    
    return users;
  },

  // Get user statistics
  async getUserStats(userId: string): Promise<{
    foodItemsCount: number;
    userItemsCount: number;
    tokenUsage?: {
      totalTokens: number;
      promptTokens: number;
      completionTokens: number;
      requestCount: number;
      estimatedCost: number;
    };
  }> {
    const [foodItems, userItems, tokenUsage] = await Promise.all([
      getDocs(query(collection(db, 'foodItems'), where('userId', '==', userId))),
      getDocs(query(collection(db, 'userItems'), where('userId', '==', userId))),
      aiUsageService.getUserTokenUsage(userId).catch(() => ({
        totalTokens: 0,
        promptTokens: 0,
        completionTokens: 0,
        requestCount: 0,
        byFeature: {} as Record<string, { totalTokens: number; requestCount: number }>,
        byModel: {}
      }))
    ]);
    
    // Calculate cost based on model breakdown
    let estimatedCost = 0;
    if (tokenUsage.promptTokens > 0 || tokenUsage.completionTokens > 0) {
      if (Object.keys(tokenUsage.byModel).length > 0) {
        // Calculate cost per model
        const totalTokens = Object.values(tokenUsage.byModel).reduce((sum, m) => sum + m.totalTokens, 0);
        
        for (const [model, modelUsage] of Object.entries(tokenUsage.byModel)) {
          const modelTokenRatio = totalTokens > 0 ? modelUsage.totalTokens / totalTokens : 1;
          const estimatedPromptTokens = Math.round(tokenUsage.promptTokens * modelTokenRatio);
          const estimatedCompletionTokens = Math.round(tokenUsage.completionTokens * modelTokenRatio);
          estimatedCost += calculateModelCost(model, estimatedPromptTokens, estimatedCompletionTokens);
        }
      } else {
        // Default to GPT-3.5 Turbo if no model breakdown
        estimatedCost = calculateModelCost('gpt-3.5-turbo', tokenUsage.promptTokens, tokenUsage.completionTokens);
      }
    }
    
    return {
      foodItemsCount: foodItems.size,
      userItemsCount: userItems.size,
      tokenUsage: {
        totalTokens: tokenUsage.totalTokens,
        promptTokens: tokenUsage.promptTokens,
        completionTokens: tokenUsage.completionTokens,
        requestCount: tokenUsage.requestCount,
        estimatedCost
      }
    };
  },

  // Get system-wide statistics
  async getSystemStats(): Promise<{
    totalUsers: number;
    totalFoodItems: number;
    totalShoppingLists: number;
    totalUserItems: number;
    totalAITokens: number;
    totalAIRequests: number;
    totalAICost: number;
  }> {
    const [foodItems, shoppingLists, userItems, userSettings, aiUsage] = await Promise.all([
      getDocs(collection(db, 'foodItems')),
      getDocs(collection(db, 'shoppingLists')),
      getDocs(collection(db, 'userItems')),
      getDocs(collection(db, 'userSettings')),
      aiUsageService.getAllUsersTokenUsage().catch(() => ({
        totalTokens: 0,
        promptTokens: 0,
        completionTokens: 0,
        totalRequests: 0,
        userCount: 0,
        byFeature: {},
        byModel: {}
      }))
    ]);
    
    // Count unique users
    const userIds = new Set<string>();
    foodItems.forEach(doc => userIds.add(doc.data().userId));
    shoppingLists.forEach(doc => userIds.add(doc.data().userId));
    userItems.forEach(doc => userIds.add(doc.data().userId));
    userSettings.forEach(doc => userIds.add(doc.id));
    
    // Calculate total AI cost
    let totalAICost = 0;
    if (aiUsage.promptTokens > 0 || aiUsage.completionTokens > 0) {
      if (Object.keys(aiUsage.byModel).length > 0) {
        // Calculate cost per model
        const totalTokens = Object.values(aiUsage.byModel).reduce((sum, m) => sum + m.totalTokens, 0);
        
        for (const [model, modelUsage] of Object.entries(aiUsage.byModel)) {
          const modelTokenRatio = totalTokens > 0 ? modelUsage.totalTokens / totalTokens : 1;
          const estimatedPromptTokens = Math.round(aiUsage.promptTokens * modelTokenRatio);
          const estimatedCompletionTokens = Math.round(aiUsage.completionTokens * modelTokenRatio);
          totalAICost += calculateModelCost(model, estimatedPromptTokens, estimatedCompletionTokens);
        }
      } else {
        // Default to GPT-3.5 Turbo if no model breakdown
        totalAICost = calculateModelCost('gpt-3.5-turbo', aiUsage.promptTokens, aiUsage.completionTokens);
      }
    }
    
    return {
      totalUsers: userIds.size,
      totalFoodItems: foodItems.size,
      totalShoppingLists: shoppingLists.size,
      totalUserItems: userItems.size,
      totalAITokens: aiUsage.totalTokens,
      totalAIRequests: aiUsage.totalRequests,
      totalAICost,
    };
  },

  // Delete user data (admin only)
  async deleteUserData(userId: string): Promise<void> {
    // Delete all user's food items
    const foodItemsSnapshot = await getDocs(
      query(collection(db, 'foodItems'), where('userId', '==', userId))
    );
    const foodItemDeletes = foodItemsSnapshot.docs.map(doc => deleteDoc(doc.ref));
    
    // Delete all user's shopping lists
    const shoppingListsSnapshot = await getDocs(
      query(collection(db, 'shoppingLists'), where('userId', '==', userId))
    );
    const shoppingListDeletes = shoppingListsSnapshot.docs.map(doc => deleteDoc(doc.ref));
    
    // Delete shopping list items
    const shoppingListItemsSnapshot = await getDocs(
      query(collection(db, 'shoppingList'), where('userId', '==', userId))
    );
    const shoppingListItemDeletes = shoppingListItemsSnapshot.docs.map(doc => deleteDoc(doc.ref));
    
    // Delete user items
    const userItemsSnapshot = await getDocs(
      query(collection(db, 'userItems'), where('userId', '==', userId))
    );
    const userItemDeletes = userItemsSnapshot.docs.map(doc => deleteDoc(doc.ref));
    
    // Delete user categories
    const userCategoriesSnapshot = await getDocs(
      query(collection(db, 'userCategories'), where('userId', '==', userId))
    );
    const userCategoryDeletes = userCategoriesSnapshot.docs.map(doc => deleteDoc(doc.ref));
    
    // Delete favorite recipes
    const favoriteRecipesSnapshot = await getDocs(
      query(collection(db, 'favoriteRecipes'), where('userId', '==', userId))
    );
    const favoriteRecipeDeletes = favoriteRecipesSnapshot.docs.map(doc => deleteDoc(doc.ref));
    
    // Delete meal plans
    const mealPlansSnapshot = await getDocs(
      query(collection(db, 'mealPlans'), where('userId', '==', userId))
    );
    const mealPlanDeletes = mealPlansSnapshot.docs.map(doc => deleteDoc(doc.ref));
    
    // Delete meal profiles
    const mealProfilesRef = doc(db, 'mealProfiles', userId);
    const mealProfilesDelete = deleteDoc(mealProfilesRef).catch(() => {
      // Ignore error if document doesn't exist
    });
    
    // Delete leftover meals
    const leftoverMealsSnapshot = await getDocs(
      query(collection(db, 'leftoverMeals'), where('userId', '==', userId))
    );
    const leftoverMealDeletes = leftoverMealsSnapshot.docs.map(doc => deleteDoc(doc.ref));
    
    // Delete unplanned events
    const unplannedEventsSnapshot = await getDocs(
      query(collection(db, 'unplannedEvents'), where('userId', '==', userId))
    );
    const unplannedEventDeletes = unplannedEventsSnapshot.docs.map(doc => deleteDoc(doc.ref));
    
    // Delete AI usage records
    const aiUsageSnapshot = await getDocs(
      query(collection(db, 'aiUsage'), where('userId', '==', userId))
    );
    const aiUsageDeletes = aiUsageSnapshot.docs.map(doc => deleteDoc(doc.ref));
    
    // Delete user settings
    const userSettingsRef = doc(db, 'userSettings', userId);
    const userSettingsDelete = deleteDoc(userSettingsRef);
    
    // Execute all deletes
    await Promise.all([
      ...foodItemDeletes,
      ...shoppingListDeletes,
      ...shoppingListItemDeletes,
      ...userItemDeletes,
      ...userCategoryDeletes,
      ...favoriteRecipeDeletes,
      ...mealPlanDeletes,
      mealProfilesDelete,
      ...leftoverMealDeletes,
      ...unplannedEventDeletes,
      ...aiUsageDeletes,
      userSettingsDelete,
    ]);
  },

  // Populate missing emails and usernames from Firebase Auth
  async populateUserEmails(userIds: string[]): Promise<{
    processed: number;
    updated: number;
    errors: number;
    details: Array<{ userId: string; status: string; email?: string; error?: string }>;
  }> {
    const populateUserEmailsFunction = httpsCallable(functions, 'populateUserEmails');
    const result = await populateUserEmailsFunction({ userIds });
    return result.data as {
      processed: number;
      updated: number;
      errors: number;
      details: Array<{ userId: string; status: string; email?: string; error?: string }>;
    };
  },

  // Check which users exist in Firebase Auth
  async checkUserAuthStatus(userIds: string[]): Promise<Array<{ userId: string; existsInAuth: boolean; email?: string }>> {
    const checkUserAuthStatusFunction = httpsCallable(functions, 'checkUserAuthStatus');
    const result = await checkUserAuthStatusFunction({ userIds });
    const data = result.data as { results: Array<{ userId: string; existsInAuth: boolean; email?: string }> };
    return data.results;
  },

  // Get cost breakdown for all users with monthly averages
  async getUserCostBreakdown(users: UserInfo[]): Promise<UserCostBreakdown[]> {
    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const breakdown: UserCostBreakdown[] = [];

    // Process users in parallel batches to avoid overwhelming Firestore
    const batchSize = 10;
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      
      const batchResults = await Promise.all(
        batch.map(async (user) => {
          try {
            // Get all-time usage
            const allTimeUsage = await aiUsageService.getUserTokenUsage(user.uid).catch(() => ({
              totalTokens: 0,
              promptTokens: 0,
              completionTokens: 0,
              requestCount: 0,
              byFeature: {} as Record<string, { totalTokens: number; requestCount: number }>,
              byModel: {}
            }));

            // Get last 30 days usage
            const last30DaysUsage = await aiUsageService.getUserTokenUsage(user.uid, last30Days, now).catch(() => ({
              totalTokens: 0,
              promptTokens: 0,
              completionTokens: 0,
              requestCount: 0,
              byFeature: {} as Record<string, { totalTokens: number; requestCount: number }>,
              byModel: {}
            }));

            // Get last 3 months usage (for average)
            const last3MonthsUsage = await aiUsageService.getUserTokenUsage(user.uid, threeMonthsAgo, now).catch(() => ({
              totalTokens: 0,
              promptTokens: 0,
              completionTokens: 0,
              requestCount: 0,
              byFeature: {} as Record<string, { totalTokens: number; requestCount: number }>,
              byModel: {}
            }));

            // Get current month usage
            const currentMonthUsage = await aiUsageService.getUserTokenUsage(user.uid, currentMonthStart, now).catch(() => ({
              totalTokens: 0,
              promptTokens: 0,
              completionTokens: 0,
              requestCount: 0,
              byFeature: {} as Record<string, { totalTokens: number; requestCount: number }>,
              byModel: {}
            }));

            // Calculate costs
            const calculateCost = (usage: typeof allTimeUsage): number => {
              if (usage.promptTokens === 0 && usage.completionTokens === 0) return 0;
              
              if (Object.keys(usage.byModel).length > 0) {
                const totalTokens = Object.values(usage.byModel).reduce((sum, m) => sum + m.totalTokens, 0);
                let cost = 0;
                for (const [model, modelUsage] of Object.entries(usage.byModel)) {
                  const modelTokenRatio = totalTokens > 0 ? modelUsage.totalTokens / totalTokens : 1;
                  const estimatedPromptTokens = Math.round(usage.promptTokens * modelTokenRatio);
                  const estimatedCompletionTokens = Math.round(usage.completionTokens * modelTokenRatio);
                  cost += calculateModelCost(model, estimatedPromptTokens, estimatedCompletionTokens);
                }
                return cost;
              } else {
                return calculateModelCost('gpt-3.5-turbo', usage.promptTokens, usage.completionTokens);
              }
            };

            const totalCost = calculateCost(allTimeUsage);
            const last30DaysCost = calculateCost(last30DaysUsage);
            const last3MonthsCost = calculateCost(last3MonthsUsage);
            const currentMonthCost = calculateCost(currentMonthUsage);

            // Calculate monthly averages
            // Last 30 days: daily average * 30.4 (average days per month)
            const last30DaysDailyTokens = last30DaysUsage.totalTokens / 30;
            const last30DaysMonthlyTokens = last30DaysDailyTokens * 30.4;
            const last30DaysDailyCost = last30DaysCost / 30;
            const last30DaysMonthlyCost = last30DaysDailyCost * 30.4;

            // Last 3 months: total / 3 (average per month)
            const last3MonthsMonthlyTokens = last3MonthsUsage.totalTokens / 3;
            const last3MonthsMonthlyCost = last3MonthsCost / 3;

            return {
              userId: user.uid,
              email: user.email,
              username: user.username,
              totalTokens: allTimeUsage.totalTokens,
              totalCost,
              monthlyAverages: {
                last30Days: {
                  tokens: last30DaysMonthlyTokens,
                  cost: last30DaysMonthlyCost
                },
                last3Months: {
                  tokens: last3MonthsMonthlyTokens,
                  cost: last3MonthsMonthlyCost
                },
                currentMonth: {
                  tokens: currentMonthUsage.totalTokens,
                  cost: currentMonthCost
                }
              }
            };
          } catch (error) {
            console.error(`Error getting cost breakdown for user ${user.uid}:`, error);
            // Return zero data for this user
            return {
              userId: user.uid,
              email: user.email,
              username: user.username,
              totalTokens: 0,
              totalCost: 0,
              monthlyAverages: {
                last30Days: { tokens: 0, cost: 0 },
                last3Months: { tokens: 0, cost: 0 },
                currentMonth: { tokens: 0, cost: 0 }
              }
            };
          }
        })
      );

      breakdown.push(...batchResults);
    }

    // Filter out users with no usage
    return breakdown.filter(user => user.totalTokens > 0);
  },
};

