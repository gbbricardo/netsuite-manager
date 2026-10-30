# Työohje: IC-lunastushinnan poistoaika hankituille OOMI-pyörille

**Omistava repo:** `netsuite-ic-calculators`
**Taustalöydös:** [`findings/2026-10-29-ic-lunastushinta-oomi-ei-fam.md`](../findings/2026-10-29-ic-lunastushinta-oomi-ei-fam.md)
**Taloustiimin vahvistus 29.10.2026:** OOMI-pyörillä, joilla on `custrecord_gbb_ic_sale_dt`,
**poisto alkaa IC-kaupan päivästä.**
**Tehtävä:** TASKS **T85**

> Tämä on työohje. Koodia ei muuteta `netsuite-manager`-reposta, vaan erillisessä istunnossa
> `netsuite-ic-calculators`-repossa sen omilla käytännöillä (jest-testit, `npm test`).

---

## 1. Säännön muotoilu

Hankitulla OOMI-pyörällä (`custrecord_sta_bike_order_type = 3`, ei FAM-omaisuuserää,
`custrecord_gbb_ic_sale_dt` asetettu) lunastushinta lasketaan **IC-kaupasta lähtevältä
annuiteetilta**, ei alkuperäiseltä Oomi-sopimukselta:

| Suure | Arvo |
|---|---|
| Poistopohja | `custrecord_gbb_ic_sale_price / 1,255` (ennallaan) |
| **Poisto alkaa** | **`custrecord_gbb_ic_sale_dt`** (ei `custrecord_sta_subsc_start_date`) |
| **Poistoaika (`nper`)** | **IC-kaupan kuukaudesta sopimuksen päättymiskuukauteen, molemmat mukaan lukien** — `custrecord_sta_subsc_org_end_date` (+ mahdolliset pidennyskuukaudet) |
| Kuluneet jaksot | IC-kaupan kuukaudesta lunastuskuukauteen, molemmat mukaan lukien |
| Jäännösarvo | `custrecord_sta_end_redemption_price` (ennallaan) |
| Korko | `custrecord_gbb_interest_rate`, muuten 7,5 % (ennallaan) |

`custrecord_sta_bike_rent_months` **ei ole käytössä** tällä polulla: se kuuluu alkuperäiselle
Oomi-sopimukselle, jonka poistot ovat jo IC-kauppahinnan sisällä.

> [!IMPORTANT]
> **Kuukausiankkuri, ei päivävertailu.** Nykyinen `resolveRentMonths` päättelee kuukaudet
> päivävertailulla (`end.getDate() > start.getDate()`). `custrecord_gbb_ic_sale_dt` on aina kuun 1.
> päivä ja `subsc_org_end_date` mikä tahansa päivä, joten kun päättymispäivä osuu kuun 1. päivälle,
> päivävertailu **menettää kokonaisen kuukauden**. Todennettu: 6 pyörää, joista B037696 saisi 1 120,38 €
> talouden 1 137,62 € sijaan. Siksi uusi polku laskee kuukaudet erillisellä `monthsInclusive`-apurilla
> eikä kierrätä päättymispäivän kautta.

Lopputulos on sama annuiteetti kuin talouden Excelissä:

```
hinta = net_cost − (net_cost − jäännösarvo) × ((1+r)^elapsed − 1) / ((1+r)^nper − 1)
```

## 2. Muutos: `src/lib/gbb_ic_redemption_calculator.js`

Lisää kolme funktiota `addMonthsToEndDate`:n jälkeen, ennen `calculateUnbilledMonths`:ia:

