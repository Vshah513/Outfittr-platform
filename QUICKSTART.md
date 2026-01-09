# Quick Start Guide 🚀

Get your Kenya Thrift Marketplace running in 5 minutes!

## Prerequisites
- Node.js 18+ installed
- Supabase account (free)

## Step 1: Install Dependencies
```bash
npm install
```

## Step 2: Set Up Supabase

### Create Project
1. Go to [supabase.com](https://supabase.com) → New Project
2. Copy your project URL and anon key

### Run Database Setup
1. Open Supabase SQL Editor
2. Copy and run: `supabase/migrations/001_initial_schema.sql`
3. Copy and run: `supabase/migrations/002_functions.sql`

### Create Storage Bucket
1. Go to Storage → New Bucket
2. Name: `product-images`
3. Make it **Public**
4. Run storage policies from `DATABASE_SETUP.md`

## Step 3: Configure Environment

Copy environment template:
```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
JWT_SECRET=any-random-string-for-development
```

## Step 4: Run the App
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Step 5: Test It Out

### Test Authentication
1. Go to `/login`
2. Enter any Kenya number (e.g., +254712345678)
3. Check console for OTP code (in dev mode)
4. Enter the OTP and create account

### Test as Seller
1. After login, go to `/listings/new`
2. Create a product listing with images
3. View your dashboard at `/dashboard`

### Test as Buyer
1. Go to `/marketplace`
2. Browse products and apply filters
3. Click on a product to view details
4. Test messaging feature

## Common Issues

### "Database connection failed"
- Verify Supabase URL and keys in `.env.local`
- Ensure migrations were run successfully

### "Upload failed"
- Check storage bucket is created and public
- Verify storage policies are applied

### "OTP not showing"
- In development, OTP is logged to console
- Check terminal output for the code

## Next Steps

- Read [README.md](README.md) for full documentation
- See [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment
- Review [DATABASE_SETUP.md](DATABASE_SETUP.md) for advanced database config

## Need Help?

Check these files:
- `README.md` - Complete documentation
- `DATABASE_SETUP.md` - Database configuration
- `DEPLOYMENT.md` - Production deployment guide

---

**That's it! You're ready to start developing.** 🎉

Happy coding! 🇰🇪

