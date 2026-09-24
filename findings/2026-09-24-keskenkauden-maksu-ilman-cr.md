# Keskenkauden lunastuksen maksu ilman tyypin 2 CR:ää

**Havaittu:** 24.09.2026 · **Tekijä:** lunastusauditoija (vain luku, NetSuiteen ei kirjoitettu)
**Peruste:** tuoteomistajan päätös 24.09.2026: keskenkauden lunastus vaatii aina CR:n, eikä pelkkä
maksu päätä mitään ([ADR 0008](../docs/adr/0008-keskenkauden-lunastuksessa-cr-voittaa-maksun.md)
sääntö 3, [ADR 0009](../docs/adr/0009-kauden-lopun-lunastus.md) kohdat 1 ja 4).
**Rivilista:** [`2026-09-24-keskenkauden-maksu-ilman-cr.csv`](2026-09-24-keskenkauden-maksu-ilman-cr.csv)
(241 riviä, luokat alla)

## Yhteenveto

| Luokka | Mitä | Pyöriä | Vakavuus |
|---|---|---|---|
| **A1** | Active, ei OOMI, vahva keskenkauden maksu, ei CR:ää | **12** | **kriittinen**: laskutus ja palkanpidätys jatkuvat maksetulla lunastuksella |
| **A2** | Active, OOMI, vahva keskenkauden maksu, ei CR:ää | **7** | kriittinen (OOMI-polku) |
| E1 | Active, ei OOMI, epävarma | 8 | vaatii ihmisen |
| E2 | Active, OOMI, todennäköisesti kauden lopun ennakkomaksu (päättyy 10–11/2026) | 150 (56 × +1 kk, 94 × +2 kk) | ei rikkomus (päätelty) |
| R1 | Redeemed 2026, ei OOMI, keskenkauden ilman CR:ää, CR-aikana kirjattu | 1 (B006732) | historiallinen |
| R2 | Redeemed 2026 CR-aikana, osui lähteeseen mutta ei keskenkauden (päätelty) | 15 | ei rikkomus |
| R3 | Redeemed 2026, OOMI, keskenkauden `oomi_exceptional_end_date`-polulla | 13 | historiallinen, kelpaa (ADR 0009 k1) |
| X | Active, tyypin 3 SO mutta **ei maksua** (ei laskua, talletusta eikä Paylinkiä) | 35 | ei kuulu listaan, tiedoksi |
| — | Redeemed 2026, maksu ennen CR-järjestelmää (ennen 25.02.2026) | ~655 (s1), 638 (s3, jälkiveloitukset) | historiallinen, ei rivitasolla |
| — | Redeemed 2026, s2 +1 kk (kauden lopun ennakkomaksu) | 1 494 + 303 OOMI | ei rivitasolla |

**S1/K4-tarkistus:** kaikki 16 pyörää, joilta tapa tyhjennettiin 24.09., ovat listalla, paitsi
**B016666**. Sillä on nyt Pending-tilainen tyypin 2 CR **6718** (luotu 24.09.) ja sen hyvitys-CR
6719, joten se putoaa pois oikein. 11 pyörää on luokassa A1, 4 luokassa A2 (B043416, B044011,
B046058, B046429) ja 1 luokassa E1 (B012880, ks. alla).

## Menetelmä

**Populaatio:** `custrecord_sta_bike_status = 1`, **tai** status 2 ja
`custrecord_gbb_date_to_non_active >= 01.01.2026`. Tämän lisäksi pyörällä **ei** saa olla tyypin 2
CR:ää tilassa 1 tai 2. Status 2 -pyöriä, joilla `date_to_non_active` on tyhjä, ei ole yhtään (0,
tarkistettu), joten rajaus ei hukkaa tuoreita kääntöjä.

```sql
-- yhteinen rajaus kaikissa kyselyissä
WHERE (br.custrecord_sta_bike_status = 1
       OR (br.custrecord_sta_bike_status = 2 AND br.custrecord_gbb_date_to_non_active >= TO_DATE('2026-01-01','YYYY-MM-DD')))
  AND br.id NOT IN (SELECT cr.custrecord_cr_bike_registry FROM customrecord_subscrption_change_request cr
                    WHERE cr.custrecord_cr_type = 2 AND cr.custrecord_cr_status IN (1,2)
                      AND cr.custrecord_cr_bike_registry IS NOT NULL)
```

