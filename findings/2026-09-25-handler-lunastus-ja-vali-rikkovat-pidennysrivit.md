# Löydös: `handler_lunastus.js` ja `handler_vali.js` rikkovat huoltopidennysrivejä

**Päivä:** 25.09.2026
**Havaittu:** pyörä B030614 (agreement A000038) — laajennettu koko tiliin.
**Omistava repo (korjaus tehdään siellä, ei tässä):** `netsuite-subscrption-cr-scripts`,
`src/FileCabinet/SuiteScripts/cr-processor/handler_lunastus.js` ja `handler_vali.js`.
**Tila:** ei laskutuksena vielä laajasti realisoitunut (ks. §4), mutta ikkuna kapenee — osa jo ajettu.

## 1. Yhteenveto

Kaksi eri CR-käsittelijää sulkevat pyörän sopimusrivejä leimaamalla CR:n oman
`custrecord_cr_end_date_of_old_sub`-päivän riville loppupäiväksi, **tarkistamatta onko tämä päivä
ennen rivin omaa alkupäivää**. Kun pyörällä on huollon aiheuttama pidennysrivi
(`custrecord_sta_is_prolongation_line = T`) joka alkaa vasta tulevaisuudessa, käsittelijä silti
sulkee sen — ja tuloksena on sopimusrivi jonka **alkupäivä on loppupäivän jälkeen** (looginen
mahdottomuus, koodattu tässä dokumentissa lyhenteellä K1).

Koko tililtä löytyi **70 pyörää** joilla tämä K1-rikkoutuma esiintyy `is_prolongation_line = T`
+ tyhjä laskutushistoria -allekirjoituksella (eli rikkoutuma ei ole vielä koskaan laskutettu).
Kahdella niistä (B030614, B032001) käsittelijä myös **kloonasi** rikkoutuneen rivin lisäksi
alkuperäisen, ei-pidennetyn rivin samalle kaudelle → **kaksi identtistä aktiivista vuokrariviä
samalle ajanjaksolle** (D1, tuplavuokran mekanismi).

| Juurisyy | Käsittelijä | CR-tyyppi | Pyöriä | Tuottaa myös duplikaatin? |
|---|---|---|---|---|
| Sulkee kaikki aktiiviset rivit `end_date_of_old_sub`:iin, ei tarkista rivin omaa alkupäivää eikä `is_prolongation_line`:ää | `handler_lunastus.js` | 2 (Keskenkauden lunastus) | **66** | Ei — ei kloonaa lainkaan |
| Sama virhe, mutta kloonaa myös suljetut rivit uudeksi post-pause-riviksi | `handler_vali.js` | 3 (Välikuukaudet) | **2** (B030614, B032001*) | **Kyllä** |
| Rikkinäinen rivi, mutta CR:n omat `cr_start_date`/`cr_end_date`-kentät ovat itsessään ristiriitaiset (`cr_end_date` < `cr_start_date`) — eri, todennäköisesti CR-datan syöttövirhe, ei sama koodipolku | `handler_konserni.js` | 9 (Siirto konserni) | 1 (B008278) | Ei tutkittu tässä — **vaatii erillisen CR-datan tarkistuksen** ennen kuin tätä lasketaan samaksi bugiksi |
| Ei löytynyt korreloivaa CR:ää — rivi koskematon luonnista asti | — | — | 1 (B022319) | Ei sovellu |
| Toinen rivi parista sai lisäkosketuksen 21.8. klo 15:5x, tunnistamaton prosessi | ? | ? | 4 (B004548, B013784, B025110, B027762 — vain parin toinen rivi) | Vaatii lisäselvitystä |

*B032001:n rikkoutunut rivi on `is_prolongation_line = F`, joten se ei ole tässä 70:n
K1-listassa — se löytyi erikseen duplikaattihaussa (D1). Sillä on kaksi peräkkäistä Done-tilaista
tyyppi 3 -CR:ää (5999 ja 6008), joista jälkimmäinen loi jo itsessään kaksoiskappaleen.

