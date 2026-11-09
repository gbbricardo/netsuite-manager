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
| T51 | Lunastusten raportointiskriptin määrittely |
| T71 | 2A-paketin konsernisiirto ei passivoi korvattuja rivejä (cr-scripts, erillinen istunto) |
| T73 | SR2 käsin jokaisen siirto- tai pakettiCR-ajon jälkeen (kunnes T71 on tuotannossa) |
| T75 | cr-scripts: jälkiveloitus vain aktiivisista riveistä, hinnat sentin tarkkuudella (erillinen istunto) |
| T76 | 23.9. ylihyvitysten lisäveloitus (taloustiimi) |
| T77 | CR 7467 (Notion 1527, pyörä 46553, 7–9/2026): hyvitys käsin |
| T98 | B040064: peruttu 2C jätti rekisterin, sopimusrivit ja raportoinnin eri linjoille |
| T91 | B027115: vuokrarivi päättyi 31.10.2026 ilman jatkoa, hallintamaksu jatkuu |
| T61 | Extension 2.0: kirjoita jälkiveloitusskripti (1437) uudelleen, **tuotannossa viimeistään 31.10.** |
| T52 | 1479:n loki käsin jokaisen ajon jälkeen (kunnes T51 on tuotannossa) |
| T83 | cf-gbb-tools: "Huoltohyvitys lunastushinnasta" -kenttä pyörärekisterityökaluun (erillinen istunto, ei takarajaa) |
| T84 | B033466: varkauden lunastus peruttu (pyörä löytyi), seurantapisteet 29.10.–1.11. |
| T69 | KL2 ei näe työnantajan laskulla maksettua keskenkauden lunastusta (cf-gbb-tools, erillinen istunto) |
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

**Nykytila:** `registry.ts` sisältää 31 tarkistusta (LU, KL, IC, EX, ML, KK). **RI-, SR-, CR-, HY- ja
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

### [ ] T51 — Lunastusten raportointiskriptin määrittely

> [!NOTE]
> **9.10.2026:** Tuoteomistaja: raportointi toteutetaan **cf-gbb-tools-näkymänä** (sisäiset työkalut, live-data SuiteQL:llä, Cloudflare Access). Ei sähköpostidigestiä eikä SuiteScriptiä. Vaatimukset ovat edelleen `docs/poikkeamaraportointi-vaatimukset.md`:ssä.

Erillinen skripti raportoi kaiken lunastuksiin liittyvän (ADR 0014 k. 18). Se korvaa 1479:n digestin. **Syötteenä on rekisterin
ja muiden tietueiden tila, ei skriptien loki** (tuoteomistaja 7.10.), ja se voi sisältää T46:n. Ei määritelty: omistava repo, kanavat ja rytmi.

**Lisävaatimukset 9.10. (T61, extension 2.0):** raportin on listattava (1) Active-tilaiset ei-OOMI-pyörät, joiden sopimus on päättynyt ja joille ei ole lähetetty
maksulinkkiä eikä ole jälkiveloitusketjua (lokakuussa 16 pyörää), ja (2) pyörät, joiden lunastushinta on 0 € mutta tapaa 4 ei ole kirjattu.
Extension ohittaa molemmat ryhmät, ja ne jäävät ihmisen ratkaistaviksi.
Vaatimukset tähän mennessä: (1) Active, ei OOMI, sopimus päättynyt, ei linkkiä, ei tapaa eikä jälkiveloitusta (ADR 0014 k. 17b; 7.10. neljä pyörää, kaikki keskenkauden lunastuksia: B023198, B024587, B024908, B020053). (2) Jälkiveloituspyörät, joilla ei ole lainkaan loppulunastustilausta (7.10. 14 pyörää, ks. T53).
(3) Status-sync 2.0:n jättämät ryhmät R1–R13 ja keskenkauden S1–S5: [`docs/poikkeamaraportointi-vaatimukset.md`](docs/poikkeamaraportointi-vaatimukset.md) ([ADR 0015](docs/adr/0015-status-sync-2-tarkennukset.md) k. 1).
**Valmis kun** määrittely on hyväksytty.

