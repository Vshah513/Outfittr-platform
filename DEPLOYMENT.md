# Deployment Guide - Kenya Thrift Marketplace

## Pre-Deployment Checklist

### 1. Code Preparation
- [x] All features implemented
- [x] Environment variables documented
- [x] Database schema created
- [x] PWA manifest configured
- [ ] Production environment variables set

### 2. Supabase Setup

#### Create Production Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Choose a strong database password
4. Select region closest to Kenya (EU or Asia)

#### Run Database Migrations
1. Open SQL Editor in Supabase
2. Run migrations in order:
   ```sql
   -- First, run: supabase/migrations/001_initial_schema.sql
   -- Then, run: supabase/migrations/002_functions.sql
   ```

#### Set Up Storage
1. Navigate to Storage
2. Create bucket: `product-images` (Public)
3. Add policies:
   ```sql
   -- View policy
   CREATE POLICY "Public can view product images"
   ON storage.objects FOR SELECT
   TO public
   USING (bucket_id = 'product-images');

   -- Upload policy
   CREATE POLICY "Authenticated users can upload images"
   ON storage.objects FOR INSERT
   TO authenticated
   WITH CHECK (bucket_id = 'product-images');

   -- Delete policy
   CREATE POLICY "Users can delete their own images"
   ON storage.objects FOR DELETE
   TO authenticated
   USING (bucket_id = 'product-images');
   ```

#### Get Credentials
From Project Settings → API:
- Project URL → `NEXT_PUBLIC_SUPABASE_URL`
- anon public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- service_role key → `SUPABASE_SERVICE_ROLE_KEY` (keep secret!)

### 3. Vercel Deployment

#### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit: Kenya Thrift Marketplace"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

#### Step 2: Import to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Configure project:
   - Framework Preset: Next.js
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `.next`

#### Step 3: Environment Variables
Add these in Vercel project settings:

```env
# Supabase (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# App URL (Update after first deploy)
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

# JWT Secret (Generate strong random string)
JWT_SECRET=generate-strong-random-string-here

# Africa's Talking (Optional for MVP)
AFRICA_TALKING_API_KEY=your-key
AFRICA_TALKING_USERNAME=your-username
```

**Generate JWT Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### Step 4: Deploy
1. Click "Deploy"
2. Wait for build to complete (~2-3 minutes)
3. Copy deployment URL

#### Step 5: Update Environment
1. Go back to Vercel project settings
2. Update `NEXT_PUBLIC_APP_URL` with your deployment URL
3. Redeploy

### 4. Domain Configuration (Optional)

#### Add Custom Domain
1. In Vercel project settings → Domains
2. Add your domain (e.g., `thriftke.com`)
3. Update DNS records as instructed
4. Wait for DNS propagation (~5-60 minutes)

#### Update Supabase Allowed URLs
1. Go to Supabase → Authentication → URL Configuration
2. Add your production domain to allowed URLs

### 5. PWA Testing

#### Test Installation
1. Visit your site on mobile (iOS or Android)
2. Look for "Add to Home Screen" prompt
3. Install and test app-like experience

#### Verify PWA Features
- [ ] App installs correctly
- [ ] Custom app icon displays
- [ ] Standalone mode (no browser chrome)
- [ ] Basic offline functionality
- [ ] Service worker registered

#### Debug PWA Issues
Chrome DevTools → Application tab:
- Check Manifest
- Inspect Service Workers
- Test offline mode

### 6. SMS/OTP Setup

#### Option A: Continue with Mock OTP (MVP)
- Leave SMS env vars empty
- OTP will be logged to Vercel logs
- Share OTP manually for testing

#### Option B: Africa's Talking Integration
1. Sign up at [africastalking.com](https://africastalking.com)
2. Get sandbox credentials
3. Add to Vercel env vars
4. Test with Kenya numbers
5. Upgrade to production for live SMS

### 7. Post-Deployment Tasks

#### Test All Features
- [ ] Phone authentication flow
- [ ] Create product listing
- [ ] Upload images
- [ ] Browse marketplace
- [ ] Apply filters
- [ ] View product details
- [ ] Send messages
- [ ] Leave reviews

#### Performance Optimization
1. Check Vercel Analytics
2. Monitor Core Web Vitals
3. Optimize images if needed
4. Enable Vercel Edge Network

#### Monitoring Setup
1. **Vercel Analytics**:
   - Enable in project settings
   - Monitor page views and performance

2. **Sentry (Optional)**:
   ```bash
   npm install @sentry/nextjs
   npx @sentry/wizard -i nextjs
   ```

3. **Supabase Monitoring**:
   - Check database usage
   - Monitor API requests
   - Set up usage alerts

### 8. Security Checklist

- [ ] Environment variables are set correctly
- [ ] Service role key is kept secret (never expose to client)
- [ ] RLS policies are enabled on all tables
- [ ] HTTPS is enforced (automatic with Vercel)
- [ ] CORS is configured properly
- [ ] File upload size limits are set
- [ ] Rate limiting is considered (use Vercel's built-in)

### 9. Launch Checklist

#### Before Public Launch
- [ ] Test with 10-20 beta users
- [ ] Gather initial feedback
- [ ] Fix critical bugs
- [ ] Create Terms of Service page
- [ ] Create Privacy Policy page
- [ ] Set up support email
- [ ] Create social media accounts

#### Marketing Assets
- [ ] App screenshots
- [ ] Demo video
- [ ] Landing page copy
- [ ] Social media graphics

### 10. Scaling Considerations

#### When You Grow
1. **Supabase**:
   - Free tier: Good for 500-1000 users
   - Pro tier ($25/mo): 100K+ users
   - Monitor database size

2. **Vercel**:
   - Free tier: Good for MVP
   - Pro tier ($20/mo): Better for production
   - Unlimited bandwidth on Pro

3. **Storage**:
   - Monitor Supabase storage usage
   - Consider CDN for images at scale
   - Implement image compression

### 11. Backup Strategy

#### Database Backups
- Supabase auto-backups (7 days on Free, 30 days on Pro)
- Export data regularly
- Store exports securely

#### Code Backups
- GitHub is your primary backup
- Tag releases: `git tag v1.0.0`
- Keep old versions accessible

### 12. Troubleshooting

#### Build Fails
```bash
# Test locally first
npm run build

# Check for errors
npm run type-check
```

#### Environment Variable Issues
- Double-check all values
- No trailing spaces
- Restart deployment after changes

#### Database Connection Issues
- Verify Supabase URL
- Check API keys
- Test with Supabase dashboard

#### Image Upload Issues
- Check storage bucket permissions
- Verify file size limits
- Test with different image formats

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Check Supabase logs
3. Test locally with production env vars
4. Consult documentation

## Next Steps After Deployment

1. **Monitor**: Watch logs and analytics for first 48 hours
2. **Iterate**: Fix bugs and improve based on feedback
3. **Market**: Share with target users in Kenya
4. **Scale**: Add Phase 2 features based on demand

---

**Congratulations!** Your Kenya Thrift Marketplace is now live! 🎉

