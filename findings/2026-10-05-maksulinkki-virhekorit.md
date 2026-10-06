# Maksulinkki 1.10.2026: ensimmäisen tuotantoajon virheet koreittain

Omistava repo: `netstuite-send-end-redemption-payment-link` (script 1479). Ohjeistus ja totuus:
[logiikkavirheet ja tavoitetila](2026-10-05-maksulinkki-logiikkavirheet-ja-tavoitetila.md) (tavoitekaava § 3.2, skenaariot S1–S13 § 4, päätökset § 7).
Pyörälista (vain virheelliset, 15 riviä): [`2026-10-05-maksulinkki-virhekorit.csv`](2026-10-05-maksulinkki-virhekorit.csv).
Vain luku, NetSuiteen ei kirjoitettu mitään. Data haettiin 5.10.2026 noin klo 10:30 Helsingin aikaa. (N) = todennettu NetSuitesta, (K) = laskettu tai päätelty.

## Yhteenveto

Arvioin kaikki 830 pyörää, jotka 1.10. tuotantoajo käsitteli. Jokaiselle laskettiin tavoitelopputulos ajohetken tilanteessa, ja sitä verrattiin siihen, mitä skripti teki.
**Virheellisiä pyöriä on 15: kymmenen neljässä korissa ja viisi muissa virheissä.** Loput 815 pyörää skripti käsitteli tavoitteen mukaisesti.

| Kori | Pyöriä | 1479-linkit, maksettu / avoin (5.10.) | Lähetetty brutto | Tavoitteen mukainen veloitus brutto | Ero brutto |
|---|---|---|---|---|---|
| **1** Linkki lähti, vaikka loppulunastustilaus oli jo olemassa (S4) | **7** (olemassa oleva tilaus ajohetkellä avoin 7, maksettu 0) | 1 / 6 | 303,01 € (maksettu 3,45, avoin 299,56) | 0 € (ei linkkiä) | +303,01 € ylimääräistä veloitusta. Olemassa olevat tilaukset 666,96 €, niistä 149,60 € maksettu 2.10. |
| **2** Linkki lähti, vaikka hyvitys kattoi hinnan (S12) | **2** | 0 / 2 | 243,48 € | 0 € (tapa 3) | +243,48 € |
| **3** Linkki oikein, mutta huoltohyvitys väärin (S13) | **1** (L2) | 0 / 1 | 164,41 € | 114,41 € | +50,00 € |
| **4** Linkki jäi lähettämättä, vaikka tavoite oli linkki | **0** | — | — | — | — |
| **Muut virheet** (tapa 3/4, vaikka tavoite oli ohitus) | **5** | — | 0 € | 0 € (ohitus) | Rahavaikutus syntyy aiheettomasta kirjauksesta: tavoitekaavan hinnat yhteensä 598,43 € (K) |
| Oikein, linkki lähti | 738 | 300 / 438 | 109 797,36 € | sama | 0 |
| Oikein, ei linkkiä | 77 | — | — | — | — |
| **Yhteensä** | **830** | | | | |

**Tärkeimmät havainnot:**
1. **Kuusi R1-pyörää (L1-hinta) kuuluu koriin 1, ei koriin 3** (N + K). Kaikilla kuudella oli manuaalinen loppulunastustilaus ennen ajoa, joten S4 ratkaisee ennen hintaa.
   Väärä summa on kirjattu "myös"-sarakkeeseen. Seitsemäs kori 1:n pyörä, B010348, sai oikean summan, mutta linkin ei olisi pitänyt lähteä.
