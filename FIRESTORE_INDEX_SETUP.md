# Firestore Index Setup

## Problem
The Firestore query requires a composite index for the `foodItems` collection that combines:
- `userId` (where clause)
- `expirationDate` (orderBy clause)

## Solution

### Option 1: Deploy via Firebase CLI (Recommended)

1. Install Firebase CLI if you haven't already:
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Initialize Firebase in your project (if not already done):
   ```bash
   firebase init firestore
   ```
   - Select your project: `tossittime`
   - Use existing `firestore.indexes.json` file

4. Deploy the index:
   ```bash
   firebase deploy --only firestore:indexes
   ```

5. Wait for the index to build (usually takes a few minutes). You can check the status in Firebase Console.

### Option 2: Create Index via Firebase Console

1. Click the link provided in the error message, OR
2. Navigate to: [Firebase Console → Firestore → Indexes](https://console.firebase.google.com/project/tossittime/firestore/indexes)
3. Click "Create Index"
4. The index configuration should be:
   - Collection ID: `foodItems`
   - Fields:
     - `userId` (Ascending)
     - `expirationDate` (Ascending)
5. Click "Create" and wait for the index to build

### Verification

After the index is created and built, the error should disappear. The index typically takes 2-5 minutes to build.

## Note

The `firestore.indexes.json` file has been created in the project root. This file defines the required index and can be deployed via Firebase CLI or used as a reference for manual creation in the console.

