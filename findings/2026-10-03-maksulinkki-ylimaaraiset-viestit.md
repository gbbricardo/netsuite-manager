# Maksulinkki 1.10.2026: ylimääräiset maksulinkkiviestit, kaikki 748 lähetettyä

Omistava repo: `netstuite-send-end-redemption-payment-link` (script 1479). Tausta: [ensimmäisen ajon löydös](2026-10-02-maksulinkki-ensimmainen-ajo.md)
ja [käsittelyloki](2026-10-02-maksulinkki-kasittelyloki.md) (R1, R3, R5, R7). Pyörälista: [`2026-10-03-maksulinkki-ylimaaraiset-viestit.csv`](2026-10-03-maksulinkki-ylimaaraiset-viestit.csv).
Vain luku, NetSuiteen ei kirjoitettu mitään. (N) = todennettu NetSuitesta 3.10.2026, (K) = päätelty.

## Yhteenveto

**Seitsemän pyörää 748:sta sai ylimääräisen maksulinkkiviestin.** Ne ovat samat seitsemän, jotka R7 löysi 2.10. Laajempi haku ei löytänyt uusia (N).

| Luokka | Pyöriä | Pyörät | 1479-tilaukset | Toiset tilaukset |
|---|---|---|---|---|
| **A** Pyörällä on myös manuaalinen loppulunastustilaus Paylinkissä | **7** | B001767, B002022, B003047, B003243, B006488, B023007, B010348 | 303,01 € (avoinna 299,56 €, maksettu 3,45 €) | 666,96 € (avoinna 517,36 €, maksettu 149,60 €) |
| **C** Pyörä oli jo jälkiveloituksessa (Done-tilainen *pidennys – jälkiveloitus*) | **6** (kaikki myös A:ssa) | A:n pyörät ilman B010348:aa | 269,73 € | — |
| **B** Lunastus oli maksettu tai hoidettu ennen ajoa | **0** | — | — | — |
| **D** Keskenkauden lunastus tai palautus käynnissä tai tehty | **0** | — | — | — |
| **E** Muu syy (tupla 1479-linkki, sama vastaanottaja, OOMI, hinta 0) | **0** | — | — | — |

Luokat menevät päällekkäin: kuusi pyörää on sekä A:ssa että C:ssä. Ylimääräisen viestin saaneita pyöriä on siis **7**, ja niillä on **14 tilausta**.

**Tilanne 3.10. (N, viimeisin synkronointi 2.10. klo 23:33):**
- **Kaksi avointa tilausta samalla pyörällä:** B001767, B002022, B003047, B003243 ja B010348. Asiakas voi yhä maksaa kummankin.
- **B006488** maksoi 1479-tilauksen (3,45 €) 1.10. Manuaalitilaus 331081 (84,08 €) on yhä auki ja maksettavissa.
- **B023007** maksoi manuaalitilauksen 341038 (149,60 €) 2.10. 1479-tilaus 351659 (68,41 €) on yhä auki ja maksettavissa.
- **Kukaan ei ole maksanut kahdesti.** Kaksi tilausta on maksettu kahdella eri pyörällä.

**Tärkeimmät havainnot:**
1. **Lista on täydellinen niiltä osin kuin NetSuite näkee Paylinkin.** Muilla 741 pyörällä ei ole toista lunastustilausta millään tunnisteella:
   `notes` = `externalid`, `custrecord_pl_ns_bike_id`, S-sopimusnumero (`custrecord_sta_contract_external_id`), P-numero (`custrecord_sta_former_hubspot_bikeid`,
   viitteestä `reference`) ja 8-merkkinen tilauskoodi (N). Paylinkistä poistetut tilaukset eivät kuitenkaan näy NetSuitessa (K, ks. *Rajoitukset*).
