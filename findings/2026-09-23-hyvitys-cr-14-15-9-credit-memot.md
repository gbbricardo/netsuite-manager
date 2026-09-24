# Hyvitys-CR:t (tyyppi 11) jotka valmistuivat 14.–15.9.2026 ja niiden credit memot

**Ajettu:** 23.09.2026, vain luku. Mitään ei kirjoitettu NetSuiteen.
**Päivitetty 23.09.2026:** roolille lisättiin View-oikeus *Transactions → Credit Memo*. Q9 ajettiin uudelleen, ja
credit memot (CM) näkyvät nyt. Tämä versio korvaa aiemman, jossa CM-summat olivat "ei näkyvissä".
**Rajaus:** `custrecord_cr_type = 11`, `custrecord_cr_status = 2`, `custrecord_cr_closed_date` 14.9.2026 00:00 – 16.9.2026 00:00
(Helsinki).

## Korjauslista taloudelle

**Tiedosto:** `findings/2026-09-23-hyvitys-korjauslista-14-9.csv`. Puolipiste-erotin, UTF-8 BOM, desimaalipilkku, joten
Excel avaa sen suoraan.

Listalla on **26 korjattavaa**. CR 6306 ei ole mukana, koska se on jo korjattu (INVGBF1043395 + CRMGBF0003851).

| Ryhmä | Kpl | Netto | Brutto (× 1,255) |
|---|---|---|---|
| Lisähyvitys: CM oli liian pieni | 22 | +1 088,51 € | +1 366,09 € |
| Ylihyvitys – veloitus: 6284, 6330, 6350 | 3 | −186,99 € | −233,41 € |
| Tupla-CM – kumoa: 6313, CRMGBF0003753 + 3754 | 1 | −18,12 € | −22,74 € |
| **Yhteensä asiakkaille hyvitettävä lisää** | 26 | **+884,40 €** | **+1 109,94 €** |

Merkkisääntö: `erotus_netto = oikea − nykyinen`. Positiivinen erotus tarkoittaa, että asiakkaalle hyvitetään lisää, ja
negatiivinen, että asiakasta veloitetaan takaisin. Bruttosumma on laskettu kertoimella 1,255 ja pyöristetty riveittäin.
NetSuiten oma ALV-pyöristys voi poiketa ±0,02 €.

**Ennen toimenpiteitä:**
- **CR 6284 ja 6330 (yhteensä −185,20 € netto) — tarkista ensin kokoomalasku.**
  - Wärtsilällä ja Swecolla on 10/2026-kokoomalaskut ilman pyörätunnusta: **INVGBF1042980** (Wärtsilä, 484 riviä) ja **INVGBF1042403** (Sweco, 36 riviä).
  - Sopimusrivien historiassa ei ole 10/2026:ta, mutta 7.8.–1.9. auditoinnissa havaittiin (CR 5074, Reaktor), että historia voi puuttua, vaikka kokoomalasku on laskuttanut kuukauden.
  - Jos pyörät ovat kokoomalaskuilla, hyvitys on oikein eikä veloitusta tehdä.
  - *Päätelty*, ei todennettu.
- **CR 5222 ja 6345** ovat kohdistettuja Oulun poliisilaitoksen kokoomalaskuun INVGBF1039075. Erotus hoidetaan erillisellä
  lisä-CM:llä.

## 0. Pääkohdat

1. **117 CR:ää, 118 CM:ää.** Kaikki CR:t käsiteltiin **14.9.2026** kahdessa ajossa (Helsinki 10:58–11:02 ja 13:01–13:07).
   15.9. ei valmistunut yhtään tyypin 11 CR:ää. Jokaiselle CR:lle löytyy CM (CRMGBF0003696–3813, internal id 736108–736312).
   CR 6313:lla CM:iä on kaksi. *Todennettu.*
2. **Liian pieni hyvitys: 23 CR:ää.** Näistä **22 on yhä korjaamatta**, ja niiden yhteisvaje on **1 088,51 € netto**.
   Kaikki 23 ovat OOMI-pyöriä. Vanha `handler_hyvitys` (ennen 16.9. korjausta, `CHANGELOG.md:265-299`) hinnoitteli ne
   halvemmalla stub- tai tulevan jakson rivillä.
   - 20 CM:ää käyttää halpaa riviä molemmille itemeille.
   - 2 CM:ää sekoittaa rivejä: CR 5222 (vuokra stubista, admin fee pääriviltä) ja CR 6311 (vuokra pääriviltä, admin fee halvalta).
   - *Todennettu CM-riveiltä (`rate` = halvan rivin `price_month`).*
3. **Vain yksi alihyvitys on korjattu: CR 6306** (B044556, Rovalan Setlementti ry). Sanna Kokkonen teki 17.9.:
   - laskun **INVGBF1043395** (id 741823, +22,67 € brutto, memo "Hyvitetty virheellisesti vain osa lokakuusta"), joka on kohdistettu alkuperäiseen CM:ään CRMGBF0003746
   - uuden CM:n **CRMGBF0003851** (id 741924, 90,33 € netto / 113,36 € brutto, memo viittaa CR-6306:een)

   Korjattu netto on 90,33 €, täsmälleen odotettu. *Todennettu.*
4. **CRMGBF0003753 on olemassa ja on tupla.** Se on id 736167, luotu 14.9. klo 11:02, asiakas 103945 Ammattiopisto Luovi Oy,
   pyörä 40630: sama CR 6313 kuin CRMGBF0003754 (id 736234, 13:01). Molemmissa on 47,8088 + 6,5307 = **54,34 € netto
   (68,20 € brutto)**, ja molemmat on hinnoiteltu väärin halvalla rivillä. Ensimmäinen ajo tallensi CM:n ja kaatui sen
   jälkeen governance-rajaan, ja uudelleenajo teki toisen. Yhteensä hyvitetty 108,68 €, odotettu 90,56 € → **ylihyvitys
   18,12 € netto**. Vääriä hyvityksiä on kaksi, oikeaa ei yhtään. Korjaamatta. *Todennettu.*
