# Loppulunastuksen maksulinkki: ensimmäinen tuotantoajo 1.10.2026

Omistava repo: `netstuite-send-end-redemption-payment-link` (nimen kirjoitusasu on repon oma),
`src/gbb_mr_send_end_redemption_paylink.js`. Script `customscript_gbb_mr_eredem_paylink`, internal id
**1479**, deployment `customdeploy_gbb_eredem_test` (nimestä huolimatta tuotantodeployment, status
**Scheduled**, log level Audit). Lähde: `scriptnote`, `scripttype = 1479`, luettu 2.10.2026 klo 10:09
Helsingin aikaa. Pääistunto, vain luku.
(N) = todennettu NetSuitesta, (K) = päätelty koodista tai repon dokumentaatiosta.

## Yhteenveto

**Ajo toimi teknisesti puhtaasti (N):** 830 valittua, 748 maksulinkkiä Paylinkin **tuotantoon**,
0 virhettä, 0 `STAMP_FAILED`, 0 `EMAIL_FAILED` ja 0 käsittelemätöntä map-virhettä. Ketju toimi
päästä päähän: **215 linkkiä maksettiin jo 1.10.** Kaikilla 215:llä on Paylink-pyyntö `completed`,
type-4 SO ja asiakasennakko (step 3), sekä tapa 1, `paid_at` 1.10. ja status 2 (vanha osa A ja sweep).

**Mutta ajo laski hinnan väärin jälkiveloituspyörille (N + K).** Skriptin huoltobudjetin hyvitys
ankkuroidaan *voimassa olevaan pidennykseen*, `ROUND(MONTHS_BETWEEN(subsc_end_date, subsc_org_end_date))`.
`handler_jalki` siirtää `subsc_end_date`:a jokaisella jälkiveloituskuukaudella, joten luku sisältää
myös jälkiveloituskuukaudet. Skripti pitää niitä käyttämättömänä huoltobudjettina ja hyvittää ne.

| Vaikutus | Pyöriä | Rahassa (brutto, (K)-laskelma) |
|---|---|---|
| Linkki liian pienellä summalla | 6 | yhteensä noin **720 €** liian vähän, 80–160 € per pyörä. B006488 on jo maksanut 3,45 € |
| Kirjattu ilmaiseksi, tapa 3 (`redemption_maint_budget`) | 4 | noin **598 €** perimättä, ja status on jo 2 |
| Kirjattu tapa 4 (`redemption_down_payment`), vaikka hinta 0 on auki TASKS:ssa | 1 | B046508 |
| `NOT_PRICED`: lähteet eivät täsmää, ei linkkiä | 69 | kaikki ovat jälkiveloituspyöriä. Ne ovat digestissä ja palaavat valintaan joka päivä |

Kaikki 80 pyörää, joihin tämä vaikuttaa, ovat syyskuun tai sitä vanhempia kohortteja (`subsc_org_end_date` < 1.10.2026).
Niillä on Done-tilainen tyypin 7 CR (*pidennys – jälkiveloitus*). Ne tulivat valintaan, koska `custscript_gbb_eredem_not_before`
rajaa liikkuvaa `subsc_end_date`:a eikä alkuperäistä päättymispäivää. Kuivaharjoitus 30.09. valitsi
748 pyörää ja tuotantoajo 1.10. 830. Erotus tuli 1.10. käsiteltyjen tyypin 7 CR:ien siirtämistä päivistä.

**Pyöräkohtaiset tehtävät:** TASKS T30–T38 ja [`2026-10-02-maksulinkki-tutkittavat.csv`](2026-10-02-maksulinkki-tutkittavat.csv) (87 pyörää). Takaraja on seuraava kohorttiajo 31.10.2026.

---

## 1. Ajot lokissa (N)

Lokin aika on runtime-aikaa, eli Helsinki −10 h.

