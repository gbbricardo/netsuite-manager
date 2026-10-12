# Poikkeamaraportointi — vaatimukset

**Päivitetty:** 2026-10-09 · **Tila:** hyväksytty (tuoteomistaja, grilling-istunto 9.–12.10.2026, Q1–Q28), [ADR 0017](adr/0017-poikkeamaraportointi.md) · **Seuranta:** TASKS T51, puuttuvat säännöt T65
**Peruste:** [ADR 0015](adr/0015-status-sync-2-tarkennukset.md) k. 1 (status-sync 2.0 ei raportoi),
[ADR 0014](adr/0014-maksulinkin-korjaus-ja-yksinkertaistus.md) k. 10 (1479 ei raportoi),
[ADR 0013](adr/0013-kauppakirjan-lahetys.md) k. 13 (kauppakirjaraportti)
**Sanasto:** [`CONTEXT.md`](../CONTEXT.md) § *Poikkeamaraportoinnin käsitteet* (tarkistus, poikkeama, virhe,
ennakkovaroitus, kuittaus, ajokalenteri, ajovahti)

Tämä on myöhemmin rakennettavan raportointitoteutuksen määrittely. Toteuttava repo ja tekniikka päätetään
erikseen. Toiminnalliset skriptit (status-sync 2.0, 1479, extension 2.0) eivät raportoi.

## Periaatteet (tuoteomistaja 9.10.2026)

| # | Päätös | Q |
|---|---|---|
| P1 | Raportin **sisältö määritellään kanavasta riippumatta**. Sama sisältö toimii sekä cf-gbb-tools-näkymänä että sähköpostiraporttina. | Q1 |
| P2 | **Kaikki toimialueet**: lunastus, IC, maksulinkki, extension, kauppakirja, kuukausiraportointi, verovapaus, muutospyynnöt, sopimusrivit, hyvitykset. | Q2 |
| P3 | **Jokainen tarkistus viittaa kirjattuun sääntöön** (ADR:n kohta tai sääntödokumentin pykälä). Ilman sääntöä ei ole tarkistusta. Puuttuvat säännöt kirjataan ADR:iksi ensin (T65). | Q3, Q10, Q15 |
| P4 | Kaksi poikkeamalajia: **virhe** ja **ennakkovaroitus**. Ennakkovaroituksella on aina määräaika ajokalenterista. | Q4 |
| P5 | **Tila tallennetaan**: ensihavaintopäivä ja kuittaus. Kuittauksessa on aina syy ja päätösviite. | Q5 |
| P6 | **Raportti vain ilmoittaa.** Ei korjaus-CSV:tä, ei kirjoitusta NetSuiteen. Ihminen korjaa oikeaa reittiä pitkin. | Q6 |
| P7 | **Ei omistajia eikä rooleja.** Kaikki käyttäjät vastaavat kaikesta yhtä lailla, ja kaikki on kaikkien nähtävissä, myös kuittaukset (kuka, milloin, miksi). | Q7 |
| P8 | Päivittäinen raportti näyttää **kaikki avoimet, kuittaamattomat poikkeamat**. | Q8 |
| P9 | Kuittaus **raukeaa**, kun jokin tarkistuksen lukemista tiedoista muuttuu kyseisessä tietueessa. Ei aikarajaa. | Q9 |
| P10 | Tarkistus kuvaa säännön, ei virheen tuottajaa. Kertaluokistakin tehdään tarkistus, jos sääntö on olemassa. | Q11 |
| P11 | **Erillinen näkymä**, ei cf-gbb-toolsin NetSuite Alerts -näkymän laajennus. Alertsin omat tarkistukset (CR Pending/Error, Paylink Error / Pending Bike) jäävät vain Alertsiin. Raportissa on niistä pelkkä määrärivi ja linkki. | Q12, Q14 |
| P12 | **Ei vakavuus- eikä vaikutusluokkaa.** Järjestys: ennakkovaroitukset määräajan mukaan, sitten virheet ensihavainnon iän mukaan. | Q13 |
| P13 | Raportti muodostetaan **klo 7:00 Helsingin aikaa**: yön 1480- ja 1199-ajojen jälkeen ja ennen 1479:n klo 8 ajoa. | Q18 |
| P14 | **Ajovahti** on oma tarkistuslajinsa ja ainoa, joka lukee lokia (`scriptnote`). Sen sääntö on ajokalenteri. | Q19 |
| P15 | Tarkistus **ei koskaan raportoi sääntödokumentin nimeämää sallittua poikkeamaa** (esim. kenttäsäännöt §9 *Sallittu poikkeama*). | Q22 |
| P16 | Samaa tietuetta ei raportoida kahden tarkistuksen kautta samasta syystä. Rajat kirjataan tarkistuksen ehtoon (esim. LU7 ↔ KL2). | Q21 |
| P17 | Tarkistuksella voi olla **päättymisehto** (*voimassa kunnes …*). Siirtymäaikainen tarkistus poistetaan luettelosta, kun ehto täyttyy. | Q23 |
| P18 | Raportissa on vain virheitä ja ennakkovaroituksia, ei seurantalistoja. Tietoinen päätös poikkeuksesta hoidetaan kuittauksella. | Q25 |
| P19 | Kuittauksen päätösviite on ADR, sääntöpykälä, TASKS-tunniste tai TASKSiin kirjattu pyöräkohtainen päätös. Vapaa teksti ei kelpaa. | Q27 |

