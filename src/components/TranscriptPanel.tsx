import { useEffect, useRef } from "react";
import type { TranscriptMessage } from "../hooks/useVapi";

interface TranscriptPanelProps {
  messages: TranscriptMessage[];
}

export function TranscriptPanel({ messages }: TranscriptPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) return null;

  return (
    <div className="w-full mt-8 space-y-4 max-h-72 overflow-y-auto">
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
            className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              msg.role === "user"
                ? "bg-rp-blue-900 text-white rounded-br-sm"
                : "bg-white border border-rp-border text-rp-text rounded-bl-sm shadow-sm"
            }`}
          >
            {msg.text}
          </div>
          {msg.role === "user" && (
            <div className="w-7 h-7 rounded-full bg-rp-blue-100 border border-rp-blue-200 shrink-0 flex items-center justify-center text-[10px] font-semibold text-rp-blue-700 mt-0.5 select-none">
              You
            </div>
          )}
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