```js
  // Whole calendar months from one month to another with BOTH ends counted: 2026-05 -> 2026-06
  // is 2, not 1. The I/C schedule is anchored on months because custrecord_gbb_ic_sale_dt (always
  // the 1st) and custrecord_sta_subsc_org_end_date (any day) never line up by day, and the day
  // comparison in resolveRentMonths loses a whole month whenever the end date falls on the 1st.
  function monthsInclusive(fromDate, toDate) {
    return (toDate.getFullYear() - fromDate.getFullYear()) * 12
      + (toDate.getMonth() - fromDate.getMonth()) + 1;
  }

  // An OOMI bike bought from Oomi has no FAM asset, so both the cost and the lease start come
  // from the I/C fields. That combination is what makes the original contract's schedule wrong.
  function isAcquiredOomiLease(row) {
    return parseInt(row.orderType, 10) === ORDER_TYPE_OOMI
      && !row.famAssetCost
      && !row.famDeprStartDate
      && !!row.icSaleDate;
  }

  /**
   * Prices an acquired OOMI lease against the intercompany purchase instead of the original
   * Oomi contract.
   *
   * custrecord_gbb_ic_sale_price is what GoByBike paid for the bike on custrecord_gbb_ic_sale_dt,
   * i.e. the book value the bike already carried at acquisition. Amortizing it again from
   * custrecord_sta_subsc_start_date deducts the depreciation that is already inside that price a
   * second time. The schedule therefore starts in the I/C sale month and ends in the contractual
   * end month; custrecord_sta_bike_rent_months belongs to the original contract and is
   * deliberately unused here.
   *
   * Confirmed by finance 29/10/2026 — see netsuite-manager
   * findings/2026-10-29-ic-lunastushinta-oomi-ei-fam.md.
   */
  function priceAcquiredOomiLease(row, netCost, residualResult, rateResult, leaseStartDate) {
    if (!row.originalSubscEndDate) {
      throw new Error('custrecord_sta_subsc_org_end_date is empty: an acquired OOMI lease has no contractual end month to amortize to');
    }

    var residualValue      = residualResult.value;
    var contractualEndDate = addMonthsToEndDate(row.originalSubscEndDate, row.prolongationMonths || 0);
    var rentMonths         = monthsInclusive(leaseStartDate, contractualEndDate);
    var periodsElapsed     = monthsInclusive(leaseStartDate, row.icRedemptionDate);

    if (rentMonths <= 0) {
      throw new Error('Contractual end month is before the I/C sale month: no amortization period');
    }
    if (periodsElapsed <= 0) {
      throw new Error('custrecord_gbb_ic_redemption_dt is before the I/C sale month');
    }

    var unbilledMonths = rentMonths - periodsElapsed;
    var debug = {
      netCost                     : netCost,
      residualValue               : residualValue,
      residualWasOverride         : residualResult.wasOverride,
      subscEndDateRecalculated    : false,
      midTermination              : !!(row.subscEndDate && row.subscEndDate < contractualEndDate),
      termEndSource               : 'acquired-oomi-contractual-end',
      leaseStartDate              : leaseStartDate,
      amortizationStartDate       : leaseStartDate,
      amortizationStartWasOverride: false,
      rentMonths                  : rentMonths,
      rentMonthsWasOverride       : true,
      subscriptionEndDate         : contractualEndDate,
      unbilledMonths              : unbilledMonths,
      periodsElapsed              : periodsElapsed
    };

    if (unbilledMonths <= 0) {
      debug.periodsElapsed = rentMonths;
      return {
        ok             : true,
        redemptionPrice: residualValue,
        ratePct        : rateResult.ratePct,
        wasOverride    : rateResult.wasOverride,
        endOfLifecycle : true,
        debug          : debug
      };
    }

    return {
      ok             : true,
      redemptionPrice: calculateRedemptionPrice(netCost, rateResult.ratePct, rentMonths, periodsElapsed, residualValue),
      ratePct        : rateResult.ratePct,
      wasOverride    : rateResult.wasOverride,
      debug          : debug
    };
  }
```

Haaraudu `processRecord`:ssa heti jäännösarvon jälkeen, **ennen** `resolveTermEndDate`-kutsua:

```js
       var residualValue = residualResult.value;
+
+      if (isAcquiredOomiLease(row)) {
+        return priceAcquiredOomiLease(row, netCost, residualResult, rateResult, leaseStartDate);
+      }
+
       var termEndResult = resolveTermEndDate({
```

Lisää kolme nimeä `return`-lohkon vientilistaan (`resolveTermEndDate`:n jälkeen):

```js
    monthsInclusive: monthsInclusive,
    isAcquiredOomiLease: isAcquiredOomiLease,
    priceAcquiredOomiLease: priceAcquiredOomiLease,
```

### Miksi haara eikä `resolveTermEndDate`:n korjaus

Virhe syntyy siitä, että `resolveTermEndDate` vertaa `subsc_end_date`:ä arvoon
`leaseStartDate + rentMonths`. Hankitulla pyörällä se ylittää todellisen päättymisen vuosilla, joten
funktio luokittelee jokaisen kesken kauden lunastuksen `ignored-mid-termination`-tapaukseksi ja
palauttaa `null`. `null` puolestaan laukaisee `resolveAmortizationStartDate`:n siirtämään poiston alun
`subsc_start_date`:en. Haara ennen tätä ketjua jättää oman vuokrauksen logiikan (FAM-omaisuuserälliset,
2 752 kesken kauden päättynyttä pyörää) täysin koskemattomaksi — mikä on koko muutoksen turvamarginaali.

