/**
 * Shared env loader for scripts.
 * Reads from .env.local (gitignored) using Node's --env-file flag or manual parse.
 */
import { readFileSync } from "fs";
import { resolve } from "path";

function loadEnv() {
  try {
    const file = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
    for (const line of file.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    // .env.local missing — rely on real env vars being set
  }
}

loadEnv();

export const OPENAI_KEY     = process.env.OPENAI_API_KEY          || die("OPENAI_API_KEY");
export const SUPABASE_URL   = process.env.SUPABASE_URL            || die("SUPABASE_URL");
export const SUPABASE_KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY || die("SUPABASE_SERVICE_ROLE_KEY");
export const N8N_BASE_URL   = process.env.N8N_BASE_URL            || die("N8N_BASE_URL");
export const N8N_API_KEY    = process.env.N8N_API_KEY             || die("N8N_API_KEY");
export const AIRTABLE_KEY   = process.env.AIRTABLE_API_KEY        || die("AIRTABLE_API_KEY");
export const AIRTABLE_BASE  = process.env.AIRTABLE_BASE_ID        || die("AIRTABLE_BASE_ID");
export const AIRTABLE_TABLE = process.env.AIRTABLE_TABLE_ID       || die("AIRTABLE_TABLE_ID");
export const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN      || die("TELEGRAM_BOT_TOKEN");
export const TELEGRAM_CHAT  = process.env.TELEGRAM_CHAT_ID        || die("TELEGRAM_CHAT_ID");

function die(key) {
  console.error(`❌ Missing required env var: ${key}`);
  process.exit(1);
}
