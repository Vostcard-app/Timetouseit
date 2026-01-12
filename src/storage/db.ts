import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';

export interface ExpirationCredits {
  id: 'expiration-credits';
  freeCreditsRemaining: number;
  paidCredits: number;
  totalUses: number;
  updatedAt: number;
}

interface TimeToUseItDB extends DBSchema {
  expiration_credits: {
    key: string;
    value: ExpirationCredits;
  };
}

let dbPromise: Promise<IDBPDatabase<TimeToUseItDB>>;

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<TimeToUseItDB>('timetouseit', 1, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          db.createObjectStore('expiration_credits', { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

// ---------- EXPIRATION CREDITS ----------
const DEFAULT_FREE_CREDITS = 10;

export async function getExpirationCredits(): Promise<ExpirationCredits> {
  const db = await getDB();
  const credits = await db.get('expiration_credits', 'expiration-credits');
  if (credits) {
    return credits;
  }
  // Initialize with defaults
  const defaultCredits: ExpirationCredits = {
    id: 'expiration-credits',
    freeCreditsRemaining: DEFAULT_FREE_CREDITS,
    paidCredits: 0,
    totalUses: 0,
    updatedAt: Date.now()
  };
  await db.put('expiration_credits', defaultCredits);
  return defaultCredits;
}

export async function updateExpirationCredits(updates: Partial<Omit<ExpirationCredits, 'id'>>): Promise<ExpirationCredits> {
  const db = await getDB();
  const current = await getExpirationCredits();
  const updated: ExpirationCredits = {
    ...current,
    ...updates,
    updatedAt: Date.now()
  };
  await db.put('expiration_credits', updated);
  return updated;
}

export async function initializeExpirationCredits(): Promise<ExpirationCredits> {
  const db = await getDB();
  const defaultCredits: ExpirationCredits = {
    id: 'expiration-credits',
    freeCreditsRemaining: DEFAULT_FREE_CREDITS,
    paidCredits: 0,
    totalUses: 0,
    updatedAt: Date.now()
  };
  await db.put('expiration_credits', defaultCredits);
  return defaultCredits;
}

