# [STA] Bike Register

**Record type:** `customrecord_sta_bike_register`
**Fields:** 85 (65 own + native)
**Exported from live NetSuite:** 2026-09-17

The truth record for a leased bike. Read by every sibling project; written by the CR handlers,
bike-redemption-status-sync, the Paylink post-processor, ic-calculators and cf-gbb-tools.

Select fields resolve to `{id, refName, externalId}` over REST — compare against the **internal
id**, never the label. `→ list` names the backing list in [`../lists/`](../lists/README.md).
All fields below are filterable in SuiteQL/REST except `refName`.

## Dates and periods

| Field ID | Label | Type |
|---|---|---|
| `custrecord_sta_subsc_start_date` | SUBSCRIPTION START DATE | date |
| `custrecord_sta_subsc_end_date` | SUBSCRIPTION END DATE | date |
| `custrecord_sta_subsc_org_end_date` | SUBSCRIPTION ORIGINAL END DATE | date |
| `custrecord_gbb_exceptional_end_date` | EXCEPTIONAL END DATE | date |
| `custrecord_gbb_oomi_exceptional_end_date` | OOMI EXCEPTIONAL END DATE | date |
| `custrecord_gbb_date_to_non_active` | Set to non Active | date |
| `custrecord_sta_bike_rent_months` | Bike rent length in months | integer |
| `custrecord_sta_appr_rec_date` | Approval Received Date | date |
| `custrecord_sta_siemens_cont_start_date` | SIEMENS CONTRACT START DATE | date |
| `custrecord_sta_siemens_cont_end_date` | SIEMENS CONTRACT END DATE | date |
| `created` | Created | datetime |
| `lastmodified` | Last modified | datetime |

> `custrecord_sta_subsc_end_date` is the field `handler_jalki.js` moves forward, which is why an
> extended bike stays in `netsuite-subscription-extension`'s saved search the following month.

## Redemption

| Field ID | Label | Type |
|---|---|---|
| `custrecord_sta_redemption_date` | Redemption date | date |
| `custrecord_gbb_redemption_paid_at` | REDEMPTION PAID AT | date |
| `custrecord_gbb_redemption_status` | (redemption status) | select → `customlist_gbb_redemption_status` |
| `custrecord_sta_redemption_reason` | (redemption reason) | select |
| `custrecord_sta_redemption_cm_processed` | Redemption processed | checkbox |
| `custrecord_sta_end_redemption_price` | Contract end redemption price | number (double) |
| `custrecord_sta_current_redemption_price` | CURRENT REDEMPTION PRICE | number (double) |
| `custrecord_sta_redemption_pr_calc_date` | REDEMPTION PRICE CALCULATED | date |
| `custrecord_sta_end_red_so_created` | End Redemption Sales Order Created | checkbox |
| `custrecord_sta_mid_red_so_created` | Mid Redemption Sales Order Created | checkbox |
| `custrecord_gbb_eredem_link_sent` | END REDEMPTION PAYLINK SENT | checkbox |
| `custrecord_gbb_liab_settled_at` | Loppuvastuut hoidettu | date |
| `custrecord_gbb_liab_settle_method` | (settlement method) | select → `customlist_gbb_liab_settle_method` |
| `custrecord_gbb_redemption_decided_at` | LUNASTUS SOVITTU | date |
| `custrecord_gbb_all_lease_fees_paid` | Kaikki vuokrat maksettu | checkbox |

> **`custrecord_gbb_redemption_decided_at` is new (19.09.2026) and empty on all 46 737 records.**
> It carries date 2, the päätöspäivä ([ADR 0001](../../docs/adr/0001-uusi-paatospaiva-kentta.md)):
> automation fills it when it writes `custrecord_gbb_liab_settle_method`. No writer exists yet —
> `handler_lunastus.js:199` still stamps the run date into `custrecord_gbb_liab_settled_at`
> instead. Not backfilled; empty means `custrecord_gbb_date_to_non_active` when that is set, and
> *unknown* otherwise.

> **Two writers, one gap.** `handler_lunastus.js` sets `custrecord_sta_bike_status = 2` from CR
> processing; `netsuite-bike-redemption-status-sync` sets it from payment arrival and stamps
> `custrecord_gbb_redemption_paid_at`. Neither writes `custrecord_sta_redemption_date` — that field
> triggers `customscript_sta_mr_mid_life_redemption`'s credit memo when
> `custrecord_sta_redemption_cm_processed` is still false.

## Intercompany (ic-calculators)

| Field ID | Label | Type |
|---|---|---|
| `custrecord_gbb_ic_redemption_dt` | IC REDEMPTION DATE | date |
| `custrecord_gbb_ic_redemption_pr` | IC REDEMPTION PRICE | number (float) |
| `custrecord_gbb_ic_redemption_done` | IC REDEMPTION PROCESSED | checkbox |
| `custrecord_gbb_ic_sale_dt` | IC SALE DATE | date |
| `custrecord_gbb_ic_sale_price` | IC SALE PRICE (GROSS) | number (float) |
| `custrecord_gbb_ic_sale_done` | IC SALE PROCESSED | checkbox |
| `custrecord_gbb_interest_rate` | REDEMPTION PRICE INTEREST RATE | number (double) |
| `custrecord_sta_curr_ic_redemption_price` | CURRENT IC REDEMPTION PRICE | number (double) |
| `custrecord_sta_ic_po_amount` | FINAL IC PO AMOUNT | number (double) |
| `custrecord_sta_asset_id` | (FAM asset) | select |
| `custrecord_sta_book_rate_pct` | Book rate % | number (double) |

