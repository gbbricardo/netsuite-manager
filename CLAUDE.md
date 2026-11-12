# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Read First — Open Work

> [!IMPORTANT]
> **`TASKS.md` is the dated to-do list — check it at the start of every session** and tell the user
> which tasks are due today or overdue before starting anything else. **It holds open tasks only.** When
> you finish one, mark it `[x]` with date and result, then move the whole block to
> [`archive/TASKS-valmiit.md`](archive/TASKS-valmiit.md) in the same session (the archive is history,
> with a task-ID index at the top: look an old task up there, and re-verify its state in NetSuite before
> relying on it). Last cleaned 9.11.2026.

> [!IMPORTANT]
> **`docs/lunastus-tilanne.md` is the live status of the redemption project.** Read it at the start
> of any session that touches redemption, the bike register's end-state fields, or the scripts
> listed in it. It carries the current metrics, what is verified in production, and the next tasks.
> Update it when you change any of those.

### Open items — pointers

Tasks and deadlines are in `TASKS.md`, the live status in `docs/lunastus-tilanne.md`. The 22.09.–7.10. open-items table, the gate-quadrant
queries and the phase-3 plan are archived verbatim in [`archive/CLAUDE-avoimet-asiat-2026-11-10.md`](archive/CLAUDE-avoimet-asiat-2026-11-10.md)
(history: re-verify before relying). Rules that outlive the tasks:

- **Monthly runs:** work through [`queries/kuukausiajo-tarkistuslista.md`](queries/kuukausiajo-tarkistuslista.md) before the payroll CSV (1451). `ri_creation`/`ri_update` have no dry-run, and a throw on an unrecognised date loses that bike's row silently.
- **Status-sync 2.0 (script 1480, nightly 00:30 Helsinki)** replaced the old sweep 1440 on 6.10. ([ADR 0007](docs/adr/0007-status-sync-2-tasmaytysajo.md), [ADR 0015](docs/adr/0015-status-sync-2-tarkennukset.md), `docs/status-sync-2-tasmaytysajo.md`). A *Paid In Full* invoice can be a fully credited one: never widen the payment window without the credit check. CSV imports do not fire `ue_gbb_redemption_decided_at`.
- **End-of-term redemption** ([ADR 0009](docs/adr/0009-kauden-lopun-lunastus.md), `docs/lunastuksen-kenttasaannot.md` § 9): OOMI bikes are Redeemed in their end month without payment (`paid_at` empty is correct). The extension ends once paid type-7 invoices cover `end_redemption_price`.
- **Mid-term redemption** ([ADR 0010](docs/adr/0010-keskenkauden-lunastus.md), § 10): the type-2 CR alone is decision and evidence. The exceptional end-date fields are abandoned; the registers' `subsc_end_date` is the truth.
- **Payment Link 1479 anchors the maintenance refund on `MONTHS_BETWEEN(subsc_end_date, subsc_org_end_date)`**, and `handler_jalki` moves `subsc_end_date` once per jälkiveloitus month. Any settlement method 3/4 or link on a bike with a Done *pidennys – jälkiveloitus* CR is suspect until that is fixed (`findings/2026-10-02-maksulinkki-ensimmainen-ajo.md`, T30–T38).
- **The gate quadrant is how you read a CR run:** the cell *bike status 2 or 3 with an end date in the future* must stay empty. Query in the archive file. Any bike flipped to status 2 early means the gate is not holding: stop before more CRs run.
- **A deployment's `status` does not tell whether scheduling is on** (`scriptdeployment.recurrence` is `NOT_EXPOSED`). Confirm a schedule by runs in `scriptnote`.
- **`custrecord_gbb_date_to_non_active` is filled with a delay of hours** by script 1458 (*Bike status date backfill*, daily about 02:01 log time, reads System Notes). An empty value right after a sweep is normal.
- **Reporting is the `netsuite-reporting` tool in `cf-gbb-tools`** (business decision 10.11.2026). No separate sent or investigated report is made. The checks are defined in [`docs/poikkeamaraportointi-vaatimukset.md`](docs/poikkeamaraportointi-vaatimukset.md); coverage of every defined check is T107.

