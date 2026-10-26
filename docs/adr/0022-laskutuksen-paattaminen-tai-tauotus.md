# ADR 0022 — Laskutuksen päättäminen tai sen tauotus

- **Päivämäärä:** 2026-10-26
- **Tila:** Hyväksytty (tuoteomistaja, grilling-istunto 23.–26.10.2026, kysymykset Q1–Q10)
- **Koskee:** item 30 (vuokra) ja item 31 (hallintamaksu) -sopimusrivit (`customrecord_sta_ca_agreement_row`), poikkeamaraportoinnin
  tarkistukset SR1–SR2
- **Täydentää:** [ADR 0021](0021-cr-ien-kasittelysaannot.md) (k. 2–5 käsittelijän säännöt, k. 11 lisätty tämän ADR:n yhteydessä),
  [ADR 0020](0020-kuukausiraportointiin-vaikuttavat-tiedot.md) (RI8), TASKS T65 (luokka A6)
- **Löydös:** [`findings/2026-10-26-konsernisiirto-tuplarivit.md`](../../findings/2026-10-26-konsernisiirto-tuplarivit.md)

## Konteksti

Laskutusmoottori laskuttaa aktiivisista sopimusriveistä 35 päivää etukäteen. Rivin päivämäärät ovat siis ainoa asia, joka
ratkaisee, laskutetaanko kuukausi kerran, kahdesti vai ei lainkaan. A6-löydös (25.9.2026) kuvasi kaksi rikkoutumaa: rivi,
jonka alku on lopun jälkeen, ja kaksi aktiivista saman nimikkeen riviä samalle kaudelle.

Todennettu NetSuitesta 23.–26.10.2026:

- **Alku > loppu:** 258 aktiivista riviä. Niistä 252 (126 item 30 + 126 item 31) on tyypin 2 katkaisuja, jotka ADR 0021 k. 2
  tekee tarkoituksellisiksi. Muita on 6.
- **Päällekkäisyys:** 15 pyörää. 14 syntyi 2A-paketin (tyyppi 13 → 7, 11, 9) konsernisiirrosta 14.8.–26.10.2026. Klooni kattoi
  koko jäljellä olevan kauden, ja vanha, tulevaisuudessa alkava huoltopidennysrivi (tai OOMI-pyörän osarivi) jäi aktiiviseksi.
  Ensimmäinen tuplakuukausi olisi ollut joulukuu 2026 (B006208, B023726). Tuoteomistaja korjasi 14 pyörää 26.10. B033217:n item 31 -rivi
  laskutti marraskuun 2026 kahdesti.
- **Rivi päättyy pyörän `subsc_end_date`:n jälkeen:** 7 774 pyörää (OOMI 7 409). Ilmiötä ei tunneta. Se voi olla rakenteellinen.

## Päätökset

1. **Laajuus.** Tämä ADR kirjaa sopimusrivien päivämääräsäännöt silloin, kun laskutus päättyy tai tauotetaan: rivin oma
   kausi, saman nimikkeen rivien päällekkäisyys ja tauko. Se, **laskuttaako rivi pyörän sopimuskauden jälkeen**, jää pois,
   kunnes se on selvitetty (TASKS T74). (Q1)

2. **Rivin kausi.** Aktiivisen item 30- tai 31-rivin alkupäivä on aina viimeistään sen loppupäivä. **Ainoa poikkeus** on tyypin 2
   katkaisu: rivi, jonka loppupäivä on sama kuin pyörän Done-tilaisen tyypin 2 CR:n `custrecord_cr_end_date_of_old_sub`. Se on
   tarkoituksellinen merkki siitä, ettei riviä laskuteta (ADR 0021 k. 2, k. 5). (Q2)

3. **Ei päällekkäisyyttä.** Samalla pyörällä ei ole kahta aktiivista saman nimikkeen (item 30 tai 31) riviä, joiden kaudet menevät
   päällekkäin. Asiakkaalla ei ole väliä. Kohdan 2 poikkeusrivit eivät ole mukana, koska niiden kausi on tyhjä. (Q3)

4. **Korjausperiaate päällekkäisyydelle** (26.10.2026 korjausten mukaan):
   - Rivi, joka kattaa jäljellä olevan kauden, jää. **Korvatut rivit passivoidaan**, myös huoltopidennysrivit. Passivointi ei riko
     maksulinkin pidennystodistetta, koska se laskee myös passiiviset pidennysrivit
     (`gbb_mr_send_end_redemption_paylink.js:467-471`). (Q6, Q8)
   - **OOMI-pyörän viimeisen kuun osarivi** (päiväsuhteutettu hinta) jää. Kattava rivi päättyy sitä edeltävän kuun loppuun.
     Muuten viimeinen kuu laskutetaan kahdesti ja täydellä hinnalla (B044562, B037449). (Q9)
   - Jo laskutettu tuplakuukausi hyvitetään. (B033217)

5. **Tauko.** Välikuukausissa (tyyppi 3) käsittelijä sulkee voimassa olevat rivit tauon alkuun, luo jatkorivin tauon jälkeen
   eikä koske tulevaisuudessa alkaviin riveihin (ADR 0021 k. 3). Taukokuukausi ei ole laskutettu. Erillistä sopimusrivitarkistusta
   ei tehdä, koska laskutettu taukokuukausi jää kiinni ADR 0020:n tarkistuksessa RI8 (laskutettu kuukausi ja Paused-rivi). (Q4)

6. **Tarkistukset** (lajit ADR 0017:n mukaan):

   | ID | Ehto | Laji | Ajankohta |
   |---|---|---|---|
   | SR1 | Aktiivinen item 30- tai 31-rivi, jonka alku on lopun jälkeen, eikä loppupäivä ole pyörän Done-tilaisen tyypin 2 CR:n `end_date_of_old_sub` | V | päivittäin |
   | SR2 | Kaksi aktiivista saman pyörän ja saman nimikkeen riviä, joiden kaudet (alku ≤ loppu) menevät päällekkäin | V | päivittäin |

   SR2 on virhe eikä ennakkovaroitus, vaikka päällekkäisyys alkaisi vasta tulevaisuudessa: etukäteislaskutuksen takia korjausaika
   on joka tapauksessa lyhyt. (Q3)

## Vaihtoehdot, joita ei valittu

- **Kattavan kloonin lyhentäminen pidennysrivin alkuun** (pidennysrivi jää). Hylätty: klooni kattaa jo loppukauden, ja
  pidennysrivit ovat turhia (tuoteomistaja, Q6).
- **Tauolle oma sopimusrivitarkistus.** Hylätty: RI8 kattaa sen.
- **SR2 ennakkovaroituksena** päällekkäisyyden alkuun asti. Hylätty: etukäteislaskutus.
- **Sääntö "rivi ei laskuta sopimuskauden jälkeen" nyt.** Lykätty: 7 774 pyörän ilmiötä ei tunneta (T74).

## Seuraukset

- `docs/poikkeamaraportointi-vaatimukset.md` saa osion *Sopimusrivit (SR)*.
- Kunnes ADR 0021 k. 11 on toteutettu cr-scripts-repossa (T71), päällekkäisyystarkistus (SR2) ajetaan käsin jokaisen CR-ajon jälkeen,
  jossa käsiteltiin siirto- tai pakettiCR (T73).
- T65:n luokka A6 on käsitelty.
