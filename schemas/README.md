# NetSuite schema cache

**Exported from live NetSuite:** 2026-09-17

Answer field, record, list-value and deployment-status questions **from these files**. Do not query
NetSuite for routine lookups — that is the whole point of this directory.

| Looking for | Read |
|---|---|
| A field's ID, label, type, or whether it is filterable | [`records/`](records/README.md) |
| What an internal ID means (CR type 7, bike status 2, …) | [`lists/README.md`](lists/README.md) |
| What is actually deployed and on what schedule | [`script-inventory.md`](script-inventory.md) |
| A saved search's filters (hand-maintained, not exported) | [`saved-searches.md`](saved-searches.md) |

## When to go back to NetSuite anyway

- **Production data questions** — counts, distributions, "how many bikes are in state X". The cache
  holds schema, not data.
- **After a NetSuite customisation change.** Re-export; don't patch these files by hand.
- **Before asserting something is deployed** in a write-up that matters. Deployment status is the
  fastest-moving thing here.
- **Anything the cache doesn't cover** — transaction body fields (`custbody_sta_*`), the item
  master, saved searches, FAM asset records.

Use `mcp__claude_ai_NetSuite__*` for that. `ns_runCustomSuiteQL` takes its query in the
**`sqlQuery`** parameter.

## Refreshing

```bash
node tools/export-schemas.mjs            # everything
node tools/export-schemas.mjs records    # one section: records | lists | scripts
```

No dependencies, no `node_modules`. Credentials are read **in place** from
`../cf-gbb-tools/.dev.vars` (override the location with `GBB_TOOLS_DIR`); nothing is copied into
this repository, and nothing should be.

The `records/` Markdown in this commit was written from the same live metadata the script fetches,
but grouped by purpose and annotated with cross-project consequences, which the generator cannot
produce on its own. **Re-running `export-schemas.mjs records` overwrites those annotations** — it
also writes `records/raw/<record>.json`, which the committed files do not yet include. Diff before
committing a regeneration, and carry the annotations forward.

## Coverage

Seven records: bike register, change request, agreement row, customer agreement, payment requests,
monthly reporting item, contract prices. Sixteen custom lists plus the two hard-coded item IDs.
Forty-eight scripts across all seven sibling projects and their neighbours.

## Discrepancies found during this export

Recorded here because they are exactly what this project exists to find. Each is verified against
live NetSuite on 2026-09-17.

1. **`customlist_paylink_ns_status` does not exist.** `netsuite-paylink-order-tracking/CLAUDE.md`
   names it; the real list is `customlist_pr_ns_status` ("Payment request statuses"). The internal
   IDs that repo documents are correct.
2. **`customscript_gbb_ri_set_order_type` has no deployment**, though
   `netsuite-monthly-reporting/README.md` records it as `TESTING` and in sync with NetSuite. Stage 2
   of the monthly batch cannot run as it stands.
3. **The CR processor is deployed under auto-generated script IDs** — `customscript1199`
   (scheduler) and `customscript1196` (bike register updater) — which appear nowhere in
   `netsuite-subscrption-cr-scripts`. The scheduler also has **two** deployments, one `Scheduled`
   and one `Testing`.
4. **Every CR type handler has its own SCHEDULED script record**, while the repo documents them as
   SS Libraries reached only through `cr_dispatcher`. Nine sit in `Testing`.
5. **CR type `10` (Reklamaatio/peruutus) exists in NetSuite** with no handler in any repo and no
   mention in any repo's docs.
6. **CR status `3` (In Progress) exists in NetSuite.** The CR repo's `CLAUDE.md` calls that value
   unverified. Whether any record carries it is a separate, unanswered question.
7. **`customscript_gbb_ic_redemption_pr` is `Not Scheduled`** — on-demand only, against a documented
   500–1,000 redemptions per month.
8. **`customscript1458` (bike status date backfill) is still on a live schedule**, though the
   owning repo scopes backfill as a one-off.
9. **`custrecord_sta_ca_row_price_month` is labelled *Gross Price per Month* but holds a NET
   price** (added 2026-09-18). Every writer copies a net value into it (Staria vendor bill logic,
   `handler_siirto_ta`'s admin fee with fallback 15.94, the OOMI import at 79.6813 = 100 gross ÷ 1.255)
   and every reader treats it as net (invoicing line rate, monthly-reporting's `lease_fee_vat0`,
   cf-gbb-tools' `netToGross` for display). The first revision of this cache repeated the label and
   called the field gross; `records/customrecord_sta_ca_agreement_row.md` now carries the evidence.

None of these have been changed. They are findings for the owning repos — except 9, which was a
mistake in this repo's own annotations and has been corrected here.