5. **CR 6284 (Wärtsilä Finland Oy, B007914) ja CR 6330 (Sweco Finland Oy, B018137):** kumpikin CM on **92,60 € netto /
   116,21 € brutto** kuukaudelle 10/2026.
   - `next_billto`-asiakkaan sopimusrivien historiassa 10/2026 puuttuu — *todennettu*.
   - Asiakkailla on kuitenkin 10/2026-kokoomalaskut ilman pyörätunnusta (INVGBF1042980, INVGBF1042403), joten laskutus voi
     olla tapahtunut niillä — *päätelty, ei todennettu*.
   - Jos pyörät eivät ole kokoomalaskuilla, kumpikin on 92,60 € ylihyvitys.
6. **CR 6180 (B039319): ei ylihyvitystä.** CM CRMGBF0003712 on 11,97 € netto, eli oikea stub-hinta. Aiempi riskiepäily ei
   toteutunut. **CR 6350:** CM on 91,63 € netto, odotettu 90,84 € → ylihyvitys 0,79 €. *Todennettu.*
7. **CR 6029 (B044666, Kouvolan kaupunki):** CM oli odotetun mukainen (179,52 €). 19.9. tehtiin kuitenkin käsin lasku
   **INVGBF1043396** (+112,65 € brutto, memo "Syyskuuta ei laskutettu TA:lta"), joka on kohdistettu tähän CM:ään, eli
   syyskuun hyvitys peruttiin. Sopimusrivin 109632 laskutushistoriassa on kuitenkin 2026-09. Historia ja memo ovat
   ristiriidassa, ja ratkaisu kuuluu `sopimusriviauditoija`lle. Ei mukana korjauslistassa, koska talous on jo toiminut.
   *Todennettu (ristiriita); syy päätelty.*
8. **Muita korjauksia ei löytynyt.** Haettiin 14.9. jälkeen luodut CustCred-, CustInvc- ja Journal-transaktiot, jotka
   osuvat samoille asiakkaille tai pyörille, joiden memossa on "hyvit"/"CR-6"/"CRMGBF" tai joiden tekijä ei ole -System-.
   Löytyivät vain edellä mainitut. Muut 14.9. jälkeen samoille asiakkaille luodut CM:t kuuluvat eri pyörille (16.–22.9.
   erät, -System-). CM:ien rivisummat eivät ole muuttuneet: nykyinen netto vastaa rivejä, ja `systemnote` palautti 0 riviä,
   mikä ei todista mitään. `lastmodified` 14.9. 20:15–20:21 on koko erälle yhteinen, todennäköisesti lähetys- tai
   kohdistusajo (päätelty). Myöhemmät `lastmodified`-arvot ovat kohdistuksia (Payment-linkit), eivät summamuutoksia.
   *Todennettu siltä osin kuin haku kattaa.*

## 1. Aikajana ja linkitys

- `closed_date` on Helsingin aikaa: `scriptnote` 1199 näyttää saman sarjan runtime-kellolla −10 h.
- **CM:n linkitys CR:ään on todennettu kolmesta lähteestä:**
  - CR:n `automation_logs` (`Credit Memo <tranid> created`)
  - käsittelijän loki (`Created CM <tranid> … for bike <id>`)
  - CM:n kentät: `custbody_sta_bike_id` = CR:n pyörä ja `entity` = CR:n `next_billto`, täsmäävät kaikilla 118:lla
- **Poikkeus:** CRMGBF0003753 ei ole CR:n lokissa, koska lokikenttä ylikirjoitettiin uudelleenajossa. Se linkittyy CR 6313:een
  pyörän, asiakkaan, jakson ja luontihetken kautta (11:02 = ensimmäisen ajon kaatumishetki) — *päätelty linkki, vahva.*
- `trandate` on kaikilla 2026-09-14. `createddate` = `closed_date` ± 1 min.

## 2. Odotettu summa (nykyinen `handler_hyvitys`)

Kunkin kuukauden hinta otetaan pyörän ja `next_billto`-asiakkaan siltä riviltä, jonka `custrecord_sta_ca_row_invoicehistory`
sisältää kuukauden. Item 30 ja item 31, `price_month` on netto (ALV 0), rivisumma pyöristetään 2 desimaaliin. Malli täsmää
sentilleen 89 CM:ään, joiden rivit olivat yksiselitteiset, ja tyypin 13 ketjun jälkiveloituslaskuihin. Brutto ≈ netto × 1,255.

**Rajoitus:** kokoomalaskuilla ei ole rivikohtaista pyörätunnusta (`custcol_sta_bikeid_line` tyhjä). Siksi se, ettei
kuukausi ole historiassa, ei aukottomasti todista, ettei sitä laskutettu. Katso 7.8.–1.9. raportti, CR 5074.

## 3. Poikkeamat (todennettu)

