# Lokakuun Redeemed-käännöt 1.–12.10.2026: tarkistus R1–R19

**Tehty:** 12.10.2026 · **Tekijä:** lunastusauditoija (vain luku, NetSuiteen ei kirjoitettu)
**Joukko:** `custrecord_sta_bike_status = 2`, `custrecord_gbb_date_to_non_active >= 01.10.2026`, `isinactive = F`, ei B017530.
Tyhjä `date_to_non_active` + status 2: **0** (1458 oli täyttänyt myös 12.10. käännetyt 8 pyörää).

## 1. Yhteenveto

**890 pyörää käännettiin statukseen 2 lokakuussa. Statuskääntö on väärä yhdellä pyörällä (B020053, tiedossa T55:ssä).**
Ennenaikaisia (R1) on 0, ja status 2 ilman tapaa (R4) on 0. Palautus-CR:llisia (2D) on 0, tyypin 10 CR:llisia 0.
Kauden lopun lunastuksia ilman maksua tai kattavuutta on 0, ja keskenkauden lunastuksia ilman Done-tilaista tyypin 2 CR:ää on 0.
Kenttävirheitä on, ks. taulukko.

| Kirjoittaja | Kääntöjä | Todennus |
|---|---|---|
| 1480 status-sync 2.0 | **286** (2 live-testiä 8.10., 275 yöllä 10.10., 2 yöllä 11.10., 7 yöllä 12.10.) | `scriptnote` 1480, `status=1→2` |
| 1199 `handler_lunastus` | **83** (+3 statukseen 3) | `scriptnote` 1199, `bike register status → 2` |
| käsin (UI) | **1** (B020053, 9.10.) | `systemnote` context `UIF` |
| 1440 vanha sweep / osa A (1.–6.10.) | **520** | päätelty: erotus, `date_to_non_active` 1.–6.10. ja 1440:n lokit päättyvät 6.10. |

| Luokka | Pyöriä |
|---|---|
| Keskenkauden (Done tyypin 2 CR) | 125 (tapa 1: 113, 3: 1, 6: 3, 7: 8) |
| Kauden lopun, ei OOMI | 468 (tapa 1: 430, 2: 32, 3: 3, 4: 2, 5: 1) |
| Kauden lopun, OOMI | 297 (tapa 1) |

| R | Pyöriä | Luokka | Määräaika |
|---|---|---|---|
| R5 status 2 + tapa 5 | 1 (B020053) | korjattava, ihmisen päätös (T55 LU3) | — (kausi päättyi 31.08.) |
| R9 tapa ≠ CR:n pääte | 1 (B041505) | korjattava | 31.10. (CR:n luontikuu, ADR 0010 k7) |
| R9 `liab_settled_at` ≠ CR:n luontipäivä | 2 (B018311, B031476) | korjattava | 31.10. (päättymiskuu) |
| R9 `decided_at` ≠ CR:n luontipäivä | 17 | korjattava, T7:n ajamaton CSV | 31.10. |
| R8 `liab_settled_at` tyhjä, tapa 1 | 374 (335 T38-kyselyssä + 39 sen ulkopuolella) | korjattava (T38), 4 historiallista | 31.10. |
| R15 IC-päivä tyhjä | 1 (B015557) | korjaantuu 1480-ajossa 13.10. | — |
| R1, R2, R3, R4, R6, R10, R11, R12, R13*, R14, R16, R17, R18 | 0 | — | — |

\* R13: B046508 (tapa 4 + 2 pidennys-CR:ää) on sallittu T33:n päätöksellä.

## 2. Rikkomukset

### R5: B020053, status 2 ja tapa 5

Käsin UI:ssa 9.10. klo 10:45 lokiaikaa: status Active → Redeemed, tapa `bike_returned`, `liab_settled_at` ja `decided_at` 9.10.
Pyörällä ei ole tyypin 2 CR:ää (vain Pending-tilainen tyypin 11 CR 7028 *notion 794*). `subsc_end_date` 31.08.2026, IC 31.08.2026.
Tiedossa: TASKS T55, raportointiryhmä LU3/LU4. Joko status (3) tai tapa on väärin, ja sen ratkaisee ihminen.

