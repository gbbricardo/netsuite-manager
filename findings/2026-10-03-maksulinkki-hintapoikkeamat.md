# Maksulinkki lokakuu 2026: hintapoikkeamat, kaikki 748 linkkiä

Omistava repo: `netstuite-send-end-redemption-payment-link` (script 1479). Pyörälista: [`2026-10-03-maksulinkki-hintapoikkeamat.csv`](2026-10-03-maksulinkki-hintapoikkeamat.csv)
(kaikki 748 linkkiä, myös OK-rivit). Lähetysvirheet, joista tämä lista ei kerro (tuplatilaukset, jälkiveloituksessa olleet pyörät), ovat
[`2026-10-03-maksulinkki-ylimaaraiset-viestit.md`](2026-10-03-maksulinkki-ylimaaraiset-viestit.md):ssä. Tausta: [ensimmäinen ajo](2026-10-02-maksulinkki-ensimmainen-ajo.md)
ja [käsittelyloki](2026-10-02-maksulinkki-kasittelyloki.md) (R1–R7).
Vain luku: NetSuiteen ei kirjoitettu mitään. (N) = todennettu NetSuitesta 3.10.2026. (K) = laskettu tai päätelty.

## Yhteenveto

**Vertailuperuste on tuoteomistajan sääntö 1 (2.10.2026).** Hyvitys = (pienin bracket, jonka netto-yläraja ≥ `maintenance_sum`) − `maintenance_sum`.
Taulun rivi *0 kk, yläraja 0* kattaa summat ≤ 0, joten silloin hyvitys = 0 − summa. Odotettu linkin netto = max(0, hinta − hyvitys) ja brutto = netto × 1,255.
Pidennys ei vaikuta.

| Luokka | Linkkejä | Maksettu / avoin | Linkit yhteensä (brutto) | Ero sääntö 1:een (brutto) |
|---|---|---|---|---|
| **OK-täysi** (ei huoltoa, linkki = hinta) | 643 | 248 / 395 | 98 722,82 € | 0 |
| **OK-hyvitys** (ero = sääntö 1:n hyvitys ±0,01) | 96 | 29 / 67 | 11 107,82 € | 0 |
| **Virhe R1** (jälkiveloituskuukaudet hyvitettiin huoltobudjettina) | **6** | 1 / 5 | 269,73 € | **−720,01 €** (liian vähän). Maksettu −160,00, avoimet −560,01 |
| **Virhe ratchet / muu pidennysero** | **0** | — | — | — |
| **Virhe muu: summa < 0, ei pidennystä** | **3** | 0 / 3 | 407,89 € | **+293,48 €** (liikaa, kaikki avoimia) |
| **Virhe muu** (pyöristys, ALV, Paylink ≠ loki, loki ≠ rekisteri) | **0** | — | — | — |
| **Yhteensä** | **748** | 278 / 470 | 110 508,26 € | 9 virheellistä |

**Tärkeimmät havainnot:**
1. **739 linkkiä 748:sta on sääntö 1:n mukaisia (N + K).** Niissä pidennys = huoltosumman edellyttämä kuukausimäärä, joten skriptin ja sääntö 1:n ankkuri antavat saman tuloksen.
   OK-hyvitysten hyvitykset ovat 0,78–63,74 € netto, eli jokainen on alle 64,54 €:n. Yhteensä niitä on 2 903,14 € netto.
2. **R1-pyöriä on yhä tasan kuusi** (B001767, B002022, B003047, B003243, B006488, B023007). Kaikilla `leaseExtension − summan_kk` = Done-tilaisten *pidennys – jälkiveloitus* -CR:ien määrä (N).
   Sääntö 1:n hinnatkin ovat vain teoreettisia, koska näille ei olisi pitänyt lähettää linkkiä ollenkaan (R3, ks. *Logiikkavirheet* L3).
