import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase/firebaseConfig';
import { adminService } from '../services/adminService';
import { recipeSiteService } from '../services/recipeSiteService';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import HamburgerMenu from '../components/layout/HamburgerMenu';
import Banner from '../components/layout/Banner';
import { analyticsAggregationService } from '../services/analyticsAggregationService';
import type { DashboardOverview, RetentionMetrics, FunnelMetrics, EngagementMetrics } from '../types/analytics';
import type { RecipeSite } from '../types/recipeImport';
import { getErrorInfo } from '../types';
import { showToast } from '../components/Toast';
import { AdminSystemStats } from '../components/admin/AdminSystemStats';
import { AdminUserManagement, type UserInfo } from '../components/admin/AdminUserManagement';
import { AdminAnalytics } from '../components/admin/AdminAnalytics';
import { AdminRecipeSites } from '../components/admin/AdminRecipeSites';
import { AdminMasterFoodList } from '../components/admin/AdminMasterFoodList';

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
    totalAITokens: 0,
    totalAIRequests: 0,
    totalAICost: 0,
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [cleaningUpOrphaned, setCleaningUpOrphaned] = useState(false);
  const [analyticsOverview, setAnalyticsOverview] = useState<DashboardOverview | null>(null);
  const [retentionMetrics, setRetentionMetrics] = useState<RetentionMetrics | null>(null);
  const [funnelMetrics, setFunnelMetrics] = useState<FunnelMetrics | null>(null);
  const [engagementMetrics, setEngagementMetrics] = useState<EngagementMetrics | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  
  // Recipe sites state
  const [recipeSites, setRecipeSites] = useState<RecipeSite[]>([]);
  const [loadingRecipeSites, setLoadingRecipeSites] = useState(false);
  
  const [populatingEmails, setPopulatingEmails] = useState(false);

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

  // Load recipe sites
  const loadRecipeSites = async () => {
    if (!isAdmin) return;
    setLoadingRecipeSites(true);
    try {
      const sites = await recipeSiteService.getRecipeSites();
      setRecipeSites(sites);
    } catch (error) {
      console.error('Error loading recipe sites:', error);
    } finally {
      setLoadingRecipeSites(false);
    }
  };

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
      } catch (statsError: unknown) {
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
      } catch (foodError: unknown) {
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
      } catch (shoppingError: unknown) {
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
      } catch (userItemsError: unknown) {
        console.error('Error loading userItems:', userItemsError);
        errors.push('Failed to load user items collection');
      }

      // Load userSettings and collect emails and usernames
      const userEmails = new Map<string, string>();
      const userUsernames = new Map<string, string>();
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
            if (settingsData?.username) {
              userUsernames.set(userId, settingsData.username);
            }
          }
        });
        
        // Also try to get email and username from current user's auth if available
        if (user && user.email && user.uid) {
          if (!userEmails.has(user.uid)) {
            userEmails.set(user.uid, user.email);
          }
          // Extract username from email if not already set
          if (!userUsernames.has(user.uid) && user.email) {
            const emailParts = user.email.split('@');
            if (emailParts.length > 0 && emailParts[0]) {
              userUsernames.set(user.uid, emailParts[0].toLowerCase().trim());
            }
          }
        }
      } catch (settingsError: unknown) {
        console.error('Error loading userSettings:', settingsError);
        errors.push('Failed to load user settings collection');
      }

      // Get stats for each user with error handling
      const userInfos: UserInfo[] = [];
      for (const uid of userIds) {
        try {
          const stats = await adminService.getUserStats(uid);
          const email = userEmails.get(uid);
          const username = userUsernames.get(uid);
          
          userInfos.push({
            uid,
            email: email,
            username: username,
            ...stats,
          });
        } catch (userStatsError: unknown) {
          console.error(`Error loading stats for user ${uid}:`, userStatsError);
          // Skip this user but continue with others
          // Optionally add user with zero stats
          const email = userEmails.get(uid);
          const username = userUsernames.get(uid);
          
          userInfos.push({
            uid,
            email: email,
            username: username,
            foodItemsCount: 0,
            userItemsCount: 0,
            tokenUsage: undefined,
          });
        }
      }

      // Check which users exist in Firebase Auth
      try {
        const userIdsArray = Array.from(userIds);
        const authStatusResults = await adminService.checkUserAuthStatus(userIdsArray);
        const authStatusMap = new Map<string, boolean>();
        authStatusResults.forEach(result => {
          authStatusMap.set(result.userId, result.existsInAuth);
          // Update email if we got it from Auth and don't have it in userSettings
          if (result.existsInAuth && result.email) {
            const userInfo = userInfos.find(u => u.uid === result.userId);
            if (userInfo && !userInfo.email) {
              userInfo.email = result.email;
            }
          }
        });
        
        // Add auth status to each user
        userInfos.forEach(userInfo => {
          userInfo.existsInAuth = authStatusMap.get(userInfo.uid) ?? false;
        });
      } catch (authStatusError) {
        console.error('Error checking auth status:', authStatusError);
        // Continue without auth status - users will show as unknown
      }

      // Sort by food items count (descending)
      userInfos.sort((a, b) => b.foodItemsCount - a.foodItemsCount);
      setUsers(userInfos);

      // Set error message if any errors occurred
      if (errors.length > 0) {
        setError(`Some data failed to load: ${errors.join(', ')}. Partial data is shown below.`);
      }
    } catch (error: unknown) {
      const errorInfo = getErrorInfo(error);
      console.error('Unexpected error loading admin data:', error);
      setError(`Failed to load admin data: ${errorInfo.message || 'Unknown error'}`);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) return;
    loadData();
    loadAnalytics();
    loadRecipeSites();
  }, [isAdmin]);

  // Load analytics data
  const loadAnalytics = async () => {
    if (!isAdmin) return;
    
    setLoadingAnalytics(true);
    setAnalyticsError(null);
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
    } catch (error: unknown) {
      const errorInfo = getErrorInfo(error);
      console.error('Error loading analytics:', error);
      setAnalyticsError(`Failed to load analytics: ${errorInfo.message || 'Unknown error'}`);
    } finally {
      setLoadingAnalytics(false);
    }
  };


  // Populate missing emails/usernames
  const handlePopulateMissingEmails = async () => {
    if (!user?.email || !isAdmin) {
      alert('You must be an admin to perform this action');
      return;
    }

    // Get users without email or username
    const usersNeedingUpdate = users.filter(u => !u.email || !u.username);
    
    if (usersNeedingUpdate.length === 0) {
      showToast('All users already have email and username', 'info');
      return;
    }

    if (!window.confirm(`This will populate missing emails and usernames for ${usersNeedingUpdate.length} user(s). Continue?`)) {
      return;
    }

    setPopulatingEmails(true);
    try {
      const userIds = usersNeedingUpdate.map(u => u.uid);
      const result = await adminService.populateUserEmails(userIds);
      
      showToast(
        `Migration complete: ${result.updated} updated, ${result.errors} errors, ${result.processed - result.updated - result.errors} already had data`,
        result.errors > 0 ? 'warning' : 'success'
      );
      
      // Reload user data
      await loadData();
    } catch (error: unknown) {
      const errorInfo = getErrorInfo(error);
      console.error('Error populating emails:', error);
      alert(`Failed to populate emails: ${errorInfo.message || 'Unknown error'}`);
    } finally {
      setPopulatingEmails(false);
    }
  };

  // Clean up orphaned user data (users not in Firebase Auth)
  const handleCleanupOrphanedUsers = async () => {
    if (!user?.email || !isAdmin) {
      alert('You must be an admin to perform this action');
      return;
    }

    // Get orphaned users (users that don't exist in Auth)
    const orphanedUsers = users.filter(u => u.existsInAuth === false);
    
    if (orphanedUsers.length === 0) {
      showToast('No orphaned users found', 'info');
      return;
    }

    if (!window.confirm(`This will permanently delete all data for ${orphanedUsers.length} orphaned user(s). This action cannot be undone. Continue?`)) {
      return;
    }

    setCleaningUpOrphaned(true);
    try {
      let deletedCount = 0;
      let errorCount = 0;

      for (const orphanedUser of orphanedUsers) {
        try {
          await adminService.deleteUserData(orphanedUser.uid);
          deletedCount++;
        } catch (error) {
          console.error(`Error deleting user ${orphanedUser.uid}:`, error);
          errorCount++;
        }
      }

      showToast(`Cleanup complete: ${deletedCount} user(s) deleted, ${errorCount} error(s)`, deletedCount > 0 ? 'success' : 'error');
      
      // Reload users to reflect changes
      await loadData();
    } catch (error: unknown) {
      const errorInfo = getErrorInfo(error);
      console.error('Error cleaning up orphaned users:', error);
      alert(`Failed to cleanup orphaned users: ${errorInfo.message || 'Unknown error'}`);
    } finally {
      setCleaningUpOrphaned(false);
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
      <Banner onMenuClick={() => setMenuOpen(true)} />

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
        <AdminSystemStats stats={systemStats} />

        {/* Analytics Section */}
        <AdminAnalytics
          loading={loadingAnalytics}
          error={analyticsError}
          overview={analyticsOverview}
          retention={retentionMetrics}
          funnel={funnelMetrics}
          engagement={engagementMetrics}
          onRetry={loadAnalytics}
        />

        {/* Recipe Sites Section */}
        <AdminRecipeSites
          recipeSites={recipeSites}
          loading={loadingRecipeSites}
          onSitesChange={loadRecipeSites}
        />

        {/* Master Food List Management Section */}
        <AdminMasterFoodList
          onItemsChange={async () => {
            await loadData();
          }}
        />

        {/* Users Section */}
        <AdminUserManagement
          users={users}
          loading={loadingUsers}
          onUsersChange={setUsers}
          onSystemStatsUpdate={async () => {
            const stats = await adminService.getSystemStats();
            setSystemStats(stats);
          }}
          onPopulateEmails={handlePopulateMissingEmails}
          populatingEmails={populatingEmails}
          cleaningUpOrphaned={cleaningUpOrphaned}
          onCleanupOrphaned={handleCleanupOrphanedUsers}
        />
      </div>

      {/* Hamburger Menu */}
      <HamburgerMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
};

export default Admin;