## 3. Muutos: `src/gbb_ic_redemption_price_mr.js`

Tilaustyyppi on jo haettu SuiteQL:ssä ja käytössä `resolveMaintenanceSum`-kutsussa, mutta sitä **ei
välitetä** `processRecord`:lle. Lisää se:

```js
-      originalSubscEndDate   : originalSubscEndDate
+      originalSubscEndDate   : originalSubscEndDate,
+      orderType              : row.custrecord_sta_bike_order_type
     };
```

Ja uusi selite lokia varten `TERM_END_SOURCE_LABELS`-taulukkoon:

```js
    'acquired-oomi-contractual-end': 'acquired OOMI lease — schedule runs from custrecord_gbb_ic_sale_dt to custrecord_sta_subsc_org_end_date',
```

Muuta MR-skriptissä ei tarvitse koskea: uusi haara palauttaa kaikki samat `debug`-avaimet, joita
`log.debug` lukee.

> [!NOTE]
> `prolongationMonths` on OOMI-pyörillä aina 0, koska `resolveMaintenanceSum` nollaa huoltosumman
> tilaustyypille 3. `addMonthsToEndDate(..., 0)` on siis nykydatalla tyhjä operaatio; se on mukana
> vain siltä varalta, että sääntö joskus muuttuu.

## 4. Testit

**Nykyiset 97 testiä menevät läpi muuttumattomina** — todennettu ajamalla `npx jest` korjatulla
kopiolla 29.10.2026. Syy: ainoa OOMI-testi (`bike 45493`) on kauden lopun tapaus, ja ainoa kesken
kauden -testi (`bike 25919`) on FAM-omaisuuserällinen. Jos jompikumpi kaatuu, haaran ehto on liian laaja.

Lisää `tests/gbb_ic_redemption_calculator.test.js`:ään uusi `describe`, jonka odotusarvot ovat
**taloustiimin omia lukuja** (`findings/2026-10-29-ic-lunastukset-taloustiimiltä.csv`). Syötteet
ovat tuotannon pyörärekisteristä 29.10.2026:

| Pyörä | `ic_sale_price` | `ic_sale_dt` | `ic_redemption_dt` | `rent_months` | jäännös | `subsc_start` | `subsc_end` | `subsc_org_end` | odotus | huomio |
|---|---|---|---|---|---|---|---|---|---|---|
| B037464 | 1747,42 | 1.5.2026 | 30.6.2026 | 48 | 24,19 | 7.6.2024 | 30.6.2026 | 6.6.2028 | **1294,81** | nper 26, elapsed 2 |
| B037566 | 1808,19 | 1.5.2026 | 31.5.2026 | 48 | 24,19 | 16.7.2024 | 31.5.2026 | 15.7.2028 | **1392,46** | elapsed 1 |
| B039775 | 627,75 | 1.5.2026 | 31.10.2026 | 13 | 43,94 | 3.11.2025 | 31.10.2026 | 2.12.2026 | **160,15** | lyhyt kausi |
| B044217 | 239,67 | 1.5.2026 | 31.5.2026 | 33 | 112,70 | 28.9.2023 | 31.5.2026 | 27.6.2026 | **151,96** | nper 2 |
| B037696 | 1852,29 | 1.5.2026 | 31.10.2026 | 52 | 171,11 | 2.10.2023 | 31.10.2026 | **1.2.2028** | **1137,62** | org_end kuun 1. pv |
| B044867 | 2224,50 | 1.5.2026 | 30.6.2026 | 44 | 25,71 | 2.4.2025 | 30.6.2026 | **1.12.2028** | **1673,24** | org_end kuun 1. pv |
| B042903 | 1350,89 | 1.5.2026 | 31.5.2026 | 60 | 228,19 | 2.6.2022 | 31.5.2026 | **1.6.2027** | **1018,25** | org_end kuun 1. pv |
| B044504 | 1122,84 | 1.5.2026 | 31.10.2026 | 47 | 157,26 | 2.5.2023 | 31.10.2026 | **1.4.2027** | **532,87** | org_end kuun 1. pv |
| B044311 | 871,90 | 1.5.2026 | 30.9.2026 | 60 | 193,70 | 1.10.2021 | 30.9.2026 | 30.9.2026 | **193,70** | kauden loppu, **ei saa muuttua** |
| B046521 | 271,96 | 1.5.2026 | 31.10.2026 | 6 | *tyhjä* | 21.4.2026 | 20.10.2026 | 20.10.2026 | **10,84** | kauden loppu + 5 %:n varasääntö, **ei saa muuttua** |

