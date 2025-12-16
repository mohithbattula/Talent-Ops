# Troubleshooting Data Fetching Issues

## Issue: Executive Dashboard showing "0 results"

### Solution Implemented:
Added `useEffect` hook to fetch employees from Supabase `profiles` table when the Executive Dashboard loads.

### What Was Changed:

**File:** `components/executive/pages/ModulePage.jsx`

1. **Added imports:**
   - `useEffect` from React
   - `supabase` client

2. **Added data fetching:**
   - Fetches all profiles with team information
   - Transforms data to match UI expectations
   - Automatically loads when navigating to "Employees" page

### How to Verify It's Working:

1. **Check Browser Console:**
   - Open Developer Tools (F12)
   - Go to Console tab
   - Look for any errors related to Supabase

2. **Check Network Tab:**
   - Open Developer Tools (F12)
   - Go to Network tab
   - Filter by "Fetch/XHR"
   - Look for requests to your Supabase URL
   - Check if they return 200 status

3. **Verify Database:**
   - Go to your Supabase dashboard
   - Check that `profiles` table has data
   - Verify the `teams` table exists and has data
   - Check Row Level Security (RLS) policies

### Common Issues and Fixes:

#### 1. RLS Policies Blocking Access
**Symptom:** Network request returns 200 but data array is empty

**Fix:** Add RLS policy to allow authenticated users to read profiles:
```sql
CREATE POLICY "Allow authenticated users to read profiles"
ON profiles FOR SELECT
TO authenticated
USING (true);
```

#### 2. Missing Team Relationship
**Symptom:** Error in console about "teams" relation

**Fix:** Ensure foreign key relationship exists:
```sql
ALTER TABLE profiles
ADD CONSTRAINT profiles_team_id_fkey
FOREIGN KEY (team_id)
REFERENCES teams(id);
```

#### 3. Environment Variables Not Loaded
**Symptom:** "Cannot read properties of undefined" errors

**Fix:**
1. Restart your dev server: `npm run dev`
2. Verify `.env` file is in project root
3. Check variable names start with `VITE_`

#### 4. CORS Issues
**Symptom:** "CORS policy" errors in console

**Fix:** This shouldn't happen with Supabase, but if it does:
1. Check your Supabase project URL is correct
2. Verify you're using the anon key, not the service role key

### Testing Steps:

1. **Login as Executive:**
   ```
   Email: your_executive_email@example.com
   Password: your_password
   ```

2. **Navigate to Employees:**
   - Click "Employees" in sidebar
   - Should see employee list populated

3. **Check Console:**
   - Should see no errors
   - May see logs from the fetch operation

4. **Add New Employee:**
   - Click "Add Employee" button
   - Fill in form
   - Submit
   - List should refresh with new employee

### Debug Commands:

Run these in browser console to test Supabase connection:

```javascript
// Test 1: Check if supabase client exists
console.log('Supabase client:', window.supabase);

// Test 2: Fetch profiles directly
const { data, error } = await supabase.from('profiles').select('*');
console.log('Profiles:', data, 'Error:', error);

// Test 3: Check current user
const { data: { user } } = await supabase.auth.getUser();
console.log('Current user:', user);
```

### Expected Data Structure:

The query fetches:
```javascript
{
  id: "uuid",
  full_name: "John Doe",
  email: "john@example.com",
  role: "employee",
  team_id: "uuid",
  created_at: "2024-01-01T00:00:00Z",
  teams: {
    name: "Engineering"
  }
}
```

Transformed to:
```javascript
{
  id: "uuid",
  name: "John Doe",
  email: "john@example.com",
  role: "employee",
  dept: "Engineering",
  status: "Active",
  joinDate: "1/1/2024",
  performance: "N/A",
  projects: 0,
  tasksCompleted: 0
}
```

### Still Not Working?

1. **Check Supabase Dashboard:**
   - Go to Table Editor
   - Verify `profiles` table has rows
   - Check data types match expected format

2. **Check Authentication:**
   - Ensure you're logged in
   - Check session is valid: `supabase.auth.getSession()`

3. **Enable Supabase Logging:**
   Add this to `lib/supabaseClient.ts`:
   ```typescript
   export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
     auth: {
       persistSession: true,
       autoRefreshToken: true,
     },
     global: {
       headers: {
         'x-my-custom-header': 'debug-mode',
       },
     },
   })
   ```

4. **Contact Support:**
   - Provide browser console screenshot
   - Provide network tab screenshot
   - Share any error messages
