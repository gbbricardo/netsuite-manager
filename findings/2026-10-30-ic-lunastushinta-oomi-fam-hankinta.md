# IC-lunastushinta: FAM-omaisuuserällinen hankittu OOMI-pyörä saa poistonsa väärältä aikajanalta

**Päivä:** 30.10.2026 · **Omistava repo:** `netsuite-ic-calculators` ·
**Tiedostot:** `src/lib/gbb_ic_redemption_calculator.js`, `src/gbb_ic_redemption_price_mr.js` ·
**Skripti:** `customscript_gbb_ic_redemption_pr` (sisäinen id **1430**), deployment `customdeploy_gbb_ic_redemption_pr` (Not Scheduled)

Tämä löydös **oikaisee rajauksen**, joka tehtiin eilisessä korjauksessa
([`findings/2026-10-29-ic-lunastushinta-oomi-ei-fam.md`](2026-10-29-ic-lunastushinta-oomi-ei-fam.md),
[`docs/ic-calculators-oomi-poistoaika-tyoohje.md`](../docs/ic-calculators-oomi-poistoaika-tyoohje.md)).
Eilinen korjaus on oikea ja tuotannossa, mutta sen haaran ehto rajattiin pyöriin **joilla ei ole
FAM-omaisuuserää**. Rajaus oli väärä: sama vika esiintyy myös FAM-omaisuuserällisillä pyörillä,
ja ne jäivät sekä korjauksen että alkuperäisen vaikutusanalyysin ulkopuolelle.

Työohjeen § 7 väittää: *"2 752 FAM-omaisuuserällistä kesken kauden -pyörää — kulkevat vanhaa polkua,
jossa `famDeprStartDate` on todellinen poiston alku. Ei kosketa."* **Väite on osittain väärä** ja
on syytä lukea tämän löydöksen kanssa.

---

## 1. Mikä on vialla

Hankitulla OOMI-pyörällä laskenta ottaa kustannuksen **hankintahetkestä** mutta jaksottaa sen
**tilauksen alusta**. Nämä ovat eri aikajanoja, ja erotus on puhdasta kaksoispoistoa: pyörä saa
poistoa ajalta, jolloin se ei ollut GoByBiken omistuksessa.

Ketju on sama kuin eilisessä löydöksessä, mutta se laukeaa eri reittiä:

1. `resolveAssetCost` ottaa `netCost`:n FAM:in `custrecord_assetcost`-kentästä — **oikein**.
2. `resolveLeaseStartDate` ottaa poiston alun FAM:in `custrecord_assetdeprstartdate`-kentästä — **oikein**.
3. `resolveTermEndDate` vertaa `custrecord_sta_subsc_end_date`ä arvoon `leaseStart + rentMonths`.
   Hankitulla pyörällä `custrecord_sta_bike_rent_months` on **koko alkuperäinen Oomi-kausi**, joten
   summa ylittää todellisen päättymisen vuosilla → luokittuu `ignored-mid-termination` → palauttaa `{ value: null }`.
4. `resolveAmortizationStartDate` saa ehdon `residualResult.wasOverride && !termEndResult.value` = true
   ja **siirtää poiston alun** `custrecord_sta_subsc_start_date`:en — eli kumoaa kohdan 2.
5. `rentMonths` jää alkuperäiseksi, joten myös `nper` on väärästä aikajanasta.

**Molemmat päät ovat väärin ja osin kumoavat toisensa** (liian aikainen alku kasvattaa poistoa,
liian pitkä `nper` pienentää sitä). Siksi virhe on satoja euroja eikä tuhansia — ja siksi se ei
erotu summatasolla.

---

## 2. Todennus — B041395

Tuotannon kirjasto ajettuna pyörän oikeilla kentillä. **Tallennettu hinta toistui sentilleen**,
joten kyse ei ole arviosta:

```
isAcquiredOomiLease   : false          <- eilinen haara ei osu
netCost               : 2143.33        (netCostSource: FAM)
leaseStartDate        : 01.05.2026     <- oikein
amortizationStartDate : 01.04.2025     <- SIIRRETTY subsc_start:iin
termEndSource         : ignored-mid-termination
rentMonths            : 56             (oikein 43)
periodsElapsed        : 19             (oikein 6)
redemptionPrice       : 1507.63        = tallennettu arvo
```

### Rekisteri ja omaisuuserä

