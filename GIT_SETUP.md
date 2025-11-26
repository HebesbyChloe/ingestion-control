# Git Setup & Push Guide

## 📋 Pre-Push Checklist

✅ All linter errors fixed
✅ No temporary test files
✅ Environment variables documented
✅ .gitignore configured
✅ README and QUICKSTART updated

---

## 🚀 Initialize Git & Push

### 1. Initialize Git Repository

```bash
git init
```

### 2. Add Remote Repository

Replace with your actual GitHub/GitLab URL:

```bash
# GitHub example:
git remote add origin https://github.com/your-username/ingestion-control.git

# GitLab example:
git remote add origin https://gitlab.com/your-username/ingestion-control.git
```

### 3. Add All Files

```bash
git add .
```

### 4. Review What Will Be Committed

```bash
git status
```

**Should see:**
- All source code files
- package.json and package-lock.json
- Config files (.mjs, .ts)
- README and QUICKSTART

**Should NOT see:**
- .env.local (secrets)
- node_modules
- .next build folder

### 5. Commit with Message

```bash
git commit -F COMMIT_MESSAGE.txt
```

Or write your own:

```bash
git commit -m "feat: Complete admin panel implementation"
```

### 6. Push to Remote

**First time:**
```bash
git branch -M main
git push -u origin main
```

**Subsequent pushes:**
```bash
git push
```

---

## 🔒 Security Checklist

Before pushing, verify:

- [ ] `.env.local` is in `.gitignore`
- [ ] No API keys in source code
- [ ] No database passwords in code
- [ ] README has placeholder values only

**Check with:**
```bash
git grep "cc0108c5-5939"  # Should find nothing
git grep "GATEWAY_API_KEY"  # Should only find variable names, not values
```

---

## 📦 What Gets Committed

### ✅ Included:
- All source code (app/, components/, lib/, hooks/)
- Configuration (package.json, tsconfig.json, next.config.ts)
- Documentation (README.md, QUICKSTART.md)
- Git configuration (.gitignore)

### ❌ Excluded:
- Environment variables (.env.local)
- Dependencies (node_modules)
- Build output (.next)
- Temporary files (test-*.json)

---

## 🎯 After First Push

### Set Up Vercel Deployment

1. Go to vercel.com
2. Import your git repository
3. Add environment variables:
   ```
   NEXT_PUBLIC_API_GATEWAY_URL=https://api-gateway-dfcflow.fly.dev
   GATEWAY_API_KEY=your-key-here
   NEXT_PUBLIC_GATEWAY_API_KEY=your-key-here
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-key
   ```
4. Deploy!

---

## 🔄 Ongoing Development Workflow

```bash
# After making changes
git add .
git commit -m "feat: description of changes"
git push

# Vercel will auto-deploy on push
```

---

## 🆘 Troubleshooting

### "fatal: not a git repository"
Run: `git init`

### "remote origin already exists"
Run: `git remote remove origin` then add again

### "failed to push"
Check if remote URL is correct: `git remote -v`

### "Permission denied"
Set up SSH keys or use HTTPS with personal access token

---

## 📝 Summary

```bash
# Complete setup in 6 commands:
git init
git remote add origin YOUR_REPO_URL
git add .
git commit -F COMMIT_MESSAGE.txt
git branch -M main
git push -u origin main
```

Done! Your code is now in version control! 🎉

