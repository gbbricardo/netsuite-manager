# Warning-rivien ennakointi — 1.11.2026 ajon seitsemän riviä ja mitä niistä olisi nähty etukäteen

**3.11.2026.** Tausta tarkistukselle **SR3** ja perustelu sille, miksi RI3 ja RI4 kannattaa toteuttaa
ensin. Omistava repo: `cf-gbb-tools`, välilehti netsuite-reporting.

## 1. Kysymys

Warning-rivi (raportointitila 5) pidättää koko työnantajan palkka-CSV:stä (D8). 1.11.2026 ajossa
seitsemän Warning-riviä piti 245 riviä ja 19 674,25 € pois aineistosta, ja ne korjattiin käsin ajon
ja CSV:n välissä samana iltana. Olisiko ne voinut nähdä etukäteen?

## 2. Warning-rivien todelliset syyt (lähdekoodista)

### Syy A — `ri_creation` luo rivin suoraan Warningiin

`mr_monthly_reporting_ri_creation.js:654-656`. Tämä on tiedoston **ainoa** Warning-syy — koko
skriptissä on täsmälleen yksi `reasons.push`:

```js
if (!contractEnded && !hasOngoingSubscriptionLine(precomputed.lines, lineCheckMs)) {
  reasons.push('Vastaavaa tilausriviä ei löytynyt (customrecord_sta_ca_agreement_row).');
}
```

Pyörälle syntyy Warning-rivi raportointipäivälle `D`, kun

1. pyörä käsitellään aktiivisena eikä `contractEnded` (`D` ≤ `custrecord_sta_subsc_end_date`), **ja**
2. ei ole yhtään `customrecord_sta_ca_agreement_row` -riviä, jolla
   - `custrecord_sta_ca_row_item = 30`,
   - `custrecord_sta_bikeid` = kyseinen pyörä,
   - **emosopimuksen `custrecord_sta_ca_customer` = rekisterin `custrecord_sta_contract_employer`**,
   - `license_startdate ≤ D ≤ license_enddate` (tyhjä loppu = voimassa).

`D` on kuun 1. päivä, paitsi viimeisenä vajaana kuukautena edellisen kuun viimeinen päivä
(`isFinalPartialMonth`, rivi 646).

Kaksi yksityiskohtaa, joita tarkistus ei saa muuttaa:

- **Haku ei suodata `custrecord_sta_ca_row_status`- eikä `isinactive`-kentällä**
  (`loadSubscriptionLinesByBikeEmployer`, rivit 478-505). Kuukausiraportointi hyväksyy siis rivin,
  jota 701 ei laskuta (sen portti on `row_status = 1`). SR3 ei saa lisätä `row_status`-suodatinta,
  tai se lakkaa kuvaamasta sitä mitä skripti tekee. Epäsymmetria itsessään on oma tarkistusaiheensa.
- **Hinta ja Warning tulevat eri funktioista.** `hasOngoingSubscriptionLine` vaatii aidon
  kattavuuden, mutta `pickLeaseFeeLine` palaa lähimpään päättyneeseen riviin. Siksi Warning-rivillä
  voi olla oikean näköinen vuokra (B027115: 80,645 €), eikä **RI2** (*fee 0 tai tyhjä*) laukea.
  Eikä **RI1** laukea, koska ADR 0020 k. 4:n vertailuarvo käyttää samaa fallbackia. **Syy A jää siis
  nykyisen RI-perheen ulkopuolelle kokonaan** — siitä SR3.

### Syy B — `ri_update` pudottaa olemassa olevan rivin Warningiin

`mr_monthly_reporting_ri_update.js`, kuusi kohtaa: rivi 769 (sopimus päättynyt ennen velvoitteiden
hoitamista), 1040/1051 (peruttu CR, vaihe 1d), 1382 ja 1435 (päällekkäiset rivit, vaihe 3a), 1505
(Active-rivi ilman edellisen kuun riviä), 1530 (vuokrakauden alku ei täsmää eikä siirto-CR:ää ole),
1772 (työnantajatarkistus).

Vaihe **1c ei aseta Warning-tilaa**, se lisää vain ilmoitustekstin. `1c flagged=69` ei ole
Warning-rivien määrä.

## 3. Seitsemän riviä

