# Lisähyvitykset 22:lle liian pienelle hyvityslaskulle (CR-tyyppi 11, 14.9.2026 erä)

> [!IMPORTANT]
> **Ajettu 23.09.2026. Älä aja uudelleen.** Kaikki 22 hyvityslaskua syntyivät, 0 virhettä, ja
> lopputulos on todennettu rivi riviltä: **0 poikkeamaa**.

| | Aineistossa | NetSuitessa |
|---|---|---|
| Hyvityslaskuja | 22 | **22** (`CRMGBF0003922`–`CRMGBF0003943`) |
| Rivejä | 51 | **51** |
| Netto | 1 088,40 € | **1 088,40 €** |
| ALV 25,5 % | 277,54 € | 277,54 € |
| Brutto | 1 365,94 € | **1 365,94 €** |

Kaikilla 22:lla `externalid LIKE 'LISA9-%'`, kirjauspäivä 23.09.2026, kausi Sep 2026.

### Ajon jälkeiset tarkistukset — kaikki läpi

| Tarkistus | Tulos |
|---|---|
| Rivin netto = `rate × quantity` (ALV oikein päin) | **51/51**, bruttotulkintaa 0 |
| `rate`, kuvaus, kustannuspaikka, RevRec-päivät vs. aineisto | **51/51** täsmää |
| Kustannuspaikka kentässä `custcol_sta_endusercostcenter` | 20 riviä, oikeat arvot |
| `department` (= "Cost center") | **NULL kaikilla 51 rivillä** — kuten alkuperäisilläkin |
| Verokoodi 6 | 51/51 |
| `custbody_sta_redemption` | 0/22 — nämä eivät kirjaudu lunastuksiksi |

### Kaksi asiaa jäi auki, molemmat mäppäyksestä

1. **Kaikki 22 ovat tilassa *Open*, myös LISA9-5222 ja LISA9-6345.** `ORIGIN INVOICE EXTERNAL ID`
   ei ollut kenttämäppäyksessä, joten aineistoon täytetty kohdistus laskulle `5826-104291`
   (INVGBF1039075) ei toteutunut. Kohdista ne kaksi käsin, jos kohdistus halutaan — laskulla oli
   avointa saldoa 10 047,01 €.
2. **`custbody_sta_do_not_send_inv = T` kaikilla 22:lla**, koska mäppäyksessä oli vakio
   *`Yes` → [STA] Do not send invoice*. Seuraukset NetSuitessa juuri nyt: verkkolaskun
   lähetysvalmius 0/22, lähetetty 0/22, viitenumero 0/22, Starian uudelleenluokittelutosite 0/22.
   **Hyvitykset eivät siis ole matkalla asiakkaalle.** Täydennettävät 22 alkuperäistä hyvityslaskua
   sen sijaan lähtivät (`do_not_send_inv = F`). Päätä kumpi on oikein ja korjaa kenttä tietueille,
   jos ne on tarkoitus lähettää. Eräpäivä (`custbody_sta_credit_duedate`) asettui 22/22.

### Mäppäysvirhe ensimmäisellä ajoyrityksellä

Ensimmäinen yritys loi vain 12 hyvityslaskua. `Enduser cost center` oli mapattu kenttään
`Credit Memo - Items : Cost center`, joka on tässä tilissä uudelleennimetty **Department**
-tietueviittaus, ei Starian vapaa tekstikenttä. Ne 10 hyvityslaskua, joilla on kustannuspaikka,
kaatuivat virheeseen `Invalid department reference key … for subsidiary 2`; 12 tyhjän
kustannuspaikan hyvityslaskua meni läpi. Ne 12 poistettiin ja koko erä ajettiin uudelleen oikealla
mäppäyksellä: **`Enduser cost center` → `Credit Memo - Items : End user cost center`**
(`custcol_sta_endusercostcenter`).

> [!WARNING]
> Virhe olisi voinut olla hiljainen. Kustannuspaikka `101` on asiakkaan koodi, ja Department-listalla
> on osasto `101 Työntekijäpalvelu`. Import hylkäsi sen vain siksi, ettei viiteavain täsmännyt koko
> nimeen. Jos jonkin asiakkaan kustannuspaikkateksti osuisi osaston nimeen tarkalleen, rivi
> kirjautuisi GoByBiken omalle osastolle ilman virhettä.

## Mikä tämä on

