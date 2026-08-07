"use client";

import { FormEvent, useState } from "react";

type Message = { role: "user" | "assistant"; text: string };

export default function GeminiGuide({ language }: { language: "ko" | "en" }) {
  const ko = language === "ko";
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  const ask = async (event: FormEvent) => {
    event.preventDefault();
    const question = input.trim();
    if (!question || loading) return;
    setInput("");
    setMessages((items) => [...items, { role: "user", text: question }]);
    setLoading(true);
    try {
      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: question }),
      });
      const data = await response.json();
      setMessages((items) => [
        ...items,
        {
          role: "assistant",
          text:
            data.answer ||
            data.error ||
            (ko
              ? "답변을 불러오지 못했습니다."
              : "The answer could not be loaded."),
        },
      ]);
    } catch {
      setMessages((items) => [
        ...items,
        {
          role: "assistant",
          text: ko
            ? "네트워크 연결을 확인하고 다시 시도해 주세요."
            : "Check your network connection and try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <aside className={`ai-guide ${open ? "open" : ""}`}>
      {open && (
        <section
          className="ai-guide-panel"
          aria-label={ko ? "부산 관광 AI 도우미" : "Busan travel AI guide"}
        >
          <header>
            <div>
              <small>GEMINI · BLUE LINE BUSAN</small>
              <h2>{ko ? "부산 관광 AI 도우미" : "Busan travel AI guide"}</h2>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label={ko ? "닫기" : "Close"}
            >
              ×
            </button>
          </header>
          <div className="ai-guide-messages" aria-live="polite">
            {messages.length === 0 && (
              <div className="ai-welcome">
                <b>{ko ? "무엇을 도와드릴까요?" : "How can I help?"}</b>
                <p>
                  {ko
                    ? "부산 관광지, 경로, 음식점, 병원, 해안 안전을 질문해 보세요."
                    : "Ask about Busan attractions, routes, food, hospitals or coastal safety."}
                </p>
              </div>
            )}
            {messages.map((message, index) => (
              <p key={index} className={message.role}>
                {message.text}
              </p>
            ))}
            {loading && (
              <p className="assistant ai-loading">
                {ko ? "답변을 작성하고 있습니다…" : "Writing an answer…"}
              </p>
            )}
          </div>
          <form onSubmit={ask}>
            <textarea
              maxLength={800}
              rows={2}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={
                ko
                  ? "예: 해운대에서 비가 오면 어디를 가면 좋아?"
                  : "Example: What can I do near Haeundae when it rains?"
              }
              aria-label={ko ? "AI 질문" : "AI question"}
            />
            <button disabled={loading || !input.trim()}>
              {ko ? "질문하기" : "Ask"}
            </button>
          </form>
          <small className="ai-disclaimer">
            {ko
              ? "AI 답변은 참고용입니다. 긴급 상황은 대한민국 119에 연락하세요."
              : "AI answers are for guidance only. Call 119 for emergencies in Korea."}
          </small>
        </section>
      )}
      {!open && (
        <button className="ai-guide-launch" onClick={() => setOpen(true)}>
          <span>✦</span>
          {ko ? "AI 관광 도우미" : "AI travel guide"}
        </button>
      )}
    </aside>
  );
}
