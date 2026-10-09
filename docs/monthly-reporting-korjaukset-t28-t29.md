# Työohje: kuukausiraportoinnin korjaukset T28, T29 ja T11 (ennen 1.11.2026)

**Repo:** `../netsuite-monthly-reporting`, haara `dev` (HEAD `981000c`, 9.10.2026). Auktoriteetti: `PROJEKTIN_TILA.md`.
**Tausta:** [löydös](../findings/2026-10-01-turhat-ri-huomiot-kehitys.md), TASKS.md T28, T29. Tuoteomistaja 9.10. (T23): **Ended-rivi voittaa aina.**
Ended-riville ei kirjoiteta jälkiveloitustekstiä eikä sen tilaa muuteta. Tämä ohje on lähtötieto; rivinumerot tarkistetaan koodista.
Koodia ei ole testiajurissa: todennus tehdään NetSuitessa (osio 3). Älä muokkaa muita sisarrepoja.

## 1. Vika T28 — vaihe 1c liputtaa kesken kuuta päättyneen Ended-rivin

**Nyt:** `mr_monthly_reporting_ri_update.js:953-957`, `applyStage1cToRow()`:
```js
} else if (item.status === STATUS_ENDED) {
  if (item.endDate && addDays(new Date(item.endDate), 1).getTime() < targetMs) {
    shouldFlag = true; flagType = 'Ended retrospectively';
```
Ehto olettaa, että vuokra päättyy kuun viimeisenä päivänä. Päättymispäivä 27.9. + 1 pv < 1.10., joten rivi liputetaan
ja saa tekstin *"Tarkastakaa työntekijän palkoista tehdyt vähennykset."* (`STATUS_CHANGE_WARNING_TEXT`, rivi 133).

**Oikein:** Ended raportoidaan päättymiskuuta seuraavassa kuussa (ADR 0002:n ankkuri, A1/A3). Liputus kuuluu vain riville, jonka
raportointikuukausi on **myöhempi kuin päättymiskuukausi + 1**. Päättymispäivän viikonpäivällä tai kuun päivällä ei ole väliä.
**Esimerkki:** B045359 / RI 151164, vuokra päättyi 27.9., raportointipäivä 1.10. Ei huomiota. (1.10. liputettiin väärin 202 riviä.)
Liputus säilyy: RI 147156 / B040788, päättyi 5.7., raportointipäivä 1.10. Huomio säilyy.

**Muutos (yksi funktio):** `applyStage1cToRow`, vain Ended-haara. Vertaa kuukausia, ei päiviä:
1. Muodosta `end = getHelsinkiDateParts(new Date(item.endDate))` ja `rep = getHelsinkiDateParts(new Date(targetMs))`
   (tiedoston oma apufunktio, rivi ~220; `month` on 1-pohjainen). Älä käytä `getFullYear/getMonth/getDate`: ne lukevat ajoympäristön
   aikavyöhykettä (~10 h Helsingistä, CLAUDE.md § Timezone). `gbb_lunastus_lib` ei vie kuukausivertailua, joten kirjastoa ei muuteta.
2. Laske `endIdx = end.year*12 + end.month` ja `repIdx = rep.year*12 + rep.month`.
3. `shouldFlag = true` vain jos `endIdx + 1 < repIdx`. Muuten ei lippua. `item.endDate` tyhjä: ei lippua kuten ennenkin.
4. Älä koske Active/New- (konsernisiirto, tuoteomistaja 1.10.: jää ennalleen) eikä Paused-haaraan.
5. Päivitä kommentti `addDays`-ehdon kohdalta ja rivin ~936 selitys ("lease end date + 1 day"), sekä `RIVISAANNOT.md` B3 (Muutoshistoria + selitys).
`addDays` jää käyttöön vain, jos jokin muu kutsu tarvitsee sitä (`grep` ennen poistoa).

## 2. Vika T29 — jälkiveloituksen (C3) ja huoltojatkon (C4) teksti jää Ended-riville

