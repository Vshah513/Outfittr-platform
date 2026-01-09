# Database Setup Guide

## Prerequisites
1. Create a Supabase account at [https://supabase.com](https://supabase.com)
2. Create a new project

## Setup Steps

### 1. Run the Database Migration

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** (left sidebar)
3. Open the file `supabase/migrations/001_initial_schema.sql`
4. Copy the entire content
5. Paste it into the SQL Editor
6. Click **Run** to execute the migration

### 2. Set Up Storage Bucket

1. Navigate to **Storage** in your Supabase dashboard
2. Click **Create a new bucket**
3. Name it `product-images`
4. Make it **Public**
5. Click **Create bucket**

#### Configure Storage Policies

In the Storage section, go to **Policies** for the `product-images` bucket:

1. **Add policy for SELECT** (Anyone can view images):
```sql
CREATE POLICY "Public can view product images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');
```

2. **Add policy for INSERT** (Authenticated users can upload):
```sql
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');
```

3. **Add policy for DELETE** (Users can delete their own images):
```sql
CREATE POLICY "Users can delete their own images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-images' AND auth.uid()::text = owner);
```

### 3. Get Your Credentials

1. Go to **Project Settings** → **API**
2. Copy the following values:
   - **Project URL** (This is your NEXT_PUBLIC_SUPABASE_URL)
   - **anon/public key** (This is your NEXT_PUBLIC_SUPABASE_ANON_KEY)
   - **service_role key** (This is your SUPABASE_SERVICE_ROLE_KEY - KEEP SECRET!)

### 4. Update Environment Variables

Create a `.env.local` file in the project root (already exists) and add your credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 5. Enable Authentication

1. In Supabase dashboard, go to **Authentication** → **Providers**
2. Enable **Phone** authentication
3. Configure your SMS provider (Africa's Talking or Twilio)
   - For Africa's Talking integration, you'll need to set up a webhook
   - For MVP, you can use Supabase's built-in SMS (limited free tier)

## Database Schema Overview

### Tables Created:
- **users** - User profiles with phone authentication
- **products** - Product listings from sellers
- **messages** - Real-time messaging between users
- **reviews** - Seller ratings and reviews

### Views Created:
- **products_with_seller** - Products joined with seller information

### Security:
- Row Level Security (RLS) enabled on all tables
- Users can only modify their own data
- Public can view active products and reviews

## Testing the Setup

Run this SQL query to verify everything is set up:

```sql
SELECT 
    tablename 
FROM 
    pg_tables 
WHERE 
    schemaname = 'public' 
    AND tablename IN ('users', 'products', 'messages', 'reviews');
```

You should see all 4 tables listed.

## Next Steps

After completing the database setup:
1. Start the development server: `npm run dev`
2. The app will be available at `http://localhost:3000`
3. Test authentication with a Kenya phone number (+254...)

