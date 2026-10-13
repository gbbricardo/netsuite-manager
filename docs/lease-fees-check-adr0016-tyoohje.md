# Työohje: lease fees check ADR 0016:n ja ADR 0018:n mukaiseksi (T59)

Kohde: `../netsuite-br-lease-fees-check` (`mr_lease_fees_check_v2.js` ja `lib_lease_fees_check.js`, PR #1). NetSuite: skripti **1432**
`customscript_gbb_lease_fee_check`, deployment `customdeploy_gbb_lease_fee_check`, **SCHEDULED**.
Säännöt ovat [ADR 0016](adr/0016-kaikki-vuokrat-maksettu.md):ssa ja sen toteutustarkennukset
[ADR 0018](adr/0018-lease-fees-check-tarkennukset.md):ssa (grilling 12.10.2026). Taustalla on [ADR 0013](adr/0013-kauppakirjan-lahetys.md).
**Live ennen 1.11.2026.** Tämä ohje ei muuta mitään, vaan työ tehdään sisarrepossa erillisessä istunnossa.

*Kirjoitettu uudelleen 12.10.2026.* Edellinen versio (9.10.) neuvoi muuttamaan haun 796, tekemään N/search-koeskriptin ja
asettamaan lipun status 2:ssa. Ne kaikki on korvattu ADR 0018:lla.

## 1. Skriptin uusi logiikka

### getInputData: jono SuiteQL:llä (ADR 0018 k1–k2)

```sql
SELECT br.id, br.name, br.custrecord_sta_subsc_end_date
FROM customrecord_sta_bike_register br
WHERE br.custrecord_sta_bike_status = 2
  AND br.custrecord_gbb_all_lease_fees_paid = 'F'
  AND br.custrecord_sta_subsc_end_date < TO_DATE(:tanaanHelsinki, 'YYYY-MM-DD')
  AND br.custrecord_sta_subsc_end_date >= TO_DATE(:alkupaiva, 'YYYY-MM-DD')   -- parametri, tyhjä = 2025-12-01 (ADR 0018 k9, Q18)
  -- test_bike_id: AND br.id = :test_bike_id
```

- `tanaanHelsinki` lasketaan `Europe/Helsinki`-vyöhykkeellä. Runtime on noin 10 h jäljessä, joten UTC- tai
  palvelinpäivää ei käytetä. Mallina toimii 1479:n `lib_gbb_helsinki_date.js`.
- Lähetettyjä, estettyjä tai tapoja 5–8 ei rajata pois. Haku 796 ja parametri `custscript_gbb_lease_check_search_id` poistuvat.
- Suuren tuloksen sivutus tehdään `query.runSuiteQLPaged`-kutsulla. Ensimmäinen ajo palauttaa noin 7 200 riviä (alkupäivä 1.12.2025).

### map: asiakas ja kausi (ADR 0018 k3–k6)

1. Haetaan pyörän vuokrarivit:
   ```sql
   SELECT ar.id, ar.custrecord_sta_ca_row_license_startdate, ar.custrecord_sta_ca_row_invoicehistory, ca.custrecord_sta_ca_customer
   FROM customrecord_sta_ca_agreement_row ar
   LEFT JOIN customrecord_sta_customer_agreement ca ON ar.custrecord_sta_ca_parent_agreement = ca.id
   WHERE ar.custrecord_sta_bikeid = :bikeId AND ar.custrecord_sta_ca_row_item = 30
   ```
   - Historia on pitkä tekstikenttä. `SUBSTR` tai CTE-projektio kaatuu (*Invalid or unsupported search*), joten JSON
     jäsennetään JS:ssä.
   - Muoto on `["2026-05-01", ...]` vaihtelevin välilyönnein.
   - Rivi, joka alkaa päättymisen jälkeen tai jonka luettavassa historiassa ei ole yhtään kuukautta ≤ päättymiskuu, ohitetaan.
   - Jos muun rivin historia ei jäsenny, päivä on virheellinen, alkupäivä puuttuu tai asiakasta (emosopimusta) ei ole, pyörän
     tulos on **`NO_CUSTOMER`**, ja rivi ja syy kirjataan detailiin. Vanhempaa asiakasta ei valita varalle (ADR 0018 k6,
     tarkistus 12.10.). Rivit haetaan `LEFT JOIN`illa, jotta emosopimukseton rivi ei katoa.
2. Mukaan otetaan rivit, joilla `license_startdate` ≤ `subsc_end_date` ja vähintään yksi historiakuukausi
   ≤ päättymiskuu. Päättymiskuun jälkeiset historiakuukaudet ohitetaan.
3. Jos tällaisia rivejä ei ole, tulos on **`NO_CUSTOMER`**. Lippua ei aseteta, ja pyörä lokitetaan.
4. **Asiakas** on se, jonka riveillä on myöhäisin kuukausi. Tasatilanteessa mukaan otetaan kaikki asiakkaat, joilla on
   sama myöhäisin kuukausi.
5. **Kausi** asiakasta kohden:
   - Alku on asiakkaan varhaisin historiakuukausi tälle pyörälle, ilman 2025-10-poikkeusta (Q19).
   - Loppu on päättymiskuun ensimmäinen päivä.

### map: estävät laskut (ADR 0016 k1, k2, k4, k6–k8)

```sql
SELECT DISTINCT t.id, t.tranid, BUILTIN.DF(t.status) status
FROM transaction t
JOIN transactionline tl ON tl.transaction = t.id
WHERE t.type = 'CustInvc'
  AND t.entity = :customerId
  AND tl.item IN (30, 31, 33)
  AND tl.custcol_sta_so_revrec_start >= TO_DATE(:kausiAlku, 'YYYY-MM-DD')
  AND tl.custcol_sta_so_revrec_start <  ADD_MONTHS(TO_DATE(:kausiLoppu, 'YYYY-MM-DD'), 1)
  AND t.custbody_sta_bike_id IS NULL
  AND t.custbody_sta_is_so_type IS NULL
  AND t.status <> 'B'          -- B = Paid In Full
```

- Lippu asetetaan vain, jos yksikään asiakas ei palauta yhtään riviä. Laskun puuttuminen ei estä.
- Todenna `t.status`-koodi (`'B'` = Paid In Full, ks. ADR 0016:n tunnistustaulu) ja `IS NULL` -ehdot ennen dry runia
  yhdellä tunnetulla pyörällä.
- **Välimuisti:** sama asiakas ja kausi esiintyy kymmenillä pyörillä. Tulos kannattaa välimuistittaa map-ajon sisällä
  (avain asiakas|alku|loppu), tai pyörät ryhmitellään asiakkaan mukaan `reduce`-vaiheeseen. Toteuttaja valitsee.
  Suurin asiakas on Kymenlaakson hyvinvointialue, jolla on 448 riviä yhdellä laskulla.

### Kirjoitus ja loki (ADR 0018 k9–k10)

- Kun lasku ei estä eikä dry run ole päällä, kutsutaan `record.submitFields({ [PAID_FIELD]: true })`. Lippua ei koskaan palauteta F:ksi.
- Jokainen pyörä saa yhden `log.audit`-rivin:
  - Otsikko on `<TULOS> <pyörän nimi>` ja dry runissa `DRY RUN <TULOS> <pyörän nimi>`.
  - `TULOS` on `PAID` (lippu asetettu), `WAITING` (estävä lasku) tai `NO_CUSTOMER`.
  - Detail on kiinteä lista aina samassa järjestyksessä: `asiakas=<id[,id]> kausi=<YYYY-MM>..<YYYY-MM> avoimet=<tranid,…> (enintään 10, sitten +N) ohitetut_rivit=<rivi:syy,…|->`.
- `summarize` kirjoittaa yhden rivin määrineen (PAID, WAITING, NO_CUSTOMER, virheet) sekä jokaisen map-virheen.
- Parametrit ovat `custscript_gbb_lease_check_dry_run` (checkbox), `custscript_gbb_lease_check_test_bike_id` (integer) ja
  `custscript_gbb_lease_check_start_date` (date, tyhjä = 2025-12-01, luetaan Helsingin kalenteripäivänä, ADR 0018 k9 / Q18).

### Poistetaan

| Mitä | Missä nyt |
|---|---|
| `SIX_MONTHS_MS`, 5 kuukauden ikkuna | l. 14, 72-73 |
| Oomi Part A/B, `OOMI_*`-vakiot, `checkCategory1OomiDateBased` | l. 20-23, 200-265, 380-405 |
| Luokka 2 (jälkiveloitus), `checkCategory2`, `cat1 && cat2` | l. 272-355, 411 |
| *no invoice found* = hylkäys | l. 167-173, 238-244 |
| `duedate on` -laskuhaku ja `record.load` (sopimus, pyörä) | l. 139-150, 126, 368 |
| Tiedostoloki, `writeLogFile`, `log_folder_id`- ja `search_id`-parametrit | l. 26-55, 457-503 |
| `N/file`-, `N/search`-moduulit | l. 5 |

## 2. Sisarrepon dokumentit

- **README:**
  - Korjaa tunnukset muotoon `customscript_gbb_lease_fee_check` / `customdeploy_gbb_lease_fee_check` (1432). Tiedostonimi säilyy.
  - Kirjoita kaavio, parametrit ja rajoitukset uudelleen.
  - Poista *Manual override* ja kirjoita tilalle: lähetys käsin ADR 0013 k10–11:n mukaan.
  - Viittaa ADR 0016:een ja 0018:aan.
- **`NETSUITE_RECORDS_AND_FIELDS.md`:**
  - Historiapäivä on vuokrakuukauden alku, ei eräpäivä.
  - Lisää `license_startdate`, `invoicehistory` (JSON, alkaa 2025-12), `custcol_sta_so_revrec_start`, `custbody_sta_bike_id` ja `custbody_sta_is_so_type`.
  - Poista OOMI- ja CR-osiot.
- **`lease_fees_check_solution_v2.md`** poistetaan.

## 3. Käyttöönotto

1. Koodi ja dokumentit tehdään sisarrepon haaraan.
2. **Ensin parametrit, sitten koodi.** Luodaan `dry_run`, `test_bike_id` ja `start_date` (tyhjäksi) skriptille 1432 ja varmistetaan, että dry run on
   päällä deploymentissa (tai deployment on Not Scheduled siirron ajan). Vasta sitten molemmat tiedostot ladataan ja Script File
   osoitetaan `mr_lease_fees_check_v2.js`:ään. Koodi on fail-closed: puuttuva parametri tarkoittaa dry runia, live vaatii dry runin
   poistamisen käsin. Vanhat parametrit poistetaan vasta ensimmäisen live-ajon jälkeen.
3. **Dry run tuotannossa.** Tuloksia verrataan §4:n odotuksiin. Dry run ajetaan ensin `test_bike_id`:llä, esimerkiksi
   B006540 (siirto päättymisen jälkeen), B024003 (siirto 6/2026; B004026 päättyy vasta 31.10.), B003328 (tasatilanne) ja yksi OOMI-pyörä.
4. **Esiehto live-ajolle: T58.** Oomin toukokuun 2026 laskujen tuloutuskausi on korjattu (T58-kysely palauttaa 0).
   Jos T58 ei ole valmis 26.10. mennessä, palataan tuoteomistajalle. Silloin vaihtoehto on käydä noin 12 avoimen
   laskun asiakkaat läpi käsin.
5. Dry run pois. Ajastus pysyy ennallaan, ennen lähetysskriptiä 1433.
6. Ensimmäisen live-ajon jälkeen haku 796 inaktivoidaan, ja päivitetään `schemas/script-inventory.md` sekä TASKS T59/T60.

T48 (haun 793 ehdot) **ei ole esiehto**, koska lippu tulee T:ksi vasta päättymisajankohdan jälkeen (ADR 0018 k2).

## 4. T60: todennus ensimmäisen ajon jälkeen

- **Määrä (12.10., alkupäivä 1.12.2025):** jono 7 174, PAID 6 775, WAITING 124, **NO_CUSTOMER 275**. NO_CUSTOMER-joukon
  pitää vastata listan `exports/2026-10-12-lease-fees-no-customer.csv` rivejä, joiden `paattymispaiva` ≥ 2025-12-01
  (B017530 jää alkupäivän alle). Selection-rivin on näytettävä `alkupaiva=2025-12-01`. Suurin osa muista saa `PAID`-tuloksen. `WAITING` keskittyy noin 58 asiakkaaseen, joilla on
  vanha avoin vuokralasku (ADR 0016 k6).
- **131 OOMI-pyörää sekä B006141 ja B034775** saavat lipun T, jos päättymisajankohta on mennyt
  (`findings/2026-10-08-lease-fees-check-duedate-findings.md`).
- **Ei yhtään väärää T:tä:** yksikään lippu T -pyörä ei ole asiakkaalla, jolla on avoin vuokralasku pyörän kaudella.
  Kysely tallennetaan `queries/`-kansioon samalla asiakas- ja kausisäännöllä.
- **Portti pitää:** lippua T ei ole asetettu yhdellekään pyörälle, jonka status on muu kuin 2 tai jonka
  `subsc_end_date` ≥ ajopäivä.
- **`NO_CUSTOMER`-pyörillä lippu on yhä F.**

## 5. Riskit

- **Lippu on lopullinen** (ADR 0016 k10). Virheellistä T:tä ei voi korjata skriptillä. Siksi dry run ja T58 tehdään ensin.
- **Skripti ajaa vanhalla logiikalla** (SCHEDULED) uuden version lataukseen asti. Hakuun 796 ei kosketa ennen sitä, ja
  inaktivointi tehdään vasta live-ajon jälkeen.
- **Päättymisajankohta siirtyy jälkiveloituksessa** (`handler_jalki`). Status 2 -pyörällä tätä ei tavallisesti tapahdu.
  Jos tapahtuu, lippua ei palauteta (hyväksytty, ADR 0016 k10).
- **Governance:**
  - Kyselyt tehdään asiakas- ja kausikohtaisesti, ei rivi riviltä.
  - Ensimmäinen ajo on noin 7 200 map-kutsua, kukin kaksi tai kolme kyselyä.
  - Jokainen pyörä saa lokirivin, myös pysyvä noin 275 pyörän `NO_CUSTOMER`-joukko (ADR 0018 k10, hyväksytty).
