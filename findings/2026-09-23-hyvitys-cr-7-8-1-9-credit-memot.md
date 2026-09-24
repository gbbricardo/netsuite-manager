# Hyvitys-CR:t (tyyppi 11), käsitelty vanhalla koodilla 7.8.–1.9.2026: credit memot

**Ajettu:** 23.09.2026, vain luku. Mitään ei kirjoitettu NetSuiteen.
**Rajaus:** `custrecord_cr_type = 11`, `custrecord_cr_closed_date` 1.8.2026 – 14.9.2026 (Helsinki). Tosiasiallinen väli on
7.8.–1.9.2026, ja 2.–13.9. ei valmistunut yhtään tyypin 11 CR:ää.
- **273 CR:ää:** 264 Done ja 9 Cancelled. Koordinaattorin "273 Done" oli 264 Done + 9 Cancelled.
- Kaikki on käsitelty ennen 16.9.2026 hinnoittelukorjausta (`netsuite-subscrption-cr-scripts/CHANGELOG.md:265-299`).

**Korjauslista:** `findings/2026-09-23-hyvitys-korjauslista-7-8-1-9.csv`. Sama sarakerakenne kuin 14.9. listalla:
puolipiste, UTF-8 BOM, desimaalipilkku, `erotus = oikea − nykyinen`.

## 0. Pääkohdat

| Ryhmä | Kpl | Netto | Brutto |
|---|---|---|---|
| **Done — lisähyvitys, korjaamatta** (CM liian pieni) | **5** | **+144,27 €** | **+181,06 €** |
| Done — ylihyvitys | 0 | 0 | 0 |
| Done — tupla-CM (sama pyörä + asiakas + kuukausi + item) | 0 | – | – |
| Done — CM täsmää laskuttaneen rivin hintaan | 246 | – | – |
| Done — CM oikein, mutta rivihistoria ei tue sitä (CR 4724–4735, CR 5074) | 12 | – | – |
| Done — ei CM:ää (DUPLICATE; käsin tehty CM CRMGBF0003519) | 1 | – | – |
| Cancelled — ei CM:ää (VOIDED) | 4 | – | – |
| Cancelled — CM luotu ja **poistettu** | 5 | – | – |
| **Yhteensä** | **273** | | |

1. **Viisi alihyvitystä, kaikki korjaamatta** (todennettu CM-riveiltä):

   | CR | Pyörä | Asiakas | Vajaus netto | Rivit: CM → laskuttanut rivi |
   |---|---|---|---|---|
   | 5163 | B044906 | Peab Oy | **54,32 €** | vuokra 33,82 → 80,65, admin fee 5,41 → 12,90 |
   | 4584 | B038663 | Hilti (Suomi) Oy | **48,29 €** | vuokra 39,02 → 80,65, admin fee 6,24 → 12,90 |
   | 4451 | B040578 | John Deere Forestry Oy | **33,95 €** | vuokra 50,46 → 79,68, admin fee 8,17 → 12,90 |
   | 6060 | B017548 | North Rail Oy | 3,99 € | vain admin fee 11,95 → 15,94 |
   | 4998 | B038088 | Oy Apotti Ab | 3,72 € | vain admin fee 6,77 → 10,49 |

   - Neljä ensimmäistä ovat OOMI- tai stub-tapauksia (vanha koodi valitsi halvan rivin).
   - CR 6060 ei ole OOMI. Admin fee valittiin rivin 11,95 hinnalla, vaikka laskuttanut rivi on 15,94.
   - Jälkikäteisiä korjaustransaktioita näille pyörille ei ole.
2. **CR 4998 ja 5163: CM:ää on muokattu käsin.** Kummankin CR:n jakso on 08–09/2026, ja käsittelijä varoitti, ettei
   09/2026:ta ole laskutettu. Molempia CR:iä on muokattu 31.8. (15:26 ja 16:07). CM:issä on nyt vain 08/2026-rivit, joten
   syyskuun rivit on poistettu käsin. Elokuun rivit jäivät väärällä hinnalla. *Todennettu (rivit); poiston tekijä ja hetki
   päätelty CR:n `lastmodified`-leimasta.*
3. **CR 4724–4735 (11 kpl, toukokuu 2026):**
   - Sopimusrivit päättyivät 28.2. tai 31.3.2026, eikä toukokuu ole rivien historiassa.
   - Käsittelijä varoitti tästä, ja CR:t ovat silti Done.
   - **Hyvitys on kuitenkin oikein:** jokaiselle pyörälle ja asiakkaalle on laskutettu 05/2026 **kahdesti** (INVGBF10267xx 20.5. ja INVGBF10268xx 21.5.), ja CM kumoaa toisen niistä.
   - *Todennettu laskuriveiltä.*
   - Sivuhavainto `sopimusriviauditoija`lle: näille pyörille on laskutettu myös 04 ja 06/2026, vaikka rivit päättyivät
     2–3/2026.
4. **CR 5074 (B046637, Reaktor Group Oyj):**
   - CM CRMGBF0003429 on 191,24 € netto (08–09/2026), eikä rivihistoriassa ole kumpaakaan kuukautta.
   - Reaktorin kokoomalaskulla INVGBF1038563 (4.8.) on kuitenkin täsmälleen 79,68 + 15,94 € riveinä kuukausille 08 ja 09.
   - Kokoomalaskuilla ei ole pyörätunnusta (`custbody_sta_bike_id` tyhjä, `custcol_sta_bikeid_line` tyhjä).
   - Hyvitys on siis *todennäköisesti oikein* — **päätelty**, ei vientiä korjauslistalle.
   - **Tästä seuraa menetelmärajoitus:** laskuttamattoman kuukauden päättely rivihistoriasta on epäluotettava
     kokoomalaskuilla. Siksi 14.9. listan CR 6284 ja CR 6330 on muutettu tilaan "tarkista ensin kokoomalasku"
     (INVGBF1042980 Wärtsilä, INVGBF1042403 Sweco, molemmissa 10/2026-rivejä ilman pyörätunnusta).
5. **Cancelled 9:**
   - **CR 4780, 4784, 4787 ja 4790:** VOIDED 7.8. (superseded). CM:ää ei luotu.
   - **CR 5242, 5998, 6001, 6012 ja 6035:** CM luotiin (CRMGBF0003577, 3655, 3657, 3668 ja 3679), ja jokaisen lokissa on varoitus laskuttamattomasta syyskuusta.
     - Mikään näistä CM:istä **ei enää löydy** `transaction`-taulusta. Ne on poistettu, ja CR:n muistiinpanot vahvistavat tämän neljällä (esim. "Hyvitys CRMGBF0003577 poistettu").
     - CR 6035:llä ei ole muistiinpanoa, mutta CRMGBF0003679 puuttuu.
     - *Todennettu.* Jälki on siivottu, eikä toimenpidettä tarvita.
6. **CR 5038:** Done-tila ja `DUPLICATE`, eli käsittelijä ei luonut CM:ää. Sanna Kokkonen teki käsin CM:n CRMGBF0003519
   (17.8., 116,21 € brutto, memo "CR-5038"), ja muistiinpanon mukaan aiempi hyvitys CRMGBF0003383 korjattiin laskulla
   INVGBF1039182. Ei toimenpidettä.
