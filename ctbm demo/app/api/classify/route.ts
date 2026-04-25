import { classify } from '@ctbm/core';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { message, history } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const config = {
      provider: 'gemini' as const,
      apiKey: process.env.GEMINI_API_KEY || '',
      model: 'gemini-2.5-flash',
    };

    const result = await classify(message, history || [], config);
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Classification error:', error);
    return NextResponse.json({ error: error.message || 'Classification failed' }, { status: 500 });
  }
}
