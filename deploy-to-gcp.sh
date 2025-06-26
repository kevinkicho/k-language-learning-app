#!/bin/bash

# Google Cloud Run Deployment Script for LingoQuiz
# Make sure you have gcloud CLI installed and authenticated

# Configuration
PROJECT_ID="translate032625"  # Your Google Cloud Project ID
SERVICE_NAME="lingoquiz-api"
REGION="us-central1"
IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME"

echo "🚀 Starting deployment to Google Cloud Run..."

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ Error: gcloud CLI is not installed. Please install it first:"
    echo "https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if user is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "❌ Error: Not authenticated with gcloud. Please run:"
    echo "gcloud auth login"
    exit 1
fi

# Set the project
echo "📋 Setting project to: $PROJECT_ID"
gcloud config set project $PROJECT_ID

# Build and push the Docker image
echo "🔨 Building and pushing Docker image..."
gcloud builds submit --tag $IMAGE_NAME

# Deploy to Cloud Run
echo "🚀 Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
    --image $IMAGE_NAME \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --port 8080 \
    --memory 1Gi \
    --cpu 1 \
    --max-instances 10 \
    --set-env-vars "NODE_ENV=production"

# Get the service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)")

echo "✅ Deployment completed successfully!"
echo "🌐 Your API is now available at: $SERVICE_URL"
echo ""
echo "📱 Update your capacitor.config.ts with:"
echo "server: {"
echo "  url: '$SERVICE_URL',"
echo "  cleartext: true"
echo "}"
echo ""
echo "🔄 Then run: npx cap sync android" 