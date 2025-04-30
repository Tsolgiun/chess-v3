# Security Fix: Removing Firebase Credentials from Git History

## What Was Fixed

The Firebase service account credentials were previously hardcoded in `backend/config/firebase.js`, which was detected by GitHub's push protection. This has been fixed by:

1. Moving all credentials to a `.env` file (which is gitignored)
2. Updating `firebase.js` to use environment variables instead of hardcoded values

## How to Complete the Fix

To fully resolve this issue and be able to push to GitHub, you need to:

### 1. Remove the sensitive file from Git history

Since the credentials were already committed to Git, you need to remove them from the history. Use one of these approaches:

#### Option A: Using BFG Repo-Cleaner (Recommended)

1. Download BFG from: https://rtyley.github.io/bfg-repo-cleaner/
2. Run the following commands:

```bash
# Clone a fresh copy of your repo (BFG works on a fresh clone)
git clone --mirror https://github.com/Tsolgiun/chess-v3.git chess-v3-mirror

# Run BFG to replace the sensitive file with its cleaned version
java -jar bfg.jar --replace-text passwords.txt chess-v3-mirror

# Create a passwords.txt file with content like:
# firebase-adminsdk --> [CREDENTIAL]
# private_key --> [CREDENTIAL]
# client_email --> [CREDENTIAL]

# Clean up and push
cd chess-v3-mirror
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push
```

#### Option B: Using git filter-repo

```bash
# Install git-filter-repo
pip install git-filter-repo

# Clone a fresh copy
git clone https://github.com/Tsolgiun/chess-v3.git fresh-clone
cd fresh-clone

# Remove the sensitive file from history
git filter-repo --path backend/config/firebase.js --invert-paths

# Force push
git push origin --force --all
```

### 2. Update your local repository

After cleaning the remote repository:

```bash
# In your original working directory
git fetch --all
git reset --hard origin/master
```

### 3. Verify the fix

1. Check that `.env` is in your `.gitignore` file (it already is)
2. Verify that `firebase.js` no longer contains hardcoded credentials
3. Make a small change and try pushing again - GitHub should no longer block the push

## Important Security Notes

1. **NEVER commit credentials** to a Git repository, even private ones
2. Always use environment variables for sensitive information
3. Consider rotating your Firebase credentials since they were exposed
4. Add pre-commit hooks to prevent accidentally committing sensitive information in the future

## For Local Development

When setting up the project locally, developers will need to:

1. Create their own `.env` file with the required Firebase credentials
2. Run `npm install` to install dependencies including dotenv
3. Start the server with `npm start`
