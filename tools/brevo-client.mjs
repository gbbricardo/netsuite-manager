// Minimal, dependency-free, READ-ONLY Brevo transactional-email client.
//
// Source: https://developers.brevo.com/reference/quickstart-reference
//   GET /v3/smtp/emails                 list of sent transactional emails (messageId, uuid, subject, date, ...)
//   GET /v3/smtp/emails/{uuid}          personalised content of one sent email (HTML body + event timeline)
//   GET /v3/smtp/statistics/events      unaggregated events (requests, delivered, opened, bounces, ...)
//
// This client only issues GET requests. It cannot send mail or change anything in Brevo.
//
// The API key is read from the BREVO_API_KEY environment variable, or in place from
// cf-gbb-tools/.dev.vars (same convention as netsuite-auth.mjs). It is never copied into this
// repository and never printed.

import { readFileSync } from "node:fs";
import { join } from "node:path";

const BASE_URL = "https://api.brevo.com/v3";

const DEFAULT_DEV_VARS = join(
  process.env.GBB_TOOLS_DIR ?? join(process.cwd(), "..", "cf-gbb-tools"),
  ".dev.vars"
);

export function loadApiKey(devVarsPath = DEFAULT_DEV_VARS) {
  if (process.env.BREVO_API_KEY) return process.env.BREVO_API_KEY.trim();

  let raw = "";
  try {
    raw = readFileSync(devVarsPath, "utf8");
  } catch {
    // fall through to the error below
  }
  const match = /^\s*BREVO_API_KEY\s*=\s*(.*)$/m.exec(raw);
  if (match) {
    let value = match[1].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (value) return value;
  }
  throw new Error(
    "Brevo API key not found. Set the BREVO_API_KEY environment variable, or add a " +
      `BREVO_API_KEY=... line to ${devVarsPath} (GBB_TOOLS_DIR overrides the folder). ` +
      "Create a key in Brevo: SMTP & API > API Keys."
  );
}

export function createBrevoClient(apiKey = loadApiKey()) {
  /** GET with query params; retries up to twice on 429 using Brevo's reset header. */
  async function get(path, params = {}) {
    const url = new URL(BASE_URL + path);
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
    }

    for (let attempt = 0; ; attempt++) {
      const res = await fetch(url, {
        method: "GET",
        headers: { "api-key": apiKey, accept: "application/json" },
      });

      if (res.status === 429 && attempt < 2) {
        const resetSec = Number(res.headers.get("x-sib-ratelimit-reset"));
        const waitMs = Math.min(Math.max((resetSec || 1) * 1000, 1000), 10_000);
        await new Promise((r) => setTimeout(r, waitMs));
        continue;
      }

      const text = await res.text();
      let body;
      try {
        body = text ? JSON.parse(text) : {};
      } catch {
        body = { raw: text };
      }
      if (!res.ok) {
        const err = new Error(
          `Brevo ${res.status} on GET ${path}: ${body.message ?? text.slice(0, 200)}` +
            (res.status === 401 ? " (invalid or missing API key)" : "") +
            (res.status === 429
              ? " (rate limit: /v3/smtp/statistics/events and /v3/smtp/emails/{uuid} are only 300 requests/hour on the General plan)"
              : "")
        );
        err.status = res.status;
        err.body = body;
        throw err;
      }
      return body;
    }
  }

  /** Walk a limit/offset paginated endpoint. */
  async function paginate(path, params, pickArray, pageSize, maxItems) {
    const out = [];
    for (let offset = 0; out.length < maxItems; offset += pageSize) {
      const page = await get(path, { ...params, limit: pageSize, offset });
      const items = pickArray(page) ?? [];
      out.push(...items);
      if (items.length < pageSize) break;
    }
    return out.slice(0, maxItems);
  }

  return {
    get,

    /**
     * Sent transactional emails. Brevo caps a startDate/endDate range at one month, so longer
     * ranges are split into <=30-day windows. Needs email, templateId or messageId.
     */
    async listSentEmails({ email, templateId, messageId, startDate, endDate, maxItems = 500 }) {
      const windows = splitWindows(startDate, endDate, 30);
      const seen = new Map();
      for (const w of windows) {
        const items = await paginate(
          "/smtp/emails",
          { email, templateId, messageId, startDate: w.start, endDate: w.end, sort: "desc" },
          (p) => p.transactionalEmails,
          500,
          maxItems
        );
        for (const m of items) seen.set(m.uuid ?? `${m.messageId}|${m.date}`, m);
      }
      return [...seen.values()].sort((a, b) => String(b.date).localeCompare(String(a.date)));
    },

    /** Unaggregated events (max 90-day range). */
    async listEvents({ email, messageId, templateId, event, startDate, endDate, maxItems = 2500 }) {
      return paginate(
        "/smtp/statistics/events",
        { email, messageId, templateId, event, startDate, endDate, sort: "desc" },
        (p) => p.events,
        2500,
        maxItems
      );
    },

    /** Personalised content + event timeline of one sent email. The path parameter is the uuid. */
    getEmailContent(uuid) {
      return get(`/smtp/emails/${encodeURIComponent(uuid)}`);
    },
  };
}

// ---------- date helpers (UTC, YYYY-MM-DD as Brevo expects) ----------

export function isoDate(d) {
  return d.toISOString().slice(0, 10);
}

export function daysAgo(n, from = new Date()) {
  const d = new Date(from);
  d.setUTCDate(d.getUTCDate() - n);
  return isoDate(d);
}

function splitWindows(startDate, endDate, maxDays) {
  const start = new Date(startDate + "T00:00:00Z");
  const end = new Date(endDate + "T00:00:00Z");
  const windows = [];
  for (let cur = new Date(start); cur <= end; ) {
    const winEnd = new Date(cur);
    winEnd.setUTCDate(winEnd.getUTCDate() + maxDays - 1);
    const clipped = winEnd > end ? end : winEnd;
    windows.push({ start: isoDate(cur), end: isoDate(clipped) });
    cur = new Date(clipped);
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return windows;
}