**Lähde s1: SO tai lasku, jonka `custbody_sta_is_so_type = 3`.**

```sql
AND br.id IN (SELECT t.custbody_sta_bike_id FROM transaction t
              WHERE t.custbody_sta_is_so_type = 3 AND t.type IN ('CustInvc','SalesOrd'))
```

"Maksettu" tarkistettiin erikseen: lasku `status = 'B'`, SO:lle `NextTransactionLineLink`
talletukseen tai laskuun, sekä Paylink-linkki `custrecord_pl_ns_so_id`. Koko tilillä on tyypin 3
tapahtumia seuraavasti: CustInvc B 1 573, CustInvc A 1, SalesOrd G 1 578, SalesOrd B 65,
SalesOrd H 30 ja CustCred 3.

**Lähde s2: `redemption_paid_at` ja päättymiskuukausi myöhempi kuin maksukuukausi.**

```sql
AND br.custrecord_gbb_redemption_paid_at IS NOT NULL
AND TRUNC(COALESCE(br.custrecord_gbb_exceptional_end_date, br.custrecord_gbb_oomi_exceptional_end_date,
                   br.custrecord_sta_subsc_end_date),'MM') > TRUNC(br.custrecord_gbb_redemption_paid_at,'MM')
-- +1 kk erikseen: ... = ADD_MONTHS(TRUNC(br.custrecord_gbb_redemption_paid_at,'MM'),1)
```

**Lähde s3: valmis Paylink-pyyntö, jonka tuotenimi kertoo keskenkauden lunastuksesta.**

```sql
AND br.id IN (SELECT pr.custrecord_pl_ns_bike_id FROM customrecord_payment_requests pr
              WHERE pr.custrecord_pl_status = 'completed'
                AND LOWER(pr.custrecord_pl_product_name) LIKE '%kesken kauden%')
```

Tyyppiä ei voi lukea SO:lta. Valmiista Paylink-pyynnöistä, joiden tuote on *"(Työsuhdepyörän)
kesken kauden lunastus"*, **1 017 on SO-tyyppiä 4** (*End redemption*) ja vain 1 007 tyyppiä 3.
Tämä vahvistaa ADR 0008:n D7-havainnon. Siksi s3 lukee tuotenimeä.

**Luokittelu (päätelty):** vahva (A) = s3 osuu, tai maksu on vähintään 3 kk ennen päättymiskuuta
eikä pyörää ole jälkiveloitettu (`subsc_org_end_date` = päättymisajankohta). Epävarma (E) = +1/+2 kk,
tuotteena *loppulunastus*, tai päättymisajankohta on siirtynyt `subsc_org_end_date`:n yli, eli pyörää
on jälkiveloitettu.

## Luvut per lähde (todennettu)

| Lähde | Active, ei OOMI | Active, OOMI | Redeemed 2026, ei OOMI | Redeemed 2026, OOMI |
|---|---|---|---|---|
| s1 SO/lasku tyyppi 3 | 36 (joista **1 maksettu**: B008185) | 0 | 679 (656 lyhennettyjä kausia, CR-aikana 8) | 2 |
| s2 `paid_at`, +1 kk | 1 | 56 | 1 494 | 303 |
| s2 `paid_at`, +2 kk tai enemmän | 18 | 100 | 9 | 124 |
| s3 Paylink *kesken kauden* | 11 | 6 | 797 (CR-aikana 7) | 11 |

"CR-aika" tarkoittaa, että tapahtuma tai maksu on 25.02.2026 tai myöhemmin. Ensimmäinen tyypin 2
CR on luotu silloin. Tyypin 2 CR:t tilassa: Done 1 776, Pending 7, Error 1, Cancelled 50.

Aiempi mittaus vahvistuu. ADR 0008:n mukaan keskenkauden lunastuksista 32/33:lla on CR. Tämä
ajo löysi CR-aikana Redeemed-tilaan kääntyneistä ei-OOMI-pyöristä vain yhden aidon keskenkauden
lunastuksen ilman CR:ää, B006732. Senkin maksu, 02.02.2026, on ennen CR-järjestelmää.

## Luokka A1: Active, ei OOMI (12)