## Ajokalenteri (Q17)

| Ajo | Skripti | Ajankohta (Helsinki) | Lähde |
|---|---|---|---|
| status-sync 2.0 | 1480 | päivittäin 00:30 | ADR 0015, T54 |
| CR-käsittelijä | 1199 | 6 tunnin välein (`customdeploy1`) ja kuun 1. päivänä 01:33 (`_hdl_2`) | T62 |
| maksulinkki | 1479 | päivittäin 8:00 | ADR 0014, T30 |
| extension 2.0 | (uusi) | kuun 10. päivänä 03:00, ensimmäinen 10.11.2026 | T61 |
| statuspäivän täyttö | 1458 | päivittäin noin 02:00 lokiaikaa | CLAUDE.md |
| CR-rekisteripäivitys | 1196 | ajastettu | script-inventory |
| taloustiimin IC-ajo | (käsin) | noin kuun 29. päivänä | ADR 0011 |
| kuukausiraportointi | 1451–1453 (käsin) | **oletus: kuun 1. päivä**. Jos ajopäivä muuttuu, kalenteri päivitetään. | Q17 |

## Tarkistusluettelo

Sarakkeet: **Laji** V = virhe, E = ennakkovaroitus (määräaika ajokalenterista). **Aiempi** = tunniste tämän dokumentin
7.10. versiossa. **Tausta** = import tai löydös, josta luokka tunnetaan. Ehdot ovat selkokielisiä; SuiteQL-kyselyt
rakennetaan `queries/`-kirjastoon toteutusvaiheessa (`suiteql-rakentaja`).

### Lunastus (LU)