**Todellinen mekanismi (eroaa TASKS.md:n kuvauksesta):** `mergeIntoExistingRi`
(`ue_reporting_item_late_redemption_prolongation.js:281`) **ei muuta statusta eikä koske Ended-riviin**: kutsupaikka `:372` rajaa
`updatable`-rivit statuksiin Active, Active/New ja Warning, ja pelkät Ended/Paused-rivit tuottavat Warningin (`:390-400`). C4:n
`updateExistingRi` (`ue_reporting_item_maintenance_prolongation.js:259`, rajaus `:381`) toimii samoin. UE-skripteihin ei siis tarvita korjausta.
Teksti päätyy Ended-riville **myöhemmin**, kun jo tekstin saanut rivi muuttuu Endediksi:
- `mr_monthly_reporting_ri_creation.js:655` `convertActiveRowToEnded` (sääntö A5, kutsut `:812` ja `:873`). Rivi 713 asettaa statuksen 4 ja
  säilyttää ilmoitustekstin **tarkoituksella** (A5: "ilmoitusteksti säilyy sellaisenaan"). Tämä tuotti 1.10. 32 riviä.
- `mr_monthly_reporting_ri_update.js:1276` priority 0 kantaa Warning-rivin tekstin Ended-riville `carryNotificationTo`:lla (`:541`), eli
  myös C3/C4-lauseen, jos Warning-rivi oli sen saanut.

**Oikein:** Ended-rivi ei kanna C3-lausetta (*"Pyörän lunastus on myöhässä. …"*) eikä C4-lausetta (*"Vuokrakauden päättymispäivä on muuttunut: pp.kk.vvvv → pp.kk.vvvv."*).
Muut tekstit (UiPath, `Tarkastakaa …`, Oomi, keskenkauden) säilyvät. Active-jälkiveloitusrivi säilyttää C3:n.
**Esimerkit:** RI 104312 (B021374, Ended jälkiveloituksen jälkeen) ei saa C3/C4-tekstiä. RI 116163 (B001767, Active, jälkiveloitus jatkuu) säilyttää C3:n.

**Muutos (kaksi paikkaa, yksi yhteinen tekstinpoisto):**
1. Uusi apufunktio kumpaankin tiedostoon (ei jaettua moduulia, kuten UE-skripteissä): `stripProlongationTexts(text)`. Poistaa tekstistä C3-lauseen
   (täsmämerkkijono, sama kuin `OWN_SCRIPT_NOTIFICATION_TEXTS` `ri_update.js:176`; vertailu `normaliseNotification`-tavalla, väli- ja loppupisteet huomioiden)
   ja kaikki C4-lauseet säännöllä `Vuokrakauden päättymispäivä on muuttunut: \d{1,2}\.\d{1,2}\.\d{4} → \d{1,2}\.\d{1,2}\.\d{4}\.?`.
   Siivoaa kaksoisvälit ja reunat. Muuta ei poisteta. **Älä muuta lauseiden sanamuotoa** (sopimus C3/C4 ↔ `ri_update`).
2. `convertActiveRowToEnded` (`ri_creation`): ennen `ri.save()` aseta `F.notification` = `stripProlongationTexts(nykyinen)`, vaikka `can_be_updated` = F
   (statuksen muutos on tehty samoin ehdoin; päätös 22.9. kohta 1). Jos teksti muuttui, lisää `automation_logs`-merkintään lause
   *"Jälkiveloitus- ja huoltojatkoteksti poistettu, koska rivi on päättynyt."* (loki on pakollinen A5:n mukaan). Älä lisää tekstiä Ended-riville.
3. `ri_update` `resolveDuplicates` priority 0 (`:1276`): kun kohde on Ended-rivi, välitä `carryNotificationTo`:lle
   `stripProlongationTexts(r.notificationText)`. Jos tulos on tyhjä, älä kanna mitään, mutta vanha rivi saa silti poistua (ei tietoa menetetä:
   poistettava teksti on juuri se, jonka Ended-rivi ei saa kantaa).
4. Päivitä `RIVISAANNOT.md` A5 (lause "ilmoitusteksti säilyy sellaisenaan" → "paitsi C3 ja C4") ja C3, sekä `PROJEKTIN_TILA.md`.

