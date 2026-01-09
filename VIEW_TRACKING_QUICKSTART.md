# 🚀 Quick Start - View Tracking Setup

## What You Need To Do

### ✅ Step 1: Run the Database Migration

The most important step! You need to run the new migration file in your Supabase database.

**📍 Go to Supabase Dashboard:**
1. Open [https://supabase.com](https://supabase.com)
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Click **+ New query**

**📄 Copy & Run the Migration:**
1. Open this file on your computer:
   ```
   supabase/migrations/009_unique_product_views.sql
   ```
2. Copy the ENTIRE contents
3. Paste into the Supabase SQL Editor
4. Click **Run** (or press Cmd/Ctrl + Enter)
5. You should see: "Success. No rows returned"

---

### ✅ Step 2: Restart Your Dev Server

Your dev server is already running, but you should restart it to ensure all changes are loaded:

1. Go to your terminal where `npm run dev` is running
2. Press `Ctrl + C` to stop it
3. Run `npm run dev` again

---

### ✅ Step 3: Test It Out

**Test Scenario 1: First View (Should Count)**
1. Open any product page (e.g., `http://localhost:3000/product/[some-id]`)
2. Note the view count
3. Check your browser console - should see no errors
4. Open the Seller Dashboard and check "Total Views" increased

**Test Scenario 2: Refresh (Should NOT Count)**
1. Refresh the same product page multiple times
2. View count should stay the same
3. Your view was already recorded!

**Test Scenario 3: Different User (Should Count)**
1. Open the same product in an **Incognito/Private window**
2. View count should increase by 1
3. Refresh in incognito - should NOT increase again

**Test Scenario 4: Seller Viewing Own Product (Should NOT Count)**
1. Login as the seller who created a product
2. View your own product page
3. View count should NOT increase

---

## ✨ What Changed

### Before:
❌ View count increased every time ANYONE viewed the page  
❌ Refresh the page 100 times = 100 views  
❌ No way to track unique viewers

### After:
✅ Each user counts as only 1 view  
✅ Refresh 100 times = still 1 view  
✅ Different users each add 1 view  
✅ Sellers viewing own products don't count  
✅ Works for both logged-in and anonymous users

---

## 🔍 How to Verify It's Working

### Check 1: Database Migration
Run this in Supabase SQL Editor:
```sql
SELECT COUNT(*) FROM product_views;
```
Should return 0 initially (or number of existing views after testing)

### Check 2: Function Exists
```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'record_product_view';
```
Should return: `record_product_view`

### Check 3: View a Product
1. Open browser DevTools (F12)
2. Go to Network tab
3. View any product page
4. Look for a request to `/api/products/[id]/view` with method POST
5. Should return: `{"success":true,"viewRecorded":true,"viewCount":X}`

### Check 4: Refresh & Check Again
1. Refresh the product page
2. Check the same network request
3. Should return: `{"success":true,"viewRecorded":false,"viewCount":X}`
4. Notice `viewRecorded` is now `false` (duplicate view ignored)

---

## 📊 Where to See View Counts

### Dashboard:
- Go to `/dashboard`
- Look at the "Total Views" stat card
- This shows sum of all views across all your products

### Individual Listings:
- Go to `/dashboard`
- Scroll to "Your Listings"
- Each listing shows its own view count

### Product Page:
- Currently not displayed to buyers
- You could add it if you want (e.g., "142 views")

---

## 🆘 Troubleshooting

### "Error: function record_product_view does not exist"
➡️ **Solution**: You didn't run the migration yet. Go to Step 1 above.

### View counts are still increasing on every refresh
➡️ **Solution**: 
- Check browser console for errors
- Make sure you ran the migration
- Clear browser localStorage and try again

### Network request to /api/products/[id]/view fails
➡️ **Solution**:
- Check Supabase environment variables are set
- Look at server logs in your terminal
- Check Supabase dashboard logs

### Anonymous users not tracked
➡️ **Solution**:
- Check browser localStorage for `thrift_session_id`
- Make sure localStorage is enabled
- Try in a different browser

---

## 🎉 You're Done!

Once you complete Step 1 (run migration) and Step 2 (restart server), the view tracking will be fully functional!

The system will automatically:
- Track unique views per user
- Prevent duplicate counting
- Update your dashboard stats
- Work seamlessly for all users

**No further action needed** - just test it out and enjoy accurate view counts! 🚀