> [!NOTE]
> **9.10.2026, grilling-istunto:** T51 laajennettu kaikille toimialueille (poikkeamaraportointi). Sisältö on kanavasta riippumaton,
> ja sama sisältö toimii sekä cf-gbb-tools-näkymänä että sähköpostina (korvaa 9.10. aamun linjauksen *ei sähköpostia*). Raportti
> vain ilmoittaa, ei korjaa. Ei omistajia. Periaatteet P1–P14 ja tarkistusluettelon luonnos: `docs/poikkeamaraportointi-vaatimukset.md`.

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

### [ ] T61 — Extension 2.0: kirjoita jälkiveloitusskripti (1437) uudelleen, **tuotannossa viimeistään 31.10.**

**Käyttäjän päätökset 9.10.2026:**
- `customdeploy_gbb_sub_extension` on otettu pois ajastuksesta tarkoituksella.
- **Vaihtoehto A:** skripti kirjoitetaan uudelleen. Käsin tehtävää varasuunnitelmaa (CSV) **ei** tehdä.
- **Viat:**
  1. Väärä ajankohta: ajo kuun 1. päivänä klo 01:00 ehtii ennen kuin maksut on kirjattu.
  2. Valinta vaatii, että tallennettu haku (`subsc_end_date` = eilen) ja ajastus kohtaavat. Siksi skriptiä ei voi ajastaa
     esimerkiksi kuun 7. arkipäivälle.
- **Korjausperiaate:**
  - Valinta on ajopäivästä riippumaton: päättymispäivä edellisessä kuussa, eikä vielä tyypin 7 CR:ää sille kuulle.
  - Ajo on idempotentti, joten myöhästynyt ajo kirii kiinni.
  - Säännöt ovat samat kuin maksulinkissä: tapa asetettu tai hinta 0 = ei pidennystä, kattavuus M1.

Mittakaava: lokakuussa päättyy 481 ei-OOMI-pyörää, joilla ei ole tapaa (465 sai linkin). Elo–lokakuussa jälkiveloitus-CR:iä syntyi 137, 127 ja 91.
Vaatimukset: [`docs/extension-2-vaatimukset.md`](docs/extension-2-vaatimukset.md). Toteutus tehdään omistavassa repossa erillisessä istunnossa.

**Lisäpäätökset 9.10.** (vaatimusten § *Päätökset avoimiin kysymyksiin*):
- CR:n nimi säilyy samana.
- Myöhästynyt kuukausi kirii kiinni: yksi CR kattaa kaikki laskuttamattomat kuukaudet.
- **Ajo kuun 10. päivä klo 03:00** (vastaa 7. arkipäivää ilman viikonpäiväsääntöä).
- Error- ja Needs Review -tilainen CR estää uuden.
- Ei tiedostolokia.
- Pyörä, jolla ei ole linkkiä eikä aiempaa jälkiveloitusketjua, ohitetaan, ja ihminen ratkaisee.
- Hinta 0 ilman tapaa 4 ohitetaan. Molemmat ohitusryhmät nostetaan T51:n raportointiin.
- Kiinnikurominen ei tuota yllätyksiä: ennen lokakuuta päättyneitä Active-pyöriä ilman tapaa on vain 2 (molemmat ennen 2026, ei linkkiä eikä ketjua), joten ne ohitetaan.
- Ensimmäinen ajo on **ti 10.11.**
Tähän on yhdistetty osion *Auki, ei päivää* kohta "Jälkiveloitusketju kirjoitetaan uudelleen". T54:n oletus extension-ajosta 1.11. klo 03:00 raukeaa.

