# OOMI-pyörät: rekisterin init_subs_rent_fee vs. kuluvan kuukauden Vuokra-sopimusrivi (1.10.2026)

Vain luku -selvitys, NetSuiteen ei kirjoitettu. Ajettu 1.10.2026. Testipyörä B017530 jätetty pois. CSV: `2026-10-01-oomi-init-subs-rent-fee-vs-sopimusrivi.csv` (255 riviä, erotin `;`).

## Yhteenveto (varmennettu NetSuitesta, ellei toisin mainita)

| Mittari | Arvo |
|---|---|
| OOMI-pyöriä yhteensä (order type 3, ilman B017530) | **9 146** |
| ... status 1 Active | 7 702 |
| ... status 2 Redeemed | 1 431 |
| ... status 3 Returned | 9 |
| ... status tyhjä | 4 |
| Pyöriä, joilla on voimassa oleva Vuokra-rivi (item 30) 1.10.2026 | 7 792 (täsmälleen 1 rivi kullakin, **yhtään pyörää ei ole useampaa riviä**) |
| Pyöriä ilman voimassa olevaa Vuokra-riviä | 1 354 (Active 85, Redeemed 1 261, Returned 4, status tyhjä 4) |
| **Eroavia (init_subs_rent_fee ≠ rivin hinta, yli pyöristyksen)** | **255** (Active 144, Redeemed 111) |
| Täsmääviä (kontrolli, pyöristystoleranssin sisällä) | 7 537 |

Voimassa oleva rivi = item 30, isinactive = F, alku <= 2026-10-01 ja (loppu tyhjä tai >= 2026-10-01). Kaikissa 9 146 pyörässä init_subs_rent_fee on täytetty.

Vertailu: sekä nettona että verollisena (netto x 1,255, 2 desimaalia). Rekisterin init_subs_rent_fee on tallennettu **2 desimaalin tarkkuudella** (esim. 79,68), rivin hinta **4 desimaalilla** (79,6813). Siksi ehdoton tasa-arvo antaa vääriä hälytyksiä: 3 315 pyörällä verollinen summa eroaa ainoastaan pyöristyksen takia (alle 1 sentti nettona). Eroksi on luettu vain |init - rivi| > 0,0051 (netto). Ehdottomalla vertailulla eroavia olisi 286, eli 31 olisi pyöristysrajatapauksia (esim. 80,25 vs 80,255).

## B041634 (esimerkkitapaus, varmennettu)

Rekisteri: init_subs_rent_fee 80,65 (verollisena 101,22), **curr_subs_rent 79,6813**. Vuokra-rivi 98724: 79,6813 (verollisena 100,00), 2024-07-05 ... 2028-08-31. Eroaa siis init-kentän osalta, mutta curr_subs_rent täsmää riviin.

## Erojen jakauma (255 pyörää)

### Ryhmä B: pitkä voimassa oleva rivi, jonka hinta on eri kuin init (49 pyörää, kaikki Active)

- Rivin hinta on **systemaattisesti 0,988 x init** kaikilla 49 pyörällä. Verollinen ero on noin -1,0 ... -1,2 EUR/kk (rekisteri korkeampi kuin laskutettava).
- Yleisin pari: init 80,65 vs rivi 79,6813 (verollisena 101,22 vs 100,00): **20 pyörää** (mukaan lukien B041634).
- Muut parit (init -> rivi): 80,63 -> 79,6653 (3), 80,61 -> 79,6494, 80,45 -> 79,4821, 80,30 -> 79,3466, 79,00 -> 78,0558, 79,95 -> 78,996, 75,41 -> 74,51 ym. Kaikki saman 0,988-kertoimen mukaisia, eli ero ei ole satunnainen vaan toistuva.
- Rivit alkavat yleensä 2023-10-01, 2024-xx tai 2022-xx ja päättyvät 2026-12 ... 2029-03.
- Kaikilla 49:llä **curr_subs_rent = rivin hinta**, eli curr täsmää, init ei.
- Tulkinta (pääteltyä): init sisältää todennäköisesti eri verollisen tason (101,22 vs 100,00 EUR); OOMI-importti on kirjoittanut riville 100 EUR / 1,255 -pohjaisen hinnan. Syytä ei ole varmennettu lähdekoodista tai importti-CSV:stä.
- Huomaa: toisaalta 1 349 pyörällä init 79,68 vs rivi 79,6813 ja 2 714 pyörällä init 80,65 vs rivi 80,6454 täsmäävät (pyöristys). Pari 80,65 -> 79,6813 on siis eri asia kuin 80,65 -> 80,6454: yksi hinta-arvo (80,65) esiintyy kahdella eri rivihinnalla.

### Ryhmä A: yhden kuukauden rivi 1.-31.10.2026 (206 pyörää: Active 95, Redeemed 111)

- Rivi on 2026-10-01 ... 2026-10-31 ja sen hinta on murto-osa init-arvosta (esim. 43,69, 23,04, 2,57; ero verollisena 3,21 ... 97,96 EUR).
- Varmennettu otoksella (B037691, B037749, B038154, B039824): edellinen kokonaan laskutettu rivi päättyy 2026-09-30 normaalihintaan ja lokakuun rivi on **päiväsuhteessa lasketun loppukuukauden hinta** (esim. B037691: subsc_end 18.10., 18/31 x 75,243 = 43,69 EUR). Lisäksi item 31 (admin) -rivi on samoin suhteutettu.
- Tulkinta (pääteltyä, otoksen perusteella): nämä ovat odotettuja viimeisen kuukauden suhteutusrivejä, **ei virhe**. Koko ryhmää (206) ei ole tarkistettu päiväsuhde kerrallaan; koko populaatiossa ei laskettu, että jokaisen rivin hinta = päivät/31 x edellinen hinta. Redeemed-pyörillä (111) lokakuun rivi on edelleen voimassa vaikka status on 2, mikä on ristiriidaton mutta kannattaa huomata laskutuksen kannalta.
- Näiden vertaaminen init-kenttään ei ole mielekästä. Jos kyse on korjauksesta, rajaa ryhmä B.

