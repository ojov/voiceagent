import { VoiceAgent } from "./components/VoiceAgent";

const SUGGESTION_QUESTIONS = [
  "How long do international payouts take?",
  "What currencies does RelayPay support?",
  "How do I create an invoice?",
  "What are the transfer fees?",
];

export default function App() {
  return (
    <div className="min-h-dvh flex flex-col bg-rp-bg">
      {/* Header — dark navy to complement logo */}
      <header className="bg-rp-navy h-16 px-6 flex items-center justify-between border-b border-white/10">
        <img
          src="/relaypayLogo.png"
          alt="RelayPay"
          className="h-24 w-auto object-contain"
          draggable={false}
        />
        <span className="text-white/50 text-xs font-medium tracking-widest uppercase">
          Support
        </span>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        {/* Hero text */}
        <div className="text-center mb-8 max-w-md">
          <div className="inline-flex items-center gap-2 bg-rp-teal-500/10 border border-rp-teal-500/25 rounded-full px-4 py-1 mb-4">
            <span
              className="w-1.5 h-1.5 rounded-full bg-rp-teal-500 dot-blink inline-block"
              aria-hidden="true"
            />
            <span className="text-rp-teal-700 text-xs font-medium">
              AI Support Agent · Available 24/7
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-semibold text-rp-text mb-2 tracking-tight leading-snug">
            How can we help you today?
          </h1>

          <p className="text-rp-muted text-sm leading-relaxed">
            Speak your question and our agent will respond. You can ask about
            payments, invoices, fees, and onboarding.
          </p>
        </div>

        {/* Voice widget */}
        <div className="w-full max-w-xl bg-rp-surface border border-rp-border rounded-2xl shadow-sm px-8 py-10 flex flex-col items-center">
          <VoiceAgent />
        </div>

        {/* Suggestion chips */}
        <div className="flex flex-wrap gap-2 justify-center mt-6 max-w-xl">
          {SUGGESTION_QUESTIONS.map((q) => (
            <span
              key={q}
              className="text-xs text-rp-muted border border-rp-border rounded-full px-3 py-1.5 bg-rp-surface select-none"
            >
              {q}
            </span>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center border-t border-rp-border">
        <p className="text-xs text-rp-subtle">
          Powered by RelayPay &nbsp;·&nbsp; Conversations are recorded for quality assurance
        </p>
      </footer>
    </div>
  );
}
