# Sopimusrivit vs. Hyvitys-CR:t — kolmen tapausryhmän ristiriidat (23.09.2026)

**Rajaus:** vain luku. Mukana kolme tapausryhmää, jotka löytyivät Hyvitys-CR:ien (tyyppi 11) credit memo -auditoinneissa
(`2026-09-23-hyvitys-cr-7-8-1-9-credit-memot.md`, `2026-09-23-hyvitys-cr-14-15-9-credit-memot.md`):

1. CR 4724–4735: 12 pyörää
2. CR 5074 (B046637, Reaktor), ja siihen liittyen CR 6284 (B007914, Wärtsilä) ja CR 6330 (B018137, Sweco)
3. CR 6029 (B044666, Kouvolan kaupunki)

**Ajoitus:** kaikkien kyseessä olevien emosopimusten `date_next_invoice` on 2026-11-01 ja `invoice_advance` 32. Marraskuun
ajo tehdään noin 30.9.2026, eli se on **vielä edessä**. Lokakuun ajo tehtiin 1.–3.9.2026. Mikään alla olevista havainnoista
ei vaadi rivikorjausta ennen marraskuun ajoa.

**Hinnat:** `custrecord_sta_ca_row_price_month` on netto (ALV 0). Brutto = netto × 1,255. Laskujen `foreigntotal` on
brutto: 92,60 € netto vastaa 116,21 € bruttoa.

---

## 0. Tärkein menetelmähavainto: moottorin laskuilla ei ole koskaan pyörätunnusta

*Todennettu 23.9.:*

- **09/2026:** kaikilla 22 918 moottorin laskurivillä `custcol_sta_bikeid_line` on tyhjä, ja myös `custbody_sta_bike_id`
  on tyhjä. Myyntitilausriveillä (22 916) `custcol_sta_bikeid_line` on aina täytetty.
  - Moottori kirjoittaa kentän myyntitilaukselle (`invoice.functions.js:448`). Kenttä ei siirry, kun myyntitilauksesta
    muunnetaan lasku.
  - `custcol_sta_ca_product_id`, eli sopimusrivin sisäinen id, **siirtyy** laskulle.
- **Seuraus:** "kokoomalasku ilman pyörätunnusta" ei ole Reaktorin, Wärtsilän tai Swecon erikoisuus. Kaikki
  laskutusmoottorin laskut ovat tällaisia.
  - Pyörän voi laskulta tunnistaa vain `custcol_sta_ca_product_id` → sopimusrivi → `custrecord_sta_bikeid`, tai
    myyntitilauksen riviltä.
  - Pyöräkohtainen `custbody_sta_bike_id` on vain CR-käsittelijöiden laskuilla ja hyvityksillä (tyypit 7 ja 11) sekä
    käsin tehdyillä laskuilla.
- **Ryhmittely heikentää jäljitettävyyttä entisestään.** 10/2026 laskutetuista 66 316 yksiköstä 46 802 on ryhmitellyillä
  riveillä (8 741 laskuriviä, 2 077 laskua). Ryhmittely tehdään kustannuspaikan tai summausvalintojen mukaan
  (`createGroupingKey`, `invoice.functions.js:62–130`).
  - Ryhmitellyllä rivillä `custcol_sta_ca_product_id` osoittaa vain ryhmän **ensimmäiseen** sopimusriviin.
  - Muiden ryhmän pyörien laskutuksen voi todentaa vain määrätasolla: sopimusrivien historian kuukausi vs.
    laskurivien `quantity`. Tätä on käytetty alla.

---

## 1. Yhteenveto

