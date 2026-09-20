# Vaihe 3 sovelsi ADR 0002:ta väärin päin — ja RI-luonti ei lue poikkeuspäättymispäiviä

**Päivämäärä:** 2026-09-19 · **Tila:** ensimmäinen kohta ratkaistu, toinen avoin

## 1. Ei ristiriitaa ankkureiden välillä — suunnitelma oli väärässä

Alkuperäinen löydös väitti, että `gbb_lunastus_lib.tunnistuspaiva` ja
`mr_monthly_reporting_ri_creation.js:1003` ovat ristiriidassa, koska ne eroavat kuukaudella kesken
kuuta päättyvällä pyörällä. **Väite oli väärä.** Ne ovat [ADR 0002](../docs/adr/0002-kaksi-ankkuria.md):n
kaksi ankkuria, ja niiden kuuluukin erota:

| Ankkuri | Kaava | Ohjaa | Vuokrakausi päättyy 15.10.2026 |
|---|---|---|---|
| Sopimusankkuri | `reportingDate > päättymisajankohta` | laskutus, raportointi, `ic_redemption_dt` | Ended-rivi **01.11.** |
| Operatiivinen ankkuri | `MAX(kuun 1. pv, tänään)` | `bike_status`, `date_to_non_active` | status 2 saa vaihtua **01.10.** |

Lokakuu on yhä veronalaista etua, joten lokakuun RI-rivi on normaali rivi ja Ended-rivi on
marraskuun. Status saa silti olla Redeemed jo 01.10. Molemmat ovat oikein omalla alueellaan
(tuoteomistajan vahvistus 19.09.2026).

**Virhe oli [toteutussuunnitelman](../docs/lunastus-toteutussuunnitelma.md) vaiheessa 3**, joka
määräsi `isEndedBike` → `saakoMerkitaPaattyneeksi`. Se olisi tuonut operatiivisen ankkurin
raportointiin ja pudottanut lokakuun rivin jokaiselta kesken kuuta päättyvältä pyörältä (8 427 kpl).
Suunnitelma on korjattu.

### Mitä vaiheessa 3 tehdään sen sijaan

Sääntödokumentin §6 vaatimus on, että RI-luonti lakkaa lukemasta `bike_status`-kenttää — perustelu
(*"statuksen kirjoitushetki vaikuttaa raportointiin ja kaksi ajoa kilpailee saman päivän sisällä"*)
pätee yhä. Korvaava ehto rakennetaan **sopimusankkurista**, jolloin ajoitus säilyy ennallaan:

```js
// ei:   bikeStatus === REDEEMED || bikeStatus === RETURNED || liabSettledAndPeriodOver
// vaan: onkoVelvoitteetHoidettu(bike).hoidettu && reportingDate > paattymisajankohta(bike)
```

`saakoMerkitaPaattyneeksi` ja `tunnistuspaiva` eivät kuulu tähän skriptiin lainkaan.

## 2. Avoin: RI-luonti ei lue kumpaakaan poikkeuspäättymispäivää

Todennettu koodista 19.09.2026. RI-luonnin `bike.endDate` tulee yhdestä ainoasta kentästä:

```js
subscEnd: 'custrecord_sta_subsc_end_date',            // :73
endDate:  resultCol(result, BIKE.subscEnd),           // :910
```

`custrecord_gbb_exceptional_end_date` ja `custrecord_gbb_oomi_exceptional_end_date` eivät esiinny
tiedostossa lainkaan — eivät myöskään `processOomiEndOverride`:ssa (`:781-804`), joka vertaa
`bike.endDate`:a nykyhetkeen. Sääntödokumentin §2 COALESCE-ketju sanoo, että poikkeuspäivät
**ohittavat** `subsc_end_date`:n.

Todennettu NetSuitesta 19.09.2026:

| | kpl |
|---|---|
| `custrecord_gbb_oomi_exceptional_end_date` asetettu | 222 |
| …joista arvo **eroaa** `custrecord_sta_subsc_end_date`:sta | **30** |
| …joista yhä bike status Active | 14 |

Niillä 30:llä RI-luonti päättää vuokrasuhteen väärästä päivästä. Määrä on pieni mutta kyseessä on
palkanpidätys, eikä virhe näy missään — kumpikin päivä on kelvollinen päivämäärä.

`paattymisajankohta(bike)`:n käyttöönotto kohdassa 1 korjaa tämän sivutuotteena, mutta vaatii että
molemmat poikkeuskentät lisätään RI-luonnin pyörärekisterihakuun (`:831`).

## Todennettu vs. päätelty

**Todennettu koodista 19.09.2026:** molemmat ehdot ja kenttäkartat rivinumeroineen.
**Todennettu NetSuitesta 19.09.2026:** 222 / 30 / 14.
**Vahvistettu tuoteomistajalta 19.09.2026:** molemmat ankkurit ovat oikein; RI-luonnin Ended-rivin
raportointipäivä on esimerkkitapauksessa 01.11.2026.
**Aiemmin todennettu:** 8 427 kesken kuuta päättyvää (sääntödokumentti §3).
