# 🚀 Vercel CLI Deployment Guide

This guide walks you through deploying your Next.js app to Vercel using the Vercel CLI.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Node.js 18+**: Installed on your machine
3. **Git Repository**: Your code should be in a git repository (local or remote)

## Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

Verify installation:
```bash
vercel --version
```

## Step 2: Login to Vercel

```bash
vercel login
```

This will:
- Open your browser for authentication
- Prompt you to log in with GitHub, GitLab, Bitbucket, or email
- Once authenticated, return to terminal

## Step 3: Navigate to Your Project

```bash
cd "/Users/virajshah/Thrift Reselling Software"
```

## Step 4: Prepare Your Build

First, ensure your app builds locally:

```bash
npm run build
```

If the build succeeds, you're ready to deploy. If there are errors, fix them first.

## Step 5: Deploy to Vercel (First Time)

Run the deployment command:

```bash
vercel
```

**During first deployment, Vercel will ask:**
1. **"Set up and deploy?"** → Press `Y` and Enter
2. **"Which scope?"** → Select your account/team
3. **"Link to existing project?"** → Press `N` (first time)
4. **"What's your project's name?"** → Enter a name (e.g., `outfittr` or `thrift-ke`) or press Enter for default
5. **"In which directory is your code located?"** → Press Enter (`.` means current directory)
6. **"Want to override the settings?"** → Press `N` (Vercel auto-detects Next.js)

Vercel will:
- Detect Next.js automatically
- Build your project
- Deploy it
- Give you a preview URL (e.g., `https://your-app-xxx.vercel.app`)

**⚠️ IMPORTANT**: Save the deployment URL - you'll need it for environment variables!

## Step 6: Set Environment Variables

After the first deployment, you need to add your environment variables. You can do this in two ways:

### Option A: Using Vercel CLI (Recommended)

```bash
# Add environment variables one by one
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add NEXT_PUBLIC_APP_URL production
vercel env add JWT_SECRET production

# Optional: Add Africa's Talking variables
vercel env add AFRICA_TALKING_API_KEY production
vercel env add AFRICA_TALKING_USERNAME production

# Optional: Add Sentry DSN if you have it
vercel env add SENTRY_DSN production
```

For each command:
- You'll be prompted to enter the value
- Type the value and press Enter
- Type the value again to confirm
- You can also paste it directly

### Option B: Using Vercel Dashboard

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click on your project
3. Go to **Settings** → **Environment Variables**
4. Add each variable:
   - **Name**: Variable name (e.g., `NEXT_PUBLIC_SUPABASE_URL`)
   - **Value**: Variable value
   - **Environment**: Select `Production`, `Preview`, and `Development` (or just `Production`)
5. Click **Save**

### Required Environment Variables

**Supabase (REQUIRED):**
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**App Configuration (REQUIRED):**
```env
NEXT_PUBLIC_APP_URL=https://your-app-name.vercel.app
JWT_SECRET=your-random-secret-key-here
```

**Generate JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Africa's Talking (OPTIONAL):**
```env
AFRICA_TALKING_API_KEY=your-api-key
AFRICA_TALKING_USERNAME=your-username
```

**Sentry (OPTIONAL - if you've set up Sentry):**
```env
SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
```

### Set Variables for All Environments

After adding to production, you may want to add them to preview and development:

```bash
# Add to preview environment
vercel env add NEXT_PUBLIC_SUPABASE_URL preview
# (repeat for all variables)

# Add to development environment
vercel env add NEXT_PUBLIC_SUPABASE_URL development
# (repeat for all variables)
```

## Step 7: Update NEXT_PUBLIC_APP_URL

After getting your deployment URL, update the `NEXT_PUBLIC_APP_URL`:

```bash
vercel env rm NEXT_PUBLIC_APP_URL production
vercel env add NEXT_PUBLIC_APP_URL production
# Enter: https://your-actual-app-name.vercel.app
```

## Step 8: Redeploy with Environment Variables

After adding environment variables, redeploy:

```bash
vercel --prod
```

Or:
```bash
vercel production
```

This will deploy to production with all your environment variables.

## Step 9: Verify Deployment

1. **Visit your deployment URL**: `https://your-app-name.vercel.app`
2. **Check build logs**: 
   ```bash
   vercel logs
   ```
3. **Test key features**:
   - Homepage loads
   - Authentication works
   - API routes respond

## Step 10: Configure Domain (Optional)

If you have a custom domain:

```bash
vercel domains add yourdomain.com
```

Then follow the DNS configuration instructions shown.

Or use the Vercel dashboard:
1. Go to your project → **Settings** → **Domains**
2. Add your domain
3. Update DNS records as shown
4. Wait for DNS propagation (5-60 minutes)

## Future Deployments

After initial setup, deploying is simple:

### Deploy to Preview (Automatic)
```bash
vercel
```

This creates a preview deployment with a unique URL for testing.

### Deploy to Production
```bash
vercel --prod
```

This deploys to your production URL.

### Pull Environment Variables Locally
```bash
vercel env pull .env.local
```

This downloads all environment variables from Vercel to your local `.env.local` file.

## Troubleshooting

### Build Fails

1. **Check build logs**:
   ```bash
   vercel logs
   ```

2. **Test build locally**:
   ```bash
   npm run build
   ```

3. **Common issues**:
   - Missing environment variables → Add them in Vercel
   - TypeScript errors → Fix type errors
   - Missing dependencies → Check `package.json`

### Environment Variables Not Working

1. **Verify variables are set**:
   ```bash
   vercel env ls
   ```

2. **Ensure variables are in production environment**

3. **Redeploy after adding variables**:
   ```bash
   vercel --prod
   ```

### App Works Locally But Not on Vercel

1. Check that `NEXT_PUBLIC_APP_URL` matches your Vercel URL
2. Verify Supabase allowed URLs include your Vercel domain
3. Check Sentry configuration if using it
4. Review Vercel function logs:
   ```bash
   vercel logs --follow
   ```

## Useful Vercel CLI Commands

```bash
# List all deployments
vercel ls

# View deployment details
vercel inspect [deployment-url]

# Remove a deployment
vercel rm [deployment-url]

# View project settings
vercel project ls

# Link existing project
vercel link

# Open project in browser
vercel open
```

## Post-Deployment Checklist

- [ ] App is accessible at Vercel URL
- [ ] Homepage loads correctly
- [ ] Authentication works (login/signup)
- [ ] Database connection works
- [ ] API routes respond correctly
- [ ] Images load from Supabase storage
- [ ] Update Supabase allowed URLs with Vercel domain
- [ ] Test on mobile device
- [ ] Verify PWA functionality

## Next Steps

1. **Update Supabase Allowed URLs**:
   - Go to Supabase → Authentication → URL Configuration
   - Add: `https://your-app-name.vercel.app`

2. **Test Production Features**:
   - User registration
   - Product creation
   - Image uploads
   - Messaging

3. **Monitor Performance**:
   - Check Vercel Analytics (if enabled)
   - Monitor Sentry errors (if configured)
   - Review function logs

4. **Set Up Custom Domain** (if desired):
   - Add domain in Vercel
   - Configure DNS
   - Update `NEXT_PUBLIC_APP_URL`

---

**🎉 Congratulations! Your app is now deployed to Vercel!**
