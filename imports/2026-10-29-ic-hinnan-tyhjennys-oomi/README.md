# T85 — IC-lunastushinnan tyhjennys 103 hankitulta OOMI-pyörältä — CSV-import 29.10.2026

Työohje [`docs/ic-calculators-oomi-poistoaika-tyoohje.md`](../../docs/ic-calculators-oomi-poistoaika-tyoohje.md) § 5
kohta 3, löydös [`findings/2026-10-29-ic-lunastushinta-oomi-ei-fam.md`](../../findings/2026-10-29-ic-lunastushinta-oomi-ei-fam.md).

Hankituilla OOMI-pyörillä (ei FAM-omaisuuserää, `custrecord_gbb_ic_sale_dt` asetettu) poisto laskettiin
alkuperäisen Oomi-sopimuksen alusta koko alkuperäiselle kaudelle, jolloin IC-kauppahinnan sisällä jo oleva
poisto vähennettiin toiseen kertaan. Taloustiimi vahvisti 29.10.2026, että poisto alkaa IC-kaupan päivästä.
Korjaus on `netsuite-ic-calculators`-repossa ja **ladattu File Cabinetiin 29.10.2026**.

**Miksi import tarvitaan:** `getInputData` vaatii `custrecord_gbb_ic_redemption_pr IS NULL`, joten skripti ei
laske jo hinnoiteltuja pyöriä uudelleen itsestään. Hintakentän tyhjennys on ainoa tapa, joka pitää skriptin
ainoana totuuden lähteenä — hintoja **ei** kirjoiteta CSV:llä sisään.

> [!IMPORTANT]
> Kohdejoukko on rajattu `custrecord_gbb_ic_redemption_done = 'F'` -lippuun. Niiden 137 pyörän hintakenttää,
> joilla lippu on `T`, **ei saa tyhjentää**: IC-lunastus on jo käsitelty, ja niistä 28 poikkeavaa on
> taloustiimin päätös (ks. työohje § 5).

**Tietue:** `customrecord_sta_bike_register` · **Import type:** Custom Record · **Data Handling:** `UPDATE`
· UTF-8 (BOM) · sarake-erotin `;` · desimaalierotin `,`

## Tiedostot

| Tiedosto | Rivejä | `SUM(internal_id)` | Mitä tehdään |
|---|---|---|---|
| `01-pilotti-b037696.csv` | 1 (B037696) | 37 696 | tyhjennetään `custrecord_gbb_ic_redemption_pr` |
| `02-loput-102.csv` | 102 | 4 261 372 | sama |

Mappaa **vain** `internal_id` → **Internal ID** ja `ic_lunastushinta` → `custrecord_gbb_ic_redemption_pr`.
Valitse *Advanced Options* → **Overwrite Missing Fields**. Jätä muut sarakkeet mappaamatta — ne ovat
ihmissilmää varten: `nykyinen_hinta_poistuu` on nykyinen väärä hinta, `odotettu_hinta` se, jonka korjatun
skriptin kuuluu kirjoittaa tilalle, ja `nper_kk` / `kuluneet_kk` ne luvut, jotka näkyvät `scriptnote`-lokissa.

**Korkoa ei kosketa.** Kaikilla 103:lla `custrecord_gbb_interest_rate` on 0,075, joten skripti lukee sen
talouden ohituksena eikä kirjoita korkoa uudelleen (`reduce` kirjoittaa koron vain kun `!result.wasOverride`).

## Ajojärjestys

> [!WARNING]
> Älä aja `02-loput-102.csv`:ää ennen kuin pilotti on todennettu. Jos kuukausiankkuri on regressoitunut,
> virhe on pieni ja uskottavan näköinen (B037696: 1 120,38 € oikean 1 137,62 €:n sijaan), eikä se erotu
> summatasolla.

> [!NOTE]
> **Molemmat erät ajettu ja todennettu 29.10.2026 — hyväksymiskriteeri täyttyi.**
> `Success: 1 | Errors: 0` (08:15) ja `Success: 102 | Errors: 0` (08:24). Kaikki 103 hinnoiteltu, 0 kpl `-1`,
> hintojen summa **109 150,45 €** = `SUM(odotettu_hinta)` sentilleen. § 6 -kysely: `done = F` → **103 / 0,00 €**,
> `done = T` → 137 / 1 926,64 € ennallaan (137 hintaa koskemattomia, summa 128 994,81 €). Jono tyhjä.
> Yksikään `-1`-hintainen pyörä ei ole muokattu 28.–29.10., eli ajo ei kirjoittanut virhearvoja.

<details><summary>Pilottierän todennus (29.10.2026)</summary>

