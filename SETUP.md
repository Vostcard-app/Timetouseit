# TossItTime Setup Guide

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up Firebase:**
   - Create a Firebase project at https://console.firebase.google.com/
   - Enable Authentication (Email/Password)
   - Create a Firestore database
   - Enable Storage
   - Copy your Firebase config values

3. **Create `.env` file:**
   ```env
   VITE_FIREBASE_API_KEY=your_api_key_here
   VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

4. **Set up Firestore Security Rules:**
   Go to Firestore Database > Rules and paste:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /foodItems/{itemId} {
         allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
         allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
       }
       match /userSettings/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```

5. **Set up Storage Security Rules:**
   Go to Storage > Rules and paste:
   ```javascript
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /foodItems/{userId}/{allPaths=**} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```

6. **Create Firestore Index:**
   - Go to Firestore Database > Indexes
   - Create a composite index on `foodItems` collection:
     - Fields: `userId` (Ascending), `expirationDate` (Ascending)
     - Collection: `foodItems`

7. **Run the app:**
   ```bash
   npm run dev
   ```

## PWA Icons

You'll need to create app icons and place them in `public/icons/`:
- `icon-192.png` (192x192)
- `icon-512.png` (512x512)
- `icon-192-maskable.png` (192x192, maskable)
- `icon-512-maskable.png` (512x512, maskable)

You can use a tool like [PWA Asset Generator](https://github.com/elegantapp/pwa-asset-generator) to generate these.

## Deployment

### Netlify
1. Connect your repository
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Add environment variables in Netlify dashboard
5. Deploy!

### Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
npm run build
firebase deploy
```

## Features

✅ User authentication (Email/Password)
✅ Add food items manually or via barcode scan
✅ Track expiration dates with visual status indicators
✅ Browser notifications for expiring items
✅ Photo upload support
✅ Responsive mobile-first design
✅ PWA with offline support
✅ Real-time data sync with Firestore

