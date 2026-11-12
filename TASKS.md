# TASKS — avoimet tehtävät

> [!IMPORTANT]
> **Tämä tiedosto sisältää vain keskeneräiset tehtävät.** Valmiit tehtävät ja päättyneet lokiosiot on
> arkistoitu tiedostoon [`archive/TASKS-valmiit.md`](archive/TASKS-valmiit.md) (tehtävä-ID-hakemisto
> sen alussa). Älä pidä valmista tehtävää täällä: kun tehtävä valmistuu, siirrä koko lohko arkistoon
> samassa istunnossa ja kirjaa sinne päivä ja tulos. Arkistoitu tehtävä on historiaa: tarkista tila
> NetSuitesta, ennen kuin luotat sen tulokseen.
>
> Viimeksi siivottu **9.11.2026** (arkistoitu 86 valmista tehtävää ja kuukausiajon 1.11. lokiosiot).

Päivätyt työtehtävät. Tämä on **tehtävälista**: mitä tehdään ja milloin. Tilannekuva ja mittarit
ovat [`docs/lunastus-tilanne.md`](docs/lunastus-tilanne.md):ssä ja säännöt
[`docs/lunastuksen-kenttasaannot.md`](docs/lunastuksen-kenttasaannot.md):ssä.

Kun tehtävä on tehty: merkitse `[x]`, kirjaa päivä ja tulos, päivitä tilannedokumentti ja siirrä lohko
arkistoon.

## Yhteenveto

| Tehtävä | Aihe |
|---|---|
| T95 | `cr_bike_register_apply` kirjoittaa `custrecord_gbb_employer_lease_start` (cr-scripts, erillinen istunto) |
| T96 | raportointi lukee kentän: `COALESCE(employer_lease_start, subsc_start_date)` (monthly-reporting, erillinen istunto) |
| T97 | kertatäydennys: 477 pyörää (tyyppi 1) + 16 pyörää (tyyppi 6) |
| T100 | Warning-rivien ennakointi netsuite-reporting-välilehdelle (RI3, RI4, SR3) |
| T101 | Todenna Serres-siirtopaketin hintakorjaus tuotannossa |
| T70 | monthly-reportingin sääntödokumentit: ensisijainen lähde on netsuite-manager (erillinen istunto) |
| T71 | 2A-paketin konsernisiirto ei passivoi korvattuja rivejä (cr-scripts, erillinen istunto) |
| T73 | SR2 käsin jokaisen siirto- tai pakettiCR-ajon jälkeen (kunnes T71 on tuotannossa) |
| T75 | cr-scripts: jälkiveloitus vain aktiivisista riveistä, hinnat sentin tarkkuudella (erillinen istunto) |
| T76 | 23.9. ylihyvitysten lisäveloitus (taloustiimi) |
| T77 | CR 7467 (Notion 1527, pyörä 46553, 7–9/2026): hyvitys käsin |
| T98 | B040064: peruttu 2C jätti rekisterin, sopimusrivit ja raportoinnin eri linjoille |
| T91 | B027115: vuokrarivi päättyi 31.10.2026 ilman jatkoa, hallintamaksu jatkuu |
| T102 | Jälkiveloituksen kaksoislasku: koodi tuotannossa 10.11., jäljellä ajon tarkistus ja `MIN_USAGE`-mittaus, **ennen 10.12.** |
| T103 | status-sync 2.0: lue CR-tila 3 (rss2, erillinen istunto), **ennen 10.12.** |
| T104 | Maksulinkki: lue CR-tila 3 S5:ssä (erillinen istunto), **ennen seuraavaa linkkiajoa** |
| T105 | `handler_konserni_alustus`: tuplajatko-CR, jos tyypin 13 ajo katkeaa (cr-scripts, matala kiire) |
| T106 | cf-gbb-tools: tilaan 3 jäänyt CR ei hälytä eikä näy (erillinen istunto) |
| T107 | netsuite-reporting-työkalusta puuttuu 24 määritellyistä 56 tarkistuksesta (cf-gbb-tools, erillinen istunto, T51:n jatko) |
| T108 | Extension 2.0 (1437): ajastus päälle tai päätös siirrosta joulukuulle, **eräpäivä 30.11.** |
| T110 | Kauppakirjat, jotka lähtivät nettohinnalla 5.–11.11.: uusintalähetys vain päätöksellä (146 kpl, ei eräpäivää, päättäjä ei tavoitettavissa) |
| T83 | cf-gbb-tools: "Huoltohyvitys lunastushinnasta" -kenttä pyörärekisterityökaluun (erillinen istunto, ei takarajaa) |
| T84 | B033466: varkauden lunastus peruttu (pyörä löytyi), seurantapisteet 29.10.–1.11. |
| B046508 | lunastushinta 0 — onko hinta oikeasti 0 vai puuttuuko se |
| V7–V8 | OOMI-vuokrahintojen alihanke |
| Dok | lokikellon aikaero dokumenteissa |

---

## Raportointi ja RI-rivit

Palkka-CSV:n sarake 8 *"Vuokrakausi alkanut"* näyttää alkuperäisen sopimuksen alkupäivän myös siirretyillä
pyörillä. Oikea päivä kirjoitetaan vain siirtokuukauden riville; 27.08.2026 korjatut **497 syyskuun riviä
palautuivat kaikki** lokakuun ajossa. Todisteet:
[löydös](findings/2026-11-02-ri-vuokrakauden-alkupaiva-palautuu-siirron-jalkeen.md).
Työohje: [`docs/ri-vuokrakauden-alkupaiva-tyoohje.md`](docs/ri-vuokrakauden-alkupaiva-tyoohje.md).

Kenttä `custrecord_gbb_employer_lease_start` on **luotu 2.11.2026 (käyttäjä)** ja todennettu SuiteQL:ssä
(46 771 pyörää, 0 arvoa).

### [ ] T95 — `cr_bike_register_apply` kirjoittaa `custrecord_gbb_employer_lease_start` (cr-scripts, erillinen istunto)

Arvo = `custrecord_cr_contract_official_end_date` + 1, sama päivä jonka `ue_reporting_item_transfers.js:873`
kirjoittaa siirtokuukauden RI-riville. Tyhjä `official_end_date` → ei kirjoiteta, CR ei mene Erroriin.
Laskettu päivä ≤ `subsc_start_date` → ei kirjoiteta (ADR 0025 k. 5). Kenttä ylikirjoitetaan joka siirrossa.

**Laajuus päätetty 2.11.2026** (ADR 0025 k. 6): kentän nollaavat tyyppi 1 *Siirto TA* ja tyyppi 6
*Siirto TT*; tyyppi 9 *Siirto konserni* **ei** — konsernin sisällä työntekijän osalta mikään ei muutu,
sama jatkuvuustulkinta kuin verovapaussäännössä. Jos pyörällä on molempia siirtoja, kenttään tulee
myöhäisempi.

