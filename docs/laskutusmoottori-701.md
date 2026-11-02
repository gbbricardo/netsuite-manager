# Laskutusmoottori — [STA] MR Agreement Invoicing (skripti 701)

**Mitä tämä vastaa:** miten asiakkaiden leasinglaskut syntyvät `customrecord_sta_ca_agreement_row`
-riveistä, mikä rivi valikoituu, mitä jaksoa laskutetaan, ja mitä tapahtuu riville jonka
laskutushistoria on tyhjä. Kirjattu 1.11.2026, **todennettu lähdekoodista** (ei pääteltynä).

> [!IMPORTANT]
> Starian tilauslaajennuksen lähdekoodi on paikallisesti kansiossa
> **`C:\Users\Riku\Documents\GitHub\SuiteScripts\`** — se ei ole yksi kahdeksasta sisarrepostaja
> eikä sillä ole omaa gitiä tässä projektissa. Laskutusmoottorin tiedostot:
>
> | Osa | Tiedosto |
> |---|---|
> | Entry point (MR) | `Staria/Subscription Add-ons/MapReduce Scripts/sta_mr_agreement_invoicing.js` |
> | Koko logiikka | `Staria/Subscription Add-ons/modules/invoice.functions.js` (797 riviä) |
> | Rivin laskutushistoria | `Staria/Subscription Add-ons/MapReduce Scripts/sta_mr_agreement_row_inv_history_update.js` |
> | SO → lasku | `Staria/Subscription Add-ons/MapReduce Scripts/sta_mr_transform_agreement_so_to_invoice.js` |

## 1. Ajoketju

`701` ei luo laskuja vaan **myyntitilauksia**. `summarize` käynnistää kaksi muuta Map/Reducea
(`sta_mr_agreement_invoicing.js:122-149`):

```
701 [STA] MR Agreement Invoicing          → Sales Order per sopimus
 ├─ 967 customscript_sta_mr_update_row_invhist   → kirjoittaa rivien laskutushistorian
 └─ 968 customscript_sta_mr_transform_so_to_inv  → muuntaa SO:t laskuiksi