2. **1479 loi Paylinkiin tasan 748 tilausta.** Tilauksia, jotka eivät olisi lokissa, ei ole. Kaksi muuta 1.10. luotua tilausta (351080 ja 351126) ovat henkilökunnan
   käsin tekemiä B005476:lle, joka ei kuulu 748:aan (N).
3. **Kaikki 748 vastaanottajaa ovat eri osoitteita.** Fallback- tai override-osoitteita ei ole, eikä yhtään linkkiä mennyt Paylinkin testiympäristöön (N).
   Testiajo 29.09. (lokipäivä) meni testiympäristöön osoitteeseen severi@gobybike.fi (OVERRIDE): B018829, tilaus 103 / id 3039. Asiakas ei saanut sitä (N).
4. **Sivuhavainto, ei kuulu tähän tehtävään:** kaikilla **279** pyörällä, joilla on tapa 1, `custrecord_gbb_liab_settled_at` on tyhjä (N).
   T38 kirjasi saman B006488:lle, mutta kyse on koko erästä, ei yksittäistapauksesta.

## Menetelmä

Kaikki kyselyt ajettiin 3.10.2026 `ns_runCustomSuiteQL`:llä. Ne ovat uudelleenajettavia.

**1. Tilajakauma ensin.** Synkronointi on täydentynyt 2.10. jälkeen: pending-rivejä oli silloin 549, nyt niitä on 1 040.

```sql
SELECT custrecord_pl_ns_status, custrecord_pl_status, COUNT(*) c,
       SUM(CASE WHEN custrecord_pl_product_name='Työsuhdepyörän loppulunastus' THEN 1 ELSE 0 END) loppu
FROM customrecord_payment_requests GROUP BY custrecord_pl_ns_status, custrecord_pl_status
```

Tulos (N): 3/completed 9 923 (loppulunastus 7 025) · 3/tyhjä 85 (50) · 5/completed 14 (3) · **6/pending 1 040 (808)** · tyhjä 1.
Lunastustuotteita on viisi: *Työsuhdepyörän loppulunastus*, *Työsuhdepyörän lunastus*, *Työsuhdepyörän kesken kauden lunastus*,
*Kesken kauden lunastus* ja *Työsuhdepyörän lunastus kesken kauden*. Haut 2–4 kattavat ne kaikki, ja haku 2 kattaa lisäksi kaikki muut tuotteet.

**2. Kaikki pyynnöt 748 pyörälle** (luokka A). Täsmäys tehdään sekä bike id:llä että `notes`:lla. JOIN ei enää aikakatkaistu.

```sql
SELECT br.name, pr.custrecord_pl_order_id, pr.custrecord_pl_product_name, pr.custrecord_pl_status, pr.custrecord_pl_amount_total,
       SUBSTR(pr.custrecord_pl_raw_json, INSTR(pr.custrecord_pl_raw_json,'"created_at"')+14, 10) cr
FROM customrecord_sta_bike_register br
JOIN customrecord_payment_requests pr ON (pr.custrecord_pl_ns_bike_id = br.id OR pr.custrecord_pl_notes = br.externalid)
WHERE br.custrecord_gbb_eredem_link_sent = 'T'
  AND br.id IN (SELECT br2.id FROM customrecord_sta_bike_register br2
                JOIN customrecord_payment_requests pr2 ON (pr2.custrecord_pl_ns_bike_id = br2.id OR pr2.custrecord_pl_notes = br2.externalid)
                WHERE br2.custrecord_gbb_eredem_link_sent = 'T' GROUP BY br2.id HAVING COUNT(*) > 1)
ORDER BY br.name, pr.id
```

Tulos (N): 9 pyörää, 18 riviä. Seitsemällä pyörällä on kaksi loppulunastustilausta. Kahdella toinen rivi ei ole lunastus:
- **B018528:** 306610 *Työsuhdepyörän vuokrat ajalta 1.6.–31.7.2026*, maksettu 27.05. Kyse on välikuukausista (CR 3220 tyyppi 3 *2H*).
- **B046796:** 339949 *Itsehankinnan käsiraha*. Käsitelty oikein, ks. käsittelyloki 2.10.