**Kirjoittaja on yksi** (ADR 0025 k. 4, tarkennettu 2.11.2026): jaettu `cr_bike_register_apply.js`, ei
käsittelijät. `handler_siirto_tt.js` reititetään sen läpi (sen oma `capture()` + `submitFields()` -pari
poistuu). Syy on ajoitus: 121 tyypin 1 siirtoa 133:sta kirjoittaa rekisterin vasta kuukauden vaihteessa,
joten käsittelijään kirjoitettu kenttä osuisi väärään kuukauteen. Tyyppi 9 kulkee samasta funktiosta, joten
`crType`-portti on pakollinen. Muutoksen muoto: työohjeen vaihe 3.

**Valmis kun** uusi tyypin 1 ja tyypin 6 CR on käsitelty Doneksi, pyörän kenttä on `official_end_date` + 1, ja
seuraavan kuukausiajon RI-rivi kantaa saman päivän. Tyypin 9 CR ei muuta kenttää. Todennus vaatii ajon
**kaikilla kolmella tyypillä 1, 6 ja 9**, koska `apply()` on niiden jaettu funktio.

### [ ] T96 — raportointi lukee kentän: `COALESCE(employer_lease_start, subsc_start_date)` (monthly-reporting, erillinen istunto)

Yhdeksän lukukohtaa seitsemässä tuotantoskriptissä, taulukko työohjeen vaiheessa 2. Turvallinen jo ennen
täydennystä: tyhjällä kentällä käytös on nykyinen, joten T96 voi mennä tuotantoon ennen T95:tä ja T97:ää.
Älä koske `ue_reporting_item_transfers.js:873/:940`:ään — ne kirjoittavat jo oikean päivän.

**Valmis kun** kuukausiajon jälkeen työohjeen tarkistuskysely palauttaa 0.

### [ ] T97 — kertatäydennys: 477 pyörää (tyyppi 1) + 16 pyörää (tyyppi 6)

**Osa A, 477 pyörää:** lähde on löydöksen kysely (odotus 497 riviä) — ainoa kopio käsin korjatuista päivistä. Validoi ADR 0025 k. 5:llä:
pudota rivit, joilla `uusi_alku` ≤ `rek_alku` (tunnettu: **B011413**, työnantaja vaihdettu takautuvasti ennen
vuokrasopimuksen alkua). **Tarkista peruste uudelleen ennen ajoa:** aineisto on elokuulta ja osa pyöristä on jo
lunastettu. Ajetaan vasta T96:n jälkeen.

**Osa B, 16 pyörää:** kaikilla Done-tilaisilla tyypin 6 CR:illä on `official_end_date` (todennettu 2.11.2026),
joten arvo lasketaan suoraan CR:stä. Kysely työohjeen vaiheessa 4.

**Valmis kun** kenttä on asetettu odotetulle määrälle pyöriä eikä yksikään arvo ole ennen pyörän
`subsc_start_date`:a (kysely työohjeen vaiheessa 4).

### [ ] T100 — Warning-rivien ennakointi netsuite-reporting-välilehdelle (RI3, RI4, SR3)

**Tausta:** [`findings/2026-11-03-warning-rivien-ennakointi.md`](findings/2026-11-03-warning-rivien-ennakointi.md).
Omistava repo `cf-gbb-tools`, välilehti netsuite-reporting. Säännöt [ADR 0020](docs/adr/0020-kuukausiraportointiin-vaikuttavat-tiedot.md),
tarkistusluettelo [`docs/poikkeamaraportointi-vaatimukset.md`](docs/poikkeamaraportointi-vaatimukset.md).

1.11.2026 ajossa seitsemän Warning-riviä piti **245 riviä ja 19 674,25 €** pois palkka-CSV:stä (D8), ja ne
korjattiin käsin ajon ja CSV:n välissä samana iltana. Kolme niistä (153877–153879) oli ollut kannassa
Warning-tilassa **13.10. alkaen eli 19 vuorokautta**. Mikään ei näyttänyt niitä.

**Nykytila:** `registry.ts` sisältää 32 tarkistusta (LU, KL, IC, EX, ML, KK; 10.11. tiedostoista laskettu, 56 määritellystä). **RI-, SR-, CR-, HY- ja
AV-perheet ovat vaatimuksissa mutta eivät koodissa.** Käyttöliittymää ei tarvita: `report.ts:87-92` antaa
jokaiselle `ennakkovaroitus`-tarkistukselle määräajaksi seuraavan kuun 1. päivän ja nostaa ne listan kärkeen.

**Tehtävä, halvin ensin**

1. **RI3 ja RI4** — Warning-rivi seuraavalla / aiemmalla raportointipäivällä. Jo määritelty (ADR 0020 k. 8),
   ei uutta sääntötyötä. Olisi tuonut 3/7 esiin 19 vrk aiemmin. Rajaa testipyörä **B017530** pois
   (ADR 0020 k. 7 tekee sen jo).
2. **SR3** (uusi, lisätty vaatimusluetteloon 3.11.) — raportoitavalla pyörällä ei ole kohdepäivän kattavaa
   item 30 -riviä rekisterin omalle työnantajalle. Kattaa syyn A eli 4/7.
   **Kaksi asiaa, joita ei saa ohittaa:**
   - Kattavuusehdon on vastattava `ri_creation.js:654-656`:ta **ilman `row_status`-suodatinta**. Skripti ei
     suodata sillä, joten kuukausiraportointi hyväksyy rivin, jota 701 ei laskuta.
   - Rajaus: kohdepäivälle ei ole Active-, Active/New- eikä Paused-riviä. Ilman tätä kysely antaa
     **68 osumaa 41 työnantajalla**, kun todellisia on muutama.
3. **Työnantajatason yhteenveto** — osumat työnantajittain, pidättyvät rivit ja brutto
   (`lease_fee_vat0 × 1,255`). Yksi rikkinäinen pyörä Peab Industrilla pidättäisi 122 riviä / 12 402,63 €.
   Poikkeamien lukumäärä ei kerro kiireellisyyttä, tämä kertoo.
4. **RI9 ja SR1/SR2** — jo määritelty, kattaa vaiheen 3a demotoinnit ja sopimusrivien eheyden.

**Selvitettävä ennen SR3:n toteutusta:** estääkö kohdepäivälle olemassa oleva **Ended**-rivi Warningin?
`ri_creation.js:591-608` kattaa vain Active, Active/New ja Paused. Jos ei estä, kyseessä on RI9:n tilanne
(*Ended voittaa*, ADR 0020 k. 13). Avoinna myös SR3:n ajoituksen kiinnitys: kuluvan kuun 1. päivä niin kauan
kuin sen päivän RI-rivejä ei ole luotu, muuten seuraava kuu (sama ehto kuin ADR 0020 k. 10:ssä).

