# Kuukausiajo 1.10.2026 — puhdas riskiarvio (30.09.2026 ilta)

Kolme auditoija-agenttia (ri-auditoija, muutospyyntoauditoija, lunastusauditoija), Sonnet. Rajaus:
ei aiempia löydöksiä, TASKS.md:tä eikä tilannedokumentteja — säännöt lähdekoodista ja `schemas/`:sta,
data NetSuitesta. (N) = todennettu NetSuitesta, (K) = päätelty koodista. Testipyörä B017530 pois.
Agenttien täydet raportit: scratchpad `ri-riski.md`, `cr-riski.md`; rekisteriagentin raportti vain
tässä koosteessa.

## Riskit vakavuusjärjestyksessä

| # | Riski | Määrä | Seuraus | Esimerkki | Lähde |
|---|---|---|---|---|---|
| 1 | Warning: ei kattavaa item 30 -riviä rekisterin työnantajalle | **1** | Pidättää työnantajan palkka-CSV:stä | 41345 (rekisteri Serres Oy / 104367, rivit Paree Group Oy, ei CR:ää) | N, kaksi agenttia riippumattomasti |
| 2 | Tupla lokakuun rivi (Active + Ended, sama työnantaja) | 1 | Väärä rivi CSV:ssä | 8893 (RI 117683 Active, 118079 Ended; rekisterin loppu lyhennetty 31.08.) | N |
| 3 | RI:n työnantaja ≠ rekisterin työnantaja ilman CR:ää | 17 | Työnantaja vaihtuu palkka-aineistossa hiljaa (16), ihminen ratkaisee kumpi oikein | 420, 12385, 30311 | N |
| 4 | Lokakuun rivin kentät ≠ rekisteri | 1 | Väärä alkupäivä ja verovapaus | 33119 / RI 116150 (alku 1.10.2026 vs 1.3.2024, verovapaus T vs F); CR 5014 lokakuun rivi Deleted | N |
| 5 | Status tyhjä, sopimus voimassa | 4 OOMI | Puuttuva rivi | 46739, 46740 (oomi_exc 31.5.2026 vs subsc_end 2027/2030), 46741, 46830 (vahinkotilaus) | N |
| 6 | Alkupäivä ≠ syyskuun rivi ilman tyypin 1 CR:ää | 27 | Mahdollinen Warning ri_updatessa | 46694, 46696, 1152 | N + K |
| 7 | Ei syyskuun Active-riviä samalle työnantajalle | 41 | ri_update voi asettaa Warningin; osa laillisia siirtoja | 420, 38350 | N + K |
| 8 | Needs Review -jälkiveloitukset, lokakuu jo laskutettu | 3 | Kaksoislaskutusriski (ei RI-vaikutusta) — talous päättää | CR 6876/6879/6882, INVGBF1043437–39 | N |
| 9 | 36 siirto-CR:ää odottaa `bill_to_cus`-päivitystä | 36 | Jos 1196 ei aja ennen ri_creationia, vanha työnantaja — **tarkista kumpi päivä (official_end+1 vs start_date) näitä ohjaa** | — | N + K |
| 10 | Status 1, päättynyt 11/2025, ei selvitystä | 3 | Active-rivi kuukaudesta toiseen | 23198, 24587, 24908 | N |
| 11 | Aktiivinen OOMI ilman enduseria | 10 | Rivi ilman loppukäyttäjää | 46475, 46519 | N |
| 12 | Error-CR | 1 | Mahdollisesti puuttuva Ended-rivi | CR 4652 / 39986 (7/2026) | N |
| 13 | CR:t start_date > end_date | 7 | Sopimusrivivaikutus, ei RI | 5271, 5428, 6378, 6381, 6384, 6387, 6750 | N |

## Todettu kunnossa (N)

