import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Loader2, AlertCircle } from "lucide-react";
import type { UserInfo } from "./UserInfoForm";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface TextChatProps {
  user: UserInfo;
}

const WEBHOOK_URL = "https://cohort2pod4.app.n8n.cloud/webhook/relaypay-text-chat";

export function TextChat({ user }: TextChatProps) {
  const [messages, setMessages]   = useState<Message[]>([]);
  const [input, setInput]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const bottomRef                 = useRef<HTMLDivElement>(null);
  const inputRef                  = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { id: `${Date.now()}-u`, role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setError(null);

    // Build history for Claude (exclude the message we just added — it's the current turn)
    const history = messages.map((m) => ({ role: m.role, content: m.content }));

    try {
      const res = await fetch(WEBHOOK_URL, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          message:   text,
          userName:  user.name,
          userEmail: user.email,
          history,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const assistantMsg: Message = {
        id:      `${Date.now()}-a`,
        role:    "assistant",
        content: data.response || "I'm unable to respond right now. Please try again.",
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error("[TextChat]", err);
      setError("Could not reach support. Please check your connection and try again.");
      // Remove the optimistic user message on failure
      setMessages((prev) => prev.filter((m) => m.id !== userMsg.id));
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }, [input, loading, messages, user]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  const isEmpty = messages.length === 0 && !loading;

  return (
    <div className="flex flex-col w-full" style={{ minHeight: "360px" }}>
      {/* Conversation area */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1" style={{ maxHeight: "360px" }}>
        {isEmpty && (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <p className="text-sm text-rp-muted">
              Hi <span className="font-medium text-rp-text">{user.name.split(" ")[0]}</span>, type your question below.
            </p>
            <p className="text-xs text-rp-subtle mt-1">
              Press Enter to send · Shift+Enter for new line
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "assistant" && (
              <div className="w-7 h-7 rounded-full bg-rp-blue-900 shrink-0 flex items-center justify-center text-[10px] font-semibold text-white mt-0.5 select-none">
                R
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-rp-blue-900 text-white rounded-br-sm"
                  : "bg-white border border-rp-border text-rp-text rounded-bl-sm shadow-sm"
              }`}
            >
              {msg.content}
            </div>
            {msg.role === "user" && (
              <div className="w-7 h-7 rounded-full bg-rp-blue-100 border border-rp-blue-200 shrink-0 flex items-center justify-center text-[10px] font-semibold text-rp-blue-700 mt-0.5 select-none">
                You
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="w-7 h-7 rounded-full bg-rp-blue-900 shrink-0 flex items-center justify-center text-[10px] font-semibold text-white mt-0.5">
              R
            </div>
            <div className="bg-white border border-rp-border rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex items-center gap-1.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-rp-muted dot-blink inline-block"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-red-700 text-xs bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2 items-end border border-rp-border rounded-xl bg-white px-3 py-2 focus-within:ring-2 focus-within:ring-rp-blue-500/30 focus-within:border-rp-blue-500 transition-colors">
        <textarea
          ref={inputRef}
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question…"
          disabled={loading}
          className="flex-1 resize-none text-sm text-rp-text placeholder:text-rp-subtle bg-transparent outline-none leading-relaxed"
          style={{ maxHeight: "120px" }}
        />
        <button
          onClick={send}
          disabled={!input.trim() || loading}
          aria-label="Send message"
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors shrink-0
            bg-rp-blue-900 text-white hover:bg-rp-blue-800
            disabled:bg-rp-border disabled:text-rp-subtle disabled:cursor-not-allowed"
        >
          {loading
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <Send className="w-4 h-4" />
          }
        </button>
      </div>
    </div>
  );
}