| CR | Pyörä | Asiakas | CM tranid (id) | CM netto alkuper. | Korjaus | Korjattu netto | Odotettu netto | Erotus (nykyinen − odotettu) |
|---|---|---|---|---|---|---|---|---|
| 5222 | B037693 | 104291 Oulun poliisilaitos | CRMGBF0003696 (736108) | 20,52 | – | 20,52 | 86,83 | **−66,31** |
| 6123 | B037607 | 104137 Istekki Oy | CRMGBF0003702 (736115) | 18,19 | – | 18,19 | 90,97 | **−72,78** |
| 6164 | B039189 | 104271 Oulun Pysäköinti Oy | CRMGBF0003704 (736117) | 168,98 | – | 168,98 | 187,10 | **−18,12** |
| 6168 | B038758 | 103959 CGI Suomi Oy | CRMGBF0003706 (736119) | 95,72 | – | 95,72 | 185,50 | **−89,78** |
| 6170 | B038366 | 819 Etelä-Karjalan hva | CRMGBF0003707 (736120) | 69,64 | – | 69,64 | 179,90 | **−110,26** |
| 6172 | B037520 | 104212 Lapin hva | CRMGBF0003708 (736121) | 129,04 | – | 129,04 | 161,30 | **−32,26** |
| 6174 | B039324 | 104160 Kemin kaupunki | CRMGBF0003709 (736122) | 168,84 | – | 168,84 | 180,90 | **−12,06** |
| 6176 | B039116 | 819 Etelä-Karjalan hva | CRMGBF0003710 (736123) | 134,88 | – | 134,88 | 175,94 | **−41,06** |
| 6178 | B037916 | 104212 Lapin hva | CRMGBF0003711 (736124) | 10,28 | – | 10,28 | 159,36 | **−149,08** |
| 6299 | B037984 | 104317 Pörhön Autoliike Oy | CRMGBF0003739 (736153) | 90,36 | – | 90,36 | 93,38 | **−3,02** |
| 6301 | B045671 | 104235 Meltex Oy Plastics | CRMGBF0003741 (736155) | 20,90 | – | 20,90 | 92,58 | **−71,68** |
| 6306 | B044556 | 104352 Rovalan Setlementti ry | CRMGBF0003746 (736160) | 18,07 | INVGBF1043395 (741823) −18,07 + CRMGBF0003851 (741924) +90,33 | 90,33 | 90,33 | 0,00 |
| 6308 | B039932 | 104212 Lapin hva | CRMGBF0003748 (736162) | 31,22 | – | 31,22 | 80,65 | **−49,43** |
| 6311 | B037378 | 103959 CGI Suomi Oy | CRMGBF0003751 (736165) | 92,34 | – | 92,34 | 92,75 | **−0,41** |
| 6313 | B040630 | 103945 Ammattiopisto Luovi Oy | CRMGBF0003753 (736167) + CRMGBF0003754 (736234) | 54,34 + 54,34 | – | 108,68 | 90,56 | **+18,12** (tupla) |
| 6318 | B045240 | 104183 Konecranes Finland Oy | CRMGBF0003758 (736238) | 27,27 | – | 27,27 | 60,39 | **−33,12** |
| 6321 | B040691 | 104143 John Deere Forestry Oy | CRMGBF0003761 (736241) | 37,42 | – | 37,42 | 93,55 | **−56,13** |
| 6328 | B043228 | 104156 KELA | CRMGBF0003768 (736248) | 17,75 | – | 17,75 | 88,77 | **−71,02** |
| 6333 | B037825 | 819 Etelä-Karjalan hva | CRMGBF0003773 (736253) | 37,43 | – | 37,43 | 89,25 | **−51,82** |
| 6334 | B039837 | 104345 Rautatieto Oy | CRMGBF0003774 (736254) | 29,24 | – | 29,24 | 90,64 | **−61,40** |
| 6344 | B040708 | 104205 Kymenlaakson hva | CRMGBF0003783 (736263) | 36,14 | – | 36,14 | 90,37 | **−54,23** |
| 6345 | B038038 | 104291 Oulun poliisilaitos | CRMGBF0003784 (736264) | 82,26 | – | 82,26 | 87,94 | **−5,68** |
| 6348 | B040471 | 104160 Kemin kaupunki | CRMGBF0003785 (736265) | 87,70 | – | 87,70 | 90,73 | **−3,03** |
| 6351 | B045099 | 104281 Peab Oy | CRMGBF0003788 (736268) | 56,75 | – | 56,75 | 92,58 | **−35,83** |
| 6284 | B007914 | 373 Wärtsilä Finland Oy | CRMGBF0003724 (736138) | 92,60 | – | 92,60 | 0 (päätelty) | **+92,60** (tarkista INVGBF1042980) |
| 6330 | B018137 | 936 Sweco Finland Oy | CRMGBF0003770 (736250) | 92,60 | – | 92,60 | 0 (päätelty) | **+92,60** (tarkista INVGBF1042403) |
| 6350 | B036819 | 2224 Etelä-Savon hva | CRMGBF0003787 (736267) | 91,63 | – | 91,63 | 90,84 | **+0,79** |
| 6029 | B044666 | 104193 Kouvolan kaupunki | CRMGBF0003697 (736109) | 179,52 | INVGBF1043396 (743654) +112,65 brutto ≈ −89,76 netto | 89,76 | 179,52 (historian mukaan) | −89,76 (ks. kohta 0.7) |

Huom: tämän taulukon erotus on *nykyinen − odotettu*. Korjauslistan CSV:ssä etumerkki on käänteinen
(*oikea − nykyinen*), jotta positiivinen luku = hyvitettävä lisää.

**Yhteenveto:**

| Ryhmä | Kpl | Summa netto | Todennettu? |
|---|---|---|---|
| Alihyvitys, korjaamatta | 22 | −1 088,51 € | todennettu |
| Alihyvitys, korjattu (CR 6306) | 1 | 0,00 € | todennettu |
| Ylihyvitys: 6313 tupla + 6350 | 2 | +18,91 € | todennettu |
| Ylihyvitys: 6284 + 6330 | 2 | +185,20 € | päätelty |

CR 6180 ja muut 89 CR:ää täsmäävät odotettuun.

## 4. Kaikki 117 CR:ää

Pyörä-, asiakas- ja kausitiedot ovat muuttumattomat edellisestä versiosta. CM-summa on netto, `transactionline.netamount`,
ALV 0.

