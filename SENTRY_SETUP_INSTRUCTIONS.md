# 🔍 Sentry Setup - Run This in Your Terminal

## ⚠️ Important: Run This Command in YOUR Terminal

The Sentry wizard needs an interactive terminal. **You need to run this command yourself** in your terminal (not through me).

---

## 🚀 STEP-BY-STEP INSTRUCTIONS

### **STEP 1: Open Your Terminal**

Open Terminal (or iTerm, or your terminal app) and navigate to your project:

```bash
cd "/Users/virajshah/Thrift Reselling Software"
```

---

### **STEP 2: Run Sentry Wizard**

Copy and paste this command:

```bash
npx @sentry/wizard@latest -i nextjs
```

Press Enter.

---

### **STEP 3: Answer the Questions**

The wizard will ask you questions. Here's what to answer:

#### **Question 1: "Do you have a Sentry account?"**
```
❯ No
```
- Type: `n` or `No` or just press Enter if "No" is selected
- **If you don't have an account:** Choose "No"

#### **Question 2: "Would you like to create a new account?"**
```
❯ Yes
```
- Type: `y` or `Yes`
- This will open your browser to create an account

#### **In Browser (Account Creation):**
- Choose sign-up method: **GitHub**, **Google**, or **Email**
- Fill in your details
- **Select data storage location:** Choose **"Europe"** (recommended for Kenya)
- Complete sign-up

#### **Question 3: "Create a new project or link existing?"**
```
❯ Create a new project
```
- Just press Enter (default is usually "Create new project")

#### **Question 4: "Project name"**
```
Outfittr
```
- Type: `Outfittr` or press Enter for default

#### **Question 5: "Select platform"**
```
❯ Next.js
```
- Should auto-detect "Next.js"
- Just press Enter

#### **Question 6: "Configure source maps?"**
```
❯ Yes
```
- Type: `y` or `Yes`
- This helps debug errors better

#### **Question 7: "Configure performance monitoring?"**
```
❯ Yes
```
- Type: `y` or `Yes`
- This tracks slow pages

#### **Question 8: "Configure session replay?"**
```
❯ Yes
```
- Type: `y` or `Yes` (optional but useful)
- This lets you see what users did before errors

---

### **STEP 4: Wait for Setup to Complete**

The wizard will:
- ✅ Create `sentry.client.config.ts`
- ✅ Create `sentry.server.config.ts`
- ✅ Create `sentry.edge.config.ts`
- ✅ Update `next.config.js`
- ✅ Create `.sentryclirc` (optional)

**You'll see:** `✓ Sentry successfully installed!`

---

### **STEP 5: Get Your DSN**

After setup completes:

1. **Go to Sentry Dashboard:**
   - Visit: https://sentry.io
   - Make sure you're logged in

2. **Find Your Project:**
   - Click on "Outfittr" project
   - Or go to: https://sentry.io/organizations/YOUR-ORG/projects/outfittr/

3. **Get DSN:**
   - Click: **Settings** (gear icon)
   - Click: **Projects** → **Outfittr**
   - Click: **Client Keys (DSN)**
   - **Copy the DSN** (looks like: `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx`)

4. **Save the DSN:**
   - Write it down or copy to a note
   - You'll need it when adding to Vercel environment variables

---

### **STEP 6: Verify Setup**

Check that files were created:

```bash
ls -la | grep sentry
```

You should see:
- `sentry.client.config.ts`
- `sentry.server.config.ts`
- `sentry.edge.config.ts`

---

### **STEP 7: Test Build**

Make sure everything still builds:

```bash
npm run build
```

**Expected:** Build succeeds without errors

---

## 🎯 Quick Command Reference

```bash
# 1. Navigate to project
cd "/Users/virajshah/Thrift Reselling Software"

# 2. Run wizard
npx @sentry/wizard@latest -i nextjs

# 3. Answer questions (see above)

# 4. Verify files created
ls -la | grep sentry

# 5. Test build
npm run build
```

---

## 🆘 Troubleshooting

### **"I don't have a Sentry account"**
- Answer "No" when asked
- Choose "Yes" to create one
- Sign up in the browser that opens

### **"Which data storage location?"**
- Choose **"Europe"** (closest to Kenya, GDPR compliant)

### **"Wizard stuck or not responding"**
- Press `Ctrl + C` to cancel
- Run the command again
- Make sure you're in the project directory

### **"Can't find DSN"**
- Make sure you're logged into Sentry
- Go to: Settings → Projects → Outfittr → Client Keys (DSN)
- The DSN is usually at the top of the page

---

## ✅ After Setup Checklist

- [ ] Wizard completed successfully
- [ ] Config files created
- [ ] DSN copied and saved
- [ ] Build succeeds
- [ ] Ready to add DSN to Vercel (after deployment)

---

## 📝 What to Do After Setup

1. ✅ **Save your DSN** - You'll need it later
2. ✅ **Test build** - Make sure everything works
3. ✅ **Deploy to Vercel** - Deploy your app
4. ✅ **Add DSN to Vercel** - Add `SENTRY_DSN` environment variable
5. ✅ **Redeploy** - Redeploy after adding env var

---

**That's it! Run the wizard in your terminal and follow the prompts.** 🚀