**Erillinen, ei SR3:n kattama:** B027115 (T93) ei nouse SR3:lle, koska sen rivi on Paused. Aktiivinen pyörä,
jonka RI-rivi on Paused ilman taukoa selittävää voimassa olevaa CR:ää, tarvitsee oman ehtonsa.

**Valmis kun** RI3, RI4 ja SR3 ovat tuotannossa netsuite-reporting-välilehdellä, SR3 on kalibroitu yllä
kuvatulla rajauksella, ja työnantajatason yhteenveto näkyy. **Tavoite: ennen 1.12.2026 ajoa.**

### [ ] T101 — Todenna Serres-siirtopaketin hintakorjaus tuotannossa

**Tausta:** T99:ssä korjattiin `ue_reporting_item_transfers.js`-skriptin päivämääräbugi (`findLeaseFee`-funktiossa `new Date()` korvattiin `parseNsDate()`:lla), joka aiheutti 3.11. Serres-siirtopaketin (CR 7646/7649/7652) yhteydessä vääriä vuokrahintoja New-raportointiriveille. Skriptimuutokset tehtiin `netsuite-monthly-reporting`-repoon 4.11.2026.

**Tehtävä:**
1. [x] Varmista, että käyttäjä on ladannut päivitetyn `ue_reporting_item_transfers.js` NetSuite File Cabinetiin. (Ladattu 4.11.2026)
2. [ ] Tarkista seuraavan kuukausiajon tai uuden siirtopaketin yhteydessä, että `findLeaseFee` asettaa siirretyn pyörän raportointiriville oikean hinnan, ja ettei siinä näy enää `NaN`-pohjaisia tynkärivipoimintoja.

**Valmis kun** skriptin muutos on todennettu NetSuitessa oikealla datalla.

### [ ] T70 — monthly-reportingin sääntödokumentit: ensisijainen lähde on netsuite-manager (erillinen istunto)

ADR 0020 k. 1 (23.10.2026): `netsuite-monthly-reporting/docs/rules/` (`RIVISAANNOT.md`, `TULOSTUSSAANNOT.md`, `DUPLIKAATTISAANNOT.md`,
`WARNING_RESOLUTION_PLAYBOOK.md`) kirjoitettiin kehitystä varten. Lisää jokaisen alkuun merkintä: *kehityksen aikainen dokumentti, ensisijainen
lähde on netsuite-manager (ADR 0020 ym.)*, ettei kukaan päivitä niitä luullen niitä ajantasaisiksi. Tehdään monthly-reporting-istunnossa.
**Valmis kun** merkintä on kaikissa neljässä ja commitoitu.

---

## Sopimusrivit ja CR-käsittely

### [ ] T71 — 2A-paketin konsernisiirto ei passivoi korvattuja rivejä (cr-scripts, erillinen istunto)

Konsernisiirto (tyyppi 9 tyypin 13 kautta) kloonaa jäljellä olevan kauden ja jättää tulevaisuudessa alkavan pidennysrivin tai OOMI-osarivin
aktiiviseksi. 15 pyörää 14.8.–26.10.2026, viimeisimmät 6 tänään klo 10:02. Toteuta ADR 0021 k. 11: jokainen jäljellä oleva kuukausi katetaan
täsmälleen kerran samalla hinnalla, korvatut rivit passivoidaan, ja OOMI:n viimeisen kuun osarivi jää. Selvitä ensin, miksi idea-03:n
pidennystietoisuus ei toimi 2A-paketin kautta. **Kaksi tyypin 13 CR:ää on Error-tilassa:** älä käsittele niitä uudelleen ennen korjausta, tai aja SR2 heti perään.
**Valmis kun** korjaus on tuotannossa ja ensimmäisen 2A-paketin jälkeen SR2 palauttaa 0.

### [ ] T73 — SR2 käsin jokaisen siirto- tai pakettiCR-ajon jälkeen (kunnes T71 on tuotannossa)

Kysely löydöksessä. 1199 ajaa 6 tunnin välein. Tarkista ainakin päivinä, jolloin tyypin 1, 9 tai 13 CR:iä on käsitelty. **Valmis kun** T71 on valmis.

> [!NOTE]
> **28.10.2026:** SR2 palauttaa vain **B033217** (22039 / 76654, item 31), joka on T72:ssa. Tyypin 1/9/13 CR:iä ei ole käsitelty 26.10. korjausten jälkeen.
> **Jonossa 3 uutta tyypin 13 pakettia** (luotu 28.10. 16:05, Pending, uusi asiakas `portal-company-4lgnos3o3xtd`, `official_end` 31.10.2026), kaikki **OOMI**, ja jokaisella on
> viimeisen kuun osarivit, eli sama kuvio kuin B044562:lla ja B037449:llä:
> | CR | Pyörä | Päärivit (30/31) | Osarivit (30/31) |
> |---|---|---|---|
> | 7492 | B044307 | 108336/108337 → 29.2.2028 | 108338/108339, 3/2028 |
> | 7493 | B044317 | 108374/108375 → 30.4.2027 | 108376/108377, 5/2027 |
> | 7494 | B044251 | 108128/108129 → 30.4.2029 | 108130/108131, 5/2029 |
> Odotus ennen T71:tä: kloonit kattavat viimeisen kuun, ja osarivit jäävät aktiivisiksi. Tupla alkaisi aikaisintaan 5/2027, joten korjaus ehtii ajon jälkeen.
> **Aja SR2 uudelleen, kun 7492–7494 ovat Done**, ja korjaa kuten B044562: kloonien loppu viimeisen täyden kuun loppuun, osarivit jäävät.
> Error-tilassa ovat yhä 7399 (B026067, 26.10.) ja 4652 (B039986, 7/2026). Ne on jätetty käsittelemättä.
> **5.11.2026 ajettu SR2:** B033217 on poistunut. Jäljellä 4 pyörää: 7492–7494 (B044307, B044317, B044251) ja 30.10. paketti B029344. Kaikissa tupla alkaa vasta 2027–2029.

#### Lokiote: SR2-ajo 1.11.2026

| Pyörä | Item | Rivit | Päällekkäisyys | Tila |
|---|---|---|---|---|
| B033217 | 31 | 22039 / 76654 | 31.10.2026– | Tunnettu, **T72** |
| B044251 | 30, 31 | 108130/116649, 108131/116650 | 1.5.2029– | CR 7494, odotettu (28.10. ennuste) |
| B044307 | 30, 31 | 108338/116647, 108339/116648 | 1.3.2028– | CR 7492, odotettu |
| B044317 | 30, 31 | 108376/116651, 108377/116652 | 1.5.2027– | CR 7493, odotettu |
| **B029344** | 30, 31 | 71850/116700, 71851/116699 | **1.1.2027–28.2.2027** | **Uusi**, 30.10. paketti (CR 7608–7610) |

