# Final Deployment Steps 🎯

## Step 1: Find Your Vercel Domain

In your Vercel dashboard, look for your deployed project. The domain will be displayed prominently, something like:

- `workorder-wizard-abc123.vercel.app`
- `edwoo-xyz789.vercel.app`
- Or similar

## Step 2: Add Frontend Environment Variable

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add this variable (replace with YOUR actual domain):

```
Name: NEXT_PUBLIC_API_URL
Value: https://YOUR-ACTUAL-DOMAIN.vercel.app/api
```

## Step 3: Redeploy

1. Go to Deployments tab
2. Click "Redeploy" on the latest deployment
3. Wait for redeployment to complete

## Step 4: Test Your Deployment

Once redeployed, test these URLs (replace with your domain):

**Frontend:**

- `https://YOUR-DOMAIN.vercel.app` - Main app

**API Endpoints:**

- `https://YOUR-DOMAIN.vercel.app/api/auth/me` - Should return auth info
- `https://YOUR-DOMAIN.vercel.app/api/work-orders` - Should return work orders
- `https://YOUR-DOMAIN.vercel.app/api/users` - Should return users

## Step 5: Verify Everything Works

- ✅ Site loads without errors
- ✅ Database connectivity working
- ✅ Authentication functional
- ✅ API endpoints responding
- ✅ All integrations working

## 🎉 Success

Your WorkOrderWizard is now live with:

- Next.js frontend on Vercel
- Serverless API functions on Vercel
- PostgreSQL database on Railway
- All integrations (Twilio, Stripe, Firebase, Shopify) configured

**Share your domain when you find it and I'll help you test everything!**
