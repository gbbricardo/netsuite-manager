# Huolto-oikeuden alustus — `custrecord_sta_maintenances_not_allowed` — 3.11.2026

Kertaluonteinen alustus, jonka jälkeen arvoa muuttaa vain käyttäjän rakentama workflow
(lunastus / palautus).

**Sääntö (käyttäjä 3.11.2026):** täppä on **T** kaikilla pyörillä **paitsi** niillä, jotka ovat
`custrecord_sta_bike_status = 1` (Active) **ja** joilla on **negatiivinen**
`custrecord_sta_maintenance_sum` **tai positiivinen** `custrecord_sta_monthly_maintenance_budg`.

**Tietue:** `customrecord_sta_bike_register` · **Import type:** Custom Record · **Data Handling:** `UPDATE`
· UTF-8 (BOM) · sarake-erotin `;` · desimaalierotin `,`

> [!IMPORTANT]
> **Advanced Options → ota `Run Server SuiteScript and Trigger Workflows` POIS.**
> Tämä on koko syy tehdä päivitys CSV:llä eikä Mass Updatella. Pyörärekisterillä on viisi
> RELEASED User Event -skriptiä, ja ne kirjoittavat yhteensä noin **2 lokiriviä per rivi** —
> 30 664 rivin ajo tuottaisi ~61 000 turhaa DEBUG-riviä `scriptnote`en ja hukuttaisi muiden
> skriptien lokit samalta ajanjaksolta. Mass Updatessa valintaa ei ole, CSV-importissa on.
>
> **Älä rastita `Overwrite Missing Fields`.** Se tyhjentäisi mappaamattomat kentät.

Mappaa **vain kaksi** saraketta:

| CSV-sarake | NetSuite-kenttä |
|---|---|
| `internal_id` | **Internal ID** |
| `maintenances_not_allowed` | `custrecord_sta_maintenances_not_allowed` (MAINTENANCES NOT ALLOWED) |

Sarakkeet `pyora_id`, `huoltosumma`, `kk_budjetti` ja `paattyy` jätetään mappaamatta — ne ovat
ihmissilmää varten ja kertovat, miksi rivi on mukana.

## Tiedostot

| Tiedosto | Rivejä | `SUM(internal_id)` | Mitä |
|---|---|---|---|
| `00-pilotti.csv` | 3 | 262 | B000029, B000087, B000146 — aja ensin |
| `01-huolto-oikeus-pois.csv` | 15 000 | 214 778 561 | |
| `02-huolto-oikeus-pois.csv` | 15 000 | 532 176 418 | |
| `03-huolto-oikeus-pois.csv` | 661 | 30 710 678 | loput |
| **Yhteensä** | **30 664** | **777 665 919** | |

Pilottirivit **eivät** toistu tiedostoissa 01–03, joten yhtään riviä ei päivitetä kahdesti.
Kolmen tiedoston jako johtuu CSV Import Assistantin 25 000 rivin katosta; aja ne yksi kerrallaan.

Pilotiksi on valittu kolme pyörää, joilla `huoltosumma > 0`, eli aineiston yleisin
ei-triviaali tapaus. Niillä on huoltoja käytetty mutta ei budjettia jäljellä — säännön mukaan
ei huolto-oikeutta.

## Miksi juuri 30 664 riviä

Kannan tila 3.11.2026 (46 772 pyörää):

| Joukko | Lkm | Täppä nyt | Toimenpide |
|---|---|---|---|
| Active, `sum<0`, budjetti tyhjä/0 | 122 | F | oikein, ei mukana |
| Active, `sum<0`, `budg>0` | 674 | F | oikein, ei mukana |
| Active, `sum>=0`, `budg>0` | 33 | F | oikein, ei mukana |
| Active, ei kumpaakaan | 2 | T | oikein, ei mukana |
| Redeemed / Returned / tila tyhjä | 15 277 | T | oikein, ei mukana |
| **Active, ei kumpaakaan** | **30 664** | **F** | **→ T, tämä aineisto** |

