# Kuukausiajo 1.10.2026 — RI-riskimittaus 30.09.2026

> [!WARNING]
> **Korjaus 30.09. illalla:** tämän raportin hälytys B009498:n ja B010548:n (E1) "väärästä" siirrosta on **väärä hälytys**. Siirto-CR:n `official_end_date` + 1 vaihtaa raportoinnin työnantajan, ja `start_date` (1.11.) vaihtaa vain laskutuksen. CR:t 6859 ja 6862 sekä RI-rivit 118074–118077 ovat oikein, ja 29.09. suunnitelma oletti suunnan väärin päin. Ks. [`2026-09-30-kuukausiajo-rekisteri-riski.md` § 6](2026-09-30-kuukausiajo-rekisteri-riski.md).


Rajaus: ri-auditoija, vain luku. Vertailukohta: `docs/kuukausiajo-2026-10-suunnitelma.md` ja 29.09. mittaus
(`findings/2026-09-28-tilannekatsaus/warning-32-kohtalo-2026-09-29.csv`). Ei kirjoituksia NetSuiteen.

## A. Todennettu NetSuitesta (30.09.)

### Lokakuun (01.10.) rivit statuksittain
| Status | Rivejä |
|---|---|
| 1 Active | 138 |
| 2 Active/New | 52 |
| 3 Paused | 24 |
| 4 Ended | 326 |
| 5 Warning | **2** (1 työnantaja: Testi Yritys Oy, B017530, rivit 117470 ja 117571, "Missing contract official end date…") |
| 6 Deleted | 59 |

- `[To-add: Data from bike register]` -rivejä: **0**. Ainoat `To-add`-rivit ovat 4 Deleted-riviä (B013565, "Subscription line id 47177").
  Siksi ri_update.js:n demotio (rivit 725-776) ei voi laueta yhdellekään riville lokakuussa; se ajetaan vain markkeririvelle
  ja vaatii lisäksi `paattymisajankohta < raportointipäivä` + velvoitteet hoidettu (ei enää pelkkä status 2/3).
- Elävät lokakuun rivit vs. rekisterin status/päättymispäivä: status 1 + päättymispäivä tulevaisuudessa 134; status 1 + päättymispäivä mennyt
  47 (Active + A4, odotettu); status 2 + päättymispäivä mennyt 9 Active + 2 Warning (B017530). Status 2/3 + päättymispäivä
  tulevaisuudessa: **0** (gate pitää).
- Tupla-elävä rivi samalle pyörälle lokakuussa: **0**. Työnantaja ≠ rekisteri (rivit ilman CR-linkkiä): **0**.
- **E2:** 117974 (B046737 CGI), 117975 (B046742 Tapojärvi), 117976 (B046832 CGI) ovat kukin ainoa lokakuun rivi, Active, fee 79,6813. Tuplaa ei ole.
  B046830: yhä ei lokakuun riviä (E3).
- Lokin viimeinen 1196-rivi: 29.09. 13:31 "Not last day of month — skipping". `scriptnote`n uusin rivi 30.09. on 02:27 lokiaikaa, eli **1196:n
  ajoa 30.09. ei näy (todennettu: ei riviä; ei todiste ettei se ole ajettu, jos loki laahaa)**.
  Rekisterin työnantaja ≠ Done-siirto-CR:n `next_billto` (tyyppi 1/9, alku 01.10.): 36 pyörää, joista **27 ilman lokakuun riviä** (Warning, jos
  ri_creation ajetaan ennen 1196:aa): B005145, 5265, 5844, 5855, 6544, 6926, 7243, 11367, 13267, 13794, 16865, 19779, 20454, 21208*, 25021, 26475, 27368,
  28198, 28294, 30264, 31572, 31854, 32028, 33485, 34456, 35626, 36911. (*B021208 päättyy 30.09., ei lokakuun riviä eikä Warningia; B006540 on
  29.09.:n jälkeen saanut Ended-rivin 117873 mutta ei Active-riviä Oulunkylälle, ks. alla.) Muut 9 mismatchia (B000420, 5148, 5296, 18137,
  26614, 33371, 33554, 38350 ja 6540) ovat jo saaneet siirtoparin -> ei Warning-riskiä.
- **Uusi 29.09. jälkeen:** E1-luokan c siirto-CR:t on luotu 30.09. (CR 6859-6861 B009498, 6862-6864 B010548; tyypit 1, 11, 7; kaikki Done)
  ja ne ovat jo tuottaneet 4 lokakuun riviä (118074-118077, luotu 30.09.).

