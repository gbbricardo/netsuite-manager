# TASKS

Päivätyt työtehtävät. Tämä on **tehtävälista**: mitä tehdään ja milloin. Tilannekuva ja mittarit
ovat [`docs/lunastus-tilanne.md`](docs/lunastus-tilanne.md):ssä ja säännöt
[`docs/lunastuksen-kenttasaannot.md`](docs/lunastuksen-kenttasaannot.md):ssä.

Kun tehtävä on tehty, merkitse se `[x]`, kirjaa päivä ja tulos, ja päivitä tilannedokumentti.
Poista tehtävä vasta kun se on ollut tehtynä viikon.

---

## Tilannekatsaus 9.10.2026 — kiireelliset ensin

Tarkistettu 9.10. seitsemällä agentilla ja deployment-exportilla (generatedAt 2026-10-09T10:24Z, tili 9771141).
Exportissa ovat status ja deployed-tieto. **Parametrit ja toistuvuus puuttuvat**, joten ne on katsottava käyttöliittymästä.

| Skripti | Export 9.10. | Loki (`scriptnote`) | Toimenpide |
|---|---|---|---|
| 1480 status-sync 2.0 | `SCHEDULED`, deployed | ajastettu ajo 9.10. 00:31 = `tila=dry_run` | **Dry run pois 9.10. (käyttäjä).** Ensimmäinen live-ajo 10.10. 00:30, tarkistus T55 |
| 1479 maksulinkki (`customdeploy_send_redemption_link`) | `SCHEDULED`, deployed | viimeinen 7.10. 02:44 | **Korjattu 9.10. (käyttäjä):** päivittäin klo 8:00, `months_before` = 1, dry run pois. Tarkistus 10.10. (T30) |
| 1437 extension (`customdeploy_gbb_sub_extension`) | **`NOTSCHEDULED`** | viimeinen 1.10. 01:02 Helsingin aikaa | **Tarkoituksella pois (käyttäjä 9.10.)**, koska ajot menivät väärin. 1.11. ratkaistava (T61) |
| 1199 CR-käsittelijä | **molemmat** deploymentit `SCHEDULED` (`customdeploy1` + `_hdl_2` MONTHLY) | ajaa, viimeinen 9.10. | Tarkista, etteivät toistuvuudet osu päällekkäin (T62) |
| 966 Staria mid-life redemption | molemmat `NOTSCHEDULED` | viimeinen 9.10. 13:01 Helsingin aikaa | Tehty (T9). Tarkista 10.10., ettei uusia rivejä tullut |
| 1440 vanha status-sync | `NOTSCHEDULED` | — | Kunnossa (T6) |
| 1458, 1196, 1424/1426/1427, 1432, 1433 | `SCHEDULED` | 1458, 1196 ajavat | Ei toimenpiteitä |
| 1451/1452/1453 kuukausiraportointi | `TESTING` | — | Ajetaan käsin, kuten ennenkin |

### Toimintalistat (koottu 9.10.2026)

**A. Tarkistukset la 10.10. (Claude, agenteilla)**
1. T55: 1480:n ensimmäinen live-ajo (kohdat 1–5), K2-rajaus ja tila 6 2.0:n koodissa (T54).
2. T30/T52: 1479:n klo 8 ajo ilman `RUN ABORTED`ia (ja su 11.10.).
3. T9: ei uusia `scriptnote`-rivejä skriptille 966.
4. Joukkokorjautumiset 2.0:n jälkeen: T1b (73 OOMI-pyörää → 0), T53 (13 pyörää tapa 2), T38 (`liab_settled_at` 336 → ?), T15 (`paid_at` 575 → ?), T41 (IC-kysely → 0), T35 (B012880).

**B. Käyttäjän ajettavat importit ja UI-toimet (README:t kansioissa)**
1. `imports/2026-10-09-p2-cr-luontipaivat/` → sitten T7 `imports/2026-09-25-decided-at-historia/01-decided-at-2026-10-09.csv`
2. T8 `imports/2026-09-25-poikkeuspaivat-subsc/01-subsc-end-date-2026-10-09.csv` (ennen T11:n latausta)
3. `imports/2026-10-09-pyorapaatokset/` (01 tavat, 02 CR 4692 Cancelled, 03 B023403)
4. Inaktivoi B046830, B046739, B046740, B004339 ja B046741 (linkit tarkistettu). Varmista B046741, ettei se ole odottava OOMI-pyörä.
5. T20: B036939:n `curr_subs_rent` → 59,76.
6. T48: haun 793 ehdot UI:sta **ennen T59:n latausta**.

**C. Kehitysistunnot omistavissa repoissa ennen 1.11. (työohjeet valmiina)**
| Repo | Tehtävät | Työohje |
|---|---|---|
| `netsuite-subscription-extension` | T61 extension 2.0 (ajo 10.11.) | `docs/extension-2-vaatimukset.md` |
| `netsuite-monthly-reporting` | T28, T29 | `docs/monthly-reporting-korjaukset-t28-t29.md` |
| `netsuite-subscrption-cr-scripts` | T13 H1–H6, T11 COALESCE pois | `docs/cr-scripts-h1-h6-tyoohje.md`, `…-t28-t29.md` § T11 |
| `netstuite-send-end-redemption-payment-link` | ~~T43 K2-rajaus~~ **valmis 13.10.** | TASKS T43 |
| `netsuite-bike-redemption-status-sync` | T54 jäännökset: K2-rajaus, `cr_2_10` tila 6 | TASKS T54 |
| `netsuite-br-lease-fees-check` | T59 ADR 0016 | `docs/lease-fees-check-adr0016-tyoohje.md` |
| `cf-gbb-tools` | T51 raportointinäkymä (ei takarajaa) | `docs/poikkeamaraportointi-vaatimukset.md` |

**D. Muut tahot:** T64.

### [ ] T61 — Extension 2.0: kirjoita jälkiveloitusskripti (1437) uudelleen, **tuotannossa viimeistään 31.10.**

**Käyttäjän päätökset 9.10.2026:**
- `customdeploy_gbb_sub_extension` on otettu pois ajastuksesta tarkoituksella.
- **Vaihtoehto A:** skripti kirjoitetaan uudelleen. Käsin tehtävää varasuunnitelmaa (CSV) **ei** tehdä.
- **Viat:**
  1. Väärä ajankohta: ajo kuun 1. päivänä klo 01:00 ehtii ennen kuin maksut on kirjattu.
  2. Valinta vaatii, että tallennettu haku (`subsc_end_date` = eilen) ja ajastus kohtaavat. Siksi skriptiä ei voi ajastaa
     esimerkiksi kuun 7. arkipäivälle.
- **Korjausperiaate:**
  - Valinta on ajopäivästä riippumaton: päättymispäivä edellisessä kuussa, eikä vielä tyypin 7 CR:ää sille kuulle.
  - Ajo on idempotentti, joten myöhästynyt ajo kirii kiinni.
  - Säännöt ovat samat kuin maksulinkissä: tapa asetettu tai hinta 0 = ei pidennystä, kattavuus M1.

Mittakaava: lokakuussa päättyy 481 ei-OOMI-pyörää, joilla ei ole tapaa (465 sai linkin). Elo–lokakuussa jälkiveloitus-CR:iä syntyi 137, 127 ja 91.
Vaatimukset: [`docs/extension-2-vaatimukset.md`](docs/extension-2-vaatimukset.md). Toteutus tehdään omistavassa repossa erillisessä istunnossa.

**Lisäpäätökset 9.10.** (vaatimusten § *Päätökset avoimiin kysymyksiin*):
- CR:n nimi säilyy samana.
- Myöhästynyt kuukausi kirii kiinni: yksi CR kattaa kaikki laskuttamattomat kuukaudet.
- **Ajo kuun 10. päivä klo 03:00** (vastaa 7. arkipäivää ilman viikonpäiväsääntöä).
- Error- ja Needs Review -tilainen CR estää uuden.
- Ei tiedostolokia.
- Pyörä, jolla ei ole linkkiä eikä aiempaa jälkiveloitusketjua, ohitetaan, ja ihminen ratkaisee.
- Hinta 0 ilman tapaa 4 ohitetaan. Molemmat ohitusryhmät nostetaan T51:n raportointiin.
- Kiinnikurominen ei tuota yllätyksiä: ennen lokakuuta päättyneitä Active-pyöriä ilman tapaa on vain 2 (molemmat ennen 2026, ei linkkiä eikä ketjua), joten ne ohitetaan.
- Ensimmäinen ajo on **ti 10.11.**
Tähän on yhdistetty osion *Auki, ei päivää* kohta "Jälkiveloitusketju kirjoitetaan uudelleen". T54:n oletus extension-ajosta 1.11. klo 03:00 raukeaa.

**Valmis kun** uusi skripti on ajanut marraskuussa ja jokaisella lokakuussa päättyneellä maksamattomalla ei-OOMI-pyörällä on tyypin 7 CR, eikä
yksikään pyörä, jolla on tapa tai hinta 0, ole saanut CR:ää.

### [x] T62 — CR-käsittelijällä (1199) on kaksi ajastettua deploymenttia — **tehty 9.10.2026**

> [!NOTE]
> **Tulos 9.10.2026:** ajot eivät osu päällekkäin, eikä muutoksia tarvita.
> - `customdeploy1` ajaa 6 tunnin välein, Helsingin aikaa klo 04, 10, 16 ja 22 (lokissa 18, 00, 06 ja 12).
> - `customdeploy_gbb_change_request_hdl_2` (MONTHLY) ajaa **kuun 1. päivänä klo 01:33**. Käyttäjän mukaan se on tarkoituksellinen kuunvaihteen ajo: jos jokin
>   järjestelmä luo CR:n puolenyön aikaan, ajo käsittelee sen ennen kuukausiraportointia, jotta muutos näkyy raportoinnissa.
> - Väliä lähimpään 6 tunnin ajoon (klo 04) on 2,5 h. MONTHLY-ajo 1.10. (lokissa 30.9. klo 15, 333 riviä) valmistui ennen seuraavaa ajoa.

`customdeploy1` ([GBB] Change request handler) ja `customdeploy_gbb_change_request_hdl_2` (MONTHLY) ovat molemmat
`SCHEDULED`. Inventory 2.10. sanoi `customdeploy1` = Testing. Tarkista toistuvuudet käyttöliittymästä. Jos ne osuvat samaan aikaan, sama
Pending-CR voi käsittyä kahdesti, ja tuloksena on tuplalasku tai -hyvitys.

### [x] T63 — Päivitä `schemas/script-inventory.md` ja CLAUDE.md exportin mukaan — **tehty 9.10.2026**

> [!NOTE]
> **Tulos 9.10.2026:** inventory, CLAUDE.md ja muistin id-lista on päivitetty käsin. Regenerointi pyyhki käsin kirjoitetut osiot, joten se peruttiin.
> SuiteQL varmisti 1479:n id:t (`customscript_send_redemption_link`). `tools/export-schemas.mjs scripts` ei vie skriptejä, joiden id on automaattinen
> (`customscript1199`, 1191–1200, 1458 …) eikä 1479:ää, koska nimisuodatin ei osu niihin. Rivin `customscript1463` (RI ended backfill) olemassaolo on tarkistamatta.
> `schemas/script-inventory.json` on uusi tiedosto, jonka työkalu loi (untracked).

1479:n script-id on `customscript_send_redemption_link` / `customdeploy_send_redemption_link`, ei `..._eredem_paylink` /
`..._eredem_test`. 1437 ja 966 ovat `NOTSCHEDULED`, ja 1199:llä on kaksi `SCHEDULED`-deploymenttia. 1480 puuttuu inventorysta.
Aja `node tools/export-schemas.mjs scripts` ja diffaa ennen committia.


### [ ] T64 — Kysymykset muille tahoille (koottu 9.10.2026)

Yksi lista kaikista kysymyksistä, jotka odottavat taloustiimiä tai asiakaspalvelua. Merkitse vastaus tähän ja siirrä se tehtävään.

**Taloustiimi**
- [ ] **T1d ProMet Oy (konkurssi):** B023198, B024587 ja B024908. Kenen hallussa pyörät ovat, mistä päivästä raportointi lopetetaan, ja valvotaanko saamiset? Varasuunnitelma: RI-rivit 104318–104320 Endediksi ennen 1.11.
- [ ] **T35 B031422:** SO SOGBB0000529, 1 171,01 € (Netvisor-siirto 30.9.2025, "Lunastukset (loppuvastuut)", Vaasan kaupunki / Isla Varpula). Mitä summa sisältää, ja onko se voimassa?
- [ ] **T34 B029420** (Päijät-Hämeen hyvinvointialue): mitkä laskut hyvitetään? Keskenkauden lunastusta ei koskaan maksettu, ja sopimuksen olisi pitänyt päättyä 31.08.2025. Laskuja 1.9.2025 jälkeen on 11, yhteensä noin 1 653 € brutto. Niistä 6 tavallista vuokralaskua 12/2025–5/2026 (1 072 €, maksettu) ja 5 jälkiveloituslaskua 6–10/2026 (116,21 € kpl, joista 9/2026 ja 10/2026 avoinna, yhteensä 233 €). Erittely: `findings/2026-10-09-b029420-hyvitettavat-ja-b036939.md`.
- [ ] **T58** Oomin toukokuun 2026 laskujen tuloutuskausi 2025-05 → 2026-05: 332 laskua, joista 12 avointa (lista `findings/2026-10-09-t58-oomi-toukokuu-tuloutuskausi.csv`). Onko **INVGBF1043393** (16.9.2026, 75 350,05 €) kaksoislasku laskulle INVGBF1026370 (75 350,03 €)?

- [ ] **T39** haun 797 ehdot ja **T48** haun 793 ehdot käyttöliittymästä (käyttäjä tai NetSuite-ylläpito). **Haku 793 ensin, ennen T59:n latausta.**

**Asiakaspalvelu**
- [ ] **T35 B011223:** SO SOGBB0002659 1 040 € (10.12.2025, Kattava Oy / Toni Leinonen, maksamaton). Siirto-CR 5748 tehtiin 27.8.2026. Onko keskenkauden lunastus rauennut? Samasta erästä maksamatta myös B036396 (Jani Saarinen, 750,98 €) ja Huy Nguyen (1 667 €).
- [ ] **T16 B044504:** muutospyyntö keskenkauden päättymisestä (Paylink-tilauksen mukaan).
- [ ] **T21 rekisteri-id 41345:** kumpi työnantaja on oikein, Serres Oy vai Paree Group Oy?
- [ ] **T34 B046667:** maksulinkki alennetulla summalla (vakuutuskorvauspyörä, 2 kk sopimus) ennen 10.11.
- [ ] **T10** 19 + 8 keskenkauden maksua ilman CR:ää. **T47** virheellisesti lähetetyt kauppakirjat (3). **T50** kieltolippujen syyt.

---

## 25.09.2026 (pe) — aamulla

### [x] T1 — Todenna S4:n statuskääntö — **tehty 25.09.2026**

> [!NOTE]
> **Tulos 25.09.: 34/34 status 2.** Sweep (1440) käänsi kaikki yöajossa, lokirivit
> `status -> 2 (settle method 1, …, tunnistuspäivä=2026-09-25)`, 0 virhettä. README:n
> jälkitarkistus palauttaa 0. Tapa 1 ja `liab_settled_at` 24.09. ovat ennallaan.
> `date_to_non_active` ja IC-päivä ovat vielä tyhjiä. Ensimmäisen täyttää 1458 viiveellä, ja IC-päivä
> tulee T2:ssa, joten kaikki 34 kuuluvat nyt S2-joukkoon.
>
> **Sivuhavainto samasta ajosta.** Vanha osa A kirjoitti tavan 1 (ilman `liab_settled_at`:ia) 9
> pyörälle, joiden päättymiskuu ei ole alkanut ja joilla ei ole tyypin 2/10 CR:ää. Tämä on
> ADR 0009:n kohdan 4 vastaista, sama ilmiö kuin K4:ssä:
> - **Ei-OOMI**, päättyy 2027–2028, todennäköisesti tulossa keskenkauden lunastus: B005039,
>   B015640, B035208, B036496
> - **OOMI**, päättyy 10–11/2026: B038685, B041552, B042831, B044476, B045266
>
> B021648 (päättyy 30.09., käännetty status 2) on oikein. B025076:lla on Done-CR 6618, joten
> tapa säilyi. Ks. T3.

S4 ajettiin 24.09. ([import](imports/2026-09-24-oomi-kauden-loppu/README.md)). Sweepin (1440) yöajo
kääntää 34 OOMI-pyörää statukseen 2.

```sql
SELECT custrecord_sta_bike_status, COUNT(*) FROM customrecord_sta_bike_register
WHERE id IN (40788,38578,46136,38234,42604,40191,41859,37626,43907,39891,38188,40155,38130,44755,
             40461,45363,45169,45371,44058,40679,45211,40368,45836,44907,43900,41608,45193,41761,
             39499,42580,43611,37743,46285,43395)
GROUP BY custrecord_sta_bike_status
```

**Valmis kun** kaikki 34 ovat status 2. Jos yksikin on yhä status 1, lue sweepin loki
(`scriptnote`, `scripttype = 1440`, aikaväli 24.–25.09.) ennen kuin jatkat. Tee S2 silti, koska
kääntymättömät pyörät siirtyvät S3:een.

### [x] T1c — D9: Fleet-päivä pois 15 pyörältä (käyttäjä ajaa, **ennen T1b:tä ja T8:aa**) — **tehty 9.10.2026**

> [!NOTE]
> **Tulos 9.10.2026:** Kaikilla 15 pyörällä `exceptional_end_date` ja `oomi_exceptional_end_date` ovat tyhjät (SuiteQL 9.10.). Fleet-CSV:n maanantaivaroitus on voimassa T11:een asti.

P1 päätetty 25.09. Ilman CR:ää ei ole todistetta ennenaikaisesta päättymisestä, joten pyörät
raportoidaan lokakuussa Active-tilaisina. Jos päätös on väärä, lokakuussa tehdään CR.
[`imports/2026-09-25-d9-fleet-paiva-pois/`](imports/2026-09-25-d9-fleet-paiva-pois/README.md): ensin
testirivi B045304, sitten 14 riviä, asetuksena *Overwrite Missing Fields*. `SUM(id)` 629 149.
**Valmis kun** README:n jälkitarkistus palauttaa 0.

> [!WARNING]
> **Aja jälkitarkistus jokaisen maanantain Fleet-importin jälkeen (ensimmäinen 28.09.)**, kunnes
> T11 on tuotannossa. Fleet-CSV voi kirjoittaa päivän takaisin.

### [ ] T1b — S4b: syyskuussa päättyneet OOMI-pyörät (käyttäjä ajaa, viimeistään 29.09., T1c:n jälkeen)

> [!NOTE]
> **Tilanne 9.10.2026:** Tarkistuskysely palauttaa **73 riviä** (odotus 0). Kaikki 73 ovat status 1, ja IC-päivä on tyhjä. B041564 ja B044271 ovat jo status 2, joten ne poistetaan CSV:stä. **Päätös:** ajetaanko CSV, vai annetaanko 1480:n OOMI-haaran (dry run O=167) hoitaa nämä, kun se on livenä?
> **Päätös 9.10.2026:** CSV:tä ei tehdä. Status-sync 2.0:n OOMI-haara kääntää syyskuussa päättyneet OOMI-pyörät ADR 0009:n mukaan, ja ensimmäinen live-ajo on yöllä 9.→10.10. **Tarkista 10.10.:** README:n tarkistuskysely palauttaa 0. Jos jokin pyörä jää, se on 2.0:n virhe, ja syy selvitetään.

Löytyi 25.09. T1:n jälkeen. 77 syyskuussa päättyvää OOMI-pyörää on status 1 ilman selvitystapaa.
Ilman korjausta RI-luonti tekisi niille lokakuun Active-rivin. Tuoteomistaja vahvisti 25.09., että
ne käsitellään CSV:llä ADR 0009:n kohdan 6 mukaan.
[`imports/2026-09-25-oomi-syyskuu/`](imports/2026-09-25-oomi-syyskuu/README.md), 78 riviä
(77 + B044271 T1c:n perusteella), `SUM(id)` 3 311 692. Aja README:n tarkistuskysely juuri ennen importtia, ja vaihda
`loppuvastuut_hoidettu` ajopäiväksi. **Valmis kun** seuraavana aamuna kaikki 78 ovat status 2.
Tämän jälkeen T5 (S3) antaa niille IC-päivän 30.09.2026.

