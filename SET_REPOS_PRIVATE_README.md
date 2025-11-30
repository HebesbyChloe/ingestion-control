# Set GitHub Repositories to Private

This script sets all repositories for a GitHub user/organization to private.

## Prerequisites

1. **Node.js 18+** (for native `fetch` support)
2. **GitHub Personal Access Token** with `repo` scope

## Getting a GitHub Personal Access Token

1. Go to https://github.com/settings/tokens
2. Click **"Generate new token (classic)"**
3. Give it a descriptive name (e.g., "Set Repos Private")
4. Select the **`repo`** scope (this gives full control of private repositories)
5. Click **"Generate token"**
6. **Copy the token immediately** - you won't be able to see it again!

## Usage

```bash
cd ingestion-control
node set-repos-private.js <username> <github-token>
```

### Example

```bash
node set-repos-private.js huynhnong ghp_xxxxxxxxxxxxx
```

## What the Script Does

1. ✅ Fetches all repositories for the specified user/organization
2. ✅ Identifies which repositories are currently public
3. ✅ Shows you a list of repositories that will be set to private
4. ✅ Sets each public repository to private
5. ✅ Provides a summary of the operation

## Features

- **Safe**: Shows you what will be changed before making changes
- **Rate-limited**: Includes small delays to respect GitHub API limits
- **Error handling**: Continues processing even if some repos fail
- **Detailed output**: Shows progress and results for each repository

## Output Example

```
📦 Fetching repositories for huynhnong...
   Found 25 repositories so far...

📊 Found 25 total repositories
   - 10 already private
   - 15 need to be set to private

⚠️  About to set 15 repositories to private:
   - huynhnong/repo1
   - huynhnong/repo2
   ...

🔄 Setting repositories to private...

✅ huynhnong/repo1 → Private
✅ huynhnong/repo2 → Private
...

==================================================
📊 Summary:
   ✅ Successfully set to private: 15
   ❌ Failed: 0
   🔒 Already private: 10
   📦 Total repositories: 25

✅ Successfully set 15 repository/repositories to private!
```

## Notes

- The script respects GitHub API rate limits (5000 requests/hour)
- It skips repositories that are already private
- If a repository update fails, the script continues with the others
- The script works for both user accounts and organizations

## Troubleshooting

### "User/Organization not found"
- Check that the username is correct (case-sensitive)
- Make sure the token has access to the account

### "Invalid or expired GitHub token"
- Generate a new token at https://github.com/settings/tokens
- Make sure the token has the `repo` scope

### "Network error"
- Check your internet connection
- GitHub API might be temporarily unavailable

## Security

⚠️ **Important**: Never commit your GitHub token to version control!

- The token is passed as a command-line argument
- Consider using environment variables for better security:

```bash
# Windows PowerShell
$env:GITHUB_TOKEN="ghp_xxxxxxxxxxxxx"
node set-repos-private.js huynhnong $env:GITHUB_TOKEN

# Windows CMD
set GITHUB_TOKEN=ghp_xxxxxxxxxxxxx
node set-repos-private.js huynhnong %GITHUB_TOKEN%

# Linux/Mac
export GITHUB_TOKEN="ghp_xxxxxxxxxxxxx"
node set-repos-private.js huynhnong $GITHUB_TOKEN
```

