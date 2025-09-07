# WorkOrderWizard Deployment Checklist ✅

## ✅ Completed Steps

- [x] PostgreSQL database set up on Railway
- [x] Database schema deployed to Railway
- [x] Backend restructured for Vercel serverless functions
- [x] Code pushed to GitHub repository: `https://github.com/ereezyy/EDWoo`
- [x] Vercel configuration files created
- [x] All API endpoints converted to serverless functions

## 🚀 Next Steps - Manual Deployment

### Step 1: Deploy to Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "New Project"
4. Import from Git: Select `ereezyy/EDWoo`
5. **CRITICAL**: Set Root Directory to `WorkOrderWizard`

### Step 2: Configure Build Settings

```
Framework Preset: Other
Root Directory: WorkOrderWizard
Build Command: cd frontend && npm run build
Output Directory: frontend/.next
Install Command: cd frontend && npm install && cd ../backend && npm install
```

### Step 3: Add Environment Variables

Copy these exactly into Vercel dashboard:

**Database:**

```
DATABASE_URL=postgresql://postgres:FoHEdTPiqFFCBZpAEjeoBsoEMnvnqXEl@caboose.proxy.rlwy.net:55685/railway
```

**Authentication:**

```
JWT_SECRET=supersecretjwtkey123
```

**Firebase (single line):**

```
FIREBASE_CONFIG={"type":"service_account","project_id":"solsino-ba946","private_key_id":"dummy_key_id","private_key":"-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us8cKB\nxIuOAiNQM4+0DpYlo+NiiVVRrk6Bc7XvN0rvwFTJlB50oHI2Ec22LiS4NDEt5AO0\n6rUjfLu9Sf8dNsGYhb4kkbZFRd7k9p8FGln/wFHGkOQkan3sgHAcABRRIG50B4qZ\nT3bgzSI1AAFg7qI9TWuYEmuuLwPa7YHiLdOgHddBQIsTEBYgdcqFXykpBQ0Q4NdN\noGmp4NwKF245g1MRgUr9VBnpXmzSBkkGAkjhcb0WD3DKFSg9T/DgYA0k7JA9B8gH\nSRRzOjzVXvqrJ2gCsGEcHDOAPb9I5Y6OwUjdVBs/kSK3V5Q+IFJEBgaq4uuDqfyV\nBdDFQVEZAgMBAAECggEBALc2lQA0ValVdxV4oXnVEiQXz4UCoaVsqsaEuUNb+1RC\n8RonUVtxbeJRNanLiukLcRK6iEEHyuBdqfvWaM6X5L0+mYzQj+ry1VmFwEi7Z4K\nwA8KjZbQjzQvZeEI+OQOjUCXHFuuXkn9A+nxU8aEXiRAAA2nVU+lLTXI9JpCzAHI\nzU0ea3MYRTn2Yzn2dNBiN5aEGMLiM2HwxmPVMH+/7qvQzABFBuQ5B2VVlrfHGq1q\nwA8KjZbQjzQvZeEI+OQOjUCXHFuuXkn9A+nxU8aEXiRAAA2nVU+lLTXI9JpCzAHI\nzU0ea3MYRTn2Yzn2dNBiN5aEGMLiM2HwxmPVMH+/7qvQzABFBuQ5B2VVlrfHGq1q\nwA8KjZbQjzQvZeEI+OQOjUCXHFuuXkn9A+nxU8aEXiRAAA2nVU+lLTXI9JpCzAHI\nzU0ea3MYRTn2Yzn2dNBiN5aEGMLiM2HwxmPVMH+/7qvQzABFBuQ5B2VVlrfHGq1q\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-dummy@solsino-ba946.iam.gserviceaccount.com","client_id":"000000000000000000000","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-dummy%40solsino-ba946.iam.gserviceaccount.com"}
```

**Twilio:**

```
TWILIO_SID=ACe4b6bb365015f97560c46427236d8493
TWILIO_AUTH_TOKEN=f7f851f27b550e8ab970776b925d1e03
TWILIO_PHONE_NUMBER=+18778940293
```

**Stripe:**

```
STRIPE_SECRET_KEY=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
```

**Shopify:**

```
SHOPIFY_ADMIN_API_TOKEN=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
SHOPIFY_API_KEY=3b8884b5137b6f693445512f092bcb2d
SHOPIFY_API_SECRET=0ad884cba1df551a3813a6cfaae05077
```

**AI APIs:**

```
XAI_API_KEY=xai-hI30Sx8voDdgwC7dfRYlBwrkAGJF1JwPfr0hvbUtKMArGdaCbT9acyKFpl6qMgx4gh6YmN7IpZH5QkhE
DEEPSEEK_API_KEY=sk-09a77d560ac348639dec5b7289843939
```

### Step 4: Deploy

1. Click "Deploy"
2. Wait for build to complete (5-10 minutes)
3. Note your deployment URL

### Step 5: Add Frontend Environment Variable

After successful deployment, add:

```
NEXT_PUBLIC_API_URL=https://your-vercel-domain.vercel.app/api
```

### Step 6: Redeploy

1. Go to Deployments tab
2. Click "Redeploy" on latest deployment

## 🧪 Testing Checklist

### API Endpoints to Test

- [ ] `GET /api/auth/me` - User profile
- [ ] `POST /api/auth/login` - Firebase login
- [ ] `GET /api/work-orders` - List work orders
- [ ] `POST /api/work-orders` - Create work order
- [ ] `GET /api/users` - List users

### Frontend Features to Test

- [ ] Login functionality
- [ ] Dashboard loads
- [ ] Create work order
- [ ] View work orders
- [ ] User management
- [ ] SMS notifications (Twilio)
- [ ] Payment processing (Stripe)

## 🎯 Success Criteria

- ✅ Application loads without errors
- ✅ Database connectivity working
- ✅ Authentication functional
- ✅ All integrations working (Twilio, Stripe, Firebase, Shopify)
- ✅ API endpoints responding correctly

## 🚨 Troubleshooting

If deployment fails:

1. Check build logs in Vercel dashboard
2. Verify environment variables are set correctly
3. Ensure root directory is set to `WorkOrderWizard`
4. Check function logs for runtime errors

## 📱 Your Live App

Once deployed, your WorkOrderWizard will be live at:
`https://your-project-name.vercel.app`

Ready to deploy! 🚀