Pelkällä `notes` = `externalid` -liitoksella tulee 755 riviä ja 748 pyörää. Bike id -liitoksella tulee 757 riviä, joista 755:ssä myös `notes` täsmää.

**3. Pyynnöt, joita kumpikaan avain ei täsmää** (152 kpl, kaikki lunastustuotteet, `custrecord_pl_ns_bike_id` tyhjä, `notes` ≠ minkään pyörän `externalid`).
Niistä poimittiin numerot: `REGEXP_SUBSTR(notes,'[0-9]{6,}')` ja viitteen `"reference":"P…"` numero. Numeroita verrattiin rekisterin kolmeen tunnisteeseen:
`externalid`, `custrecord_sta_contract_external_id` (S…, sama kuin manuaalitilauksen `display_id` ja CR:n altname-etuliite) ja
`custrecord_sta_former_hubspot_bikeid` (P…, manuaalitilauksen `reference`). Kahdeksanmerkkiset koodit (`2FQHRNV9`, `XESZYBHR` …) verrattiin
`custrecord_sta_enduser_order_code`:een.

```sql
-- avainlista
SELECT LISTAGG(k, ',') WITHIN GROUP (ORDER BY k) FROM (SELECT DISTINCT k FROM (
  SELECT REGEXP_SUBSTR(pr.custrecord_pl_notes,'[0-9]{6,}') k FROM customrecord_payment_requests pr
   WHERE LOWER(pr.custrecord_pl_product_name) LIKE '%lunastus%' AND pr.custrecord_pl_ns_bike_id IS NULL
  UNION SELECT REGEXP_SUBSTR(REGEXP_SUBSTR(pr.custrecord_pl_raw_json,'"reference":"P[0-9]+'),'[0-9]+') FROM customrecord_payment_requests pr
   WHERE LOWER(pr.custrecord_pl_product_name) LIKE '%lunastus%' AND pr.custrecord_pl_ns_bike_id IS NULL) WHERE k IS NOT NULL)
-- sitten: SELECT name, custrecord_gbb_eredem_link_sent FROM customrecord_sta_bike_register
--   WHERE externalid IN (<lista>) OR REGEXP_SUBSTR(custrecord_sta_contract_external_id,'[0-9]+') IN (<lista>)
--      OR REGEXP_SUBSTR(custrecord_sta_former_hubspot_bikeid,'[0-9]+') IN (<lista>)
```

Tulos (N): 37 + 84 + 13 pyörää täsmäsi. **Yhdelläkään ei ole `link_sent = T`.** Täsmäämättömät pyynnöt kuuluvat siis muille pyörille, kuten
keskenkauden lunastuksille, OOMI:lle ja vanhoille kohorteille. Täsmäys `notes` = `externalid` + tuote koko taulua vasten aikakatkaistiin, kuten 2.10.
Kaksivaiheinen haku (ensin avainlista, sitten `IN`-lista) toimi.

**4. 1479:n oma loki ja Paylink-tilaukset** (luokka E):

