import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 8;
const requests = new Map<string, { count: number; resetAt: number }>();

function allowRequest(ip: string) {
  const now = Date.now();
  const current = requests.get(ip);
  if (!current || current.resetAt <= now) {
    requests.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (current.count >= MAX_REQUESTS) return false;
  current.count += 1;
  return true;
}

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!allowRequest(ip))
    return NextResponse.json(
      { error: "요청이 너무 많습니다. 1분 후 다시 시도해 주세요." },
      { status: 429 },
    );

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey)
    return NextResponse.json(
      { error: "AI 도우미가 아직 설정되지 않았습니다." },
      { status: 503 },
    );

  let message = "";
  try {
    const body = await request.json();
    message = typeof body?.message === "string" ? body.message.trim() : "";
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }
  if (!message || message.length > 800)
    return NextResponse.json(
      { error: "질문은 1자 이상 800자 이하로 입력해 주세요." },
      { status: 400 },
    );

  const model = process.env.GEMINI_MODEL || "gemini-3.5-flash";
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [
              {
                text: "You are BLUE LINE BUSAN, a concise bilingual Busan travel assistant. Answer in the language used by the visitor. Only help with Busan attractions, coastal travel, route planning, nearby food, hospitals, and safety. Never claim live traffic, live incidents, current ratings, opening hours, or medical diagnosis unless verified data was supplied. Clearly label estimates, recommend checking official maps or emergency services, and tell users to call 119 for immediate emergencies in Korea. Do not request personal information or precise location.",
              },
            ],
          },
          contents: [{ role: "user", parts: [{ text: message }] }],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 500,
          },
        }),
      },
    );
    const data = await response.json();
    if (!response.ok) {
      const status = response.status === 429 ? 429 : 502;
      return NextResponse.json(
        {
          error:
            status === 429
              ? "Gemini 무료 사용 한도에 도달했습니다. 잠시 후 다시 시도해 주세요."
              : "AI 답변을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
        },
        { status },
      );
    }
    const answer = data.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text || "")
      .join("")
      .trim();
    if (!answer) throw new Error("empty response");
    return NextResponse.json({ answer });
  } catch {
    return NextResponse.json(
      { error: "AI 서비스에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 502 },
    );
  }
}