| Runtime | Helsinki | Ajo | Tulos |
|---|---|---|---|
| 30.09. 01:55 | 30.09. 11:55 | Koko kohortin dry run, ikkuna 30.09.–31.10. (31 pv), Paylink test, vastaanottajan override | `DRY_RUN=743 SKIP_IN_PROGRESS=3 SETTLED_DOWN_PAYMENT=1 SETTLED_MAINT_BUDGET=1`, valittu 748 |
| 30.09. 03:49 | 30.09. 13:49 | Dry run, `test_bike_id = 6956` | `SETTLED_MAINT_BUDGET=1` |
| 30.09. 04:01 | 30.09. 14:01 | **Live**, `test_bike_id = 6956`, Paylink test | B006956 sai **tavan 3 ja `settled_at` 30.09. oikeasti** (settlement ei ole Paylink-kutsu, joten testiympäristö ei suojaa sitä). Digest lähetettiin |
| **1.10. 03:01–03:09** | **1.10. 13:01–13:09** | **Ensimmäinen tuotantoajo**, ikkuna 1.10.–31.10. (30 pv), lattia 2026-10-01, Paylink **PRODUCTION**, ei overridea | Valittu 830: `SENT=748 NOT_PRICED=69 SKIP_IN_PROGRESS=6 SKIP_LINKED_SO=1 SETTLED_MAINT_BUDGET=4 SETTLED_DOWN_PAYMENT=2`, `unhandledMapErrors=0`. Digest lähetettiin osoitteeseen info@gobybike.fi |

**Ajastus on todentamatta.** Repon päätös on *päivittäin klo 08:00*. 1.10. klo 13:09 jälkeen lokissa
ei ole yhtään ajoa (tilanne 2.10. klo 10:09 Helsingin aikaa). Jos 08:00 tarkoittaa Helsingin aikaa, 2.10.
ajo puuttuu. Jos se tarkoittaa runtime-aikaa, ajo tulee klo 18 Helsingin aikaa. `scriptdeployment.recurrence`
ei näy SuiteQL:ssä, joten ajastus todennetaan ensimmäisestä valvomattomasta ajosta. 1.10. ajo oli
todennäköisesti käsin käynnistetty (13:01 ei ole kumpikaan 08:00).

`custrecord_gbb_eredem_link_sent = T` on 748 pyörällä (N), eli täsmälleen yhtä monella kuin `SENT`.

## 2. Mitä ajo kirjoitti (N)

| Kirjoitus | Pyörät |
|---|---|
| `link_sent = T` | 748 |
| Tapa 3 + `liab_settled_at` 1.10. | B002668, B002729, B003264, B006941 |
| Tapa 4 + `liab_settled_at` 1.10. | B046508, B046755 |
| (30.09. testiajo) tapa 3 + `liab_settled_at` 30.09. | B006956 |

Kaikki seitsemän ovat nyt status 2: sweep käänsi ne, koska päättymiskuu on alkanut. `ic_redemption_dt` on tyhjä kaikilla,
ja `date_to_non_active` on tyhjä kaikilla paitsi B006956:lla (1458 täyttää sen viiveellä).

Ohitetut (N): `SKIP_IN_PROGRESS` B001876, B011223, B012880, B019460, B031422 ja B036396, sekä `SKIP_LINKED_SO`
B026671 (SOGBB0015027, status G, 30.09.).

## 3. Jälkiveloituskuukaudet kasvattavat hyvitystä

### Mekanismi (K)

`readBike()` (`gbb_mr_send_end_redemption_paylink.js:359-365`) lukee pidennyksen kahdesta lähteestä:
- `extension_months` = `ROUND(MONTHS_BETWEEN(subsc_end_date, subsc_org_end_date))`
- `prolongation_rows` = agreement-rivien määrä, joilla `is_prolongation_line = 'T'`

Tarkistus 7 (`:477-483`) vertaa lähteitä **vain totuusarvoina** (*pidennetty kyllä/ei*). `lib_gbb_redemption_price.js`
valitsee bracketin `prolong_months = extension_months`. Repon 14.9. päätös hyvittää tarkoituksella pidennyksen, joka
on *pidempi* kuin huoltosumma edellyttää (ratchet-hyvitys: *Extension 1 month, sum 0 € → 64,53*). Ainoastaan
*lyhyempi* pidennys estää hinnoittelun.

