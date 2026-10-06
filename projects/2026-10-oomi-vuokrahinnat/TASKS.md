# TASKS — OOMI-vuokrahintojen korjaus

Tilannekuva: [`README.md`](README.md). Merkitse tehdyt `[x]` päivän ja tuloksen kanssa.

### [x] V1 — Todenna virheelliset arvot NetSuitesta ja laske oikeat — **tehty 1.10.2026**
46 pyörää löytyi `externalid`:llä, 41 pitkää riviä väärin, 5 korjattu käsin, 45 osarivin kaava todennettu,
RI-ero ~53 €/kk. Frendsin 4 pyörää löytyi lisäksi. Tulokset `data/laskelma-*.csv`.

### [x] V9 — Tarkista B044817 ja B044889 (tape ≠ init_rent) — **ratkaistu 1.10.2026 (käyttäjä)**
**Tulos:** FF1UUCZF (B044817) = 80,64542 ja H1Z3P5ZK (B044889) = 80,64542 (brutto 101,21: tape väärässä, pitkät rivit jo oikein); HP4C5T2G (B045487, Frends) = 57,96813 (brutto 72,75; rivin 112416 arvo 57,9677 on sama brutto, joten sitä ei muuteta, koska päätöksen 1.10. mukaan desimaaleja ei korjata, jos brutto on sama). Kaikki lisätty tiedostoihin, ks. README § Päätökset.
Käyttäjä tarkisti 1.10. B041634, B043384, B043392: oikea vuokra brutto 101,21 (tape väärässä, init_rent ja 80,64542 oikein). Samalla tavalla poikkeavat vielä B044817 (tape 99,61) ja B044889 (tape 100,84). Todennäköisesti sama virhe, mutta ei vahvistettu. Rivit 110184 ja 110450 ja osarivi 110452 pidetään pois, kunnes tarkistettu. Jos 101,21: ei muutoksia (rivit ovat jo 80,64542), osarivi 110452 lasketaan siitä.

### [x] V2 — Käyttäjä: korjaa pitkät rivit (item 30), Claude todentaa — **todennettu 1.10.2026**
**Tulos 1.10. (käsinkorjauksen jälkeen):** kaikki 50 pitkää riviä muokattu 1.10.; 48/50 vastasi tapea (`data/2026-10-01-pitkat-tarkistus.csv`), mukana Frends ja B043909:n rivi 106886 (80,01594). B044817 ja B044889 vahvistettiin V9:ssä oikeiksi → 50/50 oikein, pitkiin riveihin ei korjauksia.
**Aiempi tilanne 1.10.:** pitkistä riveistä 47 on tarkistettu ok (41 tapen mukaan + B041634, B043384, B043392 käyttäjän vahvistamalla 101,21:llä). Jäljellä B044817 ja B044889 (V9). Frendsin 3 riviä kelpaavat (brutto sama).
Käyttäjä korjaa 41 riviä (+ Frendsin 4, jos V5 hyväksyy). Valmis kun kysely palauttaa 0 riviä:
```sql
SELECT br.name, br.custrecord_sta_init_subs_rent_fee, ar.id, ar.custrecord_sta_ca_row_price_month
FROM customrecord_sta_ca_agreement_row ar JOIN customrecord_sta_bike_register br ON ar.custrecord_sta_bikeid = br.id
WHERE ar.custrecord_sta_ca_row_item = 30 AND br.custrecord_sta_bike_order_type = 3 AND br.name <> 'B017530'
  AND ar.custrecord_sta_ca_row_license_startdate <= TO_DATE('2026-10-01','YYYY-MM-DD')
  AND ar.custrecord_sta_ca_row_license_enddate >= TO_DATE('2026-10-01','YYYY-MM-DD')
  AND ABS(ROUND(ar.custrecord_sta_ca_row_price_month, 2) - br.custrecord_sta_init_subs_rent_fee) > 0.0051
```
Odotus: jäljelle jäävät vain ne OOMI-pyörät, joiden osarivi on lokakuussa (ryhmä A, päiväsuhde, ei virhe). Rajaa ne pois.

