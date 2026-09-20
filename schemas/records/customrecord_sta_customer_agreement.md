# Customer Agreement

**Record type:** `customrecord_sta_customer_agreement`
**Fields:** 55 (51 own + native)
**Exported from live NetSuite:** 2026-09-17

Master agreement, one per bill-to customer. Parent of `customrecord_sta_ca_agreement_row` via
`custrecord_sta_ca_parent_agreement`. The CR handlers locate or create the target customer's
agreement when cloning or reparenting rows (types 1, 9); nothing else in the sibling projects
writes it.

All fields are filterable except `refName`.

## Parties and identity

| Field ID | Label | Type |
|---|---|---|
| `custrecord_sta_ca_customer` | (customer) | select |
| `custrecord_sta_ca_payer` | (payer) | select |
| `custrecord_sta_ca_customer_contact` | (contact) | select |
| `custrecord_sta_ca_partner` | (partner) | select |
| `custrecord_sta_ca_reference` | (reference) | select |
| `custrecord_sta_ca_agreement_id` | Agreement ID | text |
| `custrecord_sta_ca_customer_reference_num` | Customer Reference # | text |
| `custrecord_sta_ca_status` | (status) | select → `customlist_sta_ca_status` |
| `custrecord_sta_ca_description` | Description | text |
| `custrecord_sta_ca_notes` | Notes | text |
| `custrecord_sta_ca_subsidiary` | (subsidiary) | select |
| `custrecord_sta_ca_currency` | (currency) | select |
| `name` / `altName` / `id` / `externalId` | (identifiers) | text |
| `isInactive` | Inactive | checkbox |

## Term and lifecycle

| Field ID | Label | Type |
|---|---|---|
| `custrecord_sta_ca_date_agreement_start` | Start Date | date |
| `custrecord_sta_ca_date_registered` | Registration Date | date |
| `custrecord_sta_ca_term_initial` | Initial Term | integer |
| `custrecord_sta_ca_term_renewal` | Renewal Term | integer |
| `custrecord_sta_ca_term_termination` | Termination Term | integer |
| `custrecord_sta_ca_date_last_renewal` | Last Renewal Date | date |
| `custrecord_sta_ca_date_terminate_request` | Termination Requested Date | date |
| `custrecord_sta_ca_date_terminated` | Termination Date | date |

## Invoicing

| Field ID | Label | Type |
|---|---|---|
| `custrecord_sta_ca_invoice_frequency` | Invoice Frequency | text |
| `custrecord_sta_ca_invoice_freq_temp` | Temp Freq | text |
| `custrecord_sta_ca_invoice_advance` | Advance Invoice | integer |
| `custrecord_sta_ca_date_next_invoice` | Next Invoice Date | date |
| `custrecord_sta_ca_date_last_invoice` | Last Invoice Date | date |
| `custrecord_sta_ca_invoicehistory` | Invoice History | text |
| `custrecord_sta_ca_payment_terms` | (payment terms) | select |

## Invoice line grouping

These switches decide how rent and admin fee are collapsed onto the invoice, so they change what a
month's invoice looks like without any script being involved.

| Field ID | Label | Type |
|---|---|---|
| `custrecord_sta_sum_to_leasing_fee` | Sum rent & admin fee to one item Leasing fee | checkbox |
| `custrecord_sta_adminfee_summed_up` | Admin fee item summed up | checkbox |
| `custrecord_sta_rent_group_totalno` | Rent items summed up | checkbox |
| `custrecord_sta_adminfee_by_enduserccs` | Admin fee summed by enduser cost centers | checkbox |
| `custrecord_sta_rent_by_enduser_ccs` | Rent summed by enduser cost centers | checkbox |
| `custrecord_sta_leasingfee_by_enduser_ccs` | Leasing fee item by enduser cost centers | checkbox |

## Indexation

| Field ID | Label | Type |
|---|---|---|
| `custrecord_sta_ca_index_used` | (index) | select → `customlist_sta_ca_index_types` |
| `custrecord_sta_ca_index_base_date` | Index Base Date | date |
| `custrecord_sta_ca_index_start_date` | Index Start Date | date |
| `custrecord_sta_ca_agreement_index_date` | Index Date | date |
| `custrecord_sta_ca_firm_perc_uplift` | Firm % Uplift | number (double) |

## Bulk-update staging

| Field ID | Label | Type |
|---|---|---|
| `custrecord_sta_sub_lines_to_update` | [STA] Subscription Lines to Update | text |
| `custrecord_subs_line_update_invhist` | [STA] Subscription Lines to Update Date | date |

## Native

`scriptId`, `abbreviation`, `created`, `lastmodified`, `refName`, `owner`, `lastmodifiedby`
