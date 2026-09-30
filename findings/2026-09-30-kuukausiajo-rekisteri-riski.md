# Kuukausiajo 1.10.2026: pyörärekisterin epäsymmetriat (30.09.2026)

Auditointi, vain luku. Pyörälista: `findings/2026-09-30-kuukausiajo-rekisteri-riski.csv`.
Kaikki luvut ovat kyselyistä 30.09. (todennettu), paitsi kohdat merkitty *päätelty*.

## 1. Yhteenveto

| # | Riskiluokka | Pyöriä | Vakavuus |
|---|---|---|---|
| R1 | ~~Siirto-CR Done, alkaa 1.11.; rekisterin työnantaja uusi, lokakuun item 30 -rivi vanhalla asiakkaalla. Sisältää E1:n B009498 ja B010548~~ **Väärä hälytys, ks. § 6** | 8 | ei virhettä |
| R2 | OOMI-pyörillä lokakuun Active-RI-rivi jo olemassa, `lease_fee_vat0` = 0 (syyskuu 79,68) | 5 | korjattu 30.09., syy auki (§ 6) |
| R3 | Kaksi päällekkäistä aktiivista item 30 -riviä 1.10. | 3 | korjattava |
| R4 | COALESCE nostaa/laskee päättymisen subsc_end_datesta (T8 jäänteet) | 4 | kriittinen (B044504), muut korjattava |
| R5 | Status tyhjä, lokakuun RI-vaikutus | 1 (B046830) | korjattava |
| R6 | item 30 -rivi alkaa loppunsa jälkeen (B016051) | 1 | korjattava |
| R7 | K4 palannut: tapa 1 + `liab_settled_at` ennen päättymiskuuta, ei CR:ää | 9 | korjattava (ei lokakuun RI-vaikutusta) |
| R8 | Status 1, päättynyt < 1.10., ei tapaa (tunnettu 46/48-ryhmä + OOMI S4b) | 163 | kuten suunnitelma § 2 |
| R9 | Status 1 + tapa, päättyy 10/2026 (sweep kääntää 1.10., 161) | 161 | tiedoksi (T6) |

Gate-kvadrantin tyhjä solu (status 2/3, päättymisajankohta ≥ 1.10.): **0**. Status 1 + tapa + päättynyt ennen 10/2026: **0**. Tyhjän statuksen pyöriä 123: 117 ilman päättymispäivää, ja **yhdelläkään ei ole aktiivista item 30 -riviä ≥ 1.10.** Ainoa RI-riski on B046830.

## 2. Rikkomukset

### R1: siirto-CR alkaa 1.11., rekisteri edellä (kriittinen)

Kysely: pyörät joilla status 1, item 30 -rivi kattaa 1.10. ja `ca.customer <> contract_employer` (40 kpl), liitettynä tyypin 1/9 CR:iin. Luvut: 40 = **32** (Done-CR alkaa 1.10., next_billto = rivin asiakas kaikilla, 1196 korjaa) + **8** (Done-CR alkaa **1.11.**).

Kahdeksalla CR:t 6537, 6599, 6652, 6691, 6734, 6807, 6859, 6862: `end_date_of_old_sub` 31.10., handler on kloonannut rivit 1.11. alkaen uudelle asiakkaalle, ja rekisteri on jo uudella työnantajalla. Lokakuun rivi on vielä vanhalla asiakkaalla (esim. rivi 50454 Pikku-Heila, rekisterissä Heila Oy). Lisäksi UE on jo luonut lokakuulle RI-rivit *Ended (vanha)* + *Active/New (uusi)* (esim. B004864: 116979, 116980; B009498: 118074, 118075).

- 1196 ei auta: se hakee CR:t, joiden alkupäivä on **1.10.**
- **E1 on toteutunut eri tavalla kuin suunniteltu.** Suunnitelma määräsi alkupäiväksi 1.10. ja `end_date_of_old_sub` 30.09.; CR:t 6859 ja 6862 (luotu 30.09.) ovat 1.11. / 31.10. Niiden `next_billto` on rekisterin nykyinen työnantaja (2017 Nautor, 147782 Pirkan), ei suunnitelman 5323 / 4622. Lokakuun rivit (50399, 49472) ovat siis yhä Erikssonsilla ja Infra Kirillä.
- *Päätelty:* ri_creation antaa näille Warningin (rekisteri ≠ rivin asiakas, kuten suunnitelman 32:n luokka) ja mahdollisesti tuplaa UE:n rivit. Sääntö on koodissa, ei tarkistettu tässä. Warning pidättää koko työnantajan CSV:stä.
- Onko kuuden aiemman (16.-25.09.) CR:n suunta oikea, en voi päätellä datasta.

