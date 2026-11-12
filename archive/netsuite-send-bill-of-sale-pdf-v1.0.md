# Brevo Email Automation with Bill of Sale PDF Attachment — NetSuite Solution Design

**Solution:** Automated transactional email delivery via Brevo with a generated bill of sale (kauppakirja) PDF attachment when a Bike Register record is eligible for redemption
**Record:** `customrecord_sta_bike_register`
**Author:** Solution Architecture
**Version:** 1.0
**Extends:** Brevo Transactional Email Automation v4.0 (`mr_bike_email_send.js`)

---

## 1. Overview

This solution extends the v4.0 Brevo email automation by generating a personalised bill of sale PDF (kauppakirja) at runtime and attaching it to the outgoing email. All other behaviour — saved search queue, idempotency, retry, logging, and the shared Brevo library — is inherited unchanged from v4.0.

The PDF is generated in the map stage of a new Map/Reduce script using NetSuite's `N/render` module. The XML template is stored in the File Cabinet and loaded at runtime. All template variables (buyer name, bike details, dates, price) are passed explicitly from the map stage, with no dependency on record context or FreeMarker field traversal.

The v4.0 script (`mr_bike_email_send.js`) remains in production unchanged. This solution runs as a separate script and deployment.

---

## 2. Design Principles

All design principles from v4.0 apply. Additions specific to this solution:

- **Runtime PDF generation.** The bill of sale PDF is generated per record during the map stage, immediately before sending. No pre-generation or caching is required.
- **Template stored in File Cabinet.** The XML template is a separate file in the File Cabinet, loaded by file ID at runtime. Template changes do not require a script redeployment — only a File Cabinet upload.
- **All template data passed explicitly.** The script builds a dedicated `pdfParams` object from `emailParams` and passes it to the renderer via `addCustomDataSource`. No FreeMarker record field traversal is used. This avoids record type constraints and makes the template independent of NetSuite's record context.
- **Email-only delivery.** The generated PDF is attached to the Brevo email as base64-encoded content and is not saved to the File Cabinet. No permanent copy is kept.
- **Images hardcoded in template.** The logo and signature line images are referenced by production URL directly in the XML template. URL updates require a template file re-upload.

---

## 3. Components

### 3.1 NetSuite Records and Fields Used

This section is the complete inventory of every NetSuite record type and field the script touches, directly or through saved search 793, and what each one is used for. Field labels and types below were verified against the production account metadata catalog (`customrecord_sta_bike_register`).

#### 3.1.1 Record types

| Record | ID | Access | Purpose in this solution |
|---|---|---|---|
| Bike Register | `customrecord_sta_bike_register` | Read (via saved search), write (`record.submitFields`) | The queue record. One record = one bike contract = one bill of sale email. |
| End user entity | Reached through `custrecord_sta_enduser` | Read (saved search join) | Source of the recipient's full name used in the email and as the PDF buyer name. |
| Transaction | Reached through the Bike ID transaction join | Read (saved search join) | Original design: the redemption price was read from transaction `Amount`. Current code takes the price from `custrecord_sta_end_redemption_price` instead (see the Data mapping table). |
| File Cabinet file | `N/file` | Read (PDF template, ID 339583), create (run log) | Holds the XML bill of sale template and receives the per-run log file. |
| Saved search | ID `793` | Read (`search.load`) | Defines the eligibility filters and the column set that becomes the email and PDF parameters. |

> [!NOTE]
> The script itself hardcodes only two NetSuite identifiers: the record type `customrecord_sta_bike_register` and the field `custrecord_gbb_bill_of_sale_sent_to_user`. Every other field reaches the script as a saved search *column label*, never as a field ID — see 3.1.3.

#### 3.1.2 Fields written by the script

| Field ID | Label | Type | Purpose |
|---|---|---|---|
| `custrecord_gbb_bill_of_sale_sent_to_user` | Kauppakirja lähetetty käyttäjälle | Checkbox | Idempotency flag. Set to `true` only after Brevo confirms the send. While `false` the record stays in the queue, so a failed send is retried automatically and a manual re-send is done by unchecking it. |

No other field is modified. A failed record is left completely untouched.

#### 3.1.3 Fields read as saved search columns

The map stage converts each saved search column *label* into an upper-case key (`Bike Model` → `BIKE_MODEL`). Those keys are the Brevo template merge variables and, for a subset, the PDF template variables. Renaming a column label in the saved search silently changes the parameter key and breaks both templates.

