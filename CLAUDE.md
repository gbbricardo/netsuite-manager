# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Read First — Open Work

> [!IMPORTANT]
> **`docs/lunastus-tilanne.md` is the live status of the redemption project.** Read it at the start
> of any session that touches redemption, the bike register's end-state fields, or the scripts
> listed in it. It carries the current metrics, what is verified in production, and the next tasks.
> Update it when you change any of those.

### Open items — raise these with the user

| # | What | Why it matters |
|---|---|---|
| 1 | **CR scheduling is OFF** since 21.09.2026 (turned off by the product owner for the CSV imports). **31+ Pending Type 2 CRs are queued and will not be processed until it is switched back on.** Ask whether it can be re-enabled. | Agreement rows, invoices and the bike register do not update while it is off. This is a temporary state that is easy to forget — nothing in NetSuite will complain. |
| 2 | **When scheduling returns, verify the status gate on the bulk.** All 31 queued Type 2 CRs have their tunnistuspäivä in a future month, so the correct outcome is **31 deferrals and zero status writes**. | The gate was verified on 21.09. with three CRs in TEST MODE, never as a batch. |

Verification queries for item 2:

```sql
-- sweep candidates: should GROW by roughly the number of Type 2 CRs processed
SELECT COUNT(*) FROM customrecord_sta_bike_register
WHERE custrecord_sta_bike_status = 1 AND custrecord_gbb_liab_settle_method IS NOT NULL;

-- liab_settled_at must be the CR's created date, never the run date
SELECT br.id, br.custrecord_gbb_liab_settled_at, cr.custrecord_cr_created_date
FROM customrecord_sta_bike_register br
JOIN customrecord_subscrption_change_request cr ON cr.custrecord_cr_bike_registry = br.id
WHERE cr.custrecord_cr_type = 2 AND cr.custrecord_cr_status = 2
  AND br.custrecord_gbb_liab_settled_at <> cr.custrecord_cr_created_date
```

Every one of the 31 should log `status DEFERRED (would be 2; tunnistuspäivä … is still in the
future)`. **Any bike flipped to status 2 on processing means the gate is not holding — say so and
stop before more CRs run.**

Baseline 21.09.2026 after the imports: sweep candidates **117**, premature redemptions **1**,
ended bikes with no evidence **0**, §5 violations **53**, `historical_unknown` on Active bikes **0**.

**Resolved 21.09.2026 — do not re-open.** `custrecord_gbb_date_to_non_active` was empty on 664
ended bikes right after the calendar sweep; by the same evening all 664 carried 21.09.2026, which
is exactly their tunnistuspäivä. An unidentified process fills the field with a delay of hours, and
fills it correctly. It is still in no sibling repository — if you ever need to change that field's
behaviour, you will have to find it first.

### One trap to know before you measure anything

The redemption project's headline metric in `docs/lunastuksen-kenttasaannot.md` §8 was **wrong until
21.09.2026** and would have read a correctly working system as a fourfold regression (847 vs the
true 4). The operational anchor is the **first day of the end month**, not the end date — a bike
whose lease ends mid-month is legitimately Redeemed before its own end date. If a redemption metric
suddenly looks catastrophic, check the query against §3 before believing it.

### Next piece of work: phase 3

The redemption rules are in production for phases 0–2 and **phase 3 has no blockers left** as of
21.09.2026. It is the change that makes monthly reporting stop reading `custrecord_sta_bike_status`.
The target file, the exact condition, the anchor trap and the four other scripts that read the
status are all written up in `docs/lunastus-tilanne.md` § *Seuraavat taskit*. Read that before
touching `netsuite-monthly-reporting`.

## What This Repository Is

An **orchestration and audit layer** over seven sibling repositories that all automate the same
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
> **Do not edit scripts in the sibling repositories from this project.** Work here is read-only
> analysis over them. Findings are written up *here*; fixes are made in the owning repo, in a
> separate session, following that repo's own conventions.