2. **Kolmen L2-pyörän joukko jakautuu kahteen koriin** (K). B013412:lle ja B030445:lle tavoite oli tapa 3 ilman linkkiä (kori 2). B019989:lle tavoite oli linkki, mutta 50,00 € pienemmällä summalla (kori 3).
3. **Kori 4 on tyhjä** (N + K). Jokaisella pyörällä, jolle skripti ei lähettänyt linkkiä, tavoitekin oli ohitus tai kirjaus (S4, S5, S6 tai S8).
4. **Uusi havainto: kolmella tapa 3 -pyörällä on avoin manuaalinen loppulunastustilaus** (N). Kyse on B002668:sta (330899, 50,39 €), B003264:sta (330894, 58,25 €)
   ja B006941:stä (331083, 52,00 €). Tilaukset luotiin 31.7. ja ovat yhä maksettavissa, vaikka skripti kirjasi pyörät tavalla 3 ja ne ovat nyt status 2.
   Aiemmat raportit tarkistivat tilaukset vain 748 SENT-pyörältä, joten nämä jäivät huomaamatta.
5. **57 NOT_PRICED-pyörällä oli myös manuaalinen tilaus ennen ajoa** (N). Kaikki 57 ovat lisäksi jälkiveloituksessa. Skripti ei lähettänyt niille linkkiä, joten lopputulos oli oikea.
   54 tilausta on yhä avoimia, ja 3 maksettiin ajon jälkeen: B015132 1.10., B023763 2.10. ja B004475 4.10.

## Menetelmä

### Populaatio (N)

`scriptnote`, `scripttype = 1479`, lokipäivä 1.10.2026. Lokin kello on 03:01:21–03:09:03, ja se on UTC−7. Brevo-messageId:ssä ajan leima on `202610011001` = 10:01 UTC, eli Helsingissä
13:01–13:09. Lokirivejä on 833: 830 pyörää, joilla jokaisella on eri otsikko, sekä `selection`, `digest sent` ja `run complete`.
Jakauma on SENT 748, NOT_PRICED 69, SKIP_IN_PROGRESS 6, SKIP_LINKED_SO 1, SETTLED_MAINT_BUDGET 4 ja SETTLED_DOWN_PAYMENT 2. 30.09. testiajot eivät ole mukana, eikä B017530 ole lokissa.

### Ajohetken tila

- **Hinta, huoltosumma ja pidennys:** SENT- ja SETTLED_MAINT_BUDGET-riveillä luvut ovat lokin hintapolusta. Muilla ne ovat rekisterin nykyarvoja (5.10.).
  Lokin ja rekisterin arvot täsmäsivät jokaisella pyörällä, jolla loki kertoo ne (N). NOT_PRICED-rivien `dates say N month(s)` täsmää nykyiseen pidennykseen.
- **Jälkiveloitus (S5):** tyypin 7 CR, tila Done, `altname` sisältää *pidennys* eikä sisällä *2A*:ta, ja `lastmodified` on ennen 03:01:21 (lokin kello).
  Lokakuun CR:t 6891–6973 luotiin 1.10. klo 01:01–01:02 ja niitä muokattiin viimeksi klo 01:32–01:41 (N). Ne olivat siis Done ennen ajoa. Oletuksena on, että
  `scriptnote.date` ja CR:n `lastmodified` näytetään samalla kellolla (K). Molemmat ovat saman SuiteQL-istunnon arvoja.
  Muut tyypin 7 CR:t (*Jälkiveloitus*, *Jälkiveloitus - Poikkeus*, *2A - jälkiveloitus*) eivät ole S5:tä.
- **Olemassa oleva tilaus (S4):** `customrecord_payment_requests`, tuote `Työsuhdepyörän loppulunastus`, täsmäys `custrecord_pl_ns_bike_id = br.id` tai `custrecord_pl_notes = br.externalid`.
  Lisäksi raw_json:n `created_at` on ennen `2026-10-01T13:01:21+03:00`, eikä tilaus ole pyörän oma 1479-tilaus. Payment requests -taulun viimeisin muutos oli 5.10. klo 10:33 Helsingin aikaa (N).
- **S6** (lunastus-SO tai `end_red_so_created`) luetaan lokista (SKIP_IN_PROGRESS tai SKIP_LINKED_SO), koska lippu on muuttunut ajon jälkeen ainakin B036396:lla.
  S1–S3 ja S7 eivät täyty yhdelläkään: valinta ja tarkistus rajasivat ne pois, eikä lokissa ole NOT_ELIGIBLE-, ALREADY_SENT-, SKIP_SETTLED- tai SKIP_NO_PRICE-rivejä.
