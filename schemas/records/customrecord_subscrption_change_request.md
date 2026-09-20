# [GBB] Subscription change request

**Record type:** `customrecord_subscrption_change_request`
**Fields:** 46 (42 own + native)
**Exported from live NetSuite:** 2026-09-17

The hub record. Created by cf-gbb-tools, `netsuite-subscription-extension` (type 7) and CR type 13
(which generates types 7, 9, 11). Consumed by **two independent paths with different semantics**:

- `netsuite-subscrption-cr-scripts` — daily, acts on `custrecord_cr_status = 1 (Pending)` with
  `custrecord_cr_closed_date` empty.
- `netsuite-monthly-reporting` — User Event scripts, mostly on **CREATE regardless of status**.

> The live list has **6 values including `3 = In Progress`**. The CR repo's `CLAUDE.md` calls that
> value "unverified"; the value does exist in NetSuite, though whether any record carries it is a
> separate question. See [`../lists/`](../lists/README.md).

All fields are filterable except `refName`.

## Routing and lifecycle

| Field ID | Label | Type |
|---|---|---|
| `custrecord_cr_type` | (CR type) | select → `customlist_cr_type_list` |
| `custrecord_cr_status` | (CR status) | select → `customlist_cr_status_list` |
| `custrecord_cr_closed_date` | Closed Date | datetime |
| `custrecord_cr_automation_logs` | Automation logs | text |
| `custrecord_cr_notes` | Note | text |
| `custrecord_cr_created_date` | Created Date | date |
| `altName` | Name | text |
| `name` | ID | text |
| `isInactive` | Inactive | checkbox |

> **`altName` is functional, not descriptive.** Monthly-reporting routes types 2 and 7 on its text
> content (`vakuutus`, `2B`/`2C`/`2D`, and `pidennys` — **case-sensitive**), while the CR processor
> routes on `custrecord_cr_type` plus its own suffix rules (` - 2B`, ` - 2B uusi TA`, `vakuutus`).
> Renaming a CR silently desynchronises the two.

## Dates

| Field ID | Label | Type |
|---|---|---|
| `custrecord_cr_start_date` | Start date | date |
| `custrecord_cr_end_date` | End date | date |
| `custrecord_cr_end_date_of_old_sub` | End date of old subscription | date |
| `custrecord_cr_official_start_date` | Contract official start date | date |
| `custrecord_cr_contract_official_end_date` | Contract official end date | date |
| `custrecord_cr_due_date` | Due Date | date |

> `custrecord_cr_start_date` decides **who writes the bike register** for types 1 and 9: the handler
> itself when the date is on or before the first of next month, otherwise `customscript1196`
> ([GBB] Change request update BR) on the last day of the month.

## References

| Field ID | Label | Type |
|---|---|---|
| `custrecord_cr_bike_registry` | (bike) | select → `customrecord_sta_bike_register` |
| `custrecord_cr_next_billto_customer` | (new bill-to) | select (customer) |
| `custrecord_cr_current_billto_customer` | (current bill-to) | select (customer) |
| `custrecord_cr_next_employee` | (next employee) | select |
| `custrecord_cr_group_transfer_reason` | (consortium transfer reason) | select → `customlist538` |
| `owner` / `lastmodifiedby` | (NetSuite user) | select |

## Type-specific payload

| Field ID | Label | Type | Used by |
|---|---|---|---|
| `custrecord_cr_service_fee_paused` | Toimisto- ja käsittelykulua ei veloiteta välikuukausilta | checkbox | Type 3, and Type 11 line selection |
| `custrecord_cr_bike_external_id` | Bike external id | text | Type 13 |
| `custrecord_cr_new_customer_external_id` | New customer external id | text | Type 13 |
| `custrecord_cr_enduser_new_email` | Enduser new email | text | Type 2 |
| `custrecord_cr_former_hubspot_contract_id` | Former Hubspot contract id | text | Type 11 → `custbody_sta_nord_ourref` |
| `custrecord_cr_cost_center_code` | Cost center code | text | Types 1, 6 |
| `custrecord_cr_billto_admin_fe` | Next Bill-to Customer Admin Fee | number (float) | Type 1 |
| `custrecord_cr_billto_admin_fee_1` | Next Bill-to Customer Admin Fee (show) | number (float) | display copy |

## Employee / end-user snapshot

| Field ID | Label | Type |
|---|---|---|
| `custrecord_cr_current_enduser_name` | Current enduser name | text |
| `custrecord_cr_current_employee_id` | Current Employee Id | text |
| `custrecord_cr_current_cost_center_code` | Current Cost center code | text |
| `custrecord_cr_current_contract_addit_inf` | Current contract additional info | text |
| `custrecord_cr_next_employee_name` | Next Employee Name | text |
| `custrecord_cr_next_employee_email` | Next Employee Email | text |
| `custrecord_cr_next_employee_code` | Next Employee Code | text |
| `custrecord_cr_employee_id_for_reporting` | New employee id for reporting | text |
| `custrecord_cr_additional_info_for_report` | New additional info for reporting | text |

## Native

`id`, `externalId`, `scriptId`, `abbreviation`, `created`, `lastmodified`, `refName`