### R9: B041505, tapa 3 vaikka CR on 2C

OOMI-pyörä. CR 7150 *Notion-1381 - 2C* Done 7.10., luotu 7.10. 1199:n loki 7.10. 00:01:
`custrecord_gbb_liab_settle_method (already 3, would have written 1)` ja `1 field(s) already set, kept`.
Tavan 3 kirjoittajaa ei löydy: 1479 ei käsittele OOMI-pyöriä eikä sen lokissa ole tätä pyörää, eikä `systemnote` näytä muutosta.
`liab_settled_at` = `decided_at` = 07.10. = CR:n luontipäivä (oikein). `subsc_end_date` 31.10., rivit katkaistu 30.11. (`end_date_of_old_sub`, sallittu).

### R9: B018311 ja B031476, `liab_settled_at` = maksupäivä

| Pyörä | `liab_settled_at` | `paid_at` | CR | CR:n luontipäivä |
|---|---|---|---|---|
| B018311 | 07.09.2026 | 07.09.2026 | 6571 *Notion-433 - 2C* Done | 17.09.2026 |
| B031476 | 04.09.2026 | 04.09.2026 | 6570 *Notion-394 - 2C* Done | 17.09.2026 |

`systemnote`: S1-CSV ylikirjoitti 23.09. klo 17:21 arvon 17.09. maksupäivällä. ADR 0008 § *Vaikutus S1-importtiin* päätti palautuksen
17.09.2026:iin, mutta sille ei ole importtia eikä TASKS-tehtävää. Kausi päättyy 31.10.2026.

### R9: `decided_at` ≠ CR:n luontipäivä (17)

B003488, B013059, B013326, B014289, B015640, B016327, B018311, B023113, B024711, B026967, B031476, B031906, B033097,
B034235, B035201, B036496, B036661. Kaikki ovat T7:n CSV:ssä `imports/2026-09-25-decided-at-historia/01-decided-at-2026-10-09.csv`
oikealla arvolla. CSV:tä ei ole ajettu.

### R8: tapa 1, `liab_settled_at` tyhjä (374)

Kaikilla on `paid_at`. Kaikilla 430 ei-OOMI tavan 1 pyörällä on maksettu Paylink-tilaus (`custrecord_pl_ns_status = 3`).
1480 ei täytä kenttää, koska pyörät olivat jo status 2 (ADR 0015 k12), joten virhe ei korjaannu itsestään.

**T38-kyselyn sisällä (`link_sent` = T), 335 pyörää** (pyörä:`paid_at`):

