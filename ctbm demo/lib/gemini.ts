import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY || 'DUMMY_KEY_FOR_BUILD';

export const genAI = new GoogleGenerativeAI(apiKey);

// Use gemini-2.5-flash as requested
export const geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
