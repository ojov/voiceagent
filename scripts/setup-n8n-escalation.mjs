/**
 * RelayPay — n8n Escalation Workflow Setup
 * Usage: node scripts/setup-n8n-escalation.mjs
 */

import { N8N_BASE_URL, N8N_API_KEY, AIRTABLE_KEY, AIRTABLE_BASE, AIRTABLE_TABLE, TELEGRAM_TOKEN, TELEGRAM_CHAT } from "./_env.mjs";

const GMAIL_CRED_ID = "TOh8WnN9niiUKidi";
const WEBHOOK_PATH  = "relaypay-escalate";

const PARSE_CODE = `
const body = $input.first().json;
let args = {};
try {
  const raw = body?.message?.toolCallList?.[0]?.function?.arguments;
  args = typeof raw === "string" ? JSON.parse(raw) : (raw || body);
} catch { args = body; }

const callId        = body?.message?.call?.id || body?.callId || "unknown";
const userName      = args.userName      || args.user_name      || "Unknown";
const userEmail     = args.userEmail     || args.user_email     || "";
const category      = args.category      || "other";
const reason        = args.reason        || "No reason provided";
const preferredTime = args.preferredTime || args.preferred_time || "Not specified";
const PRIORITY      = { compliance: "High", dispute: "High", account: "Medium", other: "Low" };
const priority      = PRIORITY[category.toLowerCase()] || "Low";

return [{ json: {
  callId, userName, userEmail, category, priority, reason, preferredTime,
  airtableFields: {
    "Timestamp": new Date().toISOString(),
    "User Name": userName, "User Email": userEmail,
    "Category": category.toLowerCase(), "Priority": priority,
    "Escalation Reason": reason, "VAPI Call ID": callId,
    "Call Booked": "No", "Appointment Time": preferredTime, "Status": "Open",
  },
  telegramText:
    "🚨 *New Escalation — RelayPay Support*\\n\\n" +
    "*Category:* " + category + "\\n*Priority:* " + priority + "\\n" +
    "*Customer:* " + userName + " (" + userEmail + ")\\n" +
    "*Issue:* " + reason + "\\n*Preferred call time:* " + preferredTime + "\\n" +
    "*VAPI Call ID:* " + callId,
}}];
`;

const RESPOND_CODE = `
const parsed = $('Parse Payload').first().json;
const recId  = $('Create Airtable Record').first().json?.id || "N/A";
return [{ json: {
  escalationId: recId,
  message: "Your request has been logged and our team has been notified. A RelayPay specialist will reach out at your preferred time. You will receive a confirmation email shortly. Reference: " + recId + ".",
}}];
`;

const workflow = {
  name: "RelayPay — Escalation Handler",
  nodes: [
    { id: "node-1", name: "Webhook", type: "n8n-nodes-base.webhook", typeVersion: 2, position: [200, 300],
      parameters: { path: WEBHOOK_PATH, responseMode: "responseNode", options: {} }, webhookId: WEBHOOK_PATH },
    { id: "node-2", name: "Parse Payload", type: "n8n-nodes-base.code", typeVersion: 2, position: [460, 300],
      parameters: { jsCode: PARSE_CODE } },
    { id: "node-3", name: "Create Airtable Record", type: "n8n-nodes-base.httpRequest", typeVersion: 4.2, position: [720, 180],
      parameters: {
        method: "POST",
        url: `https://api.airtable.com/v0/${AIRTABLE_BASE}/${AIRTABLE_TABLE}`,
        sendHeaders: true,
        headerParameters: { parameters: [
          { name: "Authorization", value: `Bearer ${AIRTABLE_KEY}` },
          { name: "Content-Type",  value: "application/json" },
        ]},
        sendBody: true, contentType: "json", specifyBody: "json",
        jsonBody: '={{ JSON.stringify({ fields: $json.airtableFields }) }}',
      }},
    { id: "node-4", name: "Telegram Alert", type: "n8n-nodes-base.httpRequest", typeVersion: 4.2, position: [720, 300],
      parameters: {
        method: "POST",
        url: `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`,
        sendBody: true, contentType: "json", specifyBody: "json",
        jsonBody: `={{ JSON.stringify({ chat_id: "${TELEGRAM_CHAT}", text: $('Parse Payload').first().json.telegramText, parse_mode: "Markdown" }) }}`,
      }},
    { id: "node-5", name: "Email Confirmation", type: "n8n-nodes-base.gmail", typeVersion: 2.1, position: [720, 420],
      parameters: {
        operation: "send",
        sendTo:    "={{ $('Parse Payload').first().json.userEmail }}",
        subject:   "Your RelayPay support request has been received",
        emailType: "text",
        message: `={{
"Hi " + $('Parse Payload').first().json.userName + ",\\n\\n" +
"Thank you for reaching out to RelayPay Support.\\n\\n" +
"We have received your request and a specialist will contact you at your preferred time: " + $('Parse Payload').first().json.preferredTime + ".\\n\\n" +
"Issue summary: " + $('Parse Payload').first().json.reason + "\\n\\n" +
"Reference: " + $('Create Airtable Record').first().json.id + "\\n\\n" +
"Best regards,\\nRelayPay Support Team"
}}`,
      },
      credentials: { gmailOAuth2: { id: GMAIL_CRED_ID, name: "Gmail OAuth2 API" } },
    },
    { id: "node-6", name: "Build Response", type: "n8n-nodes-base.code", typeVersion: 2, position: [980, 300],
      parameters: { jsCode: RESPOND_CODE } },
    { id: "node-7", name: "Respond to Webhook", type: "n8n-nodes-base.respondToWebhook", typeVersion: 1, position: [1240, 300],
      parameters: { respondWith: "json", responseBody: "={{ $json }}" } },
  ],
  connections: {
    "Webhook":                { main: [[{ node: "Parse Payload",          type: "main", index: 0 }]] },
    "Parse Payload":          { main: [[{ node: "Create Airtable Record", type: "main", index: 0 }, { node: "Telegram Alert", type: "main", index: 0 }]] },
    "Create Airtable Record": { main: [[{ node: "Email Confirmation",     type: "main", index: 0 }]] },
    "Telegram Alert":         { main: [[{ node: "Build Response",         type: "main", index: 0 }]] },
    "Email Confirmation":     { main: [[{ node: "Build Response",         type: "main", index: 0 }]] },
    "Build Response":         { main: [[{ node: "Respond to Webhook",     type: "main", index: 0 }]] },
  },
  settings: { executionOrder: "v1" },
};

async function n8n(path, method = "GET", body) {
  const res = await fetch(`${N8N_BASE_URL}/api/v1${path}`, {
    method,
    headers: { "X-N8N-API-KEY": N8N_API_KEY, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  try { return { ok: res.ok, status: res.status, data: JSON.parse(text) }; }
  catch { return { ok: res.ok, status: res.status, data: text }; }
}

const create = await n8n("/workflows", "POST", workflow);
if (!create.ok) { console.error("❌ Failed:", create.data); process.exit(1); }
const workflowId = create.data.id;
console.log(`✅ Created — ID: ${workflowId}`);

const activate = await n8n(`/workflows/${workflowId}/activate`, "POST");
console.log(activate.ok ? "✅ Activated" : "⚠️  " + JSON.stringify(activate.data));
console.log(`\nWebhook URL: ${N8N_BASE_URL}/webhook/${WEBHOOK_PATH}`);
