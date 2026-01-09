# 🚀 Step-by-Step Launch Guide

## What You Have
✅ A **full-stack Next.js application** that works as:
- **Website** - Accessible in any browser (desktop & mobile)
- **Mobile App** - Installable PWA (Progressive Web App) on iOS and Android phones

---

## 📋 STEP-BY-STEP: What You Need to Do

### **STEP 1: Install Required Packages** ⚙️

Open your terminal in the project folder and run:

```bash
cd "/Users/virajshah/Thrift Reselling Software"
npm install @sentry/nextjs @vercel/analytics
```

After installation, run the Sentry wizard:

```bash
npx @sentry/wizard@latest -i nextjs
```

**What this does:**
- Installs error tracking (Sentry)
- Installs analytics (Vercel Analytics)
- Sets up Sentry configuration

**Expected output:** You'll be asked some questions - just press Enter for defaults or follow the prompts.

---

### **STEP 2: Update Domain References** 🌐

You need to replace `yourdomain.com` with your actual website domain in 2 files:

#### **File 1: `public/robots.txt`**

Open the file and replace `yourdomain.com` with your actual domain (e.g., `outfittr.com` or `outfittr.vercel.app`)

**Find this line:**
```
Sitemap: https://yourdomain.com/sitemap.xml
```

**Change to:**
```
Sitemap: https://YOUR-ACTUAL-DOMAIN.com/sitemap.xml
```

#### **File 2: `app/sitemap.ts`**

Open the file and replace `yourdomain.com` with your actual domain in TWO places:

**Find:**
```typescript
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://yourdomain.com'
```

**Change to:**
```typescript
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://YOUR-ACTUAL-DOMAIN.com'
```

**OR** (better option): Just make sure `NEXT_PUBLIC_APP_URL` is set in your environment variables (see Step 4).

---

### **STEP 3: Create Open Graph Image** 🖼️

Create a social media preview image:

1. Create an image that is **1200 pixels wide × 630 pixels tall**
2. Save it as `og-image.jpg`
3. Place it in the `public` folder: `public/og-image.jpg`

**What to include in the image:**
- Your app name "Outfittr"
- Tagline or logo
- Make it look professional (this shows when people share your site on social media)

**Tools you can use:**
- Canva (free templates for OG images)
- Figma
- Photoshop
- Any image editor

---

### **STEP 4: Configure Environment Variables in Vercel** 🔐