| ID | Ehto selkokielellä | Sääntö | Laji | Aiempi | Tausta |
|---|---|---|---|---|---|
| LU1 | Tapa 1, ei OOMI, ei Done-tilaista tyypin 2 CR:ää, ja `liab_settled_at` ≠ `paid_at` | kenttäsäännöt §5, ADR 0008 | V | R1 | — |
| LU2 | Status 2 tai 3, mutta päättymiskuu ei ole alkanut | kenttäsäännöt §3–4 | V | R2 | 2026-09-18 |
| LU3 | Status ≠ tavan kohdestatus (2 ↔ 3), tai status 2/3 ilman tapaa. Sisältää palautetut tavalla 1 ja Done-tilaisen *2D*-CR:n pyörät statuksella 2. | ADR 0007 k. 5 | V | R3 | selvitystapa 20.09., pyorapaatokset, 2026-09-29 |
| LU4 | Status tyhjä, vaikka sopimus on alkanut | ADR 0007 k. 5 | V | R4 | — |
| LU6 | OOMI-pyörä, status 1, ei tapaa, päättymiskuu on mennyt | ADR 0009 k. 4, k. 6 | V | — | oomi-kauden-loppu, oomi-syyskuu |
| LU7 | Status 1, `paid_at` asetettu, ei tapaa, **päättymiskuu alkanut** (ennen sitä tilanne on KL2) | ADR 0007, ADR 0015 | V | — | selvitystapa-active |
| LU8 | Tapa asetettu (ei 8), mutta `liab_settled_at` ja `paid_at` tyhjiä. Ei koske sallittua poikkeamaa *tapa 1 ennen päättymiskuuta*. | kenttäsäännöt §5 | V | — | vaihe3-esiehto A |
| LU9 | Tapa 1 ja `liab_settled_at` ennen päättymiskuun alkua, ei tyypin 2/10 CR:ää. Ei koske kenttäsääntöjen §9 sallittuja poikkeamia (P15). | ADR 0009 k. 4, ADR 0008 | V | — | s1-ennenaikainen-tapa |
| LU10 | `paid_at` tyhjä, vaikka loppulunastus on maksettu (Paylink-tilaus valmis, talletus tai maksettu tuote 46 -lasku) | ADR 0007, ADR 0015 | V | — | s1c-maksupaivat |
| LU11 | Done-tilainen tyypin 2 CR, mutta `decided_at` on tyhjä tai ≠ uusimman CR:n `cr_created_date` | ADR 0010 | V | — | decided-at-historia |
| LU12 | Tapa asetettu, `subsc_end_date` tyhjä | status-sync 2.0 vaihe 4 | V | R8 | — |
| LU13 | Status 2/3 ja `date_to_non_active` tyhjä yli vuorokauden | 1458 | V | R13 | — |
| LU14 | Tapa 2 ja saman pyörän tyypin 11 CR | ADR 0015 k. 5 | V | R11 | — |
| LU15 | Lunastus maksettu, ja pyörällä Pending-tilainen jälkiveloitus-CR | ADR 0015 k. 8 | E: seuraava 1199 | R9 | — |
| LU16 | Tapa 2, 3 tai 4, ja pyörällä avoin loppulunastustilaus Paylinkissä | ADR 0012 k. 9, T45 | V | R10 | — |
| LU17 | `custrecord_gbb_exceptional_end_date` asetettu, tai `oomi_exceptional_end_date` ≠ `subsc_end_date` ilman Done-tilaista tyypin 2/10 CR:ää | ADR 0010 k. 8 | V | — | d9-fleet-paiva-pois |
| LU18 | Poikkeuspäivä ≠ `subsc_end_date` (kirjaston `COALESCE` antaa eri päättymisen kuin rekisteri). **Voimassa kunnes T11** (`COALESCE` pois kirjastosta) on tuotannossa. | ADR 0010 k. 8 | E: kuukausiajo | — | poikkeuspaivat-subsc |
| LU19 | `custrecord_sta_redemption_date` asetettu (Staria-hyvitys) | ADR 0010 k. 3 | V | S5 | pyorapaatokset 03 |

### Keskenkauden lunastus (KL)

| ID | Ehto | Sääntö | Laji | Aiempi | Tausta |
|---|---|---|---|---|---|
| KL1 | Tyypin 2 CR Needs Review -tilassa | ADR 0010 k. 7 | E: luontikuun loppu | S1 | — |
| KL2 | Keskenkauden maksu (Paylink-tuote *kesken kauden*) ilman tyypin 2 CR:ää, päättymiskuu ei alkanut | ADR 0010 k. 2 | V | S2 | 2026-09-24 |
| KL3 | Tyypin 10 CR Pending yli 30 päivää | ADR 0010 k. 9 | V | S3 | — |
| KL4 | Tyypin 2 CR:n `cr_created_date` ≠ CR:n todellinen luontipäivä (Helsinki), eli käsin kopioitu CR | ADR 0010 | V | — | p2-cr-luontipaivat |

