# Supabase Authentication & Data Migration Guide

## 🎉 What's New

Your Profit First application now includes:

1. **✅ Supabase Authentication** - Secure user login with email/password and Google OAuth
2. **✅ Cloud Data Storage** - All your data is now stored securely in Supabase
3. **✅ Automatic Data Migration** - Your existing local data will be automatically migrated to the cloud
4. **✅ Multi-device Sync** - Access your data from any device
5. **✅ Row Level Security** - Your data is protected and only accessible to you

---

## 🚀 Getting Started

### For New Users

1. Navigate to `http://localhost:3000`
2. You'll be redirected to the login page
3. Click "Sign up" to create a new account
4. Fill in your details and create an account
5. Start using the application!

### For Existing Users (with local data)

1. Navigate to `http://localhost:3000`
2. You'll be redirected to the login page
3. **Sign up** for a new account (or sign in with Google)
4. **Your existing data will be automatically migrated!** 
   - You'll see a migration progress screen
   - All your accounts, transactions, bank accounts, and profit distributions will be transferred to Supabase
   - This happens only once, automatically

---

## 🔐 Authentication Features

### Email/Password Authentication
- Secure password-based authentication
- Password must be at least 6 characters
- Email verification (if enabled in Supabase)

### Google OAuth
- One-click sign-in with Google
- No need to remember passwords
- Secure and convenient

### Account Management
- View your profile in Settings
- Sign out from any device
- Secure session management

---

## 💾 Data Migration

### What Gets Migrated?

When you first sign up, the following data is automatically migrated from localStorage to Supabase:

1. **Accounts** (Income, Profit, Owner's Comp, Tax/Zakat, OpEx)
   - Account balances
   - Target percentages (TAPS)
   - Current percentages (CAPS)
   - Linked bank accounts

2. **Transactions**
   - All transaction history
   - Allocations to each account
   - Dates and descriptions

3. **Bank Accounts**
   - Bank details
   - Branch information
   - Account numbers (encrypted)
   - Routing and SWIFT codes

4. **Profit Distributions**
   - Distribution history
   - Quarterly records
   - Completion status
   - Notes

5. **Settings**
   - Currency preference

### Migration Process

The migration happens automatically:

1. **First Login**: When you sign up/login for the first time
2. **Check**: System checks if you have local data
3. **Migrate**: If local data exists, it's uploaded to Supabase
4. **Verify**: System verifies the migration was successful
5. **Sync**: Future changes are saved directly to Supabase

### Safety Features

- **No Data Loss**: Your local data remains untouched during migration
- **One-Time Process**: Migration only happens once
- **Automatic Backup**: All data is backed up in Supabase
- **Rollback Safe**: If migration fails, your local data is still intact

---

## 🔄 Data Synchronization

### How It Works

After migration, all your data is:
- **Automatically saved** to Supabase when you make changes
- **Loaded from Supabase** when you log in
- **Synced across devices** - use the app on multiple devices with the same account

### What This Means

- ✅ Access your data from any device
- ✅ Never lose your data (cloud backup)
- ✅ Secure and private (only you can access your data)
- ✅ Fast and reliable

---

## 🛡️ Security & Privacy

### Row Level Security (RLS)

Your data is protected by Supabase's Row Level Security:
- You can only see and modify YOUR data
- Other users cannot access your information
- Even database administrators cannot see your data without proper authorization

### Data Encryption

- All data is encrypted in transit (HTTPS)
- Passwords are hashed and never stored in plain text
- Sensitive information is protected

### Authentication Security

- Secure session management
- Automatic session expiration
- Protected API endpoints

---

## 📱 Using the Application

### Login Page
- **URL**: `http://localhost:3000/auth/login`
- Sign in with email/password or Google
- "Forgot password" link for password reset
- "Sign up" link for new users

### Signup Page
- **URL**: `http://localhost:3000/auth/signup`
- Create account with email/password or Google
- Automatic profile creation
- Immediate data migration if local data exists

### Settings Page
- View your account information
- See your email and name
- Sign out button
- All other settings remain the same

---

## 🔧 Technical Details

### Environment Variables

The following environment variables are configured in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://josjxncyzdaxchgvzelh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Database Schema

The Supabase database includes the following tables:
- `profiles` - User profiles
- `accounts` - Financial accounts
- `bank_accounts` - Bank account details
- `transactions` - Transaction history
- `transaction_allocations` - Transaction-to-account allocations
- `profit_distributions` - Quarterly profit distributions

All tables have Row Level Security (RLS) policies enabled.

### Middleware

The application uses Next.js middleware to:
- Protect routes (redirect to login if not authenticated)
- Manage authentication state
- Handle OAuth callbacks

---

## 🐛 Troubleshooting

### "Migration Failed" Error

If you see a migration error:
1. Check your internet connection
2. Verify Supabase is accessible
3. Try refreshing the page
4. Your local data is still safe - you can try again

### "Not Authenticated" Error

If you're logged out unexpectedly:
1. Your session may have expired
2. Simply log in again
3. Your data is safe in Supabase

### Data Not Showing

If your data doesn't appear after login:
1. Check if you're logged in (Settings page)
2. Refresh the page
3. Check browser console for errors
4. Verify your internet connection

---

## 📊 Next Steps

Now that Supabase is integrated, you can:

1. **✅ Use the application** - Everything works as before, but now with cloud storage
2. **✅ Access from multiple devices** - Sign in from anywhere
3. **✅ Share with team members** - Each person can have their own account
4. **🚀 Deploy to production** - Ready for deployment to Vercel or other platforms
5. **🔗 Set up GitHub** - Version control for your code

---

## 🎯 What Changed?

### For Users
- **Login required** - You now need to sign in to use the app
- **Cloud storage** - Your data is stored in Supabase, not just locally
- **Multi-device** - Access from any device with your account

### For Developers
- **Authentication** - Supabase Auth integration
- **Database** - PostgreSQL database with RLS
- **Middleware** - Route protection
- **Data sync** - Automatic sync between localStorage and Supabase

---

## 📞 Support

If you encounter any issues:
1. Check this guide
2. Review the browser console for errors
3. Check Supabase dashboard for database issues
4. Verify environment variables are set correctly

---

## ✨ Summary

Your Profit First application is now:
- ✅ **Secure** - Protected with authentication
- ✅ **Cloud-based** - Data stored in Supabase
- ✅ **Multi-device** - Access from anywhere
- ✅ **Production-ready** - Ready for deployment

**No action required** - Just sign up/login and start using the app! Your existing data will be automatically migrated.