Kaikki `orderType: 3`, `famAssetCost: null`, `famDeprStartDate: null`, `existingRatePct: null`,
`prolongationMonths: 0`.

Lisäksi kaksi virhetestiä:

- `originalSubscEndDate: null` → `ok: false`, syy mainitsee `custrecord_sta_subsc_org_end_date`
- `icRedemptionDate` ennen `icSaleDate`:ä → `ok: false`

Ja yksi rajaustesti: sama rivi `orderType: 1` → kulkee vanhaa polkua (`termEndSource`
= `ignored-mid-termination`).

### Prototyypin tulos 29.10.2026

Korjattu kirjasto ajettiin yllä olevilla 10 rivillä: **10/10 täsmää taloustiimin lukuun sentilleen**,
nykyinen tuotantokoodi **2/10** (vain kauden lopun tapaukset). Koko nykyinen testisarja:
**97/97 läpi**.

## 5. Vaikutus tuotannossa ja takautuva korjaus

Kesken kauden lunastettuja OOMI-pyöriä ilman FAM-omaisuuserää on **240**
(`custrecord_gbb_ic_redemption_pr` kirjoitettu, ei `-1`). Ne jakautuvat kahtia
`custrecord_gbb_ic_redemption_done`-lipun mukaan:

| `done` | Tilanne | Pyöriä | Erotus |
|---|---|---|---|
| **F** | alihinnoiteltu | **103** | **43 074,57 €** |
| T | täsmää jo nyt (korjattu aiemmin importilla) | 109 | 0,00 € |
| T | ylihinnoiteltu | 21 | −1 467,56 € |
| T | alihinnoiteltu | 7 | 3 394,20 € |

**`done = F` (103 pyörää) on turvallinen eräkorjaus.** Koska `getInputData` vaatii
`custrecord_gbb_ic_redemption_pr IS NULL`, skripti ei laske niitä uudelleen itsestään. Kun korjaus on
tuotannossa, tyhjennä näiltä 103:lta hintakenttä CSV-importilla ja anna skriptin laskea uudelleen.
Tämä on ainoa tapa, joka pitää skriptin ainoana totuuden lähteenä.

**`done = T` (137 pyörää) ei ole skriptikysymys.** IC-lunastus on jo käsitelty, joten 21 ylihinnoitellun
ja 7 alihinnoitellun oikaisu on taloustiimin päätös. Niiden hintakenttää **ei** saa tyhjentää.

Järjestys:

1. Koodimuutos + testit `netsuite-ic-calculators`-repossa, `npm test` vihreänä.
2. Vie tiedostot File Cabinetiin / SDF:llä. Dry run -tilaa skriptissä ei ole, joten aja ensin
   yhdellä pyörällä ja vertaa `scriptnote`-lokin `rentMonths`- ja `periodsElapsed`-arvoja
   kohdan 4 taulukkoon.
3. Tyhjennä `custrecord_gbb_ic_redemption_pr` niiltä 103:lta (`done = F`) ja aja skripti.
4. Todenna: aja kohdan 6 tarkistuskysely — eron pitää olla 0 kaikilla `done = F` -pyörillä.
5. Vie `done = T` -ryhmän 28 pyörää taloustiimille erillisenä listana.

## 6. Tarkistuskysely korjauksen jälkeen

