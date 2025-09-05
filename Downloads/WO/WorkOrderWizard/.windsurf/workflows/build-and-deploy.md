# Build and Deploy Workflow

This workflow automates the build and deployment process for WorkOrderWizard.

## Steps

### 1. Install Dependencies
```bash
# Install backend dependencies
cd backend && pnpm install

# Install frontend dependencies
cd ../frontend && pnpm install
```

### 2. Lint Code
```bash
# Lint backend code
cd backend && pnpm lint

# Lint frontend code
cd ../frontend && pnpm lint
```

### 3. Build Applications
```bash
# Build backend
cd backend && pnpm build

# Build frontend
cd ../frontend && pnpm build
```

### 4. Deploy to Server
```bash
# SSH to production server
ssh root@45.56.115.105

# Navigate to automation directory
cd /root/automation

# Check system status
sudo pro status

# Deploy backend (example commands)
pm2 restart workorder-backend

# Deploy frontend (example commands)
# Frontend should be deployed to Vercel separately
```

## Error Handling

If any step fails:
1. Use Cascade's "Explain and Fix" feature
2. Check logs for specific error messages
3. Verify environment variables are set correctly
4. Ensure all dependencies are installed

## Usage

Run this workflow with the slash command: `/build-and-deploy`

## Environment Requirements

- Node.js 18+
- pnpm package manager
- SSH access to production server
- Valid environment variables in .env files
