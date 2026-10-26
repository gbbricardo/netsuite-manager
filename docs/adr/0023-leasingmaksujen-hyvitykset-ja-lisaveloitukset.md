# ADR 0023 — Leasingmaksujen hyvitykset ja lisäveloitukset

- **Päivämäärä:** 2026-10-26
- **Tila:** Hyväksytty (tuoteomistaja, grilling-istunto 26.10.2026, kysymykset Q1–Q12)
- **Koskee:** `netsuite-subscrption-cr-scripts` (`handler_hyvitys.js` = tyyppi 11, `handler_jalki.js` = tyyppi 7), käsin tehdyt
  lisähyvitykset ja lisäveloitukset, poikkeamaraportoinnin tarkistukset HY1–HY3
- **Täydentää:** [ADR 0020](0020-kuukausiraportointiin-vaikuttavat-tiedot.md) (k. 4 sopimusrivi ainoa hintalähde, laskutetun kuukauden
  määritelmä, RI8), [ADR 0022](0022-laskutuksen-paattaminen-tai-tauotus.md) (k. 4 passivointi, SR2), [ADR 0010](0010-keskenkauden-lunastus.md)
  (raha tyypin 11 CR:llä), [ADR 0017](0017-poikkeamaraportointi.md), TASKS T65 (luokka A1)

## Konteksti

T65:n luokka A1 syntyi 14.9.2026 hyvitys-CR-erästä: vanha `handler_hyvitys` hinnoitteli väärältä (tulevaisuudessa alkavalta tai
OOMI-osa-) riviltä. 22 alihyvitystä korjattiin 23.9. käsin tuodulla lisähyvityksellä (CRMGBF0003922–3943, `externalid` LISA9-*,
1 088,40 € netto). Ylihyvitykset 6284, 6330, 6350 ja tupla-CM 6313 jäivät auki
([löydös](../../findings/2026-09-23-hyvitys-cr-14-15-9-credit-memot.md), [import](../../imports/2026-09-23-hyvitys-lisahyvitykset/README.md)).
Käsittelijä korjattiin 16.9. (cr-scripts CHANGELOG).

Todennettu NetSuitesta 26.10.2026:

- **Hyvitys = laskutettu.** 17.9. jälkeen 758 hyvitysriviä (item 30/31). 344 voi sitoa laskuriviin (`custcol_sta_ca_product_id` →
  sopimusrivi → pyörä), ja niistä **333/333 täsmää laskutettuun kuukausihintaan** (summa ÷ määrä). Loput 11 ovat LISA9-rivejä.
  414 riviä on kokoomalaskuilla tai syyskuun käsilaskuilla, joilla ei ole rivitunnusta.
- **Hyvitysjakso = hyvitetyt kuukaudet.** Käsittelijä tekee yhden rivin CR:n `start`–`end`-jakson jokaiselle kalenterikuukaudelle
  (koodi), ja hyvitysrivien tuloutuskaudet vastaavat sitä (data). Tämä oli ADR 0020:n RI8:n avoin riippuvuus.
- **Error-tilassa:** CR 7447 (*CR7395 - Jälkiveloitus*, B023726, 11/2026): seuraavaksi alkavat rivit 74516 (passiivinen, 80,6454) ja
  116596 (80,64541833) "eroavat" neljännessä desimaalissa. CR 7467 (*Notion 1527*, pyörä 46553, 7–9/2026): laskutusmoottori laskutti
  heinäkuun ja elokuun vuokran samalla jaksolla 1.8.2026, joten mikään rivi ei näytä heinäkuuta laskutetuksi.
- Kumpikaan käsittelijä ei suodata passiivisia rivejä (`handler_jalki.js:372`, `handler_hyvitys.js:257`). Tyypin 11 duplikaattiesto
  estää toisen Done-CR:n samalle pyörälle, asiakkaalle ja jaksolle.

## Päätökset

1. **Laajuus.** Tämä ADR kirjaa item 30:n (vuokra) ja item 31:n (hallintamaksu) rahakorjaukset: tyypin 11 hyvitys, tyypin 7
   jälkiveloitus ja niiden käsin tehdyt jälkikorjaukset (lisähyvitys, lisäveloitus). Lunastushinta (item 46) ja huoltobudjetti
   eivät kuulu tähän. (Q1)

2. **Hyvitetään täsmälleen se, mitä laskutettiin.** Jokaisen hyvitetyn kuukauden hinta luetaan siltä sopimusriviltä, jonka
   laskutushistoriassa (`custrecord_sta_ca_row_invoicehistory`) kuukausi on. Rivi voi olla aktiivinen, passiivinen tai katkaistu.
   Tämä tarkentaa ADR 0020 k. 4:ää. Tyypin 11 CR:n jakso on hyvitettyjen kuukausien jakso. Nykyinen `handler_hyvitys` toimii näin. (Q2)

3. **Hintaa ei koskaan arvata.** Jos mikään rivi ei näytä kuukautta laskutetuksi tai rivit eroavat hinnaltaan, CR jää Error-tilaan
   eikä asiakirjaa synny. Tapaus on oikeasti virheellinen (esim. kaksi kuukautta laskutettu samalla jaksolla, CR 7467), ja
   ihminen korjaa sen kohdan 6 mukaan todellisen laskurivin hinnalla. (Q3)

