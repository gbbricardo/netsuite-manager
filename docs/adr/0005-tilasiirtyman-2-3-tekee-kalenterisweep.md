# ADR 0005 — Siirtymän 2 → 3 tekee kalenterisweep status-syncissä

- **Päivämäärä:** 2026-09-20
- **Tila:** Hyväksytty
- **Koskee:** `netsuite-bike-redemption-status-sync`, `handler_lunastus.js`,
  [kenttäsäännöt §4](../lunastuksen-kenttasaannot.md), [ADR 0002](0002-kaksi-ankkuria.md)

## Konteksti

[Kenttäsäännöt §4](../lunastuksen-kenttasaannot.md) sanoo siirtymästä 2 → 3 (lunastus sovittu →
lunastettu): *"Siirtymän saa tehdä **mikä tahansa** kirjoittaja kunhan ehto täyttyy. Omistajuutta
ei rajoiteta."*

Muotoilu on oikea periaatteena ja harhaanjohtava käytännössä. **"Mikä tahansa kirjoittaja" on
tällä hetkellä ei kukaan.** Molemmat statuksen kirjoittajat laukeavat *tapahtumasta*:

| Kirjoittaja | Laukaisija |
|---|---|
| `handler_lunastus.js` | CR:n käsittely |
| `gbb_ss_bike_redemption_status_sync.js` | maksun tai laskun saapuminen ±5 vrk ikkunaan |

Tunnistuspäivä ei ole tapahtuma vaan **kalenteripäivä**. Se koittaa ilman että mitään tapahtuu, ja
siksi yksikään tapahtumavetoinen skripti ei havaitse sitä.

### Mitä tämä olisi maksanut

Mitattu NetSuitesta 20.09.2026, Done-tilaiset Type 2/7 CR:t joilla on sekä sulkemispäivä että
vanhan sopimuksen päättymispäivä (1 668 kpl):

| | kpl | osuus |
|---|---|---|
| Vuokrakausi päättyy käsittelyn jälkeen | 1 666 | 99,9 % |
| **Tunnistuspäivä tulevassa kuukaudessa käsittelyhetkellä** | **1 599** | **95,9 %** |

Jos `handler_lunastus.js`:ään lisätään statusportti ilman että mikään tekee siirtymää myöhemmin,
**96 % lunastuksista jää pysyvästi tilaan Active** — CR on Done eikä sitä yritetä uudelleen, ja
laskutus jatkuu ikuisesti. Se on pahempi virhe kuin nykyinen liian aikainen päättyminen, jota
sääntödokumentti on kirjoitettu korjaamaan.

Nykyinen liian aikainen kirjoitus on siis ollut *toimiva* virhe: se on ainoa asia joka ylipäätään
kirjoittaa statuksen näille pyörille.

## Vaihtoehdot

**A. Uusi Scheduled Script pelkkää sweepiä varten.** Selkeä vastuu, mutta lisää **neljännen**
pyörän statuksen kirjoittajan tilille jolla niitä on jo kolme (handler, status-sync, käsin).
Hylätty.

**B. Sweep osaksi `gbb_ss_bike_redemption_status_sync.js`:ää.** Valittu.

**C. Sweep kuukausiraportointiin.** Hylätty samasta syystä kuin [ADR 0004](0004-paatospaivan-kirjoittaa-ue.md):
repo on lukija, ja pyörärekisterin kirjoittajan sijoittaminen sinne kääntäisi sen roolin.

## Päätös

**Kalenterisweep lisätään `gbb_ss_bike_redemption_status_sync.js`:ään.** Se ei ole uusi vastuu
vaan skriptin nykyisen vastuun puuttuva puolisko: se vastaa jo siitä *milloin pyörästä tulee
Redeemed maksun ja kalenterin perusteella*.

Skripti jakautuu kahteen erilliseen osaan:

| Osa | Lähde | Tehtävä |
|---|---|---|
| **A. Maksuhavainto** *(on jo)* | maksupyynnöt + laskut, ±ikkuna | `custrecord_gbb_redemption_paid_at`, selvitystapa 1 |
| **B. Kalenterisweep** *(uusi)* | **pelkkä pyörärekisteri** | `saakoMerkitaPaattyneeksi` → `kohdestatus(method)` |

