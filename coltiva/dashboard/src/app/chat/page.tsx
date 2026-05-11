"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Sparkles } from "lucide-react";

import { AuthGate } from "@/components/AuthGate";
import { AppShell } from "@/components/AppShell";

interface Message {
  id:     string;
  role:   "user" | "assistant";
  text:   string;
  ts:     number;
}

const STARTER_PROMPTS = [
  "When should I plant maize this season?",
  "What's the market price for sesame in Lira?",
  "How much DAP fertiliser do I need per acre?",
  "Is fall armyworm a risk in Alebtong now?",
];

const STUB_RESPONSE =
  "I'm still learning how to answer questions specific to your farm — that part is launching soon. " +
  "Once it's live, I'll combine your district's weather forecast, soil profile, current market prices, " +
  "and pest alerts to give you a real answer. " +
  "For now, you can dial *217# from any phone to get advice for your crop and district.";

export default function ChatPage() {
  return (
    <AuthGate>
      <AppShell>
        <ChatBody />
      </AppShell>
    </AuthGate>
  );
}

function ChatBody() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input,    setInput]    = useState("");
  const [thinking, setThinking] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  function send(text: string) {
    if (!text.trim() || thinking) return;
    const userMsg: Message = {
      id:   crypto.randomUUID(),
      role: "user",
      text: text.trim(),
      ts:   Date.now(),
    };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setThinking(true);

    // Simulate the assistant thinking — gives the UI a real-feeling rhythm
    // without misleading the user about what's actually happening.
    setTimeout(() => {
      setMessages((m) => [
        ...m,
        {
          id:   crypto.randomUUID(),
          role: "assistant",
          text: STUB_RESPONSE,
          ts:   Date.now(),
        },
      ]);
      setThinking(false);
    }, 900);
  }

  return (
    <>
      <header className="page-header">
        <h1 className="page-title">Ask Coltiva</h1>
        <p className="page-subtitle">
          Ask anything about your farm — weather, soil, prices, pests. Specific answers are launching soon.
        </p>
      </header>

      <div
        className="aeris-card"
        style={{
          padding:        "0",
          display:        "flex",
          flexDirection:  "column",
          minHeight:      "60vh",
          overflow:       "hidden",
        }}
      >
        {/* Banner about v2 */}
        <div
          style={{
            background:    "var(--tag-bg)",
            borderBottom:  "1px solid var(--border)",
            padding:       "0.75rem 1.25rem",
            display:       "flex",
            alignItems:    "center",
            gap:           "0.625rem",
            fontSize:      "var(--text-sm)",
            color:         "var(--fg-muted)",
          }}
        >
          <Sparkles size={16} style={{ color: "var(--accent)" }} />
          <span>
            <strong style={{ color: "var(--fg)" }}>Preview:</strong> the chatbot is in
            development. Real personalised answers launch soon.
          </span>
        </div>

        {/* Messages area */}
        <div
          style={{
            flex:    1,
            padding: "1.5rem",
            overflowY: "auto",
            display:   "flex",
            flexDirection: "column",
            gap:       "1rem",
          }}
        >
          {messages.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                color:     "var(--fg-muted)",
                fontSize:  "var(--text-md)",
                margin:    "auto 0",
              }}
            >
              <Sparkles
                size={32}
                style={{ color: "var(--accent)", marginBottom: "0.75rem" }}
              />
              <div style={{ fontWeight: 600, color: "var(--fg)", marginBottom: "0.5rem" }}>
                Try a question to get started
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", justifyContent: "center", marginTop: "1rem", maxWidth: "560px", marginLeft: "auto", marginRight: "auto" }}>
                {STARTER_PROMPTS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => send(p)}
                    style={{
                      background:    "var(--bg-card)",
                      border:        "1px solid var(--border)",
                      color:         "var(--fg)",
                      borderRadius:  "var(--radius-pill)",
                      padding:       "0.5rem 1rem",
                      fontSize:      "var(--text-sm)",
                      cursor:        "pointer",
                      fontFamily:    "inherit",
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m) => <Bubble key={m.id} m={m} />)
          )}
          {thinking && <ThinkingBubble />}
          <div ref={endRef} />
        </div>

        {/* Input */}
        <form
          onSubmit={(e) => { e.preventDefault(); send(input); }}
          style={{
            display:     "flex",
            gap:         "0.625rem",
            padding:     "1rem 1.25rem",
            borderTop:   "1px solid var(--border)",
            background:  "var(--bg-2)",
          }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your farm…"
            className="aeris-input"
            style={{ flex: 1 }}
            disabled={thinking}
          />
          <button
            type="submit"
            className="aeris-btn-primary"
            disabled={thinking || !input.trim()}
            aria-label="Send"
            style={{ minWidth: "44px", padding: "0.85rem 1.25rem" }}
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </>
  );
}

function Bubble({ m }: { m: Message }) {
  const isUser = m.role === "user";
  return (
    <div
      style={{
        alignSelf:    isUser ? "flex-end" : "flex-start",
        maxWidth:     "min(80%, 560px)",
        background:   isUser ? "var(--accent)" : "var(--bg-2)",
        color:        isUser ? "#fff" : "var(--fg)",
        borderRadius: "16px",
        padding:      "0.75rem 1rem",
        fontSize:     "var(--text-md)",
        lineHeight:   1.55,
        whiteSpace:   "pre-wrap",
      }}
    >
      {m.text}
    </div>
  );
}

function ThinkingBubble() {
  return (
    <div
      style={{
        alignSelf:    "flex-start",
        background:   "var(--bg-2)",
        color:        "var(--fg-muted)",
        borderRadius: "16px",
        padding:      "0.75rem 1rem",
        fontSize:     "var(--text-md)",
        display:      "inline-flex",
        gap:          "0.25rem",
      }}
    >
      <Dot delay="0s" />
      <Dot delay="0.15s" />
      <Dot delay="0.3s" />
    </div>
  );
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      style={{
        width:        "6px",
        height:       "6px",
        borderRadius: "50%",
        background:   "currentColor",
        opacity:      0.6,
        animation:    `pulse-dot 1s ${delay} infinite`,
      }}
    />
  );
}