```

967 ja 968 ovat deploymenteiltaan `NOTSCHEDULED`, ja **se on oikein** — ne käynnistyvät
`task.submit()`-kutsulla, ei ajastuksella. Siksi laskujen `createddate` on tunteja 701:n
lokirivien jälkeen: 1.10.2026 ajo lokitti 10:50–16:24 ja laskut syntyivät seuraavana yönä.

## 2. Ajastus ja parametrit

Deployment `customdeploy_sta_mr_agreement_invoicing` on **SingleEvent** — taloustiimi asettaa
jokaiselle kuukaudelle erikseen sen päivän, jona laskut halutaan muodostuvan. Ei toistuvuutta,
eikä puuttuva seuraava ajankohta ole vika.

| Parametri | Merkitys |
|---|---|
| `custscript_sta_mr_invoice_date` | Laskun **tositepäivä**. Jos tyhjä, käytetään sopimuksen `next_invoice_date`:a (`invoice.functions.js:51-56`) |
| `custscript_sta_mr_subscription_type` | 1 = avoimet tilaukset, muu = jaksolliset (GBB on jälkimmäinen) |
| `custscript_sta_mr_agreement_id` / `_number` | Rajaus yhteen sopimukseen — **koodissa kommentoitu pois** (`:623-632`), ei siis toimi |
| `custscript_sta_mr_index_date` | Indeksikorotus |

**Laskutettava jakso = sopimuksen `custrecord_sta_ca_date_next_invoice`** (`:49`, `:681`), loppu
= alku + `invoice_frequency` kuukautta − 1 päivä (`:683`). Tositepäivä on tyypillisesti kuukautta
aiemmin: 1.10.2026 ajossa laskujen `trandate` oli 1.10.2026 ja laskutettu jakso 1.–30.11.2026.

> **Tästä syystä taloustiimi ajaa `Next Invoice Date` -massapäivityksen juuri ennen ajoa.**
> Jakso tulee suoraan siitä kentästä, ei ajon päivästä. Ajon jälkeen `updateAgreement`
> (`:503-527`) siirtää sopimuksen `last_invoice` = laskutettu jakso ja `next_invoice` = +1 kk.

## 3. Mikä rivi valikoituu (`getInvoices`, `:531-668`)

Tallennettu haku `customrecord_sta_ca_agreement_row` -tietueelle. Pakolliset ehdot kaikille:

| Ehto | Rivi |
|---|---|
| sopimusta ei ole päätetty (`date_terminated` ei tänään tai aiemmin) | `:610` |
| sopimuksen `custrecord_sta_ca_status` = 1 | `:612` |
| sopimus ei passiivinen | `:614` |
| rivi ei passiivinen | `:616` |
| **`custrecord_sta_ca_row_status` = 1** | `:618` |

Lisäksi rivin on täytettävä yksi neljästä vaihtoehdosta. GBB:llä merkitseviä ovat kaksi
ensimmäistä (`:571-592`):

- **A — ei koskaan laskutettu:** `invoicehistory` on tyhjä **ja** `row_license_startdate` −
  `invoice_advance` on ennen tätä päivää **ja** `renewal_of` on tyhjä **ja** tuotetyyppi on
  tyhjä tai 1.
- **B — normaali kuukausirivi:** `next_invoice_date` − `invoice_advance` ≤ tänään **ja**
  `row_license_enddate` **on tämän päivän jälkeen** **ja** tuotetyyppi ≠ 3 **ja** rivin
  `invoice_date` on tyhjä.

`invoice_advance` on sopimuksella **35 päivää** koko kannassa, eli jakso avautuu laskutettavaksi
35 päivää ennen jakson alkua.

### Rivitila 1 on laskutusportti

`custrecord_sta_ca_row_status = 1` laskutetaan, **2 ohitetaan** (`:618`). Tämä on tärkein yksi
yksityiskohta kattavuuskyselyissä: `isinactive = 'F'` **ei** riitä rajaukseksi, eikä
`custrecord_sta_ca_row_to_be_invoiced` ole portti (se koskee vain tuotetyyppiä 3, `:604`).
Esimerkki 1.11.2026: 15 päättynyttä pyörää (tila 2/3), joilla oli `isinactive = F` -rivejä
vuoteen 2030 asti — 14:ää ei laskutettu, koska niiden rivitila oli 2.

### Toinen portti: `preProcessAgreementLines` (`:693-696`)

```js
if (billPeriodStart.isBefore(rowData.date.start) || endmoment.isBefore(billPeriodStart)) {
    isActive = false;   // riviä ei laskuteta
}
```

Eli rivi ohitetaan, jos se ei ole vielä alkanut tai **jos sen loppupäivä on ennen jakson alkua**.
Siksi 30.11.2026 päättyvä rivi ei saa joulukuun laskua, vaikka se olisi rivitilassa 1.

## 4. Tyhjä laskutushistoria = takautuva laskutus (catch-up)

`createSO`, `invoice.functions.js:199-226`:

```js
// Catch-up logic: If never invoiced and startDate < nextInvoiceDate
if (!row.invoiceHistory && startMoment.isValid() && startMoment.isBefore(billPeriodStart)) {
    let catchupStartMoment = moment(row.date.start);
    let catchupEndMoment = catchupStartMoment.clone().add(1, 'months').subtract(1, 'days');
    while (catchupStartMoment.isBefore(billPeriodStart) && catchupEndMoment.isBefore(billPeriodStart)) {
        // oma SO-rivi per väliin jäänyt kuukausi, preventGrouping = true
        ...
    }
}
```

**Rivi, jonka laskutushistoria on tyhjä ja jonka alkupäivä on ennen laskutettavaa jaksoa, saa
oman SO-rivin jokaisesta väliin jääneestä kuukaudesta** — ja sen lisäksi normaalin rivin
kuluvalle jaksolle. Jaksot lasketaan rivin **alkupäivästä** kuukauden askelin, eivät
kalenterikuukausina: 22.3. alkava rivi tuottaa jaksot 22.3.–21.4., 22.4.–21.5. jne.

**Työesimerkki (B046828, todennettu 1.11.2026):** rivit 116613/116614 alkavat 1.11.2026,
laskutushistoria tyhjä, sopimuksen `next_invoice_date` 1.12.2026. Seuraava ajo tuottaa
*kaksi* riviä: catch-up 1.–30.11.2026 ja normaali 1.–31.12.2026. Marraskuu ei siis jää
laskuttamatta, vaikka sopimus ohitettiin lokakuun ajossa.

### Catch-up-kuukaudet eivät päädy rivin laskutushistoriaan

`updateAgreement` (`:519`) vie sopimukselle kentän `custrecord_subs_line_update_invhist` =
**pelkkä `billPeriodStart`**, ja 967 lisää riveille vain sen yhden päivän
(`sta_mr_agreement_row_inv_history_update.js:81-94`). Catch-up-kuukaudet päivitetään vain
muistissa olevaan objektiin (`:219`), eivät tietueelle.

Yllä olevassa esimerkissä rivin historiaksi tulee siis `["2026-12-01"]`, vaikka lasku kattaa
myös marraskuun. **Seuraukset muihin repoihin:**

- `cr_invoice_guard.checkWasBilled` (cr-scripts) ei näe catch-up-kuukautta laskutettuna.
- `handler_hyvitys` hinnoittelee hyvitettävän kuukauden riviltä, jonka historiassa kuukausi on —
  catch-up-kuukaudelta se ei löydä riviä.
- HY2-poikkeamasääntö (`poikkeamaraportointi-vaatimukset.md`) ei havaitse catch-up-kuukautta.

Tuplalaskutusta tämä ei aiheuta: toisella kierroksella `!row.invoiceHistory` on jo epätosi.

## 5. Ansat

1. **Älä koskaan tyhjennä rivin laskutushistoriaa.** Catch-up-silmukalla ei ole takarajaa — 2023
   alkanut rivi, jonka historia tyhjennetään, laskuttaa kymmeniä kuukausia takautuvasti yhdellä
   ajolla.
2. **Moottori ei vertaa laskutettavaa jaksoa rivin laskutushistoriaan.** Ainoa suoja samaa jaksoa
   vastaan on sopimuksen `next_invoice_date`. Jos se palautetaan taaksepäin tai jätetään
   päivittämättä, sama jakso laskutetaan uudelleen ilman varoitusta. Tämä on historiallinen
   juurisyy väärin laskutetuille sopimusriveille.
3. **Rinnakkaista SO:ta ei estetä ennakolta.** `findExistingSalesOrder` (`:313-326`) ajetaan vain,
   jos `salesOrder.save()` heittää — se ei ole etukäteistarkistus.
4. **Päällekkäiset rivit laskuttuvat molemmat.** Sama pyörä + sama item + kaksi rivitilan 1 riviä,
   joiden jaksot menevät päällekkäin = kaksi laskuriviä (B033217, T72). Tarkistuskysely on § 6.
5. **Rivin loppupäivä, ei pyörärekisterin `subsc_end_date`, ratkaisee.** Lunastettu pyörä, jonka
   rivit ovat rivitilassa 1 ja jatkuvat tulevaisuuteen, laskutetaan edelleen.
6. **`custscript_sta_mr_agreement_id` ei rajaa mitään** — rajauskoodi on kommentoitu pois.
   Yhden sopimuksen testiajoa ei siis ole.

## 6. Tarkistuskyselyt ennen ajoa

Vaihda päivämäärät laskutettavan jakson mukaan (alla jakso 1.12.2026).

```sql
-- 1. Päällekkäiset laskutettavat rivit laskutettavalle jaksolle (odotus: 0 riviä)
SELECT br.name, r.custrecord_sta_ca_row_item, COUNT(*),
       LISTAGG(r.id || ':' || TO_CHAR(r.custrecord_sta_ca_row_license_startdate,'DD.MM.YY')
               || '-' || TO_CHAR(r.custrecord_sta_ca_row_license_enddate,'DD.MM.YY'), '  ')