`handler_jalki` (cr-scripts) siirtää `subsc_end_date`:a kuukaudella jokaisella *pidennys – jälkiveloitus* -CR:llä. Siksi:
- **Jälkiveloituspyörä ilman huoltopidennystä:** päivät sanovat N kk, rivejä ei ole → `NOT_PRICED` (69 kpl). Hinnoittelu estyi sattumalta oikein.
- **Jälkiveloituspyörä, jolla on myös huoltopidennys:** molemmat sanovat *kyllä* → hinnoitellaan bracketilla
  *huolto + jälkiveloitus* kk → hyvitys on 1–2 brackettia liian suuri.

### Todennus (N)

Jokaiselle lokakuun lähetetylle pyörälle verrattiin `extension_months`:ia huoltosumman edellyttämään kuukausimäärään
(pienin `prolong_months`, jonka `max_amt_incl_vat / (1 + vat/100)` ≥ `maintenance_sum`). **742 täsmää. Kuusi ei täsmää**, ja
jokaisella erotus on täsmälleen pyörän *pidennys – jälkiveloitus* -CR:ien määrä:

| Pyörä | org_end | Pidennys | Huolto edellyttää | Jälki-CR:t | Huolto netto | Linkki | Oikea (K) | Ero |
|---|---|---|---|---|---|---|---|---|
| B001767 | 30.04. | 6 | 4 | 6441, 6891 | 230,20 | 9,96 € | 169,96 € | −160,00 |
| B002022 | 31.05. | 5 | 4 | 6893 | 202,95 | 55,77 € | 135,77 € | −80,00 |
| B003047 | 30.06. | 4 | 3 | 6896 | 183,27 | 111,07 € | 191,07 € | −80,00 |
| B003243 | 31.07. | 3 | 1 | 6451, 6898 | 47,81 | 21,07 € | 181,07 € | −160,00 |
| B006488 | 30.06. | 4 | 2 | 6473, 6924 | 119,52 | **3,45 € — maksettu 1.10.** | 163,45 € | −160,00 |
| B023007 | 30.06. | 4 | 3 | 6951 | 190,28 | 68,41 € | 148,42 € | −80,01 |

Settlementit samalla mekanismilla (lokirivien bracket vs. huoltosumman bracket):

| Pyörä | org_end | Lokin bracket | Huolto edellyttää | Hinta netto | Huolto netto | Kirjattu | Oikea (K) |
|---|---|---|---|---|---|---|---|
| B002668 | 31.03. | 7 kk (447) | 5 kk (319,51) | 148 | 275,04 | tapa 3, 0 € | 129,93 € |
| B002729 | 30.06. | 4 kk (255,77) | 1 kk (64,53) | 161 | 62,95 | tapa 3, 0 € | 200,07 € |
| B003264 | 31.05. | 5 kk (319,51) | 3 kk (192,02) | 150 | 151,39 | tapa 3, 0 € | 137,26 € |
| B006941 | 31.05. | 5 kk (319,51) | 3 kk (192,02) | 134 | 162,54 | tapa 3, 0 € | 131,17 € |

Jokaisella on Done-tilaiset tyypin 7 CR:t: B002668 6445 ja 6894, B002729 4740, 6446 ja 6895, B003264 6452 ja 6899, B006941 6475 ja 6926.
B006956 (30.09.) on **oikein**: 5 kk huoltoa, 5 kk pidennystä, ei CR:iä, joten hinta 40 − 51 → 0.

"Oikea" tarkoittaa saman kaavan tulosta huoltosumman bracketilla. Sitä, kattaako maksettu jälkiveloitusvuokra osan lunastuksesta,
ei ole laskettu. [ADR 0009](../docs/adr/0009-kauden-lopun-lunastus.md) kohta 5 (K2) sanoo, että jälkiveloitus päättyy, kun
maksetut tyypin 7 laskut kattavat `end_redemption_price`:n, ja silloin tapa on **2**, ei 3. Kummallakaan tavalla
tapa 3 ei ole näille neljälle oikea perustelu.

**B046508:** hinta 0, kaksi tyypin 7 CR:ää (6513 ja 6972, Done), `org_end` 31.08. TASKS:n K2-listalla on avoinna kysymys *"Onko hinta
oikeasti 0 vai puuttuuko se?"* Skripti kirjasi tavan 4 kysymättä, koska sen sääntö on *0 € = käsiraha*, ja status on nyt 2.
**B046755** (hinta 0, ei CR:iä) on repon säännön mukainen.

