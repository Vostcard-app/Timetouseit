import { collection, query, where, getDocs, orderBy, Timestamp, limit as firestoreLimit } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import type {
  RetentionMetrics,
  FunnelMetrics,
  EngagementMetrics,
  DashboardOverview,
} from '../types/analytics';

/**
 * Analytics Aggregation Service
 * Calculates metrics from raw analytics events
 */

// Calculate activation rate (% of new users who activate)
export const calculateActivationRate = async (startDate?: Date, endDate?: Date): Promise<number> => {
  try {
    const end = endDate || new Date();
    const start = startDate || new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000); // Default: last 30 days

    // Get all new users in date range
    const newUsersQuery = query(
      collection(db, 'analyticsEvents'),
      where('eventType', '==', 'new_user_created'),
      where('timestamp', '>=', Timestamp.fromDate(start)),
      where('timestamp', '<=', Timestamp.fromDate(end))
    );
    const newUsersSnapshot = await getDocs(newUsersQuery);
    const newUserIds = new Set(newUsersSnapshot.docs.map(doc => doc.data().userId));

    // Get all activation events in date range
    const activationQuery = query(
      collection(db, 'analyticsEvents'),
      where('eventType', '==', 'activation_completed'),
      where('timestamp', '>=', Timestamp.fromDate(start)),
      where('timestamp', '<=', Timestamp.fromDate(end))
    );
    const activationSnapshot = await getDocs(activationQuery);
    const activatedUserIds = new Set(activationSnapshot.docs.map(doc => doc.data().userId));

    // Count activated users who signed up in the date range
    let activatedCount = 0;
    activatedUserIds.forEach(userId => {
      if (newUserIds.has(userId)) {
        activatedCount++;
      }
    });

    const totalNewUsers = newUserIds.size;
    return totalNewUsers > 0 ? (activatedCount / totalNewUsers) * 100 : 0;
  } catch (error) {
    console.error('Error calculating activation rate:', error);
    return 0;
  }
};

// Calculate retention rates (Day 1, 7, 30)
export const calculateRetentionRates = async (): Promise<RetentionMetrics> => {
  try {
    const now = new Date();
    const day1Start = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
    const day7Start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const day30Start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get DAU, WAU, MAU
    const dauQuery = query(
      collection(db, 'analyticsEvents'),
      where('eventType', '==', 'daily_active_user'),
      where('timestamp', '>=', Timestamp.fromDate(day1Start))
    );
    const wauQuery = query(
      collection(db, 'analyticsEvents'),
      where('eventType', '==', 'weekly_active_user'),
      where('timestamp', '>=', Timestamp.fromDate(day7Start))
    );
    const mauQuery = query(
      collection(db, 'analyticsEvents'),
      where('eventType', '==', 'monthly_active_user'),
      where('timestamp', '>=', Timestamp.fromDate(day30Start))
    );

    const [dauSnapshot, wauSnapshot, mauSnapshot] = await Promise.all([
      getDocs(dauQuery),
      getDocs(wauQuery),
      getDocs(mauQuery),
    ]);

    const dau = new Set(dauSnapshot.docs.map(doc => doc.data().userId)).size;
    const wau = new Set(wauSnapshot.docs.map(doc => doc.data().userId)).size;
    const mau = new Set(mauSnapshot.docs.map(doc => doc.data().userId)).size;

    // Calculate retention rates (simplified - would need cohort analysis for accurate rates)
    // For now, return basic metrics
    const wauMauRatio = mau > 0 ? wau / mau : 0;

    // Get new users for retention calculation
    const newUsersQuery = query(
      collection(db, 'analyticsEvents'),
      where('eventType', '==', 'new_user_created'),
      orderBy('timestamp', 'desc'),
      firestoreLimit(1000) // Limit for performance
    );
    const newUsersSnapshot = await getDocs(newUsersQuery);
    const newUserIds = new Set(newUsersSnapshot.docs.map(doc => doc.data().userId));

    // Calculate Day 1, 7, 30 retention (simplified - checks if users returned)
    let day1Retained = 0;
    let day7Retained = 0;
    let day30Retained = 0;

    for (const userId of newUserIds) {
      const userReturnQuery = query(
        collection(db, 'analyticsEvents'),
        where('userId', '==', userId),
        where('eventType', '==', 'return_session'),
        orderBy('timestamp', 'desc'),
        firestoreLimit(1)
      );
      const returnSnapshot = await getDocs(userReturnQuery);
      
      if (!returnSnapshot.empty) {
        const returnEvent = returnSnapshot.docs[0].data();
        const daysSinceSignup = returnEvent.metadata?.daysSinceLastSession || 0;
        
        if (daysSinceSignup >= 1 && daysSinceSignup < 2) day1Retained++;
        if (daysSinceSignup >= 7 && daysSinceSignup < 8) day7Retained++;
        if (daysSinceSignup >= 30 && daysSinceSignup < 31) day30Retained++;
      }
    }

    const totalNewUsers = newUserIds.size;
    const day1Retention = totalNewUsers > 0 ? (day1Retained / totalNewUsers) * 100 : 0;
    const day7Retention = totalNewUsers > 0 ? (day7Retained / totalNewUsers) * 100 : 0;
    const day30Retention = totalNewUsers > 0 ? (day30Retained / totalNewUsers) * 100 : 0;

    return {
      dau,
      wau,
      mau,
      wauMauRatio,
      day1Retention,
      day7Retention,
      day30Retention,
    };
  } catch (error) {
    console.error('Error calculating retention rates:', error);
    return {
      dau: 0,
      wau: 0,
      mau: 0,
      wauMauRatio: 0,
      day1Retention: 0,
      day7Retention: 0,
      day30Retention: 0,
    };
  }
};

