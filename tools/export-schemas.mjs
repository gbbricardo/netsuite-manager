// Exports NetSuite schemas for every record, list and script the sibling projects touch,
// into schemas/ as both raw JSON and agent-readable Markdown.
//
//   node tools/export-schemas.mjs            # everything
//   node tools/export-schemas.mjs records    # one section: records | lists | scripts
//
// Re-run whenever NetSuite customisation changes. The generated files are the cache agents
// read instead of querying NetSuite for routine field questions.

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { loadConfig, getAccessToken, createClient } from "./netsuite-auth.mjs";

const ROOT = join(import.meta.dirname, "..");
const SCHEMAS = join(ROOT, "schemas");

/** Records read or written by more than one sibling project, plus their immediate parents. */
const RECORDS = [
  ["customrecord_sta_bike_register", "[STA] Bike Register"],
  ["customrecord_subscrption_change_request", "[GBB] Subscription change request"],
  ["customrecord_sta_ca_agreement_row", "Subscription line"],
  ["customrecord_sta_customer_agreement", "Customer Agreement"],
  ["customrecord_payment_requests", "[GBB] Payment requests"],
  ["customrecord_gbb_monthly_reporting_item", "[GBB] Monthly reporting item"],
  ["customrecord_sta_contract_prices", "Contract price"],
];

/** Custom lists whose internal IDs are hard-coded into script logic. */
const LIST_PREFIXES = ["customlist_cr_", "customlist_sta_", "customlist_gbb_", "customlist_pl_", "customlist_paylink_"];

const jsonType = (schema) => {
  if (schema?.type === "object") return "select (record/list ref)";
  if (schema?.format === "date") return "date";
  if (schema?.format === "date-time") return "datetime";
  if (schema?.type === "number") return `number (${schema.format ?? "double"})`;
  if (schema?.type === "integer") return "integer";
  if (schema?.type === "boolean") return "checkbox";
  if (schema?.type === "string") return "text";
  return schema?.type ?? "unknown";
};

function recordMarkdown(scriptId, label, schema) {
  const props = schema?.properties ?? {};
  const filterable = new Set(schema?.["x-ns-filterable"] ?? []);
  const rows = Object.entries(props)
    .filter(([, v]) => v?.type !== "object" || !v?.properties?.items) // drop sublist wrappers
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([id, v]) => {
      const title = (v.title ?? (v.type === "object" ? "" : "")).replace(/\|/g, "\\|");
      return `| \`${id}\` | ${title} | ${jsonType(v)} | ${filterable.has(id) ? "yes" : "no"} |`;
    });

  return [
    `# ${label}`,
    "",
    `**Record type:** \`${scriptId}\`  `,
    `**Fields:** ${rows.length}  `,
    `**Exported:** ${new Date().toISOString().slice(0, 10)} — raw schema in [\`raw/${scriptId}.json\`](raw/${scriptId}.json)`,
    "",
    "`Filterable` means the field can be used in a SuiteQL/REST `WHERE` clause.",
    "Select fields resolve to `{id, refName, externalId}`; compare against the **internal id**,",
    "never the label. See [`../lists/`](../lists/) for what those ids mean.",
    "",
    "| Field ID | Label | Type | Filterable |",
    "|---|---|---|---|",
    ...rows,
    "",
  ].join("\n");
}

async function exportRecords(client) {
  mkdirSync(join(SCHEMAS, "records", "raw"), { recursive: true });
  const index = [];

  for (const [scriptId, label] of RECORDS) {
    process.stdout.write(`  ${scriptId} ... `);
    const response = await client.recordMetadata(scriptId);
    const schema = response?.metadata ?? response;
    writeFileSync(
      join(SCHEMAS, "records", "raw", `${scriptId}.json`),
      JSON.stringify(schema, null, 2)
    );
    writeFileSync(join(SCHEMAS, "records", `${scriptId}.md`), recordMarkdown(scriptId, label, schema));
    const count = Object.keys(schema?.properties ?? {}).length;
    index.push(`| [\`${scriptId}\`](${scriptId}.md) | ${label} | ${count} |`);
    console.log(`${count} fields`);
  }

  writeFileSync(
    join(SCHEMAS, "records", "README.md"),
    [
      "# Record schemas",
      "",
      `Exported from live NetSuite on ${new Date().toISOString().slice(0, 10)} by \`tools/export-schemas.mjs\`.`,
      "",
      "| Record | Label | Fields |",
      "|---|---|---|",
      ...index,
      "",
    ].join("\n")
  );
}