### R2: OOMI-rivit fee 0 (kriittinen)

RI 116352 (B046738 Hilti), 116353 (B046744 Vaisala), 116354 (B046743 Vaisala), 116355 (B046745 Itä-Uudenmaan poliisi), 116356 (B046829 Konecranes). Luotu 18.09., Active, `reporting_date` 1.10., **fee 0**, syyskuussa 79,681275. Item 30 -rivi alkaa vasta 1.11. (sama syy kuin E2:n kolmella: 46737, 46742, 46832, jotka on korjattu rivit 117974-6). E2 kattoi vain kolme kahdeksasta. CSV:hen tulisi 0 €:n vähennys. Ei Warningia, siksi ei näy Warning-mittarissa.

### R3: päällekkäiset item 30 -rivit

B036671 (rivit 47 ja 46366 identtiset), B036747 (115 ja 71189), B036939 (70263 hinta 59,76 ja 70323 hinta 79,68). Vaikutus RI:hin (tupla-rivi) *päätelty*. Kuuluu sopimusriviauditoijalle.

### R4: poikkeuspäivät (T8)

Poikkeuspäiviä on jäljellä 96 pyörällä; lähes kaikilla arvo = subsc_end_date tai pyörä on jo päättynyt. Erot, jotka koskevat lokakuuta:
- **B044504** status 1, `exceptional` ja `oomi_exceptional` 31.10.2026, subsc_end 1.4.2027: päättyy COALESCEn mukaan 10/2026 (Ended-rivi 1.11.).
- **B044271** status 1, ei tapaa, exceptional 31.07., subsc_end 5.9.2026 (E4, tunnettu).
- **B046739, B046740** status tyhjä, `oomi_exceptional` 31.05.2026, subsc_end 2027/2030. Jos status asetetaan, päättyvät väärin. Nyt haku ohittaa ne.
- Aktiivisella pyörällä ei ole yhtään tapausta, jossa poikkeuspäivä olisi subsc_end_datea *myöhempi*. Myöhempi-tapaus: B044906 (status 2, mennyt, harmiton).

### R5: tyhjä status

123 pyörää: 117 ilman päättymispäivää, 4 päättynyttä, 2 tulevaa. Ei aktiivisia item 30 -rivejä ≥ 1.10. yhdelläkään (kysely 0 riviä). B046830 (OOMI, ei rivejä) E3 tekemättä; B046741 ja B046739/40 ilman rivejä.

### R6-R7

B016051: rivi 72784 alkaa 2027-01-01, päättyy 2026-12-31. Lokakuussa Paused-rivi on olemassa, joten ei lokakuun riskiä.
K4-palanneet (CSV): B000991, B004234, B011005, B013550, B029483, B033069, B036797, B040838, B041610. Tapa 1 ja `liab_settled_at` = `paid_at` ennen päättymiskuukautta, ei tyypin 2/10 CR:ää. Lokakuun rivit eivät muutu. Syy *päätelty*: vanha status-sync osa A (sallittu poikkeama kirjattu 25.09. vain kun `liab_settled_at` tyhjä, nämä eivät ole).

### R8-R9

R8: 163 = 88 ei-OOMI (3 päättynyt 11/2025, 83+2 09/2026) + 75 OOMI (74 09/2026, 1 07/2026). Suunnitelman luvut 94/77; ero (88 vs 94) johtuu tapa-ehdosta ja on selvittämättä. En pystynyt ajamaan Oct-RI-rivien läsnäoloa (EXISTS-kysely kaatui "Invalid or unsupported search").
R9: sweep-kandidaatit päättymiskuu 10/2026: ei-OOMI 40 (26 tapa 1 `paid_at` tyhjä = keskenkauden CR-polku, 13 maksettu, 1 tapa 6), OOMI 121 (17 `liab_settled_at` tyhjä = S4/K1, 104 asetettu). Jos T6 sammuttaa 1440:n, nämä 161 jäävät status 1 -tilaan, mutta RI ei lue statusta päättymispäätökseen (suunnitelma § 2). Vaikutus tulee 1.11. extensioniin (haku vaatii Active).

### Kohdat 3 ja hinta

