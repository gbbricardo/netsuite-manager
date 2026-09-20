# Subscription line (agreement row)

**Record type:** `customrecord_sta_ca_agreement_row`
**Fields:** 46 (42 own + native)
**Exported from live NetSuite:** 2026-09-17

Billing rows — one per item (Rent / Admin Fee) per bike per period, child of
`customrecord_sta_customer_agreement`. Closed, cloned and reparented by the CR handlers; read by
monthly-reporting for the monthly price, by subscription-extension as authoritative billing
coverage, and by ic-calculators.

All fields are filterable except `refName`.

## Identity and parentage

| Field ID | Label | Type |
|---|---|---|
| `custrecord_sta_ca_parent_agreement` | (parent agreement) | select → `customrecord_sta_customer_agreement` |
| `custrecord_sta_bikeid` | (bike) | select → `customrecord_sta_bike_register` |
| `custrecord_sta_ca_row_item` | (item) | select (item) |
| `custrecord_sta_ca_row_status` | (row status) | select |
| `custrecord_sta_ca_product_type` | (product type) | select → `customlist_sta_ca_subscription_linetyp` |
| `custrecord_sta_ca_renewal_of` | (renewal of) | select (self) |
| `custrecord_sta_enduse` | (end user) | select |
| `custrecord_sta_enduser_cc` | Enduser cost center | text |
| `custrecord_sta_ca_row_subsidiary` | (subsidiary) | select |
| `custrecord_sta_ca_row_currency` | (currency) | select |
| `name` / `altName` / `id` / `externalId` | (identifiers) | text |
| `isInactive` | Inactive | checkbox |

> **Item IDs are hard-coded everywhere:** `30` = `Vuokra - Rent subs`, `33` =
> `Leasingmaksu - Lease payment`. Monthly-reporting reads the monthly price only from rows carrying
> one of those two items — if neither matches, the bike benefit is reported as **zero**.

## Period

| Field ID | Label | Type |
|---|---|---|
| `custrecord_sta_ca_row_license_startdate` | Start Date | date |
| `custrecord_sta_ca_row_license_enddate` | End Date | date |
| `custrecord_sta_ca_row_period_start_date` | Period Start Date | date |
| `custrecord_sta_ca_row_period_end_date` | Period End Date | date |
| `custrecord_sta_ca_row_not_openended` | Not Open-Ended | checkbox |
| `custrecord_sta_is_prolongation_line` | Is prolongation | checkbox |
| `created` / `lastmodified` | (native) | datetime |

> The CR handlers apply an **end-date guard**: a row's end date is never pushed forward, only
> closed earlier. Type 9 splits rows on `startdate` vs `custrecord_cr_end_date_of_old_sub` —
> already-started rows are closed and cloned, future prolongation rows are only reparented.
> `custrecord_sta_is_prolongation_line` is preserved on the clone and changes which end date it gets.

## Pricing

| Field ID | Label | Type |
|---|---|---|
| `custrecord_sta_ca_row_price_month` | Gross Price per Month (Each) | number (float) |
| `custrecord_sta_ca_row_price` | Gross Price per Year (Each) | number (double) |
| `custrecord_sta_ca_row_gross_cost_daily` | Gross Cost per Day (Each) | number (float) |
| `custrecord_sta_ca_row_final_cost_daily` | Net Cost per Day | number (float) |
| `custrecord_sta_ca_row_final_cost_yearly` | Net Cost per Year | number (double) |
| `custrecord_sta_ca_row_final_cost_total` | Net Cost Total | number (double) |
| `custrecord_sta_ca_row_license_count` | License Count | number (float) |
| `custrecord_sta_ca_row_discount_percent` | Discount (%) | number (double) |
| `custrecord_sta_ca_row_discount_amount` | Discount (Amount) | number (double) |

> **`custrecord_sta_ca_row_price_month` is a NET price (VAT 0), despite its label *Gross Price per
> Month*.** Verified 2026-09-18 from every writer and reader, not from the label:
>
> | Side | Evidence |
> |---|---|
> | Writer — `sta_mr_vendor_bill_logic.js` (Staria) | copies `custrecord_sta_init_subs_rent_fee` / `customrecord_sta_contract_prices.custrecord_sta_rent_per_month`, both labelled **(net)**, straight into the field; the variable is misleadingly named `grossPricePerMonth` |
> | Writer — `handler_siirto_ta.js` (type 1 clone) | copies `custrecord_sta_admin_fee_per_month` (net) directly, fallback **15.94** — which is 20.00 gross at 25.5 % VAT |
> | Writer — OOMI CSV import (2026-08/09) | typical rent **79.6813** = 100.00 gross ÷ 1.255; the design doc states the net value is written at 4 decimals |
> | Reader — invoicing engine (`invoice.functions.js`) | puts the value on the SO line as `rate`; the tax engine adds VAT on top |
> | Reader — monthly-reporting | copies it into `custrecord_gbb_ri_lease_fee_vat0` (**VAT0**) and the CSV multiplies by 1.255 (`TULOSTUSSAANNOT.md` T4) |
> | Reader — cf-gbb-tools | `formatGrossEuroAmount` documents the value as "stored net of VAT" and applies `netToGross` for display |
>
> So there is **no VAT boundary** between this field and `customrecord_sta_contract_prices` or the
> bike register's `curr_subs_*` / `init_subs_*` fees — all are net. The only conversion happens at
> display time (cf-gbb-tools, monthly-reporting CSV). Code that multiplies or divides by 1.255 when
> moving a value between these records is a bug. `netsuite-subscription-extension` does not read
> this field at all (it reads only `custrecord_sta_ca_row_license_enddate`).

## Indexation

| Field ID | Label | Type |
|---|---|---|
| `custrecord_sta_ca_index_price_increase` | Index Price Increase (Year) | number (double) |
| `custrecord_sta_ca_row_acc_indx_increase` | HIDDEN: Accumulated Index Increase | number (double) |
| `custrecord_sta_ca_row_exclude_index` | Exclude from Index Uplift | checkbox |

## Invoicing

| Field ID | Label | Type |
|---|---|---|
| `custrecord_sta_ca_row_invoicehistory` | Invoice History | text |
| `custrecord_sta_ca_row_to_be_invoiced` | To be Invoiced | checkbox |
| `custrecord_sta_ca_row_invoice_date` | Invoice Date | date |
| `custrecord_sta_ca_row_invoice_notice` | Invoice Notice | text |
| `custrecord_sta_ca_row_sort_order` | Sort Order | integer |

> **`custrecord_sta_ca_row_invoicehistory` is free text, and two handlers parse it.** Type 11
> (`handler_hyvitys`) prices each credited month from the row whose invoice history contains that
> month, and Type 13 uses it to detect transition months. It is also the basis of
> `cr_invoice_guard.checkWasBilled`. Its format is therefore a contract, not a note.

## Native

`scriptId`, `abbreviation`, `refName`, `owner`, `lastmodifiedby`