## The Seven Orchestrated Repositories

All live as siblings under `../` (i.e. `C:\Users\Riku\Documents\GitHub\<name>`), each with its own
git remote under `github.com/GobybikeFinland/`.

| Repo | Runtime | Role in the NetSuite picture |
|---|---|---|
| `netsuite-subscrption-cr-scripts` | SuiteScript 2.x, SuiteCloud SDK (SDF) | **The hub.** Daily scheduler → dispatcher → 9 type handlers that *execute* Change Requests: move agreement rows, write the bike register, create invoices and credit memos. Almost every other repo either feeds it CRs or reacts to what it wrote. |
| `netsuite-monthly-reporting` | SuiteScript 2.1, no build (manual File Cabinet upload) | 15 scripts producing the monthly payroll-deduction CSVs. Event-driven User Event scripts react to the *same* CR records the CR processor consumes; a Map/Reduce batch fills in the normal mass. Docs are in Finnish. |
| `netsuite-subscription-extension` | SuiteScript 2.1 Map/Reduce, single file | Detects unpaid redemptions at subscription end and **creates a Pending type-7 CR**. Deliberately extends nothing itself — `handler_jalki.js` in the CR repo does that. |
| `netsuite-bike-redemption-status-sync` | SuiteScript Scheduled Script | Second, independent writer of bike status `2` (Redeemed), driven by *payment arrival* rather than CR processing. Also stamps `custrecord_gbb_redemption_paid_at`. |
| `netsuite-paylink-order-tracking` | SuiteScript 2.1, 4 scripts, no build | Paylink → NetSuite staging pipeline: `customrecord_payment_requests` → Sales Order + Customer Deposit. Upstream source of the payment facts the two repos above depend on. |
| `netsuite-ic-calculators` | SuiteScript 2.1 MR + pure-JS libs, Jest | Intercompany redemption price amortisation. The only sibling with a meaningful local test suite. |
| `cf-gbb-tools` | Next.js on Cloudflare Workers (OpenNext), TypeScript, vitest | The human-facing side: internal tools behind Cloudflare Access that read and *write* NetSuite over REST/SuiteQL (bike-register lookup, subscription change-request creation, NetSuite alerts, Oomi redemption). Not SuiteScript — a separate client with its own field assumptions. |

## Working Commands

This repo has no build. The commands below are run **inside the sibling repo** being inspected.

```bash
# Unit tests — only two siblings have them
cd ../netsuite-ic-calculators && npm test        # jest --verbose
cd ../netsuite-ic-calculators && npx jest tests/gbb_ic_redemption_calculator.test.js   # single file
cd ../cf-gbb-tools && npm test                   # vitest run (pure logic only, not routes)
cd ../cf-gbb-tools && npx vitest run src/app/lib/helsinki-date.test.ts                 # single file
```

The other five repos have **no test runner at all** — verification means deploying to a NetSuite
account and running there. Never report a SuiteScript change as "tested" without a NetSuite run.

Cross-repo state sweep:

```bash
for p in netsuite-monthly-reporting netsuite-ic-calculators netsuite-bike-redemption-status-sync \
         netsuite-paylink-order-tracking netsuite-subscription-extension \
         netsuite-subscrption-cr-scripts cf-gbb-tools; do
  echo "== $p"
  git -C ../$p status -sb | head -3
  git -C ../$p log -1 --format='%ad %s' --date=short
done
```

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
reusable queries live in [`queries/`](queries/README.md), built by the `suiteql-rakentaja` agent for
the three auditor agents (`lunastusauditoija`, `ri-auditoija`, `sopimusriviauditoija`), which
cannot call it themselves — the main session does.

Repo documentation states intent — only NetSuite states fact, and the two are known to diverge.
`schemas/README.md` § *Discrepancies found during this export* lists the eight divergences found
when the cache was first built.

## Shared NetSuite Substrate — Where The Asymmetries Live

These are the coupling points. When reviewing a change, walk this list first.

