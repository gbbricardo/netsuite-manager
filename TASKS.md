# TASKS

Päivätyt työtehtävät. Tämä on **tehtävälista**: mitä tehdään ja milloin. Tilannekuva ja mittarit
ovat [`docs/lunastus-tilanne.md`](docs/lunastus-tilanne.md):ssä ja säännöt
[`docs/lunastuksen-kenttasaannot.md`](docs/lunastuksen-kenttasaannot.md):ssä.

Kun tehtävä on tehty, merkitse se `[x]`, kirjaa päivä ja tulos, ja päivitä tilannedokumentti.
Poista tehtävä vasta kun se on ollut tehtynä viikon.

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

### [ ] T1c — D9: Fleet-päivä pois 15 pyörältä (käyttäjä ajaa, **ennen T1b:tä ja T8:aa**)

P1 päätetty 25.09. Ilman CR:ää ei ole todistetta ennenaikaisesta päättymisestä, joten pyörät
raportoidaan lokakuussa Active-tilaisina. Jos päätös on väärä, lokakuussa tehdään CR.
[`imports/2026-09-25-d9-fleet-paiva-pois/`](imports/2026-09-25-d9-fleet-paiva-pois/README.md): ensin
testirivi B045304, sitten 14 riviä, asetuksena *Overwrite Missing Fields*. `SUM(id)` 629 149.
**Valmis kun** README:n jälkitarkistus palauttaa 0.

> [!WARNING]
> **Aja jälkitarkistus jokaisen maanantain Fleet-importin jälkeen (ensimmäinen 28.09.)**, kunnes
> T11 on tuotannossa. Fleet-CSV voi kirjoittaa päivän takaisin.

### [ ] T1b — S4b: syyskuussa päättyneet OOMI-pyörät (käyttäjä ajaa, viimeistään 29.09., T1c:n jälkeen)

Löytyi 25.09. T1:n jälkeen. 77 syyskuussa päättyvää OOMI-pyörää on status 1 ilman selvitystapaa.
Ilman korjausta RI-luonti tekisi niille lokakuun Active-rivin. Tuoteomistaja vahvisti 25.09., että
ne käsitellään CSV:llä ADR 0009:n kohdan 6 mukaan.
[`imports/2026-09-25-oomi-syyskuu/`](imports/2026-09-25-oomi-syyskuu/README.md), 78 riviä
(77 + B044271 T1c:n perusteella), `SUM(id)` 3 311 692. Aja README:n tarkistuskysely juuri ennen importtia, ja vaihda
`loppuvastuut_hoidettu` ajopäiväksi. **Valmis kun** seuraavana aamuna kaikki 78 ovat status 2.
Tämän jälkeen T5 (S3) antaa niille IC-päivän 30.09.2026.

### [ ] T2 — S2: IC-päivät CSV:llä

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

### [ ] T3 — K4:n uusintatarkistus (B029495)

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

1.10. klo 13:09 Helsingin aikaa jälkeen `scriptnote`:ssa ei ole yhtään ajoa (tilanne 2.10. klo 10:09). Repon päätös on
"päivittäin klo 08:00". Selvitä, onko kellonaika Helsingin vai runtime-aikaa, ja todenna ensimmäinen valvomaton ajo
(`scripttype = 1479`, rivit `selection` ja `run complete`). **Valmis kun** lokissa näkyy kaksi peräkkäistä ajastettua ajoa.

### [ ] T31 — Kuusi liian pientä maksulinkkiä (yhteensä noin 720 €, K)

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

### [ ] T32 — Neljä virheellistä tapa 3 -kirjausta (perimättä noin 598 €, K)

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

### [ ] T33 — Tapa 4 hinnasta 0 €

**Selvitetty 2.10.** ([käsittelyloki](findings/2026-10-02-maksulinkki-kasittelyloki.md) R5, R6): molemmat ovat ITSEHANKINTA-pyöriä. Niillä hinta 0 on
tuotteen normaali (269/405, käsiraha Paylinkissä 223:lla), joten tapa 4 on oikein. **Vahvistettava.** B046508:n jälkiveloitus (2 × 120 € Storia Oy +
2 RI-riviä) on silloin aiheeton (R6: extension ei tarkista hintaa 0), ja se puretaan.

Skripti tulkitsee tallennetun hinnan 0 € käsirahaksi, eikä mikään automaatio ylläpidä hintaa (repon oma tekninen velka).