> [!NOTE]
> **12.10.2026:** sisarrepossa ei vielä toteutusta (viimeisin commit 15.9.). Vaatimukset yhtenäistetty 9.10. päätösten ja koodin mukaisiksi
> (`docs/extension-2-vaatimukset.md` § *Yhtenäistetty 12.10.2026*). Tärkein korjaus: `official_end_date` = CR:n `end_date`, koska
> `handler_jalki.js:153-154` kirjoittaa sen `subsc_end_date`:ksi (tuotannossa 339/339 näin). Muut korjaukset: ei alarajaa,
> ehto 5 CR:n loppupäivällä ja tiloilla 1/2/5/6, linkki- ja ketjuehto 5b K2:lla. Nykydatalla 367 ehdokasta, joista 4 ohitettaisiin ilman linkkiä.
> Hyväksymistestien tavoite on ma 19.10.
> **13.10.: päätöksen 7 tulkinta hyväksytty** (ohitetaan, jos ei linkkiä eikä K2-rajattua Done-pidennys-CR:ää). Määrittely on valmis
> rakennettavaksi extension-repon istunnossa. B010533 ei ole marraskuun ehdokas (`subsc_end_date` siirretty käsin 30.11.:een 12.10.).
> **13.10. toteutettu ja tarkistettu.** Määrittely muuttui samana päivänä ([ADR 0019](docs/adr/0019-extension-2-ei-kiinnikurontaa.md)): ei kiinnikurontaa,
> vaan virherivi `MISSED_MONTHS`, ja tilalle tulivat testausparametrit (Q15). Sisarrepo `netsuite-subscription-extension` master `0115cac`
> (`mr_subscription_extension.js` + `gbb_ext2_paatos.js`). Paikalliset testit 68/68 ok.
> - *Koodista todettu:* SQL, ohitussäännöt 1–14, CR:n kentät (`official_end_date` = `end_date`) ja lokitus vastaavat määrittelyä.
>   Ehdon 6 fragmentit tarkistetaan testissä merkki merkiltä 1480:tä vasten.
> - *NetSuitesta todettu:* File Cabinetin tiedostot 372442 ja 505980 (13.10.) ovat tavuilleen samankokoiset kuin repossa, ja
>   hintakirjastot ovat 1479:n kansiossa 40451. Testideployment `customdeploy_gbb_sub_extension_test` on olemassa. Molemmat deploymentit ovat `NOTSCHEDULED`.
>   Dry run 13.10. lokakuun ikkunalla tuotti `ehdokkaita=0, ohitettu_ei_linkkia=2`, mikä täsmää omaan kyselyyn (B023198, B024908).
> - **Aukko:** lokakuussa yksikään pyörä ei läpäise ehtoja 1–6. Siksi map-vaihetta (hinnoittelu, `record.create`, päivämääräkentät)
>   ei voi ajaa NetSuitessa ennen marraskuuta, ei myöskään `bike_id`-rajauksella. Ne on todennettu vain paikallisessa simulaatiossa (350 CR:ää).
>   Ehdotus: aja dry run testideploymentilla ma 2.11. (marraskuun ikkuna). Aja sen jälkeen yhden pyörän oikea ajo, esim. ma 9.11., pyörälle,
>   jonka maksamattomuus on tarkistettu, ja seuraa sen CR 1199:n läpi. Tuotantoajo on 10.11.
> - **Ennen 10.11.:** tuotantodeploymentin ajastus Monthly, päivä 10, klo 03:00, parametrit tyhjinä. Neljän vanhan parametrin
>   poistoa ei voitu tarkistaa SuiteQL:llä, joten se tarkistetaan UI:sta.

**Valmis kun** uusi skripti on ajanut marraskuussa ja jokaisella lokakuussa päättyneellä maksamattomalla ei-OOMI-pyörällä on tyypin 7 CR, eikä
yksikään pyörä, jolla on tapa tai hinta 0, ole saanut CR:ää.

