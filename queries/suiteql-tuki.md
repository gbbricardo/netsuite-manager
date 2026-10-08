# SuiteQL-tuki tällä tilillä — todennettu koekyselyillä

**Todennettu:** 2026-09-18 NetSuite MCP:n `ns_runCustomSuiteQL`-työkalulla (REST SuiteQL).
Jokainen rivi alla on ajettu, ei muistettu. Kun jokin muuttuu, aja koekysely uudelleen ja päivitä
päivämäärä — älä korjaa taulukkoa päättelemällä.

> **Tämä koskee vain REST/MCP-SuiteQL:ää.** SuiteScriptin `N/query.runSuiteQL` on eri moottori:
> se kaatuu päivämääräpredikaatteihin custom-tietueilla (`Invalid or unsupported search`) ja
> palauttaa Long Text -kentät tyhjinä. MCP:llä toimiva kysely **ei** todista että sama SQL toimii
> skriptissä (`netsuite-subscrption-cr-scripts/CLAUDE.md` § *Date predicates in queries*).

## Toimii

| Rakenne | Koekysely (tiivistetty) | Tulos |
|---|---|---|
| `FETCH FIRST n ROWS ONLY` | `SELECT id, name FROM customlist_cr_type_list ORDER BY id FETCH FIRST 3 ROWS ONLY` | 3 riviä — **vain custom-tietuetauluilla**, ks. Kaatuu |
| `ROWNUM <= n` | `… WHERE ROWNUM <= 3 ORDER BY id` | 3 riviä |
| `WITH … AS (…)` CTE | `WITH t AS (SELECT id FROM customlist_cr_type_list) SELECT COUNT(*) FROM t` | 10 — **toimii**, vaikka MCP-työkalun oma kuvaus väittää muuta |
| `ROW_NUMBER() OVER (PARTITION BY … ORDER BY …)` | customlist_cr_type_list, partition `isinactive` | oikeat juoksunumerot |
| `COUNT(*) OVER (PARTITION BY …)` | sama | 10 |
| `LAG(x) OVER (PARTITION BY … ORDER BY …)` | sopimusrivit pyörälle 5296, `LAG(enddate)` per item | edellisen rivin loppu oikein |
| Päivämäärien erotus `d1 - d2` | `startdate - LAG(enddate) OVER (…)` | päiviä kokonaislukuna (1 = vierekkäiset) |
| `LISTAGG(x, ', ') WITHIN GROUP (ORDER BY …)` | customlist_cr_type_list | yksi merkkijono |
| `CURRENT_DATE`, `SYSDATE` | `TO_CHAR(CURRENT_DATE,'YYYY-MM-DD')` | 2026-09-18; SYSDATE sisältää kellonajan |
| `ADD_MONTHS`, `LAST_DAY`, `TRUNC(d,'MM')`, `d - 30`, `MONTHS_BETWEEN` | yksi rivi customlist_cr_status_list:stä | kaikki oikein; `MONTHS_BETWEEN` palauttaa desimaalin (3.9677) |
| `TO_CHAR(d,'YYYY-MM')` | sama | `2026-09` |
| `FROM DUAL` | `SELECT 1 AS x, 'a' \|\| 'b' FROM DUAL` | toimii |
| `\|\|` katenointi | `name \|\| ' (' \|\| id \|\| ')'` | toimii, numero muuttuu tekstiksi itsestään |
| `CASE WHEN`, `NVL`, `COALESCE` | | toimivat |
| `SUBSTR`, `INSTR`, `LENGTH`, `UPPER`, `REPLACE` | | toimivat |
| `LIKE … ESCAPE '\'` | `name LIKE 'WARNING\_CR%' ESCAPE '\'` | toimii — `_` on muuten jokerimerkki |
| `REGEXP_LIKE(x, '^Siirto')` | customlist_cr_type_list | 5 |
| `REGEXP_SUBSTR(x, 'pat (grp)', 1, 1, NULL, 1)` alalausekkeella, myös liitosehdossa | `t.tranid = REGEXP_SUBSTR(cr.custrecord_cr_automation_logs, 'Invoice ([A-Z0-9]+) created', 1, 1, NULL, 1)` (2026-10-08) | 884 laskua 907 type-7 CR:stä — **toimii** |
| `EXISTS (SELECT 1 …)` | sopimusrivit joiden pyörä on OOMI | 35 342 riviä / 9 142 pyörää |
| `IN (SELECT id FROM …)` select-kentällä | RI-rivit joiden pyörä on OOMI, kausi 10/2026 | 51 |
| `COUNT(DISTINCT x)` | | toimii |
| `COUNT(select_kenttä)` | `COUNT(p.custrecord_pl_ns_bike_id)` | 9 258 (= `SUM(CASE WHEN … IS NOT NULL …)`) |
| `BETWEEN TO_DATE(…) AND TO_DATE(…)` | | toimii |
| Päivämäärä vs. suomalainen merkkijono | `d = '01.10.2026'` vs `d = TO_DATE('2026-10-01','YYYY-MM-DD')` | sama tulos (381) — **käytä silti TO_DATE**, merkkijonomuoto riippuu tilin lokaalista |
| Sisäkkäinen näkymä + `GROUP BY` + `HAVING` | `SELECT t.* FROM (SELECT bike, COUNT(*) n … GROUP BY bike HAVING COUNT(*) > 2) t ORDER BY t.n DESC` | toimii — **tämä on tapa lajitella ryhmiteltyä tulosta**, ks. Kaatuu |
| `GROUP BY x` ilman `ORDER BY` | payment_requests per `custrecord_pl_ns_status` | toimii |
| `GROUP BY x ORDER BY 2 DESC` (sarakkeen numero) | sama | toimii |
| `UNION ALL` eksplisiittisillä sarakkeilla | viiden taulun `COUNT(*)` | toimii |
| `BUILTIN.DF(select_kenttä)` SELECT-osassa | `BUILTIN.DF(r.custrecord_sta_ca_row_item)`, `BUILTIN.DF(ca.custrecord_sta_ca_customer)` | näyttönimi |
| `ORDER BY … DESC NULLS LAST` | | toimii |
| Alias `list` ORDER BY:ssa | `SELECT name AS list … ORDER BY list` | **toimi** 2026-09-18 — aiempi "list on varattu sana" -väite ei toistunut tässä muodossa; vältä silti |
| Long Text -kenttä | `custrecord_sta_ca_row_invoicehistory` pyörälle 45000 | JSON-taulukko palautuu kokonaan (`["2026-05-01", …]`) |
| Liitos `item`-tauluun | `LEFT JOIN item i ON i.id = r.custrecord_sta_ca_row_item` → `i.itemid`, `i.displayname` | toimii |
| Liitos `customer`-tauluun | `LEFT JOIN customer c ON c.id = b.custrecord_sta_contract_employer` → `c.companyname` | toimii (monthly-reporting/tools/testikyselyt_c1_c5.sql) |
| `transaction` + `transactionline` | `WHERE t.custbody_sta_bike_id = 35490 AND tl.mainline = 'F' AND tl.taxline = 'F'` | laskut ja myyntitilaukset; `t.type` = `CustInvc` / `SalesOrd`; `tl.netamount` **negatiivinen** tulopuolella, `tl.rate` positiivinen |
| `systemnote` rivihaku | `WHERE sn.field = 'CUSTRECORD_STA_SUBSC_END_DATE' AND sn.date >= …` | toimii; sarakkeet `recordtypeid`, `recordid`, `field` (ISOLLA), `oldvalue`/`newvalue` näyttömuodossa (`28.02.2027`), `name`, `context` (`UIF` = käyttöliittymä), `type`, `date` |
| Metadatataulut `CustomList`, `script`, `scriptdeployment`, `file` | `tools/export-schemas.mjs`, `testikyselyt_c1_c5.sql` | toimivat |

