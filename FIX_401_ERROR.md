# Fix: "Missing or invalid credentials" Error (401)

## Quick Fix Steps

### Option 1: Clear Cached Credentials Manually

1. **Open Keychain Access**:
   - Press `Cmd + Space` to open Spotlight
   - Type "Keychain Access" and press Enter

2. **Search for GitHub credentials**:
   - In the search box, type: `github.com`
   - Look for entries like "github.com" or "git:https://github.com"

3. **Delete the old credentials**:
   - Right-click on any GitHub entries
   - Click **Delete**
   - Confirm deletion

4. **Try pushing again**:
   ```bash
   git push -u origin main
   ```

---

### Option 2: Use PAT Token in URL (Temporary - for testing)

**⚠️ This is just to test - we'll remove the token from URL after**

Replace `YOUR_TOKEN` with your actual PAT token:

```bash
git remote set-url origin https://YOUR_TOKEN@github.com/Vshah513/Outfittr-platform.git
```

Then push:
```bash
git push -u origin main
```

**After it works, remove the token from URL:**
```bash
git remote set-url origin https://github.com/Vshah513/Outfittr-platform.git
```

---

### Option 3: Verify Your PAT Token is Correct

**Common issues:**

1. **Token doesn't have `repo` scope**:
   - Go to: https://github.com/settings/tokens
   - Check your token has `repo` checkbox checked
   - If not, create a new token with `repo` scope

2. **Token was copied incorrectly**:
   - Make sure you copied the ENTIRE token (starts with `ghp_` and is very long)
   - No spaces before or after
   - Try copying it again from GitHub

3. **Token expired or was revoked**:
   - Create a new token if the old one doesn't work

4. **Wrong username**:
   - Make sure you're using `Vshah513` as the username (not email)
   - When Git prompts for username, enter: `Vshah513`
   - When Git prompts for password, paste the PAT token

---

### Option 4: Create a Fresh PAT Token

1. Go to: https://github.com/settings/tokens/new
2. **Note**: "Local Development" or any name
3. **Expiration**: Choose your preference
4. **Select scopes**: Check **`repo`** (this is the most important!)
5. Click **Generate token**
6. **Copy the token** (starts with `ghp_`)
7. Try pushing again with the new token

---

### Option 5: Use Git Credential Store (Alternative)

If Keychain isn't working, try using a file-based credential store:

```bash
# Set credential helper to store in a file
git config --global credential.helper store

# Try pushing (it will prompt for credentials)
git push -u origin main
# Enter username: Vshah513
# Enter password: [paste your PAT token]

# Credentials will be saved in ~/.git-credentials
```

---

## Step-by-Step: What to Enter When Prompted

When you run `git push -u origin main`, Git will prompt you:

```
Username for 'https://github.com': 
```
**Enter**: `Vshah513` (your GitHub username, NOT your email)

```
Password for 'https://Vshah513@github.com': 
```
**Enter**: Your PAT token (the long string starting with `ghp_`)

**Important**: 
- Don't type your GitHub password
- Paste the PAT token you created
- The token should be very long (40+ characters)

---

## Verify Your Token Works

Test your token directly:

```bash
curl -H "Authorization: token YOUR_PAT_TOKEN" https://api.github.com/user
```

Replace `YOUR_PAT_TOKEN` with your actual token. You should see your user info in JSON format.

---

## Still Not Working?

1. **Check repository exists**: 
   - Visit: https://github.com/Vshah513/Outfittr-platform
   - Make sure the repository exists and you have access

2. **Check token permissions**:
   - Go to: https://github.com/settings/tokens
   - Verify your token has `repo` scope

3. **Try SSH instead** (if HTTPS keeps failing):
   - Set up SSH keys (see main guide)
   - Use: `git remote set-url origin git@github.com:Vshah513/Outfittr-platform.git`

---

## Quick Test Command

Try this to see what error you get:

```bash
git ls-remote origin
```

This will try to connect and show you the exact error message.
