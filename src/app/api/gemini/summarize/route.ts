import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: NextRequest) {
  try {
    const { text, mode } = await req.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text content is required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        reason: 'NO_API_KEY',
        message: 'No GEMINI_API_KEY environment variable configured on server.',
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    let prompt = `You are an expert document summarizer. Summarize the following document text clearly and concisely.\nMode: ${mode || 'Executive Summary'}\n\nDocument Text:\n${text.slice(0, 30000)}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const summaryText = response.text || '';
    return NextResponse.json({ success: true, summary: summaryText });
  } catch (err: any) {
    console.error('Gemini summarization error:', err);
    return NextResponse.json({
      success: false,
      reason: 'ERROR',
      error: err.message || 'Gemini API call failed',
    }, { status: 500 });
  }
}
