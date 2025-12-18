# EMERGENCY FIX - DO THIS EXACTLY

## The Problem
Your browser has cached the OLD API key. The error shows `...K01A0` but your .env has `...KO1A0`.

## FIX IT NOW:

### 1. STOP DEV SERVER
Press `Ctrl+C` or `Cmd+C` in terminal

### 2. CLEAR ALL CACHES
Run this command:
```bash
rm -rf dist node_modules/.vite .vite
```

### 3. RESTART DEV SERVER
```bash
npm run dev
```

### 4. CLEAR BROWSER CACHE (CRITICAL!)
**Option A - EASIEST: Use Incognito Mode**
- Open NEW incognito/private window
- Go to: `http://localhost:5174`
- This bypasses ALL cache

**Option B - Clear Cache Manually**
1. Open DevTools (F12)
2. Go to **Application** tab
3. Click **Service Workers** → Click **Unregister** on all
4. Click **Clear storage** → Check ALL boxes → Click **Clear site data**
5. Close DevTools
6. Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)

### 5. CHECK CONSOLE
In browser console, you should see:
```
🔥 Firebase Configuration: {
  apiKeyEnd: "KO1A0"  // ✅ CORRECT (NOT "K01A0")
}
```

If you see `K01A0`, the cache is STILL there. Use incognito mode.

## IF STILL NOT WORKING:

The API key is correct. The ONLY other issue is Google Cloud API restrictions:

1. Go to: https://console.cloud.google.com/apis/credentials?project=tossittime
2. Click your API key
3. Scroll to **"API restrictions"**
4. Make sure it says **"Restrict key"**
5. Click **"Select APIs"**
6. **CHECK THESE 4:**
   - ✅ Identity Toolkit API
   - ✅ Cloud Firestore API
   - ✅ Cloud Storage API
   - ✅ Firebase Installations API
7. Save
8. Wait 2 minutes

THEN test in incognito mode again.

