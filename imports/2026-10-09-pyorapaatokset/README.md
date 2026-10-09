# Pyöräpäätökset 9.10.2026 — CSV-import

**Tietue:** `customrecord_sta_bike_register` (tiedosto 01) ja `customrecord_subscrption_change_request` (tiedosto 02) · **Data Handling:** `UPDATE` · avain Internal ID.
Tuoteomistajan päätökset 9.10.2026. Nykyarvot haettu NetSuitesta 9.10. (vain luku).

## Tiedostot

| Tiedosto | Rivejä | Sisältö |
|---|---|---|
| `01-pyorapaatokset.csv` | 5 | selvitystapa (+ `liab_settled_at` vain B046675) |
| `02-cr4692-peruutettu.csv` | 1 | CR-4692 `custrecord_cr_status` = 7 Cancelled |

Mappaa 01:ssä vain `selvitystapa` → `custrecord_gbb_liab_settle_method` ja B046675:n `loppuvastuut_hoidettu` → `custrecord_gbb_liab_settled_at`. Älä käytä *Overwrite Missing Fields* -asetusta: tyhjät solut eivät saa tyhjentää mitään. Jos mappaat päivän, aja B046675 omana rivinään tai jätä muiden rivien tyhjät päivät huomiotta (NetSuite ohittaa tyhjät oletuksena).

## Ennen / jälkeen

| Pyörä | id | Status | Tapa ennen | Tapa jälkeen | `liab_settled_at` ennen | jälkeen |
|---|---|---|---|---|---|---|
| B037996 (OOMI) | 37996 | 3 | 1 | **5** | 20.08.2026 | ennallaan |
| B045683 (OOMI) | 45683 | 3 | 1 | **5** | 20.08.2026 | ennallaan |
| B036124 | 36124 | 3 | 1 | **5** | 22.12.2025 | ennallaan |
| B045304 (OOMI) | 45304 | 2 | 8 | **7** | 31.07.2026 | ennallaan |
| B046675 (OOMI) | 46675 | 2 | 8 | **1** | tyhjä | **01.09.2026** |

Kaikilla `liab_settled_at` on jo täytetty (B046675 poikkeus), joten 2D-CR:n päivää ei tarvittu. Status ja `paid_at` eivät muutu (`paid_at` tyhjä B045304:llä ja B046675:llä, ennallaan). CR:t: B037996 CR-7012 (tyyppi 2, Done) + 7013; B045683 CR-5481 (tyyppi 2, Done) + 5095, 5482.

## Huomioita

- **B046675 päivä 01.09.2026, ei 30.09.:** `docs/lunastuksen-kenttasaannot.md` § 9 (*OOMI-pyörä*): "tunnistuspäivä on päättymiskuun 1. päivä", ja `liab_settled_at` = tunnistuspäivä. Pyörä päättyi 30.09., joten päivä on 01.09.2026. Jos omistaja tarkoitti 30.09., muuta CSV:n rivi ennen ajoa.
- **B046675 ja B045304 ovat nyt tavassa 8**, jonka nimeä ei ole tässä tarkistettu listasta. B046675 ei kuulunut S4:ään (34 pyörää) tavan 8 takia: tarkista, että tapa 8 oli tarkoituksella asetettu.
- **status-sync 2.0 käsittelee vastuita vain status 1 -pyörille**, joten se ei ylikirjoita näitä (kaikki viisi ovat status 2 tai 3).
- CR-4692 (B023888, tyyppi 10 peruutus) on nyt Pending. Peruutus ei muuta pyörää B023888 (status 2, tapa 1).

## Esitarkistus (odotus: 5 riviä ennen, kaikki "ennen"-arvoilla)

```sql
SELECT id, name, custrecord_sta_bike_status, custrecord_gbb_liab_settle_method, custrecord_gbb_liab_settled_at
FROM customrecord_sta_bike_register WHERE id IN (37996,45683,36124,45304,46675)
```
```sql
SELECT id, custrecord_cr_status FROM customrecord_subscrption_change_request WHERE id = 4692  -- odotus 1
```

## Jälkitarkistus (odotus 0 riviä)

```sql
SELECT id, name FROM customrecord_sta_bike_register
WHERE (id IN (37996,45683,36124) AND NVL(custrecord_gbb_liab_settle_method,0) <> 5)
   OR (id = 45304 AND (NVL(custrecord_gbb_liab_settle_method,0) <> 7 OR custrecord_gbb_liab_settled_at <> TO_DATE('2026-07-31','YYYY-MM-DD')))
   OR (id = 46675 AND (NVL(custrecord_gbb_liab_settle_method,0) <> 1 OR custrecord_gbb_liab_settled_at IS NULL OR custrecord_gbb_liab_settled_at <> TO_DATE('2026-09-01','YYYY-MM-DD')))
   OR (id IN (37996,45683,36124) AND custrecord_sta_bike_status <> 3)
UNION ALL
SELECT id, name FROM customrecord_subscrption_change_request WHERE id = 4692 AND custrecord_cr_status <> 7
```

## Inaktivointitarkistus: B004339 (id 4339) ja B046741 (id 46741), 9.10.2026

| Viittaus | B004339 | B046741 |
|---|---|---|
| CR (`custrecord_cr_bike_registry`) | 0 | 0 |
| Sopimusrivit (`custrecord_sta_bikeid`) | 0 | 0 |
| RI (`custrecord_gbb_ri_bike`) | 0 | 0 |
| Paylink (`notes` = externalid 28927904273 / HFVUR4A9) | 0 | 0 |

Molemmat ovat aktiivisia (`isinactive` = F), status ja tapa tyhjät (B004339 päättyi 30.06.2025, B046741 päättyy 28.02.2031, OOMI). Viittauksia ei löytynyt, joten ne voi inaktivoida. Vahvista ennen inaktivointia, ettei B046741 (tuleva OOMI, 2031) ole odottava uusi pyörä, jonka CR/rivit luodaan myöhemmin.

## 03 — B023403: `custrecord_sta_redemption_date` tyhjäksi (päätös 9.10.2026)

Staria-skripti (`sta_mr_mid_life_redemption`, 966, NOTSCHEDULED 9.10. alkaen) kirjasi 27.11.2025 keskenkauden lunastuspäivän ja hyvityksen
CRMGBF0000552 (−116,22 €), vaikka keskenkauden lunastusta ei tapahtunut (ei tyypin 2 CR:ää, loppulunastus maksettu 1.10.2026).
**Päätös:** kenttä tyhjennetään, ja hyvitys jää asiakkaalle. Importissa tyhjä arvo tyhjentää kentän: tarkista CSV-importin asetus
"Overwrite with blank values" tai vastaava.

```sql
-- jälkitarkistus, odotus 0
SELECT id FROM customrecord_sta_bike_register WHERE id = 23403 AND custrecord_sta_redemption_date IS NOT NULL
```
