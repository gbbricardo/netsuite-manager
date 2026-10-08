# ADR 0016 — Kaikki vuokrat maksettu: mitkä laskut kuuluvat pyörälle ja milloin lippu asetetaan

- **Päivämäärä:** 2026-10-08
- **Tila:** Hyväksytty (tuoteomistaja, grilling-istunto 8.10.2026)
- **Tarkentaa:** [ADR 0013](0013-kauppakirjan-lahetys.md) kohdat 4–5 (*kaikki vuokralaskut, myös erääntymättömät*)
- **Koskee:** `netsuite-br-lease-fees-check` (`mr_lease_fees_check_v2.js`, haku 796, lippu
  `custrecord_gbb_all_lease_fees_paid`). Lähetysskripti `netsuite-send-bill-of-sale-pdf` (1433, haku 793) vain kohdan 9 osalta.
- **Luonne:** liiketoiminta- ja prosessipäätös. Skriptimuutos tehdään omistavassa repossa erillisessä istunnossa.
- **Käsitteet:** [CONTEXT.md](../../CONTEXT.md) § *Vuokrakuukausi*, *Vuokralasku*, *Viimeisin laskutettava asiakas*,
  *Kaikki vuokrat maksettu*
- **Lähtökohta:** [löydös 8.10.2026](../../findings/2026-10-08-lease-fees-check-duedate-findings.md)

## Konteksti

ADR 0013 päätti, että kauppakirja odottaa, kunnes pyörän kaikki vuokralaskut on maksettu. Se ei päättänyt, mikä
lasku on pyörän vuokralasku. Vuokralasku menee työnantaja-asiakkaalle, ja samalla laskulla on tavallisesti
asiakkaan kaikki pyörät. NetSuite seuraa maksua vain laskun tasolla.

Skripti sitoo laskun pyörään eräpäivällä: tilausrivin laskutushistorian päivä haetaan laskun eräpäivästä.
Historiapäivä on kuitenkin vuokrakuukauden alku, ja eräpäivä riippuu asiakkaan maksuehdosta. Tavallisella
*Due 1st of Next Month* -ehdolla nämä osuvat sattumalta samaan päivään, mutta Oomi-laskuilla eivät
(*Net 14/21/30*, *Due 15th/21st*). Seuraukset 8.10.2026 (todennettu NetSuitesta, löydös):

- 0/275 Oomi-pyörää läpäisee, ja 131 maksettua pyörää odottaa kauppakirjaa aiheetta
- 36 Oomi-pyörää on saanut lipun osumalla väärän kuukauden laskuun

## Päätökset

1. **Kenen maksu ratkaisee: asiakkaan, laskun tasolla.** Pyörän vuokrat on maksettu, kun ne asiakkaan
   vuokralaskut, joihin pyörän vuokra sisältyy, on maksettu kokonaan. Pyörän osuutta laskusta ei seurata.
   Osittain maksettu lasku pitää kaikki sen pyörät odottamassa.
2. **Vuokralasku** on lasku, jossa on vuokraa (tuote 30), ylläpitomaksua (31) tai leasingmaksua (33), ja joka ei
   kohdistu yksittäiseen pyörään eikä lunastukseen.
   - Pyöräkohtaiset laskut eivät ole vuokralaskuja. Niitä ovat jälkiveloituslaskut (CR:n kautta tai käsin tehdyt)
     ja toisen yhtiön laskut loppukäyttäjälle.
   - Jälkiveloitus on käytännössä vuokraa, mutta kauppakirjan kannalta se kuuluu velvoitteisiin
     ([ADR 0012](0012-loppulunastushinta-ja-kattavuus.md)), ei tähän lippuun. Lunastuksen ehto on ADR 0013:n
     *velvoitteet hoidettu*, ja ADR 0013:n kohdat 1 ja 7 pysyvät ennallaan.
3. **Asiakas on viimeisin laskutettava asiakas.** Se on pyörän sopimusrivien asiakkaista se, jolle vuokraa on
   viimeksi laskutettu. Siirrossa (tyypit 1 ja 9) aiemman asiakkaan avoimet tai hyvittämättömät laskut eivät
   estä. Uuden asiakkaan kausi alkaa ensimmäisestä vuokrakuukaudesta, jonka uusi asiakas maksaa (siirto-CR:n
   `start_date`).
4. **Lasku kuuluu sille vuokrakuukaudelle, jolle sen vuokra tuloutetaan**, eli laskurivin tuloutuskaudelle.
   Laskupäivä, eräpäivä ja laskun kirjanpitokausi eivät ratkaise, koska vuokra laskutetaan kuukautta etukäteen
   ja maksuehdot vaihtelevat asiakkaittain.
   - Esimerkki: B045898 päättyy 28.09. Sen asiakkaan lokakuun vuokralasku on päivätty 1.9. ja kuuluu
     kirjanpitokauteen syyskuu, mutta se ei koske pyörää.
