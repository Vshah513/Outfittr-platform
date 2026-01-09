# 🎯 Next Steps Before Deploying - Clear Action Plan

## ✅ What's Already Done

- ✅ **Packages installed** (`@vercel/analytics`, `@sentry/nextjs`)
- ✅ **Analytics enabled** in code (`app/layout.tsx`)
- ✅ **Build succeeds** (just tested - works!)
- ✅ **All code fixes applied** (Next.js 15 params, rate limiting, logging, SEO)
- ✅ **JWT_SECRET generated**

---

## 🚨 MUST DO BEFORE DEPLOYING (3 Things)

### **1. Fix GitHub Authentication & Push** 🔴 CRITICAL

**Current Status:** Can't push to GitHub (authentication failed)

**What to Do:**
1. Create Personal Access Token:
   - Go to: **https://github.com/settings/tokens**
   - Click "Generate new token" → "Generate new token (classic)"
   - Name: `Outfittr Deployment`
   - Select scope: ✅ **`repo`**
   - Generate and copy token (starts with `ghp_`)

2. Update git remote with token:
   ```bash
   cd "/Users/virajshah/Thrift Reselling Software"
   git remote set-url origin https://YOUR_TOKEN@github.com/Outfittr-app/Outfittr-platform.git
   ```
   (Replace `YOUR_TOKEN` with your actual token)

3. Commit and push:
   ```bash
   git add .
   git commit -m "Pre-launch setup: analytics, logging, rate limiting, SEO"
   git push -u origin main
   ```

**Time:** 5-10 minutes

---

### **2. Gather Environment Variables** 🟡 HIGH PRIORITY

**Before deploying, collect these values:**

#### **From Supabase Dashboard:**
1. Go to: https://supabase.com/dashboard
2. Select your project
3. **Settings** → **API**
4. Copy these 3 values:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://xxxxx.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `eyJxxx...`
   - `SUPABASE_SERVICE_ROLE_KEY` = `eyJxxx...` ⚠️ Keep secret!

#### **From Paystack Dashboard:**
1. Go to: https://dashboard.paystack.com
2. **Settings** → **API Keys & Webhooks**
3. Copy:
   - `PAYSTACK_SECRET_KEY` = `sk_live_xxxxx` (use production key)

#### **Already Have:**
- ✅ `JWT_SECRET` = `43de5595907d15cdb3bae4ad320ce7f50981dbf9bc2db47b3db99e5ee4e53e20`

**Write these down!** You'll add them to Vercel after deployment.

**Time:** 5 minutes

---

### **3. Test Build** ✅ DONE!

**Status:** ✅ Build succeeds (just tested)

**No action needed!**

---

## ⏭️ OPTIONAL (Can Do After Deployment)

### **Sentry Setup** (Error Tracking)
- **Status:** Not set up yet
- **Action:** Can skip for now, add later
- **To set up:** `npx @sentry/wizard@latest -i nextjs`

### **OG Image** (Social Media Preview)
- **Status:** Not created yet
- **Action:** Can create after deployment
- **Size:** 1200×630px, save as `public/og-image.jpg`

### **Domain Updates**
- **Status:** Will do after deployment
- **Files:** `public/robots.txt` and `app/sitemap.ts`
- **Action:** Update after you get Vercel domain

---

## 🚀 DEPLOYMENT STEPS (After Above 3 Things)

### **Step 1: Login to Vercel**
```bash
vercel login
```

### **Step 2: Deploy**
```bash
vercel --prod
```

**OR** connect GitHub repo in Vercel dashboard (auto-deploys on push)

### **Step 3: Get Your Domain**
- Vercel will give you a domain like: `outfittr-platform-xxxxx.vercel.app`
- Save this URL!

### **Step 4: Add Environment Variables in Vercel**
1. Go to Vercel project dashboard
2. **Settings** → **Environment Variables**
3. Add all the variables you gathered (Step 2 above)
4. Also add: `NEXT_PUBLIC_APP_URL` = your Vercel domain
5. **Redeploy** after adding variables

### **Step 5: Configure Supabase**
1. Go to Supabase dashboard
2. **Authentication** → **URL Configuration**
3. Add to **Redirect URLs**:
   ```
   https://your-vercel-domain.vercel.app/**
   ```

### **Step 6: Configure Paystack**
1. Go to Paystack dashboard
2. **Settings** → **Webhooks**
3. Add webhook URL:
   ```
   https://your-vercel-domain.vercel.app/api/webhooks/paystack
   ```

### **Step 7: Test Everything**
- Visit your site
- Test registration/login
- Test creating a listing
- Test messaging
- Test payment (test mode)

---

## 📋 QUICK CHECKLIST

**Before Deploying:**
- [ ] Fix GitHub auth & push code
- [ ] Gather Supabase env vars (3 values)
- [ ] Gather Paystack env var (1 value)
- [x] Test build ✅

**Deploy:**
- [ ] Login to Vercel
- [ ] Deploy (`vercel --prod` or connect GitHub)

**After Deploying:**
- [ ] Get Vercel domain
- [ ] Add env vars in Vercel
- [ ] Configure Supabase URLs
- [ ] Configure Paystack webhook
- [ ] Test everything

---

## 🎯 YOUR ACTION PLAN (Right Now)

1. **Fix GitHub authentication** (5-10 min)
   - Create token
   - Update remote URL
   - Push code

2. **Gather environment variables** (5 min)
   - Get from Supabase (3 values)
   - Get from Paystack (1 value)

3. **Deploy to Vercel** (5 min)
   - `vercel login`
   - `vercel --prod`

4. **Configure everything else** (after deployment)

---

## 💡 Recommendation

**Do these 3 things in order:**
1. ✅ Fix GitHub push
2. ✅ Gather env vars
3. ✅ Deploy!

**Everything else can wait** until after you have your domain.

You're 95% ready! Just need to push code and gather env vars, then deploy! 🚀