17 uudesta paketista vain yksi (B029344) tuotti tuplan. **Yksikään tupla ei osu marraskuuhun**, joten 1.11. palkka-CSV ei ole vaarassa.
Korjaus kuten B044562: kloonien loppu viimeisen täyden kuun loppuun, osarivit jäävät. Odottaa T71:tä.

### [ ] T75 — cr-scripts: jälkiveloitus vain aktiivisista riveistä, hinnat sentin tarkkuudella (erillinen istunto)

ADR 0023 k. 4–5. `handler_jalki.priceForMonth` ohittaa passiiviset rivit (`handler_jalki.js:372` ei suodata `isinactive`). Molemmat
käsittelijät (`priceForMonth`, `priceForBilledMonth`) pitävät hintoja samoina, jos ne ovat samat sentin tarkkuudella, ja vievät
asiakirjalle rivin oman arvon. `handler_hyvitys` lukee edelleen myös passiiviset rivit. **Valmis kun** korjaus on tuotannossa.

### [ ] T76 — 23.9. ylihyvitysten lisäveloitus (taloustiimi)

ADR 0023 k. 6. CR 6313 tupla-CM CRMGBF0003753/3754 (+18,12 € netto, todennettu): kumoa ylimääräinen. CR 6284 (B007914) ja 6330
(B018137), kumpikin +92,60 € (päätelty): tarkista ensin kokoomalaskut INVGBF1042980 ja INVGBF1042403, sitten lisäveloitus `LISA-<CR id>`.
CR 6350 (+0,79 €) jää rajan alle. [Löydös](findings/2026-09-23-hyvitys-cr-14-15-9-credit-memot.md). **Valmis kun** kolme on korjattu tai todettu oikeiksi.

### [ ] T77 — CR 7467 (Notion 1527, pyörä 46553, 7–9/2026): hyvitys käsin

ADR 0023 k. 3, 7. Heinäkuu ja elokuu laskutettiin samalla jaksolla 1.8.2026. Tee hyvitys käsin todellisen laskurivin hinnalla,
kirjaa asiakirjan numero CR:n lokiin ja aseta CR Done. **Määräaika** 1.11. kuukausiajo (RI8 lukee Done-tilaiset tyypin 11 CR:t).

### [ ] T98 — B040064: peruttu 2C jätti rekisterin, sopimusrivit ja raportoinnin eri linjoille

Syntyi T87:n päätteeksi 3.11.2026. **Ei kiireellinen rahassa — laskutus on jo kuitattu — mutta tiedot ovat ristiriidassa.**

