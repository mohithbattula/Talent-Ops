# How to Deploy the Add Employee Edge Function

## Prerequisites
1. Install Supabase CLI: `npm install -g supabase`
2. Login to Supabase: `supabase login`

## Steps to Deploy

### 1. Initialize Supabase in your project (if not already done)
```bash
supabase init
```

### 2. Create the Edge Function directory structure
```bash
mkdir -p supabase/functions/add-employee
```

### 3. Copy the Edge Function code
Copy the content from `supabase-edge-function-add-employee.ts` to `supabase/functions/add-employee/index.ts`

### 4. Link your Supabase project
```bash
supabase link --project-ref ppptzmmecvjuvbulvddh
```

### 5. Deploy the Edge Function
```bash
supabase functions deploy add-employee
```

### 6. Set the required secrets (if not already set)
The Edge Function needs access to:
- `SUPABASE_URL` (automatically available)
- `SUPABASE_SERVICE_ROLE_KEY` (automatically available)

These are automatically injected by Supabase when you deploy.

## Testing
After deployment, test the function by trying to add an employee through your application's UI.

## Troubleshooting
- If you get a 500 error, check the Edge Function logs in your Supabase dashboard
- Go to: Dashboard > Edge Functions > add-employee > Logs
- Look for any error messages that can help debug the issue

## Alternative: Use Supabase Dashboard
If you prefer not to use the CLI:
1. Go to your Supabase Dashboard
2. Navigate to Edge Functions
3. Click "New Function"
4. Name it "add-employee"
5. Paste the code from `supabase-edge-function-add-employee.ts`
6. Click "Deploy"