### curr_subs_rent vs init_subs_rent_fee (kumpaa verrata)

- Ryhmän B ja A kaikilla 255:llä curr_subs_rent = rivin hinta (varmennettu).
- Mutta täsmäävien joukossa on **noin 213 pyörää (gross-vertailulla; ~157 eri arvoparia)**, joilla init täsmää riviin mutta curr_subs_rent ei: curr on tallennettu suhteutettuna (esim. 26,8818, 59,14, 5,3764) tai null (4 Redeemed-pyörää). curr_subs_rent kuvaa siis edellistä muutosta/suhteutusta eikä ole luotettava "normaali kuukausihinta"-vertailukohta.
- Suositus (pääteltyä): vertaa **init_subs_rent_fee** -kenttää rivin hintaan **vain pitkiin, kokonaiskuukauden riveihin (ryhmä B -tyyppiset)**, ja käsittele curr_subs_rent erillisenä. Jos halutaan tietää mitä laskutetaan nyt, rivi on totuus ja curr on sen heijastus (täsmää 255/255 eroavista mutta ei 213 muulla).

## Pyörät ilman voimassa olevaa Vuokra-riviä (1 354)

Varmennettu NetSuitesta, Active 85 kpl:
- 75 pyörällä subsc_end_date on 1.-30.9.2026 ja viimeinen rivi päättyi 30.9.: päättyneet syyskuussa, status silti Active (liittyy sweepiin/status-sync-ketjuun, ei tämän selvityksen aihe).
- 8 pyörällä kaikki rivit alkavat vasta 1.11.2026 tai myöhemmin (B046738, B046832, B046737, B046745, B046744, B046829, B046742, B046743).
- B043001 (3 riviä, subsc_end 2027-12-14, ei lokakuun riviä) ja B039531 (2 riviä, alkavat 2027-01-01): **aukko laskutuksessa lokakuulle**, tarkistettava erikseen.
Redeemed 1 261, Returned 4 ja tyhjä status 4: ei voimassa olevaa riviä, odotettavissa.

Pyöriä, joilla on useampi voimassa oleva Vuokra-rivi 1.10.2026: **0** (varmennettu rivimäärän jakaumalla 0 -> 1 354, 1 -> 7 792).

## Rajaukset

- Vain item 30 (Vuokra). Item 33 (Leasingmaksu) -rivejä ei huomioitu; pyöriä, joilla vuokra on vain item 33 -rivillä, olisi tässä "ilman voimassa olevaa riviä".
- 4 pyörää ilman statusta sisältyvät kokonaismäärään mutta ovat ilman riviä.
- Ero on laskettu ilman ALV-prosentin muutoksia; 1,255 kiinteänä.

## Käytetyt kyselyt (SuiteQL, ns_runCustomSuiteQL)

Kentät: `custrecord_sta_bike_order_type` = 3, `custrecord_sta_bike_status`, `custrecord_sta_init_subs_rent_fee`, `custrecord_sta_curr_subs_rent`, `custrecord_sta_subsc_end_date`; rivi: `custrecord_sta_bikeid`, `custrecord_sta_ca_row_item` = 30, `custrecord_sta_ca_row_price_month`, `custrecord_sta_ca_row_license_startdate/enddate`.

```sql
-- kokonaismäärät
SELECT custrecord_sta_bike_status, COUNT(*) FROM customrecord_sta_bike_register
WHERE custrecord_sta_bike_order_type = 3 AND name <> 'B017530' GROUP BY custrecord_sta_bike_status

-- erot (255 riviä, yksi sivu; COUNT täsmää totalResults = 255)
SELECT br.id, br.name, br.custrecord_sta_bike_status, br.custrecord_sta_init_subs_rent_fee, br.custrecord_sta_curr_subs_rent,
       r.id, r.custrecord_sta_ca_row_price_month,
       TO_CHAR(r.custrecord_sta_ca_row_license_startdate,'YYYY-MM-DD'), TO_CHAR(r.custrecord_sta_ca_row_license_enddate,'YYYY-MM-DD')
FROM customrecord_sta_bike_register br
JOIN customrecord_sta_ca_agreement_row r ON r.custrecord_sta_bikeid = br.id
 AND r.custrecord_sta_ca_row_item = 30 AND r.isinactive = 'F'
 AND r.custrecord_sta_ca_row_license_startdate <= TO_DATE('2026-10-01','YYYY-MM-DD')
 AND (r.custrecord_sta_ca_row_license_enddate IS NULL OR r.custrecord_sta_ca_row_license_enddate >= TO_DATE('2026-10-01','YYYY-MM-DD'))
WHERE br.custrecord_sta_bike_order_type = 3 AND br.name <> 'B017530'
  AND ABS(NVL(br.custrecord_sta_init_subs_rent_fee,0) - NVL(r.custrecord_sta_ca_row_price_month,0)) > 0.0051
ORDER BY br.id

-- rivimäärän jakauma per pyörä (0 / 1 / useampi): sama JOIN LEFT JOINina, COUNT(r.id) GROUP BY br.id
-- ilman riviä olevat: NOT EXISTS (sama rivi-ehto)
```

Tarkistus: 7 792 (rivi) + 1 354 (ei riviä) = 9 146 = kokonaismäärä. 7 537 täsmää + 255 eroaa = 7 792.