| Pyörä | Päättyy | `paid_at` | Tapa / `liab_settled_at` | Lähde | Huomio |
|---|---|---|---|---|---|
| B005492 | 30.06.2029 | 05.09.2026 | — | PL 16105, INVGBB1014500 | S1/K4 |
| B010162 | 31.12.2026 | 04.09.2026 | — | PL 16041, INVGBB1014495 | S1/K4 |
| **B013550** | 31.03.2028 | 03.07.2026 | **1 / 03.07.2026** | PL 9217, INVGBB1011629 | tapa kirjattu ennen päättymiskuuta |
| B014042 | 30.11.2028 | 04.09.2026 | — | PL 16048, INVGBB1014501 | S1/K4 |
| B021319 | 31.01.2027 | 04.09.2026 | — | PL 16038, INVGBB1014510 | S1/K4 |
| B024292 | 30.04.2027 | 04.09.2026 | — | PL 16035, INVGBB1014509 | S1/K4 |
| B026437 | 28.02.2027 | 04.09.2026 | — | PL 16042, INVGBB1014503 | S1/K4 |
| B027393 | 29.02.2028 | 07.09.2026 | — | PL 16315, INVGBB1014494 | S1/K4 |
| B027471 | 30.04.2027 | 07.09.2026 | — | PL 16349, INVGBB1014488 | S1/K4 |
| **B029483** | 31.08.2027 | 03.06.2026 | **1 / 03.06.2026** | PL 5919 ja 8551, INVGBB1010634 | **epäselvä:** Siirto TA -CR 5823 Done 27.08.2026 maksun *jälkeen* |
| B029495 | 30.04.2028 | 22.09.2026 | — | INVGBB1014058 (käsilasku, ei SO-tyyppiä) | S1/K4; vanha osa A voi palauttaa tavan 1 27.09. asti |
| B032764 | 29.02.2028 | 04.09.2026 | — | PL 16045, INVGBB1014502 | S1/K4 |

`current_redemption_price` on **tyhjä kaikilla 12:lla**. CSV:ssä on `end_redemption_price`
vertailuun. Tyypin 2 CR:itä muissa tiloissa (Error, Cancelled) ei ole yhdelläkään.

## Luokka A2: Active, OOMI (7)

| Pyörä | Päättyy | `paid_at` | Tapa / `liab_settled_at` | Lähde |
|---|---|---|---|---|
| **B040838** | 31.01.2028 | 13.07.2026 | **1 / 13.07.2026** | PL 10239, INVGBB1011620 |
| **B041610** | 27.04.2027 | 22.06.2026 | **1 / 22.06.2026** | PL 7803, INVGBB1010494 |
| **B042663** | 20.06.2029 | **tyhjä** | — | PL 17514 (18.09.), INVGBB1014535. S1b-pyörä, jonka maksu puuttuu yhä |
| B043416 | 25.06.2028 | 15.09.2026 | — | PL 17129 (S1/K4) |
| B044011 | 18.06.2027 | 15.09.2026 | — | PL 17172 (S1/K4) |
| B046058 | 11.02.2028 | 04.09.2026 | — | PL 16039 (S1/K4) |
| B046429 | 02.07.2027 | 01.07.2026 | — | INVGBB1009935, käsilasku (S1/K4) |

## Epävarmat tapaukset (E1, 8)

| Pyörä | Miksi epävarma |
|---|---|
| **B012880** | +1 kk. Tuote *"Työsuhdepyörän loppulunastus"* 78 €. Pyörää on jälkiveloitettu (org 30.09. → 31.10.), joten kyse on todennäköisesti kauden lopun maksusta. Sama epävarmuus on kirjattu ADR 0008:aan |
| B000991, B011005, B021682, B033069 | jälkiveloituspyöriä: päättymisajankohta on siirtynyt `subsc_org_end_date`:n yli, tuote *loppulunastus*, pieni summa. Tapa 1 on jo kirjattu. Ei keskenkauden lunastus |
| **B004234** | kuten edellä, mutta ainoa lasku INVGBB1013114 on **hyvitetty kokonaan** (CRMGBB0002724, 24.08.). `paid_at` 19.08. ja tapa 1 ovat siis voimassa ilman todellista maksua |
| **B036797** | päättymisajankohta 31.10.2028 on 8 kk `subsc_org_end_date`:n (29.02.2028) jälkeen, vaikka jälkiveloitusta ei ole. Kaksi 404,84 €:n laskua, joista toinen avoin, ja −200 €:n hyvitys. Päivät ovat ristiriitaiset jo ennen auditoitavaa sääntöä |
| **B008185** | maksettu tyypin 3 SO SOGBB0000760 (10.10.2025, 800 €) → talletus CDEPGBB0000426 ja lasku INVGBB1000431. Pyörällä ei ole `paid_at`:ia eikä tapaa, ja se päättyy 31.05.2028. Summa ei kerro, onko kyse lunastuksesta |

