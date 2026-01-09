# 🔐 Fix GitHub Authentication - Step by Step

## The Problem
GitHub no longer accepts passwords. You need a **Personal Access Token**.

---

## ✅ STEP-BY-STEP SOLUTION

### **STEP 1: Create Personal Access Token**

1. **Go to GitHub Token Settings:**
   - Open: **https://github.com/settings/tokens**
   - Or: GitHub.com → Your Profile (top right) → Settings → Developer settings → Personal access tokens → Tokens (classic)

2. **Generate New Token:**
   - Click **"Generate new token"** → **"Generate new token (classic)"**

3. **Configure Token:**
   - **Note**: `Outfittr Deployment`
   - **Expiration**: Choose **90 days** or **"No expiration"** (your choice)
   - **Select scopes**: ✅ Check **`repo`** (this gives full control of repositories)
     - This is the only scope you need for pushing code

4. **Generate:**
   - Click **"Generate token"** at the bottom
   - **⚠️ IMPORTANT:** Copy the token immediately! It looks like:
     ```
     ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
     ```
   - You won't be able to see it again!

5. **Save the Token:**
   - Paste it somewhere safe (Notes app, password manager, etc.)
   - You'll need it in the next step

---

### **STEP 2: Push to GitHub Using Token**

Now push your code:

```bash
cd "/Users/virajshah/Thrift Reselling Software"
git push origin main
```

**When prompted:**
- **Username**: `Outfittr-app` (or your GitHub username)
- **Password**: **Paste your Personal Access Token** (the `ghp_...` token you just created)
  - ⚠️ **NOT your GitHub password!** Use the token!

**If it still asks for password:**
- Make sure you're pasting the token (starts with `ghp_`)
- Make sure you selected the `repo` scope
- Try again

---

### **STEP 3: Verify Push Succeeded**

After pushing, check:

```bash
git status
```

You should see: `Your branch is up to date with 'origin/main'`

Or visit: **https://github.com/Outfittr-app/Outfittr-platform**
- You should see all your files there

---

## 🆘 Troubleshooting

**"Repository not found" error?**
- Check that the repository exists at: https://github.com/Outfittr-app/Outfittr-platform
- Make sure you have access to the `Outfittr-app` organization
- Verify the repository name is correct

**"Authentication failed" error?**
- Make sure you're using the token (starts with `ghp_`), not your password
- Verify the token has `repo` scope
- Try generating a new token

**Token not working?**
- Check token hasn't expired
- Verify you selected `repo` scope
- Make sure you copied the entire token

---

## ✅ After Successful Push

Once your code is on GitHub:
1. ✅ Code is backed up
2. ✅ Ready to deploy to Vercel
3. ✅ Can connect Vercel to GitHub for auto-deployments

Then proceed with deployment!