| # | Tapaus | Löydös | Rivejä / pyöriä | Vakavuus | Euro (netto / brutto) | Tila | Ajo |
|---|---|---|---|---|---|---|---|
| 1a | CR 4724–4735 | 05/2026 on laskutettu kahdesti tyypin 7 tuplatuilla CR:illä. Kaikki 12 on hyvitetty: 11 CR:n CM:llä ja B000928 käsin (CRMGBF0002851) | 12 pyörää | – | 0 / 0 | todennettu | – |
| 1b | CR 4724–4735 | 04–06/2026 (1042/4170 myös 03) ovat **pidennysjälkiveloituksia** (tyyppi 7, `handler_jalki`), eivät laskutusmoottorin laskuja. Rivit ovat oikein päättyneet | 32 pyöräkuukautta | havainto | 2 963,20 / 3 718,72 | peruste päätelty | ei vaikutusta |
| 1c | B001042, B004170 | Lunastus-SO (item 46) on tehty 29.1.2026, silti työnantajaa on veloitettu pidennys 03, 04 ja 05 | 6 kk | vaatii päätöksen | 555,60 / 697,26 | päätelty | – |
| 1d | **B004434 A-Katsastus** (sama tuplailmiö, ei CR-listalla) | **04/2026 on laskutettu kahdesti** (INVGBF1022483 ja INVGBF1022484), eikä hyvitystä ole | 1 pyörä | **korjattava (talous)** | **92,60 / 116,21** | todennettu | – |
| 2a | CR 5074 | INVGBF1038563 laskutti B046637:n (rivit 80192/80193) 08 ja 09 → CM on **oikein** | 2 riviä | – | 0 | **todennettu** (ennen päätelty) | – |
| 2b | Moottori | Catch-up-kuukautta ei koskaan tallenneta rivin historiaan | ≈1 486 riviä, 353 asiakasta (01–09/2026) | havainto (skriptivika) | – | todennettu | – |
| 2c | Moottori | Nykyisen kauden historia puuttuu kokonaisilta laskuilta (historia-MR ei ajanut) | 1 232 laskuriviä kolmelta asiakkaalta + 136 hajarivia | havainto | – | todennettu (syy päätelty) | – |
| 2d | **CR 6284** B007914 Wärtsilä | 10/2026 **ei ole** INVGBF1042980:lla eikä millään muulla laskulla → CM CRMGBF0003724 on **ylihyvitys** | 2 riviä | **korjattava (talous)** | **92,60 / 116,21** | todennettu | lokakuun ajo tehty |
| 2e | **CR 6330** B018137 Sweco | 10/2026 **ei ole** INVGBF1042403:lla. Lokakuu laskutettiin uudelle asiakkaalle 155299 (INVGBF1042944) → Swecon CM CRMGBF0003770 on **ylihyvitys** | 2 riviä | **korjattava (talous)** | **92,60 / 116,21** | todennettu | lokakuun ajo tehty |
| 3 | CR 6029 B044666 Kouvola | Syyskuuta **ei laskutettu** Kouvolalta. Memo on oikein, rivin 109632/109633 historia väärin. Käsinlasku INVGBF1043396 paikkaa todellisen ylihyvityksen, eikä se ole tuplalasku | 2 riviä | havainto (historia) | 0 (korjattu) | vahvasti tuettu päätelmä | – |

**Tunnetut poikkeamaluokat, ei virheitä:**

- 24 OOMI-tuonnin riviä (RENT_/FEE_) 12 pyörällä. Ne ovat oikein suljettuja historiarivejä (status 2, `isinactive = T`).
- B046637:n Reaktor-rivit 80192/80193, 08–09: konsernisiirron (13 → 7/11/9) siirtymäkuukaudet.
- B044666:n tynkäpari 109634/109635 (12/2029).

**Rivikorjauksia ei ehdoteta** (osio 3). Kaikki löydetyt virheet ovat rahassa, laskutushistoriassa tai skriptissä, eivät
rivin kaudessa tai emosopimuksessa.

---

## 2. Löydökset

### 2.1 CR 4724–4735: huhti–kesäkuu laskutettu rivien päättymisen jälkeen

**Rivit (todennettu).** Jokaisella pyörällä on täsmälleen yksi pari: OOMI-tuonti, `externalid` RENT_/FEE_ + sopimusnumero,
luotu 2025-11-01, hinta 80,6454 + 11,9522 = 92,60 € netto. Kaikki ovat status 2 ja `isinactive = T`.

| Pyörä | CR | Asiakas | Rivit (30 / 31) | Emosopimus | Kausi | Rivihistoria |
|---|---|---|---|---|---|---|
| B000928 | 4733 | 621 Delete Finland | 52981 / 18276 | 126 | 2025-12-01 → 2026-03-31 | 12–03 |
| B001005 | 4735 | 4729 Woikoski | 50002 / 15297 | 4107 | → 2026-03-31 | 12–03 |
| B001042 | 4734 | 487 Stora Enso | 55509 / 20804 | 306 | → **2026-02-28** | 12–02 |
| B001083 | 4732 | 456 Valio | 54052 / 19347 | 197 | → 2026-03-31 | 12–03 |
| B002546 | 4724 | 703 Eltel Networks Pohjoinen | 54481 / 19776 | 257 | → 2026-03-31 | 12–03 |
| B004110 | 4725 | 339 AGCO Power | 56171 / 21466 | 21 | → 2026-03-31 | 12–03 |
| B004170 | 4726 | 616 Atria-Chick | 62496 / 27791 | 895 | → **2026-02-28** | 12–02 |
| B004878 | 4727 | 1921 Matti Luokkala | 67804 / 33099 | 1472 | → 2026-03-31 | 12–03 |
| B010372 | 4728 | 3608 Vincit | 44924 / 10219 | 2911 | → 2026-03-31 | 12–03 |
| B018479 | 4729 | 1281 A-Logistiikka | 62361 / 27656 | 888 | → 2026-03-31 | 12–03 |
| B023257 | 4730 | 1876 Mhy Länsi-Suomi | 67672 / 32967 | 1463 | → 2026-03-31 | 12–03 |
| B023694 | 4731 | 4521 Malmberg Keskukset | 49429 / 14724 | 3838 | → 2026-03-31 | 12–03 |