| RI | Pyörä / työnantaja | Luotu | Syy | Nähtävissä etukäteen |
|---|---|---|---|---|
| 153877 | B003043 / The Qt Company | **13.10. 08:10** | B | **19 vrk** — rivi oli Warning-tilassa kannassa |
| 153878 | B011060 / Metsä Wood | **13.10. 08:17** | B | **19 vrk** |
| 153879 | B003650 / Stora Enso Veitsiluoto | **13.10. 08:17** | B | **19 vrk** |
| 172974 | B027115 / Esperi Care | 1.11. 17:09 | A | ei rivinä; syy kyselyllä |
| 183921 | B041290 / Serres | 1.11. 17:52 | A | ei rivinä; syy kyselyllä |
| 183922 | B041292 / Serres | 1.11. 17:52 | A | ei rivinä; syy kyselyllä |
| 184719 | B042213 / Serres | 1.11. 17:54 | A | ei rivinä; syy kyselyllä |

Kolmen ensimmäisen ilmoitusteksti on sama: *"Vuokrakauden päättymispäivä on muuttunut: 30.09.2026 →
31.10.2026. Kauden 2026-11 rivit ovat tilassa 4 … Saman työnantajan rivejä eri vuokra-ajoilla samalle
raportointipäivälle."* Ne olivat olemassa Warning-tilassa raportointipäivälle 1.11.2026 jo 13.10.
**RI3 olisi näyttänyt ne 19 vuorokautta ennen ajoa.**

Neljä muuta syntyi vasta ajossa, joten rivipohjainen tarkistus ei niitä löydä. Niiden syy oli silti
kannassa:

| Pyörä | Rekisterin työnantaja | 1.11. kattava item-30 rivi | Oma rivi alkaa |
|---|---|---|---|
| B041290 | Serres Oy | rivi 97538, asiakas **Paree Group Oy**, 5.5.2025–31.12.2026 | 1.1.2027 (rivi 116730) |
| B041292 | Serres Oy | rivi 97546, asiakas **Paree Group Oy**, 20.8.2024–31.12.2026 | 1.1.2027 (rivi 116726) |
| B042213 | Serres Oy | rivi 100842, asiakas **Paree Group Oy**, 4.4.2023–31.12.2026 | 1.1.2027 (rivi 116728) |
| B027115 | Esperi Care Oy | **ei yhtään** — rivit 63211/71500/71520 päättyivät 31.10.2026 | — |

Serreksen siirto oli tätä kirjoitettaessa tehty puolittain: uudet rivit olivat olemassa mutta
alkoivat vasta 1.1.2027. **T94 ajettiin 3.11.2026 klo 16:01**, ja siinä Pareen rivit katkaistiin
31.12.2026 ja uudet Serres-rivit 116726–116731 alkavat 01.01.2027. Joulukuu laskutetaan siis yhä
Pareelta — mutta joulukuun RI-rivit (188798–188803) syntyivät samalla, joten 1.12. ajo ei luo niille
uutta riviä eikä Warningia.

## 4. Mitä netsuite-reporting-työkalussa on nyt

`src/app/lib/tools/netsuite-reporting/registry.ts`: **31 tarkistusta**, perheet LU (17), KL (3),
IC (4), EX (2), ML (4), KK (2). **Yksikään ei koske kuukausiraportointia, RI-rivejä eikä
sopimusrivien kattavuutta.** RI-, SR-, CR-, HY- ja AV-perheet ovat vaatimuksissa mutta eivät koodissa.

Vastaus kysymykseen on siis: **ei, yhtäkään seitsemästä ei voinut raportoida työkalussa** — mutta
kolme niistä olisi löytynyt jo määritellyllä **RI3**:lla, ilman uutta sääntötyötä.

Kehys itse on valmis siihen mitä pyydettiin:

- `report.ts:87-92` antaa jokaiselle `ennakkovaroitus`-tarkistukselle määräajaksi **seuraavan kuun
  1. päivän** ja `compareRows` nostaa ne listan kärkeen. Se *on* "korjattava ennen kuun viimeistä
  päivää" -näkymä. Uutta käyttöliittymää ei tarvita.
- Kuittaukset **raukeavat itsestään, kun tarkistuksen lukemat arvot muuttuvat** (`check.ts`,
  `Deviation.values`) — korjattu sopimusrivi ei jää vanhan kuittauksen alle.