- [ ] **B046508** — tapa 4 1.10., status 2. Done-tilaiset tyypin 7 CR:t 6513 ja 6972, `org_end` 31.08. Pyöräkohtainen kysymys
  *"onko hinta oikeasti 0 vai puuttuuko se?"* on auki (*Jälkiveloituksen kattavuus*). Jos hinta puuttuu, tapa 4 on väärin
  ja jälkiveloitus on pysähtynyt.
- [ ] **B046755** — tapa 4 1.10., status 2. Ei CR:iä eikä SO:ta, päättyy 31.10. Todenna käsiraha sopimuksesta tai myyntitilauksesta.

### [ ] T34 — NOT_PRICED: poikkeavat pyörät

- [ ] **B010533** — huoltosumma 265,93 € edellyttää 5 kk pidennystä. Pidennys on 4 kk = 2 kk huoltoa (2 pidennysriviä) + 2
  jälkiveloitus-CR:ää. Puuttuuko huoltopidennyksestä 3 kk (`sta_ue_bike_register_hook`), vai onko summa väärin? Hinta 49 €.
- [ ] **B046667** — pidennys 1 kk, mutta Done-tilaisia tyypin 7 CR:iä on 2, ja huoltosumma on tyhjä. Onko toinen CR tupla, vai puuttuuko päivän siirto?
- [ ] **B016555** — pidennys 2 kk, Done-tilaisia tyypin 7 CR:iä 3 (Fortaco, T1d, CR-6488 korjattu). Täsmääkö laskutus pidennykseen?
- [ ] **B029420** — 5 kk jälkiveloitusta, hinta 110 €, kattavuuslistalla 185,20 € ≥ 110 €. Päättyykö tavalla 2 (K2)?
- [ ] **B015132** — NOT_PRICED 1.10., nyt status 2 tapa 1. Mikä maksu kirjattiin ja millä summalla, kun linkkiä ei lähetetty?

### [ ] T35 — Ohitetut pyörät, joilla on vanha SO (ei linkkiä eikä omistajaa)

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

### [ ] T36 — 64 jälkiveloituspyörää ilman huoltoa (NOT_PRICED joka päivä)

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

### [ ] T37 — Skriptikorjaukset ennen 31.10. (omistava repo `netstuite-send-end-redemption-payment-link`)

Tehdään repon omassa istunnossa sen sääntöjen mukaan. Tuoteomistaja päättää jokaisesta kohdasta. Testaus: dry run ja `test_bike_id`.

**Määrittely 5.10.: [logiikkavirheet ja tavoitetila](findings/2026-10-05-maksulinkki-logiikkavirheet-ja-tavoitetila.md)**: tavoitekaava, skenaariot S1–S13,
korjauskohdat L1–L8 ja hyväksymiskriteerit. Korjaukset toteutetaan tämän mukaan.

**Lähtöaineisto 3.10.:** [hintapoikkeamat](findings/2026-10-03-maksulinkki-hintapoikkeamat.md) (kaikki 748 linkkiä sääntöä 1 vasten, logiikkavirheet L1–L8,
marraskuun simulointi) ja [ylimääräiset viestit](findings/2026-10-03-maksulinkki-ylimaaraiset-viestit.md) (7 pyörää). Uusi virheluokka L2: negatiivinen
huoltosumma ilman pidennystä ei hyvity (3 linkkiä lokakuussa, 3 marraskuussa). **Päätetty 5.10.: negatiivinen summa vähennetään kokonaan** (126 aktiivista,
42:lla alle −64,53). Hyvitys = (summan bracketin yläraja tai 0) − summa.

- [ ] **K-a Pidennyksen ankkuri — päätetty 2.10.: hyvitys lasketaan `custrecord_sta_maintenance_sum`:sta** (bracket summasta, ei pidennyksestä; muu 14.9. kaava ennallaan) (`gbb_mr_send_end_redemption_paylink.js:359-365, 477-492`). Jälkiveloituskuukaudet eivät saa kasvattaa
  huoltohyvitystä. Vähennä Done-tilaisten *pidennys – jälkiveloitus* -CR:ien määrä `extension_months`:ista, tai laske huoltopidennys
  pidennysrivien kausista. Testitapaukset: T31 ja T32, joiden lasketut hinnat on toistettava.
- [ ] **K-b0 `link_sent`-täyttö (päätös 2.10., R3).** Merkitse `custrecord_gbb_eredem_link_sent = T` jokaiselle pyörälle, joka sai linkin manuaaliprosessissa.
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

