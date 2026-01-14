# Supabase Setup Guide for Profit First App

## Prerequisites
- ✅ Supabase packages installed
- ✅ Database schema created
- ⏳ Supabase project (you need to create this)

## Step-by-Step Setup

### 1. Create Supabase Project

1. Go to https://supabase.com
2. Sign in or create account
3. Click **"New Project"**
4. Fill in:
   - **Name**: profit-first
   - **Database Password**: (create strong password - SAVE IT!)
   - **Region**: Choose closest to Bangladesh (Singapore recommended)
5. Click **"Create new project"**
6. Wait ~2 minutes for setup

### 2. Set Up Database Schema

1. In your Supabase project, go to **SQL Editor** (left sidebar)
2. Click **"New Query"**
3. Copy the entire contents of `supabase/schema.sql`
4. Paste into the SQL editor
5. Click **"Run"** or press `Ctrl+Enter`
6. You should see "Success. No rows returned"

### 3. Get Your Credentials

1. Go to **Project Settings** (gear icon, bottom left)
2. Click **API** in the sidebar
3. Copy these two values:

   **Project URL:**
   ```
   https://xxxxxxxxxxxxx.supabase.co
   ```

   **anon public key:**
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS...
   ```

### 4. Configure Environment Variables

1. In your project root, create `.env.local` file:
   ```bash
   cp .env.local.example .env.local
   ```

2. Edit `.env.local` and add your credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. **IMPORTANT**: Restart your dev server:
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev
   ```

### 5. Enable Authentication

1. In Supabase Dashboard, go to **Authentication** > **Providers**
2. Enable **Email** provider (should be enabled by default)
3. Optional: Enable **Google** or **GitHub** for social login

### 6. Test the Setup

1. Go to http://localhost:3000
2. You should see a login/signup page
3. Create an account with your email
4. Check your email for verification link
5. After verification, you should be logged in!

### 7. Migrate Your Existing Data

Once logged in:

1. Go to **Settings** page
2. Scroll to **Import/Export Data**
3. Click **"Export Data"** to backup current localStorage data
4. The app will automatically sync to Supabase on next login

## Security Notes

- ✅ Row Level Security (RLS) is enabled
- ✅ Users can only see their own data
- ✅ All queries are authenticated
- ✅ Environment variables are not committed to Git

## Troubleshooting

### "Invalid API key" error
- Check that `.env.local` has correct credentials
- Restart dev server after changing `.env.local`

### "Failed to fetch" error
- Check Supabase project URL is correct
- Ensure project is not paused (free tier pauses after inactivity)

### Can't see data after login
- Check browser console for errors
- Verify database schema was created successfully
- Check RLS policies are enabled

## Next Steps

After setup is complete:
1. ✅ Authentication working
2. ✅ Data syncing to Supabase
3. 🔄 Set up GitHub repository
4. 🚀 Deploy to Vercel

Need help? Check the main README or create an issue!