> [!NOTE]
> **Valmistelu tehty 4.11.2026 (Claude). Dry run ajettu 4.11. klo 11:10 Helsinkiä (käyttäjä) — tulos alla, täsmää ennusteeseen.**
>
> **0. Dry runin tulos 4.11.2026 (`scriptnote` 1437, lokissa 4.11. klo 01:10), testideployment `customdeploy_gbb_sub_extension_test`:**
> `mr_subscription_extension: summary (DRY RUN)` →
> `selection: ikkuna=ennen 2026-11-01, ehdokkaita=167, ohitettu_avoin_cr=0, ohitettu_ei_linkkia=2, ohitettu_maksettu=0;`
> `would_create=167, ohitettu_hinta0_ei_tapaa=0, ohitettu_katettu=0, NOT_PRICED=0, NO_EMPLOYER=0, MISSED_MONTHS=0, END_NOT_MONTH_END=0, virheet=0`
> — **täsmälleen alla ennustettu rivi**, ei `EI_TASMAA`-päätettä, ei `luotu=`-laskuria.
> 168 lokiriviä, kaikki AUDIT: 167 `WOULD_CREATE` + yhteenveto. **0 ERROR-riviä.**
> **Mitään ei kirjoitettu:** tyypin 7 CR:iä on luotu 3.–4.11. neljä, kaikki ihmisen tekemiä (3 Serres-paketin *2A - jälkiveloitus*
> ja 1 *CR7396 - Jälkiveloitus 2*), eikä yksikään ole ext2:n nimimallia *… - pidennys - jälkiveloitus*.
> Pistokokeet hinnoittelusta: B018829 `hinta_netto=131.45, huoltohyvitys=0, maksettava_netto=131.45`, B020745 87,10 ja B026850 129,03 —
> samat kuin rekisterin hinnat, huoltosumma 0 → ei hyvitystä (säännöt 9–10 oikein).
> **Tämä on ensimmäinen kerta, kun kartoitusvaihe (hinnoittelu ja päätös) on ajettu NetSuitessa** — 13.10. lokakuun ikkunalla
> ehdokkaita oli 0, joten vaihe jäi todentamatta. Kirjoitusten osuus (`record.create`, päivämääräkentät) on yhä ajamatta: se on 9.11.
>
> **1. Todennettu ennen ajoa**
> - **Testit 68/68 läpi nykyisillä kirjastoilla.** `test/run_tests.js` lataa oikeat sisartiedostot, ei kopioita:
>   `lib_gbb_redemption_price.js` ja `lib_gbb_helsinki_date.js` 1479:n reposta (`b2fb0a6`, **julkaisu C 27.10.**) ja
>   `gbb_mr_redemption_sync2.js` 1480:n reposta (`58a1bdd`, K2). Edellinen testiajo 13.10. oli vielä julkaisua C
>   edeltävää kirjastoa vasten, joten tämä on uusi tieto: **ext2 on yhteensopiva nykyisen hinnoittelukirjaston kanssa**
>   ja ehto 6:n SQL-fragmentit täsmäävät yhä 1480:een merkki merkiltä (testi vertaa ne).
> - **File Cabinet vastaa repoa.** 372442 `mr_subscription_extension.js` 14 144 tavua ja 505980 `gbb_ext2_paatos.js`
>   22 083 tavua, molemmat 13.10. klo 15:26 — tavulleen samat kuin repon tiedostot, ja repo on muuttumaton 13.10. jälkeen.
> - **Deploymentit:** `customdeploy_gbb_sub_extension` ja `customdeploy_gbb_sub_extension_test` molemmat `NOTSCHEDULED`,
>   `isdeployed` = T. Parametreja ei voi lukea SuiteQL:llä.
>
> **2. Ennuste marraskuun ikkunalle (skriptin omat kyselyt tuotantodataa vasten 4.11., `kk_alku` = 2026-11-01)**
>
> | Kohta | Arvo |
> |---|---|
> | Ehdot 1–4 läpäisevät (`perus`) | **169** |
> | − `ohitettu_avoin_cr` (ehto 5) | **0** |
> | − `ohitettu_ei_linkkia` (ehto 5b) | **2** |
> | − `ohitettu_maksettu` (ehto 6) | **0** |
> | **= `ehdokkaita`** | **167** |
> | Kartoitus: `would_create` / `luotu` | **167** |
> | `ohitettu_hinta0_ei_tapaa`, `ohitettu_katettu`, `NOT_PRICED`, `NO_EMPLOYER`, `MISSED_MONTHS`, `END_NOT_MONTH_END` | **0 kaikki** |
>
> Kaikilla 167:llä `subsc_end_date` = **31.10.2026** (= `edKkLoppu`, ehdot 12–13 läpi), hinta > 0, työnantaja asetettu,
> ja vain yhdellä on negatiivinen huoltosumma. Odotettu yhteenvetorivi:
> `selection: ikkuna=ennen 2026-11-01, ehdokkaita=167, ohitettu_avoin_cr=0, ohitettu_ei_linkkia=2, ohitettu_maksettu=0; would_create=167, …, virheet=0`
> **ilman `EI_TASMAA`-päätettä.** Vertailu: elo–lokakuussa CR:iä syntyi 137, 127 ja 91; 167 on isompi, koska lokakuussa ei ajettu lainkaan.
>
> **3. Dry run (käyttäjä, UI) — aja tämä ensin**
> 1. `customdeploy_gbb_sub_extension_test`: `custscript_gbb_ext_dry_run` = rasti päälle, `custscript_gbb_ext_bike_id` **tyhjä**.
> 2. Save and Execute.
> 3. Lue `scriptnote` (`scripttype = 1437`) ja vertaa yllä olevaan riviin. Dry runissa ei saa olla `luotu=`-laskuria eikä yhtään CR:ää.
>
> **4. Yhden pyörän oikea ajo (ma 9.11.) — ehdotus `custscript_gbb_ext_bike_id` = `20745` (B020745)**
> LVI-Aitta Oy, hinta 87,10 € netto, huoltosumma 0, `subsc_org_end_date` = `subsc_end_date` = 31.10.2026, linkki lähetetty,
> ei aiempaa pidennys-CR:ää eikä tyypin 2/10 CR:ää. **Maksamattomuus todennettu:** Paylink-tilaus 351621 (1.10. erä) on yhä `pending`.
> Vaihtoehdot samoilla ehdoilla: B018829, B021044, B023554, B026850.
>
> **5. Ennen 10.11.** Tuotantodeployment `customdeploy_gbb_sub_extension`: Monthly, päivä 10, klo 03:00, molemmat parametrit tyhjinä,
> ja neljän vanhan parametrin poisto tarkistettava UI:sta.
>
> **Sivuhavainto, ei T61:n este (oma selvitys):** näiden viiden ehdokkaan 1.10. maksulinkki on **noin 80 € brutto pienempi**
> kuin rekisterin nykyinen `end_redemption_price` × 1,255 (B020745: linkki 29,19 €, hinta 87,10 € netto → 109,31 €).
> Syy **ei** ole vanha hyvityslogiikka: 1.10. voimassa ollut kirjasto palautti pidentämättömälle pyörälle hyvityksen 0
> (`months === 0` → `source: 'no-extension'`). 1479:n loki 1.10. on jo pyyhitty (säilytys ~30 vrk), joten ero on selvitettävä
> rekisterin hintakentän historiasta. Koskee koko 1.10. kohorttia, ei vain näitä viittä.