| CR | Pyörä | Asiakas | Valmistunut 14.9. | CM tranid (id) | CM netto | Korjaus | Korjattu | Odotettu | Erotus |
|---|---|---|---|---|---|---|---|---|---|
| 5222 | B037693 | 104291 | 10:58:07 | CRMGBF0003696 (736108) | 20,52 | – | 20,52 | 86,83 | −66,31 |
| 6029 | B044666 | 104193 | 10:58:12 | CRMGBF0003697 (736109) | 179,52 | INVGBF1043396 | 89,76 | 179,52 | ks. 0.7 |
| 6089 | B023181 | 602 | 10:58:16 | CRMGBF0003698 (736110) | 185,20 | – | 185,20 | 185,20 | 0 |
| 6093 | B008409 | 2068 | 10:58:21 | CRMGBF0003699 (736111) | 366,52 | – | 366,52 | 366,52 | 0 |
| 6110 | B034974 | 2635 | 10:58:31 | CRMGBF0003700 (736113) | 185,20 | – | 185,20 | 185,20 | 0 |
| 6120 | B029469 | 3776 | 10:58:36 | CRMGBF0003701 (736114) | 185,20 | – | 185,20 | 185,20 | 0 |
| 6123 | B037607 | 104137 | 10:58:40 | CRMGBF0003702 (736115) | 18,19 | – | 18,19 | 90,97 | −72,78 |
| 6143 | B017099 | 606 | 10:58:43 | CRMGBF0003703 (736116) | 91,63 | – | 91,63 | 91,63 | 0 |
| 6164 | B039189 | 104271 | 10:58:47 | CRMGBF0003704 (736117) | 168,98 | – | 168,98 | 187,10 | −18,12 |
| 6166 | B043381 | 104245 | 10:58:51 | CRMGBF0003705 (736118) | 92,58 | – | 92,58 | 92,58 | 0 |
| 6168 | B038758 | 103959 | 10:58:55 | CRMGBF0003706 (736119) | 95,72 | – | 95,72 | 185,50 | −89,78 |
| 6170 | B038366 | 819 | 10:58:59 | CRMGBF0003707 (736120) | 69,64 | – | 69,64 | 179,90 | −110,26 |
| 6172 | B037520 | 104212 | 10:59:03 | CRMGBF0003708 (736121) | 129,04 | – | 129,04 | 161,30 | −32,26 |
| 6174 | B039324 | 104160 | 10:59:07 | CRMGBF0003709 (736122) | 168,84 | – | 168,84 | 180,90 | −12,06 |
| 6176 | B039116 | 819 | 10:59:11 | CRMGBF0003710 (736123) | 134,88 | – | 134,88 | 175,94 | −41,06 |
| 6178 | B037916 | 104212 | 10:59:14 | CRMGBF0003711 (736124) | 10,28 | – | 10,28 | 159,36 | −149,08 |
| 6180 | B039319 | 819 | 10:59:18 | CRMGBF0003712 (736125) | 11,97 | – | 11,97 | 11,97 | 0 |
| 6182 | B029874 | 3066 | 10:59:22 | CRMGBF0003713 (736126) | 277,80 | – | 277,80 | 277,80 | 0 |
| 6271 | B041339 | 104353 | 10:59:31 | CRMGBF0003714 (736128) | 89,78 | – | 89,78 | 89,78 | 0 |
| 6273 | B019746 | 336 | 10:59:34 | CRMGBF0003715 (736129) | 92,60 | – | 92,60 | 92,60 | 0 |
| 6275 | B022406 | 367 | 10:59:38 | CRMGBF0003716 (736130) | 92,60 | – | 92,60 | 92,60 | 0 |
| 6276 | B014905 | 336 | 10:59:42 | CRMGBF0003717 (736131) | 91,63 | – | 91,63 | 91,63 | 0 |
| 6277 | B014668 | 737 | 10:59:46 | CRMGBF0003718 (736132) | 91,63 | – | 91,63 | 91,63 | 0 |
| 6278 | B014467 | 432 | 10:59:49 | CRMGBF0003719 (736133) | 91,63 | – | 91,63 | 91,63 | 0 |
| 6279 | B021216 | 336 | 10:59:53 | CRMGBF0003720 (736134) | 92,60 | – | 92,60 | 92,60 | 0 |
| 6280 | B034219 | 3615 | 10:59:57 | CRMGBF0003721 (736135) | 90,21 | – | 90,21 | 90,21 | 0 |
| 6281 | B032959 | 336 | 11:00:00 | CRMGBF0003722 (736136) | 92,60 | – | 92,60 | 92,60 | 0 |
| 6283 | B035176 | 1450 | 11:00:05 | CRMGBF0003723 (736137) | 92,60 | – | 92,60 | 92,60 | 0 |
| 6284 | B007914 | 373 | 11:00:09 | CRMGBF0003724 (736138) | 92,60 | – | 92,60 | 0 (päätelty) | +92,60 |
| 6285 | B014931 | 3419 | 11:00:13 | CRMGBF0003725 (736139) | 91,63 | – | 91,63 | 91,63 | 0 |
| 6286 | B006796 | 4220 | 11:00:17 | CRMGBF0003726 (736140) | 91,63 | – | 91,63 | 91,63 | 0 |
| 6287 | B001399 | 370 | 11:00:21 | CRMGBF0003727 (736141) | 91,63 | – | 91,63 | 91,63 | 0 |
| 6288 | B032652 | 3625 | 11:00:26 | CRMGBF0003728 (736142) | 90,21 | – | 90,21 | 90,21 | 0 |
| 6289 | B013703 | 3335 | 11:00:29 | CRMGBF0003729 (736143) | 91,63 | – | 91,63 | 91,63 | 0 |
| 6290 | B018110 | 355 | 11:00:33 | CRMGBF0003730 (736144) | 92,60 | – | 92,60 | 92,60 | 0 |
| 6291 | B027084 | 329 | 11:00:37 | CRMGBF0003731 (736145) | 92,60 | – | 92,60 | 92,60 | 0 |
| 6292 | B031770 | 3045 | 11:00:42 | CRMGBF0003732 (736146) | 90,21 | – | 90,21 | 90,21 | 0 |
| 6293 | B029971 | 510 | 11:00:46 | CRMGBF0003733 (736147) | 92,60 | – | 92,60 | 92,60 | 0 |
| 6294 | B029780 | 2224 | 11:00:49 | CRMGBF0003734 (736148) | 91,81 | – | 91,81 | 91,81 | 0 |
| 6295 | B028974 | 2224 | 11:00:53 | CRMGBF0003735 (736149) | 91,81 | – | 91,81 | 91,81 | 0 |
| 6296 | B030291 | 3846 | 11:00:57 | CRMGBF0003736 (736150) | 92,60 | – | 92,60 | 92,60 | 0 |
| 6297 | B008217 | 2200 | 11:01:00 | CRMGBF0003737 (736151) | 92,60 | – | 92,60 | 92,60 | 0 |
| 6298 | B021788 | 936 | 11:01:04 | CRMGBF0003738 (736152) | 92,60 | – | 92,60 | 92,60 | 0 |
| 6299 | B037984 | 104317 | 11:01:08 | CRMGBF0003739 (736153) | 90,36 | – | 90,36 | 93,38 | −3,02 |
| 6300 | B032933 | 2635 | 11:01:12 | CRMGBF0003740 (736154) | 92,60 | – | 92,60 | 92,60 | 0 |
| 6301 | B045671 | 104235 | 11:01:15 | CRMGBF0003741 (736155) | 20,90 | – | 20,90 | 92,58 | −71,68 |
| 6302 | B028616 | 900 | 11:01:19 | CRMGBF0003742 (736156) | 92,60 | – | 92,60 | 92,60 | 0 |
| 6303 | B003405 | 4578 | 11:01:24 | CRMGBF0003743 (736157) | 91,63 | – | 91,63 | 91,63 | 0 |
| 6304 | B011939 | 426 | 11:01:27 | CRMGBF0003744 (736158) | 91,63 | – | 91,63 | 91,63 | 0 |
| 6305 | B024915 | 3021 | 11:01:31 | CRMGBF0003745 (736159) | 92,60 | – | 92,60 | 92,60 | 0 |
| 6306 | B044556 | 104352 | 11:01:35 | CRMGBF0003746 (736160) | 18,07 | INVGBF1043395 + CRMGBF0003851 | 90,33 | 90,33 | 0 |
| 6307 | B000637 | 1705 | 11:01:39 | CRMGBF0003747 (736161) | 91,63 | – | 91,63 | 91,63 | 0 |
| 6308 | B039932 | 104212 | 11:01:43 | CRMGBF0003748 (736162) | 31,22 | – | 31,22 | 80,65 | −49,43 |
| 6309 | B030087 | 2943 | 11:01:47 | CRMGBF0003749 (736163) | 92,60 | – | 92,60 | 92,60 | 0 |
| 6310 | B018734 | 723 | 11:01:50 | CRMGBF0003750 (736164) | 92,60 | – | 92,60 | 92,60 | 0 |
| 6311 | B037378 | 103959 | 11:01:54 | CRMGBF0003751 (736165) | 92,34 | – | 92,34 | 92,75 | −0,41 |
| 6312 | B031662 | 3746 | 11:01:58 | CRMGBF0003752 (736166) | 92,60 | – | 92,60 | 92,60 | 0 |
| 6313 | B040630 | 103945 | 11:02 (kaatui) / 13:01:38 | CRMGBF0003753 (736167) + CRMGBF0003754 (736234) | 108,68 | – | 108,68 | 90,56 | +18,12 |
| 6314 | B036587 | 1253 | 13:01:43 | CRMGBF0003755 (736235) | 91,63 | – | 91,63 | 91,63 | 0 |
| 6315 | B001592 | 4710 | 13:01:47 | CRMGBF0003756 (736236) | 91,63 | – | 91,63 | 91,63 | 0 |
| 6316 | B010064 | 1125 | 13:01:51 | CRMGBF0003757 (736237) | 80,65 | – | 80,65 | 80,65 | 0 |
| 6318 | B045240 | 104183 | 13:01:56 | CRMGBF0003758 (736238) | 27,27 | – | 27,27 | 60,39 | −33,12 |
| 6319 | B025393 | 1785 | 13:01:59 | CRMGBF0003759 (736239) | 92,60 | – | 92,60 | 92,60 | 0 |
| 6320 | B022279 | 3899 | 13:02:03 | CRMGBF0003760 (736240) | 92,60 | – | 92,60 | 92,60 | 0 |
| 6321 | B040691 | 104143 | 13:02:08 | CRMGBF0003761 (736241) | 37,42 | – | 37,42 | 93,55 | −56,13 |
| 6322 | B021888 | 327 | 13:02:13 | CRMGBF0003762 (736242) | 92,60 | – | 92,60 | 92,60 | 0 |
| 6323 | B015287 | 980 | 13:02:19 | CRMGBF0003763 (736243) | 92,60 | – | 92,60 | 92,60 | 0 |
| 6324 | B006040 | 5969 | 13:02:24 | CRMGBF0003764 (736244) | 91,63 | – | 91,63 | 91,63 | 0 |
| 6325 | B029980 | 1702 | 13:02:29 | CRMGBF0003765 (736245) | 92,60 | – | 92,60 | 92,60 | 0 |
| 6326 | B019586 | 2612 | 13:02:35 | CRMGBF0003766 (736246) | 92,60 | – | 92,60 | 92,60 | 0 |
| 6327 | B002706 | 3617 | 13:02:40 | CRMGBF0003767 (736247) | 89,24 | – | 89,24 | 89,24 | 0 |
| 6328 | B043228 | 104156 | 13:02:45 | CRMGBF0003768 (736248) | 17,75 | – | 17,75 | 88,77 | −71,02 |
| 6329 | B011817 | 791 | 13:02:50 | CRMGBF0003769 (736249) | 91,63 | – | 91,63 | 91,63 | 0 |
| 6330 | B018137 | 936 | 13:02:55 | CRMGBF0003770 (736250) | 92,60 | – | 92,60 | 0 (päätelty) | +92,60 |
| 6331 | B012762 | 336 | 13:03:00 | CRMGBF0003771 (736251) | 92,60 | – | 92,60 | 92,60 | 0 |
| 6332 | B002429 | 4382 | 13:03:05 | CRMGBF0003772 (736252) | 91,63 | – | 91,63 | 91,63 | 0 |
| 6333 | B037825 | 819 | 13:03:10 | CRMGBF0003773 (736253) | 37,43 | – | 37,43 | 89,25 | −51,82 |
| 6334 | B039837 | 104345 | 13:03:15 | CRMGBF0003774 (736254) | 29,24 | – | 29,24 | 90,64 | −61,40 |
| 6335 | B034965 | 1591 | 13:03:19 | CRMGBF0003775 (736255) | 92,60 | – | 92,60 | 92,60 | 0 |
| 6336 | B030259 | 3615 | 13:03:24 | CRMGBF0003776 (736256) | 90,21 | – | 90,21 | 90,21 | 0 |
| 6337 | B016869 | 443 | 13:03:28 | CRMGBF0003777 (736257) | 91,63 | – | 91,63 | 91,63 | 0 |
| 6338 | B015097 | 1688 | 13:03:32 | CRMGBF0003778 (736258) | 91,63 | – | 91,63 | 91,63 | 0 |
| 6339 | B030581 | 736 | 13:03:37 | CRMGBF0003779 (736259) | 95,62 | – | 95,62 | 95,62 | 0 |
| 6341 | B018560 | 866 | 13:03:41 | CRMGBF0003780 (736260) | 92,60 | – | 92,60 | 92,60 | 0 |
| 6342 | B008731 | 336 | 13:03:45 | CRMGBF0003781 (736261) | 91,63 | – | 91,63 | 91,63 | 0 |
| 6343 | B013502 | 435 | 13:03:49 | CRMGBF0003782 (736262) | 91,63 | – | 91,63 | 91,63 | 0 |
| 6344 | B040708 | 104205 | 13:03:53 | CRMGBF0003783 (736263) | 36,14 | – | 36,14 | 90,37 | −54,23 |
| 6345 | B038038 | 104291 | 13:03:57 | CRMGBF0003784 (736264) | 82,26 | – | 82,26 | 87,94 | −5,68 |
| 6348 | B040471 | 104160 | 13:04:01 | CRMGBF0003785 (736265) | 87,70 | – | 87,70 | 90,73 | −3,03 |
| 6349 | B032236 | 2619 | 13:04:06 | CRMGBF0003786 (736266) | 92,00 | – | 92,00 | 92,00 | 0 |
| 6350 | B036819 | 2224 | 13:04:10 | CRMGBF0003787 (736267) | 91,63 | – | 91,63 | 90,84 | +0,79 |
| 6351 | B045099 | 104281 | 13:04:14 | CRMGBF0003788 (736268) | 56,75 | – | 56,75 | 92,58 | −35,83 |
| 6352 | B031415 | 1208 | 13:04:18 | CRMGBF0003789 (736269) | 92,60 | – | 92,60 | 92,60 | 0 |
| 6353 | B025982 | 501 | 13:04:22 | CRMGBF0003790 (736270) | 92,60 | – | 92,60 | 92,60 | 0 |
| 6354 | B032478 | 2224 | 13:04:25 | CRMGBF0003791 (736271) | 91,81 | – | 91,81 | 91,81 | 0 |
| 6355 | B025528 | 2369 | 13:04:30 | CRMGBF0003792 (736272) | 92,60 | – | 92,60 | 92,60 | 0 |
| 6356 | B010801 | 4135 | 13:04:34 | CRMGBF0003793 (736273) | 91,63 | – | 91,63 | 91,63 | 0 |
| 6359 | B028248 | 1996 | 13:04:45 | CRMGBF0003794 (736275) | 184,00 | – | 184,00 | 184,00 | 0 |
| 6362 | B046484 | 132438 | 13:04:54 | CRMGBF0003795 (736277) | 191,24 | – | 191,24 | 191,24 | 0 |
| 6365 | B016990 | 405 | 13:05:03 | CRMGBF0003796 (736279) | 183,26 | – | 183,26 | 183,26 | 0 |
| 6368 | B029747 | 405 | 13:05:11 | CRMGBF0003797 (736281) | 185,20 | – | 185,20 | 185,20 | 0 |
| 6371 | B035031 | 405 | 13:05:19 | CRMGBF0003798 (736283) | 185,20 | – | 185,20 | 185,20 | 0 |
| 6374 | B036085 | 405 | 13:05:29 | CRMGBF0003799 (736285) | 185,20 | – | 185,20 | 185,20 | 0 |
| 6377 | B026038 | 405 | 13:05:37 | CRMGBF0003800 (736287) | 185,20 | – | 185,20 | 185,20 | 0 |
| 6380 | B034479 | 405 | 13:05:46 | CRMGBF0003801 (736289) | 92,60 | – | 92,60 | 92,60 | 0 |
| 6383 | B009820 | 405 | 13:05:54 | CRMGBF0003802 (736291) | 92,60 | – | 92,60 | 92,60 | 0 |
| 6386 | B008278 | 405 | 13:06:02 | CRMGBF0003803 (736293) | 92,60 | – | 92,60 | 92,60 | 0 |
| 6389 | B020353 | 2859 | 13:06:11 | CRMGBF0003804 (736295) | 185,20 | – | 185,20 | 185,20 | 0 |
| 6392 | B028476 | 2859 | 13:06:19 | CRMGBF0003805 (736297) | 185,20 | – | 185,20 | 185,20 | 0 |
| 6395 | B028956 | 2859 | 13:06:27 | CRMGBF0003806 (736299) | 185,20 | – | 185,20 | 185,20 | 0 |
| 6398 | B023493 | 2859 | 13:06:36 | CRMGBF0003807 (736301) | 185,20 | – | 185,20 | 185,20 | 0 |
| 6401 | B027404 | 2859 | 13:06:44 | CRMGBF0003808 (736303) | 185,20 | – | 185,20 | 185,20 | 0 |
| 6404 | B022218 | 2859 | 13:06:52 | CRMGBF0003809 (736305) | 185,20 | – | 185,20 | 185,20 | 0 |
| 6407 | B023381 | 2859 | 13:07:00 | CRMGBF0003810 (736307) | 185,20 | – | 185,20 | 185,20 | 0 |
| 6410 | B023377 | 2859 | 13:07:09 | CRMGBF0003811 (736309) | 185,20 | – | 185,20 | 185,20 | 0 |
| 6413 | B024781 | 2859 | 13:07:17 | CRMGBF0003812 (736311) | 185,20 | – | 185,20 | 185,20 | 0 |
| 6416 | B029955 | 559 | 13:07:21 | CRMGBF0003813 (736312) | 92,00 | – | 92,00 | 92,00 | 0 |