```sql
-- tulokset päivittäin
SELECT TO_CHAR(date,'YYYY-MM-DD') d, REGEXP_SUBSTR(title,'paylink: [A-Z_]+') t, COUNT(*), COUNT(DISTINCT title)
FROM scriptnote WHERE scripttype = 1479 AND date >= TO_DATE('2026-09-29','YYYY-MM-DD') GROUP BY 1, 2   -- (kirjoita lausekkeet auki)
-- SENT-rivi → Paylink-tilaus
SELECT pr.custrecord_pl_ns_status, pr.custrecord_pl_status, COUNT(*), SUM(CASE WHEN pr.custrecord_pl_notes = b.externalid THEN 1 ELSE 0 END)
FROM (SELECT SUBSTR(title, INSTR(title,'SENT ')+5) bn, REGEXP_SUBSTR(REGEXP_SUBSTR(detail,'\(id [0-9]+'),'[0-9]+') pid
      FROM scriptnote WHERE scripttype = 1479 AND date >= TO_DATE('2026-10-01','YYYY-MM-DD') AND date < TO_DATE('2026-10-02','YYYY-MM-DD')
        AND title LIKE '%paylink: SENT %') s
JOIN customrecord_sta_bike_register b ON b.name = s.bn
LEFT JOIN customrecord_payment_requests pr ON pr.custrecord_pl_order_id = s.pid
GROUP BY pr.custrecord_pl_ns_status, pr.custrecord_pl_status
-- vastaanottajat: REGEXP_SUBSTR(REGEXP_SUBSTR(detail,'\) to [^ ,]+'),'[^ ]+$') → GROUP BY … HAVING COUNT(*) > 1
```

Tulos (N):
- Lokipäivä 1.10.: 748 SENT-riviä ja **748 eri otsikkoa**, eli jokainen pyörä sai yhden linkin. Muut lokirivit: 69 NOT_PRICED, 6 SKIP_IN_PROGRESS,
  4 SETTLED_MAINT_BUDGET, 2 SETTLED_DOWN_PAYMENT ja 1 SKIP_LINKED_SO.
- Lokipäivä 2.10.: ei yhtään SENT-riviä. Lokipäivä 29.09.: 1 SENT, testiympäristöön.
- Kaikki 748 tilausta löytyvät `customrecord_payment_requests`-taulusta, ja niiden `notes` on pyörän `externalid`: **278 completed (41 235,92 €)** ja **470 pending
  (69 272,34 €)**.
- Vastaanottajia on 748, eikä yksikään osoite toistu. Osoite puuttuu nollalta riviltä, ja OVERRIDE-, FALLBACK- tai @gobybike.fi-osoitteita on 0.
- Kaikkia 1.10. luotuja loppulunastustilauksia, joilla on tyhjä `order_number_prefix`, on 750: 748 1479:n tilausta ja kaksi henkilökunnan tilausta B005476:lle (351080 ja 351126).

**5. Lunastus hoidettu ennen ajoa** (luokka B):
- SO:t, joiden `custbody_sta_is_so_type` on 3 tai 4, ja laskut, hyvitykset ja käteismyynnit, joilla on item 46 tai 47. Haku tehtiin `custbody_sta_bike_id IN (<748 id:tä>)`,
  kahdessa osassa, koska alikysely aikakatkaistiin. **Ennen 1.10. klo 14:ää luotuja ei ole yhtään** (N). Kaikki 136 + 136 osumaa ensimmäisessä osassa
  ovat 1.10. klo 23:43 jälkeen syntyneitä 1479-maksujen SO:ita ja laskuja. Item 46 -laskuja ilman bike id:tä on 18, ja ne ovat IC- tai OOMI-koontilaskuja (N).
- Rekisteri (N): `redemption_paid_at` < 1.10. 0 · `liab_settled_at` < 1.10. 0 · OOMI 0 · hinta 0/tyhjä 0 · `subsc_end_date` < 1.10. 0 ·
  status 1: 469, status 2: 279, status 3: 0. Kaikilla 279 status-2-pyörällä on tapa 1, `paid_at` 1.–2.10. ja `date_to_non_active` aikaisintaan 2.10.
  Ennen ajoa niistä yksikään ei siis ollut lunastettu.

**6. CR:t** (luokat C ja D), kaikki tilat:

```sql
SELECT cr.custrecord_cr_type, cr.custrecord_cr_status, COUNT(*), COUNT(DISTINCT cr.custrecord_cr_bike_registry)
FROM customrecord_subscrption_change_request cr JOIN customrecord_sta_bike_register b ON b.id = cr.custrecord_cr_bike_registry
WHERE b.custrecord_gbb_eredem_link_sent = 'T' GROUP BY cr.custrecord_cr_type, cr.custrecord_cr_status
```

