-- Quick verification script for blog system setup
-- Run this in Supabase SQL Editor to check if everything is set up correctly

-- 1. Check if is_admin column exists
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'users' 
AND column_name = 'is_admin';

-- 2. Check if blog_posts table exists
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public' 
AND table_name = 'blog_posts';

-- 3. Check blog_posts table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'blog_posts'
ORDER BY ordinal_position;

-- 4. Check if indexes exist
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'blog_posts';

-- 5. Check RLS policies
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'blog_posts';

-- 6. List all admin users
SELECT id, full_name, email, phone_number, is_admin
FROM users
WHERE is_admin = TRUE;

-- 7. Count blog posts (if any exist)
SELECT 
    status,
    COUNT(*) as count
FROM blog_posts
GROUP BY status;