4. **Jälkiveloitus hinnoitellaan vain aktiivisista riveistä:** kuukauden kattava rivi, muuten seuraavaksi alkava, muuten viimeksi
   päättynyt (`handler_jalki.priceForMonth`). Passivoitu rivi on ADR 0022 k. 4:n mukaan korvattu, eikä se saa vaikuttaa
   laskuttamattoman kuukauden hintaan. Hyvitys (k. 2) lukee edelleen kaikki rivit, koska se katsoo menneeseen. **Koodimuutos**
   cr-scripts-repoon (TASKS T75). (Q4)

5. **Hinnat ovat samat, jos ne ovat samat sentin tarkkuudella** (80,6454 = 80,64541833). Asiakirjalle viedään rivin oma arvo.
   Yli sentin ero kaataa CR:n edelleen. Koskee sekä hyvitystä että jälkiveloitusta. **Koodimuutos** (T75). (Q5)

6. **Jälkikorjaus tehdään käsin, ei uudella CR:llä.**
   - Alihyvitys → erotus lisähyvityslaskuna. Ylihyvitys → erotus lisäveloituslaskuna. Tupla-CM → ylimääräinen kumotaan.
   - `externalid` = `LISA-<alkuperäisen CR:n id>`, muistioon viittaus alkuperäiseen CR:ään, sama asiakas, nimike ja tuloutuskausi,
     `custbody_sta_do_not_send_inv` = T (kuten käsittelijän omat hyvityslaskut).
   - Raja: alle 1 € netto erotusta ei korjata. (Q6, Q7)

7. **Käsin korjatun CR:n tila.** Kun Error-tilaisen tyypin 11 tai 7 CR:n hyvitys tai veloitus on tehty käsin, CR asetetaan
   **Done**-tilaan ja sen lokiin kirjataan asiakirjan numero. Raportointi tunnistaa hyvitetyn kuukauden vain Done-tilaisesta
   tyypin 11 CR:stä (ADR 0020, RI8). **Cancelled** vain, jos kuukautta ei laskutettu lainkaan (tyyppi 11) tai sitä ei pidä
   laskuttaa (tyyppi 7). (Q8)

8. **Tarkistukset** (lajit ADR 0017:n mukaan, omistaja taloustiimi):

   | ID | Ehto | Laji | Ajankohta |
   |---|---|---|---|
   | HY1 | Hyvitysrivin (item 30/31, hyvityslaskulla pyörä) kuukausihinta (summa ÷ määrä) eroaa yli 1 snt laskutetusta: saman pyörän, nimikkeen ja tuloutuskauden laskurivistä, kun se voidaan sitoa sopimusriviin, muuten sopimusrivistä, jonka laskutushistoriassa kuukausi on. Saman CR:n `LISA-*`-asiakirjat lasketaan yhteen. | V | päivittäin |
   | HY2 | Sama pyörä, nimike ja kuukausi on kahden tai useamman sopimusrivin laskutushistoriassa, eikä kuukautta ole hyvitetty Done-tilaisella tyypin 11 CR:llä (asiakkaalla ei väliä) | V | kuukausittain laskutusajon jälkeen |
   | HY3 | Tyypin 7 tai 11 CR Error-tilassa | V | päivittäin; määräaika seuraava 1. päivän kuukausiajo |

   HY2 sallii siirtopaketin (vanha asiakas laskutettu ja hyvitetty, uusi veloitettu): kaksi historiaa ja yksi hyvitys. Kohdan 3
   tapaus (kuukausi laskutettu toisen kuukauden jaksolla) ei näy HY2:ssa, vaan HY3:ssa. (Q9–Q11)

## Vaihtoehdot, joita ei valittu

- **Uusi tyypin 11 tai 7 CR jälkikorjaukseen.** Hylätty: duplikaattiesto estää, ja käsin tehty asiakirja on jäljitettävä
  `LISA-`-tunnuksella.
- **Hinnan arvaaminen lähimmältä riviltä**, kun mikään rivi ei näytä kuukautta laskutetuksi. Hylätty: väärä hyvitys on pahempi kuin
  Error (14.9. erä).
- **HY1 vain laskuriviä vasten.** Hylätty: yli puolet hyvitysriveistä on kokoomalaskuilla, joita ei voi sitoa.
- **Tarkka desimaalivertailu.** Hylätty: lasku pyöristää senttiin, ja käsin korjatut rivit eroavat neljännessä desimaalissa.

## Seuraukset

- `docs/poikkeamaraportointi-vaatimukset.md`: uusi osio *Hyvitykset ja jälkiveloitukset (HY)*, A1 käsitelty. T65 valmis.
- TASKS: T75 (cr-scripts: k. 4–5), T76 (23.9. ylihyvitykset), T77 (CR 7467 käsin), T78 (CR 7447:n uusintakäsittely).
- ADR 0020:n RI8-riippuvuus (tyypin 11 CR:n jakso = hyvitetyt kuukaudet) on todennettu.
- B033217:n marraskuun tuplahallintamaksu (T72) on HY2:n tapaus ja korjataan kohdan 6 mukaan.