E2 (150 OOMI-pyörää): kaikki päättyvät 10–11/2026, `subsc_org_end_date` = päättymisajankohta, ja
maksu on tullut 1–2 kk ennen. Nämä ovat todennäköisesti kauden lopun ennakkomaksuja (päätelty).
Rivit ovat CSV:ssä.

## Redeemed 2026

- **R1, B006732:** kausi lyhennettiin 31.12.2028 → 28.02.2026, maksu 3 016 € (INVGBB1005036,
  02.02.2026), ei CR:ää. Kausi on päättynyt.
- **R2 (15):** SO-tyyppi 3, maksu päättymiskuussa ja kausi ei lyhentynyt (7: B000896, B005448,
  B008293, B010052, B016148, B028701, B030750). Lisäksi 7 jälkiveloituspyörää, joilla on 7–42 €:n
  *"Kesken kauden lunastus"* -Paylink (B000418, B000427, B001540, B002399, B004073, B004588,
  B010505), ja B027643. Tuotenimi on näillä harhaanjohtava.
- **R3 (13 OOMI):** kausi on lyhennetty `oomi_exceptional_end_date`:lla 05–07/2026. Tämä kelpaa
  historiassa ADR 0009:n kohdan 1 mukaan. **B040683:** CR 3107 on Done, mutta
  `custrecord_cr_type` on **tyhjä** (altname *"B040683 - lunastus"*), ja ainoa lasku on hyvitetty
  kokonaan (CRMGBB0002699, 29.07.).
- **Ennen CR-järjestelmää:** s1 löytää 656 lyhennettyä kautta. Kaikki paitsi B006732 on maksettu
  ennen 25.02.2026, ja kaikki ovat kääntyneet 01–09/2026. `date_to_non_active` on 596:lla 03/2026,
  mikä viittaa massakirjaukseen eikä todelliseen kääntöpäivään (päätelty). s3:n 638
  lyhentämätöntä pyörää ovat jälkiveloituspyöriä. Rivilistaa ei tehty: kausi on päättynyt eikä
  taannehtivaa korjausta vaadita. Kysely: s1 tai s3 yhteisellä rajauksella ja lisäehdolla
  `subsc_org_end_date > päättymisajankohta`.

## Korjausehdotukset (vain `customrecord_sta_bike_register`)

| Pyörä | Kenttä | Nykyinen | Ehdotettu | Peruste |
|---|---|---|---|---|
| B013550 | `custrecord_gbb_liab_settle_method` | 1 | *(tyhjä)* | ADR 0009 k4, sama kuin K4 |
| B013550 | `custrecord_gbb_liab_settled_at` | 03.07.2026 | *(tyhjä)* | ADR 0009 k4 / ADR 0008 sääntö 1 |
| B040838 | `custrecord_gbb_liab_settle_method` | 1 | *(tyhjä)* | ADR 0009 k4 (OOMI, kausi päättyy 01/2028) |
| B040838 | `custrecord_gbb_liab_settled_at` | 13.07.2026 | *(tyhjä)* | sama |
| B041610 | `custrecord_gbb_liab_settle_method` | 1 | *(tyhjä)* | ADR 0009 k4 (OOMI, kausi päättyy 04/2027) |
| B041610 | `custrecord_gbb_liab_settled_at` | 22.06.2026 | *(tyhjä)* | sama |
| B042663 | `custrecord_gbb_redemption_paid_at` | *(tyhjä)* | 18.09.2026 | § `redemption_paid_at`, Paylink 17514 `custrecord_pl_paid_at`. ADR 0008 S1b: vain `paid_at` |
| B029483 | `liab_settle_method`, `liab_settled_at` | 1 / 03.06.2026 | | **vaatii ihmisen päätöksen.** Siirto TA -CR 5823 Done 27.08. on ristiriidassa lunastuksen kanssa |
| B004234 | `redemption_paid_at`, tapa, `liab_settled_at` | 19.08.2026 / 1 / 19.08.2026 | | **vaatii ihmisen päätöksen.** Maksu on hyvitetty kokonaan |
| B036797, B008185 | — | | | **vaatii ihmisen päätöksen.** Päivät tai maksun tarkoitus ristiriitaiset |

