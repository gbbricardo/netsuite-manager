# ADR 0014 — Maksulinkin (1479) korjaus- ja yksinkertaistuspäätökset

- **Päivämäärä:** 2026-10-07
- **Tila:** Hyväksytty (tuoteomistaja, grilling-istunto 6.–7.10.2026)
- **Koskee:** `netstuite-send-end-redemption-payment-link` (script 1479, `customscript_gbb_mr_eredem_paylink`)
- **Tarkentaa:** [ADR 0012](0012-loppulunastushinta-ja-kattavuus.md) k. 7 (ohitus 4) ja k. 8 (aikaikkuna)
- **Kumoaa:** maksulinkkirepon `docs/DEPLOYMENT.md` § *Settled specifics* -kohdat: eräpäivä 14 päivää, digestisähköposti,
  `paylink_url` testi/tuotanto-valintana, `not_before`-lattia ja tuotenimiparametri
- **Toteutusmäärittely:** [`docs/maksulinkki-1479-muutosspeksi.md`](../maksulinkki-1479-muutosspeksi.md)

## Konteksti

Ensimmäinen tuotantoajo 1.10.2026 oli teknisesti puhdas, mutta siinä paljastui logiikkavirheet L1–L8
([löydös 5.10.](../../findings/2026-10-05-maksulinkki-logiikkavirheet-ja-tavoitetila.md),
[virhekorit](../../findings/2026-10-05-maksulinkki-virhekorit.md)). ADR 0012 päätti hinnan ja kattavuuden säännöt.
Tämä ADR päättää, miten skripti muutetaan niiden mukaiseksi, ja samalla, mitä skriptistä poistetaan. Linja on
**yksinkertainen skripti**: yksi tehtävä, vähän parametreja, ei sähköpostiraportointia, ei viikonpäiväsääntöjä.

## Päätökset

### Julkaisut

