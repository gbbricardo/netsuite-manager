# Puuttuvat RI-rivit kaudelta 2026-09 (raportointipäivä 01.09.2026)

**Tehnyt:** `ri-auditoija`, 22.09.2026. Vain luku — mitään ei ole kirjoitettu NetSuiteen.
**Kausi 09/2026 on jo toimitettu ⇒ kaikki tämän tiedoston löydökset ovat historiallisia.**
Eteenpäin katsova osuus (kausi 2026-10) on raportin osiossa 6 ja tämän tiedoston lopussa.

## Populaation johtaminen

Kuukausiajo `mr_monthly_reporting_ri_creation.js` hakee `getInputData()`:ssa pyörärekisteristä
**vain** tietueet joiden `custrecord_sta_bike_status` on 1 (Active), 2 (Redeemed) tai 3 (Returned)
— suodatin on koodissa tahallinen (kommentti 2026-09-21, vaihe 3). Rivi jää luomatta sääntöjen
mukaan mm. kun alkupäivä puuttuu (`active_no_start_date`), alkupäivä on tulevaisuudessa
(`active_future_start`), pyörällä on jo Ended-rivi (`ended_already_reported`, sääntö A2), tai
kyseessä on Oomi-pyörä jolla on jo Ended-rivi (`active_skipped_oomi_already_ended`, sääntö A9).

Käytetty populaatiokriteeri "olisi pitänyt saada rivi 01.09.2026":

```sql
SELECT br.id, br.custrecord_sta_bike_status, br.custrecord_sta_bike_order_type,
       BUILTIN.DF(br.custrecord_sta_contract_employer) AS tyonantaja,
       TO_CHAR(br.custrecord_sta_subsc_start_date,'YYYY-MM-DD') AS alku,
       TO_CHAR(COALESCE(br.custrecord_gbb_exceptional_end_date,
                        br.custrecord_gbb_oomi_exceptional_end_date,
                        br.custrecord_sta_subsc_end_date),'YYYY-MM-DD') AS loppu
FROM customrecord_sta_bike_register br
WHERE br.custrecord_sta_bike_status IN (1,2,3)
  AND br.custrecord_sta_subsc_start_date <= TO_DATE('2026-09-01','YYYY-MM-DD')
  -- ei yhtään ei-Deleted riviä kaudelle 2026-09
  AND NOT EXISTS (SELECT 1 FROM customrecord_gbb_monthly_reporting_item r2
                  WHERE r2.custrecord_gbb_ri_bike = br.id
                    AND r2.custrecord_gbb_ri_reporting_date = TO_DATE('2026-09-01','YYYY-MM-DD')
                    AND r2.custrecord_gbb_ri_reporting_status <> 6)
  -- puuttuu PERUSTELLUSTI jos Ended-rivi on jo kirjattu 09/2026:lle tai aiemmin (sääntö A2)
  AND NOT EXISTS (SELECT 1 FROM customrecord_gbb_monthly_reporting_item r4
                  WHERE r4.custrecord_gbb_ri_bike = br.id
                    AND r4.custrecord_gbb_ri_reporting_status = 4
                    AND r4.custrecord_gbb_ri_reporting_date <= TO_DATE('2026-09-01','YYYY-MM-DD'))
ORDER BY 2, 1
```

Kokonaisluvut (todennettu SuiteQL 22.09.2026):

| Mitattu | Määrä |
|---|---|
| Rekisterissä status 1/2/3 ja alkupäivä ≤ 01.09.2026 | 46 536 |
| …joilta puuttuu ei-Deleted rivi kaudelta 2026-09 | **187** |
| …joista puuttuu perustellusti (Ended-rivi jo 09/2026:lle tai aiemmin) | 16 |
| **Puuttuu virheellisesti** | **171** |
| Eri työnantajaa koskettaa | **80** |

## Luokittelu

