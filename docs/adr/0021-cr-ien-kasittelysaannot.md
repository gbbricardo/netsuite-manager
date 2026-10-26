# ADR 0021 — CR:ien käsittelysäännöt

- **Päivämäärä:** 2026-10-23
- **Tila:** Hyväksytty (tuoteomistaja, grilling-istunto 23.10.2026, kysymykset Q1–Q8)
- **Koskee:** `netsuite-subscrption-cr-scripts` (CR-käsittelijät `handler_lunastus.js`, `handler_vali.js`, siirtokäsittelijät,
  `cr_bike_register_updater.js` = script 1196), poikkeamaraportoinnin tarkistus CR1
- **Täydentää:** [ADR 0010](0010-keskenkauden-lunastus.md) (rivit katkaistaan `end_date_of_old_sub`:iin, raha tyypin 11 CR:llä),
  [ADR 0017](0017-poikkeamaraportointi.md), TASKS T24 (päätös 9.10.2026), T65 (luokat A6, A8, A9)
- **Muuttaa:** [ADR 0020](0020-kuukausiraportointiin-vaikuttavat-tiedot.md): lisää päätöksen 13 ja tarkistuksen RI9 (A8)

## Konteksti

T65:n luokat A6, A8 ja A9 kuvasivat CR-käsittelyn seurauksia, joille ei ollut kirjattua sääntöä. Grillauksessa selvisi (todennettu
NetSuitesta 23.10.2026):

- **A6:** `handler_vali` korjattiin 28.9.2026 (ei koske tulevaisuudessa alkaviin riveihin), mutta `handler_lunastus` asettaa yhä
  kaikkien aktiivisten rivien loppupäiväksi `end_date_of_old_sub`:n. Aktiivisia rivejä, joiden alku on lopun jälkeen, on 258
  (120 muokattu 26.9. jälkeen, joista 112 tyypin 2 CR:n pyörillä). 140:llä on laskutushistoriaa. Päätelty: ne laskutettiin
  etukäteen ennen katkaisua, ja raha korjattiin tyypin 11 CR:llä.
- **A8:** pidennys-CR:n ja tyypin 2 CR:n yhdistelmää samassa kuussa ei ole esiintynyt kertaakaan (0 heinäkuusta 2026). Esimerkkipyörällä
  8893 tyypin 2 *vakuutus*-CR 6867 käsiteltiin 30.9., kun lokakuun Active-rivi oli jo luotu, ja UE loi viereen Ended-rivin.
  Kyse on rivijoukon lopputilasta, ei CR-yhdistelmästä.
- **A9:** 1196 käsittelee tyypin 1/9 Done-CR:t, joiden `start_date` on seuraavan kuun 1. päivä, ilman järjestystä
  (`cr_bike_register_updater.js:73-82`). Elokuun jälkeen yksi tapaus (B026614, 1.10.2026), jossa järjestys osui oikein.
  1196 ajaa päivittäin noin klo 23 Helsingin aikaa.

## Päätökset

1. **Tämä ADR kirjaa, mitä CR-käsittelijä saa tehdä.** Sopimusrivien datatarkistukset kuuluvat ADR:ään *Laskutuksen päättäminen
   tai sen tauotus* ja RI-rivijoukon lopputila ADR 0020:een. (Q1)

2. **Tyyppi 2 (keskenkauden lunastus) katkaisee kaikki rivit.** Käsittelijä asettaa pyörän kaikkien aktiivisten sopimusrivien
   loppupäiväksi `custrecord_cr_end_date_of_old_sub`:n, **myös tulevaisuudessa alkavien** (esim. huoltopidennysrivi). Tuloksena
   oleva rivi, jonka alku on lopun jälkeen, on tarkoituksellinen merkki: rivin kautta ei voi koskaan laskuttaa vahingossakaan.
   Riviä ei passivoida eikä jätetä koskematta. Nykyinen `handler_lunastus` toimii näin, joten koodimuutosta ei tarvita. (Q2, Q5)

3. **Tyyppi 3 (välikuukaudet) ei koske tulevaisuudessa alkaviin riveihin**, koska sopimus jatkuu tauon jälkeen
   (`handler_vali`, korjattu 28.9.2026). (Q5)

4. **Muut käsittelijät eivät koskaan kirjoita sopimusriville loppupäivää, joka on ennen rivin alkupäivää.** (Q5)

5. **Raja sopimusrivien datatarkistukselle:** aktiivinen rivi, jonka alku on lopun jälkeen, on virhe, **paitsi** jos sen
   loppupäivä on sama kuin pyörän Done-tilaisen tyypin 2 CR:n `end_date_of_old_sub`. Raja kirjataan ADR:ään *Laskutuksen
   päättäminen tai sen tauotus*. (Q5)