Yhtään pyörää ei tarvitse kääntää toiseen suuntaan (T → F): tarkistettu, 0 osumaa.
Kaikki 30 664 ovat `isinactive = F`.

Rajauskysely (`NVL` on pakollinen — kohdejoukossa on 755 riviä joilla `maintenance_sum` on tyhjä
ja 24 125 riviä joilla budjetti on tyhjä):

```sql
SELECT id, name
FROM customrecord_sta_bike_register
WHERE custrecord_sta_bike_status = 1
  AND NVL(custrecord_sta_maintenance_sum, 0) >= 0
  AND NVL(custrecord_sta_monthly_maintenance_budg, 0) <= 0
  AND NVL(custrecord_sta_maintenances_not_allowed, 'F') = 'F'
ORDER BY id
```

Sama rajaus antoi Mass Update -esikatselussa (käyttäjä 3.11.2026) **Total: 30 664**.

## Ajojärjestys

### 1. Pilotti

Aja `00-pilotti.csv`. Tarkista mappauksen osuminen:

```sql
SELECT id, name, custrecord_sta_maintenances_not_allowed AS tappa,
       custrecord_sta_maintenance_sum AS huoltosumma
FROM customrecord_sta_bike_register WHERE id IN (29, 87, 146)
```

Odotus: kaikilla kolmella `tappa = T`, `huoltosumma` **ennallaan** (1590,08 · 651,63 · 2746,61).
Jos huoltosumma muuttui tai tyhjeni, mappauksessa on ylimääräinen sarake — pysäytä.

Tarkista lisäksi, ettei skriptejä ajettu:

```sql
SELECT COUNT(*) AS pitaisi_olla_nolla FROM scriptnote
WHERE scripttype IN (699, 1442, 1211, 1209, 1469)
  AND date >= TO_DATE('2026-11-03 04:00:00','YYYY-MM-DD HH24:MI:SS')
```

(Lokikello on ~10 h Helsinkiä jäljessä, joten säädä alkuhetki ajon mukaan.) Jos rivejä tulee,
`Run Server SuiteScript and Trigger Workflows` jäi päälle.

### 2. Loput

`01` → `02` → `03`, yksi kerrallaan. Jokaisen jälkeen Import Job Status: **Errors 0**.

### 3. Todennus

```sql
SELECT COUNT(*) AS pitaisi_olla_nolla
FROM customrecord_sta_bike_register
WHERE NVL(custrecord_sta_maintenances_not_allowed,'F') =
      CASE WHEN custrecord_sta_bike_status = 1
            AND (custrecord_sta_maintenance_sum < 0
                 OR custrecord_sta_monthly_maintenance_budg > 0)
           THEN 'T' ELSE 'F' END
```

Palauttaa **0**, kun jokaisen pyörän täppä on säännön mukainen kumpaankin suuntaan.
Huolto-oikeudellisia (`täppä = F`) pitää jäädä **829**.

## Kaksi aukkoa, jotka workflow ei kata

Tämä aineisto jäädyttää 3.11.2026 tilanteen. Kaksi asiaa jää ilman omistajaa:

1. **Uudet pyörät.** Huomenna luotu Active-pyörä saa kentän oletusarvon. Jos oletus on tyhjä,
   se saa huolto-oikeuden vaikka sillä ei ole budjettia. Joko aseta kentän **oletusarvoksi
   checked**, tai lisää workflowiin Create-haara.
2. **Budjetti tai huoltosumma muuttuu kesken kauden.** Jos aktiiviselle pyörälle asetetaan
   `monthly_maintenance_budg > 0` tai summa menee negatiiviseksi, sen *pitäisi* saada oikeus —
   mutta lunastus/palautus-workflow ei katso näitä kenttiä. Tällaisia pyöriä on nyt 829 ja
   määrä elää jatkuvasti. Harkitse Field Changed -triggeriä näille kahdelle kentälle.

## Aineisto

Luettu NetSuitesta 3.11.2026 klo 14:51 (SuiteQL REST, `tools/netsuite-auth.mjs`).