- **S9** on skriptin vertailu (pidennys > 0 ↔ huoltorivejä > 0), ja se ajetaan S4:n ja S5:n jälkeen. **S10** pidetään raportointina, koska päätös on yhä avoin. **S11** on ennallaan.

### Tavoitekaava (§ 3.2)

Porrastaulu `customrecord_sta_maint_extending_months` luettiin 5.10. (49 aktiivista riviä, `custrecord_sta_me_max_rate_excl_vat`) (N). Laskussa käytettiin skriptin pyöristystä (`round2`).
Huoltosumma > 0: hyvitys = pienin porras, jonka `max_rate_excl_vat` ≥ summa, miinus summa. Huoltosumma ≤ 0: hyvitys = −summa.
Netto = hinta − hyvitys, ja brutto = round2(netto × 1,255). Jos netto ≤ 0 tai brutto < 0,65 €, kyse on S12:sta.
Virheeksi luettiin tilanne, jossa tavoiteskenaario ≠ toteutunut lopputulos tai jossa linkki lähti ja |lokin netto − tavoitenetto| > 0,01 €.

### Kyselyt (uudelleenajettavat)

```sql
-- 1. Populaatio ja lopputulokset
SELECT REGEXP_SUBSTR(title,'paylink: [A-Z_]+') t, COUNT(*) c, COUNT(DISTINCT title) d
FROM scriptnote WHERE scripttype = 1479 AND date >= TO_DATE('2026-10-01','YYYY-MM-DD') AND date < TO_DATE('2026-10-02','YYYY-MM-DD')
GROUP BY REGEXP_SUBSTR(title,'paylink: [A-Z_]+')

-- 2. Lokirivit (hintapolku jäsennetään detail-kentästä, ks. hintapoikkeamat § Menetelmä)
SELECT TO_CHAR(date,'YYYY-MM-DD HH24:MI:SS') ts, title, detail FROM scriptnote
WHERE scripttype = 1479 AND date >= TO_DATE('2026-10-01','YYYY-MM-DD') AND date < TO_DATE('2026-10-02','YYYY-MM-DD')

-- apualikysely <POP> = käsitellyt pyörät
--   SELECT REGEXP_SUBSTR(title,'B[0-9]+$') FROM scriptnote WHERE scripttype = 1479
--    AND date >= TO_DATE('2026-10-01','YYYY-MM-DD') AND date < TO_DATE('2026-10-02','YYYY-MM-DD') AND title LIKE '%paylink: %B%'

-- 3. Rekisteri
SELECT br.id, br.name, br.externalid, br.custrecord_sta_bike_status st, br.custrecord_sta_end_redemption_price price,
       br.custrecord_sta_maintenance_sum maint, ROUND(MONTHS_BETWEEN(br.custrecord_sta_subsc_end_date, br.custrecord_sta_subsc_org_end_date)) ext_m,
       br.custrecord_gbb_eredem_link_sent ls, br.custrecord_gbb_liab_settle_method sm, br.custrecord_sta_end_red_so_created soc
FROM customrecord_sta_bike_register br WHERE br.name IN (<POP>)

-- 4. CR:t (S5 = ty 7, st 2, altname LIKE '%pidennys%', lastmodified < ajo)
SELECT cr.id, cr.custrecord_cr_bike_registry bike, cr.custrecord_cr_type ty, cr.custrecord_cr_status st, cr.altname,
       TO_CHAR(cr.created,'YYYY-MM-DD HH24:MI:SS') cre, TO_CHAR(cr.lastmodified,'YYYY-MM-DD HH24:MI:SS') lm
FROM customrecord_subscrption_change_request cr
WHERE cr.custrecord_cr_bike_registry IN (SELECT b.id FROM customrecord_sta_bike_register b WHERE b.name IN (<POP>))

-- 5. Paylink-tilaukset (S4 = loppulunastus, created_at < 2026-10-01T13:01:21+03:00, ei oma 1479-tilaus)
SELECT br.name, pr.custrecord_pl_order_id oid, pr.custrecord_pl_product_name prod, pr.custrecord_pl_status pst, pr.custrecord_pl_amount_total amt,
       REGEXP_SUBSTR(pr.custrecord_pl_raw_json,'"created_at":"[^"]+"') ca, REGEXP_SUBSTR(pr.custrecord_pl_raw_json,'"paid_at":"[^"]*"') pa
FROM customrecord_sta_bike_register br
JOIN customrecord_payment_requests pr ON (pr.custrecord_pl_ns_bike_id = br.id OR pr.custrecord_pl_notes = br.externalid)
WHERE br.name IN (<POP>)

-- 6. Huoltopidennysrivit (S9) ja porrastaulu
SELECT ar.custrecord_sta_bikeid bike, COUNT(ar.id) n FROM customrecord_sta_ca_agreement_row ar
WHERE ar.custrecord_sta_is_prolongation_line = 'T' AND ar.custrecord_sta_bikeid IN (SELECT b.id FROM customrecord_sta_bike_register b WHERE b.name IN (<POP>))
GROUP BY ar.custrecord_sta_bikeid
SELECT id, custrecord_sta_me_prolong_months m, custrecord_sta_me_max_rate_excl_vat net, isinactive FROM customrecord_sta_maint_extending_months
```

