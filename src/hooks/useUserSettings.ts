/**
 * useUserSettings Hook
 * Manages user settings state and operations
 * 
 * @example
 * ```tsx
 * const { settings, loading, updateSettings } = useUserSettings(user);
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import type { User } from 'firebase/auth';
import { userSettingsService } from '../services';
import type { UserSettings } from '../types';

interface UseUserSettingsReturn {
  settings: UserSettings | null;
  loading: boolean;
  error: Error | null;
  updateSettings: (updates: Partial<UserSettings>) => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Hook for managing user settings
 */
export function useUserSettings(user: User | null): UseUserSettingsReturn {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadSettings = useCallback(async () => {
    if (!user) {
      setSettings(null);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const userSettings = await userSettingsService.getUserSettings(user.uid);
      setSettings(userSettings);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      console.error('Error loading user settings:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const updateSettings = useCallback(
    async (updates: Partial<UserSettings>): Promise<void> => {
      if (!user || !settings) {
        throw new Error('User or settings not available');
      }

      try {
        const updatedSettings: UserSettings = {
          ...settings,
          ...updates,
        };
        await userSettingsService.updateUserSettings(updatedSettings);
        setSettings(updatedSettings);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        throw error;
      }
    },
    [user, settings]
  );

  return {
    settings,
    loading,
    error,
    updateSettings,
    refresh: loadSettings,
  };
}