### [x] T2 — S2: IC-päivät CSV:llä — **vanhentunut 9.10.2026**

> [!NOTE]
> **9.10.2026:** ADR 0011 (6.10.) siirsi IC-päivät status-sync 2.0:lle (T41). Korvaus toteutuu vasta, kun 1480 ajaa livenä (ks. T54/T55).

> [!NOTE]
> **6.10.2026: [ADR 0011](docs/adr/0011-ic-paiva-velvoitteista.md) muuttaa tämän säännön.** Joukkoehto on nyt *velvoitteet
> hoidettu, ei done*, ei *status 2/3, IC-myyty*. Tehtävä korvautuu status-sync 2.0:n ensimmäisellä ajolla (T41). Aja CSV
> enää vain, jos taloustiimi tarvitsee päiviä ennen sitä, ja silloin uudella ehdolla.

Suunnitelma: [`docs/status-sync-2-tasmaytysajo.md`](docs/status-sync-2-tasmaytysajo.md) § Syyskuu,
rivi S2. Sääntö: `ic_redemption_dt = LAST_DAY(päättymisajankohta)` ([ADR 0007](docs/adr/0007-status-sync-2-tasmaytysajo.md),
[ADR 0009](docs/adr/0009-kauden-lopun-lunastus.md): jälkiveloitetulla pyörällä kyse on siirretystä
päättymisajankohdasta).

- Joukko: status 2/3, IC-myyty (`ic_sale_dt` tai `ic_sale_price` asetettu), `ic_redemption_dt`
  tyhjä, `ic_redemption_done` ≠ T ja `ic_redemption_pr` tyhjä. **24.09.: 1 366**, ja T1:n jälkeen
  noin +33.
- Päättymisajankohta = `COALESCE(exceptional_end_date, oomi_exceptional_end_date, subsc_end_date)`.
  Jos se puuttuu, pyörä listataan eikä sitä importoida.
- **D1 on auki** (taloustiimi): kirjoitetaanko IC-päivä myös IC-myymättömille (24.09.: 176)? Jos
  vastausta ei ole, ajetaan vain IC-myydyt.
- Tee kansioon `imports/2026-09-25-s2-ic-paivat/` CSV ja README, jossa on tarkistussumma (rivit,
  `SUM(id)`), samaan tapaan kuin aiemmissa importeissa.
- Anna CSV käyttäjälle ajettavaksi. **Älä kirjoita NetSuiteen itse.**

**Valmis kun** import on ajettu ja kysely *status 2/3, IC-myyty, ei IC-päivää …* palauttaa 0.
Kerro taloustiimille, että laskuri (`customdeploy_gbb_ic_redemption_pr`, Not Scheduled) on
ajettava ja `-1`-rivit käytävä läpi ennen 30.09.

### [ ] T1d — Q4: neljä pysähtynyttä sopimusta taloustiimille (vastaus ennen 30.09.)

> [!NOTE]
> **Tilanne 9.10.2026:** B016555 on hoidettu (CR 6488 Done 15.09., tyypin 7 CR 6944 Done 1.10.). ProMet-pyörät B023198, B024587 ja B024908 ovat yhä status 1/1/3 ilman tapaa. Ne odottavat taloustiimin päätöstä.
> RI-rivit 104318–104320 ovat yhä **Active** (luotu 4.9.), joten ProMet-pyörät raportoidaan palkkavähennyksiin joka kuukausi. **Takaraja ennen marraskuun palkka-CSV:tä (1.11.).** Taloustiimille esitetyt kysymykset (9.10.):
> 1. Kenen hallussa pyörät ovat? Palautettu → status 3 ja RI Ended. Työntekijä lunastaa → lunastuspyyntö henkilökohtaisesti, maksun jälkeen status 2. Konkurssipesän hallussa → vaaditaan takaisin, ja tila pysyy siihen asti.
> 2. Mistä päivästä raportointi lopetetaan (konkurssin alku vai sopimuksen loppu 30.11.2025)? Tarvitaanko korjauksia liikaa raportoiduista kuukausista?
> 3. Valvotaanko saamiset konkurssipesältä?
> **Varasuunnitelma:** jos vastausta ei tule ennen 1.11., RI-rivit 104318–104320 merkitään Endediksi ennen marraskuun palkka-CSV:tä. Tämän voi perua.

[Löydös](findings/2026-09-25-pysahtynyt-jalkiveloitus.md) ja [CSV](findings/2026-09-25-pysahtynyt-jalkiveloitus.csv):
B016555 (Fortaco), B023198, B024587 ja B024908 (ProMet Oy). Käyttäjä vie ne taloustiimille.
**29.09.:** ProMet Oy on konkurssissa, ja taloustiimi päättää sopimusten käsittelystä. **B016555 on
kunnossa:** lunastusta ei ole maksettu, joten laskutus jatkuu lokakuuhun 2026. CR-6488 (syyskuu,
Error, ei Fortacon sopimusrivejä) on korjattava ja käsiteltävä **ennen 1.10.**, jotta 1.10.
jälkiveloitusajo löytää pyörän. Muuten lokakuu tehdään käsin. **Huom.:** ProMet Oy:n lokakuun Active-rivit 104318–104320
on poistettava ennen palkka-CSV:tä, jos sopimukset todetaan päättyneiksi. Muuten Warning pidättää
koko työnantajan.

---

## 28.09.2026 (ma)

### [x] T3 — K4:n uusintatarkistus (B029495) — **tehty 9.10.2026**

> [!NOTE]
> **Tulos 9.10.2026:** B029495: status 2, tapa 6, `paid_at` 22.09. Ennenaikaista tapaa 1 ei ole. Marraskuun OOMI-seuranta (2.11.) jatkuu T10:ssä.

> [!NOTE]
> **Ajettu 28.09.2026 — poikkeamia, odottaa tuoteomistajaa.** B029495 puhdas, B016666 odotettu (CR 6718).
> B010162, B024292, B026437, B027393, B046058 ja B042663 saivat tapa 1 + `liab_settled_at` 25.09., mutta
> **oikein**: kullakin Done-tyypin 2 CR luotu 25.09. (6795, 6783, 6796, 6778, 6791, 6785), ADR 0008. B010162
> poistuu siis T10:n listalta. B042663:n `paid_at` puuttuu yhä (S1c / 2.0). Laaja kysely 178 (25.09.: 9):
> 69 liab tyhjä (sallittu § 9, 66 OOMI 10–11/2026), 109 liab = paid_at (§ 9 korjattava, lastmodified 15./21.09.,
> todennäköisesti rajausero eikä kasvu). Uusia tapa 1 -kirjauksia 28.09.: B039230, B039648, B040641.
> T1c: B044271:n `exceptional_end_date` 31.07. yhä paikallaan. T1b ajamatta; poiminta 76, B041564 poistettava CSV:stä.

Vanhan status-syncin osa A voi kirjoittaa tavan 1 takaisin B029495:lle 27.09. asti. Kysely on
[importin README:ssä](imports/2026-09-24-s1-ennenaikainen-tapa/README.md) § Jälkitarkistus, ja
odotus on 0 riviä. Poikkeus: B016666 saa CR 6718:n arvot, jos CR on käsitelty.

**Laajennettu 24.09. ([ADR 0010](docs/adr/0010-keskenkauden-lunastus.md) kohta 2):** tarkista samalla
kaikki 19 keskenkauden maksun pyörää ilman CR:ää ([löydös](findings/2026-09-24-keskenkauden-maksu-ilman-cr.md),
luokat A1 ja A2). Onko jollekin ilmestynyt tapa 1 tai `liab_settled_at` 24.09. jälkeen? Odotus:
vain B013550, B029483, B040838 ja B041610 kantavat tapaa 1, kuten 24.09. Niihin ei kosketa, sillä
ne hoidetaan lokakuussa.