Kyselyt 2–6 ajettiin REST-SuiteQL:llä (`tools/netsuite-auth.mjs`, vain luku), ja ne palauttivat 833, 830, 191, 819, 109 ja 49 riviä. Kysely 1 ajettiin MCP:llä.
Liitos `notes = externalid` toimi, kun pyörät rajattiin `<POP>`-listaan.

## Kori 1: linkki lähti, vaikka loppulunastustilaus oli jo olemassa (S4), 7 pyörää

Kaikki tiedot (N), paitsi tavoitekaavan summa (K). Kaikilla seitsemällä olemassa oleva tilaus oli **ajohetkellä avoin**. Yhdelläkään ei ollut ajon hetkellä maksettua tilausta.
Täsmäys toimii kaikilla sekä bike id:llä että `notes`:lla.

| Pyörä | 1479-tilaus (tila 5.10.) | Lähetetty brutto | Tavoite | Tavoitekaavan summa brutto (teoreettinen) | Ero (lähetetty − tavoite 0) | Olemassa oleva tilaus, luotu, tila 5.10. | Myös | Peruste |
|---|---|---|---|---|---|---|---|---|
| B001767 | 351153 (2099) pending | 9,96 | S4 ohita | 169,96 | +9,96 | 330864, 91,32 €, 31.07., pending | S5 (6441, 6891); L1-summa −160,00 | manuaalitilaus, jälkiveloitus |
| B002022 | 351155 (2101) pending | 55,77 | S4 ohita | 135,77 | +55,77 | 340714, 57,12 €, 31.08., pending | S5 (6893); L1 −80,00 | sama |
| B003047 | 351160 (2106) pending | 111,07 | S4 ohita | 191,07 | +111,07 | 340722, 112,42 €, 31.08., pending | S5 (6896); L1 −80,00 | sama |
| B003243 | 351161 (2107) pending | 21,07 | S4 ohita | 181,07 | +21,07 | 330910, 102,42 €, 31.07., pending | S5 (6451, 6898); L1 −160,00 | sama |
| B006488 | 351359 (1785266682440) **completed 1.10.** | 3,45 | S4 ohita | 163,45 | +3,45 | 331081, 84,08 €, 31.07., pending | S5 (6473, 6924); L1 −160,00 | sama. Pyörä nyt status 2, tapa 1 |
| B010348 | 351433 (1785266682514) pending | 33,28 | S4 ohita | 33,28 | +33,28 | 331600, 70,00 €, 31.07., pending | — | manuaalitilaus. Summa itsessään tavoitekaavan mukainen |
| B023007 | 351659 (1785266682739) pending | 68,41 | S4 ohita | 148,42 | +68,41 | 341038, 149,60 €, 31.08., **completed 2.10.** | S5 (6951); L1 −80,01 | sama. Pyörä nyt status 2, tapa 1 |
| **Yhteensä** | 1 maksettu / 6 avointa | **303,01** | | | **+303,01** | 666,96 € (149,60 maksettu) | | |

