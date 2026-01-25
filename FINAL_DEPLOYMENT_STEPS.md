# 🚀 FINAL DEPLOYMENT STEPS - Vercel CLI

**Only steps you still need to complete. No repeats of completed work.**

---

## ✅ Already Completed (Skip These)

- ✅ Sentry fully configured (all 3 config files exist)
- ✅ Sentry DSN hardcoded in config files
- ✅ next.config.js has Sentry integration
- ✅ instrumentation.ts created

---

## 📋 STEP-BY-STEP: What You Need to Do Now

### **STEP 1: Test Build Locally** ⏱️ 2 minutes

**Why:** Make sure your app builds without errors before deploying.

```bash
cd "/Users/virajshah/Thrift Reselling Software"
npm run build
```

**Expected Result:** Build succeeds without errors.

**If build fails:** Fix the errors before proceeding.

---

### **STEP 2: Prepare Environment Variable Values** ⏱️ 2 minutes

**⚠️ IMPORTANT:** You already have these in your local `.env.local` file! 

This step is just to **have them ready to copy-paste** into Vercel in Step 5 (Vercel doesn't automatically read your `.env.local` file).

**Action:** Open your `.env.local` file and have these values ready to copy:

#### Required Environment Variables:

1. **`NEXT_PUBLIC_SUPABASE_URL`** - Copy from your `.env.local`
2. **`NEXT_PUBLIC_SUPABASE_ANON_KEY`** - Copy from your `.env.local`
3. **`SUPABASE_SERVICE_ROLE_KEY`** - Copy from your `.env.local`
4. **`JWT_SECRET`** - Copy from your `.env.local` (or generate new one if you don't have it)

**Special case:**
5. **`NEXT_PUBLIC_APP_URL`** 
   - **For now:** Set to placeholder `https://placeholder.vercel.app`
   - **After Step 4:** You'll update it with your actual Vercel URL

**💡 Tip:** Keep your `.env.local` file open - you'll copy-paste these same values in Step 5!

#### Optional Environment Variables (if you have them in `.env.local`):

6. **`AFRICA_TALKING_API_KEY`** - Copy from `.env.local` if present
7. **`AFRICA_TALKING_USERNAME`** - Copy from `.env.local` if present
8. **`PAYSTACK_SECRET_KEY`** - Copy from `.env.local` if present
9. **`ADMIN_PHONE_NUMBERS`** - Copy from `.env.local` if present

**📝 Summary:** Just have your `.env.local` file open - you'll copy the same values into Vercel in Step 5!

---

### **STEP 3: Login to Vercel** ⏱️ 1 minute

```bash
vercel login
```

- Opens browser for authentication
- Choose login method (GitHub/Google/Email)
- Return to terminal when done

**Note:** If already logged in, skip this step.

---

### **STEP 4: First Deployment** ⏱️ 3 minutes

```bash
cd "/Users/virajshah/Thrift Reselling Software"
vercel
```

**Answer the prompts:**

1. **"Set up and deploy?"** → `Y` (press Enter)

2. **"Which scope?"** → Select your account/team (usually just press Enter)

3. **"Link to existing project?"** → `N` (first time, so "No")

4. **"What's your project's name?"** → 
   - Type a name (e.g., `outfittr` or `thrift-ke`)
   - Or just press Enter for default

5. **"In which directory is your code located?"** → `.` (press Enter for current directory)

6. **"Want to override the settings?"** → `N` (Vercel auto-detects Next.js correctly)

**Wait for build to complete** (~2-3 minutes)

**📌 IMPORTANT:** When deployment finishes, you'll see:
```
✅ Production: https://your-app-name-xxxxx.vercel.app [copied to clipboard]
```
**COPY AND SAVE THIS URL!** You'll need it for Step 5.

---

### **STEP 5: Add Environment Variables to Vercel** ⏱️ 5 minutes

Add each variable using the Vercel CLI:

```bash
# 1. Supabase (REQUIRED)
vercel env add NEXT_PUBLIC_SUPABASE_URL production
# Paste your Supabase URL when prompted
# Confirm by pasting again

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
# Paste your anon key when prompted

vercel env add SUPABASE_SERVICE_ROLE_KEY production
# Paste your service role key when prompted

# 2. App Configuration (REQUIRED)
vercel env add NEXT_PUBLIC_APP_URL production
# Paste your Vercel URL from Step 4 (e.g., https://your-app-name-xxxxx.vercel.app)

vercel env add JWT_SECRET production
# Paste the JWT secret you generated in Step 2

# 3. Optional - SMS (if you have these)
vercel env add AFRICA_TALKING_API_KEY production
vercel env add AFRICA_TALKING_USERNAME production

# 4. Optional - Payments (if you have this)
vercel env add PAYSTACK_SECRET_KEY production

# 5. Optional - Admin (if you have this)
vercel env add ADMIN_PHONE_NUMBERS production
```

**For each command:**
- It will prompt: `What's the value of NEXT_PUBLIC_SUPABASE_URL?`
- Paste your value and press Enter
- It will ask: `Add NEXT_PUBLIC_SUPABASE_URL to which Environments?`
- Select `Production`, `Preview`, `Development` (or just `Production`)
- Press Enter

**📝 Tip:** You can also add to Preview/Development environments later if needed.

---

### **STEP 6: Deploy to Production** ⏱️ 3 minutes

```bash
vercel --prod
```

This deploys your app to production with all the environment variables.

**Wait for deployment to complete** (~2-3 minutes)

**Expected output:**
```
✅ Production: https://your-app-name-xxxxx.vercel.app
```

---

### **STEP 7: Update Supabase Allowed URLs** ⏱️ 2 minutes

Allow your Vercel domain in Supabase:

1. Go to: **Supabase Dashboard** → Your Project
2. Click: **Authentication** → **URL Configuration**
3. Under **"Site URL"**, add/update:
   - `https://your-app-name-xxxxx.vercel.app` (your actual Vercel URL)
4. Under **"Redirect URLs"**, add:
   - `https://your-app-name-xxxxx.vercel.app/**`
5. Click **Save**

---

### **STEP 8: Test Your Deployment** ⏱️ 3 minutes

1. **Visit your production URL:**
   ```
   https://your-app-name-xxxxx.vercel.app
   ```

2. **Test basic functionality:**
   - [ ] Homepage loads
   - [ ] Can navigate pages
   - [ ] Login/signup page accessible
   - [ ] No console errors (open browser DevTools)

3. **Check Vercel logs if issues:**
   ```bash
   vercel logs --follow
   ```

---

## ✅ Post-Deployment Checklist

- [ ] App is accessible at production URL
- [ ] Homepage loads correctly
- [ ] No errors in browser console
- [ ] Supabase allowed URLs updated
- [ ] Environment variables added to Vercel
- [ ] Test authentication (if possible)

---

## 🆘 Troubleshooting

### **Build Fails**
```bash
# Check logs
vercel logs

# Test build locally first
npm run build
```

### **Environment Variables Not Working**
```bash
# Verify variables are set
vercel env ls

# Redeploy after adding variables
vercel --prod
```

### **App Works Locally But Not on Vercel**
1. Check `NEXT_PUBLIC_APP_URL` matches your Vercel URL
2. Verify Supabase allowed URLs include Vercel domain
3. Check Vercel function logs: `vercel logs --follow`

---

## 📝 Quick Command Reference

```bash
# Login
vercel login

# First deploy
vercel

# Add env var
vercel env add VARIABLE_NAME production

# Deploy to production
vercel --prod

# View logs
vercel logs --follow

# List env vars
vercel env ls
```

---

## ⏱️ Total Time Estimate: ~17 minutes

- Step 1: 2 min
- Step 2: 2 min (copy values from .env.local)
- Step 3: 1 min
- Step 4: 3 min
- Step 5: 5 min
- Step 6: 3 min
- Step 7: 2 min
- Step 8: 3 min

---

**🎉 That's it! Follow these steps in order and you'll be deployed!**