B000988:01.10., B001082:01.10., B001314:01.10., B001384:02.10., B001467:03.10., B001547:01.10., B001585:02.10., B001762:01.10., B001853:01.10., B003446:01.10., B003565:01.10., B003733:05.10., B003808:01.10., B003854:01.10., B004252:01.10., B004321:01.10., B004597:01.10., B004926:02.10., B004934:01.10., B004938:01.10., B004944:01.10., B004969:01.10., B004987:01.10., B004996:01.10., B004997:04.10., B005006:02.10., B005011:01.10., B005014:01.10., B005022:01.10., B005024:02.10., B005031:01.10., B005033:01.10., B005046:01.10., B005053:01.10., B005059:04.10., B005077:01.10., B005079:01.10., B005083:05.10., B005087:01.10., B005089:01.10., B005102:02.10., B005120:01.10., B005122:02.10., B005133:01.10., B005138:01.10., B005147:01.10., B005151:01.10., B005155:01.10., B005159:01.10., B005183:01.10., B005185:05.10., B005196:01.10., B005206:01.10., B005228:02.10., B005234:01.10., B005241:01.10., B005249:01.10., B005251:02.10., B005265:01.10., B005267:02.10., B005275:01.10., B005276:05.10., B005281:01.10., B005291:01.10., B005296:01.10., B005309:01.10., B005325:02.10., B005347:01.10., B005353:03.10., B005357:01.10., B005384:01.10., B005393:01.10., B005396:05.10., B005399:01.10., B005401:02.10., B005403:01.10., B005405:01.10., B005407:01.10., B005413:01.10., B005422:01.10., B005424:01.10., B005425:03.10., B005430:01.10., B005480:01.10., B005485:02.10., B005490:05.10., B005524:01.10., B005547:03.10., B005611:01.10., B005616:01.10., B005667:05.10., B005724:01.10., B005811:01.10., B005829:01.10., B005910:03.10., B005924:01.10., B006102:01.10., B006169:01.10., B006287:01.10., B006306:01.10., B006488:01.10., B006544:01.10., B006641:01.10., B006659:01.10., B006756:01.10., B006899:01.10., B007096:01.10., B007341:02.10., B007397:04.10., B007714:02.10., B007737:01.10., B008018:02.10., B008019:01.10., B008404:01.10., B008418:03.10., B008428:01.10., B008445:02.10., B008450:01.10., B008610:01.10., B008633:01.10., B008705:02.10., B008816:05.10., B008880:01.10., B008896:01.10., B009049:02.10., B009202:02.10., B009273:02.10., B009363:01.10., B009450:02.10., B009605:01.10., B009793:05.10., B009849:01.10., B010085:02.10., B010126:05.10., B010142:02.10., B010180:05.10., B010396:02.10., B010422:01.10., B010484:01.10., B010594:02.10., B010788:05.10., B011219:01.10., B011335:02.10., B011518:02.10., B011550:02.10., B011612:02.10., B011889:03.10., B012052:02.10., B012250:01.10., B012267:02.10., B012369:05.10., B012402:02.10., B012443:02.10., B012627:03.10., B012755:01.10., B012893:01.10., B012929:03.10., B012950:05.10., B013108:01.10., B013154:02.10., B013259:02.10., B013389:01.10., B013635:02.10., B013864:05.10., B014040:01.10., B014448:01.10., B014876:01.10., B014884:01.10., B014890:01.10., B015096:02.10., B015174:01.10., B015207:04.10., B015399:03.10., B015407:01.10., B015482:01.10., B015490:02.10., B015508:01.10., B015595:01.10., B015722:01.10., B015898:01.10., B016033:02.10., B016077:01.10., B016150:04.10., B016229:01.10., B016277:01.10., B016895:01.10., B016917:01.10., B017582:01.10., B017665:01.10., B017676:01.10., B017769:02.10., B017783:02.10., B017785:01.10., B017995:02.10., B018141:01.10., B018148:02.10., B018299:01.10., B018766:01.10., B018785:05.10., B018849:01.10., B018920:05.10., B019080:05.10., B019207:01.10., B019292:04.10., B019344:02.10., B019430:01.10., B019644:01.10., B019757:02.10., B019819:02.10., B019883:05.10., B019915:01.10., B019940:01.10., B020000:01.10., B020084:02.10., B020254:01.10., B020266:01.10., B020332:01.10., B020543:01.10., B020589:01.10., B020948:01.10., B020963:01.10., B021022:01.10., B021072:01.10., B021272:02.10., B021565:01.10., B021977:01.10., B021998:01.10., B022034:02.10., B022091:01.10., B022148:01.10., B022249:01.10., B022401:05.10., B022447:01.10., B022881:05.10., B022905:01.10., B022929:01.10., B023007:02.10., B023154:01.10., B023403:01.10., B023699:02.10., B024435:01.10., B024447:01.10., B024577:05.10., B024628:01.10., B024678:03.10., B024785:01.10., B025034:01.10., B025292:01.10., B025296:01.10., B025357:01.10., B025365:05.10., B025422:01.10., B025958:01.10., B026030:05.10., B026038:02.10., B026356:01.10., B026444:01.10., B026645:01.10., B026694:01.10., B026815:01.10., B027059:02.10., B027185:01.10., B027304:01.10., B027354:01.10., B027392:01.10., B027993:03.10., B028101:01.10., B028181:01.10., B028531:01.10., B028544:01.10., B028669:03.10., B029110:01.10., B029274:05.10., B029376:01.10., B029418:01.10., B029583:01.10., B029671:01.10., B029720:01.10., B029731:01.10., B029735:01.10., B029928:02.10., B030013:01.10., B030127:02.10., B030233:01.10., B030257:02.10., B030533:01.10., B030560:05.10., B030667:01.10., B030668:01.10., B030717:01.10., B030911:01.10., B031173:01.10., B031203:04.10., B031257:02.10., B031287:01.10., B031569:01.10., B031624:01.10., B031641:05.10., B031649:01.10., B031859:01.10., B031900:01.10., B032030:01.10., B032210:03.10., B032349:01.10., B032419:02.10., B032560:05.10., B032782:01.10., B032828:01.10., B032834:01.10., B033094:01.10., B033201:01.10., B033234:01.10., B033292:01.10., B033301:02.10., B033320:01.10., B033361:01.10., B033790:02.10., B033980:01.10., B034027:01.10., B034130:03.10., B034200:05.10., B034342:04.10., B034453:05.10., B034716:01.10., B035058:01.10., B035213:01.10., B035257:01.10., B035307:05.10., B035720:02.10., B035794:01.10., B035852:05.10., B035887:01.10., B035935:02.10., B036581:02.10., B037265:05.10.

