# Contract price

**Record type:** `customrecord_sta_contract_prices`
**Fields:** 17 (13 own + native)
**Exported from live NetSuite:** 2026-09-17

Optional per-customer price override, valid for a date range. Queried by the Type 1 CR handler
(`handler_siirto_ta`) to re-resolve the admin fee when rows are cloned under a new customer's
agreement. The smallest of the shared records and the easiest to forget.

All fields are filterable except `refName`.

| Field ID | Label | Type |
|---|---|---|
| `custrecord_sta_contract_customer_prices` | (customer) | select |
| `custrecord_sta_rent_per_month` | Rent price per month (NET) | number (float) |
| `custrecord_sta_admin_fee_per_month` | Admin fee price per month (NET) | number (float) |
| `custrecord_sta_price_start` | Price start date | date |
| `custrecord_sta_price_end` | Price end date | date |
| `custrecord_sta_upd_for_all_subs` | Update for all existing subscription lines | checkbox |
| `custrecord_sta_ext_subs_upd` | Existing subscription lines updated | checkbox |
| `isInactive` | Inactive | checkbox |
| `name` / `id` / `externalId` | (identifiers) | text |
| `scriptId` / `abbreviation` / `refName` | (native) | text |
| `created` / `lastmodified` | (native) | datetime |
| `owner` / `lastmodifiedby` | (NetSuite user) | select |

> Prices here are **NET per month** — and so is `customrecord_sta_ca_agreement_row`'s
> `custrecord_sta_ca_row_price_month`, despite that field's *Gross Price per Month* label.
> `handler_siirto_ta.js` copies `custrecord_sta_admin_fee_per_month` into the row **unchanged**
> (fallback 15.94 = 20.00 gross), and the invoicing engine bills the row value as the net line rate.
> There is **no VAT boundary** between the two records. The `1.255` conversion in cf-gbb-tools
> (`src/app/lib/vat.ts`, `netsuite-money.ts`) is display-only. *An earlier revision of this note
> claimed the row field was gross; that was wrong — see the row schema for the evidence.*
