# Blog System Setup Guide - Step by Step

Follow these steps to get your blog system working:

## Step 1: Run the Database Migration

1. **Go to your Supabase Dashboard**
   - Open [supabase.com](https://supabase.com)
   - Select your project

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New query"

3. **Copy and Run the Migration**
   - Open the file: `supabase/migrations/016_add_blog_system.sql`
   - Copy ALL the content from that file
   - Paste it into the SQL Editor
   - Click "Run" (or press Ctrl/Cmd + Enter)

4. **Verify it worked**
   - You should see "Success. No rows returned"
   - If you see errors, check that you copied the entire file

## Step 2: Make Yourself Admin

1. **Still in SQL Editor**, run this query:

```sql
-- Replace 'your-email@example.com' with YOUR actual email address
UPDATE users 
SET is_admin = TRUE 
WHERE email = 'your-email@example.com';
```

**OR if you don't know your email, find your user first:**

```sql
-- First, find your user ID
SELECT id, email, full_name, phone_number 
FROM users 
WHERE email = 'your-email@example.com';
-- OR
SELECT id, email, full_name, phone_number 
FROM users 
WHERE phone_number = '+254712345678'; -- Your phone number
```

Then update using the ID:

```sql
-- Replace 'your-user-id-here' with the ID from above
UPDATE users 
SET is_admin = TRUE 
WHERE id = 'your-user-id-here';
```

2. **Verify you're admin:**
```sql
SELECT id, full_name, email, is_admin 
FROM users 
WHERE is_admin = TRUE;
```

You should see your user listed.

## Step 3: Restart Your Development Server

1. **Stop your current server** (if running)
   - Press `Ctrl + C` in the terminal where `npm run dev` is running

2. **Start it again:**
```bash
npm run dev
```

3. **Wait for it to start** - you should see "Ready" message

## Step 4: Access the Blog Admin Panel

1. **Log in to your account** (if not already logged in)
   - Go to http://localhost:3000
   - Click "Sign in" and log in with your admin account

2. **Open Profile Dropdown**
   - Click your profile icon (top right)
   - You should now see a "Blog Admin" link at the bottom

3. **Click "Blog Admin"**
   - This will take you to `/blog/admin`
   - You should see the blog management interface

## Step 5: Create Your First Blog Post

1. **Click "Create New Post"** button

2. **Fill in the form:**
   - **Title**: "Welcome to Outfittr Blog" (or whatever you want)
   - **Excerpt**: A short description (optional)
   - **Content**: Your blog post content (can be multiple paragraphs)
   - **Featured Image URL**: (optional) A URL to an image
   - **Status**: Select "Published" to make it visible
   - **SEO Settings**:
     - **Meta Title**: (optional, uses title if empty)
     - **Meta Description**: (optional, uses excerpt if empty)
     - **Keywords**: Comma-separated, e.g., "secondhand fashion, kenya, thrift, vintage"

3. **Click "Save Post"**

4. **View your post:**
   - Go to http://localhost:3000/blog
   - You should see your published post!

## Troubleshooting

### "Blog Admin" link doesn't appear
- Make sure you ran Step 2 and set `is_admin = TRUE`
- Log out and log back in
- Check the browser console for errors

### Can't access `/blog/admin`
- Make sure you're logged in
- Check that `is_admin = TRUE` in the database
- Try refreshing the page

### Blog page shows "No blog posts yet"
- Make sure you created a post with status "Published"
- Check that `published_at` is set (it's set automatically when you publish)

### Database errors
- Make sure you ran the migration (Step 1)
- Check that all tables were created:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'blog_posts';
```

## Next Steps

Once everything is working:
1. Create more blog posts to improve SEO
2. Use relevant keywords for each post
3. Add featured images to make posts more engaging
4. Share your blog posts on social media

## Need Help?

If you're stuck:
1. Check the browser console (F12) for errors
2. Check your terminal for server errors
3. Verify all steps were completed correctly

