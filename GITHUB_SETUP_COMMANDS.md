# 🚀 Commands to Push to GitHub

## Your Code is NOT on GitHub Yet

Here's exactly what to do:

---

## STEP 1: Create GitHub Repository

1. Go to **https://github.com** and sign in
2. Click **"+"** → **"New repository"**
3. Name it: `outfittr` (or any name)
4. Choose **Public** or **Private**
5. **DO NOT** check "Initialize with README"
6. Click **"Create repository"**
7. **Copy the repository URL** (looks like: `https://github.com/YOUR-USERNAME/outfittr.git`)

---

## STEP 2: Run These Commands in Terminal

Open your terminal in this folder and run:

```bash
# Navigate to your project (if not already there)
cd "/Users/virajshah/Thrift Reselling Software"

# Add all files (except those in .gitignore)
git add .

# Commit your code
git commit -m "Initial commit - Ready for deployment"

# Add GitHub as remote (REPLACE with your actual GitHub URL)
git remote add origin https://github.com/YOUR-USERNAME/REPO-NAME.git

# Push to GitHub
git branch -M main
git push -u origin main
```

**Important:** Replace `YOUR-USERNAME` and `REPO-NAME` with your actual GitHub username and repository name!

---

## STEP 3: After Pushing

Once pushed:
1. Go to **vercel.com**
2. Click **"Add New Project"**
3. Import your GitHub repository
4. Deploy!

---

## Troubleshooting

**If you get "remote already exists" error:**
```bash
git remote remove origin
git remote add origin https://github.com/YOUR-USERNAME/REPO-NAME.git
```

**If you get authentication errors:**
- You may need to use a Personal Access Token
- Or use GitHub CLI: `gh auth login`

**If files won't add:**
- Check `.gitignore` - some files are intentionally ignored
- That's normal and correct!

---

## What Gets Pushed

✅ All your code files
✅ Configuration files
✅ Documentation
❌ `.env.local` (ignored - good!)
❌ `node_modules` (ignored - good!)
❌ Other sensitive files (ignored - good!)
