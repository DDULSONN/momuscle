import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type AnalyzeRequestBody = {
  gender: "male" | "female";
  heightCm: number;
  weightKg: number;
  goal: "bulk" | "cut" | "balance";
  frontUpper: string;
  backUpper: string;
  lower: string;
};

type AnalyzeResponse = {
  visualSummary: {
    upperFront: string;
    upperBack: string;
    lowerBody: string;
  };
  estimatedFocusPoints: {
    area: string;
    why: string;
  }[];
  styleDirection: {
    typeHint: "프레임형" | "볼륨형" | "라인형" | "하체강점형" | "밸런스형";
    note: string;
  };
  safetyNote: string;
};

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY is missing");
      return NextResponse.json(
        { error: "Server configuration error: OPENAI_API_KEY is not set." },
        { status: 500 },
      );
    }

    const body = (await req.json()) as Partial<AnalyzeRequestBody>;

    const { gender, heightCm, weightKg, goal, frontUpper, backUpper, lower } =
      body;

    if (
      !gender ||
      !heightCm ||
      !weightKg ||
      !goal ||
      !frontUpper ||
      !backUpper ||
      !lower
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required fields. Required: gender, heightCm, weightKg, goal, frontUpper, backUpper, lower",
        },
        { status: 400 },
      );
    }

    const systemPrompt = `
당신은 체형 및 스타일 분석을 도와주는 전문가 어시스턴트입니다.
이미지(정면 상체, 후면 상체, 하체)를 기반으로 시각적 특징을 요약하고,
보디밸런스와 스타일 방향을 한국어로 설명합니다.
반드시 JSON만 반환하고, 설명 문장도 모두 JSON 안에 포함해야 합니다.
`.trim();

    const developerPrompt = `
요구사항:

1. 반드시 아래 스키마를 정확히 따르는 JSON만 반환하세요. 추가 텍스트(설명, 문장, 코드 블록, 마크다운 등)는 절대 포함하지 마세요.

{
  "visualSummary": {
    "upperFront": string,
    "upperBack": string,
    "lowerBody": string
  },
  "estimatedFocusPoints": [
    { "area": string, "why": string },
    { "area": string, "why": string }
  ],
  "styleDirection": {
    "typeHint": "프레임형" | "볼륨형" | "라인형" | "하체강점형" | "밸런스형",
    "note": string
  },
  "safetyNote": string
}

2. 모든 문자열은 자연스러운 한국어로 작성하세요.
3. "estimatedFocusPoints" 배열은 최소 2개 이상 항목을 포함해야 합니다.
4. "safetyNote" 에는 건강/자세/운동 강도에 대한 주의사항을 간단히 포함하세요.
5. JSON 바깥에 공백, 개행, 주석, 설명 등 어떤 텍스트도 넣지 마세요.
`.trim();

    const userText = `
사용자 정보:
- 성별: ${gender}
- 키: ${heightCm}cm
- 몸무게: ${weightKg}kg
- 목표: ${goal}

이미지는 다음과 같습니다.
- frontUpper: 상체 정면
- backUpper: 상체 후면
- lower: 하체
`.trim();

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "system",
          content: developerPrompt,
        },
        {
          role: "user",
          content: [
            { type: "text", text: userText },
            {
              type: "image_url",
              image_url: {
                url: frontUpper,
              },
            },
            {
              type: "image_url",
              image_url: {
                url: backUpper,
              },
            },
            {
              type: "image_url",
              image_url: {
                url: lower,
              },
            },
          ],
        },
      ],
    });

    const rawContent = completion.choices[0]?.message?.content;

    if (!rawContent) {
      console.error("Empty response from OpenAI");
      return NextResponse.json(
        { error: "No response from analysis model." },
        { status: 500 },
      );
    }

    let parsed: AnalyzeResponse;

    try {
      parsed = JSON.parse(rawContent) as AnalyzeResponse;
    } catch (err) {
      console.error("Failed to parse JSON from OpenAI:", rawContent, err);
      return NextResponse.json(
        { error: "Invalid JSON format from analysis model." },
        { status: 500 },
      );
    }

    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error("Error in /api/analyze:", error);

    return NextResponse.json(
      {
        error: "Failed to analyze body images.",
        detail: error?.message ?? "Unknown error",
      },
      { status: 500 },
    );
  }
}

