# [GBB] Payment requests (Paylink staging)

**Record type:** `customrecord_payment_requests`
**Fields:** 48 (44 own + native)
**Exported from live NetSuite:** 2026-09-17

Staging record for the Paylink → NetSuite pipeline. Written by `netsuite-paylink-order-tracking`;
read by `netsuite-subscription-extension` (safety check 2), `netsuite-bike-redemption-status-sync`
and the cf-gbb-tools `netsuite-alerts` tool.

All fields are filterable except `refName`.

## The two status fields — do not mix them up

| Field ID | Label | Type |
|---|---|---|
| `custrecord_pl_ns_status` | (NetSuite pipeline status) | select → `customlist_pr_ns_status` |
| `custrecord_pl_status` | Paylink Status | **free-form text** |

`custrecord_pl_ns_status` is the state machine the Paylink scripts drive (`2` Pending Processing,
`3` Completed, `4` Error, `5` Pending Bike; `1` New exists but is unused in production).
`custrecord_pl_status` holds Paylink's own string, e.g. `completed`.

> Swapping the two makes a check match **nothing, silently**. `netsuite-subscription-extension`
> deliberately reads the free-form `custrecord_pl_status` for its "completed Paylink payment" check.

> **Naming asymmetry:** `netsuite-paylink-order-tracking/CLAUDE.md` names the backing list
> `customlist_paylink_ns_status`. No such list exists in NetSuite — the real script ID is
> **`customlist_pr_ns_status`** ("Payment request statuses"). The internal IDs the repo documents
> are correct; only the list name is wrong.

Live distribution (2026-09-17): Completed 9,291 · Pending Bike 91 · Pending Processing 33 ·
Error 2 · empty 1.

## NetSuite links

| Field ID | Label | Type |
|---|---|---|
| `custrecord_pl_ns_bike_id` | (bike) | select → `customrecord_sta_bike_register` |
| `custrecord_pl_ns_customer` | (customer) | select |
| `custrecord_pl_ns_so_id` | (sales order) | select (transaction) |
| `custrecord_pl_ns_deposit_id` | (customer deposit) | select (transaction) |

> SO and Deposit carry `externalid` prefixes `PLSO-` and `PLDEP-`; they must stay distinct because
> NetSuite enforces `externalid` uniqueness across all transaction types.

## Paylink order identity

| Field ID | Label | Type |
|---|---|---|
| `custrecord_pl_order_id` | Paylink Order ID | text |
| `custrecord_pl_display_id` | Display ID | text |
| `custrecord_pl_transaction` | Transaction ID | text |
| `custrecord_pl_reference` | Reference | text |
| `custrecord_pl_payment_url` | Payment URL | text |
| `custrecord_pl_raw_json` | Raw JSON | text |

## Amounts

| Field ID | Label | Type |
|---|---|---|
| `custrecord_pl_amount_total` | Amount — Total | number (float) |
| `custrecord_pl_amount_net_so` | Amount — Net SO | number (float) |
| `custrecord_pl_amount_base` | Amount — Base (excl. VAT) | number (float) |
| `custrecord_pl_amount_tax` | Amount — Tax | number (float) |
| `custrecord_pl_tax_rate_id` | Tax Rate ID | text |

Paylink returns cents; the sync script converts to EUR. `amount_net_so = total / TAX_DIVISORS[tax_rate_id]`
(`fi_standard: 1.255`). `amount_base` and `amount_tax` are informational only.

## Product

| Field ID | Label | Type |
|---|---|---|
| `custrecord_pl_product_id` | Product ID | text |
| `custrecord_pl_product_name` | Product Name | text |
| `custrecord_pl_product_quantity` | Quantity | text |

> `PRODUCT_MAP` in `paylink_ns_processor.ue.js` is keyed on Paylink's `title` field, **not** `name`.

## Timestamps

| Field ID | Label | Type |
|---|---|---|
| `custrecord_pl_paid_at` | Paid At | datetime |
| `custrecord_pl_processed_at` | Processed At | datetime |
| `custrecord_pl_due_date` | Due Date | datetime |
| `custrecord_pl_last_sync` | Last Sync | datetime |
| `custrecord_pl_posting_period` | Posting Period (trandate) | datetime |
| `created` / `lastmodified` | (native) | datetime |

`custrecord_pl_paid_at`, truncated to date, is what bike-redemption-status-sync stamps into
`custrecord_gbb_redemption_paid_at`.

## Payer details and admin

| Field ID | Label | Type |
|---|---|---|
| `custrecord_pl_customer_name` | Customer Name | text |
| `custrecord_pl_email` | Email | text |
| `custrecord_pl_company` | Company | text |
| `custrecord_pl_company_id` | Company ID | text |
| `custrecord_pl_address` | Address | text |
| `custrecord_pl_postcode` | Postcode | text |
| `custrecord_pl_city` | City | text |
| `custrecord_pl_country` | Country | text |
| `custrecord_pl_notes` | Notes | text |
| `custrecord_pl_error_log` | Error Log | text |
| `isInactive` | Inactive | checkbox |

`custrecord_pl_notes` and `custrecord_pl_posting_period` are preserved on re-sync for records in
Error or Pending Bike, so admin corrections are not overwritten. The notes field also carries the
bike external ID the UE script searches on when `custrecord_pl_ns_bike_id` is empty.

## Native

`id`, `externalId`, `name`, `scriptId`, `abbreviation`, `refName`, `owner`, `lastmodifiedby`
