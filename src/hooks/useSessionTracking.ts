import { useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase/firebaseConfig';
import { analyticsService } from '../services/analyticsService';

const SESSION_STORAGE_KEY = 'timetouseit_last_session';
const LAST_ACTIVE_KEY = 'timetouseit_last_active';

/**
 * Hook to track user sessions and retention metrics
 * Tracks DAU, WAU, MAU, and return sessions
 */
export const useSessionTracking = () => {
  const [user] = useAuthState(auth);

  useEffect(() => {
    if (!user) return;

    const trackSession = async () => {
      try {
        const now = Date.now();
        const lastSessionTime = localStorage.getItem(SESSION_STORAGE_KEY);

        // Check if this is a return session (24+ hours since last session)
        if (lastSessionTime) {
          const timeSinceLastSession = now - parseInt(lastSessionTime, 10);
          const hoursSinceLastSession = timeSinceLastSession / (1000 * 60 * 60);

          if (hoursSinceLastSession >= 24) {
            // Track return session
            await analyticsService.trackRetention(user.uid, 'return_session', {
              daysSinceLastSession: Math.floor(hoursSinceLastSession / 24),
              isReturning: true,
            });
          }
        }

        // Track daily active user
        await analyticsService.trackRetention(user.uid, 'daily_active_user', {});

        // Track weekly active user (if not tracked today)
        const today = new Date().toDateString();
        const lastWauDate = localStorage.getItem('timetouseit_last_wau_date');
        if (lastWauDate !== today) {
          await analyticsService.trackRetention(user.uid, 'weekly_active_user', {});
          localStorage.setItem('timetouseit_last_wau_date', today);
        }

        // Track monthly active user (if not tracked this month)
        const thisMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
        const lastMauMonth = localStorage.getItem('timetouseit_last_mau_month');
        if (lastMauMonth !== thisMonth) {
          await analyticsService.trackRetention(user.uid, 'monthly_active_user', {});
          localStorage.setItem('timetouseit_last_mau_month', thisMonth);
        }

        // Update last session time
        localStorage.setItem(SESSION_STORAGE_KEY, now.toString());
        localStorage.setItem(LAST_ACTIVE_KEY, now.toString());
      } catch (error) {
        console.error('Error tracking session:', error);
      }
    };

    trackSession();

    // Update last active time periodically (every 5 minutes)
    const updateLastActive = () => {
      if (user) {
        localStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());
      }
    };

    const interval = setInterval(updateLastActive, 5 * 60 * 1000); // 5 minutes

    return () => {
      clearInterval(interval);
    };
  }, [user]);
};