| Luokka | Pyöriä | Kuvaus |
|---|---|---|
| **L1** Warning-rivi poistettiin käsin 28.–31.08.2026 eikä uusintaajoa tehty | **143** | Rivi oli olemassa (luotu 18.08.2026), status 5, `fee = 0`, loki `Vastaavaa tilausriviä ei löytynyt (customrecord_sta_ca_agreement_row)` (141 kpl) tai kahden tekstin yhdistelmä (2 kpl). Kaikki merkittiin Deletediksi 28.–31.08.2026. Uutta riviä ei syntynyt. |
| **L2** Tulevaisuuteen kirjattu Ended-rivi esti syyskuun Active-rivin | **15** | CR-pohjainen Ended-rivi kaudelle 2026-10, rekisterin kausi kattaa koko syyskuun. `isBeforeExistingEndedRow`-korjaus tehtiin koodiin 03.09.2026 mutta syyskuulle ei ajettu uudelleen. |
| **L3** Sääntö A9: Oomi-pyörä jolla on elävä Ended-rivi | **1** (38350) | Sopimus jatkuu 09.01.2029. Estävä Ended-rivi on RI 89009, jonka työnantaja on tunnetusti väärä (D1-vika). |
| **L4** Uudet Oomi-pyörät ilman yhtään rivi-historiaa | **8** | 46737, 46738, 46742, 46743, 46744, 46745, 46829, 46832. Rekisterin alkupäivä 01.06.–01.08.2026, mutta sopimusrivit alkavat vasta 01.11.2026. Viidellä on 2026-10 Active-rivi (116352–116356) jonka **vuokra-arvo on 0**. |
| **L5** Testipyörä | 1 (17530, *Testi Yritys Oy*, kausi päättyi 31.01.2025) | Ei liiketoimintavaikutusta. |
| **L6** Muut yksittäiset | 3 (30338, 6553, 11138 ym. sisältyvät yllä oleviin) | ks. lista. |

L1 vastaa `netsuite-monthly-reporting/PROJEKTIN_TILA.md`:n dokumentoitua havaintoa
*"148 pyörää putosi tyhjään, 143:lla ei ollut yhtään ei-Deleted riviä 01.09.2026:lle"* ja siellä
avoimena olevaa tehtävää **"uusintaajo `ri_creation` raportointipäivälle 01.09.2026"**. Uusintaajoa
ei ole tehty: tilanne on 22.09.2026 edelleen sama.

## Juurisyy (todennettu näytteellä)

Pyörät 37389 ja 37674 (L1): syyskuun Warning-rivi kirjoitettiin 18.08.2026, koska pyörällä ei
tuolloin ollut yhtään `custrecord_sta_ca_agreement_row`-riviä joka kattoi 01.09.2026. Riviparit
(item 30 ja 31, kausi **01.09.–30.09.2026**) luotiin vasta tämän jälkeen — esim. rivi 80990,
`price_month = 50,6767`. Tieto oli siis olemassa ennen kuun vaihdetta, mutta riviä ei luotu
uudelleen. Warning poistettiin, syy ei.

Koko L1-populaation sopimusrivitilanne 01.10.2026 vasten:

| Tila | Pyöriä |
|---|---|
| Ei yhtään item 30 -riviä | 1 |
| Item 30 on, mutta ei kata 01.10.2026 (sääntö A7 antaa viimeisimmän hinnan) | 97 |
| Kattava item 30 -rivi olemassa | 48 |

## Ennuste kaudelle 2026-10 (päätelty säännöistä A1–A9, ei vielä ajettu)

Lokakuun kuukausiajo ei ole vielä ajettu — kaudella 2026-10 on 22.09.2026 vain 368 ei-Deleted
riviä, kaikki CR-pohjaisia. Ennuste 171 pyörälle:

| Ryhmä | Pyöriä | Mitä lokakuun ajo tekee |
|---|---|---|
| Status 2, kausi päättyy 30.09.2026, velvoitteet hoidettu | 95 | Sääntö A1 laukeaa → **Ended-rivi 01.10.2026**. Korjautuu itsestään. |
| Status 1, kausi jatkuu, velvoitteet hoidettu | 47 | A1 ei laukea (kausi kesken) → **Active-rivi**. Korjautuu itsestään. |
| Status 1, kausi jatkuu, ei todistetta | 4 | **Active-rivi**. Korjautuu itsestään. |
| L4:n kahdeksan uutta Oomi-pyörää | 8 | Rivi syntyy, mutta **vuokra-arvo on 0**, koska sopimusrivi alkaa vasta 01.11.2026 (viisi rivistä jo olemassa, kaikki `fee = 0`). |
| L3 (38350) ja sisarustapaukset 43354, 44666 | 3 | Sääntö A9 estää rivin **pysyvästi** — 43354 ja 44666 saivat vielä syyskuun rivin, lokakuusta alkaen eivät saa. |

Eli syyskuun aukko **ei** toistu lokakuussa sellaisenaan, mutta kaksi asiaa jatkuu:
A9:n pysyvä esto (3 pyörää) ja nolla-arvoiset rivit (8 pyörää).

## Täysi lista (171 pyörää)

`st` = rekisterin status (1 Active, 2 Redeemed), `ot` = 3 tarkoittaa Oomia, `loppu` = COALESCE
poikkeuspäivien yli, `elävät` = pyörän ei-Deleted rivien määrä yhteensä.

