# Script and deployment inventory

**Exported from live NetSuite:** 2026-09-17
Regenerate with `node tools/export-schemas.mjs scripts`.

The **live** answer to "what is actually deployed". Query used: all `script` records whose name
contains `GBB`, `PAYLINK` or `MID LIFE REDEMPTION`, left-joined to `scriptDeployment` — 61 rows,
48 distinct scripts. Filtering by name rather than script ID matters, because several scripts have
**auto-generated** IDs (`customscript1199`) that no ID-prefix filter would catch.

Deployment status values are NetSuite's own: `Released`, `Testing`, `Scheduled`, `Not Scheduled`.
`Not Scheduled` means the deployment exists but has no schedule — the script runs only when started
by hand. No script record in this list is inactive.

> **SS Libraries have no `script` record**, so a file absent here is not necessarily undeployed —
> it may be a library loaded by another script. A *Scheduled/Map-Reduce/User Event* entry point
> missing here, however, cannot run.

---

## netsuite-monthly-reporting

| Script ID | Name | Type | Deployment |
|---|---|---|---|
| `customscript_gbb_ri_transfers` | RI transfers | USEREVENT | `customdeploy_gbb_ri_transfers` **Released** |
| `customscript_gbb_ri_intermediary_months` | RI intermediary months | USEREVENT | `customdeploy_gbb_ri_intermediary_months` **Released** |
| `customscript_gbb_ri_mid_term_ending` | RI mid-term ending types | USEREVENT | `customdeploy_gbb_ri_mid_term_ending` **Released** |
| `customscript_gbb_ri_maint_prolongation` | RI maintenance prolongation | USEREVENT | `customdeploy_gbb_ue_ri_maintenace_prlgtn` **Released** |
| `customscript_gbb_ri_late_red_prolong` | RI late redemption prolongation | USEREVENT | `customdeploy_gbb_ri_late_red_prolong` **Released** |
| `customscript_gbb_monthly_rep_ri_creation` | Monthly reporting RI creation | MAPREDUCE | Testing |
| `customscript_gbb_monthly_rep_ri_update` | Monthly reporting RI update | MAPREDUCE | Testing |
| `customscript_gbb_monthly_reporting` | Monthly reporting csv | MAPREDUCE | Testing |
| `customscript_gbb_bike_data_validitycheck` | Bike data validity check | MAPREDUCE | Testing |
| `customscript_gbb_ri_set_order_type` | RI set order type - TEMP | MAPREDUCE | **NO DEPLOYMENT** |
| `customscript_gbb_rl_ri_download_files` | RI download reporting files | RESTLET | **Released** |
| `customscript1463` | `[GBB RI Missing ended rows backfill` | MAPREDUCE | `customdeploy_gbb_ri_ended_backfill` Not Scheduled |
| `customscript_gbb_ri_transfers_test` | RI transfers test | SCHEDULED | no deployment *(intended)* |
| `customscript_gbb_ri_intermed_months_test` | RI intermediary months test | SCHEDULED | no deployment *(intended)* |
| `customscript_gbb_ri_mid_term_ending_test` | RI mid-term ending types test | SCHEDULED | no deployment *(intended)* |
| `customscript_gbb_ri_maint_prolong_test` | RI maintenance prolongation test | SCHEDULED | no deployment *(intended)* |
| `customscript_gbb_ri_late_red_prol_test` | RI late redemption prolong test | SCHEDULED | no deployment *(intended)* |

**Drift vs. the repo.** `netsuite-monthly-reporting/README.md` § *Skriptit ja julkaisutila* lists
`customscript_gbb_ri_set_order_type` as `🟡 TESTING` with the NetSuite state "sama" (same). Live,
it has **no deployment at all** — so stage 2 of the monthly batch cannot run unless someone
re-creates it. Its output field `custrecord_gbb_ri_order_type` is the Oomi separation marker.

Also unmatched: `mr_purge_deleted_reporting_items.js` exists in the repo but no corresponding
script record was found. The five `ss_*_for_testing.js` deployments being absent **is** documented
and intended (decision 2026-09-07).

## netsuite-subscrption-cr-scripts