### [ ] T14 — Kuukausiajo 1.10. ilman vääriä rivejä

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

**Kun lokakuun raportit on lähetetty.** Korjaus tehdään `netsuite-monthly-reporting`-repossa erillisessä istunnossa.
`mr_monthly_reporting_ri_update.js:953-957` liputtaa jokaisen kesken kuuta päättyneen Ended-rivin. 1.10. liputettiin
202 väärin, ja ne korjattiin käsin. Konsernisiirtojen Active/New-huomio jää ennalleen (tuoteomistaja 1.10.).
**Valmis kun** korjaus on tuotannossa ja testattu löydöksen testirivien perusteella. Jos sitä ei ehditä
1.11. mennessä, marraskuun ajossa tehdään sama import.

### [ ] T29 — Jälkiveloituksen teksti (C3 + C4) jää Ended-riville ([löydös](findings/2026-10-01-turhat-ri-huomiot-kehitys.md) § Virhe 2)

**Kun lokakuun raportit on lähetetty.** Korjaus tehdään `netsuite-monthly-reporting`-repossa erillisessä istunnossa.
*"… Pyörän lunastus on myöhässä. Vuokralaskutus ja pyöräedun käsittely palkoissa jatkuu …"* jäi 32 lokakuun
Ended-riville (`ue_reporting_item_late_redemption_prolongation.js:281-290`), ja rivit korjattiin käsin.
**Valmis kun** Ended-rivit eivät enää kanna tekstiä, ja Active-jälkiveloitusrivit säilyttävät sen.
Tarkistetaan 1.11. ajossa.

### [ ] T21 — Rekisteri-id 41345: työnantaja rekisterissä ≠ sopimusrivit (ri_creation-Warning 1.10.)

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

### [ ] T25 — Verovapaus T siirron jälkeen: 31 rekisteriä ja 14 lokakuun RI-riviä ([löydös](findings/2026-09-30-verovapaus-siirroissa.md))

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

### [ ] T24 — 1196 käsittelee saman pyörän CR:t ilman järjestystä

Päätelty koodista: `cr_bike_register_updater.js:73-82` hakee tyypin 1/9 Done-CR:t, joiden `start_date` on seuraavan kuun 1. päivä,
ilman `ORDER BY`-ehtoa. Kun samalla pyörällä on kaksi CR:ää samalla alkupäivällä, viimeksi kirjoitettu voittaa. Järjestys on siis sattumaa.
B026614:llä (T22) järjestys osui oikein. Käänteisenä rekisteriin olisi jäänyt Wärtsilä Finland Oy.
Korjaus kuuluu `netsuite-subscrption-cr-scripts`-repoon: `ORDER BY custrecord_cr_created_date, id` tai Needs Review,
jos samalla pyörällä on useampi CR. Ennen jokaista kuunvaihdetta tarkista kysely: tyypin 1/9 Done-CR:t, joilla on sama pyörä ja sama
`start_date` = seuraavan kuun 1. päivä.

### [ ] T23 — Kaksi muutosta samassa kuussa tuottaa tuplarivin (juurisyy, 8893)

Kun samalle pyörälle tulee samassa kuussa pidennys ja ennenaikainen lunastus, lokakuulle syntyy
samalle työnantajalle sekä Active- että Ended-rivi, ja ri_update D11 (`mr_monthly_reporting_ri_update.js:1110-1156`)
demotoi Active-rivin Warningiksi. Selvitä, kumpi UE-polku jättää vanhan rivin, ja kirjaa korjaus
`netsuite-monthly-reporting`-repoon. Sitä ennen tarkista käsin kuukausiajon edellä pyörät, joilla on samassa kuussa
Done-CR:t tyypeille 7 (pidennys) ja 2.

### [ ] T16 — B044504 ja B044271: asiakaspalvelun CR (lokakuu)

Molemmat odottavat CR:ää. B044504: molemmat poikkeuspäivät tyhjennetty 30.09. (todennettu, `subsc_end` 1.4.2027). B044271: status 1, `subsc_end` 5.9.2026, ei tapaa.

### [ ] T17 — Välikuukaudet sopimuksen loppuun: raportoinnin käsittely suunniteltava (B016051)