## 3. Testaus (NetSuite; testiajuria ei ole)

**A. Kylvetty ennakkotesti 29.–30.10.** Testipyörä B017530 (rekisteri-id tarkistettava; poissuljetaan mittareista). Kuten A5:n 22.9. testi: kaksi Active-riviä
raportointipäivälle 01.11.2026, joilla C3-lause + C4-lause + `Tarkastakaa …`, toisella `can_be_updated` T, toisella F. Aja ri_creation
(`custscript_gbb_ri_test_bike_id`) ja ri_update (`custscript_gbb_update_test_bike_id`) vain testipyörälle. Odotus: rivit Ended, C3/C4 poissa,
`Tarkastakaa …` säilyy, automation_logs kertoo muunnoksesta, `created=0 converted=N`. Testirivit asetetaan lopuksi Deleted-tilaan käsin.
T28:n testi: kylvä Ended-rivi, `lease_end_date` 10.10.2026 (ei lippua) ja toinen 5.7.2026 (lippu).

**B. Todennus 1.11. ajon jälkeen** (kaikkien tulos **0 riviä**; rivit oletuksena aktiiviset, lisää tarvittaessa `AND isinactive = 'F'`):
```sql
-- T28: lokakuussa päättynyt Ended-rivi ei saa palkkatarkistushuomiota
SELECT id, name FROM customrecord_gbb_monthly_reporting_item
WHERE custrecord_gbb_ri_reporting_date = TO_DATE('2026-11-01','YYYY-MM-DD')
  AND custrecord_gbb_ri_reporting_status = 4
  AND custrecord_gbb_ri_lease_end_date >= TO_DATE('2026-10-01','YYYY-MM-DD')
  AND custrecord_gbb_ri_lease_end_date <  TO_DATE('2026-11-01','YYYY-MM-DD')
  AND custrecord_gbb_ri_gbb_notification LIKE '%Tarkastakaa työntekijän palkoista%'
-- T29: Ended-rivillä ei C3- eikä C4-tekstiä
SELECT id, name FROM customrecord_gbb_monthly_reporting_item
WHERE custrecord_gbb_ri_reporting_date = TO_DATE('2026-11-01','YYYY-MM-DD')
  AND custrecord_gbb_ri_reporting_status = 4
  AND (custrecord_gbb_ri_gbb_notification LIKE '%Pyörän lunastus on myöhässä%'
    OR custrecord_gbb_ri_gbb_notification LIKE '%Vuokrakauden päättymispäivä on muuttunut%')
-- Ended voittaa: samalla pyörällä ei sekä Ended- että Active-riviä
SELECT custrecord_gbb_ri_bike, COUNT(*) FROM customrecord_gbb_monthly_reporting_item
WHERE custrecord_gbb_ri_reporting_date = TO_DATE('2026-11-01','YYYY-MM-DD') AND custrecord_gbb_ri_reporting_status IN (1,4)
GROUP BY custrecord_gbb_ri_bike HAVING COUNT(DISTINCT custrecord_gbb_ri_reporting_status) = 2
```
Kontrollit (odotus **> 0**, muuten testi ei todista mitään): sama C3-kysely statuksella 1 (Active-jälkiveloitukset säilyttävät tekstin) ja T28-kysely
statuksella 4 niille, joiden `lease_end_date` < 1.10.2026 (aiheelliset huomiot säilyvät). Vertaa ri_updaten laskureihin `c_flagged / c_not_flagged`
(`scriptnote`, `scripttype = 1453`): `c_flagged` putoaa selvästi, ja ri_creationin yhteenvetorivillä `mapErrors=0`.
Jos jokin kysely palauttaa rivejä, tee 1.11. sama CSV-import kuin 1.10. (`imports/2026-10-01-turhat-palkkahuomiot/`, `…-myohassa-teksti-ended/`) ennen palkka-CSV:tä (1451).

## 4. Käyttöönotto

