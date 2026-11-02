# ADR 0025 — "Vuokrakausi alkanut" tarkoittaa nykyisen työnantajan vuokrakauden alkua

- **Päivämäärä:** 2026-11-02
- **Tila:** Hyväksytty (käyttäjä 2.11.2026)
- **Koskee:** `netsuite-monthly-reporting` (luku, palkka-CSV sarake 8), `netsuite-subscrption-cr-scripts` (kirjoitus), pyörärekisterin uusi kenttä
- **Liittyy:** [ADR 0020](0020-kuukausiraportointiin-vaikuttavat-tiedot.md) k. 11 (siirtokuussa raportointi vaihtaa työnantajaa päivästä `official_end_date` + 1)
- **Todisteet:** [löydös 2.11.2026](../../findings/2026-11-02-ri-vuokrakauden-alkupaiva-palautuu-siirron-jalkeen.md)
- **Toteutus:** TASKS T95 (kenttä + handler), T96 (raportoinnin luku), T97 (täydennys)

## Konteksti

Palkka-CSV:n sarake 8 *"Vuokrakausi alkanut"* tulee kentästä `custrecord_gbb_ri_lease_start_date`, joka
rakennetaan joka kuukausi uudestaan pyörärekisterin kentästä `custrecord_sta_subsc_start_date`. Työnantajasiirto
(tyyppi 1 *Siirto TA*) ei päivitä sitä kenttää, joten siirtynyt pyörä raportoi uudellekin työnantajalle
alkuperäisen sopimuksen alkupäivän. Ainoa poikkeus on siirtokuukauden rivi, jolle
`ue_reporting_item_transfers.js:873` kirjoittaa siirtopäivän — yhden kerran.

Asiakkaat ovat hämmentyneet: esim. **B034594** siirtyi työnantajalta toiselle 1.2.2024, mutta CSV näyttää
01.09.2023. 27.08.2026 korjattiin käsin 497 syyskuun riviä; lokakuun ajossa kaikki 497 palautuivat.

## Päätökset

1. **Sarake "Vuokrakausi alkanut" tarkoittaa nykyisen työnantajan vuokrakauden alkua**, ei alkuperäisen
   sopimuksen alkua. Tämä vastaa sitä, mitä siirto-UE jo kirjoittaa siirtokuukaudelle (ADR 0020 k. 11), ja sitä,
   mitä 27.08.2026 korjattiin käsin. CSV:n rakenne ei muutu: uutta saraketta ei lisätä.

2. **`custrecord_sta_subsc_start_date` säilyy koskemattomana.** Se on myös IC-lunastushinnan poistoankkuri
   (`netsuite-ic-calculators/src/gbb_ic_redemption_price_mr.js:143`), joten sen ylikirjoittaminen siirrossa
   korruptoisi lunastushinnat. Alkuperäisen sopimuksen alkupäivä on oma tietonsa.

3. **Nykyisen työnantajan alkupäivä talletetaan uuteen pyörärekisterin kenttään.**

   | | |
   |---|---|
   | Kenttä | `custrecord_gbb_employer_lease_start` |
   | Otsikko | *Nykyisen työnantajan vuokrakauden alku* |
   | Tyyppi | Date |
   | Tyhjä arvo | pyörä ei ole vaihtanut työnantajaa — rekisterin `subsc_start_date` on oikea |

   Kenttä on **luotu 2.11.2026** ja todennettu SuiteQL:ssä (46 771 pyörää, 0 arvoa).

   Kenttä valittiin CR:stä johtamisen sijaan, koska raportointi rakentaa rivit joka kuukausi rekisteristä
   ja lukee sen yhdellä haulla: kenttä tulee mukaan ilmaiseksi, eikä yksikään lukija tarvitse CR-hakutaulua.

4. **Kirjoittajat ovat `handler_siirto_ta` ja `handler_siirto_tt`** (k. 6), arvo
   `custrecord_cr_contract_official_end_date` + 1 — sama päivä,
   jonka `ue_reporting_item_transfers.js:873` jo kirjoittaa siirtokuukauden riville. Yksi kirjoittaja, yksi sääntö.
   Jos CR:n `official_end_date` on tyhjä, kenttää ei kirjoiteta eikä CR mene Erroriin: rivi on silloin
   sama kuin ennenkin, ja asia hoidetaan käsin.