7. **Tuplia ei löytynyt.**
   - Haettu CM-rivit samalle pyörälle, asiakkaalle, kuukaudelle ja itemille 1.8. jälkeen: 0 osumaa.
   - CM-numerosarjan CRMGBF0003400–3695 aukot ovat käsin tehtyjä CM:iä (Beeda Viittanen, Sanna Kokkonen) tai poistettuja
     Cancelled-CR:ien CM:iä. Kaatuneita ajoja, joiden jäljiltä olisi orpo CM, ei ole.
   - *Todennettu.*

## 1. Menetelmä

- **CR → CM:**
  - tranid `automation_logs`-kentästä (`SUBSTR(..., INSTR(...,'CRMGBF'), 13)`) liitettynä `transaction.tranid`:iin
  - linkki löytyi 263 Done-CR:lle; lisäksi 5 Cancelled-CR:ää, joiden CM on poistettu, ja 1 DUPLICATE ilman CM:ää
  - käsittelijän loki (`scriptnote` 1199) on samaa muotoa kuin 14.9. eikä tuonut lisätietoa; rajaus oli CR-lokeissa riittävä
- **Rivitason tarkistus:** jokaiselle CM-riville (item, `custcol_sta_so_revrec_start`-kuukausi) haettiin pyörän ja
  `next_billto`-asiakkaan ne rivit, joiden `custrecord_sta_ca_row_invoicehistory` sisältää kuukauden. Riviä verrattiin
  `ROUND(price_month, 2)`:een. Tämä on nykyisen `handler_hyvitys`-koodin sääntö. Poikkeamia tuli 32 CM-riviä 18 CR:ltä:
  5 vajausta, 11 CR 4724–4735 ja CR 5074 (historia puuttuu).
- **Historia-poikkeukset tarkistettiin laskuriveiltä** (CustInvc, sama pyörä, asiakas ja kuukausi) ja kokoomalaskuilta.
- **Korjaukset:** CustInvc/CustCred samoille pyörille CR:n valmistumisen jälkeen, CM-numerosarjan aukot sekä memot, joissa
  "CR-…" tai "hyvit".
- **Tuplat:** `GROUP BY` pyörä, asiakas, kuukausi ja item, `HAVING COUNT(*) > 1`.

## 2. Aikajana

| Valmistunut (Helsinki) | CR:iä |
|---|---|
| 7.8. | 4 (Cancelled) |
| 14.8. | 62 |
| 17.8. | 45 |
| 18.8. | 43 |
| 19.8.–28.8. | 96 |
| 31.8. | 18 |
| 1.9. | 5 |

## 3. Poikkeamat

| CR | Tila | Pyörä | Asiakas | Kausi | CM (id) | CM netto | Odotettu | Erotus (oikea − nyk.) | Tulos |
|---|---|---|---|---|---|---|---|---|---|
| 4451 | Done | B040578 | 104143 John Deere Forestry Oy | 07/2026 | CRMGBF0003667 (703888) | 58,63 | 92,58 | +33,95 | Lisähyvitys |
| 4584 | Done | B038663 | 104015 Hilti (Suomi) Oy | 07/2026 | CRMGBF0003663 (703884) | 45,26 | 93,55 | +48,29 | Lisähyvitys |
| 4998 | Done | B038088 | 104274 Oy Apotti Ab | 08/2026 (CR 08–09) | CRMGBF0003672 (703895) | 86,79 | 90,51 | +3,72 | Lisähyvitys; 09-rivit poistettu käsin |
| 5163 | Done | B044906 | 104281 Peab Oy | 08/2026 (CR 08–09) | CRMGBF0003671 (703893) | 39,23 | 93,55 | +54,32 | Lisähyvitys; 09-rivit poistettu käsin |
| 6060 | Done | B017548 | 4135 North Rail Oy | 09/2026 | CRMGBF0003682 (705545) | 91,63 | 95,62 | +3,99 | Lisähyvitys |
| 4724–4735 (11) | Done | 2546, 4110, 4170, 4878, 10372, 18479, 23257, 23694, 1083, 1042, 1005 | 703, 339, 616, 1921, 3608, 1281, 1876, 4521, 456, 487, 4729 | 05/2026 | CRMGBF0003414–3549 | 92,60 kukin | 92,60 | 0 | OK – kumoaa 05/2026 tuplalaskun |
| 5074 | Done | B046637 | 1122 Reaktor Group Oyj | 08–09/2026 | CRMGBF0003429 (678685) | 191,24 | 191,24 (päätelty) | 0 | OK päätelty – kokoomalasku INVGBF1038563 |
| 5038 | Done | B029923 | 3905 | 08/2026 | – (DUPLICATE) | – | – | – | käsin CRMGBF0003519 |
| 5242, 5998, 6001, 6012, 6035 | Cancelled | 3184, 39531, 44996, 43976, 42228 | 1669, 104140, 104169, 103969, 103945 | 09/2026 | CRMGBF0003577/3655/3657/3668/3679 – **poistettu** | – | – | – | OK – siivottu |
| 4780, 4784, 4787, 4790 | Cancelled | 13495, 17854, 15872, 18427 | 2046, 939, 1209, 526 | 08/2026 | – | – | – | – | VOIDED, uusittu CR:illä 5077/5083/5086/5092 |

## 4. Kaikki 273 CR:ää (tiivis)

Sarakkeet: CR, tila (2 = Done, 7 = Cancelled), pyörä (id), asiakas (id), kausi (VVKK–VVKK), valmistunut (KKPP HHMM,
Helsinki), CM tranid (CRMGBF000…) ja id, CM netto. Tulos on "ok", ellei rivi ole kohdassa 3.

