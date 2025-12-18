# Add Required APIs to Your API Key

## The Problem
Your API key has 20 APIs enabled, but it's missing the critical ones needed for authentication:
- ❌ Identity Toolkit API (MISSING - REQUIRED)
- ❌ Cloud Firestore API (MISSING - REQUIRED)
- ❌ Cloud Storage API (MISSING - REQUIRED for Firebase Storage)
- ❌ Firebase Installations API (MISSING - REQUIRED)

## How to Add Them

1. **In the API restrictions section**, click **"Select APIs"** button (or the edit/pencil icon)

2. **In the API selection dialog**, search for and check these APIs:
   - Search for: **"Identity Toolkit API"** → Check it ✅
   - Search for: **"Cloud Firestore API"** → Check it ✅
   - Search for: **"Cloud Storage API"** → Check it ✅ (This is for Firebase Storage)
   - Search for: **"Firebase Installations API"** → Check it ✅

3. **Keep your existing 20 APIs** - just add these 4 new ones

4. **Click "Save"** or "Done"

5. **Wait 1-2 minutes** for the changes to propagate

## Quick Search Tips

When searching in the API selection dialog:
- Type **"Identity Toolkit"** to find Identity Toolkit API
- Type **"Firestore"** to find Cloud Firestore API
- Type **"Cloud Storage"** to find Cloud Storage API (NOT "Firebase Storage")
- Type **"Installations"** to find Firebase Installations API

## After Adding

1. Your API key should now have **24 APIs** (20 existing + 4 new)
2. Restart your dev server: `npm run dev`
3. Test the login functionality
4. The "API key not valid" error should be gone!

