// Did Brevo send a transactional email to this address — what did it say, when, was it delivered?
// READ-ONLY. Usage:
//
//   node tools/brevo-email-check.mjs <email> [options]
//
//   --days N            look back N days (default 30, max 90)
//   --from YYYY-MM-DD   explicit start (use with --to; range max 90 days)
//   --to YYYY-MM-DD
//   --subject TEXT      keep only emails whose subject contains TEXT (case-insensitive)
//   --template ID       keep only this Brevo template id
//   --message-id ID     look up one message (email argument becomes optional)
//   --content           also fetch the sent HTML body + event timeline (uses the 300/h quota)
//   --max-content N     with --content: fetch at most N bodies, newest first (default 3)
//   --body-max N        truncate body text to N characters (default 4000, 0 = no limit)
//   --html              with --content: include the raw HTML as well as plain text
//   --text              human-readable output instead of JSON
//
// Output (JSON): one object per message with sent time, subject, template, delivery verdict,
// the event timeline and, with --content, the body. See docs/brevo-sahkopostitarkistus.md.

import { createBrevoClient, daysAgo, isoDate } from "./brevo-client.mjs";

function parseArgs(argv) {
  const opts = { positional: [], flags: new Set() };
  const valued = new Set(["days", "from", "to", "subject", "template", "message-id", "max-content", "body-max"]);
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      if (valued.has(key)) {
        const v = argv[++i];
        if (v === undefined) fail(`--${key} needs a value`);
        opts[key] = v;
      } else {
        opts.flags.add(key);
      }
    } else {
      opts.positional.push(a);
    }
  }
  return opts;
}

function fail(msg) {
  console.error(msg);
  console.error('Usage: node tools/brevo-email-check.mjs <email> [--days N] [--subject TEXT] [--content] [--text]');
  process.exit(1);
}

const FAILURE_EVENTS = new Set(["hardBounces", "softBounces", "blocked", "invalid", "spam", "error", "bounces"]);

/** Collapse a message's events into one verdict that answers "did the recipient get it". */
function verdict(events) {
  const names = new Set(events.map((e) => e.event));
  const failures = events.filter((e) => FAILURE_EVENTS.has(e.event));
  if (names.has("delivered")) {
    // A later failure after delivery is unusual but possible (e.g. spam complaint) — surface it.
    return failures.length ? "delivered_with_later_problem" : "delivered";
  }
  if (failures.length) return "failed";
  if (names.has("deferred")) return "deferred";
  if (names.has("requests")) return "sent_no_delivery_confirmation";
  return "no_events_found";
}