## Kaatuu tai ei ole

| Rakenne | Virhe | Kierto |
|---|---|---|
| `GROUP BY x ORDER BY <alias>` | `Invalid or unsupported search` | `ORDER BY 2` tai sisäkkäinen näkymä ja `ORDER BY` ulkopuolella |
| `GROUP BY x ORDER BY COUNT(*) DESC` | `An unexpected SuiteScript error has occurred` | sama kierto |
| `BUILTIN.DF(x)` GROUP BY -lauseessa | `Invalid or unsupported search` | ryhmittele id:llä sisäkkäisessä näkymässä, liitä `CUSTOMLIST_…`-taulu nimen saamiseksi ulkopuolella |
| `systemnote` + `GROUP BY` (mikä tahansa sarake) | `Invalid or unsupported search` | hae rivit ja laske itse |
| `FETCH FIRST` metadatatauluilla (`CustomRecordType`) | `syntax error … near: FETCH` | `ROWNUM <= n` |
| `CustomRecordType.id` | `Unknown identifier "ID"` | vain `scriptid`, `name`; kenttämetadata `ns_getRecordTypeMetadata`-työkalulla |
| Taulu `CustomField` | `Record 'CustomField' was not found` | `ns_getRecordTypeMetadata(recordType)` → `x-ns-filterable`-lista ja kenttätyypit |
| `SELECT *` `UNION ALL`:in kanssa | (dokumentoitu CLAUDE.md) | nimeä sarakkeet |
| Taulu `accountingPeriod` | ei käytettävissä (lunastusauditoija) | älä päättele avoimia kausia kyselyllä |
| Sisäkkäinen näkymä `(… GROUP BY … ORDER BY 2 DESC FETCH FIRST 10 ROWS ONLY)` + korreloidut skalaarialikyselyt `transaction`-tauluun SELECT-osassa (2026-10-08) | `Invalid or unsupported search` | **ei eristetty** kumpi osa kaataa; kierto: aja top-N erikseen ja syötä id:t `IN (…)`-listana; `MIN((SELECT MIN(…) FROM transactionline …))` GROUP BY:n sisällä toimi |