| Script ID | Name | Type | Deployment |
|---|---|---|---|
| `customscript1199` | Change request handler | SCHEDULED | `customdeploy_gbb_change_request_hdl_2` **Scheduled** *and* `customdeploy1` Testing |
| `customscript1196` | Change request update BR | SCHEDULED | `customdeploy1` **Scheduled** |
| `customscript1191` | Siirto TA handler | SCHEDULED | `customdeploy1` Testing |
| `customscript1192` | Hyvitys handler | SCHEDULED | `customdeploy1` Testing |
| `customscript1193` | Keskenkauden Lunastus handler | SCHEDULED | `customdeploy1` Testing |
| `customscript1194` | Välikuukaudet handler | SCHEDULED | `customdeploy1` Testing |
| `customscript1195` | Siirto konserni handler | SCHEDULED | `customdeploy1` Testing |
| `customscript1197` | Jälkiveloitus handler | SCHEDULED | `customdeploy1` Testing |
| `customscript1198` | Siirto TT handler | SCHEDULED | `customdeploy1` Testing |
| `customscript1200` | Siirto PT handler | SCHEDULED | `customdeploy1` Not Scheduled |
| `customscript1428` | Konserni alustus handler | SCHEDULED | `customdeploy1` Not Scheduled |
| `customscript_cr_snapshot_backfill` | CR snapshot backfill | SCHEDULED | Not Scheduled |

**Three things to verify before trusting the repo's architecture diagram.**

1. The scheduler is `customscript1199` — an **auto-generated ID**, not `customscript_cr_scheduler`.
   `cr_bike_register_updater.js` is `customscript1196`. Neither ID appears in the repo docs, so
   nothing in the repo tells you which NetSuite record to look at.
2. `customscript1199` carries **two deployments** — one `Scheduled`, one `Testing`, both deployed.
   Whether the Testing one also fires on the daily cadence decides whether CRs are processed twice.
3. Every type handler has its **own SCHEDULED script record**, while the repo documents them as
   SS Libraries invoked only through `cr_dispatcher`. A library file can legitimately also have a
   wrapper script record, but as it stands each handler is independently runnable, and nine of them
   sit in `Testing`. Worth confirming which of these entry points is actually live.

## netsuite-bike-redemption-status-sync

| Script ID | Name | Type | Deployment |
|---|---|---|---|
| `customscript_gbb_bike_redemption_status` | Bike redemption status sync | SCHEDULED | `customdeploy_gbb_redemption_sync` **Scheduled** |
| `customscript1458` | Bike status date backfill | SCHEDULED | `customdeploy_gbb_ss_bike_status_backfill` **Scheduled** |

The backfill still being on a live schedule is worth a look — the repo scopes backfill as a
one-off, and `Bike-Status-History-Backfill-Design.md` treats it as a finite job.

## netsuite-subscription-extension

| Script ID | Name | Type | Deployment |
|---|---|---|---|
| `customscript_gbb_bike_sub_extension` | Bike subscription extension | MAPREDUCE | `customdeploy_gbb_sub_extension` **Scheduled** |

## netsuite-paylink-order-tracking

| Script ID | Name | Type | Deployment |
|---|---|---|---|
| `customscript_paylink_order_sync` | Paylink Order Sync | SCHEDULED | `customdeploy_paylink_order_sync` **Scheduled** |
| `customscript_paylink_ns_processor` | Paylink NS Processor | USEREVENT | `customdeploy_ue_paylink_processor` **Released** |
| `customscript_paylink_bike_retry` | Paylink Bike retry | SCHEDULED | `customdeploy1` **Scheduled** |
| `customscript_payment_requests_post_proce` | Payment request post processor | SCHEDULED | `customdeploy_gbb_pr_post_processor` **Scheduled** |
| `customscript_gbb_paytrail_settlements_rd` | Paytrail settlements reader | SCHEDULED | Not Scheduled |

All four scripts the repo documents are live. The post-processor's script ID
(`customscript_payment_requests_post_proce`, truncated) does not match the repo's file name
`paylink_post_processor.ss2.js`.

## netsuite-ic-calculators

