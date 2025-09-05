#!/bin/bash

# WorkOrderWizard Deployment Script
# Deploy backend to SSH server: root@45.56.115.105

echo "🚀 Starting WorkOrderWizard deployment..."

# Build backend
echo "📦 Building backend..."
cd backend
npm run build

# Create deployment package
echo "📦 Creating deployment package..."
tar -czf ../workorder-backend.tar.gz dist/ package.json prisma/ node_modules/

# Upload to server
echo "🌐 Uploading to server..."
scp ../workorder-backend.tar.gz root@45.56.115.105:/root/automation/

# Deploy on server
echo "🔧 Deploying on server..."
ssh root@45.56.115.105 << 'EOF'
cd /root/automation
tar -xzf workorder-backend.tar.gz
sudo pro status
pm2 restart workorder-backend || pm2 start dist/index.js --name workorder-backend
pm2 save
EOF

echo "✅ Backend deployment complete!"

# Frontend deployment instructions
echo "📱 Frontend deployment:"
echo "1. Push code to GitHub"
echo "2. Connect repository to Vercel"
echo "3. Set environment variables in Vercel dashboard"
echo "4. Deploy automatically"

echo "🎉 Deployment process complete!"
