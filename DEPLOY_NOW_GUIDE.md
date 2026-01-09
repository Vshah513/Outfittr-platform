# 🚀 Quick Deploy Guide - Do This First!

## ✅ What We'll Do
1. Deploy to Vercel (get free domain)
2. Update domain references after deployment
3. Configure environment variables

---

## STEP 1: Prepare Your Code for Deployment

Your code is ready! I've already:
- ✅ Enabled analytics
- ✅ Set up files to use environment variables

---

## STEP 2: Deploy to Vercel

### Option A: Deploy via Vercel Website (Easiest)

1. **Go to [vercel.com](https://vercel.com)**
   - Sign up or log in (use GitHub to connect)

2. **Click "Add New Project"**

3. **Import Your Repository**
   - If your code is on GitHub: Select your repository
   - If NOT on GitHub: You'll need to push to GitHub first (see Option B below)

4. **Configure Project**
   - Framework: **Next.js** (should auto-detect)
   - Root Directory: `./` (leave as is)
   - Build Command: `npm run build` (should be auto-filled)
   - Output Directory: `.next` (should be auto-filled)

5. **Click "Deploy"**
   - Wait 2-3 minutes for deployment
   - You'll get a free domain like: `outfittr-xxxxx.vercel.app`

6. **Copy Your Domain**
   - After deployment, copy the URL (e.g., `https://outfittr-xxxxx.vercel.app`)

---

### Option B: Push to GitHub First (If Not Already There)

If your code isn't on GitHub yet:

```bash
# In your terminal, run these commands:

# 1. Add all files
git add .

# 2. Commit
git commit -m "Ready for deployment"

# 3. Create a GitHub repository
# Go to github.com, create a new repo, then:

# 4. Connect and push (replace YOUR-USERNAME and REPO-NAME)
git remote add origin https://github.com/YOUR-USERNAME/REPO-NAME.git
git branch -M main
git push -u origin main
```

Then follow **Option A** above.

---

## STEP 3: After Deployment - Update Domain References

Once you have your Vercel domain (e.g., `outfittr-xxxxx.vercel.app`):

### Update `public/robots.txt`

Replace the placeholder with your actual domain:

**Find:**
```
Sitemap: https://YOUR-VERCEL-DOMAIN.vercel.app/sitemap.xml
```

**Change to:**
```
Sitemap: https://outfittr-xxxxx.vercel.app/sitemap.xml
```
(Use your actual domain from Vercel)

### Update `app/sitemap.ts`

The sitemap already uses environment variables, but you can update the fallback:

**Find:**
```typescript
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://yourdomain.com'
```

**Change to:**
```typescript
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://outfittr-xxxxx.vercel.app'
```
(Use your actual domain)

**OR** (Better): Just set the environment variable in Vercel (see Step 4)

---

## STEP 4: Set Environment Variables in Vercel

1. **Go to your Vercel project**
2. **Click "Settings"** → **"Environment Variables"**
3. **Add these variables:**

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
NEXT_PUBLIC_APP_URL=https://outfittr-xxxxx.vercel.app
JWT_SECRET=your-generated-secret-here
PAYSTACK_SECRET_KEY=sk_live_xxxxx
SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
```

**Important:**
- For `NEXT_PUBLIC_APP_URL`: Use your actual Vercel domain
- For `JWT_SECRET`: Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- For `SENTRY_DSN`: Get this from your Sentry dashboard after setup
- Select **"Production"** environment for each
- Click **"Save"** after each variable

4. **Redeploy**
   - After adding variables, go to **"Deployments"** tab
   - Click the **"..."** menu on latest deployment
   - Click **"Redeploy"**

---

## STEP 5: Test Your Deployment

Visit your domain: `https://outfittr-xxxxx.vercel.app`

Check:
- [ ] Homepage loads
- [ ] No errors in browser console
- [ ] Can navigate pages
- [ ] Health check works: `https://your-domain.vercel.app/api/health`

---

## 🎉 You're Deployed!

After deployment:
1. You'll have a working website
2. You can update domain references
3. You can add a custom domain later if you want

---

## Next Steps After Deployment

1. ✅ Update domain references (Step 3 above)
2. ✅ Set environment variables (Step 4 above)
3. ✅ Configure Supabase (add your Vercel domain to allowed URLs)
4. ✅ Configure Paystack webhook
5. ✅ Test everything

---

## Need Help?

If deployment fails:
- Check the error message in Vercel
- Make sure all packages are installed: `npm install`
- Try building locally first: `npm run build`