3. **Uusi virheluokka: negatiivinen huoltosumma ilman pidennystä (N + K).** Skripti hyvittää vain, kun pidennys > 0 (`lib_gbb_redemption_price.js:163-165`).
   Sääntö 1 hyvittää summasta riippumatta pidennyksestä. Pyörät B013412 (−272,27), B019989 (−39,84) ja B030445 (−175,30) saivat täyden hinnan.
   Sääntö 1 antaisi B019989:lle 114,41 € ja kahdelle muulle **0 €**. Summat ovat Taru Vikmanin CSV-importista 10.4.2026 (systemnote, N).
   **Hyvityksen ylärajasta on päätettävä ennen 31.10.** (kohta *Avoimet kysymykset*). Marraskuun kohortissa sama koskee kolmea pyörää ja joulukuun kohortissa kahta.
4. **Paylinkiin meni täsmälleen se, mitä loki sanoo (N).** Kaikilla 748:lla `custrecord_pl_amount_total` = lokin brutto, `custrecord_pl_amount_base` = lokin netto ja `notes` = pyörän `externalid`.
   Netto × 1,255 täsmää lokin bruttoon jokaisella rivillä. Pyöristys- ja ALV-virheitä ei ole.
5. **Rekisterin hinta, huoltosumma ja pidennys ovat 3.10. samat kuin ajon aikana** kaikilla 748:lla (N). Ajon jälkeen niitä ei siis ole muutettu.
6. **Ratchet-tapauksia (summa ≤ 0 ja pidennys > 0) ei lokakuussa ollut yhtään (N).** B021054 päättyy vasta 2028.

## Menetelmä

Kaikki data haettiin 3.10.2026 SuiteQL:llä (REST, vain luku, `tools/netsuite-auth.mjs`) ja tarkistettiin MCP:llä. Lokin `detail` jäsennettiin säännöllisellä lausekkeella,
ja laskelma tehtiin skriptin omalla pyöristyksellä (`round2`: `Math.round(Number((v*100).toFixed(6)))/100`).

**1. Ajot (N).** Lokakuussa on kaksi ajoa. 30.09. ja 29.09. (lokipäivä) olivat testi- ja dry run -ajoja (`paylink=test` tai `dryRun=true`), joten ne on jätetty pois.

| Loki (runtime) | Helsinki | Valittu | Tulos |
|---|---|---|---|
| 1.10. 03:01–03:09 | 1.10. 13:01 | 830 | `SENT=748 NOT_PRICED=69 SKIP_IN_PROGRESS=6 SKIP_LINKED_SO=1 SETTLED_MAINT_BUDGET=4 SETTLED_DOWN_PAYMENT=2` |
| 2.10. 03:01 | 2.10. 13:01 | 74 | `NOT_PRICED=69 SKIP_IN_PROGRESS=5`, ei yhtään SENT- tai settlement-riviä |

3.10. ajoa ei ollut lokissa haun hetkellä. Kaikki 748 SENT-riviä ovat 1.10. ajosta, ja niissä on 748 eri pyörää. Testipyörä B017530 ei ole lokissa.

```sql
-- ajot ja tulokset
SELECT TO_CHAR(date,'YYYY-MM-DD HH24:MI') ts, title, SUBSTR(detail,1,400) d FROM scriptnote
WHERE scripttype = 1479 AND date >= TO_DATE('2026-10-01','YYYY-MM-DD')
  AND (title LIKE '%selection%' OR title LIKE '%run complete%') ORDER BY date

-- SENT-rivien hintapolku jäsennettynä
SELECT SUBSTR(title, INSTR(title,'SENT ')+5) bike,
       REGEXP_SUBSTR(REGEXP_SUBSTR(detail,'\(id [0-9]+'),'[0-9]+') order_id,
       TO_NUMBER(REGEXP_SUBSTR(REGEXP_SUBSTR(detail,'\| -?[0-9.]+ netto'),'-?[0-9.]+')) price_net,
       TO_NUMBER(REGEXP_SUBSTR(REGEXP_SUBSTR(detail,'maintenance -?[0-9.]+'),'-?[0-9.]+')) maint,
       TO_NUMBER(REGEXP_SUBSTR(REGEXP_SUBSTR(detail,'leaseExtension -?[0-9]+'),'-?[0-9]+')) ext_m,
       TO_NUMBER(REGEXP_SUBSTR(REGEXP_SUBSTR(detail,'-?[0-9.]+ brutto'),'-?[0-9.]+')) gross
FROM scriptnote WHERE scripttype = 1479 AND date >= TO_DATE('2026-10-01','YYYY-MM-DD') AND title LIKE '%paylink: SENT %'
```

