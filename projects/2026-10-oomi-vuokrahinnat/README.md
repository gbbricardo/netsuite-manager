# OOMI-vuokrahintojen korjaus (alihanke, aloitettu 1.10.2026)

Korjaa OOMI-pyörät, joiden sopimusrivin kuukausivuokra (item 30 *Vuokra - Rent subs*) poikkeaa pyörärekisterin
`custrecord_sta_init_subs_rent_fee`:stä, sekä syys- ja lokakuun kuukausiraportoinnin (RI) väärät hinnat.
Tehtävät: [`TASKS.md`](TASKS.md). Alkuperäinen havainto: [`findings/2026-10-01-oomi-init-subs-rent-fee-vs-sopimusrivi.md`](../../findings/2026-10-01-oomi-init-subs-rent-fee-vs-sopimusrivi.md).

## Syy (käyttäjän selvitys 1.10.2026, ei vielä todennettu lähteestä)

Alkuperäiset Fleet-raportit raportoivat sopimukset kahdesti niin, että peruutetun sopimuksen vuokrasumma
poikkesi aktiiviseksi jääneen sopimuksen summasta. Aktiiviselle riville jäi väärä summa. Virhe koskee
**4 asiakasta ja 46 pyörää** (käyttäjän lista). NetSuiten tarkistuksessa löytyi lisäksi viides asiakas, ks. alla.

## Todennettu NetSuitesta 1.10.2026

- Käyttäjän 46 tunnusta ovat pyörärekisterin `externalid`-arvoja (Oomi-tunnus), ei B-numeroita. Kaikki 46 löytyivät,
  kaikki OOMI ja status 1 Active.
- Asiakkaat: Lapin Hyvinvointialue (37 pyörää, sopimus 5171), Junkkari Oy (3, sopimus 5110), Oomi Oy (5, sopimus 4637),
  HiQ Oy (1, sopimus 3737).
- **41 pyörällä pitkä rivi on yhä väärä**: hinta on noin 0,988 × `init_rent` (esim. B041634: 79,6813 vs 80,65).
  **5 pyörän rivi on jo korjattu käsin** (B043392, B043899, B043958, B043962, B043963): rivin hinta pyöristettynä
  2 desimaaliin = `init_rent`. Niiden osarivit (viimeinen kuu) ja RI-rivit ovat yhä vanhalla hinnalla.
- Hallintamaksu (item 31, 12,9004) täsmää kaikilla. Se ei kuulu korjaukseen.
- **RI-rivit** (`customrecord_gbb_monthly_reporting_item`): jokaisella 46 pyörällä on Active-rivi syyskuulle (1.9.) ja
  lokakuulle (1.10.), ja `lease_fee_vat0` = rivin vanha hinta. Lisäksi syyskuulla on Deleted-rivi hinnalla 0
  (tuplaraportoinnin jälki). Eron suuruus verollisena: noin **53 €/kk yhteensä** (syys 53,03–53,29, loka 53,52–53,78;
  Lapin 43,3, Junkkari 3,6, Oomi Oy 6,0, HiQ 1,2).
- **Viides asiakas, ei käyttäjän listalla:** Frends Technology Oy (sopimus 5052), 4 pyörää samalla virheellä
  (B038765, B045485, B045487, B045488), ks. `data/2026-10-01-snapshot-lisapyorat.csv`.
- **B043909 on erikoistapaus:** pitkä rivi 106886 on päättynyt 30.9.2026 (rivin status 2), lokakuussa laskutetaan
  vain osarivi 106888 (13/31).

## Laskusäännöt

- Kaikki rivihinnat ovat **netto (ALV 0)**, verollinen = netto × 1,255.
- **Osavuokra**, kun `subsc_end_date` ei ole kuun viimeinen päivä: `netto × päättymispäivän_päivä / kuukauden_päivät`,
  pyöristys 4 desimaaliin. Todennettu NetSuitesta: kaava toistaa kaikkien 45 nykyisen osarivin arvon vanhalla
  hinnalla (esim. B041634: 79,6813 × 4/30 = 10,6242; B043596: 78,51 × 29/31 = 73,4448). Sama kaava pätee
  hallintamaksun riviin, mutta sitä ei muuteta.
- **Oikea hinta on Oomin bruttohinta (Fleet), ei `init_rent`.** `init_rent` on siitä pyöristetty netto (2 des.), joten
  bruttoehdokkaita on 1–2 senttiä. Esimerkki: init 80,65 sopii brutto 101,21:een (netto 80,64542) ja 101,22:een
  (80,65339). Käsin korjatut rivit käyttävät 101,21:tä (80,64542), mutta B043899:n 40,84462 on brutto 51,26,
  ei 51,25, eli luku ei johdu `init_rent`:stä yksiselitteisesti. 31 pyörällä ehdokkaita on kaksi, ja ero osarivissä on
  enintään noin 0,01 €. Päätös: TASKS V3.

## OOMI DATA TAPE BIKES.csv (tarkistettu 1.10.2026)

Tiedosto: 15 732 riviä, 14 554 pyörää, erotin `;`, avain `Bicycle ID` = NetSuiten `externalid`. Kaikki 50 pyörää (46 + Frends 4) löytyvät.
Jokaisella on 2–3 riviä (sama pyörä eri asiakkailla ja jaksoilla: se on tuplaraportoinnin jälki). Ensimmäinen rivi on
voimassa oleva (`Lease term ends (current)` = alkuperäinen). Hinta-, rent- ja service fee -sarakkeet ovat kaikilla riveillä samat.