5. **Tarkistettavat vuokrakuukaudet** ovat koko sopimuskausi viimeisimmällä laskutettavalla asiakkaalla.
   - Ensimmäinen kuukausi on kyseisen asiakkaan ensimmäinen vuokrakuukausi.
   - Viimeinen kuukausi on se, joka alkaa päättymisajankohtana tai sitä ennen (`subsc_end_date`, joka
     jälkiveloituksessa siirtyy).
   - Kiinteää taaksepäin katsovaa ikkunaa ei ole. NetSuite-laskutus alkoi 1.10.2025, joten sitä vanhempia
     vuokralaskuja ei ole.
   - Päättymisajankohdan jälkeisten kuukausien laskut eivät estä. Ne ovat laskutusvirheitä, jotka hyvitetään
     (8.10.: 907 pyörää, 152 avointa riviä).
6. **Kaikki tarkistettavat vuokralaskut estävät, myös muiden pyörien.** Jos asiakkaalla on yksikin
   maksamaton vuokralasku tarkistettavalla vuokrakuukaudella, myös erääntymätön, kaikki sen pyörät odottavat.
   Tämä koskee myös toisen pyörän kesken kuun lisälaskua. Hyväksytty seuraus: 8.10.2026 tämä pysäyttää
   58 asiakasta, joilla on yli kolme kuukautta vanha avoin vuokralasku. Poikkeukset hoidetaan käsin
   lähetyksellä (ADR 0013 k11).
7. **Laskun puuttuminen ei estä.** Ehto on *ei yhtään maksamatonta vuokralaskua*, ei *jokaiselle kuukaudelle
   maksettu lasku*. Laskutuksen kattavuus on laskutusmoottorin ja sopimusriviauditoinnin asia.
8. **Laskun tila** on sen saldo hyvitysten kohdistamisen jälkeen (ADR 0013 k5): maksettu kokonaan tai ei.
9. **Lippu asetetaan, kun pyörä on Redeemed (status 2), mutta kauppakirja lähtee vasta päättymisajankohdan jälkeen.**
   - Tarkistettavana ovat kaikki status 2 -pyörät, joiden lippu ei ole vielä T. Maksettu lunastus-SO ei ole
     ehto (ADR 0013 k6).
   - Lippu kertoo vain vuokralaskuista. Kauppakirjan piiri, esto ja omistuksen siirtymispäivä ovat
     lähetyksen ehtoja (ADR 0013).
10. **Lippu on lopullinen.** Kun se on asetettu, sitä ei arvioida uudelleen eikä palauteta F:ksi. Jos
    asetuksen jälkeen syntyy uusi lasku tarkistettavalle kuukaudelle, se on perintää, kuten lähetyksen
    jälkeen syntynyt lasku (ADR 0013 k12).
11. **Lippua ei aseteta käsin.** Sisarrepon suunnitelman §7 *Manual Override* poistuu. Jos ehto ei täyty mutta
    kauppakirja halutaan lähettää, se lähetetään käsin (ADR 0013 k10–k11). Lippu kertoo siis aina laskujen
    todellisen tilan.

## Tunnistus NetSuitessa (ohje toteuttajalle)

Liiketoiminnan sääntö on yllä. Tässä on sama kenttätasolla, todennettuna 8.10.2026.

| Sääntö | Kenttä |
|---|---|
| Vuokralasku | `CustInvc`, vähintään yksi rivi tuotteella 30, 31 tai 33, `custbody_sta_bike_id` tyhjä ja `custbody_sta_is_so_type` tyhjä |
| Asiakas | laskun `entity` = pyörän sopimusrivien (`customrecord_sta_ca_agreement_row.custrecord_sta_bikeid`) emosopimuksen `custrecord_sta_ca_customer`, viimeisin laskutettava |
| Vuokrakuukausi | laskurivin `custcol_sta_so_revrec_start` (ei `duedate`, `trandate` eikä `postingperiod`) |
| Tarkistettava kausi | `revrec_start` asiakkaan ensimmäisestä vuokrakuukaudesta `custrecord_sta_subsc_end_date`:en |
| Maksettu | laskun status *Paid In Full* (SuiteQL `B`); muu = maksamaton |

Todennettu 8.10.2026 kaikista laskuista 1.10.2025 alkaen:

- `custbody_sta_is_so_type` on tyhjä kaikilla 53 430 laskulla, joilla on tuote 30, 31 tai 33. Ehto on oikea,
  mutta nykyisellä datalla se ei rajaa mitään.