| Kenttä | Arvo |
|---|---|
| `custrecord_sta_bike_order_type` | 3 (OOMI) |
| `custrecord_sta_asset_id` | 36919 |
| `custrecord_gbb_ic_sale_dt` / `_pr` | **tyhjä** — hankinta on kirjattu FAM:iin |
| `custrecord_sta_subsc_start_date` | 01.04.2025 |
| `custrecord_sta_subsc_org_end_date` | 30.11.2029 |
| `custrecord_sta_bike_rent_months` | 56 |
| `custrecord_gbb_ic_redemption_dt` | 31.10.2026 |
| FAM `custrecord_assetpurchasedate` | **23.04.2026** |
| FAM `created` | 08.05.2026 |
| FAM `custrecord_assetdeprstartdate` | **01.05.2026** |
| FAM `custrecord_assetcost` / `custrecord_assetcurrentcost` | **2 143,33 / 2 143,33** |
| FAM `custrecord_assetlifetime` | **43** |
| FAM `custrecord_assetresidualvalue` | 31,33 |

`assetcost` ja `assetcurrentcost` ovat sama luku, eli omaisuuserällä **ei ole kertynyttä poistoa
ennen 01.05.2026**. 2 143,33 € on siis pyörän arvo hankintahetkellä, ei vuoden 2025 alkuperäishinta.
Laskenta ajaa sitä vastaan 19 kuukauden poiston alkaen 01.04.2025 — **13 kuukautta ennen ostopäivää**.

### Oikea hinta

`nper` = `monthsInclusive(01.05.2026, 30.11.2029)` = **43**, `periodsElapsed` = 6 →
**1 881,48 €** (nykyinen 1 507,63 €, alihinnoiteltu **373,85 €**).
**Tuoteomistaja vahvisti 1 881,48 € oikeaksi 30.10.2026.**

> [!TIP]
> **FAM vahvistaa `nper`:n riippumattomasti.** `custrecord_assetlifetime` = 43 = tasan
> `monthsInclusive(depr_start, subsc_org_end)`. Tämä pätee **21/21** kesken kauden lunastetulla
> FAM-OOMI-pyörällä. FAM:in `custrecord_assetdeprenddate` sen sijaan vastaa `subsc_org_end`iä vain
> **2/20** — päivätason ero on poistokonvention, ei sopimuksen. `nper` lasketaan siis
> `subsc_org_end`istä kuukausiankkurilla, ja `lifetime` toimii tarkistuksena.

---

## 3. Miksi eilinen rajaus meni pieleen

Eilinen ehto: `orderType === 3 && !famAssetCost && !famDeprStartDate && !!icSaleDate`.

Perusteluna oli, että FAM-pyörillä `famDeprStartDate` on jo oikea poiston alku. **Väite pitää
paikkansa `leaseStartDate`:sta — ja juuri siksi se harhautti.** Vika ei ole ankkurissa vaan siinä,
että `resolveTermEndDate`:n `null` ohittaa sen (ketjun kohta 4).

Erotteleva ehto ei ole *"ei FAM-omaisuuserää"* vaan **"hankinta on myöhemmin kuin tilauksen alku"**:

```
orderType === 3 && leaseStartDate > originalSubscStartDate
```

`leaseStartDate` on jo `resolveLeaseStartDate`:n ratkaisema (FAM:in poiston alku jos on, muuten
`ic_sale_dt`), joten yksi ehto kattaa molemmat joukot.

**Menetelmävirhe, joka kannattaa muistaa:** eilinen vaikutusanalyysi rajasi kyselyn ehdolla
`custrecord_sta_asset_id IS NULL`, koska korjauskin oli rajattu niin. Mittaus siis vahvisti oman
rajauksensa eikä voinut paljastaa sen ulkopuolelle jäävää joukkoa. Vaikutusanalyysi on tehtävä
**oireen** (väärä poiston aikajana) eikä **korjauksen rajauksen** perusteella.

---

## 4. Laajuus

Rajaus: tilaustyyppi 3, FAM-omaisuuserä olemassa, `custrecord_assetdeprstartdate` **myöhemmin kuin**
`custrecord_sta_subsc_start_date`, lunastuskuukausi ennen `subsc_org_end`in kuukautta, hinta
kirjoitettu eikä `-1`. **20 pyörää**, kaikilla poiston alku 01.05.2026.