| CR | Tila | Pyörä | Asiakas | Kausi | Valmistunut | CM | CM id | Netto |
|---|---|---|---|---|---|---|---|---|
| 4780 | 7 | 13495 | 2046 | 2608–2608 | 0807 0300 | – | – | – |
| 4784 | 7 | 17854 | 939 | 2608–2608 | 0807 0300 | – | – | – |
| 4787 | 7 | 15872 | 1209 | 2608–2608 | 0807 0300 | – | – | – |
| 4790 | 7 | 18427 | 526 | 2608–2608 | 0807 0300 | – | – | – |
| 4957 | 2 | 21069 | 2988 | 2609–2609 | 0814 0706 | 3410 | 678665 | 92,60 |
| 4969 | 2 | 1741 | 804 | 2608–2609 | 0814 0706 | 3411 | 678666 | 183,26 |
| 5062 | 2 | 2873 | 379 | 2608–2609 | 0814 0706 | 3412 | 678667 | 183,26 |
| 5066 | 2 | 18448 | 478 | 2609–2609 | 0814 0706 | 3413 | 678668 | 92,60 |
| 4727 | 2 | 4878 | 1921 | 2605–2605 | 0814 0706 | 3414 | 678669 | 92,60 |
| 4854 | 2 | 29136 | 3226 | 2609–2609 | 0814 0706 | 3415 | 678670 | 92,60 |
| 4860 | 2 | 17853 | 2396 | 2609–2609 | 0814 0706 | 3416 | 678671 | 92,60 |
| 4986 | 2 | 27682 | 1458 | 2608–2609 | 0814 0706 | 3417 | 678672 | 185,20 |
| 4726 | 2 | 4170 | 616 | 2605–2605 | 0814 0706 | 3418 | 678673 | 92,60 |
| 4984 | 2 | 14481 | 2054 | 2609–2609 | 0814 0706 | 3419 | 678674 | 91,63 |
| 4988 | 2 | 2644 | 3710 | 2609–2609 | 0814 0706 | 3420 | 678675 | 95,62 |
| 5103 | 2 | 15183 | 644 | 2609–2609 | 0814 0706 | 3421 | 678676 | 89,56 |
| 5112 | 2 | 32967 | 3226 | 2609–2609 | 0814 0707 | 3422 | 678677 | 92,60 |
| 4735 | 2 | 1005 | 4729 | 2605–2605 | 0814 0707 | 3423 | 678678 | 92,60 |
| 5110 | 2 | 23020 | 568 | 2609–2609 | 0814 0707 | 3424 | 678679 | 92,60 |
| 4724 | 2 | 2546 | 703 | 2605–2605 | 0814 0707 | 3425 | 678680 | 92,60 |
| 4937 | 2 | 14202 | 2546 | 2603–2609 | 0814 0707 | 3426 | 678681 | 641,41 |
| 4939 | 2 | 18079 | 3627 | 2609–2609 | 0814 0707 | 3427 | 678682 | 90,21 |
| 4941 | 2 | 35648 | 621 | 2608–2609 | 0814 0707 | 3428 | 678683 | 185,20 |
| 5074 | 2 | 46637 | 1122 | 2608–2609 | 0814 0707 | 3429 | 678685 | 191,24 |
| 5077 | 2 | 13495 | 2046 | 2608–2609 | 0814 0707 | 3430 | 678687 | 185,20 |
| 5080 | 2 | 31300 | 939 | 2609–2609 | 0814 0708 | 3431 | 678689 | 92,60 |
| 5083 | 2 | 17854 | 939 | 2608–2609 | 0814 0708 | 3432 | 678691 | 185,20 |
| 4931 | 2 | 15288 | 2380 | 2609–2609 | 0814 0708 | 3433 | 678693 | 91,63 |
| 5057 | 2 | 20327 | 1996 | 2609–2609 | 0814 0708 | 3434 | 678694 | 92,00 |
| 4933 | 2 | 7863 | 559 | 2609–2609 | 0814 0708 | 3435 | 678695 | 92,00 |
| 4947 | 2 | 5702 | 1360 | 2609–2609 | 0814 0708 | 3436 | 678696 | 91,63 |
| 5086 | 2 | 15872 | 1209 | 2608–2609 | 0814 0708 | 3437 | 678697 | 183,26 |
| 5089 | 2 | 855 | 939 | 2609–2609 | 0814 0708 | 3438 | 678699 | 92,60 |
| 5092 | 2 | 18427 | 526 | 2608–2609 | 0814 0708 | 3439 | 678701 | 185,20 |
| 4725 | 2 | 4110 | 339 | 2605–2605 | 0814 0709 | 3440 | 678702 | 92,60 |
| 4894 | 2 | 9126 | 1274 | 2609–2609 | 0814 0709 | 3441 | 678703 | 91,63 |
| 4896 | 2 | 10216 | 3808 | 2609–2609 | 0814 0709 | 3442 | 678704 | 91,63 |
| 4898 | 2 | 34559 | 3625 | 2609–2609 | 0814 0709 | 3443 | 678705 | 90,21 |
| 5017 | 2 | 18878 | 804 | 2607–2607 | 0814 0709 | 3444 | 678706 | 92,60 |
| 5022 | 2 | 20416 | 2635 | 2609–2609 | 0814 0709 | 3445 | 678707 | 92,60 |
| 5024 | 2 | 29244 | 1253 | 2609–2609 | 0814 0709 | 3446 | 678708 | 92,60 |
| 5030 | 2 | 20836 | 2619 | 2609–2609 | 0814 0709 | 3447 | 678709 | 92,00 |
| 5099 | 2 | 35136 | 1062 | 2609–2609 | 0814 0709 | 3448 | 678710 | 92,60 |
| 4981 | 2 | 6540 | 866 | 2608–2609 | 0814 0709 | 3449 | 678711 | 183,26 |
| 5036 | 2 | 21665 | 572 | 2609–2609 | 0814 0709 | 3450 | 678712 | 92,60 |
| 5097 | 2 | 9379 | 3284 | 2608–2609 | 0814 0709 | 3451 | 678713 | 159,36 |
| 5101 | 2 | 34276 | 1910 | 2609–2609 | 0814 0709 | 3452 | 678714 | 92,60 |
| 5106 | 2 | 5029 | 1037 | 2609–2609 | 0814 0709 | 3453 | 678715 | 92,60 |
| 4838 | 2 | 28792 | 899 | 2609–2609 | 0814 0709 | 3454 | 678716 | 80,65 |
| 4842 | 2 | 26707 | 2673 | 2608–2609 | 0814 0710 | 3455 | 678717 | 185,20 |
| 5116 | 2 | 13606 | 1996 | 2609–2609 | 0814 0710 | 3456 | 678718 | 91,03 |
| 5118 | 2 | 13072 | 2054 | 2609–2609 | 0814 0710 | 3457 | 678719 | 91,63 |
| 4882 | 2 | 36127 | 2771 | 2608–2609 | 0814 0710 | 3458 | 678720 | 185,20 |
| 4876 | 2 | 7452 | 1702 | 2607–2609 | 0814 0710 | 3459 | 678721 | 274,89 |
| 4880 | 2 | 37208 | 4847 | 2608–2609 | 0814 0710 | 3460 | 678722 | 191,24 |
| 4900 | 2 | 26685 | 1971 | 2609–2609 | 0814 0710 | 3461 | 678723 | 92,60 |
| 4902 | 2 | 28696 | 2278 | 2609–2609 | 0814 0710 | 3462 | 678724 | 92,60 |
| 4904 | 2 | 21725 | 2635 | 2609–2609 | 0814 0710 | 3463 | 678725 | 92,60 |
| 5047 | 2 | 22933 | 3002 | 2608–2609 | 0814 0710 | 3464 | 678727 | 185,20 |
| 5049 | 2 | 33422 | 2988 | 2609–2609 | 0814 0710 | 3465 | 678728 | 92,60 |
| 4996 | 2 | 13784 | 632 | 2608–2609 | 0814 0711 | 3466 | 678730 | 185,20 |
| 4731 | 2 | 23694 | 4521 | 2605–2605 | 0814 0711 | 3467 | 678731 | 92,60 |
| 4729 | 2 | 18479 | 1281 | 2605–2605 | 0814 0711 | 3468 | 678732 | 92,60 |
| 4916 | 2 | 17458 | 644 | 2609–2609 | 0814 0711 | 3469 | 678733 | 89,56 |
| 5114 | 2 | 13185 | 4699 | 2609–2609 | 0814 0711 | 3470 | 678735 | 91,63 |
| 5045 | 2 | 920 | 778 | 2609–2609 | 0814 0711 | 3471 | 678736 | 79,68 |
| 5139 | 2 | 17206 | 3695 | 2609–2609 | 0817 0703 | 3475 | 681798 | 91,63 |
| 5150 | 2 | 32003 | 2774 | 2609–2609 | 0817 0703 | 3476 | 681799 | 92,60 |
| 5156 | 2 | 17824 | 724 | 2609–2609 | 0817 0703 | 3477 | 681800 | 92,60 |
| 5158 | 2 | 36858 | 4474 | 2608–2609 | 0817 0703 | 3478 | 681801 | 191,24 |
| 5108 | 2 | 27762 | 2218 | 2609–2609 | 0817 0703 | 3479 | 681802 | 92,60 |
| 5130 | 2 | 26279 | 4120 | 2609–2609 | 0817 0703 | 3480 | 681803 | 92,60 |
| 5124 | 2 | 11138 | 507 | 2609–2609 | 0817 0703 | 3481 | 681804 | 92,60 |
| 5004 | 2 | 12823 | 1719 | 2608–2609 | 0817 0703 | 3482 | 681805 | 183,26 |
| 4732 | 2 | 1083 | 456 | 2605–2605 | 0817 0703 | 3483 | 681806 | 92,60 |
| 5126 | 2 | 22566 | 1886 | 2609–2609 | 0817 0703 | 3484 | 681807 | 92,60 |
| 5144 | 2 | 6584 | 703 | 2609–2609 | 0817 0703 | 3485 | 681809 | 92,60 |
| 5152 | 2 | 26108 | 4253 | 2609–2609 | 0817 0704 | 3486 | 681810 | 92,60 |
| 4918 | 2 | 35626 | 1562 | 2608–2609 | 0817 0704 | 3487 | 681812 | 185,20 |
| 4921 | 2 | 5265 | 1562 | 2608–2609 | 0817 0704 | 3488 | 681813 | 185,20 |
| 4924 | 2 | 20454 | 1562 | 2608–2609 | 0817 0704 | 3489 | 681814 | 185,20 |
| 4945 | 2 | 18210 | 361 | 2609–2609 | 0817 0704 | 3490 | 681815 | 92,60 |
| 4959 | 2 | 10609 | 899 | 2609–2609 | 0817 0704 | 3491 | 681816 | 92,60 |
| 4961 | 2 | 27278 | 3767 | 2609–2609 | 0817 0704 | 3492 | 681817 | 92,60 |
| 4967 | 2 | 36901 | 1005 | 2608–2609 | 0817 0704 | 3493 | 681818 | 191,24 |
| 5008 | 2 | 16378 | 936 | 2609–2609 | 0817 0704 | 3494 | 681820 | 92,60 |
| 5015 | 2 | 33119 | 83315 | 2608–2609 | 0817 0704 | 3495 | 681821 | 161,30 |
| 5042 | 2 | 6926 | 4135 | 2608–2609 | 0817 0704 | 3496 | 681822 | 183,26 |
| 5064 | 2 | 35475 | 1933 | 2609–2609 | 0817 0705 | 3497 | 681823 | 92,60 |
| 5006 | 2 | 10474 | 935 | 2608–2609 | 0817 0705 | 3498 | 681825 | 185,20 |
| 5033 | 2 | 32461 | 3131 | 2609–2609 | 0817 0705 | 3499 | 681831 | 92,60 |
| 5055 | 2 | 17762 | 1996 | 2609–2609 | 0817 0707 | 3500 | 681853 | 92,00 |
| 5122 | 2 | 16060 | 355 | 2609–2609 | 0817 0708 | 3501 | 681855 | 91,63 |
| 4846 | 2 | 16040 | 136547 | 2608–2609 | 0817 0708 | 3502 | 681856 | 183,26 |
| 4850 | 2 | 21359 | 627 | 2609–2609 | 0817 0708 | 3503 | 681857 | 92,60 |
| 4840 | 2 | 9569 | 521 | 2609–2609 | 0817 0709 | 3504 | 681868 | 92,60 |
| 4878 | 2 | 11880 | 3889 | 2608–2609 | 0817 0709 | 3505 | 681869 | 183,26 |
| 4884 | 2 | 33290 | 3761 | 2608–2609 | 0817 0709 | 3506 | 681870 | 185,20 |
| 5148 | 2 | 37305 | 131334 | 2609–2609 | 0817 0709 | 3507 | 681871 | 95,62 |
| 5038 | 2 | 29923 | 3905 | 2608–2608 | 0817 0709 | – (DUPLICATE) | – | – |
| 5120 | 2 | 17866 | 4532 | 2609–2609 | 0817 0709 | 3508 | 681873 | 92,60 |
| 4734 | 2 | 1042 | 487 | 2605–2605 | 0817 0709 | 3509 | 681874 | 92,60 |
| 5051 | 2 | 20154 | 3542 | 2609–2609 | 0817 0710 | 3510 | 681887 | 92,60 |
| 4990 | 2 | 25919 | 3021 | 2609–2609 | 0817 0710 | 3511 | 681888 | 92,60 |
| 4994 | 2 | 30467 | 2982 | 2608–2609 | 0817 0710 | 3512 | 681889 | 185,20 |
| 5010 | 2 | 34045 | 2988 | 2608–2609 | 0817 0711 | 3513 | 681890 | 185,20 |
| 5060 | 2 | 36872 | 2975 | 2608–2609 | 0817 0711 | 3514 | 681891 | 191,24 |
| 5068 | 2 | 3512 | 885 | 2609–2609 | 0817 0711 | 3515 | 681892 | 91,63 |
| 5070 | 2 | 24842 | 1905 | 2609–2609 | 0817 0711 | 3516 | 681893 | 92,60 |
| 5072 | 2 | 4548 | 935 | 2609–2609 | 0817 0711 | 3517 | 681894 | 92,60 |
| 4927 | 2 | 11367 | 1562 | 2608–2609 | 0817 0713 | 3518 | 681915 | 183,26 |
| 5174 | 2 | 13967 | 2290 | 2609–2609 | 0818 0702 | 3520 | 683675 | 92,60 |
| 5181 | 2 | 34644 | 3625 | 2609–2609 | 0818 0702 | 3521 | 683677 | 90,21 |
| 5183 | 2 | 6823 | 4844 | 2609–2609 | 0818 0702 | 3522 | 683678 | 91,63 |
| 5185 | 2 | 25236 | 3302 | 2609–2609 | 0818 0702 | 3523 | 683679 | 92,60 |
| 5187 | 2 | 10803 | 339 | 2609–2609 | 0818 0703 | 3524 | 683680 | 91,63 |
| 5169 | 2 | 20514 | 2380 | 2608–2609 | 0818 0703 | 3525 | 683681 | 185,20 |
| 5172 | 2 | 10885 | 1851 | 2609–2609 | 0818 0703 | 3526 | 683682 | 91,63 |
| 5176 | 2 | 24366 | 1360 | 2609–2609 | 0818 0703 | 3527 | 683683 | 92,60 |
| 5128 | 2 | 21093 | 4427 | 2609–2609 | 0818 0703 | 3528 | 683684 | 92,60 |
| 4852 | 2 | 29988 | 1996 | 2607–2609 | 0818 0703 | 3529 | 683685 | 276,00 |
| 4872 | 2 | 11474 | 4863 | 2608–2609 | 0818 0703 | 3530 | 683686 | 183,26 |
| 5189 | 2 | 29266 | 2054 | 2609–2609 | 0818 0703 | 3531 | 683688 | 92,60 |
| 5192 | 2 | 24015 | 2961 | 2609–2609 | 0818 0703 | 3532 | 683689 | 92,60 |
| 5194 | 2 | 35736 | 1062 | 2609–2609 | 0818 0703 | 3533 | 683690 | 92,60 |
| 5197 | 2 | 5503 | 2141 | 2609–2609 | 0818 0703 | 3534 | 683691 | 91,63 |
| 5199 | 2 | 20927 | 1591 | 2609–2609 | 0818 0704 | 3535 | 683692 | 92,60 |
| 4888 | 2 | 34168 | 2713 | 2608–2609 | 0818 0704 | 3536 | 683694 | 185,20 |
| 4892 | 2 | 22681 | 1457 | 2609–2609 | 0818 0704 | 3537 | 683695 | 90,21 |
| 4909 | 2 | 1898 | 640 | 2609–2609 | 0818 0704 | 3538 | 683696 | 91,63 |
| 4728 | 2 | 10372 | 3608 | 2605–2605 | 0818 0704 | 3539 | 683698 | 92,60 |
| 4907 | 2 | 31264 | 599 | 2608–2609 | 0818 0704 | 3540 | 683701 | 185,20 |
| 4911 | 2 | 26724 | 327 | 2609–2609 | 0818 0704 | 3541 | 683702 | 92,60 |
| 4992 | 2 | 23913 | 2390 | 2608–2609 | 0818 0705 | 3542 | 683703 | 185,20 |
| 5000 | 2 | 30564 | 331 | 2608–2609 | 0818 0705 | 3543 | 683704 | 184,00 |
| 5002 | 2 | 4021 | 358 | 2608–2609 | 0818 0705 | 3544 | 683705 | 92,60 |
| 5012 | 2 | 24696 | 1903 | 2608–2609 | 0818 0705 | 3545 | 683706 | 185,20 |
| 4868 | 2 | 23031 | 4296 | 2608–2609 | 0818 0705 | 3546 | 683707 | 185,20 |
| 5141 | 2 | 23695 | 3099 | 2609–2609 | 0818 0705 | 3547 | 683709 | 92,60 |
| 4776 | 2 | 28817 | 598 | 2608–2608 | 0818 0705 | 3548 | 683710 | 92,60 |
| 4730 | 2 | 23257 | 1876 | 2605–2605 | 0818 0705 | 3549 | 683711 | 92,60 |
| 4862 | 2 | 11861 | 600 | 2609–2609 | 0818 0705 | 3550 | 683712 | 91,63 |
| 4953 | 2 | 23415 | 640 | 2609–2609 | 0818 0705 | 3551 | 683713 | 92,60 |
| 4965 | 2 | 33678 | 1484 | 2608–2609 | 0818 0706 | 3552 | 683714 | 185,20 |
| 4848 | 2 | 9500 | 2206 | 2609–2609 | 0818 0706 | 3553 | 683715 | 92,60 |
| 4864 | 2 | 25897 | 2396 | 2609–2609 | 0818 0706 | 3554 | 683716 | 92,60 |
| 4866 | 2 | 12260 | 2635 | 2608–2609 | 0818 0706 | 3555 | 683717 | 183,26 |
| 4870 | 2 | 26898 | 3617 | 2608–2609 | 0818 0706 | 3556 | 683718 | 180,42 |
| 4935 | 2 | 22277 | 1902 | 2609–2609 | 0818 0706 | 3557 | 683719 | 92,60 |
| 4951 | 2 | 37166 | 640 | 2609–2609 | 0818 0706 | 3558 | 683720 | 95,62 |
| 5201 | 2 | 6813 | 1983 | 2608–2609 | 0818 0706 | 3559 | 683721 | 185,20 |
| 5203 | 2 | 14584 | 737 | 2608–2609 | 0818 0706 | 3560 | 683722 | 185,20 |
| 5205 | 2 | 35606 | 71412 | 2608–2609 | 0818 0706 | 3561 | 683723 | 185,20 |
| 5179 | 2 | 12243 | 640 | 2609–2609 | 0818 0706 | 3562 | 683724 | 91,63 |
| 5216 | 2 | 10863 | 1628 | 2609–2609 | 0819 0702 | 3565 | 685605 | 91,63 |
| 5207 | 2 | 12101 | 487 | 2609–2609 | 0819 0702 | 3566 | 685606 | 91,63 |
| 5228 | 2 | 27980 | 4427 | 2609–2609 | 0819 0702 | 3567 | 685607 | 92,60 |
| 5224 | 2 | 35363 | 1588 | 2609–2609 | 0819 0702 | 3568 | 685608 | 92,60 |
| 5226 | 2 | 24295 | 2027 | 2609–2609 | 0819 0702 | 3569 | 685609 | 92,60 |
| 5167 | 2 | 25091 | 487 | 2609–2609 | 0819 0703 | 3570 | 685610 | 92,60 |
| 5209 | 2 | 36717 | 89719 | 2609–2609 | 0819 0703 | 3571 | 685611 | 95,62 |
| 5246 | 2 | 21700 | 2173 | 2609–2609 | 0820 0701 | 3572 | 687433 | 92,60 |
| 5236 | 2 | 19271 | 803 | 2609–2609 | 0820 0702 | 3573 | 687434 | 92,60 |
| 5230 | 2 | 33882 | 2224 | 2609–2609 | 0820 0702 | 3574 | 687435 | 91,81 |
| 5244 | 2 | 23033 | 1915 | 2609–2609 | 0820 0702 | 3575 | 687436 | 92,60 |
| 5234 | 2 | 25110 | 817 | 2609–2609 | 0820 0702 | 3576 | 687437 | 92,60 |
| 5242 | 7 | 3184 | 1669 | 2609–2609 | 0820 0702 | 3577 poistettu | – | – |
| 5232 | 2 | 30585 | 2635 | 2609–2609 | 0820 0702 | 3578 | 687439 | 92,60 |
| 5269 | 2 | 32286 | 1269 | 2609–2609 | 0821 0702 | 3580 | 689282 | 92,60 |
| 5275 | 2 | 16810 | 1910 | 2609–2609 | 0821 0702 | 3581 | 689284 | 91,63 |
| 5278 | 2 | 35251 | 379 | 2609–2609 | 0821 0702 | 3582 | 689285 | 92,60 |
| 5280 | 2 | 4539 | 1360 | 2609–2609 | 0821 0702 | 3583 | 689286 | 91,63 |
| 5262 | 2 | 19737 | 1702 | 2608–2609 | 0821 0702 | 3584 | 689288 | 185,20 |
| 5265 | 2 | 11177 | 1804 | 2609–2609 | 0821 0702 | 3585 | 689289 | 92,60 |
| 5267 | 2 | 20166 | 1176 | 2609–2609 | 0821 0702 | 3586 | 689290 | 92,60 |
| 5252 | 2 | 15664 | 899 | 2609–2609 | 0821 0703 | 3587 | 689291 | 91,63 |
| 5255 | 2 | 19652 | 4113 | 2609–2609 | 0821 0703 | 3588 | 689293 | 92,60 |
| 5260 | 2 | 21904 | 3043 | 2609–2609 | 0821 0703 | 3589 | 689294 | 90,21 |
| 5249 | 2 | 9400 | 6031 | 2607–2609 | 0821 0703 | 3590 | 689295 | 274,89 |
| 5295 | 2 | 7138 | 379 | 2609–2609 | 0824 0702 | 3591 | 692515 | 91,63 |
| 5300 | 2 | 5495 | 2054 | 2609–2609 | 0824 0702 | 3592 | 692516 | 91,63 |
| 5307 | 2 | 14368 | 482 | 2609–2609 | 0824 0702 | 3593 | 692517 | 91,63 |
| 5283 | 2 | 33697 | 3618 | 2609–2609 | 0824 0702 | 3594 | 692518 | 90,21 |
| 5286 | 2 | 28518 | 329 | 2609–2609 | 0824 0702 | 3595 | 692519 | 92,60 |
| 5291 | 2 | 33028 | 1270 | 2609–2609 | 0824 0702 | 3596 | 692520 | 92,60 |
| 5293 | 2 | 6304 | 1427 | 2609–2609 | 0824 0702 | 3597 | 692521 | 92,60 |
| 5302 | 2 | 26003 | 2823 | 2609–2609 | 0824 0702 | 3598 | 692522 | 92,60 |
| 5304 | 2 | 32747 | 3559 | 2609–2609 | 0824 0702 | 3599 | 692523 | 92,60 |
| 5313 | 2 | 12035 | 1582 | 2609–2609 | 0825 0702 | 3600 | 694195 | 92,60 |
| 5316 | 2 | 1969 | 737 | 2609–2609 | 0825 0702 | 3601 | 694196 | 91,63 |
| 5323 | 2 | 15933 | 4450 | 2609–2609 | 0825 0702 | 3602 | 694197 | 91,63 |
| 5325 | 2 | 34489 | 1591 | 2609–2609 | 0825 0702 | 3603 | 694198 | 92,60 |
| 5327 | 2 | 13782 | 1785 | 2609–2609 | 0825 0702 | 3604 | 694199 | 91,63 |
| 5329 | 2 | 27456 | 355 | 2609–2609 | 0825 0702 | 3605 | 694200 | 92,60 |
| 5332 | 2 | 26128 | 501 | 2609–2609 | 0825 0702 | 3606 | 694201 | 92,60 |
| 5334 | 2 | 2000 | 501 | 2609–2609 | 0825 0702 | 3607 | 694202 | 91,63 |
| 5321 | 2 | 29144 | 606 | 2607–2609 | 0825 0702 | 3608 | 694203 | 277,80 |
| 5309 | 2 | 10869 | 4873 | 2609–2609 | 0825 0703 | 3609 | 694205 | 91,63 |
| 5363 | 2 | 16501 | 1702 | 2609–2609 | 0826 0702 | 3610 | 695952 | 91,63 |
| 5366 | 2 | 14425 | 1996 | 2609–2609 | 0826 0703 | 3611 | 695954 | 92,00 |
| 5369 | 2 | 7273 | 592 | 2609–2609 | 0826 0703 | 3612 | 695956 | 91,63 |
| 5373 | 2 | 15960 | 1702 | 2609–2609 | 0826 0703 | 3613 | 695958 | 91,63 |
| 5376 | 2 | 14074 | 3569 | 2609–2609 | 0826 0703 | 3614 | 695960 | 91,63 |
| 5379 | 2 | 19779 | 2619 | 2609–2609 | 0826 0703 | 3615 | 695962 | 92,00 |
| 5382 | 2 | 5833 | 1702 | 2609–2609 | 0826 0703 | 3616 | 695964 | 91,63 |
| 5393 | 2 | 16663 | 644 | 2609–2609 | 0826 0703 | 3617 | 695965 | 89,56 |
| 5397 | 2 | 18815 | 866 | 2609–2609 | 0826 0704 | 3618 | 695966 | 80,65 |
| 5401 | 2 | 24448 | 3184 | 2608–2609 | 0826 0704 | 3619 | 695967 | 185,20 |
| 5408 | 2 | 18082 | 2380 | 2609–2609 | 0826 0704 | 3620 | 695968 | 92,60 |
| 5395 | 2 | 12501 | 3332 | 2609–2609 | 0826 0704 | 3621 | 695969 | 91,63 |
| 5406 | 2 | 23943 | 4087 | 2609–2609 | 0826 0704 | 3622 | 695970 | 92,60 |
| 5390 | 2 | 25792 | 815 | 2609–2609 | 0826 0704 | 3623 | 695971 | 92,60 |
| 5399 | 2 | 13304 | 4427 | 2609–2609 | 0826 0704 | 3624 | 695972 | 92,60 |
| 5485 | 2 | 34927 | 1857 | 2608–2609 | 0827 0703 | 3625 | 697973 | 185,20 |
| 5488 | 2 | 5871 | 804 | 2609–2609 | 0827 0703 | 3626 | 697974 | 79,68 |
| 5491 | 2 | 11534 | 2054 | 2609–2609 | 0827 0703 | 3627 | 697976 | 91,63 |
| 5494 | 2 | 18851 | 3805 | 2609–2609 | 0827 0703 | 3628 | 697977 | 92,60 |
| 5497 | 2 | 32526 | 2635 | 2609–2609 | 0827 0703 | 3629 | 697978 | 92,60 |
| 5472 | 2 | 33416 | 1447 | 2609–2609 | 0827 0704 | 3630 | 697980 | 92,60 |
| 5478 | 2 | 27223 | 1181 | 2609–2609 | 0827 0704 | 3631 | 697981 | 92,60 |
| 5470 | 2 | 12023 | 804 | 2609–2609 | 0827 0704 | 3632 | 697982 | 79,68 |
| 5412 | 2 | 27368 | 936 | 2609–2609 | 0827 0704 | 3633 | 697984 | 92,60 |
| 5415 | 2 | 13267 | 936 | 2609–2609 | 0827 0704 | 3634 | 697986 | 92,60 |
| 5418 | 2 | 6544 | 936 | 2609–2609 | 0827 0704 | 3635 | 697988 | 92,60 |
| 5421 | 2 | 5855 | 936 | 2609–2609 | 0827 0704 | 3636 | 697990 | 92,60 |
| 5424 | 2 | 18137 | 936 | 2609–2609 | 0827 0705 | 3637 | 697992 | 92,60 |
| 5427 | 2 | 21208 | 936 | 2609–2609 | 0827 0705 | 3638 | 697994 | 92,60 |
| 5430 | 2 | 30264 | 936 | 2609–2609 | 0827 0705 | 3639 | 697996 | 92,60 |
| 5433 | 2 | 36911 | 936 | 2609–2609 | 0827 0705 | 3640 | 697998 | 95,62 |
| 5436 | 2 | 31572 | 936 | 2609–2609 | 0827 0705 | 3641 | 698000 | 92,60 |
| 5439 | 2 | 25021 | 2871 | 2609–2609 | 0827 0705 | 3642 | 698002 | 92,60 |
| 5442 | 2 | 5145 | 936 | 2609–2609 | 0827 0705 | 3643 | 698004 | 92,60 |
| 5445 | 2 | 16865 | 936 | 2609–2609 | 0827 0706 | 3644 | 698006 | 91,63 |
| 5448 | 2 | 31854 | 936 | 2609–2609 | 0827 0706 | 3645 | 698008 | 92,60 |
| 5451 | 2 | 5844 | 936 | 2609–2609 | 0827 0706 | 3646 | 698011 | 92,60 |
| 5454 | 2 | 34456 | 936 | 2609–2609 | 0827 0706 | 3647 | 698012 | 92,60 |
| 5457 | 2 | 28294 | 936 | 2609–2609 | 0827 0706 | 3648 | 698014 | 92,60 |
| 5460 | 2 | 5296 | 936 | 2609–2609 | 0827 0706 | 3649 | 698016 | 92,60 |
| 5463 | 2 | 33485 | 936 | 2609–2609 | 0827 0706 | 3650 | 698018 | 92,60 |
| 5466 | 2 | 7243 | 2024 | 2608–2609 | 0827 0707 | 3651 | 698019 | 185,20 |
| 5992 | 2 | 32028 | 525 | 2606–2609 | 0828 0704 | 3652 | 699850 | 370,40 |
| 5995 | 2 | 36758 | 435 | 2607–2609 | 0828 0704 | 3653 | 699851 | 274,89 |
| 5503 | 2 | 9681 | 1554 | 2609–2609 | 0828 0704 | 3654 | 699853 | 92,60 |
| 5998 | 7 | 39531 | 104140 | 2609–2609 | 0828 0704 | 3655 poistettu | – | – |
| 5499 | 2 | 8537 | 2619 | 2609–2609 | 0828 0704 | 3656 | 699856 | 91,03 |
| 6001 | 7 | 44996 | 104169 | 2609–2609 | 0828 0704 | 3657 poistettu | – | – |
| 6005 | 2 | 1185 | 640 | 2609–2609 | 0828 0704 | 3658 | 699858 | 91,63 |
| 5501 | 2 | 16224 | 1018 | 2609–2609 | 0828 0704 | 3659 | 699859 | 91,63 |
| 5505 | 2 | 27784 | 3045 | 2609–2609 | 0828 0705 | 3660 | 699860 | 90,21 |
| 5508 | 2 | 33242 | 3045 | 2609–2609 | 0828 0705 | 3661 | 699861 | 90,21 |
| 6010 | 2 | 21875 | 1374 | 2609–2609 | 0831 0702 | 3662 | 703883 | 92,60 |
| 4584 | 2 | 38663 | 104015 | 2607–2607 | 0831 0702 | 3663 | 703884 | 45,26 |
| 5318 | 2 | 43354 | 104353 | 2608–2609 | 0831 0702 | 3664 | 703885 | 89,80 |
| 6015 | 2 | 5545 | 640 | 2609–2609 | 0831 0702 | 3665 | 703886 | 91,63 |
| 6022 | 2 | 20414 | 501 | 2609–2609 | 0831 0703 | 3666 | 703887 | 92,60 |
| 4451 | 2 | 40578 | 104143 | 2607–2607 | 0831 0703 | 3667 | 703888 | 58,63 |
| 6012 | 7 | 43976 | 103969 | 2609–2609 | 0831 0703 | 3668 poistettu | – | – |
| 6018 | 2 | 12974 | 507 | 2609–2609 | 0831 0703 | 3669 | 703891 | 92,60 |
| 6020 | 2 | 35535 | 1688 | 2609–2609 | 0831 0703 | 3670 | 703892 | 92,60 |
| 5163 | 2 | 44906 | 104281 | 2608–2609 | 0831 0703 | 3671 | 703893 | 39,23 |
| 4998 | 2 | 38088 | 104274 | 2608–2609 | 0831 0703 | 3672 | 703895 | 86,79 |
| 6047 | 2 | 3177 | 4301 | 2609–2609 | 0831 1429 | 3673 | 704930 | 91,63 |
| 6026 | 2 | 10368 | 2252 | 2608–2609 | 0831 1429 | 3674 | 704935 | 183,26 |
| 6037 | 2 | 13794 | 2810 | 2606–2609 | 0831 1429 | 3675 | 704937 | 366,52 |
| 6040 | 2 | 5664 | 3238 | 2604–2609 | 0831 1430 | 3676 | 704938 | 549,78 |
| 6043 | 2 | 26475 | 892 | 2607–2609 | 0831 1430 | 3677 | 704939 | 277,80 |
| 6032 | 2 | 26614 | 1061 | 2609–2609 | 0831 1430 | 3678 | 704940 | 92,60 |
| 6035 | 7 | 42228 | 103945 | 2609–2609 | 0831 1430 | 3679 poistettu | – | – |
| 6051 | 2 | 28198 | 644 | 2609–2609 | 0901 0038 | 3680 | 705543 | 90,53 |
| 6062 | 2 | 28659 | 848 | 2609–2609 | 0901 0038 | 3681 | 705544 | 92,60 |
| 6060 | 2 | 17548 | 4135 | 2609–2609 | 0901 0038 | 3682 | 705545 | 91,63 |
| 6064 | 2 | 15723 | 1214 | 2609–2609 | 0901 0038 | 3683 | 705546 | 91,63 |
| 6066 | 2 | 26005 | 678 | 2609–2609 | 0901 0038 | 3684 | 705547 | 92,60 |