Tulos (N), kaikki Done: tyyppi 1: 11 (10 pyörää) · 3: 1 · 7: 15 (12) · 9: 10 (8) · 11: 13 (11). **Tyypin 2 ja 10 CR:iä ei ole yhtään, ei missään tilassa.**
Muita lopetusmerkkejä ei ole: `return_status`, `cancellation_reason`, poikkeuspäivät, `redemption_reason` ja `mid_red_so_created` ovat tyhjiä kaikilla. Ainoa
`custrecord_sta_redemption_date` on B023403:lla, ks. epävarmat.

## Luokka A + C — manuaalitilaus olemassa, ja pyörä oli jo jälkiveloituksessa (6)

Kaikki tiedot (N). Tilaukset on merkitty muodossa Paylink id (display_id). Kummallakin tilauksella on sama sähköpostiosoite, joten sama asiakas sai kaksi linkkiä.
Manuaalitilauksen `display_id` on pyörän S-sopimusnumero ilman S-kirjainta, ja sen `reference` on `P<hubspot-id> - lunastus`.

| Pyörä | 1479-tilaus | Summa | Tila | Manuaalitilaus | Summa | Tila | Luotu / eräpäivä | Jälki-CR:t (Done) | Status / tapa | Suositus |
|---|---|---|---|---|---|---|---|---|---|---|
| B001767 | 351153 (2099) | 9,96 € | pending | 330864 (854831475) | 91,32 € | pending | 31.07. / 17.08. | 6441 (15.09.), 6891 (1.10.) | 1 / – | Poista toinen avoimista. Ehdotus: 1479-tilaus (R3) |
| B002022 | 351155 (2101) | 55,77 € | pending | 340714 (854722442) | 57,12 € | pending | 31.08. / 15.09. | 6893 (1.10.) | 1 / – | sama |
| B003047 | 351160 (2106) | 111,07 € | pending | 340722 (940511600) | 112,42 € | pending | 31.08. / 15.09. | 6896 (1.10.) | 1 / – | sama |
| B003243 | 351161 (2107) | 21,07 € | pending | 330910 (980286514) | 102,42 € | pending | 31.07. / 17.08. | 6451 (15.09.), 6898 (1.10.) | 1 / – | sama |
| B006488 | 351359 (1785266682440) | 3,45 € | **completed 1.10. 13:26** | 331081 (1340710459) | 84,08 € | pending | 31.07. / 17.08. | 6473 (15.09.), 6924 (1.10.) | 2 / 1 | **Poista manuaalitilaus 331081.** Hintaero kuuluu T31:een / D-R1b:hen |
| B023007 | 351659 (1785266682739) | 68,41 € | pending | 341038 (1686930761) | 149,60 € | **completed 2.10. 12:41** | 31.08. / 15.09. | 6951 (1.10.) | 2 / 1 | **Poista 1479-tilaus 351659** |

**Miksi tämä on C eikä pelkkä A (N + K):** kaikkien CR:ien altname on *S… - pidennys - jälkiveloitus*. Lokakuun CR:t (6891, 6893, 6896, 6898, 6924 ja 6951)
luotiin 1.10. klo 01:01–01:02 ja merkittiin Doneksi klo 01:32–01:39. 1479:n SENT-rivit ovat samana päivänä klo 03:01 (N).
Jos kenttien `created` ja `scriptnote.date` kello on sama, jälkiveloitus oli käsitelty ennen linkin lähtöä (K, aikavyöhykettä ei todennettu).
B002022:lla, B003047:lla ja B023007:lla jälkiveloitus alkoi siis vasta ajopäivänä. Ne olivat kuitenkin jo vaiheessa 3: manuaalilinkki lähetetty 31.08.,
eräpäivä 15.09. ohitettu ja maksu puuttui (N). Tuoteomistajan työnkulun mukaan (R3) niille ei olisi kuulunut lähteä uutta linkkiä.

