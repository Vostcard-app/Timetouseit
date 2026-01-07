/**
 * useStorageTabs Hook
 * Handles storage type tab state management
 */

import { useState } from 'react';

export type StorageTabType = 'perishable' | 'dryCanned';

export function useStorageTabs(initialTab: StorageTabType = 'perishable') {
  const [storageTab, setStorageTab] = useState<StorageTabType>(initialTab);

  return {
    storageTab,
    setStorageTab
  };
}

