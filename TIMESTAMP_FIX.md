# Timestamp Deserialization Fix

## Problem
Existing Firebase data has `barberProfile.updatedAt` stored as a HashMap (from old LocalDateTime format), causing deserialization errors:
```
Could not deserialize object. Failed to convert value of type java.util.HashMap to Timestamp
```

## Solution Applied

### 1. Changed BarberProfile to Use java.util.Date
- Changed from `LocalDateTime` → `Date`
- Added `@JsonIgnoreProperties(ignoreUnknown = true)` to ignore unknown fields
- This is compatible with both old and new data formats

### 2. Added Auto-Fix Mechanism
The backend now automatically fixes corrupted timestamp data when it encounters it:
- When loading barbers, if deserialization fails, it attempts to fix the timestamps
- Converts HashMap timestamps to proper Date objects
- Logs the fix for monitoring

### 3. Profile Updates Now Use Date
All new profile updates will use `java.util.Date` which is:
- Compatible with Firebase
- Doesn't require Java module opens
- Works with existing data

## How to Apply the Fix

### Step 1: Restart Backend
```bash
cd backend
./restart-backend.bat
```

This will:
1. Clean and rebuild with the new code
2. Start the backend with proper configuration

### Step 2: Trigger Auto-Fix
The auto-fix runs automatically when:
1. Loading the list of available barbers
2. Any barber profile with corrupted timestamps is accessed

To manually trigger it:
1. Go to the customer booking page (loads all barbers)
2. Or access: `http://localhost:8080/api/v1/barbers`

### Step 3: Verify Fix
Check backend logs for messages like:
```
Fixed timestamps for barber: <user_id>
```

## Testing

### Test 1: View Barbers List
1. Go to customer dashboard
2. Click "Book Appointment"
3. Should see list of available barbers
4. No errors in console

### Test 2: Update Profile
1. Login as barber
2. Go to Profile tab
3. Update any field
4. Click "Save Profile"
5. Should see success message
6. Refresh - changes should persist

### Test 3: Check Backend Logs
Look for:
- ✅ "Successfully updated barber profile for user: X"
- ✅ "Fixed timestamps for barber: X"
- ❌ No "Failed to deserialize" errors

## What Changed

### Files Modified:
1. `backend/src/main/java/edu/cit/cabasag/barberconnect/feature/barber/BarberProfile.java`
   - Changed `Timestamp` to `Date`
   - Added `@JsonIgnoreProperties`

2. `backend/src/main/java/edu/cit/cabasag/barberconnect/service/BarberService.java`
   - Updated `updateProfile()` to use `Date`
   - Added `fixBarberProfileTimestamps()` helper method
   - Added error handling in `getAllAvailableBarbers()`

### Why This Works:
- `java.util.Date` is a standard Java class that Firebase handles natively
- No Java module access issues
- Compatible with existing Firebase data
- Auto-fixes corrupted data on access

## Troubleshooting

### Still Seeing Deserialization Errors?
1. Make sure you restarted the backend with `restart-backend.bat`
2. Check that the code was recompiled (look for "BUILD SUCCESS")
3. Clear any cached data in your browser
4. Check backend logs for specific error messages

### Barbers Still Not Showing?
1. Check backend logs for "Failed to deserialize" warnings
2. Look for "Fixed timestamps" success messages
3. Try accessing the barbers endpoint directly: `http://localhost:8080/api/v1/barbers`
4. Check Firebase console to see the actual data structure

### Profile Update Still Fails?
1. Check that `updatedAt` is now a Date object (not HashMap)
2. Look for "Successfully updated barber profile" in logs
3. Verify the user has a barber profile initialized
4. Check browser console for detailed error messages

## Manual Fix (If Auto-Fix Doesn't Work)

If the auto-fix doesn't work, you can manually update Firebase data:

### Option 1: Through Firebase Console
1. Go to Firebase Console → Firestore
2. Find the `users` collection
3. For each barber user:
   - Navigate to `barberProfile.updatedAt`
   - Delete the field if it's a map/object
   - Add new field: `updatedAt` = timestamp (current time)
   - Do the same for `createdAt`

### Option 2: Update Through Profile
1. Login as each barber
2. Go to Profile tab
3. Make any small change
4. Click "Save Profile"
5. This will overwrite with correct Date format

## Prevention

Going forward, all timestamp fields use `java.util.Date`:
- ✅ No LocalDateTime
- ✅ No Timestamp
- ✅ No custom date objects
- ✅ Just plain old `java.util.Date`

This ensures:
- Firebase compatibility
- No Java module issues
- No serialization problems
- Works with existing data

## Success Indicators

You'll know it's fixed when:
1. ✅ Barbers list loads without errors
2. ✅ Profile updates save successfully
3. ✅ No "HashMap to Timestamp" errors in logs
4. ✅ Backend logs show "Fixed timestamps" messages
5. ✅ Browser console has no red errors

---

**Last Updated**: After implementing Date-based timestamps and auto-fix mechanism