- `custbody_sta_bike_id` on asetettu 884/884 CR-jälkiveloituslaskulla, 565 käsin tehdyllä jälkiveloituksella
  ja 119 toisen yhtiön (INVGBB) loppukäyttäjälaskulla. Muilla 51 862 laskulla se on tyhjä.
- `custcol_sta_so_revrec_start` on täytetty kaikilla vuokrariveillä, myös Oomin touko–syyskuun käsilaskuilla.
- Laskurivin linkki tilausriviin (`custcol_sta_ca_product_id`) puuttuu Oomin käsilaskuilta ja ryhmitellyiltä
  riveiltä, eikä se siksi kelpaa avaimeksi.

## Hylätyt vaihtoehdot

- **Eräpäivä = laskutushistorian päivä** (nykytila). Hylätty, koska eräpäivä riippuu maksuehdosta.
  - Oomilla se ei löydä laskua (0/275).
  - Se osuu väärään kuukauteen (36 lippua osui elokuun laskuun).
- **Ensin eräpäivä, varalla vuokrakuukausi.** Hylätty, koska 37 Oomi-pyörää läpäisisi väärin: lokakuun päivä
  osuu syyskuun maksettuun laskuun.
- **Laskupäivä tai laskun kirjanpitokausi.** Hylätty, koska vuokra laskutetaan kuukautta etukäteen, ja
  päättymiskuun lasku koskee seuraavaa kuukautta.
- **Rivilinkki tilausriviin.** Hylätty, koska Oomin käsilaskuilla linkkiä ei ole, ja ei-Oomi-rivit on
  ryhmitelty.
- **Vain pyörän omat rivit estävät.** Hylätty: sääntö on asiakastasoinen, jotta se on yksinkertainen ja
  selitettävä. Laskulta ei voi todentaa yksittäisen pyörän osuuden maksua.
- **Kiinteä 5 kuukauden ikkuna.** Hylätty, koska vanhempi maksamaton vuokra jäisi huomaamatta.
- **Jälkiveloituslaskut lipun ehtona.** Hylätty, koska ne kuuluvat velvoitteisiin. Muuten tapa 2 -pyörä
  odottaisi perintää, vaikka velvoitteet on hoidettu.
- **Jokaiselle kuukaudelle on löydyttävä lasku.** Hylätty, koska juuri tämä ehto (*no invoice found*) pysäyttää
  nyt 131 maksettua pyörää.
- **Lipun uudelleenarviointi lähetykseen asti.** Hylätty: lisää monimutkaisuutta harvinaisen tapauksen takia, ja
  sama tapaus on jo perintää lähetyksen jälkeen.
- **Lippu käsin 131 Oomi-pyörälle ennen korjausta** (löydöksen vaihtoehto G). Hylätty: odotetaan korjausta.

## Seuraukset

- **Oomin toukokuun 2026 laskuissa on väärä vuosi.** 331 laskulla tuloutuskausi on 2025-05, vaikka muistiossa
  lukee 1.5.2026–31.5.2026. Näistä 13 on avoimia. Tällä säännöllä ne jäisivät asiakkaan kauden ulkopuolelle.
  Taloustiimi korjaa kauden ennen käyttöönottoa, eikä sääntöön tehdä Oomi-poikkeusta.
- **Oomin kaksiosainen logiikka (Part A ja B) poistuu.** Kaikki pyörät tarkistetaan samalla säännöllä.
- **Jonon (haku 796) SO-ehto poistuu.** Tarkistettavina ovat kaikki status 2 -pyörät, joiden lippu on F. Tämä
  tuo jonoon pyörät, joiden velvoitteet hoidettiin ilman SO:ta (ADR 0013, nykytilan 296 pyörää).
- **Kauppakirja odottaa nyt pidempään ennen päättymisajankohtaa.** Lippu voi tulla T:ksi jo statuksen 2
  hetkellä, joten lähetysskriptin (haku 793) on odotettava päättymisajankohtaa. Tämä on jo ADR 0013:n
  tavoitetila, jota ei ole toteutettu.
- **Laskun maksaja voi pysäyttää koko asiakkaan.** 8.10.2026 pysäytettyjä asiakkaita olisi 58. Tilanne näkyy
  ADR 0013 k13:n raportilla (omistuksen siirtymispäivä ei ole koittanut yli 30 päivää päättymisajankohdan jälkeen).
- **Nykyiset T-liput jäävät voimaan.** 36 väärään kuukauteen osunutta lippua tarkistettiin 8.10.: avoimia
  syyskuun laskuja ei ole.
- **Sisarrepon dokumentit** väittävät historiapäivän olevan eräpäivä: `NETSUITE_RECORDS_AND_FIELDS.md` §2 ja
  `lease_fees_check_solution_v2.md` §4.1. Ne päivitetään toteutuksen yhteydessä.