## 5. SR3 — ehdotettu uusi tarkistus

**Ehto:** raportoitavalla pyörällä (ADR 0020 k. 7) ei ole seuraavan raportointipäivän kattavaa
item 30 -riviä rekisterin omalle työnantajalle. **Laji:** E, määräaika palkka-CSV-ajo.

```sql
SELECT br.id, br.name, br.custrecord_sta_contract_employer, br.custrecord_sta_subsc_end_date
FROM customrecord_sta_bike_register br
WHERE br.isinactive = 'F'
  AND br.custrecord_sta_bike_status = 1
  AND br.custrecord_sta_contract_employer IS NOT NULL
  AND br.custrecord_sta_subsc_end_date >= <raportointipäivä>
  AND NOT EXISTS (
    SELECT 1 FROM customrecord_sta_ca_agreement_row r
    JOIN customrecord_sta_customer_agreement a ON r.custrecord_sta_ca_parent_agreement = a.id
    WHERE r.custrecord_sta_bikeid = br.id
      AND r.custrecord_sta_ca_row_item = 30
      AND a.custrecord_sta_ca_customer = br.custrecord_sta_contract_employer
      AND r.custrecord_sta_ca_row_license_startdate <= <raportointipäivä>
      AND (r.custrecord_sta_ca_row_license_enddate IS NULL
           OR r.custrecord_sta_ca_row_license_enddate >= <raportointipäivä>))
```

### Kalibrointi on pakollinen

Pelkkä yllä oleva ehto antoi 3.11.2026 raportointipäivälle 1.12.2026 **68 pyörää 41 työnantajalla**,
kun todellisia Warning-rivejä oli neljä. Ero selittyy kokonaan sillä, ettei `ri_creation` luo uutta
Active-riviä pyörälle, jolla on jo Ended- tai Paused-rivi:

| Kuluvan kuun RI-rivin tila | Kpl 68:sta |
|---|---|
| 4 Ended | 42 |
| 3 Paused | 18 |
| 6 Deleted | 1 |
| ei riviä | 2 |
| **1 Active → tuottaa Warningin** | **5** |

Lisäehto *"pyörällä on kuluvalle raportointipäivälle Active- tai Active/New-rivi omalle
työnantajalleen, tai ei riviä lainkaan"* pudottaa listan **68 → 8**. **SR3:a ei pidä julkaista ilman
tätä ehtoa**: 41 työnantajan lista, josta 35 on vääriä, opettaa ohittamaan koko välilehden.

### Toinen väärien osumien lähde: kesken oleva siirto

1.11.2026 kuudella pyörällä (B005732, B012572, B016646, B018393, B029216, B034891) rekisterin
työnantaja oli jo uusi, mutta item-30 rivi vanhalla asiakkaalla 30.11.2026 asti, `row_status` 1.
Se on CLAUDE.md:n mukaan **oikea** 2A-kuvio. Ne eivät osu 1.12. listalle, koska uusi rivi alkaa 1.12.
Serres eroaa vain siinä, että siirtoa ei viety loppuun. Siirron selittävä tyypin 1 tai 9 CR
kannattaa näyttää poikkeaman selitteessä, ei suodattaa sillä pois.

## 6. Lista tänään (3.11.2026, määräaika 1.12.2026)

Kalibroitu SR3 antaa **8 pyörää / 6 työnantajaa**. **Yksikään niistä ei kuitenkaan tuota
Warning-riviä 1.12.2026** — ja juuri se paljastaa kalibroinnin oikean ehdon.

| Pyörä | Työnantaja | RI-rivi 1.11. | RI-rivi 1.12. | Syntyykö Warning |
|---|---|---|---|---|
| B044250 | Peab Industri Oy | 1 Active | **3 Paused** | ei (`active_skipped_paused_exists`) |
| B014428 | Kemiönsaaren kunta | 1 Active | **3 Paused** | ei (sama) |
| B046762 | Lännen Tractors Oy | 1 Active | **3 Paused** | ei (sama) |
| B041290, B041292, B042213 | Serres Oy | ei riviä | **2 Active/New** | ei (`active_already_exists_new`) |
| B005683 | Coronaria Contextia Oy | 1 Active | **4 Ended** | **epävarma** |
| B030702 | Linnan Isännöinti Oy Hämeenlinna | 1 Active | **4 Ended** | **epävarma** |

