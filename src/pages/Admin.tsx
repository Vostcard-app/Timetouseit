import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase/firebaseConfig';
import { adminService } from '../services/adminService';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import HamburgerMenu from '../components/HamburgerMenu';
import { analyticsAggregationService } from '../services/analyticsAggregationService';
import type { DashboardOverview, RetentionMetrics, FunnelMetrics, EngagementMetrics } from '../types/analytics';

interface UserInfo {
  uid: string;
  email?: string;
  foodItemsCount: number;
  userItemsCount: number;
}

const Admin: React.FC = () => {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [systemStats, setSystemStats] = useState({
    totalUsers: 0,
    totalFoodItems: 0,
    totalShoppingLists: 0,
    totalUserItems: 0,
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [analyticsOverview, setAnalyticsOverview] = useState<DashboardOverview | null>(null);
  const [retentionMetrics, setRetentionMetrics] = useState<RetentionMetrics | null>(null);
  const [funnelMetrics, setFunnelMetrics] = useState<FunnelMetrics | null>(null);
  const [engagementMetrics, setEngagementMetrics] = useState<EngagementMetrics | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // Check admin status
  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        navigate('/login');
        return;
      }

      const adminStatus = await adminService.isAdmin(user.uid, user.email || null);
      setIsAdmin(adminStatus);
      setLoading(false);

      if (!adminStatus) {
        navigate('/shop');
      }
    };

    checkAdmin();
  }, [user, navigate]);

  // Load users and stats
  const loadData = async () => {
    setError(null);
    setLoadingUsers(true);
    const errors: string[] = [];

    try {
      // Get system stats with error handling
      try {
        const stats = await adminService.getSystemStats();
        setSystemStats(stats);
      } catch (statsError: any) {
        console.error('Error loading system stats:', statsError);
        errors.push('Failed to load system statistics');
      }

      // Get all unique user IDs from collections with individual error handling
      const userIds = new Set<string>();
      
      // Load foodItems
      try {
        const foodItems = await getDocs(collection(db, 'foodItems'));
        foodItems.forEach(doc => {
          const userId = doc.data()?.userId;
          if (userId && typeof userId === 'string') {
            userIds.add(userId);
          }
        });
      } catch (foodError: any) {
        console.error('Error loading foodItems:', foodError);
        errors.push('Failed to load food items collection');
      }

      // Load shoppingLists
      try {
        const shoppingLists = await getDocs(collection(db, 'shoppingLists'));
        shoppingLists.forEach(doc => {
          const userId = doc.data()?.userId;
          if (userId && typeof userId === 'string') {
            userIds.add(userId);
          }
        });
      } catch (shoppingError: any) {
        console.error('Error loading shoppingLists:', shoppingError);
        errors.push('Failed to load shopping lists collection');
      }

      // Load userItems
      try {
        const userItems = await getDocs(collection(db, 'userItems'));
        userItems.forEach(doc => {
          const userId = doc.data()?.userId;
          if (userId && typeof userId === 'string') {
            userIds.add(userId);
          }
        });
      } catch (userItemsError: any) {
        console.error('Error loading userItems:', userItemsError);
        errors.push('Failed to load user items collection');
      }

      // Load userSettings and collect emails
      const userEmails = new Map<string, string>();
      try {
        const userSettings = await getDocs(collection(db, 'userSettings'));
        userSettings.forEach(doc => {
          const userId = doc.id;
          if (userId && typeof userId === 'string') {
            userIds.add(userId);
            const settingsData = doc.data();
            if (settingsData?.email) {
              userEmails.set(userId, settingsData.email);
            }
          }
        });
        
        // Also try to get email from current user's auth if available
        if (user && user.email && user.uid) {
          if (!userEmails.has(user.uid)) {
            userEmails.set(user.uid, user.email);
          }
        }
      } catch (settingsError: any) {
        console.error('Error loading userSettings:', settingsError);
        errors.push('Failed to load user settings collection');
      }

      // Get stats for each user with error handling
      const userInfos: UserInfo[] = [];
      for (const uid of userIds) {
        try {
          const stats = await adminService.getUserStats(uid);
          userInfos.push({
            uid,
            email: userEmails.get(uid),
            ...stats,
          });
        } catch (userStatsError: any) {
          console.error(`Error loading stats for user ${uid}:`, userStatsError);
          // Skip this user but continue with others
          // Optionally add user with zero stats
          userInfos.push({
            uid,
            email: userEmails.get(uid),
            foodItemsCount: 0,
            userItemsCount: 0,
          });
        }
      }

      // Sort by food items count (descending)
      userInfos.sort((a, b) => b.foodItemsCount - a.foodItemsCount);
      setUsers(userInfos);

      // Set error message if any errors occurred
      if (errors.length > 0) {
        setError(`Some data failed to load: ${errors.join(', ')}. Partial data is shown below.`);
      }
    } catch (error: any) {
      console.error('Unexpected error loading admin data:', error);
      setError(`Failed to load admin data: ${error.message || 'Unknown error'}`);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) return;
    loadData();
    loadAnalytics();
  }, [isAdmin]);

  // Load analytics data
  const loadAnalytics = async () => {
    if (!isAdmin) return;
    
    setLoadingAnalytics(true);
    try {
      const [overview, retention, funnel, engagement] = await Promise.all([
        analyticsAggregationService.calculateDashboardOverview(),
        analyticsAggregationService.calculateRetentionRates(),
        analyticsAggregationService.calculateFunnelConversion(),
        analyticsAggregationService.calculateEngagementMetrics(),
      ]);
      
      setAnalyticsOverview(overview);
      setRetentionMetrics(retention);
      setFunnelMetrics(funnel);
      setEngagementMetrics(engagement);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm(`Are you sure you want to delete all data for user ${userId}? This action cannot be undone.`)) {
      return;
    }

    setDeletingUserId(userId);
    try {
      await adminService.deleteUserData(userId);
      // Remove from users list
      setUsers(users.filter(u => u.uid !== userId));
      // Update stats
      try {
        const stats = await adminService.getSystemStats();
        setSystemStats(stats);
      } catch (statsError: any) {
        console.error('Error updating stats after deletion:', statsError);
        // Don't show error for stats update failure
      }
      // Remove error message if deletion was successful
      setError(null);
    } catch (error: any) {
      console.error('Error deleting user:', error);
      setError(`Failed to delete user data: ${error.message || 'Unknown error'}`);
    } finally {
      setDeletingUserId(null);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <>
      {/* Banner Header */}
      <div style={{
        backgroundColor: '#002B4D',
        color: '#ffffff',
        padding: '1rem',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={() => navigate('/shop')}
              style={{
                background: 'none',
                border: 'none',
                color: '#ffffff',
                cursor: 'pointer',
                padding: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              aria-label="Go back"
            >
              ←
            </button>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: '#ffffff' }}>
              Admin Panel
            </h1>
          </div>
          <button
            onClick={() => setMenuOpen(true)}
            style={{
              background: 'none',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              padding: '0.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              alignItems: 'center',
              justifyContent: 'center',
              width: '44px',
              height: '44px',
              minWidth: '44px',
              minHeight: '44px',
              borderRadius: '4px',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            aria-label="Open menu"
          >
            <div style={{ width: '24px', height: '3px', backgroundColor: '#ffffff', borderRadius: '2px' }}></div>
            <div style={{ width: '24px', height: '3px', backgroundColor: '#ffffff', borderRadius: '2px' }}></div>
            <div style={{ width: '24px', height: '3px', backgroundColor: '#ffffff', borderRadius: '2px' }}></div>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ padding: '1rem', maxWidth: '1200px', margin: '0 auto', paddingTop: '1.5rem', paddingBottom: '2rem' }}>
        {/* Error Message */}
        {error && (
          <div style={{
            padding: '1rem',
            backgroundColor: '#fee2e2',
            border: '1px solid #ef4444',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            color: '#991b1b'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{error}</span>
              <button
                onClick={() => loadData()}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#991b1b',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  fontSize: '0.875rem',
                  marginLeft: '1rem'
                }}
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Statistics Section */}
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.5rem', fontWeight: '600', color: '#1f2937' }}>
            System Statistics
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem'
          }}>
            <div style={{
              padding: '1.5rem',
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Total Users</div>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>{systemStats.totalUsers}</div>
            </div>
            <div style={{
              padding: '1.5rem',
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Total Food Items</div>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>{systemStats.totalFoodItems}</div>
            </div>
            <div style={{
              padding: '1.5rem',
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Total Shopping Lists</div>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>{systemStats.totalShoppingLists}</div>
            </div>
            <div style={{
              padding: '1.5rem',
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Total User Items</div>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>{systemStats.totalUserItems}</div>
            </div>
          </div>
        </div>

        {/* Analytics Section */}
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.5rem', fontWeight: '600', color: '#1f2937' }}>
            Analytics Dashboard
          </h2>
          
          {loadingAnalytics ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
              <p>Loading analytics...</p>
            </div>
          ) : (
            <>
              {/* Overview Metrics */}
              {analyticsOverview && (
                <div style={{ marginBottom: '2rem' }}>
                  <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem', fontWeight: '600', color: '#374151' }}>
                    Overview
                  </h3>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1rem',
                    marginBottom: '1.5rem'
                  }}>
                    <div style={{
                      padding: '1.5rem',
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                    }}>
                      <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>New Users Today</div>
                      <div style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>{analyticsOverview.newUsersToday}</div>
                    </div>
                    <div style={{
                      padding: '1.5rem',
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                    }}>
                      <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>New Users This Week</div>
                      <div style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>{analyticsOverview.newUsersThisWeek}</div>
                    </div>
                    <div style={{
                      padding: '1.5rem',
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                    }}>
                      <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>New Users This Month</div>
                      <div style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>{analyticsOverview.newUsersThisMonth}</div>
                    </div>
                    <div style={{
                      padding: '1.5rem',
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                    }}>
                      <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Activation Rate</div>
                      <div style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>{analyticsOverview.activationRate.toFixed(1)}%</div>
                    </div>
                    <div style={{
                      padding: '1.5rem',
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                    }}>
                      <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Day 7 Retention</div>
                      <div style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>{analyticsOverview.day7Retention.toFixed(1)}%</div>
                    </div>
                    <div style={{
                      padding: '1.5rem',
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                    }}>
                      <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Day 30 Retention</div>
                      <div style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>{analyticsOverview.day30Retention.toFixed(1)}%</div>
                    </div>
                    <div style={{
                      padding: '1.5rem',
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                    }}>
                      <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>WAU/MAU Ratio</div>
                      <div style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>{analyticsOverview.wauMauRatio.toFixed(2)}</div>
                    </div>
                    <div style={{
                      padding: '1.5rem',
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                    }}>
                      <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Avg Actions/Session</div>
                      <div style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>{analyticsOverview.averageActionsPerSession.toFixed(1)}</div>
                    </div>
                    <div style={{
                      padding: '1.5rem',
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                    }}>
                      <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Error Rate</div>
                      <div style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>{analyticsOverview.errorRate.toFixed(2)}%</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Retention Metrics */}
              {retentionMetrics && (
                <div style={{ marginBottom: '2rem' }}>
                  <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem', fontWeight: '600', color: '#374151' }}>
                    Retention Metrics
                  </h3>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1rem',
                    marginBottom: '1.5rem'
                  }}>
                    <div style={{
                      padding: '1.5rem',
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                    }}>
                      <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Daily Active Users</div>
                      <div style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>{retentionMetrics.dau}</div>
                    </div>
                    <div style={{
                      padding: '1.5rem',
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                    }}>
                      <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Weekly Active Users</div>
                      <div style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>{retentionMetrics.wau}</div>
                    </div>
                    <div style={{
                      padding: '1.5rem',
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                    }}>
                      <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Monthly Active Users</div>
                      <div style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>{retentionMetrics.mau}</div>
                    </div>
                    <div style={{
                      padding: '1.5rem',
                      backgroundColor: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                    }}>
                      <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Day 1 Retention</div>
                      <div style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937' }}>{retentionMetrics.day1Retention.toFixed(1)}%</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Funnel Metrics */}
              {funnelMetrics && (
                <div style={{ marginBottom: '2rem' }}>
                  <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem', fontWeight: '600', color: '#374151' }}>
                    Funnel Analysis
                  </h3>
                  <div style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '1.5rem',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                  }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                      <div>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Visits</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937' }}>{funnelMetrics.visitCount}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Signups</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937' }}>{funnelMetrics.signupCount}</div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                          {funnelMetrics.visitToSignupRate.toFixed(1)}% conversion
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Activations</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937' }}>{funnelMetrics.activationCount}</div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                          {funnelMetrics.signupToActivationRate.toFixed(1)}% conversion
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Return Usage</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937' }}>{funnelMetrics.returnUsageCount}</div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                          {funnelMetrics.activationToReturnRate.toFixed(1)}% conversion
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Overall Conversion</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937' }}>{funnelMetrics.overallConversionRate.toFixed(1)}%</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Engagement Metrics */}
              {engagementMetrics && (
                <div style={{ marginBottom: '2rem' }}>
                  <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem', fontWeight: '600', color: '#374151' }}>
                    Engagement Metrics
                  </h3>
                  <div style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '1.5rem',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                  }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                      <div>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Avg Actions/Session</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937' }}>{engagementMetrics.averageActionsPerSession.toFixed(1)}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Avg Sessions/User</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937' }}>{engagementMetrics.averageSessionsPerUser.toFixed(1)}</div>
                      </div>
                    </div>
                    {engagementMetrics.mostUsedFeatures.length > 0 && (
                      <div>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.75rem', fontWeight: '600' }}>Most Used Features</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {engagementMetrics.mostUsedFeatures.slice(0, 5).map((feature) => (
                            <div key={feature.feature} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', backgroundColor: '#f9fafb', borderRadius: '4px' }}>
                              <span style={{ fontSize: '0.875rem', color: '#1f2937' }}>{feature.feature}</span>
                              <span style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: '600' }}>{feature.usageCount} users</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Users Section */}
        <div>
          <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.5rem', fontWeight: '600', color: '#1f2937' }}>
            User Management
          </h2>
          {loadingUsers ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
              <p>Loading users...</p>
            </div>
          ) : users.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
              <p>No users found.</p>
            </div>
          ) : (
            <div style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr',
                gap: '1rem',
                padding: '1rem',
                backgroundColor: '#f9fafb',
                borderBottom: '1px solid #e5e7eb',
                fontWeight: '600',
                color: '#374151',
                fontSize: '0.875rem'
              }}>
                <div>User ID</div>
                <div>Email</div>
                <div style={{ textAlign: 'center' }}>Food Items</div>
                <div style={{ textAlign: 'center' }}>User Items</div>
                <div style={{ textAlign: 'center' }}>Actions</div>
              </div>
              {users.map((userInfo) => (
                <div
                  key={userInfo.uid}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr',
                    gap: '1rem',
                    padding: '1rem',
                    borderBottom: '1px solid #e5e7eb',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ fontFamily: 'monospace', fontSize: '0.875rem', color: '#1f2937', wordBreak: 'break-all' }}>
                    {userInfo.uid}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#374151' }}>
                    {userInfo.email || 'N/A'}
                  </div>
                  <div style={{ textAlign: 'center', color: '#6b7280' }}>{userInfo.foodItemsCount}</div>
                  <div style={{ textAlign: 'center', color: '#6b7280' }}>{userInfo.userItemsCount}</div>
                  <div style={{ textAlign: 'center' }}>
                    <button
                      onClick={() => handleDeleteUser(userInfo.uid)}
                      disabled={deletingUserId === userInfo.uid}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: deletingUserId === userInfo.uid ? '#9ca3af' : '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        cursor: deletingUserId === userInfo.uid ? 'not-allowed' : 'pointer',
                        opacity: deletingUserId === userInfo.uid ? 0.6 : 1
                      }}
                    >
                      {deletingUserId === userInfo.uid ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Hamburger Menu */}
      <HamburgerMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
};

export default Admin;

