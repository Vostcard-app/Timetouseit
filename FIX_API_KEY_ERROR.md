# Fix API Key Error - Step by Step

You're seeing: `API key not valid. Please pass a valid API key.`

This happens because:
1. **Environment variables aren't set in Netlify**, OR
2. **API key restrictions are blocking your domain**

## Quick Fix (5 minutes)

### Step 1: Verify Your API Key

Your API key should be: `AIzaSyDv9GV58Aneksy1ORoFhmt6FffKGiKO1A0`

**Important:** Make sure there are NO typos or extra spaces!

### Step 2: Add Environment Variables to Netlify

1. Go to: https://app.netlify.com/
2. Select your site: **tossittime**
3. Go to: **Site settings** → **Environment variables**
4. Click **"Add a variable"** and add each of these:

   ```
   VITE_FIREBASE_API_KEY = AIzaSyDv9GV58Aneksy1ORoFhmt6FffKGiKO1A0
   VITE_FIREBASE_AUTH_DOMAIN = tossittime.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID = tossittime
   VITE_FIREBASE_STORAGE_BUCKET = tossittime.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID = 218263308308
   VITE_FIREBASE_APP_ID = 1:218263308308:web:2837debce015071c887f01
   ```

   **⚠️ Important:** 
   - Variable names MUST start with `VITE_`
   - No spaces around the `=` sign
   - Copy the values exactly (no extra spaces)

### Step 3: Configure API Key Restrictions

Your API key needs to allow your Netlify domain:

1. Go to: https://console.cloud.google.com/apis/credentials?project=tossittime
2. Find your API key (starts with `AIzaSy...`)
3. Click on it to edit
4. Under **"Application restrictions"**:
   - Select **"Websites"**
   - Click **"Add an item"** and add:
     - `https://tossittime.netlify.app/*`
     - `https://*.netlify.app/*` (for preview deployments)
     - `http://localhost:*` (for local development)
5. Under **"API restrictions"**:
   - Select **"Restrict key"**
   - Make sure these APIs are enabled:
     - ✅ Identity Toolkit API
     - ✅ Cloud Firestore API
     - ✅ Firebase Storage API
     - ✅ Firebase Installations API
6. Click **"Save"**

### Step 4: Redeploy

After adding environment variables:

1. Go to Netlify dashboard → **Deploys**
2. Click **"Trigger deploy"** → **"Deploy site"**
3. Wait for the build to complete

### Step 5: Test

1. Go to your site: https://tossittime.netlify.app
2. Open browser DevTools (F12) → Console
3. Check if the API key error is gone
4. Try to sign in/sign up

## Troubleshooting

### Still getting the error?

1. **Wait 1-2 minutes** after saving API key restrictions (they need to propagate)

2. **Double-check environment variables in Netlify:**
   - Go to Site settings → Environment variables
   - Verify all 6 variables are there
   - Check for typos (especially `VITE_` prefix)
   - Make sure values match exactly (no extra spaces)

3. **Verify API key in Google Cloud Console:**
   - Go to: https://console.cloud.google.com/apis/credentials?project=tossittime
   - Click on your API key
   - Click "Show key" and verify it matches: `AIzaSyDv9GV58Aneksy1ORoFhmt6FffKGiKO1A0`

4. **Check API key restrictions:**
   - Make sure your Netlify domain is in the allowed referrers
   - Verify all required APIs are enabled

5. **Clear browser cache:**
   - Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)

## Quick Checklist

- [ ] All 6 environment variables added to Netlify
- [ ] API key restrictions configured with Netlify domain
- [ ] Required APIs enabled (Identity Toolkit, Firestore, Storage, Installations)
- [ ] Site redeployed after adding variables
- [ ] Waited 1-2 minutes for restrictions to propagate
- [ ] Cleared browser cache and tested again

## Still Not Working?

If you've done all the above and it still doesn't work:

1. **Check Netlify build logs:**
   - Go to Deploys → Latest deploy → Build log
   - Look for any errors about environment variables

2. **Test locally:**
   - Make sure your `.env` file has the correct values
   - Run `npm run dev`
   - If it works locally but not on Netlify, it's definitely an environment variable issue

3. **Verify the API key is active:**
   - In Google Cloud Console, make sure the key status is "Active" (not restricted or disabled)