function htmlToText(html) {
  return html
    .replace(/<(style|script)[\s\S]*?<\/\1>/gi, "")
    .replace(/<br\s*\/?>|<\/(p|div|tr|h[1-6]|li)>/gi, "\n")
    .replace(/<a\b[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, "$2 [$1]")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function main() {
  const o = parseArgs(process.argv.slice(2));
  const email = o.positional[0];
  const messageId = o["message-id"];
  const templateId = o.template ? Number(o.template) : undefined;
  if (!email && !messageId && !templateId) fail("Give an email address, --message-id or --template.");
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) fail(`Not an email address: ${email}`);

  let startDate, endDate;
  if (o.from || o.to) {
    if (!o.from || !o.to) fail("--from and --to must be used together");
    startDate = o.from;
    endDate = o.to;
  } else {
    const days = o.days ? Number(o.days) : 30;
    if (!Number.isInteger(days) || days < 1 || days > 90) fail("--days must be an integer 1..90");
    endDate = isoDate(new Date());
    startDate = daysAgo(days - 1);
  }
  const spanDays = (new Date(endDate) - new Date(startDate)) / 86_400_000 + 1;
  if (!(spanDays >= 1) || spanDays > 90) fail("Date range must be 1..90 days (Brevo's events limit)");

  const client = createBrevoClient();

  const [sent, events] = await Promise.all([
    client.listSentEmails({ email, templateId, messageId, startDate, endDate }),
    client.listEvents({ email, templateId, messageId, startDate, endDate }),
  ]);

  const eventsByMessage = new Map();
  for (const e of events) {
    if (!eventsByMessage.has(e.messageId)) eventsByMessage.set(e.messageId, []);
    eventsByMessage.get(e.messageId).push(e);
  }

  let messages = sent.map((m) => {
    const ev = (eventsByMessage.get(m.messageId) ?? []).sort((a, b) => String(a.date).localeCompare(String(b.date)));
    const opened = ev.filter((e) => e.event === "opened");
    return {
      sentAt: m.date,
      email: m.email,
      subject: m.subject,
      from: m.from ?? null,
      templateId: m.templateId ?? null,
      tags: m.tags ?? [],
      messageId: m.messageId,
      uuid: m.uuid,
      verdict: verdict(ev),
      deliveredAt: ev.find((e) => e.event === "delivered")?.date ?? null,
      firstOpenedAt: opened[0]?.date ?? null,
      clicks: ev.filter((e) => e.event === "clicks").length,
      problems: ev
        .filter((e) => FAILURE_EVENTS.has(e.event))
        .map((e) => ({ at: e.date, event: e.event, reason: e.reason ?? null })),
      events: ev.map((e) => ({ at: e.date, event: e.event, ...(e.reason ? { reason: e.reason } : {}), ...(e.link ? { link: e.link } : {}) })),
    };
  });

  if (o.subject) {
    const needle = o.subject.toLowerCase();
    messages = messages.filter((m) => String(m.subject).toLowerCase().includes(needle));
  }

  if (o.flags.has("content")) {
    const max = o["max-content"] ? Number(o["max-content"]) : 3;
    const bodyMax = o["body-max"] !== undefined ? Number(o["body-max"]) : 4000;
    for (const m of messages.slice(0, max)) {
      try {
        const c = await client.getEmailContent(m.uuid);
        const text = c.body ? htmlToText(c.body) : null;
        m.content = {
          text: text && bodyMax > 0 && text.length > bodyMax ? text.slice(0, bodyMax) + `\n…[truncated, ${text.length} chars]` : text,
          ...(o.flags.has("html") ? { html: c.body ?? null } : {}),
          attachmentCount: c.attachmentCount ?? 0,
          timeline: c.events ?? [],
        };
      } catch (e) {
        m.content = { error: e.message };
      }
    }
    if (messages.length > max) {
      console.error(`Note: bodies fetched for the newest ${max} of ${messages.length}; raise --max-content for more.`);
    }
  }

  const result = {
    query: { email: email ?? null, messageId: messageId ?? null, templateId: templateId ?? null, startDate, endDate },
    found: messages.length,
    messages,
    caveats: [
      "Delivered means the recipient's mail server accepted the message, not that a person read it.",
      "opened/clicks can be inflated by privacy proxies (events named loadedByProxy are Apple Mail Privacy Protection etc.); no open event does not prove it was unread.",
      "An empty result may also mean the message is older than Brevo's log retention or was sent from another Brevo account.",
    ],
  };

  if (o.flags.has("text")) printText(result);
  else console.log(JSON.stringify(result, null, 2));
}

function printText(r) {
  console.log(`Brevo: ${r.query.email ?? r.query.messageId ?? "template " + r.query.templateId}  ${r.query.startDate} .. ${r.query.endDate}`);
  console.log(`${r.found} message(s)\n`);
  for (const m of r.messages) {
    console.log(`${m.sentAt}  [${m.verdict}]  ${m.subject}`);
    console.log(`  to ${m.email}  template ${m.templateId ?? "-"}  messageId ${m.messageId}`);
    console.log(`  delivered ${m.deliveredAt ?? "-"}  opened ${m.firstOpenedAt ?? "-"}  clicks ${m.clicks}`);
    for (const p of m.problems) console.log(`  PROBLEM ${p.at} ${p.event}${p.reason ? ": " + p.reason : ""}`);
    if (m.content?.text) console.log("  --- body ---\n" + m.content.text.replace(/^/gm, "  "));
    if (m.content?.error) console.log("  content error: " + m.content.error);
    console.log();
  }
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