| Column label / param key | Source field | Type | Used in email | Used in PDF | Purpose |
|---|---|---|---|---|---|
| `RECIPIENT_EMAIL` | `custrecord_sta_enduser_email` (ENDUSER EMAIL ADDRESS) | Free-form text | Recipient address | — | Where the email is sent. An empty value produces a send error and the record is retried. |
| `RECIPIENT_NAME` | Formula text over the end user entity joined via `custrecord_sta_enduser` | Formula (text) | Recipient display name | `params.RECIPIENT_NAME` | Buyer name on the bill of sale, and part of the PDF filename. |
| `BIKE_CONTRACT_NR` | `custrecord_sta_contract_external_id` (FORMER BIKE CONTRACT ID) | Free-form text | Contract number | — | Identifies the contract in the email body. |
| `BIKE_CONTRACT_END_DATE` | `custrecord_sta_subsc_end_date` (SUBSCRIPTION END DATE) | Date | Contract end date | — | Shown in the email body. |
| `BIKE_CONTRACT_START_DATE` | `custrecord_sta_subsc_start_date` (SUBSCRIPTION START DATE) | Date | — | `params.BIKE_CONTRACT_START_DATE` | Possession start date (*alkupäivämäärä*) on the bill of sale. |
| `BIKE_FRAME_NR` | `custrecord_sta_bike_frame_number` (BIKE FRAME NUMBER) | Free-form text | Frame number | `params.BIKE_FRAME_NR` | Identifies the individual bike being sold; shown under make/model on the PDF. |
| `BIKE_MANUFACTURER` | `custrecord_sta_bike_manufacturer` (BIKE MANUFACTURER) | Free-form text | Make | `params.BIKE_MANUFACTURER` | Bike make on the bill of sale. |
| `BIKE_MODEL` | `custrecord_sta_bike_model` (BIKE MODEL) | Free-form text | Model | `params.BIKE_MODEL` | Bike model on the bill of sale. |
| `BIKE_REDEMPTION_PRICE` | `custrecord_sta_end_redemption_price` (current code, inferred; the original design read transaction `Amount`) | Currency, stored net | Price | `params.BIKE_REDEMPTION_PRICE` | Method 1: stored net price x 1.255, rounded to 2 decimals, formatted as Finnish currency (`175,03 €`). Methods 2–4: `0,00 €`. See README *Gross price (VAT)*. |
| `BIKE_OWNERSHIP_STARTS_DATE` | Formula date, `Today` | Formula (date) | — | `params.BIKE_OWNERSHIP_STARTS_DATE` | Date ownership transfers. Also reformatted `dd.MM.yyyy` → `yyyy-MM-dd` for the PDF filename. |

One PDF variable has no field behind it:

| Param key | Source | Purpose |
|---|---|---|
| `params.DOCUMENT_DATE` | Generated in `generatePdf` from the server date as `dd.MM.yyyy` | The "Espoo, {date}" document date printed on the bill of sale. |

#### 3.1.4 Fields used as eligibility filters

The filters live in saved search 793, not in the script, so the script has no compiled-in notion of eligibility. These are the Bike Register fields that govern whether a record enters the queue:

| Field ID | Label | Type | Role in eligibility |
|---|---|---|---|
| `custrecord_gbb_bill_of_sale_sent_to_user` | Kauppakirja lähetetty käyttäjälle | Checkbox | Must be unchecked. This is what removes a record from the queue after a successful send. |
| `custrecord_gbb_no_bill_of_sale_to_user` | Ei saa lähettää kauppakirjaa käyttäjälle | Checkbox | Manual opt-out. When checked, the end user must never receive a bill of sale. |
| `custrecord_gbb_all_lease_fees_paid` | Kaikki vuokrat maksettu | Checkbox | All lease instalments settled — a precondition for transferring ownership. |
| `custrecord_gbb_redemption_paid_at` | REDEMPTION PAID AT | Date | When the redemption payment landed. |
| `custrecord_gbb_liab_settled_at` | Loppuvastuut hoidettu | Date | When end-of-contract liabilities were cleared. |
| `custrecord_gbb_redemption_status` | Redemption status | List/Record | Where the redemption stands in its lifecycle. |
| `custrecord_sta_bike_status` | Bike status | List/Record | Lifecycle state of the bike itself. |

> [!IMPORTANT]
> The exact filter expression (which of these are checked, and against which values) is defined only inside saved search 793 and is not reproduced here. Open the search to see the authoritative condition before changing any of these fields' meaning. The same applies to the precise formula behind `RECIPIENT_NAME` and to the transaction join behind `BIKE_REDEMPTION_PRICE`.

