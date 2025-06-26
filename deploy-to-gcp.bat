@echo off
REM Google Cloud Run Deployment Script for LingoQuiz (Windows)
REM Make sure you have gcloud CLI installed and authenticated

REM Configuration
set PROJECT_ID=translate032625
set SERVICE_NAME=lingoquiz-api
set REGION=us-central1
set IMAGE_NAME=gcr.io/%PROJECT_ID%/%SERVICE_NAME%

echo 🚀 Starting deployment to Google Cloud Run...

REM Check if gcloud is installed
gcloud --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Error: gcloud CLI is not installed. Please install it first:
    echo https://cloud.google.com/sdk/docs/install
    pause
    exit /b 1
)

REM Check if user is authenticated
gcloud auth list --filter=status:ACTIVE --format="value(account)" | findstr /r "." >nul
if errorlevel 1 (
    echo ❌ Error: Not authenticated with gcloud. Please run:
    echo gcloud auth login
    pause
    exit /b 1
)

REM Set the project
echo 📋 Setting project to: %PROJECT_ID%
gcloud config set project %PROJECT_ID%

REM Build and push the Docker image
echo 🔨 Building and pushing Docker image...
gcloud builds submit --tag %IMAGE_NAME%

REM Deploy to Cloud Run
echo 🚀 Deploying to Cloud Run...
gcloud run deploy %SERVICE_NAME% ^
    --image %IMAGE_NAME% ^
    --platform managed ^
    --region %REGION% ^
    --allow-unauthenticated ^
    --port 8080 ^
    --memory 1Gi ^
    --cpu 1 ^
    --max-instances 10 ^
    --set-env-vars "NODE_ENV=production"

REM Get the service URL
for /f "tokens=*" %%i in ('gcloud run services describe %SERVICE_NAME% --region=%REGION% --format="value(status.url)"') do set SERVICE_URL=%%i

echo ✅ Deployment completed successfully!
echo 🌐 Your API is now available at: %SERVICE_URL%
echo.
echo 📱 Update your capacitor.config.ts with:
echo server: {
echo   url: '%SERVICE_URL%',
echo   cleartext: true
echo }
echo.
echo 🔄 Then run: npx cap sync android
pause 