Ketju: CR **7365** (*Notion-1228 - 2D*, tyyppi 2) meni Doneksi 22.10. virallisella loppupäivällä **30.11.2026**.
CR **7465** (*Notion-1128 - 2C*) loi korjauksen loppupäiväksi **31.10.2026** (CR-muistiinpano: *"aiemmin päätetty
virheellisesti per 30.11.2026"*), mutta se jäi Erroriin eikä koskaan ajanut — ja se on nyt Cancelled. Sen
hyvityspuoli ajoi silti: **CR 7466** hyvitti 11/2026 (CRMGBF0004215, −113,36 €) ja **CR 7547** hyvitti 10/2026
(CRMGBF0004236, −113,36 €), molemmat Tapojärvi Oy:lle, molemmat tilassa Open.

| Mitä | Mitä data sanoo | Seuraus |
|---|---|---|
| Rekisteri | `subsc_end_date` **31.10.2026**, status 3, tapa 5, `settled_at`/`decided_at` 22.10., `date_to_non_active` 30.10. | — |
| Sopimusrivit 93212/93213 | päättyvät **30.11.2026**, rivitila 1, laskutettu 10/2026 ja 11/2026 | riviä ei koskaan katkaistu 31.10:een, koska 7465 ei ajanut |
| RI 11/2026 (182914) | **tila 1 Active**, 80,6454 | marraskuun palkkavähennys **meni 1.11. CSV:hen**, vaikka marraskuu hyvitettiin työnantajalle |
| RI 12/2026 (154429) | tila 4 Ended | raportointi luki rivien 30.11. loppua, ei rekisterin 31.10:tä |
| Hyvitys 10/2026 | CRMGBF0004236 −113,36 € | **jos oikea loppu on 31.10., lokakuu on aito vuokrakuukausi** → näyttää ylihyvitykseltä (T76:n luokka) |

**Päätettävää kolme:**
1. Katkaistaanko rivit 93212/93213 käsin 31.10.2026:een? Laskutukseen se ei enää vaikuta (joulukuuta ei kateta),
   mutta rekisteri ja rivit ovat eri linjoilla, ja raportointi lukee rivejä.
2. Korjataanko RI 182914 (11/2026) Endediksi tai Deletediksi ja ilmoitetaanko palkkahallinnolle, vai jääkö
   marraskuun vähennys voimaan? Nyt työnantaja sai hyvityksen ja työntekijä vähennyksen samalta kuulta.
3. **Onko lokakuun hyvitys oikein?** Tarkista Notion-1128:sta, mihin päivään palautus sovittiin. Jos 31.10.,
   CRMGBF0004236 on lisäveloitettava takaisin (113,36 €).

Lisäksi pyörällä on rivit **93214 ja 93215** (alku 1.1.2028, loppu 30.11.2026, rivitila 1) — T92:n kuvio, mutta
T92:n tarkistuskysely ei nähnyt niitä, koska se rajaa Active-pyöriin ja tämä on status 3. Skripti 702 sulkee ne
1.12., joten ne eivät vaadi toimenpidettä — mutta **T92:n kysely kannattaa ajaa ilman status-rajausta.**

**Valmis kun** kolme päätöstä on tehty ja tehdyt korjaukset todennettu SuiteQL:llä.

### [ ] T91 — B027115: vuokrarivi päättyi 31.10.2026 ilman jatkoa, hallintamaksu jatkuu

Vuokrarivi 71520 (item 30, 1.7.–31.10.2026) laskutettiin 7–10/2026 ja suljettiin automaattisesti
1.11.2026 (rivitila 2). Hallintamaksurivi 71522 (item 31, 1.7.2026–30.4.2027) on rivitilassa 1, ja
1.11. laskutusmoottori laskutti sille myös joulukuun 2026 (`INVGBF1050694`, 9,5618 € netto).

> [!IMPORTANT]
> **Ratkaistu 1.11.2026 (Notion 1211, käyttäjä): Piia Nattilan palkaton jakso 1.10.2026–30.4.2027,
> ja laskutustauko koskee sekä vuokra- että hallintamaksuriviä.** Tauko kestää sopimuksen
> loppuun asti (`subsc_end_date` = 30.4.2027), joten jatkovuokrariviä ei tarvita (vastaa B016051 / T17).
>
> **Tilanne todennettu SuiteQL:llä 5.11.2026:**
> - Marraskuun RI-rivi 172974 käännettiin käsin tilaan **3 (Paused)** 1.11. ennen palkka-CSV:tä, joten
>   palkkavähennyksiin se ei mennyt.
> - Laskutus: marraskuu laskutettiin laskulla `INVGBF1047100` (9,5618 €) ja joulukuu laskulla `INVGBF1050694` (9,5618 €).
>
> **Jäljellä olevat toimenpiteet:**
> 1. **Sulje hallintamaksurivi 71522** NetSuitessa loppupäivään **30.09.2026** (tai aseta rivitila 2 / Closed),
>    jotta 1.12. ajo ei laskuta tammikuuta 2027.
> 2. **Hyvitä marras- ja joulukuun hallintamaksut:** yhteensä 2 × 9,5618 € = **19,12 € netto (24,00 € brutto)**
>    Esperi Care Oy:lle (kohdistus laskuille `INVGBF1047100` ja `INVGBF1050694`).
> 3. Päätös: pideneekö sopimus palkattoman jakson verran (7 kk) 30.11.2027 asti vai päättyykö 30.4.2027.

**Valmis kun** rivi 71522 on suljettu ja marras- ja joulukuun hallintamaksut (19,12 €) on hyvitetty.

---

## Lunastus, maksulinkki ja jälkiveloitus

### [ ] T102 — Jälkiveloituksen kaksoislasku: korjaa `handler_jalki` ja `cr_scheduler` (cr-scripts, erillinen istunto), **ennen 10.12.**

**Löydös 10.11.2026:** [`findings/2026-11-10-jalkiveloitus-kaksoislasku-governance.md`](findings/2026-11-10-jalkiveloitus-kaksoislasku-governance.md).
1199 katkesi 5.11. governance-rajaan (`Usage Limit Exceeded`) heti CR 7779:n laskun jälkeen. Seuraava ajo teki CR:n uudelleen, ja B023108:lle syntyi
kaksi laskua (INVGBF1050845 ja INVGBF1050846). Kumpikaan vahti ei näe tyypin 7 laskuja.
**Päätetty suunta 10.11.:** CR varataan tilaan 3 In Progress ennen handleria, ja scheduler saa governance-lattian.
Jumiutunut In Progress -CR vaatii ihmisen tarkistuksen (tarkoituksella, tupla on pahempi).
- [x] 10.11. Sisarrepotarkistukset: UE:t reagoivat vain siirtymään Doneen, dispatcher on ainoa tuotantopolku, ei handlerin itsehakuja.
- [x] 10.11. Korjaus A (kirjoitettu, tarkistettu, **ei commitoitu eikä ladattu NetSuiteen**): status-vahti (vain Pending) ja varaus tilaan 3 (`cr_dispatcher.js`).
- [x] 10.11. Korjaus B (kirjoitettu, tarkistettu, **ei commitoitu eikä ladattu**): `MIN_USAGE = 1000` (`cr_scheduler.js`). Kulutus per CR on arvio, mittaa ensimmäisessä ajossa.
- [x] 10.11. cr-scripts-dokumentaatio päivitetty (CLAUDE.md, CHANGELOG, README, docs/scripts, fields-reference). Kirjoitettu diffistä, ei todennettu NetSuitessa.
- [x] 10.11. Ladattu File Cabinetiin (`/SuiteScripts/gbb-cr-processor/`, tiedostot 183790 ja 183791, muokattu 10.11.). Todennettu vain koon ja päiväyksen perusteella: koot 5941 ja 4116 täsmäävät tavu tavulta repon uusiin versioihin, vanhan latauspuun koot ovat 4905 ja 3431. Sisältöä ei luettu, koska `ns_getFile` ei saa kansiota (ei Allowed Paths -listalla).
- [x] 10.11. Käyttäjä takaa, ettei CR-tietueella ole työnkulkua. Lähteettömiä UE-skriptejä ei ole erikseen tarkistettu.
- [x] 10.11. Commit `8bac4c1` ja push haaraan `fix/cr-in-progress-claim-governance-floor` (9 tiedostoa). Haara on pushattu, mutta **PR on luomatta ja `main` ei sisällä muutosta**.
- [x] 10.11. PR #15 yhdistetty `main`iin (merge-commit `bcdafa5`). `main` vastaa nyt NetSuiteen ladattua koodia.
- [ ] Sisarrepojen ja reunatapausten muutokset ovat omina tehtävinään: T103 (status-sync 2.0), T104 (maksulinkki), T105 (`handler_konserni_alustus`), T106 (cf-gbb-tools). Kunnes T103 ja T104 ovat tuotannossa: selvitä tilaan 3 jääneet CR:t ennen yöajoa 00:30.
- [ ] Ajon jälkeen: lokissa rivi `Governance floor reached`, ja yksikään CR ei jää tilaan 3 onnistuneen ajon jälkeen.
- [ ] Kysely: tilassa 3 yli tunnin olleet CR:t kuukausitarkistuslistalle (`queries/kuukausiajo-tarkistuslista.md`).
- [ ] Valinnainen: memo-merkki `CR <id>` laskulle (`handler_jalki.js:149`), vain jos jumiutuneita tulee usein.
- [x] 10.11. Samanpäiväiset tuplat B018026, B026535 ja B039531: **ei skriptivirhe, ei hyvitettävää.** Laskut ovat INVGBB-laskuja (ei INVGBF), luotu käsin tehdyistä myyntitilauksista 6–10 s välein ja kattavat eri kuukaudet (välikuukausien ennakot), kaikki Paid In Full. Lähde: NetSuite-agentti 10.11., laskutiedot tarkistettu SuiteQL:llä.
- [x] 10.11. B005391 (INVGBF1050750, 116,21 €) ja B008847 (INVGBF1050814, 115,46 €): **aiheelliset jälkiveloituslaskut, ei hyvitettävää.** Paylink-lunastus oli lunastushinta miinus 80,00 € brutto (ADR 0012), joten laskut kattavat erotuksen. Kukaan ei ole maksanut kahdesti, laskut luotu kerran. Hyvitys jättäisi 80 € kattamatta.

### [ ] T103 — status-sync 2.0 (1480): lue CR-tila 3 (In Progress) kauden loppu -päättelyssä (netsuite-bike-redemption-status-sync-rss2, erillinen istunto)

**Tausta:** T102 (10.11.) otti CR-tilan 3 käyttöön. Tilaan 3 jäänyt (jumittunut) CR putoaa pois `gbb_mr_redemption_sync2.js:385`:n ehdosta `cr_2_10 IN (1, 2, 6)`. Silloin pyörä tulkitaan kauden loppu -pyöräksi, ja OOMI-haara voi merkitä sen lunastetuksi ilman maksua.
- [ ] Lisää 3 listaan (harkitse myös 5, joka on jo samassa asemassa). Tarkista muut CR-tilaehdot samassa tiedostossa (`:143` on `status = 2`, ei vaikutusta).
- [ ] Yksikkötesti tai kyselytarkistus, ja lataus tuotantoon ennen 10.12.
Löydös: [`findings/2026-11-10-jalkiveloitus-kaksoislasku-governance.md`](findings/2026-11-10-jalkiveloitus-kaksoislasku-governance.md). Riippuvuuslähde: sisarrepotarkistus 10.11., luettu koodista, ei ajettu.

### [ ] T104 — Maksulinkki (1479): lue CR-tila 3 S5-jälkiveloitustunnistuksessa (netstuite-send-end-redemption-payment-link, erillinen istunto)

**Tausta:** `gbb_mr_send_end_redemption_paylink.js:159` tunnistaa jälkiveloituksen tyypin 7 pidennys-CR:stä ehdolla `status IN (1, 2)`. Tilaan 3 jumittunut pidennys-CR ei estä linkin lähetystä, joten linkki voi lähteä väärällä hinnalla (sama ongelmaluokka kuin T30–T38).
- [ ] Muuta `IN (1, 2)` muotoon `IN (1, 2, 3)`. Tarkista, että `:165-167` (`cr_2_10`, `status <> 7`) ei muutu.
- [ ] Lataus tuotantoon ennen seuraavaa linkkiajoa.

### [ ] T105 — `handler_konserni_alustus.js:388` luo tuplan jatko-CR:n, jos tyypin 13 ajo katkeaa (cr-scripts, erillinen istunto, matala kiire)

**Tausta:** `createOrReuseDownstreamCR` hakee uudelleenkäytettävän jatko-CR:n ehdolla `status = 1 AND closed_date IS NULL`. Tilaan 3 jäänyt jatko-CR ei löydy, ja uusi tyypin 13 CR luo toisen. Reunatapaus: tapahtuu vain, jos tyypin 13 ajo katkeaa. Löytyi 10.11. tarkistuksessa.
- [ ] Päätä: lisätäänkö 3 hakuun vai hyväksytäänkö reunatapaus (jumittunut CR vaatii joka tapauksessa ihmisen tarkistuksen).

### [ ] T106 — cf-gbb-tools: tilaan 3 jäänyt CR ei hälytä eikä näy hakutyökalussa (cf-gbb-tools, erillinen istunto)

**Tausta:** sisarrepotarkistus 10.11., luettu koodista:
- `netsuite-alerts/queries.ts:228`: hälytys `IN (1, 5)` ei näe tilaa 3, joten jumittunut CR ei hälytä.
- `subscription-change-requests/queries.ts:207` ja `bike-search.ts:202`: auki olevat CR:t `IN (1,5,6) OR closed_date >= …`, joten tila 3 ilman `closed_date`:a ei näy.
- Tarkistukset `lu1`, `lu9`, `ml3`, `ml4`, `ex1`, `kl3`, `lu15` (`IN (1,2)` tai `= 1`): antavat väärän "CR puuttuu" -löydöksen tilaan 3 jääneelle CR:lle. `lu14` ja `kl2` (`<> 7`) eivät muutu.
- [ ] Lisää 3 hälytykseen ja CR-hakuun. Päätä, korjataanko tarkistukset vai pidetäänkö jumittunut CR omana hälytyksenään (esim. tila 3 yli tunnin).

### [ ] T107 — netsuite-reporting-työkalun on sisällettävä kaikki määritellyt tarkistukset (cf-gbb-tools, erillinen istunto)

**Tausta:** T51 arkistoitiin 10.11.2026 (raportointi on netsuite-reporting-työkalu, erillistä raporttia ei tehdä), mutta työkalun on silti katettava koko määrittely
[`docs/poikkeamaraportointi-vaatimukset.md`](docs/poikkeamaraportointi-vaatimukset.md).
**Vertailu 10.11.2026** (tarkistus-ID:t vaatimustaulukoissa vs. `cf-gbb-tools/src/app/lib/tools/netsuite-reporting/checks/*.ts`, vain tiedostojen olemassaolo):
määritelty 56, koodissa 32, **puuttuu 24**. Ei todennettu: vastaako olemassa olevien 32:n sisältö määrittelyä.

| Perhe | Puuttuu |
|---|---|
| LU | LU18 (voimassa kunnes T11) |
| KL | KL4 |
| EX | EX3 |
| KK | KK1, KK5 |
| VV | VV1 |
| RI | RI1–RI9 (T100 kattaa RI3, RI4, RI9) |
| SR | SR1–SR3 (T100 kattaa SR3, SR1/SR2) |
| CR | CR1 |
| HY | HY1–HY3 |
| AV | AV1, AV2 |

- [ ] Päätä jokaisesta puuttuvasta: toteutetaan, tai poistetaan määrittelystä perusteluineen (esim. KK1 ei ehkä ole SuiteQL:llä havaittavissa, LU18 raukeaa T11:n myötä).
- [ ] Toteuta päätetyt. RI3, RI4, SR3, RI9, SR1/SR2 ja työnantajayhteenveto tehdään T100:ssa, älä tee kahdesti.
- [ ] Tarkista olemassa olevien 32 sisältö ehtoihin nähden (otanta tai kaikki).
- [ ] Lisää vertailu testiksi: jokainen määrittelyn ID on rekisterissä tai merkitty poistetuksi, ettei aukko avaudu uudelleen.
**Valmis kun** jokainen määrittelyn tarkistus on rekisterissä tai poistettu määrittelystä, ja ID-vertailutesti menee läpi.

### [ ] T108 — Extension 2.0 (1437): ota ajastus käyttöön tai päätä sen siirto joulukuulle, **eräpäivä 30.11.2026**

Skripti ajaa kerran kuussa tuotantokirjoituksilla. Tuotantodeploymentin `customdeploy_gbb_sub_extension` ajastus **ei ole päällä** (käyttäjä 10.11.2026).
Marraskuun kohortti ajettiin 4.11. (T61, arkistossa). Ajastus on päättämättä: Monthly, päivä 10, klo 03:00, tai ajastuksen siirto joulukuulle.
- [ ] Päätä ajastus.
- [ ] Aseta ajastus UI:ssa ja tarkista, että parametrit ovat tyhjät ja neljä vanhaa parametria on poistettu (SuiteQL ei näytä kumpaakaan).

**Valmis kun** ajastus on päätetty ja asetettu, ja sen ajo näkyy `scriptnote`ssa (`scripttype = 1437`) summary-rivinä. **Eräpäivä 30.11.2026**, ettei joulukuun ajo jää väliin.

### [ ] T110 — Kauppakirjat nettohinnalla 5.–11.11.2026: uusintalähetys vain päätöksellä (ei eräpäivää)

Kauppakirjan PDF näytti `custrecord_sta_end_redemption_price`-kentän (netto) tekstillä "sis. ALV 25,5 %". Korjaus (netto × 1,255, `VAT_MULTIPLIER` `lib_bill_of_sale.js`:ssä, netsuite-send-bill-of-sale-pdf PR #1) ladattiin File Cabinetiin 11.11.2026. Syy: commit `89e781b` (5.11.) vaihtoi hinnan lähteen haun 793 Amountista nettokenttään. Esimerkki: B044432, netto 139,47 €, maksettu 175,00 €, oikea brutto 175,03 €.
**Laajuus (verified in Brevo + NetSuite):** pohja 808, 5.–11.11. (Helsinki) lähti 256 kauppakirjaa, joista 146 selvitystapa 1 ja hinta > 0 (118 delivered, 22 hardBounce, 4 blocked, 2 softBounce). Päivittäin: 5.11. 7, 6.11. 113 (101 kpl klo 16:00–16:03), 7.11. 15, 9.11. 5, 10.11. 2, 11.11. 4. Muissa 110:ssä PDF näyttää 0,00 €. Testipyörä B017530 pois.
**Vahvistettu liitteestä 11.11.2026 (käyttäjä):** B044432:n Brevo-viestin (lähti 9.11.) PDF näyttää "Sales price (incl. VAT 25.5%) 139,47 €", eli nettohinnan; oikea brutto 175,03 €. Yksittäinen tapaus: muiden PDF:ien summat ovat edelleen pääteltyjä.
**Epävarmaa (inferred):** 5.11.:n 7 kirjaa on voinut lähteä ennen `89e781b`:n käyttöönottoa; 11.11.:n 4 kirjaa riippuu korjauksen latausajasta; ennen 5.11. lähteneiden (850 kpl) hintoja ei tarkistettu (oletus: oikein, koska vanha koodi luki haun 793).
**Päätettävää (päättäjä ei nyt tavoitettavissa):**
1. Lähetetäänkö uusi kauppakirja, ja kenelle (118 toimitettua vai 146)?
2. Kerrotaanko asiakkaalle, että vanha kirja mitätöityy (pohjan 808 teksti ei sano sitä)?
3. Miten 28 bounce/blocked -tapausta käsitellään (ei kirjaa asiakkaalla, osoite selvitettävä)?
4. Rajapäivä (5.11.:n 7 kirjaa).
**Suunnitelma päätöksen jälkeen (päätelty koodista):** (1) lista 146 pyörästä on tallennettu: [`findings/2026-11-11-kauppakirjat-nettohinnalla.csv`](findings/2026-11-11-kauppakirjat-nettohinnalla.csv) (pyörä, lähetysaika, netto, odotettu brutto, Brevo-tila; ei osoitteita; tilanne 11.11., tarkista ennen nollausta lippu ja hinta NetSuitesta; tuotettu pohjalta 808, selvitystapa 1, hinta > 0); (2) nollataan `custrecord_gbb_bill_of_sale_sent_to_user` vain listan pyöriltä, nollaustapa valitaan listan jälkeen (massapäivitys XEDIT, ei CSV-import-skriptejä); (3) testi `test_bike_id` + `dry_run`; (4) 5–10 pyörän erä, tarkistus Brevosta, sitten loput; (5) jälkitarkistus: lippu päällä ja yksi uusi viesti per pyörä. Ajonmuutokset kulkevat sibling-change-työnkulun kautta, jos koodiin kosketaan.
- [ ] Päätös 1–4.
- [x] Avaa yksi liite (B044432, lähti 9.11.) ja varmista, että siinä on 139,47 €. — 11.11.2026: varmistettu, liitteessä 139,47 € (netto) tekstillä "incl. VAT 25.5%".
- [x] Varmista 5.11.:n kirjojen osalta (7 kpl, klo 08:01), oliko `89e781b` jo käytössä. — 11.11.2026: B005004:n liitteessä (Espoo 04.11.2026, omistus 05.11.) on **202,06 €**, ei nettoa 161,29 €. Viesti lähti siis vielä vanhalla koodilla (haun 793 Amount), eikä virhe koske sitä; 5.11.:n 7 kirjaa ovat todennäköisesti oikein (verifioitu vain B005004:stä). Huomio: 202,06 € poikkeaa odotetusta bruttosta 202,42 € (netto × 1,255) 36 senttiä: tarkista B005004:n lasku NetSuitesta (T110:n listan "gross_eur_expected" on laskettu kaavalla, ei laskusta).
- [ ] Rajaa uusintalista: poista 5.11.:n 7 kirjaa (B005004, B005312, B028540, B015145, B030550, B001156, B011776), ellei jonkin liitteen summa osoittaudu nettohinnaksi.
- [ ] Tuota lista ja tee uusintalähetys vain päätöksen jälkeen.

**Valmis kun** päätös on tehty ja kirjattu tähän, ja joko uudet kauppakirjat on lähetetty (jokaisesta yksi uusi Brevo-viesti) tai on päätetty, ettei niitä lähetetä.

### [ ] T83 — cf-gbb-tools: "Huoltohyvitys lunastushinnasta" -kenttä pyörärekisterityökaluun (erillinen istunto, ei takarajaa)

[ADR 0024](docs/adr/0024-huoltohyvitys-keskenkauden-lunastuksessa-ja-lookup-kentta.md), työohje ADR:n kohdassa *Toteutus cf-gbb-toolsissa*.
*Lunastushinta*-osion ylimmäksi riviksi, panelista riippumatta: KS § 11:n kaava (myös keskenkauden lunastukselle), OOMI-poikkeus,
pelkkä brutto, porrastaulu kovakoodattuna 48 arvona. Kaikki statukset.
**Valmis kun** muutos on tuotannossa, vitest kattaa ADR:n testilistan, ja hyvitys täsmää 1479:n `hyvitys`-lokikenttään vähintään kolmella `SENT`-pyörällä.

### [ ] T111 — Idea: huoltohyvitys "käytetään" lunastuksessa ja näkyy Paylink-tilauksen rivinä (brainstorm, ei takarajaa)

**Liiketoimintapäätös (12.11.2026):** lunastuksessa hyvitys kulutetaan NetSuitessa ja Paylink-tilaukseen lisätään hyvitysrivi,
joka näyttää, paljonko alkuperäisestä summasta hyvitettiin. Negatiivinen `custrecord_sta_maintenance_sum` kasvaa hyvitetyn
verran (enintään lunastushinta, ei koskaan positiiviseksi); positiivinen summa nostetaan laskun portaan ylärajaan.

**Ehdotus (kaizen, ei uutta kenttää):** 1479 (`netstuite-send-end-redemption-payment-link`) kirjoittaa käytetyn hyvityksen
olemassa olevaan huoltosummaan samassa kohdassa kuin `stampSent` / tapa 3. Uudelleenlaskenta antaa sen jälkeen 0, joten
tuplahyvitys estyy ilman tilakenttää. Paylink-tilaukseen kaksi riviä: lunastus (alkuperäinen brutto) ja *Huoltohyvitys*
(negatiivinen, = alkuperäinen brutto − maksettava brutto, jolloin summa täsmää sentilleen). Kaava on jo `lib_gbb_redemption_price.js`:ssä.

**Löydetyt riskit (koodista, ei todennettu NetSuitessa):**
- `sta_ue_bike_register_hook.js:1197` (Staria) lisää pidennysrivejä, kun summa muuttuu positiiviseksi, myös XEDITissä.
  Kirjoitus on tehtävä `submitFields(..., { ignoreTriggers: true })`, kuten `sta_ss_monthly_maintenance_budget.js:44` tekee.
- `sta_ss_monthly_maintenance_budget.js` vähentää kuukausibudjettia: jos se käsittelee lunastettuja pyöriä, käytetty hyvitys
  syntyy uudelleen. Valintaehto tarkistamatta.
- Ostolaskut (`sta_mr_vendor_bill_logic.js:330`) lisäävät inkrementtinä: kirjoitus säilyy.
- Lukijat, joiden sääntö on käytävä läpi: 1480 status-sync, `gbb_ext2_paatos.js`, IC-laskuri, cf-gbb-tools (T83-paneeli näyttää käytön jälkeen 0).
- Brevon `kayttamaton_huoltobudjetti` (ADR 0014 k24) on laskettava ennen kirjoitusta. KS § 11 "ei tallenneta rekisteriin" kumoutuu → uusi ADR.

**Avoimet kysymykset:** 1) hyväksyykö Paylink negatiivisen rivin (vara: `infoBefore`-teksti)? 2) koskeeko myös keskenkauden
lunastusta (ADR 0024 K9 = pelkkä näyttö)? 3) positiivisenkin hyvityksen katto = lunastushinta? 4) kuukausibudjettiskriptin valinta.
**Seuraava askel:** brainstorm → `/grill-with-docs` (kenttäsemantiikka, ADR 0014/0024/0026).