Historia on täydellinen ja vastaa rivien kautta. Moottori laskutti rivit täsmälleen niiden kaudelta. Tämä on todennettu
laskuriveistä `custcol_sta_ca_product_id`:n kautta niiltä pyöriltä, joilla laskurivit ovat yksittäisiä (B002546,
B023694: 02 ja 03/2026). Muilla pyörillä moottorin laskurivit ovat ryhmiteltyjä, joten todiste on historia.

**Mistä huhti–kesäkuun laskut tulivat (todennettu).** Laskutusmoottori ei laskuttanut niitä. Jokainen lasku on
pyöräkohtainen (`custbody_sta_bike_id` täytetty, `createdby = −4`). Jokaista vastaa Done-tilainen tyypin 7 CR
*"S… - pidennys - jälkiveloitus"*, jonka on luonut `netsuite-subscription-extension` (omistaja 109, Staria Integration user)
ja jonka `handler_jalki` on käsitellyt:

| Kuukausi | CR:t | Laskut | Pyöriä |
|---|---|---|---|
| 03/2026 | 1393 (B001042), 1403 (B004170) | INVGBF1018867, INVGBF1018871 (11.3.) | 2 |
| 04/2026 | 2101–2139 | INVGBF10224xx–10225xx (9.–10.4.) | 12 |
| 05/2026, 1. kerta | **3035–3048, omistaja 149 (Taru Vikman)**, luotu ja suljettu 20.5. | INVGBF1026782–1026797 (20.5.) | 12 |
| 05/2026, 2. kerta | **3093–3106, omistaja 109 (integraatio)**, luotu 20.5., suljettu 21.5. | INVGBF1026802–1026823 (21.5.) | 12 |
| 06/2026 | 3662, 3665, 3674, 3679, 3680, 3686 | INVGBF1031116–1031140 (12.6.) | 6: B001005, B001083, B002546, B004110, B004878, B023694 |

- **Toukokuun tupla** syntyi siitä, että samana päivänä ajettiin kaksi pidennysajoa: toinen käsin (omistaja 149) ja
  toinen ajastettuna.
  - Kaikki 12 toista laskua on hyvitetty: 11 CR 4724–4735:n CM:llä (CRMGBF0003414–3549) ja B000928 käsin CRMGBF0002851:llä
    17.6., memo "Tuplalaskun hyvitys".
  - CR 4733 on Done ilman `closed_date`:a eikä luonut omaa CM:ää. Tupla-CM:ää ei siis ole.
  - **Toukokuulta ei ole mitään hyvittämättä.**
- **Rivihistoriasta puuttuvat 04–06 oikeutetusti.** `handler_jalki` ei koske sopimusriveihin (tyyppi 7 lukee vain hintaa).
  Historia ei siis ole vajaa, vaan se kertoo moottorin laskutuksesta, ja moottori lopetti oikein.

**Ovatko huhti- ja kesäkuu aiheettomia?**

- *Todennettu:* laskutus loppui täsmälleen sen kuun loppuun, jota ennen pyörä siirtyi pois Active-tilasta
  (`custrecord_gbb_date_to_non_active`):
  - 2026-06-01 → viimeinen laskutettu kuukausi 05: B000928, B001042, B004170, B010372, B018479, B023257
  - 2026-07-01 → viimeinen 06: B001005, B001083, B002546, B004110, B004878
  - Poikkeus: B023694:n `date_to_non_active` on 2026-06-02, mutta kesäkuu laskutettiin CR 3686:lla, joka luotiin
    3.6. **Epäselvä.**
- Tämä on pidennyssilmukan suunniteltu toiminta: pyörä on Active, `subsc_end_date` on eilen, eikä lunastusta ole
  maksettu. **Pidennyskuukaudet eivät siis ole moottorivirhe.**
- *Päätelty:* sitä, olivatko ne liiketoiminnallisesti aiheellisia, ei voi todentaa NetSuitesta.
  - 10 pyörällä ei ole lunastustransaktiota (item 46), Paylink-pyyntöä eikä `redemption_paid_at`:ia.
  - Lunastus on todennäköisesti hoidettu tilin ulkopuolella (OOMI-sopimukset, `externalid` RENT_).
- **B001042 ja B004170, vaatii päätöksen.** Niillä on lunastusmyyntitilaus 29.1.2026: SOGBB0004671 (Aku Kolehmainen,
  item 46, 156,41 € netto) ja SOGBB0004771 (Marko Koivula, 138,76 €). Molempien status on B, eli laskuttamatta.
  - Työnantajaa on silti veloitettu pidennys 03, 04 ja 05 (05 kahdesti, joista toinen hyvitetty).
  - Jos lunastus sovittiin 29.1., kolme pidennyskuukautta kummaltakin on aiheettomia: 6 × 92,60 = **555,60 € netto /
    697,26 € brutto**.
  - Jos lunastusta ei koskaan maksettu, pidennys on oikein, mutta silloin kaksi lunastus-SO:ta on jäänyt laskuttamatta.
    Ratkaisu kuuluu `lunastusauditoija`lle tai taloudelle.