Lokin muoto: `Paylink order <display_id> (id <order_id>, <url>) to <email>, Brevo messageId … | <hinta> netto - <hyvitys> remainder (bracket <rivin id> max <yläraja>, source field|no-extension, maintenance <summa>, leaseExtension <kk> mo) = <netto> netto -> <brutto> brutto @ 25.5 % = …`.
`bracket N` on taulun **rivin id**, ei kuukausimäärä (rivi 8 = 7 kk).

**2. Bracket-taulu (N).** `customrecord_sta_maint_extending_months` sisältää 49 aktiivista riviä. `custrecord_sta_me_max_rate_excl_vat` on nyt täytetty jokaisella rivillä
(loki: `source field`), ja se on sama kuin brutto/(1 + 25,5/100). Rivi id 1 on 0 kk, yläraja 0. Ylärajat: 1 kk 64,53 · 2 kk 128,28 · 3 kk 192,02 · 4 kk 255,77 · 5 kk 319,51 ·
6 kk 383,26 · 7 kk 447,00 · 8 kk 510,75 … 48 kk 3 060,55.

**3. Paylink-tilaukset (N).** Haku `custrecord_pl_order_id IN (<748 lokin id:tä>)` palauttaa 748 riviä (tuote *Työsuhdepyörän loppulunastus*).
Riveistä 278 on tilassa `completed`/3 ja 470 tilassa `pending`/6. Vertailtiin `amount_total` vs. lokin brutto, `amount_base` vs. lokin netto ja `notes` vs. `externalid`. Poikkeamia ei ole.

**4. Rekisteri ja CR:t (N).** Kaikille 830 lokissa olevalle pyörälle haettiin `end_redemption_price`, `maintenance_sum`, `subsc_org_end_date`, `subsc_end_date`, nykyinen
`MONTHS_BETWEEN`, huoltopidennysrivit (`is_prolongation_line = 'T'`, kaikki ja item 30) sekä kaikki CR:t. **Jälki-CR** = tyyppi 7, status 2 (Done), ja altname sisältää sekä
*pidennys* että *jälkiveloitus*. Muut tyypin 7 CR:t (*2A - jälkiveloitus*, *Jälkiveloitus*, *Jälkiveloitus - Poikkeus*) eivät siirrä päättymispäivää jälkiveloitusketjussa, joten niitä ei laskettu.

```sql
-- pidennys vs. summan kk ja jälki-CR:t lähetetyille (tarkistus korjauksen jälkeen: 0 riviä, joilla ext_m <> implied_m)
SELECT br.name, br.custrecord_sta_end_redemption_price price, br.custrecord_sta_maintenance_sum maint,
       ROUND(MONTHS_BETWEEN(br.custrecord_sta_subsc_end_date, br.custrecord_sta_subsc_org_end_date)) ext_m,
       (SELECT MIN(m.custrecord_sta_me_prolong_months) FROM customrecord_sta_maint_extending_months m
         WHERE m.isinactive = 'F' AND m.custrecord_sta_me_max_rate_excl_vat >= NVL(br.custrecord_sta_maintenance_sum,0)) implied_m,
       (SELECT COUNT(cr.id) FROM customrecord_subscrption_change_request cr WHERE cr.custrecord_cr_bike_registry = br.id
         AND cr.custrecord_cr_type = 7 AND cr.custrecord_cr_status = 2 AND LOWER(cr.altname) LIKE '%pidennys%') jalki
FROM customrecord_sta_bike_register br WHERE br.custrecord_gbb_eredem_link_sent = 'T'
```