Item 30 -rivit, jotka kattavat 1.10. ja status 1: hinta vs `curr_subs_rent`: 24 806 + 277 + 162 + 7 740 täsmää (<0,02 €), 1 erosi (B036939, R3), 56 ilman `curr_subs_rent` (54 tyyppi 1, ei riskiä RI:lle). 29 aktiivista pyörää ilman item 30 -riviä 1.10.: 19 ei-OOMI ovat tahallisia taukoja (Paused-RI-rivit lokakuulle olemassa kaikilla, todennettu), 10 OOMI (R2 + E2).

## 3. Korjausehdotukset (vain `customrecord_sta_bike_register`)

| Pyörä | Kenttä | Nykyinen | Ehdotettu | Peruste |
|---|---|---|---|---|
| B004864, B012385, B016298, B026973, B030311, B033972 | `custrecord_sta_contract_employer` / `custrecord_sta_bill_to_cus` | uusi työnantaja (Heila, Quant, VK-Murskaus, Sweco PM, Metso x2) | vaatii ihmisen päätöksen | Lokakuun rivi on vanhalla asiakkaalla, siirto 1.11. Joko rekisteri takaisin vanhaan lokakuuksi (ja uudelle 1.11., ei tehtävissä ilman uutta kirjoitusta) tai rivin/CR:n korjaus, joka ei kuulu tälle agentille |
| B009498, B010548 | sama | Nautor (2017), Pirkan (147782) | vaatii ihmisen päätöksen | E1-suunnitelman suunta (5323 / 4622) ja CR:n suunta ovat vastakkaiset; arvoa ei voi johtaa datasta |
| B046830 | `custrecord_sta_bike_status` | tyhjä | 1 | Suunnitelma E3; kirjoitus laukaisee webhook-UE:n |
| B044504 | exceptional / oomi_exceptional | 31.10.2026 | tyhjennä (subsc_end 1.4.2027 voimaan) | T8, kenttäsäännöt § 2. Write-once, tietoinen poikkeus. Arvo pitää varmistaa ihmiseltä ennen |
| B046739, B046740 | `custrecord_gbb_oomi_exceptional_end_date` | 31.05.2026 | tyhjennä ennen statuksen asettamista | T8, sama |
| K4 (9 pyörää, CSV) | `liab_settle_method`, `liab_settled_at` | 1 / paid_at | tyhjennä | Kenttäsäännöt § 9 (K4). Write-once, tietoinen poikkeus |

R2 (OOMI fee 0), R3 (päällekkäiset rivit) ja R6 (korruptoitunut rivi) ovat RI-rivien ja sopimusrivien virheitä. Ei ehdotusta tälle tietueelle: havainto muille omistajille.

## 4. Varoitukset

- Statuksen kirjoitus (B046830) laukaisee `gbb_webhook_ue_status_changed.js`:n.
- `liab_settled_at`, exceptional-kentät ja tapa ovat write-once; tyhjennys on poikkeus, ei rutiini. CSV ei sovi statuskenttään.
- Rekisterin työnantajan kirjoitus laukaisee rekisterin UE:t (699, `ue_reporting_item_maintenance_prolongation`).
- 1196 ei ole ajanut 30.09. (`scriptnote`: viimeinen rivi 29.09. *Not last day of month*). Elokuun ajastettu ajo puuttui kokonaan. E1b on yhä tekemättä.

## 5. Todennettu vs. päätelty

**Todennettu (kysely 30.09.):** kaikki lukumäärät, pyörä-, CR-, rivi- ja RI-id:t, CR:ien alkupäivät ja next_billto-arvot, Oct-start-CR:ien next_billto = rivin asiakas 32/32, 1196:n viimeisin ajo 29.09.
**Päätelty:** että ri_creation antaa R1-pyörille Warningin ja mahdollisen tuplarivin; R3:n RI-vaikutus; K4:n syy (vanha osa A); että 1196 kirjoittaa 32 pyörän työnantajan, jos se ajetaan. Ei tarkistettu: R8:n Oct-RI-läsnäolo (kysely epäonnistui), ajastetun 1196:n toimivuus 30.09.

## 6. Käsittely 30.09.2026 (tuoteomistaja) ja jälkitarkistus

Tuoteomistaja kävi CSV:n läpi 30.09. ja teki korjaukset NetSuiteen. Huomiot ovat CSV:n viimeisessä
sarakkeessa. Jälkitarkistus on tehty SuiteQL:llä 30.09. illalla.