| Script ID | Name | Type | Deployment |
|---|---|---|---|
| `customscript_gbb_ic_redemption_pr` | IC Redemption Price calc | MAPREDUCE | `customdeploy_gbb_ic_redemption_pr` **Not Scheduled** |

Runs on demand only, despite the repo describing a 500–1,000/month volume. If finance expects
prices to appear automatically after setting a redemption date, they will not.

## cf-gbb-tools

| Script ID | Name | Type | Deployment |
|---|---|---|---|
| `customscript_gbb_restlet_create_user_nts` | Restlet Create User Notes | RESTLET | **Released** |

Matches `netsuite/restlets/create-bike-user-note.js`. Everything else in cf-gbb-tools reaches
NetSuite over REST/SuiteQL and needs no script record.

## Related, outside the seven projects

Same account, same records — changes here can still reach the seven.

| Script ID | Name | Type | Deployment |
|---|---|---|---|
| `customscript_sta_mr_mid_life_redemption` | [STA] MR - Mid Life Redemption | MAPREDUCE | `customdeploy_sta_mr_mid_life_redemption` **Scheduled** (+ one Not Scheduled) |
| `customscript_gbb_lease_fee_check` | Bike Register lease fee check | MAPREDUCE | **Scheduled** |
| `customscript_gbb_mr_send_email_2` | Bike email send - Kauppakirja pdf | MAPREDUCE | **Scheduled** |
| `customscript_gbb_ss_fix_next_invoice_dt` | Fix agreement next invoice date | SCHEDULED | **Scheduled** |
| `customscript_gbb_wh_status_changed` | Webhook - Status Changed | USEREVENT | **Released** |
| `customscript_gbb_wh_subsc_dates` | Webhook - Subscription Dates Changed | USEREVENT | **Released** |
| `customscript_gbb_wh_vb_paid` | Webhook - Vendor Bill Paid | USEREVENT | Testing |
| `customscript_gbb_script_deployment_page` | Script deployment page | SCRIPTLET | **Released** |
| `customscript988` | Payment Notification Script | ACTION | **Released** |
| `customscript_gbb_bike_email_send` | Bike email send | MAPREDUCE | Not Scheduled |
| `customscript_gbb_leasing_liability_act` | Leasingvastuuraportointi active | MAPREDUCE | Not Scheduled |
| `customscript_gbb_leasing_liability_end` | Leasingvastuuraportointi ended | MAPREDUCE | Not Scheduled |
| `customscript_gbb_leasing_liability_cust` | Leasingvastuuraportointi asiakkaat | SCHEDULED | Not Scheduled |
| `customscript_gbb_oomi_monthly_report` | Generate Oomi monthly report | SCHEDULED | Not Scheduled |
| `customscript_gbb_oomi_billing_export` | Generate billing export | SCHEDULED | Not Scheduled |
| `customscript_gbb_oomi_erittely_export` | Generate erittely export | SCHEDULED | Not Scheduled |
| `customscript_gbb_mr_print_invoices` | MR Print invoices | MAPREDUCE | Not Scheduled |
| `customscript_gbb_paytrail_settlements_rd` | Paytrail settlements reader | SCHEDULED | Not Scheduled |
| `customscript1208` | MR Agreement Invoicing Attachment | MAPREDUCE | Not Scheduled |
| `customscript_gbb_ue_po_helkama` | UE PO Helkama Correction | USEREVENT | Testing, **not deployed** |
| `customscript_gbb_ss_po_helkama` | SS PO Helkama Correction | SCHEDULED | **NO DEPLOYMENT** |

`customscript_sta_mr_mid_life_redemption` is the one that matters most: it is **live on a schedule**
and generates a credit memo for any bike register record where `custrecord_sta_redemption_date` is
set and `custrecord_sta_redemption_cm_processed` is false. That is exactly why
`netsuite-bike-redemption-status-sync` writes `custrecord_gbb_redemption_paid_at` instead.

## Auto-generated deployment IDs

Nine scripts deploy as plain `customdeploy1`: the CR handlers and updater, Paylink bike retry, the
Oomi exports and the next-invoice-date fix. `customdeploy1` is unique per script, so this is not a
collision — but it means a deployment ID alone never identifies a script, and any query joining on
deployment script IDs has to go through `scriptDeployment.script`.
