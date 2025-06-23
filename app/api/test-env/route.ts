import { NextResponse } from 'next/server';

export async function GET() {
  console.log('🔍 Test ENV API - process.env.GOOGLE_GEMINI_API_KEY:', process.env.GOOGLE_GEMINI_API_KEY);
  console.log('🔍 Test ENV API - All env vars with GOOGLE:', Object.keys(process.env).filter(key => key.includes('GOOGLE')));
  
  return NextResponse.json({
    message: 'Environment variable test',
    GOOGLE_GEMINI_API_KEY: process.env.GOOGLE_GEMINI_API_KEY ? 'SET' : 'NOT SET',
    allGoogleVars: Object.keys(process.env).filter(key => key.includes('GOOGLE')),
    nodeEnv: process.env.NODE_ENV,
    allEnvVars: Object.keys(process.env).slice(0, 10) // First 10 env vars
  });
} 