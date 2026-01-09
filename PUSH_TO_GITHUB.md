# 📤 Push Your Code to GitHub

## Step-by-Step Instructions

### STEP 1: Create a GitHub Repository

1. Go to [github.com](https://github.com) and sign in
2. Click the **"+"** icon in the top right → **"New repository"**
3. Fill in:
   - **Repository name**: `outfittr` (or any name you like)
   - **Description**: "Thrift Reselling Marketplace - Full Stack Next.js App"
   - **Visibility**: Choose **Public** or **Private**
   - **DO NOT** check "Initialize with README" (you already have code)
4. Click **"Create repository"**

### STEP 2: Copy Your Repository URL

After creating the repo, GitHub will show you a URL like:
```
https://github.com/YOUR-USERNAME/outfittr.git
```

**Copy this URL** - you'll need it in the next step.

### STEP 3: Push Your Code

Run these commands in your terminal (I'll help you with this):

```bash
# 1. Add all files
git add .

# 2. Commit
git commit -m "Initial commit - Ready for deployment"

# 3. Add GitHub remote (replace with YOUR actual URL)
git remote add origin https://github.com/YOUR-USERNAME/outfittr.git

# 4. Push to GitHub
git branch -M main
git push -u origin main
```

---

## After Pushing to GitHub

Once your code is on GitHub:
1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository
4. Deploy!

---

## Need Help?

If you get errors:
- Make sure you're logged into GitHub
- Check that the repository name matches
- Verify the URL is correct
