# WorkOrderWizard Vercel Deployment Guide 🚀

This guide will walk you through deploying your WorkOrderWizard application to Vercel with Railway PostgreSQL database.

## Prerequisites

- GitHub repository with your code
- Vercel account (free tier is fine)
- Railway account (for PostgreSQL database)

## Step 1: Set Up PostgreSQL Database on Railway

### 1.1 Create Railway Account

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Click "New Project"

### 1.2 Deploy PostgreSQL

1. Click "Deploy from Template"
2. Search for "PostgreSQL"
3. Click "Deploy Now"
4. Wait for deployment to complete (2-3 minutes)

### 1.3 Get Database Connection String

1. Click on your PostgreSQL service
2. Go to "Connect" tab
3. Copy the "DATABASE_URL" (starts with `postgresql://`)
4. Save this for later - you'll need it for Vercel environment variables

### 1.4 Run Database Migrations

1. Update your local `.env` file with the Railway DATABASE_URL
2. Run these commands in your backend directory:

```bash
cd WorkOrderWizard/backend
npm install
npx prisma migrate deploy
npx prisma generate
```

## Step 2: Install Dependencies

### 2.1 Install Backend Dependencies

```bash
cd WorkOrderWizard/backend
npm install @vercel/node
```

### 2.2 Install Frontend Dependencies

```bash
cd WorkOrderWizard/frontend
npm install
```

## Step 3: Deploy to Vercel

### 3.1 Connect GitHub Repository

1. Go to [vercel.com](https://vercel.com)
2. Sign up/login with GitHub
3. Click "New Project"
4. Import your GitHub repository
5. **Important**: Set Root Directory to `WorkOrderWizard` (not the default)

### 3.2 Configure Build Settings

- **Framework Preset**: Other
- **Root Directory**: `WorkOrderWizard`
- **Build Command**: `cd frontend && npm run build`
- **Output Directory**: `frontend/.next`
- **Install Command**: `cd frontend && npm install && cd ../backend && npm install`

### 3.3 Add Environment Variables

In the Vercel dashboard, add these environment variables:

**Database & Auth:**

```
DATABASE_URL=your_railway_database_url_here
JWT_SECRET=supersecretjwtkey123
FIREBASE_CONFIG=your_firebase_config_json_here
```

**Twilio (SMS):**

```
TWILIO_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
```

**Stripe (Payments):**

```
STRIPE_SECRET_KEY=your_stripe_secret_key
```

**Shopify (Optional):**

```
SHOPIFY_ADMIN_API_TOKEN=your_shopify_token
SHOPIFY_API_KEY=your_shopify_api_key
SHOPIFY_API_SECRET=your_shopify_api_secret
```

**AI APIs (Optional):**

```
XAI_API_KEY=your_xai_api_key
DEEPSEEK_API_KEY=your_deepseek_api_key
```

### 3.4 Deploy

1. Click "Deploy"
2. Wait for deployment (5-10 minutes)
3. Your app will be live at `https://your-project-name.vercel.app`

## Step 4: Configure Frontend Environment Variables

### 4.1 Update Frontend Environment

1. In Vercel dashboard, go to your project settings
2. Add frontend environment variable:

```
NEXT_PUBLIC_API_URL=https://your-project-name.vercel.app/api
```

### 4.2 Redeploy

1. Go to "Deployments" tab
2. Click "Redeploy" on the latest deployment

## Step 5: Test Your Deployment

### 5.1 Test API Endpoints

Visit these URLs to test your API:

- `https://your-project-name.vercel.app/api/auth/login` (POST)
- `https://your-project-name.vercel.app/api/work-orders` (GET)
- `https://your-project-name.vercel.app/api/users` (GET)

### 5.2 Test Frontend

1. Visit `https://your-project-name.vercel.app`
2. Try logging in
3. Create a work order
4. Test all functionality

## Troubleshooting

### Common Issues

**1. Build Fails:**

- Check that all dependencies are installed
- Verify your `vercel.json` configuration
- Check build logs in Vercel dashboard

**2. Database Connection Issues:**

- Verify DATABASE_URL is correct
- Ensure Railway database is running
- Check that migrations were applied

**3. API Errors:**

- Check environment variables are set correctly
- Look at function logs in Vercel dashboard
- Verify CORS settings

**4. Firebase Auth Issues:**

- Ensure FIREBASE_CONFIG is valid JSON
- Check Firebase project settings
- Verify API keys are correct

### Getting Help

1. Check Vercel function logs
2. Check Railway database logs
3. Test API endpoints individually
4. Verify all environment variables

## Next Steps

### Optional Enhancements

1. **Custom Domain**: Add your own domain in Vercel settings
2. **Monitoring**: Set up error tracking with Sentry
3. **Analytics**: Add Vercel Analytics
4. **Performance**: Enable Vercel Speed Insights

### Security

1. Review and rotate API keys regularly
2. Set up proper CORS policies
3. Enable rate limiting if needed
4. Monitor usage and costs

## Environment Variables Reference

Copy these values from your existing `.env` files:

**From `backend/.env`:**

- DATABASE_URL (use Railway URL instead)
- JWT_SECRET
- TWILIO_SID
- TWILIO_AUTH_TOKEN
- TWILIO_PHONE_NUMBER
- STRIPE_SECRET_KEY
- FIREBASE_CONFIG
- SHOPIFY_ADMIN_API_TOKEN
- SHOPIFY_API_KEY
- SHOPIFY_API_SECRET
- XAI_API_KEY
- DEEPSEEK_API_KEY

**From `frontend/.env_temp`:**

- NEXT_PUBLIC_API_URL (set to your Vercel domain + /api)

## Success! 🎉

Your WorkOrderWizard application should now be live on Vercel with:

- ✅ PostgreSQL database on Railway
- ✅ Serverless API functions
- ✅ Next.js frontend
- ✅ All integrations working (Twilio, Stripe, Firebase, Shopify)

Visit your live application at: `https://your-project-name.vercel.app`