### [ ] T84 — B033466: varkauden lunastus peruttu (pyörä löytyi), seurantapisteet 29.10.–1.11.

Varkaus → CR 7074 (tyyppi 2, "vakuutus") + 7075 (tyyppi 11, CRMGBF0004049 −230,92) Done 6.10. → pyörä löytyi.
**Peruttu 27.–28.10.:** rekisteri palautettu (Active, `subsc_end_date` 30.11., tapa/`settled_at`/`decided_at`/`date_to_non_active` tyhjät),
RI 153082 (2026-11 Ended) → Deleted, WARNING-RI 155084 → Active, CR:t 7074 ja 7075 → Cancelled (SuiteQL 28.10.),
talous: kumoava lasku INVGBF1047148 (+230,92, loka–marras) ja käsittelykulun hyvitys CRMGBB0002772 (−200).
Ennen CR:ien perumista 1479 olisi ohittanut pyörän (`cr_2_10`) ja 1480 pitänyt sitä ennenaikaisena (ei kauden lopun vaihetta 2).

- [x] **to 29.10. aamu:** `ic_redemption_dt` (30.09.2026) ja `ic_redemption_pr` (269,10) — 1480:n pitäisi tyhjentää ne yöllä
  **Todennettu 30.10.2026: molemmat tyhjiä**, status 1, tapa tyhjä.
  (vaihe 4, ei tapaa; päätelty koodista). Käyttäjä varmistaa IC-tilanteen taloustiimiltä ennen IC-ajoa (haku 797, raja 31.10.).