Järjestelmä ei tue tätä. Välikuukaudet laskutetaan sopimuksen loppuun (31.12.2026), joten vuokrarivi
72784 on tyhjä kausi (1.1.2027–31.12.2026). RI-rivi 1269 (Paused) muutetaan Endediksi, jos lunastusmaksu
maksetaan 12/2026. Muuten raportointi jatkuu, kunnes maksu tai velvoitteet on katettu. Tarkista
B016051 joulukuussa, ja suunnittele yleinen sääntö ennen seuraavaa vastaavaa tapausta.

### [ ] T18 — OOMI RI-rivi fee 0: selvitä syy ([löydös](findings/2026-09-30-oomi-ri-rivi-fee-nolla.md))

Rivit 116352–116356 luotiin 18.09. klo 14:32, fee 0, ilman automaatiolokia. Selvitä luoja ja
korjaa koodipolku niin, että puuttuva hinta tuottaa Warningin eikä 0:aa (omistava repo:
`netsuite-monthly-reporting`).

### [ ] T19 — Siivoa pyörärekisteristä vahinko- ja peruttujen tilausten tietueet

B046830 on vahinkotilaus OOMI-siirrosta (Fleet-raportin virhe), ja oikea pyörä on B043367. B046739 ja
B046740 ovat peruttuja tilauksia (status tyhjä, `oomi_exc` 31.5.2026). Inaktivoi tai merkitse, jotta
ne eivät toistu auditoinneissa. Tarkista ensin, ettei niillä ole RI-, sopimus- tai CR-linkkejä
(30.09.: ei lokakuun RI-rivejä).

### [ ] T20 — B036939: kumpi hinta on oikea, 59,76 vai 79,68?

R3:ssa jäljelle jäi item 30 -rivi 70263 (59,76), ja 79,68:n rivi 70323 inaktivoitiin. Rekisterin
`curr_subs_rent` on 79,68, ja syyskuun RI 79402 on 59,76. Tarkista sopimus ja korjaa se, joka on väärin,
ennen marraskuun laskua.

## 30.09.2026 (ke)

### [ ] T4 — S1c: maksujen poimintakysely uudelleen

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

### [ ] T5 — S3: täydentävä IC-CSV

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

### [ ] T6 — Vanha status-sync pois ajastuksesta — siirretty status-sync 2.0:n käyttöönottoon

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

Joka maanantai (5.10., 12.10., 19.10., 26.10.) ja 30.10.:
1. **Myöhästyneet maksut:** S1/S1c-poimintakysely
   ([löydös](findings/2026-09-23-status-sync-maksuikkuna-hukkaa-myohaiset-maksut.md)) → täydennys-CSV kuten S1b.
   Kauden lopun pyörille tapa 1 + `liab_settled_at` + `paid_at`. Keskenkauden pyörille (ADR 0008) vain `paid_at`.
2. **Ennenaikainen tapa 1:** kysely *status 1, tapa 1, ei tyypin 2/10 CR:ää Pending/Done, päättymiskuu ei alkanut*
   (T1/K4). Löydöksistä päättää tuoteomistaja.

**Valmis kun** 2.0 on käytössä tai 30.10. poiminnat palauttavat 0, jolloin 1.11. extension ei näe maksettuja Active-pyöriä.

---

## Syyskuu, käyttäjä ajaa (ADR 0010)

### [ ] T7 — `decided_at`-historia CSV:llä

> **Odottaa P2:ta** (4 riviä, joiden CR:n luontipäivä on taannehtiva).

[`imports/2026-09-25-decided-at-historia/`](imports/2026-09-25-decided-at-historia/README.md). Noin
1 735 pyörää saa arvon `decided_at` = uusimman Done-tilaisen tyypin 2 CR:n luontipäivä. **Valmis
kun** kenttäsääntöjen § 10:n kysely *Päätöspäivä ≠ CR:n luontipäivä* palauttaa 0.

### [ ] T8 — Poikkeuspäivät `subsc_end_date`:iin CSV:llä

[`imports/2026-09-25-poikkeuspaivat-subsc/`](imports/2026-09-25-poikkeuspaivat-subsc/README.md), **18**
pyörää (33 → 18 P1-päätöksellä 25.09.). **T1c:n jälkeen ja ennen T11:tä.** Aja README:n tarkistuskysely juuri ennen importtia. **Valmis kun**
jälkitarkistus palauttaa 0.

---

## Lokakuu 2026 (ADR 0010)

### [ ] T9 — Staria-hyvitysskripti pois ajastuksesta

> **Ajankohta riippuu P3:sta.**