**Korjaus 3.11.2026.** Ensimmäinen versio tästä kohdasta väitti, että nämä 8 tuottavat Warning-rivin
1.12.2026. Väite oli väärä: kalibroinnin erotteleva tieto on **kohdekuukauden** RI-rivi, ei kuluvan
kuun. `ri_creation.js:591-608` palaa olemassa olevan rivin perusteella **ennen** `const reasons = []`
-riviä, joten mikä tahansa saman pyörän, työnantajan ja raportointipäivän Active-, Active/New- tai
Paused-rivi estää Warningin kokonaan.

Kaksi epävarmaa tapausta: olemassa oleva **Ended**-rivi ei esiinny noissa suodattimissa lainkaan
(`sameStatusExists` / `otherStatusExists` kattavat vain Active ja Active/New, `pausedForEmployer`
vain Pausedin). Aktiivinen pyörä, jolla on jo Ended-rivi kohdekuukaudelle, saattaa siis saada toisen
rivin — mikä on RI9:n tilanne (*Ended voittaa*, ADR 0020 k. 13), jonka vaihe 3a ratkaisee. En
todentanut kumpaan suuntaan se menee; **se on selvitettävä ennen SR3:n toteutusta.**

**SR3:n ehto on siis:** ei kattavaa item 30 -riviä kohdepäivälle **eikä** kohdepäivälle olemassa
olevaa Active-, Active/New- tai Paused-riviä. Tällä ehdolla lista on tänään **tyhjä tai korkeintaan
kaksi riviä** — mikä on uskottavaa, koska Serreksen siirtopaketti ajettiin 3.11. (T94) ja se loi
joulukuun rivit valmiiksi.

Työnantajatason vaikutus on silti se luku, joka kertoo kiireellisyyden, jos osuma syntyy. Mitattuna
marraskuun riveillä (`lease_fee_vat0 × 1,255`) yksi rikkinäinen pyörä Peab Industrilla pidättäisi
**122 riviä ja 12 402,63 €**, Coronaria Contextia 16 riviä / 1 615,73 €, Serres 18 riviä /
1 816,94 €, Kemiönsaaren kunta 7 / 700,00 €, Lännen Tractors 6 / 602,42 € ja Linnan Isännöinti
1 / 101,21 €. Poikkeamien lukumäärä ei kerro tätä.

**RI3 on tänään tyhjä.** Ainoat Warning-rivit kannassa ovat 117470 ja 117571, molemmat testipyörä
**B017530** / Testi Yritys Oy, raportointipäivä 1.10.2026. ADR 0020 k. 7 rajaa B017530:n jo pois.

**B027115 (T93) ei nouse SR3:lle**, koska sen marraskuun rivi on Paused — `ri_creation` ei luo
Pausedille uutta Active-riviä. Aukko on silti todellinen (rekisteri Active 30.4.2027 asti, vuokrarivit
päättyivät 31.10.2026). Se tarvitsee oman ehtonsa: *rekisterissä aktiivinen pyörä, jonka RI-rivi on
Paused ilman voimassa olevaa taukoa selittävää CR:ää.*

## 7. Toteutusjärjestys

1. **RI3 ja RI4** — jo määritelty (ADR 0020 k. 8), kattaa syyn B, olisi tuonut 3/7 esiin 19 vrk
   aiemmin. Halvin ja varmin.
2. **SR3** — kattaa syyn A, 4/7. Vaatii kohdan 5 kalibroinnin.
3. **Työnantajatason yhteenveto** — RI3/RI4/SR3:n osumat työnantajittain, rivit ja brutto.
4. **RI9 ja SR1/SR2** — jo määritelty, kattaa vaiheen 3a demotoinnit ja sopimusrivien eheyden.

## 8. Avoin kysymys

SR3 kysyy "seuraava raportointipäivä". Kuun 1. päivänä ennen ajoa se kysyisi jo seuraavaa kuuta ja
näyttäisi tyhjää juuri silloin kun lista on tarpeen. Ehdotus: **kuluvan kuun 1. päivä niin kauan kuin
sen päivän RI-rivejä ei ole vielä luotu, muuten seuraava kuu** — sama ehto, jolla ADR 0020 k. 10
ajoittaa RI5–RI8:n.