## 5. Korjausehdotukset (vain CR-tietue)

Kaikki ovat Done- tai Cancelled-tilassa. CR-kenttien muutos ei muuta syntyneitä CM:iä, joten muutoksia ei ehdoteta.

**Uusia CR:iä ei ehdoteta.** Tyypin 11 duplikaattitarkistus pysäyttäisi ne, ja läpi mennessään ne hyvittäisivät koko
kuukauden. Lisähyvitykset tehdään käsin korjauslistan mukaan. **Vaatii talouden päätöksen.**

## 6. Vaikutus muualla

- **Talous:** 5 lisä-CM:ää, yhteensä 144,27 € netto / 181,06 € brutto.
- **`sopimusriviauditoija`:**
  - CR 4724–4735: pyörille on laskutettu 04–06/2026, vaikka sopimusrivit päättyivät 2–3/2026, ja 05/2026 kahdesti. Rivien laskutushistoriasta puuttuvat nämä kuukaudet.
  - CR 5074: rivihistoriasta puuttuu 08–09/2026, vaikka kokoomalasku INVGBF1038563 näyttää laskuttaneen ne.
- **Menetelmärajoitus, koskee myös 14.9. listaa:** kokoomalaskuilla ei ole rivikohtaista pyörätunnusta
  (`custcol_sta_bikeid_line` tyhjä). Siksi "kuukautta ei laskutettu" voidaan todentaa vain rivihistoriasta, joka ei aina ole
  täydellinen. 14.9. CR 6284 ja 6330 on siksi merkitty päätellyiksi ja vaativat kokoomalaskun tarkistuksen.

