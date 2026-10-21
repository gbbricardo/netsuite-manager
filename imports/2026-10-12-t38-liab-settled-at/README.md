# T38 — puuttuva `liab_settled_at` 335 kauden lopun lunastukselle — CSV-import 12.10.2026

T38 ([TASKS.md](../../TASKS.md)), osa T26:ta. Vanha status-syncin osa A kirjoitti 1.–5.10. tavan 1 ja
`redemption_paid_at`:in, mutta `custrecord_gbb_liab_settled_at` jäi tyhjäksi. Status-sync 2.0 (1480) ei
täydennä näitä, koska sen vastuuvaihe koskee vain status 1 -pyöriä (Q28, `gbb_rss2_paatos.js` vaihe 2).
Kenttäsääntöjen § 9 (*`liab_settled_at` tavoittain*, tapa 1): arvo on maksupäivä.

**Import kirjoittaa vain `custrecord_gbb_liab_settled_at`:n.** Tapaan, `paid_at`:iin ja statukseen ei
kosketa.

> [!NOTE]
> **Ajettu 12.10.2026 ja todennettu: 335/335.** Jälkitarkistus a) palauttaa vain B035208:n. Importoiduilla 335:llä
> `liab_settled_at` = `paid_at`, ja tapa (1), status (2) ja `subsc_end_date` (31.10.2026) pysyivät ennallaan.
> `SUM(id)` 5 457 579.

**Tietue:** `customrecord_sta_bike_register` · **Import type:** Custom Record ·
**Data Handling:** `UPDATE`

## Rajattu pois

- **B035208** (id 35208). Status 1, päättyy 31.7.2027, `paid_at` 21.09.2026. Sallittu poikkeama
  (kenttäsäännöt § 9 *tapa 1 ennen päättymiskuuta ilman `liab_settled_at`:ia*): keskenkauden lunastus,
  jonka CR tulee myöhemmin. `liab_settled_at` tulee CR:ltä (ADR 0008), ei tästä importista.

## Tiedostot

| Tiedosto | Rivejä | `SUM(id)` |
|---|---|---|
| `01-testirivi.csv` | 1 (B000988) | 988 |
| `02-loput.csv` | 334 | 5 456 591 |
| **Yhteensä** | **335** | **5 457 579** |

Sarakkeet `pyora_id`, `peruste`, `paid_at` ja `tila` ovat vain dokumentaatiota, eikä niitä mapata.
`paid_at` ja `tila` ovat tila 12.10. ennen importtia.

| Maksupäivä | kpl | `SUM(id)` |
|---|---|---|
| 01.10.2026 | 215 | 3 484 049 |
| 02.10.2026 | 64 | 983 489 |
| 03.10.2026 | 15 | 232 644 |
| 04.10.2026 | 8 | 133 647 |
| 05.10.2026 | 33 | 623 750 |

## Aineisto — todennettu NetSuitesta 12.10.2026

- TASKS T38:n kysely palautti **336** pyörää: 335 status 2 + B035208.
- Kaikki 335 päättyvät 31.10.2026, kaikilla tapa 1, `link_sent` = T, `liab_settled_at` tyhjä.
- **Yhdelläkään ei ole tyypin 2/10 CR:ää tilassa Pending tai Done**, joten kyse on kauden lopun
  lunastuksesta (ADR 0009) eikä CR voita maksua.
- **335/335:n `paid_at` = Paylink-pyynnön `custrecord_pl_paid_at`** (päiväksi katkaistu, pyyntö
  löydetty `custrecord_pl_notes` = pyörän `externalid`). Arvo on siis todellinen maksupäivä.
- Order type: 334 tyhjä, B037265 = 1. Ei OOMI-pyöriä (OOMI saisi tunnistuspäivän).
- CSV:n päiväkohtaiset rivimäärät ja `SUM(id)`:t täsmäävät NetSuiten ryhmittelyyn (taulukko yllä).

## Ennen importtia — aja juuri ennen

```sql
-- Odotus: 335 riviä, SUM(id) = 5 457 579. Jos vähemmän, jokin on jo täyttänyt kentän:
-- poista ne rivit CSV:stä ja päivitä tarkistussumma.
SELECT COUNT(*), SUM(br.id)
FROM customrecord_sta_bike_register br
WHERE br.custrecord_gbb_eredem_link_sent = 'T' AND br.custrecord_gbb_liab_settle_method = 1
  AND br.custrecord_gbb_liab_settled_at IS NULL AND br.custrecord_gbb_redemption_paid_at IS NOT NULL
  AND br.custrecord_sta_bike_status = 2
```

```sql
-- Ei tyypin 2/10 CR:ää syntynyt välissä. Odotus: 0
SELECT COUNT(*)
FROM customrecord_subscrption_change_request cr
JOIN customrecord_sta_bike_register br ON cr.custrecord_cr_bike_registry = br.id
WHERE cr.custrecord_cr_type IN (2,10) AND cr.custrecord_cr_status IN (1,2)
  AND br.custrecord_gbb_eredem_link_sent = 'T' AND br.custrecord_gbb_liab_settle_method = 1
  AND br.custrecord_gbb_liab_settled_at IS NULL AND br.custrecord_sta_bike_status = 2
```

## Ajo

1. Aja `01-testirivi.csv`. Mappaa `internal_id` → **Internal ID** ja `loppuvastuut_hoidettu` →
   `custrecord_gbb_liab_settled_at` (*Liabilities settled at*). Jätä muut sarakkeet mappaamatta.
   **Älä valitse *Overwrite Missing Fields*** — se tyhjentäisi mappaamattomat kentät.
2. Tarkista testirivi:
   ```sql
   SELECT custrecord_gbb_liab_settled_at, custrecord_gbb_redemption_paid_at,
          custrecord_gbb_liab_settle_method, custrecord_sta_bike_status
   FROM customrecord_sta_bike_register WHERE id = 988
   ```
   Odotus: **01.10.2026**, **01.10.2026**, **1**, **2**. Jos jokin muu kenttä muuttui, pysähdy.
3. Aja `02-loput.csv` samoilla asetuksilla.

## Jälkitarkistus

```sql
-- a) TASKS T38:n kysely. Odotus: vain B035208
SELECT br.id, br.name
FROM customrecord_sta_bike_register br
WHERE br.custrecord_gbb_eredem_link_sent = 'T' AND br.custrecord_gbb_liab_settle_method = 1
  AND br.custrecord_gbb_liab_settled_at IS NULL AND br.custrecord_gbb_redemption_paid_at IS NOT NULL

-- b) importoiduilla liab_settled_at = paid_at. Odotus: 0
SELECT COUNT(*)
FROM customrecord_sta_bike_register br
WHERE br.custrecord_gbb_eredem_link_sent = 'T' AND br.custrecord_gbb_liab_settle_method = 1
  AND br.custrecord_sta_bike_status = 2 AND br.custrecord_sta_subsc_end_date = TO_DATE('2026-10-31','YYYY-MM-DD')
  AND br.custrecord_gbb_liab_settled_at <> br.custrecord_gbb_redemption_paid_at
  AND br.lastmodified >= TO_DATE('2026-10-12','YYYY-MM-DD')
```

Kun a) palauttaa vain B035208:n, merkitse T38 valmiiksi TASKS.md:hen.

**Odotettu sivuvaikutus:** ei §5-rikkomuksia (`liab_settled_at` = `paid_at` kaikilla). Status-sync 2.0
ei koske status 2 -pyöriin, joten se ei kirjoita arvoja yli.
