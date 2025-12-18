# Create Firestore Index

## The Error
```
FirebaseError: [code=failed-precondition]: The query requires an index.
```

## Quick Fix

1. **Click the link in the error message** - it will take you directly to Firebase Console to create the index
   
   OR

2. **Go to Firebase Console manually:**
   - https://console.firebase.google.com/project/tossittime/firestore/indexes
   - Click "Create Index"
   - The fields are already pre-filled from the error:
     - Collection: `foodItems`
     - Fields:
       - `userId` (Ascending)
       - `expirationDate` (Ascending)
       - `__name__` (Ascending)
   - Click "Create"
   - Wait 1-2 minutes for the index to build

## What This Does

This index allows Firestore to efficiently query food items by:
- User ID
- Expiration date
- Sorted by name

After the index is created, the error will go away and your queries will work faster.