FROM customrecord_sta_ca_agreement_row r
JOIN customrecord_sta_bike_register br ON br.id = r.custrecord_sta_bikeid
WHERE r.isinactive = 'F' AND r.custrecord_sta_ca_row_status = 1
  AND r.custrecord_sta_ca_row_license_startdate <= TO_DATE('2026-12-31','YYYY-MM-DD')
  AND (r.custrecord_sta_ca_row_license_enddate IS NULL
       OR r.custrecord_sta_ca_row_license_enddate >= TO_DATE('2026-12-01','YYYY-MM-DD'))
GROUP BY br.name, r.custrecord_sta_ca_row_item HAVING COUNT(*) > 1

-- 2. Jakso jo laskutettu jollekin riville (odotus: 0)
SELECT COUNT(*) FROM customrecord_sta_ca_agreement_row
WHERE isinactive = 'F' AND custrecord_sta_ca_row_invoicehistory LIKE '%2026-12-01%'

-- 3. Kaikilla sopimuksilla sama jakso (odotus: yksi rivi)
SELECT TO_CHAR(custrecord_sta_ca_date_next_invoice,'YYYY-MM-DD'), COUNT(*)
FROM customrecord_sta_customer_agreement WHERE isinactive = 'F' GROUP BY 1

-- 4. Laskutetaan kauden päättymisen jälkeen
SELECT br.name, br.custrecord_sta_bike_status, br.custrecord_gbb_liab_settle_method
FROM customrecord_sta_ca_agreement_row r
JOIN customrecord_sta_bike_register br ON br.id = r.custrecord_sta_bikeid
WHERE r.isinactive = 'F' AND r.custrecord_sta_ca_row_status = 1
  AND br.custrecord_sta_subsc_end_date < TO_DATE('2026-12-01','YYYY-MM-DD')
  AND (r.custrecord_sta_ca_row_license_enddate IS NULL
       OR r.custrecord_sta_ca_row_license_enddate >= TO_DATE('2026-12-01','YYYY-MM-DD'))