**Sama tuplailmiö muilla pyörillä (todennettu).** Haettiin tyypin 7 Done-CR:t, joilla on sama pyörä ja sama kuukausi
(01–09/2026). Tuplia löytyi 20, joista 12 on yllä. Muut:

| Pyörä | Kk | CR:t | Laskut | Hyvitys | Tila |
|---|---|---|---|---|---|
| B000691 (978) | 03 | 1453 (149), 1642 (109) | INVGBF1018841, 1018889 | CRMGBF0002271 | OK |
| **B004434 (352 A-Katsastus Oy)** | **04** | **2183 (149), 2212 (109)** | **INVGBF1022483, INVGBF1022484** (molemmat 116,21 brutto) | **ei ole** | **hyvittämättä 92,60 / 116,21** |
| B000883 (935) | 05 | 3049, 3092 | INVGBF1026794, 1026813 | CRMGBF0002328 | OK |
| B001018 (1150) | 05 | 3047, 3094 | INVGBF1026781, 1026814 | CRMGBF0002302 | OK |
| B003973 (871) | 05 | 3041, 3099 | INVGBF1026788, 1026824 | CRMGBF0002814 | OK |
| B024858, B006151, B039986 | 05/06/07 | – | laskut **eri asiakkaille** | – | siirtoketjuja, ei saman asiakkaan tuplia. Ei tarkistettu tarkemmin |

Kysely:

```sql
SELECT cr.custrecord_cr_bike_registry bike, TO_CHAR(cr.custrecord_cr_start_date,'YYYY-MM') m, COUNT(*) n,
       LISTAGG(cr.id, ',') WITHIN GROUP (ORDER BY cr.id) ids, LISTAGG(cr.owner, ',') WITHIN GROUP (ORDER BY cr.id) owners
FROM customrecord_subscrption_change_request cr
WHERE cr.custrecord_cr_type = 7 AND cr.custrecord_cr_status = 2 AND cr.custrecord_cr_start_date >= TO_DATE('2026-01-01','YYYY-MM-DD')
GROUP BY cr.custrecord_cr_bike_registry, TO_CHAR(cr.custrecord_cr_start_date,'YYYY-MM') HAVING COUNT(*) > 1
```

### 2.2 CR 5074 (B046637, Reaktor): kokoomalasku INVGBF1038563

**Rivit (todennettu):**

| Rivi | Item | Emosopimus / asiakas | Kausi | Hinta | Historia | Luotu |
|---|---|---|---|---|---|---|
| 80192 | 30 | 624 / 1122 Reaktor Group | 2026-08-01 → 2026-09-30 | 79,6813 | `["2026-09-01"]` | 27.7. |
| 80193 | 31 | 624 / 1122 | 2026-08-01 → 2026-09-30 | 15,9363 | `["2026-09-01"]` | 27.7. |
| 80387 / 80388 | 30 / 31 | 44 / 361 | 2026-10-01 → 2027-12-31 | 79,6813 / 15,9363 | `["2026-10-01"]` | 14.8. |

CR-ketju: 4778 (9, 1.8.), 5073 (7 → 361, 08–09), 5074 (11 → 1122, 08–09) ja 5075 (9, 10-01, `eos` 09-30).

**Laskutus (todennettu laskuriveiltä):**

- SOGBF0035336 (4.8., `custcol_sta_bikeid_line = 46637`) → INVGBF1038563 (4.8., asiakas 1122, `custcol_sta_bikeid_line`
  tyhjä). Laskulla on rivit 80192/80193 kahdelta kaudelta:
  - 2026-08-01 → 08-31 (79,68 + 15,94) = **catch-up-rivi**
  - 2026-09-01 → 09-30 (79,68 + 15,94) = nykyinen kausi
- Reaktoria on siis laskutettu 08 ja 09, yhteensä 191,24 € netto. CM CRMGBF0003429 (191,24) on **oikein. Todennettu,
  ei enää päätelty.**

**Miksi historia on vajaa.** Korjaus aiempaan raporttiin: syyskuu **on** historiassa 23.9., vain elokuu puuttuu.
Syy on skriptissä (todennettu koodista):

- `invoice.functions.js:200–224`: kun historia on tyhjä ja rivin alku on ennen kauden alkua, moottori luo catch-up-rivit ja
  lisää kuukaudet vain **muistissa** olevaan `row.invoiceHistory`:iin (rivi 219). Arvoa ei tallenneta.
- `updateAgreement` (`:475–499`) kirjoittaa emosopimukselle `custrecord_sta_sub_lines_to_update` = rivi-id:t ja
  `custrecord_subs_line_update_invhist` = `billPeriodStart`.
