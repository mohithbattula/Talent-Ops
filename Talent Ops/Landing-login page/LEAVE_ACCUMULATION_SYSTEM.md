# Leave Accumulation System Documentation

## Overview
This system manages employee leave balances with monthly accumulation.

## How It Works

### Initial Setup (First Month)
When a new employee is added:
- `monthly_leave_quota`: Set to the specified value (default: 3)
- `leaves_remaining`: Automatically set to equal `monthly_leave_quota` via database trigger
- `leaves_taken_this_month`: Set to 0

**Example:**
- Employee joins with `monthly_leave_quota = 3`
- Initial `leaves_remaining = 3`

### Monthly Accumulation
Every month, the system:
1. **Adds** `monthly_leave_quota` to `leaves_remaining`
2. **Resets** `leaves_taken_this_month` to 0

**Example:**
- Month 1: Employee has 3 leaves, uses 1 → `leaves_remaining = 2`
- Month 2: System adds 3 → `leaves_remaining = 5` (2 + 3)
- Month 3: Employee uses 0 → System adds 3 → `leaves_remaining = 8` (5 + 3)

### Leave Usage
When an employee takes leave:
- `leaves_remaining` decreases
- `leaves_taken_this_month` increases

## Setup Instructions

### 1. Run the SQL Setup Script
Execute `setup-leave-accumulation.sql` in your Supabase SQL Editor:
1. Go to Supabase Dashboard → SQL Editor
2. Copy the contents of `setup-leave-accumulation.sql`
3. Click "Run"

This will:
- Create a trigger to auto-set `leaves_remaining` on new employee creation
- Create a function to accumulate leaves monthly
- Optionally set up a cron job for automatic monthly accumulation

### 2. Deploy the Edge Function
Follow the instructions in `DEPLOY_EDGE_FUNCTION.md` to deploy the updated Edge Function.

### 3. Set Up Monthly Automation (Optional)
To automatically accumulate leaves every month:

**Option A: Using Supabase Cron (Recommended)**
Uncomment the cron schedule in `setup-leave-accumulation.sql` (lines 42-46)

**Option B: Manual Execution**
Run this SQL query on the 1st of each month:
```sql
SELECT accumulate_monthly_leaves();
```

**Option C: External Cron Job**
Set up a cron job on your server to call a Supabase Edge Function monthly.

## Database Schema

### profiles table (relevant columns)
```
- monthly_leave_quota (int4): Number of leaves granted per month
- leaves_remaining (int4): Total accumulated leaves available
- leaves_taken_this_month (int4): Leaves used in current month
```

## Testing

### Test Initial Employee Creation
```sql
-- Check a newly created employee
SELECT full_name, monthly_leave_quota, leaves_remaining, leaves_taken_this_month
FROM profiles
WHERE email = 'newemployee@example.com';

-- Expected: leaves_remaining should equal monthly_leave_quota
```

### Test Monthly Accumulation
```sql
-- Before running accumulation
SELECT full_name, leaves_remaining FROM profiles WHERE email = 'test@example.com';
-- Note the value

-- Run accumulation
SELECT accumulate_monthly_leaves();

-- After running accumulation
SELECT full_name, leaves_remaining FROM profiles WHERE email = 'test@example.com';
-- Expected: leaves_remaining increased by monthly_leave_quota
```

## Troubleshooting

### Issue: New employees have NULL leaves_remaining
**Solution**: Ensure the trigger is created by running `setup-leave-accumulation.sql`

### Issue: Leaves not accumulating monthly
**Solution**: 
1. Check if the cron job is set up: `SELECT * FROM cron.job;`
2. Manually run: `SELECT accumulate_monthly_leaves();`

### Issue: "cannot insert a non-DEFAULT value" error
**Solution**: The Edge Function has been updated to not explicitly set `leaves_remaining`, allowing the trigger to handle it.

## Future Enhancements
- Add maximum leave accumulation cap
- Add leave expiry (e.g., unused leaves expire after 12 months)
- Add different leave types (sick, casual, etc.)
- Add leave approval workflow integration
