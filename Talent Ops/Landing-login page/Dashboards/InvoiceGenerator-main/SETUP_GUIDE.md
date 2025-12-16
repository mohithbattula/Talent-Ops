# 🚀 Quick Setup Guide

## Step 1: Add Your Supabase Credentials

1. Open the `.env` file in the root directory
2. Replace the placeholder values with your actual Supabase credentials:

```env
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
```

**Where to find these:**
- Go to https://app.supabase.com
- Select your project (or create a new one)
- Go to Project Settings → API
- Copy the "Project URL" and "anon public" key

## Step 2: Set Up Your Database

1. Go to your Supabase Dashboard
2. Click on "SQL Editor" in the left sidebar
3. Open the `DATABASE_SETUP.md` file in this project
4. Copy each SQL block and execute them one by one in the SQL Editor
5. Verify that all tables and storage buckets were created successfully

**Important Tables to Verify:**
- ✅ user_profiles
- ✅ clients
- ✅ invoices
- ✅ invoice_items
- ✅ invoice_sequences

**Important Storage Buckets to Verify:**
- ✅ company-logos
- ✅ invoice-pdfs

## Step 3: Restart the App

If the app is already running, stop it (Ctrl+C) and restart:

```bash
npm start
```

## Step 4: Create Your Account

1. Open http://localhost:3000 in your browser
2. Click "Sign Up"
3. Enter your email, password, and full name
4. Choose your role (Manager or Executive)
5. Click "Create Account"
6. Check your email for verification (if required by Supabase settings)

## Step 5: Start Creating Invoices!

1. Fill in your company details
2. Add a client
3. Add invoice items
4. Click "Generate Invoice"
5. Download PDF if needed

## 🎨 Customization Tips

### Change the Invoice Number Prefix

By default, invoices are numbered as `INV-00001`, `INV-00002`, etc.

To change the prefix:
1. Go to Supabase Dashboard → Table Editor
2. Open the `invoice_sequences` table
3. Find your user's row
4. Change the `prefix` column to your desired prefix (e.g., "INVOICE", "BIL", etc.)

### Update Your Company Logo

1. In the invoice form, click "Upload Logo"
2. Select your company logo image
3. It will be automatically saved to Supabase Storage
4. The logo will appear on all future invoices

### Set Default Company Details

Your company details are saved in your user profile:
1. Enter your company information once
2. It will be automatically loaded for all future invoices
3. You can update it anytime in the invoice form

## ⚠️ Common Issues

### Issue: "Missing Supabase environment variables"
**Solution:** Make sure you've updated the `.env` file with your actual credentials and restarted the app.

### Issue: "Failed to create invoice"
**Solution:** Verify that you've run all SQL scripts from `DATABASE_SETUP.md` in your Supabase SQL Editor.

### Issue: Can't upload logo
**Solution:** Check that the `company-logos` storage bucket exists and has the correct RLS policies.

### Issue: Invoice number not auto-generating
**Solution:** Make sure you've created the `get_next_invoice_number` function in Supabase.

## 📞 Need Help?

Check the full `README.md` for detailed documentation and troubleshooting.

## ✅ Checklist

Before using the app, make sure you've completed:

- [ ] Added Supabase credentials to `.env`
- [ ] Created all database tables
- [ ] Created storage buckets
- [ ] Set up RLS policies
- [ ] Created the `get_next_invoice_number` function
- [ ] Restarted the development server
- [ ] Created your user account
- [ ] Tested creating an invoice

---

**You're all set! Enjoy your premium invoice generator! 🎉**