## Status and classification

| Field ID | Label | Type |
|---|---|---|
| `custrecord_sta_bike_status` | (bike status) | select → `customlist_sta_bike_status` |
| `custrecord_sta_bike_order_type` | (order type) | select → `customlist_sta_bike_order_type` |
| `custrecord_sta_bike_category` | (bike category) | select → `customlist_sta_bike_category` |
| `custrecord_sta_order_status` | (order status) | select → `customlist_sta_order_status` |
| `custrecord_sta_contract_signing_status` | (signing status) | select → `customlist_sta_contract_signing_status` |
| `custrecord_sta_contract_financier` | (financier) | select → `customlist_sta_contract_financier` |
| `custrecord_sta_down_payment_status` | (down payment status) | select → `customlist_sta_cntrct_downpmnt_status` |
| `custrecord_gbb_return_status` | (return status) | select → `customlist535` |
| `custrecord_gbb_cancellation_reason` | (cancellation reason) | select → `customlist536` |
| `custrecord_gbb_oomi_bike_status` | (Oomi bike status) | select → `customlist537` |
| `isInactive` | Inactive | checkbox |

## Parties

| Field ID | Label | Type |
|---|---|---|
| `custrecord_sta_contract_employer` | (employer) | select (customer) |
| `custrecord_sta_bill_to_cus` | (bill-to customer) | select (customer) |
| `custrecord_sta_enduser` | (end user) | select (customer) |
| `custrecord_sta_enduser_email` | ENDUSER EMAIL ADDRESS | text |
| `custrecord_sta_enduser_phone_num` | ENDUSER PHONE NUMBER | text |
| `custrecord_sta_enduser_employee_id` | ENDUSER EMPLOYEE ID | text |
| `custrecord_sta_enduser_order_code` | ENDUSER ORDER CODE | text |
| `custrecord_sta_enduser_cost_center` | ENDUSER COST CENTER | text |
| `custrecord_sta_enduser_discounts` | ENDUSER DISCOUNTS | number (double) |
| `owner` / `lastmodifiedby` | (NetSuite user) | select |

> CR type 13 deliberately does **not** trust `custrecord_sta_bill_to_cus`; it resolves the old
> customer from whichever customer's agreement rows are currently active for the bike.

## Pricing and fees

| Field ID | Label | Type |
|---|---|---|
| `custrecord_sta_curr_subs_rent` | Current subscription rent fee (net) | number (float) |
| `custrecord_sta_curr_subs_admin` | Current subscription admin fee (net) | number (float) |
| `custrecord_sta_init_subs_rent_fee` | Initial subscription rent fee (net) | number (double) |
| `custrecord_sta_init_subs_adm_fee` | Initial subscription admin fee (net) | number (double) |
| `custrecord_sta_exceeding_price` | EXCEEDING PRICE | number (double) |
| `custrecord_sta_employer_cntrct_price_lim` | EMPLOYER CONTRACT PRICE LIMIT | number (double) |
| `custrecord_sta_po_nettotal` | PO NET TOTAL SUM | number (double) |
| `custrecord_sta_maintenance_sum` | SUM OF MAINTENANCES | number (double) |
| `custrecord_sta_monthly_maintenance_budg` | Monthly maintenance budget | number (float) |
| `custrecord_sta_maintenances_not_allowed` | MAINTENANCES NOT ALLOWED | checkbox |
| `custrecord_sta_invoice_frequency` | INVOICING FREQUENCY | integer |
| `custrecord_sta_order_currency` | (currency) | select |
| `custrecord_gbb_verovapaa` | VEROVAPAA (tax exempt) | checkbox |
| `custrecord_sta_cus_bike_rent_calc` | Use custom rent time calculation | checkbox |

## Bike attributes, identifiers and admin

| Field ID | Label | Type |
|---|---|---|
| `name` | ID | text |
| `altName` | Name | text |
| `id` | Internal ID | text |
| `externalId` | External ID | text |
| `custrecord_sta_bike_contract_id` | BIKE CONTRACT ID | text |
| `custrecord_sta_contract_external_id` | FORMER BIKE CONTRACT ID | text |
| `custrecord_sta_former_hubspot_bikeid` | FORMER HUBSPOT BIKE ID | text |
| `custrecord_sta_siemens_agreement` | SIEMENS AGREEMENT ID | text |
| `custrecord_sta_bike_manufacturer` | BIKE MANUFACTURER | text |
| `custrecord_sta_bike_model` | BIKE MODEL | text |
| `custrecord_sta_bike_modelyear` | BIKE MODEL YEAR | text |
| `custrecord_sta_bike_color` | BIKE COLOR | text |
| `custrecord_sta_bike_size` | BIKE SIZE | text |
| `custrecord_sta_bike_frame_number` | BIKE FRAME NUMBER | text |
| `custrecord_sta_comments` | COMMENTS | text |
| `custrecord_sta_contract_additional_info` | CONTRACT ADDITIONAL INFO | text |
| `custrecord_gbb_oomi_bid` | OOMI BUSINESS ID | text |
| `custrecord_gbb_oomi_org` | OOMI ORGANISATION | text |
| `custrecord_gbb_bill_of_sale_sent_to_user` | Kauppakirja lähetetty käyttäjälle | checkbox |
| `custrecord_gbb_no_bill_of_sale_to_user` | Ei saa lähettää kauppakirjaa käyttäjälle | checkbox |
| `abbreviation` / `scriptId` / `refName` | (native) | text |
