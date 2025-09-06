# Quick Vercel Deployment Steps 🚀

Your code is pushed to GitHub and database is being set up. Here are the next steps:

## 1. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import from Git: Select your repository `ereezyy/EDWoo`
4. **IMPORTANT**: Set Root Directory to `WorkOrderWizard`

## 2. Build Configuration

- **Framework Preset**: Other
- **Root Directory**: `WorkOrderWizard`
- **Build Command**: `cd frontend && npm run build`
- **Output Directory**: `frontend/.next`
- **Install Command**: `cd frontend && npm install && cd ../backend && npm install`

## 3. Environment Variables

Add these in Vercel dashboard:

```bash
DATABASE_URL=postgresql://postgres:FoHEdTPiqFFCBZpAEjeoBsoEMnvnqXEl@caboose.proxy.rlwy.net:55685/railway
JWT_SECRET=supersecretjwtkey123
TWILIO_SID=ACe4b6bb365015f97560c46427236d8493
TWILIO_AUTH_TOKEN=f7f851f27b550e8ab970776b925d1e03
TWILIO_PHONE_NUMBER=+18778940293
STRIPE_SECRET_KEY=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
SHOPIFY_ADMIN_API_TOKEN=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
SHOPIFY_API_KEY=3b8884b5137b6f693445512f092bcb2d
SHOPIFY_API_SECRET=0ad884cba1df551a3813a6cfaae05077
XAI_API_KEY=xai-hI30Sx8voDdgwC7dfRYlBwrkAGJF1JwPfr0hvbUtKMArGdaCbT9acyKFpl6qMgx4gh6YmN7IpZH5QkhE
DEEPSEEK_API_KEY=sk-09a77d560ac348639dec5b7289843939
```

**Firebase Config (copy as single line):**

```bash
FIREBASE_CONFIG={"type":"service_account","project_id":"solsino-ba946","private_key_id":"dummy_key_id","private_key":"-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us8cKB\nxIuOAiNQM4+0DpYlo+NiiVVRrk6Bc7XvN0rvwFTJlB50oHI2Ec22LiS4NDEt5AO0\n6rUjfLu9Sf8dNsGYhb4kkbZFRd7k9p8FGln/wFHGkOQkan3sgHAcABRRIG50B4qZ\nT3bgzSI1AAFg7qI9TWuYEmuuLwPa7YHiLdOgHddBQIsTEBYgdcqFXykpBQ0Q4NdN\noGmp4NwKF245g1MRgUr9VBnpXmzSBkkGAkjhcb0WD3DKFSg9T/DgYA0k7JA9B8gH\nSRRzOjzVXvqrJ2gCsGEcHDOAPb9I5Y6OwUjdVBs/kSK3V5Q+IFJEBgaq4uuDqfyV\nBdDFQVEZAgMBAAECggEBALc2lQA0ValVdxV4oXnVEiQXz4UCoaVsqsaEuUNb+1RC\n8RonUVtxbeJRNanLiukLcRK6iEEHyuBdqfvWaM6X5L0+mYzQj+ry1VmFwEi7Z4K\nwA8KjZbQjzQvZeEI+OQOjUCXHFuuXkn9A+nxU8aEXiRAAA2nVU+lLTXI9JpCzAHI\nzU0ea3MYRTn2Yzn2dNBiN5aEGMLiM2HwxmPVMH+/7qvQzABFBuQ5B2VVlrfHGq1q\nwA8KjZbQjzQvZeEI+OQOjUCXHFuuXkn9A+nxU8aEXiRAAA2nVU+lLTXI9JpCzAHI\nzU0ea3MYRTn2Yzn2dNBiN5aEGMLiM2HwxmPVMH+/7qvQzABFBuQ5B2VVlrfHGq1q\nwA8KjZbQjzQvZeEI+OQOjUCXHFuuXkn9A+nxU8aEXiRAAA2nVU+lLTXI9JpCzAHI\nzU0ea3MYRTn2Yzn2dNBiN5aEGMLiM2HwxmPVMH+/7qvQzABFBuQ5B2VVlrfHGq1q\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-dummy@solsino-ba946.iam.gserviceaccount.com","client_id":"000000000000000000000","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-dummy%40solsino-ba946.iam.gserviceaccount.com"}
```

## 4. After First Deployment

Add frontend environment variable:

```bash
NEXT_PUBLIC_API_URL=https://your-vercel-domain.vercel.app/api
```

## 5. Test Your App

1. Visit your Vercel URL
2. Test login functionality
3. Create a work order
4. Verify database connectivity

## Ready to Deploy! ✅

Your GitHub repo: `https://github.com/ereezyy/EDWoo`
Your Railway DB: Connected ✅
Your Vercel Config: Ready ✅

**Next Step**: Go to Vercel and follow the steps above!
