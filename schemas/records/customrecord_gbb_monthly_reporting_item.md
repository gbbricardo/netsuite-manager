# [GBB] Monthly reporting item (RI)

**Record type:** `customrecord_gbb_monthly_reporting_item`
**Fields:** 29 (25 own + native)
**Exported from live NetSuite:** 2026-09-17

The output of `netsuite-monthly-reporting`: one row per bike + employer + reporting date, frozen at
the moment it is written. Owned and consumed only by that project — but derived from the bike
register, agreement rows and change requests, so anything that changes those changes this.

All fields are filterable except `refName`.

## Keys

| Field ID | Label | Type |
|---|---|---|
| `custrecord_gbb_ri_bike` | (bike) | select → `customrecord_sta_bike_register` |
| `custrecord_gbb_ri_employer` | (employer) | select (customer) |
| `custrecord_gbb_ri_reporting_date` | Reporting date | date |
| `custrecord_gbb_ri_end_user` | (end user) | select |
| `custrecord_gbb_ri_change_request` | (source CR) | select → `customrecord_subscrption_change_request` |
| `custrecord_gbb_ri_subscription_line` | (source agreement row) | select → `customrecord_sta_ca_agreement_row` |
| `name` | Name | text |

> The employer on transfer rows is read from the bike register **at the moment the User Event
> runs**, which is why a transfer row pair could end up with one employer where it needs two
> (rule D1 in `netsuite-monthly-reporting/RIVISAANNOT.md`).

## Reporting state

| Field ID | Label | Type |
|---|---|---|
| `custrecord_gbb_ri_reporting_status` | Reporting status | select → `customlist_gbb_reporting_status` |
| `custrecord_gbb_needs_review` | Needs review | checkbox |
| `custrecord_gbb_ri_can_be_updated` | Can be updated | checkbox |
| `custrecord_gbb_ri_automation_logs` | Automation logs | text |
| `isInactive` | Inactive | checkbox |

Status values: `1` Active, `2` Active/New, `3` Paused, `4` Ended, `5` Warning, `6` Deleted.
Only 1–4 reach the CSVs.

> **Warning (5) and Deleted (6) are designed end states, not errors.** A script that cannot resolve
> its data writes Warning and the reason into `custrecord_gbb_ri_automation_logs` rather than
> failing. A broken dependency therefore shows up as a **rising Warning count**, never as an
> execution-log error.

> **Ended → Deleted is not neutral.** `mr_monthly_reporting_ri_creation.js`'s
> `loadBikesWithAnyEndedRi()` looks only for status 4. Flipping a bike's only Ended row to Deleted
> drops it from that guard, and the monthly batch starts producing rows for it again.

## Reported values

| Field ID | Label | Type |
|---|---|---|
| `custrecord_gbb_ri_lease_fee_vat0` | Lease fee (VAT0) | number (float) |
| `custrecord_gbb_ri_lease_start_date` | Lease period start date | date |
| `custrecord_gbb_ri_lease_end_date` | Lease period end date | date |
| `custrecord_gbb_ri_tax_exemption` | Tax exemption | checkbox |
| `custrecord_gbb_ri_order_type` | Order type | **text** (not a select) |
| `custrecord_gbb_ri_employee_id` | Employee id for reporting | text |
| `custrecord_gbb_ri_cost_center_code` | Employee cost center code | text |
| `custrecord_gbb_ri_additional_info` | Additional info for reporting | text |
| `custrecord_gbb_ri_gbb_notification` | Gobybike notification for reporting | text |

> `custrecord_gbb_ri_order_type` is **free text**, even though the bike register's
> `custrecord_sta_bike_order_type` is a select over `customlist_sta_bike_order_type`. The value is
> written by `mr_ri_set_order_type.js`, documented as temporary — and that script currently has
> **no deployment** in NetSuite. See [`../script-inventory.md`](../script-inventory.md).

## Native

`id`, `externalId`, `scriptId`, `abbreviation`, `created`, `lastmodified`, `refName`, `owner`,
`lastmodifiedby`
