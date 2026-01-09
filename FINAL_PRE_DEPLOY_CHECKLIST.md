# ✅ Final Pre-Deploy Checklist

## Current Status Check

Let me verify everything is ready before you deploy:

---

## ✅ COMPLETED (Ready)

1. **✅ Packages Installed**
   - @sentry/nextjs - Installed
   - @vercel/analytics - Installed
   - Sentry wizard - Completed (Europe selected)

2. **✅ Code Fixes**
   - Next.js 15 params fixed (all dynamic routes)
   - Build errors fixed
   - SMS library initialization fixed
   - Logger implemented

3. **✅ Analytics Enabled**
   - Code uncommented in `app/layout.tsx`

4. **✅ Build Test**
   - `npm run build` - ✅ SUCCESS

5. **✅ Production Config**
   - `next.config.js` - Fixed (uses env vars)
   - `robots.txt` - Created
   - `sitemap.ts` - Created
   - Rate limiting - Added
   - Health check - Added
   - Legal pages - Enhanced

---

## ⚠️ BEFORE DEPLOYING - Do These Now

### 1. **Commit Your Recent Fixes** 📝

You have uncommitted changes. Commit them:

```bash
cd "/Users/virajshah/Thrift Reselling Software"
git add .
git commit -m "Fix Next.js 15 params and build errors"
git push origin main
```

**Why:** Ensures all your fixes are saved and pushed to GitHub.

---

### 2. **Verify Sentry Configuration** 🔍

Check if Sentry created config files:

```bash
ls -la | grep sentry
```

**Expected files:**
- `sentry.client.config.ts` (or `.js`)
- `sentry.server.config.ts` (or `.js`)
- `sentry.edge.config.ts` (or `.js`) - optional

**If files exist:** ✅ Good, Sentry is configured
**If files don't exist:** Run `npx @sentry/wizard@latest -i nextjs` again

---

### 3. **Get Your Sentry DSN** 🔑

After Sentry setup, you need your DSN:

1. Go to [sentry.io](https://sentry.io)
2. Login to your account
3. Go to your project
4. Settings → Client Keys (DSN)
5. **Copy the DSN** (looks like: `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx`)

**Save this** - you'll add it to Vercel env vars after deployment.

---

### 4. **Generate JWT Secret** 🔐

Run this command to generate a secure JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Copy the output** - you'll add it as `JWT_SECRET` in Vercel.

---

### 5. **Prepare Your Environment Variables** 📋

Before deploying, gather these values:

**From Supabase:**
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`

**From Paystack:**
- [ ] `PAYSTACK_SECRET_KEY` (production key)

**Generated:**
- [ ] `JWT_SECRET` (from command above)

**From Sentry:**
- [ ] `SENTRY_DSN` (from Sentry dashboard)

**After Deployment:**
- [ ] `NEXT_PUBLIC_APP_URL` (your Vercel domain)

**Write these down** so you can add them quickly in Vercel.

---

### 6. **Optional: Create OG Image** 🖼️

**Can be done later**, but if you want to do it now:

1. Create 1200x630px image
2. Include "Outfittr" branding
3. Save as `public/og-image.jpg`

**Tools:** Canva, Figma, Photoshop

---

## 📋 DEPLOYMENT ORDER

### **Phase 1: Deploy First** (Get Domain)
1. Commit fixes
2. Deploy to Vercel
3. Get your domain (e.g., `outfittr-platform.vercel.app`)

### **Phase 2: Configure** (After Deployment)
1. Set environment variables in Vercel
2. Update domain references (or just set `NEXT_PUBLIC_APP_URL`)
3. Configure Supabase (add domain to allowed URLs)
4. Configure Paystack (set webhook URL)
5. Test everything

---

## 🎯 RECOMMENDED: Do These Before Deploying

**Must Do:**
1. ✅ Commit your fixes
2. ✅ Get Sentry DSN
3. ✅ Generate JWT Secret
4. ✅ Gather all env var values

**Nice to Have:**
5. ⏳ Create OG image (can do later)

---

## 🚀 Then Deploy!

After completing the "Must Do" items above, you're ready to:

1. `vercel login`
2. `vercel --prod`
3. Configure everything else after you get your domain

---

## Summary

**You're 95% ready!** Just need to:
- Commit fixes
- Get Sentry DSN
- Generate JWT Secret
- Gather env var values

Then deploy and configure the rest!
