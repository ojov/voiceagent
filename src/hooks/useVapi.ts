import { useEffect, useRef, useState, useCallback } from "react";
import Vapi from "@vapi-ai/web";

export type CallStatus = "idle" | "connecting" | "active" | "ending";

export interface TranscriptMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: Date;
}

const PUBLIC_KEY = import.meta.env.VITE_VAPI_PUBLIC_KEY as string;
const ASSISTANT_ID = import.meta.env.VITE_VAPI_ASSISTANT_ID as string;

export function useVapi() {
  const vapiRef = useRef<Vapi | null>(null);
  const [status, setStatus] = useState<CallStatus>("idle");
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const vapi = new Vapi(PUBLIC_KEY);
    vapiRef.current = vapi;

    vapi.on("call-start", () => {
      setStatus("active");
      setError(null);
    });

    vapi.on("call-end", () => {
      setStatus("idle");
      setIsSpeaking(false);
    });

    vapi.on("speech-start", () => setIsSpeaking(true));
    vapi.on("speech-end", () => setIsSpeaking(false));

    vapi.on("message", (message) => {
      if (message.type === "transcript" && message.transcriptType === "final") {
        setTranscript((prev) => [
          ...prev,
          {
            id: `${Date.now()}-${Math.random()}`,
            role: message.role as "user" | "assistant",
            text: message.transcript,
            timestamp: new Date(),
          },
        ]);
      }
    });

    vapi.on("error", (err) => {
      console.error("[VAPI]", err);
      setError("Something went wrong. Please try again.");
      setStatus("idle");
    });

    return () => {
      vapi.stop();
    };
  }, []);

  const startCall = useCallback(async () => {
    if (!vapiRef.current || status !== "idle") return;
    setStatus("connecting");
    setTranscript([]);
    setError(null);
    try {
      await vapiRef.current.start(ASSISTANT_ID);
    } catch (err) {
      console.error("[VAPI] start error", err);
      setError("Could not connect. Check your microphone permissions.");
      setStatus("idle");
    }
  }, [status]);

  const endCall = useCallback(() => {
    if (!vapiRef.current) return;
    setStatus("ending");
    vapiRef.current.stop();
  }, []);

  return { status, transcript, isSpeaking, error, startCall, endCall };
}