- `sta_mr_agreement_row_inv_history_update.js:81–92` lisää jokaisen rivin historiaan **vain** tämän yhden päivämäärän.
  Catch-up-kuukaudet eivät koskaan päädy historiaan.

**Laajuus (todennettu kyselyllä).** Laskurivit 01–09/2026, joiden `custcol_sta_ca_product_id` osoittaa riviin, jonka
historiasta kuukausi puuttuu:

| Luokka | Laskurivejä | Sopimusrivejä | Asiakkaita |
|---|---|---|---|
| catch-up (kausi ≤ laskun kuukausi) | 1 500 | 1 486 | 353 |
| nykyinen kausi | 1 368 | 1 327 | 47 |

- **Nykyisen kauden puuttuva historia** on keskittynyt kolmeen laskuun, joilla koko laskun historia jäi kirjoittamatta.
  Todennäköisesti historia-MR ei ajanut, tai `custrecord_sta_sub_lines_to_update` ylikirjoittui ennen ajoa (päätelty):
  - INVGBF1015857 Päijät-Hämeen hva 04/2026: 530 riviä
  - INVGBF1009670 Sandvik 02/2026: 363 riviä
  - INVGBF1013985 Vaasan kaupunki 03/2026: 339 riviä
  - Lisäksi 136 hajariviä noin 60 asiakkaalla.
- **10/2026:ssa puuttuvia on 0.**
- Luvut ovat alarajoja. Ryhmitellyillä laskuriveillä vain ryhmän ensimmäinen sopimusrivi on tarkistettavissa.

**Vaikutus:** `handler_hyvitys` lukee historiaa. Näillä riveillä se päättelee laskutetun kuukauden laskuttamattomaksi ja
varoittaa. Sama päätelmä toistuu Hyvitys-auditoinneissa. Rivihistoria ei ole luotettava todiste siitä, että kuukautta
**ei** laskutettu. Luotettava todiste on laskurivi (`custcol_sta_ca_product_id`) tai määrätason täsmäytys.

```sql
SELECT CASE WHEN tl.custcol_sta_so_revrec_start < ADD_MONTHS(TRUNC(t.trandate,'MM'),1) THEN 'catchup' ELSE 'current' END k,
       COUNT(*) n, COUNT(DISTINCT r.id) nr, COUNT(DISTINCT t.entity) ne
FROM transaction t JOIN transactionline tl ON tl.transaction = t.id
JOIN customrecord_sta_ca_agreement_row r ON r.id = tl.custcol_sta_ca_product_id
WHERE t.type = 'CustInvc' AND tl.mainline='F' AND tl.custcol_sta_so_revrec_start >= TO_DATE('2026-01-01','YYYY-MM-DD')
  AND (r.custrecord_sta_ca_row_invoicehistory IS NULL
       OR INSTR(r.custrecord_sta_ca_row_invoicehistory, TO_CHAR(tl.custcol_sta_so_revrec_start,'YYYY-MM-DD')) = 0)
GROUP BY CASE WHEN tl.custcol_sta_so_revrec_start < ADD_MONTHS(TRUNC(t.trandate,'MM'),1) THEN 'catchup' ELSE 'current' END
```

### 2.3 CR 6284 (Wärtsilä) ja CR 6330 (Sweco): ovatko pyörät lokakuun kokoomalaskuilla?

**Vastaus: eivät. Kumpaakaan pyörää ei ole laskutettu 10/2026 niiltä asiakkailta, joille lokakuu hyvitettiin.
Kumpikin CM on ylihyvitys. Todennettu.**

Todiste on määrätason täsmäytys. Lokakuun historiassa puuttuvia ei ole yhtään (osio 2.2), joten historia on tälle
kuukaudelle täydellinen:

| Lasku | Asiakas | Item | 10/2026 kpl laskulla | Rivejä, joiden historiassa `2026-10-01` | Niistä B007914/B018137 |
|---|---|---|---|---|---|
| INVGBF1042980 | 373 Wärtsilä (sop. 60) | 30 / 31 | 407 / 407 (+ 2 / 2 catch-up 09) | 407 / 407 | **0** |
| INVGBF1042403 | 936 Sweco (sop. 460) | 30 / 31 | 18 / 18 | 18 / 18 | **0** |

Myös summat täsmäävät pyöristystä vaille: Wärtsilä 32 223,36 vs. 32 223,04 ja Sweco 1 445,88 vs. 1 445,83.

**B007914 (CR 6284):**

- Rivit 66694 (30) ja 31989 (31), emosopimus 60, Wärtsilä. Kausi 2025-12-01 → **2026-09-30**, historia 12/2025–09/2026.
- Rivi päättyi ennen lokakuun kautta, joten moottori ei ottanut sitä lokakuun ajoon. Yhtään 10/2026-laskuriviä ei ole
  millään asiakkaalla.