- **`Rent, EUR VAT 0` ei vastaa sopimusriviä** (esim. B041634: 61,8387, rivillä 79,6813; B043827: 38,6129). Rent + Service fee
  (12,9032, täsmää item 31:n 12,9004:ään) = *Total leasing payment* (74,74). Sarake näyttää olevan eri käsite, ja koko
  aineistossa sen vaihteluväli on −16,73…4 900, joten sitä ei käytetä vertailuun.
- **`Taxable value, EUR VAT 0` (sarake 49) on se, joka vastaa:** se on `init_subs_rent_fee`:n 4-desimaalinen lähde
  (80,6452 → 80,65). Yleisin arvo 80,6452 = brutto 101,21 (80,6452 × 1,255), eli juuri se, jonka käsin korjatut rivit saivat.
- Tapen mukaan `init_rent` täsmää 45 pyörällä 50:stä (±0,0068, joista 4 pyöristysrajalla). **5 pyörällä init_rent on tapea
  korkeampi**: B041634 (init 80,65, tape 80,0968, brutto 100,52), B043384 (80,3468 / 100,84), B043392 (80,3226 / 100,80),
  B044817 (79,371 / 99,61), B044889 (80,3468 / 100,84). Niillä sekä init että sopimusrivin 79,6813 (brutto 100,00) ovat
  eri luvussa kuin tape. Käyttäjä tarkisti kaikki viisi: **tape on näillä väärässä**, oikea hinta on 101,21 (ks. § Päätökset).
- Vertailu: `data/tape-vertailu.csv` (sarake `ehdotus_netto_bruttosta` = round(taxable × 1,255, 2) / 1,255).
  Frendsin 4 pyörää: tape antaa B038765 80,6452, B045485 79,4839, B045487 57,9677, B045488 80,3468 → init_rent täsmää kaikkiin,
  eli virhe on samanlainen kuin muilla (rivi 0,988 ×).

## Päätökset ja vahvistetut hinnat

| Pvm | Päätös | Lähde |
|---|---|---|
| 1.10.2026 | Oikea hinta = tapen `Taxable value, EUR VAT 0`; netto = round(taxable × 1,255, 2) / 1,255, 5 desimaalia (V3) | käyttäjä |
| 1.10.2026 | Tape ei päde viidellä pyörällä. Vahvistetut hinnat ohittavat tapen (taulukko alla). `init_subs_rent_fee`:tä ei muuteta millään pyörällä | käyttäjän tarkistus |
| 1.10.2026 | Frends Technology Oy (4 pyörää) on mukana (V5): 5 asiakasta, 50 pyörää | käyttäjä korjasi rivit ja vahvisti hinnan |
| 1.10.2026 | Jos brutto on sentilleen sama, nettoarvon desimaalien määrää ei korjata (esim. 57,9677 vs 57,96813 = 72,75). Koskee B045487:ää ja Frendsin rivejä 112412 / 112418 | käyttäjä |
| 1.10.2026 | Pitkät rivit korjataan käsin, osarivit ja RI-rivit (syys + loka) CSV:llä, laskettuna NetSuiten pitkästä rivistä tai vahvistetusta hinnasta | `imports/2026-10-01-oomi-hinnat/` |

**Vahvistetut hinnat (käyttäjä 1.10.2026):**

| Pyörä | Oomi-tunnus | Netto | Brutto | Tape sanoi |
|---|---|---|---|---|
| B041634 | CWKBK1TX | 80,64542 | 101,21 | 100,52 |
| B043384 | PCKF3435 | 80,64542 | 101,21 | 100,84 |
| B043392 | 1T8GQA6Q | 80,64542 | 101,21 | 100,80 |
| B044817 | FF1UUCZF | 80,64542 | 101,21 | 99,61 |
| B044889 | H1Z3P5ZK | 80,64542 | 101,21 | 100,84 |
| B045487 | HP4C5T2G | 57,96813 | 72,75 | 72,75 (rivin 57,9677 on sama brutto, joten riviä ei muuteta) |

## Tiedostot

| Tiedosto | Sisältö |
|---|---|
| `data/2026-10-01-ns-tila-kasinkorjauksen-jalkeen.csv` | Pitkien rivien ja RI-rivien tila NetSuitessa 1.10. käsinkorjauksen jälkeen |
| `data/2026-10-01-pitkat-tarkistus.csv` | Pitkät rivit vs tavoite (tape tai vahvistettu hinta) |
| `tools/tee-osat-ja-ri.mjs` | Tekee tuontitiedostot 01–05 yllä olevista + `VAHVISTETTU_NETTO` |
| `data/2026-10-01-snapshot-rivit.csv` | 46 pyörän tila 1.10. (pitkä rivi, osarivi, RI-rivien id:t). Käsin siirretty kyselytuloksista |
| `data/OOMI DATA TAPE BIKES.csv` | Oomin data tape (käyttäjän toimittama). Sama tiedosto on myös repon juuressa, ei versionhallinnassa |
| `data/tape-vertailu.csv` | 50 pyörän tape-arvot vs `init_rent` vs sopimusrivi |
| `data/laskelma-ehdotus.csv` | Ehdotetut oikeat hinnat: `long_oikea_lo/hi`, `partial_oikea_lo/hi`, RI-erot verollisena |
| `data/2026-10-01-snapshot-lisapyorat.csv`, `data/laskelma-lisapyorat.csv` | Frendsin 4 pyörää |
| `tools/laske.mjs` | Laskee ehdotukset snapshotista: `node tools/laske.mjs [snapshot] [ulos]`. Ei NetSuite-yhteyttä |

## Rajaukset

- Tässä projektissa ei kirjoiteta NetSuiteen ilman käyttäjän erillistä kehotusta. Pitkät rivit korjaa käyttäjä käsin.
- Snapshot vanhenee, kun käyttäjä korjaa rivejä. Aja tarkistuskysely (TASKS V2) ennen kuin luotat `tila`-sarakkeeseen.
