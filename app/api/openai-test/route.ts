import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function GET() {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      {
        ok: false,
        step: 'env',
        message: 'OPENAI_API_KEY is NOT set on server',
      },
      { status: 500 },
    );
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Say "pong" only.' },
      ],
    });

    const content = completion.choices[0]?.message?.content ?? '';

    return NextResponse.json(
      {
        ok: true,
        step: 'openai',
        message: 'OpenAI call succeeded',
        reply: content,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error('OpenAI test error:', error);
    return NextResponse.json(
      {
        ok: false,
        step: 'openai',
        message: error?.message ?? 'Unknown OpenAI error',
      },
      { status: 500 },
    );
  }
}