- [x] **pe 30.10. klo 8 jälkeen:** 1479 `SENT B033466`, hinta 108,87 € (huoltosumma 0, ei pidennystä). Valintaehdot todennettu SuiteQL:llä 28.10.
  **Todennettu 30.10.2026:** `SENT B033466`, `hinta_netto=108.87`, linkki 136,63 € brutto, eräpäivä 30.11., Paylink 360965, Brevo ok, `eheys` tyhjä, `link_sent` = T.
- [x] **1.11. ri_update:** RI 155084 (`WARNING_BIKE-33466_2026-11`) saa `lease_fee_vat0` = 80,64541833 vaiheessa 1b
  (`can_be_updated` = T, työnantaja 2264; päätelty koodista). **Todennettu 1.11.2026 SuiteQL:** status 1 (Active), `lease_fee_vat0 = 80.64541833`.
- [ ] Talous: CRMGBF0004049 ja INVGBF1047148 ovat molemmat Open eikä niitä ole kohdistettu toisiinsa (28.10.). CRMGBB0002772 (−200) Open.

---

## Pyöräkohtaiset päätökset

Muut 28.09.2026 listatut pyörät on päätetty ja arkistoitu.

- [ ] **B046508** — lunastushinta 0, ehto täyttyy tyhjänä. Onko hinta oikeasti 0 vai puuttuuko se?