### [x] V3 — Päätös: oikea hinta = tapen *Taxable value* — **päätetty 1.10.2026 (käyttäjä)**
Tape (`OOMI DATA TAPE BIKES.csv`, sarake 49) ratkaisee bruttoehdokkaiden kaksoismerkityksen: se on yksiselitteinen 45 pyörällä.
**Rent-sarake ei kelpaa** (README § OOMI DATA TAPE). Päätettävää: (a) käytetäänkö Taxable valuea? (b) mitä tehdään 5 pyörälle,
joilla tape < init: B041634, B043384, B043392, B044817, B044889. Ehdotus: rivi = tape (brutto 100,52 / 100,84 / 100,80 / 99,61 / 100,84),
ja `init_subs_rent_fee` korjataan samaan, koska kenttä on todennäköisesti oletusarvo. **B043392:n käsin korjattu rivi pitää
korjata uudelleen.** **Päätetty:** käytetään Taxable valuea. ~~5 pyörällä (tape < init) rivi ja `init_subs_rent_fee` korjataan tapen mukaan.~~ **Kumottu 1.10.:** käyttäjän tarkistuksen mukaan näillä viidellä tape on väärässä ja hinta on 101,21. `init_subs_rent_fee` pysyy (README § Päätökset).

### [x] V4 — Osarivit — **ajettu ja todennettu 1.10.2026**
`01-testirivi.csv` + `03-osarivit.csv` importattu: 48/48 riviä täsmää tiedostoon, `price_year` päivittyi (esim. 106888 33,5551 / 402,6612; 113002 78,044 / 936,53).
**Päivitys 1.10. (V2 valmis):** `02-pitkat-rivit.csv` poistettu (tehty käsin). Osarivit lasketaan NetSuiten pitkistä hinnoista: `01-testirivi.csv` + `03-osarivit.csv` = 48 riviä V9:n jälkeen (SUM 5 145 664), skripti `tools/tee-osat-ja-ri.mjs`. Seuraavaksi aja testirivi.
Tiedostot [`imports/2026-10-01-oomi-hinnat/`](../../imports/2026-10-01-oomi-hinnat/README.md): 47 pitkää riviä, 47 osariviä; init_rent-korjauksia ei tarvita. Kaava README:ssä, ehdotukset `partial_oikea_lo/hi`. Tee V2:n ja V3:n jälkeen CSV-importtina `imports/`-kansioon
(`customrecord_sta_ca_agreement_row`, UPDATE). Älä koske hallintamaksun riveihin. Viiden jo korjatun rivin osarivit
ovat yhä vanhalla hinnalla. B043909:n osarivi 106888 on **lokakuun laskutettava rivi** — käsittele ensin.

### [x] V5 — Päätös: Frends Technology Oy (4 pyörää) mukaan? — **mukana 1.10.2026**
Käyttäjä korjasi Frendsin pitkät rivit käsin ja vahvisti B045487:n hinnan, joten Frends on mukana kaikissa tiedostoissa (5 asiakasta, 50 pyörää).
B038765, B045485, B045487, B045488, sopimus 5052, sama 0,988-virhe. Käyttäjän listalla ei ole. Tape vahvistaa: Frendsin pyörillä on 3 tape-riviä (kolme asiakasta/jaksoa, ml. HiQ Oy) ja init_rent täsmää tapeen,
eli rivi on väärin kuten muilla. Kysymys on enää, korjataanko ne samalla. Huom: käyttäjän "4 asiakasta" olisi silloin 5.