**`handler_siirto_ta.js` (tyyppi 1) ja edellä mainittu `handler_konserni.js` (tyyppi 9) on jo
korjattu pidennystietoisiksi** (idea-03, `docs/ideas/idea-03-konserni-maintenance-bikes-and-dupes.md`,
commit `9c80a18` ym.) — molemmat hakevat rivin oman `start_date`:n ja
`custrecord_sta_is_prolongation_line`:n, ja jättävät tulevaisuudessa alkavan pidennysrivin koskematta
(reparent-only-polku). **`handler_lunastus.js` ja `handler_vali.js` eivät koskaan saaneet tätä
korjausta**, vaikka kärsivät samasta rakenteellisesta ongelmasta.

## 2. Koodin todennus

### `handler_lunastus.js` (tyyppi 2) — rivit 408–430 ja 111–124

```js
// getAgreementRowsForBike(bikeId) — HAKEE VAIN internalid + current_end_date.
// Ei start_date, ei is_prolongation_line, ei enddate>=today-suodatinta.
filters: [
    ['custrecord_sta_bikeid', 'anyof', String(bikeId)],
    'AND',
    ['custrecord_sta_ca_row_status', 'anyof', '1']
],
columns: [ 'internalid', 'custrecord_sta_ca_row_license_enddate' ]
```

```js
// --- 3. Stamp end date on every agreement row ---
rows.forEach(function (row) {
    var currentEnd = row.current_end_date ? ... : null;
    if (!currentEnd || currentEnd > endDate) {
        record.submitFields({
            type: 'customrecord_sta_ca_agreement_row',
            id: row.id,
            values: { custrecord_sta_ca_row_license_enddate: endDate }
        });
    }
});
```

Jokainen bikeen liittyvä **aktiivinen** rivi (status=1), riippumatta omasta alkupäivästä tai
pidennyslipusta, saa `endDate`:n (`custrecord_cr_end_date_of_old_sub`) loppupäiväkseen, jos nykyinen
loppupäivä on tyhjä tai myöhempi. Tämä on käsitteellisesti oikein tavallisille riville (lunastus
päättää koko tulevan laskutuksen) — mutta jos rivi on huollon luoma pidennysrivi jonka oma
`startdate` on `endDate`:n *jälkeen*, tulos on rivi jonka alku > loppu.

### `handler_vali.js` (tyyppi 3) — rivit 109–143 ja 61–95

Sama puute: `getAgreementRowsForBike` ei hae `start_date`:a eikä `is_prolongation_line`:ää, ja
Phase 1 (sulje) + Phase 2 (kloonaa) käsittelevät jokaisen löytyneen rivin identtisesti, tarkistamatta
onko rivi jo pidennysrivi joka ei kuulu suljettavien/kloonattavien joukkoon. Kahden aktiivisen
item-30-rivin tapauksessa (alkuperäinen + pidennys) molemmat suljetaan ja molemmat kloonataan →
kaksi identtistä uutta riviä samalle kaudelle.

### Vertailukohta: `handler_konserni.js` (tyyppi 9), jo korjattu

```js
var isProlongation = (row.is_prolongation === 'T' || row.is_prolongation === true);
if (!startDate || startDate <= endDateOldSubNorm) {
    // close + clone
} else {
    // --- Reparent future (not-yet-started) row — no close, no clone ---
    record.submitFields({ ..., values: { custrecord_sta_ca_parent_agreement: newAgreementId } });
}
```

Tämä on malli jota `handler_lunastus.js`:n ja `handler_vali.js`:n pitäisi noudattaa.

## 3. Vaikutuksen laajuus (todennettu SuiteQL:llä 25.09.2026)

- **143 riviä / 70 pyörää**: `startdate > enddate`, `is_prolongation_line = T`,
  `custrecord_sta_ca_row_invoicehistory IS NULL` (ei koskaan laskutettu tätä riviä).