## Alihanke

- **[9.10.2026: V1–V6 tehty (käyttäjä vahvisti korjatut syys- ja lokakuun palkka-CSV:t). V7–V8 ovat auki]** **Alihanke: OOMI-vuokrahintojen korjaus** (aloitettu 1.10.2026, [`projects/2026-10-oomi-vuokrahinnat/`](projects/2026-10-oomi-vuokrahinnat/README.md)).
  46 pyörän sopimusrivien hinnat väärin (Fleet tuplaraportoi sopimukset), syys- ja lokakuun RI-rivit väärillä hinnoilla,
  osavuokrat laskettava. Tehtävät V1–V8 alihankkeen omassa TASKS.md:ssä. **Kiire: V6 ennen lokakuun palkka-CSV:tä.**

## Korjattavat dokumentit

- **Lokikellon aikaero (löydetty 1.11.2026):** Yhdysvaltain kesäaika päättyi 1.11., joten noin klo 11 Helsinkiä jälkeen ero on taas **10 h** (ennen sitä 9 h). [`queries/kuukausiajo-tarkistuslista.md`](queries/kuukausiajo-tarkistuslista.md) § 5 ("9 h talviaikana") ja [`docs/laskutusmoottori-701.md`](docs/laskutusmoottori-701.md) § 7 sanovat yhä "9 h talviaikana". Todenna uudelleen `scriptnote`-kellolla ja korjaa molemmat.