> [!TIP]
> **Read script execution logs from SuiteQL table `scriptnote`** (`scriptexecutionlog` fails with
> `Invalid search type`). Its column **`scripttype` holds the script's internal id**, not a type.
> Internal ids: **1452** ri_creation, **1453** ri_update, **1440** old sweep (NOTSCHEDULED since 6.10.), **1480** status-sync 2.0 (nightly 00:30 Helsinki, `customscript_gbb_mr_redemption_sync2`), **1437** subscription extension (NOTSCHEDULED 9.10.), **1199** CR handler (`customdeploy1` every 6 h; MONTHLY `customdeploy_gbb_change_request_hdl_2` on the 1st 01:33),
> **1196** CR bike-register updater, **1479** end-redemption Payment Link. The id in a `scriptrecord.nl?id=` URL is a different id.
> `date` carries a time component, so filter with a range, never `date = TO_DATE(…)`.
>
> **The log's own date is the runtime clock, ~10 h behind Helsinki**, so late-evening Finnish runs
> are logged under the previous day. On 22.09.2026 the sweep logged `tunnistuspäivä=2026-09-22`
> while its log rows were dated 21.09. — that is `tanaanHelsinki()` doing its job, not a defect.


### Decision: in a mid-term redemption the CR beats the payment (ADR 0008, 23.09.2026)

For a **mid-term redemption** (CR type 2 *Keskenkauden lunastus*), the settle method and
`custrecord_gbb_liab_settled_at` come from the change request (`custrecord_cr_created_date`), even
when the payment reached NetSuite earlier. A payment arriving before the CR is processed is
**normal, not an error**. A payment on its own must **not** end billing or monthly reporting
without a CR. End-of-term redemptions are unaffected: they normally have no CR (687/687 since
21.09.), and the payment remains sufficient there. Do not report `liab_settled_at` ≠
`paid_at` on a bike with a Done type-2 CR as a §5 violation.
See `docs/adr/0008-keskenkauden-lunastuksessa-cr-voittaa-maksun.md`.

### One trap to know before you measure anything

The redemption project's headline metric in `docs/lunastuksen-kenttasaannot.md` §8 was **wrong until
21.09.2026** and would have read a correctly working system as a fourfold regression (847 vs the
true 4). The operational anchor is the **first day of the end month**, not the end date — a bike
whose lease ends mid-month is legitimately Redeemed before its own end date. If a redemption metric
suddenly looks catastrophic, check the query against §3 before believing it.

### CR statuses

`customrecord_subscrption_change_request.custrecord_cr_status`: -1 New, 1 Pending, 2 Done, **3 In Progress**, 5 Error, 6 Needs Review, 7 Cancelled
([`schemas/lists/README.md`](schemas/lists/README.md)). The CR scheduler (script 1199) selects only `status = 1 AND closed_date IS NULL`, and since 10.11.2026
the dispatcher sets 3 before the handler runs (T102). A CR left in 3 is never re-picked and needs a human check before it is reset to Pending:
the handler may already have created an invoice. Any query that means "open CR" must decide whether 3 belongs in it (T103–T106 list the readers that do not yet).


## Working agreement

- **Discuss until the user says go.** While a topic is being discussed, propose, weigh options and refine wording, but edit nothing. A request such as "record X" or "do Y" counts as go for the files it names, and only for those. Never create a new file without separate permission.
- **Do not multiply Markdown files.** An investigation, finding, change or decision does not get its own file by default. Answer in the conversation, or add to the file that already holds the topic (`TASKS.md`, `docs/lunastus-tilanne.md`, the relevant ADR). A new file needs the user's explicit approval.
- **The main session supervises; it does not build.** It writes no code and changes no scripts. It spawns subagents for that work, briefs them (scope, model, effort, prompt), and is accountable for everything they do. A subagent may change only the repository it is assigned, in practice one sibling repo, never this one unless told so.

## Sibling change workflow

Every code change to a sibling repo follows this order. The main session orchestrates and reports; it writes no code.