1. Muutokset `dev`-haaraan, kaksi tiedostoa: `mr_monthly_reporting_ri_update.js` (T28 + T29 kohta 3) ja `mr_monthly_reporting_ri_creation.js` (T29 kohta 2).
   UE-skriptit ja `gbb_lunastus_lib` pysyvät ennallaan.
2. Lataus käsin File Cabinetiin samaan kansioon, ylikirjoita samanniminen tiedosto. Ei SDF-julkaisua. Tarkista skriptitietueiden `scriptid` ja deployment-parametrit ennen ja jälkeen.
3. Aikataulu: koodi valmis 26.10., lataus **ma 27.10.**, kylvetty testi 27.–29.10., puhdistus 30.10. Takaraja ennen 1.11. ri_creation- ja ri_update-ajoja. Älä lataa 1.11. yönä.
4. Päivitä `PROJEKTIN_TILA.md`, `RIVISAANNOT.md` ja tämän repon TASKS.md (T28, T29, T51) samana päivänä.

## 5. Riskit

- **Vaihe 1c on yhteinen.** Muutos koskee vain Ended-haaraa, mutta liputuksen vähetessä `item.notificationText` jää tyhjäksi useammalla Ended-rivillä
  (`:976`). `resolveDuplicates` priority 2 (`:1355`) poistaa ryhmän ainoan ilmoituksettoman rivin. Ended + Active (status 1) samalla pyörällä ja päivällä **ei** ole
  priority 0:n piirissä (vain Warning korvataan), joten ilmoitukseton Ended-rivi voisi hävitä. A5 estää tilanteen yhdellä Active-rivillä, mutta ei kahden (`ambiguous`-haara).
  Kolmas kysely yllä on tämän vahti. Älä laajenna priority 0:aa tässä työssä (PROJEKTIN_TILA § 4.21 auki).
- **A5 muuttuu.** 22.9. päätös "teksti säilyy" korvautuu tuoteomistajan 9.10. linjauksella poikkeuksena C3/C4. Kaikki muut tekstit säilyvät.
- **Tekstintunnistus on merkkijonosopimus.** Jos C3/C4-lauseen sanamuoto muuttuu myöhemmin, poisto lakkaa hiljaa. Lisää kommentti kolmeen paikkaan (UE C3, UE C4, `stripProlongationTexts`).
- **Aikavyöhyke.** Käytä Helsinki-osia, älä paikallisia getter-metodeja. Reunatapaukset testiin: päättyminen 31.10. ja 1.10.; raportointipäivä 1.11.
- **Jo Endedeksi muuttuneet rivit** (lokakuu) on korjattu käsin. Koodimuutos ei puhdista vanhoja rivejä.

## Avoimet kysymykset tuoteomistajalle

1. Vahvistus: A5:n 22.9. päätös ("ilmoitusteksti säilyy") ohitetaan C3/C4-lauseiden osalta. Poistetaanko **vain nämä kaksi lausetta** (ohjeen oletus) vai koko teksti?
2. TASKS.md T29 sanoo, että `mergeIntoExistingRi` muuttaa statusta tarkistamatta. Koodin mukaan ei muuta (rajaus `:372`). Hyväksytäänkö korjaus muunnoksessa ja carryssa, UE ennallaan?
3. Koskeeko sama Paused-rivejä? (Oletus: ei, ei pyydetty.)
4. Ended + Active (1) -ryhmä: halutaanko priority 0 laajennettavaksi "Ended voittaa" -linjauksen mukaan (§ 4.21), erillisenä tehtävänä?

## T11: COALESCE pois kirjastosta

**Tausta:** TASKS.md T11, vaatimus K1 (`keskenkauden-lunastus-vaatimukset.md`), ADR 0010 k. 8, ADR 0015. Päättymisajankohta luetaan jatkossa vain
`custrecord_sta_subsc_end_date`:sta. **Ehto:** T8:n CSV (16 pyörän päättymispäivät, `imports/2026-09-25-poikkeuspaivat-subsc/`) ajetaan ja sen jälkitarkistus
palauttaa 0 **ennen** uuden kirjaston latausta. Muuten 16 päättynyttä pyörää saa takaisin myöhemmän päättymispäivän ja RI-luonti voi tehdä niille Active-rivejä.