Muille A1/A2-pyörille ei ehdoteta rekisterimuutosta. Niiltä puuttuu CR, ja CR:n luonti kuuluu
tämän auditoinnin ulkopuolelle (havainto, ei ehdotus).

## Varoitukset

- **Tyhjennys ennen CR:ää.** Jos CR käsitellään ennen kuin B013550:n, B040838:n ja B041610:n tapa
  on tyhjennetty, `handler_lunastus`:n write-once-vartija pitää maksusta johdetut arvot ja hylkää
  CR:n arvot (ADR 0008 § handler). Järjestys on sama kuin K4:ssä.
- **Takautuvat CR:t Redeemed-pyörille.** Done-tilainen CR laukaisee monthly-reportingin
  UE-skriptit heti (CREATE/EDIT/XEDIT, portti `status === Done`). Ne luovat RI-rivejä, joita ei voi
  poistaa CR:n poistamalla. **Älä luo Done-tilaisia CR:iä R1-, R3- tai historiaryhmän pyörille**
  ennen kuin vaikutus RI-riveihin on arvioitu. Tämä on havainto, ei ehdotus CR:iin.
- **Status.** Yksikään ehdotus ei koske statusta. Statuksen kirjoitus laukaisee
  `gbb_webhook_ue_status_changed.js`:n jokaisella muutoksella, eikä statusta saa massakorjata
  CSV:llä.
- **Write-once.** `liab_settled_at` ja `redemption_paid_at` ovat write-once-kenttiä, joten niiden
  korjaus on tietoinen poikkeus. CSV-tyhjennys vaatii *Overwrite Missing Fields* -asetuksen ja
  testirivin, kuten K4:ssä.
- **B029495:** vanhan status-syncin osa A voi kirjoittaa tavan 1 takaisin 27.09. asti.
- **Linkittämättömät CR:t.** 28 Cancelled-tilaisella tyypin 2 CR:llä ei ole pyörälinkkiä (esim.
  6086–6140 ja Notion-409…972). Jotkin niistä voivat koskea tämän listan pyöriä, eikä sitä voi
  todeta kyselyllä.

## Sivuhavainnot (ei tämän tehtävän rajausta)

- **Kaikilla 150 E2-OOMI-pyörällä** on tapa 1 jo ennen päättymiskuuta. Näistä 52:lla
  `liab_settled_at` on tyhjä, ja niiden maksut ovat 21.–23.09. Todennäköisesti vanha osa A
  kirjoittaa tavan mutta ei päivää (päätelty, `gbb_ss_bike_redemption_status_sync.js:442`). Tämä on
  ADR 0009 k4:n vastaista, mutta lopputulos on kauden lopun lunastuksessa sama.
- **B024587 ja B024908:** status 1, päättymisajankohta 30.11.2025 on jo ohi, eikä tapaa ole.
  Pyörällä on maksamaton tyypin 3 SO. Tämä on sama jumitila kuin §8 *Jumiin jäänyt lunastus
  sovittu*, mutta ilman tapaa.

## Todennettu vs. päätelty

**Todennettu NetSuitesta 24.09.2026:** kaikki luvut taulukoissa, rivien kenttäarvot, SO- ja
laskunumerot, Paylink-id:t ja tuotenimet, hyvitykset (B004234, B040683), CR 6718 ja 6719
(B016666), CR 5823 (B029483), CR 3107:n tyhjä tyyppi, 0 status 2 -pyörää ilman
`date_to_non_active`:a, sekä se, että listan pyörillä ei ole tyypin 2 CR:iä muissa tiloissa.
**Päätelty:** luokittelu vahvaksi ja epävarmaksi (kuukausiero, tuotenimi, jälkiveloitus), E2:n
tulkinta kauden lopun ennakkomaksuksi, R2:n tulkinta ei-keskenkauden lunastukseksi,
`date_to_non_active` 03/2026 massakirjauksena, sekä E2:n tapojen kirjoittaja (vanha osa A).
**Ei tarkistettu:** Paylink-pyynnöt ilman `custrecord_pl_ns_bike_id`:tä, lunastukset joiden
tuotenimi on pelkkä *"Työsuhdepyörän lunastus"* ilman SO-tyyppiä 3 sekä `systemnote`-kirjoittajat.