### NOT_PRICED 69 (N)

Kaikilla 69:llä `subsc_org_end_date` < 1.10. ja Done-tilainen tyypin 7 CR. 68 on yhä status 1 ilman tapaa, ja yksi on sittemmin maksanut (status 2, tapa 1).
68 ilmoittaa *dates say N month(s), prolongation agreement rows say none*. B010533 ilmoittaa *extension shorter than the spend*.
Lista: B003230, B003462, B003531, B003679, B003698, B003714, B003747, B004076, B004121, B004271, B004475, B004513,
B004531, B004543, B004566, B004630, B004667, B004852, B004857, B005057, B005224, B005300, B005359, B006263, B006432,
B006728, B007218, B007263, B007326, B009045, B010533, B010681, B010817, B011244, B012132, B013198, B014017, B014671,
B014826, B015132, B015501, B016491, B016535, B016555, B016591, B017920, B020339, B021401, B022581, B023015, B023763,
B024260, B025070, B025313, B026058, B026345, B029068, B029420, B029828, B030349, B030615, B030725, B033147, B033376,
B033546, B035615, B036062, B036435, B046667.

Pyöriä ei leimata. Ne valitaan siis joka päivä uudelleen, kunnes `subsc_end_date` ohittaa ikkunan, ja sama 68 riviä
toistuu jokaisessa digestissä. Jälkiveloituksen siirrettyä päivän 30.11.:een ne palaavat taas.

## 4. Miten repo kytkeytyy muihin (K, ketju todennettu 1.10. maksuilla (N))

```
send-end-redemption-payment-link (1479)
  lukee  bike register: status, order_type, end_redemption_price, maintenance_sum,
         subsc_end_date, subsc_org_end_date, liab_settle_method, end_red_so_created, externalid, enduser
         agreement row: is_prolongation_line · transaction: SO custbody_sta_is_so_type = 4
         customrecord_sta_maint_extending_months (sama taulu kuin ic-calculatorsilla)
  kirjoittaa bike register: custrecord_gbb_eredem_link_sent (vain tämä repo),
         liab_settle_method 3/4 + liab_settled_at = ajopäivä (write-once)
  ulos   Paylink POST /orders: notes = bike externalid, tuote "Työsuhdepyörän loppulunastus"
         Brevo template 65 (jaettu /SuiteScripts/Brevo/lib_brevo_api.js), digest N/email → info@
        │
        ▼ asiakas maksaa
paylink-order-tracking: order_sync → customrecord_payment_requests
  → paylink_ns_processor.ue.js: findBike(notes = externalid), PRODUCT_MAP["Työsuhdepyörän loppulunastus"]
    → item 46, SO type 4, Customer Deposit
  → paylink_post_processor.ss2.js: end_red_so_created = T (vain "completed today")
        ▼
bike-redemption-status-sync (1440): osa A (pr completed + SO type 3/4, ±5 pv) → paid_at + tapa 1
  → sweep: status 2 päättymiskuun alussa (myös tavat 3/4, jotka tämä repo kirjoitti)
        ▼
subscription-extension 1.11.: maksamaton → tyypin 7 CR → handler_jalki siirtää subsc_end_date
  → pyörä palaa tämän repon ikkunaan (link_sent = T estää uuden linkin vain, jos linkki on tämän repon lähettämä)
```

Havaitut kytkökset ja epäsymmetriat:

1. **Pidennyksen ankkuri vs. jälkiveloitus** (yllä, kohta 3). Korjaus kuuluu omistavaan repoon.
2. **IC-laskuri ankkuroi toisin (K).** `netsuite-ic-calculators/src/gbb_ic_redemption_price_mr.js:158` laskee tehollisen
   vuokra-ajan **huoltosummasta** (`resolveEffectiveLeasePeriod(maintenanceSum, …)`). Maksulinkki ankkuroi voimassa
   olevaan pidennykseen. Sama bracket-taulu, kaksi eri sääntöä. Repon oman mittauksen mukaan (14.9.) ne eroavat 1 096 pyörällä.
