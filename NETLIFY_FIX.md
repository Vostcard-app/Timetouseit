# Netlify Fix - Do This

## The Problem
Your Netlify site has the OLD API key cached or wrong environment variables.

## Fix It:

### Step 1: Update Netlify Environment Variables
1. Go to: https://app.netlify.com/
2. Select your site: **tossittime**
3. Go to: **Site settings** → **Environment variables**
4. Find `VITE_FIREBASE_API_KEY`
5. Make sure it's: `AIzaSyDv9GV58Aneksy1ORoFhmt6FffKGiKO1A0`
6. If it's different, click Edit and update it
7. Save

### Step 2: Redeploy
1. Go to **Deploys** tab
2. Click **"Trigger deploy"** → **"Deploy site"**
3. Wait for it to finish

### Step 3: Clear Browser Cache for Netlify
1. On the Netlify site, open DevTools (F12)
2. Application tab → Service Workers → **Unregister**
3. Clear storage → Check all → Clear site data
4. Hard refresh: Cmd+Shift+R

### Step 4: Check API Restrictions
1. Go to: https://console.cloud.google.com/apis/credentials?project=tossittime
2. Click your API key
3. API restrictions → Restrict key → Select APIs
4. Check: Identity Toolkit API, Cloud Firestore API, Cloud Storage API, Firebase Installations API
5. Save

That's it. Do these 4 steps.