`customdeploy_sta_mr_mid_life_redemption` → *Not Scheduled*. Skripti ajaa 24.09. kahden tunnin
välein, eikä se osaa tehdä hyvityksiä oikein. Tyypin 11 CR on ainoa hyvityspolku. Selvitä samalla
B031217 (`sta_redemption_date` 30.11.2025, `cm_processed` F). **Valmis kun** `scriptnote` ei näytä
uusia ajoja (`scripttype = 966`).

### [ ] T10 — 19 keskenkauden maksua ilman CR:ää, yksitellen

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

Vaatimus K1 [vaatimuslistassa](docs/keskenkauden-lunastus-vaatimukset.md). Tämä toteutetaan
omistavassa repossa, ja **vasta T8:n jälkeen**. Päivitä samalla tämän repon `queries/` ja
kenttäsääntöjen `COALESCE`-kyselyt.

### [x] T12 — D9: 15 Fleet-päättynyttä Active-pyörää ilman selvitystapaa — **ratkaistu 25.09., ks. T1c**

> Alla alkuperäinen kuvaus.

[ADR 0010](docs/adr/0010-keskenkauden-lunastus.md) § Avoin päätös. Tuoteomistaja päättää: OOMI:n
kauden lopun käsittely (tapa 1) vai CR? T8 kopioi niiden päivän `subsc_end_date`:iin, joten
päätös ei riipu T11:n ajoituksesta. Pyörät ovat jumissa, kunnes päätös on tehty.

### [ ] T13 — Handlerin vaatimukset H1–H6

[Vaatimuslista](docs/keskenkauden-lunastus-vaatimukset.md). Toteutetaan `netsuite-subscrption-cr-scripts`:ssä.

---

## Lokakuu 2026 — IC-lunastuksen tavoitetila ([ADR 0011](docs/adr/0011-ic-paiva-velvoitteista.md))

Määritelty 6.10.2026. Sanasto on `CONTEXT.md` § *IC-käsitteet*. Korjaukset tehdään omistavissa repoissa erillisessä istunnossa.

### [ ] T39 — Haun 797 ehdot (taloustiimi tai NetSuite-ylläpito)

Listalle tulevat täsmälleen IC-lunastettavissa olevat pyörät: velvoitteet hoidettu (selvitystapa asetettu), `ic_redemption_dt`
asetettu, `ic_redemption_pr` asetettu (myös `-1`) ja `ic_redemption_done` ≠ T. Näkyviin hinta, IC-päivä ja done. IC-myynti,
status ja IC-päivän kuukausi eivät rajaa. **Valmis kun** haun rivimäärä = vastaava SuiteQL-määrä.

### [ ] T40 — Status-sync 2.0: IC-vaihe ADR 0011:n mukaan (`netsuite-bike-redemption-status-sync`)