### KRIITTINEN: E1-luokan c CR:t poikkeavat suunnitelmasta
| Kenttä | Suunnitelma (E1) | Todellinen CR 6859 (B009498) / 6862 (B010548) |
|---|---|---|
| `next_billto` | uusi asiakas (Erikssons 5323 / Infra Kiri 4622) | **vanha**: Oy Nautor Ab / Pirkan Rakentajapalvelu Oy |
| `start_date` | 01.10.2026 | **01.11.2026** |
| `end_date_of_old_sub` | 30.09.2026 | **31.10.2026** |
| rekisterin työnantaja jälkeenpäin | uusi | **ei muutu** (Nautor / Pirkan) |

Syntyneet lokakuun rivit: 118074 B009498 Ended, **Erikssons** (lease 2025-05-01..2026-05-31); 118075 B009498 Active/New, **Nautor**
(2026-06-01..2029-02-28, fee 79,68167); 118076 B010548 Ended, **Infra Kiri**; 118077 B010548 Active/New, **Pirkan** (2026-09-01..2030-01-31).
Item 30 -rivit lokakuulle ovat Erikssonsilla (rivi 50399) ja Infra Kirillä (49472). Tulos: palkkavähennys lokakuulle menisi **vanhalle
työnantajalle** ja "päättynyt" uudelle -> väärä työnantaja CSV:ssä. Toisaalta osa tyypin 11/7 -CR:ien kentistä (start 2026-06-01 / 2026-09-01)
viittaa siihen, että totuus voi olla toinen (pyörä on ehkä ollut uudella asiakkaalla jo aiemmin) -> **vaatii ihmisen päätöksen, en arvaa**.

### Nollavuokrat (uusi löydös, luokka 2, kriittinen)
5 OOMI-pyörän lokakuun Active-rivillä `lease_fee_vat0` = **0** (rivit 116352 B046738 Hilti, 116353 B046744 Vaisala, 116354 B046743 Vaisala,
116355 B046745 Itä-Uudenmaan poliisilaitos, 116356 B046829 Konecranes; luotu 18.09.). Syyskuussa 79,681275. Item 30 -rivi alkaa vasta
01.11.2026 (sama juurisyy kuin E2:n kolmella) -> pyöräetu raportoituisi lokakuussa nollana. Ei kuulu E2:een (117974-6).
Ehdotus riville (ihmisen tehtävä): `custrecord_gbb_ri_lease_fee_vat0` 0 -> 79,6813 (syyskuun arvo, sääntö A7/E2-malli); rekisterikorjaus ei
tarvita; toistuu marraskuussa vain jos item 30 -riviä ei ole (alkaa 1.11., ok). Työnantajat: Hilti, Vaisala, Itä-Uudenmaan poliisilaitos, Konecranes.

### Muut
- Lokakuun Ended-tuplat (B008217, B045099, B018137) ja testipyörä B017530: ei uutta. B017530 Warning pidättää Testi Yritys Oy:n (ei tuotantotyönantaja).
- Pidätetyt työnantajat nyt: **1** (testi). Ennuste ajon jälkeen, jos 1196 ei aja: 27 pyörää -> ~15 työnantajaa lisää (Sweco Finland 936 jne.).

## B. Päätelty koodista
- ri_update.js:725-776: demotio Warningiksi vain `[To-add: Data from bike register]` -riveille, ehto `hoidettu && rd > paattyminen`. Muualla Warning-asetukset
  rivit 620, 1025, 1036 (ei tarkistettu tässä).
- ri_creation ohittaa pyörän jolla lokakuun rivi on jo (E2, B009498, B010548) — oletus, ei todennettu.
- Siirto-CR 6859/6862: en tunne miksi start 11-01; mahdollinen UI/käsin täyttövirhe. Rivikorjaus yksin ei riitä jos CR:n kentät ovat väärin (juurisyy muualla).

## C. Ennen 1.10. ajoa
1. Aja 1196 käsin (30.09., ennen 22 Hki) ja varmista Q0; muuten 27 pyörää -> Warning ja CSV-korjaus.
2. B009498 ja B010548: ihminen päättää oikean työnantajan; rivit 118074-118077 tarkistettava/poistettava (status 6) ennen CSV:tä; CR 6859/6862
   kentät (juurisyy) katsottava. Älä aja CSV:tä niillä sellaisenaan.
3. 5 OOMI-nollariviä -> fee 79,6813 ennen CSV:tä.
4. Tyhjennä testirajaus (B017530 -parametrit), E3 (B046830), muut kuten suunnitelma.