```sql
SELECT done_flag, COUNT(*) AS lkm, ROUND(SUM(fin_price - ns_price),2) AS ero_eur
FROM (
  SELECT done_flag, ns_price,
    ROUND(net_cost - (net_cost - residual) * (POWER(1+rate/12, g-p) - 1) / (POWER(1+rate/12, g) - 1), 2) AS fin_price
  FROM (
    SELECT NVL(br.custrecord_gbb_ic_redemption_done,'F') AS done_flag,
      br.custrecord_gbb_ic_redemption_pr AS ns_price,
      ROUND(br.custrecord_gbb_ic_sale_price/1.255,2) AS net_cost,
      NVL(br.custrecord_sta_end_redemption_price, ROUND(br.custrecord_gbb_ic_sale_price/1.255*0.05,2)) AS residual,
      NVL(br.custrecord_gbb_interest_rate, 0.075) AS rate,
      MONTHS_BETWEEN(TRUNC(br.custrecord_sta_subsc_org_end_date,'MM'), TRUNC(br.custrecord_gbb_ic_sale_dt,'MM')) + 1 AS g,
      MONTHS_BETWEEN(TRUNC(br.custrecord_sta_subsc_org_end_date,'MM'), TRUNC(br.custrecord_gbb_ic_redemption_dt,'MM')) AS p
    FROM customrecord_sta_bike_register br
    WHERE br.custrecord_gbb_ic_redemption_dt IS NOT NULL AND br.isinactive = 'F'
      AND br.custrecord_sta_bike_order_type = 3 AND br.custrecord_sta_asset_id IS NULL
      AND br.custrecord_gbb_ic_sale_dt IS NOT NULL AND br.custrecord_gbb_ic_sale_price IS NOT NULL
      AND br.custrecord_gbb_ic_redemption_pr IS NOT NULL AND br.custrecord_gbb_ic_redemption_pr <> -1
      AND MONTHS_BETWEEN(TRUNC(br.custrecord_sta_subsc_org_end_date,'MM'), TRUNC(br.custrecord_gbb_ic_redemption_dt,'MM')) > 0
  )
) GROUP BY done_flag ORDER BY 1
```

Tämä muoto on ajettu ja todennettu 29.10.2026 (tulos: `F` 103 / 43 074,57 €, `T` 137 / 1 926,64 €).

**Hyväksymiskriteeri:** `done_flag = 'F'` → `ero_eur` = 0,00 ja `lkm` = 103.

## 7. Tämän muutoksen ulkopuolelle jäävät

> [!CAUTION]
> **Korjattu 30.10.2026: alla oleva rivi FAM-pyöristä oli väärä, ja se ohjasi rajauksen pieleen.**
> Väite "FAM-omaisuuserälliset kulkevat vanhaa polkua, jossa `famDeprStartDate` on todellinen poiston
> alku" pitää paikkansa vain siltä osin, että `netCost` ja `leaseStartDate` luetaan FAM:ista oikein.
> Poiston **alkupäivä** siirtyy silti `subsc_start`iin, koska `resolveTermEndDate` palauttaa `null`.
> Sama kaksoispoisto esiintyy siis 20 FAM-pyörällä, joilla poiston alku on myöhemmin kuin
> `subsc_start` (T86, [`findings/2026-10-30-ic-lunastushinta-oomi-fam-hankinta.md`](../findings/2026-10-30-ic-lunastushinta-oomi-fam-hankinta.md)).
> Haaran ehto on 30.10.2026 alkaen `orderType === 3 && hankintapäivä > subsc_start`, ei "ei FAM-omaisuuserää".
> **Menetelmävirhe:** vaikutusanalyysi rajattiin korjauksen ehdolla (`asset_id IS NULL`) eikä oireella,
> jolloin kysely vahvisti oman rajauksensa.

| Asia | Miksi ei tässä |
|---|---|
| **B044311:n jäännösarvo** (rekisteri 193,70 vs talous 392,83) | Kentän arvo, ei laskenta. Taloustiimin päätös. |
| **Jäännösarvon varasääntö 5 % vs 1 %** (B046521) | `RESIDUAL_RATE`-vakio, sopimuskysymys. Jos talous vahvistaa 1 %:n, se on oma muutoksensa. |
| **158 pyörää joilla hinta `-1`** | Ei `ic_sale_dt`:tä eikä FAM-omaisuuserää → `resolveAssetCost` heittää. Oma selvityksensä, osin `findings/2026-10-27-ic-hinnat-tarkistuslista.csv` ryhmä A. |
| **2 752 FAM-omaisuuserällistä kesken kauden -pyörää** | Kulkevat vanhaa polkua, jossa `famDeprStartDate` on todellinen poiston alku. Ei kosketa — ja juuri siksi haara rajataan tilaustyyppiin 3. |
| **Ei-OOMI-pyörät ilman FAM-omaisuuserää mutta `ic_sale_dt` asetettuna** | Näitä on olemassa, mutta **yhtään ei ole kesken kauden -tilanteessa** (todennettu 29.10.2026), joten rajaus OOMI vs. "ei FAM + ic_sale_dt" ei muuta nykydatalla mitään. Jos tällainen pyörä ilmaantuu, sääntö on vahvistettava erikseen. |