Asiakasnumeroiden nimet: 104291 Oulun poliisilaitos, 104193 Kouvolan kaupunki, 602 Kolmen J:n Linjat, 2068 Aurajoki,
2635 Humana, 3776 ShopLive, 104137 Istekki, 606 Etra, 104271 Oulun Pysäköinti, 104245 MSK Finland, 103959 CGI Suomi,
819 Etelä-Karjalan hva, 104212 Lapin hva, 104160 Kemin kaupunki, 3066 Spbox, 104353 Rovaniemen kaupunki, 336 Nordcloud,
367 Futurice, 737 Sandvik, 432 Netlight, 3615 UPM Communication Papers, 1450 Nuorten Väylä, 373 Wärtsilä, 3419 Nostoykköset,
4220 Alumni Consulting, 370 Creo Center, 3625 UPM Pulp, 3335 Ioncor, 355 Vaasan kaupunki, 329 Eltel, 3045 UPM Timber,
510 Sappi, 2224 Etelä-Savon hva, 3846 Suomen Kuntolat, 2200 Handy Palvelut, 936 Sweco, 104317 Pörhön Autoliike,
104235 Meltex, 900 Teräselementti, 4578 Holmin Taksit, 426 Fingersoft, 3021 Savilahden Auto, 104352 Rovalan Setlementti,
1705 Kokkolan Halpa-Halli, 2943 Bayer, 723 Silmäasema, 3746 Baltic Yachts, 103945 Ammattiopisto Luovi, 1253 Tahto,
4710 HUS Kiinteistöpalvelut, 1125 Cycle Group, 104183 Konecranes, 1785 Rejlers, 3899 One Click LCA, 104143 John Deere
Forestry, 327 Deloitte, 980 Stora Enso Anjalankoski, 5969 Maury & c:o, 1702 Arctic Drilling, 2612 Hirvensalmen kunta,
3617 UPM Global Functions, 104156 KELA, 791 Ajovarma, 4382 Pohjankodit, 104345 Rautatieto, 1591 Sarlin, 443 KerabitPro,
1688 Kuuleva, 736 Dahl Suomi, 866 Rinnekodit, 435 Kameratori, 104205 Kymenlaakson hva, 2619 Valmet, 104281 Peab,
1208 Validia, 501 K-S Vahinkopalvelut, 2369 Splinetech, 4135 North Rail, 1996 Metsä Board, 132438 Validia Omppu, 405 Huld,
2859 Vellogs, 559 Nobia.