- **2 duplikaattiryhmää** (4 riviä): B030614/A000038 (rivit 80599/80600) ja B032001/A001880
  (kolme viallista item-30-riviä, joista kaksi ovat identtinen pari luotu samalla sekunnilla).
- Erikseen 120 riviä joilla `is_prolongation_line = F` ja historiakenttä `"[]"` (ei NULL) — **ei
  sovi tämän bugin allekirjoitukseen**, todennäköisesti eri, aiempi ilmiö (esim. tuontiprosessi) —
  **ei tämän löydöksen piirissä**, ei tutkittu tarkemmin.
- 16 riviä joilla `is_prolongation_line = F`, historia NULL, kausikuvio "kuun 1. → edellisen kuun
  viimeinen päivä" (off-by-one) — **ei tämän löydöksen piirissä**, eri kuvio, ei tutkittu tarkemmin.

Ei kirjoituksia NetSuiteen missään vaiheessa tätä selvitystä.

## 4. Laskutusvaikutus — kiireellisyysjärjestys

Kaikilla 70+2 pyörällä `custrecord_sta_ca_row_invoicehistory IS NULL` sekä viallisella että
duplikaattiriveillä — **tuplavuokra tai laskutuksen katkeaminen ei ole vielä näkynyt yhdelläkään
laskulla**. Mutta neljällä agreementilla laskutusmoottorin `date_next_invoice` on **jo mennyt**
(ajettu 27.08.2026, 35 päivän `invoice_advance`):

| Bike | Agreement | Causing CR | Next invoice | Ajo tehty? |
|---|---|---|---|---|
| B006813 | 1722 | 5200 (T2) | 2026-10-01 | **Kyllä** |
| B008278 | 5464 | 6387 (T9) | 2026-10-01 | **Kyllä** |
| B017866 | 3871 | 5119 (T2) | 2026-10-01 | **Kyllä** |
| B023031 | 3670 | 4867 (T2) | 2026-10-01 | **Kyllä** |

Näiden neljän kohdalla on tarkistettava **heti** manuaalisesti syntyikö marraskuun ajossa jo
katkennut/puuttuva laskurivi (rivi ei kata mitään tulevaa kautta, laskutusmoottori jättäisi bikea
laskuttamatta huomaamatta). Loput 66 agreementia laskutetaan 2026-11-01 (ajo 27.09.2026 — **kahden
päivän päässä tätä kirjoitushetkeä**), ja kaikkien 2 duplikaattiagreementin (30614, 32001) ajo on
vielä kauempana (helmi–maaliskuu 2027) — korjausikkuna on auki mutta kapenee nopeasti 66 bikelle.

## 5. Täysi lista — 70 K1-pyörää + 2 D1-duplikaattia

Ks. liite `2026-09-25-handler-lunastus-ja-vali-korjauslista.csv` samassa kansiossa: yksi rivi per
pyörä, sarakkeet `bike, agreement, causing_cr_id, causing_cr_type, end_date_of_old_sub,
cr_start_date, cr_end_date, service_fee_paused, cr_lastmodified, broken_row_ids, broken_row_span,
already_invoiced, notes`.

Huomioita listan luvuista:
- `cr_start_date`/`cr_end_date` ovat tyhjiä (`–`) tyyppi 2 -tapauksissa, koska Keskenkauden
  lunastus ei ole "tauko" vaan pysyvä sopimuksen päättyminen — näillä 66 pyörällä ei ole
  "tauon loppua", vain päättymispäivä (`end_date_of_old_sub`). Vain kaksi tyyppi 3 -tapausta
  (B008294, B030614) ja tyyppi 9 -tapaus (B008278) kantavat oikean resume-kauden.
- Bike-tunnukset (`B`+6-numeroa) on pääteltyä kaavaa, varmistettu 7 näytteestä 70:stä — loput
  johdettu samalla kaavalla bike register id:stä, **ei erikseen yksitellen varmistettu**.
