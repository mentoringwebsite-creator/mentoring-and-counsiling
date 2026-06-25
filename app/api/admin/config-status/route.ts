import { NextResponse } from 'next/server';

export async function GET() {
  const geminiConfigured = !!process.env.GEMINI_API_KEY;
  const groqConfigured = !!process.env.GROQ_API_KEY;

  return NextResponse.json({
    success: true,
    geminiConfigured,
    groqConfigured
  });
}
