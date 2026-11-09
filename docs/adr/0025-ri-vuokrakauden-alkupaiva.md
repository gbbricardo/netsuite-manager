# ADR 0025 — "Vuokrakausi alkanut" tarkoittaa nykyisen työnantajan vuokrakauden alkua

- **Päivämäärä:** 2026-11-02
- **Tila:** Hyväksytty (käyttäjä 2.11.2026)
- **Koskee:** `netsuite-monthly-reporting` (luku, palkka-CSV sarake 8), `netsuite-subscrption-cr-scripts` (kirjoitus), pyörärekisterin uusi kenttä
- **Liittyy:** [ADR 0020](0020-kuukausiraportointiin-vaikuttavat-tiedot.md) k. 11 (siirtokuussa raportointi vaihtaa työnantajaa päivästä `official_end_date` + 1)
- **Todisteet:** [löydös 2.11.2026](../../findings/2026-11-02-ri-vuokrakauden-alkupaiva-palautuu-siirron-jalkeen.md)
- **Toteutus:** TASKS T95 (kenttä + kirjoittaja), T96 (raportoinnin luku), T97 (täydennys)

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

4. **Kirjoittaja on `cr_bike_register_apply` — siirtojen ainoa rekisterikirjoittaja** (tarkennettu
   2.11.2026), arvo `custrecord_cr_contract_official_end_date` + 1 — sama päivä, jonka
   `ue_reporting_item_transfers.js:873` (tyyppi 1) ja `:940` (tyyppi 6) jo kirjoittavat siirtokuukauden
   riville. Yksi sääntö, yksi tiedosto.

   `handler_siirto_ta` (tyyppi 1) ja `handler_konserni` (tyyppi 9) kutsuvat kirjastoa jo nyt.
   `handler_siirto_tt` (tyyppi 6) **reititetään sen läpi**: se kirjoittaa rekisteriin tällä hetkellä itse
   (`handler_siirto_tt.js:59-64`, oma `capture()` + `submitFields()` -pari), eli duplikaatti on olemassa jo
   ennen tätä päätöstä. Yhtenäistäminen poistaa sen.

   **Perustelu on kirjoitushetki, ei tyyli.** Kenttä on kirjoitettava samalla hetkellä kuin se suhde, jota se
   kuvaa. Tyypin 1 rekisterikirjoitus on lähes aina lykätty: `apply()` kirjoittaa heti vain jos
   `cr_start_date` on viimeistään ensi kuun 1., muuten työnantaja vaihtuu vasta
   `cr_bike_register_updater`-ajossa kuukauden viimeisenä päivänä. Mitattu 2.11.2026 Done-tilaisista CR:istä
   (`closed_date` asetettu):

   | Tyyppi | Heti | Siirtyy kk-vaihteeseen | Lykättyjen osuus |
   |---|---|---|---|
   | 1 *Siirto TA* | 12 | 121 | **91 %** |
   | 9 *Siirto konserni* | 98 | 198 | 67 % |
   | 6 *Siirto TT* | 1 | 15 | — (ei lykkäyspolkua: updater kyselee vain tyypit 1 ja 9) |

   Jos kenttä kirjoitettaisiin Done-hetkellä (dispatcherissa tai uudessa UE-skriptissä), se asettuisi
   rekisteriin kuukausia ennen työnantajan vaihtumista. Esimerkki: CR suljetaan 26.2., `start_date` 1.4. →
   maaliskuun ajo tuottaa rivin, jossa on **vanha työnantaja ja uusi vuokrakauden alku**. Sarake 8 menisi
   väärin välikuukausilta, hiljaa ja ilman Warningia — sama vikaluokka, jonka tämä ADR korjaa, 121:ssä
   siirrossa 133:sta.

   Jos CR:n `official_end_date` on tyhjä, kenttää ei kirjoiteta eikä CR mene Erroriin: rivi on silloin
   sama kuin ennenkin, ja asia hoidetaan käsin.

5. **Lukijat käyttävät `COALESCE(custrecord_gbb_employer_lease_start, custrecord_sta_subsc_start_date)`.**
   Kenttä ei saa koskaan olla ennen pyörän omaa `subsc_start_date`:a — vuokrakausi ei voi alkaa ennen kuin se alkaa.
   Tämä on myös kertatäydennyksen validointisääntö: jos korjattu päivä on rekisterin päivää aikaisempi,
   kenttä jätetään tyhjäksi ja tapaus tutkitaan erikseen. Tunnettu tapaus **B011413** (RI 01.04.2025 vs.
   rekisteri 01.05.2025): työnantaja on vaihdettu takautuvasti ennen vuokrasopimuksen alkua, koska työntekijä
   on vaihtanut työpaikkaa tilauksen aikana. Siellä rekisterin arvo on oikea.