1. **Kaksi julkaisua.** **A** on tuotannossa ja dry runilla todennettu ennen 31.10.2026 kohorttiajoa (tavoite noin 24.10.).
   **B** tulee sen jälkeen. (Q1)
   *Muutettu 7.10.2026 (tuoteomistaja):* B otettiin käyttöön ennen ensimmäistä live-ajoa, koska A oli jo todennettu koko 30.11.
   kohortin dry runilla (816 pyörää, 0 poikkeamaa). B:n dry runit B1–B3 menivät läpi samana päivänä (PR #1 ja #2 yhdistetty).

### Julkaisu A — korjaukset

2. **Hinta (L1, L2):** huoltohyvitys lasketaan ADR 0012 k. 1:n mukaan pelkästä huoltosummasta. Pidennys ei vaikuta hintaan.
3. **Ohitukset valinnassa.** S4, S5 ja ohitus 4 rajataan jo `getInputData`:n SuiteQL:ssä (`NOT EXISTS`). Pyörät eivät tule
   map-vaiheeseen. `selection`-lokirivi kertoo, montako pyörää kukin ehto rajasi (vain lukumäärät). (Q2, Q24)
   - **S4** — pyörällä on mikä tahansa Paylink-tilaus tuotteella *Työsuhdepyörän loppulunastus*, tilasta riippumatta
     (`custrecord_pl_ns_bike_id` = pyörä tai `custrecord_pl_notes` = pyörän `externalid`).
   - **S5** — tyypin 7 CR, jonka `LOWER(altname)` sisältää *pidennys* eikä sisällä *2a*:ta, tilassa **Pending tai Done**. (Q3)
   - **Ohitus 4** — tyypin 2 tai 10 CR **missä tahansa tilassa paitsi Cancelled (7)**. (Q4)
4. **Settlementin vartija.** `settle()` tarkistaa ennen tavan 3 tai 4 kirjoitusta, onko pyörällä jälkiveloitus-CR. Jos on,
   mitään ei kirjoiteta ja status on `SKIP_EXTENSION_RUNNING`. Tarkistus on puolustus järjestyksen lisäksi. (Q5)
5. **S9 ja S10 eivät estä linkkiä** (ADR 0012 k. 1). Ne ja hyvitys yli yhden portaan kirjataan lokirivin `eheys`-kenttään.
   S9:n vertailu pysyy muodossa *pidennys > 0 ↔ huoltorivejä > 0*, koska S5 on jo rajannut jälkiveloituspyörät. (Q17)
   S11 (summa yli ylimmän portaan) pysyy NOT_PRICED-tilana.
6. **Vanhat SO:t (S6) pysyvät estävinä.** T35:n pyörät ratkaistaan käsin. (Q16)

### Julkaisu A — yksinkertaistus

7. **Tilat ovat vain dry run ja live.** Testiympäristöä ei käytetä, koska ensimmäinen tuotantoajo todisti NetSuite–Paylink-
   integraation. `paylink_url` ei saa määrätä skriptin toimintaa: parametri poistetaan, ja tuotanto-URL on vakio. (Q6, Q10, Q18)
8. **Poistettavat parametrit:** `paylink_url`, `email_to`, `not_before`, `item_title`, `report_to`, `email_author`.
   Tuotenimi *Työsuhdepyörän loppulunastus* on vakio, koska se on reititysavain paylink-order-trackingissa (L8). (Q7, Q18, Q19)
9. **`test_bike_id` säilyy.** Se ohittaa ikkunan mutta ei mitään muuta tarkistusta. Lisäksi pyörän `subsc_end_date` ≥ tänään. (Q18, Q19)
10. **Digestisähköposti poistetaan A:ssa.** Kunnes erillinen raportointiskripti on tuotannossa, lokia luetaan käsin jokaisen
    ajon jälkeen. (Q20, Q22, Q26)
11. **Loki on ainoa raportti.** Jokainen käsitelty pyörä saa joka ajossa yhden rivin:
    - otsikko `<STATUS> <pyörän nimi>`, ja dry runissa etuliite `DRY RUN`
    - detail on kiinteä `avain=arvo`-lista aina samassa järjestyksessä: `syy`, `hinta_netto`, `huoltosumma`, `porras`, `hyvitys`,
      `linkki_netto`, `linkki_brutto`, `eraapaiva`, `paylink_tilaus`, `brevo_id`, `eheys`
    - `log.error` statuksille, jotka vaativat ihmistä (`ERROR`, `STAMP_FAILED`, `EMAIL_FAILED`), muut `log.audit`
    - `selection`- ja `run complete` -rivit säilyvät (Q23, Q25)
12. **`link_sent`-kertatäyttö** tehdään CSV:llä tästä repostosta ennen A:n tuotantoajoa. Kentän merkitys on *"pyörä on saanut
    loppulunastuspyynnön"* reitistä riippumatta. 1479 ei leimaa tilauksia, joita se ei itse lähettänyt. (Q15)

### Julkaisu B — lähetysajankohta

13. **Parametri `months_before` korvaa `days_before`:n.** Sallitut arvot ovat **1 tai 2**. Muu arvo tai tyhjä keskeyttää ajon ennen
    valintaa, mikä suojaa myös päivät/kuukaudet-sekaannukselta (esim. 30). Tämä tarkentaa ADR 0012 k. 8:n "60 päivää". (Q8, Q21)
14. **Lähetyspäivä** = sama päivä N kuukautta ennen `subsc_end_date`:a. Jos päivää ei ole, käytetään kuun viimeistä päivää
    (30.11. → 30.10. arvolla 1, 30.04. → 28./29.02. arvolla 2). (Q11)
15. **Ikkuna on `[tänään, tänään + N kk]`**, joten väliin jäänyt ajo saadaan kiinni. (Q12)
16. **Arvon voi vaihtaa milloin tahansa**, myös suoraan arvoon 2, ja skriptin on kestettävä siitä syntyvä piikki
    (noin kaksi kohorttia yhdellä ajolla). (Q13)
17. **Eräpäivä = `subsc_end_date`**, ja se annetaan vain Paylinkille. Loppukäyttäjälle eräpäivää ei näytetä. Brevo-pohja 65 on kunnossa
    sellaisenaan. `due_days` poistetaan. (Q8)

### Päättyneet sopimukset (lisätty 7.10.2026)

17b. **1479 ei käsittele päättyneitä sopimuksia millään parametrilla**, eikä `test_bike_id`-ajokaan tee poikkeusta. (Q28, Q29)
    Pyörät, joilla on päättynyt sopimus mutta ei linkkiä, ei tapaa eikä jälkiveloitusta, listaa erillinen raportointiskripti (T51). (Q30)

### Rajattu pois

18. **Raportointi** tehdään erillisenä skriptinä, joka kattaa kaikki lunastukset (Q22). Sen syöte on k. 11:n lokimuoto.
    T46 (jälkiveloituspyörien avoimet tilaukset) voi sisältyä siihen.
    *Muutettu 7.10.2026 (tuoteomistaja):* raportointi lukee **rekisterin ja muiden tietueiden tilaa**, ei lokia. K. 11:n
    lokimuoto on ihmisen luettavaksi. Sama linja koskee status-syncia 2.0 ([ADR 0015](0015-status-sync-2-tarkennukset.md) k. 1).
19. **Hintakirjasto** `lib_gbb_redemption_price.js` pysyy 1479:n repossa. Status-sync 2.0 ja raportointi lataavat sen
    File Cabinet -polusta. Siirto ADR 0003:n jaettuun kirjastoon päätetään erikseen. (Q9)

## Vaihtoehdot, joita ei valittu

- **Testitila (`mode = TEST`) Paylinkin testiympäristöä vasten.** Torjuttu: integraatio on todennettu tuotannossa. Testitila jättäisi
  parametreja, jotka muuttavat käyttäytymistä mutta joita ei ajeta tuotannossa.
- **Digesti, jossa vain uudet poikkeamat, ja täysi lista maanantaisin.** Torjuttu: viikonpäiväsäännöt ja "uusi poikkeama" -muisti
  monimutkaistavat skriptiä. Raportointi kuuluu erilliselle skriptille.
- **Ohitukset map-vaiheen SKIP-riveinä.** Torjuttu: pyörät kuuluvat toisten prosessien omistukseen, ja ne toistuisivat lokissa päivittäin.
- **Vanhojen SO:iden yleinen vapautussääntö (K-f).** Torjuttu toistaiseksi: tapauksia on kuusi, ja uusia ei pitäisi syntyä.

## Seuraukset

- Ilman digestiä `EMAIL_FAILED`, `STAMP_FAILED` ja `NOT_PRICED` näkyvät vain lokissa, ja NetSuite säilyttää sitä noin 30 päivää.
  Välikauden käsin luku on TASKS-tehtävä (T52), kunnes raportointiskripti (T51) on tuotannossa.
- CLAUDE.md:n kuvaus 1479:stä (parametrit `dry_run`/`test_bike_id`/`paylink_url`, digesti info@gobybike.fi:lle, `not_before`)
  vanhenee A:n julkaisussa ja päivitetään silloin.
- Maksulinkkirepon `docs/DEPLOYMENT.md` § *Settled specifics* päivitetään omistavan repon istunnossa tämän ADR:n mukaan.