### [ ] T52 — 1479:n loki käsin jokaisen ajon jälkeen (kunnes T51 on tuotannossa)

> [!NOTE]
> **Tilanne 9.10.2026:** 1479 ei ole ajanut 7.10. jälkeen (ks. T30). 7.10. tuli kaksi RUN ABORTEDia: `months_before` oli ensin tyhjä ja sitten 3.
> **Käyttäjä 9.10.:** ajastus on päivittäin klo 8:00, `custscript_gbb_eredem_months_before` = 1 ja dry run on pois päältä. Seuraava ajo on la 10.10. klo 8:00. Lue sen `selection`- ja `run complete` -rivit.

> [!NOTE]
> **Luettu 21.10.2026 (ajot 14.–21.10. Helsingin aikaa, 8 kpl):** kaikissa `dryRun=false`, `months_before=1`, `selected=1` ja
> `run complete` = `SKIP_LINKED_SO=1 unhandledMapErrors=0`. ERROR-, ABORT-, `STAMP_FAILED`-, `EMAIL_FAILED`- ja `NOT_PRICED`-rivejä ei ole.
> Linkkejä ei lähtenyt, koska marraskuun kohortin lähetyspäivä ei ole vielä tullut (`suodatettu lahetyspaiva=0`). Seuraava merkittävä ajo on kohorttiajo 31.10.