-- 5. Aktiivinen pyörä ilman vuokrariviä jaksolle (alilaskutus; tyypin 3 CR selittää useimmat)
SELECT br.name FROM customrecord_sta_bike_register br
WHERE br.isinactive = 'F' AND br.custrecord_sta_bike_status = 1
  AND br.custrecord_sta_subsc_end_date >= TO_DATE('2026-12-31','YYYY-MM-DD')
  AND NOT EXISTS (SELECT 1 FROM customrecord_sta_ca_agreement_row r
    WHERE r.custrecord_sta_bikeid = br.id AND r.isinactive = 'F'
      AND r.custrecord_sta_ca_row_status = 1 AND r.custrecord_sta_ca_row_item IN (30, 33)
      AND r.custrecord_sta_ca_row_license_startdate <= TO_DATE('2026-12-31','YYYY-MM-DD')
      AND (r.custrecord_sta_ca_row_license_enddate IS NULL
           OR r.custrecord_sta_ca_row_license_enddate >= TO_DATE('2026-12-01','YYYY-MM-DD')))
```

Kyselyn 5 osumista valtaosa on **laskutustaukoja**: pyörällä on Done-tilainen tyypin 3 CR
(*Välikuukaudet*, "2H"), jonka `custrecord_cr_start_date` on täsmälleen se kuukausi, jona
vuokrarivi jatkuu. Hallintamaksurivi (item 31) juoksee tauon yli. Vain ne osumat, joilla ei ole
tyypin 3 CR:ää, ovat todellisia aukkoja. 1.11.2026: 22 osumaa, joista 19 oli taukoja.

## 7. Lokien lukeminen

`scriptnote`-taulusta `scripttype = 701`. Lokikello on Helsinki − 9 h (talviaika) tai − 10 h
(kesäaika). Rivikohtaisesti kiinnostavat `reduce END` (governance) ja `Sales Order Created`.
Catch-up näkyy riveinä `No Invoice History` ja `Adding catchup line  catchup period …`.