**If you haven't deployed yet:**
1. Go to [vercel.com](https://vercel.com)
2. Sign up/login
3. Click "New Project"
4. Import your GitHub repository (or connect it)
5. Go to Project Settings → Environment Variables

**If you already have a Vercel project:**
1. Go to your project on Vercel
2. Click "Settings"
3. Click "Environment Variables"

**Add these variables:**

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
JWT_SECRET=generate-a-random-string-here
PAYSTACK_SECRET_KEY=sk_live_xxxxx
```

**To generate JWT_SECRET, run this in terminal:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**After Sentry setup (Step 1), also add:**
```
SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
```

**Important:** 
- For each variable, select **"Production"** environment
- Click "Save" after each one
- After adding all variables, **redeploy** your app

---

### **STEP 5: Enable Analytics in Code** 📊

After installing packages in Step 1, you need to uncomment the analytics code:

**Open `app/layout.tsx`**

**Find this line (around line 7):**
```typescript
// Uncomment after installing: npm install @vercel/analytics
// import { Analytics } from '@vercel/analytics/react'
```

**Change to:**
```typescript
import { Analytics } from '@vercel/analytics/react'
```

**Find this line (around line 48):**
```typescript
        {/* Uncomment after installing @vercel/analytics: <Analytics /> */}
```

**Change to:**
```typescript
        <Analytics />
```

**Save the file.**

---

### **STEP 6: Test Your Build** ✅

Before deploying, test that everything builds correctly:

```bash
npm run build
```

**What to check:**
- ✅ Build completes without errors
- ✅ No TypeScript errors
- ✅ All files compile successfully

**If you see errors:**
- Read the error message
- Fix any issues it mentions
- Try building again

---

### **STEP 7: Deploy to Vercel** 🚀

**If you haven't deployed yet:**

1. Make sure your code is pushed to GitHub:
   ```bash
   git add .
   git commit -m "Pre-launch setup complete"
   git push
   ```

2. In Vercel:
   - Your project should auto-deploy when you push
   - Or click "Deploy" manually

**If you already have it deployed:**

1. After adding environment variables (Step 4), click "Redeploy"
2. Wait for deployment to complete (~2-3 minutes)

---

### **STEP 8: Configure Supabase** 🗄️

1. Go to your Supabase project dashboard
2. Click **Authentication** → **URL Configuration**
3. Add your production domain to **"Redirect URLs"**:
   ```
   https://your-domain.com/**
   https://your-domain.vercel.app/**
   ```
4. Click "Save"

**Also verify:**
- ✅ RLS (Row Level Security) is enabled on all tables
- ✅ Storage bucket `product-images` exists and is public
- ✅ Storage policies are set correctly

---

### **STEP 9: Configure Paystack Webhook** 💳

1. Go to your Paystack dashboard
2. Navigate to **Settings** → **Webhooks**
3. Add webhook URL:
   ```
   https://your-domain.com/api/webhooks/paystack
   ```
4. Select events to listen for:
   - ✅ `charge.success`
   - ✅ `subscription.create`
   - ✅ `subscription.disable`
   - ✅ `invoice.payment_failed`
   - ✅ `invoice.update`
5. Save the webhook
6. Copy the webhook secret (if provided) and add to Vercel env vars as `PAYSTACK_WEBHOOK_SECRET` (if needed)

---

### **STEP 10: Test Everything** 🧪

After deployment, test these:

#### **Website Tests:**
- [ ] Visit your site: `https://your-domain.com`
- [ ] Check homepage loads
- [ ] Try registering a new account
- [ ] Try logging in
- [ ] Browse products
- [ ] Create a product listing (as seller)
- [ ] Send a message (as buyer)
- [ ] Test payment flow (use test mode)

#### **Mobile App Tests:**
- [ ] Open your site on mobile browser
- [ ] Look for "Add to Home Screen" prompt
- [ ] Install the app
- [ ] Test that it works like a native app
- [ ] Check that it opens in standalone mode (no browser bar)

#### **Technical Tests:**
- [ ] Health check: `https://your-domain.com/api/health`
- [ ] Sitemap: `https://your-domain.com/sitemap.xml`
- [ ] Robots.txt: `https://your-domain.com/robots.txt`
- [ ] Terms page: `https://your-domain.com/terms`
- [ ] Privacy page: `https://your-domain.com/privacy`

---

### **STEP 11: Final Checklist** ✅

Before announcing launch:

- [ ] All environment variables set in Vercel
- [ ] Domain references updated (robots.txt, sitemap.ts)
- [ ] OG image created and uploaded
- [ ] Analytics enabled in code
- [ ] Supabase URLs configured
- [ ] Paystack webhook configured
- [ ] Build succeeds locally
- [ ] Deployed to production
- [ ] All tests pass
- [ ] Mobile app installs correctly
- [ ] Payment flow works
- [ ] Error tracking works (check Sentry dashboard)

---

## 🎉 You're Ready to Launch!

Once all steps are complete, your app is:
- ✅ **Website** - Accessible at your domain
- ✅ **Mobile App** - Installable on iOS and Android
- ✅ **Full-Stack** - Frontend + Backend + Database
- ✅ **Production-Ready** - Error tracking, analytics, rate limiting

---

## 🆘 Troubleshooting

**Build fails?**
- Check error messages
- Make sure all packages are installed: `npm install`
- Check TypeScript errors

**Analytics not working?**
- Make sure you uncommented the code in Step 5
- Check that package is installed: `npm list @vercel/analytics`

**Sentry not working?**
- Make sure you ran the wizard: `npx @sentry/wizard@latest -i nextjs`
- Check that SENTRY_DSN is set in Vercel environment variables

**Mobile app not installing?**
- Make sure you're using HTTPS (Vercel provides this automatically)
- Check that you're on a mobile device (not desktop browser)
- Try clearing browser cache

**Need help?**
- Check the error message
- Review the `PRE_LAUNCH_IMPLEMENTATION_SUMMARY.md` file
- Check Vercel deployment logs

---

## 📱 How Users Will Use Your App

### **As a Website:**
1. Users visit `your-domain.com` in any browser
2. They can browse, buy, and sell items
3. Works on desktop, tablet, and mobile browsers

### **As a Mobile App:**
1. Users visit your site on their phone
2. They see "Add to Home Screen" prompt
3. They tap "Add" and the app installs
4. App icon appears on their home screen
5. They can open it like any other app
6. It works offline (basic functionality)
7. No app store needed!

---

**That's it! Follow these steps in order and you'll be ready to launch.** 🚀
