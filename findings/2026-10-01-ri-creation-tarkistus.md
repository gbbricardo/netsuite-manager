# ri_creation 1.10.2026 — luonnin tarkistus (ri_update vielä käynnissä)

Omistava repo: `netsuite-monthly-reporting` (`mr_monthly_reporting_ri_creation.js`, script id 1452;
`mr_monthly_reporting_ri_update.js`, 1453). Tarkistus: TASKS T14 Q3 (a–f), T27, T21, T1d.
ri-auditoija, vain luku. Testipyörä B017530 on rajattu pois kaikista luvuista, ellei toisin sanota.
(N) = todennettu NetSuitesta, (K) = päätelty koodista tai dokumentista.

> **Päivitys 1.10. klo 03:43:** ri_update on valmis. Jälkitarkistus on osiossa [*ri_updaten jälkeen*](#ri_updaten-jälkeen) tiedoston lopussa.
> Alla oleva teksti kuvaa tilannetta ennen kuin ri_update valmistui, eikä sitä ole muutettu.

**Kyselyjen ajohetki:** 1.10.2026 klo 03:28–03:35 Helsingin aikaa (`CURRENT_TIMESTAMP`), eli runtime 30.09. klo 17:28–17:35.
**Kellot (N):** `scriptnote.date` ja `SYSDATE` ovat runtime-aikaa (Helsinki −10 h). RI-taulun `created`/`lastmodified` ovat
**Helsingin aikaa** (`CURRENT_TIMESTAMP` 03:29:11, kun `SYSDATE` oli 17:29:11). Tämä on otettava huomioon jokaisessa rajauksessa.

| Ajo | Runtime (scriptnote) | Helsinki |
|---|---|---|
| ri_creation 1452 | 30.09. 15:02:13 → summary 17:24:14 | 1.10. 01:02 → 03:24 |
| ri_update 1453 | alkoi 30.09. 17:27:20, **summary puuttuu klo 17:34** | alkoi 1.10. 03:27:20, käynnissä |

Rajaus "ri_update on koskenut riviin" = `lastmodified >= 2026-10-01 03:27:20` (Helsinki). Klo 03:34:56 tämä koski 378:aa lokakuun riviä.

## Yhteenveto

**Luonti meni läpi.** ri_creation ajoi koko populaatiolla, `mapErrors=0`, ei yhtään ERROR-lokiriviä, ja bucketit summautuvat
täsmälleen `scanned`-lukuun (46 626). Ajo loi 33 862 riviä. Yksikään niistä ei ole Warning, eikä yksikään ole tupla. T27 (162/162 Active),
Q3 a–f, E2 ja B046434 menevät läpi.

**CSV:n (1451) ajamista estää:**
1. **ri_update on kesken.** Summary puuttuu, ja luokan B kentät (status, huomiotekstit, vuokra-arvot) voivat yhä muuttua. Luokan B
   tarkistukset on ajettava uudelleen, kun `summarize` on lokissa. Kyselyt ovat liitteessä.
2. **Kaksi vanhaa käsiriviä, joiden data on väärin (luokka A, ri_update ei korjaa niitä (K)):** RI 116355 (B046745, Active, loppukäyttäjä tyhjä)
   ja RI 116150 (B033119, Active/New, verovapaus T, vaikka rekisterissä on F). Kumpikaan ei ole ri_creationin tekemä.
3. **Liiketoimintapäätös (T1d):** ProMet Oy:n rivit 104318–104320 ovat yhä Active. Ne menevät CSV:hen, ellei niistä päätetä toisin.

Yhtään työnantajaa ei pidätetä. Ainoat Warning-rivit ovat testipyörän kaksi riviä (Testi Yritys Oy).

**Tarkistettava uudelleen ri_updaten jälkeen (luokka B, väliaikainen):** Warning-määrä (nyt 0 + 2 testiriviä); T27:n 162 riviä yhä
Active; nollavuokrat Active-riveillä (nyt 0); 7 C3-riviä yhä Ended; 8893:n ainoa elävä rivi 118079 (Ended); ProMetin status;
38 siirtoparia koskemattomina (`resolveDuplicates | legitimate transfer pair`); ri_updaten oma summary ja ERROR-rivit.

---

## 1. ri_creationin loki (N)

```sql
SELECT TO_CHAR(sn.date,'YYYY-MM-DD HH24:MI:SS') d, sn.title, sn.detail FROM scriptnote sn
WHERE sn.scripttype = 1452 AND sn.date >= TO_DATE('2026-09-30 12:00','YYYY-MM-DD HH24:MI')
  AND (sn.title LIKE '%summarize%' OR sn.title LIKE '%getInputData%') ORDER BY sn.date
```

- `getInputData started` reportingDate=2026-10-01 · `bike register scanned` totalBikes=46626 ·
  `bulk data loaded` existingRiKeys=592 | pausedPairs=24 | bikesEverEnded=12705 | subscriptionLineGroups=45198
- **`summarize | done`** (17:24:14):
  `gbb_lunastus_lib=1.1.0 | scanned=46626 created=33862 converted=8 mapErrors=0 | active_already_exists_continuing=129 |
  active_already_exists_new=2 | active_already_exists_other_active_status=55 | active_created_continuing=32887 |
  active_created_contract_ended=39 | active_created_new=55 | active_skipped_paused_exists=24 | ended_already_reported=12546 |
  ended_converted=7 | ended_converted_late=1 | ended_created=658 | ended_created_late=148 | oomi_ended_created=75`

Lokirivit tyypeittäin (ryhmitelty `type, SUBSTR(title,1,60)`): kaikki 33 883 riviä ovat AUDIT-tasoa. **ERROR-rivejä 0**, eli myöskään
`rejected bike fields` -rivejä ei ole. `processActiveBike` 32 981 + `processEndedBike` 806 + `processOomiEndOverride` 75 = 33 862 = created.

**Bucketien summa** = 46 626 = scanned. Yksikään pyörä ei hävinnyt hiljaa map-vaiheessa. **Regressiotesti (CLAUDE.md avoin kohta 2) meni läpi.**

Ennusteeseen verrattuna (`docs/kuukausiajo-2026-10-suunnitelma.md` § 4 kohta 6):
- `ended_created` + `oomi_ended_created` = 733 (+148 late = 881). Ennuste oli ≈ 880. **Täsmää.**
- Warning-bucketia ei ole lainkaan. Ennuste oli ≈ 0. **Täsmää.**
- `mapErrors` = 0. Odotus oli 0. **Täsmää.**
- 46 626 skannattua vs. rekisterin noin 46 737 riviä: erotus on pyörät, joilla ei ole statusta. Hakusuodatin `:924` lukee statusta 1/2/3 (K).

## 2. Lokakuun rivit statuksittain (N)

```sql
SELECT ri.custrecord_gbb_ri_reporting_status st,
  CASE WHEN ri.lastmodified >= TO_DATE('2026-10-01 03:27:20','YYYY-MM-DD HH24:MI:SS') THEN 'upd' ELSE 'ei_upd' END lm,
  CASE WHEN ri.created >= TO_DATE('2026-10-01 01:02','YYYY-MM-DD HH24:MI') AND ri.created < TO_DATE('2026-10-01 03:25','YYYY-MM-DD HH24:MI') THEN 'run'
       WHEN ri.created >= TO_DATE('2026-10-01 03:25','YYYY-MM-DD HH24:MI') THEN 'post' ELSE 'pre' END cr, COUNT(*) n
FROM customrecord_gbb_monthly_reporting_item ri
WHERE ri.custrecord_gbb_ri_reporting_date = TO_DATE('2026-10-01','YYYY-MM-DD') AND ri.custrecord_gbb_ri_bike <> 17530
GROUP BY ri.custrecord_gbb_ri_reporting_status, <sama CASE lm>, <sama CASE cr> ORDER BY 1,2,3
```

Tilanne klo 03:29 Helsingin aikaa:

| Status | Ennen ajoa | Ajon luomat | Yhteensä | joista ri_update koskenut |
|---|---|---|---|---|
| 1 Active | 129 | 32 926 | 33 055 | 19 |
| 2 Active/New | 57 | 55 | 112 | 14 |
| 3 Paused | 24 | 0 | 24 | 0 |
| 4 Ended | 341 | 881 | 1 222 | 94 |
| 5 Warning | **0** | **0** | **0** | — |
| 6 Deleted | 57 | 0 | 57 | 0 |

B017530:llä on lisäksi 2 Warning-riviä (117470 ja 117571, `Missing contract official end date …`, CR 6831/6837 Cancelled).

## 3. Luokka A — luontivaiheen tosiasiat (lopullisia, ri_update ei muuta (K))

### A1. Tuplat: 0 ri_creationin luomaa (N)

```sql
SELECT t.* FROM (SELECT ri.custrecord_gbb_ri_bike bike, COUNT(*) n, COUNT(DISTINCT ri.custrecord_gbb_ri_employer) n_emp,
  SUM(CASE WHEN ri.custrecord_gbb_ri_reporting_status = 4 THEN 1 ELSE 0 END) n_end,
  SUM(CASE WHEN ri.custrecord_gbb_ri_reporting_status IN (1,2) THEN 1 ELSE 0 END) n_act,
  SUM(CASE WHEN ri.created >= TO_DATE('2026-10-01 01:02','YYYY-MM-DD HH24:MI') THEN 1 ELSE 0 END) n_run
 FROM customrecord_gbb_monthly_reporting_item ri
 WHERE ri.custrecord_gbb_ri_reporting_date = TO_DATE('2026-10-01','YYYY-MM-DD') AND ri.custrecord_gbb_ri_reporting_status <> 6
   AND ri.custrecord_gbb_ri_bike <> 17530
 GROUP BY ri.custrecord_gbb_ri_bike HAVING COUNT(*) > 1) t ORDER BY t.n_run DESC, t.bike
```

Tulos: 38 pyörää, joilla on kaksi elävää lokakuun riviä. **Kaikki 38 ovat muotoa 1 Ended + 1 Active/Active-New eri työnantajilla, ja
`n_run` = 0 jokaisella.** Ne ovat UE-skriptien siirtopareja, eivät ri_creationin tekemiä. ri_update luokittelee ne itse
`resolveDuplicates | legitimate transfer pair, left untouched` (10 lokiriviä klo 17:34 mennessä). Pyörät: 420, 1104, 4864, 5148, 6208, 6552,
7442, 8409, 9498, 10048, 10548, 12385, 12386, 16298, 20577, 20685, 21474, 23377, 24374, 26614, 26973, 27538, 28437, 28459, 29874, 30311,
31916, 33119, 33371, 33554, 33972, 34231, 34817, 38350, 41289, 41345, 43367, 44562.

Riskiarvion 3 tupla-Ended-tapausta (B008217, B045099, B018137) eivät ole lokakuun tuplia: rivit 108439, 115214 ja 90511 ovat
`reporting_date` 1.9.2026. Kullakin pyörällä on yksi lokakuun Ended-rivi (N).

### A2. Kattavuus: puuttuvat rivit (N)

```sql
-- voimassa oleva sopimus 1.10., ei elävää lokakuun riviä
SELECT br.id, br.name, br.custrecord_sta_bike_status, br.custrecord_sta_bike_order_type, ... FROM customrecord_sta_bike_register br
WHERE br.id <> 17530 AND br.custrecord_sta_subsc_start_date <= TO_DATE('2026-10-01','YYYY-MM-DD')
  AND br.custrecord_sta_subsc_end_date >= TO_DATE('2026-10-01','YYYY-MM-DD')
  AND NOT EXISTS (SELECT 1 FROM customrecord_gbb_monthly_reporting_item ri WHERE ri.custrecord_gbb_ri_bike = br.id
     AND ri.custrecord_gbb_ri_reporting_date = TO_DATE('2026-10-01','YYYY-MM-DD') AND ri.custrecord_gbb_ri_reporting_status <> 6)
```

**4 pyörää, kaikki OOMI ja kaikilta puuttuu status:** B046739 (Itä-Uudenmaan poliisilaitos), B046740 (Oral Hammaslääkärit), B046741
(Tapojärvi) ja B046830 (Rainmaker Telepalvelu, vahinkotilaus, T19/E3 peruttu). Näillä ei ole yhtään RI-riviä koskaan. Tämä on
riskiarvion kohta 5, ei regressio. Haku ohittaa statuksettomat pyörät (K, `:924`). **Ei uusia puuttuvia.**

Kausi päättynyt 8–9/2026, status 1/2/3, ei koskaan Ended-riviä eikä lokakuun riviä: **0** (N).

### A3. Kenttävertailu rekisteriin (N)

Lokakuun elävät rivit ilman CR-linkkiä, verrattuna `customrecord_sta_bike_register`iin (kysely liitteessä, Q-A3).

| Joukko | n | työnantaja ≠ | loppukäyttäjä ≠ | alku ≠ | loppu < / > | loppu tyhjä | verovapaus ≠ | `[To-add` |
|---|---|---|---|---|---|---|---|---|
| Ajon Active | 32 926 | 0 | 0 | 0 | 0 / 0 | 0 | 0 | 0 |
| Ajon Active/New | 55 | 0 | 0 | 0 | 0 / 0 | 0 | 0 | 0 |
| Ajon Ended | 881 | 0 | 0 | 0 | 0 / 0 | 0 | 0 | 0 |
| Vanhat Active | 85 | 0 | **1** | 0 | 0 / 0 | 0 | 0 | 0 |
| Vanhat Active/New | 1 | 0 | 0 | **1** | 0 / 0 | 0 | **1** | 0 |

**ri_creationin luomissa riveissä ei ole yhtään kenttäpoikkeamaa.** Nimen työnantaja ≠ `BUILTIN.DF(employer)` 13 ajon rivillä
(IC-Gobybike Finland Oy, `BUILTIN.DF` palauttaa entity-id:n `IC001`). Ero tulee näyttöarvosta, ei virheestä. Lisäksi vanha Ended-rivi 116041:
nimessä on "FootBalance Systems Oy", asiakkaana "FootBalance System Oy" (kosmeettinen).

**Löydökset (vanhoja käsirivejä, eivät ri_creationin):**

| RI | Pyörä | Työnantaja | Status | Kenttä | Rivillä | Rekisterissä | Luotu |
|---|---|---|---|---|---|---|---|
| 116355 | B046745 | Itä-Uudenmaan poliisilaitos | 1 Active | `end_user` | tyhjä | 128579 Konsta Väre (syyskuun rivi 116824: 128579) | 18.09. käsin (R2) |
| 116150 | B033119 | Savas-Säätiö sr | 2 Active/New | `tax_exemption` | T | F | 16.09. käsin |
| 116150 | B033119 | Savas-Säätiö sr | 2 Active/New | `lease_start_date` | 2026-10-01 | 2024-03-01 | 16.09. käsin |

B033119:n tausta (N): Rauta-Kanki Oy:n välikuukausi-CR 5014 peruuntui, kun työnantaja vaihtui kesken palkattoman jakson.
Rivi 51714 on käsin muutettu Endediksi ja 116150 käsin Active/New-tilaan (loki *Muokattu käsin … erikoistapaus …*). Työnantaja vaihtui
ilman CR:ää, joten `docs/verovapaus-saannot.md`:n mukaan uuden työnantajan rivillä kuuluu olla F, ja rekisterissä se on F (K, sääntö).
Alkupäivä 1.10.2026 vastaa uuden työnantajan alkua ja Active/New-tilaa. Sen muuttaminen on ihmisen päätös.

### A4. CR-linkitetyt Active/New-rivit, joiden työnantaja ≠ rekisteri (N), ei virhe

Rivejä on 37, kaikki luotu UE:llä ennen ajoa. Niiden CR:t ovat Done: tyyppi 9 *Siirto konserni* 32 kpl ja tyyppi 1 *Siirto TA* 5 kpl
(6092, 6606, 6181, 6885, 6832), kaikilla `start_date` 1.11.2026. Lisäksi on tyypin 3 CR 1378, ks. alla. Rekisteri on vielä vanhalla
työnantajalla, koska 1196 kirjoittaa sen vasta 31.10. RI on uudella työnantajalla `official_end`+1:stä alkaen. Tämä on dokumentoitu
päiväjako (CLAUDE.md, *transfer CR date split*), ei epäsymmetria. Tyypin 1 siirtojen uusilla riveillä verovapaus on F kaikilla viidellä (N).

**Poikkeus, joka vaatii ihmisen päätöksen:** RI 1226 (B025874, Anders Innovations Oy, Active/New, välikuukausi-CR 1378 tyyppi 3,
paluu 1.10.). Rivillä verovapaus on F, rekisterissä T. Syyskuun Paused-rivillä 1225 oli F ja poistetulla rivillä 70653 T. Datasta ei voi
päätellä, kumpi on oikein.

### A5. Rivin nimen kausi ≠ raportointipäivä (N)

RI 108494 (B008485, Metsäliitto Osuuskunta, Metsä Wood, Ended, fee 0) on nimetty `…_2026-09`, mutta `reporting_date` on 1.10.2026.
System Notes (UIF, 18.09. 15:24): `REPORTING_DATE` 01.09.2026 → 01.10.2026, `LEASE_END_DATE` 28.02.2027 → 31.08.2026,
`AUTOMATION_LOGS` tyhjennetty (vanha arvo *Takautuva Ended-rivi … backfill …*), huomioteksti *Vuokrasopimus päätetty ennenaikaisesti
31.08.2026*. Kyseessä on käsikorjaus, jossa nimi jäi päivittämättä. Lisäksi `automation_logs` tyhjennettiin, mikä rikkoo sääntöä.
ri_update stage1c lisäsi rivin klo 03:30 (*Ended retrospectively*).

## 4. Luokka B — kentät, joita ri_update voi vielä muuttaa (VÄLIAIKAISIA)

Tilanne klo 03:29–03:35 Helsingin aikaa, kun ri_update oli kesken.

### B1. T27: 162 sweepin kääntämää pyörää (N)

Löydöksen `2026-09-30-lokakuussa-paattyvat-162-sweep.md` tarkistuskysely br_id-listalla (liite Q-T27):
**162/162: `rivit` = 1, lokakuun rivi status 1 Active, rekisterissä status 2.** Yhtään Ended-, Warning- tai puuttuvaa riviä ei ole.
- **45 pyörää, joilla on Done-tyypin 2 CR:** kaikilla on uusi lokakuun Active-rivi ja marraskuun Ended-rivi ennallaan. Lisäksi B006956,
  B021682 ja muut cr_2-tyhjät saivat Active-rivin ilman marraskuun riviä, kuten odotettiin. A2-korjaus (`ri_creation.js:1146-1175`) toimi (K + N).
- B037874 (116458) ja B038677 (116459): yksi rivi kummallakin, ei tuplaa, ri_update ei ole koskenut niihin.
- B046434: uusi Active-rivi 152076 (fee 15,6088). Deleted-rivi 103913 ei näy lokakuun rivien joukossa. Se ei estänyt luontia.
- Pienet vuokra-arvot (esim. B037913 2,5963, kausi päättyy 1.10.) ovat suhteutettuja item 30 -arvoja, eivät nollia. Yksikään 162:sta ei ole 0.

Lisäksi rekisterissä on 4 status 2 -pyörää, joiden kausi päättyy lokakuussa, Active-rivillä mutta listan ulkopuolella. Ne saivat tavan
30.09. listauksen jälkeen: B042174 (148404, CGI), B044744 (150670, RTG), B044016 (150016, Serres) ja B039152 (145748, Servica).
Active on oikein samalla perusteella.

**Gate (N):** pyöriä, joiden status on 2/3, päättyminen ≥ 1.11.2026 ja lokakuun rivi Active: **0**.

### B2. Q3 (a–f)

| # | Tarkistus | Tulos (N) | Lopullinen? |
|---|---|---|---|
| a | B043367: RI 117171 Rainmaker Telepalvelu Oy Active/New (CR 6777), ei Warningia eikä uutta riviä | **OK.** Lisäksi Ended-rivi 117078 (Rainmaker Contact, CR 6706, luotu 24.09.) muodostaa siirtoparin; ajo ei luonut mitään | luonti lopullinen; status B |
| b | B044504: `exceptional_end_date` tyhjä | **OK** (`ns_getRecord`: poikkeuspäiväkentät tyhjiä, subsc_end 2027-04-01). Uusi Active-rivi 150461, fee 79,7689, loppu 2027-04-01 | A |
| c | Ei Active-riviä, jonka `lease_fee_vat0` = 0 | **OK: 0** (status 1/2, kaikki tilaustyypit) | B |
| d | Warning-rivejä ≤ 1 (41345) | **0 tuotannossa.** 41345 ratkesi siirto-CR:llä 6888: 118376 Paree Group Ended + 118377 Serres Active/New (luotu 30.09. 19:08) | B |
| e | 8893:lla yksi elävä rivi | **OK:** 118079 Ended (CR 6867, loppu 2026-08-31), 117683 Deleted. ri_update koski 118079:ään klo 03:29 (stage1c-huomio) | B |
| f | = T27 | **OK 162/162** | B |

T21 (41345) voi merkitä ratkaistuksi tämän luonnin osalta. Ratkaisun teki siirto-CR 6888, ei rekisterikorjaus.

### B3. OOMI-rivit ja vuokra-arvot (N)

- Active-rivejä (1/2), joiden fee = 0: **0.** OOMI-tilaustyypillä (3) on 7 750 Active-riviä. Arvo 79,6813 on 1 366 rivillä, ja loput
  ovat item 30 -rivien omia hintoja (80,65 on 2 691 rivillä jne.). 79,6813 ei siis ole OOMI-rivien yleissääntö, vaan E2/R2-käsirivien arvo.
- R2:n 5 riviä (116352–116356): kaikki Active ja fee 79,6813. E2:n 3 riviä (117974–117976): yksi rivi per pyörä, Active, fee 79,6813.
- Ended-rivejä, joiden fee = 0: 2. Ne ovat 108494 (B008485, ks. A5) ja 89009 (B038350, siirtoparin Ended, CR 5272). Molemmat ovat vanhoja.
  Ended-rivi ei tuota vähennystä, joten tämä on matala riski.

### B4. Muut

- **7 C3-riviä** (116175, 116176, 116193, 117365, 117366, 117367, 117368) ovat nyt Ended. ri_creation muunsi ne klo 01:06–01:51
  (`converted=8`) (N).
- **ProMet Oy (T1d):** 104318 (B023198), 104319 (B024587) ja 104320 (B024908) ovat olemassa, kaikki status 1 Active, fee 80,6454,
  `lease_end` 2025-11-30. Rekisterissä on status 1, kausi on ohi, eikä CR:ää ole (A4: Active jatkuu). ri_update ei ole koskenut niihin
  (lm 04.09.). **Ne menevät CSV:hen**, ellei taloustiimin konkurssipäätös toisin määrää. Ne eivät ole Warning-tilassa, joten ne eivät
  pidätä työnantajaa.
- **ri_updaten välitila** (scriptnote klo 17:34 runtime): getInputData `rows=34636 | onReportingDate=34416 | laterDated=220 |
  stage1b=33704 | stage1c=1359 | stage1d=459 | stage3a=34416`. Merkinnät tähän asti: stage1b *fields changed* 103, stage1c *flagged* 285
  (huomiotekstit *Ended retrospectively* / *Active/New started retrospectively*), stage1d *cancelled CR* 2 (molemmat B017530) ja
  employerFieldCheck 1 (B017530, stage 3a SKIP). Tuotannon riveille ei ole tullut yhtään Warningia. Summary ja ERROR-rivit puuttuvat.

## 5. Pidätetyt työnantajat (T2/D8)

Tilanne klo 03:35 (N): **0 tuotannon työnantajaa.** Ainoa Warning-työnantaja on Testi Yritys Oy (B017530, rivit 117470 ja 117571).
Luku on väliaikainen, kunnes ri_update on valmis.

## 6. Korjausehdotukset riville (ihminen tekee, ei CSV:tä ennen ri_updaten valmistumista)

Kenttämuutokset (yksi import, avaimena Internal ID):

| RI id | Pyörä | Kenttä | Nykyinen | Ehdotettu | Sääntö | Riittääkö yksin? |
|---|---|---|---|---|---|---|
| 116355 | B046745 | `custrecord_gbb_ri_end_user` | tyhjä | 128579 | D2 (`end_user` ← `custrecord_sta_enduser`); syyskuun rivi 116824 = 128579 | kyllä (rekisteri oikein) |
| 116150 | B033119 | `custrecord_gbb_ri_tax_exemption` | T | F | D2 + `docs/verovapaus-saannot.md` (työnantajan vaihto, ei konsernisiirto) | kyllä (rekisteri F) |
| 116150 | B033119 | `custrecord_gbb_ri_lease_start_date` | 2026-10-01 | — vaatii ihmisen päätöksen | D2 vs. käsin tehty erikoistapaus | — |
| 1226 | B025874 | `custrecord_gbb_ri_tax_exemption` | F | — vaatii ihmisen päätöksen (rekisteri T, Paused-rivi F) | D2 | — |
| 108494 | B008485 | `name` | `…_2026-09` | `Metsäliitto Osuuskunta, Metsä Wood_B008485_2026-10` | nimeämiskäytäntö | kyllä (kosmeettinen) |

Statusmuutoksia ei ehdoteta. ProMetin rivien 104318–104320 kohtalo on taloustiimin päätös (T1d). Jos rivit poistetaan, käytetään status 6.
Niissä ei ole huomiotekstiä, joka katoaisi (ei tarkistettu, tarkista ennen Deletediä).

## 7. Korjausehdotukset pyörärekisteriin

Ei ehdotuksia. Kaikissa yllä olevissa tapauksissa rekisteri on oikein tai vertailukohta on epäselvä (B025874).

## 8. Juurisyy muualla (havaintoja)

- `netsuite-monthly-reporting`: ri_creation ohittaa statuksettomat pyörät (`mr_monthly_reporting_ri_creation.js:924`, K). Tämän takia
  B046739–46741 eivät koskaan saa riviä. Korjaus kuuluu rekisteriin (status) tai skriptiin, ei RI:hin.
- Käsikorjausprosessi: 108494:n `automation_logs` tyhjennettiin 18.09. (UIF). Kenttää ei saa tyhjentää koskaan.

## 9. Todennettu vs. päätelty

**Todennettu NetSuitesta 1.10. 03:28–03:35 Hki:** kaikki luvut, rivi-id:t, bucketit, lokirivit, kenttäarvot, aikavyöhykkeet
(`created`/`lastmodified` Helsinki, `scriptnote`/`SYSDATE` runtime), 108494:n System Notes ja B044504:n rekisterikentät.

**Päätelty:** ettei ri_update muuta `end_user`-, `tax_exemption`- ja `lease_start`-kenttiä (stage1b virkistää D2:n mukaan vain
kustannuspaikan, työntekijätunnuksen ja lisätiedon, kun `can_be_updated` = T; koodia ei luettu tässä); että statuksettomien ohitus johtuu
rivistä `:924`; että 4 listan ulkopuolista status 2 -pyörää saivat tapansa listauksen jälkeen; ja että 37 CR-riviä korjautuvat, kun
1196 ajaa 31.10.

---

## Liite: uudelleenajettavat kyselyt (ri_updaten jälkeen)

**Q-0 ri_updaten valmistuminen** (runtime-aika):
```sql
SELECT TO_CHAR(sn.date,'YYYY-MM-DD HH24:MI:SS') d, sn.type, sn.title, SUBSTR(sn.detail,1,800) detail FROM scriptnote sn
WHERE sn.scripttype = 1453 AND sn.date >= TO_DATE('2026-09-30 17:27','YYYY-MM-DD HH24:MI')
  AND (sn.title LIKE '%summarize%' OR sn.type IN ('ERROR','EMERGENCY')) ORDER BY sn.date
```

**Q-1 Statusjakauma ja Warning-työnantajat:**
```sql
SELECT ri.custrecord_gbb_ri_reporting_status st, COUNT(*) n, COUNT(DISTINCT ri.custrecord_gbb_ri_employer) emp
FROM customrecord_gbb_monthly_reporting_item ri
WHERE ri.custrecord_gbb_ri_reporting_date = TO_DATE('2026-10-01','YYYY-MM-DD') AND ri.custrecord_gbb_ri_bike <> 17530
GROUP BY ri.custrecord_gbb_ri_reporting_status ORDER BY 1;

SELECT ri.id, ri.name, ri.custrecord_gbb_ri_bike, TO_CHAR(ri.custrecord_gbb_ri_reporting_date,'YYYY-MM-DD') rd,
       BUILTIN.DF(ri.custrecord_gbb_ri_employer) emp, SUBSTR(ri.custrecord_gbb_ri_automation_logs,1,300) logs
FROM customrecord_gbb_monthly_reporting_item ri WHERE ri.custrecord_gbb_ri_reporting_status = 5 ORDER BY 4, 1
```

**Q-T27** = findings `2026-09-30-lokakuussa-paattyvat-162-sweep.md` tarkistuskysely br_id-listalla. Odotus: 162 riviä, `rivit` = 1,
r10-status 1.

**Q-c Nollavuokrat:**
```sql
SELECT ri.id, ri.name, ri.custrecord_gbb_ri_reporting_status st, ri.custrecord_gbb_ri_lease_fee_vat0 fee
FROM customrecord_gbb_monthly_reporting_item ri
WHERE ri.custrecord_gbb_ri_reporting_date = TO_DATE('2026-10-01','YYYY-MM-DD')
  AND ri.custrecord_gbb_ri_reporting_status IN (1,2,5) AND NVL(ri.custrecord_gbb_ri_lease_fee_vat0,0) = 0
```

**Q-erityiset** (odotus: 8893 = 118079 Ended; E2 = 3 × Active; 43367 = 117078 Ended + 117171 Active/New; 41345 = 118376 Ended + 118377 Active/New;
C3-rivit Ended; ProMet päätöksen mukaan):
```sql
SELECT ri.id, ri.custrecord_gbb_ri_bike bike, ri.custrecord_gbb_ri_reporting_status st, ri.custrecord_gbb_ri_lease_fee_vat0 fee,
       TO_CHAR(ri.lastmodified,'YYYY-MM-DD HH24:MI') lm, SUBSTR(ri.custrecord_gbb_ri_automation_logs,1,200) logs
FROM customrecord_gbb_monthly_reporting_item ri
WHERE ri.custrecord_gbb_ri_reporting_date = TO_DATE('2026-10-01','YYYY-MM-DD')
  AND (ri.custrecord_gbb_ri_bike IN (8893,46737,46742,46832,43367,41345,37874,38677,46434,44504)
       OR ri.id IN (104318,104319,104320,116175,116176,116193,117365,117366,117367,117368,116355,116150,1226))
ORDER BY 2, 1
```

**Q-tuplat** = kohdan A1 kysely. Odotus: 38 siirtoparia, `n_run` = 0.

**Q-A3 Kenttävertailu** (rivit ilman CR-linkkiä):
```sql
SELECT ri.custrecord_gbb_ri_reporting_status st, COUNT(*) n,
  SUM(CASE WHEN NVL(ri.custrecord_gbb_ri_employer,-1) <> NVL(br.custrecord_sta_contract_employer,-1) THEN 1 ELSE 0 END) emp_diff,
  SUM(CASE WHEN NVL(ri.custrecord_gbb_ri_end_user,-1) <> NVL(br.custrecord_sta_enduser,-1) THEN 1 ELSE 0 END) eu_diff,
  SUM(CASE WHEN ri.custrecord_gbb_ri_lease_start_date <> br.custrecord_sta_subsc_start_date THEN 1 ELSE 0 END) start_diff,
  SUM(CASE WHEN ri.custrecord_gbb_ri_lease_end_date < br.custrecord_sta_subsc_end_date THEN 1 ELSE 0 END) end_lt,
  SUM(CASE WHEN NVL(ri.custrecord_gbb_ri_tax_exemption,'F') <> NVL(br.custrecord_gbb_verovapaa,'F') THEN 1 ELSE 0 END) tax_diff
FROM customrecord_gbb_monthly_reporting_item ri JOIN customrecord_sta_bike_register br ON br.id = ri.custrecord_gbb_ri_bike
WHERE ri.custrecord_gbb_ri_reporting_date = TO_DATE('2026-10-01','YYYY-MM-DD') AND ri.custrecord_gbb_ri_reporting_status IN (1,2,3,4,5)
  AND ri.custrecord_gbb_ri_change_request IS NULL AND br.id <> 17530
GROUP BY ri.custrecord_gbb_ri_reporting_status ORDER BY 1
```

**Q-gate:**
```sql
SELECT COUNT(*) FROM customrecord_gbb_monthly_reporting_item ri JOIN customrecord_sta_bike_register br ON br.id = ri.custrecord_gbb_ri_bike
WHERE ri.custrecord_gbb_ri_reporting_date = TO_DATE('2026-10-01','YYYY-MM-DD') AND ri.custrecord_gbb_ri_reporting_status IN (1,2)
  AND br.custrecord_sta_bike_status IN (2,3) AND br.custrecord_sta_subsc_end_date >= TO_DATE('2026-11-01','YYYY-MM-DD')
-- odotus 0
```

---

## ri_updaten jälkeen

**Ajohetki:** 1.10.2026 klo 03:42–03:43 Helsingin aikaa (`CURRENT_TIMESTAMP`). Vain luku. B017530 on rajattu pois, ellei toisin sanota.

### J1. ri_updaten loki (N)

ri_update valmistui runtime-ajassa 30.09. klo 17:38:42 (= 1.10. 03:38:42 Hki). Lokissa on kaksi summary-riviä:

- `summarize | stage counters`: `a_groups=34376 | a_groups_multi_row=39 | a_transfer_pair_protected=38 | b_unchanged=33601 |
  b_updated=103 | c_flagged=285 | c_not_flagged=1074 | d_cr_not_cancelled=457 | d_flagged=2 | emp_flagged=1 |
  emp_group_exempted_from_3a=1 | emp_suspect_warned=2`
- `summarize | finished`: `gbb_lunastus_lib=1.1.0 | mapErrors=0 | reduceErrors=0 | 1b updated=103 unchanged=33601 | 1c flagged=285 |
  1d flagged=2 | 3a groups=34376 multiRow=39 deleted=0 warned=0 transferPairsProtected=38 | employerCheck flagged=1 noEndedRow=0
  groupsExemptedFrom3a=1 rowsWarned=2`

**ERROR-, EMERGENCY- ja WARNING-tason rivejä 0.** `mapErrors` = `reduceErrors` = 0. Kaikki lokirivit ovat AUDIT-tasoa: stage1c 285,
stage1b 103, resolveDuplicates 38, stage1d 2, employerFieldCheck 2, summarize 2, getInputData 2, resolvePendingMarkers 1.

`d_flagged=2`, `emp_flagged=1` ja `rowsWarned=2` koskevat kaikki testipyörää B017530 (rivit 117469, 117470, 117571). Stage 3a ei
poistanut eikä varoittanut yhtään riviä (`deleted=0 warned=0`). Kaikki 38 siirtoparia suojattiin.

**c_flagged statuksittain** (lokin `riId` liitettynä riviin): **245 Ended** (*Ended retrospectively*) ja **40 Active/New**
(*Active/New started retrospectively*), yhteensä 285. Pääistunto käsittelee huomiotekstit erikseen, joten niitä ei arvioida tässä.

```sql
SELECT ri.custrecord_gbb_ri_reporting_status st,
  CASE WHEN sn.detail LIKE '%Ended retrospectively%' THEN 'Ended retro'
       WHEN sn.detail LIKE '%Active/New started retrospectively%' THEN 'Active/New retro' ELSE 'muu' END k, COUNT(*) n
FROM scriptnote sn JOIN customrecord_gbb_monthly_reporting_item ri
  ON ri.id = TO_NUMBER(SUBSTR(sn.detail, 6, INSTR(sn.detail,' |') - 6))
WHERE sn.scripttype = 1453 AND sn.date >= TO_DATE('2026-09-30 17:27','YYYY-MM-DD HH24:MI') AND sn.title LIKE '%stage1c | flagged%'
GROUP BY ri.custrecord_gbb_ri_reporting_status, <sama CASE> ORDER BY 1,2
```

### J2. Lokakuun statusjakauma ennen ja jälkeen (N)

| Status | Ennen (03:29) | Jälkeen (03:42) | Muutos | Rivejä joihin koskettu ≥ 03:27:20 | Työnantajia |
|---|---|---|---|---|---|
| 1 Active | 33 055 | 33 055 | 0 | 84 | 3 613 |
| 2 Active/New | 112 | 112 | 0 | 46 | 82 |
| 3 Paused | 24 | 24 | 0 | 0 | 18 |
| 4 Ended | 1 222 | 1 222 | 0 | 248 | 590 |
| 5 Warning | 0 | **0** | 0 | — | **0** |
| 6 Deleted | 57 | 57 | 0 | 0 | 39 |

**ri_update ei muuttanut yhdenkään lokakuun rivin statusta.** Se muutti kenttiä (1b: 103 riviä) ja huomiotekstejä (1c: 285 riviä).

**Warning-rivit, kaikki kaudet:** vain 2, molemmat testipyörällä B017530 (Testi Yritys Oy):
- 117470 `WARNING_CR-6831_2026-10`
- 117571 `WARNING_CR-6837_2026-10`

Molempien loki on *Missing contract official end date or start date on Välikuukaudet CR · CR-683x on peruutettu. Tarkasta manuaalisesti ·
Saman työnantajan rivejä eri vuokra-ajoilla …*. **Pidätettyjä tuotannon työnantajia: 0.**

### J3. Väliaikaisten tarkistusten uusinta (N)

| Tarkistus | Tulos | OK? |
|---|---|---|
| Q-0 summary + virheet | summary olemassa, 0 virhettä | ✔ |
| Q-1 Warning | 0 tuotannossa (2 testiriviä) | ✔ |
| Q-T27 | 162/162: yksi elävä rivi, status 1 Active, rekisteri status 2 | ✔ |
| Q-c nollavuokrat status 1/2/5 | 0 | ✔ |
| 8893 | 118079 Ended on ainoa elävä rivi (117683 Deleted) | ✔ |
| C3-rivit 116175, 116176, 116193, 117365–117368 | kaikki Ended, ri_update ei koskenut niihin | ✔ |
| Q-tuplat | 38 ryhmää, kaikki 38 siirtopareja (1 Ended + 1 Active, 2 työnantajaa) | ✔ |
| Q-gate | 0 | ✔ |
| E2 117974–117976, B046434 152076, B044504 150461, B037874/B038677 | ennallaan, Active | ✔ |
| 41345 / 43367 | siirtoparit ennallaan (117171 sai stage1c-huomion klo 03:31) | ✔ |
| ProMet 104318–104320 | yhä status 1 Active, ri_update ei koskenut niihin (lm 04.09.) | **avoin (T1d)** |

### J4. Käsin korjatut rivit (N, System Notes)

| RI | Muutos | Aika (Hki) | Konteksti, käyttäjä |
|---|---|---|---|
| 116355 (B046745) | `END_USER` tyhjä → Konsta Väre APS8ZSQE (128579) | 1.10. 03:38:57 | UIF, Ricardo Oksa |
| 116150 (B033119) | `TAX_EXEMPTION` T → F | 1.10. 03:39:32 | UIF, Ricardo Oksa |
| 1226 (B025874) | `TAX_EXEMPTION` F → T (= rekisteri); `NEEDS_REVIEW` → F | 1.10. 03:40:38 | UIF, Ricardo Oksa |
| 108494 (B008485) | ei muutosta: nimi yhä `…_2026-09`, fee 0, Ended | — | — |

Kohdan 6 kaksi estävää kenttävirhettä on siis korjattu. 1226:n verovapaudesta tehtiin päätös: T rekisterin mukaan.
**Avoimena on yhä 116150:n `lease_start_date` 2026-10-01** (rekisterissä 2024-03-01), mikä on ihmisen päätös. Rivi on Active/New, ja
alkupäivä vastaa tilaa, joten tämä ei ole estävä. Myös 108494:n nimi on avoin, mutta se on kosmeettinen eikä estä CSV:tä.

### J5. Voiko CSV:n (1451) ajaa?

**Teknisesti voi.** ri_update on valmis ilman virheitä. Tuotannossa ei ole Warning-rivejä, joten yhtään työnantajaa ei pidätetä.
T27 ja Q3 a–f menevät läpi, eikä Active-rivejä ole nollavuokralla. Kohdan 6 kenttävirheet on korjattu.

**Ennen ajoa päätettävä:**
1. **ProMet Oy 104318–104320 (T1d):** rivit menevät CSV:hen Active-tilassa (fee 80,6454), vaikka kausi päättyi 30.11.2025 ja yhtiö
   on konkurssissa. Jos taloustiimi toteaa sopimukset päättyneiksi, rivit asetetaan statukseen 6 ennen CSV:tä. Huomiotekstit pitää
   tarkistaa ennen sitä.
2. **B017530:n testirivit (117469, 117470, 117571):** Testi Yritys Oy pidätetään joka tapauksessa. Suunnitelman § 4 kohta 7 jättää
   päätöksen auki, mutta asia ei vaikuta tuotantoon.
3. 1c-huomiotekstien korjaus-CSV (pääistunto), jos se halutaan ennen palkka-CSV:tä.

**Todennettu vs. päätelty:** kaikki J1–J4:n luvut ja arvot ovat kyselyistä (N). Kirjoittajan tunnistus perustuu System Notesin
`BUILTIN.DF(name)`-arvoon, ja kontekstin UIF voi olla myös integraatiokäyttäjä (`queries/suiteql-tuki.md`). Se on siis vahva päätelmä,
ei varma. ri_update muutti kenttiä, mutta ei statuksia; tämä perustuu lokin laskureihin ja jakauman vertailuun (N).
