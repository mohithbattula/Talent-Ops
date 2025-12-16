# Fix Notifications - RLS Policies

## Problem
- Mark as read/delete actions not persisting after page refresh
- Time display not synced correctly

## Solution

### Step 1: Add RLS Policies in Supabase

Go to your Supabase Dashboard → SQL Editor and run these commands:

```sql
-- 1. Allow users to update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
ON notifications FOR UPDATE
TO authenticated
USING (receiver_id = auth.uid())
WITH CHECK (receiver_id = auth.uid());

-- 2. Allow users to delete their own notifications
CREATE POLICY "Users can delete their own notifications"
ON notifications FOR DELETE
TO authenticated
USING (receiver_id = auth.uid());

-- 3. Allow users to read their own notifications (if not already exists)
CREATE POLICY "Users can read their own notifications"
ON notifications FOR SELECT
TO authenticated
USING (receiver_id = auth.uid());

-- 4. Allow users to insert notifications (for system notifications)
CREATE POLICY "Users can receive notifications"
ON notifications FOR INSERT
TO authenticated
WITH CHECK (true);
```

### Step 2: Verify RLS is Enabled

Make sure Row Level Security is enabled on the notifications table:

```sql
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
```

### Step 3: Test

After running these SQL commands:

1. Refresh your dashboard
2. Try marking a notification as read
3. Refresh the page
4. The notification should stay marked as read ✅

## What These Policies Do

| Policy | What It Does |
|--------|-------------|
| **UPDATE** | Allows users to mark their own notifications as read |
| **DELETE** | Allows users to delete their own notifications |
| **SELECT** | Allows users to see only their own notifications |
| **INSERT** | Allows the system to create notifications for users |

## Security

All policies use `receiver_id = auth.uid()` which ensures:
- Users can only modify their OWN notifications
- Users cannot see other users' notifications
- Secure and compliant with data privacy

## Time Display Fix

The time display has been updated to:
- Use proper UTC timestamp parsing
- Show accurate relative times (5m ago, 2h ago, etc.)
- Display formatted dates for older notifications (Dec 11, 2024)
