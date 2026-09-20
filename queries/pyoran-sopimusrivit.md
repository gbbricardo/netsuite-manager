# pyoran-sopimusrivit — yhden pyörän kaikki sopimusrivit lähdenimillä

**Tarkoitus:** Näyttää pyörän jokaisen `customrecord_sta_ca_agreement_row`-rivin, myös passiiviset
ja suljetut, emosopimuksen asiakkaan nimellä, nimikkeen nimellä ja statuksen nimellä. Tämä on
lähtökysely kun yksittäistä pyörää tutkitaan: siitä näkee siirtohistorian (asiakas vaihtuu),
kauden katkot ja OOMI-tynkäparin.

**Käyttäjät:** sopimusriviauditoija (työtapa kohta 7, yksittäisen rivin varmistus; A1, A3, D1, D2),
ri-auditoija (vuokra-arvon lähde, luokka 2).

**Parametrit:** `<BIKE_ID>` = pyörärekisterin sisäinen id (esim. 5296).

**Todennettu:** 2026-09-18, 6 riviä, pyörä 5296 (kaksi siirtoa: Fimpec Group Oy → Sweco Finland
Oy → Sweco PM Oy; vanhat rivit `isinactive = T`, status 2 Closed).

**Sarakkeet:** `id` → rivin sisäinen id · `item_id` / `item_df` → nimike (30 Vuokra, 31
Toimisto- ja käsittelykulu) · `prolong` → `custrecord_sta_is_prolongation_line` (`T`/`F`) ·
`isinactive` (`T`/`F`) · `status` / `status_df` → 1 Active, 2 Closed · `s` / `e` → kauden alku ja
loppu `YYYY-MM-DD` · `price` → kuukausihinta **netto** · `customer` / `customer_df` → emosopimuksen
asiakas · `agreement` → emosopimuksen id · `hist` → laskutushistoria JSON-taulukkona.

```sql
SELECT r.id,
       r.custrecord_sta_ca_row_item              AS item_id,
       BUILTIN.DF(r.custrecord_sta_ca_row_item)  AS item_df,
       r.custrecord_sta_is_prolongation_line     AS prolong,
       r.isinactive,
       r.custrecord_sta_ca_row_status            AS status,
       BUILTIN.DF(r.custrecord_sta_ca_row_status) AS status_df,
       TO_CHAR(r.custrecord_sta_ca_row_license_startdate,'YYYY-MM-DD') AS s,
       TO_CHAR(r.custrecord_sta_ca_row_license_enddate,'YYYY-MM-DD')   AS e,
       r.custrecord_sta_ca_row_price_month       AS price,
       ca.id                                     AS agreement,
       ca.custrecord_sta_ca_customer             AS customer,
       BUILTIN.DF(ca.custrecord_sta_ca_customer) AS customer_df,
       r.custrecord_sta_ca_row_invoicehistory    AS hist
FROM customrecord_sta_ca_agreement_row r
LEFT JOIN customrecord_sta_customer_agreement ca ON ca.id = r.custrecord_sta_ca_parent_agreement
WHERE r.custrecord_sta_bikeid = <BIKE_ID>
ORDER BY r.custrecord_sta_ca_row_item, r.custrecord_sta_ca_row_license_startdate, r.id
```

**Tarkistukset:** `LEFT JOIN` emosopimukseen ei monista rivejä (yksi emosopimus per rivi);
rivimäärä 6 = `SELECT COUNT(*) … WHERE custrecord_sta_bikeid = 5296`. Pyörän 5296 tulos vastaa
`PROJEKTIN_TILA.md` § 4.13:n kuvausta (rekisterissä 936, rivit 155299:llä 01.10.2026 alkaen).

**Huomiot:** Ei suodata laskutusvastuullisiin — se on tarkoitus, historia näkyy. OOMI-pyörällä
tulos on vähintään 4 aktiivista riviä (pää- ja tynkäpari), se ei ole duplikaatti. `hist` on
Long Text ja palautuu MCP:llä kokonaan; SuiteScriptin `N/query` ei palauttaisi sitä.