`findings/2026-09-23-hyvitys-korjauslista-14-9.csv` listaa 26 korjattavaa hyvityslaskua CR-tyypin
11 erästä (14.9.2026, ks. `findings/2026-09-23-hyvitys-cr-14-15-9-credit-memot.md`). Tämä aineisto
kattaa **vain ne 22 riviä**, joilla `haluttu_toimenpide = Luodaan lisähyvitys CSV importilla`
(CR:t 5222, 6123, 6164, 6168, 6170, 6172, 6174, 6176, 6178, 6299, 6301, 6308, 6311, 6318, 6321,
6328, 6333, 6334, 6344, 6345, 6348, 6351). Jäljelle jääneet neljä riviä (6284, 6330, 6350 —
ylihyvitys/veloitus; 6313 — tupla-CM, kumotaan eri tavalla) **eivät** ole tässä aineistossa.

**Tiedosto:** [`2026-09-23-hyvitys-lisahyvitykset-14-9.csv`](2026-09-23-hyvitys-lisahyvitykset-14-9.csv),
muoto `import-templates/hyvityslasku-creditmemo.md`. 22 uutta hyvityslaskua, 51 riviä yhteensä.
Puolipiste-erotin, UTF-8 BOM, CRLF, desimaalipilkku — todennettu tiedoston tavuista.

## Mitä rivit sisältävät ja miksi

Alkuperäinen `handler_hyvitys` (ennen 16.9. korjausta) hinnoitteli nämä 22 hyvityslaskua väärän
(tulevan/stub-)sopimusrivin `price_month`-arvolla oikean rivin sijaan — ks. juuren finding-dokumentti
§ 2. Jokainen tässä aineistossa oleva rivi on **vain erotus**: uusi hyvityslasku, jonka `Unit price`
= oikean sopimusrivin `price_month` − alkuperäisen hyvityslaskun rivin `rate`, samalla
(kuukausi, item)-jaottelulla kuin alkuperäisellä hyvityslaskulla. Rivi, jonka erotus on 0 (item
31:n hinta oli jo oikein 6 CR:llä: 5222, 6172, 6178, 6308, 6311:n item 30, ja molemmat itemit
CR 37520/37916/39932:n item 31:llä, joilla `price_month = 0` molemmilla riveillä), on **jätetty
aineistosta pois** — se ei toisi mitään.

Kaikki todennettu NetSuitesta 23.09.2026 (ei koodista pääteltynä):

- Alkuperäisten 22 hyvityslaskun rivit: `item`, `rate`, `netamount`, `custcol_sta_so_revrec_start/end`,
  `custcol_sta_endusercostcenter` — kysely 1 alla.
- Oikea ja väärä sopimusrivi per pyörä/item: `customrecord_sta_ca_agreement_row` — kysely 2.
  Tunnistus: rivi, jonka `custrecord_sta_ca_row_invoicehistory` **ei ole tyhjä** ja sisältää
  hyvitetyn kuukauden, on oikea; tyhjän historian (`[]`, tuleva/stub-rivi) hinta on se, jota
  `handler_hyvitys` käytti virheellisesti.
- Tax code (6, VAT:S-FI 25,5 %) kaikilla 22 alkuperäisellä rivillä — kysely 3.
- Jokaisen `External ID`:n (`LISA9-<cr_id>`) ainutlaatuisuus — kysely 4, 0 osumaa.

Per-CR-erotus täsmää `findings/2026-09-23-hyvitys-korjauslista-14-9.csv`:n `erotus_netto`-sarakkeeseen
±0,01–0,02 €:n rivikohtaisella pyöristyksellä (sama ilmiö kuin alkuperäisessä auditoinnissa).
**CSV:n 51 rivin summa on 1 088,40 €** netto, sekä raakana että rivikohtaisesti 2 desimaaliin
pyöristettynä. Korjauslistan luku 1 088,51 € poikkeaa tästä 2 desimaalin pyöristyksellä.

## Tarkistus 23.09.2026 — kaksi korjausta tehty tiedostoon

Aineisto todennettiin rivi riviltä NetSuitea vasten: jokaisen rivin `Unit price` laskettiin
uudelleen kaavalla *oikea `price_month` − alkuperäisen hyvityslaskun rivin `rate`*. Kaikki 51
riviä täsmäsivät 5 desimaalin tarkkuudella, nollaerotuksen rivit oli jätetty pois oikein,
ylimääräisiä rivejä ei ollut, ja `Customer` sekä `Bike id` vastasivat alkuperäistä hyvityslaskua
joka rivillä. Kaksi poikkeamaa korjattiin:

| # | Mikä | Laajuus | Korjaus |
|---|---|---|---|
| 1 | `Enduser cost center` puuttui item 31 -riveiltä | 10 riviä | Kopioitu alkuperäisen hyvityslaskun item 31 -riviltä: `20291`, `Kempele`, `FI103430`, `101`, `351319`, `Andre Diedericks`, `10101`, `018010.3701`, `9660142`, `-` |
| 2 | Item 31 -rivin kuvaus ei nimennyt kuukautta | 23 riviä | `Toimistomaksu 1 pyörää` → `Toimistomaksu <alku>-<loppu>` |
| 3 | **`Gross Amt` sisälsi nettosumman bruttosumman sijaan** | **51 riviä** | `Gross Amt` = `Unit price × Quantity × 1,255`, 5 desimaaliin |