- Neljän bikeen (B004548, B013784, B025110, B027762) parin toinen rivi sai lisäkosketuksen
  21.08.2026 klo 15:5x, tunnistamaton prosessi — ei selitetty tässä selvityksessä.

## 6. Korjausehdotus

### 6.1 `handler_lunastus.js` — ensisijainen (66/70 pyörää)

**Vahvistettu tuoteomistajan kanssa 25.09.2026:** kun `handler_lunastus.js` on käsitellyt pyörän,
mikään muu käsittelijä ei enää saa koskea siihen paitsi `handler_lisavelotus.js` ja
`handler_hyvitys.js` — lunastus on terminaali. Rivin sulkeminen `endDate`:iin (lunastuspäivä) on
tarkoituksella tehty myös menneisyyteen nähden, jotta mikään laskutusajo ei vahingossa laskuta
ennenaikaisesti päätettyä sopimusta — **tämä turva säilytetään sellaisenaan**. Korjaus koskee vain
niitä rivejä joiden oma kausi ei ole koskaan ehtinyt alkaa: ne on merkittävä sekä
**Closed-statukseen että inactive**, jotta mikään aktiivirivihaku (mukaan lukien tämän saman
käsittelijän seuraava ajo toiselle CR:lle) ei enää poimi niitä.

`getAgreementRowsForBike` (rivi ~408) tarvitsee lisäksi `custrecord_sta_ca_row_license_startdate`.
Sulkemisloopissa (rivi ~112) lisätään tarkistus ennen nykyistä kirjoitusta:

```js
rows.forEach(function (row) {
    var startDate  = row.start_date ? (row.start_date instanceof Date ? row.start_date : new Date(row.start_date)) : null;
    var currentEnd = row.current_end_date ? (row.current_end_date instanceof Date ? row.current_end_date : new Date(row.current_end_date)) : null;

    // Rivin kausi ei ole koskaan alkanut mennessä lunastuspäivänä (endDate). Se ei saa koskaan
    // päästä laskutukseen — Closed + inactive estää sen jokaisesta aktiivirivihausta.
    // endDate kirjoitetaan silti loppupäiväksi (turva muiden ajojen varalta, kuten ennenkin).
    if (startDate && startDate > endDate) {
        record.submitFields({
            type: 'customrecord_sta_ca_agreement_row',
            id: row.id,
            values: {
                custrecord_sta_ca_row_status: '2',
                isinactive: true,
                custrecord_sta_ca_row_license_enddate: endDate
            }
        });
        return;
    }

    if (!currentEnd || currentEnd > endDate) {
        record.submitFields({
            type: 'customrecord_sta_ca_agreement_row',
            id: row.id,
            values: { custrecord_sta_ca_row_license_enddate: endDate }
        });
    }
});
```

Tämä on tuoteomistajan vahvistama ratkaisu, ei enää avoin valinta.

### 6.2 `handler_vali.js` — toissijainen (2/70 + molemmat duplikaatit)

> **KORVATTU 25.09.2026 — ks. §8.** Alla oleva ehdotus aiheuttaisi tuplavuokran juuri niissä
> tapauksissa joihin se vetoaa. Lopullinen, sovittu korjaus on §8:ssa.

Sama lisähaku (`start_date`, `is_prolongation_line`), ja Phase 1 + Phase 2 rajataan
`handler_konserni.js`:n mallin mukaan koskemaan vain rivejä joiden `start_date <= closeDate`.
Riviä jonka oma alku on `closeDate`:n jälkeen (jo olemassa oleva pidennysrivi) **ei suljeta eikä
kloonata uudelleen** — se jää sellaisenaan, koska se jo edustaa tulevaa, oikeaa laskutuskautta eikä
Välikuukaudet-tauko voi olla siitä erillinen.

### 6.3 `handler_konserni.js` (tyyppi 9, B008278) — vaatii erillisen tarkistuksen

