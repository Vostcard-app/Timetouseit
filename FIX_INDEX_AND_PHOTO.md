# Fix: Firestore Index and photoUrl Error

## Issue 1: Firestore Index Missing

**Error:** `The query requires an index`

### Quick Fix:
1. **Click the link in the error message** - it will take you directly to create the index
   
   OR

2. **Go to Firebase Console:**
   - https://console.firebase.google.com/project/tossittime/firestore/indexes
   - Click "Create Index"
   - Collection: `foodItems`
   - Fields:
     - `userId` (Ascending)
     - `expirationDate` (Ascending)  
     - `__name__` (Ascending)
   - Click "Create"
   - Wait 1-2 minutes for the index to build

## Issue 2: photoUrl Undefined Error

**Error:** `Unsupported field value: undefined (found in field photoUrl)`

This is fixed in the code. After deploying, this error will go away.

### If you still see it:
1. Make sure the latest code is deployed to Netlify
2. Clear browser cache
3. Try adding an item again

## After Creating Index:

1. Wait 1-2 minutes for index to build
2. Refresh your app
3. Try adding a food item again
4. Both errors should be resolved