> [!NOTE]
> **Luettu 23.10.2026 (ajo 23.10. klo 8, lokissa 22.10. 22:02):** `dryRun=false`, `selected=1`, `run complete` = `SENT=1 unhandledMapErrors=0`.
> **B031422 sai linkin** (T35): `hinta_netto=100.81 huoltosumma=0 hyvitys=0`, linkki 126,52 € brutto, eräpäivä 31.10., Paylink 358177/18438, Brevo ok, `eheys` tyhjä.
> Rekisteri: status 1, `eredem_link_sent` = T, tapa tyhjä, päättyy 31.10.2026. ERROR- ja muita poikkeusrivejä 0.

> [!NOTE]
> **Luettu 4.11.2026 (ke 4.11. klo 8 ajo, `months_before` = 2 ensimmäistä kertaa).** Tulosrivit T80:ssä. Loppucheckit:
>
> 1. **Eheysjakauma.** 1 003 rivistä 981 tyhjää, **17 `HYVITYS_YLI_PORTAAN`** (13 `SETTLED_MAINT_BUDGET` + 4 `SENT`),
>    **3 `S9,S10`** ja **2 `S10`**, kaikki `SENT`. Pistokokeet laskevat oikein, esim. B002193 116,33 − 88,45 = 27,88 netto → 34,99 brutto
>    ja B004274 192,02 − 177,29 = 14,73 hyvitys → 149,52 brutto. Neljä `SENT`-riviä `HYVITYS_YLI_PORTAAN`illa ovat oikein:
>    hyvitys ylittää leveimmän portaan mutta jää alle hinnan, joten linkki lähtee erotuksesta.
>    **T80:n odotus “S9/S10 odotettavissa 139 pidennetyllä” oli väärin, eikä ero ole vika.** S9 ja S10 ovat ristiriitalippuja,
>    eivät “on pidennetty”-lippuja: `gbb_mr_send_end_redemption_paylink.js:581` nostaa S9:n vain, kun
>    `(extensionMonths > 0) !== hasProlongationRows`, ja `lib_gbb_redemption_price.js:188` S10:n vain, kun portaan
>    `prolongMonths` > myönnetyt kuukaudet. Huoltopidennetyllä pyörällä molemmat todistajat ovat samaa mieltä, joten lippua ei tule.
> 2. **Tuplatilaukset: ei vielä tarkistettavissa, uusitaan to 5.11.** Lokin sisällä tuplia ei ole (1 003 riviä, 1 003 eri pyörää).
>    `customrecord_payment_requests` **laahaa yhden vuorokauden**: Paylink-tilaukset 362477+ eivät ole vielä taulussa
>    (suurin löytyvä 362291, sync luo rivit n. klo 09:30 Helsinkiä seuraavana päivänä — 30.10. erän 788 riviä syntyi 31.10.).
>    Kohortissa (päättyy 4.11.2026–7.1.2027, `link_sent` = T) **0 pyörää, jolla olisi kaksi loppulunastustilausta**;
>    kaksi kahden rivin pyörää eivät ole tuplia (B016051 kaksi vuokratilausta, B046778 käsiraha + 30.10. lunastus).
> 3. **Rekisterikirjoitukset täsmäävät 14/14.** 13 pyörää tapa 3 (B038843, B039360, B040320, B041481, B041687, B043000,
>    B043341, B044478, B045146, B045479, B045699, B046021, B046156) ja B037136 tapa 4 (hinta 0, ITSEHANKINTA).
>    Kaikilla `liab_settled_at` = 04.11.2026, `paid_at` tyhjä, `link_sent` = F, status 1 ja päättyminen joulukuussa
>    (B043000 1.1.2027) — 1480 lunastaa ne päättymiskuun alussa.
> 4. **Kohortin kokonaiskuva:** ikkunassa 20 pyörää ilman linkkiä ja tapaa (= 19 lähetyspäivää odottavaa + 1 rajattu tilaus),
>    15 tapa 3 ilman linkkiä (tämän päivän 13 + 1.11. kaksi).

