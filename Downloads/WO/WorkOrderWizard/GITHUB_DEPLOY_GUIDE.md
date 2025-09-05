# Deploy WorkOrderWizard via GitHub → Vercel 🚀

## Step 1: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `workorder-wizard-ymca` (or whatever you prefer)
3. Make it **Public** (easier for Vercel)
4. Don't initialize with README (we already have code)
5. Click "Create repository"

## Step 2: Push Your Code to GitHub

Copy these commands and run them ONE AT A TIME in Command Prompt:

```bash
cd c:\Users\EDWoo\Downloads\WO\WorkOrderWizard

git remote add origin https://github.com/ereezyy/workorder-wizard-ymca.git

git branch -M main

git push -u origin main
```

**Replace `YOUR_USERNAME` with your actual GitHub username!**

## Step 3: Deploy from GitHub to Vercel

1. Go to https://vercel.com/eddywoods
2. Click "Add New" → "Project"  
3. Click "Import Git Repository"
4. Find your `workorder-wizard-ymca` repo and click "Import"
5. **IMPORTANT**: Set Root Directory to `frontend`
6. Framework will auto-detect as Next.js
7. Add Environment Variable:
   - Name: `NEXT_PUBLIC_API_URL`
   - Value: `https://45.56.115.105:3001`
8. Click "Deploy"

## What I Already Did ✅
- ✅ Initialized Git repository
- ✅ Added all files to Git
- ✅ Made initial commit
- ✅ Created proper .gitignore
- ✅ Set up environment variables

## If You Get Stuck
Just copy-paste any error messages and I'll help you fix them!