6. **Yksi siirto kuukaudessa.** Samaa pyörää ei siirretä kahdesti saman kalenterikuukauden aikana; kuukausi luetaan CR:n
   `custrecord_cr_start_date`:sta. Siirtoja ovat tyypit 1 (siirto TA) ja 9 (siirto konserni), myös tyypin 13 käsittelijän
   luomat, tiloissa Pending, Done, Error ja Needs Review. Cancelled ei laske, koska sitä ei koskaan käsitellä. (Q6, Q7)

7. **Yhdistelmää ei tueta.** Siirto TA emoyhtiölle ja sen jälkeen konsernisiirto tytäryhtiölle samassa kuussa (nähty
   käytännössä, kun laskutus haluttiin siirtää tytäryhtiölle) ei toimi, koska 1196:n järjestys on sattumaa. Oikea tapa on
   **yksi siirto TA -CR suoraan lopulliselle laskutusasiakkaalle**, ja toinen perutaan. Vaihtoehtona toisen CR:n
   `start_date` siirretään seuraavaan kuuhun. (Q6)

8. **Tarkistus CR1:** samalla pyörällä on samalle kuukaudelle useampi kuin yksi kohdan 6 siirto-CR. Laji on
   **ennakkovaroitus**, jonka määräaika on 1196:n ajo kuun viimeisenä päivänä (noin klo 23 Helsingin aikaa). Koodia ei
   korjata (päätös 9.10.2026, T24). (Q3, Q6)

9. **Ajokalenteri:** 1196 ajaa päivittäin noin klo 23 Helsingin aikaa. Kriittinen ajo on kuun viimeinen päivä, jolloin se
   kirjoittaa seuraavan kuun siirrot pyörärekisteriin. (Q3)

10. **A8 kuuluu ADR 0020:een** (sen päätös 13, tarkistus RI9): samalla pyörällä, työnantajalla ja raportointipäivällä ei ole
    sekä Active- tai Active/New-riviä että Ended-riviä, ja Ended voittaa (päätös 9.10.2026, T23). CR-käsittelijälle ei
    tule A8:n takia uutta sääntöä. (Q4, Q8)

11. **Siirto korvaa, ei kahdenna** (lisätty 26.10.2026, [ADR 0022](0022-laskutuksen-paattaminen-tai-tauotus.md), Q10). Siirron
    (tyypit 1 ja 9, myös tyypin 13 luomat) jälkeen pyörän jokainen jäljellä oleva kuukausi on katettu **täsmälleen kerran**
    kummallakin nimikkeellä (30 ja 31) ja **samalla hinnalla kuin ennen siirtoa**. Käsittelijä passivoi rivit, jotka klooni
    korvaa, myös tulevaisuudessa alkavat huoltopidennysrivit. OOMI-pyörän viimeisen kuun osariviä klooni ei korvaa, vaan päättyy
    sitä edeltävän kuun loppuun. Tausta: 2A-paketin konsernisiirrot rikkoivat tätä 14.8.–26.10.2026 (15 pyörää,
    [löydös](../../findings/2026-10-26-konsernisiirto-tuplarivit.md)). Korjaus tehdään cr-scripts-repossa (TASKS T71).

## Vaihtoehdot, joita ei valittu

- **Tulevaisuudessa alkavan rivin passivointi tyypin 2 käsittelyssä.** Hylätty: alku > loppu takaa paremmin, ettei riviä
  laskuteta, ja nykyinen koodi toimii jo näin.
- **Tulevaisuudessa alkavan rivin jättäminen koskematta tyypin 2 käsittelyssä.** Hylätty: rivi laskuttaisi lunastuksen jälkeen.
- **Yleissääntö "loppu ei koskaan ennen alkua" kaikille käsittelijöille.** Hylätty tyypin 2 osalta (kohta 2).
- **1196:n järjestäminen (`ORDER BY`) tai Needs Review usealle siirrolle.** Hylätty 9.10.2026: ei koodikorjausta, raportoidaan
  etukäteen.
- **A8 CR-käsittelysääntönä** ("tyypin 2 UE muuntaa Active-rivin Endediksi"). Hylätty: lopputilan sääntö kattaa kaikki reitit.

## Seuraukset

- `docs/poikkeamaraportointi-vaatimukset.md`: uusi osio *Muutospyynnöt (CR)* ja tarkistus CR1, ajokalenterin 1196-rivi tarkennettu,
  RI9 kuukausiraportoinnin osioon.
- T65: A8 ja A9 käsitelty. A6:n käsittelijäpuoli on käsitelty, datasääntö jää ADR:ään *Laskutuksen päättäminen tai sen tauotus*.
- Kun CR1:n ja sopimusrivitarkistuksen kyselyt rakennetaan, todennetaan, ettei yhtäkään riviä, jonka alku on lopun jälkeen, ole
  laskutettu katkaisupäivän jälkeiselle kaudelle.