- Lunastus-CR 6197 (tyyppi 2) on `end_date_of_old_sub = 2026-10-31`. End-date guard jätti rivin 30.9.:een, mikä on oikein.
- Pyörän lunastuslasku INVGBB1013812 (Paylink, 1.9., 363,34 €) on käyttäjälle.
- CM CRMGBF0003724 hyvitti lokakuun (92,60 netto / 116,21 brutto), jota ei ollut laskutettu → **ylihyvitys 92,60 /
  116,21.**

**B018137 (CR 6330):**

- Swecon rivit 79485/79486 (sop. 460), 2026-06-01 → 09-30. Laskutettu 08 (INVGBF1033982) ja 09 (INVGBF1038284).
  Syyskuu on jo hyvitetty CR 5424:llä (CRMGBF0003637) ja veloitettu 155299:ltä CR 5423:lla (INVGBF1039305).
- Lokakuu on laskutettu **uudelta asiakkaalta 155299** rivillä 80612/80613 (sop. 5456, 2026-10-01 → 10-31) laskulla
  INVGBF1042944. Tämä on oikein rivien mukaan.
- CM CRMGBF0003770 hyvitti lokakuun **Swecolle**, jota ei laskutettu → **ylihyvitys 92,60 / 116,21.**
- *Päätelty:* jos CR 6330:n tarkoitus oli, ettei lokakuuta veloiteta kenenkään työnantajan kautta, oikea hyvitettävä
  olisi 155299, ei 936. Päätös kuuluu taloudelle tai CR:n tekijälle.

### 2.4 CR 6029 (B044666, Kouvolan kaupunki): syyskuu

**Rivit (todennettu):**

| Rivi | Item | Sop. / asiakas | Kausi | Hinta | Historia | Luotu |
|---|---|---|---|---|---|---|
| 109632 | 30 | 5152 / 104193 Kouvola | **2025-06-10** → 2026-09-30 | 79,6813 | `["2026-05-01", "2026-06-01", "2026-07-01", "2026-08-01", "2026-09-01"]` | **27.8.2026** |
| 109633 | 31 | 5152 / 104193 | sama | 10,0797 | sama | 27.8. |
| 116045 / 116046 | 30 / 31 | 5445 / 147180 | 2026-10-01 → 2029-11-30 | 79,6813 / 15,94 | `["2026-10-01"]` | 31.8. |
| 109634 / 109635 | 30 / 31 | 5445 / 147180 | 2029-12 tynkä | 23,1333 / 2,9264 | `[]` | 27.8. |

**Historia ei ole moottorin kirjoittama (todennettu):**

- Rivit luotiin 27.8., syyskuun ajon (4.8.) jälkeen. Moottori ei ole voinut laskuttaa niitä syyskuulta.
- Historian JSON sisältää välilyöntejä, joita `JSON.stringify` ei tuota. Sopimuksen 5152 riveistä 7 on tätä muotoa.
- Kouvolan 06–09/2026-laskut on luonut `createdby = −5` (CSV-import): INVGBF1030530/1030860, 1035020/1035369, 1038994 ja
  1039474. Moottori laskutti Kouvolaa ensimmäisen kerran 10/2026 (INVGBF1042699, −4).
- Päätelty: historia on tuotu migraatiossa kertomaan kuukaudet, jotka laskutettiin CSV-laskuilla.

**Määrätason täsmäytys, sopimus 5152 (todennettu):**

| Kk | Lasku | kpl (30 / 31) | Rivejä, joiden historiassa kk | Erotus |
|---|---|---|---|---|
| 08 | INVGBF1038994 | 45 / 45 | 45 / 45 | 0 |
| 09 | INVGBF1039474 | **42 / 42** | **43 / 43** | **−1** |
| 10 | INVGBF1042699 | 41 / 41 | 41 / 41 | 0 |

Kustannuspaikoittain syyskuun ainoa ero on ryhmässä "ei kustannuspaikkaa": laskulla 2 kpl, historiassa 3 riviä
(B044666 109632, B046523 115936, B046525 115944). Muut kustannuspaikat täsmäävät.

- *Päätelty:* B044666 on se pyörä, jonka syyskuu jäi pois. Elokuussa sama ryhmä oli laskulla 2 ja kustannuspaikka 7895
  kappaleen yli. Tämä sopii siihen, että B044666:n kustannuspaikka oli elokuussa 7895 ja poistettiin, kun pyörä siirtyi
  uudelle työnantajalle.
- Kustannuspaikan historiaa ei todennettu. systemnote on custom recordeilla epäluotettava.

**Johtopäätös:**

- Syyskuuta ei laskutettu Kouvolalta. **Memo "Syyskuuta ei laskutettu TA:lta" on oikein.** Rivin 109632/109633
  historiamerkintä `2026-09-01` on väärin.
