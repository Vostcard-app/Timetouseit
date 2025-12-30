/**
 * Common Utility Types
 */

// Firestore document data type (excludes undefined values)
export type FirestoreData<T> = {
  [K in keyof T]: T[K] extends undefined ? never : T[K];
};

// Partial update data type for Firestore
export type FirestoreUpdateData<T> = Partial<FirestoreData<T>> & Record<string, unknown>;

// Error helper type
export interface ErrorWithCode extends Error {
  code?: string;
}

// Helper function to safely extract error information
export function getErrorInfo(error: unknown): { message: string; code?: string } {
  if (error instanceof Error) {
    const errWithCode = error as ErrorWithCode;
    return {
      message: error.message,
      code: errWithCode.code
    };
  }
  return {
    message: String(error),
    code: undefined
  };
}

// CSS custom properties type
export interface CSSPropertiesWithVars extends React.CSSProperties {
  [key: `--${string}`]: string | number | undefined;
}

// Window object extensions
declare global {
  interface Window {
    __firestoreIndexWarningShown?: boolean;
    __shoppingListIndexWarningShown?: boolean;
  }
}

