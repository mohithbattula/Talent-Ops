# 🔧 Team Lead Login Issue - Troubleshooting Guide

## Issues Fixed

### 1. ✅ Environment Variables
**Problem:** The `.env` file had spaces after the `=` signs which caused Supabase to use invalid URLs.

**Fixed:** Removed spaces from `.env` file:
```
VITE_SUPABASE_URL=https://ppptzmmecvjuvbulvddh.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. ✅ Added Comprehensive Logging
Enhanced `LoginPage.tsx` with detailed console logging to help diagnose authentication issues.

### 3. ✅ Dev Server Restarted
The development server has been restarted to load the corrected environment variables.

---

## 🧪 Testing Steps

### Step 1: Check Profiles in Database

Open the profile checker tool:
1. Navigate to: `http://localhost:3000/check_profiles.html`
2. This will show you ALL profiles in your Supabase database
3. Look for Team Lead accounts

**What to look for:**
- Users with role = "TeamLead" or "team lead"
- Note their email addresses
- These are the credentials you can use to test

### Step 2: Test Login with Console Open

1. Open your browser to `http://localhost:3000`
2. Press **F12** to open DevTools
3. Go to the **Console** tab
4. Click "Login" and enter team lead credentials
5. Watch the console output

**Expected Console Output (Success):**
```
=== LOGIN ATTEMPT ===
Email: teamlead@example.com
Supabase URL: https://ppptzmmecvjuvbulvddh.supabase.co
Attempting authentication...
✅ Authentication successful
User ID: abc123...
User Email: teamlead@example.com
Fetching user profile from database...
Profile query result: { profile: {...}, profileError: null }
✅ Profile found: {...}
Profile role: TeamLead
Profile full_name: John Doe
Normalized role: teamlead
✅ Redirecting to team lead dashboard
```

**If Authentication Fails:**
```
❌ Authentication failed: { message: "Invalid login credentials" }
```
This means the email/password combination doesn't exist in Supabase Auth.

**If Profile Not Found:**
```
✅ Authentication successful
...
❌ No profile found for user
```
This means the user exists in Auth but not in the `profiles` table.

**If Invalid Role:**
```
✅ Profile found: {...}
Profile role: SomeOtherRole
❌ Invalid role: someotherrole
```
This means the role in the database doesn't match expected values.

---

## 🐛 Common Issues & Solutions

### Issue 1: "Invalid login credentials"

**Cause:** The email/password combination doesn't exist in Supabase Auth.

**Solution:**
1. Open Supabase Dashboard: https://app.supabase.com
2. Go to your project
3. Navigate to: **Authentication** → **Users**
4. Check if the user exists
5. If not, create a new user:
   - Click "Add User"
   - Enter email and password
   - Note the password for testing

### Issue 2: "Your account is not registered in the system"

**Cause:** User exists in Auth but not in the `profiles` table.

**Solution:**
1. Open Supabase Dashboard
2. Go to: **Table Editor** → **profiles**
3. Click "Insert" → "Insert row"
4. Fill in:
   - `id`: Copy from Auth user ID
   - `full_name`: Team Lead Name
   - `email`: teamlead@example.com
   - `role`: TeamLead (or "team lead")
   - `is_teamlead`: true
   - `monthly_leave_quota`: 3

### Issue 3: "Invalid role assigned to your account"

**Cause:** The role value in the database doesn't match expected values.

**Solution:**
1. Open Supabase Dashboard
2. Go to: **Table Editor** → **profiles**
3. Find the user's row
4. Edit the `role` column to one of:
   - `TeamLead` (recommended)
   - `team lead` (also works)
   - `Executive`
   - `Manager`
   - `Employee`

### Issue 4: 400 Errors in Network Tab

**Cause:** The Supabase URL was malformed due to spaces in `.env`.

**Solution:** ✅ Already fixed! The `.env` file has been corrected and server restarted.

### Issue 5: THREE.WebGLRenderer Context Lost

**Cause:** This is a separate issue with the 3D background animation, not related to login.

**Solution:** This is a browser/GPU issue and doesn't affect login functionality. You can ignore it for now.

---

## 📋 Quick Checklist

Before testing, verify:

- [ ] `.env` file has no spaces after `=` signs
- [ ] Dev server has been restarted (✅ Done)
- [ ] Browser console is open (F12)
- [ ] You know a valid team lead email/password
- [ ] The team lead user exists in both Auth AND profiles table
- [ ] The role is set to "TeamLead" or "team lead"

---

## 🎯 Create a Test Team Lead Account

If you don't have a team lead account, here's how to create one:

### Option 1: Using Supabase Dashboard (Recommended)

1. **Create Auth User:**
   - Go to: Authentication → Users → Add User
   - Email: `teamlead@test.com`
   - Password: `Test123!` (remember this!)
   - Click "Create User"
   - Copy the User ID

2. **Create Profile:**
   - Go to: Table Editor → profiles → Insert row
   - `id`: Paste the User ID from step 1
   - `full_name`: Test Team Lead
   - `email`: teamlead@test.com
   - `role`: TeamLead
   - `is_teamlead`: true
   - `monthly_leave_quota`: 3
   - Click "Save"

3. **Test Login:**
   - Email: `teamlead@test.com`
   - Password: `Test123!`

### Option 2: Using SQL

Run this in Supabase SQL Editor:

```sql
-- First, create the auth user manually via Dashboard, then:
-- Replace 'USER_ID_HERE' with the actual UUID from auth.users

INSERT INTO profiles (id, full_name, email, role, is_teamlead, monthly_leave_quota)
VALUES (
    'USER_ID_HERE',
    'Test Team Lead',
    'teamlead@test.com',
    'TeamLead',
    true,
    3
);
```

---

## 📸 What to Share if Still Not Working

If you're still having issues, please share:

1. **Screenshot of check_profiles.html page**
   - Shows what profiles exist in database

2. **Screenshot of browser console during login**
   - Shows the detailed login flow

3. **Screenshot of Network tab**
   - Filter to show Supabase requests
   - Shows any 400/404 errors

4. **Screenshot of Supabase profiles table**
   - Shows the actual data structure

---

## ✅ Success Criteria

You'll know it's working when:

1. ✅ `check_profiles.html` shows team lead accounts
2. ✅ Console shows "✅ Authentication successful"
3. ✅ Console shows "✅ Profile found"
4. ✅ Console shows "✅ Redirecting to team lead dashboard"
5. ✅ You're redirected to `/teamlead-dashboard`
6. ✅ No 400 errors in Network tab

---

## 🔗 Useful Links

- Profile Checker: http://localhost:3000/check_profiles.html
- Main App: http://localhost:3000
- Supabase Dashboard: https://app.supabase.com
- Your Project: https://ppptzmmecvjuvbulvddh.supabase.co

---

## 💡 Next Steps

After confirming login works:

1. Test with all role types (Executive, Manager, Employee)
2. Verify role-based routing works correctly
3. Check that dashboards load properly
4. Test the "Add Employee" functionality