// Calculate engagement metrics
export const calculateEngagementMetrics = async (): Promise<EngagementMetrics> => {
  try {
    const now = new Date();
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get all engagement events in the last week
    const engagementQuery = query(
      collection(db, 'analyticsEvents'),
      where('eventCategory', '==', 'engagement'),
      where('timestamp', '>=', Timestamp.fromDate(weekStart))
    );
    const engagementSnapshot = await getDocs(engagementQuery);

    // Group by session and user
    const sessions = new Map<string, number>(); // sessionId -> action count
    const userSessions = new Map<string, Set<string>>(); // userId -> Set of sessionIds
    const featureUsage = new Map<string, Set<string>>(); // feature -> Set of userIds

    engagementSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const sessionId = data.sessionId;
      const userId = data.userId;
      const feature = data.metadata?.feature;

      // Count actions per session
      sessions.set(sessionId, (sessions.get(sessionId) || 0) + 1);

      // Track sessions per user
      if (!userSessions.has(userId)) {
        userSessions.set(userId, new Set());
      }
      userSessions.get(userId)!.add(sessionId);

      // Track feature usage
      if (feature) {
        if (!featureUsage.has(feature)) {
          featureUsage.set(feature, new Set());
        }
        featureUsage.get(feature)!.add(userId);
      }
    });

    // Calculate averages
    const totalActions = Array.from(sessions.values()).reduce((sum, count) => sum + count, 0);
    const totalSessions = sessions.size;
    const averageActionsPerSession = totalSessions > 0 ? totalActions / totalSessions : 0;

    const totalUsers = userSessions.size;
    const totalUserSessions = Array.from(userSessions.values()).reduce((sum, sessions) => sum + sessions.size, 0);
    const averageSessionsPerUser = totalUsers > 0 ? totalUserSessions / totalUsers : 0;

    // Calculate feature adoption
    const featureAdoption: Record<string, number> = {};
    const totalActiveUsers = totalUsers || 1; // Avoid division by zero
    featureUsage.forEach((userSet, feature) => {
      featureAdoption[feature] = (userSet.size / totalActiveUsers) * 100;
    });

    // Get most used features
    const mostUsedFeatures = Array.from(featureUsage.entries())
      .map(([feature, userSet]) => ({
        feature,
        usageCount: userSet.size,
      }))
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 10);

    return {
      averageActionsPerSession,
      averageSessionsPerUser,
      featureAdoption,
      mostUsedFeatures,
    };
  } catch (error) {
    console.error('Error calculating engagement metrics:', error);
    return {
      averageActionsPerSession: 0,
      averageSessionsPerUser: 0,
      featureAdoption: {},
      mostUsedFeatures: [],
    };
  }
};