**T38-kyselyn ulkopuolella (`link_sent` = F), 39 pyörää:**

| Pyörä | OOMI | `paid_at` | `subsc_end_date` | `date_to_non_active` |
|---|---|---|---|---|
| B004475 | – | 04.10.2026 | 31.10.2026 | 05.10.2026 |
| B008836 | – | 30.09.2026 | 30.09.2026 | 01.10.2026 (historiallinen) |
| B015132 | – | 01.10.2026 | 31.10.2026 | 02.10.2026 |
| B015501 | – | 05.10.2026 | 31.10.2026 | 06.10.2026 |
| B023763 | – | 02.10.2026 | 31.10.2026 | 03.10.2026 |
| B026671 | – | 30.09.2026 | 31.10.2026 | 02.10.2026 |
| B026829 | – | 30.09.2026 | 30.09.2026 | 01.10.2026 (historiallinen) |
| B037691 | OOMI | 05.10.2026 | 18.10.2026 | 06.10.2026 |
| B037775 | OOMI | 03.10.2026 | 10.10.2026 | 04.10.2026 |
| B038524 | OOMI | 29.09.2026 | 18.10.2026 | 01.10.2026 |
| B038977 | OOMI | 29.09.2026 | 28.10.2026 | 01.10.2026 |
| B039152 | OOMI | 30.09.2026 | 19.10.2026 | 01.10.2026 |
| B039156 | OOMI | 24.09.2026 | 23.10.2026 | 01.10.2026 |
| B039520 | OOMI | 21.09.2026 | 18.10.2026 | 01.10.2026 |
| B039628 | OOMI | 18.09.2026 | 30.10.2026 | 01.10.2026 |
| B040278 | OOMI | 21.09.2026 | 19.10.2026 | 01.10.2026 |
| B040606 | OOMI | 23.09.2026 | 21.10.2026 | 01.10.2026 |
| B041109 | OOMI | 05.10.2026 | 25.10.2026 | 06.10.2026 |
| B041288 | OOMI | 21.09.2026 | 19.10.2026 | 01.10.2026 |
| B041491 | OOMI | 29.09.2026 | 23.10.2026 | 01.10.2026 |
| B041552 | OOMI | 24.09.2026 | 28.10.2026 | 01.10.2026 |
| B041700 | OOMI | 02.10.2026 | 17.10.2026 | 03.10.2026 |
| B042174 | OOMI | 30.09.2026 | 22.10.2026 | 01.10.2026 |
| B042506 | OOMI | 01.10.2026 | 31.10.2026 | 02.10.2026 |
| B042831 | OOMI | 24.09.2026 | 02.10.2026 | 01.10.2026 |
| B042851 | OOMI | 23.09.2026 | 21.10.2026 | 01.10.2026 |
| B043447 | OOMI | 21.09.2026 | 17.10.2026 | 01.10.2026 |
| B043592 | OOMI | 01.10.2026 | 09.10.2026 | 02.10.2026 |
| B043707 | OOMI | 23.09.2026 | 24.10.2026 | 01.10.2026 |
| B043946 | OOMI | 23.09.2026 | 23.10.2026 | 01.10.2026 |
| B044016 | OOMI | 30.09.2026 | 14.10.2026 | 01.10.2026 |
| B044110 | OOMI | 21.09.2026 | 04.10.2026 | 01.10.2026 |
| B044271 | OOMI | 01.10.2026 | 05.09.2026 | 02.10.2026 (historiallinen) |
| B044311 | OOMI | 01.10.2026 | 30.09.2026 | 02.10.2026 (historiallinen) |
| B044744 | OOMI | 30.09.2026 | 26.10.2026 | 01.10.2026 |
| B044795 | OOMI | 01.10.2026 | 31.10.2026 | 02.10.2026 |
| B045266 | OOMI | 24.09.2026 | 16.10.2026 | 01.10.2026 |
| B045377 | OOMI | 05.10.2026 | 18.10.2026 | 06.10.2026 |
| B046036 | OOMI | 01.10.2026 | 01.10.2026 | 02.10.2026 |