### IC-lunastus (IC)

| ID | Ehto | Sääntö | Laji | Aiempi | Tausta |
|---|---|---|---|---|---|
| IC1 | Status 1, mutta `ic_redemption_done` = T | ADR 0011 | V | R6 | — |
| IC2 | Done = T, mutta IC-päivä ≠ `LAST_DAY(subsc_end_date)` tai tapa tyhjä | ADR 0011 k. 7 | V | R7 | — |
| IC3 | IC-päivä asetettu, done ≠ T, hinta tyhjä yli vuorokauden | ADR 0015 k. 7 | V | R12 | — |
| IC4 | Velvoitteet hoidettu (tapa asetettu, tunnistuspäivä ohitettu), IC-myynti olemassa, IC-päivä tyhjä | ADR 0011 k. 2 | E: IC-ajo noin 29. | — | 2026-09-30 t5 |

### Jälkiveloitus ja extension (EX)

| ID | Ehto | Sääntö | Laji | Aiempi | Tausta |
|---|---|---|---|---|---|
| EX1 | Active, ei OOMI, sopimus päättynyt, ei linkkiä, ei tapaa, ei jälkiveloitusketjua | ADR 0014 k. 17b, T61 | V | T51 (1) | — |
| EX2 | Loppulunastushinta 0 €, tapaa 4 ei ole kirjattu | ADR 0012, T61 | E: extension 10. | T51 (2) | T33 |
| EX3 | Done-tilaisten jälkiveloitus-CR:ien kattavuus (kpl × 80 € brutto) ≥ lunastushinta, mutta tapa on tyhjä | ADR 0012, kenttäsäännöt §11 | V | — | T53 |

### Maksulinkki (ML)

| ID | Ehto | Sääntö | Laji | Aiempi | Tausta |
|---|---|---|---|---|---|
| ML1 | `eredem_link_sent` ≠ T, vaikka pyörällä on loppulunastustilaus Paylinkissä (ei OOMI) | ADR 0014 k. 12 | V | — | link-sent-kertataytto |
| ML2 | Pyörällä useampi kuin yksi loppulunastustilaus Paylinkissä | ADR 0014 k. 3 (S4) | V | — | 2026-10-03 ylimääräiset viestit |
| ML3 | Tapa 3 tai 4 ja pyörällä jälkiveloitus-CR | ADR 0014 k. 4 | V | — | T32 |
| ML4 | Active, ei OOMI, ei tapaa, ei linkkiä, ja lähetyspäivä (ADR 0014 k. 14) on ohitettu. Ohitussyyt (S5, ohitus 4, vanha SO) lasketaan samasta tilasta. Korvaa lokin käsinluvun: T52 päättyy, kun ML4 on tuotannossa. | ADR 0014 k. 14–15 | V | T52 | T34, T35 |

### Kauppakirja (KK)

| ID | Ehto | Sääntö | Laji | Aiempi | Tausta |
|---|---|---|---|---|---|
| KK1 | Virheellisesti lähetetty kauppakirja | ADR 0013 k. 12–13 | V | — | T47 |
| KK2 | Tapa 8 -pyörä ilman asiakaspalvelun päätöstä yli 30 päivää päättymisestä | ADR 0013 k. 2, k. 13 | V | — | T50 |
| KK4 | Omistuksen siirtymispäivä ei ole koittanut yli 30 päivää päättymisestä | ADR 0013 k. 13 | V | — | T49 |
| KK5 | *Kaikki vuokrat maksettu* = T, mutta tarkistettavalla vuokrakuukaudella on maksamaton vuokralasku asetushetkellä | ADR 0016 | V | — | 2026-10-08 |