> [!IMPORTANT]
> **R1 oli väärä hälytys, eikä virhettä ole.** Siirto-CR (2A-paketti: tyyppi 1 + 11 + 7) jakaa päivät
> kahteen osaan:
> - **`custrecord_cr_contract_official_end_date` + 1** = todellinen siirtopäivä. `ue_reporting_item_transfers.js:122-126`
>   (`resolveReportingDate`) vaihtaa sen perusteella palkkaraportoinnin työnantajan, kuitenkin
>   aikaisintaan seuraavan kuun 1. päivänä.
> - **`custrecord_cr_start_date`** = ensimmäinen laskuttamaton kuukausi. Sopimusrivit siirtyvät uudelle
>   asiakkaalle vasta silloin, ja siirtopäivän ja alkupäivän väliset jo laskutetut kuukaudet
>   oikaistaan saman paketin tyypin 11 (hyvitys vanhalle) ja 7 (jälkiveloitus uudelle) CR:llä.
>
> Siksi lokakuussa on oikein, että rekisterissä on uusi työnantaja, RI-rivi on Active/New uudelle,
> ja item 30 -rivi on vanhalla asiakkaalla 31.10. asti. **Älä raportoi tätä asetelmaa epäsymmetriana.**

### R1: 8 pyörää, ei toimenpiteitä (todennettu)

| Pyörä | CR | official_end | Todellinen siirto | Uusi työnantaja (rekisteri = Oct RI Active/New) |
|---|---|---|---|---|
| B004864 | 6691 | 31.08.2026 | 1.9. | Heila Oy |
| B009498 | 6859 | 31.05.2026 | 1.6. | Oy Nautor Ab |
| B010548 | 6862 | 31.08.2026 | 1.9. | Pirkan Rakentajapalvelu Oy |
| B012385 | 6807 | 30.09.2026 | 1.10. | Quant Finland Oy |
| B016298 | 6599 | 30.09.2026 | 1.10. | VK-Murskaus Oy |
| B026973 | 6652 | 30.09.2026 | 1.10. | Sweco PM Oy |
| B030311 | 6734 | 30.09.2026 | 1.10. | Metso Finland Oy (FI01) |
| B033972 | 6537 | 30.09.2026 | 1.10. | Metso Finland Oy (FI01) |

Kaikilla on `start_date` 1.11. ja uuden asiakkaan item 30 -rivi 1.11. alkaen. **E1 (B009498, B010548)
korjaus:** 29.09. suunnitelma oletti suunnan väärin päin (rekisteri Nautor/Pirkan → Erikssons/Infra
Kiri). Oikea suunta on Erikssons → Nautor 1.6. ja Infra Kiri → Pirkan 1.9., ja rekisteri oli jo
oikein. Asiakaspalvelun CR:t 6859 ja 6862 ovat oikein. RI-rivit 118074–118077 ovat oikein.

### R2: 5 OOMI-riviä, korjattu, syy auki

`lease_fee_vat0` 0 → 79,6813 riveillä 116352–116356 (todennettu, lastmodified 30.09. klo 17:27–17:29).
Syy on selvittämättä: rivit on luotu 18.09. klo 14:32–14:34 (omistaja Ricardo Oksa, ei
`subscription_line`-linkkiä, ei `automation_logs`-merkintää), ja pyörien sopimusriveillä oli hinta
oikein. Tuoteomistajan arvio: rivit syntyivät todennäköisesti täydennysajossa tai testauksessa
syyskuussa. **Bugikandidaatti**, ks. [`2026-09-30-oomi-ri-rivi-fee-nolla.md`](2026-09-30-oomi-ri-rivi-fee-nolla.md).

### R3: 3 pyörää, ylimääräiset rivit inaktivoitu (todennettu)

| Pyörä | Inaktivoitu | Jäljelle | Huom. |
|---|---|---|---|
| B036671 | 46366 | 47 (79,68) | kunnossa |
| B036747 | 115, 63120, 70902 | 71189 (79,68) | kunnossa |
| B036939 | 70323 (79,68) | **70263 (59,76)** | **Tarkistettava:** rekisterin `curr_subs_rent` on 79,68, mutta jäljelle jäi 59,76:n rivi. Syyskuun RI 79402 on 59,76, joten lokakuun RI tulee samalla hinnalla. Jos 59,76 on oikea (esim. työnantajan alennus), rekisterin arvo on väärä, ja päinvastoin. |

### R4: poikkeuspäivät