## Työkalujen käyttäytyminen

- `ns_runCustomSuiteQL`: parametri **`sqlQuery`**. Palauttaa `resultCount`, `totalResults`,
  `numberOfPages`, `pageSize` (oletus 100). Ilman sivutusta enintään 5 000 riviä. Sivuta
  `pageSize: 1000`, `pageIndex: 0…numberOfPages-1`. Iso tulos tallentuu tool-results-tiedostoon —
  lue se `Read`illä.
- `ns_getRecordTypeMetadata(recordType)`: REST-metadatakatalogin JSON-skeema. Kentät `properties`-
  oliossa (`title`, `type`, `format: date|date-time`), select-kentät objekteina (`id`, `refName`),
  suodatettavat kentät listassa `x-ns-filterable`. Tästä `schemas/records/` on generoitu.
- `ns_getSuiteQLMetadata`: **jättää taulun nimen huomiotta** ja palauttaa koko 1 433 taulun
  katalogin. Käytä vain kun etsit taulua jonka nimeä et tiedä, ja vain kerran per sessio.
- `ns_getRecord(recordType, id)`: yksi tietue REST-muodossa; select-kentät `{id, refName}`.

## Datan muoto kyselytuloksissa

- Päivämäärät `DD.MM.YYYY` ellei `TO_CHAR`; datetime `DD.MM.YYYY HH:MM`
- Checkbox `'T'` / `'F'`
- Select-kentät sisäisenä id:nä (numero); nimi `BUILTIN.DF(kenttä)`:lla tai liitoksella
- Currency-kentät numeroina REST-vastauksessa MCP:n kautta (cf-gbb-tools saa ne merkkijonoina
  omalla REST-asiakkaallaan — eri polku)
- `systemnote.name` voi olla `-5` myös käyttöliittymämuokkauksissa; `BUILTIN.DF(sn.name)` antoi
  silloin integraatiokäyttäjän nimen. Kirjoittajan tunnistus vaatii tietueen System Notes -välilehden.

## Taulukoot 2026-09-18

| Taulu | Rivejä |
|---|---|
| `customrecord_sta_bike_register` | 46 737 |
| `customrecord_sta_ca_agreement_row` | 115 988 |
| `customrecord_gbb_monthly_reporting_item` | 103 282 |
| `customrecord_payment_requests` | 9 448 |
| `customrecord_subscrption_change_request` | 5 519 |

Liitos rekisteri × sopimusrivit ilman suodatinta on 46 737 × 115 988 -kokoluokan työ — aloita aina
`COUNT(*)`:lla ja yhdellä pyörällä.