- CM CRMGBF0003697 hyvitti 08 ja 09 (179,52 netto), vaikka vain 08 oli laskutettu.
- Käsinlasku INVGBF1043396 (19.9., 89,76 netto / 112,65 brutto, kohdistettu CM:ään) perui syyskuun ylihyvityksen.
  **Se ei ole tuplalaskutus.** Kouvolan nettovaikutus 08–09 on 0.
- 147180 on veloitettu 08–09 CR 6030:lla (INVGBF1039329, 2 × 95,62), ja 10/2026 alkaen moottorilla (INVGBF1042938).
- **Ei jäljellä olevaa rahakorjausta.**

---

## 3. Korjausehdotukset riveille

**Ei ehdotuksia.** Kaikkien tarkasteltujen rivien kausi ja emosopimus vastaavat CR:iä ja käsittelijöiden sääntöjä:

| Rivi | Miksi ei korjata |
|---|---|
| 12 pyörän 24 OOMI-riviä | Päättyneet oikein 02/03, suljettu moottorin toimesta. Pidennyskuukaudet laskutetaan CR:llä, eivät rivillä |
| 80192/80193 | Konsernisiirron siirtymäkuukaudet (13 → 7/11/9). Päättyvät 30.9., moottori sulkee ne. Historiasta puuttuva 08 on historiakenttä, ei rajauksessani |
| 66694/31989 | Päättyvät 30.9. Guard jätti CR 6197:n `eos` 31.10.:n soveltamatta, mikä on oikein. Jatkaminen 31.10.:een olisi guardin ohitus, eikä lokakuun ajoa enää tule |
| 79485/79486, 80612/80613 | Täsmäävät CR 3484 ja 5425 kanssa |
| 109632/109633 | Kausi täsmää CR 6028:n `eos` 30.9.:n kanssa. Väärä historiamerkintä ei ole rajauksessani. Alku 2025-06-10 kesken kuun (K7) on migraation perua, eikä sillä ole vaikutusta, koska historia ei ole tyhjä |

---

## 4. Juurisyy tai korjaus muualla

**Talous (todennettu, toimenpide tarvitaan):**

| # | Asiakas | Pyörä | Toimenpide | Netto | Brutto |
|---|---|---|---|---|---|
| T1 | 373 Wärtsilä Finland Oy | B007914 | CRMGBF0003724 (CR 6284) hyvitti 10/2026, jota ei laskutettu → peru tai veloita | 92,60 | 116,21 |
| T2 | 936 Sweco Finland Oy | B018137 | CRMGBF0003770 (CR 6330) hyvitti 10/2026, jota ei laskutettu → peru tai veloita. Lokakuu on laskutettu 155299:ltä | 92,60 | 116,21 |
| T3 | 352 A-Katsastus Oy | B004434 | 04/2026 laskutettu kahdesti (INVGBF1022483 + INVGBF1022484, CR 2183 + 2212) → hyvitä toinen | 92,60 | 116,21 |
| | **Yhteensä** | | T1 + T2 asiakkaalta takaisin, T3 asiakkaalle | 185,20 / 92,60 | 232,42 / 116,21 |

Nettovaikutus GoByBiken hyväksi on +92,60 / +116,21. Toimenpiteitä on kolme erillistä.

**Talous tai `lunastusauditoija` (päätelty, vaatii päätöksen):**

- B001042 ja B004170: lunastus-SO 29.1.2026 on laskuttamatta (status B), ja pidennys 03–05 on veloitettu työnantajalta.
  Joko pidennys on aiheeton (555,60 / 697,26), tai lunastus-SO:t pitää laskuttaa.
- Muut 10 pyörää: pidennyksen 04–05/06 aiheellisuus (yhteensä 26 pyöräkuukautta, 2 407,60 / 3 021,54) riippuu siitä,
  milloin lunastus maksettiin NetSuiten ulkopuolella.
- B023694: kesäkuun pidennys-CR 3686 luotiin 3.6., mutta `date_to_non_active` on 2.6.

**Pyörärekisteri (`lunastusauditoija`):**

- `custrecord_gbb_liab_settled_at` on 12 pyörällä 1.4.2026 tai 4.3.2026. Se on 21.9. backfillin
  (`imports/2026-09-21-vaihe3-esiehto/01-cr-luontipaiva.csv`) **ensimmäisen** tyypin 7 CR:n luontipäivä, vaikka pidennys
  jatkui vielä 2–3 kuukautta.
  - Tyypin 7 pidennys-CR on todiste siitä, että lunastus oli **maksamatta**, ei siitä, että velvoitteet oli hoidettu.
  - Backfillin sääntöä "Done Type 2/7 CR on todiste" kannattaa tarkistaa pidennys-CR:ien osalta.
