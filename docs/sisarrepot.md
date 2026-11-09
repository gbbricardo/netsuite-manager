# Sisarrepot — mitä ne tekevät ja mitä ne jakavat

Kaikki kahdeksaa sisarrepoa koskeva tieto on tässä tiedostossa: mitä kukin repo tekee, miten sen testit
ajetaan, mitkä NetSuite-tietueet ne jakavat ja mitkä rakenteelliset epäsymmetriat niiden välillä on
tunnistettu. [`CLAUDE.md`](../CLAUDE.md) pitää tämän projektin omat työskentelysäännöt ja viittaa tänne —
sisarrepotieto ylläpidetään täällä, ei siellä.

Sisältö on siirretty `CLAUDE.md`:stä sellaisenaan 2.11.2026 (ja siksi englanniksi). Samalla korjattiin
testiajureita koskeva väittämä: neljässä repossa on ajuri, ei kahdessa — ks. § *Working commands*.

> [!IMPORTANT]
> Tästä projektista **ei muokata sisarrepojen skriptejä**. Työ on lukutilaista analyysiä niiden yli;
> korjaukset tehdään omistavassa repossa erillisessä istunnossa. Ks. `CLAUDE.md` § *What This Repository Is*.

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

## Working commands

This repo has no build and no tests of its own. The commands below run **inside the sibling repo** being
inspected.

```bash
# Unit tests — four of the eight siblings have a runner (verified 2.11.2026)
cd ../cf-gbb-tools && npm test                   # vitest run — 106 test files, pure logic only, not routes
cd ../cf-gbb-tools && npx vitest run src/app/lib/helsinki-date.test.ts                 # single file
cd ../netsuite-ic-calculators && npm test        # jest --verbose — 2 test files
cd ../netsuite-ic-calculators && npx jest tests/gbb_ic_redemption_calculator.test.js   # single file
cd ../netsuite-subscrption-cr-scripts && npm test   # node --test tests/*.test.js — 3 files (plan + lunastus libs)
cd ../netstuite-send-end-redemption-payment-link && node test/run_tests.js   # price + Helsinki-date libs, no package.json
```

The other four — `netsuite-monthly-reporting`, `netsuite-bike-redemption-status-sync`,
`netsuite-paylink-order-tracking` and `netsuite-subscription-extension` — have **no test runner at all**.

Where a runner does exist it covers **pure logic only**: not one of them exercises a SuiteScript entry
point, an `N/*` module or a NetSuite record. A green suite is therefore not evidence that a deployed
script works. Never report a SuiteScript change as "tested" without a NetSuite run.

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
- **The RI lease start date is rebuilt monthly and forgets every transfer.** `custrecord_gbb_ri_lease_start_date`
  (payroll CSV column 8 *Vuokrakausi alkanut*) is copied from the register's `custrecord_sta_subsc_start_date`
  on every run (`mr_monthly_reporting_ri_creation.js:1082`, `ri_update.js:324`, five UE scripts). A type-1
  *Siirto TA* never updates that field — only `handler_siirto_pt.js:62` writes it — so the only row that
  carries the real transfer date is the one the transfer UE itself creates
  (`ue_reporting_item_transfers.js:873`, `= official_end_date + 1`). Verified 2.11.2026: 497 September rows
  corrected by hand on 27.08.2026, **0 survived** the October and November runs. The register's start date
  cannot be overwritten — it is the IC amortisation anchor (`gbb_ic_redemption_price_mr.js:143`). Fix:
  new field `custrecord_gbb_employer_lease_start` (created 2.11.2026), [ADR 0025](adr/0025-ri-vuokrakauden-alkupaiva.md),
  TASKS T95–T97.
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

### Laskutusmoottori (Staria, script 701) — how the customer invoices are made

Customer leasing invoices are produced from `customrecord_sta_ca_agreement_row` by **[STA] MR
Agreement Invoicing**, script **701**, deployment `customdeploy_sta_mr_agreement_invoicing`. Its
source is **not** in any of the eight sibling repos — it is in the local Staria bundle at
`C:\Users\Riku\Documents\GitHub\SuiteScripts\Staria\Subscription Add-ons\`. The full write-up,
verified from that source on 1.11.2026, is [`docs/laskutusmoottori-701.md`](laskutusmoottori-701.md).
The four things worth knowing before you query anything about billing:

- **It is scheduled as a `SingleEvent`, one month at a time.** Finance sets the day they want the
  invoices to appear; a deployment with no next occurrence is normal, not a lapsed schedule.
- **The billed period is the agreement's `custrecord_sta_ca_date_next_invoice`,** not the run date.
  Finance mass-updates that field on every agreement immediately before the run — that import is
  part of the procedure. The invoice `trandate` is normally one month earlier (advance billing).
- **`custrecord_sta_ca_row_status = 1` is the billing gate** (`invoice.functions.js:618`). `isinactive`
  and `custrecord_sta_ca_row_to_be_invoiced` are not. Any coverage or duplicate query that filters only
  on `isinactive` overstates the billable population and raises false alarms on ended bikes.
- **An empty row invoice history triggers catch-up:** one extra invoice line per month from the row's
  start date up to the billed period (`invoice.functions.js:199-226`). So a row missed by one run is
  billed retroactively by the next one — but the catch-up months are **never written to the row's
  invoice history**, which blinds `cr_invoice_guard.checkWasBilled`, `handler_hyvitys` and rule HY2.
  Corollary: clearing a row's invoice history retro-invoices every month since the row began.

## Documentation trust order

Per-repo docs disagree with each other and occasionally with themselves. When they conflict:
**live NetSuite > repo source code > that repo's `CLAUDE.md` / `README.md` > dated plans** in
`docs/ideas/`, `docs/superpowers/` and `archive/`. Two repos name their own authority file
explicitly: `netsuite-monthly-reporting/PROJEKTIN_TILA.md` (sole status picture, Finnish, currently
on branch `dev` and *not* merged to `master`) and `netsuite-subscrption-cr-scripts/CHANGELOG.md`.
Monthly-reporting documents cases where the repo is *ahead of* NetSuite — treat every "deployed"
claim as unverified until queried.