6. **Kentän nollaavat tyypit 1 ja 6, ei tyyppi 9** (käyttäjä 2.11.2026).

   | Tyyppi | Mikä vaihtuu | Nollaako | Kutsuja → kirjoittaja (k. 4) |
   |---|---|---|---|
   | 1 *Siirto TA* | työnantaja | **kyllä** | `handler_siirto_ta` / `cr_bike_register_updater` → `cr_bike_register_apply` |
   | 6 *Siirto TT* | loppukäyttäjä | **kyllä** | `handler_siirto_tt` → `cr_bike_register_apply` |
   | 9 *Siirto konserni* | laskutettava asiakas konsernin sisällä | **ei** | `handler_konserni` / `cr_bike_register_updater` → `cr_bike_register_apply` |

   Koska kaikki kolme tyyppiä kulkevat saman funktion läpi, **tyypin 9 rajaus on pakollinen `crType`-portti,
   ei valinnainen**: ilman sitä konsernisiirto nollaisi vuokrakauden. Malli on samassa funktiossa jo
   valmiina (`cr_bike_register_apply.js:50`).

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
  Ei uutta kenttää ja muutos vain yhteen repoon, mutta jokainen lukija joutuisi pitämään CR-hakutaulua
  muistissa joka ajossa — yhdeksän lukukohtaa seitsemässä skriptissä. Se on hylkäyksen peruste.
  (Aiempi sanamuoto nojasi myös 482 päivämäärättömään CR:ään; ks. § *Mikä ei ole peruste*.)
- **Johtaminen sopimusriviltä.** Hylätty todennettuna: B034594:n sopimusrivit alkavat 01.12.2025,
  eivät 01.02.2024 — indeksi- ja hintakloonaukset siirtävät rivin alkupäivää.
- **Johtaminen RI-historiasta** (pyörän ja työnantajan varhaisin rivi). Hylätty: historia on epätäydellinen
  (B034594:llä ei ole riviä ennen 08/2026) ja RI-taulu on juuri se, joka rakennetaan uudestaan.
- **Toinen sarake CSV:hen.** Hylätty: CSV:n rakenteen muutos rikkoisi työnantajien palkkajärjestelmien tuonnit.
- **Korjaus-CSV joka kuukausi** väliaikaisratkaisuna. Hylätty k. 7:n mukaan: käsityö, joka jo unohtui
  loka- ja marraskuussa.
- **Kirjoitus dispatcherin success-polulla tai uudessa CR:n User Event -skriptissä.** Houkutteleva, koska se
  olisi yksi paikka kaikille tyypeille. Hylätty mittauksella (k. 4): Done-hetken kirjoitus osuu väärään
  kuukauteen 121:ssä tyypin 1 siirrossa 133:sta.
- **Sama pätkä jokaiseen CR-käsittelijään.** Hylätty: kymmenen tiedostoa kirjoittaa pyörärekisteriä jo nyt,
  ja sääntö kopioituisi niihin kaikkiin — hajautuksen pahin muoto.
- **Jaettu sääntömoduuli + kaksi kutsupaikkaa** (`apply()` tyypille 1, `handler_siirto_tt` tyypille 6).
  Toimii ja on pienin mahdollinen muutos, mutta jättää saman säännön kahteen eri muotoiseen
  kirjoituspaikkaan. Hylätty 2.11.2026 (käyttäjä): symmetria ratkaisee.

## Mikä ei ole peruste

**482 päivämäärätöntä tyypin 1 CR:ää eivät ole suunnittelurajoite** (käyttäjä 2.11.2026). Ne ovat toisen
kehittäjän massatuonti — purkkaviritys RI-raportointia varten, ei harkittu tietomalli. Ne kertovat, millaista
dataa kantaan on päätynyt, eivät sitä, miten järjestelmä pitäisi rakentaa. Niitä ei käytetä argumenttina
kehityksessä kumpaankaan suuntaan: historian hoitaa kertatäydennys (T97), ja uusi koodi kirjoittaa kentän
oikein eteenpäin.

## Seuraukset

- Kenttä on luotu 2.11.2026, joten koodimuutokset voivat alkaa. `COALESCE`-luku on turvallinen myös
  tyhjällä kentällä, joten T96 voi mennä ensin.
- Kertatäydennys koskee **477 pyörää** (tyypin 1 takautuvat CR:t; lähde syyskuun 2026 RI-rivit, validointi
  k. 5) ja lisäksi **16 pyörää** tyypin 6 Done-CR:istä, joilla `official_end_date` on asetettuna kaikilla —
  ne lasketaan suoraan CR:stä, ei RI-riveistä.
- `schemas/records/customrecord_sta_bike_register.md` päivitetty 2.11.2026.
- K. 4 tekee T95:stä refaktoroinnin, ei kahden rivin lisäystä: `cr_bike_register_apply.apply()` saa
  tyyppikohtaisen kenttäjoukon, ja `next_billto_customer`-heitto siirtyy tyyppiportin taakse (tyyppi 6 ei
  sitä kenttää käytä). Funktio on kolmen kutsujan jaettu, joten todennus vaatii NetSuite-ajon **kaikilla
  kolmella tyypillä 1, 6 ja 9** — ei pelkkää tyypin 1 ajoa.
- Päiväsääntö kannattaa eristää puhtaaksi funktioksi (`resolveEmployerLeaseStart(officialEnd, registerStart)`
  → Date tai null, sisältää k. 5:n validoinnin). Repossa on ajuri `node --test tests/*.test.js`, joten
  sääntö saa yksikkötestit; `apply()` itse ei ole testattavissa, koska se käyttää `N/record`:ia.