A-julkaisu poistaa digestin. Lue jokaisen ajon jälkeen `scriptnote` (`scripttype = 1479`): `log.error`-rivit (`ERROR`, `STAMP_FAILED`, `EMAIL_FAILED`),
`NOT_PRICED`, `SKIP_*`, sekä rivit, joilla `eheys` ei ole tyhjä. Lokin säilytys on noin 30 päivää. Rakenna kysely `queries/`-kansioon A:n ensimmäisen ajon jälkeen.
**Valmis kun** T51:n tarkistus ML4 on tuotannossa (Q26, 9.10.2026).

### [ ] T83 — cf-gbb-tools: "Huoltohyvitys lunastushinnasta" -kenttä pyörärekisterityökaluun (erillinen istunto, ei takarajaa)

[ADR 0024](docs/adr/0024-huoltohyvitys-keskenkauden-lunastuksessa-ja-lookup-kentta.md), työohje ADR:n kohdassa *Toteutus cf-gbb-toolsissa*.
*Lunastushinta*-osion ylimmäksi riviksi, panelista riippumatta: KS § 11:n kaava (myös keskenkauden lunastukselle), OOMI-poikkeus,
pelkkä brutto, porrastaulu kovakoodattuna 48 arvona. Kaikki statukset.
**Valmis kun** muutos on tuotannossa, vitest kattaa ADR:n testilistan, ja hyvitys täsmää 1479:n `hyvitys`-lokikenttään vähintään kolmella `SENT`-pyörällä.

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

### [ ] T69 — KL2 ei näe työnantajan laskulla maksettua keskenkauden lunastusta (cf-gbb-tools, erillinen istunto)

Löydetty 22.10. T10:n siirrossa. KL2 (`cf-gbb-tools/src/app/lib/tools/netsuite-reporting/checks/kl2.ts`) hakee maksun vain `customrecord_payment_requests`:sta
(`kesken kauden` ja `ns_status` = 3). Keskenkauden lunastus voidaan maksaa myös työnantajalle tehdyllä laskulla (esim. B046429, INVGBB1009935,
2M-IT Oy, 1 172 €, maksettu 10.06.2026, `custbody_sta_bike_id` = pyörä). Silloin pyörällä on `paid_at`, mutta KL2 ei listaa sitä.
**Tehtävä cf-gbb-toolsissa:** lisää KL2:een toinen maksulähde (maksettu `CustInvc`, jolla `custbody_sta_bike_id` = pyörä ja keskenkauden lunastuksen nimike),
tai lue pyörän `custrecord_gbb_redemption_paid_at`. Tarkista nimikkeen id ennen toteutusta. **Valmis kun** KL2 listaa B046429:n (tai sen CR on tehty).

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
