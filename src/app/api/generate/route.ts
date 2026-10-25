import { NextResponse } from 'next/server';
import { generateContent } from '../../../lib/gemini';

export async function GET() {
  try {
    const testPrompt = "Formula 1 spikeri tarzında kısa, heyecanlı bir sezon açılış anonsu yazar mısın?";
    const responseText = await generateContent(testPrompt);
    
    return NextResponse.json({
      status: "success",
      message: "Gemini API bağlantısı hazır!",
      testPrompt: testPrompt,
      response: responseText
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({
      status: "error",
      message: "Gemini API çağrısı başarısız oldu.",
      error: err.message || String(error)
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { prompt } = body;

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({
        status: "error",
        message: "Lütfen geçerli bir 'prompt' parametresi gönderin."
      }, { status: 400 });
    }

    const responseText = await generateContent(prompt);
    
    return NextResponse.json({
      status: "success",
      response: responseText
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({
      status: "error",
      message: "Gemini API çağrısı başarısız oldu.",
      error: err.message || String(error)
    }, { status: 500 });
  }
}
