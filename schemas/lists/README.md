# Custom list values

**Exported from live NetSuite:** 2026-09-17
Regenerate with `node tools/export-schemas.mjs lists`.

Every ID below is **hard-coded into the sibling projects' scripts** — none of it is configuration,
none of it is read from a parameter. If an ID changes or a value is removed, scripts read a
different meaning or stop recognising the case, and (per the house style) fail quietly rather than
erroring. See `../../CLAUDE.md` for what breaks where.

All values listed are active; none of these lists currently has an inactive value.

---

## `customlist_cr_type_list` — Change Request Type

| ID | Value | Handled by |
|---|---|---|
| 1 | Siirto TA | `handler_siirto_ta` · monthly-reporting transfers |
| 2 | Keskenkauden lunastus | `handler_lunastus` · monthly-reporting mid-term ending |
| 3 | Välikuukaudet | `handler_vali` · monthly-reporting intermediary months |
| 6 | Siirto TT | `handler_siirto_tt` · monthly-reporting transfers |
| 7 | Jälkiveloitus | `handler_jalki` · monthly-reporting late redemption |
| 8 | Siirto PTltä | `handler_siirto_pt` · monthly-reporting transfers |
| 9 | Siirto konserni | `handler_konserni` · monthly-reporting transfers |
| 10 | Reklamaatio/peruutus | **no handler in any repo** |
| 11 | Hyvitys | `handler_hyvitys` · monthly-reporting validity check |
| 13 | Siirto konserni - alustus | `handler_konserni_alustus` · monthly-reporting transfers |

> Type **10 (Reklamaatio/peruutus)** exists in NetSuite but is not routed by the CR dispatcher and
> is not documented in any sibling repo. Either it is handled manually or it is a gap.
> There is no type 4, 5 or 12.

## `customlist_cr_status_list` — Change Request Status

| ID | Value | Notes |
|---|---|---|
| 1 | Pending | What the scheduler picks up (with `closed_date` empty) |
| 2 | Done | Transfer User Events fire on the transition *into* this |
| 3 | In Progress | **Exists in NetSuite.** The CR repo's `CLAUDE.md` calls this value unverified |
| 5 | Error | Dispatcher writes the reason to `custrecord_cr_automation_logs` |
| 6 | Needs Review | Transient — finance moves it to Done or Cancelled |
| 7 | Cancelled | Monthly-reporting stage 1d turns affected rows into Warning |

There is no status 4.

## `customlist_sta_bike_status` — [STA] Bike status

| ID | Value | Written by |
|---|---|---|
| 1 | Active | — (the default state) |
| 2 | Redeemed | `handler_lunastus` **and** bike-redemption-status-sync |
| 3 | Returned | `handler_lunastus` when the CR name contains `2D` |

## `customlist_sta_bike_order_type` — [STA] Bike order type

| ID | Value |
|---|---|
| 1 | ITSEHANKINTA |
| 2 | ETUPYÖRÄ |
| 3 | OOMI |

ID `3` drives monthly-reporting's Oomi separation and its Oomi end-date exemption.

## `customlist_gbb_reporting_status` — [GBB] Reporting status

| ID | Value | CSV file |
|---|---|---|
| 1 | Active | `Kaikki_aktiiviset` |
| 2 | Active/New | `Kaikki_uudet` |
| 3 | Paused | `Kaikki_paattyneet_ja_tauotetut` |
| 4 | Ended | `Kaikki_paattyneet_ja_tauotetut` |
| 5 | Warning | *excluded from CSV — needs human review* |
| 6 | Deleted | *excluded from CSV* |

## `customlist_gbb_liab_settle_method` — [GBB] Loppuvastuun hoitotapa

| ID | Value | Set by `handler_lunastus` when |
|---|---|---|
| 1 | redemption_paid | status 2 default |
| 2 | redemption_extra_rent | |
| 3 | redemption_maint_budget | |
| 4 | redemption_down_payment | |
| 5 | bike_returned | status 3 default (` - 2C`, ` - 2D`) |
| 6 | bike_sold_to_competitor | name suffix ` - 2B` / ` - 2B uusi TA` + status 2 |
| 7 | bike_stolen_or_destroyed | name contains `vakuutus` + status 2 |