**Statuksen kirjoitus siirtyy kokonaan osaan B.** Kun kirjasto päättää statuksen, päätös ei enää
tarvitse maksudataa — vain pyörärekisterin kuutta kenttää. Maksukyselyitä tarvitaan yhä siihen
mitä vain ne osaavat kertoa.

### Seuraus: kolme suunnitelman avointa riviä ratkeaa samalla

Toteutussuunnitelman vaiheen 2 status-sync-kohdat eivät olleet erillisiä korjauksia vaan saman
muutoksen osia. Kun statuspäätös siirtyy kirjastolle, seuraavat käyvät **kuolleiksi**:

- `MATCH_WHERE_SQL`, `matchParams` ja `row.statusDue` — kirjasto korvaa predikaatin
- `COALESCE(sub.overridedate, sub.subscenddate, sub.eventdate)` — **maksupäivä-fallback poistuu
  itsestään**, koska aikataulupäivää ei enää lasketa siellä. Tämä oli sääntödokumentin §2:n
  nimeämä rikkomus jota ei voitu korjata ilman kirjastoa.
- `subscenddate`-sarakkeen `so_type`-ehdollisuus, joka oli syy siihen miksi keskenkauden lunastus
  putosi aina fallbackiin

### Kandidaattijoukko ja mittakaava

Sweepin kysely on `custrecord_sta_bike_status = 1 AND custrecord_gbb_liab_settle_method IS NOT NULL`
— tila *lunastus sovittu*. Tänään **82 pyörää** (todennettu 20.09.2026). Kirjoituksia tulee vain
niille joiden tunnistuspäivä on koittanut. Kuunvaihteessa tulee piikki kun kokonainen erä
päättymiskuukausia alkaa; mittaluokka on kymmeniä, mikä on Scheduled Scriptin governancelle
olematon. Joukko kasvaa kun handlerin statusportti otetaan käyttöön.

### Ajojärjestys

Sweep on **handlerin statusportin esiehto**, ei sen jälkiasennus:

1. Sweep tuotantoon ja todennettuna
2. Vasta sitten `handler_lunastus.js`:n statusportti

Päinvastaisessa järjestyksessä syntyy se 96 %:n pysyvä Active-tila.

## Seuraukset

**Hyvät.** Tunnistuspäivä tulee havaituksi. Kolme suunnitelman avointa riviä ratkeaa yhdellä
muutoksella. Statuksen kirjoitus on yhdessä paikassa ja yhden säännön takana, jolloin
[§6:n](../lunastuksen-kenttasaannot.md) tavoite "ajojärjestyksellä lakkaa olemasta merkitystä"
toteutuu myös käytännössä.

**Huonot.** Iso muutos tuotantoskriptiin jolla ei ole testiajuria. Skriptin identiteetti laajenee
maksuvetoisesta kaksiosaiseksi, mikä on luettava sen dokumentaatiosta eikä nimestä.

**Riski.** Sweep on ainoa asia joka kääntää statuksen tilasta 2 tilaan 3. Jos se lakkaa toimimasta,
pyörät jäävät Activeksi hiljaa — talon tyypillinen vikatila. Mittari on kandidaattijoukon koko: jos
se kasvaa jatkuvasti eikä koskaan pienene, sweep ei kirjoita.

```sql
SELECT COUNT(*) FROM customrecord_sta_bike_register
WHERE custrecord_sta_bike_status = 1 AND custrecord_gbb_liab_settle_method IS NOT NULL
```

## Todennettu vs. päätelty

**Todennettu NetSuitesta 20.09.2026:** 1 668 / 1 666 / 1 599; kandidaattijoukko 82.
**Todennettu koodista 20.09.2026:** molempien kirjoittajien laukaisijat; `MATCH_WHERE_SQL`:n ja
aikataulupäivän riippuvuudet.
**Päätelty:** kuunvaihteen piikin mittaluokka.