Tämän pyörän rikkoutuma näyttää syntyneen CR 6387:n omista kentistä
(`cr_end_date` < `cr_start_date`), ei samasta koodipolusta kuin 6.1/6.2 — käsittelijä on jo
pidennystietoinen. **Suositus:** tarkista CR 6387:n `custrecord_cr_start_date` ja
`custrecord_cr_end_date` käsin ennen kuin tätä lasketaan osaksi samaa korjauserää.

## 7. Suositellut välittömät toimet

1. Tarkista heti neljän jo-ajetun agreementin (1722, 5464, 3871, 3670) marraskuun laskut/rivit —
   onko laskutus jo hiljaa katkennut.
2. Harkitse tyyppi 2 -CR-ajastuksen (tai vähintään sen sulkemisvaiheen) keskeyttämistä kunnes
   `handler_lunastus.js` on korjattu — tämä on isompi ja aktiivisempi CR-virta kuin tyyppi 3.
3. Rakenna korjaus-CSV jokaiselle 70 bikelle vasta kun `handler_lunastus.js` on korjattu — älä
   korjaa rivejä käsin ennen koodikorjausta, tai seuraava tyyppi 2 -ajo samalle bikelle (esim.
   uusi lunastus-CR) toistaisi saman virheen.
4. Hälytä `ri-auditoija`: näiden 70 bikin seuraavan kuun RI-rivit lukevat rikkinäistä sopimusriviä.
5. Vahvista CR 6387:n (B008278) omat kenttäarvot erikseen ennen kuin se lasketaan mukaan samaan
   korjauserään kuin 6.1/6.2.

## 8. Lopullinen korjaus: `handler_vali.js` (sovittu tuoteomistajan kanssa 25.09.2026)

Korvaa §6.2:n. Päätetty läpikäynnissä (grilling-sessio, kysymykset Q1–Q14) koodin ja tuotantodatan
pohjalta. Kaikki alla oleva on lukukyselyillä todennettu 25.09.2026; NetSuiteen ei kirjoitettu.

### 8.1 Faktat jotka muuttivat §6.2:n

**§6.2 aiheuttaisi tuplavuokran.** Tyypin 3 CR:n `custrecord_cr_end_date` (tauon jälkeinen loppu) on
sopimuksen loppu *pidennys mukaan lukien*: 52/54 Done-tilaisessa tyypin 3 CR:ssä se on sama kuin
pyörärekisterin `custrecord_sta_subsc_end_date` ja rivien suurin loppupäivä, 0:ssa aiempi. Tauko ei
siis siirrä sopimuksen loppua, ja tauon jälkeinen klooni kattaa aina myös tulevan pidennyskauden.
Jos tuleva pidennysrivi jätetään ennalleen ja klooni ajetaan CR:n loppupäivään asti, ne menevät
päällekkäin:

| Pyörä | Klooni | Tuleva pidennysrivi (alkuperäinen kausi) | Päällekkäin |
|---|---|---|---|
| B008294 (CR 6694) | 116132: 01.06.2027–31.08.2028 | 69723: 01.07.2028–31.08.2028 | 07–08/2028 |
| B030614 (CR 5489) | 80600: 01.02.2027–30.06.2027 | 75547: 01.05.2027–30.06.2027 | 05–06/2027 |

**Pidennyslippua ei saa hävittää.** `[STA] UE Bike Register Hook`
(`netsuite-staria-suitescripts/sta_ue_bike_register_hook.js:1218–1284`,
`addProlongationOfSubscriptionPeriod`) laskee olemassa olevat pidennyskuukaudet aktiivisista
vuokrariveistä joilla `custrecord_sta_is_prolongation_line = T`, ja jos niitä on liian vähän, luo
uudet pidennysrivit ja käynnistää sisäisen laskun puuttuvista kuukausista. Tulevan pidennysrivin
merkitseminen Closed + inactive (kuten §6.1 tekee tyypille 2) saisi seuraavan huoltosumman muutoksen
pidentämään sopimuksen uudelleen ja laskuttamaan pidennyksen toiseen kertaan. Siksi tyypin 3 korjaus
ei voi noudattaa §6.1:n mallia.