**Q3 päätetty 25.09.:** T1:n 9 pyörää jätetään ennalleen, ja ne ovat sallittu poikkeama
([kenttäsäännöt § 9](docs/lunastuksen-kenttasaannot.md#sallittu-poikkeama-tapa-1-ennen-päättymiskuuta-ilman-liab_settled_atia-25092026)).
Tuoteomistajan luokittelu: B005039, B015640, B035208 ja B036496 ovat keskenkauden lunastuksia, joiden
CR luodaan lokakuussa tai myöhemmin. B042831, B045266 ja B041552 ovat kauden lopun lunastuksia 10/2026,
B038685 ja B044476 kauden lopun lunastuksia 11/2026, ja kaikki viisi ovat maksaneet ajoissa.
**Seuranta:** 2.10. kolme lokakuun OOMI-pyörää ovat status 2, ja 2.11. kaksi marraskuun pyörää.
**2.10. todennettu:** B041552, B042831 ja B045266 ovat status 2 tavalla 1. Jäljellä on 2.11.
Neljälle keskenkauden pyörälle tulee tyypin 2 CR, ja niiden `liab_settled_at` = CR:n luontipäivä.

**Laajennettu 25.09. (T1:n sivuhavainto), aiempi muotoilu:** vanha osa A jatkaa ennenaikaisen tavan 1
kirjoittamista 30.09. asti (T6). Aja 28.09. ja uudelleen 30.09. ennen T6:ta kysely *status 1,
tapa 1, ei tyypin 2/10 CR:ää Pending/Done, päättymiskuu ei alkanut*. 25.09. tuloksena oli 9
pyörää (lista T1:ssä). **Tuoteomistaja päättää**, tyhjennetäänkö tapa K4:n tapaan CSV:llä.
OOMI-pyörät kääntyvät päättymiskuussaan joka tapauksessa oikein (kohta 6). Ei-OOMI-pyörillä
write-once-tapa estää tulevan CR:n arvot.

---

## Lokakuu 2026 — maksulinkin (1479) ensimmäisen ajon jälkityöt

Lähde: [löydös](findings/2026-10-02-maksulinkki-ensimmainen-ajo.md). Kaikki 87 pyörää havaintoineen:
[`findings/2026-10-02-maksulinkki-tutkittavat.csv`](findings/2026-10-02-maksulinkki-tutkittavat.csv).

**Ei kiireellinen. Takaraja on seuraava kohorttiajo 31.10.2026**, jolloin 30.11. päättyvä kohortti tulee 30 päivän ikkunaan.
Siihen mennessä pyörät on tutkittava ja ratkaistava, ja T37:n skriptikorjausten on oltava tuotannossa. Päivittäiset ajot jatkuvat
sitä ennen, mutta lokakuun kohortti on jo leimattu, joten väliajoissa näkyvät vain T34–T36:n pyörät. Päätökset tekee tuoteomistaja.
Korjaukset tehdään omistavassa repossa erillisessä istunnossa. (N) = todennettu NetSuitesta 2.10., (K) = laskettu tai päätelty.

### [ ] T30 — Ajastuksen todennus

> [!NOTE]
> **Tilanne 9.10.2026:** **Ei läpi.** Export 9.10.: deployment `customdeploy_send_redemption_link` (internal 2188) on `SCHEDULED` ja deployed. Silti viimeinen lokirivi on 7.10. 02:44 (dry run), eikä 8.–9.10. ole yhtään ajoa. Toistuvuus ei näy exportissa eikä SuiteQL:ssä, joten **tarkista se käyttöliittymästä**. Script-id on `customscript_send_redemption_link`, ei `customscript_gbb_mr_eredem_paylink` kuten CLAUDE.md ja `schemas/script-inventory.md` väittävät (T63).
> **Käyttäjä 9.10.:** ajastus on päivittäin klo 8:00, `months_before` = 1 ja dry run on pois päältä. **Valmis kun** kahdesta peräkkäisestä ajastetusta ajosta (la 10.10. ja su 11.10.) on `selection`- ja `run complete` -rivit ilman `RUN ABORTED`ia.

1.10. klo 13:09 Helsingin aikaa jälkeen `scriptnote`:ssa ei ole yhtään ajoa (tilanne 2.10. klo 10:09). Repon päätös on
"päivittäin klo 08:00". Selvitä, onko kellonaika Helsingin vai runtime-aikaa, ja todenna ensimmäinen valvomaton ajo
(`scripttype = 1479`, rivit `selection` ja `run complete`). **Valmis kun** lokissa näkyy kaksi peräkkäistä ajastettua ajoa.

### [x] T31 — Kuusi liian pientä maksulinkkiä (yhteensä noin 720 €, K) — **tehty 9.10.2026**

> [!NOTE]
> **Päätös 9.10.2026:** Tuoteomistaja: **jätetään ennalleen.** Linkkejä ei peruta, eikä uusia lähetetä. Asiakkaat maksavat linkin hinnan, ja erotus (noin 720 €) jää perimättä. B023007:n maksettu käsitilaus on voimassa. Linkin 351659 poisto jää asiakaspalvelun harkintaan.

> [!NOTE]
> **Tilanne 9.10.2026:** B001767, B002022, B003047 ja B003243 ovat Active, `link_sent` = T. B006488 ja B023007 ovat status 2 / tapa 1. Odottaa asiakaspalvelua ja R7-päätöstä.

**Päätetty 2.10. (D-R1a, D-R1b):** kaikki kuusi = R1 + R3 ([käsittelyloki](findings/2026-10-02-maksulinkki-kasittelyloki.md)). Oikeat hinnat ja syy
on kirjattu lokin luovutustaulukkoon, ja **asiakaspalvelu hoitaa loput**. Huom. R3: maksetut jälkiveloitusvuokrat kattavat B001767:n, B003243:n
ja B006488:n lunastuksen kokonaan. Kattavuus = hinta − huoltohyvitys (M1, päätetty 2.10.). Jäljellä: luovutus asiakaspalvelulle.
**2.10. ilta (R7):** kaikilla kuudella on myös manuaalitilaus (31.07./31.08.), ja ne ovat 5/6 tapauksessa yhden bracketin pienempiä kuin R1:n hinta.
Päätettävä, kumpi hinta on viite. **B023007 maksoi manuaalitilauksen 2.10.**, joten sen uusi linkki 351659 poistetaan. Lisäksi B010348 (ei T31): manuaalitilaus
331600 (70 €) on vanhentunut, ja uusi linkki 33,28 € on oikea.

Linkki hinnoiteltiin bracketilla *huolto + jälkiveloitus* kk. Oikea summa on laskettu huoltosumman bracketilla. Päätä jokaiselle:
peruutetaanko Paylink-tilaus ja lähetetäänkö uusi, laskutetaanko erotus, vai kattaako maksettu jälkiveloitusvuokra sen (ADR 0009 k. 5)?

- [ ] **B001767** — linkki 9,96 €, oikea 169,96 €. Jälki-CR:t 6441 ja 6891. Paylink 2099, maksamatta
- [ ] **B002022** — 55,77 € / 135,77 €. CR 6893. Paylink 2101, maksamatta
- [ ] **B003047** — 111,07 € / 191,07 €. CR 6896. Paylink 2106, maksamatta
- [ ] **B003243** — 21,07 € / 181,07 €. CR:t 6451 ja 6898. Paylink 2107, maksamatta
- [ ] **B006488** — **maksanut 3,45 €** 1.10., oikea 163,45 €. CR:t 6473 ja 6924. Status 2 ja tapa 1 on jo kirjattu
- [ ] **B023007** — 68,41 € / 148,42 €. CR 6951. Paylink 1785266682739, maksamatta

**Valmis kun** jokaisella on päätös, ja mahdollinen uusi linkki tai lasku on lähetetty.

### [x] T32 — Neljä virheellistä tapa 3 -kirjausta (perimättä noin 598 €, K) — **tehty 9.10.2026**

> [!NOTE]
> **Päätös 9.10.2026 (korjattu samana päivänä):** **ADR 0012 pidetään.** `liab_settled_at` = sen jälkiveloituslaskun **luontipäivä**, jolla kattavuus ylittyi, eikä maksua vaadita. Kaikilla neljällä se on 1.10.2026, joten nykyinen arvo on oikein, eikä CSV:tä ajeta. (Aiempi 'maksupäivä'-kirjaus perustui virheelliseen suositukseen. Kaikki neljä kattavaa laskua INVGBF1043445/46/50/77 ovat vielä maksamatta.) Tapa 3 → 2 on tehty. **B002668:n INVGBB1014923** (50,39 €, open) on vanhan 31.7. manuaalilinkin (Paylink 330899, pending) kirjaus laskuksi, ei uusi veloitus. Tuoteomistaja: **jätetään ennalleen**. Jos asiakas maksaa, ylimääräinen maksu käsitellään erikseen.

> [!NOTE]
> **Tilanne 9.10.2026:** Tapa 3 → 2 on jo korjattu kaikilla neljällä (status 2, `liab_settled_at` 1.10.). Auki: pidetäänkö `liab_settled_at` 1.10. vai tyhjennetäänkö se, ja B002668:n INVGBB1014923.

**Selvitetty 2.10. = R2 + R3** ([käsittelyloki](findings/2026-10-02-maksulinkki-kasittelyloki.md)). Päätös: oikea tapa on **2** (ylimääräiset vuokrat),
ei 3. 598 € ei ole perimättä, koska se laskutetaan jälkiveloituksena. Auki: (1) `liab_settled_at` 1.10. vai tyhjä, kunnes kattava lasku on maksettu?
(2) Tapa 3 → 2 CSV:llä. (3) **B002668:lla on käsin tehty lunastuslasku INVGBB1014923 (50,39 €, *Operaatio GBB* 1.10.)**, joka on todennäköisesti tuplaveloitus.

Skripti kirjasi `redemption_maint_budget` (3) ja `liab_settled_at` 1.10., ja sweep käänsi statuksen 2. Huoltosumman bracketilla
hinta ei ole 0, ja kaikilla on Done-tilaisia jälkiveloitus-CR:iä. Päätä: tyhjennetäänkö tapa ja `liab_settled_at` CSV:llä ja palautetaanko
status 1 (K4:n malli)? Vai kattaako jälkiveloitus lunastuksen, jolloin oikea tapa on 2 (K2)? **Huom.:** status 2 lopettaa jälkiveloituksen
1.11. (extension ei näe pyörää), ja RI saa Ended-rivin 1.11. Päätös on siis tehtävä ennen 1.11.

- [ ] **B002668** — oikea hinta 129,93 €. Huolto 275,04 → 5 kk, pidennys 7 kk. CR:t 6445 ja 6894
- [ ] **B002729** — 200,07 €. Huolto 62,95 → 1 kk, pidennys 4 kk. CR:t 4740, 6446 ja 6895
- [ ] **B003264** — 137,26 €. Huolto 151,39 → 3 kk, pidennys 5 kk. CR:t 6452 ja 6899
- [ ] **B006941** — 131,17 €. Huolto 162,54 → 3 kk, pidennys 5 kk. CR:t 6475 ja 6926

**Valmis kun** jokaisen tapa, `liab_settled_at` ja status vastaavat päätöstä. B006956 (30.09. testiajo, tapa 3) on tarkistettu
oikeaksi: 5 kk huoltoa = 5 kk pidennystä, ei CR:iä.

### [x] T33 — Tapa 4 hinnasta 0 € — **tehty 9.10.2026**

> [!NOTE]
> **Päätös 9.10.2026:** Tuoteomistaja: **tapa 4 on oikein** ITSEHANKINTA-pyörille (B046508, B046755). B046508:n jälkiveloitusta (CR 6513 ja 6972, 2 × 120 € Storia Oy) **ei pureta**.

> [!NOTE]
> **Tilanne 9.10.2026:** B046508 ja B046755 ovat status 2 / tapa 4. Auki: tuoteomistajan vahvistus ja B046508:n 2 × 120 € jälkiveloituksen purku.

**Selvitetty 2.10.** ([käsittelyloki](findings/2026-10-02-maksulinkki-kasittelyloki.md) R5, R6): molemmat ovat ITSEHANKINTA-pyöriä. Niillä hinta 0 on
tuotteen normaali (269/405, käsiraha Paylinkissä 223:lla), joten tapa 4 on oikein. **Vahvistettava.** B046508:n jälkiveloitus (2 × 120 € Storia Oy +
2 RI-riviä) on silloin aiheeton (R6: extension ei tarkista hintaa 0), ja se puretaan.

Skripti tulkitsee tallennetun hinnan 0 € käsirahaksi, eikä mikään automaatio ylläpidä hintaa (repon oma tekninen velka).

- [x] **B046508** — *päätetty 9.10.2026: ratkaistu T33:ssa (tapa 4 oikein, ei purkua).* — — tapa 4 1.10., status 2. Done-tilaiset tyypin 7 CR:t 6513 ja 6972, `org_end` 31.08. Pyöräkohtainen kysymys
  *"onko hinta oikeasti 0 vai puuttuuko se?"* on auki (*Jälkiveloituksen kattavuus*). Jos hinta puuttuu, tapa 4 on väärin
  ja jälkiveloitus on pysähtynyt.
- [ ] **B046755** — tapa 4 1.10., status 2. Ei CR:iä eikä SO:ta, päättyy 31.10. Todenna käsiraha sopimuksesta tai myyntitilauksesta.

### [ ] T34 — NOT_PRICED: poikkeavat pyörät

> [!NOTE]
> **Tuoteomistaja 9.10.2026:** (1) Lisätään sääntö **"vain alkuperäisen päättymispäivän jälkeen alkavat pidennys-CR:t ovat jälkiveloitusta"** T61:n ja kattavuuslaskennan vaatimuksiin (K2-rajaus). (2) **B010533:** pidennys pidetään sellaisenaan. Sopimuksen olisi kuulunut päättyä jo ensimmäisen jälkiveloitus-CR:n jälkeen. Ei toimenpiteitä. (3) **B046667:** vakuutuskorvauspyörä, sopimus 2 kk. Maksulinkki jäi lähtemättä, ja lisäksi tehtiin pidennys-CR (+1 kk). **Oikea ratkaisu:** maksulinkki alennetulla summalla, ja maksu varmistetaan ennen seuraavaa pidennystä (extension 2.0, 10.11.). Lisätty listaan *Kysymykset muille tahoille*. (4) **B016555:** vain kaksi pidennys-CR:ää, ja ne ovat oikein (alkuperäinen loppu 8/2026, lunastusta ei maksettu). CR-6107 on *Jälkiveloitus - Poikkeus*, ei pidennys. Avoin Paylink-tilaus 337869. Ei toimenpiteitä. (5) **B029420:** keskenkauden lunastus, jota ei koskaan maksettu. Päättymisen olisi pitänyt olla 31.08.2025. **Taloustiimille raportoidaan, mitkä jälkiveloituslaskut hyvitetään** (agentti kokoaa listan). (6) **B015132:** loppulunastus maksettiin 1.10.2026 klo 22:50, ja pidennys-CR ehdittiin tehdä sitä ennen. Ei muutosta, kaikki ok.

> [!NOTE]
> **Tilanne 9.10.2026:** B010533, B046667, B016555 ja B029420 ovat Active ilman tapaa. B015132 on status 2 / tapa 1, ja sen maksu tuli muuta kautta kuin linkillä, joten tarkista lähde.

- [ ] **B010533** — huoltosumma 265,93 € edellyttää 5 kk pidennystä. Pidennys on 4 kk = 2 kk huoltoa (2 pidennysriviä) + 2
  jälkiveloitus-CR:ää. Puuttuuko huoltopidennyksestä 3 kk (`sta_ue_bike_register_hook`), vai onko summa väärin? Hinta 49 €.
- [ ] **B046667** — pidennys 1 kk, mutta Done-tilaisia tyypin 7 CR:iä on 2, ja huoltosumma on tyhjä. Onko toinen CR tupla, vai puuttuuko päivän siirto?
- [ ] **B016555** — pidennys 2 kk, Done-tilaisia tyypin 7 CR:iä 3 (Fortaco, T1d, CR-6488 korjattu). Täsmääkö laskutus pidennykseen?
- [x] **B029420** — *päätetty 9.10.2026: ratkaistu T34:ssä (taloustiimi päättää hyvitykset, T64).* — — 5 kk jälkiveloitusta, hinta 110 €, kattavuuslistalla 185,20 € ≥ 110 €. Päättyykö tavalla 2 (K2)?
- [ ] **B015132** — NOT_PRICED 1.10., nyt status 2 tapa 1. Mikä maksu kirjattiin ja millä summalla, kun linkkiä ei lähetetty?

### [ ] T35 — Ohitetut pyörät, joilla on vanha SO (ei linkkiä eikä omistajaa)

> [!NOTE]
> **Tilanne ja päätökset 9.10.2026:**
> - **B031422** (SO 1 171,01 €, Netvisor-siirto 30.9.2025, "Lunastukset (loppuvastuut)", Vaasan kaupunki / Isla Varpula, maksamaton): **kysytään taloustiimiltä**, mitä summa sisältää ja onko se voimassa. Pyörän oikea hinta on 100,81 € netto, ja sopimus päättyy 31.10.
> - **B011223** (SO 1 040 €, 10.12.2025, Kattava Oy / Toni Leinonen, maksamaton): ei konkurssi. 10.12.2025 tuotiin kerralla 24 Paylink-tilausta, ja niistä 3 on yhä maksamatta (B011223, B036396 / Jani Saarinen 750,98 €, Huy Nguyen 1 667 €). Pyörällä on työnantajasiirto-CR 5748 (Done 27.8.2026), joten lunastuksen sijaan tehtiin todennäköisesti siirto. **Kysytään asiakaspalvelulta** ennen SO:n sulkemista.
> - B012880, B001876, B019460 ja B036396: tarkistetaan **10.10.** status-sync 2.0:n ensimmäisen live-ajon jälkeen (B012880 maksuhaara, muut tapa 2 / T53).

> [!NOTE]
> **Tilanne 9.10.2026:** **B012880 on kiireellisin:** Active ilman tapaa, vaikka `paid_at` on 7.9. ja `link_sent` = T. Aja CSV ennen 1.11.

`end_red_so_created = T` tai linkitetty SO estää linkin pysyvästi. Selvitä jokaiselta, onko SO yhä voimassa oleva lunastusvaatimus
ja kuka perii sen. Jos se ei ole voimassa, SO suljetaan, lippu tyhjennetään, ja pyörä saa linkin.

- [ ] **B012880** — **maksettu**: Paylink 5765 completed, SO type 4 SOGBB0014688 tila G, `paid_at` 7.9. Silti **status 1 ilman tapaa**
  (osa A ohitti, vrt. maksuikkunalöydös 23.09.). `subsc_end` siirtyi 30.9. → 31.10. ilman CR:ää. Tarvitsee tavan 1 ja `liab_settled_at`:in
  (S1-malli), ja päivän siirron syy on selvitettävä.
- [ ] **B001876** — SO type 4 SOGBB0000526, tila B, 30.9.2025. Jälki-CR:t 4738, 6442 ja 6892, `org_end` 30.4.2026.
- [ ] **B019460** — SO type 4 SOGBB0000535, tila H (suljettu), 30.9.2025. Jälki-CR:t 6490 ja 6947. Suljettu SO estää silti linkin.
- [ ] **B031422** — SO type 4 SOGBB0000529, tila B, 30.9.2025 (Netvisor-siirto, 1 171,01 €). Päättyy 31.10.2026.
- [ ] **B011223** — SO type 3 (keskenkauden) SOGBB0002659, tila B, 10.12.2025. Ei tyypin 2 CR:ää, päättyy 31.10.2026. Kuuluuko T10:een?
- [ ] **B036396** — SO type 3 SOGBB0002663, tila B, 10.12.2025. Jälki-CR:t 4772, 6509 ja 6970.

B026671 (SKIP_LINKED_SO) on kunnossa: maksettu 30.9., status 2, tapa 1.

### [x] T36 — 64 jälkiveloituspyörää ilman huoltoa (NOT_PRICED joka päivä) — **vanhentunut 9.10.2026**

> [!NOTE]
> **9.10.2026:** ADR 0014 A2 ohittaa jälkiveloituspyörät valinnassa (1479:n dry run 7.10.: `jalkiveloitus=14` ohitettu), ja `link_sent`-täyttö on ajettu 7.10. (61/61). Tätä ei ole todennettu pyörä kerrallaan.

Status 1, ei tapaa eikä huoltopidennystä. Pidennys on Done-tilaisten tyypin 7 CR:ien määrä. Pyörät ovat vanhan manuaaliprosessin
kohortteja (`org_end` 31.7.–30.9.2026), jotka tulivat ikkunaan, kun `handler_jalki` siirsi päivän 31.10.:een. **Päätettävä kerralla:**
saavatko jälkiveloituspyörät maksulinkin, ja millä hinnalla (koko `end_redemption_price` vai K2-kattavuuden jälkeinen erotus)? Vai hoidetaanko
ne pelkällä jälkiveloituksella ja K2:lla?

B003230, B003462, B003531, B003679, B003698, B003714, B003747, B004076, B004121, B004271, B004475, B004513, B004531,
B004543, B004566, B004630, B004667, B004852, B004857, B005057, B005224, B005300, B005359, B006263, B006432, B006728,
B007218, B007263, B007326, B009045, B010681, B010817, B011244, B012132, B013198, B014017, B014671, B014826, B015501,
B016491, B016535, B016591, B017920, B020339, B021401, B022581, B023015, B023763, B024260, B025070, B025313, B026058,
B026345, B029068, B029828, B030349, B030615, B030725, B033147, B033376, B033546, B035615, B036062, B036435.

**Valmis kun** päätös on kirjattu ja T37:n korjaus toteuttaa sen.

### [x] T37 — Skriptikorjaukset ennen 31.10. (omistava repo `netstuite-send-end-redemption-payment-link`) — **tehty 9.10.2026**

> [!NOTE]
> **Päätös 9.10.2026:** Julkaisut A ja B (ADR 0014, K-a…K-h) on yhdistetty ja ladattu 7.10. Jäännökset siirretään: tuotantoajon todennus T30:een, ohitus 4 (CR 2/10) T43:een ja 30.10. tarkistus T52:een.

> [!NOTE]
> **Tilanne 9.10.2026:** PR #1 ja #2 yhdistettiin 7.10. (c973391; e5cb675 ankkuri = huoltosumma; 35164ba ohitukset). Tuotantoajoa ei ole tullut (T30).

**7.10.: A ja B yhdistetty (PR #1, #2) ja ladattu. Dry runit läpi:** yksittäiset pyörät (L2, S5, leima), koko 30.11. kohortti (816 pyörää: hinta, ohitukset ja lokimuoto 0 poikkeamaa) sekä B1–B3 (`months_before` 3 → keskeytys, 1 → 2 pyörää, 2 → 816 pyörää ja eräpäivä = päättymispäivä). **Live 7.10. arvolla `months_before` = 1** (tuoteomistaja). Ensimmäiset ajot: odotus 0 linkkiä ja 2 `SKIP_IN_PROGRESS` (B011223, B031422). Marraskuun kohortti (noin 813 linkkiä ja B046661 tapa 4) lähtee **30.10.**, joulukuun kohortti (776) 30.11. **Jäljellä:** ensimmäisen ajastetun ajon todennus ja 30.10. ajon tarkistus ja tuplatilauskysely (T52).

Tehdään repon omassa istunnossa sen sääntöjen mukaan. Tuoteomistaja päättää jokaisesta kohdasta. Testaus: dry run ja `test_bike_id`.

**Päätetty 7.10.: [ADR 0014](docs/adr/0014-maksulinkin-korjaus-ja-yksinkertaistus.md), toteutusmäärittely
[`docs/maksulinkki-1479-muutosspeksi.md`](docs/maksulinkki-1479-muutosspeksi.md) (julkaisut A ja B, rivitason muutokset, hyväksymiskriteerit).**
Se ratkaisee: K-a = A1, K-b = A2 (S4, S5 ja ohitus 4 valinnassa), K-c = A3 (`SKIP_EXTENSION_RUNNING`), K-d = digesti poistetaan (A5),
K-e = testiympäristöä ei käytetä (A4), K-f = ei muutosta (T35 käsin), K-g = tuotenimi vakio (A4), K-h = ADR 0012. K-b0 tehdään ennen A:ta (A6).

**Määrittely 5.10.: [logiikkavirheet ja tavoitetila](findings/2026-10-05-maksulinkki-logiikkavirheet-ja-tavoitetila.md)**: tavoitekaava, skenaariot S1–S13,
korjauskohdat L1–L8 ja hyväksymiskriteerit. Korjaukset toteutetaan tämän mukaan.

**Lähtöaineisto 3.10.:** [hintapoikkeamat](findings/2026-10-03-maksulinkki-hintapoikkeamat.md) (kaikki 748 linkkiä sääntöä 1 vasten, logiikkavirheet L1–L8,
marraskuun simulointi) ja [ylimääräiset viestit](findings/2026-10-03-maksulinkki-ylimaaraiset-viestit.md) (7 pyörää). Uusi virheluokka L2: negatiivinen
huoltosumma ilman pidennystä ei hyvity (3 linkkiä lokakuussa, 3 marraskuussa). **Päätetty 5.10.: negatiivinen summa vähennetään kokonaan** (126 aktiivista,
42:lla alle −64,53). Hyvitys = (summan bracketin yläraja tai 0) − summa.

- [ ] **K-a Pidennyksen ankkuri — päätetty 2.10.: hyvitys lasketaan `custrecord_sta_maintenance_sum`:sta** (bracket summasta, ei pidennyksestä; muu 14.9. kaava ennallaan) (`gbb_mr_send_end_redemption_paylink.js:359-365, 477-492`). Jälkiveloituskuukaudet eivät saa kasvattaa
  huoltohyvitystä. Vähennä Done-tilaisten *pidennys – jälkiveloitus* -CR:ien määrä `extension_months`:ista, tai laske huoltopidennys
  pidennysrivien kausista. Testitapaukset: T31 ja T32, joiden lasketut hinnat on toistettava.
- [x] **K-b0 `link_sent`-täyttö (päätös 2.10., R3) — ajettu ja todennettu 7.10.: 61/61 ei-OOMI-pyörää = T, ehdokkaita 0.** CSV ja rajaus: [`imports/2026-10-07-link-sent-kertataytto/`](imports/2026-10-07-link-sent-kertataytto/). Merkitse `custrecord_gbb_eredem_link_sent = T` jokaiselle pyörälle, joka sai linkin manuaaliprosessissa.
  **Riippuu paylink-order-tracking-muutoksesta (tuoteomistaja tekee 2.10.):** kaikki Paylink-tilaukset NetSuiteen, käsittely vasta maksun jälkeen.
  Sen jälkeen täyttö tehdään SuiteQL:llä (`notes` = `externalid`). Tämä poistaa myös T36:n 64 pyörää digestistä, ja samalla tarkistetaan T31:n mahdolliset tuplatilaukset.
- [ ] **K-b Valinta / lattia.** **Työnkulku 2.10.: linkki ennen jälkiveloitusta, jälkiveloitus vain, jos linkkiä ei makseta** (R3). Varmistus: ohita pyörät, joilla on Done-tilainen jälkiveloitus-CR. `not_before` rajaa liikkuvaa `subsc_end_date`:a. Toteuta T36:n päätös: joko jälkiveloituspyörät rajataan pois
  (ja ne jäävät K2:lle), tai ne hinnoitellaan oikein.
- [ ] **K-c Settlementin vartija.** Tapaa 3/4 ei kirjoiteta, jos pyörällä on Done-tilainen jälkiveloitus-CR. Pyörä listataan silloin digestiin.
  Muuten jälkiveloitus pysähtyy hiljaa (T32, B046508).
- [ ] **K-d Digestin toisto.** Samat NOT_PRICED-pyörät listataan joka päivä. Listataanko vain ensimmäisellä kerralla, vai leimataanko ne?
- [ ] **K-e Testiajon kirjoitukset.** Live-ajo `test_bike_id`:llä Paylink-testiä vasten kirjoitti silti oikean tavan 3 (B006956 30.09.).
  Estä tai dokumentoi.
- [ ] **K-f Vanhat SO:t** (T35). Sääntö sille, milloin vanha type 3/4 SO tai `end_red_so_created` ei enää estä linkkiä.
- [ ] **K-g Tuotenimi.** `custscript_gbb_eredem_item_title` on reititysavain `paylink_ns_processor.ue.js:28`:n `PRODUCT_MAP`:iin.
  Lukitse arvo tai varoita poikkeamasta.
- [ ] **K-h Huoltohyvityksen yläraja** (R4, [käsittelyloki](findings/2026-10-02-maksulinkki-kasittelyloki.md)). Tuoteomistaja 2.10.: hyvitys ≤ noin 64,54 € netto.
  Repon 14.9. ankkuripäätös (B021054: 163,34 €) on ristiriidassa tämän kanssa. B021054:n oikea hyvitys on 35,06 € (2.10.). Ehdotus: hyvitys =
  (summan bracketin yläraja tai 0) − summa. Auki: voittaako katto, jos hyvitetty summa on > 64,54 € (B000928, −79,68)?
  *(2.10. aiempi K-h "vähennä jälkivuokrat hinnasta" on peruttu: linkki lähtee ennen jälkiveloitusta, joten oikea korjaus on K-b:n rajaus.)*

**Valmis kun** korjaukset ovat tuotannossa, ja 30.11. kohortin koko dry run (`days_before` väliaikaisesti ≥ 30) ei näytä yhtään pyörää,
jonka hinnassa on jälkiveloituskuukausia. Löydöksen jälkitarkistus palauttaa silloin vain ratchet-hyvityksiä.

### [ ] T38 — 215 maksettua linkkiä ilman `liab_settled_at`:ia (osa T26:ta)

> [!NOTE]
> **Tilanne 9.10.2026:** 336 pyörää (`link_sent` = T, tapa 1, `paid_at` asetettu) on ilman `liab_settled_at`:ia.

Vanha osa A kirjoitti 1.10. tavan 1 ja `paid_at`:in, mutta `liab_settled_at` jäi tyhjäksi (N). Kenttäsääntöjen § 9 vaatii maksupäivän.
Tämä on mekaaninen täydennys, ei pyöräkohtainen selvitys: CSV kyselyn pohjalta T26:n viikkotarkistuksessa.

```sql
SELECT br.id, br.name, TO_CHAR(br.custrecord_gbb_redemption_paid_at, 'DD.MM.YYYY') AS liab_settled_at
FROM customrecord_sta_bike_register br
WHERE br.custrecord_gbb_eredem_link_sent = 'T' AND br.custrecord_gbb_liab_settle_method = 1
  AND br.custrecord_gbb_liab_settled_at IS NULL AND br.custrecord_gbb_redemption_paid_at IS NOT NULL
```

**3.10.:** laajuus on koko erä, ei vain 215. Kaikilla **279** status-2-pyörällä on tapa 1, ja `liab_settled_at` on tyhjä ([löydös](findings/2026-10-03-maksulinkki-ylimaaraiset-viestit.md)).
Tarkista samalla `custrecord_sta_end_red_so_created`: se oli F kaikilla 215:llä vielä 2.10. klo 10. Onko paylink-post-processor ajanut?
**Valmis kun** kysely palauttaa 0.

---

## 29.09.–1.10.2026 — lokakuun kuukausiraportointiajo

### [x] T14 — Kuukausiajo 1.10. ilman vääriä rivejä — **tehty 9.10.2026**

> [!NOTE]
> **Tulos 9.10.2026:** Käyttäjä vahvisti, että lokakuun palkka-CSV (1451) on ajettu ja lähetetty. RI-tarkistukset olivat läpi (ks. tilanne alla).

> [!NOTE]
> **Tilanne 9.10.2026:** Lokakuun RI on kunnossa: 0 Active/New-riviä, joilla fee 0. Warning-rivit (2) ovat testipyörän B017530. `ri_creation`/`ri_update` 1.10. mapErrors=0. **Merkitään tehdyksi, kun käyttäjä vahvistaa, että palkka-CSV (1451) on ajettu.**

Suunnitelma: [`docs/kuukausiajo-2026-10-suunnitelma.md`](docs/kuukausiajo-2026-10-suunnitelma.md).
E1: **valmis 30.09.** Asiakaspalvelu teki 2A-paketit (CR 6859 B009498 → Nautor 1.6., CR 6862 B010548 → Pirkan 1.9.). 29.09. suunnitelman suunta oli väärin päin, ja rekisteri oli jo oikein ([§ 6](findings/2026-09-30-kuukausiajo-rekisteri-riski.md)). 27 muuta hoitaa 1196. E2: **tehty 29.09.** — B046737, B046742 ja
B046832 lokakuun rivit 117974–117976 käsin (Active, todennettu); 1.10. tarkistetaan, ettei tullut tuplaa. E3 **peruttu 30.09.**: B046830 on vahinkotilaus (oikea pyörä B043367), eikä sille aseteta statusta (T19).
E5 (extension-parametrit UI:sta). **30.09. päivällä E1b: 1196
käsin + tarkistus** — ajastettu ajo ei kirjoittanut elokuun lopussa. 30.09.: **E6 päätös T6:sta — sen sammutus pysäyttää sweepin koko
lokakuuksi.** 1.10.: Q1–Q3, testirajaus pois deploymentista, ri_creation → ri_update → CSV.
**Valmis kun** Q3:n tarkistukset menevät läpi ja CSV on ajettu.

> [!NOTE]
> **1.10.2026: ri_creation ja ri_update ajettu, Q3 läpi** ([löydös](findings/2026-10-01-ri-creation-tarkistus.md)).
> ri_creation `scanned=46626 created=33862 mapErrors=0`, ri_update `mapErrors=0 reduceErrors=0`, Warning 0.
> **Huomiotekstit korjattu CSV:llä ennen palkka-CSV:tä:** 202 *Ended retrospectively* -riviä
> ([import](imports/2026-10-01-turhat-palkkahuomiot/README.md)) ja 32 Ended-riviä, joilla oli jälkiveloituksen
> teksti ([import](imports/2026-10-01-myohassa-teksti-ended/README.md)), molemmat todennettu. Skriptikorjaukset:
> T28 ja T29. **Tuoteomistajan päätökset 1.10.:** ProMet Oy:n rivit 104318–104320 menevät raportille, ja
> 35 konsernisiirron Active/New-riviä pitävät huomionsa. Jäljellä: palkka-CSV (1451).

**Tarkistettu 30.09. illalla (rekisteririskin CSV, [§ 6](findings/2026-09-30-kuukausiajo-rekisteri-riski.md)):**
R2:n 5 OOMI-riviä korjattu (fee 79,6813), R3:n päällekkäiset item 30 -rivit inaktivoitu, B044271:n ja
B044504:n `oomi_exc` tyhjennetty. **Q3:een 1.10. lisätään:** (a) B043367: lokakuu kuuluu raportoida Rainmaker Telepalvelu Oy:lle (tuoteomistaja 30.09.). RI 117171 Active/New on siis oikein. Rekisterissä on yhä Rainmaker Contact (CR 6777 alkaa 1.11.), joten tarkista, ettei ri_creation tee Warningia tai toista riviä. (b) B044504: `exceptional_end_date` tyhjennetty 30.09. (todennettu). (c) Yksikään Active-rivi ei saa olla `lease_fee_vat0` = 0. (f) Sweep kääntää 1.10. klo 00:30 noin 162 lokakuussa päättyvää pyörää, joilla on jo tapa, tilaan 2. **Jokaisella pitää silti olla lokakuun Active-rivi, ei Ended- eikä Warning-riviä.** Ended tulee vasta 1.11. (ADR 0002:n sopimusankkuri, todennettu 21.09. pyörällä 37874). Tarkistus tehdään T27:ssä.

**Puhdas riskiarvio 30.09. illalla** ([löydös](findings/2026-09-30-kuukausiajo-1-10-puhdas-riskiarvio.md), kolme auditoijaa ilman aiempia löydöksiä):
1196 ajoi 30.09. 08:22 lokiaikaa, 66/66 CR:ää, 0 virhettä (todennettu `scriptnote`). Ennuste oli kaksi
tuotannon Warningia. **Rekisteri-id 8893 / RI 117683 (ri_update D11, Joen Diesel Oy) korjattu 30.09. (käyttäjä).**
Syynä oli kaksi muutosta samassa kuussa, pidennys ja ennenaikainen lunastus (T23). Jäljelle jää
rekisteri-id 41345 (T21). **Q3:een 1.10. lisätään:** (d) tuotannon Warning-rivejä on korkeintaan 1 (41345),
(e) 8893:lla on lokakuussa vain yksi elävä rivi.

### [x] T27 — 1.10.2026: 162 sweepin kääntämää lokakuun pyörää raportoidaan Active ([lista](findings/2026-09-30-lokakuussa-paattyvat-162-sweep.md)) — **tehty 1.10.2026**

> [!NOTE]
> **Tulos 1.10. ri_updaten jälkeen (03:42 Hki): 162/162 pyörällä yksi lokakuun Active-rivi**, ja rekisterissä
> niiden status on 2. Mukana 45 Done-tyypin 2 CR:n pyörää (marraskuun Ended-rivi valmiina). B046434 sai uuden
> rivin 152076, eikä B037874:lle tai B038677:lle syntynyt tuplaa.
> [Löydös](findings/2026-10-01-ri-creation-tarkistus.md).

**Päivä: 1.10.2026, ri_creationin ja ri_updaten jälkeen, ennen CSV:tä (1451).** 162 pyörän kausi päättyy lokakuussa, ja niillä on
jo lunastustapa. Sweep kääntää ne 1.10. klo 00:30 tilaan 2/3. **Lokakuun rivin pitää silti olla Active**, ja Ended tulee
vasta 1.11. (ADR 0002). Aja löydöksen tarkistuskysely br_id-listalla, koska status 1 -rajaus ei enää toimi 1.10. jälkeen.
**Valmis kun** 162/162 pyörällä on tasan yksi lokakuun rivi, joka on Active (ei Ended, Warning tai puuttuva) ja sweep on kääntänyt statuksen.
Katso erityisesti:
- **45 pyörää, joilla on Done-tilainen tyypin 2 CR ja valmis marraskuun Ended-rivi, mutta ei lokakuun riviä.** A2-korjaus
  (`ri_creation.js:1146-1175`) ohjaa ne Active-polulle.
- B037874 ja B038677: niiden olemassa oleville Active-riveille ei saa syntyä tuplaa.
- B046434: lokakuun rivi 103913 on Deleted. Uuden Active-rivin pitää syntyä.

Jos yksikin puuttuu tai on Ended, **pysäytä ennen CSV:tä**: se on puuttuva palkanpidätys.

### [ ] T28 — ri_update vaihe 1c: *Ended retrospectively* vertaa päättymispäivää eikä -kuuta ([löydös](findings/2026-10-01-turhat-ri-huomiot-kehitys.md) § Virhe 1)

> [!NOTE]
> **9.10.2026:** Työohjeen oletukset hyväksytty: Ended-riviltä poistetaan vain jälkiveloituslauseet, Paused-rivit jäävät ennalleen, eikä "Ended voittaa Active" -koodilaajennusta tehdä (T23 → raportointi).

> [!NOTE]
> **9.10.2026:** Tuoteomistaja: **korjataan koodi** ennen 1.11. Työohje: `docs/monthly-reporting-korjaukset-t28-t29.md`.

> [!NOTE]
> **Tilanne 9.10.2026:** Korjausta ei ole tehty: `mr_monthly_reporting_ri_update.js:954` vertaa yhä päivää eikä kuukautta. Takaraja 1.11.

**Kun lokakuun raportit on lähetetty.** Korjaus tehdään `netsuite-monthly-reporting`-repossa erillisessä istunnossa.
`mr_monthly_reporting_ri_update.js:953-957` liputtaa jokaisen kesken kuuta päättyneen Ended-rivin. 1.10. liputettiin
202 väärin, ja ne korjattiin käsin. Konsernisiirtojen Active/New-huomio jää ennalleen (tuoteomistaja 1.10.).
**Valmis kun** korjaus on tuotannossa ja testattu löydöksen testirivien perusteella. Jos sitä ei ehditä
1.11. mennessä, marraskuun ajossa tehdään sama import.

### [ ] T29 — Jälkiveloituksen teksti (C3 + C4) jää Ended-riville ([löydös](findings/2026-10-01-turhat-ri-huomiot-kehitys.md) § Virhe 2)

> [!NOTE]
> **9.10.2026:** Työohjeen oletukset hyväksytty (ks. T28). **Kuvaus korjattu:** `mergeIntoExistingRi` ei muuta Ended-riviä. Teksti siirtyy Ended-riville kahdessa kohdassa: `ri_creation.js` `convertActiveRowToEnded` (sääntö A5) ja `ri_update.js` priority 0 `carryNotificationTo`.

> [!NOTE]
> **9.10.2026:** Tuoteomistaja: **korjataan koodi** ennen 1.11. Työohje: `docs/monthly-reporting-korjaukset-t28-t29.md`.

> [!NOTE]
> **Tilanne 9.10.2026:** Korjausta ei ole tehty: `mergeIntoExistingRi` päivittää rivin statusta tarkistamatta. Takaraja 1.11.

**Kun lokakuun raportit on lähetetty.** Korjaus tehdään `netsuite-monthly-reporting`-repossa erillisessä istunnossa.
*"… Pyörän lunastus on myöhässä. Vuokralaskutus ja pyöräedun käsittely palkoissa jatkuu …"* jäi 32 lokakuun
Ended-riville (`ue_reporting_item_late_redemption_prolongation.js:281-290`), ja rivit korjattiin käsin.
**Valmis kun** Ended-rivit eivät enää kanna tekstiä, ja Active-jälkiveloitusrivit säilyttävät sen.
Tarkistetaan 1.11. ajossa.

### [ ] T21 — Rekisteri-id 41345: työnantaja rekisterissä ≠ sopimusrivit (ri_creation-Warning 1.10.)

> [!NOTE]
> **Tuoteomistaja 9.10.2026:** Kootaan yhteen kaikki, mikä pitää selvittää muilta tahoilta. Ks. osio *Kysymykset muille tahoille* tiedoston alussa.

> [!NOTE]
> **Tilanne 9.10.2026:** Warning on poistunut: RI 118376 Ended (Paree Group), 118377 Active (Serres), ja rekisterissä on Serres. Asiakaspalvelu päättää oikean työnantajan.

Rekisterissä Serres Oy, mutta item 30 -rivit 97714 ja 97715 ovat Paree Group Oy:n sopimuksella. Syyskuun RI 98039 on Paree Groupilla,
eikä CR:ää ole (todennettu 30.09.). Ri_creation tekee lokakuulle Warning-rivin, joka pidättää työnantajan.
Asiakaspalvelu ratkaisee, kumpi työnantaja on oikein: joko rekisteri korjataan tai tehdään siirto-CR.

### [x] T22 — B026614: kaksi peräkkäistä siirtoa, lopputulos oikein (30.09.)

**Tausta (käyttäjä 30.09.):** Pyörä siirtyi elokuussa 2026 Solidium Oy:ltä Wärtsilä Finland Oy:lle. Syyskuun laskut
hyvitettiin Solidiumilta ja jälkiveloitettiin Wärtsilä Finlandilta. Syyskuussa 2026 tehtiin konsernin sisäinen siirto
Wärtsilä Finland Oy → Wärtsilä Oyj Abp. Laskutus menee lokakuusta Wärtsilä Oyj Abp:ltä.

**Todennettu NetSuitesta 30.09.:** Asiakas 373 on Wärtsilä Finland Oy ja 1767 Wärtsilä Oyj Abp. Pyörän CR:t, kaikki Done:
- 2A-paketti, luotu 31.08.:
  - CR 6031, tyyppi 1, `official_end` 31.08., `start` 1.10.
  - CR 6032, tyyppi 11, hyvitys, `start` 1.9.
  - CR 6033, tyyppi 7, jälkiveloitus, `start` 1.9.
- CR 6750, tyyppi 9 *Siirto konserni*, luotu 24.09., `start` 1.10., `end` 30.09. (loppu ennen alkua).

Ensimmäisen siirron `start_date` on 1.10., koska syyskuu korjattiin 11/7-CR:illä. Siksi molemmat siirrot
osuivat samaan 1196-ajoon 30.09. 1196 kirjoitti ensin CR 6031:n (→ 373) ja sitten CR 6750:n (→ 1767).
Rekisteri (1767) ja lokakuun RI 117176 (Active/New, CR 6750) ovat oikein.

**Tämän takia laskutus menee oikein.** CR 6031 ei ole vanhentunut. Sen RI-vaikutus on elo–syyskuun
Ended-rivi 117069, ja CR 6750 ohitti sen lokakuussa oikein.

**Jäljelle jäävä riski → T24.**

### [x] T25 — Verovapaus T siirron jälkeen: 31 rekisteriä ja 14 lokakuun RI-riviä ([löydös](findings/2026-09-30-verovapaus-siirroissa.md)) — **tehty 9.10.2026**

> [!NOTE]
> **Tulos 9.10.2026:** Tuoteomistaja: syyskuun 31 virheellistä T-riviä **jätetään historiaksi**. Tulevat kuukaudet on korjattu (rekisteri 29/30, lokakuun RI 13/14). Jäännös B017961 tarkistetaan T25:n seurannassa marraskuun ajon yhteydessä. Automaation puute on kirjattu `docs/verovapaus-saannot.md`:hen.

> [!NOTE]
> **Tilanne 9.10.2026:** Lokakuun Active/New-riveillä verovapaus on T 40 rivillä: 33 tyypin 9 CR:llä (oikein), 1 tyypin 1, 1 tyypin 3 ja 5 ilman CR:ää. Jäljellä B017961 ja päätös syyskuun 31 T-rivistä.

Sääntö: [`docs/verovapaus-saannot.md`](docs/verovapaus-saannot.md). Syyskuun 58 tyypin 1 siirrosta 31:llä on rekisterissä T. Konsernisiirto ei selitä yhtään.
**Ennen 1.10. ri_creationia** tuoteomistaja päättää, korjataanko rekisteri F:ksi. Jos ei korjata, noin 10 uutta lokakuun T-riviä syntyy lisää.
Lokakuun 14 T-riviä ja syyskuun 31 T-riviä korjataan erikseen. Selvitä myös, mitä 6.8.2026 klo 17 ajettiin: systemnoten mukaan `verovapaa` muuttui F → T.
Automaatio puuttuu kaikista repoista.

**Päätökset 30.09.:**
1. Rekisteri korjataan.
2. F alkaa siitä uuden työnantajan Active/New-rivistä, jonka siirron UE luo tyypin 1 CR:stä.

**Import ajettu 30.09., todennettu: rekisterissä 29/30 ja lokakuun RI-riveillä 13/14 on F.** Poikkeus on B030311
(CR 6734, liikkeenluovutus), joka jäi T:ksi tarkoituksella. Jäljellä: B017961 lokakuun lopussa, syyskuun rivit (päätös)
ja automaatio. [`imports/2026-09-30-verovapaus-siirrot/`](imports/2026-09-30-verovapaus-siirrot/README.md).
Rekisterissä 30 pyörää, lokakuussa 14 RI-riviä. Aja **ennen 1.10. ri_creationia.** B017961 (CR 6818, RI:n vaihto 1.11.)
saa F:n lokakuun lopussa. Syyskuun 31 T-riviä ovat historiallisia, eikä niitä korjata ilman erillistä päätöstä.
Automaatio pitää lisätä kahteen repoon: monthly-reporting UE ja cr-scripts `cr_bike_register_apply`.

### [x] T24 — 1196 käsittelee saman pyörän CR:t ilman järjestystä — **siirretty 9.10.2026**

> [!NOTE]
> **Tuoteomistaja 9.10.2026:** Ei koodikorjausta. Kyseessä on vahinko, joka pitää raportoida **etukäteen**. Kirjattu raportointiskriptin vaatimuksiin (sama osio), ja seuranta on T51:ssä.

> [!NOTE]
> **Tilanne 9.10.2026:** Korjausta ei ole tehty (`cr_bike_register_updater.js:73-82` ilman ORDER BY:tä). Takaraja 1.11.

Päätelty koodista: `cr_bike_register_updater.js:73-82` hakee tyypin 1/9 Done-CR:t, joiden `start_date` on seuraavan kuun 1. päivä,
ilman `ORDER BY`-ehtoa. Kun samalla pyörällä on kaksi CR:ää samalla alkupäivällä, viimeksi kirjoitettu voittaa. Järjestys on siis sattumaa.
B026614:llä (T22) järjestys osui oikein. Käänteisenä rekisteriin olisi jäänyt Wärtsilä Finland Oy.
Korjaus kuuluu `netsuite-subscrption-cr-scripts`-repoon: `ORDER BY custrecord_cr_created_date, id` tai Needs Review,
jos samalla pyörällä on useampi CR. Ennen jokaista kuunvaihdetta tarkista kysely: tyypin 1/9 Done-CR:t, joilla on sama pyörä ja sama
`start_date` = seuraavan kuun 1. päivä.

### [x] T23 — Kaksi muutosta samassa kuussa tuottaa tuplarivin (juurisyy, 8893) — **siirretty 9.10.2026**

> [!NOTE]
> **Tuoteomistaja 9.10.2026:** Ei koodikorjausta. **Ended-rivin on aina voitettava** pidennys- ja ennenaikainen lunastus -tilanteissa. Kirjattu raportointiskriptin vaatimuksiin (`docs/poikkeamaraportointi-vaatimukset.md` § *Kuukausiraportoinnin ennakkovaroitukset*), ja seuranta on T51:ssä.

> [!NOTE]
> **Tilanne 9.10.2026:** Korjausta ei ole tehty (`mr_monthly_reporting_ri_update.js:1110`). Pyörä 8893 on nyt kunnossa (yksi lokakuun rivi). Takaraja 1.11.

Kun samalle pyörälle tulee samassa kuussa pidennys ja ennenaikainen lunastus, lokakuulle syntyy
samalle työnantajalle sekä Active- että Ended-rivi, ja ri_update D11 (`mr_monthly_reporting_ri_update.js:1110-1156`)
demotoi Active-rivin Warningiksi. Selvitä, kumpi UE-polku jättää vanhan rivin, ja kirjaa korjaus
`netsuite-monthly-reporting`-repoon. Sitä ennen tarkista käsin kuukausiajon edellä pyörät, joilla on samassa kuussa
Done-CR:t tyypeille 7 (pidennys) ja 2.

### [ ] T16 — B044504 ja B044271: asiakaspalvelun CR (lokakuu)

> [!NOTE]
> **Tuoteomistaja 9.10.2026:** **B044271 on kunnossa:** keskenkauden lunastukselta puuttui CR, mutta päättymispäivä ehti tulla, maksu on saapunut ja kausi on päättynyt. **B044504 tarvitsee yhä muutospyynnön:** Paylink-tilaus osoittaa, että sopimus päättyy kesken kauden (tilaus näkyy NetSuitessa vain CR:n kautta). Lisätty listaan *Kysymykset muille tahoille*.

> [!NOTE]
> **Tilanne 9.10.2026:** B044504 on kunnossa (status 1, lokakuun RI Active), joten sen voi sulkea. B044271 on jo status 2 / RI Ended. Kysy asiakaspalvelulta, tarvitaanko CR:ää vielä.

Molemmat odottavat CR:ää. B044504: molemmat poikkeuspäivät tyhjennetty 30.09. (todennettu, `subsc_end` 1.4.2027). B044271: status 1, `subsc_end` 5.9.2026, ei tapaa.

### [ ] T17 — Välikuukaudet sopimuksen loppuun: raportoinnin käsittely suunniteltava (B016051)

> [!NOTE]
> **Tuoteomistaja 9.10.2026:** Erikoistapaus. Varmistettava (1) **marraskuussa**, että lunastusmaksun linkki lähtee, (2) **joulukuussa 2026**, että laskutus menee oikein, ja (3) että kuukausiraportointi on oikein. Yleistä sääntöä ei tehdä nyt.

> [!NOTE]
> **Tilanne 9.10.2026:** RI-rivit 1266–1268 ovat Paused. Rivi 1269 (tammikuu 2027) on Active/New, ei Paused kuten tehtävässä lukee. Tarkistetaan joulukuussa.

Järjestelmä ei tue tätä. Välikuukaudet laskutetaan sopimuksen loppuun (31.12.2026), joten vuokrarivi
72784 on tyhjä kausi (1.1.2027–31.12.2026). RI-rivi 1269 (Paused) muutetaan Endediksi, jos lunastusmaksu
maksetaan 12/2026. Muuten raportointi jatkuu, kunnes maksu tai velvoitteet on katettu. Tarkista
B016051 joulukuussa, ja suunnittele yleinen sääntö ennen seuraavaa vastaavaa tapausta.

### [x] T18 — OOMI RI-rivi fee 0: selvitä syy ([löydös](findings/2026-09-30-oomi-ri-rivi-fee-nolla.md)) — **tehty 9.10.2026**

> [!NOTE]
> **Tuoteomistaja 9.10.2026:** Fee 0 on **täysin mahdollinen ja oikea tilanne**: osa asiakkaista ei maksa palvelumaksua lainkaan sopimuksen mukaan. Koodikorjausta ("puuttuva hinta → Warning") **ei tehdä**.

> [!NOTE]
> **Tilanne 9.10.2026:** Data on korjattu: viidellä rivillä fee 79,6813, eikä lokakuussa ole fee 0 -rivejä. Juurisyy on auki. **Päätä**, suljetaanko data-osa ja erotetaanko koodikorjaus omaksi tehtäväkseen.

Rivit 116352–116356 luotiin 18.09. klo 14:32, fee 0, ilman automaatiolokia. Selvitä luoja ja
korjaa koodipolku niin, että puuttuva hinta tuottaa Warningin eikä 0:aa (omistava repo:
`netsuite-monthly-reporting`).

### [ ] T19 — Siivoa pyörärekisteristä vahinko- ja peruttujen tilausten tietueet

> [!NOTE]
> **9.10.2026:** Linkit tarkistettu: kolmella tietueella ei ole CR-, sopimusrivi-, RI- eikä Paylink-viittauksia. **Käyttäjä inaktivoi B046830, B046739 ja B046740.**

> [!NOTE]
> **Tuoteomistaja 9.10.2026:** Käyttäjä kysyi, mitä tietueet ovat. Vastaus: B046830 on vahinkotilaus OOMI-siirrosta (Fleet-raportin virhe, oikea pyörä B043367). B046739 ja B046740 ovat peruttuja tilauksia (ei statusta, `oomi_exc` 31.5.2026). Odottaa käyttäjän kuittausta inaktivoinnista.

> [!NOTE]
> **Tilanne 9.10.2026:** B046830, B046739 ja B046740 ovat yhä aktiivisia, status on tyhjä, eikä niillä ole RI-rivejä. CR- ja sopimusrivilinkit on vielä tarkistamatta.

B046830 on vahinkotilaus OOMI-siirrosta (Fleet-raportin virhe), ja oikea pyörä on B043367. B046739 ja
B046740 ovat peruttuja tilauksia (status tyhjä, `oomi_exc` 31.5.2026). Inaktivoi tai merkitse, jotta
ne eivät toistu auditoinneissa. Tarkista ensin, ettei niillä ole RI-, sopimus- tai CR-linkkejä
(30.09.: ei lokakuun RI-rivejä).

### [ ] T20 — B036939: kumpi hinta on oikea, 59,76 vai 79,68?

> [!NOTE]
> **9.10.2026:** Rivi 70263 (59,76, 1.1.2026–31.12.2029) on ainoa voimassa oleva item 30 -rivi. 70323 inaktivoitiin 30.9. Skripti 860 on SCHEDULED, mutta `scriptnote`:ssa ei ole sille yhtään riviä, joten ajoja ei voi todentaa. **Toimenpide (käyttäjä):** aseta `custrecord_sta_curr_subs_rent` = 59,76 käsin tai CSV:llä ja tarkista kuun lopussa, palauttaako jokin sen arvoon 79,68. Löydös: `findings/2026-10-09-b029420-hyvitettavat-ja-b036939.md`.

> [!NOTE]
> **Tuoteomistaja 9.10.2026:** **59,76 € on oikein:** sopimuksella kuukausivuokra on 75 € sis. ALV 25,5 % = 59,76 € netto. Rekisterin `curr_subs_rent` 79,68 on väärin. Selvitettävä, miksi `[STA] MR - Update Bike Register Fees` (860, ajastettu) ei ole korjannut sitä sopimusriviltä 70263. Korjataan joko ajolla tai CSV:llä.

> [!NOTE]
> **Tilanne 9.10.2026:** Ristiriita on yhä olemassa: rekisterissä 79,68, RI-riveillä 79402 (syyskuu) ja 143851 (lokakuu) 59,76.

R3:ssa jäljelle jäi item 30 -rivi 70263 (59,76), ja 79,68:n rivi 70323 inaktivoitiin. Rekisterin
`curr_subs_rent` on 79,68, ja syyskuun RI 79402 on 59,76. Tarkista sopimus ja korjaa se, joka on väärin,
ennen marraskuun laskua.

## 30.09.2026 (ke)

### [x] T4 — S1c: maksujen poimintakysely uudelleen — **tehty 9.10.2026**

> [!NOTE]
> **Tulos 9.10.2026:** `paid_at` on täytetty 47/47 pyörällä. Kahdeksan uutta pyörää (B001220, B014289, B020743, B023083, B026911, B031196, B040304, B045628) siirtyy T10:een.

[`docs/status-sync-2-tasmaytysajo.md`](docs/status-sync-2-tasmaytysajo.md), rivi S1c. Ennen S3:a.
Huomaa [ADR 0009](docs/adr/0009-kauden-lopun-lunastus.md) kohta 4: tapa 1 ja `liab_settled_at`
kirjataan vain, jos pyörän päättymiskuu on alkanut eikä pyörällä ole tyypin 2/10 CR:ää. Muuten
kirjataan pelkkä `paid_at`.

> [!NOTE]
> **30.09. klo 15: import ajettu, 47/47 todennettu** ([README](imports/2026-09-30-s1c-maksupaivat/README.md)).
> Poimintakysely palauttaa 8 uutta pyörää. Niiden keskenkauden Paylink-maksut ovat 29.09., eli ne
> ovat osa A:n ikkunassa eivätkä ole myöhässä näkyviä maksuja. Ne on myös lisättävä T10:een (ei
> CR:ää). B046580 ratkesi (5005 linkitetty uuteen SO:hun 30.09.). Odottaa tarkastajaa ja 1.10.
> aamun tarkistusta.
>
> *Alkuperäinen muistiinpano:* **30.09.: poiminta 47, CSV valmis, import ajamatta.** [`imports/2026-09-30-s1c-maksupaivat/`](imports/2026-09-30-s1c-maksupaivat/README.md):
> 47 riviä, `SUM(id)` 1 115 808, pelkkä `paid_at`. Mukana ovat 31 Done-CR-pyörää, 15 CR:töntä
> pyörää (päättymiskuu ei alkanut) ja B006299 (S1b, status 2). B046580 on rajattu pois: Paylink 5005
> on käsiraha, ja sen SO- ja talletuslinkit osoittavat B031057:n lunastukseen. Aja README:n
> ennakkokyselyt juuri ennen importtia. **Valmis kun** jälkitarkistukset a) ja b) palauttavat 0 ja
> poimintakysely palauttaa enää B046580:n. B003280 ja B003403 ovat kunnossa (29.09.).

### [ ] T15 — 95 status 2/3 -pyörää ilman `paid_at`:ia (erillinen tehtävä, päätetty 30.09.)

> [!NOTE]
> **Tilanne 9.10.2026:** Joukko on kasvanut: status 2/3 -pyöristä, joilla on Done-tilainen tyypin 2 CR, 575/1 908 on ilman `paid_at`:ia. Tarkista 1480:n live-ajon jälkeen, kattaako se nämä.

Löytyi T4:n yhteydessä. 95 status 2/3 -pyörällä on syyskuun maksutodiste (Paylink tai maksettu
lunastuslasku), mutta `redemption_paid_at` on tyhjä. Osa A lukee vain Active-pyöriä. Lähes kaikilla
on Done-tyypin 2 CR, ja maksu näkyi vasta käännön jälkeen. Rivit eivät vaikuta statukseen,
IC-päivään eivätkä lokakuun RI-riveihin. Erikseen katsottavat: **B038940, B043876 ja B046071** ovat
Returned-tilassa tavalla 5, ja kysely löysi niille lunastustyyppisen todisteen. Maksun tarkoitusta ei
ole todennettu tietueesta. [Returned-löydös 29.09.](findings/2026-09-29-returned-statukset.md) mainitsee
B043876:n ja arvioi, että status 3 -pyörän Paylink-maksu voi olla myös vahingonkorvaus. Lue Paylinkin
tuote ennen luokittelua,
ja **B006022**:lla on tapa 1, `liab_settled_at` 01.07. ja maksu 31.08. ilman CR:ää. Poimintakysely
on T4:n kysely, kun status on 2/3 ja maksu 1.9. jälkeen, ja tavat 6 ja 8 on rajattu pois.

### [x] T5 — S3: täydentävä IC-CSV — **vanhentunut 9.10.2026**

> [!NOTE]
> **9.10.2026:** ADR 0011 (6.10.) siirsi IC-päivät status-sync 2.0:lle (T41). Täydentävä CSV tarvitaan vain, jos 2.0 ei ole livenä ennen 29.10. IC-ajoa.

> [!NOTE]
> **6.10.2026: [ADR 0011](docs/adr/0011-ic-paiva-velvoitteista.md) muuttaa tämän säännön.** Joukkoehto on nyt *velvoitteet
> hoidettu, ei done*, ei *status 2/3, IC-myyty*. Tehtävä korvautuu status-sync 2.0:n ensimmäisellä ajolla (T41). Aja CSV
> enää vain, jos taloustiimi tarvitsee päiviä ennen sitä, ja silloin uudella ehdolla.

Sama sääntö ja sama joukkoehto kuin T2:ssa. Mukaan tulevat pyörät, jotka ovat kääntyneet T2:n
jälkeen (CR:t, maksut, T1:n kääntymättömät). **Valmis kun** sama kysely palauttaa 0 ennen
kuunvaihdetta.

> [!NOTE]
> **30.09.:** T2 tehtiin käsin 29.09. (käyttäjä, noin 1 200 pyörää taloustiimin kiireellisen tarpeen vuoksi).
> Täytön jälkeen jäljellä oli 336. Käyttäjä täytti käsin 13 pyörää, jotka vaativat ihmisen silmää,
> klo 15:54–16:13. **Jäljellä 325** ([löydös](findings/2026-09-30-t5-ic-paiva-puuttuu.md)): 280 OOMI-pyörää
> tavalla 8, 38 OOMI-pyörää tavalla 1 (14 S4-pyörää, 23 kesä–heinäkuussa kääntynyttä ja uusi B044026) ja 7 muuta.
> Tavan 8 ryhmä odottaa päätöstä (ks. *Auki*: status-sync 2.0 ja IC-päivä).

### [x] T6 — Vanha status-sync pois ajastuksesta — **tehty 6.10.2026 (käyttäjä)**

> [!WARNING]
> **6.10.2026: käyttäjä poisti 1440:n ajastuksen ennen kuin 2.0 on valmis** (päätös E6 kumottu, [ADR 0015](docs/adr/0015-status-sync-2-tarkennukset.md)).
> Siitä asti kukaan ei kirjaa maksuja, käännä statuksia eikä kirjoita IC-päiviä. 1440 ajoi viimeksi yöllä 5.→6.10.
> (`scriptnote`). Takarajat: T54.

> [!IMPORTANT]
> **Päätös E6, tuoteomistaja 30.09.2026: vanhaa ajastusta ei pysäytetä ennen kuin 2.0 on valmis.**
> `customdeploy_gbb_redemption_sync` (1440, päivittäin klo 00:30) pysyy *Scheduled*-tilassa. Vaihto tehdään
> samana päivänä: 2.0 → *Scheduled* ja vanha → *Not Scheduled*
> ([suunnitelma § Lokakuu](docs/status-sync-2-tasmaytysajo.md#lokakuu--käyttöönotto-kerralla)).

**Peruste (todennettu NetSuitesta 30.09.):** sama deployment ajaa sekä osan A että kalenterisweepin.
Rekisterissä on 1 017 Active-pyörää, joiden `subsc_end_date` on lokakuussa. Niistä 162:lla on jo tapa, ja 855:ltä
tapa puuttuu. Jälkimmäiset saavat tavan vain osan A havaitsemasta lokakuun maksusta. Jos ajastus pysähtyisi, ne jäisivät
Active-tilaan, ja 1.11. extension loisi niille tyypin 7 CR:n.

**Takaraja:** jos 2.0 ei ole valmis, vanha pysyy päällä vähintään 1.11. klo 00:30 ajon yli.
Osan A tunnetut viat hoidetaan lokakuussa T26:lla.

### [ ] T26 — Lokakuu: osan A viikkotarkistus CSV:llä, kunnes 2.0 on käytössä

> [!NOTE]
> **Tilanne 9.10.2026:** 1440 on pois ajastuksesta (export 9.10.: `NOTSCHEDULED`). 1480 ajaa vielä vain dry runia (T54), joten **varasuunnitelma 28.10. on voimassa**, kunnes T55 menee läpi.

Joka maanantai (5.10., 12.10., 19.10., 26.10.) ja 30.10.:
1. **Myöhästyneet maksut:** S1/S1c-poimintakysely
   ([löydös](findings/2026-09-23-status-sync-maksuikkuna-hukkaa-myohaiset-maksut.md)) → täydennys-CSV kuten S1b.
   Kauden lopun pyörille tapa 1 + `liab_settled_at` + `paid_at`. Keskenkauden pyörille (ADR 0008) vain `paid_at`.
2. **Ennenaikainen tapa 1:** kysely *status 1, tapa 1, ei tyypin 2/10 CR:ää Pending/Done, päättymiskuu ei alkanut*
   (T1/K4). Löydöksistä päättää tuoteomistaja.

**Valmis kun** 2.0 on käytössä tai 30.10. poiminnat palauttavat 0, jolloin 1.11. extension ei näe maksettuja Active-pyöriä.

> [!IMPORTANT]
> **7.10.: koska 1440 on pois päältä (T6), tämä on ainoa varasuunnitelma.** Jos 2.0 (T54) ei ole tuotannossa
> **28.10.**, aja kohta 1 kaikille lokakuun maksuille (ei vain myöhästyneille) sekä IC-päivät CSV:llä ADR 0011:n ehdolla
> (tapa asetettu, ei done) ennen taloustiimin IC-lunastusta 29.10.

---

## Syyskuu, käyttäjä ajaa (ADR 0010)

### [ ] T7 — `decided_at`-historia CSV:llä

> [!NOTE]
> **9.10.2026:** Importit valmiina: `imports/2026-10-09-p2-cr-luontipaivat/` (5 + 3 riviä) ja `imports/2026-09-25-decided-at-historia/01-decided-at-2026-10-09.csv` (1 750 riviä, SUM(id) täsmää). **Käyttäjä ajaa järjestyksessä P2 → T7.** P2-haussa löytyi 39 muuta CR:ää, joiden luontipäivä on taannehtiva. Tyypin 2 CR:iä niiden joukossa ei ole, joten ne eivät vaikuta T7:ään. Ne on listattu P2:n README:hen.

> [!NOTE]
> **9.10.2026:** P2 ratkaistu. CSV generoidaan uudelleen (päiväys 2026-10-09), ja kopioitujen CR:ien pyörille käytetään korjattua luontipäivää. **Ajojärjestys:** P2-import ensin, sitten T7 (käyttäjä ajaa).

> [!NOTE]
> **Tilanne 9.10.2026:** Kenttäsääntöjen § 10 -kysely palauttaa 1 750 riviä (CSV:ssä 1 735). Generoi CSV uudelleen, kun P2 on ratkaistu.

> **Odottaa P2:ta** (4 riviä, joiden CR:n luontipäivä on taannehtiva).

[`imports/2026-09-25-decided-at-historia/`](imports/2026-09-25-decided-at-historia/README.md). Noin
1 735 pyörää saa arvon `decided_at` = uusimman Done-tilaisen tyypin 2 CR:n luontipäivä. **Valmis
kun** kenttäsääntöjen § 10:n kysely *Päätöspäivä ≠ CR:n luontipäivä* palauttaa 0.

### [ ] T8 — Poikkeuspäivät `subsc_end_date`:iin CSV:llä

> [!NOTE]
> **9.10.2026:** CSV:ssä on **15** riviä (`01-subsc-end-date-2026-10-09.csv`). B040468 on jo oikein (30.6.2026), joten se jätettiin pois. Käyttäjä ajaa.

> [!NOTE]
> **9.10.2026:** Tuoteomistaja: **ajetaan.** CSV päivitetty 16 pyörälle (B046739 ja B046740 pois, inaktivoidaan T19:ssä). Käyttäjä ajaa. **Ennen T11:n koodin latausta.**

> [!NOTE]
> **Tilanne 9.10.2026:** 17/18 pyörällä `subsc_end_date` ≠ CSV:n arvo, eli importtia ei ole ajettu. **Päätettävä:** tarvitaanko korjausta, kun 2.0 ei lue poikkeuspäiviä (ADR 0015)? B046739 ja B046740 ovat ilman statusta.

[`imports/2026-09-25-poikkeuspaivat-subsc/`](imports/2026-09-25-poikkeuspaivat-subsc/README.md), **18**
pyörää (33 → 18 P1-päätöksellä 25.09.). **T1c:n jälkeen ja ennen T11:tä.** Aja README:n tarkistuskysely juuri ennen importtia. **Valmis kun**
jälkitarkistus palauttaa 0.

---

## Lokakuu 2026 (ADR 0010)

### [x] T9 — Staria-hyvitysskripti pois ajastuksesta — **tehty 9.10.2026**

> [!NOTE]
> **Tulos 9.10.2026:** Tehnyt käyttäjä. Deployment-export 9.10. klo 13:24: `customdeploy_sta_mr_mid_life_redemption` ja `customdeploy_sta_mr_mid_life_redemp_on` ovat molemmat `NOTSCHEDULED`. Viimeinen lokirivi (`scripttype = 966`) on 9.10. klo 13:01 Helsingin aikaa. **Tarkista 10.10., ettei uusia rivejä ole tullut.** B031217 käsitellään erikseen.

> **Ajankohta riippuu P3:sta.**

`customdeploy_sta_mr_mid_life_redemption` → *Not Scheduled*. Skripti ajaa 24.09. kahden tunnin
välein, eikä se osaa tehdä hyvityksiä oikein. Tyypin 11 CR on ainoa hyvityspolku. Selvitä samalla
B031217 (`sta_redemption_date` 30.11.2025, `cm_processed` F). **Valmis kun** `scriptnote` ei näytä
uusia ajoja (`scripttype = 966`).

### [ ] T10 — 19 keskenkauden maksua ilman CR:ää, yksitellen

> [!NOTE]
> **Tilanne 9.10.2026:** Pending-tilaisia tyypin 2 CR:iä on 0. T4:n kahdeksan pyörää on lisätty tähän. B036379 (maksu 14.09., ei CR:ää) kuuluu myös tähän.

Omistaja on asiakaspalvelu. Lista on [löydöksessä](findings/2026-09-24-keskenkauden-maksu-ilman-cr.md)
(A1 12 kpl, A2 7 kpl). CR:t tehdään käsin, ei importilla. Luontipäivä on todellinen luontipäivä.
Aikaisin päättyy B010162 (31.12.2026). Myös B013550, B029483, B040838 ja B041610 käsitellään
tässä: niillä on tapa 1 ilman CR:ää.

**Lisätty 30.09. (T4:n jälkeen):** B001220, B014289, B020743, B023083, B026911, B031196, B040304
(OOMI) ja B045628 (OOMI). Paylink-tuote on kaikilla *Työsuhdepyörän kesken kauden lunastus*,
maksettu 29.09., ei tyypin 2/10 CR:ää, ja ne päättyvät 06/2027–07/2028. Vanha osa A kirjoittaa
todennäköisesti tavan 1 ja `paid_at`:n yöllä 30.09./1.10. (sallittu poikkeama, Q3). Status ei käänny
ennen päättymiskuuta ilman CR:ää (tarkistettu koodista 30.09.). **Jos jollekin tehdään palautus-CR
(2D), tapa 1 on tyhjennettävä ensin**, muuten pyörä kääntyy Redeemed-tilaan Returned-tilan sijaan.

### [ ] T11 — Kirjasto: päättymisajankohta = `subsc_end_date`

> [!NOTE]
> **9.10.2026:** Agentti löysi, että `COALESCE` on **`gbb_lunastus_lib`:ssa cr-scripts-repossa** (`KENTAT.PAATTYMISAJANKOHTA`), ei monthly-reportingissa. T11 tehdään siis **cr-scripts-istunnossa yhdessä H1–H6:n kanssa** (T13). Työohjeen osio on tiedostossa `docs/monthly-reporting-korjaukset-t28-t29.md` § T11. Päivitettävät kyselyt: `docs/lunastuksen-kenttasaannot.md` rivit 31, 449, 521, 547, 560 ja 630.

> [!NOTE]
> **9.10.2026:** Tuoteomistaja: **tehdään** ennen 1.11. samassa monthly-reporting-istunnossa kuin T28 ja T29. Työohje: `docs/monthly-reporting-korjaukset-t28-t29.md` § T11. Edellytys: T8 on ajettu.

> [!NOTE]
> **Tilanne 9.10.2026:** Status-sync 2.0 lukee `subsc_end_date`:a suoraan. Monthly-reportingin `COALESCE` on ennallaan. Tehtävä rajautuu monthly-reportingiin ja riippuu T8:sta.

Vaatimus K1 [vaatimuslistassa](docs/keskenkauden-lunastus-vaatimukset.md). Tämä toteutetaan
omistavassa repossa, ja **vasta T8:n jälkeen**. Päivitä samalla tämän repon `queries/` ja
kenttäsääntöjen `COALESCE`-kyselyt.

### [x] T12 — D9: 15 Fleet-päättynyttä Active-pyörää ilman selvitystapaa — **ratkaistu 25.09., ks. T1c**

> Alla alkuperäinen kuvaus.

[ADR 0010](docs/adr/0010-keskenkauden-lunastus.md) § Avoin päätös. Tuoteomistaja päättää: OOMI:n
kauden lopun käsittely (tapa 1) vai CR? T8 kopioi niiden päivän `subsc_end_date`:iin, joten
päätös ei riipu T11:n ajoituksesta. Pyörät ovat jumissa, kunnes päätös on tehty.

### [ ] T13 — Handlerin vaatimukset H1–H6

> [!NOTE]
> **Tuoteomistajan päätökset 9.10.2026** (työohjeen avoimet kysymykset):
> - **H2b hylätty:** kopioitua luontipäivää ei tunnisteta käsittelijässä. Käsin syötettyyn päivään luotetaan.
> - H3: tyhjä nykyinen päättymispäivä sallii kirjoituksen.
> - H6: CR ylikirjoittaa myös käsin kirjatun tavan.
> - Toinen tyypin 2 CR samalle pyörälle: `decided_at` säilyy ensimmäisen CR:n arvona.
> - Status-sync 2.0 pitää myös Needs Review -tilaista tyypin 2 CR:ää keskenkauden lunastuksena. **Tämä on muutos status-sync-repoon** (`cr_2_10`-ehto: tila 6 mukaan), ja se lisätään T54:n jäännöksiin.
> - **Needs Review -jonon käsittelee tuoteomistaja itse.**

> [!NOTE]
> **9.10.2026:** Tuoteomistaja: **toteutetaan ennen 1.11.** Työohje: `docs/cr-scripts-h1-h6-tyoohje.md`. Lisäksi tuoteomistaja päättää, tunnistaako käsittelijä kopioidun (selvästi ennen `created`-päivää olevan) luontipäivän (P2-löydös).

> [!NOTE]
> **Tilanne 9.10.2026:** Repossa `netsuite-subscrption-cr-scripts` ei ole H1–H6-committeja 24.9. jälkeen.

[Vaatimuslista](docs/keskenkauden-lunastus-vaatimukset.md). Toteutetaan `netsuite-subscrption-cr-scripts`:ssä.

---

## Lokakuu 2026 — status-sync 2.0:n rakennus ([ADR 0015](docs/adr/0015-status-sync-2-tarkennukset.md))

### [ ] T54 — Rakenna ja ota käyttöön status-sync 2.0 (`netsuite-bike-redemption-status-sync`), **viimeistään 28.10.**

> [!NOTE]
> **Tilanne 9.10.2026:** **Ei valmis.** Kaikki koko kannan ajot ovat olleet `tila=dry_run`, myös ajastettu ajo 9.10. klo 00:31 Helsingin aikaa (valittu 3 763, kirjoitettu 1 921 *suunniteltuina*). Ainoat live-ajot olivat 8.10. testipyörillä. Export 9.10.: `customdeploy_gbb_mr_redemption_sync2` on `SCHEDULED` ja deployed. Parametrit eivät näy exportissa. **Toimenpide (käyttäjä): kytke deploymentin dry_run-parametri pois ennen yön ajoa.** Siihen asti mikään skripti ei kirjoita maksuja, statuksia eikä IC-päiviä (1440 pois 6.10.).
> **Käyttäjä 9.10.:** dry run on kytketty pois päältä. Ensimmäinen live-ajo on yöllä 9.→10.10. klo 00:30 (T55).
> **Lisävaatimus 9.10. (T34, K2-rajaus):** tavan 2 kattavuuteen lasketaan vain pidennys-CR:t, joiden jakso alkaa `subsc_org_end_date`:n jälkeen. *Jälkiveloitus - Poikkeus* -CR:t eivät kuulu kattavuuteen. Tarkista, toteuttaako 2.0 tämän. Jos ei, tee korjaus omistavassa repossa ennen 28.10.
> **Lisävaatimus 9.10. (T13):** `cr_2_10`-ehdon on otettava mukaan myös tila 6 (Needs Review). Tällainen keskenkauden lunastus-CR ei saa näyttää 2.0:lle kauden lopun pyörältä.

Rakennusohje: [`docs/status-sync-2-tasmaytysajo.md`](docs/status-sync-2-tasmaytysajo.md). Määritelty grilling-istunnossa
6.–7.10. Toteutetaan omistavassa repossa erillisessä istunnossa. Sisältää T40:n, T41:n ja T44:n.

> [!NOTE]
> **7.10.: koodi valmis, [PR #4](https://github.com/GobybikeFinland/netsuite-bike-redemption-status-sync/pull/4)**
> (haara `feat/status-sync-2`, kansio `gbb-redemption-sync-2/`, 61 Node-testiä läpi). Kaksi riippumatonta tarkistusta:
> APPROVE. Ehdotetut id:t `customscript_gbb_mr_redemption_sync2` / `customdeploy_gbb_mr_redemption_sync2`. Joukot 7.10.:
> M 452, V 94, O 168, J 72, S 94, I 3 150. Ensimmäinen live-ajo kirjoittaa arviolta noin 1 266 IC-päivää.
> **Jäljellä (käyttäjä):** PR:n yhdistäminen, lataus File Cabinetiin, script- ja deployment-tietueet, ohjeen § Käyttöönotto
> askeleet 3–7. Dry runissa tarkistetaan `hintakirjasto=ok` (polku, jossa on välilyöntejä ja hakasulkeita),
> `istunnon_aikavyohyke` ja yhden iltamaksun `paid_at` UI:ta vasten.

Takarajat (1440 on pois päältä 6.10. alkaen):
- **to 29.10.**: taloustiimin IC-lunastus. Lokakuussa hoidettujen IC-päivien ja hintojen on oltava valmiina.
- **1.11. klo 03:00**: extension. Ajoissa maksaneilla on oltava tapa 1. Siirrä extensionin ajastus 01:00 → 03:00
  samana päivänä, kun 2.0 ajastetaan klo 00:30.
- Jos 2.0 ei ole tuotannossa 28.10., aja varasuunnitelma T26.

**Valmis kun** ohjeen § *Todennus* -kyselyt palauttavat ensimmäisen live-ajon jälkeen 0, `scriptnote` ei näytä
`ERROR`-rivejä, IC-laskuri on ajanut, ja `CLAUDE.md`, muisti ja `schemas/script-inventory.md` kertovat uuden script-id:n.

Raportointi: status-sync 2.0:n jättämät ryhmät on lisätty T51:een (raportointiskriptin määrittely).

> [!NOTE]
> **8.10.: käytössä.** Script `customscript_gbb_mr_redemption_sync2` = **1480** (`scriptnote.scripttype`).
> Testit 8.10.: dry run 6 testipyörälle; koko kannan dry run 1 908 kirjoitusta, 0 virhettä, noin 4 min.
> Live-testit B018463 ja B037914: oikein, IC-laskuri käynnistyi, idempotenssi ok.
> Päätökset ennen ajastusta:
> - Taloustiimi hyväksyi elokuun erän 85 IC-korjausta (done = F).
> - B023943:n lunastus peruttiin (varastettu pyörä löytyi). IC-tyhjennys hyväksytty, FAM säilyttää tiedot.
> - Työnantajan maksama item 46 -käsilasku on maksutodiste (B000022, B001927; 332 pyörää).
>
> **Ajastettu 8.10., ajo joka yö klo 00:30.** Täyttä live-ajoa ei ajettu käsin, joten **yön 8.→9.10. ensimmäinen ajastettu ajo on
> täysi ajo** (noin 1 906 kirjoitusta). Tarkistus T55.

### [ ] T55 — Status-sync 2.0:n ensimmäisen ajastetun ajon tarkistus (pe 9.10.)

> [!NOTE]
> **Tilanne 9.10.2026:** **Hylätty, uusinta la 10.10.** Kohta 1 ei täyty: `tila=dry_run` (muuten `tanaan=2026-10-09`, `hintakirjasto=ok`, `virheet=0`, valittu M505 V94 O167 J72 S94 I3148). Kohtia 2–5 ei voi mitata ilman live-ajoa. Kohta 6: extension `customdeploy_gbb_sub_extension` on `NOTSCHEDULED`, ja sen viimeinen loki on 1.10. 01:02 Helsingin aikaa (ks. T61).
> **Käyttäjä 9.10.:** dry run on kytketty pois päältä. Ensimmäinen live-ajo on yöllä 9.→10.10. klo 00:30. Tarkista kohdat 1–5 la 10.10. Kohta 6 (extension 03:00) raukeaa, koska extension on pois ajastuksesta tarkoituksella (T61).

Lue `scriptnote` (`scripttype = 1480`, lokipäivä 8.10. noin klo 14:30 eli Helsingissä 9.10. klo 00:30).
**Huom.** MCP:n tuloksesta puuttuu viimeinen rivi, kun `totalResults` > `resultCount`. Hae `run complete` -rivi erikseen.

1. `selection` ja `run complete`: `tila=live`, `tanaan=2026-10-09`, `istunnon_aikavyohyke=UTC+3 (Europe/Helsinki)`,
   `hintakirjasto=ok`, `virheet=0`. Kirjoituksia noin 1 906 (8.10. dry run: `paid_at` 488, tapa 1 45, tapa 2 28,
   OOMI 167, status 2 242, IC asetettu 1 420, korjattu 85, tyhjennetty 2), lisäksi 8.10. tulleet maksut.
2. Kesto `selection` → `run complete` ≪ 2,5 h, eli valmis ennen extensionia (03:00).
3. IC-laskuri (`customscript_gbb_ic_redemption_pr`): ajo käynnistyi, `Run Complete` ja `Errors: 0`. Hinnoiteltavia noin 1 500.
4. Todennuskyselyt ([ohje § Todennus](docs/status-sync-2-tasmaytysajo.md#todennus)) palauttavat 0. Poikkeus: kvadrantti *2/3 + tuleva* voi olla 0.
5. Pistokokeet: B036864 (status tyhjä, IC 31.10.2025), B020053 ja B023943 (IC tyhjä), yksi tapa 2 (B001876,
   `liab_settled_at` 16.9.) ja yksi syyskuun OOMI (B037453, IC 30.9.).
6. Extensionin ajastus on siirretty 03:00:aan (`scriptnote` lokiaika noin 17:00 ja myöhemmin).
7. La 10.10.: 1458 on täyttänyt `date_to_non_active`:n 9.10. käännetyille.

**Valmis kun** kohdat 1–6 ovat kunnossa. Merkitse sitten T54 tehdyksi ja päivitä `CLAUDE.md` (open item 3, script-id), `schemas/script-inventory.md`
ja `docs/lunastus-tilanne.md`. Seuraavien öiden ajojen pitää olla pieniä (idempotenssi).

---

## Lokakuu 2026 — IC-lunastuksen tavoitetila ([ADR 0011](docs/adr/0011-ic-paiva-velvoitteista.md))

Määritelty 6.10.2026. Sanasto on `CONTEXT.md` § *IC-käsitteet*. Korjaukset tehdään omistavissa repoissa erillisessä istunnossa.

### [ ] T39 — Haun 797 ehdot (taloustiimi tai NetSuite-ylläpito)

> [!NOTE]
> **9.10.2026:** Siirretty T64:ään: tallennettu haku näkyy vain käyttöliittymässä (käyttäjä tai taloustiimi).

Listalle tulevat täsmälleen IC-lunastettavissa olevat pyörät: velvoitteet hoidettu (selvitystapa asetettu), `ic_redemption_dt`
asetettu, `ic_redemption_pr` asetettu (myös `-1`) ja `ic_redemption_done` ≠ T. Näkyviin hinta, IC-päivä ja done. IC-myynti,
status ja IC-päivän kuukausi eivät rajaa. **Valmis kun** haun rivimäärä = vastaava SuiteQL-määrä.

### [ ] T40 — Status-sync 2.0: IC-vaihe ADR 0011:n mukaan — **yhdistetty T54:ään 7.10.**

[Suunnitelman vaihe 3](docs/status-sync-2-tasmaytysajo.md#vaihe-3--ic-lista): kirjoitus, kun velvoitteet on hoidettu (myös status 1),
korjaus poikkeavaan päivään + hinnan tyhjennys, tyhjennys kun velvoitteet eivät enää ole hoidettu, `done` = T jäädyttää.
`summarize` käynnistää IC-laskurin (D4). Laskuriin ei tarvita muutosta (`-1` puuttuvalle kustannuslähteelle on jo koodissa).

### [ ] T41 — Käyttöönoton esiajo ja ensimmäinen ajo

> [!NOTE]
> **Tilanne 9.10.2026:** Live-ajoa ei ole vielä tullut (ks. T54).

Ensimmäinen ajo käsittelee kaikki kerralla (ADR 0011 kohta 8). **Päätetty 7.10. (ADR 0015 k. 10):** esiajon CSV:tä ei
tehdä. Dry run lokittaa suunnitellut kirjoitukset, eikä se tuota tiedostoja. Osa T54:ää.
**Valmis kun** kysely *velvoitteet hoidettu, ei done, IC-päivä ≠ `LAST_DAY(päättymisajankohta)` tai tyhjä* palauttaa 0.

### [x] T42 — Päätettävä: laskurin varmistusajastus — **päätetty 7.10.2026: ei ajastusta**

ADR 0015 k. 7: 2.0:n `summarize` käynnistää laskurin. Jos käynnistys epäonnistuu, taloustiimi ajaa laskurin käsin.
Raportointiskripti nostaa esiin pyörät, joilla on IC-päivä ilman hintaa (vaatimus R12).

`customdeploy_gbb_ic_redemption_pr` on Not Scheduled. Jos status-sync 2.0:n `N/task`-käynnistys epäonnistuu, hinta jää
laskematta eikä pyörä näy listalla (T39:n ehto). Ehdotus: päivittäinen ajo status-syncin jälkeen. Ei päätetty 6.10.

---

## Lokakuu 2026 — loppulunastushinta ja kattavuus ([ADR 0012](docs/adr/0012-loppulunastushinta-ja-kattavuus.md))

Määritelty 6.10.2026. Säännöt: [kenttäsäännöt § 11](docs/lunastuksen-kenttasaannot.md#11-loppulunastushinnan-määräytyminen-ja-kattavuus).
Korjaukset tehdään omistavissa repoissa erillisessä istunnossa.

### [x] T43 — 1479: ADR 0012:n lisäykset T37:ään (ennen 31.10.) — **valmis 13.10.2026**

> [!NOTE]
> **Valmis 13.10.2026 (tuotantoajo luettu NetSuitesta).** K2-rajaus on tuotannossa (maksulinkkirepo `9d85964`, pushattu;
> todennus `DEPLOYMENT.md`:ssä `ae738e2`). Ajo 13.10. 08:01 Helsinki: `rajattu tilaus=0 jalkiveloitus=1 cr_2_10=0 | selected=2`,
> `SENT=1 SKIP_LINKED_SO=1 unhandledMapErrors=0`. Erot odotukseen johtuvat käyttäjän käsimuutoksista 12.10., eivät koodista:
> - **B010533** (S5-pyörä, CR:t alkavat 1.9. > `org_end` 30.6.): `subsc_end_date` 31.10. → 30.11. klo 16:21, joten pyörä poistui
>   kyselyikkunasta (13.10.–16.11.). Siksi `jalkiveloitus=1` eikä 2. Rajaus koskee sitä yhä, kun marraskuun kohortti tulee ikkunaan.
> - **B011223 ja B031422:** `end_red_so_created` T → F tarkoituksella (käyttäjä: B011223:n tyypin 3 SO SOGBB0002659, 1 040 €,
>   tila B, on todennäköisesti aiheeton). B011223 sai maksulinkin (Paylink 355331/6684, 161,00 €, eräpäivä 31.10.). B031422 pysähtyi
>   tarkistukseen 4: tyypin 4 SO SOGBB0000529 (`SKIP_LINKED_SO`).
> - **Avoin löydös, ei T43:n osa:** B011223:lle luotiin 13.10. 08:56 käsin myös lasku **INVGBB1015522, 161,00 €, Kattava Oy**
>   (*Lunastus - Bike redemption*, Open). Sama lunastus on pyydetty sekä loppukäyttäjältä että yritykseltä. **Päätös 13.10.
>   (tuoteomistaja): molemmat jäävät voimaan**; jos molemmat maksetaan, ylimaksu palautetaan tapauskohtaisesti (vrt. T45).
>   Myös SOGBB0002659 on yhä auki.

> [!NOTE]
> **Tarkistus 12.10.2026 (NetSuite + maksulinkkirepon `master` c973391):**
> - **Ohitus 4 pitää — valmiusehto täyttyy.** Jokaisen ajon 9.–11.10. `selection`-rivillä on `cr_2_10=0`. 7.10. dry run
>   (813 DRY_RUN) ei valinnut kumpaakaan Active-pyörää, joka päättyy 10–11/2026 ja jolla on tyypin 2/10 CR (B011627
>   CR 6610 ja B030672 CR 6617, molemmat Done). Live-ajojen ainoat valinnat B011223 ja B031422 (`SKIP_IN_PROGRESS`)
>   ovat ilman 2/10 CR:ää.
> - **K2-rajausta ei ole vielä koodissa:** `src/gbb_mr_send_end_redemption_paylink.js:153-156` `EXCLUSIONS.jalkiveloitus`.
>   Sama vakio palvelee valintaa (`:380`), laskuria (`:389`) ja vartijaa (`:619`), joten yksi lisärivi riittää:
>   `AND cr.custrecord_cr_start_date > br.custrecord_sta_subsc_org_end_date` (sama kuin 1480:n `PIDENNYS_CR`,
>   `gbb_mr_redemption_sync2.js:142-146`). *(Toteutettu 12.10. vaihtoehtona B, ks. alla.)*
> - **Muutos ei muuta tänään yhtään valintaa.** Kaikki 614 Pending/Done-pidennys-CR:ää (383 pyörää) alkavat
>   alkuperäisen päättymispäivän jälkeen, eikä yhdeltäkään niiden pyörältä puutu `subsc_org_end_date`. Active-pyöriä, joiden
>   kaikki pidennys-CR:t osuvat alkuperäiseen kauteen, on 0. Esimerkkipyörät eivät myöskään osu nimiehtoon: B046667:n CR-5094
>   on *B046667 - Jälkiveloitus* ja B016555:n CR-6107 *Jälkiveloitus - Poikkeus*, joten kumpikaan nimi ei sisällä sanaa
>   `pidennys`. B046667 on jälkiveloituspyörä CR 6973:n (alkaa 1.10. > 30.9.) takia, joten rajaus ei muuta sitä.
>   Rajaus on suoja tulevia virhe-CR:iä vastaan. Huomio: tyhjä `subsc_org_end_date` saisi CR:n jäämään laskematta, jolloin pyörä
>   pääsisi linkkiin. Tänään sellaisia pyöriä on 0.
> - **K2 tehty 12.10.2026** (maksulinkkirepo `9d85964` + docs `12532cb`, pushattu 12.10.).
>   Toteutus poikkeaa 1480:stä tarkoituksella: tyhjä `cr_start_date` tai `subsc_org_end_date` **laskee yhä** jälkiveloitukseksi,
>   joten puuttuva päivä estää linkin eikä lähetä sitä (käyttäjän päätös 12.10.). Yllä mainittu sivuvaikutus poistui.
>   File Cabinetissa tiedosto 483438, 39 448 tavua, muokattu 12.10.
> - **Dry run todennettu NetSuitesta:** testideployment 2191, `testBikeId=46667`: `selection (DRY RUN)` `rajattu jalkiveloitus=1
>   cr_2_10=0 | selected=0`, `run complete (DRY RUN)` `unhandledMapErrors=0`. B046667 ennallaan (`link_sent` F, ei tapaa,
>   `lastmodified` 5.10., 0 Paylink-pyyntöä). Huomio: pyörä rajautui jo valinnassa, joten pyöräkohtainen vartija (`:619`) ei
>   ajanut. Se käyttää samaa vakiota, joten ehto on sama.
> - **Tuotantoajon tarkistus 13.10.: tehty, ks. ylin huomio.** (loki ~22:01 12.10. tilin aikaa = 08:01 Helsinki). Odotus `selection`-rivillä
>   `rajattu tilaus=0 jalkiveloitus=2 cr_2_10=0 | selected=2` (B011223 ja B031422 `SKIP_IN_PROGRESS`), `unhandledMapErrors=0`,
>   ei `SENT`-rivejä jälkiveloituspyörille. Kun tämä täsmää, T43 on valmis.

> [!NOTE]
> **9.10.2026:** **Ohitus 4 on jo tuotannossa** (julkaisu B 7.10., `gbb_mr_send_end_redemption_paylink.js:158-160` ja `:381`, loki `cr_2_10=`). Tarkistusagentin väite "ei näy committeissa" oli väärä.
> **Tuoteomistaja päätti: K2-rajaus tehdään ennen 31.10.** Jälkiveloitusohitukseen (`:153-156`) lisätään `AND cr.custrecord_cr_start_date > br.custrecord_sta_subsc_org_end_date`, jolloin vain alkuperäisen päättymispäivän jälkeen alkavat pidennys-CR:t tekevät pyörästä jälkiveloituspyörän (esim. B046667:n CR-5094). Toteutus maksulinkkirepon istunnossa: dry run `test_bike_id`:llä ennen latausta.
> Jäljelle jäävät: K-h-digesti → raportointinäkymään (T51), S9/S10 eheyslista → T51, `days_before` 30 → 60 myöhemmin.

> [!NOTE]
> **Tilanne 9.10.2026:** Ohitus 4 (CR 2/10) ei näy committeissa. 7.10. dry runissa `cr_2_10=0`. Takaraja 31.10.

T37:n K-a, K-b ja K-c pysyvät ennallaan. Lisäksi:
- ohitus 4: tyypin 2 tai 10 CR tilassa Pending tai Done. Nykyinen `getInputData` ei katso CR:iä lainkaan.
- K-h ratkaistu: negatiivinen summa hyvitetään kokonaan, ja hyvitys > 1 porras nostetaan digestiin tiedoksi.
- S9/S10 eivät estä linkkiä, ja ne raportoidaan eheyslistalla.
- `days_before` 30 → 60 (tavoite). Ei ennen kuin L1–L3 ovat tuotannossa.

**7.10.: [ADR 0014](docs/adr/0014-maksulinkin-korjaus-ja-yksinkertaistus.md) tarkentaa.** Ohitus 4 koskee kaikkia tiloja paitsi Cancelled, ja se tehdään valinnassa.
60 päivän ikkunan tilalle tulee julkaisussa B parametri `months_before` (1 tai 2), ja eräpäivä = `subsc_end_date`.

**Valmis kun** dry run ei valitse yhtään pyörää, jolla on tyypin 2 tai 10 CR (Pending/Done).

### [ ] T44 — Status-sync 2.0: tavan 2 kattavuus ADR 0012:n mukaan (K2) — **yhdistetty T54:ään 7.10.**

> 7.10.: ADR 0015 k. 5 muuttaa laskennan muutospyyntötasolle (Done-tilaiset pidennys-CR:t, CR:n sulkemispäivä). Alla
> alkuperäinen muotoilu.

Laskutetut, hyvittämättömät *pidennys*-CR-laskut × 63,75 € ≥ hinta − huoltohyvitys (kaava, sama kirjasto kuin 1479).
`liab_settled_at` = rajan ylittävän laskun luontipäivä. Korvaa ADR 0009 k. 5:n ja K2-ehdotuksen 29.09.
**Valmis kun** testijoukossa jokainen tapa 2 -pyörä täyttää ehdon ja yksikään täyttävä ei jää ilman tapaa.

### [x] T45 — Avoimet loppulunastustilaukset tavoilla 2–4 perutaan — **päätetty 9.10.2026**

> [!NOTE]
> **9.10.2026:** Tuoteomistaja: **ei perumista.** Avoimia loppulunastustilauksia ei peruta, vaikka velvoite olisi hoidettu tavalla 2–4. Jos asiakas maksaa, ylimääräinen maksu palautetaan tapauskohtaisesti. **Tämä muuttaa ADR 0012:n peruutussääntöä**, joten ADR päivitetään.

Tunnetut: B002668 (330899), B003264 (330894) ja B006941 (331083), tapa 3 ja avoin käsin tehty tilaus (5.10.). Peruminen tehdään käsin,
kunnes se automatisoidaan. Kysely: tapa 2, 3 tai 4 ja `customrecord_payment_requests` loppulunastustuote, `ns_status` ≠ 3 ja ei peruttu.

### [x] T46 — Tuleva: asiakaspalvelun raporttiskripti jälkiveloituspyörien avoimista tilauksista — **yhdistetty 9.10.2026**

> [!NOTE]
> **9.10.2026:** Yhdistetty T51:een (sama raportointinäkymä).

Ei määritelty. Erillinen skripti, joka käyttää samaa hintakirjastoa kuin 1479. Näyttää jokaiselle pyörälle maksettavan netto, laskutetut
*pidennys*-kuukaudet, jäljellä olevan netto ja avoimen tilauksen nykyisen netto.

---

## Lokakuu 2026 — kauppakirjan lähetys ([ADR 0013](docs/adr/0013-kauppakirjan-lahetys.md))

Määritelty 6.10.2026 tavoitetilana. Nykytila ja poikkeamat N1–N8: [löydös](findings/2026-10-06-kauppakirja-nykytila.md).
Skriptimuutoksista päätetään erikseen.

### [ ] T47 — Virheellisesti lähetetyt asiakaspalvelulle

B045683 (status 3) ja B004255 (kieltolippu T), sekä tapa 7 -pyörä (N3). Lähetettyä ei voi perua, vaan asiakaspalvelu päättää jatkosta.
**Valmis kun** asiakaspalvelu on kuitannut kaikki kolme.

### [ ] T48 — Haun 793 ehdot käyttöliittymästä

> [!NOTE]
> **9.10.2026:** Siirretty T64:ään: tallennettu haku näkyy vain käyttöliittymässä (käyttäjä).

SuiteQL ei näe tallennettuja hakuja. Kirjaa ehdot ja hintasarakkeen liitos löydökseen ja vahvista tai kumoa päätelty ketju.

### [ ] T49 — Sokea piste: 176 ei-OOMI- ja 120 OOMI-pyörää ilman kauppakirjaa (N1, N5)

Ei-OOMI: tavoitetilan mukaan nämä saavat kauppakirjan, kun vuokrat on maksettu. OOMI: vain jos työntekijän maksu löytyy.
Lisäksi 601 lähetettyä OOMI-pyörää: tarkista, onko niillä työntekijän maksu.

### [ ] T50 — Kieltolippujen syyt (N7) ja tapa 8 -pyörät (N4)

15 kieltolipulle syy asiakaspalvelulta. 96 tapa 8 -OOMI-pyörää: asiakaspalvelu korjaa selvitystavan, jos se on 5–7.

### [ ] T58 — Oomin toukokuun 2026 laskujen tuloutuskausi (taloustiimi, ennen T59:n käyttöönottoa)

> [!NOTE]
> **9.10.2026:** Lista on valmis: `findings/2026-10-09-t58-oomi-toukokuu-tuloutuskausi.csv` (332 laskua, 6 346 riviä; avoinna **12**, ei 13) ja saate (.md). Mukana yksi lisälasku **INVGBF1043393** (Oomi Oy 16.9.2026, 75 350,05 €, maksettu), joka muistuttaa laskua INVGBF1026370 (75 350,03 €). Mahdollinen kaksoislasku, kysytään taloustiimiltä (T64). Laskuilla ei ole `custbody_sta_bike_id`:tä.

[ADR 0016](docs/adr/0016-kaikki-vuokrat-maksettu.md) § Seuraukset. 331 Oomi-laskulla (päivätty 01.05. ja 07.05.2026)
`custcol_sta_so_revrec_start/end` on 2025-05, vaikka muistiossa lukee 1.5.2026–31.5.2026. Avoimia on 13. Tee lista
(lasku, asiakas, tila) ja anna se taloustiimille. **Valmis kun** yhdelläkään tuotteen 30/31/33 rivillä ei ole kautta 2025-05
laskulla, jonka päiväys on 2026.

### [ ] T59 — Lease fees check ADR 0016:n mukaan (omistava repo `netsuite-br-lease-fees-check`, erillinen istunto)

> [!NOTE]
> **9.10.2026:** Työohje on valmis: `docs/lease-fees-check-adr0016-tyoohje.md`. `custcol_sta_so_revrec_start` toimii SuiteQL-suodattimena (N/search todennetaan koeskriptillä). Tuotannossa on vain **1432 `customscript_gbb_lease_fee_check`** (SuiteQL 9.10.). Sisarrepon `_v2`-nimet eivät vastaa NetSuitea, ja tämä korjataan istunnossa. **Riski:** haun 796 ehto "päättyy alle 24 pv päästä" estää nyt kauppakirjan lähdön ennen päättymistä. Haun 793 ehdot (T48) on luettava käyttöliittymästä **ennen** kuin 796:n ehto poistetaan.

> [!NOTE]
> **9.10.2026:** Tuoteomistaja: **korjataan ennen 1.11.** Työohje laaditaan seuraavaksi. T58:n lista taloustiimille tehdään ensin.

> [!NOTE]
> **Tilanne 9.10.2026:** Repossa `netsuite-br-lease-fees-check` on 3 committia, eikä ADR 0016:n muutoksia ole tehty. Huom: 1432 (lease fee check) on `SCHEDULED` ja ajaa vanhalla logiikalla.

Vuokralaskun haku vuokrakuukaudella (`revrec_start`), viimeisin laskutettava asiakas, koko kausi `subsc_end_date`:en asti.
Ei Oomi Part A/B:tä, ei luokkaa 2 (jälkiveloitus), ei vaatimusta laskusta jokaiselle kuukaudelle. Haku 796: SO-ehto pois.
Sisarrepon §7 *Manual Override* ja dokumenttien eräpäiväväite korjataan. Varmista ensin, että `custcol_sta_so_revrec_start`
toimii `N/search`-suodattimena (tai käytä `N/query`:a). **Valmis kun** muutos on tuotannossa ja T60 on todennettu.

### [ ] T60 — Ensimmäisen ajon todennus T59:n jälkeen

Odotus löydöksen 8.10. lukujen perusteella: 131 Oomi-pyörää ja B006141 sekä B034775 saavat lipun T. Tarkista lisäksi, ettei
yksikään lippu T -pyörä ole asiakkaalla, jolla on avoin vuokralasku pyörän tarkistettavalla kaudella. Lähetysskripti (793) ei saa
lähettää ennen päättymisajankohtaa: nyt kun lippu voi tulla T:ksi jo statuksen 2 hetkellä, tarkista se ennen käyttöönottoa (ADR 0013).

---

## Lokakuu 2026 — maksulinkin korjaus ja yksinkertaistus ([ADR 0014](docs/adr/0014-maksulinkin-korjaus-ja-yksinkertaistus.md))

Päätetty 7.10.2026. Toteutus T37:n mukaan omistavassa repossa: [muutosmäärittely](docs/maksulinkki-1479-muutosspeksi.md).

### [ ] T51 — Lunastusten raportointiskriptin määrittely

> [!NOTE]
> **9.10.2026:** Tuoteomistaja: raportointi toteutetaan **cf-gbb-tools-näkymänä** (sisäiset työkalut, live-data SuiteQL:llä, Cloudflare Access). Ei sähköpostidigestiä eikä SuiteScriptiä. Vaatimukset ovat edelleen `docs/poikkeamaraportointi-vaatimukset.md`:ssä.

Erillinen skripti raportoi kaiken lunastuksiin liittyvän (ADR 0014 k. 18). Se korvaa 1479:n digestin. **Syötteenä on rekisterin
ja muiden tietueiden tila, ei skriptien loki** (tuoteomistaja 7.10.), ja se voi sisältää T46:n. Ei määritelty: omistava repo, kanavat ja rytmi.

**Lisävaatimukset 9.10. (T61, extension 2.0):** raportin on listattava (1) Active-tilaiset ei-OOMI-pyörät, joiden sopimus on päättynyt ja joille ei ole lähetetty
maksulinkkiä eikä ole jälkiveloitusketjua (lokakuussa 16 pyörää), ja (2) pyörät, joiden lunastushinta on 0 € mutta tapaa 4 ei ole kirjattu.
Extension ohittaa molemmat ryhmät, ja ne jäävät ihmisen ratkaistaviksi.
Vaatimukset tähän mennessä: (1) Active, ei OOMI, sopimus päättynyt, ei linkkiä, ei tapaa eikä jälkiveloitusta (ADR 0014 k. 17b; 7.10. neljä pyörää, kaikki keskenkauden lunastuksia: B023198, B024587, B024908, B020053). (2) Jälkiveloituspyörät, joilla ei ole lainkaan loppulunastustilausta (7.10. 14 pyörää, ks. T53).
(3) Status-sync 2.0:n jättämät ryhmät R1–R13 ja keskenkauden S1–S5: [`docs/poikkeamaraportointi-vaatimukset.md`](docs/poikkeamaraportointi-vaatimukset.md) ([ADR 0015](docs/adr/0015-status-sync-2-tarkennukset.md) k. 1).
**Valmis kun** määrittely on hyväksytty.

> [!NOTE]
> **9.10.2026, grilling-istunto:** T51 laajennettu kaikille toimialueille (poikkeamaraportointi). Sisältö on kanavasta riippumaton,
> ja sama sisältö toimii sekä cf-gbb-tools-näkymänä että sähköpostina (korvaa 9.10. aamun linjauksen *ei sähköpostia*). Raportti
> vain ilmoittaa, ei korjaa. Ei omistajia. Periaatteet P1–P14 ja tarkistusluettelon luonnos: `docs/poikkeamaraportointi-vaatimukset.md`.

### [ ] T65 — Puuttuvat ADR:t poikkeamaraportoinnin tarkistuksille

Poikkeamaraportointi tekee tarkistuksen vain kirjatusta säännöstä (P3). Näiltä toistuvilta luokilta sääntö puuttuu, ja jokaisesta
kirjoitetaan ADR ennen kuin siitä tulee tarkistus. Luettelo taustoineen: `docs/poikkeamaraportointi-vaatimukset.md` § *Odottaa ADR:ää*.

- [ ] A1 tyypin 11 hyvityslaskun rivihinta < laskutettu
- [ ] A2 OOMI-hintaerot (RI ↔ sopimusrivi, `init_subs_rent_fee`)
- [ ] A3 RI Active ja fee 0
- [ ] A4 Warning-tilaiset RI-rivit
- [ ] A5 puuttuvat RI-rivit
- [ ] A6 sopimusrivien eheys (alku > loppu, päällekkäiset item 30)
- [ ] A7 Oomin tuloutuskausi (T58)
- [ ] A8 T23 *Ended voittaa*
- [ ] A9 T24 saman pyörän useampi siirto-CR
- [ ] A10 Ended-rivin myöhässä-teksti (nyt vain T29-työohjeessa)
- [ ] A11 Ended-rivin turha palkkahuomio (nyt vain T28-työohjeessa)

**Valmis kun** jokaisesta on hyväksytty ADR ja vastaava tarkistus on lisätty luetteloon.

### [ ] T53 — 14 jälkiveloituspyörää ilman loppulunastustilausta

> [!NOTE]
> **Tilanne 9.10.2026:** Ratkeaa ADR 0012:n kattavuussäännöllä, eikä tilausta tarvita. Kaikki 14 ovat status 1, ilman tapaa ja päättyvät 31.10.
> Done-tilaisten jälkiveloitus-CR:ien määrä × 80 € (brutto) kattaa lunastushinnan **13 pyörällä**. Esimerkki B001876: 3 × 80 = 240 € ≥ noin 200 €.
> Näille status-sync 2.0:n pitäisi kirjoittaa tapa 2 ensimmäisessä live-ajossa 10.10. (joukko J). **B046667** jää vajaaksi: oikea pidennys on vain 1 kk, koska CR-5094 (elokuu) kuului alkuperäiseen vuokra-aikaan (T34-löydös 9.10.). 80 € < noin 164 €, joten se saa vielä jälkiveloituksia (T61).
> **Tarkista 10.10.:** 13 pyörällä tapa 2. Sen jälkeen T53 on valmis. B016555:llä on K2-varaus (CR-6107 laskutti sopimuskauden kuukausia).

Löydetty 7.10.: Active, ei OOMI, ei tapaa, Done-tilainen *pidennys – jälkiveloitus* -CR, päättyy 31.10.2026, eikä yhtään Paylink-tilausta tuotteella *Työsuhdepyörän loppulunastus*. 1479 ei lähetä niille linkkiä (S5), ja ADR 0012 k. 9 olettaa avoimen tilauksen, jota asiakaspalvelu päivittää. Ilman tilausta asiakas ei voi maksaa, ja pyörä voi päättyä vain kattavuudella (tapa 2). Päätettävä: luodaanko tilaus käsin vai odotetaanko tapaa 2.
B001876, B003230, B003531, B003679, B003698, B003714, B006432, B010533, B010817, B016555, B019460, B029420, B036396, B046667 (osa on T34:n ja T35:n pyöriä).

### [ ] T52 — 1479:n loki käsin jokaisen ajon jälkeen (kunnes T51 on tuotannossa)

> [!NOTE]
> **Tilanne 9.10.2026:** 1479 ei ole ajanut 7.10. jälkeen (ks. T30). 7.10. tuli kaksi RUN ABORTEDia: `months_before` oli ensin tyhjä ja sitten 3.
> **Käyttäjä 9.10.:** ajastus on päivittäin klo 8:00, `custscript_gbb_eredem_months_before` = 1 ja dry run on pois päältä. Seuraava ajo on la 10.10. klo 8:00. Lue sen `selection`- ja `run complete` -rivit.

A-julkaisu poistaa digestin. Lue jokaisen ajon jälkeen `scriptnote` (`scripttype = 1479`): `log.error`-rivit (`ERROR`, `STAMP_FAILED`, `EMAIL_FAILED`),
`NOT_PRICED`, `SKIP_*`, sekä rivit, joilla `eheys` ei ole tyhjä. Lokin säilytys on noin 30 päivää. Rakenna kysely `queries/`-kansioon A:n ensimmäisen ajon jälkeen.
**Valmis kun** T51:n tarkistus ML4 on tuotannossa (Q26, 9.10.2026).

---

## Päätettävät (tuoteomistaja)

Kirjattu 25.09.2026 ADR 0010 -session jälkeen. Kun päätös on tehty, kirjaa se tähän päivän kanssa,
vie se [ADR 0010](docs/adr/0010-keskenkauden-lunastus.md):een ja päivitä riippuva tehtävä.

### [x] P1 — D9: 15 Fleet-päättynyttä Active-pyörää ilman selvitystapaa — **päätetty 25.09.2026**

> **Päätös:** ilman CR:ää ei ole todistetta, joten pyörät raportoidaan Active-tilaisina. Jos päätös
> osoittautuu vääräksi, lokakuussa tehdään CR oikealle päivälle. Tekninen riski korjataan: T1c tyhjentää
> Fleet-päivän, T8 ei kopioi sitä, ja B044271 (päättyi 05.09.) kuuluu S4b:hen.

Pyörien `oomi_exceptional_end_date` on mennyt (13 pyörää 31.05.–31.08.2026, kaksi 30.09.2026),
mutta selvitystapa puuttuu. Sweep ei siksi käännä niitä, eikä mikään automaatio käsittele niitä.
S4 rajasi ne pois. Pyörät luetellaan [ADR 0010](docs/adr/0010-keskenkauden-lunastus.md):n kohdassa
*Avoin päätös*. B038492:n tilaustyyppi on tyhjä.

- (a) OOMI:n kauden lopun käsittely ([ADR 0009](docs/adr/0009-kauden-lopun-lunastus.md) kohta 6):
  tapa 1 ja `liab_settled_at` = tunnistuspäivä CSV:llä, kuten S4
- (b) Fleetin päättyminen on keskenkauden lunastus, jolloin jokaiselle tehdään CR yksitellen

**Riippuvuus:** T12. Pyörät ovat jumissa siihen asti, ja laskutus ja raportointi jatkuvat.

### [x] P2 — Neljä CR:ää, joiden `cr_created_date` on aiempi kuin CR:n todellinen luontihetki — **tehty 9.10.2026**

> [!NOTE]
> **Tulos 9.10.2026:** Todennettu: neljän pyörän CR:t on luotu **kopioimalla vanha CR**, ja kopio sai mukaansa lähteen `cr_created_date`:n ja nimen. Esimerkki: B012845:n CR 4545 (luotu 20.7.) on nimeltään `M56690950044 - 2C`, joka on B030338:n CR 3830:n (integraatio 15.6.) nimi. B040467–B040469 saivat päivän 25.2. integraation erästä. **Päätös:** korjataan CR:n `cr_created_date` todelliseksi luontipäiväksi (20.7./24.7.) ja B012845:n CR:ien nimet, ja `decided_at` seuraa korjattua päivää T7:ssä. Import: `imports/2026-10-09-p2-cr-luontipaivat/`. Ajetaan ennen T7:ää.

> [!NOTE]
> **Tilanne 9.10.2026:** `cr_created_date`-arvot ovat ennallaan (25.02.2026 ×3, 15.06.). T7 odottaa tätä.

B040467, B040468 ja B040469 kantavat päivää 25.02.2026, vaikka CR:t on luotu 20.–24.07.2026.
B012845:n päivä on 15.06.2026, mutta CR on luotu 20.07.2026. Kenttä on ilmeisesti asetettu käsin.
T7:n CSV kirjoittaa sääntöjen mukaan näiden päivien pohjalta taannehtivan `decided_at`:n.
Rivit on lueteltu [importin README:ssä](imports/2026-09-25-decided-at-historia/README.md).

- (a) Taannehtiva päivä kelpaa, eli CR:n kenttä on päätöspäivän lähde
- (b) Rivit poistetaan CSV:stä, ja päivä selvitetään erikseen

**Riippuvuus:** T7 odottaa tätä, tai nämä neljä riviä poistetaan ennen importtia.

### [x] P3 — Staria-hyvitysskripti pois ajastuksesta nyt vai lokakuussa — **tehty 9.10.2026**

> [!NOTE]
> **Tulos 9.10.2026:** Staria-skripti on otettu pois ajastuksesta 9.10. (ks. T9).

`customdeploy_sta_mr_mid_life_redemption` on *Scheduled* ja ajaa kahden tunnin välein. Se tekee
hyvityslaskun, jos joku asettaa `custrecord_sta_redemption_date`:n, eikä se osaa tehdä hyvityksiä
oikein. B031217:llä on käsittelemätön päivä 30.11.2025, jota ajo ei tähän asti ole ottanut
käsittelyyn.

- (a) Poisto heti. Riski katoaa, eikä poistolla ole tunnettuja haittoja
- (b) Lokakuussa, kuten T9 nyt sanoo

**Riippuvuus:** T9 siirtyy nykyhetkeen, jos valitaan (a).

---

## Pyöräkohtaiset päätökset (löydetty 28.09.2026)

Agenttien tilannekatsauksessa 28.09. löytyneet yksittäiset pyörät, joista tarvitaan päätös. Yli viiden
pyörän ryhmät eivät ole tässä (ne ovat T3:n muistiinpanossa ja listoissa [`findings/2026-09-28-tilannekatsaus/`](findings/2026-09-28-tilannekatsaus/)). Käy läpi
yksitellen: kirjaa päätös ja päivä riville ja vie se tarvittaessa CSV:hen tai CR:ksi. Kaikki luvut
todennettu NetSuitessa 28.09., syyt ovat päätelmiä ellei toisin sanota.

**Kiireelliset (ennen 29.–30.09.)**

- [x] **B044271** — *korjaantunut 9.10.2026: `exceptional_end_date` on tyhjä, status 2 / tapa 1, `paid_at` 1.10.* — `exceptional_end_date` 31.07.2026 yhä paikallaan, vaikka T1c:n piti tyhjentää se.
  `oomi_exceptional_end_date` on tyhjä. Estää pyörän osumisen S4b-poimintaan. Päätä: tyhjennys ennen T1b:tä.
- [x] **B041564** — *korjaantunut 9.10.2026: status 2 / tapa 1, `paid_at` 26.09., IC 30.09.* — S4b:n CSV:ssä, mutta kääntyi jo status 2 / tapa 1 maksun kautta. Poista rivi
  CSV:stä ennen T1b:tä ja tarkista, että maksureitin arvot ovat oikein. Selvitä samalla, mikä on toinen
  puuttuva rivi (poiminta 76, CSV 78).
- [x] **B003280** — *korjaantunut 9.10.2026: status 2 / tapa 1, `liab_settled_at` = `paid_at` 14.09., IC 30.09.* — status 1, Paylink completed 14.09., `paid_at`/tapa tyhjä, päättyy 30.09., tyypin 7
  CR:t 4743/6453. Ilman S1c:tä ennen 1.10. jälkiveloitus pidentää kuukaudella. Lisää S1c:hen (T4)?
- [x] **B003403** — *korjaantunut 9.10.2026: status 2 / tapa 1, `liab_settled_at` = `paid_at` 17.09., IC 30.09.* — sama kuin yllä: Paylink 17.09., päättyy 30.09., tyypin 7 CR:t 4745/6454.

**Status ja selvitystapa ristiriidassa**

- [x] **B045304** — *päätetty 9.10.2026: tapa 7 (vakuutustapaus), CSV `imports/2026-10-09-pyorapaatokset/`.* — — status 2 (25.09.), tapa 8 `historical_unknown`, `liab_settled_at` 31.07. D9-pyörä ja
  T1c:n testirivi: P1:n mukaan piti jäädä Active-tilaan. Palautetaanko, vai onko tapa 1 oikein?
  **Selvitetty 30.09. (käyttäjä): Fleet-raportin vakuutustapaus.** Pyörän olisi pitänyt päättyä
  31.07.2026. Korvaava pyörä on **B046829**, jonka sopimus alkoi takautuvasti 01.08.2026 (NetSuite:
  status 1, OOMI, alku 01.08.2026, luotu 17.09.2026). Status 2 ja päättyminen 31.07. ovat siis oikein, eikä
  P1:n "jää Activeksi" koske tätä pyörää. **Auki:** tapa 8 on varattu historiatiedoille (ADR 0006). Kirjaston
  mukaan vakuutustapaus on todennäköisesti tapa 7 `bike_stolen_or_destroyed`, mutta se on vahvistettava.
  IC-päivä on tyhjä (T5), ja sääntö antaa 31.07.2026.
- [x] **B017530** — **testipyörä (käyttäjä 30.09.).** Status 2, tapa 8, päättynyt 31.01.2025. Jätetään pois
  kaikista CSV-importeista ja mittareista. Sen lokakuun Warning-rivi on testiaineistoa
  ([kuukausiajon suunnitelma](docs/kuukausiajo-2026-10-suunnitelma.md)).
- [x] **B046675** — *päätetty 9.10.2026: tapa 1 ja `liab_settled_at` päättymiskuussa (ADR 0009 OOMI), CSV.* — — OOMI, status 2 (02.09.), tapa 8, `liab_settled_at` tyhjä, päättynyt 31.08.
  Tapa 1 + tunnistuspäivä (§ 9 OOMI) vai jätetäänkö ennalleen?
- [x] **B036124** — *päätetty 9.10.2026: **palautettu**: tapa 5, status 3 säilyy, CSV.* — — status 3 (Returned), mutta tapa 1 (lunastus maksettu). Kumpi on oikein?
- [x] **B037996** — *päätetty 9.10.2026: CR `2D` → tapa 5, status 3 säilyy, CSV.* — — *9.10.2026: IC-päivä 31.08. on korjattu; tyypin 2 CR 7012 Done 1.10. viittaa keskenkauden lunastukseen.* — sama kuin yllä, lisäksi IC-päivä puuttuu (T2-joukossa).
- [x] **B045683** — *päätetty 9.10.2026: CR `2D` → tapa 5, status 3 säilyy, CSV.* — — sama kuin yllä.
- [x] **B021682** — *päätetty 9.10.2026: kauden lopun lunastus (maksettu etukäteen), ei toimenpiteitä. 2.0 korjaa IC-päivän päättymiskuuhun.* — — *9.10.2026: nyt status 2; avoinna: IC 31.08. vai lokakuu, ja kauden loppu vai keskenkauden lunastus.* — status 1, mutta IC-päivä/-done asetettu. Tapa 1, `liab_settled_at` = `paid_at` 01.08.,
  päättyy 31.10.2026, ei tyypin 2/10 CR:ää. Keskenkauden lunastus ilman CR:ää vai kauden loppu?
- [x] **B023888** — *päätetty 9.10.2026: peruutus-CR 4692 → **Cancelled** (lunastus pysyy), CSV.* — — *9.10.2026: CR 4692 (tyyppi 10) yhä Pending.* — status 2, tapa 1, tyypin 10 CR Pending 28.07. alkaen (> 30 pv). Käsittely vai peruutus?

**Tapa 1 ennen päättymiskuuta (vanha osa A)**

- [x] **B039230** — *päätetty 9.10.2026: kauden lopun lunastus (maksettu 27.9., päättyy 11/2026), ei toimenpiteitä.* — — tapa 1 kirjattu 28.09. ilman `liab_settled_at`:ia, ei CR:ää. Luokittele Q3:n tapaan:
  keskenkauden (CR lokakuussa) vai kauden loppu?
- [x] **B039648** — *päätetty 9.10.2026: kauden lopun lunastus, ei toimenpiteitä.* — — sama kuin yllä.
- [x] **B040641** — *päätetty 9.10.2026: kauden lopun lunastus, ei toimenpiteitä.* — — sama kuin yllä.
- [x] **B005039** — *korjaantunut 9.10.2026: tyypin 2 CR 6806 Done 25.09., status 2 / tapa 1.* — oli 25.09. sallitun poikkeaman listalla (Q3, keskenkauden), mutta ei enää K1-kyselyssä
  28.09. Mikä muuttui (CR, tapa tyhjennetty, päättymispäivä)?

**Keskenkauden maksu ilman CR:ää, `paid_at` tyhjä**

- [x] **B024380** — *korjaantunut 9.10.2026: CR:t 7010 (tyyppi 2) ja 7011 (tyyppi 11) Done 1.10., status 2 / tapa 1.* — Paylink 14.09., päättyy 30.06.2028. Vanha osa A voi kirjoittaa tavan 1 30.09. asti.
  Lisätäänkö T10:een (CR käsin lokakuussa)?
- [x] **B036379** — *päätetty 9.10.2026: siirretty T10:een (CR käsin).* — — sama kuin yllä, päättyy 30.09.2027.

**Jälkiveloituksen kattavuus (K2, approksimaatio)**

- [ ] **B029420** — maksetut tyypin 7 laskut 185,20 € netto ≥ lunastushinta 110 €, päättyy 30.09.
  Päättyykö lunastettuna (tapa 2)?
- [x] **B031624** — *korjaantunut 9.10.2026: maksu tuli 1.10., status 2 / tapa 1.* — 185,20 € ≥ 100 €, päättyy 31.10.2026. Sama kysymys.
- [ ] **B046508** — lunastushinta 0, ehto täyttyy tyhjänä. Onko hinta oikeasti 0 vai puuttuuko se?

**Status tyhjä, sopimus alkanut**

- [x] **B004339** — *päätetty 9.10.2026: linkkien tarkistus ja inaktivointi (käyttäjä).* — — `custrecord_sta_bike_status` tyhjä. Mikä status kuuluu asettaa?
- [x] **B046739** — *päätetty 9.10.2026: T19: inaktivoidaan.* — — sama.
- [x] **B046740** — *päätetty 9.10.2026: T19: inaktivoidaan.* — — sama.
- [x] **B046741** — *päätetty 9.10.2026: linkkien tarkistus ja inaktivointi (käyttäjä).* — — sama.
- [x] **B046830** — *päätetty 9.10.2026: T19: inaktivoidaan.* — — sama.

**CR-jono**

- [x] **B028437** — *korjaantunut 9.10.2026: CR 6834 (tyyppi 7) Done 29.09.* — CR 6834 (tyyppi 7) Needs Review, luotu 28.09. Selvitä syy ennen 1.10. jälkiveloitusajoa.

## Auki, ei päivää

- **[Päätetty 9.10.2026: `redemption_date` tyhjennetään (CSV `imports/2026-10-09-pyorapaatokset/03-…`), hyvitys −116,22 € jää asiakkaalle]** **B023403 (löydetty 3.10., [löydös](findings/2026-10-03-maksulinkki-ylimaaraiset-viestit.md)):** `custrecord_sta_redemption_date` 27.11.2025 ja hyvitys CRMGBF0000552
  (−116,22 €). Pyörällä ei ole tyypin 2 CR:ää, laskutus jatkui, ja loppulunastus maksettiin 1.10. Selvitä, miksi Staria-kenttä on asetettu (CLAUDE.md:n kahden kirjoittajan varoitus).
- **[9.10.2026: siirretty T61:een]** **Jälkiveloitusketju kirjoitetaan uudelleen maksulinkin kanssa symmetriseksi (tuoteomistaja 2.10.).** *"Jos lunastushinta on 0 €,
  silloin ei tarvitse pidentää mitään."* Repon `netsuite-subscription-extension` skripti (tarkennettu 2.10.) luodaan kokonaan uudelleen, niin että se tukee maksulinkin
  (`netstuite-send-end-redemption-payment-link`) tarkoitusta. Molempien on luettava samat säännöt: hinta − huoltohyvitys (summasta), tapa
  asetettu = ei pidennystä, hinta 0 = ei pidennystä, ja kattavuus M1. Lähtökohta: [käsittelyloki](findings/2026-10-02-maksulinkki-kasittelyloki.md)
  R5–R6 ja B046508 (ainoa nykyinen tapaus).

- **[9.10.2026: V1–V6 tehty (käyttäjä vahvisti korjatut syys- ja lokakuun palkka-CSV:t). V7–V8 ovat auki]** **Alihanke: OOMI-vuokrahintojen korjaus** (aloitettu 1.10.2026, [`projects/2026-10-oomi-vuokrahinnat/`](projects/2026-10-oomi-vuokrahinnat/README.md)).
  46 pyörän sopimusrivien hinnat väärin (Fleet tuplaraportoi sopimukset), syys- ja lokakuun RI-rivit väärillä hinnoilla,
  osavuokrat laskettava. Tehtävät V1–V8 alihankkeen omassa TASKS.md:ssä. **Kiire: V6 ennen lokakuun palkka-CSV:tä.**
- ~~**D1** (taloustiimi): IC-päivä IC-myymättömille lunastetuille pyörille?~~ **Ratkaistu 6.10.2026
  ([ADR 0011](docs/adr/0011-ic-paiva-velvoitteista.md)):** kyllä, IC-myynti ei ole ehto. Laskuri antaa `-1`, ja taloustiimi päättää.
- **[9.10.2026: koodissa (vaihe 4), todennetaan 1480:n ensimmäisessä live-ajossa]** **Vaatimus status-sync 2.0:lle (käyttäjä 30.09.):** skriptin on huolehdittava, että
  `custrecord_gbb_ic_redemption_dt` on **aina täytetty, kun vastuut on hoidettu**. Kirjattu
  [suunnitelmaan](docs/status-sync-2-tasmaytysajo.md#vaihe-3--ic-lista) (D7). Tarkennettavat: ehto on
  "vastuut hoidettu" eikä "status 2/3", ja kirjasto pitää tapaa 8 hoidettuna. Silloin 280 T5:n
  tavan 8 OOMI-pyörää saisivat IC-päivän automaattisesti. **Ratkaistu 6.10.2026 (ADR 0011):** ehto on velvoitteet
  hoidettu, ja tapa 8 on mukana.
- **[9.10.2026: siirretty raportointiskriptille, ADR 0015 k. 1, seuranta T51]** **Vaatimukset S1–S3** (status-sync 2.0, [ADR 0010](docs/adr/0010-keskenkauden-lunastus.md)): Needs Review -jono, maksu ilman CR:ää, tyyppi 10 yli 30 pv.
- **[Vahvistettu 9.10.2026, T34: K2-rajaus viedään extension 2.0:aan, 1479:ään (T43) ja status-sync 2.0:aan (T54)]** **Ehdotus K2:lle (29.09., vahvistettava):** jälkiveloituksen kattavuuteen (ADR 0009 kohta 5)
  lasketaan vain laskurivit, joiden kausi on alkuperäisen loppupäivän (`subsc_org_end_date`) jälkeen.
  Esimerkki B016555: tyypin 7 CR-6107 laskutti kuukaudet 5–8/2026, jotka kuuluivat vielä
  sopimuskauteen. Ilman rajausta kattavuus olisi täyttynyt väärin (274,89 ≥ 84).
- **[Toteutettu, 9.10.2026: 2.0 lukee vain `subsc_end_date`:a, ADR 0015 k. 3]** **Vaatimus K3:lle ja status-sync 2.0:lle (25.09.):** OOMI-haara ei saa lukea
  `oomi_exceptional_end_date`:a. Päättymisajankohta on `subsc_end_date` (ADR 0010 kohta 8, D9). Jos
  2.0 otetaan käyttöön ennen T11:tä, sen on luettava `subsc_end_date` suoraan.
- **[9.10.2026: K1 = T11 (cr-scripts-kirjasto, ennen 1.11.), K2 = K2-rajaus (T34), K3 toteutettu (2.0 lukee vain `subsc_end_date`:a)]** **K1–K3** (status-sync 2.0): maksuvaiheen kuukausiehto, jälkiveloituksen kattavuus ja OOMI-haara
  ([ADR 0009](docs/adr/0009-kauden-lopun-lunastus.md)). Nämä toteutetaan omistavassa repossa, ei
  täällä.