1. **Propose and discuss.** The main session proposes the change; nothing is edited. Load the `kaizen` skill before proposing. Every proposal starts with the option that removes or merges an existing path (field, CR type, script, exception rule). A new addition is allowed only once justified, and the proposal names the new branches it creates: which other readers, queries, repos and ADRs it touches. Once the user agrees it is warranted, the user runs `/grill-me` (small, isolated change) or `/grill-with-docs` (touches business rules, field semantics, CR types or an ADR). Both are user-invoked only; the main session says which and why. `/grill-with-docs` writes ADRs and glossary entries: that is the user's approval for those files.
2. **The user defines the change** (specification with acceptance criteria). The main session does not start the pipeline before that.
3. **Run `.claude/workflows/sibling-change.js`** (`mode: "change"`): version-control agent prepares a clean default branch and a new branch, the development agent (ponytail plugin) implements, the review agent (netsuite-suitecloud plugin for SuiteScript) reviews independently against the specification and runs the tests, up to 3 rounds. The documentation agent then updates the repo's docs (review, up to 2 rounds), and the version-control agent commits, pushes and opens the PR. The loop ends when the reviewer returns no findings, no unmet criterion and passing tests. After the round limit the main session stops and asks the user.
4. **The main session reports** what was done, what the review found and fixed, and what changed during the loop (the workflow result carries every round).
5. **The user merges the PR**, then the main session runs the workflow with `mode: "sync"`: the version-control agent puts the local default branch on origin and lists the files to upload. **Upload to the File Cabinet only after that**, so no other branch's files are uploaded.

Rules for the agents:
- Each agent changes only the one sibling repo it is assigned. It reads this repo for reference but never edits it.
- Sibling repos hold no outdated documentation and no ADRs that are missing from this repo. The documentation agent lists stale or foreign documents (`staleCandidates`); the user decides what is deleted.
- Models and effort are chosen per call (`args.tune`), not fixed: the best result for the fewest tokens.
- A skill an agent could not load must be reported, not skipped silently (`skillsUsed` in the result).
- Fields and behaviour not verified in NetSuite are marked as inferred in code and docs.

## What This Repository Is

An **orchestration and audit layer** over eight sibling repositories that all automate the same
NetSuite account (GoByBike / `GobybikeFinland` on GitHub). This repo holds **no NetSuite scripts of
its own** and does not deploy anything.

Its job is to answer questions that no single sibling repo can answer on its own:

1. **Status reconciliation** — what is actually deployed and running in NetSuite right now, versus
   what each repo's docs claim is deployed.
2. **Blast-radius review** — for a change proposed in one repo: what does it break in the others?
3. **Asymmetry hunting** — the same NetSuite record, field, custom-list ID or business rule is
   read/written by several repos under *different* assumptions. Those divergences are the primary
   deliverable of this project.
4. **Gap and improvement tracking** — missing guards, silent-failure paths, undocumented coupling.

> [!IMPORTANT]
> **Sibling repositories are changed only by delegated subagents** (see *Working agreement*), never edited directly from this project. Work here is
> read-only analysis over them. Findings are written up *here*; fixes are made in the owning repo, following that repo's own conventions.

## The Eight Orchestrated Repositories

They live as siblings under `../` (i.e. `C:\Users\Riku\Documents\GitHub\<name>`), each with its own git
remote under `github.com/GobybikeFinland/`:

`netsuite-subscrption-cr-scripts` · `netsuite-monthly-reporting` · `netsuite-subscription-extension` ·
`netsuite-bike-redemption-status-sync` · `netsuite-paylink-order-tracking` · `netsuite-ic-calculators` ·
`netstuite-send-end-redemption-payment-link` *(sic, "netstuite")* · `cf-gbb-tools`

> [!IMPORTANT]
> **Everything else about them is in [`docs/sisarrepot.md`](docs/sisarrepot.md)**: what each repo does,
> how to run its tests, the NetSuite records they share, every known structural asymmetry between them,
> the Payment Link's own rules and the Staria invoicing engine (script 701). Read it before reviewing a
> change that crosses repo boundaries, before assuming a field means the same thing in two repos, and
> before running anything in a sibling. Sibling knowledge is maintained there, not here.

## Working Commands

This repo has no build and no tests of its own. The commands that run **inside** a sibling repo — the
unit-test runners and the cross-repo git sweep — are in
[`docs/sisarrepot.md`](docs/sisarrepot.md) § *Working commands*.

### The schema cache — read this before querying NetSuite

[`schemas/`](schemas/README.md) holds a live export of everything the sibling projects touch.
**Answer field, record, list-value and deployment-status questions from there, not from a query.**

| Looking for | Read |
|---|---|
| A field's ID, label, type, filterability | [`schemas/records/`](schemas/records/README.md) |
| What an internal ID means (CR type 7, bike status 2, …) | [`schemas/lists/README.md`](schemas/lists/README.md) |
| What is actually deployed, and on what schedule | [`schemas/script-inventory.md`](schemas/script-inventory.md) |