## 5. Kohdistukset (todennettu, kontekstiksi)

31 Payment-linkkiä. Useimmat CM:t on kohdistettu hyvitettyyn laskuun tai asiakaspalautukseen (Customer Refund 17.09.2026,
Vellogs). CRMGBF0003696 ja 3784 on kohdistettu Oulun poliisilaitoksen kokoomalaskuun INVGBF1039075. Kohdistetun
alihyvityksen jälkikorjaus vaatii erillisen CM:n, kuten CR 6306:ssa tehtiin.

## 6. Korjausehdotukset (vain CR-tietue)

Kaikki 117 CR:ää ovat Done-tilassa. **Done-CR:n muokkaus ei peru eikä muuta syntyneitä CM:iä.** CR-kenttiin ei ehdoteta
muutoksia.

**Uudet CR:t: ei ehdoteta.** Uusi tyypin 11 CR samalle pyörälle ja asiakkaalle leikkaavalla jaksolla pysähtyy
duplikaattitarkistukseen, koska alkuperäinen on Done (`handler_hyvitys.md` § Logic 2). Jos se menisi läpi, se hyvittäisi
koko kuukauden eikä erotusta. Korjaukset tehdään käsin korjauslistan (CSV) mukaan. **Vaatii talouden päätöksen.**

