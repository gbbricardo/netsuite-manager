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
Neljälle keskenkauden pyörälle tulee tyypin 2 CR, ja niiden `liab_settled_at` = CR:n luontipäivä.

**Laajennettu 25.09. (T1:n sivuhavainto), aiempi muotoilu:** vanha osa A jatkaa ennenaikaisen tavan 1
kirjoittamista 30.09. asti (T6). Aja 28.09. ja uudelleen 30.09. ennen T6:ta kysely *status 1,
tapa 1, ei tyypin 2/10 CR:ää Pending/Done, päättymiskuu ei alkanut*. 25.09. tuloksena oli 9
pyörää (lista T1:ssä). **Tuoteomistaja päättää**, tyhjennetäänkö tapa K4:n tapaan CSV:llä.
OOMI-pyörät kääntyvät päättymiskuussaan joka tapauksessa oikein (kohta 6). Ei-OOMI-pyörillä
write-once-tapa estää tulevan CR:n arvot.

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

**Tarkistettu 30.09. illalla (rekisteririskin CSV, [§ 6](findings/2026-09-30-kuukausiajo-rekisteri-riski.md)):**
R2:n 5 OOMI-riviä korjattu (fee 79,6813), R3:n päällekkäiset item 30 -rivit inaktivoitu, B044271:n ja
B044504:n `oomi_exc` tyhjennetty. **Q3:een 1.10. lisätään:** (a) B043367: lokakuu kuuluu raportoida Rainmaker Telepalvelu Oy:lle (tuoteomistaja 30.09.). RI 117171 Active/New on siis oikein. Rekisterissä on yhä Rainmaker Contact (CR 6777 alkaa 1.11.), joten tarkista, ettei ri_creation tee Warningia tai toista riviä. (b) B044504: `exceptional_end_date` tyhjennetty 30.09. (todennettu). (c) Yksikään Active-rivi ei saa olla `lease_fee_vat0` = 0.

**Puhdas riskiarvio 30.09. illalla** ([löydös](findings/2026-09-30-kuukausiajo-1-10-puhdas-riskiarvio.md), kolme auditoijaa ilman aiempia löydöksiä):
1196 ajoi 30.09. 08:22 lokiaikaa, 66/66 CR:ää, 0 virhettä (todennettu `scriptnote`). Ennuste oli kaksi
tuotannon Warningia. **Rekisteri-id 8893 / RI 117683 (ri_update D11, Joen Diesel Oy) korjattu 30.09. (käyttäjä).**
Syynä oli kaksi muutosta samassa kuussa, pidennys ja ennenaikainen lunastus (T23). Jäljelle jää
rekisteri-id 41345 (T21). **Q3:een 1.10. lisätään:** (d) tuotannon Warning-rivejä on korkeintaan 1 (41345),
(e) 8893:lla on lokakuussa vain yksi elävä rivi.

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

Sama sääntö ja sama joukkoehto kuin T2:ssa. Mukaan tulevat pyörät, jotka ovat kääntyneet T2:n
jälkeen (CR:t, maksut, T1:n kääntymättömät). **Valmis kun** sama kysely palauttaa 0 ennen
kuunvaihdetta.

> [!NOTE]
> **30.09.:** T2 tehtiin käsin 29.09. (käyttäjä, noin 1 200 pyörää taloustiimin kiireellisen tarpeen vuoksi).
> Täytön jälkeen jäljellä oli 336. Käyttäjä täytti käsin 13 pyörää, jotka vaativat ihmisen silmää,
> klo 15:54–16:13. **Jäljellä 325** ([löydös](findings/2026-09-30-t5-ic-paiva-puuttuu.md)): 280 OOMI-pyörää
> tavalla 8, 38 OOMI-pyörää tavalla 1 (14 S4-pyörää, 23 kesä–heinäkuussa kääntynyttä ja uusi B044026) ja 7 muuta.
> Tavan 8 ryhmä odottaa päätöstä (ks. *Auki*: status-sync 2.0 ja IC-päivä).

### [ ] T6 — Vanha status-sync pois ajastuksesta

30.09. illalla `customdeploy_gbb_redemption_sync` → *Not Scheduled*
([suunnitelma § Lokakuu](docs/status-sync-2-tasmaytysajo.md#lokakuu--käyttöönotto-kerralla)).
Tämä tehdään vasta T5:n jälkeen.

> [!WARNING]
> **28.09.: odottaa päätöstä E6** ([suunnitelma](docs/kuukausiajo-2026-10-suunnitelma.md)). Deployment on
> sama kuin sweep (1440); ilman status-sync 2.0:aa sammutus pysäyttää statuskäännöt koko lokakuuksi.

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

- **D1** (taloustiimi): IC-päivä IC-myymättömille lunastetuille pyörille? Vaikuttaa T2:een ja T5:een.
  **30.09.:** 29.09. käsin tehdyssä täytössä noin 65 IC-myymätöntä sai IC-päivän. Kirjaa päätös, jos sellainen tehtiin.
- **Vaatimus status-sync 2.0:lle (käyttäjä 30.09.):** skriptin on huolehdittava, että
  `custrecord_gbb_ic_redemption_dt` on **aina täytetty, kun vastuut on hoidettu**. Kirjattu
  [suunnitelmaan](docs/status-sync-2-tasmaytysajo.md#vaihe-3--ic-lista) (D7). Tarkennettavat: ehto on
  "vastuut hoidettu" eikä "status 2/3", ja kirjasto pitää tapaa 8 hoidettuna. Silloin 280 T5:n
  tavan 8 OOMI-pyörää saisivat IC-päivän automaattisesti.
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