> **Pilotti ajettu ja todennettu 29.10.2026.** `01-pilotti-b037696.csv` importoitu, skripti käynnistetty käsin,
> `scriptnote` (1430, 29.10. 08:15): `Success: 1 | Errors: 0`. Hinta **1 137,62 €**, `rentMonths` **22**,
> `periodsElapsed` 6, `unbilledMonths` 16, `amortizationStartDate` 01.05.2026, `subscriptionEndDate` 01.02.2028,
> `rentMonthsSource` = `derived from custrecord_gbb_ic_sale_dt → custrecord_sta_subsc_org_end_date`,
> `rateSource` = `finance override`. `originalRentMonths` näkyy lokissa arvona 52 mutta ei vaikuta laskentaan.
> Importti säilytti koron (0,075) ja `done`-lipun (F).

</details>

### 1. Pilotti — B037696

B037696 on valittu, koska sen `custrecord_sta_subsc_org_end_date` osuu **kuun 1. päivälle**. Se on ainoa
reunatapaus, joka erottaa kuukausiankkurin (`monthsInclusive`, 22 kk) vanhasta päivävertailusta
(`resolveRentMonths`, 21 kk). Neljä kohdejoukon pyörää on tässä tilanteessa: B037696, B042903, B044504, B044867.

Skriptin jono oli **tyhjä 29.10.2026** (0 riviä hakuehdolla `ic_redemption_dt IS NOT NULL AND done F/NULL AND
ic_redemption_pr IS NULL AND isinactive = 'F'`), joten tyhjennyksen jälkeen B037696 on ajon **ainoa** tietue.
Tarkista tämä uudelleen juuri ennen ajoa, jos muuta on tapahtunut välissä:

```sql
SELECT COUNT(*) FROM customrecord_sta_bike_register
WHERE custrecord_gbb_ic_redemption_dt IS NOT NULL
  AND (custrecord_gbb_ic_redemption_done = 'F' OR custrecord_gbb_ic_redemption_done IS NULL)
  AND custrecord_gbb_ic_redemption_pr IS NULL AND isinactive = 'F'
```

Aja `01-pilotti-b037696.csv`, sitten skripti, ja lue `scriptnote`-lokista odotusarvot:

| Kenttä | Odotus |
|---|---|
| `redemptionPrice` | **1 137,62** |
| `rentMonths` | **22** |
| `periodsElapsed` | **6** |
| `unbilledMonths` | 16 |
| `amortizationStartDate` | **01.05.2026** (IC-kaupan päivä) |
| `rentMonthsSource` | `derived from custrecord_gbb_ic_sale_dt → custrecord_sta_subsc_org_end_date` |
| `subscEndDateSource` | `acquired OOMI lease — schedule runs from …` |
| `interestRatePct` / `rateSource` | 0,075 / `finance override` |

**Jos `rentMonths` on 21 ja hinta 1 120,38 €**, kuukausiankkuri ei ole mukana julkaistussa versiossa —
File Cabinetissa on vanha `gbb_ic_redemption_calculator.js`. Pysäytä tähän.
**Jos hinta on 618,47 €** eli ennallaan, haara ei osunut lainkaan: tarkista että `gbb_ic_redemption_price_mr.js`
välittää `orderType`-kentän (ilman sitä `isAcquiredOomiLease` palauttaa aina `false`).

### 2. Loput 102

Vasta pilotin jälkeen: aja `02-loput-102.csv` samoilla asetuksilla ja sen jälkeen skripti.

### 3. Todennus

Työohjeen § 6 tarkistuskysely. **Hyväksymiskriteeri:** `done_flag = 'F'` → `ero_eur` **0,00** ja `lkm` **103**.
Rivin `T` 137 / 1 926,64 € kuuluu pysyä ennallaan — jos se muuttui, importti osui väärään joukkoon.

## Aineisto

Luettu NetSuitesta 29.10.2026, ja CSV:t on generoitu näitä tarkistussummia vasten (generaattori tarkistaa
ne ajossa ja keskeyttää, jos ne eivät täsmää):

| | Arvo |
|---|---|
| Rivejä | 103 (1 + 102) |
| `SUM(internal_id)` | 4 299 068 |
| `SUM(ic_redemption_pr)` nyt | 66 075,88 € |
| `SUM(odotettu_hinta)` | 109 150,45 € |
| Erotus | **43 074,57 €** (= § 6 -kyselyn `F`-rivi) |
| `ic_sale_dt` | 01.05.2026 kaikilla |
| `interest_rate` | 0,075 kaikilla |

Rajaus: `order_type = 3`, `asset_id IS NULL`, `ic_sale_dt` ja `ic_sale_price` asetettu,
`ic_redemption_pr` asetettu eikä `-1`, `done = F`, ja lunastuskuukausi ennen alkuperäistä päättymiskuukautta.