**Hinnoista ei oteta kantaa** (tuoteomistajan auki oleva kysymys, R7). 1479:n summat ovat R1:n vääristämiä. Manuaalisummat ovat 5/6 tapauksessa yhden bracketin
R1:n korjattua hintaa pienempiä. "Poista toinen avoimista" tarkoittaa vain, että samalla pyörällä ei saa olla kahta maksettavaa lunastustilausta.

## Luokka A ilman C:tä — manuaalitilaus olemassa, ei jälkiveloitusta (1)

| Pyörä | 1479-tilaus | Summa | Tila | Manuaalitilaus | Summa | Tila | Luotu / eräpäivä | Status / tapa | Suositus |
|---|---|---|---|---|---|---|---|---|---|
| B010348 | 351433 (1785266682514) | 33,28 € | pending | 331600 (21127095467) | 70,00 € | pending | 31.07. / 17.08. | 1 / – | **Poista manuaalitilaus 331600.** Odottaa tuoteomistajan vahvistusta (käsittelyloki: *"poistetaanko 331600?"*) |

Tulkinta (N + K, R7): `org_end` oli 31.08. Manuaalilinkki tehtiin 31.07., ja sen jälkeen huoltopidennys (huolto 98,80 € → 2 kk) siirsi päättymisen 31.10.:een.
Pyörällä ei ole tyypin 7 CR:ää. Pyörä kuuluu siis oikeasti lokakuun kohorttiin, ja 1479:n linkki on oikea. Ylimääräinen viesti on käytännössä
vanha manuaalilinkki, joka on yhä maksettavissa. 1479:n viesti oli asiakkaalle kuitenkin toinen lunastuslinkki samasta pyörästä. Siksi pyörä on listalla.

## Luokat B, D ja E — ei yhtään pyörää

- **B (N):** ennen ajoa ei ole yhtään lunastus-SO:ta (tyyppi 3/4), lunastuslaskua (item 46/47), maksupäivää, selvitystapaa tai statusta 2/3.
  Maksettuja manuaalitilauksia ennen 1.10. ei ole. B023007:n manuaalitilaus maksettiin vasta 2.10., ja se on A + C:ssä.
- **D (N):** tyypin 2 ja 10 CR:iä ei ole, eikä palautus-, peruutus- tai poikkeuspäivämerkintöjä. Keskenkauden lunastustuotteiden Paylink-pyyntöjä 748 pyörälle ei ole.
- **E (N):** kukaan ei saanut kahta 1479-linkkiä, eikä sama vastaanottaja toistu. OOMI-pyöriä on 0, hinta 0 -pyöriä 0, testiympäristön linkkejä 0, ja orpoja Paylink-tilauksia
  (luotu, mutta ei lokissa) 0. B046796 (ITSEHANKINTA, hinta 84 €) on käsitelty oikein, tuoteomistajan päätös 2.10.

## Epävarmat ja rajatapaukset (eivät mukana luvuissa)