- Syyskuussa 0 tuotannon Warning-riviä; lokakuussa vain B017530:n 2 riviä.
- 0 ennenaikaista lunastusta (status 2/3, päättyminen ≥ lokakuu).
- Aktiivisilta ei puutu työnantajaa, alkupäivää eikä kattavan vuokrarivin hintaa.
- 37/38 kattavuusehdokkaasta on jo elävä lokakuun rivi → ri_creation ohittaa.
- Tyypin 7 nimissä ei isolla kirjoitettua "Pidennys"; 79 päätteetöntä tyypin 2 CR:ää ovat vanhoja ja niillä on jo RI-rivi.
- Päivämäärämuodon throw-riski ≈ 0 (DATE-kentät).

## Päivitys 30.09. — 1196:n ajo ja ri_update-ennuste

**1196 (N):** ajo 30.09. 08:22 lokiaikaa, `Running for start date 01.10.2026`, `Found 66 CR(s)`,
66/66 `Updated bike register`, 0 ERROR. Pyörä 26614 päivittyi kahdesti: CR 6031 (tyyppi 1, 2A,
1767 → 373), sitten CR 6750 (tyyppi 9 Siirto konserni, start 1.10. > end 30.09., → 1767). Lopputulos
1767 = Wärtsilä Oyj Abp, joka täsmää lokakuun Active/New-riviin 117176 (CR 6750). CR 6031:lle ei ole
lokakuun riviä — **selvitä, onko CR 6031 vanhentunut vai onko pyörä oikeasti siirtymässä
asiakkaalle 373.**

**ri_update.js (1453) Warning-ehdot lokakuun eläviin riveihin (ri-auditoija; ehdot K, osumat N):**

| Ehto | mr_monthly_reporting_ri_update.js | Osumat |
|---|---|---|
| 1a `[To-add: …]` + lunastustodiste → Warning | 725–773 | 0 (ei yhtään `[To-add:`-riviä) |
| 1d CR Cancelled → Warning | 1024–1036 | 2, molemmat testipyörä 17530 |
| 3a päällekkäisyys / UiPath → Warning | 1317, 1370 | 0 (36 tuplaryhmää ovat siirtopareja, sääntö 0a ~1172) |
| D11 sama työnantaja + enduser, eri vuokra-ajat → ei-Ended-rivit Warning | 1110–1156, 1706 | **1: pyörä 8893, RI 117683 → Warning, Joen Diesel Oy pidätetään** |
| 3b | — | OFF |

Kohdan 3 työnantajaristiriidat (17): 1196:n jälkeen 16 täsmää (Ended vanhalla, Active/New uudella
työnantajalla, CR-parit). Jäljelle jää vain 41345 (ri_creation-Warning, kohta 1).

**Ennuste 1.10.: 2 tuotannon Warningia** — 41345 (ri_creation) ja 8893 (ri_update D11).

**8893 / RI 117683 korjattu 30.09. (käyttäjä).** Juurisyy käyttäjän mukaan: kaksi muutosta samassa
kuussa, pidennys ja ennenaikainen lunastus → sama työnantaja saa lokakuulle Active- ja Ended-rivin.
Jatko: TASKS.md T21 (41345), T22 (26614), T23 (juurisyy).

**B026614 selvitetty (T22):** Kaksi peräkkäistä siirtoa: 2A-paketti CR 6031/6032/6033 (Solidium Oy → Wärtsilä
Finland Oy 373) ja CR 6750 (tyyppi 9, → Wärtsilä Oyj Abp 1767). Molemmilla on `start` 1.10., joten 1196 ajoi ne
samassa ajossa, ja järjestys osui oikein. `cr_bike_register_updater.js:73-82` ei järjestä hakua (päätelty koodista), joten tulos
riippuu sattumasta → T24.

## Tarkistamatta jääneet

- 8 työnantajaristiriitaista pyörää, joilla on jo lokakuun rivi (4864, 9498, …): voiko ri_update demota ne Warningiksi.
- Kohtien 6 ja 7 päällekkäisyys kohdan 3 kanssa.