5. **Lukijat käyttävät `COALESCE(custrecord_gbb_employer_lease_start, custrecord_sta_subsc_start_date)`.**
   Kenttä ei saa koskaan olla ennen pyörän omaa `subsc_start_date`:a — vuokrakausi ei voi alkaa ennen kuin se alkaa.
   Tämä on myös kertatäydennyksen validointisääntö: jos korjattu päivä on rekisterin päivää aikaisempi,
   kenttä jätetään tyhjäksi ja tapaus tutkitaan erikseen. Tunnettu tapaus **B011413** (RI 01.04.2025 vs.
   rekisteri 01.05.2025): työnantaja on vaihdettu takautuvasti ennen vuokrasopimuksen alkua, koska työntekijä
   on vaihtanut työpaikkaa tilauksen aikana. Siellä rekisterin arvo on oikea.

6. **Kentän nollaavat tyypit 1 ja 6, ei tyyppi 9** (käyttäjä 2.11.2026).

   | Tyyppi | Mikä vaihtuu | Nollaako | Käsittelijä |
   |---|---|---|---|
   | 1 *Siirto TA* | työnantaja | **kyllä** | `handler_siirto_ta.js` |
   | 6 *Siirto TT* | loppukäyttäjä | **kyllä** | `handler_siirto_tt.js` |
   | 9 *Siirto konserni* | laskutettava asiakas konsernin sisällä | **ei** | — |

   Tyyppi 6 nollaa, koska uudelle työntekijälle vuokrakausi oikeasti alkaa siirrosta, ja koska
   `ue_reporting_item_transfers.js:940` kirjoittaa jo nyt siirtopäivän siirtokuukauden riville — ilman tätä
   päätöstä tyypin 6 siirtokuukausi jäisi epäjohdonmukaiseksi. Tyyppi 9 ei nollaa: konsernin sisällä
   työntekijän osalta mikään ei muutu, ja sama jatkuvuustulkinta on jo verovapaussäännössä
   (`docs/verovapaus-saannot.md`: tyyppi 9 säilyttää verovapauden, tyyppi 1 ei).

   Kenttä tarkoittaa siis **nykyisen vuokrasuhteen alkua** — työnantajan tai loppukäyttäjän, kumpi tahansa
   vaihtui viimeksi. Script id ja otsikko säilyvät k. 3:n mukaisina.

7. **Väliaikaista kuukausittaista korjausta ei tehdä** (käyttäjä 2.11.2026). Joulukuun CSV lähtee alkuperäisillä
   alkupäivillä, kuten loka- ja marraskuunkin. Myöskään jo lähteneitä kuukausia ei korjata takautuvasti.

## Vaihtoehdot, joita ei valittu

- **`subsc_start_date`:n ylikirjoitus siirrossa** (kuten `handler_siirto_pt.js:62` tekee tyypille 3).
  Hylätty k. 2:n perusteella: rikkoisi IC-lunastushinnat.
- **Johtaminen tyypin 1 CR:stä raportoinnissa** (`official_end_date` + 1 viimeisimmästä Done-CR:stä).
  Ei uutta kenttää ja muutos vain yhteen repoon, mutta 482 olemassa olevaa CR:ää on päivämäärättömiä,
  joten kertatäydennys tarvitaan silti — ja jokainen lukija joutuisi pitämään CR-hakutaulua muistissa.
- **Johtaminen sopimusriviltä.** Hylätty todennettuna: B034594:n sopimusrivit alkavat 01.12.2025,
  eivät 01.02.2024 — indeksi- ja hintakloonaukset siirtävät rivin alkupäivää.
- **Johtaminen RI-historiasta** (pyörän ja työnantajan varhaisin rivi). Hylätty: historia on epätäydellinen
  (B034594:llä ei ole riviä ennen 08/2026) ja RI-taulu on juuri se, joka rakennetaan uudestaan.
- **Toinen sarake CSV:hen.** Hylätty: CSV:n rakenteen muutos rikkoisi työnantajien palkkajärjestelmien tuonnit.
- **Korjaus-CSV joka kuukausi** väliaikaisratkaisuna. Hylätty k. 7:n mukaan: käsityö, joka jo unohtui
  loka- ja marraskuussa.

## Seuraukset

- Kenttä on luotu 2.11.2026, joten koodimuutokset voivat alkaa. `COALESCE`-luku on turvallinen myös
  tyhjällä kentällä, joten T96 voi mennä ensin.
- Kertatäydennys koskee **477 pyörää** (tyypin 1 takautuvat CR:t; lähde syyskuun 2026 RI-rivit, validointi
  k. 5) ja lisäksi **16 pyörää** tyypin 6 Done-CR:istä, joilla `official_end_date` on asetettuna kaikilla —
  ne lasketaan suoraan CR:stä, ei RI-riveistä.
- `schemas/records/customrecord_sta_bike_register.md` päivitetty 2.11.2026.