**Havainto (eroaa toimeksiannon sanamuodosta):** `COALESCE` ei ole monthly-reportingissa vaan jaetussa kirjastossa `gbb_lunastus_lib`, joka asuu repossa
`../netsuite-subscrption-cr-scripts` (`src/FileCabinet/SuiteScripts/gbb-lib/gbb_lunastus_lib.js`, versio 1.1.0, testit `tests/gbb_lunastus_lib.test.js`).
Monthly-reporting vain **hakee ja välittää** poikkeuskentät kirjastolle. K1 on siis muutos cr-scripts-repossa (kirjasto: `KENTAT.PAATTYMISAJANKOHTA` `:124-130`,
kommentti `:255-258`, testit `:30-45`). Tämä osio kattaa monthly-reportingin osuuden.

**Monthly-reporting (`dev`, 981000c), kaikki viittaukset:**
- `mr_monthly_reporting_ri_creation.js`: `:92-93` kenttävakiot, `:929-936` hakusarakkeet (kommentti COALESCE), `:1021-1022` map-datan välitys,
  `:1094-1095` `bikeFields`, `:1113` selittävä kommentti. `:1223-1231` (OOMI-haara) lukee jo vain `subsc_end_date`:a, ei muutosta.
- `mr_monthly_reporting_ri_update.js`: `:108-109` kenttävakiot, `:336-337` `bike`-olion kentät.
- `docs/rules/WARNING_RESOLUTION_PLAYBOOK.md:270-272` (SQL `bike_ended`) ja `PROJEKTIN_TILA.md:1717-1719` (SQL): `COALESCE(...)` -> `b.custrecord_sta_subsc_end_date`.
- `docs/rules/RIVISAANNOT.md:1108` on muutoshistoriaa, ei muuteta. A1/D3-säännöt: tarkista, että tekstit eivät väitä COALESCEa nykyiseksi.

**Muutos:** kirjasto ensin (cr-scripts, version nosto 1.2.0, testit päivitetään). Monthly-reportingissa poistetaan poikkeuskenttien haku ja välitys (ei
tarvita, kirjasto ei enää lue niitä; ylimääräinen kenttä ei kuitenkaan riko, joten järjestys ei ole kriittinen). SQL-kyselyt päivitetään samalla.
Lataus samaan aikaan kuin T28/T29 (27.10.), kirjasto yhdessä kaikkien lukijoiden kanssa (1440, 1452, 1453, statusportti, IC; K2).

**Tämän repon kyselyt, päivitettävä samalla:** `queries/` ei sisällä poikkeuskenttiä (grep tyhjä). `docs/lunastuksen-kenttasaannot.md`: `:31` (taulukko, "override"),
`:449-450`, `:521-522`, `:547-548`, `:630` (SQL `COALESCE`), `:560` (OOMI-lause, ennen lokakuuta luetaan vielä päättymisajankohdaksi), sekä `CLAUDE.md` gate-kysely.
Lisäksi `.claude/agents/lunastusauditoija.md` ja `imports/2026-09-25-poikkeuspaivat-subsc/README.md` (historiallinen, tarkista vain). cf-gbb-tools seuraa C3:lla.

**Todennus lataus jälkeen (odotus 0):** RI-luonnin `mapErrors=0` ja lokin `gbb_lunastus_lib=1.2.0`; Ended-rivit, joiden `lease_end_date` ≠ `subsc_end_date`:
```sql
SELECT ri.id FROM customrecord_gbb_monthly_reporting_item ri JOIN customrecord_sta_bike_register b ON b.id = ri.custrecord_gbb_ri_bike
WHERE ri.custrecord_gbb_ri_reporting_status = 4 AND ri.custrecord_gbb_ri_lease_end_date <> b.custrecord_sta_subsc_end_date
```
**Riski:** OOMI-pyörät, joilla `oomi_exceptional_end_date` on Fleet-CSV:stä (79 arvoa), lakkaavat päättymästä sen mukaan. Tarkoituksellista (ADR 0010 k. 8).
