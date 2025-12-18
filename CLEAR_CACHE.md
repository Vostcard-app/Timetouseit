# Clear Browser Cache and Service Worker

The old API key is cached in your browser. Follow these steps:

## Step 1: Unregister Service Worker

1. Open your app in the browser
2. Open DevTools (F12)
3. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
4. Click **Service Workers** in the left sidebar
5. Find your service worker and click **Unregister**
6. If you see "Update on reload", click it

## Step 2: Clear All Site Data

1. In DevTools, still in **Application** tab
2. Click **Clear storage** in the left sidebar
3. Check **all boxes**:
   - Local storage
   - Session storage
   - IndexedDB
   - Cache storage
   - Service Workers
4. Click **Clear site data**

## Step 3: Hard Reload

1. Close DevTools
2. Press `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
3. Or: Open DevTools → Right-click refresh button → **"Empty Cache and Hard Reload"**

## Step 4: Restart Dev Server

1. Stop your dev server (Ctrl+C or Cmd+C)
2. Restart it:
   ```bash
   npm run dev
   ```

## Step 5: Verify

1. Open the app in a **new incognito/private window**
2. Open DevTools → Console
3. Look for: `🔥 Firebase Configuration:`
4. Check the API key ends with `...KO1A0` (not `...K01A0`)

## Alternative: Use Incognito Mode

The easiest way to test:
1. Open a new **Incognito/Private window**
2. Navigate to your app
3. This bypasses all cache and service workers