## 7. Vaikutus ja korjaus muualla

- **Talous:** korjauslista CSV (26 riviä, joista 6284 ja 6330 tarkistettava ensin).
- **`sopimusriviauditoija`:**
  - CR 6029 / rivi 109632: laskutushistoriassa 2026-09, mutta talouden memo "Syyskuuta ei laskutettu TA:lta".
  - CR 6284 ja 6330: rivit päättyvät 30.9., mutta hyvitys koski lokakuuta.
- **Skripti, `netsuite-subscrption-cr-scripts`:**
  - Hinnoitteluvika on korjattu 16.9. (CHANGELOG, README finding 14).
  - Governance-kaatuminen CM:n tallennuksen jälkeen (CR 6313) jätti CR:n Pendingiksi, ja uudelleenajo teki toisen CM:n. Tämä on edelleen avoin mekanismi (`cr_dispatcher.js`, Known Issue 17:n sukulainen). Nyt todennettu tuotannossa.
- **Vanhalla koodilla käsiteltiin myös aiemmin:** tyypin 11 CR:iä valmistui 7.8.–1.9.2026 yhteensä **273 kpl**. Ne on
  auditoitu erikseen: `findings/2026-09-23-hyvitys-cr-7-8-1-9-credit-memot.md` (5 alihyvitystä, 144,27 € netto).

## 8. Varoitukset

- Tyypin 11 CR:n palautus Pendingiksi tai `_test_cr_id`-ajo loisi uuden CM:n **nykyisellä** koodilla. Alkuperäinen väärä
  CM jäisi voimaan, joten tulos olisi tuplahyvitys.
- CR:n poisto ei poista CM:ää.

## 9. Todennettu vs. päätelty