### Status 1 (57 pyörää)

| Pyörä | ot | Työnantaja | Alku | Loppu | elävät |
|---|---|---|---|---|---|
| 30338 | – | Lexia Asianajotoimisto Oy | 2023-09-01 | 2027-11-30 | 0 |
| 37749 | 3 | NCC Suomi Oy | 2022-05-10 | 2026-10-09 | 0 |
| 38056 | 3 | Pörhön Autoliike Oy | 2022-10-19 | 2026-10-18 | 0 |
| 38350 | 3 | Järvenpään Mestariasunnot Oy | 2025-04-10 | 2029-01-09 | 2 |
| 38542 | 3 | Etelä-Karjalan hyvinvointialue | 2023-07-12 | 2026-10-11 | 0 |
| 38639 | 3 | Tapojärvi Oy | 2024-07-01 | 2026-10-31 | 0 |
| 38870 | 3 | Nanocomp Oy Ltd | 2023-07-21 | 2026-10-20 | 0 |
| 39067 | 3 | Luvata Pori Oy | 2024-01-09 | 2026-10-08 | 0 |
| 39079 | 3 | Lapin Hyvinvointialue | 2024-06-13 | 2026-10-12 | 0 |
| 39642 | 3 | Medisize Oy | 2024-10-28 | 2026-10-27 | 0 |
| 39752 | 3 | Itä-Suomen yliopisto | 2025-05-02 | 2026-10-01 | 0 |
| 40439 | 3 | Kemin kaupunki | 2026-01-15 | 2026-10-14 | 0 |
| 40762 | 3 | Servica Oy | 2025-04-25 | 2026-10-24 | 0 |
| 40838 | 3 | Kymenlaakson hyvinvointialue | 2024-08-01 | 2028-01-31 | 0 |
| 41002 | 3 | Vaisala Oyj | 2023-04-18 | 2026-10-17 | 0 |
| 41197 | 3 | Kymenlaakson hyvinvointialue | 2024-04-08 | 2026-10-07 | 0 |
| 41527 | 3 | Heinolan kaupunki | 2023-06-19 | 2026-10-18 | 0 |
| 41610 | 3 | Iisalmen kaupunki | 2024-06-28 | 2027-04-27 | 0 |
| 41739 | 3 | Kymenlaakson hyvinvointialue | 2025-02-01 | 2026-10-31 | 0 |
| 41751 | 3 | Kymenlaakson hyvinvointialue | 2024-04-12 | 2026-10-11 | 0 |
| 41752 | 3 | Kymenlaakson hyvinvointialue | 2025-06-01 | 2026-10-31 | 0 |
| 41801 | 3 | Kymenlaakson hyvinvointialue | 2024-05-07 | 2026-10-06 | 0 |
| 42134 | 3 | Lapin Yliopisto | 2025-05-28 | 2026-10-27 | 0 |
| 42198 | 3 | Lapin Yliopisto | 2023-09-15 | 2026-10-14 | 0 |
| 42220 | 3 | Rovaniemen koulutuskuntayhtymä | 2025-03-27 | 2026-10-26 | 0 |
| 42270 | 3 | Kansaneläkelaitos - KELA | 2023-09-06 | 2026-10-05 | 0 |
| 42915 | 3 | Ammattiopisto Luovi Oy | 2023-01-01 | 2026-10-31 | 0 |
| 42938 | 3 | Kannuksen kaupunki | 2023-06-09 | 2026-10-08 | 0 |
| 43350 | 3 | Valkeakosken kaupunki | 2023-07-06 | 2026-10-05 | 0 |
| 43491 | 3 | Hyria koulutus Oy | 2023-06-28 | 2026-10-27 | 0 |
| 43620 | 3 | Valkeakosken kaupunki | 2023-07-07 | 2026-10-06 | 0 |
| 43737 | 3 | Lapin ammattikorkeakoulu Oy | 2023-09-08 | 2026-10-07 | 0 |
| 44098 | 3 | Fortaco Finland Oy | 2023-07-04 | 2026-10-03 | 0 |
| 44266 | 3 | Kymenlaakson hva:n tuki- ja kiinteistöpalvelut Oy | 2024-06-24 | 2026-10-23 | 0 |
| 44392 | 3 | Tiera Oy | 2023-04-26 | 2026-10-25 | 0 |
| 44792 | 3 | Lakka Rakennustuotteet Oy | 2025-07-01 | 2026-10-31 | 0 |
| 45104 | 3 | NCC Suomi Oy | 2024-04-05 | 2026-10-04 | 0 |
| 45314 | 3 | Konecranes Finland Oy | 2025-09-24 | 2026-10-23 | 0 |
| 45327 | 3 | Konecranes Finland Oy | 2024-05-29 | 2026-10-28 | 0 |
| 45704 | 3 | MSK Finland Oy | 2024-03-11 | 2026-10-10 | 0 |
| 45767 | 3 | Porin kaupunki | 2024-05-04 | 2026-10-03 | 0 |
| 45888 | 3 | Oulun poliisilaitos | 2024-04-03 | 2026-10-02 | 0 |
| 45960 | 3 | Porin kaupunki | 2024-04-26 | 2026-10-25 | 0 |
| 46079 | 3 | Proventia Oy | 2022-05-08 | 2026-10-07 | 0 |
| 46173 | 3 | Itä-Suomen yliopisto | 2023-04-20 | 2026-10-19 | 0 |
| 46210 | 3 | Porin kaupunki | 2023-10-25 | 2026-10-24 | 0 |
| 46326 | 3 | Nestor Cables Oy | 2023-03-31 | 2026-10-30 | 0 |
| 46396 | 3 | 2M-IT Oy | 2023-06-15 | 2026-10-14 | 0 |
| 46434 | 3 | 2M-IT Oy | 2023-06-07 | 2026-10-06 | 0 |
| 46737 | 3 | CGI Suomi Oy | 2026-06-01 | 2027-12-31 | 0 |
| 46738 | 3 | Hilti (Suomi) Oy | 2026-06-01 | 2027-03-31 | 1 |
| 46742 | 3 | Tapojärvi Oy | 2026-06-01 | 2029-09-30 | 0 |
| 46743 | 3 | Vaisala Oyj | 2026-06-01 | 2030-07-31 | 1 |
| 46744 | 3 | Vaisala Oyj | 2026-06-01 | 2029-05-31 | 1 |
| 46745 | 3 | Itä-Uudenmaan poliisilaitos | 2026-07-01 | 2028-03-31 | 1 |
| 46829 | 3 | Konecranes Finland Oy | 2026-08-01 | 2029-08-31 | 1 |
| 46832 | 3 | CGI Suomi Oy | 2026-08-01 | 2027-10-31 | 0 |

