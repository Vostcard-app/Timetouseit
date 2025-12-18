# 🔴 URGENT: Fix Invalid API Key Error

## The Error You're Seeing

```
API key not valid. Please pass a valid API key.
identitytoolkit.googleapis.com/v1/projects?key=YOUR_API_KEY: Failed to load resource: the server responded with a status of 400
```

## Root Cause

The API key is either:
1. **Incorrect** - Wrong API key in environment variables
2. **Revoked/Expired** - API key was deleted or disabled
3. **Restricted** - API key restrictions are blocking your domain
4. **Missing APIs** - Required APIs are not enabled for this key

## Quick Fix (10 minutes)

### Step 1: Verify Your API Key in Firebase Console

1. Go to: https://console.firebase.google.com/
2. Select your project: **tossittime**
3. Click the **gear icon** (⚙️) → **Project settings**
4. Scroll to **"Your apps"** section
5. Click on your web app (or create one if it doesn't exist)
6. Click **"Config"** button
7. **Copy the `apiKey` value** - it should start with `AIzaSy...`

**⚠️ Important:** Make sure you copy the ENTIRE key (39 characters)

### Step 2: Update Environment Variables

#### For Local Development:

1. Create/update `.env` file in project root:
   ```env
   VITE_FIREBASE_API_KEY=YOUR_ACTUAL_API_KEY_HERE
   VITE_FIREBASE_AUTH_DOMAIN=tossittime.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=tossittime
   VITE_FIREBASE_STORAGE_BUCKET=tossittime.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=218263308308
   VITE_FIREBASE_APP_ID=1:218263308308:web:2837debce015071c887f01
   ```

2. Replace `YOUR_ACTUAL_API_KEY_HERE` with the API key from Step 1

3. Restart your dev server:
   ```bash
   npm run dev
   ```

#### For Production (Netlify):

1. Go to: https://app.netlify.com/
2. Select your site: **tossittime**
3. Go to: **Site settings** → **Environment variables**
4. Find `VITE_FIREBASE_API_KEY` and click **Edit**
5. Paste your actual API key from Step 1
6. Click **Save**
7. Go to **Deploys** → **Trigger deploy** → **Deploy site**

### Step 3: Configure API Key Restrictions in Google Cloud Console

**This is CRITICAL - API key restrictions can block your app!**

1. Go to: https://console.cloud.google.com/apis/credentials?project=tossittime
2. Find your API key (starts with `AIzaSy...`)
3. Click on it to **Edit**

#### Configure Application Restrictions:

1. Under **"Application restrictions"**, select **"Websites"**
2. Click **"Add an item"** and add these referrers:
   - `http://localhost:*` (for local development)
   - `http://127.0.0.1:*` (for local development)
   - `https://tossittime.netlify.app/*` (for production)
   - `https://*.netlify.app/*` (for preview deployments)
3. Click **"Save"**

#### Configure API Restrictions:

1. Under **"API restrictions"**, select **"Restrict key"**
2. Click **"Select APIs"**
3. **Enable these APIs** (check the boxes):
   - ✅ **Identity Toolkit API** (REQUIRED for authentication)
   - ✅ **Cloud Firestore API** (for database)
   - ✅ **Firebase Storage API** (for file storage)
   - ✅ **Firebase Installations API** (REQUIRED for Firebase SDK)
   - ✅ **Firebase Cloud Messaging API** (if using notifications)
4. Click **"Save"**

### Step 4: Verify API Key Status

1. In Google Cloud Console, make sure your API key shows:
   - Status: **Active** (not disabled)
   - Application restrictions: **Websites** with your domains
   - API restrictions: **Restrict key** with required APIs enabled

### Step 5: Wait and Test

1. **Wait 1-2 minutes** for API key restrictions to propagate
2. **Clear browser cache**: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
3. **Test your app**:
   - Open browser DevTools (F12) → Console
   - Check if the API key error is gone
   - Try to sign in/sign up

## Troubleshooting

### Still Getting "API key not valid" Error?

1. **Double-check the API key**:
   - Open browser DevTools → Console
   - Look for the log: `🔥 Firebase Configuration:`
   - Verify the masked API key matches what you expect
   - The API key should be 39 characters and start with `AIzaSy`

2. **Verify environment variables are loaded**:
   - In DevTools Console, you should see the Firebase config log
   - If you see `apiKey: MISSING`, your environment variables aren't set

3. **Check API key restrictions**:
   - Make sure your current domain is in the allowed referrers
   - For localhost: `http://localhost:*` must be added
   - For Netlify: `https://tossittime.netlify.app/*` must be added

4. **Verify APIs are enabled**:
   - Go to: https://console.cloud.google.com/apis/library?project=tossittime
   - Search for "Identity Toolkit API"
   - Make sure it shows "Enabled" (not "Enable")

5. **Check if API key is active**:
   - In Google Cloud Console → Credentials
   - Your API key should show status: **Active**
   - If it shows "Restricted" or "Disabled", click to edit and enable it

### API Key Format Issues

If your API key doesn't start with `AIzaSy`:
- You might have copied the wrong value
- Go back to Firebase Console → Project Settings → Your apps → Config
- Make sure you're copying the `apiKey` field, not `projectId` or `appId`

### Environment Variables Not Loading

**For Local Development:**
- Make sure `.env` file is in the project root (same folder as `package.json`)
- Variable names MUST start with `VITE_`
- No spaces around `=` sign
- Restart dev server after creating/editing `.env`

**For Netlify:**
- Go to Site settings → Environment variables
- Verify all variables start with `VITE_`
- Redeploy after adding/editing variables

## Quick Checklist

- [ ] Copied correct API key from Firebase Console
- [ ] Updated `.env` file (local) or Netlify environment variables (production)
- [ ] Added domain restrictions in Google Cloud Console
- [ ] Enabled required APIs (Identity Toolkit, Firestore, Storage, Installations)
- [ ] API key status is "Active"
- [ ] Waited 1-2 minutes for restrictions to propagate
- [ ] Cleared browser cache
- [ ] Restarted dev server (local) or redeployed (production)
- [ ] Tested login/signup functionality

## Still Not Working?

If you've completed all steps and it still doesn't work:

1. **Create a new API key**:
   - Go to Google Cloud Console → Credentials
   - Click "Create Credentials" → "API key"
   - Configure restrictions as described above
   - Update your environment variables with the new key

2. **Check Firebase project**:
   - Make sure you're using the correct Firebase project
   - Verify project ID matches: `tossittime`

3. **Contact support**:
   - Check Firebase status: https://status.firebase.google.com/
   - Check Google Cloud status: https://status.cloud.google.com/

## Need Help?

Check these files for more details:
- `FIX_API_KEY_ERROR.md` - Detailed troubleshooting guide
- `FIREBASE_SETUP.md` - Complete Firebase setup instructions
- `NETLIFY_ENV_SETUP.md` - Netlify-specific setup