Both this field and `custrecord_gbb_liab_settled_at` are **write-once**, guarded independently.

## `customlist_gbb_redemption_status` — [GBB] Redemption status

| ID | Value |
|---|---|
| 1 | finalised |
| 2 | pending_contract_termination |
| 3 | payment_overdue |
| 4 | waiting_for_payment |

## `customlist_pr_ns_status` — Payment request statuses

The Paylink pipeline state machine, on `custrecord_pl_ns_status`.

| ID | Value | Notes |
|---|---|---|
| 1 | New | Exists but unused in production data |
| 2 | Pending Processing | Triggers the UE processor |
| 3 | Completed | Terminal; never reprocessed |
| 4 | Error | Admin email sent; admin resets to Pending |
| 5 | Pending Bike | Awaiting `custrecord_pl_ns_bike_id`; retry script promotes it |

> **`netsuite-paylink-order-tracking/CLAUDE.md` names this list `customlist_paylink_ns_status`,
> which does not exist in NetSuite.** The internal IDs it documents are correct; only the list
> script ID is wrong.

## `customlist_sta_contract_financier` — [STA] Contract financier

| ID | Value |
|---|---|
| 1 | GoByBike Finland Oy |
| 2 | GoByBike Finance Oy |
| 3 | Siemens Financial Services |

ID `3` is monthly-reporting's Siemens exemption in the bike data validity check.

## `customlist_sta_is_so_type` — [STA] SO Type

Used on invoices and sales orders via `custbody_sta_is_so_type`.

| ID | Value |
|---|---|
| 1 | Invoice Splitting |
| 2 | Enduser down payment |
| 3 | Mid-contract redemption |
| 4 | End redemption |

ID `4` is what the Paylink post-processor looks for before setting
`custrecord_sta_end_red_so_created`.

## `customlist538` — Konsernisiirron syy (consortium transfer reason)

| ID | Value |
|---|---|
| 1 | Työntekijä siirtyy konserniyhtiöstä toiseen |
| 2 | Virheen korjaus |

ID `2` changes the notice text monthly-reporting puts on the employer CSV.

## `customlist535` — [GBB] RETURN STATUS

| ID | Value |
|---|---|
| 1 | completed |
| 2 | processing |
| 3 | waiting_for_payment |

## `customlist536` — [GBB] Cancellation reason

| ID | Value |
|---|---|
| 1 | revised |
| 2 | redeemed |
| 3 | other |
| 4 | returned |
| 5 | insurance_theft |
| 6 | merger_acquisition |
| 7 | transfer_to_competitor |
| 8 | insurance_accident |

## `customlist537` — [GBB] Oomi bike status

| ID | Value |
|---|---|
| 1 | active |
| 2 | active_pending_redemption |
| 3 | active_pending_return |
| 4 | active_pending_revision |
| 5 | cancelled |
| 6 | cancelled_pending_payment |
| 7 | ended |
| 8 | ended_pending_payment |
| 9 | invalidated |
| 10 | scheduled |

---

## Items (not a list, but equally hard-coded)

| Internal ID | Item | Where |
|---|---|---|
| 30 | `Vuokra - Rent subs` | every monthly-fee lookup in monthly-reporting; Rent lines in handlers 7/11 |
| 33 | `Leasingmaksu - Lease payment` | as above |

If neither item is found on a bike's rows, monthly-reporting reports the bike benefit as **zero**
rather than failing.

## Lists deliberately not exported

The account carries ~60 `customlist_sta_*` lists from the Staria bundle (FlowAP, INFlow, e-invoicing,
EFT). None of the seven sibling projects reads them. `node tools/export-schemas.mjs lists` pulls
everything matching the `customlist_cr_`, `customlist_sta_`, `customlist_gbb`, `customlist_pl_` and
`customlist_paylink` prefixes if you need the full set — note that the four `customlist5NN` lists
above have no script ID and are therefore *not* picked up by that prefix filter.