async function exportLists(client) {
  mkdirSync(join(SCHEMAS, "lists"), { recursive: true });

  const lists = await client.suiteQL(
    "SELECT id, scriptid, name, description FROM CustomList ORDER BY scriptid"
  );
  const relevant = lists.filter((l) =>
    LIST_PREFIXES.some((p) => String(l.scriptid ?? "").toLowerCase().startsWith(p))
  );

  const sections = [];
  for (const list of relevant) {
    const table = String(list.scriptid).toUpperCase();
    process.stdout.write(`  ${list.scriptid} ... `);
    let values;
    try {
      values = await client.suiteQL(`SELECT id, name, isinactive FROM ${table} ORDER BY id`);
    } catch (error) {
      console.log(`SKIPPED (${String(error.message).slice(0, 60)})`);
      continue;
    }
    console.log(`${values.length} values`);

    sections.push(
      [
        `## \`${list.scriptid}\` — ${list.name}`,
        "",
        list.description ? `${list.description}\n` : "",
        "| ID | Value | Inactive |",
        "|---|---|---|",
        ...values.map(
          (v) => `| ${v.id} | ${String(v.name ?? "").replace(/\|/g, "\\|")} | ${v.isinactive === "T" ? "**yes**" : ""} |`
        ),
        "",
      ].join("\n")
    );
  }

  writeFileSync(join(SCHEMAS, "lists", "raw-customlist-index.json"), JSON.stringify(lists, null, 2));
  writeFileSync(
    join(SCHEMAS, "lists", "README.md"),
    [
      "# Custom list values",
      "",
      `Exported from live NetSuite on ${new Date().toISOString().slice(0, 10)} by \`tools/export-schemas.mjs\`.`,
      "",
      "These internal IDs are **hard-coded into the sibling projects' scripts** — none of it is",
      "configuration. An ID that changes here breaks scripts silently; see the asymmetry notes in",
      "`../../CLAUDE.md`. `Inactive` values still resolve for existing records but cannot be set.",
      "",
      ...sections,
    ].join("\n")
  );
}

async function exportScripts(client) {
  mkdirSync(SCHEMAS, { recursive: true });
  process.stdout.write("  script + scriptDeployment ... ");

  const scripts = await client.suiteQL(
    `SELECT s.id, s.scriptid, s.name, s.scripttype, s.isinactive, s.scriptfile
       FROM script s
      WHERE LOWER(s.scriptid) LIKE 'customscript_gbb%'
         OR LOWER(s.scriptid) LIKE 'customscript_sta%'
         OR LOWER(s.scriptid) LIKE 'customscript_cr%'
         OR LOWER(s.scriptid) LIKE '%paylink%'
      ORDER BY s.scriptid`
  );
  const deployments = await client.suiteQL(
    `SELECT d.id, d.scriptid, d.script, d.status, d.isdeployed, d.title
       FROM scriptDeployment d
      ORDER BY d.scriptid`
  );
  console.log(`${scripts.length} scripts, ${deployments.length} deployments`);

  const byScript = new Map();
  for (const d of deployments) {
    if (!byScript.has(String(d.script))) byScript.set(String(d.script), []);
    byScript.get(String(d.script)).push(d);
  }

  writeFileSync(
    join(SCHEMAS, "script-inventory.json"),
    JSON.stringify({ exportedAt: new Date().toISOString(), scripts, deployments }, null, 2)
  );

  const rows = scripts.map((s) => {
    const deps = byScript.get(String(s.id)) ?? [];
    const state = deps.length
      ? deps
          .map((d) => `${d.status ?? "?"}${d.isdeployed === "F" ? " (not deployed)" : ""}`)
          .join(", ")
      : "**no deployment**";
    return `| \`${s.scriptid}\` | ${s.name ?? ""} | ${s.scripttype ?? ""} | ${s.isinactive === "T" ? "**inactive**" : "active"} | ${state} |`;
  });

  writeFileSync(
    join(SCHEMAS, "script-inventory.md"),
    [
      "# Script and deployment inventory",
      "",
      `Exported from live NetSuite on ${new Date().toISOString().slice(0, 10)} by \`tools/export-schemas.mjs\`.`,
      "",
      "This is the **live** answer to \"what is actually deployed\". Compare it against each sibling",
      "repo's own claimed status before trusting that repo's documentation — they are known to drift.",
      "A script with no deployment, or an inactive one, is a finding worth chasing.",
      "",
      "| Script ID | Name | Type | Script record | Deployment status |",
      "|---|---|---|---|---|",
      ...rows,
      "",
    ].join("\n")
  );
}

const SECTIONS = { records: exportRecords, lists: exportLists, scripts: exportScripts };

const requested = process.argv.slice(2);
const toRun = requested.length ? requested : Object.keys(SECTIONS);
for (const name of toRun) {
  if (!SECTIONS[name]) {
    console.error(`Unknown section "${name}". Available: ${Object.keys(SECTIONS).join(", ")}`);
    process.exit(1);
  }
}

const config = loadConfig();
console.log(`NetSuite account ${config.accountId} — authenticating...`);
const client = createClient(config, await getAccessToken(config));

for (const name of toRun) {
  console.log(`\n${name}:`);
  await SECTIONS[name](client);
}
console.log("\nDone. Cached under schemas/.");
