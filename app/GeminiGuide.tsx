"use client";

import {
  FormEvent,
  PointerEvent as ReactPointerEvent,
  useEffect,
  useRef,
  useState,
} from "react";

export type Language = "ko" | "en" | "ja" | "zh";
type Message = { role: "user" | "assistant"; text: string };

const copy = {
  ko: {
    title: "부산 관광 AI 도우미",
    close: "닫기",
    minimize: "AI 창 축소",
    restore: "AI 창 펼치기",
    welcome: "무엇을 도와드릴까요?",
    intro:
      "야간 명소, 분위기 좋은 장소, 경로, 음식점, 병원과 해안 안전을 물어보세요.",
    placeholder: "예: 부산에서 야경과 분위기가 좋은 곳을 추천해줘",
    ask: "질문하기",
    loading: "답변을 작성하고 있습니다…",
    error: "네트워크 연결을 확인하고 다시 시도해 주세요.",
    empty: "답변을 불러오지 못했습니다.",
    disclaimer:
      "AI 답변은 참고용입니다. 최신 평점은 Google 지도에서 확인하고, 긴급 상황은 119에 연락하세요.",
    launch: "AI 관광 도우미",
    auto: "추천 장소 자동 추가 · 대화 기억",
    thinking: "답변을 준비하고 있어요…",
    ready: "새 답변 도착 · 눌러서 확인",
  },
  en: {
    title: "Busan travel AI guide",
    close: "Close",
    minimize: "Minimize AI window",
    restore: "Restore AI window",
    welcome: "How can I help?",
    intro:
      "Ask about night views, atmospheric places, routes, food, hospitals or coastal safety.",
    placeholder: "Example: Recommend an atmospheric night spot in Busan",
    ask: "Ask",
    loading: "Writing an answer…",
    error: "Check your network connection and try again.",
    empty: "The answer could not be loaded.",
    disclaimer:
      "AI answers are for guidance. Check current ratings on Google Maps and call 119 for emergencies in Korea.",
    launch: "AI travel guide",
    auto: "Auto-add places · remembers chat",
    thinking: "Preparing your answer…",
    ready: "New answer · tap to view",
  },
  ja: {
    title: "釜山観光AIガイド",
    close: "閉じる",
    minimize: "AI画面を最小化",
    restore: "AI画面を元に戻す",
    welcome: "何をお手伝いしましょうか？",
    intro:
      "夜景、雰囲気の良い場所、ルート、グルメ、病院、海岸の安全について質問できます。",
    placeholder: "例：釜山で雰囲気の良い夜景スポットを推薦して",
    ask: "質問する",
    loading: "回答を作成しています…",
    error: "ネットワーク接続を確認して、もう一度お試しください。",
    empty: "回答を読み込めませんでした。",
    disclaimer:
      "AIの回答は参考情報です。最新評価はGoogleマップで確認し、緊急時は119へ連絡してください。",
    launch: "AI観光ガイド",
    auto: "おすすめを自動追加・会話を記憶",
    thinking: "回答を準備しています…",
    ready: "新しい回答・タップして確認",
  },
  zh: {
    title: "釜山旅游AI助手",
    close: "关闭",
    minimize: "最小化AI窗口",
    restore: "展开AI窗口",
    welcome: "需要什么帮助？",
    intro: "可询问夜景、氛围好的地点、路线、美食、医院和海岸安全。",
    placeholder: "例如：推荐釜山氛围好的夜景地点",
    ask: "提问",
    loading: "正在生成回答…",
    error: "请检查网络连接后重试。",
    empty: "无法加载回答。",
    disclaimer:
      "AI回答仅供参考。请在Google地图确认最新评分，韩国紧急情况请拨119。",
    launch: "AI旅游助手",
    auto: "自动添加推荐地点・记住对话",
    thinking: "正在准备回答…",
    ready: "新回答已到・点击查看",
  },
};