### Verovapaus (VV)

| ID | Ehto | Sääntö | Laji | Aiempi | Tausta |
|---|---|---|---|---|---|
| VV1 | `verovapaa` = T rekisterissä tai uuden työnantajan RI-rivillä, ja pyörällä on Done-tilainen tyypin 1 CR, jonka siirtopäivä on mennyt | verovapaus-saannot § Sääntö | V (rekisteri), E: kuukausiajo (RI) | — | verovapaus-siirrot |

### Kuukausiraportointi (RI)

Ei vielä tarkistuksia. Kaikki tunnetut luokat odottavat ADR:ää (A2–A5, A8, A10, A11).

### Ajovahti (AV)

| ID | Ehto | Sääntö | Laji |
|---|---|---|---|
| AV1 | Ajokalenterin ajosta ei ole `scriptnote`-riviä odotetussa ajassa (1480, 1199, 1479, extension 2.0, 1458, 1196) | ajokalenteri | V |
| AV2 | Deploymentin tila (`SCHEDULED` / `NOTSCHEDULED`) ≠ ajokalenterin odotus | ajokalenteri | V |

## Odottaa ADR:ää (T65)

Näistä toistuvista luokista ei ole kirjattua sääntöä. Niistä ei tehdä tarkistusta ennen ADR:ää (P3).

| # | Luokka | Tausta |
|---|---|---|
| A1 | Tyypin 11 CR:n hyvityslaskun rivihinta < laskutetun rivin hinta | hyvitys-lisahyvitykset, 2026-09-23 |
| A2 | OOMI-hintaerot: RI `lease_fee_vat0` ≠ kauden sopimusrivin hinta; `init_subs_rent_fee` ≠ pitkän rivin hinta | oomi-hinnat, 2026-10-01 |
| A3 | RI Active ja fee 0 | 2026-09-30 oomi-ri-rivi-fee-nolla |
| A4 | Warning-tilaiset RI-rivit | 2026-09-22 |
| A5 | Puuttuvat RI-rivit (pyörä raportoitava, kaudelle ei riviä) | puuttuvat-ri-rivit, 2026-09-22 |
| A6 | Sopimusrivien eheys: alku > loppu; päällekkäiset item 30 -rivit | 2026-09-25 handler-lunastus-ja-vali |
| A7 | Oomin laskujen tuloutuskausi ≠ laskun kausi | T58 |
| A8 | T23 *Ended voittaa*: Done-tilaiset tyypin 7 ja 2 CR:t samalla pyörällä samassa kuussa (ennakkovaroitus kuukausiajolle) | TASKS T23 |
| A9 | T24: saman pyörän useampi käsittelemätön tai samaan kuuhun osuva siirto-CR (tyypit 1, 9), ennakkovaroitus ennen 1196:ta | TASKS T24 |
| A10 | Ended-rivillä jälkiveloituksen myöhässä-teksti (sääntö on vain T29-työohjeessa, Q24) | myohassa-teksti-ended, T29 |
| A11 | Ended-rivillä turha palkkahuomio kesken kuun päättyneestä (sääntö on vain T28-työohjeessa, Q24) | turhat-palkkahuomiot, T28 |

## Poistetut ehdokkaat

| Ehdokas | Syy | Q |
|---|---|---|
| R5 *status 1, ei tapaa, päättynyt yli 2 kk sitten* | 2 kk:n rajalle ei ole sääntöä; EX1 ja LU6 kattavat tilanteen | Q20 |
| KK3 *kauppakirjan esto voimassa* | esto on sallittu päätös, ei poikkeama (P18) | Q25 |

## Rajattu pois

- Korjaus-CSV:t ja kirjoitus NetSuiteen (P6).
- cf-gbb-toolsin NetSuite Alerts -näkymän tarkistukset (P11).
- Toteuttava repo, tekniikka, sähköpostin vastaanottajat ja lähetyskanava: päätetään toteutusvaiheessa.
