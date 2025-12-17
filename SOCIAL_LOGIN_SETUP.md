# Social Login Setup (Google & Facebook)

## Overview

To add Google and Facebook sign-in to TossItTime, you need to:

1. **Enable providers in Firebase Console** (5 minutes)
2. **Configure OAuth credentials** (10-15 minutes)
3. **Update the Login component** (already done in code)
4. **Test the implementation**

---

## Step 1: Enable Google Sign-In in Firebase

### 1.1 Enable Google Provider

1. Go to: https://console.firebase.google.com/project/tossittime/authentication/providers
2. Click **"Google"** in the providers list
3. Toggle **"Enable"** to ON
4. Enter a **Project support email** (your email)
5. Click **"Save"**

**That's it for Google!** Firebase automatically handles the OAuth setup.

### 1.2 Get Google OAuth Client ID (for reference)

The OAuth client ID is automatically created. You can find it at:
- Firebase Console → Project Settings → General → Your apps → Web app
- Or: https://console.cloud.google.com/apis/credentials?project=tossittime

---

## Step 2: Enable Facebook Sign-In in Firebase

### 2.1 Create Facebook App

1. Go to: https://developers.facebook.com/apps/
2. Click **"Create App"**
3. Select **"Consumer"** as the app type
4. Fill in:
   - **App Name**: `TossItTime` (or your preferred name)
   - **App Contact Email**: Your email
5. Click **"Create App"**

### 2.2 Add Facebook Login Product

1. In your Facebook App dashboard, find **"Add Products"** or go to **"Products"** in the left sidebar
2. Find **"Facebook Login"** and click **"Set Up"**
3. Select **"Web"** as the platform
4. Enter your site URL:
   - **Site URL**: `https://your-netlify-site.netlify.app` (or your domain)
   - For local testing: `http://localhost:5174`

### 2.3 Get Facebook App Credentials

1. Go to **Settings** → **Basic** in your Facebook App
2. Copy these values:
   - **App ID**
   - **App Secret** (click "Show" to reveal it)

### 2.4 Configure Facebook OAuth Redirect URIs

1. In Facebook App → **Settings** → **Basic**
2. Scroll to **"Add Platform"** → Click **"Website"**
3. Add **Authorized Redirect URIs**:
   ```
   https://tossittime.firebaseapp.com/__/auth/handler
   https://your-netlify-site.netlify.app/__/auth/handler
   http://localhost:5174/__/auth/handler (for local dev)
   ```

### 2.5 Enable Facebook Provider in Firebase

1. Go to: https://console.firebase.google.com/project/tossittime/authentication/providers
2. Click **"Facebook"** in the providers list
3. Toggle **"Enable"** to ON
4. Paste your **App ID** and **App Secret** from Step 2.3
5. Click **"Save"**

---

## Step 3: Authorized Domains

Make sure your domains are authorized in Firebase:

1. Go to: https://console.firebase.google.com/project/tossittime/authentication/settings
2. Scroll to **"Authorized domains"**
3. Add your domains:
   - `localhost` (already there for dev)
   - `your-netlify-site.netlify.app`
   - Your custom domain (if you have one)

---

## Step 4: Update Login Component

The code has been updated to include Google and Facebook sign-in buttons. The implementation uses Firebase's `signInWithPopup` method.

---

## Testing

### Local Testing

1. Start the dev server: `npm run dev`
2. Go to: http://localhost:5174
3. Click **"Sign in with Google"** or **"Sign in with Facebook"**
4. Complete the OAuth flow
5. You should be redirected to the dashboard

### Production Testing

1. Deploy to Netlify
2. Make sure your Netlify domain is in Firebase authorized domains
3. Test Google and Facebook sign-in on the live site

---

## Troubleshooting

### "auth/unauthorized-domain" error
- Add your domain to Firebase authorized domains (Step 3)

### Facebook "Invalid OAuth Redirect URI"
- Make sure the redirect URI in Facebook App matches exactly:
  - `https://tossittime.firebaseapp.com/__/auth/handler`

### Google sign-in not working
- Make sure Google provider is enabled in Firebase
- Check that your domain is authorized

### Facebook sign-in not working
- Verify App ID and App Secret are correct in Firebase
- Check that Facebook Login product is set up
- Verify redirect URIs are configured correctly

---

## Security Notes

- **Never commit** App Secrets or OAuth credentials to git
- Facebook App Secret is stored securely in Firebase (not in your code)
- Google OAuth is handled automatically by Firebase
- All authentication happens through Firebase, keeping your app secure

