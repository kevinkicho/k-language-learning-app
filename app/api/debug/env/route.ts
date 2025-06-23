import { NextResponse } from 'next/server';

export async function GET() {
  // Read the environment variables on the server side
  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID || null;
  const keyFilename = process.env.GOOGLE_CLOUD_KEY_FILENAME || null;
  const geminiKey = process.env.GOOGLE_GEMINI_API_KEY ? 'Set' : null;

  // Return their values as JSON
  return NextResponse.json({
    'process.env.GOOGLE_CLOUD_PROJECT_ID': projectId,
    'process.env.GOOGLE_CLOUD_KEY_FILENAME': keyFilename,
    'process.env.GOOGLE_GEMINI_API_KEY': geminiKey
  });
} 