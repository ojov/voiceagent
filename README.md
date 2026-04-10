# RelayPay Voice Support Agent

A production-ready AI voice customer service agent for [RelayPay](https://relaypay.io) — a B2B cross-border payments platform for African startups and SMEs.

Customers speak questions through a branded web interface and receive spoken responses from an AI agent named **Relay**. The agent retrieves answers from approved documentation, follows a strict decision policy, and hands off complex cases to human support.

---

## How It Works

```
Customer speaks
       │
       ▼
  VAPI (STT)
       │  text
       ▼
Claude 3.7 Sonnet
       │
       ├──▶ search_knowledge_base(query)
       │           │
       │           ▼
       │      n8n webhook
       │           │ embed query (OpenAI)
       │           ▼
       │      Supabase pgvector
       │           │ top-3 semantic matches
       │           ▼
       │      Return context to Claude
       │
       └──▶ escalate_to_human(...)
                   │
                   ▼
              n8n webhook
                   ├── Airtable record
                   ├── Telegram alert → @relaypayteam
                   └── Gmail confirmation → customer
       │
       ▼
  VAPI (TTS) → Customer hears response
```

The agent classifies every query into one of four modes before responding:

| Mode | When |
|---|---|
| **Answer** | General question, answer found in docs, no account-specific info needed |
| **Clarify** | Vague question with multiple interpretations |
| **Escalate** | Account issues, compliance, disputes, frustrated user |
| **Decline** | Topic not in docs, answering would require guessing |

---

## Tech Stack

| Layer | Tool |
|---|---|
| Frontend | Vite + React + TypeScript + Tailwind CSS v4 |
| Voice | VAPI (`@vapi-ai/web`) |
| AI model | Claude 3.7 Sonnet via VAPI's Anthropic integration |
| Orchestration | n8n cloud |
| Embeddings | OpenAI `text-embedding-3-small` |
| Vector store | Supabase pgvector |
| Escalation records | Airtable |
| Support notifications | Telegram |
| Customer confirmation | Gmail |

---

## Project Structure

```
voiceagent/
├── src/
│   ├── App.tsx                        # Root layout
│   ├── index.css                      # Tailwind + brand theme
│   ├── components/
│   │   ├── VoiceAgent.tsx             # Call button, status, audio wave
│   │   ├── AudioWave.tsx              # Animated waveform
│   │   └── TranscriptPanel.tsx        # Live conversation transcript
│   ├── hooks/
│   │   └── useVapi.ts                 # VAPI SDK lifecycle
│   └── vapi-system-prompt.md          # Agent instructions (source of truth)
├── scripts/
│   ├── _env.mjs                       # Env loader — reads .env.local
│   ├── supabase-setup.sql             # pgvector schema + match_documents RPC
│   ├── ingest-knowledge-base.mjs      # Embed docs and upsert to Supabase
│   ├── setup-n8n-semantic-search.mjs  # Deploy RAG workflow to n8n
│   └── setup-n8n-escalation.mjs       # Deploy escalation workflow to n8n
├── public/
│   └── relaypayLogo.png
├── .env.local                         # Secrets — never committed
└── AGENTS.md                          # Guide for AI agents working in this repo
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- A VAPI account with an assistant created
- A Supabase project with pgvector enabled
- An n8n cloud instance
- OpenAI API key

### 1. Clone and install

```bash
git clone <repo-url>
cd voiceagent
npm install
```

### 2. Configure environment variables

Copy the example and fill in your values:

```bash
cp .env.example .env.local
```

```env
# VAPI
VITE_VAPI_PUBLIC_KEY=your_vapi_public_key
VITE_VAPI_ASSISTANT_ID=your_assistant_id

# OpenAI (for embeddings)
OPENAI_API_KEY=sk-proj-...

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# n8n
N8N_BASE_URL=https://your-instance.app.n8n.cloud
N8N_API_KEY=eyJ...

# Airtable
AIRTABLE_API_KEY=pat...
AIRTABLE_BASE_ID=app...
AIRTABLE_TABLE_ID=tbl...

# Telegram
TELEGRAM_BOT_TOKEN=123456:AAH...
TELEGRAM_CHAT_ID=-100...
```

> `.env.local` is gitignored. Never commit it.

### 3. Set up Supabase

Run the schema in your Supabase SQL Editor:

```bash
# Copy contents of scripts/supabase-setup.sql into the Supabase SQL Editor and run
```

This creates the `documents` table, the `match_documents` RPC function, and an HNSW index.

### 4. Deploy n8n workflows

```bash
node scripts/setup-n8n-semantic-search.mjs   # RAG search workflow
node scripts/setup-n8n-escalation.mjs        # Escalation workflow
```

### 5. Ingest the knowledge base

```bash
node scripts/ingest-knowledge-base.mjs
```

This embeds all 25 knowledge base chunks via OpenAI and upserts them into Supabase. It is idempotent — safe to re-run when documents change.

### 6. Start the dev server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173), click the mic button, and speak.

---

## n8n Workflows

| Workflow | Webhook path | Purpose |
|---|---|---|
| Semantic Knowledge Base Search | `/webhook/relaypay-rag-search` | Embed query → vector search → return top-3 context chunks |
| Escalation Handler | `/webhook/relaypay-escalate` | Create Airtable record, notify Telegram, email customer |

Both workflows are registered as tools on the VAPI assistant. Claude calls them automatically during a conversation.

---

## Escalation Flow

When the agent escalates, it collects the customer's name, email, and preferred call time, then:

1. Creates a record in the **Airtable Escalations table** with category, priority, and AI-generated issue summary
2. Posts an alert to the **@relaypayteam Telegram channel**
3. Sends a **confirmation email** to the customer via Gmail
4. Returns a ticket reference ID to the agent, which reads it back to the customer

Priority is set automatically: `High` for compliance/disputes, `Medium` for account issues, `Low` for everything else.

---

## Knowledge Base

The knowledge base covers four document areas:

- **Product Features** — payments, invoicing, payouts, transaction tracking, team access
- **Policies and Compliance** — AML/KYC, monitoring, restrictions, data security, disputes
- **FAQ** — onboarding, fees, timelines, invoices, support
- **Release Notes** — version history, known limitations, service constraints

To add new content, extend the `CHUNKS` array in `scripts/ingest-knowledge-base.mjs` and re-run the ingestion script.

---

## Security

- All secrets live exclusively in `.env.local` (gitignored)
- Scripts load credentials via `scripts/_env.mjs` — no hardcoded values in source
- The Supabase service role key is never exposed to the browser
- The VAPI public key (`VITE_VAPI_PUBLIC_KEY`) is the only key that reaches the client — it is a publishable key by design
- Before staging files, verify no secrets are included: `git diff --cached | grep -E "(sk-|eyJ|pat)"`
- Do not use `git add .` — always stage files individually

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start local dev server |
| `npm run build` | TypeScript check + production build |
| `npm run preview` | Serve production build locally |
| `node scripts/ingest-knowledge-base.mjs` | Re-embed and upsert knowledge base |
| `node scripts/setup-n8n-semantic-search.mjs` | Redeploy RAG workflow |
| `node scripts/setup-n8n-escalation.mjs` | Redeploy escalation workflow |

---

## Brand

- **Primary:** Deep blue `#0e2166`
- **Accent:** Teal `#14b8a6`
- **Background:** Off-white `#f5f6f8`
- **Font:** Inter
- **Tone:** Professional, calm, minimal — no emojis, no gradients

See `AGENTS.md` for the full contributor guide including security rules and architectural constraints.
