import { NextResponse } from 'next/server';
import { geminiModel } from '@/lib/gemini';

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const prompt = `Generate 3 realistic product suggestions for someone asking: '${query}'. Return ONLY a JSON array, no markdown, no backticks:
[
  {
    "name": "string",
    "description": "string (max 15 words)",
    "priceRange": "string (in Indian Rupees, e.g. ₹8,000 - ₹12,000)",
    "category": "string"
  }
]`;

    const result = await geminiModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
      }
    });

    const responseText = result.response.text();
    const products = JSON.parse(responseText);

    return NextResponse.json({ products });
  } catch (error: any) {
    console.error('Product generation error:', error);
    return NextResponse.json({ error: error.message || 'Product generation failed' }, { status: 500 });
  }
}
