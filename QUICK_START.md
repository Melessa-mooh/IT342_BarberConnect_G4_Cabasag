# Quick Start Guide - BarberConnect

## 🚀 Start the Application

### 1. Start Backend (Required First!)

**Option A - Fresh Restart (Recommended after code changes):**
```bash
cd backend
./restart-backend.bat
```
This will:
- Stop any running backend processes
- Clean and rebuild the project
- Start with proper Java module configuration

**Option B - Quick Start (if already built):**
```bash
cd backend
./run-backend.bat
```

Wait for this message:
```
Started BarberconnectBackendApplication in X.XXX seconds
```

### 2. Start Frontend
```bash
cd web/barberconnect-frontend
npm run dev
```

Open browser to: `http://localhost:5173`

## ✅ Verify Everything Works

### Backend Health Check
Open: `http://localhost:8080/api/v1/auth/me`

Should NOT show:
- ❌ Connection refused
- ❌ 400 Bad Request
- ❌ Java module errors

### Frontend Check
1. Login to the application
2. Go to Barber Dashboard
3. Check browser console (F12) - should have NO red errors

## 🧪 Test the Fixes

### Test 1: Calendar Navigation
1. Click **Schedule** tab
2. Click `<` button → Month should change
3. Click `>` button → Month should change
4. Click any date → Should highlight

### Test 2: Create Post
1. Click **Social Feed** tab
2. Click **Create Post**
3. Type some text
4. Click **Post**
5. Should see success message
6. Post appears in feed

### Test 3: Profile Update ⭐ FIXED
1. Click **Profile** tab
2. Update any field (phone, bio, experience, GCash)
3. Click **Save Profile**
4. Should see "Profile Saved!" message
5. Refresh page - changes should persist

## ❌ If Something Doesn't Work

### Backend Won't Start
```bash
# Use the restart script - it handles everything
cd backend
./restart-backend.bat
```

### Profile Update Still Fails
1. Make sure you used `restart-backend.bat` (not just `run-backend.bat`)
2. Check backend console for errors
3. Look for "Successfully updated barber profile" message
4. Check browser console (F12) for error details

### Frontend Shows Errors
1. Make sure backend is running first
2. Hard refresh: `Ctrl + Shift + R`
3. Check browser console for specific errors

### Still Having Issues?
Read the detailed guides:
- `FIXES_SUMMARY.md` - Complete list of all fixes
- `backend/BACKEND_FIX_README.md` - Backend-specific troubleshooting

## 📝 What Was Fixed (Latest Update)

✅ Calendar navigation now works (< > buttons)
✅ Posts save to database
✅ **Profile updates save successfully** ⭐ NEW FIX
✅ Java module errors resolved
✅ Changed LocalDateTime to Timestamp (Firebase-compatible)
✅ UI matches design mockup
✅ Proper error handling and feedback

## 🎨 UI Improvements

- Warm beige/cream calendar theme
- Better spacing throughout
- Professional button styles
- Single-column time slots
- Fixed-width calendar
- Consistent brown color scheme

## 🔧 Technical Details

**Latest Fix - Profile Update**:
- Changed `BarberProfile.updatedAt` from `LocalDateTime` to `Timestamp`
- This avoids Java module serialization issues with Firebase
- Now uses Firebase-native `com.google.cloud.Timestamp`

**Java Module Configuration**:
- Opens java.time modules for Firebase
- Opens java.lang modules for Jackson
- Fixes serialization issues

**State Management Added**:
- Calendar month/year tracking
- Date selection
- Proper form validation

**Error Handling Improved**:
- Console logging for debugging
- User-friendly error messages
- Success feedback alerts

---

**Need Help?** Check the detailed documentation in `FIXES_SUMMARY.md`
