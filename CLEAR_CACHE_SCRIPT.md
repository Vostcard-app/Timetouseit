# CLEAR CACHE - DO THIS NOW

## Step 1: Stop Dev Server
Press Ctrl+C or Cmd+C to stop

## Step 2: Clear Everything
```bash
rm -rf dist node_modules/.vite .vite
```

## Step 3: Restart Dev Server
```bash
npm run dev
```

## Step 4: Clear Browser (CRITICAL)
1. Open DevTools (F12)
2. Go to Application tab
3. Click "Service Workers" → Unregister ALL
4. Click "Clear storage" → Check ALL boxes → "Clear site data"
5. Close DevTools
6. Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

## Step 5: Test in INCOGNITO
Open NEW incognito window → Go to localhost:5174