// Calculate funnel conversion rates
export const calculateFunnelConversion = async (): Promise<FunnelMetrics> => {
  try {
    const now = new Date();
    const monthStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get all funnel events in the last month
    const funnelQuery = query(
      collection(db, 'analyticsEvents'),
      where('eventCategory', '==', 'funnel'),
      where('timestamp', '>=', Timestamp.fromDate(monthStart))
    );
    const funnelSnapshot = await getDocs(funnelQuery);

    const visitUserIds = new Set<string>();
    const signupUserIds = new Set<string>();
    const activationUserIds = new Set<string>();
    const returnUsageUserIds = new Set<string>();

    funnelSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const userId = data.userId;
      const eventType = data.eventType;

      if (eventType === 'funnel_visit') visitUserIds.add(userId);
      if (eventType === 'funnel_signup') signupUserIds.add(userId);
      if (eventType === 'funnel_activation') activationUserIds.add(userId);
      if (eventType === 'funnel_return_usage') returnUsageUserIds.add(userId);
    });

    const visitCount = visitUserIds.size;
    const signupCount = signupUserIds.size;
    const activationCount = activationUserIds.size;
    const returnUsageCount = returnUsageUserIds.size;

    const visitToSignupRate = visitCount > 0 ? (signupCount / visitCount) * 100 : 0;
    const signupToActivationRate = signupCount > 0 ? (activationCount / signupCount) * 100 : 0;
    const activationToReturnRate = activationCount > 0 ? (returnUsageCount / activationCount) * 100 : 0;
    const overallConversionRate = visitCount > 0 ? (returnUsageCount / visitCount) * 100 : 0;

    return {
      visitCount,
      signupCount,
      activationCount,
      returnUsageCount,
      visitToSignupRate,
      signupToActivationRate,
      activationToReturnRate,
      overallConversionRate,
    };
  } catch (error) {
    console.error('Error calculating funnel conversion:', error);
    return {
      visitCount: 0,
      signupCount: 0,
      activationCount: 0,
      returnUsageCount: 0,
      visitToSignupRate: 0,
      signupToActivationRate: 0,
      activationToReturnRate: 0,
      overallConversionRate: 0,
    };
  }
};

// Calculate dashboard overview metrics
export const calculateDashboardOverview = async (): Promise<DashboardOverview> => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get new users
    const newUsersTodayQuery = query(
      collection(db, 'analyticsEvents'),
      where('eventType', '==', 'new_user_created'),
      where('timestamp', '>=', Timestamp.fromDate(todayStart))
    );
    const newUsersWeekQuery = query(
      collection(db, 'analyticsEvents'),
      where('eventType', '==', 'new_user_created'),
      where('timestamp', '>=', Timestamp.fromDate(weekStart))
    );
    const newUsersMonthQuery = query(
      collection(db, 'analyticsEvents'),
      where('eventType', '==', 'new_user_created'),
      where('timestamp', '>=', Timestamp.fromDate(monthStart))
    );

    const [todaySnapshot, weekSnapshot, monthSnapshot] = await Promise.all([
      getDocs(newUsersTodayQuery),
      getDocs(newUsersWeekQuery),
      getDocs(newUsersMonthQuery),
    ]);

    const newUsersToday = new Set(todaySnapshot.docs.map(doc => doc.data().userId)).size;
    const newUsersThisWeek = new Set(weekSnapshot.docs.map(doc => doc.data().userId)).size;
    const newUsersThisMonth = new Set(monthSnapshot.docs.map(doc => doc.data().userId)).size;

    // Get other metrics
    const activationRate = await calculateActivationRate(monthStart, now);
    const retentionMetrics = await calculateRetentionRates();
    const engagementMetrics = await calculateEngagementMetrics();

    // Calculate error rate
    const errorQuery = query(
      collection(db, 'analyticsEvents'),
      where('eventCategory', '==', 'quality'),
      where('timestamp', '>=', Timestamp.fromDate(weekStart))
    );
    const errorSnapshot = await getDocs(errorQuery);
    const totalSessionsQuery = query(
      collection(db, 'analyticsEvents'),
      where('eventType', '==', 'session_started'),
      where('timestamp', '>=', Timestamp.fromDate(weekStart))
    );
    const sessionsSnapshot = await getDocs(totalSessionsQuery);
    const errorRate = sessionsSnapshot.size > 0 ? (errorSnapshot.size / sessionsSnapshot.size) * 100 : 0;

    return {
      newUsersToday,
      newUsersThisWeek,
      newUsersThisMonth,
      activationRate,
      day7Retention: retentionMetrics.day7Retention,
      day30Retention: retentionMetrics.day30Retention,
      wauMauRatio: retentionMetrics.wauMauRatio,
      averageActionsPerSession: engagementMetrics.averageActionsPerSession,
      errorRate,
    };
  } catch (error) {
    console.error('Error calculating dashboard overview:', error);
    return {
      newUsersToday: 0,
      newUsersThisWeek: 0,
      newUsersThisMonth: 0,
      activationRate: 0,
      day7Retention: 0,
      day30Retention: 0,
      wauMauRatio: 0,
      averageActionsPerSession: 0,
      errorRate: 0,
    };
  }
};

export const analyticsAggregationService = {
  calculateActivationRate,
  calculateRetentionRates,
  calculateEngagementMetrics,
  calculateFunnelConversion,
  calculateDashboardOverview,
};