Kohta 2 oli oikeasti virheellinen viidellä kahden kuukauden hyvityksellä (6164, 6168, 6170, 6174,
6176), joilla kaksi item 31 -riviä olisi tullut asiakkaan laskulle identtisinä — sama teksti, sama
summa, ero vain RevRec-päivissä joita asiakas ei näe. Muutos tehtiin kaikille item 31 -riveille,
jotta muoto on yhtenäinen.

Poikkeamat 1 ja 2 johtuivat `import-templates/hyvityslasku-creditmemo.md`:n säännöistä, jotka
kuvasivat kesäkuun **massahyvityksen** muotoa (yksi hyvityslasku per asiakas) eivätkä
pyöräkohtaista muotoa. Template on korjattu: § *Rivirakenne* erottelee nyt muodot **A** ja **B**,
ja tämä aineisto on muotoa **B**.

**Poikkeama 3 oli näistä vakavin.** `Gross Amt` oli jokaisella rivillä sama luku kuin
`Unit price`, koska templaten sääntö kuului `Gross Amt = Unit price × Quantity` ilman ALV-korotusta
ja `Quantity` on tässä aineistossa aina 1. Rivin **Gross Amount** on kuitenkin määritelmältään
ALV:llinen: NetSuite olisi laskenut netoksi `Gross Amt / 1,255`, jolloin **jokainen hyvitys olisi
jäänyt 20,3 % vajaaksi** — täsmälleen sama virhe, jonka takia 06/2026:n laskuerä jouduttiin
perumaan. Virhe ei olisi näkynyt import-lokissa. Template on korjattu vastaamaan sääntöä
`Gross Amt = Unit price × Quantity × 1,255`.

Uudelleentodennus korjatusta tiedostosta: **0 poikkeamaa**. 51 riviä, 26 saraketta, UTF-8 BOM,
CRLF, ei lainausmerkkejä. Netto **1 088,40 €**, ALV 277,54 €, brutto **1 365,94 €**. Jokaisella
rivillä `ROUND(Gross Amt / 1,255, 2) = ROUND(Unit price × Quantity, 2)` — 51/51.

`TEXT FOR INVOICE` -tekstin muoto (sisältää loppukäyttäjän nimen, toisin kuin alkuperäisten
hyvityslaskujen `Vuokrasopimus:  <tunnus>`) on käyttäjän päättämä ja hyväksytty 23.09.2026.

## Ratkaistut valinnat

1. **Kohdistus.** `ORIGIN INVOICE EXTERNAL ID` on tyhjä 20 hyvityslaskulla, koska niiden
   alkuperäiset hyvityslaskut ovat *Open* eikä kohdennuskohdetta ole. **LISA9-5222 ja LISA9-6345
   kohdistetaan laskulle `5826-104291`** (INVGBF1039075, Oulun poliisilaitos), koska niiden
   alkuperäiset hyvityslaskut CRMGBF0003696 ja CRMGBF0003784 on kohdistettu juuri sille ja tämä
   lisähyvitys täydentää samaa tositetta. Lasku todennettu 23.09.2026: tila **Open**, avointa
   saldoa **10 047,01 €** / 10 176,00 € — lisähyvitysten 83,22 € ja 7,12 € mahtuvat moninkertaisesti.
2. **Kirjauspäivä** on ajopäivä **23.9.2026**, ei alkuperäisen hyvityksen 14.9.2026. Syyskuun 2026
   kausi on auki (tilillä 391 tositetta 20.–30.9.2026).
3. **`TEXT FOR INVOICE`** on käyttäjän päättämä ja hyväksytty 23.09.2026. Huomaa että muoto poikkeaa
   alkuperäisten hyvityslaskujen muodosta `Vuokrasopimus:  <tunnus>`: se nimeää täydennettävän
   hyvityslaskun ja loppukäyttäjän. Pisin arvo on 93 merkkiä (kentän pisin tuotannossa esiintyvä
   arvo on 98).

## Ennen ajoa — tarkistukset (täydentää `import-templates/hyvityslasku-creditmemo.md` § *Ennen ajoa*)

1. Kaikki 22 `External ID`:tä (`LISA9-*`) ovat vapaita NetSuitessa — todennettu (kysely 4, 0 riviä).
   Ne eivät noudata templaten muotoa `'CR' + ORIGIN INVOICE EXTERNAL ID`, koska nämä hyvityslaskut
   eivät peilaa laskua vaan täydentävät toista hyvityslaskua.
