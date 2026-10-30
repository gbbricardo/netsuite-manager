# T86 — IC-lunastushinnan tyhjennys FAM-omaisuuserällisiltä hankituilta OOMI-pyöriltä — 30.10.2026

Löydös [`findings/2026-10-30-ic-lunastushinta-oomi-fam-hankinta.md`](../../findings/2026-10-30-ic-lunastushinta-oomi-fam-hankinta.md).

Sama kaksoispoisto kuin T85:ssä, mutta pyörillä joilla **on** FAM-omaisuuserä ja joilla hankinta
(`custrecord_assetdeprstartdate`) on myöhemmin kuin `custrecord_sta_subsc_start_date`. Eilinen
haaran ehto rajasi nämä ulos. Laajennettu ehto on
`orderType === 3 && leaseStartDate > originalSubscStartDate`.

> [!NOTE]
> **Tiedostot 01–02 ajettu ja todennettu 30.10.2026.** Kaikki kolme pyörää täsmäävät: B039621 **1 833,63 €**,
> B041395 **1 881,48 €**, B042663 **1 799,50 €**. `scriptnote` 1430 vahvistaa välivaiheet (B041395:
> `netCost` 2 143,33 FAM, `rentMonths` 43, `periodsElapsed` 6, poiston alku 01.05.2026 siirtämättä).
> T85:n regressio ajettu: `done = F` → ero **0,00 €** (lukumäärä 107, koska neljä pyörää sai
> lunastuspäivän yöllä ja hinnoiteltiin oikein jo julkaistulla korjauksella).
>
> **Tiedosto 03 ajettu ja todennettu 30.10.2026.** Jono poimi täsmälleen 8 pyörää
> (`SUM(internal_id)` 342 743, `done ≠ F` 0 kpl), ajo `Success: 8 | Errors: 0` (loki 30.10. 02:51).
> **8/8 hintaa täsmää sentilleen** alla olevaan taulukkoon, korko 0,075 ja `done`-lippu säilyivät.
> Jono on nyt tyhjä. Loppukatselmus: ei-FAM-kohortti `done = F` → **107 / 0,00 €**, FAM-kohortti
> `done = F` → **12 / 0,00 €** (ei yhtään poikkeavaa). `done = T` -ryhmät ennallaan tarkoituksella:
> 137 / 1 926,64 € ja 8 / −138,58 €.

**Tietue:** `customrecord_sta_bike_register` · **Import type:** Custom Record · **Data Handling:** `UPDATE`
· UTF-8 (BOM) · sarake-erotin `;` · desimaalierotin `,`

Mappaa **vain** `internal_id` → **Internal ID** ja `ic_lunastushinta` (tyhjä sarake) →
`custrecord_gbb_ic_redemption_pr`. *Advanced Options* → **Overwrite Missing Fields**. Muut sarakkeet
jätetään mappaamatta; ne ovat ihmissilmää varten. Korkoa ei kosketa (kaikilla 0,075 = talouden ohitus).

## Tiedostot

| Tiedosto | Pyöriä | Lunastuspäivä | Erotus | Mitä |
|---|---|---|---|---|
| `01-pilotti-b041395.csv` | 1 | 31.10.2026 | 373,85 € | pilotti — aja ensin |
| `02-loput-31-10.csv` | 2 | 31.10.2026 | 641,17 € | B039621, B042663 |
| `03-loput-8.csv` | 8 | 30.06.–30.11.2026 | 3 322,27 € | **kaikki loput `done = F` -poikkeamat** |

Tiedostot 1–2 ajettiin 30.10.2026 (`ic_redemption_dt` = 31.10.2026, 3 pyörää / 1 015,02 €).
Tiedosto 03 kattaa **kaikki jäljellä olevat `done = F` -pyörät, joiden hinta poikkeaa** — tuoteomistajan
päätös 30.10.2026: *"Voimme korjata kaikki sellaiset pyörät joissa done = F ja nykyinen IC REDEMPTION
PRICE on väärin."* Yhteensä kaikki kolme tiedostoa = **11 pyörää / 4 337,29 €**.

Tiedoston 03 pyörät ja odotetut hinnat:

| Pyörä | Lunastuspäivä | Nykyinen | Odotettu | Ero |
|---|---|---|---|---|
| B042269 | 31.08.2026 | 1 270,29 | **1 822,84** | 552,55 |
| B046250 | 30.09.2026 | 1 424,44 | **1 932,30** | 507,86 |
| B043704 | **30.11.2026** | 1 096,73 | **1 577,75** | 481,02 |
| B045671 | 30.09.2026 | 1 682,52 | **2 092,55** | 410,03 |
| B043876 | 30.09.2026 | 1 414,09 | **1 818,21** | 404,12 |
| B041336 | **30.11.2026** | 1 420,38 | **1 818,48** | 398,10 |
| B038940 | 31.08.2026 | 1 546,02 | **1 931,48** | 385,46 |
| B040697 | 30.06.2026 | 2 012,91 | **2 196,04** | 183,13 |

`SUM(internal_id)` 342 743. Kaksi riviä (B041336, B043704) ei ole takautuvia: niiden lunastuspäivä on
30.11.2026 eli vielä laskuttamatta, joten korjaus **estää** virheen. (Tämä tiedosto korvaa aiemman
`03-marraskuu-valinnainen.csv`:n, joka sisälsi vain nuo kaksi.)

**Ulkopuolelle jää** `done = T` -ryhmän 8 pyörää (−138,58 €). Niiden hintakenttää **ei saa tyhjentää**
— IC-lunastus on jo käsitelty, joten oikaisu on taloustiimin päätös.

## Ajojärjestys

### 1. Pilotti — B041395

Tarkista ensin, että jono on tyhjä (muuten ajo poimii muutakin):

```sql
SELECT COUNT(*) FROM customrecord_sta_bike_register
WHERE custrecord_gbb_ic_redemption_dt IS NOT NULL
  AND (custrecord_gbb_ic_redemption_done = 'F' OR custrecord_gbb_ic_redemption_done IS NULL)
  AND custrecord_gbb_ic_redemption_pr IS NULL AND isinactive = 'F'
```

Aja `01-pilotti-b041395.csv`, käynnistä `customdeploy_gbb_ic_redemption_pr` käsin (Not Scheduled),
ja lue `scriptnote` (`scripttype = 1430`):

| Kenttä | Odotus |
|---|---|
| `redemptionPrice` | **1 881,48** (tuoteomistajan vahvistus 30.10.2026) |
| `rentMonths` / `periodsElapsed` | **43** / **6** |
| `netCost` / `netCostSource` | 2 143,33 / **FAM** |
| `amortizationStartDate` | **01.05.2026**, `acquisition date (default)` |
| `subscEndDateSource` | hankittu OOMI -selite |

**Jos hinta on 1 507,63 €** eli ennallaan, haara ei osunut — File Cabinetissa on vanha kirjasto.
`rentMonths` 56 ja `periodsElapsed` 19 ovat saman oireen tunnusmerkit.

### 2. Loput

`02-loput-31-10.csv`, sitten skripti. Odotukset: B039621 **1 833,63 €**, B042663 **1 799,50 €**.
Vasta tämän jälkeen `03-marraskuu-valinnainen.csv`, jos se ajetaan.

### 3. Todennus

```sql
SELECT br.name, br.custrecord_gbb_ic_redemption_pr AS hinta
FROM customrecord_sta_bike_register br
WHERE br.id IN (41395, 39621, 42663)
ORDER BY br.name
```

Odotus: B039621 1833,63 · B041395 1881,48 · B042663 1799,50.

**Lisäksi T85:n regressio** — eilen korjattujen 103 pyörän on pysyttävä ennallaan. Aja työohjeen
[§ 6 tarkistuskysely](../../docs/ic-calculators-oomi-poistoaika-tyoohje.md): `done = F` → **103 / 0,00 €**.

## Aineisto

Luettu NetSuitesta 30.10.2026. Odotetut hinnat on **ajettu korjatulla kirjastolla**, ei vain laskettu
SQL:llä: 10 tuotantopyörää, joista 7 eilen korjattua (hinnat muuttumattomia) ja nämä 3 — **10/10 täsmäsi**.

| | Arvo |
|---|---|
| Rivejä (tiedostot 1–2) | 3 |
| `SUM(internal_id)` | 123 679 |
| Nykyiset hinnat | 4 499,59 € |
| Odotetut hinnat | 5 514,61 € |
| **Erotus** | **1 015,02 €** |
| Tiedosto 03 erikseen | 2 riviä, `SUM(internal_id)` 85 040, erotus 879,12 € |
