# Record schemas

**Exported from live NetSuite:** 2026-09-17

| Record | Label | Fields | Primary owner |
|---|---|---|---|
| [`customrecord_sta_bike_register`](customrecord_sta_bike_register.md) | [STA] Bike Register | 85 | shared — everything reads it |
| [`customrecord_subscrption_change_request`](customrecord_subscrption_change_request.md) | [GBB] Subscription change request | 46 | shared — two consumers, different semantics |
| [`customrecord_sta_ca_agreement_row`](customrecord_sta_ca_agreement_row.md) | Subscription line | 46 | CR handlers write; three projects read |
| [`customrecord_payment_requests`](customrecord_payment_requests.md) | [GBB] Payment requests | 48 | paylink-order-tracking |
| [`customrecord_gbb_monthly_reporting_item`](customrecord_gbb_monthly_reporting_item.md) | [GBB] Monthly reporting item | 29 | monthly-reporting only |
| [`customrecord_sta_customer_agreement`](customrecord_sta_customer_agreement.md) | Customer Agreement | 55 | CR handlers (read/locate) |
| [`customrecord_sta_contract_prices`](customrecord_sta_contract_prices.md) | Contract price | 17 | CR type 1 handler |

Field counts include NetSuite's native fields (`id`, `externalId`, `created`, `owner`, …), which
the metadata catalog returns alongside the custom ones.

## Reading these files

- Fields are grouped **by purpose**, not alphabetically, and each file carries notes on the
  cross-project consequences of the fields involved. That grouping is the value — a flat field list
  is available from NetSuite any time.
- **Select fields** resolve to `{id, refName, externalId}` over REST and to the internal ID over
  SuiteQL. Always compare against the internal ID; labels are not stable and several of these lists
  use Finnish labels that have been edited. `→ list` points at the entry in
  [`../lists/README.md`](../lists/README.md).
- **Filterable** means usable in a SuiteQL or REST `WHERE` clause. Only `refName` and the
  `userNotes` sublist are not, on every one of these records — so the per-field column is omitted
  and stated once per file instead.
- `BUILTIN.DF(field)` in SuiteQL returns a select field's display label, which is how the list
  values in `../lists/` were resolved.