2. `Bike id`, `Customer`, `Item` (30/31), `Tax Code` (6) ja `Account` (119) ovat internal id:itä —
   todennettu olemassa olevista tietueista. Lisäksi 23.09.2026: kaikki 22 pyörää löytyvät
   pyörärekisteristä (22/22), ja kaikki 15 asiakasta ovat aktiivisia ja subsidiary 2:n alla (15/15).
3. Rungon 17 saraketta ovat identtiset saman `External ID`:n riveillä — rakennettu niin.
4. `Unit price` on **netto**, `Gross Amt` = `Unit price × Quantity × 1,255` eli **brutto**.
   `Quantity` on aina 1. Yksikään rivi ei saa olla sellainen, että nämä kaksi ovat sama luku.
5. Käyttäjän formatointiasetukset (Date DD.MM.YYYY, Number 1.000.000,00, CSV-erotin puolipiste,
   desimaali pilkku) tarkistettu sen tunnukselta, joka importin ajaa.
6. Käyttäjän formatointiasetuksissa **Run Server SuiteScript and Trigger Workflows** päällä, koska
   nämä hyvityslaskut on tarkoitus lähettää asiakkaalle (verkkolaskutus, viitenumero) — ks. template
   § *Kaikki tietueviittaukset internal id:llä* / *Ennen ajoa*.

## Ajon jälkeen — todennus

Käytä `import-templates/hyvityslasku-creditmemo.md` § *Ajon jälkeen* -kyselyitä `externalid LIKE 'LISA9-%'`
-rajauksella (ei `CR<ajo>-%`, koska tämän erän External ID -etuliite on `LISA9-`). ALV-tarkistus
(`rate_brutto` pitää olla 0) on ajettava ensin.

## Käytetyt SuiteQL-kyselyt

```sql
-- 1. Alkuperäisten 22 väärin hinnoitellun hyvityslaskun rivit
SELECT t.id cm_id, t.tranid, t.entity, t.custbody_sta_bike_id bk, tl.item, tl.rate, tl.quantity, tl.netamount,
       TO_CHAR(tl.custcol_sta_so_revrec_start,'YYYY-MM-DD') rr_start, TO_CHAR(tl.custcol_sta_so_revrec_end,'YYYY-MM-DD') rr_end
FROM transaction t JOIN transactionline tl ON tl.transaction = t.id
WHERE t.type = 'CustCred'
  AND t.id IN (736108,736115,736117,736119,736120,736121,736122,736123,736124,736153,736155,736162,
               736165,736238,736241,736248,736253,736254,736263,736264,736265,736268)
  AND tl.mainline='F' AND tl.taxline='F'
ORDER BY t.id, tl.item

-- 2. Oikea ja väärä sopimusrivi per pyörä/item
SELECT ar.id, ar.custrecord_sta_bikeid bk, ar.custrecord_sta_ca_parent_agreement parent, ag.custrecord_sta_ca_customer cust,
       ar.custrecord_sta_ca_row_item item, ar.custrecord_sta_ca_row_price_month price_month,
       ar.custrecord_sta_ca_row_invoicehistory hist,
       TO_CHAR(ar.custrecord_sta_ca_row_license_startdate,'YYYY-MM-DD') sd,
       TO_CHAR(ar.custrecord_sta_ca_row_license_enddate,'YYYY-MM-DD') ed
FROM customrecord_sta_ca_agreement_row ar
JOIN customrecord_sta_customer_agreement ag ON ag.id = ar.custrecord_sta_ca_parent_agreement
WHERE ar.custrecord_sta_bikeid IN (37693,37607,39189,38758,38366,37520,39324,39116,37916,37984,45671,
     39932,37378,45240,40691,43228,37825,39837,40708,38038,40471,45099)
ORDER BY bk, item, sd

-- 3. Tax code alkuperäisillä riveillä
SELECT DISTINCT tl.taxcode FROM transaction t JOIN transactionline tl ON tl.transaction=t.id
WHERE t.type='CustCred' AND t.id IN (<samat 22 id:tä>) AND tl.mainline='F' AND tl.taxline='F'

-- 4. External ID -törmäystarkistus
SELECT externalid FROM transaction WHERE externalid IN ('LISA9-5222', … 'LISA9-6351')

-- alkuperäisten CM:ien status ja kohdistukset (5222, 6345 → INVGBF1039075)
SELECT t.id, t.tranid, BUILTIN.DF(t.status) status, t.foreigntotal FROM transaction t WHERE t.id IN (<22 id:tä>)
SELECT l.nextdoc, inv.tranid, inv.externalid FROM previoustransactionlinelink l
JOIN transaction inv ON inv.id = l.previousdoc
WHERE l.nextdoc IN (<22 id:tä>) AND inv.recordtype = 'invoice'
```