Refresh with `node tools/export-schemas.mjs [records|lists|scripts]` — no dependencies; credentials
are read in place from `../cf-gbb-tools/.dev.vars` and are never copied into this repo. Re-running
the `records` section overwrites the hand-written cross-project annotations in those files, so diff
before committing a regeneration.

### Querying live NetSuite

Go to the **NetSuite MCP tools** (`mcp__claude_ai_NetSuite__*`) for what the cache cannot hold:
production data (counts, distributions, "how many bikes are in state X"), anything outside the seven
cached records (transaction body fields, items, saved searches, FAM assets), and re-verification
before an assertion that matters. `ns_runCustomSuiteQL` is the workhorse — its parameter is
**`sqlQuery`**, and `ns_getSuiteQLMetadata` ignores its table argument and returns the whole
1,433-table catalog.

SuiteQL quirks worth knowing: `_` is a wildcard in `LIKE` (so `'%_cr_%'` matches almost everything);
`GROUP BY … ORDER BY <alias>` and `ORDER BY COUNT(*)` fail — order by column position or wrap in a
subquery; `BUILTIN.DF` cannot appear in `GROUP BY`; `systemnote` cannot be grouped at all;
`UNION ALL` works but not with a `SELECT *`; custom lists are queryable as tables named after their
script ID (`CUSTOMLIST_CR_TYPE_LIST`), and `BUILTIN.DF(field)` resolves a select field to its display
label. CTEs, window functions (`LAG`, `ROW_NUMBER`), `LISTAGG` and `REGEXP_LIKE` **do** work. The
full probe-verified matrix is [`queries/suiteql-tuki.md`](queries/suiteql-tuki.md); verified
reusable queries live in [`queries/`](queries/README.md).

### Checking whether Brevo sent an email to a customer

`node tools/brevo-email-check.mjs <email> [--subject …] [--content] [--text]` answers "was a
transactional email sent to this address, what did it say, when, and was it delivered?" It is
read-only (GET only). Needs `BREVO_API_KEY` (env var or `../cf-gbb-tools/.dev.vars`). Read
[`docs/brevo-sahkopostitarkistus.md`](docs/brevo-sahkopostitarkistus.md) first: *delivered* is not
*read*, an empty result does not prove nothing was sent, and the content endpoints have a 300/h quota.

> [!NOTE]
> The six project agents under `.claude/agents/` (`suiteql-rakentaja`, `lunastusauditoija`,
> `ri-auditoija`, `sopimusriviauditoija`, `muutospyyntoauditoija`, `tarkastaja`) were **removed on
> 2.11.2026**. Findings and docs written before that date record which agent produced them; that is
> history, not a pointer to something you can still call. Run those checks in the main session,
> using the saved queries in [`queries/`](queries/README.md).

Repo documentation states intent — only NetSuite states fact, and the two are known to diverge.
`schemas/README.md` § *Discrepancies found during this export* lists the eight divergences found
when the cache was first built.

## Documentation trust order

Per-repo docs disagree with each other and occasionally with themselves. When they conflict:
**live NetSuite > repo source code > that repo's `CLAUDE.md` / `README.md` > dated plans** in
`archive/` and superseded ADRs in `docs/adr/`. Treat every "deployed" claim as unverified until it
has been queried. Which file each repo names as its own authority is in
[`docs/sisarrepot.md`](docs/sisarrepot.md) § *Documentation trust order*.

## Conventions For Work Done Here

- Findings are written as Markdown in this repo, naming the owning repo, the file and line, and the
  evidence (a SuiteQL result, a doc quote, or both). An asymmetry claim that does not show both
  sides is not a finding.
- Distinguish **verified in NetSuite** from **inferred from code** in every write-up. Maintaining
  that distinction is the whole value of this project.
- Finnish is the business-domain language (Siirto TA, Välikuukaudet, Jälkiveloitus, Hyvitys,
  pyörärekisteri, lunastus). Keep the Finnish CR-type names when referring to them — the handler
  files are named after them.


## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- When graphify-out/graph.json exists, run `graphify query "<question>"` before your first grep, search or source-file read for a codebase question, and put this rule in every subagent prompt that explores code. Read raw files only for lines the graph or an earlier read already located. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
- A committed graphify-out/graph.json is rewritten whole on every build, so a large diff to it in a pull request is expected. Do not flag it as churn or suggest skipping the graph rebuild or its hooks.
