# Google Cloud Setup Guide for LingoQuiz

This guide will help you deploy your LingoQuiz Next.js API to Google Cloud Run, making your mobile app work anywhere without needing your PC to be running.

## Prerequisites

1. **Google Cloud Account** - You already have this since you're using Google APIs
2. **Google Cloud CLI (gcloud)** - Install from: https://cloud.google.com/sdk/docs/install
3. **Docker** - Install from: https://docs.docker.com/get-docker/

## Step 1: Install and Authenticate Google Cloud CLI

### Windows:
```bash
# Download and install from: https://cloud.google.com/sdk/docs/install
# Then authenticate:
gcloud auth login
gcloud config set project translate032625
```

### macOS/Linux:
```bash
# Install via curl
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
gcloud init
```

## Step 2: Enable Required APIs

Run these commands to enable the necessary Google Cloud services:

```bash
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
```

## Step 3: Deploy Your App

### Option A: Use the Automated Script (Recommended)

**Windows:**
```bash
deploy-to-gcp.bat
```

**macOS/Linux:**
```bash
chmod +x deploy-to-gcp.sh
./deploy-to-gcp.sh
```

### Option B: Manual Deployment

```bash
# Build and push Docker image
gcloud builds submit --tag gcr.io/translate032625/lingoquiz-api

# Deploy to Cloud Run
gcloud run deploy lingoquiz-api \
  --image gcr.io/translate032625/lingoquiz-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --memory 1Gi \
  --cpu 1 \
  --max-instances 10
```

## Step 4: Set Environment Variables

After deployment, set your environment variables in the Google Cloud Console:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to Cloud Run > lingoquiz-api
3. Click "Edit & Deploy New Revision"
4. Under "Variables & Secrets", add:
   - `GOOGLE_GEMINI_API_KEY` = your Gemini API key
   - `GOOGLE_CLOUD_API_KEY` = your Google Cloud API key
   - `GOOGLE_CLOUD_PROJECT_ID` = translate032625
   - `GOOGLE_CLOUD_KEY_FILENAME` = translate032625-47af80242d72.json

## Step 5: Update Your Mobile App

Once deployment is complete, you'll get a URL like:
`https://lingoquiz-api-xxxxxx.a.run.app`

Update your `capacitor.config.ts`:

```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lingoquiz.app',
  appName: 'lingoquiz',
  webDir: '.next',
  server: {
    url: 'https://lingoquiz-api-xxxxxx.a.run.app', // Your Cloud Run URL
    cleartext: true
  }
};

export default config;
```

Then sync with Android:
```bash
npx cap sync android
```

## Step 6: Test Your App

1. Build and run your app in Android Studio
2. Your app should now work without needing `npm run dev` running
3. Test all features: adding sentences, quizzes, audio generation

## Troubleshooting

### Common Issues:

1. **"Permission denied" errors:**
   ```bash
   gcloud auth login
   gcloud config set project translate032625
   ```

2. **Build fails:**
   - Make sure Docker is running
   - Check that all files are committed

3. **Environment variables not working:**
   - Verify they're set in Cloud Run console
   - Redeploy after setting variables

4. **Mobile app can't connect:**
   - Check the URL in capacitor.config.ts
   - Ensure the Cloud Run service is public (--allow-unauthenticated)

### Monitoring and Logs:

```bash
# View logs
gcloud logs read --service=lingoquiz-api --limit=50

# Check service status
gcloud run services describe lingoquiz-api --region=us-central1
```

## Cost Optimization

- Cloud Run only charges when your app is being used
- Free tier includes 2 million requests per month
- Set max-instances to control costs

## Next Steps

Once deployed, your app will:
- ✅ Work on any device, anywhere
- ✅ Scale automatically based on usage
- ✅ Have reliable uptime
- ✅ Be production-ready

Your mobile app is now truly standalone! 🎉 