# Netlify Environment Variables Setup

## Problem
You're seeing this error:
```
API key not valid. Please pass a valid API key.
```

This happens because Firebase environment variables aren't set in Netlify.

## Solution: Add Environment Variables to Netlify

### Step 1: Get Your Firebase Config Values

Your Firebase config values are in your local `.env` file. You need to add them to Netlify.

### Step 2: Add Variables to Netlify

1. Go to your Netlify dashboard: https://app.netlify.com/
2. Select your site: **tossittime** (or your site name)
3. Go to **Site settings** → **Environment variables**
4. Click **"Add a variable"** for each of these:

#### Required Variables:

| Variable Name | Value |
|--------------|-------|
| `VITE_FIREBASE_API_KEY` | `YOUR_API_KEY_HERE` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `tossittime.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `tossittime` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `tossittime.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `218263308308` |
| `VITE_FIREBASE_APP_ID` | `1:218263308308:web:2837debce015071c887f01` |

### Step 3: Configure API Key Restrictions

Your API key might be restricted. You need to add your Netlify domain:

1. Go to: https://console.cloud.google.com/apis/credentials?project=tossittime
2. Find your API key (starts with `AIzaSy...`)
3. Click to edit it
4. Under **"Application restrictions"** → **"Websites"**
5. Add these HTTP referrers:
   - `https://tossittime.netlify.app/*`
   - `https://*.netlify.app/*` (for preview deployments)
   - `http://localhost:*` (for local dev)
6. Under **"API restrictions"**, make sure these are enabled:
   - ✅ Identity Toolkit API
   - ✅ Cloud Firestore API
   - ✅ Firebase Storage API
   - ✅ Firebase Installations API
7. Click **"Save"**

### Step 4: Redeploy

After adding environment variables:

1. Go to Netlify dashboard → **Deploys**
2. Click **"Trigger deploy"** → **"Deploy site"**
3. Or push a new commit to trigger a new deploy

### Step 5: Verify

After redeploy, check:
- ✅ No more "API key not valid" errors
- ✅ Login page loads without errors
- ✅ You can sign in/sign up

## Troubleshooting

### Still getting API key errors?

1. **Wait 1-2 minutes** after saving API key restrictions (they need to propagate)
2. **Verify environment variables** in Netlify:
   - Go to Site settings → Environment variables
   - Make sure all 6 variables are there
   - Check for typos in variable names (must start with `VITE_`)
3. **Check API key restrictions**:
   - Make sure your Netlify domain is in the allowed referrers
   - Verify required APIs are enabled
4. **Clear browser cache** and hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

### Environment variables not showing in build?

- Make sure variable names start with `VITE_` (required for Vite)
- Redeploy after adding variables
- Check Netlify build logs to see if variables are being used