**Todennettu NetSuitesta:**
- kaikki CM:t (tranid, id, asiakas, pyörä, päivät, netto ja brutto)
- CM-rivien hinnat (poimitut: 3696, 3712, 3746, 3751, 3753, 3754, 3784, 3787, 3851)
- korjaustransaktiot INVGBF1043395, CRMGBF0003851 ja INVGBF1043396 memoineen ja tekijöineen
- kohdistuslinkit
- CRMGBF0003753:n olemassaolo ja kentät
- odotettu summa rividatasta

**Päätelty:**
- CRMGBF0003753:n linkki CR 6313:een (ei CR:n lokissa, mutta pyörä, asiakas, jakso ja aika täsmäävät)
- se, että 14.9. klo 20:15–20:21 muokkaus ei muuttanut summia (rivit täsmäävät; systemnote palautti 0, mikä ei todista mitään)
- CR 6029:n syy
- **CR 6284 ja 6330:** se, ettei 10/2026 laskutettu (kokoomalaskut INVGBF1042980 ja INVGBF1042403 ovat olemassa ilman
  pyörätunnusta)

## 10. Käytetyt SuiteQL-kyselyt

```sql
-- CM:t (Q9)
SELECT t.id, t.tranid, t.entity, t.custbody_sta_bike_id bk, TO_CHAR(t.trandate,'YYYY-MM-DD') td,
       TO_CHAR(t.createddate,'MM-DD HH24:MI') cd, TO_CHAR(t.lastmodifieddate,'MM-DD HH24:MI') lm, t.foreigntotal ft,
       (SELECT SUM(tl.netamount) FROM transactionline tl WHERE tl.transaction = t.id AND tl.mainline='F' AND tl.taxline='F') net
FROM transaction t
WHERE t.type = 'CustCred'
  AND (t.tranid BETWEEN 'CRMGBF0003696' AND 'CRMGBF0003813'
       OR (t.createddate >= TO_DATE('2026-09-14','YYYY-MM-DD')
           AND t.custbody_sta_bike_id IN (SELECT cr.custrecord_cr_bike_registry FROM customrecord_subscrption_change_request cr
                WHERE cr.custrecord_cr_type = 11 AND cr.custrecord_cr_status = 2
                  AND cr.custrecord_cr_closed_date >= TO_DATE('2026-09-14','YYYY-MM-DD')
                  AND cr.custrecord_cr_closed_date <  TO_DATE('2026-09-16','YYYY-MM-DD'))))
ORDER BY t.tranid

-- Muut CM:t samoille asiakkaille 14.9. jälkeen
SELECT t.id, t.tranid, t.entity, t.custbody_sta_bike_id, t.createddate, t.foreigntotal, t.memo, BUILTIN.DF(t.createdby)
FROM transaction t
WHERE t.type = 'CustCred' AND t.createddate >= TO_DATE('2026-09-14','YYYY-MM-DD')
  AND t.tranid NOT BETWEEN 'CRMGBF0003696' AND 'CRMGBF0003813'
  AND t.entity IN (SELECT cr.custrecord_cr_next_billto_customer FROM customrecord_subscrption_change_request cr
                   WHERE cr.custrecord_cr_type = 11 AND cr.custrecord_cr_status = 2
                     AND cr.custrecord_cr_closed_date >= TO_DATE('2026-09-14','YYYY-MM-DD')
                     AND cr.custrecord_cr_closed_date <  TO_DATE('2026-09-16','YYYY-MM-DD'))

-- Käsin tehdyt korjaustransaktiot
SELECT t.id, t.tranid, t.entity, t.custbody_sta_bike_id, t.createddate, t.foreigntotal, t.memo, BUILTIN.DF(t.createdby)
FROM transaction t
WHERE t.type IN ('CustInvc','CustCred','Journal') AND t.createddate >= TO_DATE('2026-09-14','YYYY-MM-DD') AND t.createdby <> -4
  AND (LOWER(t.memo) LIKE '%hyvit%' OR t.memo LIKE '%CR-6%' OR t.memo LIKE '%CRMGBF%'
       OR t.custbody_sta_bike_id IN (<sama CR-alikysely, pyörä>))

-- CM-rivit
SELECT t.tranid, tl.item, tl.rate, tl.netamount, TO_CHAR(tl.custcol_sta_so_revrec_start,'YYYY-MM') m
FROM transaction t JOIN transactionline tl ON tl.transaction = t.id
WHERE t.type = 'CustCred' AND t.tranid IN (...) AND tl.mainline='F' AND tl.taxline='F'

-- Kohdistukset
SELECT BUILTIN.DF(l.nextdoc), BUILTIN.DF(l.previousdoc), l.linktype, l.foreignamount
FROM previoustransactionlinelink l
WHERE l.nextdoc IN (<CM id:t>) OR l.previousdoc IN (<CM id:t>)

-- Summamuutokset (palautti 0 riviä)
SELECT sn.recordid, sn.date, sn.field, sn.oldvalue, sn.newvalue FROM systemnote sn
WHERE sn.recordid IN (<CM id:t>) AND sn.date > TO_DATE('2026-09-14 13:10','YYYY-MM-DD HH24:MI')

-- Lokakuun kokoomalaskut (CR 6284, 6330)
SELECT t.entity, t.tranid, t.custbody_sta_bike_id, COUNT(*)
FROM transaction t JOIN transactionline tl ON tl.transaction = t.id AND tl.mainline='F' AND tl.taxline='F'
WHERE t.type='CustInvc' AND t.entity IN (373, 936)
  AND tl.custcol_sta_so_revrec_start >= TO_DATE('2026-10-01','YYYY-MM-DD') AND tl.custcol_sta_so_revrec_start < TO_DATE('2026-11-01','YYYY-MM-DD')
GROUP BY t.entity, t.tranid, t.custbody_sta_bike_id
```

Rivihinnat ja laskutushistoria: kysely Q7 (sopimusrivit bike + `next_billto`, `INSTR(invoicehistory,'YYYY-MM')`).
Käsittelijän loki: `scriptnote` 1199, 14.9.2026.