**B032001:n juurisyy ei ole pidennysrivi.** Pyörällä ei ole yhtään pidennysriviä. Sille on kaksi
identtistä Done-tilaista tyypin 3 CR:ää (5999 ja 6008: 30.09.2026 / 01.01.2027 / 31.03.2028) — ainoa
tällainen pari tuotannossa. CR 5999 (28.08.) sulki rivin 39547 ja loi kloonin 115976. CR 6008 (31.08.)
löysi sekä 39547:n että kloonin 115976, sulki kloonin (alku 01.01.2027 > loppu 30.09.2026) ja kloonasi
molemmat → **116037 ja 116038, kaksi identtistä aktiivista vuokrariviä 01.01.2027–31.03.2028**.
Tämä on löydöksen ainoa todellinen tuplavuokra. Alkupäivään perustuva jako yksin ei olisi estänyt
sitä: toinen CR olisi kloonannut 39547:n uudelleen.

**B030614:n duplikaattia ei enää ole.** Riviä 80599 ei ole olemassa; jäljellä on vain 80600
(hinta 80.6458 = tulevan pidennysrivin 75547 klooni).

**Muut havainnot tyypin 3 CR:istä:** CR-1921:n tauon jälkeinen alku (01.04.2026) on ennen
sulkemispäivää (30.04.2026); CR-2945:n tauon jälkeinen alku (01.01.2027) on loppupäivän
(31.12.2026) jälkeen. Kolmella pyörällä (18528, 30614, 8294) nykyinen koodi on jo sulkenut tulevan
vuokran pidennysrivin niin, että alku > loppu (74001, 75547, 69723) — hook näkee ne väärin.

### 8.2 Sovittu korjaus

**Rivihaku** (`getAgreementRowsForBike`): suodattimeen lisätään `isinactive = F` (CLAUDE.md:n
idea 09 väittää sen jo olevan siellä; ei ole). Sarakkeisiin lisätään
`custrecord_sta_ca_row_license_startdate` ja `custrecord_sta_is_prolongation_line`.

**Validointi ennen kirjoituksia** — Error, ei kirjoituksia:
- `postPauseStart > closeDate`
- `postPauseEnd >= postPauseStart`

**Rivien jaottelu** käsiteltävän tuotteen sisällä (`custrecord_cr_service_fee_paused` = F → vain
vuokra 30; T → myös hallinnointimaksu 31, kuten ennenkin):

| Luokka | Ehto | Toimenpide |
|---|---|---|
| Voimassa sulkemispäivänä | alku ≤ `closeDate` (tai tyhjä) **ja** loppu tyhjä tai ≥ `closeDate` | suljetaan `closeDate`:en (loppupäivää ei koskaan siirretä eteenpäin), kloonataan |
| Tuleva | alku > `closeDate`, **lipusta riippumatta** | ei kosketa |
| Päättyy ennen taukoa | loppu < `closeDate` | ei kosketa, ei kloonata |

"Tuleva" kattaa lipusta riippumatta sekä pidennysrivit että OOMI-pyörien päiväsuhteutetun viimeisen
kuukauden rivin (lippu aina F) — molempien pitää jäädä ennalleen. Raja "≥ `closeDate`" on
tarkoituksellinen: jos ajo kaatuu sulkemisen ja kloonauksen välissä, rivien loppu on uudelleenajossa
jo `closeDate`, ja tiukempi raja jättäisi ne kloonaamatta.

**Tarkistukset ennen kirjoituksia** — Error, ei kirjoituksia:
1. **Tuleva rivi alkaa viimeistään tauon jälkeisenä alkupäivänä** (`closeDate` < alku ≤
   `postPauseStart`). Kattaa kaksi tapausta joita ei voi luotettavasti erottaa: CR on jo käsitelty
   tai sille on kaksoiskappale (B032001), *tai* tauko ulottuu tulevan rivin kauden sisään (riviä ei
   voi lyhentää, koska hook laskee pidennyskuukaudet rivin alusta loppuun). Virheviesti kertoo
   molemmat mahdolliset syyt. Harvinainen laillinen tapaus — pidennys alkaa täsmälleen tauon
   päättyessä — hoidetaan käsin.
