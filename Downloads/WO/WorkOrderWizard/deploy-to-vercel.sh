#!/bin/bash

echo "🚀 WorkOrderWizard Vercel Deployment Script"
echo "==========================================="

# Check if we're in the right directory
if [ ! -f "vercel.json" ]; then
    echo "❌ Error: vercel.json not found. Please run this script from the WorkOrderWizard directory."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
cd frontend && npm install
cd ../backend && npm install

# Install Vercel CLI if not present
if ! command -v vercel &> /dev/null; then
    echo "🔧 Installing Vercel CLI..."
    npm install -g vercel
fi

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
echo "⚠️  Make sure you have:"
echo "   1. Set up Railway PostgreSQL database"
echo "   2. Configured all environment variables in Vercel dashboard"
echo "   3. Pushed your code to GitHub"
echo ""
echo "Press Enter to continue or Ctrl+C to cancel..."
read

vercel --prod

echo "✅ Deployment complete!"
echo "📋 Next steps:"
echo "   1. Go to your Vercel dashboard"
echo "   2. Add environment variables (see VERCEL_DEPLOYMENT_GUIDE.md)"
echo "   3. Test your deployment"
echo "   4. Configure custom domain (optional)"
