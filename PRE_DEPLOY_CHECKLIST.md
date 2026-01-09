# ✅ Pre-Deploy Checklist

## What's Already Done ✅

1. ✅ **Packages Installed**
   - @sentry/nextjs - Installed
   - @vercel/analytics - Installed
   - Sentry wizard - Completed (you selected Europe)

2. ✅ **Analytics Enabled**
   - Code uncommented in `app/layout.tsx`

3. ✅ **Code Committed**
   - All files committed to git

4. ✅ **Vercel CLI Installed**
   - Ready to deploy

---

## What MUST Be Done Before Deploying 🚨

### **CRITICAL: Test Build First** ⚠️

**Run this command:**
```bash
cd "/Users/virajshah/Thrift Reselling Software"
npm run build
```

**Why:** This will catch any errors before deployment. If build fails, fix it first!

**What to check:**
- ✅ Build completes without errors
- ✅ No TypeScript errors
- ✅ No missing dependencies

---

## What Can Be Done After Deployment 📝

These can wait until after you get your Vercel domain:

1. **Update Domain References** (Step 2)
   - `public/robots.txt` - Update placeholder
   - `app/sitemap.ts` - Update placeholder
   - **OR** just set `NEXT_PUBLIC_APP_URL` in Vercel env vars (better!)

2. **Create OG Image** (Step 3)
   - Create `public/og-image.jpg` (1200x630px)
   - Can be done anytime, not critical for launch

3. **Set Environment Variables** (Step 4)
   - Add all env vars in Vercel dashboard
   - Need your Supabase keys, Paystack keys, etc.

4. **Configure Supabase** (Step 8)
   - Add Vercel domain to allowed URLs

5. **Configure Paystack** (Step 9)
   - Set webhook URL with your Vercel domain

---

## Recommended Order 🎯

### **Before Deploying:**
1. ✅ Test build: `npm run build`
2. ✅ Fix any build errors
3. ✅ Then deploy

### **After Deploying:**
1. Get your Vercel domain (e.g., `outfittr-platform.vercel.app`)
2. Set environment variables in Vercel
3. Update domain references (or just set `NEXT_PUBLIC_APP_URL`)
4. Configure Supabase
5. Configure Paystack
6. Create OG image (optional, can wait)

---

## Summary

**You're almost ready!** Just need to:
1. **Test the build** (`npm run build`)
2. **Fix any errors** if build fails
3. **Then deploy** with `vercel login` and `vercel --prod`

Everything else can be done after you have your deployment URL!
