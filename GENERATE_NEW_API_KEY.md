# Generate New API Key - Step by Step

## Step 1: Create New API Key in Google Cloud Console

1. Go to: https://console.cloud.google.com/apis/credentials?project=tossittime
2. Click the **"+ CREATE CREDENTIALS"** button at the top
3. Select **"API key"**
4. A new API key will be created and displayed
5. **COPY THE NEW KEY IMMEDIATELY** (you won't see it again)
6. Click **"Restrict key"** (don't close the dialog yet)

## Step 2: Configure the New API Key

### Application Restrictions:
1. Under "Application restrictions", select **"Websites"**
2. Click **"Add an item"** and add:
   - `http://localhost`
   - `http://127.0.0.1`
   - `https://*.netlify.app/*`
   - `https://tossittime.netlify.app/*`
3. Click **"Done"**

### API Restrictions:
1. Under "API restrictions", select **"Restrict key"**
2. Click **"Select APIs"**
3. Check these 4 APIs:
   - ✅ **Identity Toolkit API**
   - ✅ **Cloud Firestore API**
   - ✅ **Cloud Storage API**
   - ✅ **Firebase Installations API**
4. Click **"Done"**

### Save:
1. Click **"Save"** at the bottom
2. Wait 1-2 minutes for changes to propagate

## Step 3: Update Your .env File

Replace the old API key with the new one in your `.env` file.

## Step 4: Update Netlify (if deploying)

Update the `VITE_FIREBASE_API_KEY` environment variable in Netlify with the new key.

## Step 5: Test

Restart dev server and test in incognito mode.