export default function GeminiGuide({
  language,
  onRecommend,
  initialQuestion,
  onQuestionConsumed,
}: {
  language: Language;
  onRecommend: (place: string) => void;
  initialQuestion?: string;
  onQuestionConsumed?: () => void;
}) {
  const t = copy[language];
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [notification, setNotification] = useState<"thinking" | "ready" | null>(
    null,
  );
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const lastInitialQuestion = useRef("");
  const guideRef = useRef<HTMLElement>(null);
  const animationFrame = useRef<number | null>(null);
  const latestPosition = useRef(position);
  const drag = useRef<{
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  } | null>(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("blueline-ai-chat") || "[]",
      );
      if (Array.isArray(saved)) setMessages(saved.slice(-20));
    } catch {
      setMessages([]);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(
      "blueline-ai-chat",
      JSON.stringify(messages.slice(-20)),
    );
  }, [hydrated, messages]);

  const submitQuestion = async (question: string, notify = false) => {
    if (!question || loading) return;
    if (notify) setNotification("thinking");
    const conversation: Message[] = [
      ...messages,
      { role: "user" as const, text: question },
    ].slice(-12);
    setInput("");
    setMessages(conversation);
    setLoading(true);
    try {
      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: question,
          messages: conversation,
          language,
        }),
      });
      const data = await response.json();
      setMessages((items) =>
        [
          ...items,
          {
            role: "assistant" as const,
            text: data.answer || data.error || t.empty,
          },
        ].slice(-20),
      );
      if (typeof data.recommendedPlace === "string" && data.recommendedPlace)
        onRecommend(data.recommendedPlace);
    } catch {
      setMessages((items) =>
        [...items, { role: "assistant" as const, text: t.error }].slice(-20),
      );
    } finally {
      setLoading(false);
      if (notify) setNotification("ready");
    }
  };

  useEffect(() => {
    const question = initialQuestion?.trim();
    if (!question || question === lastInitialQuestion.current) return;
    lastInitialQuestion.current = question;
    onQuestionConsumed?.();
    void submitQuestion(question, true);
    // A new initialQuestion value represents one explicit search submission.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuestion]);

  const ask = (event: FormEvent) => {
    event.preventDefault();
    void submitQuestion(input.trim());
  };

  const startDrag = (event: ReactPointerEvent<HTMLElement>) => {
    if ((event.target as HTMLElement).closest("button")) return;
    const panel = event.currentTarget.closest(".ai-guide-panel");
    if (!panel) return;
    const rect = panel.getBoundingClientRect();
    drag.current = {
      startX: event.clientX,
      startY: event.clientY,
      originX: position.x,
      originY: position.y,
      minX: position.x - rect.left + 8,
      maxX: position.x + window.innerWidth - rect.right - 8,
      minY: position.y - rect.top + 8,
      maxY: position.y + window.innerHeight - rect.bottom - 8,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const moveDrag = (event: ReactPointerEvent<HTMLElement>) => {
    if (!drag.current) return;
    const nextX = drag.current.originX + event.clientX - drag.current.startX;
    const nextY = drag.current.originY + event.clientY - drag.current.startY;
    latestPosition.current = {
      x: Math.min(drag.current.maxX, Math.max(drag.current.minX, nextX)),
      y: Math.min(drag.current.maxY, Math.max(drag.current.minY, nextY)),
    };
    if (animationFrame.current !== null) return;
    animationFrame.current = window.requestAnimationFrame(() => {
      const { x, y } = latestPosition.current;
      if (guideRef.current)
        guideRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      animationFrame.current = null;
    });
  };

  const stopDrag = () => {
    if (animationFrame.current !== null) {
      window.cancelAnimationFrame(animationFrame.current);
      animationFrame.current = null;
    }
    const { x, y } = latestPosition.current;
    if (guideRef.current)
      guideRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    setPosition({ x, y });
    drag.current = null;
  };

  return (
    <aside
      ref={guideRef}
      className={`ai-guide ${open ? "open" : ""}`}
      style={{
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
      }}
    >
      {open && (
        <section
          className={`ai-guide-panel ${minimized ? "minimized" : ""}`}
          aria-label={t.title}
        >
          <header
            onPointerDown={startDrag}
            onPointerMove={moveDrag}
            onPointerUp={stopDrag}
            onPointerCancel={stopDrag}
            title="Drag / 이동"
          >
            <div>
              <small>GEMINI · BLUE LINE BUSAN</small>
              <h2>{t.title}</h2>
            </div>
            <div className="ai-window-actions">
              <button
                onClick={() => setMinimized((value) => !value)}
                aria-label={minimized ? t.restore : t.minimize}
                title={minimized ? t.restore : t.minimize}
              >
                {minimized ? "□" : "—"}
              </button>
              <button onClick={() => setOpen(false)} aria-label={t.close}>
                ×
              </button>
            </div>
          </header>
          <div className="ai-guide-messages" aria-live="polite">
            {messages.length === 0 && (
              <div className="ai-welcome">
                <b>{t.welcome}</b>
                <p>{t.intro}</p>
              </div>
            )}
            {messages.map((message, index) => (
              <p key={index} className={message.role}>
                {message.text}
              </p>
            ))}
            {loading && <p className="assistant ai-loading">{t.loading}</p>}
          </div>
          <form onSubmit={ask}>
            <textarea
              maxLength={800}
              rows={2}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={t.placeholder}
              aria-label={t.title}
            />
            <button disabled={loading || !input.trim()}>{t.ask}</button>
          </form>
          <small className="ai-disclaimer">{t.disclaimer}</small>
        </section>
      )}
      {!open && (
        <button
          className={`ai-guide-launch ${notification ? `ai-${notification}` : ""}`}
          onClick={() => {
            setOpen(true);
            setMinimized(false);
            setNotification(null);
          }}
        >
          <span>✦</span>
          <b>{t.launch}</b>
          <small aria-live="polite">
            {notification === "thinking"
              ? t.thinking
              : notification === "ready"
                ? t.ready
                : t.auto}
          </small>
        </button>
      )}
    </aside>
  );
}
