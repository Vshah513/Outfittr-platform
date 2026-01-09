# 🎯 Complete Pre-Deploy Checklist

## ✅ What's Already Done

1. ✅ **Packages Installed**
   - @sentry/nextjs ✅
   - @vercel/analytics ✅
   - Sentry wizard run ✅

2. ✅ **Code Ready**
   - Build succeeds ✅
   - All errors fixed ✅
   - Analytics enabled ✅
   - Production config done ✅

---

## ⚠️ MUST DO BEFORE DEPLOYING

### **1. Commit Your Fixes** 📝

You have uncommitted changes. Run:

```bash
cd "/Users/virajshah/Thrift Reselling Software"
git add .
git commit -m "Fix Next.js 15 params, build errors, and SMS initialization"
git push origin main
```

**Why:** Ensures all fixes are saved and in GitHub.

---

### **2. Verify Sentry Setup** 🔍

Sentry config files weren't found. Check if Sentry wizard completed:

**Option A: Check Sentry Dashboard**
1. Go to [sentry.io](https://sentry.io)
2. Login
3. Check if you have a project created
4. If yes → Get DSN from Settings → Client Keys (DSN)
5. If no → Run wizard again: `npx @sentry/wizard@latest -i nextjs`

**Option B: Run Sentry Wizard Again**
```bash
npx @sentry/wizard@latest -i nextjs
```

**Note:** Sentry is optional for launch - your app will work without it, but error tracking won't work.

---

### **3. Prepare Environment Variables** 📋

**Gather these values BEFORE deploying:**

#### **From Supabase Dashboard:**
- [ ] `NEXT_PUBLIC_SUPABASE_URL` = `https://xxxxx.supabase.co`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `eyJxxx...`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` = `eyJxxx...` (keep secret!)

#### **From Paystack Dashboard:**
- [ ] `PAYSTACK_SECRET_KEY` = `sk_live_xxxxx` (production key)

#### **Generated (Already Done):**
- [x] `JWT_SECRET` = `43de5595907d15cdb3bae4ad320ce7f50981dbf9bc2db47b3db99e5ee4e53e20`

#### **From Sentry (After Setup):**
- [ ] `SENTRY_DSN` = `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx`

#### **After Deployment (You'll Get This):**
- [ ] `NEXT_PUBLIC_APP_URL` = `https://outfittr-platform.vercel.app` (your actual domain)

**Write these down** or keep them ready to paste into Vercel.

---

## 📝 OPTIONAL (Can Do Later)

### **4. Create OG Image** 🖼️

**Not critical for launch**, but good to have:

1. Create 1200×630px image
2. Include "Outfittr" logo/branding
3. Save as `public/og-image.jpg`

**Can be done after deployment.**

---

## 🚀 DEPLOYMENT PLAN

### **Step 1: Commit & Push** (Do Now)
```bash
git add .
git commit -m "Pre-launch fixes complete"
git push origin main
```

### **Step 2: Deploy to Vercel** (Do Next)
```bash
vercel login
vercel --prod
```

### **Step 3: Get Your Domain** (After Deploy)
- Vercel will give you: `https://outfittr-platform-xxxxx.vercel.app`
- Copy this URL

### **Step 4: Configure Everything** (After Deploy)
1. Add environment variables in Vercel
2. Update `NEXT_PUBLIC_APP_URL` with your domain
3. Configure Supabase (add domain to allowed URLs)
4. Configure Paystack (set webhook URL)
5. Update domain references in code (or just use env var)

---

## ✅ Final Checklist

**Before Deploying:**
- [ ] Commit all fixes
- [ ] Push to GitHub
- [ ] Gather all environment variable values
- [ ] Get Sentry DSN (or skip for now)
- [ ] Have JWT_SECRET ready

**After Deploying:**
- [ ] Get Vercel domain
- [ ] Set all environment variables in Vercel
- [ ] Configure Supabase
- [ ] Configure Paystack
- [ ] Test the site
- [ ] Create OG image (optional)

---

## 🎯 You're Ready When:

✅ Code is committed
✅ Build succeeds (done!)
✅ Environment variables gathered
✅ Ready to deploy

**Everything else can be done after you get your domain!**

---

## 💡 Recommendation

**Do this now:**
1. Commit your fixes
2. Gather env var values
3. Deploy to Vercel
4. Configure everything else after deployment

**Sentry can wait** - it's nice to have but not critical for launch. You can add it later.
