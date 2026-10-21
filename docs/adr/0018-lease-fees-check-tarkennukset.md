# ADR 0018 — Lease fees check: jono koodissa, lippu vasta päättymisen jälkeen, asiakas laskutushistoriasta

- **Päivämäärä:** 2026-10-12
- **Tila:** Hyväksytty (tuoteomistaja, grilling-istunto 12.10.2026, kysymykset Q1–Q19; Q18–Q19 PR #1:n jälkeen)
- **Koskee:** `netsuite-br-lease-fees-check` (`mr_lease_fees_check_v2.js`, skripti 1432 `customscript_gbb_lease_fee_check`,
  lippu `custrecord_gbb_all_lease_fees_paid`)
- **Muuttaa:** [ADR 0016](0016-kaikki-vuokrat-maksettu.md) k. 9 (lippu vasta päättymisajankohdan jälkeen)
- **Tarkentaa:** ADR 0016 k. 3 (viimeisin laskutettava asiakas), k. 5 (ensimmäinen vuokrakuukausi) ja k. 7
  (asiakasta ei voi päätellä)
- **Työohje:** [`../lease-fees-check-adr0016-tyoohje.md`](../lease-fees-check-adr0016-tyoohje.md)

## Konteksti

ADR 0016 päätti, mitkä laskut estävät lipun. Toteutusta varten 12.10.2026 todennettiin NetSuitesta (SuiteQL,
lukuoikeus), miten sääntö sovelletaan dataan:

- Jonossa (status 2, lippu F) on **9 436 pyörää**: 1 102 OOMI- ja 8 334 muuta pyörää. Kauppakirja on jo
  lähetetty 7 098:lle.
- **1 970 pyörällä ei ole yhtään sopimusriviä.** Kaikki ovat ei-OOMI-pyöriä, jotka päättyivät ennen
  NetSuite-laskutusta: 1 835 vuonna 2025 ja 132 tammi–toukokuussa 2026. Tapa 1 on 1 408:lla (lähetetty 1 402:lle)
  ja tapa 8 on 562:lla. Lisäksi **84 pyörän riveillä ei ole laskutushistoriaa**: 82 OOMI-pyörää, jotka päättyivät
  huhtikuussa 2026, ja 2 muuta.
- **Rivin alkupäivä ei kelpaa ensimmäiseksi vuokrakuukaudeksi.** OOMI-rivit alkavat sopimuksen alusta (2021–2025),
  mutta laskutushistoria vasta 2026-05. Ei-OOMI-rivit alkavat migraatiosta (2025-12-01).
  51 pyörällä on rivejä usealla asiakkaalla. Niistä 29:llä uuden asiakkaan rivin alku ja ensimmäinen laskutettu
  kuukausi eroavat, ja tavallisesti siirto-CR:ää ei ole lainkaan.
- **254 pyörällä on laskutettu vuokrarivi, joka alkaa päättymispäivän jälkeen.** Esimerkki: B006540 päättyy
  30.9.2026, mutta siirron uuden asiakkaan rivi alkaa 1.10.2026.
- **Laskutushistoria** (`custrecord_sta_ca_row_invoicehistory`) on JSON-taulukko kuukauden ensimmäisistä päivistä,
  ja se alkaa pääosin 2025-12 (12.10. 16 jonon riviä alkaa jo 2025-10/11). Vuokralaskuja on kuitenkin jo 2025-10 (tuote 33, yksi rivi asiakasta kohden) ja 2025-11
  (tuote 30 pyöräkohtaisesti).
- **Haun 793 ehtoja ei voi lukea** SuiteQL:llä (T48). Lippu status 2:n hetkellä voisi siis lähettää kauppakirjan
  ennen päättymisajankohtaa, eikä lähetettyä voi perua.

## Päätökset

1. **Jono valitaan koodissa SuiteQL:llä:** status 2, lippu F ja `subsc_end_date` < tänään (Helsingin päivä).
   Haku 796 ja parametri `custscript_gbb_lease_check_search_id` poistuvat. Haku 796 inaktivoidaan, kun uusi versio on
   ajanut. Lähetettyjä, estettyjä tai tapoja 5–8 ei rajata pois, koska lippu kertoo vain vuokralaskuista. (Q1, Q2, Q13)
2. **Lippu asetetaan vasta päättymisajankohdan jälkeen.** Tämä muuttaa ADR 0016 k9:n. Päättymispäiväportti on
   pysyvä ehto, ei väliaikainen suoja. Lippu tarkoittaa siis: *päättymisajankohta on mennyt eikä vuokralaskuja ole
   maksamatta*. (Q7, Q10)
3. **Viimeisin laskutettava asiakas valitaan laskutushistoriasta.** Mukaan otetaan pyörän vuokrarivit
   (tuote 30), joiden `custrecord_sta_ca_row_license_startdate` ≤ `subsc_end_date` ja joiden historia ei ole tyhjä.
   Asiakas on emosopimuksen `custrecord_sta_ca_customer` sillä rivillä, jonka historiassa on myöhäisin kuukausi, kun
   lasketaan vain päättymiskuuhun mennessä olevat kuukaudet. Siirto-CR:ää ei tarvita. (Q9)
4. **Tasatilanteessa tarkistetaan molemmat asiakkaat.** Jos kahden asiakkaan historiassa on sama myöhäisin kuukausi,
   lippu asetetaan vain, jos kummallakaan ei ole estävää laskua. (Q12)
5. **Ensimmäinen vuokrakuukausi** on valitun asiakkaan varhaisin historiakuukausi tälle pyörälle. (Q14, Q19)
   *Muutettu 12.10.2026 (Q19):* aiempi poikkeus "jos 2025-12 tai aiempi, alaraja 2025-10" poistuu. Loka–marraskuun 2025
   vuokralaskuja tarkistetaan vain, jos asiakkaan historia alkaa jo silloin (12.10. 10 pyörää, kaikki PAID). Muuten kausi
   alkaa asiakkaan ensimmäisestä historiakuukaudesta (tavallisesti 2025-12 tai myöhemmin, OOMI-pyörillä 2026-05). Tämä vapauttaa 12.10. kaksi asiakkaan 2263 pyörää (id 9456 ja 10243), joiden ainoa este oli avoin
   marraskuun 2025 vuokralasku 20052810 (päivätty 1.10.2025). Lasku hoidetaan perintänä.
6. **Jos asiakasta ei voi päätellä** (ei sopimusrivejä tai ei laskutushistoriaa), lippu jää F:ksi ja tulos on
   `NO_CUSTOMER`. Lippu on lopullinen, joten epävarmassa tapauksessa sitä ei aseteta. Tämä on eri asia kuin
   ADR 0016 k7, jossa asiakas on tiedossa mutta jonkin kuukauden lasku puuttuu. Tarvittaessa kauppakirja lähetetään
   käsin (ADR 0013 k11). (Q6)
7. **Pyörän omalla id:llä tehdyt työnantajan vuokralaskut eivät ole vuokralaskuja.** ADR 0016:n tunnistus
   (`custbody_sta_bike_id` tyhjä) pysyy. (Q15)
8. **SuiteQL (`N/query`) koko skriptissä.** `N/search`-koeskriptiä ei tehdä, eikä `record.load`-kutsuja jää. (Q3)
9. **Parametrit ovat `dry_run` ja `test_bike_id`,** samoin kuin muissa skripteissä. (Q4)
   *Muutettu 12.10.2026 (Q18):* lisäksi **tarkistuksen alkupäivä** (päivämääräparametri). Jonoon tulevat vain pyörät,
   joiden `subsc_end_date` ≥ alkupäivä. Tyhjä parametri tarkoittaa 1.12.2025, eli laskutushistorian alkua. Rajan alle
   jäävät pyörät jäävät lipulle F, eikä niitä käsitellä eikä lokiteta. *Tuotannossa 12.10.2026 alkaen arvo on 2026-06-01 (tuoteomistaja), ja live-käyttöönotto tehtiin ennen T58:aa (poikkeama k11:stä, ks. TASKS T59).* 12.10. raja poisti jonosta 2 018 pyörää, jotka kaikki
   olivat `NO_CUSTOMER`. Yhdenkään pyörän lipun tulos ei muuttunut, ja `NO_CUSTOMER`-joukko pieneni 2 293:sta 275:een.
10. **Loki:** jokainen käsitelty pyörä saa joka ajossa yhden Audit-rivin, myös pysyvä `NO_CUSTOMER`-joukko.
    Otsikko on `<TULOS> <pyörän nimi>` (dry runissa etuliite `DRY RUN`), ja detail on kiinteä `avain=arvo`-lista.
    Tiedostoloki File Cabinetiin ja kansioparametri poistuvat. Raportointi on erillinen (ADR 0017). (Q5, Q16)
11. **Live-käyttöönotto odottaa T58:aa.** Oomin toukokuun 2026 laskujen tuloutuskauden on oltava korjattu (T58-kysely
    palauttaa 0). Muuten avoin toukokuun lasku jää kauden ulkopuolelle ja lippu asetetaan väärin. Dry run ajetaan heti.
    Takaraja on 1.11.2026. (Q11)
12. **Sisarrepo:** tiedostonimi säilyy, ja README korjataan tuotannon tunnuksiin (`customscript_gbb_lease_fee_check`,
    1432). `lease_fees_check_solution_v2.md` poistetaan. README kuvaa toiminnan ja viittaa ADR 0016:een ja tähän
    ADR:ään. (Q8)

## Hylätyt vaihtoehdot

- **Lippu status 2:ssa ja päättymisajankohdan odotus haussa 793** (ADR 0016 k9 alkuperäisenä). Hylätty: haun 793
  ehtoja ei voi todentaa, ja ennenaikaista kauppakirjaa ei voi perua.
- **Haku 796 jonona.** Hylätty: ehdot eivät näy repossa eivätkä auditoinnissa, ja haun muutos olisi pitänyt
  ajoittaa koodin latauksen kanssa.
- **Rivin alkupäivä ensimmäisenä kuukautena.** Hylätty: se hylkäisi kaikki OOMI-pyörät, ja siirroissa se on väärin
  29 pyörällä 51:stä.
- **Uusin rivin alkupäivä asiakkaan valinnassa.** Hylätty: se valitsee päättymisen jälkeen alkavan rivin
  (B006540, B016040) ja jättää tasatilanteet ratkaisematta.
- **Siirto-CR asiakkaan lähteenä.** Hylätty: vain 13 pyörällä 25:stä on siirto-CR.
- **Lippu T pyörälle, jolle asiakasta ei voi päätellä.** Hylätty: lippu on lopullinen.
- **Lähetettyjen rajaaminen jonosta** (Q13 b). Hylätty: lippu kertoo laskujen tilan riippumatta lähetyksestä.
- **`NO_CUSTOMER` Debug-tasolla.** Hylätty: lokitasoja ei käytetä piilotusmekanismina.
- **Live-käyttöönotto ilman T58:aa.** Hylätty: noin 12 avoimen toukokuun laskun asiakkaat saisivat lipun väärin.

## Seuraukset

- **Ensimmäinen live-ajo käsittelee noin 7 200 pyörää** (Q18:n alkupäivällä; ilman sitä noin 9 400), ja suurin osa saa lipun T. Mukana ovat pyörät, joiden
  kauppakirja on jo lähetetty. Se on harmitonta, koska automaatio lähettää vain kerran (ADR 0013 k9).
- *Q18:n jälkeen (alkupäivä 1.12.2025) pysyvä `NO_CUSTOMER`-joukko on 275 pyörää. Alla oleva erittely koskee tilannetta ilman rajaa.*
- **2 293 pyörää jää pysyvästi jonoon** tuloksella `NO_CUSTOMER` (laskettu tämän ADR:n säännöillä 12.10.2026,
  lista `exports/2026-10-12-lease-fees-no-customer.csv`), ja ne lokitetaan joka ajossa.
  - Kauppakirja on jo lähetetty 1 623 pyörälle.
  - Tapaa 8 ilman lähetystä on 651.
  - Muita, joille kauppakirjaa ei ole lähetetty, on 19.
  - Syyt: 1 970:llä ei ole sopimusrivejä, ja 84:llä ei ole laskutushistoriaa.
  - 239:n rivit alkavat vasta päättymisen jälkeen. Niistä 211 päättyi loka–marraskuussa 2025, ja migraatiorivit
    alkavat 1.12.2025.
  - Kolmella pyörällä ei ole NetSuitessa vuokralaskuja lainkaan: B000644, B001432 ja B001579.
  - Viiden pyörän vuokra laskutettiin pyörän omalla id:llä: B000214, B001539, B004474, B015661 ja B035155.
  - Kaikki nämä jäävät `NO_CUSTOMER`-tilaan.
- **Haun 793 riski poistuu,** eikä T48 ole enää T59:n esiehto. T48 on yhä auki ADR 0013:n muiden ehtojen vuoksi.
- **CONTEXT.md:n *Kaikki vuokrat maksettu*** arvioidaan nyt päättymisajankohdan jälkeen, ei lunastetuksi merkitsemisestä.
- **Poikkeamaraportointi** (ADR 0017): tarkistus voi listata status 2 -pyörät, joiden lippu on F yli 30 päivää
  päättymisen jälkeen (ADR 0013 k13). `NO_CUSTOMER`-joukko näkyy siinä luonnostaan, eikä lokia tarvita.
