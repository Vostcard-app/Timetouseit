# API Key Configuration Checklist

## ✅ Website Restrictions (Already Configured)
Your API key already has these website restrictions:
- `http://localhost` ✅
- `https://*.netlify.app/*` ✅
- `https://tossittime.netlify.app/*` ✅

These should be sufficient! The `http://localhost` entry covers all localhost ports.

## ⚠️ Check API Restrictions (IMPORTANT)

Make sure your API key has these APIs enabled:

1. Go to: https://console.cloud.google.com/apis/credentials?project=tossittime
2. Click on your API key to edit it
3. Scroll to **"API restrictions"** section
4. Make sure it's set to **"Restrict key"** (not "Don't restrict key")
5. Under "Select APIs", verify these are checked:
   - ✅ **Identity Toolkit API** (REQUIRED for authentication)
   - ✅ **Cloud Firestore API** (for database)
   - ✅ **Firebase Storage API** (for file storage)
   - ✅ **Firebase Installations API** (REQUIRED for Firebase SDK)
6. Click **"Save"**

## 🔍 Verify API Key Status

1. In Google Cloud Console → Credentials
2. Your API key should show:
   - Status: **Active** (not disabled)
   - Application restrictions: **Websites** (with your 3 domains)
   - API restrictions: **Restrict key** (with required APIs enabled)

## 🧪 Test Locally

1. Make sure your `.env` file has the correct API key
2. Restart your dev server:
   ```bash
   npm run dev
   ```
3. Open browser DevTools (F12) → Console
4. Look for:
   - `🔥 Firebase Configuration:` log
   - `✅ Firebase initialized successfully`
   - No "API key not valid" errors

## 🚨 If Still Getting Errors

If you're still seeing "API key not valid" errors:

1. **Wait 1-2 minutes** after saving API restrictions (they need to propagate)
2. **Clear browser cache**: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
3. **Check the exact API key** in your `.env` file matches Firebase Console
4. **Verify the API key is active** in Google Cloud Console



