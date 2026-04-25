import { NextResponse } from 'next/server';
import { geminiModel } from '@/lib/gemini';
import { SYSTEM_PROMPTS } from '@/lib/prompts';
import { Zone } from '@ctbm/core';

export async function POST(req: Request) {
  try {
    const { message, zone, history } = await req.json();

    if (!message || !zone) {
      return NextResponse.json({ error: 'Message and zone are required' }, { status: 400 });
    }

    const systemPrompt = SYSTEM_PROMPTS[zone as Zone] || SYSTEM_PROMPTS.neutral;

    // Convert history to Gemini format (role: user/model)
    const formattedHistory = (history || []).map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    const chat = geminiModel.startChat({
      history: formattedHistory,
      systemInstruction: { role: 'system', parts: [{ text: systemPrompt }] },
    });

    const result = await chat.sendMessage(message);
    const response = result.response.text();

    return NextResponse.json({ response });
  } catch (error: any) {
    console.error('Chat error:', error);
    return NextResponse.json({ error: error.message || 'Chat generation failed' }, { status: 500 });
  }
}