**5. Luokittelu (K).** ero = lokin netto − odotettu netto. |ero| ≤ 0,01 → OK (hyvitys 0 → OK-täysi, muuten OK-hyvitys). Muuten: jälki-CR > 0 ja `leaseExtension − summan_kk` = jälki-CR:t → R1.
Pidennys ≠ summan kk → ratchet/pidennysero. Summa < 0 → Virhe muu: summa < 0. Muuten Virhe muu. Paylink-, pyöristys- ja rekisterierot olisi luokiteltu Virhe muuksi, mutta niitä ei ollut.

## Virhetaulukot

### Virhe R1 — 6 linkkiä, liian pieni summa

Kaikki arvot (N), paitsi odotettu (K). Order = Paylink id (display_id).

| Pyörä | Order | Hinta netto | Huolto netto | Pidennys | Summan kk | Jälki-CR:t | Linkki netto | Odotettu netto | Linkki brutto | Odotettu brutto | Ero brutto | Maksettu? |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| B001767 | 351153 (2099) | 161 | 230,20 | 6 | 4 | 6441, 6891 | 7,94 | 135,43 | 9,96 | 169,96 | **−160,00** | ei |
| B002022 | 351155 (2101) | 161 | 202,95 | 5 | 4 | 6893 | 44,44 | 108,18 | 55,77 | 135,77 | **−80,00** | ei |
| B003047 | 351160 (2106) | 161 | 183,27 | 4 | 3 | 6896 | 88,50 | 152,25 | 111,07 | 191,07 | **−80,00** | ei |
| B003243 | 351161 (2107) | 161 | 47,81 | 3 | 1 | 6451, 6898 | 16,79 | 144,28 | 21,07 | 181,07 | **−160,00** | ei |
| B006488 | 351359 (1785266682440) | 139 | 119,52 | 4 | 2 | 6473, 6924 | 2,75 | 130,24 | 3,45 | 163,45 | **−160,00** | **kyllä 1.10.** |
| B023007 | 351659 (1785266682739) | 120 | 190,28 | 4 | 3 | 6951 | 54,51 | 118,26 | 68,41 | 148,42 | **−80,01** | ei (manuaalitilaus 341038 maksettu 2.10.) |