## 7. Todennettu vs. päätelty

**Todennettu:**
- 273 CR:ää ja niiden tilat
- CR → CM -linkki ja CM-summat
- CM-rivien hinnat vs. laskuttaneen rivin hinta (5 vajausta)
- tuplalaskut 05/2026 (CR 4724–4735)
- poistetut CM:t (5 Cancelled)
- käsin tehty CRMGBF0003519
- tuplien puuttuminen
- korjaustransaktioiden puuttuminen viidelle vajaukselle

**Päätelty:**
- CR 5074:n hyvityksen oikeellisuus (kokoomalasku ilman pyörätunnusta)
- CR 4998:n ja 5163:n syyskuun rivien poisto käsin ja sen ajankohta (CR:n `lastmodified`)
- oikea summa CR 4998:lla ja 5163:lla koskee vain CM:ssä nyt olevaa elokuuta

## 8. Käytetyt SuiteQL-kyselyt

```sql
-- Profiili
SELECT cr.custrecord_cr_status, CASE WHEN INSTR(cr.custrecord_cr_automation_logs,'Credit Memo CRMGBF') > 0 THEN 'cm_in_log' ELSE 'no_cm_in_log' END,
       CASE WHEN INSTR(cr.custrecord_cr_automation_logs,'WARNING') > 0 THEN 'warn' ELSE '-' END,
       CASE WHEN INSTR(cr.custrecord_cr_automation_logs,'DUPLICATE') > 0 THEN 'dup' ELSE '-' END, COUNT(*)
FROM customrecord_subscrption_change_request cr
WHERE cr.custrecord_cr_type = 11 AND cr.custrecord_cr_closed_date >= TO_DATE('2026-08-01','YYYY-MM-DD')
  AND cr.custrecord_cr_closed_date < TO_DATE('2026-09-14','YYYY-MM-DD')
GROUP BY <samat CASE-lausekkeet>

-- CR -> CM ja CM netto
SELECT cr.id, cr.custrecord_cr_status, cr.custrecord_cr_bike_registry, cr.custrecord_cr_next_billto_customer, ..., t.id, t.tranid,
       (SELECT SUM(tl.netamount) FROM transactionline tl WHERE tl.transaction = t.id AND tl.mainline='F' AND tl.taxline='F')
FROM customrecord_subscrption_change_request cr
LEFT JOIN transaction t ON t.tranid = SUBSTR(cr.custrecord_cr_automation_logs, INSTR(cr.custrecord_cr_automation_logs,'CRMGBF'), 13) AND t.type = 'CustCred'
WHERE cr.custrecord_cr_type = 11 AND cr.custrecord_cr_closed_date >= TO_DATE('2026-08-01','YYYY-MM-DD')
  AND cr.custrecord_cr_closed_date < TO_DATE('2026-09-14','YYYY-MM-DD')

-- Rivitason poikkeamat (CM-rivi vs. laskuttaneen sopimusrivin hinta)
SELECT * FROM (
  SELECT cr.id crid, t.tranid, tl.item it, TO_CHAR(tl.custcol_sta_so_revrec_start,'YYYY-MM') m, tl.netamount na,
    (SELECT COUNT(*) FROM customrecord_sta_ca_agreement_row r JOIN customrecord_sta_customer_agreement ca ON ca.id = r.custrecord_sta_ca_parent_agreement
      WHERE r.custrecord_sta_bikeid = cr.custrecord_cr_bike_registry AND ca.custrecord_sta_ca_customer = cr.custrecord_cr_next_billto_customer
        AND r.custrecord_sta_ca_row_item = tl.item
        AND INSTR(r.custrecord_sta_ca_row_invoicehistory, TO_CHAR(tl.custcol_sta_so_revrec_start,'YYYY-MM')) > 0) nb,
    (SELECT MIN(ROUND(r.custrecord_sta_ca_row_price_month,2)) ... sama ehto) pmin,
    (SELECT MAX(ROUND(r.custrecord_sta_ca_row_price_month,2)) ... sama ehto) pmax
  FROM customrecord_subscrption_change_request cr
  JOIN transaction t ON t.tranid = SUBSTR(cr.custrecord_cr_automation_logs, INSTR(cr.custrecord_cr_automation_logs,'CRMGBF'), 13) AND t.type = 'CustCred'
  JOIN transactionline tl ON tl.transaction = t.id AND tl.mainline = 'F' AND tl.taxline = 'F'
  WHERE cr.custrecord_cr_type = 11 AND cr.custrecord_cr_closed_date >= TO_DATE('2026-08-01','YYYY-MM-DD')
    AND cr.custrecord_cr_closed_date < TO_DATE('2026-09-14','YYYY-MM-DD')) x
WHERE x.nb <> 1 OR x.pmin <> x.pmax OR ABS(x.na - x.pmin) > 0.005

-- Tuplat
SELECT t.custbody_sta_bike_id, t.entity, TO_CHAR(tl.custcol_sta_so_revrec_start,'YYYY-MM'), tl.item, COUNT(*), LISTAGG(t.tranid, ',') WITHIN GROUP (ORDER BY t.tranid)
FROM transaction t JOIN transactionline tl ON tl.transaction = t.id AND tl.mainline='F' AND tl.taxline='F'
WHERE t.type = 'CustCred' AND t.createddate >= TO_DATE('2026-08-01','YYYY-MM-DD') AND t.custbody_sta_bike_id IN (<CR-pyörät>)
GROUP BY t.custbody_sta_bike_id, t.entity, TO_CHAR(tl.custcol_sta_so_revrec_start,'YYYY-MM'), tl.item HAVING COUNT(*) > 1

-- Numerosarjan orvot CM:t
SELECT t.id, t.tranid, t.entity, t.custbody_sta_bike_id, t.createddate, t.foreigntotal, t.memo, BUILTIN.DF(t.createdby)
FROM transaction t WHERE t.type = 'CustCred' AND t.tranid BETWEEN 'CRMGBF0003400' AND 'CRMGBF0003695'
  AND t.id NOT IN (<CR-lokeista linkitetyt CM:t>)

-- Historia-poikkeusten laskutarkistus
SELECT cr.id, t.tranid, t.type, t.entity, TO_CHAR(tl.custcol_sta_so_revrec_start,'YYYY-MM'), tl.item, tl.netamount
FROM customrecord_subscrption_change_request cr
JOIN transaction t ON t.custbody_sta_bike_id = cr.custrecord_cr_bike_registry AND t.type IN ('CustInvc','CustCred')
JOIN transactionline tl ON tl.transaction = t.id AND tl.mainline='F' AND tl.taxline='F'
WHERE cr.id IN (4724, …, 5074) AND tl.custcol_sta_so_revrec_start BETWEEN 2026-04 AND 2026-09
-- + kokoomalaskut: CustInvc entity = 1122 / 373 / 936, revrec-kuukausi, custbody_sta_bike_id IS NULL

-- Jälkikorjaukset vajauksille
SELECT cr.id, t.tranid, t.type, t.entity, t.createddate, t.foreigntotal, t.memo, BUILTIN.DF(t.createdby)
FROM customrecord_subscrption_change_request cr
JOIN transaction t ON t.custbody_sta_bike_id = cr.custrecord_cr_bike_registry AND t.type IN ('CustInvc','CustCred')
 AND t.createddate > cr.custrecord_cr_closed_date
WHERE cr.id IN (4451, 4584, 4998, 5163, 6060, 5074)
```