### Records touched by multiple repos

| Record | Written by | Read by |
|---|---|---|
| `customrecord_sta_bike_register` | CR handlers (via `cr_bike_register_apply` / `cr_bike_snapshot`), bike-redemption-status-sync, paylink post-processor, ic-calculators, cf-gbb-tools | effectively everything |
| `customrecord_subscrption_change_request` | subscription-extension (type 7), CR type-13 handler (creates 7, 9, 11), cf-gbb-tools | CR dispatcher, monthly-reporting User Event scripts |
| `customrecord_sta_ca_agreement_row` | CR handlers (close / clone / reparent) | monthly-reporting (monthly price), subscription-extension (coverage check), ic-calculators |
| `customrecord_payment_requests` | paylink-order-tracking | subscription-extension (check 2), bike-redemption-status-sync, cf-gbb-tools netsuite-alerts |
| `customrecord_gbb_monthly_reporting_item` | monthly-reporting only | monthly-reporting only — but derived from all of the above |

### Known structural asymmetries to keep re-checking

- **Two writers of bike status `2` (Redeemed).** `handler_lunastus.js` (CR-driven, payment-agnostic)
  and bike-redemption-status-sync (payment-driven). Documented as harmless while they agree — verify
  they still do, and that neither has started writing `custrecord_sta_redemption_date`, which would
  falsely trigger `sta_mr_mid_life_redemption`'s credit memo.
- **Two consumers of the same CR record with different trigger semantics.** The CR processor acts on
  `status = Pending` *daily*; monthly-reporting's User Event scripts fire on **CREATE, EDIT and
  XEDIT** and gate on `custrecord_cr_status === Done` (verified 2026-09-17 in
  `ue_reporting_item_intermediary_months.js:40`, `ue_reporting_item_late_redemption_prolongation.js:42`,
  `ue_reporting_item_mid_term_redemption_return_theft_loss.js:50`, `ue_reporting_item_transfers.js:73`;
  the fifth UE script, `ue_reporting_item_maintenance_prolongation.js`, is deployed on
  `customrecord_sta_bike_register`, not on the CR record). So a *Pending* CR created by mistake
  produces no reporting rows — but a CR set to Done by any route does, on the spot, and deleting the
  CR will not remove them. The status gate is the whole safety margin: any change to CR creation or
  to status writing anywhere (cf-gbb-tools UI, type-13 handler, subscription-extension, the
  dispatcher's own transitions) lands on both paths. *Earlier revisions of this file claimed the UE
  scripts ran on CREATE without checking status; that is no longer true of the deployed code.*
- **Name-based routing.** Monthly-reporting routes CR types 2 and 7 on the *text of `altname`*
  (`vakuutus`, `2B`/`2C`/`2D`, `pidennys` — the last one **case-sensitive**). The CR processor routes
  on `custrecord_cr_type` and applies its own suffix rules (` - 2B`, `vakuutus`). A renaming
  convention change silently desynchronises the two; type 7 then fails with no Warning at all.
- **The extension loop has no owner and exits silently.** `netsuite-subscription-extension` runs
  on the 1st (saved search `customsearch_gbb_br_pidennykset`: bike Active, `subsc_end_date` = 1 day
  ago, order type not OOMI) and creates a Pending type-7 CR; `handler_jalki` then invoices the month
  **and moves `custrecord_sta_subsc_end_date` forward**, so the bike matches the search again next
  month. The loop ends only when something outside the script ends it — a status-2 write by
  `handler_lunastus` or bike-redemption-status-sync, a paid redemption invoice, a completed Paylink
  request, a covering agreement row, or a CR that errors in the CR repo. Every one of those exits
  except the status write is silent: no CR → no write-back → the bike leaves the queue permanently
  and is **never retried**. Two verified traps (`netsuite-subscription-extension/README.md`):
  the override parameter `custscript_gbb_ext_override_sub_end_date` bypasses the saved search and
  its OOMI filter, so every override run creates type-7 CRs for OOMI bikes that are billed elsewhere
  (15.09.2026: CRs 6511/6512 deleted by hand before `cr_scheduler` ran); and a deployment on
  `dayOfMonth 31` or with a test bike id left set skips whole months with no error (September 2026,
  bike B013565 missed). The deployment is `Scheduled` in the inventory — re-verify its recurrence and
  parameters, not just its status.
- **Hard-coded list and item IDs, duplicated across repos.** CR types (1, 2, 3, 6, 7, 8, 9, 11, 13),
  CR statuses (1 Pending, 2 Done, 5 Error, 6 Needs Review, 7 Cancelled), bike statuses (1/2/3), bike
  order type 3 (OOMI), items 30 (Vuokra) and 33 (Leasingmaksu). None of it is configuration.
  `netsuite-monthly-reporting/README.md` § *Riippuvuudet ja ehdot* is the fullest inventory —
  cross-check the other repos against it, not the reverse.
- **Paylink status field trap.** `custrecord_pl_status` is free-form Paylink text (`completed`);
  `custrecord_pl_ns_status` is the NetSuite list (`1`–`5`). Consumers pick different ones, and
  swapping them matches nothing, silently.
- **"Gross" field that holds net.** `custrecord_sta_ca_row_price_month` on the agreement row is
  labelled *Gross Price per Month* but is a **net (VAT 0) price**, like `customrecord_sta_contract_prices`
  and the bike register's `curr_subs_*` / `init_subs_*` fees. Every writer (Staria vendor bill logic,
  `handler_siirto_ta` with fallback 15.94, the OOMI import at 79.6813) and every reader (invoicing
  line rate, monthly-reporting's `lease_fee_vat0` × 1.255 in the CSV, cf-gbb-tools' `netToGross`)
  agrees; only the label and a Staria variable name say gross. Any code applying 1.255 when moving a
  value *between* these records double-counts VAT. Evidence: `schemas/records/customrecord_sta_ca_agreement_row.md`.
  `netsuite-subscription-extension` never reads the price; it reads only the row end date.
