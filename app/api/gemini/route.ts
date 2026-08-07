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
  let history: { role: "user" | "model"; parts: { text: string }[] }[] = [];
  try {
    const body = await request.json();
    message = typeof body?.message === "string" ? body.message.trim() : "";
    if (Array.isArray(body?.messages)) {
      history = body.messages
        .filter(
          (item: { role?: string; text?: string }) =>
            (item?.role === "user" || item?.role === "assistant") &&
            typeof item?.text === "string" &&
            item.text.trim(),
        )
        .slice(-12)
        .map((item: { role: "user" | "assistant"; text: string }) => ({
          role: item.role === "assistant" ? "model" : "user",
          parts: [{ text: item.text.slice(0, 1200) }],
        }));
    }
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }
  if (!message || message.length > 800)
    return NextResponse.json(
      { error: "질문은 1자 이상 800자 이하로 입력해 주세요." },
      { status: 400 },
    );

  const preferredModel = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
  const fallbackModel = "gemini-2.5-flash-lite";
  try {
    const requestBody = JSON.stringify({
      systemInstruction: {
        parts: [
          {
            text: "You are BLUE LINE BUSAN, a concise Busan travel assistant supporting Korean, English, Japanese, and Simplified Chinese. Continue the conversation using its prior context and answer in the visitor's latest language. Handle concrete destinations and abstract requests such as night attractions, romantic places, atmospheric scenery, rainy-day spots, or family trips. Treat broad attraction-only queries such as '명소', 'attractions', '名所', or '景点' as a request for exactly three representative Busan attractions. For abstract recommendations, prioritize widely well-reviewed Google Maps candidates such as Gwangalli Beach, The Bay 101, Hwangnyeongsan Observatory, Gamcheon Culture Village, Cheongsapo Daritdol Observatory, Haeundae Blueline Park, Yongdusan Park and Huinnyeoul Culture Village, while clearly saying ratings change and should be checked on Google Maps. Give a short useful description for every recommended attraction. Never invent an exact current rating, live traffic, live incidents, opening hours, or medical diagnosis. Only help with Busan attractions, coastal travel, routes, nearby food, hospitals, and safety. Tell users to call 119 for immediate emergencies in Korea. Do not request personal information or precise location. When recommending one attraction, end with [[ADD_PLACE:official English name]]. When recommending multiple attractions, end with exactly [[ADD_PLACES:official English name 1|official English name 2|official English name 3]]. Keep the places in the best suggested visit order. Do not use markers for restaurants, hospitals, or general questions.",
          },
        ],
      },
      contents:
        history.length > 0
          ? history
          : [{ role: "user", parts: [{ text: message }] }],
      generationConfig: { maxOutputTokens: 1200 },
    });
    const callModel = (model: string) =>
      fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey,
          },
          body: requestBody,
        },
      );
    let activeModel = preferredModel;
    let response = await callModel(activeModel);
    let data = await response.json();
    if (!response.ok && activeModel !== fallbackModel) {
      console.warn("Preferred Gemini model unavailable; using fallback", {
        model: activeModel,
        status: response.status,
        code: data.error?.status,
      });
      activeModel = fallbackModel;
      response = await callModel(activeModel);
      data = await response.json();
    }
    if (!response.ok) {
      console.error("Gemini API error", {
        model: activeModel,
        status: response.status,
        code: data.error?.status,
        message: data.error?.message,
      });
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
    const rawAnswer = data.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text || "")
      .join("")
      .trim();
    if (!rawAnswer) throw new Error("empty response");
    const multipleRecommendation = rawAnswer.match(/\[\[ADD_PLACES:(.+?)\]\]/i);
    const recommendation = rawAnswer.match(/\[\[ADD_PLACE:(.+?)\]\]/i);
    let recommendedPlaces =
      multipleRecommendation?.[1]
        ?.split("|")
        .map((place: string) => place.trim())
        .filter(Boolean)
        .slice(0, 8) ||
      (recommendation?.[1]?.trim() ? [recommendation[1].trim()] : []);
    let answer = rawAnswer
      .replace(/\s*\[\[ADD_PLACES:.+?\]\]\s*/gi, "")
      .replace(/\s*\[\[ADD_PLACE:.+?\]\]\s*/gi, "")
      .trim();
    const normalizedMessage = message.trim().toLowerCase();
    const broadAttractionTerms = new Set([
      "\uBA85\uC18C", "\uAD00\uAD11\uBA85\uC18C", "\uAD00\uAD11\uC9C0",
      "attraction", "attractions", "landmark", "landmarks", "sightseeing",
      "\u540D\u6240", "\u89B3\u5149\u5730", "\u540D\u80DC", "\u666F\u70B9",
    ]);
    const broadAttractionRequest = broadAttractionTerms.has(
      normalizedMessage.replace(/[.!?]+$/g, "").trim(),
    );
    if (broadAttractionRequest) {
      recommendedPlaces = [
        "Gwangalli Beach",
        "The Bay 101",
        "Hwangnyeongsan Observatory",
      ];
      answer = /[가-힣]/.test(message)
        ? "부산의 대표 명소 3곳을 추천합니다. 광안리 해수욕장은 광안대교 야경과 해변 산책을 즐기기 좋고, 더베이101은 마린시티의 반영 야경으로 유명합니다. 황령산 전망대에서는 부산 도심과 바다를 한눈에 볼 수 있습니다. 추천 순서대로 지도와 경유지에 추가했습니다."
        : /(名所|観光地|[ぁ-んァ-ヶ])/.test(message)
          ? "釜山の代表的な名所3か所をご案内します。広安里海水浴場では広安大橋の夜景、ザ・ベイ101ではマリンシティの水辺の景色、荒嶺山展望台では釜山の街と海のパノラマを楽しめます。おすすめ順に地図と経由地へ追加しました。"
          : /[\u4e00-\u9fff]/.test(message)
            ? "推荐三个釜山代表性景点：广安里海水浴场适合欣赏广安大桥夜景，The Bay 101以海云台滨水夜景闻名，荒岭山观景台可以俯瞰釜山市区与大海。已按推荐顺序添加到地图和途经点。"
            : "Here are three representative Busan attractions: Gwangalli Beach for Gwangan Bridge night views, The Bay 101 for its waterfront Marine City scenery, and Hwangnyeongsan Observatory for a panorama of the city and sea. They were added to the map and route stops in the suggested order.";
    }
    return NextResponse.json({
      answer,
      model: activeModel,
      recommendedPlace: recommendedPlaces[0] || null,
      recommendedPlaces,
    });
  } catch {
    return NextResponse.json(
      { error: "AI 서비스에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 502 },
    );
  }
}