2. **Tulevien rivien loppu ei täsmää CR:ään:** tuotteella on tulevia rivejä, mutta myöhäisimmän
   loppupäivä ≠ `postPauseEnd`.
3. **Useampi voimassa oleva rivi samalla tuotteella** sulkemispäivänä (lisätty 28.09.2026): data on
   jo valmiiksi tuplana — näin ei pitäisi käydä ellei jokin skripti toimi väärin — ja molempien
   kloonaus siirtäisi tuplan tauon jälkeiselle kaudelle.

Kaksoiskäsittely tunnistetaan riveistä, ei CR-historiasta, jotta sama tarkistus kattaa sekä
kaksoiskappale-CR:n että saman CR:n uudelleenajon. Seurauksena on Error (ei Needs Review).
Jos ajo kaatuu kloonausvaiheen keskellä, uudelleenajo päätyy tähän Erroriin ja puuttuva klooni
luodaan käsin — hyväksytty seuraus.

**Klooni:**
- alku = `postPauseStart`
- loppu = aikaisimman saman tuotteen tulevan rivin alkua edeltävä päivä; jos tulevia rivejä ei ole,
  `postPauseEnd` kuten ennenkin
- `custrecord_sta_is_prolongation_line` periytyy lähderiviltä (kuten tyypeissä 1 ja 9)

Esimerkki B008294: klooni 01.06.2027–30.06.2028, pidennysrivi 69723 jatkuu 01.07.–31.08.2028
ennallaan.

**Säilyy ennallaan:** idea 02:n varoitus (pyörärekisterin `custrecord_sta_subsc_end_date` <
`postPauseStart` → Needs Review), joka ajetaan kirjoitusten jälkeen.

### 8.3 Rakenne ja testit

- Päätöslogiikka erotetaan puhtaaksi ES5-kirjastoksi
  `src/FileCabinet/SuiteScripts/cr-processor/cr_pause_plan.js` (define NetSuitessa, require
  Nodessa, kuten `gbb_lunastus_lib.js`). Funktio `planPause(rows, closeDate, postPauseStart,
  postPauseEnd)` palauttaa joko virheen tai listat suljettavista riveistä ja luotavista klooneista;
  `handler_vali.js` vain toteuttaa suunnitelman.
- `tests/cr_pause_plan.test.js` (`npm test`), tapauksina: B008294, B030614, B032001 (toinen CR),
  CR-1921, CR-2945, OOMI-pyörän viimeisen kuukauden rivi, päärivi joka päättyy ennen sulkemispäivää,
  uudelleenajo sulkemisen ja kloonauksen välisen kaatumisen jälkeen.

### 8.4 Rajaus ja toimitus

- **Vain koodi.** Datan korjaus erikseen koodin käyttöönoton jälkeen: B032001:n tuplarivit
  (116037/116038) ja rivi 115976 **ennen tammikuun 2027 laskutusajoa**, sekä pyörien 18528, 30614 ja
  8294 tulevat vuokran pidennysrivit (74001, 75547, 69723), joiden alkuperäinen loppupäivä
  palautetaan jotta hook näkee pidennyksen oikein.
- Haara `fix/handler-vali-future-rows` `main`-haarasta repossa `netsuite-subscrption-cr-scripts`.
  Samassa muutoksessa: `docs/scripts/handler_vali.md`, README:n NetSuite description -lohko,
  CHANGELOG, CLAUDE.md (tyypin 3 rivi, idea 09:n korjaus) ja uusi idea-tiedosto `docs/ideas/`.
- **Käyttöönottojärjestys:** `cr_pause_plan.js` File Cabinetiin ennen uutta `handler_vali.js`:ää.
