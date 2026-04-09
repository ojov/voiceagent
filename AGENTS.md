# AGENTS.md — RelayPay Voice Support Agent

This file is the authoritative guide for any AI agent, developer, or automated system working in this codebase. Read it fully before making any changes.

---

## Project Overview

This is a production voice customer service agent for RelayPay, a B2B cross-border payments platform serving African startups and SMEs. Customers speak questions via a web interface and receive spoken responses from an AI agent named **Relay**.

**Stack:**
- **Frontend:** Vite + React + TypeScript + Tailwind CSS v4
- **Voice:** VAPI (`@vapi-ai/web` SDK) — STT, LLM orchestration, TTS
- **AI model:** Claude 3.7 Sonnet (via VAPI's Anthropic integration)
- **Orchestration:** n8n cloud (webhook workflows)
- **RAG:** OpenAI `text-embedding-3-small` + Supabase pgvector
- **Escalation:** Airtable (records) + Telegram (alerts) + Gmail (customer email)

---

## Repository Structure

```
voiceagent/
├── src/
│   ├── App.tsx                    # Root layout — header, hero, footer
│   ├── index.css                  # Tailwind + RelayPay brand theme
│   ├── main.tsx                   # React entry point
│   ├── components/
│   │   ├── VoiceAgent.tsx         # Call button, status, audio wave
│   │   ├── AudioWave.tsx          # Animated bars during agent speech
│   │   └── TranscriptPanel.tsx    # Scrollable conversation transcript
│   ├── hooks/
│   │   └── useVapi.ts             # VAPI SDK lifecycle hook
│   └── vapi-system-prompt.md      # Full system prompt for Relay (source of truth)
├── scripts/
│   ├── _env.mjs                   # Shared env loader — reads from .env.local
│   ├── ingest-knowledge-base.mjs  # Embeds 25 KB chunks into Supabase pgvector
│   ├── setup-n8n-semantic-search.mjs  # Creates RAG search workflow in n8n
│   ├── setup-n8n-escalation.mjs   # Creates escalation workflow in n8n
│   └── supabase-setup.sql         # Schema: pgvector extension, documents table, match_documents RPC
├── public/
│   ├── relaypayLogo.png            # Official RelayPay logo (dark background baked in)
│   └── favicon.svg
├── .env.local                     # ALL secrets — gitignored, never committed
└── .gitignore
```

---

## Security Rules — Follow These Without Exception

### 1. Never hardcode credentials

All secrets must live exclusively in `.env.local`. This file is gitignored and must never be committed.

```
# .env.local contains:
VITE_VAPI_PUBLIC_KEY
VITE_VAPI_ASSISTANT_ID
OPENAI_API_KEY
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
N8N_BASE_URL
N8N_API_KEY
AIRTABLE_API_KEY
AIRTABLE_BASE_ID
AIRTABLE_TABLE_ID
TELEGRAM_BOT_TOKEN
TELEGRAM_CHAT_ID
```

Scripts must load credentials via `scripts/_env.mjs`, not by hardcoding values:

```js
// Correct
import { OPENAI_KEY } from "./_env.mjs";

// Never do this
const OPENAI_KEY = "sk-proj-...";
```

### 2. Never log secrets

Do not `console.log` any API key, token, or credential — not even partially. If you need to verify a credential is loaded, log only its length or first 4 characters.

### 3. Do not add new env vars without updating .env.local

If a new service or key is introduced, add the variable to `.env.local` and document it in this file under the Repository Structure section above.

### 4. VAPI public key is not secret — but assistant ID is

`VITE_VAPI_PUBLIC_KEY` is a publishable key safe to expose in browser code. `VITE_VAPI_ASSISTANT_ID`, n8n webhook URLs, and all backend keys are sensitive and must stay server-side or in `.env.local`.

### 5. n8n Code nodes contain embedded credentials

The n8n semantic search workflow's Code node reads `OPENAI_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` from n8n environment variables set in the n8n cloud dashboard — not from this repo. Do not paste raw keys into n8n Code node source when modifying workflows via script; use `process.env.*` references instead.

### 6. Supabase: use service role key only in scripts

The `SUPABASE_SERVICE_ROLE_KEY` bypasses Row Level Security. It must only be used in server-side scripts (ingestion, setup). Never expose it to the browser. The Vite frontend has no direct Supabase connection.

### 7. Before committing, verify no secrets are staged

```bash
git diff --cached | grep -E "(sk-|eyJ|pat[a-zA-Z0-9]{10,}|Bearer )"
```

If this returns output, a secret is about to be committed. Stop and move it to `.env.local`.

---

## AI Agent Behaviour — Do Not Change Without Review

The agent's decision logic is defined in `src/vapi-system-prompt.md`. It governs four response modes:

| Mode | When |
|---|---|
| **ANSWER** | Question is general, answer exists in retrieved docs, no account-specific info needed |
| **CLARIFY** | Question is vague or has multiple interpretations |
| **ESCALATE** | Account-specific, compliance, dispute, refund, suspension, user distress |
| **DECLINE** | Retrieved context insufficient, topic not in docs, answering would require guessing |

**Critical constraints — the agent must never:**
- Access or reference account balances, transaction IDs, or identity documents
- Promise specific outcomes or timelines
- Explain internal compliance decisions
- Continue trying to resolve an issue after escalation is triggered
- Answer without first calling `search_knowledge_base`

Any changes to the system prompt must be reflected in `src/vapi-system-prompt.md` **and** applied to the VAPI assistant via `mcp__vapi__update_assistant` (assistant ID: `0aa3c7b1-e3c2-45d9-a247-8e408b0691f8`).

---

## n8n Workflows

| Workflow | ID | Webhook path | Purpose |
|---|---|---|---|
| Semantic Knowledge Base Search | `JCMOXWbIPeow6o5v` | `/webhook/relaypay-rag-search` | RAG: embed query → Supabase similarity search → return context |
| Escalation Handler | `E11jupK0jKXrbbak` | `/webhook/relaypay-escalate` | Create Airtable record, Telegram alert, Gmail confirmation |

Both workflows are active on `https://cohort2pod4.app.n8n.cloud`. Do not delete or deactivate them without building a replacement first — the VAPI assistant tools point directly to these URLs.

To rebuild a workflow from scratch:
```bash
node scripts/setup-n8n-semantic-search.mjs   # RAG workflow
node scripts/setup-n8n-escalation.mjs        # Escalation workflow
```

To re-ingest the knowledge base after document updates:
```bash
node scripts/ingest-knowledge-base.mjs
```

---

## VAPI Configuration

| Property | Value |
|---|---|
| Assistant ID | `0aa3c7b1-e3c2-45d9-a247-8e408b0691f8` |
| Model | `claude-3-7-sonnet-20250219` (Anthropic) |
| Voice | VAPI native — Elliot |
| Transcriber | Deepgram Nova-3 |
| Tool: `search_knowledge_base` | `dd0ff5f0-5dd3-44a4-b2e4-ef479e77c727` |
| Tool: `escalate_to_human` | `498bc7bf-dcf0-4188-82b2-c8286d4cc9c0` |

The VAPI public key (`VITE_VAPI_PUBLIC_KEY`) is used by the browser SDK. It is a publishable key and safe to include in the Vite build.

---

## Supabase Schema

Database: `yreewdwnpshwvsjbqbta.supabase.co`

**Table: `documents`**
```sql
id         bigserial primary key
content    text
embedding  vector(1536)        -- text-embedding-3-small output
metadata   jsonb               -- { id, source, section }
created_at timestamptz
```

**Function: `match_documents(query_embedding, match_threshold, match_count)`**
Returns rows ordered by cosine similarity. Threshold default: 0.4. Count default: 3.

To add new documents: update the `CHUNKS` array in `scripts/ingest-knowledge-base.mjs` and re-run it. The upsert is idempotent — existing chunks are overwritten by `id` in metadata.

---

## Airtable — Escalations Table

Base ID: `appqF5LmShurLV9At` | Table ID: `tbligML7SPCX2Ute1`

| Field | Type | Set by |
|---|---|---|
| Escalation ID | Auto number | Airtable |
| Timestamp | Date/time | n8n |
| User Name | Text | Agent (collected from user) |
| User Email | Email | Agent (collected from user) |
| Category | Single select | Agent (`compliance / account / dispute / other`) |
| Priority | Single select | n8n (auto: High/Medium/Low by category) |
| Escalation Reason | Long text | Agent (AI summary) |
| VAPI Call ID | Text | n8n (from VAPI payload) |
| Call Booked | Single select | n8n (default: No) |
| Appointment Time | Text | Agent (collected from user) |
| Status | Single select | n8n (default: Open) |
| Assigned To | Text | Support team |
| Resolution Notes | Long text | Support team |

---

## Brand Guidelines

- **Colors:** Deep blue `#0e2166` (primary), teal `#14b8a6` (accent), off-white `#f5f6f8` (background)
- **Font:** Inter (Google Fonts), system-ui fallback
- **Tone:** Professional, calm, minimal. No emojis, no gradients, no decorative elements.
- **Logo:** Use `/public/relaypayLogo.png` on a dark navy (`#0e2166`) background — the PNG has a dark vignette baked in.
- **Voice widget:** Contained in a white card on the off-white page background.

Do not introduce new colors outside the theme defined in `src/index.css` `@theme {}` block without explicit approval.

---

## Development

```bash
npm install        # install dependencies
npm run dev        # start dev server (http://localhost:5173)
npm run build      # typecheck + production build
npm run preview    # serve production build locally
```

The app requires a running VAPI assistant and active n8n workflows to function end-to-end. The UI will load without them but calls will fail.

---

## What Not to Do

- Do not run `git add .` or `git add -A` — stage files individually to avoid accidentally committing `.env.local` or other sensitive files
- Do not modify the VAPI system prompt without updating both `src/vapi-system-prompt.md` and the live assistant
- Do not change the n8n webhook paths without also updating the VAPI tool server URLs
- Do not add features or refactor code beyond what is explicitly requested
- Do not introduce new dependencies without checking if they are necessary
- Do not use Next.js patterns — this is a Vite project