- **Timezone.** SuiteScript's runtime local time is not Finnish time (~10 h off). Monthly-reporting
  and cf-gbb-tools both do explicit `Europe/Helsinki` extraction (`helsinki-date.ts` in the latter).
  Any calendar-day or month-boundary logic elsewhere that lacks that pattern is a finding.
- **Silent failure is the house style.** Monthly-reporting turns missing data into a Warning row;
  the CR dispatcher writes `Needs Review`; paylink writes `Pending Bike`. None surface as execution-log
  errors. Judging "did the change work?" from the execution log is wrong in all of them — count the
  quiet states before and after instead.

### Documentation trust order

Per-repo docs disagree with each other and occasionally with themselves. When they conflict:
**live NetSuite > repo source code > that repo's `CLAUDE.md` / `README.md` > dated plans** in
`docs/ideas/`, `docs/superpowers/` and `archive/`. Two repos name their own authority file
explicitly: `netsuite-monthly-reporting/PROJEKTIN_TILA.md` (sole status picture, Finnish, currently
on branch `dev` and *not* merged to `master`) and `netsuite-subscrption-cr-scripts/CHANGELOG.md`.
Monthly-reporting documents cases where the repo is *ahead of* NetSuite — treat every "deployed"
claim as unverified until queried.

## Conventions For Work Done Here

- Findings are written as Markdown in this repo, naming the owning repo, the file and line, and the
  evidence (a SuiteQL result, a doc quote, or both). An asymmetry claim that does not show both
  sides is not a finding.
- Distinguish **verified in NetSuite** from **inferred from code** in every write-up. Maintaining
  that distinction is the whole value of this project.
- Finnish is the business-domain language (Siirto TA, Välikuukaudet, Jälkiveloitus, Hyvitys,
  pyörärekisteri, lunastus). Keep the Finnish CR-type names when referring to them — the handler
  files are named after them.
