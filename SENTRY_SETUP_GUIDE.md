# 🔍 Sentry Setup - Complete Step-by-Step Guide

## What is Sentry?
Sentry tracks errors in your app and sends you alerts when something breaks. It's like having a watchdog for your application.

---

## ✅ Prerequisites Check

- [x] `@sentry/nextjs` package is installed (version 10.32.1)
- [ ] Sentry account (we'll create this)
- [ ] Sentry project (we'll create this)

---

## 🚀 STEP-BY-STEP SETUP

### **STEP 1: Run Sentry Wizard**

The wizard will:
- Create Sentry config files
- Set up error tracking
- Guide you through account creation

**Run this command:**
```bash
cd "/Users/virajshah/Thrift Reselling Software"
npx @sentry/wizard@latest -i nextjs
```

---

### **STEP 2: Answer Wizard Questions**

The wizard will ask you several questions. Here's what to answer:

#### **Question 1: "Do you have a Sentry account?"**
- **Answer:** `No` (or `n`)
- **Why:** We'll create one during setup

#### **Question 2: "Would you like to create a new account?"**
- **Answer:** `Yes` (or `y`)
- **What happens:** Opens browser to create account

#### **Question 3: "Sign up with..."**
- **Choose:** GitHub, Google, or Email (your preference)
- **Why:** Easier to sign up with existing account

#### **Question 4: "Select data storage location"**
- **Choose:** `Europe` (recommended for Kenya)
- **Why:** Closer to Kenya, GDPR compliant

#### **Question 5: "Create a new project or link existing?"**
- **Answer:** `Create a new project` (or just press Enter)
- **Project name:** `Outfittr` (or press Enter for default)

#### **Question 6: "Select platform"**
- **Answer:** `Next.js` (should auto-detect)
- **Just press Enter**

#### **Question 7: "Configure source maps?"**
- **Answer:** `Yes` (or `y`)
- **Why:** Helps debug errors better

#### **Question 8: "Configure performance monitoring?"**
- **Answer:** `Yes` (or `y`)
- **Why:** Track slow pages and API calls

#### **Question 9: "Configure session replay?"**
- **Answer:** `Yes` (or `y`) - Optional but useful
- **Why:** See what users did before errors

---

### **STEP 3: Wizard Creates Files**

After answering questions, the wizard will:
- ✅ Create `sentry.client.config.ts`
- ✅ Create `sentry.server.config.ts`
- ✅ Create `sentry.edge.config.ts`
- ✅ Update `next.config.js` with Sentry plugin
- ✅ Create `.sentryclirc` file (optional)

**You'll see:** "✓ Sentry successfully installed!"

---

### **STEP 4: Get Your DSN (Data Source Name)**

After setup, you need to get your DSN:

1. **Go to Sentry Dashboard:**
   - Visit: https://sentry.io
   - Login if not already logged in

2. **Navigate to Your Project:**
   - Click on "Outfittr" project (or your project name)
   - Or go to: https://sentry.io/organizations/YOUR-ORG/projects/outfittr/

3. **Get DSN:**
   - Go to: **Settings** → **Projects** → **Outfittr** → **Client Keys (DSN)**
   - Or: **Settings** → **Client Keys (DSN)**
   - Copy the DSN (looks like: `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx`)

4. **Save the DSN:**
   - Write it down or copy to notes
   - You'll add it to Vercel environment variables after deployment

---

### **STEP 5: Verify Setup**

Check that files were created:

```bash
ls -la | grep sentry
```

You should see:
- `sentry.client.config.ts`
- `sentry.server.config.ts`
- `sentry.edge.config.ts`
- `.sentryclirc` (optional)

---

### **STEP 6: Test Build**

Make sure everything still builds:

```bash
npm run build
```

**Expected:** Build succeeds without errors

---

### **STEP 7: Add DSN to Environment Variables (After Deployment)**

**After you deploy to Vercel:**

1. Go to Vercel project dashboard
2. **Settings** → **Environment Variables**
3. Add:
   ```
   SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
   ```
   (Replace with your actual DSN)
4. Select **"Production"** environment
5. Click **"Save"**
6. **Redeploy** your app

---

## 🎯 Quick Reference: What the Wizard Does

1. **Creates config files** for client, server, and edge runtime
2. **Updates next.config.js** with Sentry plugin
3. **Sets up source maps** for better error tracking
4. **Configures performance monitoring** to track slow pages
5. **Sets up session replay** (optional) to see user sessions

---

## 🆘 Troubleshooting

### **"Command not found: npx"**
- Make sure Node.js is installed
- Try: `npm install -g npx`

### **"Wizard stuck or asking weird questions"**
- Press `Ctrl + C` to cancel
- Run wizard again: `npx @sentry/wizard@latest -i nextjs`
- Answer `No` to "Do you have a Sentry account?" if you don't

### **"Can't find DSN"**
- Make sure you're logged into Sentry
- Check you're in the right project
- Look in Settings → Client Keys (DSN)

### **"Build fails after Sentry setup"**
- Check error message
- Make sure all files were created
- Try: `npm install` again
- Check `next.config.js` was updated correctly

---

## ✅ After Setup Checklist

- [ ] Wizard completed successfully
- [ ] Config files created (`sentry.*.config.ts`)
- [ ] `next.config.js` updated
- [ ] DSN copied and saved
- [ ] Build succeeds (`npm run build`)
- [ ] DSN added to Vercel env vars (after deployment)

---

## 🎉 You're Done!

Once setup is complete:
- ✅ Errors will be tracked automatically
- ✅ You'll get alerts when something breaks
- ✅ You can see performance metrics
- ✅ Session replay available (if enabled)

**Next:** Deploy to Vercel and add the DSN to environment variables!