B041552, B042831 ja B045266 ovat § 9:n sallitun poikkeaman listalla (25.09.). Sen mukaan 2.0:n piti täyttää kenttä
päättymiskuussa, mutta ADR 0015 k12 estää sen, koska pyörät olivat jo status 2 (ks. varoitukset).

### R15: B015557

Tapa 1, `liab_settled_at` 12.10., IC-päivä tyhjä. 1199 käänsi pyörän 12.10. klo 00:01 lokiaikaa, 1480:n ajon jälkeen. Korjaantuu 1480:n ajossa 13.10.

## 3. Korjausehdotukset (vain `customrecord_sta_bike_register`)

| Pyörä | Kenttä | Nykyinen | Ehdotettu | Peruste |
|---|---|---|---|---|
| B041505 | `custrecord_gbb_liab_settle_method` | 3 | 1 | § 10 (pääte `2C` → tapa 1), ADR 0008 sääntö 1, R9. Ennen ajoa pitää selvittää tavan 3 kirjoittaja |
| B018311 | `custrecord_gbb_liab_settled_at` | 07.09.2026 | 17.09.2026 | ADR 0008 § *Vaikutus S1-importtiin*, ADR 0010 k4 |
| B031476 | `custrecord_gbb_liab_settled_at` | 04.09.2026 | 17.09.2026 | sama |
| 17 pyörää (§ 2) | `custrecord_gbb_redemption_decided_at` | ks. T7-CSV | T7-CSV:n `decided_at_uusi` | ADR 0010 k4. Aja T7 (P2 ensin) |
| 335 + 5 ei-OOMI (B004475, B015132, B015501, B023763, B026671) | `custrecord_gbb_liab_settled_at` | tyhjä | = `custrecord_gbb_redemption_paid_at` | § 9 *liab_settled_at tavoittain* (tapa 1 = maksupäivä), T38 |
| 30 OOMI (§ 2, ei historialliset) | `custrecord_gbb_liab_settled_at` | tyhjä | *vaatii ihmisen päätöksen*: `paid_at` vai tunnistuspäivä | § 9: OOMI-taulukko ja tavan 1 sääntö antavat eri arvon, kun maksu on tullut ennen OOMI-haaraa |
| B020053 | status tai tapa | 2 / 5 | *vaatii ihmisen päätöksen* | § 5, ADR 0007 k5, T55 |

Ei ehdoteta: B015557 (1480 korjaa), B008836, B026829, B044271 ja B044311 (kausi päättynyt).
