# Google Gemini AI Setup Guide

This guide will help you set up Google's Gemini AI API for the Spanish Language Learning App.

## Step 1: Get a Google Cloud Account

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account or create a new one
3. Create a new project or select an existing one

## Step 2: Enable the Gemini API

1. In the Google Cloud Console, go to the **APIs & Services** > **Library**
2. Search for "Gemini API"
3. Click on "Gemini API" and then click **Enable**

## Step 3: Get Your API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with the same Google account
3. Click **Create API Key**
4. Copy the generated API key (it will look like: `AIzaSyC...`)

## Step 4: Add the API Key to Your Environment

1. In your project root, create a `.env.local` file (if it doesn't exist)
2. Add your API key:

```env
GOOGLE_GEMINI_API_KEY=your_actual_api_key_here
```

## Step 5: Test the Setup

1. Start your development server: `npm run dev`
2. Go to the AI Quiz Generator section
3. Try a simple request like: "I want to learn useful Spanish sentences for travel"
4. You should see a quiz generated with Spanish sentences and translations

## Troubleshooting

### "GOOGLE_GEMINI_API_KEY environment variable is required"
- Make sure you've added the API key to your `.env.local` file
- Restart your development server after adding the environment variable
- Check that there are no extra spaces or quotes around the API key

### "Gemini API error: 403"
- Make sure you've enabled the Gemini API in Google Cloud Console
- Verify your API key is correct
- Check that you're using the API key from Google AI Studio, not Google Cloud Console

### "No response from Gemini AI"
- Check your internet connection
- Verify the API key is valid
- Try a simpler request first

## API Usage and Limits

- The Gemini API has generous free tier limits
- You can make thousands of requests per month for free
- The API is very reliable and fast compared to local models

## Security Notes

- Never commit your API key to version control
- The `.env.local` file is already in `.gitignore`
- Keep your API key secure and don't share it publicly

## Next Steps

Once you have the Gemini API working, you can:

1. Try different types of requests:
   - "How do you say hello in Spanish?"
   - "Teach me basic Spanish greetings"
   - "I need Spanish phrases for ordering food"

2. The AI will generate relevant Spanish sentences and create quizzes automatically

3. All generated content will work with your existing audio playback and quiz features 