Kahdella maksettavalla tilauksella on edelleen viisi pyörää: B001767, B002022, B003047, B003243 ja B010348 (N). B006488:n manuaalitilaus ja B023007:n 1479-tilaus ovat avoimia, vaikka lunastus on jo maksettu.

## Kori 2: linkki lähti, vaikka hyvitys kattoi hinnan (S12), 2 pyörää

| Pyörä | 1479-tilaus (tila 5.10.) | Hinta netto | Huoltosumma | Pidennys | Lähetetty brutto | Tavoite | Tavoite netto / brutto | Ero brutto | Myös | Peruste |
|---|---|---|---|---|---|---|---|---|---|---|
| B013412 | 351492 (1785266682572) pending | 67,00 | −272,27 | 0 | 84,09 | S12 tapa 3, ei linkkiä | −205,27 / 0,00 | +84,09 | — | L2: summa < 0 ilman pidennystä → skripti antoi hyvitykseksi 0 |
| B030445 | 351781 (24690) pending | 127,00 | −175,30 | 0 | 159,39 | S12 tapa 3, ei linkkiä | −48,30 / 0,00 | +159,39 | — | sama |
| **Yhteensä** | 0 / 2 | | | | **243,48** | | | **+243,48** | | |

Hinta, summa ja pidennys (N), tavoite (K). Kummallakaan ei ole jälkiveloitus-CR:ää eikä muuta loppulunastustilausta (N).

## Kori 3: linkki oikein, mutta huoltohyvitys väärin (S13), 1 pyörä

| Pyörä | 1479-tilaus (tila 5.10.) | Hinta netto | Huoltosumma | Pidennys | Lähetetty netto / brutto | Tavoite netto / brutto | Ero brutto | Syy | Myös |
|---|---|---|---|---|---|---|---|---|---|
| B019989 | 351609 (1785266682689) pending | 131,00 | −39,84 | 0 | 131,00 / 164,41 | 91,16 / 114,41 | **+50,00** (liikaa) | L2 | — |

Yhtään L1-tapausta (pidennysankkuri) ei jäänyt koriin 3. Kaikki kuusi L1-linkkiä ovat korissa 1. Muilla 738 SENT-pyörällä lähetetty netto = tavoitenetto ±0,01 € (N + K).

## Kori 4: linkki jäi lähettämättä, vaikka tavoite oli linkki, 0 pyörää

Jokaiselle skriptin ohittamalle tai kirjaamalle pyörälle (82) tavoitteena oli jokin S4, S5, S6, S8 tai S12, ei S13 (K). Esimerkiksi kaikki 69 NOT_PRICED-pyörää ovat
jälkiveloituksessa (S5), ja 57:llä niistä on lisäksi manuaalitilaus (S4).

## Muut virheet (ei koreissa), 5 pyörää

Skripti kirjoitti tavan 3 tai 4, vaikka tavoite oli ohitus. Kaikki viisi ovat jälkiveloituksessa (L4), ja tavan 3 pyörien hyvitys on L1:n paisuttama.
Nyt kaikki ovat status 2 ja niiden tapa on sama kuin skriptin kirjaama (N).