#### 3.1.5 Bike Register fields deliberately not used

The Bike Register record carries roughly 80 further fields (pricing, intercompany sale, Oomi/Siemens integration, maintenance, invoicing). None of them are read or written by this script. If a new value is needed in the email or PDF, add it as a saved search column with the intended `UPPER_CASE` label — no script change is required unless the value also has to appear in the PDF, which needs a matching entry in `pdfParams` and in the XML template.

#### 3.1.6 Script parameters

The script reads five deployment parameters instead of hardcoding IDs; see 3.5 for the full table. None of them are record fields.

### 3.2 Saved Search — Pending Email Queue

**Same search as v4.0.**

**Search name:** `[GBB] Bike Register kauppakirjojen lähetys`
**Search internal ID:** 793
**URL (production):** https://9771141.app.netsuite.com/app/common/search/savedsearchresults.nl?searchid=793&whence=

Filters are identical to v4.0. Columns are identical to v4.0 with one addition:

| Column Label | NetSuite Field | Purpose |
|---|---|---|
| `RECIPIENT_EMAIL` | `custrecord_sta_enduser_email` | Recipient email address |
| `RECIPIENT_NAME` | Enduser full name (formula text) | Recipient display name and PDF buyer name |
| `BIKE_CONTRACT_NR` | `custrecord_sta_contract_external_id` | Contract number for Brevo template |
| `BIKE_CONTRACT_END_DATE` | `custrecord_sta_subsc_end_date` | Subscription end date for Brevo template |
| `BIKE_CONTRACT_START_DATE` | Contract start date field | Possession start date shown in PDF (alkupäivämäärä) |
| `BIKE_FRAME_NR` | `custrecord_sta_bike_frame_number` | Frame number for Brevo template |
| `BIKE_MANUFACTURER` | `custrecord_sta_bike_manufacturer` | Bike make shown in PDF |
| `BIKE_MODEL` | `custrecord_sta_bike_model` | Bike model shown in PDF |
| `BIKE_REDEMPTION_PRICE` | `custrecord_sta_end_redemption_price` (net; gross on PDF since the VAT fix) | Redemption price shown in PDF, grossed up x 1.255, formatted as Finnish currency |
| `BIKE_OWNERSHIP_STARTS_DATE` | Today (formula date field) | Ownership transfer date shown in PDF and used in PDF filename |

### 3.3 Shared Library Module — `lib_brevo_api.js`

Identical to v4.0. The library is called with a `base64` attachment object. See section 3.3 of `brevo_netsuite_email_solution_v4.md`.

### 3.4 Bill of Sale PDF Template

**File name:** `custtmpl_gbb_kauppakirja_2_bill_of_sale_attachment.xml`
**File Cabinet location:** `/SuiteScripts/` (or equivalent folder)
**File Cabinet internal ID:** 339583

A NetSuite Advanced PDF/HTML Template in BFO/FreeMarker format. The template receives all data via a custom data source with alias `params` — no FreeMarker record field references are used. All `params.XXX` variables are passed explicitly by the script.

**Template variables used:**

| Variable | Source |
|---|---|
| `params.RECIPIENT_NAME` | `emailParams['RECIPIENT_NAME']` from saved search |
| `params.BIKE_MANUFACTURER` | `emailParams['BIKE_MANUFACTURER']` from saved search |
| `params.BIKE_MODEL` | `emailParams['BIKE_MODEL']` from saved search |
| `params.BIKE_REDEMPTION_PRICE` | `emailParams['BIKE_REDEMPTION_PRICE']`, pre-formatted as Finnish currency; method 1 is the net field x 1.255 (see README) |
| `params.BIKE_CONTRACT_START_DATE` | `emailParams['BIKE_CONTRACT_START_DATE']` from saved search |
| `params.BIKE_OWNERSHIP_STARTS_DATE` | `emailParams['BIKE_OWNERSHIP_STARTS_DATE']` from saved search |
| `params.DOCUMENT_DATE` | Today's date formatted as `dd.MM.yyyy`, generated by the script at runtime |

**Hardcoded image URLs (production):**