| Pyörä | Havainto (N) | Arvio (K) |
|---|---|---|
| B031624 | CR 4633 *S1894609530 - Jälkiveloitus - Poikkeus* (tyyppi 7, Done 24.07.). `org_end` 31.03., päättyy 31.10. Linkki 71,66 € maksettu 1.10. Ei manuaalitilausta | Altname ei ole *pidennys*. Pidennys 7 kk = huoltosumman edellyttämä 7 kk (käsittelyloki 2.10.). Todennäköisesti kertaluontoinen poikkeuslaskutus, ei jälkiveloitusketju. **Ei ylimääräinen**, mutta tarkista CR 4633:n tarkoitus, jos haluat varmuuden |
| B023403 | `custrecord_sta_redemption_date` 27.11.2025 ja `redemption_cm_processed` T. Hyvityslasku CRMGBF0000552 −116,22 € 27.11.2025. Ei tyypin 2 CR:ää. `org_end` 31.08.2026, linkki maksettu 1.10. (tapa 1) | Hyvitys on yhden kuukauden vuokra (92,60 netto × 1,255). Staria-kenttä viittaa keskenkauden lunastukseen, mutta pyörää laskutettiin edelleen, ja loppulunastus maksettiin nyt. **Ei näyttöä ylimääräisestä viestistä.** Kenttä on kuitenkin ristiriidassa CLAUDE.md:n varoituksen kanssa (*`sta_redemption_date` laukaisee `sta_mr_mid_life_redemption`:n hyvityksen*). Kirjataan erikseen |
| B018528 | CR 3220 *M54404091295 - 2H* (tyyppi 3 Välikuukaudet) + 3221 hyvitys. Paylink 306610 *vuokrat 1.6.–31.7.2026* maksettu 27.05. `org_end` 30.09., päättyy 31.10. Linkki 86,92 € pending | Välikuukausien vuokra, ei lunastus. **Ei ylimääräinen** |
| B005296, B006544, B026038 | Tyypin 7 *CRnnnn - Jälkiveloitus* + tyypin 11 *CRnnnn - Hyvitys* -parit (26.08. ja 14.09.). Linkki maksettu, tapa 1 | Korjauspareja (hinta tai kausi), eivät *pidennys – jälkiveloitus*. **Ei ylimääräinen** |
| B005265, B010594 | Tyypin 7 *2A - jälkiveloitus* (siirtopaketti). Linkki maksettu | Siirtopaketti, ei jälkiveloitus (käsittelyloki 2.10.). **Ei ylimääräinen** |
| 95 muuta pyörää, joilla `org_end` < 1.10. | Ei tyypin 7 CR:ää eikä manuaalitilausta NetSuitessa. `subsc_end_date` 31.10. huoltopidennyksen ansiosta | Kuuluvat lokakuun kohorttiin (käsittelyloki 2.10.). Jäännösriski: Paylinkistä poistettu manuaalitilaus ei näkyisi, ks. alla |

## Rajoitukset

- **Paylinkistä poistetut tilaukset eivät näy NetSuitessa** (K, käsittelyloki R3: *"Paylinkissä poistettu tilaus — ei koskaan NetSuitessa"*). Jos manuaalilinkki
  on lähetetty ja tilaus sen jälkeen poistettu, asiakas sai viestin, mutta sitä ei voi todentaa täältä. Vanhin synkronoitu pending-tilaus on 8.1.2026
  (N), joten avoimet tilaukset näyttävät tulleen koko historialta.
- **`custrecord_pl_raw_json`:ssa ei ole toimitus- eikä lähetyskenttiä** (N). Kentät ovat `id`, `display_id`, `order_number_prefix`, `due_date`, `customer_locale`, `status`,
  `notes`, `info_before`, `info_after`, `customer_id`, `email`, `payment_url`, `created_at`, `updated_at`, `paid_at`, `reference`, `transaction`, `address`,
  `items` ja `custom_fields`. Se, että manuaalitilauksista on lähtenyt viesti asiakkaalle, on siis päätelmä (K). Siihen viittaavat kokonainen tilaus,
  asiakkaan sähköpostiosoite ja eräpäivä, ja maksettu 341038 osoittaa, että ainakin B023007:n asiakas sai linkin. Yksikään seitsemästä manuaalitilauksesta
  ei ole luonnos: kaikilla on `payment_url`, ja `status` on pending tai completed (N).
- **CR- ja lokiaikaleimojen aikavyöhykettä ei todennettu** (K). Sillä on merkitystä vain sille, oliko lokakuun jälkiveloitus-CR Done jo ennen klo 13:01 Helsingin aikaa.