| Pyörä | Lopputulos 1479 | Hinta netto | Huoltosumma | Pidennys / summan kk | Jälki-CR:t | Tavoite | Tavoitekaavan summa brutto (K) | Olemassa oleva tilaus | Peruste |
|---|---|---|---|---|---|---|---|---|---|
| B002668 | SETTLED_MAINT_BUDGET, tapa 3 | 148 | 275,04 | 7 / 5 | 6445, 6894 | **S4** ohita (myös S5) | 129,93 | **330899, 50,39 €, 31.07., pending** | L1 + L4. Avoin manuaalitilaus on yhä maksettavissa |
| B002729 | SETTLED_MAINT_BUDGET, tapa 3 | 161 | 62,95 | 4 / 1 | 4740, 6446, 6895 | **S5** ohita | 200,07 | — | L1 + L4 |
| B003264 | SETTLED_MAINT_BUDGET, tapa 3 | 150 | 151,39 | 5 / 3 | 6452, 6899 | **S4** ohita (myös S5) | 137,26 | **330894, 58,25 €, 31.07., pending** | L1 + L4. Avoin manuaalitilaus |
| B006941 | SETTLED_MAINT_BUDGET, tapa 3 | 134 | 162,54 | 5 / 3 | 6475, 6926 | **S4** ohita (myös S5) | 131,17 | **331083, 52,00 €, 31.07., pending** | L1 + L4. Avoin manuaalitilaus |
| B046508 | SETTLED_DOWN_PAYMENT, tapa 4 | 0 | 0 | 2 / 0 | 6513, 6972 | **S5** ohita | — (hinta 0) | — | L4. R5 ja R6 auki käsittelylokissa |

Tavoitekaavalla yksikään tapa 3 -kirjaus ei olisi syntynyt edes ilman S4:ää ja S5:tä. Hinnat olisivat yhteensä 598,43 € brutto (K).
Tavoitteen mukainen loppu on jälkiveloitusketjussa (tapa 1 tai 2), ei tässä skriptissä.

## Oikein käsitellyt

| Luokka | Pyöriä |
|---|---|
| SENT, tavoite S13, summa oikein: täysi hinta | 643 (98 722,82 €) |
| SENT, tavoite S13, summa oikein: huoltohyvitys | 95 (11 074,54 €) |
| NOT_PRICED, tavoite S4 (manuaalitilaus; kaikki myös S5) | 57 |
| NOT_PRICED, tavoite S5 (jälkiveloitus, ei tilausta) | 12 |
| SKIP_IN_PROGRESS, tavoite S4 (B012880, tilaus 343445 maksettu 7.9.) | 1 |
| SKIP_IN_PROGRESS, tavoite S5 (B001876, B019460, B036396) | 3 |
| SKIP_IN_PROGRESS, tavoite S6 (B011223, B031422) | 2 |
| SKIP_LINKED_SO, tavoite S4 (B026671, tilaus 345784 maksettu 30.9.) | 1 |
| SETTLED_DOWN_PAYMENT, tavoite S8 (B046755) | 1 |
| **Yhteensä oikein** | **815** (738 linkillä, 77 ilman linkkiä) |

Edellisen raportin 96 OK-hyvitystä = tämän taulun 95 + B010348 (kori 1).

## Täsmäytys 830:een

| | Pyöriä |
|---|---|
| Kori 1 | 7 |
| Kori 2 | 2 |
| Kori 3 | 1 |
| Kori 4 | 0 |
| Muut virheet | 5 |
| Oikein, linkki | 738 |
| Oikein, ei linkkiä | 77 |
| **Yhteensä** | **830** = SENT 748 (7 + 2 + 1 + 738) + NOT_PRICED 69 + SKIP_IN_PROGRESS 6 + SKIP_LINKED_SO 1 + SETTLED_MAINT_BUDGET 4 + SETTLED_DOWN_PAYMENT 2 |

## Rajoitukset

- Paylinkistä poistetut tilaukset eivät näy NetSuitessa (K). S4:n täsmäys tehtiin vain bike id:llä ja `notes` = `externalid`.
  Aiempi laajempi haku (S- ja P-numerot, tilauskoodit) ei löytänyt 3.10. SENT-pyörille muita osumia ([ylimääräiset viestit](2026-10-03-maksulinkki-ylimaaraiset-viestit.md) § 3).
- Kahdella SENT-pyörällä on muu kuin loppulunastustuote: B018528 (vuokrat 1.6.–31.7.) ja B046796 (*Itsehankinnan käsiraha*). Ne eivät ole S4:ää (N).
- Lunastuksen tilat ("pending", "completed") ovat NetSuiten synkronoimaa tilaa 5.10. klo 10:33 (N), eivät Paylinkin reaaliaikaista tilaa.