[Suunnitelman vaihe 3](docs/status-sync-2-tasmaytysajo.md#vaihe-3--ic-lista): kirjoitus, kun velvoitteet on hoidettu (myös status 1),
korjaus poikkeavaan päivään + hinnan tyhjennys, tyhjennys kun velvoitteet eivät enää ole hoidettu, `done` = T jäädyttää.
`summarize` käynnistää IC-laskurin (D4). Laskuriin ei tarvita muutosta (`-1` puuttuvalle kustannuslähteelle on jo koodissa).

### [ ] T41 — Käyttöönoton esiajo ja ensimmäinen ajo

Ensimmäinen ajo käsittelee kaikki kerralla (ADR 0011 kohta 8). **Avoin, käyttäjä ei päättänyt 6.10.:** toimitetaanko
taloustiimille esiajon CSV (uudet listalle tulijat + muuttuvat IC-päivät ja tyhjennettävät hinnat) ennen ajoa.
**Valmis kun** kysely *velvoitteet hoidettu, ei done, IC-päivä ≠ `LAST_DAY(päättymisajankohta)` tai tyhjä* palauttaa 0.

### [ ] T42 — Päätettävä: laskurin varmistusajastus

`customdeploy_gbb_ic_redemption_pr` on Not Scheduled. Jos status-sync 2.0:n `N/task`-käynnistys epäonnistuu, hinta jää
laskematta eikä pyörä näy listalla (T39:n ehto). Ehdotus: päivittäinen ajo status-syncin jälkeen. Ei päätetty 6.10.

---

## Lokakuu 2026 — loppulunastushinta ja kattavuus ([ADR 0012](docs/adr/0012-loppulunastushinta-ja-kattavuus.md))

Määritelty 6.10.2026. Säännöt: [kenttäsäännöt § 11](docs/lunastuksen-kenttasaannot.md#11-loppulunastushinnan-määräytyminen-ja-kattavuus).
Korjaukset tehdään omistavissa repoissa erillisessä istunnossa.

### [ ] T43 — 1479: ADR 0012:n lisäykset T37:ään (ennen 31.10.)

T37:n K-a, K-b ja K-c pysyvät ennallaan. Lisäksi:
- ohitus 4: tyypin 2 tai 10 CR tilassa Pending tai Done. Nykyinen `getInputData` ei katso CR:iä lainkaan.
- K-h ratkaistu: negatiivinen summa hyvitetään kokonaan, ja hyvitys > 1 porras nostetaan digestiin tiedoksi.
- S9/S10 eivät estä linkkiä, ja ne raportoidaan eheyslistalla.
- `days_before` 30 → 60 (tavoite). Ei ennen kuin L1–L3 ovat tuotannossa.

**Valmis kun** dry run ei valitse yhtään pyörää, jolla on tyypin 2 tai 10 CR (Pending/Done).

### [ ] T44 — Status-sync 2.0: tavan 2 kattavuus ADR 0012:n mukaan (K2)

Laskutetut, hyvittämättömät *pidennys*-CR-laskut × 63,75 € ≥ hinta − huoltohyvitys (kaava, sama kirjasto kuin 1479).
`liab_settled_at` = rajan ylittävän laskun luontipäivä. Korvaa ADR 0009 k. 5:n ja K2-ehdotuksen 29.09.
**Valmis kun** testijoukossa jokainen tapa 2 -pyörä täyttää ehdon ja yksikään täyttävä ei jää ilman tapaa.

### [ ] T45 — Avoimet loppulunastustilaukset tavoilla 2–4 perutaan

Tunnetut: B002668 (330899), B003264 (330894) ja B006941 (331083), tapa 3 ja avoin käsin tehty tilaus (5.10.). Peruminen tehdään käsin,
kunnes se automatisoidaan. Kysely: tapa 2, 3 tai 4 ja `customrecord_payment_requests` loppulunastustuote, `ns_status` ≠ 3 ja ei peruttu.

### [ ] T46 — Tuleva: asiakaspalvelun raporttiskripti jälkiveloituspyörien avoimista tilauksista

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

SuiteQL ei näe tallennettuja hakuja. Kirjaa ehdot ja hintasarakkeen liitos löydökseen ja vahvista tai kumoa päätelty ketju.

### [ ] T49 — Sokea piste: 176 ei-OOMI- ja 120 OOMI-pyörää ilman kauppakirjaa (N1, N5)

Ei-OOMI: tavoitetilan mukaan nämä saavat kauppakirjan, kun vuokrat on maksettu. OOMI: vain jos työntekijän maksu löytyy.
Lisäksi 601 lähetettyä OOMI-pyörää: tarkista, onko niillä työntekijän maksu.

### [ ] T50 — Kieltolippujen syyt (N7) ja tapa 8 -pyörät (N4)

15 kieltolipulle syy asiakaspalvelulta. 96 tapa 8 -OOMI-pyörää: asiakaspalvelu korjaa selvitystavan, jos se on 5–7.

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

### [ ] P2 — Neljä CR:ää, joiden `cr_created_date` on aiempi kuin CR:n todellinen luontihetki

B040467, B040468 ja B040469 kantavat päivää 25.02.2026, vaikka CR:t on luotu 20.–24.07.2026.
B012845:n päivä on 15.06.2026, mutta CR on luotu 20.07.2026. Kenttä on ilmeisesti asetettu käsin.
T7:n CSV kirjoittaa sääntöjen mukaan näiden päivien pohjalta taannehtivan `decided_at`:n.
Rivit on lueteltu [importin README:ssä](imports/2026-09-25-decided-at-historia/README.md).

- (a) Taannehtiva päivä kelpaa, eli CR:n kenttä on päätöspäivän lähde
- (b) Rivit poistetaan CSV:stä, ja päivä selvitetään erikseen

**Riippuvuus:** T7 odottaa tätä, tai nämä neljä riviä poistetaan ennen importtia.

### [ ] P3 — Staria-hyvitysskripti pois ajastuksesta nyt vai lokakuussa

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

- [ ] **B044271** — `exceptional_end_date` 31.07.2026 yhä paikallaan, vaikka T1c:n piti tyhjentää se.
  `oomi_exceptional_end_date` on tyhjä. Estää pyörän osumisen S4b-poimintaan. Päätä: tyhjennys ennen T1b:tä.
- [ ] **B041564** — S4b:n CSV:ssä, mutta kääntyi jo status 2 / tapa 1 maksun kautta. Poista rivi
  CSV:stä ennen T1b:tä ja tarkista, että maksureitin arvot ovat oikein. Selvitä samalla, mikä on toinen
  puuttuva rivi (poiminta 76, CSV 78).
- [ ] **B003280** — status 1, Paylink completed 14.09., `paid_at`/tapa tyhjä, päättyy 30.09., tyypin 7
  CR:t 4743/6453. Ilman S1c:tä ennen 1.10. jälkiveloitus pidentää kuukaudella. Lisää S1c:hen (T4)?
- [ ] **B003403** — sama kuin yllä: Paylink 17.09., päättyy 30.09., tyypin 7 CR:t 4745/6454.

**Status ja selvitystapa ristiriidassa**

- [ ] **B045304** — status 2 (25.09.), tapa 8 `historical_unknown`, `liab_settled_at` 31.07. D9-pyörä ja
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
- [ ] **B046675** — OOMI, status 2 (02.09.), tapa 8, `liab_settled_at` tyhjä, päättynyt 31.08.
  Tapa 1 + tunnistuspäivä (§ 9 OOMI) vai jätetäänkö ennalleen?
- [ ] **B036124** — status 3 (Returned), mutta tapa 1 (lunastus maksettu). Kumpi on oikein?
- [ ] **B037996** — sama kuin yllä, lisäksi IC-päivä puuttuu (T2-joukossa).
- [ ] **B045683** — sama kuin yllä.
- [ ] **B021682** — status 1, mutta IC-päivä/-done asetettu. Tapa 1, `liab_settled_at` = `paid_at` 01.08.,
  päättyy 31.10.2026, ei tyypin 2/10 CR:ää. Keskenkauden lunastus ilman CR:ää vai kauden loppu?
- [ ] **B023888** — status 2, tapa 1, tyypin 10 CR Pending 28.07. alkaen (> 30 pv). Käsittely vai peruutus?

**Tapa 1 ennen päättymiskuuta (vanha osa A)**

- [ ] **B039230** — tapa 1 kirjattu 28.09. ilman `liab_settled_at`:ia, ei CR:ää. Luokittele Q3:n tapaan:
  keskenkauden (CR lokakuussa) vai kauden loppu?
- [ ] **B039648** — sama kuin yllä.
- [ ] **B040641** — sama kuin yllä.
- [ ] **B005039** — oli 25.09. sallitun poikkeaman listalla (Q3, keskenkauden), mutta ei enää K1-kyselyssä
  28.09. Mikä muuttui (CR, tapa tyhjennetty, päättymispäivä)?

**Keskenkauden maksu ilman CR:ää, `paid_at` tyhjä**

- [ ] **B024380** — Paylink 14.09., päättyy 30.06.2028. Vanha osa A voi kirjoittaa tavan 1 30.09. asti.
  Lisätäänkö T10:een (CR käsin lokakuussa)?
- [ ] **B036379** — sama kuin yllä, päättyy 30.09.2027.

**Jälkiveloituksen kattavuus (K2, approksimaatio)**

- [ ] **B029420** — maksetut tyypin 7 laskut 185,20 € netto ≥ lunastushinta 110 €, päättyy 30.09.
  Päättyykö lunastettuna (tapa 2)?
- [ ] **B031624** — 185,20 € ≥ 100 €, päättyy 31.10.2026. Sama kysymys.
- [ ] **B046508** — lunastushinta 0, ehto täyttyy tyhjänä. Onko hinta oikeasti 0 vai puuttuuko se?

**Status tyhjä, sopimus alkanut**

- [ ] **B004339** — `custrecord_sta_bike_status` tyhjä. Mikä status kuuluu asettaa?
- [ ] **B046739** — sama.
- [ ] **B046740** — sama.
- [ ] **B046741** — sama.
- [ ] **B046830** — sama.

**CR-jono**

- [ ] **B028437** — CR 6834 (tyyppi 7) Needs Review, luotu 28.09. Selvitä syy ennen 1.10. jälkiveloitusajoa.

## Auki, ei päivää

- **B023403 (löydetty 3.10., [löydös](findings/2026-10-03-maksulinkki-ylimaaraiset-viestit.md)):** `custrecord_sta_redemption_date` 27.11.2025 ja hyvitys CRMGBF0000552
  (−116,22 €). Pyörällä ei ole tyypin 2 CR:ää, laskutus jatkui, ja loppulunastus maksettiin 1.10. Selvitä, miksi Staria-kenttä on asetettu (CLAUDE.md:n kahden kirjoittajan varoitus).
- **Jälkiveloitusketju kirjoitetaan uudelleen maksulinkin kanssa symmetriseksi (tuoteomistaja 2.10.).** *"Jos lunastushinta on 0 €,
  silloin ei tarvitse pidentää mitään."* Repon `netsuite-subscription-extension` skripti (tarkennettu 2.10.) luodaan kokonaan uudelleen, niin että se tukee maksulinkin
  (`netstuite-send-end-redemption-payment-link`) tarkoitusta. Molempien on luettava samat säännöt: hinta − huoltohyvitys (summasta), tapa
  asetettu = ei pidennystä, hinta 0 = ei pidennystä, ja kattavuus M1. Lähtökohta: [käsittelyloki](findings/2026-10-02-maksulinkki-kasittelyloki.md)
  R5–R6 ja B046508 (ainoa nykyinen tapaus).

- **Alihanke: OOMI-vuokrahintojen korjaus** (aloitettu 1.10.2026, [`projects/2026-10-oomi-vuokrahinnat/`](projects/2026-10-oomi-vuokrahinnat/README.md)).
  46 pyörän sopimusrivien hinnat väärin (Fleet tuplaraportoi sopimukset), syys- ja lokakuun RI-rivit väärillä hinnoilla,
  osavuokrat laskettava. Tehtävät V1–V8 alihankkeen omassa TASKS.md:ssä. **Kiire: V6 ennen lokakuun palkka-CSV:tä.**
- ~~**D1** (taloustiimi): IC-päivä IC-myymättömille lunastetuille pyörille?~~ **Ratkaistu 6.10.2026
  ([ADR 0011](docs/adr/0011-ic-paiva-velvoitteista.md)):** kyllä, IC-myynti ei ole ehto. Laskuri antaa `-1`, ja taloustiimi päättää.
- **Vaatimus status-sync 2.0:lle (käyttäjä 30.09.):** skriptin on huolehdittava, että
  `custrecord_gbb_ic_redemption_dt` on **aina täytetty, kun vastuut on hoidettu**. Kirjattu
  [suunnitelmaan](docs/status-sync-2-tasmaytysajo.md#vaihe-3--ic-lista) (D7). Tarkennettavat: ehto on
  "vastuut hoidettu" eikä "status 2/3", ja kirjasto pitää tapaa 8 hoidettuna. Silloin 280 T5:n
  tavan 8 OOMI-pyörää saisivat IC-päivän automaattisesti. **Ratkaistu 6.10.2026 (ADR 0011):** ehto on velvoitteet
  hoidettu, ja tapa 8 on mukana.
- **Vaatimukset S1–S3** (status-sync 2.0, [ADR 0010](docs/adr/0010-keskenkauden-lunastus.md)): Needs Review -jono, maksu ilman CR:ää, tyyppi 10 yli 30 pv.
- **Ehdotus K2:lle (29.09., vahvistettava):** jälkiveloituksen kattavuuteen (ADR 0009 kohta 5)
  lasketaan vain laskurivit, joiden kausi on alkuperäisen loppupäivän (`subsc_org_end_date`) jälkeen.
  Esimerkki B016555: tyypin 7 CR-6107 laskutti kuukaudet 5–8/2026, jotka kuuluivat vielä
  sopimuskauteen. Ilman rajausta kattavuus olisi täyttynyt väärin (274,89 ≥ 84).
- **Vaatimus K3:lle ja status-sync 2.0:lle (25.09.):** OOMI-haara ei saa lukea
  `oomi_exceptional_end_date`:a. Päättymisajankohta on `subsc_end_date` (ADR 0010 kohta 8, D9). Jos
  2.0 otetaan käyttöön ennen T11:tä, sen on luettava `subsc_end_date` suoraan.
- **K1–K3** (status-sync 2.0): maksuvaiheen kuukausiehto, jälkiveloituksen kattavuus ja OOMI-haara
  ([ADR 0009](docs/adr/0009-kauden-lopun-lunastus.md)). Nämä toteutetaan omistavassa repossa, ei
  täällä.