3. **Tuotenimi on reitityksen avain (K).** Paylinkin rivin otsikko tulee parametrista `custscript_gbb_eredem_item_title`
   (oletus `Työsuhdepyörän loppulunastus`). `paylink_ns_processor.ue.js:28` reitittää täsmälleen tällä tekstillä
   item 46:een ja SO type 4:ään. Jos parametri muuttuu, jokainen maksu menee tilaan *Error: No product configuration*.
   Tämä on sama nimiriippuvuus kuin CR-tyypin `altname`-reitityksessä.
4. **`notes` = `externalid` (N).** step 3 löysi kaikki 215 pyörää 1.10.
5. **`liab_settled_at` puuttuu 215 maksetulta (N).** Vanha osa A kirjoittaa tavan 1 ilman `liab_settled_at`:ia
   (sama kuin T1/T26). Kenttäsääntöjen § 9 vaatii maksupäivän. Tämä täydennetään T26:n viikkotarkistuksessa tai 2.0:ssa,
   ei tässä repossa.
6. **`end_red_so_created` = F kaikilla 215:llä (N).** Post-processor leimaa vain *completed today* -pyynnöt. Leimaa ei
   ollut 2.10. klo 10. Tällä ei ole vaikutusta tämän repon valintaan (`link_sent` ja tapa estävät uuden linkin), mutta leima on
   tarkistettava, ennen kuin jokin luottaa siihen.
7. **Tapa 3/4 ja `liab_settled_at` = ajopäivä** ovat [ADR 0009](../docs/adr/0009-kauden-lopun-lunastus.md):n mukaisia. Huomaa
   ajoitus: 30 päivän ikkuna valitsee 30.11. päättyvän kohortin jo 31.10. Silloin tapa 3/4 kirjoitetaan ennen päättymiskuuta.
   Sweep kääntää statuksen silti vasta 1.11., joten statusvaikutus on oikea. ADR 0009:n kohta 4 (*tapa vasta päättymiskuussa*)
   koskee tapaa 1, ei tapoja 3/4.
8. **OOMI on rajattu pois** (`order_type IS NULL OR <> 3`), kuten ADR 0009 kohta 6 edellyttää.

## Jälkitarkistukset

```sql
-- lähetetyt, joiden pidennys ≠ huoltosumman edellyttämä (odotus korjauksen jälkeen: 0 uutta)
SELECT br.name, ROUND(MONTHS_BETWEEN(br.custrecord_sta_subsc_end_date, br.custrecord_sta_subsc_org_end_date)) AS ext_m,
       (SELECT MIN(m.custrecord_sta_me_prolong_months) FROM customrecord_sta_maint_extending_months m
         WHERE m.isinactive = 'F'
           AND m.custrecord_sta_me_max_amt_incl_vat / (1 + m.custrecord_sta_me_vat / 100) >= br.custrecord_sta_maintenance_sum) AS implied_m
FROM customrecord_sta_bike_register br
WHERE br.custrecord_gbb_eredem_link_sent = 'T'
  AND ROUND(MONTHS_BETWEEN(br.custrecord_sta_subsc_end_date, br.custrecord_sta_subsc_org_end_date)) > 0

-- ajon yhteenvedot
SELECT TO_CHAR(date, 'YYYY-MM-DD HH24:MI') ts, title, detail FROM scriptnote
WHERE scripttype = 1479 AND date >= TO_DATE('2026-10-01', 'YYYY-MM-DD')
  AND (title LIKE '%selection%' OR title LIKE '%run complete%' OR title LIKE '%ABORT%')
ORDER BY date
```

Ensimmäinen kysely kääritään alikyselyksi ja suodatetaan ehdolla `ext_m <> implied_m` (§ 3:n ajo).
`implied_m` on taulun pienin bracket, jonka yläraja kattaa summan. Se ei siis ole huoltopidennyksen
kuukausimäärä, kun summa on 0 tai negatiivinen. Ratchet-hyvitystapaukset (repon 14.9. päätös) on luettava
erikseen, eikä niitä pidä pitää virheinä.
