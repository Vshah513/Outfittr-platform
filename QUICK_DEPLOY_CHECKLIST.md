# ⚡ Quick Deploy Checklist - Vercel CLI

## Pre-Deployment (5 minutes)

- [ ] Install Vercel CLI: `npm install -g vercel`
- [ ] Login: `vercel login`
- [ ] Test build locally: `npm run build` ✅
- [ ] Prepare environment variable values (from your `.env.local`)

## Deployment Steps (10 minutes)

### 1. First Deployment
```bash
cd "/Users/virajshah/Thrift Reselling Software"
vercel
```
- Answer prompts (mostly defaults)
- **Save the deployment URL** when shown

### 2. Add Environment Variables
```bash
# Required - Supabase
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production

# Required - App Config
vercel env add NEXT_PUBLIC_APP_URL production
# Value: https://your-actual-deployment-url.vercel.app
vercel env add JWT_SECRET production
# Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Optional - Africa's Talking
vercel env add AFRICA_TALKING_API_KEY production
vercel env add AFRICA_TALKING_USERNAME production

# Optional - Sentry
vercel env add SENTRY_DSN production
```

### 3. Deploy to Production
```bash
vercel --prod
```

### 4. Update Supabase Allowed URLs
- Go to Supabase Dashboard → Authentication → URL Configuration
- Add: `https://your-app-name.vercel.app`

## Verification (2 minutes)

- [ ] Visit: `https://your-app-name.vercel.app`
- [ ] Homepage loads ✅
- [ ] Test login/signup ✅

## Done! 🎉

**Full guide**: See `VERCEL_DEPLOYMENT_GUIDE.md` for detailed instructions.
