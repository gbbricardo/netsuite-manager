# sopimusrivien-aukot — pyörän rivien vierekkäisyys per nimike

**Tarkoitus:** Laskee pyörän jokaiselle sopimusriville, montako päivää sen alku on edellisen
saman nimikkeen rivin lopun jälkeen. `gap_days = 1` tarkoittaa vierekkäisiä kausia (oikea tila
siirron, tauon paluun ja OOMI-tyngän jälkeen). `gap_days > 1` on laskuttamaton väli, `gap_days <= 0`
päällekkäisyys eli kaksoislaskutuksen riski. Ensimmäisellä rivillä `prev_end` ja `gap_days` ovat
`NULL`.

**Käyttäjät:** sopimusriviauditoija K3 (päällekkäiset kaudet) ja K4 (aukot).

**Parametrit:** `<BIKE_ID>` = pyörärekisterin sisäinen id. Laajennus koko populaatioon: korvaa
`WHERE`-ehto suodattimella ja lisää `custrecord_sta_bikeid` sekä `PARTITION BY`-lauseeseen että
`ORDER BY`-lauseeseen — **ei todennettu koko taululla**, aloita `COUNT(*)`:lla.

**Todennettu:** 2026-09-18, 6 riviä, pyörä 5296 (yksi pyörä). Kaikki `gap_days` = 1, eli kaksi
siirtoa ovat tuottaneet saumattomat kaudet molemmille nimikkeille.

**Sarakkeet:** `id` · `item` → 30 / 31 · `s` / `e` → kausi `YYYY-MM-DD` · `prev_end` → edellisen
saman nimikkeen rivin loppu · `gap_days` → `s − prev_end` päivinä.

```sql
SELECT id,
       custrecord_sta_ca_row_item AS item,
       TO_CHAR(custrecord_sta_ca_row_license_startdate,'YYYY-MM-DD') AS s,
       TO_CHAR(custrecord_sta_ca_row_license_enddate,'YYYY-MM-DD')   AS e,
       TO_CHAR(LAG(custrecord_sta_ca_row_license_enddate)
                 OVER (PARTITION BY custrecord_sta_ca_row_item
                       ORDER BY custrecord_sta_ca_row_license_startdate),'YYYY-MM-DD') AS prev_end,
       custrecord_sta_ca_row_license_startdate
         - LAG(custrecord_sta_ca_row_license_enddate)
             OVER (PARTITION BY custrecord_sta_ca_row_item
                   ORDER BY custrecord_sta_ca_row_license_startdate) AS gap_days
FROM customrecord_sta_ca_agreement_row
WHERE custrecord_sta_bikeid = <BIKE_ID>
ORDER BY custrecord_sta_ca_row_item, custrecord_sta_ca_row_license_startdate
```

**Tarkistukset:** Ei liitoksia, joten ei fan-outia. `LAG` ja päivämäärien erotus todennettu
toimiviksi tällä tilillä (`suiteql-tuki.md`).

**Huomiot:** Kysely ei tiedä miksi aukko on: Välikuukaudet-tauko (Done tyypin 3 CR) ja
konsernisiirron siirtymäkuukaudet (tyypin 7/11 CR-pari) ovat oikeutettuja aukkoja — auditoija
sulkee ne pois CR-haulla. Ei myöskään suodata passiivisia rivejä pois: passiivinen historiallinen
rivi kuuluu ketjuun. Rivit joilla `startdate > enddate` (OOMI-tyngät lunastuksen jälkeen) antavat
mielettömän `gap_days`-arvon — tunnista ne `s > e`-ehdolla ennen tulkintaa.