**Muita tilaustyyppejä kuin 3 ei tässä tilanteessa ole yhtään** (todennettu 30.10.2026), joten
haaran rajaaminen OOMI-pyöriin ei jätä nykydatalla mitään ulkopuolelle.

### `custrecord_gbb_ic_redemption_done = F` — 12 pyörää, 4 337,29 €

| Lunastuspäivä | Pyöriä | Ero | Pyörät |
|---|---|---|---|
| 31.05.2026 | 1 | 0,00 € | B046522 |
| 30.06.2026 | 1 | 183,13 € | B040697 |
| 31.08.2026 | 2 | 938,01 € | B038940, B042269 |
| 30.09.2026 | 3 | 1 322,01 € | B043876, B045671, B046250 |
| **31.10.2026** | **3** | **1 015,02 €** | **B039621, B041395, B042663** |
| 30.11.2026 | 2 | 879,12 € | B041336, B043704 |

Kaikki alihinnoiteltuja. B046522:n ero on 0,00 €, koska sen hankinta (01.05.2026) osuu käytännössä
tilauksen alkuun (21.04.2026) — silloin aikajanat eivät eroa eikä kaksoispoistoa synny.

> [!IMPORTANT]
> **B041336 ja B043704 (30.11.2026) eivät ole vielä toteutuneet.** Niiden korjaaminen ennen
> marraskuun ajoa estää virheellisen laskun sen sijaan että oikaisisi sellaisen jälkikäteen.

### `done = T` — 8 pyörää, netto −138,58 €

B037882, B039286, B039536, B039952, B040233, B042237, B043690, B045683. Kaikilla lunastuspäivä
31.05.–31.08.2026. Neljä täsmää jo, kolme ylihinnoiteltu, yksi alle. **IC-lunastus on jo käsitelty,
joten näiden hintakenttää ei saa tyhjentää** — oikaisu on taloustiimin päätös, kuten eilisessäkin
löydöksessä.

---

## 5. Suhde eiliseen korjaukseen

Eilen korjatut **103** pyörää ovat **eri joukko** eikä niihin kosketa: niillä ei ole
FAM-omaisuuserää ja hankinta tulee `custrecord_gbb_ic_sale_dt`:stä. Ne kulkevat laajennetun ehdon
läpi samoin kuin ennenkin (`leaseStartDate` = `ic_sale_dt` 01.05.2026 > `subsc_start` 2021–2025),
eivätkä hinnat saa muuttua sentilläkään. Tämä on laajennuksen tärkein regressiotesti.

Yhteenlaskettuna hankittujen OOMI-pyörien kesken kauden lunastukset:

| Joukko | Pyöriä | Tila |
|---|---|---|
| Ei FAM, `ic_sale_dt` asetettu | 103 (`done = F`) | **korjattu 29.10.2026**, ero 0,00 € |
| Ei FAM, `done = T` | 137 | taloustiimille, 1 926,64 € |
| **FAM, hankinta > tilauksen alku, `done = F`** | **12** | **tämä löydös, 4 337,29 €** |
| FAM, hankinta > tilauksen alku, `done = T` | 8 | taloustiimille, −138,58 € |

---

## 6. Mikä on varmistettu ja mikä pääteltyä

**Todennettu NetSuitesta tai tuotannon kirjastolla ajamalla:**

- B041395:n tallennettu hinta 1 507,63 € toistuu kirjastolla sentilleen, ja `amortizationStartDate`
  on 01.04.2025 `SIIRRETTY`-lipulla.
- FAM:in kaikki kentät (SELECT * omaisuuserästä 36919).
- `custrecord_assetlifetime` = `monthsInclusive(depr_start, subsc_org_end)` 21/21.
- `assetcost = assetcurrentcost` 20/20; rekisterin jäännösarvo = FAM:in residual 19/20.
- 20 pyörän populaatio, erot ja jakauma lunastuspäivittäin.
- Ei muita tilaustyyppejä kuin 3 tässä tilanteessa.

**Pääteltyä koodista, ei vielä ajettu tuotannossa:**

- Että laajennettu ehto `leaseStartDate > originalSubscStartDate` riittää eikä riko eilisiä 103:a.
  Tämä on varmistettava testisarjalla ja pilottiajolla, ei oletettava.

**Avoinna:** yksi rekisterin jäännösarvo poikkeaa FAM:in residualista (1/20) — ei selvitetty.
