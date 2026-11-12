# CLAUDE.md — arkistoitu osiot 10.11.2026

> [!NOTE]
> Siirretty sellaisenaan `CLAUDE.md`:stä 10.11.2026 (claude-md-improver-läpikäynti). Sisältö on 22.9.–7.10.2026 tilanne: tarkista NetSuitesta, ennen kuin nojaat siihen.
> Ajantasaiset tehtävät ovat `TASKS.md`:ssä ja tilannekuva `docs/lunastus-tilanne.md`:ssä.

## Open items -taulukko, Resolved 22.09., porttikvadrantti ja sweepin ajastus (CLAUDE.md rivit 21–90)

### Open items — raise these with the user

| # | What | Why it matters |
|---|---|---|
| 1 | **33 CRs are still Pending** after the first scheduled runs (15 type 2, 16 type 11, 1 type 1, 1 type 7). Governance caps each batch, so the backlog drains over several runs. Re-check the gate quadrant below once it is empty. | Both schedules are back ON as of 22.09.2026. The gate has been verified on a batch of 43, but not on the whole backlog. |
| 2 | **Resolved 22.10.2026: the 1.10. run was the first full-population run of `ri_creation` and `ri_update`.** No `⚠ TEST SCOPE` line, `scanned=46626 created=33862 mapErrors=0`, `c_flagged=285` (202 of them wrong, fixed by T28). These scripts still have no dry-run mode, and the library throws on unrecognised dates: a throw loses that bike's row silently. The 1.11. run is the first one on `gbb_lunastus_lib` 1.2.0 and the T28/T29 code. | Every monthly run: work through [`queries/kuukausiajo-tarkistuslista.md`](queries/kuukausiajo-tarkistuslista.md) before the payroll CSV (1451). It holds the coverage checks, D8 withholding, the `scriptnote` lines and the 1.10. baseline. The execution log will not otherwise show a lost row. |
| 3 | **Status-sync part A loses late payments permanently** (23.09.2026). Its ±5-day window is keyed on the payment/invoice date, not on when the payment became visible. 24 paid Active bikes have no settle method and will never end. Correction CSV: `findings/2026-09-23-status-sync-maksuikkuna-hukkaa-myohaiset-maksut.md`. **The fix is not a patch.** The script is rewritten as status-sync 2.0 ([ADR 0007](docs/adr/0007-status-sync-2-tasmaytysajo.md), `docs/status-sync-2-tasmaytysajo.md`): a nightly Map/Reduce reconciling payment, status and `ic_redemption_dt` (finance's saved search 797). Approved 23.09.: **September runs on CSV imports, cut-over 1.10. in one go, October is the test month.** The script id changes: **status-sync 2.0 is script 1480, `Scheduled` nightly 00:30 Helsinki, dry run off 9.10.2026, first live run 10.10.** **S1 ran 23.09. 17:21, 27/27 correct**; 5 more bikes surfaced from the Paylink backlog afterwards (S1b needed; re-run the extraction query on 30.09.). CSV imports do **not** fire `ue_gbb_redemption_decided_at`, so `decided_at` stays empty on imported rows. **Re-specified 7.10.2026 ([ADR 0015](docs/adr/0015-status-sync-2-tarkennukset.md)):** the old script 1440 has been unscheduled since 6.10., so nothing records payments, turns statuses or writes IC dates until 2.0 is live. 2.0 is purely functional, with no reporting (that goes to `docs/poikkeamaraportointi-vaatimukset.md`). It ignores both exceptional end-date fields. `paid_at` is written as a payment fact. Settle method 2 is counted from Done *pidennys* CRs. The build guide is `docs/status-sync-2-tasmaytysajo.md`, task **T54, deadline 28.10.** (finance IC run 29.10., extension 1.11.). | The CSV must run before the 4 Pending 2C CRs are processed, or `handler_lunastus` writes the CR's creation date instead of the payment date (§5). A *Paid In Full* invoice can be a fully credited one: never widen the window without the credit check. |
| 4 | **End-of-term redemption rules confirmed 24.09.2026** ([ADR 0009](docs/adr/0009-kauden-lopun-lunastus.md), `docs/lunastuksen-kenttasaannot.md` § 9). End-of-term = no type 2/10 CR in Pending/Done; deadline is the end of the end month; **OOMI bikes are Redeemed in their end month without payment** (method 1, `liab_settled_at` = tunnistuspäivä, `paid_at` empty — Oomi covers unpaid fees); extension ends automatically once paid type-7 invoices (net rent + admin fee) cover `end_redemption_price`; `redemption_decided_at` has no meaning at end of term. Resolves ADR 0008 D7/D8. Open: **S4** CSV (34 stuck OOMI bikes, `imports/2026-09-24-oomi-kauden-loppu/`) must run before S3 on 30.09.; K1–K3 go into status-sync 2.0; **K4**: 16 S1 bikes got method 1 before their end month; clearing CSV `imports/2026-09-24-s1-ennenaikainen-tapa/` **ran 24.09., 16/16 verified**; re-check 28.09. (B029495 may regain method 1 from old part A's ±5-day window). | Without S4 those 34 bikes stay Active forever — the sweep never sees a bike with no settle method. The OOMI `paid_at ≠ liab_settled_at` pattern is correct, not a §5 violation. |
| 5 | **Mid-term redemption rules confirmed 24.09.2026** ([ADR 0010](docs/adr/0010-keskenkauden-lunastus.md), `docs/lunastuksen-kenttasaannot.md` § 10, requirements `docs/keskenkauden-lunastus-vaatimukset.md`). The type-2 CR alone is decision *and* evidence (no payment wait); no CR → no mid-term redemption, missing CRs are created **by hand** in October (19 bikes, `findings/2026-09-24-keskenkauden-maksu-ilman-cr.md`); `decided_at` = `cr_created_date`, written by the handler, history via CSV; rows cut at `end_date_of_old_sub`, money fixed by a type-11 CR (the only credit path — Staria `sta_mr_mid_life_redemption` was **Scheduled every 2 h** and is **NOTSCHEDULED since 9.10.2026**, both deployments); empty official end / created date or a later end date → Needs Review (owners finance + customer service, deadline end of creation month). **Exceptional end-date fields are abandoned**: päättymisajankohta becomes `subsc_end_date` only in October; `oomi_exceptional_end_date` stays Fleet-CSV visibility only. Open: **D9** — 15 Fleet-ended Active bikes with no settle method. | The CSV `imports/2026-09-25-poikkeuspaivat-subsc/` was **cancelled on 21.10.2026**, so do not run it. The registers' `subsc_end_date` values are correct, and the IC run already followed them. The library may drop the `COALESCE` without a CSV first. B044906 was corrected by hand to 31.08.2026 on 21.10. (ADR 0010 § 8). |
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
       CASE WHEN br.custrecord_sta_subsc_end_date >= TRUNC(CURRENT_DATE,'MM') + INTERVAL '1' MONTH
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


## Resolved 21.09.2026 — date_to_non_active (CLAUDE.md rivit 102–108)

**Resolved 21.09.2026 — do not re-open.** `custrecord_gbb_date_to_non_active` was empty on 664
ended bikes right after the calendar sweep; by the same evening all 664 carried 21.09.2026, which
is exactly their tunnistuspäivä. A process fills the field with a delay of hours, and fills it correctly.
**Identified 23.09.2026:** it is `customscript1458` *Bike status date backfill* (internal id 1458),
`netsuite-bike-redemption-status-sync/gbb-bike-status-history/gbb_ss_bike_status_history_backfill.js`.
It runs daily at about 02:01 log time and reads the status-change date from System Notes
(`findings/2026-09-23-b038677-redeemed-ja-ended-ilman-cr.md`).

## Next piece of work: phase 3 (CLAUDE.md rivit 129–144)

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