| Pyörä | Tuoteomistajan merkintä | Tila 30.09. illalla (todennettu) |
|---|---|---|
| B044504 | `oomi_exceptional_end_date` tyhjennetty, odottaa asiakaspalvelun CR:ää | Tyhjennyksen jälkeenkin `custrecord_gbb_exceptional_end_date` oli yhä 31.10.2026. **Tyhjennetty myöhemmin 30.09.**: molemmat kentät ovat tyhjiä, `subsc_end` on 1.4.2027 (todennettu). |
| B044271 | `exceptional_end_date` tyhjennetty, odottaa CR:ää | tyhjä. Status 1, `subsc_end` 5.9.2026, ei tapaa: päättynyt pyörä odottaa CR:ää. |
| B046739, B046740 | Tilaus peruttu | Status tyhjä, `oomi_exc` 31.5.2026 yhä paikallaan, tietue aktiivinen. Lokakuun RI-rivejä ei ole. Peruttu tilaus on siis tunnistettavissa vain tästä kirjauksesta. |

### R5: B046830 on vahinkotilaus

Syntyi OOMI-siirrosta, joka käsiteltiin väärin Fleet-raportin takia. Oikea pyörä on **B043367**. Tila
30.09.: status tyhjä, työnantaja Rainmaker Telepalvelu Oy, tietue aktiivinen, ei lokakuun RI-riviä.
**E3 ei siis koske tätä pyörää: sille ei aseteta statusta 1.** Tietue pitää poistaa tai inaktivoida,
jotta se ei päädy enää auditointeihin.

Sivuhavainto B043367:llä (todennettu): tyypin 9 CR 6777 (Rainmaker Contact → Rainmaker Telepalvelu,
`start` 1.11., `official_end` tyhjä) sekä 6775 (tyyppi 7) ja 6776 (tyyppi 11) ovat Done. Lokakuun RI:ssä on
Ended Contact (117078) + Active/New Telepalvelu (117171), mutta **rekisterin työnantaja on yhä
Rainmaker Contact Oy.** Tämä poikkeaa R1-mallista: siinä rekisteri on jo uusi. 1196 ei päivitä
rekisteriä ennen 31.10., koska alkupäivä on 1.11. **Tuoteomistaja 30.09.:** lokakuu raportoidaan Rainmaker Telepalvelu Oy:lle, joten RI 117171 on oikein. Q3:ssa 1.10. tarkistetaan, ettei ri_creation tee Warningia tai toista riviä rekisterin vanhan työnantajan takia.

### R6: B016051 on järjestelmän tukematon tapaus

Välikuukaudet laskutetaan sopimuksen päättymiseen asti (31.12.2026), joten vuokrariviä ei enää
laskuteta, ja rivin 72784 kausi (1.1.2027–31.12.2026) on sen sivutuote. Raportoinnin **RI-rivi 1269
(Paused)** pitäisi muuttaa Endediksi, jos lunastusmaksu maksetaan joulukuussa 2026. Muuten raportointi
jatkuu, kunnes maksu saapuu tai velvoitteet on katettu. **Nykyinen järjestelmä ei tue tätä**, joten
käsittely on suunniteltava. Ks. TASKS.md T17.

### R7: 9 pyörää, kolme eri tapausta

| Tapaus | Pyörät | Ratkaisu |
|---|---|---|
| **Kauden lopun lunastus maksettu etuajassa.** Vuokrasopimus on pidentynyt kahdesti kauden aikana. Vanha järjestelmä (ennen NetSuitea) lähetti lunastusmaksupyynnön ensimmäisen jakson loppuun (B000991:llä 30.09.2026), koska viimeisintä huoltoa ei viety sinne heinäkuussa 2026. | B000991 (päättyy 11/2026), B004234 (03/2027), B011005 (12/2026), B033069 (11/2026) | **Sallittu poikkeama, ei korjata.** Ks. [kenttäsäännöt § 9](../docs/lunastuksen-kenttasaannot.md). Rekisteri 30.09.: tapa 1, `liab_settled_at` = `paid_at`. |
| **Keskenkauden lunastusmaksu saapunut, CR:stä ei tietoa** | B013550, B029483, B040838 (OOMI), B041610 (OOMI) | Asiakaspalvelu selvittää, T10. Jo T3:ssa tunnettu, ei kosketa ennen CR:ää. |
| **Väärä laskutyyppi** | B036797 | INVGBB1002275 ja INVGBB1002276 kantoivat väärää invoice typeä. Korjattu, ja lunastustiedot tyhjennetty rekisteristä (todennettu: tapa, `liab_settled_at`, `paid_at` tyhjiä). |
