# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Read First — Open Work

> [!IMPORTANT]
> **`TASKS.md` is the dated to-do list — check it at the start of every session** and tell the user
> which tasks are due today or overdue before starting anything else. Mark tasks done there (with date
> and result) as you finish them. As of 24.09.2026 it holds S2/S3 (IC dates), the S4 status check and
> the K4 re-check.

> [!IMPORTANT]
> **`docs/lunastus-tilanne.md` is the live status of the redemption project.** Read it at the start
> of any session that touches redemption, the bike register's end-state fields, or the scripts
> listed in it. It carries the current metrics, what is verified in production, and the next tasks.
> Update it when you change any of those.

### Open items — raise these with the user

| # | What | Why it matters |
|---|---|---|
| 1 | **33 CRs are still Pending** after the first scheduled runs (15 type 2, 16 type 11, 1 type 1, 1 type 7). Governance caps each batch, so the backlog drains over several runs. Re-check the gate quadrant below once it is empty. | Both schedules are back ON as of 22.09.2026. The gate has been verified on a batch of 43, but not on the whole backlog. |
| 2 | **`ri_creation` and `ri_update` have never run over the full population** — all nine verification runs were `⚠ TEST SCOPE`, and these scripts have no dry-run mode. The library throws on unrecognised dates, and a throw loses that bike's row silently. | The first full October run is the regression test. Read `mapErrors` and the bucket distribution from `scriptnote` immediately afterwards — the execution log will not otherwise show it. |
| 3 | **Status-sync part A loses late payments permanently** (23.09.2026). Its ±5-day window is keyed on the payment/invoice date, not on when the payment became visible. 24 paid Active bikes have no settle method and will never end. Correction CSV: `findings/2026-09-23-status-sync-maksuikkuna-hukkaa-myohaiset-maksut.md`. **The fix is not a patch.** The script is rewritten as status-sync 2.0 ([ADR 0007](docs/adr/0007-status-sync-2-tasmaytysajo.md), `docs/status-sync-2-tasmaytysajo.md`): a nightly Map/Reduce reconciling payment, status and `ic_redemption_dt` (finance's saved search 797). Approved 23.09.: **September runs on CSV imports, cut-over 1.10. in one go, October is the test month.** The script id changes: **status-sync 2.0 is script 1480, `Scheduled` nightly 00:30 Helsinki, dry run off 9.10.2026, first live run 10.10.** **S1 ran 23.09. 17:21, 27/27 correct**; 5 more bikes surfaced from the Paylink backlog afterwards (S1b needed; re-run the extraction query on 30.09.). CSV imports do **not** fire `ue_gbb_redemption_decided_at`, so `decided_at` stays empty on imported rows. **Re-specified 7.10.2026 ([ADR 0015](docs/adr/0015-status-sync-2-tarkennukset.md)):** the old script 1440 has been unscheduled since 6.10., so nothing records payments, turns statuses or writes IC dates until 2.0 is live. 2.0 is purely functional, with no reporting (that goes to `docs/poikkeamaraportointi-vaatimukset.md`). It ignores both exceptional end-date fields. `paid_at` is written as a payment fact. Settle method 2 is counted from Done *pidennys* CRs. The build guide is `docs/status-sync-2-tasmaytysajo.md`, task **T54, deadline 28.10.** (finance IC run 29.10., extension 1.11.). | The CSV must run before the 4 Pending 2C CRs are processed, or `handler_lunastus` writes the CR's creation date instead of the payment date (§5). A *Paid In Full* invoice can be a fully credited one: never widen the window without the credit check. |
| 4 | **End-of-term redemption rules confirmed 24.09.2026** ([ADR 0009](docs/adr/0009-kauden-lopun-lunastus.md), `docs/lunastuksen-kenttasaannot.md` § 9). End-of-term = no type 2/10 CR in Pending/Done; deadline is the end of the end month; **OOMI bikes are Redeemed in their end month without payment** (method 1, `liab_settled_at` = tunnistuspäivä, `paid_at` empty — Oomi covers unpaid fees); extension ends automatically once paid type-7 invoices (net rent + admin fee) cover `end_redemption_price`; `redemption_decided_at` has no meaning at end of term. Resolves ADR 0008 D7/D8. Open: **S4** CSV (34 stuck OOMI bikes, `imports/2026-09-24-oomi-kauden-loppu/`) must run before S3 on 30.09.; K1–K3 go into status-sync 2.0; **K4**: 16 S1 bikes got method 1 before their end month; clearing CSV `imports/2026-09-24-s1-ennenaikainen-tapa/` **ran 24.09., 16/16 verified**; re-check 28.09. (B029495 may regain method 1 from old part A's ±5-day window). | Without S4 those 34 bikes stay Active forever — the sweep never sees a bike with no settle method. The OOMI `paid_at ≠ liab_settled_at` pattern is correct, not a §5 violation. |
| 5 | **Mid-term redemption rules confirmed 24.09.2026** ([ADR 0010](docs/adr/0010-keskenkauden-lunastus.md), `docs/lunastuksen-kenttasaannot.md` § 10, requirements `docs/keskenkauden-lunastus-vaatimukset.md`). The type-2 CR alone is decision *and* evidence (no payment wait); no CR → no mid-term redemption, missing CRs are created **by hand** in October (19 bikes, `findings/2026-09-24-keskenkauden-maksu-ilman-cr.md`); `decided_at` = `cr_created_date`, written by the handler, history via CSV; rows cut at `end_date_of_old_sub`, money fixed by a type-11 CR (the only credit path — Staria `sta_mr_mid_life_redemption` was **Scheduled every 2 h** and is **NOTSCHEDULED since 9.10.2026**, both deployments); empty official end / created date or a later end date → Needs Review (owners finance + customer service, deadline end of creation month). **Exceptional end-date fields are abandoned**: päättymisajankohta becomes `subsc_end_date` only in October; `oomi_exceptional_end_date` stays Fleet-CSV visibility only. Open: **D9** — 15 Fleet-ended Active bikes with no settle method. | CSV `imports/2026-09-25-poikkeuspaivat-subsc/` (33 bikes) **must run before** the library drops the `COALESCE`, or 16 ended bikes regain a later end date and RI creation may emit Active rows for them. |
| 6 | **The end-redemption Payment Link script went live 1.10.2026 and misprices late-redemption bikes** (`netstuite-send-end-redemption-payment-link`, script **1479**, `findings/2026-10-02-maksulinkki-ensimmainen-ajo.md`). The first production run sent 748 real Paylink links with 0 errors, and 215 were paid the same day. But the maintenance refund is anchored on `MONTHS_BETWEEN(subsc_end_date, subsc_org_end_date)`, and `handler_jalki` moves `subsc_end_date` once for every jälkiveloitus month. Result: **6 links undercharged by €80–160** (≈ €720; B006488 already paid €3.45), **4 bikes settled free as method 3** (≈ €598, now status 2), B046508 settled as method 4 while its price-0 question was still open, and 69 jälkiveloitus bikes listed `NOT_PRICED` in every daily digest. The fix belongs in the owning repo; the owner decides first. Every affected bike is a task in TASKS T30–T38 (`findings/2026-10-02-maksulinkki-tutkittavat.csv`), and the deadline is the next cohort run on **31.10.2026**. | Every month, the bikes that `handler_jalki` extends come back into the window (`not_before` filters on the *moving* `subsc_end_date`). Until the anchor is fixed, each new settlement 3/4 or link on a bike with a Done *pidennys – jälkiveloitus* CR is suspect. |

**Resolved 22.09.2026 — both schedules are ON.**

| What | Result |
|---|---|
| **CR scheduling re-enabled** | 43 type-2 CRs processed, **0 errors**, 0 Needs Review. Gate verified as a batch (see quadrant below). Types 1, 7 and 11 drained too. |
| **Calendar sweep switched `Testing` → `Scheduled`** and ran | `171 candidates, 20 status changes written, 151 still waiting, 0 errors` |

**The gate quadrant — this is how to read a CR run.** Not the headcount; the cross-tabulation:

| Bike status after | End date | 22.09. result |
|---|---|---|
| 1 Active (deferred) | in the future | **14** |
| 2 Redeemed | now or past | **28** |
| 3 Returned | now or past | **1** |
| **2 or 3** | **in the future** | **0 — this cell must stay empty** |

```sql
SELECT br.custrecord_sta_bike_status,
       CASE WHEN COALESCE(br.custrecord_gbb_exceptional_end_date, br.custrecord_gbb_oomi_exceptional_end_date, br.custrecord_sta_subsc_end_date) >= TRUNC(CURRENT_DATE,'MM') + INTERVAL '1' MONTH
            THEN 'end_future' ELSE 'end_now_or_past' END, COUNT(*)
FROM customrecord_subscrption_change_request cr
JOIN customrecord_sta_bike_register br ON cr.custrecord_cr_bike_registry = br.id
WHERE cr.custrecord_cr_type = 2 AND cr.custrecord_cr_status = 2 AND cr.lastmodified >= TO_DATE('2026-09-21','YYYY-MM-DD')
GROUP BY 1, 2
```

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

Every one of the 28 should log `status DEFERRED (would be 2; tunnistuspäivä … is still in the
future)`. **Any bike flipped to status 2 on processing means the gate is not holding — say so and
stop before more CRs run.**

Baseline 21.09.2026 evening: sweep candidates **117**, premature redemptions **0** (§3 month
anchor), ended bikes with no evidence **0**, §5 violations **53**, `historical_unknown` on Active
bikes **0**, bikes with no status **140**.

> [!NOTE]
> **The sweep was `Scheduled` 22.09.–6.10.2026 and is `NOT SCHEDULED` since 6.10.2026 (replaced by status-sync 2.0, 1480)** (`customscript_gbb_bike_redemption_status` /
> `customdeploy_gbb_redemption_sync`, script internal id **1440**). It was on `Testing` until then,
> which meant its recurrence never fired and the transition *lunastus sovittu* → *lunastettu*
> happened only by hand.
>
> A deployment's `status` still does **not** tell you whether scheduling is on —
> `scriptdeployment.recurrence` is `NOT_EXPOSED` to SuiteQL. Confirm a schedule by the presence of
> runs in `scriptnote`, not by the status field.

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

**Resolved 21.09.2026 — do not re-open.** `custrecord_gbb_date_to_non_active` was empty on 664
ended bikes right after the calendar sweep; by the same evening all 664 carried 21.09.2026, which
is exactly their tunnistuspäivä. A process fills the field with a delay of hours, and fills it correctly.
**Identified 23.09.2026:** it is `customscript1458` *Bike status date backfill* (internal id 1458),
`netsuite-bike-redemption-status-sync/gbb-bike-status-history/gbb_ss_bike_status_history_backfill.js`.
It runs daily at about 02:01 log time and reads the status-change date from System Notes
(`findings/2026-09-23-b038677-redeemed-ja-ended-ilman-cr.md`).

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

### Next piece of work: phase 3

> [!IMPORTANT]
> **Order decided 21.09.2026: phase 3 first, both schedules only after it.** Neither the calendar
> sweep nor CR scheduling goes back on before phase 3 is in production and tested. The sweep writes
> status 2; CR Done fires the five `RELEASED` UE scripts, which create RI rows carrying
> `[To-add: Data from bike register]`, and `ri_update.js:717-720` later demotes such a row to
> Warning purely because the bike's status is 2/3 — a Warning row is withheld from the payroll CSV,
> i.e. a missed deduction. The rows cannot be removed by deleting the CR. The full chain, the
> evidence and the deadline are in `docs/lunastus-tilanne.md` § *Ajojärjestys*.

The redemption rules are in production for phases 0–2 and **phase 3 has no blockers left** as of
21.09.2026. It is the change that makes monthly reporting stop reading `custrecord_sta_bike_status`.
The target file, the exact condition, the anchor trap and the four other scripts that read the
status are all written up in `docs/lunastus-tilanne.md` § *Seuraavat taskit*. Read that before
touching `netsuite-monthly-reporting`.

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
> **Do not edit scripts in the sibling repositories from this project.** Work here is read-only
> analysis over them. Findings are written up *here*; fixes are made in the owning repo, in a
> separate session, following that repo's own conventions.

## The Eight Orchestrated Repositories

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
| `netstuite-send-end-redemption-payment-link` *(sic, "netstuite")* | SuiteScript 2.1 Map/Reduce + 3 libs, no build, `node test/run_tests.js` for the pure libs | **Step 1 of end-of-term redemption** (*loppulunastus*). Daily: Active non-OOMI bikes whose `subsc_end_date` is within 30 days get a Paylink order (`notes` = bike `externalid`, product `Työsuhdepyörän loppulunastus`) and a Brevo mail (template 65, shared `/SuiteScripts/Brevo/lib_brevo_api.js`). The price is `end_redemption_price` minus the unused maintenance-bracket remainder. Stamps `custrecord_gbb_eredem_link_sent` and writes settle method **3** (maintenance budget covers the price) or **4** (stored price 0 €) with `liab_settled_at` = run date. Live since **1.10.2026**, script 1479 (`customscript_send_redemption_link`, daily 08:00). Steps 2–3 (payment → SO/deposit) are paylink-order-tracking. See § *Payment Link* below. |
| `cf-gbb-tools` | Next.js on Cloudflare Workers (OpenNext), TypeScript, vitest | The human-facing side: internal tools behind Cloudflare Access that read and *write* NetSuite over REST/SuiteQL (bike-register lookup, subscription change-request creation, NetSuite alerts, Oomi redemption). Not SuiteScript — a separate client with its own field assumptions. |

## Working Commands

This repo has no build. The commands below are run **inside the sibling repo** being inspected.

```bash
# Unit tests — only two siblings have real suites (the Payment Link repo has a plain-node check of its pure libs)
cd ../netsuite-ic-calculators && npm test        # jest --verbose
cd ../netsuite-ic-calculators && npx jest tests/gbb_ic_redemption_calculator.test.js   # single file
cd ../cf-gbb-tools && npm test                   # vitest run (pure logic only, not routes)
cd ../cf-gbb-tools && npx vitest run src/app/lib/helsinki-date.test.ts                 # single file
cd ../netstuite-send-end-redemption-payment-link && node test/run_tests.js            # price + Helsinki-date libs
```

The other six repos have **no test runner at all** — verification means deploying to a NetSuite
account and running there. Never report a SuiteScript change as "tested" without a NetSuite run.

Cross-repo state sweep:

```bash
for p in netsuite-monthly-reporting netsuite-ic-calculators netsuite-bike-redemption-status-sync \
         netsuite-paylink-order-tracking netsuite-subscription-extension \
         netsuite-subscrption-cr-scripts cf-gbb-tools netstuite-send-end-redemption-payment-link; do
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
the four auditor agents (`lunastusauditoija`, `ri-auditoija`, `sopimusriviauditoija`, `muutospyyntoauditoija`), which
cannot call it themselves — the main session does.

Repo documentation states intent — only NetSuite states fact, and the two are known to diverge.
`schemas/README.md` § *Discrepancies found during this export* lists the eight divergences found
when the cache was first built.

## Shared NetSuite Substrate — Where The Asymmetries Live

These are the coupling points. When reviewing a change, walk this list first.

### Records touched by multiple repos

| Record | Written by | Read by |
|---|---|---|
| `customrecord_sta_bike_register` | CR handlers (via `cr_bike_register_apply` / `cr_bike_snapshot`), bike-redemption-status-sync, paylink post-processor, ic-calculators, cf-gbb-tools, payment-link (`eredem_link_sent`, settle method 3/4 + `liab_settled_at`) | effectively everything |
| `customrecord_subscrption_change_request` | subscription-extension (type 7), CR type-13 handler (creates 7, 9, 11), cf-gbb-tools | CR dispatcher, monthly-reporting User Event scripts |
| `customrecord_sta_ca_agreement_row` | CR handlers (close / clone / reparent) | monthly-reporting (monthly price), subscription-extension (coverage check), ic-calculators |
| `customrecord_payment_requests` | paylink-order-tracking (rows for the Payment Link's orders since 1.10.2026) | subscription-extension (check 2), bike-redemption-status-sync, cf-gbb-tools netsuite-alerts. *Not* read by payment-link, by design |
| `customrecord_sta_maint_extending_months` | nobody (static table, 49 rows) | payment-link (bracket = lease extension in place), ic-calculators (bracket = maintenance sum) — two rules on one table |
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
- **The extension loop has no owner and exits silently.** `netsuite-subscription-extension` ran
  on the 1st until 9.10.2026 (saved search `customsearch_gbb_br_pidennykset`: bike Active, `subsc_end_date` = 1 day
  ago, order type not OOMI) and creates a Pending type-7 CR (**script 1437 is `NOTSCHEDULED` since 9.10.2026**, deliberately; it is replaced by extension 2.0, run on the 10th at 03:00, first run 10.11.2026, TASKS T61, `docs/extension-2-vaatimukset.md`); `handler_jalki` then invoices the month
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
  bike B013565 missed). The deployment is `NOTSCHEDULED` since 9.10.2026 (extension 2.0 replaces it) — when 2.0 goes live, re-verify its recurrence and
  parameters, not just its status.
- **A transfer CR (types 1/9, "2A package" with 11 + 7) splits payroll and billing on purpose.**
  `custrecord_cr_contract_official_end_date` + 1 is the real transfer day. Reporting switches the
  employer from then on, clamped to next month's 1st (`ue_reporting_item_transfers.js:122-126`).
  `custrecord_cr_start_date` is the first *unbilled* month, and the agreement rows move only then.
  The already-billed months in between are corrected by the package's type 11/7 CRs. So "register and RI
  on the new employer, item 30 row on the old customer until `start_date`" is **correct, not an
  asymmetry**. On 30.09.2026 this was reported as a critical error on 8 bikes and was a false alarm
  (`findings/2026-09-30-kuukausiajo-rekisteri-riski.md` § 6).
- **Tax exemption ends on a non-group transfer.** `custrecord_gbb_verovapaa` = T must become F on the
  bike register and on the new employer's RI rows when a type-1 transfer (Siirto TA) changes the
  employer; a type-9 group transfer keeps it. Rare exceptions exist. No repo automates this and
  monthly-reporting copies the register value onto RI rows. Rule: `docs/verovapaus-saannot.md`.
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
- **Lease extension means two things, and the Payment Link reads only one of them.** `subsc_end_date − subsc_org_end_date`
  counts maintenance-driven months (`sta_ue_bike_register_hook.js`, a one-way ratchet) *and*
  jälkiveloitus months (`handler_jalki` moves the end date for every *pidennys – jälkiveloitus* type-7 CR).
  The Payment Link prices the maintenance refund on that difference. Its second witness, the prolongation agreement rows, is
  compared only as a yes/no. A late-redemption bike that also has maintenance rows is therefore refunded
  for its jälkiveloitus months as if they were unused maintenance budget. **Verified 1.10.2026: 6 links + 4
  settlements**, each off by exactly its jälkiveloitus CR count. The IC calculator
  (`gbb_ic_redemption_price_mr.js:158`) derives the period from the **maintenance sum** instead. One bracket table,
  two rules.
- **The Paylink product title is a routing key.** The Payment Link sends `custscript_gbb_eredem_item_title`
  (default `Työsuhdepyörän loppulunastus`). `paylink_ns_processor.ue.js:28` `PRODUCT_MAP` matches that exact text
  to item 46 / SO type 4. Change the parameter and every payment lands in `Error: No product configuration`,
  which status-sync then never sees.
- **`not_before` floors a moving date.** The Payment Link's cohort floor filters `subsc_end_date`, which
  jälkiveloitus moves forward. September-and-older cohorts invoiced by the old manual process therefore re-enter the window each month.
  `custrecord_gbb_eredem_link_sent` stops a second link only for links this script sent itself.

### Payment Link (`netstuite-send-end-redemption-payment-link`) — what it owns

- **Flow:** step 1 of end-of-term redemption only. Step 2 (`paylink_order_sync` → `customrecord_payment_requests`)
  and step 3 (`paylink_ns_processor.ue.js` → SO type 4 + Customer Deposit, bike found by `notes` = `externalid`)
  are paylink-order-tracking. Status-sync part A then writes `paid_at` + method 1, and the sweep (1440, unscheduled 6.10.; replaced by status-sync 2.0, 1480) writes status 2
  at the start of the end month. Unpaid → `netsuite-subscription-extension` (1437 NOTSCHEDULED 9.10.2026; extension 2.0 runs on the 10th from 10.11.) → type 7 → `handler_jalki`.
  An unpaid link is **out of scope** by that repo's decision: no reminder, no re-send.
- **Selection** (`getInputData`): Active, not OOMI (`IS NULL OR <> 3`), `eredem_link_sent` not T, **no settle method**,
  `subsc_end_date` in [today, today + `days_before` (30)] Helsinki **and** ≥ `not_before` (`2026-10-01`, mandatory).
  Per-bike checks in order: sent → settled → `end_red_so_created` → linked type-4 SO → price empty → price 0 (method 4)
  → extension sources disagree / unpriceable → price ≤ 0,65 € (method 3) → link.
- **Tools:** Paylink REST (own lib `lib_gbb_paylink_api.js`, test vs prod by the `paylink_url` parameter),
  Brevo via the **shared** `/SuiteScripts/Brevo/lib_brevo_api.js` (two other live scripts depend on it), `N/email` digest
  to info@gobybike.fi, `lib_gbb_helsinki_date.js` for Finnish calendar days. Safety: `dry_run`, `test_bike_id`.
- **NetSuite ids:** script `customscript_send_redemption_link` = **1479**, deployment `customdeploy_send_redemption_link`
  (internal 2188, `Scheduled`, log level Audit; ids corrected 9.10.2026), File Cabinet folder 40451 `[GBB] Send end redemption payment link`.
  Schedule confirmed by the owner 9.10.2026: daily 08:00, `custscript_gbb_eredem_months_before` = 1, dry run off.
- **Read the run** from `scriptnote` (`scripttype = 1479`): the `selection` line (window, floor, Paylink env, count)
  and `run complete` (outcome counts). Per bike, the title is `<STATUS> <bike name>` with the whole price trail in
  the detail. Outcomes that need a person: `STAMP_FAILED`, `EMAIL_FAILED`, `SENT_TO_FALLBACK`, `NOT_PRICED`, `SKIP_*`, `SETTLED_*`.
- **Its own rules:** every business decision there is the owner's (that repo's rule 1). Its agent never writes to
  NetSuite. Settled decisions live in its `docs/DEPLOYMENT.md` § *Settled specifics*. Record cross-repo findings here and
  take fixes there.

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
