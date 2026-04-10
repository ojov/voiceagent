import { Mic, PhoneOff, Loader2, AlertCircle } from "lucide-react";
import { useVapi } from "../hooks/useVapi";
import { AudioWave } from "./AudioWave";
import { TranscriptPanel } from "./TranscriptPanel";
import type { UserInfo } from "./UserInfoForm";

interface VoiceAgentProps {
  user: UserInfo;
}

const STATUS_LABELS: Record<string, string> = {
  idle:       "Tap to speak with our support agent",
  connecting: "Connecting…",
  active:     "Listening",
  ending:     "Ending call…",
};

export function VoiceAgent({ user }: VoiceAgentProps) {
  const { status, transcript, isSpeaking, error, startCall, endCall } = useVapi();

  const isActive     = status === "active";
  const isConnecting = status === "connecting" || status === "ending";

  return (
    <div className="flex flex-col items-center w-full max-w-xl mx-auto">
      {/* Greeted name */}
      <p className="text-sm text-rp-muted mb-6">
        Hi <span className="font-medium text-rp-text">{user.name.split(" ")[0]}</span>, ready when you are.
      </p>

      {/* Call button */}
      <div className="relative flex items-center justify-center mb-8">
        {isActive && (
          <>
            <div className="absolute w-32 h-32 rounded-full bg-rp-teal-500/15 pulse-ring" />
            <div className="absolute w-32 h-32 rounded-full bg-rp-teal-500/10 pulse-ring" style={{ animationDelay: "0.75s" }} />
          </>
        )}
        <button
          onClick={isActive ? endCall : () => startCall(user)}
          disabled={isConnecting}
          aria-label={isActive ? "End call" : "Start call"}
          className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center transition-all duration-200
            focus:outline-none focus-visible:ring-4 focus-visible:ring-rp-blue-300
            ${isActive
              ? "bg-red-600 hover:bg-red-700 shadow-lg"
              : isConnecting
                ? "bg-rp-blue-300 cursor-not-allowed"
                : "bg-rp-blue-900 hover:bg-rp-blue-800 shadow-md hover:shadow-lg active:scale-95"
            }`}
        >
          {isConnecting ? (
            <Loader2 className="w-9 h-9 text-white animate-spin" />
          ) : isActive ? (
            <PhoneOff className="w-9 h-9 text-white" />
          ) : (
            <Mic className="w-9 h-9 text-white" />
          )}
        </button>
      </div>

      {/* Status label */}
      <p className="text-sm font-medium text-rp-muted mb-4">
        {isActive ? (
          <span className="inline-flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rp-teal-500 dot-blink inline-block" aria-hidden="true" />
            {STATUS_LABELS[status]}
          </span>
        ) : STATUS_LABELS[status]}
      </p>

      {/* Audio wave */}
      <div className="h-8 flex items-center justify-center mb-4">
        {isActive && (
          <div className="flex items-center gap-3">
            <AudioWave active={isSpeaking} bars={9} color="#14b8a6" />
            <span className="text-xs text-rp-muted">
              {isSpeaking ? "Agent speaking" : "Agent listening"}
            </span>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-red-700 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4 w-full">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Transcript */}
      <TranscriptPanel messages={transcript} />
    </div>
  );
}