- `custrecord_sta_subsc_end_date` on 2026-05-31 pyörillä B001005, B001083, B002546, B004878 ja B023694, vaikka kesäkuun
  pidennys laskutettiin. `handler_jalki` siirtää tämän kentän yleensä eteenpäin, ja B004110:llä se on 06-30.

**Skriptit (omistava repo, ei ehdotuksia):**

- `netsuite-staria-suitescripts`, `invoice.functions.js:219` + `sta_mr_agreement_row_inv_history_update.js:81–92`:
  catch-up-kuukausia ei tallenneta rivihistoriaan (≈1 486 riviä).
- Staria-moottori: `custcol_sta_bikeid_line` ei periydy myyntitilaukselta laskulle. Laskuilla ei ole pyörätunnusta.
- Historia-MR jätti kolme kokonaista laskua kirjaamatta: Päijät-Häme 04, Sandvik 02 ja Vaasa 03, yhteensä 1 232 riviä.
- `netsuite-subscription-extension`: sama päivä ajettiin käsin ja ajastettuna ilman idempotenssia. Tuloksena
  tyypin 7 tuplat 03, 04 ja 05/2026 (vrt. CLAUDE.md, override-ansa).
- `netsuite-subscrption-cr-scripts`, `handler_hyvitys`: historiaan nojaava "ei laskutettu" -varoitus on
  väärä positiivinen catch-up-riveillä ja väärä negatiivinen tuoduilla historioilla (B044666). Aiemmin CR 6284/6330-tyyppiset
  ylihyvitykset jäivät huomaamatta siksi, että CR:t suljettiin varoituksesta huolimatta.

---

## 5. Varoitukset

- **Rivihistorian korjaaminen** (esim. 109632:n `2026-09-01` pois, 80192:een `2026-08-01` lisää) ei ole tämän
  auditoinnin rajauksessa.
  - Jos joku tekee sen: tyhjäksi jäävä historia laukaisee catch-up-laskutuksen.
  - Hyvitys- ja Jälkiveloitus-käsittelijät hinnoittelevat historian perusteella.
- **Rivin 66694/31989 jatkaminen 31.10.:een** (CR 6197:n `eos`) olisi tietoinen end-date guardin ohitus. Lokakuun ajo on
  jo tehty, joten se ei laskuttaisi lokakuuta, mutta se muuttaisi RI-rivit (`ri-auditoija`) ja rekisterin Check 1 -tuloksen.
- **Talouden korjaukset T1–T3** eivät vaikuta sopimusriveihin eivätkä historiaan. Ne on tehtävä CM- tai laskutasolla.
  Rivikorjaus ei peru lähteneitä laskuja.
- **Kuukausiraportointi:** rivien kausi tai hinta ei muutu, joten RI-rivit eivät muutu. Tyypin 7 ja 11 CR:t ovat jo Done,
  ja niiden RI-vaikutus on jo syntynyt.

---

## 6. Todennettu vs. päätelty

**Todennettu (SuiteQL 23.9.2026 tai koodi):**

- 24 rivin kaudet, statukset, historia ja hinnat. Kaikkien tyypin 7 ja 11 CR:ien päivät ja omistajat.
- Huhti–kesäkuun laskut ovat tyypin 7 CR:ien laskuja, eivät moottorin. Moottori laskutti rivit vain niiden kaudelta.
- Toukokuun tupla on hyvitetty kaikilla 12 pyörällä. B004434:n huhtikuun tupla on hyvittämättä.
- `custcol_sta_bikeid_line` on tyhjä kaikilla moottorin laskuilla 09/2026, ja `custcol_sta_ca_product_id` periytyy.
- INVGBF1038563 laskutti B046637:n 08 ja 09, ja CR 5074:n CM on oikein.
- Catch-up-kuukautta ei tallenneta historiaan (koodi + 1 500 laskuriviä).
- B007914 ja B018137 eivät ole lokakuun kokoomalaskuilla (määrätäsmäytys 407/407 ja 18/18). CR 6284 ja 6330 ovat
  ylihyvityksiä.
- Kouvolan syyskuun lasku on 1 kpl lyhyempi kuin historia, ja ero on kustannuspaikattomassa ryhmässä.
- Kouvolan 06–09-laskut ovat CSV-importteja.
- Lunastus-SO:t B001042 ja B004170 29.1.2026 ovat status B.

**Päätelty:**

- B044666 on nimenomaan se syyskuulta puuttuva pyörä (kustannuspaikan muutos 08 → 09, ei todennettu).
- Pidennyskuukausien liiketoiminnallinen aiheellisuus.
- Toukokuun tuplan syy: käsin tehty ajo samana päivänä (omistaja 149). Ajotapaa, eli overridea tai käsiajoa, ei todennettu
  `scriptnote`sta.
- Historia-MR:n kolmen laskun katkoksen syy.
- 109632:n historia on migraatiotuonnin kirjoittama (välilyöntimuoto, CSV-laskut).
- CR 6330:n oikea hyvitettävä olisi ollut 155299.