| Image | File ID | URL |
|---|---|---|
| GoByBike logo | 339687 | https://9771141.app.netsuite.com/core/media/media.nl?id=339687&c=9771141&h=3-DY6YNTa7Mfki1kqp90CrZ6vJxCKAASweQDhKSesakPiPhS&fcts=20260626033236&whence= |
| Seller signature + line (left) | 339686 | https://9771141.app.netsuite.com/core/media/media.nl?id=339686&c=9771141&h=AXhmf5A1-IbWNf62lmCcX5pCgmBEiPVcz5RyQ7u_-4r5tawF&fcts=20260626033216&whence= |
| Empty signature line (right) | 339685 | https://9771141.app.netsuite.com/core/media/media.nl?id=339685&c=9771141&h=YRn8K1SiV2eZB1DO9nG08d-QcBcg-r6fx5LZplQQCE0v_lc4&fcts=20260626033211&whence= |

> **Note:** These image URLs contain authentication tokens and may expire. If images stop rendering, re-upload the files to the File Cabinet and update the URLs in the XML template.

**PDF filename format:**

```
GoByBike Kauppakirja - {RECIPIENT_NAME} {BIKE_OWNERSHIP_STARTS_DATE formatted as yyyy-MM-dd}.pdf
```

Example: `GoByBike Kauppakirja - Matti Meikäläinen 2026-06-26.pdf`

The ownership date is reformatted from the Finnish `dd.MM.yyyy` search result format to `yyyy-MM-dd` for the filename.

### 3.5 Map/Reduce Script — `netsuite-send-bill-of-sale-pdf.js`

**Script name:** `[GBB] Bike email send - Kauppakirja attachment`
**Script ID:** `customscript_gbb_mr_send_email_2`
**File location:** `/SuiteScripts/Brevo/netsuite-send-bill-of-sale-pdf.js`
**Script deployment URL (production):** https://9771141.app.netsuite.com/app/common/scripting/scriptrecord.nl?id=2021&whence=

**Script Parameters:**

| Label | ID | Type | Value |
|---|---|---|---|
| Brevo API Key | `custscript_gbb_brevo_api_key_2` | Free-form Text | Brevo API key |
| Brevo Template ID | `custscript_gbb_brevo_template_id_2` | Integer | Brevo template ID |
| Saved Search ID | `custscript_gbb_saved_search_id_2` | Free-form Text | `793` |
| Log Folder ID | `custscript_gbb_log_folder_id_2` | Integer | File Cabinet log folder ID |
| PDF Template File ID | `custscript_gbb_pdf_template_file_id` | Integer | `339583` |

**Stage responsibilities:**

**`getInputData`**
Loads saved search 793. NetSuite feeds results into the map stage automatically.

**`map`**
Each invocation receives one Bike Register record. Builds `emailParams` from saved search columns, generates the bill of sale PDF, and sends the email with the PDF attached. On success, sets `custrecord_gbb_bill_of_sale_sent_to_user` to true. On failure, leaves the record unchanged for retry on next run.

PDF generation steps within map:
1. Load the XML template from File Cabinet by `pdfTemplateFileId`
2. Build `pdfParams` from `emailParams` plus a generated `DOCUMENT_DATE` (today)
3. Create a renderer, set `templateContent` to the XML string
4. Call `renderer.addCustomDataSource({ format: render.DataSource.JSON, alias: 'params', data: JSON.stringify(pdfParams) })`
5. Call `renderer.renderAsPdf()`, set encoding to `BASE_64`, get contents
6. Build filename: `GoByBike Kauppakirja - {RECIPIENT_NAME} {BIKE_OWNERSHIP_STARTS_DATE yyyy-MM-dd}.pdf`
7. Pass as attachment to `lib_brevo_api.sendEmail()`

**`summarize`**
Identical to v4.0. Writes log file to File Cabinet.

---

## 4. Data Flow

```
Record enters saved search queue (same conditions as v4.0)
            │
            ▼
Map/Reduce Script runs on schedule
            │
            ├── getInputData: loads saved search 793 → feeds records into map stage
            │
            ├── map (runs in parallel per record)
            │         │
            │         ├── buildParamsFromSearchResult → emailParams object
            │         │
            │         ├── generatePdf(pdfTemplateFileId, emailParams)
            │         │         ├── Load XML template from File Cabinet (ID 339583)
            │         │         ├── Build pdfParams from emailParams + DOCUMENT_DATE
            │         │         ├── render.create() → set templateContent
            │         │         ├── addCustomDataSource(JSON, alias='params', pdfParams)
            │         │         ├── renderAsPdf() → set encoding BASE_64
            │         │         └── Return base64 PDF string
            │         │
            │         ├── Build PDF filename from RECIPIENT_NAME + BIKE_OWNERSHIP_STARTS_DATE
            │         │
            │         ├── lib_brevo_api.sendEmail() with attachment [{content: base64Pdf, name: filename}]
            │         │
            │         ├── SUCCESS → set custrecord_gbb_bill_of_sale_sent_to_user=true
            │         │            Record leaves saved search permanently
            │         │
            │         └── ERROR → leave record unchanged
            │                     Record retried on next scheduled run
            │
            └── summarize → write log file to File Cabinet
```

