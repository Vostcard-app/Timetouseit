/**
 * AI Usage Service
 * Tracks and retrieves token usage for AI features
 */

import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  Timestamp,
  orderBy
} from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import type { AIUsageData, AggregatedTokenUsage, AIFeature } from '../types/aiUsage';
import { cleanFirestoreData, logServiceOperation, logServiceError } from './baseService';
import { toServiceError } from './errors';

/**
 * Record AI usage (called from Netlify functions or client)
 */
export async function recordAIUsage(
  userId: string,
  data: Omit<AIUsageData, 'userId'>
): Promise<string> {
  logServiceOperation('recordAIUsage', 'aiUsage', { userId, feature: data.feature });

  try {
    const usageData = {
      userId,
      feature: data.feature,
      model: data.model,
      promptTokens: data.promptTokens,
      completionTokens: data.completionTokens,
      totalTokens: data.totalTokens,
      timestamp: Timestamp.now(),
      metadata: data.metadata || null
    };

    const cleanData = cleanFirestoreData(usageData);
    const docRef = await addDoc(collection(db, 'aiUsage'), cleanData);
    return docRef.id;
  } catch (error) {
    logServiceError('recordAIUsage', 'aiUsage', error, { userId, feature: data.feature });
    throw toServiceError(error, 'aiUsage');
  }
}

/**
 * Get aggregated token usage for a user
 */
export async function getUserTokenUsage(
  userId: string,
  startDate?: Date,
  endDate?: Date
): Promise<AggregatedTokenUsage> {
  logServiceOperation('getUserTokenUsage', 'aiUsage', { userId });

  try {
    let usageQuery = query(
      collection(db, 'aiUsage'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc')
    );

    // Add date filters if provided
    if (startDate) {
      usageQuery = query(
        usageQuery,
        where('timestamp', '>=', Timestamp.fromDate(startDate))
      );
    }
    if (endDate) {
      usageQuery = query(
        usageQuery,
        where('timestamp', '<=', Timestamp.fromDate(endDate))
      );
    }

    const snapshot = await getDocs(usageQuery);
    
    // Initialize aggregation
    const aggregated: AggregatedTokenUsage = {
      totalTokens: 0,
      promptTokens: 0,
      completionTokens: 0,
      requestCount: 0,
      byFeature: {} as Record<AIFeature, { totalTokens: number; requestCount: number }>,
      byModel: {}
    };

    snapshot.forEach(doc => {
      const docData = doc.data();
      const promptTokens = docData.promptTokens || 0;
      const completionTokens = docData.completionTokens || 0;
      const totalTokens = docData.totalTokens || 0;
      const feature = docData.feature as AIFeature;
      const model = docData.model as string;

      // Aggregate totals
      aggregated.totalTokens += totalTokens;
      aggregated.promptTokens += promptTokens;
      aggregated.completionTokens += completionTokens;
      aggregated.requestCount += 1;

      // Aggregate by feature
      if (!aggregated.byFeature[feature]) {
        aggregated.byFeature[feature] = { totalTokens: 0, requestCount: 0 };
      }
      aggregated.byFeature[feature].totalTokens += totalTokens;
      aggregated.byFeature[feature].requestCount += 1;

      // Aggregate by model
      if (!aggregated.byModel[model]) {
        aggregated.byModel[model] = { totalTokens: 0, requestCount: 0 };
      }
      aggregated.byModel[model].totalTokens += totalTokens;
      aggregated.byModel[model].requestCount += 1;
    });

    return aggregated;
  } catch (error) {
    logServiceError('getUserTokenUsage', 'aiUsage', error, { userId });
    throw toServiceError(error, 'aiUsage');
  }
}

/**
 * Get aggregated token usage for all users (admin only)
 */
export async function getAllUsersTokenUsage(
  startDate?: Date,
  endDate?: Date
): Promise<{
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  totalRequests: number;
  userCount: number;
  byFeature: Record<AIFeature, { totalTokens: number; requestCount: number }>;
  byModel: Record<string, { totalTokens: number; requestCount: number }>;
}> {
  logServiceOperation('getAllUsersTokenUsage', 'aiUsage', {});

  try {
    let usageQuery = query(
      collection(db, 'aiUsage'),
      orderBy('timestamp', 'desc')
    );

    // Add date filters if provided
    if (startDate) {
      usageQuery = query(
        usageQuery,
        where('timestamp', '>=', Timestamp.fromDate(startDate))
      );
    }
    if (endDate) {
      usageQuery = query(
        usageQuery,
        where('timestamp', '<=', Timestamp.fromDate(endDate))
      );
    }

    const snapshot = await getDocs(usageQuery);
    
    // Initialize aggregation
    const aggregated = {
      totalTokens: 0,
      promptTokens: 0,
      completionTokens: 0,
      totalRequests: 0,
      userCount: 0,
      byFeature: {} as Record<AIFeature, { totalTokens: number; requestCount: number }>,
      byModel: {} as Record<string, { totalTokens: number; requestCount: number }>
    };

    const uniqueUsers = new Set<string>();

    snapshot.forEach(doc => {
      const docData = doc.data();
      const totalTokens = docData.totalTokens || 0;
      const promptTokens = docData.promptTokens || 0;
      const completionTokens = docData.completionTokens || 0;
      const feature = docData.feature as AIFeature;
      const model = docData.model as string;
      const userId = docData.userId as string;

      // Track unique users
      if (userId) {
        uniqueUsers.add(userId);
      }

      // Aggregate totals
      aggregated.totalTokens += totalTokens;
      aggregated.promptTokens += promptTokens;
      aggregated.completionTokens += completionTokens;
      aggregated.totalRequests += 1;

      // Aggregate by feature
      if (!aggregated.byFeature[feature]) {
        aggregated.byFeature[feature] = { totalTokens: 0, requestCount: 0 };
      }
      aggregated.byFeature[feature].totalTokens += totalTokens;
      aggregated.byFeature[feature].requestCount += 1;

      // Aggregate by model
      if (!aggregated.byModel[model]) {
        aggregated.byModel[model] = { totalTokens: 0, requestCount: 0 };
      }
      aggregated.byModel[model].totalTokens += totalTokens;
      aggregated.byModel[model].requestCount += 1;
    });

    aggregated.userCount = uniqueUsers.size;

    return aggregated;
  } catch (error) {
    logServiceError('getAllUsersTokenUsage', 'aiUsage', error, {});
    throw toServiceError(error, 'aiUsage');
  }
}

export const aiUsageService = {
  recordAIUsage,
  getUserTokenUsage,
  getAllUsersTokenUsage
};
