## Performance Issues Identified

1. **Critical path latency: 32,249 ms** - Firestore channel requests blocking page load
2. **App.tsx calls useFoodItems immediately** - Subscribes to Firestore before user navigates
3. **Multiple Firestore subscriptions on page load** - Shop page sets up 3+ subscriptions immediately
4. **Many small JavaScript chunks** - Sequential loading of 0.55-6.31 KiB chunks

## Solution Strategy

### 1. Defer Firestore Subscriptions in App.tsx

**File: `src/App.tsx`**

Remove the `useFoodItems` hook call from App.tsx. This subscription is blocking the critical path but isn't needed until the user navigates to a page that uses it. Instead:
- Remove line 37: `const { foodItems } = useFoodItems(user || null);`
- Move the notification check logic to only run when needed (or defer it)
- Update the expiring items check to only run when foodItems are actually loaded on a page

### 2. Defer Non-Critical Subscriptions in Shop Page

**File: `src/pages/Shop.tsx`**

Delay Firestore subscriptions until after initial render:
- Use `setTimeout` to defer subscriptions by 100-200ms
- This allows the page to render first, then load data
- Keep loading states so UI shows properly

### 3. Optimize Code Splitting

**File: `vite.config.ts`**

Configure Vite to create fewer, larger chunks:
- Set `manualChunks` to group related modules together
- Reduce the number of small chunks (currently 10+ chunks under 7KB)
- Group vendor libraries together

### 4. Lazy Load useFoodItems Hook

**File: `src/hooks/useFoodItems.ts`**

Add an option to defer subscription:
- Add a `defer` parameter that delays subscription by 100-200ms
- Use `setTimeout` to defer
- This allows pages to render before starting Firestore connections

## Implementation Details

### App.tsx Changes

Remove the blocking subscription and defer notification checks:
- Remove `useFoodItems` call
- Move notification check to Dashboard or defer it significantly
- Only check expiring items when on a page that needs it

### Shop.tsx Changes

Defer subscriptions:
```typescript
useEffect(() => {
  if (!user) return;
  
  // Defer subscription to allow initial render
  const timeoutId = setTimeout(() => {
    const unsubscribe = shoppingListsService.subscribeToShoppingLists(...);
    return () => unsubscribe();
  }, 100);
  
  return () => clearTimeout(timeoutId);
}, [user]);
```

### vite.config.ts Changes

Add manual chunking:
```typescript
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'vendor-react': ['react', 'react-dom', 'react-router-dom'],
        'vendor-firebase': ['firebase/app', 'firebase/firestore', 'firebase/auth'],
        'vendor-date': ['date-fns'],
      }
    }
  }
}
```

## Expected Results

- Critical path latency reduced from 32s to <3s
- Initial page render before Firestore connections
- Fewer sequential chunk loads
- Better LCP (Largest Contentful Paint) scores
- Improved user-perceived performance