### [ ] V6 — Syys- ja lokakuun RI-rivien korjaus
**RI-rivit ajettu ja todennettu 1.10.2026:** 04 + 05 importattu, 100/100 riviä täsmää tiedostoon (tarkistuskysely 0 riviä), kaikki Active (syys 50 / Σ 3 915,81437, loka 50 / Σ 3 869,35353). **Auki:** käyttäjä ajaa uudet syys- ja lokakuun palkka-CSV:t viidelle asiakkaalle; tarkistuskysely uudelleen juuri ennen sitä (`ri_update`-riski).
Ohje (luettu `mr_monthly_reporting_csv.js`, 1.10.): skripti vain lukee RI-rivejä, uudelleenajo on turvallinen ja tekee uudet tiedostot uudella aikaleimalla. Lokakuu: parametri `custscript_gbb_csv_reporting_date` tyhjäksi (päivä < 7 → 1.10.). Syyskuu: parametriksi 1.9.2026, aja ja tyhjennä se sen jälkeen. Tiedostot sisältävät kaikki työnantajat, joten viidelle asiakkaalle poimitaan vain heidän rivinsä. Viidellä asiakkaalla ei ole Warning-rivejä kummassakaan kuussa (todennettu 1.10.), joten niiden rivejä ei pidätetä.
**Päivitys 1.10.:** CSV valmis: `04-ri-testirivi.csv` + `05-ri-lease-fee.csv` = 100 riviä (50 pyörää × syys/loka, SUM 12 521 684), uusi `lease_fee_vat0` = pitkän rivin hinta tai vahvistettu hinta (B043909 lokakuu = osarivi 33,5551). Erotus verollisena syys +58,76 €, loka +58,06 €. Tiedostot muotoiltu tilin asetusten mukaan (`;`, desimaalipilkku, DD.MM.YYYY).
**Käyttäjä 1.10.:** syys- ja lokakuun palkka-CSV:t on jo lähetetty vanhoilla hinnoilla. **Päätös:** ensin RI-rivit (04 → 05 → tarkistuskysely), sitten käyttäjä ajaa uudet syys- ja lokakuun palkka-CSV:t viidelle asiakkaalle (Lapin, Junkkari, Oomi Oy, HiQ, Frends). Kohdat 1 ja 2 alla on näin ratkaistu; kohta 3 (`ri_update`) jää riskiksi, joten tarkistuskysely ajetaan uudelleen juuri ennen palkka-CSV:itä.
Noin 92 Active-riviä (46 × 2), ero yhteensä ~53 €/kk verollisena. Selvitettävä ennen toimia:
1. Onko syyskuun palkka-CSV (1451) jo lähtenyt väärillä hinnoilla? Jos on, korjaus on takautuva hyvitys työnantajille.
2. Milloin lokakuun CSV ajetaan? Rivit pitää korjata sitä ennen.
3. Korjataanko RI-rivi suoraan (`custrecord_gbb_ri_lease_fee_vat0`) vai annetaanko ri_updaten päivittää se sopimusriviltä?
   **Ei vielä luettu `ri_update`:n koodista** (`netsuite-monthly-reporting`), pääteltävä ennen kuin kirjoitetaan mitään.
   Kysy `ri-auditoija`lta tai lue `can_be_updated`-lipun käyttö.
4. Syyskuun Deleted-rivit (hinta 0) ovat tuplaraportoinnin jälki. Tarkista, ettei niitä lasketa CSV:hen.

### [ ] V7 — Juurisyy ja toistuminen
Todenna Fleet-raportin tuplasopimus lähteestä (käyttäjän selitys on toistaiseksi vain selitys). Tarkista, että
muiden OOMI-pyörien erot (255 − 50) ovat ryhmän A odotettua päiväsuhdetta (agentin otos 4/206, ei kaikki).

### [ ] V8 — Pienet siivottavat
- [x] B043961:n syyskuun Active-RI löytyi 1.10.: 100327 (mukana 05-tiedostossa).
- Kaksi laskutusaukon epäiltyä pyörää aiemmasta löydöksestä (B043001, B039531) kuuluvat tähän vain, jos selviää
  samaan tuplaraportointiin.