---

## 5. Retry Behaviour

Identical to v4.0. A failed record remains in the saved search queue and is retried on every subsequent run until it succeeds.

---

## 6. Manual Re-send

Identical to v4.0. Uncheck `custrecord_gbb_bill_of_sale_sent_to_user` on the record and save. The record re-enters the queue and a new PDF will be generated and attached on the next run.

---

## 7. Scheduling

This script should run on the same schedule as, or in place of, the v4.0 script. It must not run concurrently with the v4.0 script against the same saved search, as both scripts would process the same records and send duplicate emails. Recommended: disable the v4.0 deployment when this deployment is active.

---

## 8. Deployment Checklist

- [ ] Upload `custtmpl_gbb_kauppakirja_2_bill_of_sale_attachment.xml` to File Cabinet; note the file ID for `custscript_gbb_pdf_template_file_id`
- [ ] Upload `netsuite-send-bill-of-sale-pdf.js` to `/SuiteScripts/Brevo/`
- [ ] Create Script record; assign all five parameters
- [ ] Create Script Deployment; set schedule; enter all parameter values
- [ ] Confirm v4.0 deployment is disabled to avoid duplicate sends
- [ ] Test with one eligible record; verify email received with PDF attached
- [ ] Verify PDF filename format: `GoByBike Kauppakirja - {name} {date}.pdf`
- [ ] Verify all fields in PDF are populated: buyer name, bike make/model, price, both dates, Espoo date
- [ ] Verify log file is written to File Cabinet

---

## 9. Limitations and Known Constraints

All limitations from v4.0 apply. Additions:

- **Image URLs may expire.** The logo and signature images are referenced by authenticated NetSuite URLs with tokens. If these URLs expire, images will not render in the PDF. Fix: re-upload the files and update the URLs in the XML template.
- **Template changes require a File Cabinet re-upload.** Unlike a NetSuite Advanced PDF/HTML Template record, the XML file is loaded from the File Cabinet by file ID. After editing the file locally, the updated version must be uploaded to replace the existing file.
- **No permanent PDF copy.** The generated PDF is attached to the email only. It is not saved to the File Cabinet or attached to the Bike Register record. If a copy is needed after sending, re-running with the sent flag manually reset will generate a new PDF.
- **PDF generation adds governance units.** Loading the template file and rendering the PDF consumes additional governance units per map slice. This is not a concern in practice — the render operation is well within the 10,000 unit per slice limit.
- **Field values containing `&` or XML special characters.** All values passed to `pdfParams` are XML-escaped by the script before being passed to the renderer (`&` → `&amp;`, `<` → `&lt;`, etc.). Without this, a bike model or name containing `&` would cause an XML parse error and the map slice would fail. The escaping is applied in the `xmlEscape` helper function in `generatePdf`.

---

## 10. Change Log

| Version | Change |
|---|---|
| 1.2 | Replaced section 3.1's cross-reference to v4.0 with a complete, self-contained inventory of every NetSuite record type and field the solution uses: record types and how each is accessed, the single field written, every saved search column and the field behind it, the fields governing queue eligibility, and the fields deliberately left unused. Field IDs, labels and types verified against the production `customrecord_sta_bike_register` metadata catalog. |
| 1.1 | Added XML escaping of all `pdfParams` values via `xmlEscape` helper to prevent XML parse errors when field values contain `&` or other reserved XML characters. Added `BIKE_FRAME_NR` to `pdfParams` and to the PDF template (displayed below bike make/model in smaller grey text). |
| 1.0 | Initial design. Extends v4.0 email automation with runtime bill of sale PDF generation via `N/render`. New script `netsuite-send-bill-of-sale-pdf.js` with script parameters suffixed `_2` to avoid conflict with v4.0 parameters. XML template `custtmpl_gbb_kauppakirja_2_bill_of_sale_attachment.xml` stored in File Cabinet (ID 339583). Template uses `render.DataSource.JSON` with alias `params` for reliable FreeMarker variable access. PDF filename includes recipient name and ownership date formatted as `yyyy-MM-dd`. Logo and signature images hardcoded as production URLs (file IDs 339685, 339686, 339687). Script deployment URL: https://9771141.app.netsuite.com/app/common/scripting/scriptrecord.nl?id=2021&whence= |