### Status 2 (114 pyörää)

Ei-Oomi (`ot` tyhjä), kaikilla yksi elävä rivi = CR:n luoma Ended-rivi kaudelle 2026-10 (luokka L2):

| Pyörä | Työnantaja | Loppu |
|---|---|---|
| 6553 | Werner Söderström Osakeyhtiö | 2026-09-30 |
| 11138 | Etteplan Finland Oy | 2026-08-31 |
| 11427 | Admicom Finland Oy | 2026-09-30 |
| 12709 | Oy Duell Bike-Center Ab | 2026-09-30 |
| 15083 | Kumpuniemen Voima Oy | 2026-09-30 |
| 17380 | Metsä Board Oyj | 2026-09-30 |
| 19157 | Päijät-Hämeen hyvinvointialue | 2026-09-30 |
| 19273 | Sako Oy | 2026-09-30 |
| 19512 | Nordcloud Oy | 2026-09-30 |
| 23535 | Konttorilinja Oy | 2026-09-30 |
| 27858 | Bonum Pankki Oyj | 2026-09-30 |
| 33060 | UPM-Kymmene Oyj Pulp | 2026-09-30 |
| 33143 | UPM-Kymmene Oyj Pulp | 2026-09-30 |
| 33559 | Junnikkala Oy | 2026-09-30 |
| 34744 | UPM-Kymmene Oyj Pulp | 2026-09-30 |
| 17530 | *Testi Yritys Oy* (testipyörä, kausi päättyi 2025-01-31) | – |

Oomi-pyörät (`ot = 3`), kaikilla poistettu Warning-rivi kaudelta 2026-09 (luokka L1) — pyörä,
työnantaja, kauden loppu:

37389 Etelä-Karjalan hva 09-19 · 37674 CGI Suomi 09-18 · 37732 Itä-Suomen yliopisto 09-12 ·
37764 Pörhön Autoliike 09-05 · 37856 Kekkilä-BVB 09-27 · 38206 Istekki 09-10 · 38210 Haltian 09-21 ·
38292 Hellon Technology 09-30 · 38320 Istekki 09-13 · 38553 Etelä-Karjalan hva 09-16 ·
38864 Etelä-Karjalan hva 09-26 · 39115 Hämeenkyrön Sähköpalvelu 09-26 · 39249 Miilux 09-19 ·
39252 Lapin hva 09-16 · 39257 Etelä-Karjalan hva 09-14 · 39429 Istekki 09-26 ·
39466 Itä-Suomen yliopisto 09-12 · 39552 CGI Suomi 09-05 · 39620 Etelä-Karjalan hva 09-11 ·
39665 Etelä-Karjalan hva 09-25 · 39694 Itä-Suomen yliopisto 09-12 · 39695 Itä-Suomen yliopisto 09-18 ·
39762 CGI Suomi 09-08 · 40109 Etelä-Karjalan hva 09-15 · 40165 Oulun poliisilaitos 09-24 ·
40342 CGI Suomi 09-07 · 40576 John Deere Forestry 09-06 · 40614 Koja 09-24 ·
40666 John Deere Forestry 09-08 · 40685 John Deere Forestry 09-30 · 40710 Itä-Suomen yliopisto 09-08 ·
40895 Vaisala 09-30 · 40903 Vaisala 09-18 · 40918 Kymenlaakson hva 09-24 ·
41338 Rovaniemen kaupunki 09-06 · 41489 NCC Suomi 09-14 · 41554 Heinolan kaupunki 09-09 ·
41569 Heinolan kaupunki 09-14 · 41703 Kymenlaakson hva 09-15 · 41763 Ammattiopisto Luovi 09-30 ·
41795 Kymenlaakson hva 09-28 · 41819 Kymenlaakson hva 09-16 · 41918 Kymenlaakson hva 09-10 ·
42040 Digia Finland 09-22 · 42275 Etelä-Karjalan hva 09-05 · 42382 KELA 09-22 · 42410 KELA 09-10 ·
42459 KELA 09-26 · 42515 Itä-Suomen yliopisto 09-10 · 42627 Iisalmen kaupunki 09-16 ·
42695 Kannuksen kaupunki 09-15 · 42732 KELA 09-25 · 42855 Rovaniemen kaupunki 09-30 ·
42890 Iisalmen kaupunki 09-18 · 42913 KELA 09-13 · 42945 Rovaniemen koulutusky 09-30 ·
43038 KELA 09-16 · 43082 KELA 09-14 · 43241 KELA 09-21 · 43259 KELA 09-06 · 43397 Kemin kaupunki 09-19 ·
43415 Kemin kaupunki 09-09 · 43422 Valkeakosken seudun koulutusky 09-18 ·
43439 Itä-Suomen yliopisto 09-07 · 43443 Härmän Kuntoutus 09-18 · 43478 Euran Kunta 09-21 ·
43556 KELA 09-17 · 43650 Lapin AMK 09-12 · 43654 Koulutuskeskus Salpaus 09-15 · 43766 Lapin AMK 09-11 ·
43805 Porvoon Kaupunki 09-19 · 43891 Digia Finland 09-30 · 43996 Jokilaaksojen koulutusky 09-30 ·
44158 Peab Industri 09-24 · 44395 Tiera 09-23 · 44485 Vaisala 09-30 · 44571 Iisalmen kaupunki 09-26 ·
44763 Presto 09-09 · 44860 Oomi Oy 09-29 · 44979 Keski-Uudenmaan hva 09-20 ·
44988 Keski-Uudenmaan hva 09-17 · 45028 Keski-Uudenmaan hva 09-06 · 45063 Keski-Uudenmaan hva 09-19 ·
45107 Peab 09-05 · 45113 Peab 09-09 · 45454 Konecranes Global 09-23 · 45458 Konecranes Global 09-30 ·
45492 Miilux 09-14 · 45513 AktiaDuetto 09-12 · 45552 Työstöhankinta Reponen 09-07 ·
45640 Oulun poliisilaitos 09-19 · 45770 Porin kaupunki 09-18 ·
45808 Aviator Airport Services Finland 09-09 · 45898 Oulun poliisilaitos 09-28 · 46013 Miilux 09-16 ·
46214 Medisize 09-26 · 46249 Siilinjärven kunta 09-19 · 46390 Sakupe 09-16

(kaikki päivämäärät vuodelta 2026)

## Mitä tästä ei tehdä

Kausi 09/2026 on toimitettu. Puuttuvan rivin luominen jälkikäteen **ei** muuta toimitettua
palkka-aineistoa, ja `PROJEKTIN_TILA.md`:n varoitus on voimassa: **syyskuun CSV:tä ei saa ajaa
uudelleen** (backfillin 11 115 Ended-riviä ovat raportointipäivällä 01.09.2026 ja läpäisisivät
CSV:n statussuodattimen). Syyskuun puuttuvista vähennyksistä päättäminen on liiketoimintapäätös
(hyvitys / jälkiveloitus), ei rivikorjaus.