**Syy:** skripti valitsee bracketin `leaseExtension`:n mukaan, ja `handler_jalki` on siirtänyt `subsc_end_date`:a kuukaudella jokaista jälki-CR:ää kohden.
Jokainen jälki-CR antaa yhden ylimääräisen bracketin hyvitystä, eli 63,75 € netto (80,00 € brutto). **Kaikilla kuudella on lisäksi manuaalitilaus**, eikä linkkiä olisi pitänyt lähettää lainkaan
([ylimääräiset viestit](2026-10-03-maksulinkki-ylimaaraiset-viestit.md), luokka A + C). Asiakaspalvelun luovutus on [käsittelylokissa](2026-10-02-maksulinkki-kasittelyloki.md#luovutus-asiakaspalvelulle).

### Virhe muu: summa < 0 ilman pidennystä — 3 linkkiä, liian suuri summa sääntö 1:n mukaan

| Pyörä | Order | Hinta netto | Huolto netto | Pidennys | Summan kk | Linkki brutto | Odotettu brutto (sääntö 1) | Ero brutto | Jos hyvitys rajataan 64,54 €:oon (K) | Maksettu? |
|---|---|---|---|---|---|---|---|---|---|---|
| B013412 | 351492 (1785266682572) | 67 | −272,27 | 0 | 0 | 84,09 | **0,00** (hyvitys 272,27 > hinta → tapa 3) | **+84,09** | 3,09 € | ei |
| B019989 | 351609 (1785266682689) | 131 | −39,84 | 0 | 0 | 164,41 | 114,41 | **+50,00** | 114,41 € (alle rajan) | ei |
| B030445 | 351781 (24690) | 127 | −175,30 | 0 | 0 | 159,39 | **0,00** (hyvitys 175,30 > hinta → tapa 3) | **+159,39** | 78,39 € | ei |

**Summien alkuperä (N, systemnote, kenttä `CUSTRECORD_STA_MAINTENANCE_SUM`):**
- B013412: Staria RWS 29.9.2025 272,27, sitten Taru Vikman CSV 10.4.2026 −272,27.
- B019989: Staria 39,84, sitten CSV −39,84.
- B030445: Staria 0, sitten CSV −175,30.

Samana päivänä CSV muutti kenttää 302 rivillä, ja 180:ssä niistä uusi arvo oli negatiivinen (N). Huoltopidennystä ei ole millään kolmesta (pidennys 0, rivejä 0).

**Tulkinta (K):** skriptin sääntö (*ei pidennystä → ei hyvitystä*, `lib_gbb_redemption_price.js:141` ja `:163-165`) poikkeaa sääntö 1:stä aina, kun summa on negatiivinen.
B021054-päätös (−35,06 → hyvitys 35,06) koski pyörää, jolla on pidennys. Pidennyksettömästä negatiivisesta summasta tuoteomistaja ei ole päättänyt erikseen.
Sääntö 1:n kirjaimellinen tulos on kuitenkin yksiselitteinen. Negatiivinen summa on myös yleinen: aktiivisia pyöriä, joilla summa on negatiivinen, on 834 (N). OOMI-pyöriä on 708,
ja ne ovat maksulinkin ulkopuolella. **Muita on 126.** Niistä 42:lla summa on alle −64,53 (pienin −359,52), ja vain yhdellä on pidennys (N).
Hyvityksen yläraja ei siis ole pieni reunakysymys, kuten R4:ssä arvioitiin.

### Virhe ratchet / muu pidennysero ja Virhe muu — 0 linkkiä

Muissa 739 linkissä pidennys = summan kk (N). Lokakuussa ei ollut yhtään pyörää, jolla summa ≤ 0 ja pidennys > 0, joten ratchet-hyvitystä ei annettu kenellekään.
Paylink-summa, ALV, pyöristys ja rekisterin nykyarvot täsmäävät lokiin kaikilla 748:lla.

## Skriptin lokakuussa kirjoittamat settlementit

| Pyörä | Tapa | Hinta netto | Huolto netto | Pidennys / summan kk | Jälki-CR:t | Skriptin hyvitys | Sääntö 1:n hyvitys | Sääntö 1:n hinta brutto | Linkki sääntö 1:llä? |
|---|---|---|---|---|---|---|---|---|---|
| B002668 | 3 | 148 | 275,04 | 7 / 5 | 6445, 6894 | 171,96 | 44,47 | 129,93 € | kyllä, mutta jälkiveloituksessa → ei linkkiä (L3) |
| B002729 | 3 | 161 | 62,95 | 4 / 1 | 4740, 6446, 6895 | 192,82 | 1,58 | 200,07 € | sama |
| B003264 | 3 | 150 | 151,39 | 5 / 3 | 6452, 6899 | 168,12 | 40,63 | 137,26 € | sama |
| B006941 | 3 | 134 | 162,54 | 5 / 3 | 6475, 6926 | 156,97 | 29,48 | 131,17 € | sama |
| B046508 | 4 | 0 | — | 2 / 0 | 6513, 6972 | — | — | 0 € | ei (hinta 0). R5 ja R6 auki |
| B046755 | 4 | 0 | 0 | 0 / 0 | — | — | — | 0 € | ei (hinta 0). R5 auki |

Lähteet: (N) loki, rekisteri ja CR:t. Sääntö 1:n arvot (K).
- **Sääntö 1:llä yksikään tapa 3 -settlement ei olisi syntynyt.** Kaikkien neljän hinta olisi ollut > 0, yhteensä 598,43 € brutto.
- Oikea lopputulos ei ole linkki vaan tapa 2, kun jälkiveloitusvuokrat kattavat lunastusmaksun (päätös 2.10., R2). Kaikki neljä ovat nyt status 2, tapa 3 (N).
- B006956 (30.09. testiajo, tapa 3) on sääntö 1:n mukainen: 5 kk = summan 5 kk (käsittelyloki), eikä sillä ole CR:iä.

## NOT_PRICED: mitä sääntö 1 antaisi (69 pyörää 1.10., 69 pyörää 2.10.)

Rivit (N), hinnat (K).

| Ryhmä | Pyöriä | Sääntö 1 | Pitäisikö lähettää? |
|---|---|---|---|
| Summa 0, 1–5 jälki-CR:ää, pidennys = CR:ien määrä, ei huoltorivejä (*sources disagree*) | 68 (66 status 1; B015132 ja B023763 maksoivat 1.–2.10., nyt status 2, tapa 1) | Täysi hinta. 69:n yhteissumma 11 138,35 € brutto, status 1 -pyörillä 10 815,81 € | **Ei.** Kaikki ovat jälkiveloituksessa (R3). Check 7 esti ne sattumalta oikein |
| B010533: summa 265,93 (5 kk), pidennys 4, 2 jälki-CR:ää, huoltorivejä 2 | 1 | Hyvitys 53,58 > hinta 49 → 0 € (tapa 3) | Ei. Jälkiveloituksessa. Lisäksi pidennys (2 kk huoltoa + 2 jälki) ei vastaa summan 5 kk:ta, ks. ad-hoc `netsuite-fix-bike-register-prolongations` (10533 käsin korjattava) |

**Ero ajojen välillä (N):** B015132 putosi pois 2.10. (status 2), ja B036396 tuli tilalle. Sen `end_red_so_created` oli 1.10. T (SKIP_IN_PROGRESS), mutta 2.10. F.
Joku tai jokin tyhjensi lipun ajojen välillä. Pyörällä on kolme jälki-CR:ää. Sääntö 1:llä se saisi täyden hinnan 136,80 €, vaikka sille ei kuulu linkkiä (L3).

**SKIP-pyörät (N, sivuhuomio):** B001876 (3 jälki-CR:ää, sääntö 1 → 157,46 €), B011223, B012880 (`paid_at` 7.9., silti status 1), B019460 (2 jälki-CR:ää), B031422 ja B026671 (SO).
Ohitus perustuu lippuun, ei hintaan, joten ne eivät kuulu tähän vertailuun.

## Katse eteenpäin: marraskuun kohortti (31.10. ajo), simulointi 3.10. datalla (K)

Valintaehdot skriptin mukaan (Active, ei OOMI, `link_sent` ≠ T, ei tapaa, `subsc_end_date` 1.–30.11.): **818 pyörää** (N). Skriptin nykyinen logiikka ja sääntö 1 ajettiin rinnakkain:

| Tulos | Pyöriä | Sääntö 1 |
|---|---|---|
| Linkki, sama hinta | 809 | OK |
| **Linkki, summa < 0, ei pidennystä** | **3** | B010178 (−116,18): 183,23 → 37,42 €, B026604 (−54,90): 122,99 → 54,09 €, B036945 (−26,37): 76,56 → 43,46 €. Ylilaskutus yhteensä 247,81 € brutto |
| NOT_PRICED, pidennys lyhyempi kuin summa edellyttää | 2 | B003526 (summa 283,67 → 5 kk, pidennys 4) ja B016922 (266,93 → 5 kk, pidennys 3). Sääntö 1 hinnoittelisi ne |
| NOT_PRICED, *sources disagree*: huoltorivejä on, mutta päättymispäivää ei ole siirretty | 3 | B026739, B027537, B031836 (`org_end` 30.11., pidennys 0, 2 huoltoriviä). **Todellinen päättyminen on luultavasti myöhemmin**, joten linkki menisi liian aikaisin. Tämä vartija on pidettävä myös sääntö 1:n kanssa |
| Tapa 4 (hinta 0) | 1 | B046661 |

Joulukuun kohortissa summa < 0 on lisäksi B004963:lla (−22,31) ja B030178:lla (−15,94) (N).
Jälkiveloituspyöriä marraskuun valinnassa ei ole 3.10. (N). 1.11. extension-ajo kuitenkin siirtää lokakuussa maksamatta jääneiden manuaalikohorttien päättymispäivät 30.11.:een.
Jos `link_sent`-täyttöä ja jälki-CR-vartijaa (L3) ei tehdä, ne palaavat 2.11. ajoon.

## Avoimet kysymykset tuoteomistajalle

1. **Negatiivinen huoltosumma ilman pidennystä:** hyvitetäänkö 0 − summa kokonaan (sääntö 1 kirjaimellisesti), rajataanko hyvitys 64,54 €:oon, vai ei hyvitetä mitään
   (skriptin nykyinen toiminta)? Lokakuussa koskee kolmea avointa linkkiä, joissa on 293,48 € ylilaskutusta, ja 31.10. kolmea pyörää. Taustalla on 10.4.2026 CSV-import,
   jonka merkitys (hyvitetty huolto? takuu?) on selvitettävä Taru Vikmanilta.
2. **R7 on yhä auki:** manuaaliprosessi hinnoitteli 5/6 R1-pyörästä yhden bracketin sääntö 1:tä alemmaksi. Tässä raportissa odotusarvona on sääntö 1.
3. **Pidennys lyhyempi kuin summa edellyttää** (B003526, B016922, B010533): hinnoitellaanko sääntö 1:llä, vai pidetäänkö raportointi? Ehdotus: pidetään raportointi, koska kyse on rekisterin datavirheestä.

## Skriptin logiikkavirheet

Yhdistää tämän listan ja [ylimääräisten viestien](2026-10-03-maksulinkki-ylimaaraiset-viestit.md) lähetysvirheet. Koodiviitteet: `netstuite-send-end-redemption-payment-link`,
HEAD `210c82d` (30.09.). Rivinumerot ovat repon versiosta (K). Tuotannon tiedostoa ei verrattu repoon.

| # | Virhe | Juurisyy ja koodi | Vaikutus lokakuussa (N) | Korjausehdotus |
|---|---|---|---|---|
| **L1** | Hyvitys ankkuroidaan pidennykseen, ei huoltosummaan (R1, R2, R4) | `lib_gbb_redemption_price.js:167-183` (`brackets.find(b => b.prolongMonths === months)`, `anchor.maxNet − sum`). Pidennys luetaan `gbb_mr_send_end_redemption_paylink.js:359-360` (`ROUND(MONTHS_BETWEEN(subsc_end_date, subsc_org_end_date))`), ja se sisältää `handler_jalki`n siirrot. Päätös 14.9. (`lib:20-35`, `docs/DEPLOYMENT.md`) kumottu 2.10. | 6 linkkiä −720,01 € (1 maksettu, −160,00 €) ja 4 aiheetonta tapa 3 -settlementia (598,43 €) | Bracket = `brackets.find(b => b.maxNet >= sum)` (taulun 0 kk / 0 € -rivi kattaa summat ≤ 0). Hyvitys = `bracket.maxNet − sum`. Poista `extensionMonths`-parametri hinnasta ja päivitä `test/run_tests.js` (B021054 → 35,06, B006488 → 8,76) |
| **L2** | Negatiivista summaa ei hyvitetä ilman pidennystä | `lib:141` (`impliedBySum` vain, kun `sum > 0`) ja `lib:163-165` (`months === 0` → hyvitys 0) | 3 linkkiä +293,48 € (sääntö 1:n mukaan), 31.10. kolme lisää | Korjautuu L1:n mukana. **Ennen sitä päätös ylärajasta** (Avoin kysymys 1). Jos rajataan, `Math.min(remainder, 64.54)` tai ensimmäisen bracketin leveys taulusta |
| **L3** | Valinta päästää läpi pyörät, jotka ovat jo jälkiveloituksessa tai saaneet manuaalilinkin (R3) | `gbb_mr_…:295`: lattia `subsc_end_date >= not_before` rajaa **liikkuvaa** päivää. `link_sent` (`:293`) puuttuu manuaaliprosessin pyöriltä (ei täyttöä). Map-vaiheessa ei ole jälki-CR- eikä Paylink-tilaustarkistusta (`:427-454`) | 6 R1-linkkiä ja 7 tuplatilausta (ylimääräiset viestit, luokka A), 4 tapa 3 -kirjausta, B046508:n tapa 4 ja 69 NOT_PRICED-riviä joka päivä | (a) Kertatäyttö: `link_sent = T` kaikille, joilla on manuaalinen loppulunastustilaus (`customrecord_payment_requests`, `notes` = `externalid`) (K-b0). (b) Map-tarkistus ennen hinnoittelua: ohita (`SKIP_EXTENSION_BILLING`), jos Done-tilainen tyypin 7 CR, jonka altname sisältää *pidennys* (K-b). (c) Ohita (`SKIP_OPEN_ORDER`), jos pyörällä on jo *Työsuhdepyörän loppulunastus* -pyyntö millä tahansa tilalla. **Älä** vaihda lattiaa `subsc_org_end_date`:en: se pudottaisi pois 95 oikeaa lokakuun pyörää, joiden huoltopidennys siirsi päättymisen lokakuulle |
| **L4** | Settlement (tapa 3/4) kirjoitetaan tarkistamatta jälkiveloitusta | `gbb_mr_…:470-474` (hinta 0 → tapa 4) ja `:501-505` (`noPaymentDue` → tapa 3). `settle()` `:530-546`. Kirjoittaa myös test-Paylinkillä (B006956 30.09.) | B002668, B002729, B003264, B006941 (tapa 3, oikea 2) ja B046508 (tapa 4 jälkiveloituksen aikana) | Korjautuu L3(b):llä, koska tarkistus tehdään ennen kohtaa 6. Lisäksi `test_bike_id`/`paylink=test`-ajossa settlement vain lokiin tai erillisen parametrin takana |
| **L5** | Check 7 vertaa pidennyksen lähteitä vain totuusarvoina | `gbb_mr_…:477-483` | R1-pyörät (huolto + jälki) pääsivät hinnoitteluun. 68 jälki-pyörää jäi NOT_PRICEDiksi sattumalta oikein | L1:n jälkeen pidennys ei vaikuta hintaan. **Säilytä tarkistus datan eheysvartijana**: marraskuussa B026739, B027537 ja B031836 (huoltorivit, mutta päättymispäivää ei ole siirretty) saisivat muuten linkin liian aikaisin. Ehdotus: vertaa `MONTHS_BETWEEN − jälki-CR:t` summan kk:hon, ja eroava → NOT_PRICED |
| **L6** | NOT_PRICED-pyöriä ei leimata, ja ne toistuvat joka päivä | `gbb_mr_…:479-483`, `:494-497` (`finish('NOT_PRICED')` ilman kirjoitusta) | 69 riviä 1.10. ja 69 riviä 2.10. (sama joukko ±1) | Korjautuu L3(b):llä (68/69 on jälki-pyöriä). Loput: digestiin vain uudet NOT_PRICED-pyörät tai erillinen leima |
| **L7** | `SKIP_IN_PROGRESS` luottaa lippuun, jota muut muuttavat | `gbb_mr_…:443-446` (`end_red_so_created`) | B036396: lippu T 1.10. → F 2.10., minkä jälkeen pyörä on NOT_PRICED. Jälki-CR:t estivät linkin vain check 7:n kautta | L3(b) kattaa tämän pyörän. Selvitettävä, mikä tyhjentää `end_red_so_created`:n (paylink-order-tracking?) |
| **L8** | Lunastuksen tapa 1 ilman `liab_settled_at`:ia | Ei tämän repon koodia: vanha status-sync osa A | 279 tapa 1 -pyörää ilman `liab_settled_at`:ia (ylimääräiset viestit, havainto 4) | Status-sync 2.0 / T26, ei tämä repo |

**Korjausjärjestys ennen 31.10. (ehdotus):** L3(a) täyttö → L3(b) ja (c) vartijat → L1 + L2 (sen jälkeen, kun negatiivisen summan päätös on tehty) → L5:n tarkennus.
Koko kohortin dry run ennen tuotantoajoa, ja hyväksyntäehtona: 0 `SENT`-riviä pyörille, joilla on jälki-CR tai loppulunastustilaus. Lisäksi jokaisella SENT-rivillä lokin netto = sääntö 1
(tämän tiedoston kysely 4 + laskenta).
