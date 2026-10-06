# Maksulinkin tutkittavat pyörät: käsittelyloki

Pyöräkohtainen käsittely: [TASKS](../TASKS.md) T31–T36 ja [`2026-10-02-maksulinkki-tutkittavat.csv`](2026-10-02-maksulinkki-tutkittavat.csv).
Tausta: [ensimmäisen ajon löydös](2026-10-02-maksulinkki-ensimmainen-ajo.md). Vain luku, ei kirjoituksia NetSuiteen.
(N) = todennettu NetSuitesta, (K) = laskettu tai päätelty.

**Käyttöohje.** Pyörät käsitellään yksi kerrallaan. Kun pyörän syy osoittautuu yhteiseksi, se kirjataan alle
**yhteiseksi selvitykseksi (R-numero)**, jolla on tunnistusehto ja tarkistuskysely. Seuraava pyörä, joka täyttää
saman ehdon, merkitään kirjanpitoon viitteellä, eikä sitä selvitetä uudelleen. Pyöräkohtainen osio kirjoitetaan vain,
jos pyörällä on jotain, mitä R-selvitys ei kata.

---

## Rajaus ja tilanne (2.10.)

**Tehtävä (tuoteomistaja 2.10.):** selvitetään virheelliset Paylink-tilaukset, jotka johtuvat maksulinkkiskriptin logiikkavirheistä.
Jälkiveloitusketjun ongelmat (R6) kirjataan projektiin ([TASKS](../TASKS.md) § *Auki, ei päivää*), mutta ne eivät kuulu tähän.

**Kaikkien 748 lähetetyn linkin läpikäynti (N, 2.10.):**

| Ryhmä | Pyöriä | Tulos |
|---|---|---|
| Uusi kohortti (`org_end` ≥ 1.10.), ei jälkiveloitus-CR:ää | 644 | Hinta oikein: pidennys = summan edellyttämä, joten ankkurin valinta ei vaikuta |
| `org_end` < 1.10., ei tyypin 7 CR:ää, pidennys = summan edellyttämä | 95 | Hinta oikein. Huoltopidennys siirsi todellisen päättymisen 31.10.:een, joten nämä kuuluvat lokakuun kohorttiin. Maksettu 20 |
| `org_end` < 1.10., jälkiveloitus-CR, pidennys ≠ summan edellyttämä | **6** | **Väärä hinta = T31 (R1)** |
| B031624: CR 4633 *Jälkiveloitus - Poikkeus*, pidennys 7 = summan edellyttämä 7 (404,10 €) | 1 | Hinta oikein (71,66 €), maksettu 1.10. |
| B005265, B010594: tyypin 7 CR *2A - jälkiveloitus* (siirtopaketti), ei pidennystä | 2 | Hinta oikein |

**Virheellisiä Paylink-tilauksia on siis kuusi, ja ne kaikki ovat T31:ssä.** Muut CSV:n ryhmät eivät ole tilauksia:
- T32 ja T33 ovat skriptin kirjoittamia selvitystapoja, eivät tilauksia. T32:ssa kyse on logiikkavirheestä (R2).
- T34–T36 ovat ohituksia. Tilausta ei syntynyt.

**Tuplatilauksen riski (R3):** **B015132** maksoi 1.10. klo 22:50 Paylink-tilauksen **340954**. Se on manuaaliprosessin tilaus, luotu 31.08.2026,
eräpäivä 15.09., 164,97 € (N, `custrecord_pl_raw_json`). **Manuaalilinkit ovat siis Paylinkissä ja yhä maksettavissa.** T31:n kuudella
on todennäköisesti myös avoin manuaalitilaus (K). Asiakas voi maksaa kummankin, eikä sitä näe NetSuitesta ennen maksua. Manuaalitilauksen `notes` on
pyörän `externalid` (B015132: `6006840222`, vanhoilla pyörillä numero, uusilla `portal-bikeregistry-…`) (N). Sama avain toimii siis molemmissa.

**Käsitelty oikein (tuoteomistaja 2.10.):** **B046796**, ITSEHANKINTA, vuokra-aika 1 kk (lokakuu), hinta 84 €. Käsiraha 115,12 € maksettiin 28.08. Paylinkissä
(tilaus 339949). Linkki lähti 105,42 €:lla (tilaus 24798, maksamatta). Skripti toimi tallennetun hinnan mukaan, ja se on oikein.

**Ratkaisu tuplatilauksiin ja `link_sent`-täyttöön (tuoteomistaja 2.10.):** Paylinkistä ei haeta erillistä listaa. Sen sijaan
`netsuite-paylink-order-tracking` muutetaan niin, että **kaikki Paylink-tilaukset näkyvät NetSuitessa** `customrecord_payment_requests`-tietueina,
ja tietueiden käsittely (SO ja asiakasennakko) tapahtuu **vasta, kun maksu on tullut Paylinkiin**. Muutosta tekee tuoteomistaja itse.
Sen jälkeen K-b0 (täyttö) ja tuplatilausten tarkistus tehdään SuiteQL:llä: `notes` = `externalid`, tuote *Työsuhdepyörän loppulunastus*.

**Vaikutukset muihin, jotka muutoksessa on huomioitava (K, koodi 2.10.):**

| Kohta | Nyt | Huomio |
|---|---|---|
| `paylink_order_sync.ss2.js:45` | `GET /orders?status=completed&paid_after=…` | Maksamattomilla ei ole `paid_after`:ia. Ne tarvitsevat oman haun (luonti- tai muokkauspäivä), ja avoimet on haettava uudelleen, kunnes ne maksetaan tai poistetaan |
| `paylink_order_sync.ss2.js:125` | uusi rivi luodaan `ns_status = PENDING (2)` | **UE käsittelee PENDING-rivin heti luonnissa** (`paylink_ns_processor.ue.js:412`). Maksamaton rivi on luotava tilaan `NEW (1)` |
| `paylink_order_sync.ss2.js:151-153` | NEW → PENDING jokaisessa päivityksessä | Siirto saa tapahtua vain, kun `order.status = completed` |
| Paylinkissä poistettu tilaus | ei koskaan NetSuitessa | Poistettu, maksamaton tilaus jäisi NEW-tilaan pysyvästi. Tarvitaan tila tai merkintä |
| status-sync osa A (`gbb_ss_bike_redemption_status_sync.js:285-288`) | `ns_status = ?` + JOIN SO | Turvallinen: maksamattomalla ei ole SO:ta |
| subscription-extension tarkistus 2 (`mr_subscription_extension.js:107-111`) | `pl_status = 'completed'` | Turvallinen, jos maksamattoman `pl_status` on Paylinkin oma `pending` |
| cf-gbb-tools netsuite-alerts (`queries.ts:29-31`) | hälyttää tiloista 4 ja 5 | Turvallinen: NEW ei hälytä |
| `paylink_post_processor.ss2.js:88` | `ns_status = COMPLETED`, *completed today* | Ei muutosta |
| `custrecord_pl_ns_bike_id` | asetetaan vasta käsittelyssä | Maksamattomalla rivillä bike-id on tyhjä, joten täsmäytys tehdään `notes`:n kautta |

---

## Kirjanpito

| Pyörä | Tehtävä | Selvitys | Tila | Auki |
|---|---|---|---|---|
| B001767 | T31 | R1, R3 | selvitetty 2.10., hinta kirjattu, **asiakaspalvelulle** | — |
| B002022 | T31 | R1, R3 | selvitetty 2.10., hinta kirjattu, **asiakaspalvelulle** | — |
| B003047 | T31 | R1, R3 | selvitetty 2.10., hinta kirjattu, **asiakaspalvelulle** | — |
| B003243 | T31 | R1, R3 | selvitetty 2.10., hinta kirjattu, **asiakaspalvelulle** | — |
| B006488 | T31 | R1, R3, R4, [oma osio](#b006488) | selvitetty 2.10., hinta ja muodostuminen kirjattu | — |
| B023007 | T31 | R1, R3 | selvitetty 2.10., hinta kirjattu, **asiakaspalvelulle** | — |
| B002668 | T32 | R2, R3, [oma osio](#b002668) | selvitetty 2.10. | käsin tehty lasku INVGBB1014923 |
| B002729 | T32 | R2, R3 | selvitetty 2.10. (R2-tarkistus) | tapa 3 → 2 (kirjoitus) |
| B003264 | T32 | R2, R3 | selvitetty 2.10. (R2-tarkistus) | tapa 3 → 2 (kirjoitus) |
| B006941 | T32 | R2, R3 | selvitetty 2.10. (R2-tarkistus) | tapa 3 → 2 (kirjoitus) |
| B046508 | T33 | R5, R6, [oma osio](#b046508) | selvitetty 2.10. | R5:n vahvistus; jälkiveloituksen purku (R6) |
| B010348 | — (uusi) | R7 | selvitetty 2.10.: uusi linkki oikea, manuaalitilaus 331600 vanhentunut | poistetaanko 331600? |
| B046755 | T33 | R5 | selvitetty 2.10. (R5-tarkistus): tapa 4 ja status 2 oikein, jos R5 vahvistetaan | R5:n vahvistus |

**Päätökset 2.10. (tuoteomistaja):**
- **D-R1a:** Oikeat hinnat ja vian syy kirjataan. Asiakaspalvelu hoitaa loput (ks. [luovutustaulukko](#luovutus-asiakaspalvelulle)).
- **D-R1b (B006488):** Oikea hinta kirjataan, ja selvitetään, mistä näin pieni hinta muodostui (ks. [B006488](#b006488)).
- **T32 / B002668:** Loppuvastuut on hoidettu ylimääräisillä vuokrilla, joko yhdessä käyttämättömän huoltobudjetin kanssa tai yksin.
  Tapa on siis **2 `redemption_extra_rent`**, ei 3.
- **Kattavuus (2.10.):** vuokrien tulee kattaa **lunastusmaksu, eli hinta − huoltohyvitys** (malli M1). ADR 0009 k. 5:n sanamuoto
  (*≥ `end_redemption_price`*) on päivitettävä vastaamaan tätä.
- **R3:n korjaus (2.10.):** jokaiselle pyörälle, jolle maksulinkki on lähetetty, merkitään `custrecord_gbb_eredem_link_sent`.
  Tämä olisi pitänyt tehdä ennen ensimmäistä ajoa.
- **Hyvityksen ankkuri (2.10.):** 14.9. kaava on muuten oikea, mutta **huoltohyvitys lasketaan `custrecord_sta_maintenance_sum`:sta**, ei pidennyksestä.
  Bracket valitaan siis huoltosummasta. Tämä kumoaa 14.9. päätöksen rivin *Refund anchor*, ja muut 14.9. rivit jäävät voimaan. Tällä säännöllä R1 ja R2
  eivät olisi syntyneet ollenkaan, koska jälkiveloituskuukaudet eivät vaikuta summaan.
- **`link_sent` (2.10., tarkennus):** kenttä olisi pitänyt päivittää kaikille, joille maksulinkki oli lähetetty edellisellä järjestelmällä.
- **B006488 (5.10.):** haluttu lopputulos: linkistä vähennetään vain huoltohyvitys 8,76 € → 130,24 € netto (163,45 € brutto). Sääntö ja kaava vahvistettu.
- **Negatiivinen huoltosumma (5.10.):** vähennetään **kokonaan**, ei kattoa. Kumoaa R4:n 64,54 €:n katto-kysymyksen (B000928 → 79,68 €).
- **B013412 (5.10.):** negatiivinen huoltosumma (−272,27) kattaa koko lunastushinnan (67). Linkkiä ei olisi pitänyt lähettää. Oikea toimenpide:
  `custrecord_gbb_liab_settle_method` = 3 (`redemption_maint_budget`) ja `custrecord_gbb_liab_settled_at` = ajopäivä. Sama koskee B030445:ää (−175,30 ≥ 127),
  joten se suljetaan tällä päätöksellä (L2).
- **B019989 (5.10.):** linkki lähtee, summa 131,00 − 39,84 = **91,16 € netto** (114,41 € brutto). Lähetetty 164,41 € on 50,00 € brutto liikaa (L2).
- **B021054 (2.10.):** pyörän huolloissa on sekavuutta, mutta lopputuloksen pitää olla, että loppulunastusmaksusta hyvitetään **35,06 € netto** (R4).

---

## Yhteiset selvitykset

### R1 — Jälkiveloituskuukaudet hyvitettiin käyttämättömänä huoltobudjettina

**Tunnistusehto (kaikkien täytyttävä):**
1. Lokin hintapolussa `leaseExtension` = huoltosumman edellyttämä kk + Done-tilaisten tyypin 7 CR:ien määrä.
2. Pyörällä on huoltopidennyksen rivi (`is_prolongation_line = 'T'`, item 30), joten tarkistus 7 päästi pyörän hinnoitteluun.

**Mekanismi (K, koodi + loki):** `handler_jalki` siirtää `subsc_end_date`:a jokaisella jälkiveloitus-CR:llä
(`handler_jalki.js:145-152`). Maksulinkki valitsee bracketin `prolong_months = leaseExtension` ja vähentää hinnasta
`bracket.max − maintenance_sum`. Jälkiveloituskuukausi ei ole huoltobudjettia, joten jokainen CR kasvattaa hyvitystä
yhden bracketin verran, eli noin 63,75 € netto (80 € brutto). Bracketin ylärajat netto: 1 kk 64,53 · 2 kk 128,28 · 3 kk 192,02 ·
4 kk 255,77 · 5 kk 319,51 · 6 kk 383,26 · 7 kk 447,00.

**Todennus 2.10. (N), T31:n kuusi pyörää:**

| Pyörä | org_end | Pidennys | Jälki-CR | Pidennys − CR | Huolto netto | Huolto edellyttää | Skriptin bracket | Linkki |
|---|---|---|---|---|---|---|---|---|
| B001767 | 30.04. | 6 | 2 (6441, 6891) | 4 | 230,20 | 4 kk | 6 kk | 9,96 € |
| B002022 | 31.05. | 5 | 1 (6893) | 4 | 202,95 | 4 kk | 5 kk | 55,77 € |
| B003047 | 30.06. | 4 | 1 (6896) | 3 | 183,27 | 3 kk | 4 kk | 111,07 € |
| B003243 | 31.07. | 3 | 2 (6451, 6898) | 1 | 47,81 | 1 kk | 3 kk | 21,07 € |
| B006488 | 30.06. | 4 | 2 (6473, 6924) | 2 | 119,52 | 2 kk | 4 kk | **3,45 €, maksettu** |
| B023007 | 30.06. | 4 | 1 (6951) | 3 | 190,28 | 3 kk | 4 kk | 68,41 € |

Jokaisella on yksi huoltopidennyksen vuokrarivi. Päivät täsmäävät: `org_end` + huoltokuukaudet + jälkiveloituskuukaudet
= 31.10.2026 kaikilla kuudella. Esimerkiksi B001767: 30.04. + 4 kk = 31.08., jonka jälkeen jälkiveloitukset syys- (CR 6441)
ja lokakuulta (CR 6891). Pyörät eivät lunastaneet sopimuskautensa lopussa, joten pidennys on vuokraa eikä käyttämätöntä huoltoa.

**Korjaus skriptiin:** T37 K-a. Uusi pyörä tunnistetaan R1:een [ensimmäisen ajon löydöksen](2026-10-02-maksulinkki-ensimmainen-ajo.md)
§ *Jälkitarkistukset* ensimmäisellä kyselyllä (`ext_m <> implied_m`). Lisäksi `ext_m − implied_m` = Done-tilaisten tyypin 7 CR:ien määrä.

### R2 — Tapa 3 kirjattiin, koska jälkiveloituskuukaudet paisuttivat hyvityksen yli hinnan

R1:n mekanismi settlement-haarassa. Kun paisunut hyvitys ylittää `end_redemption_price`:n, hinta leikataan nollaan, ja skripti kirjoittaa
tavan 3 `redemption_maint_budget` ja `liab_settled_at` = ajopäivä. Sweep kääntää statuksen 2 päättymiskuussa.

**Tunnistusehto:** lokirivi `SETTLED_MAINT_BUDGET`, ja R1:n ehto 1 täyttyy (bracket = huolto + jälki-CR:t).

**Todennus 2.10. (N):**

| Pyörä | Hinta netto | Huolto netto | Huolto edellyttää | Oikea hyvitys | Skriptin bracket / hyvitys | Jälki-CR:t ja laskut |
|---|---|---|---|---|---|---|
| B002668 | 148 | 275,04 | 5 kk | 44,47 | 7 kk / 171,96 | 6445 (INVGBF1043328, syyskuu), 6894 (INVGBF1043445, lokakuu), molemmat avoimia |
| B002729 | 161 | 62,95 | 1 kk | 1,58 | 4 kk / 192,82 | 4740 (INVGBF1039242, elokuu, **maksettu**), 6446 (INVGBF1043329) ja 6895 (INVGBF1043446) avoimia |
| B003264 | 150 | 151,39 | 3 kk | 40,63 | 5 kk / 168,12 | 6452 (INVGBF1043335), 6899 (INVGBF1043450), avoimia |
| B006941 | 134 | 162,54 | 3 kk | 29,48 | 5 kk / 156,97 | 6475 (INVGBF1043358), 6926 (INVGBF1043477), avoimia |

**Oikea tapa on 2** (päätös 2.10.), koska jälkiveloitusvuokrat kattavat lunastushinnan (R3). Tapa 3 on väärä perustelu.
TASKS:n arvio *"noin 598 € perimättä"* **ei pidä**: summa on laskutettu jälkiveloituksena, kunhan laskut maksetaan.

Kattavuus täyttyy (K, ADR 0009 k. 5: vain maksetut laskut):
- **B002668, B003264, B006941:** kumpikin lasku (syys- ja lokakuu) tarvitaan molemmissa malleissa. Esimerkiksi B006941: 92,60 + 29,48 = 122,08 < 134.
- **B002729:** elo- ja syyskuu riittävät (185,20 ≥ 161). Lokakuun lasku jää ylimääräiseksi. ADR 0009 k. 5: *"siitä ei tehdä automaattisesti mitään"*.

**Mitä rekisteriin pitää kirjoittaa (ei kirjoitettu, ehdotus):** tapa 3 → 2. `liab_settled_at` = sen jälkiveloituslaskun maksupäivä, jolla
kattavuus täyttyy (ADR 0009, taulukko). Laskut ovat avoimia, joten päivää ei vielä ole. Siihen asti `liab_settled_at`:n arvo 1.10. on väärä,
mutta se on ainoa arvo, joka pitää statuksen 2 perusteltuna. **Päätettävä:** tyhjennetäänkö `liab_settled_at` odottamaan maksua, vai jätetäänkö
1.10. ja korjataan maksun jälkeen? Status 2 ja jälkiveloituksen loppuminen 1.11. ovat oikein kaikilla neljällä, jos laskut maksetaan.

### R3 — `link_sent` puuttui manuaaliprosessissa linkin saaneilta, joten jälkiveloituspyörät saivat toisen linkin

**Työnkulku (tuoteomistaja 2.10.):**

```
1. maksulinkki (netstuite-send-end-redemption-payment-link) ennen päättymistä
2. loppukäyttäjä ei maksa ajoissa
3. netsuite-subscription-extension tekee pidennyksen (tyypin 7 CR) → handler_jalki laskuttaa ylimääräisen vuokran
4a. lunastusmaksu saapuu → pyörä lunastetuksi (tapa 1)
4b. maksua ei tule → vuokria laskutetaan, kunnes maksu saapuu tai ylimääräiset vuokrat kattavat lunastusmaksun (tapa 2)
```

Jälkiveloitus on sallittu vain tietyille pyörille ja vain, jos lunastusmaksua ei makseta. Maksulinkin ei siis kuulu vähentää jälkiveloitusvuokria:
kun linkki lähtee oikeaan aikaan, niitä ei vielä ole. *2.10. aiemmin kirjattu tulkinta "maksulinkki ei huomioi jälkivuokria, korjataan
vähentämällä" (K-h) oli väärä ja on peruttu.*

**Mikä meni pieleen:** kaikki 80 pyörää ovat syyskuun tai vanhempia kohortteja, jotka vanha manuaaliprosessi oli jo laskuttanut.
Ne olivat 1.10. vaiheessa 3–4b. Repo tiesi tämän (`docs/DEPLOYMENT.md:259`: *"The 30.09.2026 cohort (694) was already invoiced manually and is
excluded by `not_before = 2026-10-01`"*). Lattia rajaa kuitenkin liikkuvaa `subsc_end_date`:a, ja `handler_jalki` oli siirtänyt sen 31.10.:een.
**Oikea suoja olisi ollut `custrecord_gbb_eredem_link_sent = T`** jokaiselle pyörälle, joka oli jo saanut maksulinkin manuaaliprosessissa
(tuoteomistaja 2.10.). Kenttä luotiin 14.9. tyhjänä (`DEPLOYMENT.md:272`, *"0 already flagged"*), eikä sitä täytetty ennen ensimmäistä ajoa.

**Täyttö ei onnistu NetSuitesta (N, 2.10.):** `customrecord_payment_requests`:ssa on vain maksettuja Paylink-tilauksia (status `completed`
tai tyhjä, ei `pending`-rivejä). Maksamatta jääneet manuaalilinkit, eli juuri jälkiveloitukseen päätyneet pyörät, eivät näy NetSuitessa lainkaan.
Esimerkiksi T31:n ja T32:n kymmenellä pyörällä on yksi ainoa pyyntö, B006488:n 1.10. maksama 3,45 €. Lähetettyjen linkkien lista on haettava
**Paylinkistä** (`GET /orders`, tuote *Työsuhdepyörän loppulunastus*, `notes` = pyörän `externalid`) tai manuaaliprosessin omasta kirjanpidosta.

R1 ja R2 ovat tämän seurauksia. Jos valinta olisi rajannut jälkiveloituspyörät pois, kumpaakaan ei olisi syntynyt.

**Mitä tämä tarkoittaa erän pyörille:** ne ovat vaiheessa 4b, ja niiden loppu määräytyy työnkulun mukaan. Joko lunastusmaksu saapuu, tai ylimääräiset
vuokrat kattavat sen. Jokainen tähän mennessä nähty jälkiveloituslasku on 116,21 € brutto = **92,60 € netto** (vuokra 80,65 + toimistokulu 11,95) (N),
ja ne on laskutettu työnantajalta 16.08., 16.09. ja 30.09. maksuehdolla 30 pv. **Kattavuus (päätös 2.10., M1):** maksetut jälkivuokrat
≥ lunastusmaksu = hinta − huoltohyvitys.

**Korjaus:** (1) Kertaluontoinen täyttö: `link_sent = T` kaikille manuaaliprosessissa linkin saaneille (T37 K-b0). (2) T37 K-b, varmistus:
skripti ohittaa pyörän, jolla on Done-tilainen *pidennys – jälkiveloitus* -CR, vaikka lippu puuttuisi. K-a koskee enää R4:ää.

### R4 — Huoltohyvitys voi skriptissä ylittää yhden bracketin

**Tuoteomistaja 2.10.:** huoltosumman hyvitys ei voi koskaan ylittää noin 64,54 € netto.

**Miten skripti laskee (K, `lib_gbb_redemption_price.js:136-183`, `gbb_mr_send_end_redemption_paylink.js:359-365, 477-492`):**

```
pidennys  = ROUND(MONTHS_BETWEEN(subsc_end_date, subsc_org_end_date))   -- kaikki siirrot, syystä riippumatta
rivit     = huoltopidennysrivejä on / ei ole                              -- vain kyllä/ei
implied   = pienin bracket, jonka yläraja ≥ maintenance_sum
jos implied > pidennys          → NOT_PRICED
jos pidennys = 0                → hyvitys 0
muuten  bracket = se, jonka prolong_months = pidennys
        hyvitys = bracket.yläraja − maintenance_sum                       -- ei ylärajaa
hinta    = max(0, end_redemption_price − hyvitys) × 1,255
```

Skripti **ei tunne jälkiveloituksia lainkaan**. Se ei lue tyypin 7 CR:iä eikä laskuja. Jälkiveloitus vaikuttaa vain siksi, että `handler_jalki` siirtää
`subsc_end_date`:a, ja skripti pitää jokaista siirrettyä kuukautta huoltopidennyksenä. Jokainen jälkiveloituskuukausi lisää hyvitykseen
yhden bracketin, eli noin 63,75 € netto.

**Tuoteomistajan sääntö pitää, kun bracket valitaan huoltosummasta:** hyvitys = implied.yläraja − summa, ja se on pienempi kuin bracketin leveys.
Ensimmäisen bracketin leveys on 64,53 € (0,01–64,53), ja muiden noin 63,75 €. Esimerkiksi B006488: 128,28 − 119,52 = 8,76.

**Skripti rikkoo sääntöä kahdessa tapauksessa:**
1. Jälkiveloitus (R1/R2). Estetään R3:n korjauksella.
2. Hyvitetty huolto, kun pidennys jää voimaan (repon 14.9. päätös, alla).

**Mitä 14.9. päätös sisältää** (`docs/DEPLOYMENT.md:259-272`, `lib_gbb_redemption_price.js:21-34`, `docs/NETSUITE_REFERENCE.md:300-326`):

| Kohta | Päätös 14.9. |
|---|---|
| Hyvityksen ankkuri | **Pidennys, ei huoltosumma.** Hyvitys = sen bracketin yläraja, jonka `prolong_months` = pidennys, miinus huoltosumma. Korvasi 11.9. säännön *"summa ≤ 0 ja pidennys → hinnoitellaan pidennyksen bracketilla"* |
| Perustelu | Pidennys on yksisuuntainen (`sta_ue_bike_register_hook.js` vain lisää kuukausia). Kun huoltolasku hyvitetään, summa laskee, mutta vuokrakuukaudet jäävät. Summaan ankkuroiminen ei hyvittäisi mitään, vaikka asiakas maksoi budjetista, jota hän ei käyttänyt |
| Pidennyksen lähde | Molemmat: `MONTHS_BETWEEN`-pidennys ja huoltopidennysrivien olemassaolo. Ristiriita (~98 pyörää) raportoidaan, ei hinnoitella |
| Pidennys lyhyempi kuin summa edellyttää | Raportoidaan, ei hinnoitella (330 pyörää) |
| Hyvitys > hinta, tai hinta < 0,65 € | Hinta 0 €, ei Paylink-tilausta (24.9. alkaen skripti kirjaa tavan 3 itse) |
| Lattia | Ensimmäinen kohortti 31.10.2026. 30.09. kohortti (694) laskutettiin käsin, ja se rajataan pois `not_before = 2026-10-01`:llä |
| `link_sent` | Kenttä luotiin 14.9. Ei yhtään merkittyä |
| Maksamaton linkki | Ei tämän repon asia. Hoidetaan jälkiveloituksella ja tavalla `redemption_extra_rent` |

Ratchet-tapauksia on koko tilissä 429 (summa ≤ 0 ja pidennys > 0). Näistä kolmella summa on negatiivinen: B000928 −79,68 (2 kk), **B021054 −35,06 (2 kk)**
ja B034352 −0,01 (3 kk).

**B021054 (tuoteomistaja 2.10.):** oikea hyvitys on **35,06 € netto**. Skripti antaisi 128,28 − (−35,06) = 163,34. Pyörä päättyy 30.09.2028, joten
asia ei ole kiireellinen. 35,06 = 0 − (−35,06), eli summasta laskettu hyvitys silloin, kun yhtään brackettia ei ole käytetty (yläraja 0).
**Päätös 2.10.:** hyvitys lasketaan huoltosummasta: (summan bracketin yläraja, tai 0, jos summa ≤ 0) − summa. Pidennys ei vaikuta hyvitykseen.
Tämä toistaa B006488:n (8,76) ja B021054:n (35,06). Normaalitapauksessa hyvitys jää alle 64,54 €:n. Ainoa poikkeus on negatiivinen summa, joka on alle
−64,54. Ainoa tunnettu tapaus on B000928 (−79,68 → 79,68 €, päättynyt 31.05.2026). Rajoitetaanko hyvitys tällöin 64,54 €:oon? Tämä on pieni
reunakysymys K-a:n toteutukseen.

### R5 — Itsehankintapyörän lunastushinta 0 € on tuotteen normaali (K, vahvistettava)

**Tunnistusehto:** `custrecord_sta_bike_order_type = 1` (ITSEHANKINTA) ja `end_redemption_price = 0`.

**Todennus 2.10. (N):**
- Itsehankintapyöriä on 405. Niistä 269:llä hinta on 0. Active-pyöristä hinta on 0 253:lla ja yli 0 76:lla.
- Hinta-0-pyöristä 223:lla on maksettu Paylink-pyyntö *Itsehankinnan käsiraha*. 30:llä sitä ei ole. NetSuiten Paylink-pyynnöt alkavat 26.05.2026.
- Kaikilla, joilla on alkupäivä, kuukausivuokra on 79,68 € netto (100 € brutto), ja vuokra-aika vaihtelee 1–54 kk.

**Päätelmä (K):** itsehankinnassa käyttäjä maksaa osan pyörästä käsirahana, ja loppulunastus on 0 €. Silloin skriptin tapa 4 `redemption_down_payment`
on oikea, ja TASKS:n kysymys *"onko hinta oikeasti 0 vai puuttuuko se?"* ratkeaa: hinta on oikeasti 0. **Vahvistettava tuoteomistajalta.**
B046508:lla ja B046755:llä ei ole käsirahapyyntöä NetSuitessa. B046508 luotiin 6.5. eli ennen Paylink-synkronoinnin alkua, ja B046755 11.8.

### R6 — subscription-extension tekee jälkiveloituksen pyörälle, jonka lunastushinta on 0 €

`mr_subscription_extension.js`:n tarkistukset 1–4 (rivit 51–148) katsovat vain, onko pyörällä maksettu lunastuslasku, valmis Paylink-pyyntö,
kattava sopimusrivi tai jo olemassa oleva jälkiveloitus-CR. Hintaa ja selvitystapaa ne eivät lue. Hinta-0-pyörällä ei ole mitään maksettavaa, joten
lunastuslaskua ei synny. Extension tulkitsee lunastuksen maksamattomaksi ja tekee tyypin 7 CR:n.

**Laajuus (N):** koko tilissä tämä koskee vain B046508:aa. Muilla 14:llä hinta-0-pyörällä tyypin 7 CR:t kohdistuvat kauden keskelle, eivät sen loppuun.
Uusissa kohorteissa maksulinkki kirjaa tavan 4, ja sweep kääntää statuksen 2 päättymiskuun alussa. Extension näkee vain Active-pyörät, joten
suoja on olemassa. Se on kuitenkin epäsuora. B046508 päättyi 31.08., ennen maksulinkin lattiaa.

**Korjausehdotus omistavaan repoon (`netsuite-subscription-extension`):** ohita pyörä, jonka `liab_settle_method` on asetettu tai `end_redemption_price` = 0.

### R7 — Tuplatilaukset: manuaalitilaus ja uusi linkki samalla pyörällä (N, 2.10. klo 17 jälkeen)

paylink-order-tracking-muutos on tuotannossa (tuoteomistaja 2.10.). Ensimmäisen ajon jälkeen `customrecord_payment_requests` sisältää 549
maksamatonta tilausta tilassa 6 *Pending payment*, eikä yhdelläkään ole SO:ta. Maksettuja on 9 916 tilassa 3. **Kaikki 748 maksulinkkiä löytyvät**
(481 pending, 274 completed; täsmäytys `custrecord_pl_ns_bike_id`:n kautta).

**Seitsemällä pyörällä on kaksi loppulunastustilausta:**

| Pyörä | Manuaalitilaus | Uusi linkki 1.10. | R1:n "oikea" | Tila | Tulkinta |
|---|---|---|---|---|---|
| B001767 | 330864, 31.07., **91,32 €**, pending | 351153, 9,96 €, pending | 169,96 € | status 1 | kaksi avointa, kumpikaan ei ole R1:n hinta |
| B002022 | 340714, 31.08., **57,12 €**, pending | 351155, 55,77 €, pending | 135,77 € | status 1 | sama |
| B003047 | 340722, 31.08., **112,42 €**, pending | 351160, 111,07 €, pending | 191,07 € | status 1 | sama |
| B003243 | 330910, 31.07., **102,42 €**, pending | 351161, 21,07 €, pending | 181,07 € | status 1 | sama |
| B006488 | 331081, 31.07., **84,08 €**, pending | 351359, 3,45 €, **maksettu 1.10.** | 163,45 € | status 2, tapa 1 | manuaalitilaus on yhä maksettavissa |
| B023007 | 341038, 31.08., **149,60 €, maksettu 2.10. klo 12:41** (SO SOGBB0015312, type 4) | 351659, 68,41 €, pending | 148,42 € | status 1 | **lunastus on maksettu.** Uusi linkki on tuplapyyntö ja on poistettava. Osa A kirjaa tavan 1 |
| B010348 | 331600, 31.07., **70,00 €**, pending | 351433, 33,28 €, pending | — (ei R1) | status 1 | uusi linkki on oikea (huolto 98,80 € → 2 kk, `org_end` 31.08. → 31.10.). Manuaalitilaus tehtiin ennen huoltopidennystä, joten se on vanhentunut |

**Täydellinen läpikäynti 3.10. ([löydös](2026-10-03-maksulinkki-ylimaaraiset-viestit.md)):** synkronoinnin täydennyksen jälkeen (maksamattomia 1 040) kaikki 748 linkkiä
käytiin läpi kaikilla tunnisteilla. **Ylimääräisen viestin saivat tasan nämä seitsemän**, eikä muita luokkia (jo maksettu, keskenkauden lunastus,
palautus, OOMI, hinta 0, kaksi 1479-linkkiä) löytynyt. 3.10. kukaan ei ole maksanut kahdesti.

**Huomio R1:n "oikeista" hinnoista (K):** manuaalitilaukset ovat 5/6 tapauksessa yhden bracketin verran pienempiä kuin R1:n hinta.
Laskettuna takaisin hyvitys + huoltosumma osuu 1,08 €:n tarkkuudella seuraavaan bracketiin (B001767: 318,43 vs. 5 kk:n 319,51; B003243: 127,20 vs. 2 kk:n 128,28).
Vain B023007:n manuaalihinta (149,60 €) on lähes R1:n hinta (148,42 €). Manuaaliprosessi käytti siis eri sääntöä. **Kumpi on oikea viite asiakaspalvelulle,
R1:n vai manuaaliprosessin hinta?** Sama kysymys koskee tulevia kohortteja, koska K-a toteuttaa R1:n säännön.

**OOMI erikseen:** 152 avointa manuaalitilausta 21.09. OOMI-pyörille, jotka päättyvät 11/2026. Maksulinkki rajaa OOMI:n pois, joten ne eivät ole tämän
tehtävän asia. Lisäksi 1 tilaus, jonka `notes` on *S2281405836 - Työsuhdepyörän loppulunastus - heikki@gobybike.fi* (1 685,48 €), on ilman pyörää.

**K-b0:n täyttö:** muilla kuin näillä seitsemällä ei ole manuaalista loppulunastustilausta NetSuitessa, eikä yhdelläkään T36:n 64 pyörästä ole
avointa manuaalitilausta. Täyttö ei siis poista T36:n pyöriä valinnasta, vaan siihen tarvitaan K-b:n jälkiveloitus-CR-ehto. Tarkistuskysely
tuplatilauksille (käytä tätä jatkossa):

```sql
SELECT br.name, LISTAGG(pr.custrecord_pl_order_id || ' ' || pr.custrecord_pl_status || ' ' || pr.custrecord_pl_amount_total, ' | ') orders
FROM customrecord_sta_bike_register br
JOIN customrecord_payment_requests pr ON pr.custrecord_pl_ns_bike_id = br.id
     AND pr.custrecord_pl_product_name = 'Työsuhdepyörän loppulunastus'
WHERE br.custrecord_gbb_eredem_link_sent = 'T'
GROUP BY br.name HAVING COUNT(*) > 1
```

---

## Luovutus asiakaspalvelulle

T31 (D-R1a). Brutto, ALV 25,5 %. **Linkki** on lähetetty summa. **Oikea ennen jälkivuokria** on R1:n korjaama hinta. **Oikea, kun jälkivuokrat
on maksettu** riippuu siitä, maksaako työnantaja avoimet jälkiveloituslaskut. Se on 0 €, jos vuokrat kattavat hinnan.

| Pyörä | Paylink-tilaus | Linkki | Oikea ennen jälkivuokria | Avoimet jälkilaskut | Oikea, kun jälkilaskut on maksettu (M1) | Tila |
|---|---|---|---|---|---|---|
| *Kaikilla kuudella on myös avoin tai maksettu manuaalitilaus (R7). Asiakaspalvelun on poistettava se tilaus, jota ei käytetä* | | | | | | |
| B001767 | 2099 | 9,96 € | 169,96 € | INVGBF1043324, INVGBF1043442 | **0 €** | maksamatta |
| B002022 | 2101 | 55,77 € | 135,77 € | INVGBF1043444 | 19,55 € | maksamatta |
| B003047 | 2106 | 111,07 € | 191,07 € | INVGBF1043447 | 74,86 € | maksamatta |
| B003243 | 2107 | 21,07 € | 181,07 € | INVGBF1043334, INVGBF1043449 | **0 €** | maksamatta |
| B006488 | 1785266682440 | 3,45 € | 163,45 € | INVGBF1043356, INVGBF1043475 | **0 €** | **maksettu 3,45 € 1.10.** |
| B023007 | 1785266682739 | 68,41 € | 148,42 € | INVGBF1043502 | 32,20 € | **lunastus maksettu 2.10. manuaalitilauksella 341038 (149,60 €). Uusi linkki poistetaan** |

**Vian syy asiakaspalvelulle:** Maksulinkin skripti vähentää lunastushinnasta käyttämättömän huoltobudjetin. Se laski budjetin
sopimuksen pidennyksestä, ja siihen oli virheellisesti laskettu mukaan myös jälkiveloituskuukaudet (vuokra, jota laskutetaan, kun pyörää ei
lunasteta ajallaan). Jokainen jälkiveloituskuukausi pienensi linkin summaa 80 €. Linkkiä ei olisi pitänyt lähettää lainkaan, koska pyörät olivat jo saaneet
lunastuslaskun vanhassa prosessissa ja olivat jälkiveloituksessa. Niiden lunastus päättyy, kun lunastusmaksu saapuu tai ylimääräiset vuokrat kattavat sen. B001767:n, B003243:n ja B006488:n
avoimet jälkiveloituslaskut kattavat lunastusmaksun kokonaan, kun työnantaja maksaa ne.

---

## Pyöräkohtaiset lisähavainnot

### B006488

**Miten 3,45 € muodostui (N, maksulinkin loki 1.10.):**

```
139 netto − 136,25 hyvitys (bracket 4 kk, yläraja 255,77; huolto 119,52; leaseExtension 4 kk) = 2,75 netto → 3,45 € brutto
```

`leaseExtension` 4 kk = 2 kk huoltopidennystä + 2 jälkiveloituskuukautta (syyskuu CR 6473, lokakuu CR 6924). Huolto 119,52 € edellyttää
vain 2 kk:n bracketin (yläraja 128,28). Oikea hyvitys on 128,28 − 119,52 = **8,76**, ja oikea hinta on 139 − 8,76 = 130,24 netto = **163,45 € brutto**.
Kaksi ylimääräistä brackettia toivat 127,49 € netto (160,00 € brutto) hyvitystä, jota ei olisi kuulunut antaa. Pieni hinta ei siis ole
pyöräkohtainen poikkeama: se on R1 ja sen ääripää. Hyvitys söi hinnasta 98 %, koska huoltosumma oli lähellä 2 kk:n bracketin ylärajaa
ja kaksi jälkiveloituskuukautta lisättiin päälle.

**Skriptin toiminta vaihe vaiheelta 1.10. (5.10., HEAD 210c82d; arvot lokista ja rekisteristä, N):**

| Vaihe | Koodi | Arvo B006488:lla | Tulos | Oikein? |
|---|---|---|---|---|
| Valinta | `gbb_mr_…:288-297` | Active, ei OOMI, `link_sent` F, tapa tyhjä, `subsc_end` 31.10. ≥ lattia 1.10. ja ikkunassa | valittiin | **Ei.** Manuaalitilaus 331081 (31.07.) oli jo lähetetty, mutta `link_sent` puuttui (K-b0), eikä valinta tarkista olemassa olevaa tilausta eikä jälkiveloitusta |
| 1–4 | `:428-454` | ei lippua, ei tapaa, `end_red_so_created` F, ei type 4 SO:ta (manuaalitilaus maksamatta) | ohitettiin kaikki | tarkistukset toimivat, mutta mikään niistä ei katso Paylink-tilausta tai jälkiveloitus-CR:ää |
| 5–6 | `:456-474` | hinta 139 | jatkoi | oikein |
| 7 | `:477-483` | pidennys 4 kk, huoltorivejä on | lähteet "samaa mieltä" | vertailu on vain kyllä/ei, joten 2 kk:n ero (jälkiveloitus) ei näy |
| Hinta | `lib_gbb_redemption_price.js:141, 154, 170, 178` | `impliedBySum` = 2 kk (128,28), 2 ≤ 4, joten ei NOT_PRICED. Ankkuri = 4 kk (255,77) | hyvitys 136,25 → 2,75 netto → 3,45 € | **Ei.** Ankkurin pitää olla `impliedBySum`, jolloin hyvitys 8,76 ja hinta 130,24 netto |
| Lähetys | `:509` → `sendPaymentLink` | — | Paylink 1785266682440 + Brevo + `link_sent` T | ei olisi pitänyt tapahtua (valintavirhe) |

**Kaksi skriptivirhettä, kaksi korjausta:**
1. **Lähetysvirhe (L3).** Lisätään per-pyörä-tarkistus vaiheiden 1–4 joukkoon: ohitetaan, jos pyörällä on (a) loppulunastustilaus `customrecord_payment_requests`:ssa (`custrecord_pl_ns_bike_id` tai `notes` = `externalid`, tuote *Työsuhdepyörän loppulunastus*, tila mikä tahansa) tai (b) Done-tilainen *pidennys – jälkiveloitus* -CR. Kertatäyttö `link_sent` = T (K-b0) ennen seuraavaa ajoa.
2. **Laskentavirhe (L1).** `lib_gbb_redemption_price.js:170`: ankkuri = `impliedBySum`, tai summan ≤ 0 tapauksessa yläraja 0. Pidennystä (`:359-360`) käytetään enää vaiheen 7 vertailuun.

**Uutta linkkiä ei lähde enää (K, koodi):** `link_sent` = T (valinta `:293` ja vaihe 1 `:428`), ja status on 2 (valinta `:291`).

**Tarkennus 5.10. (tuoteomistajan kysymys: miksi 2,75 eikä 3,53?)** Bracket-taulun ylärajat (N, `customrecord_sta_maint_extending_months`):
1 kk 80,99 € brutto = 64,53 netto, ja sen jälkeen +80,00 € brutto per kk (2 kk 160,99 = **128,28**, 3 kk 192,02, 4 kk 255,77). Ensimmäinen bracket
on siis 0,99 € brutto (0,79 netto) muita leveämpi. Kun 2 kk:n ylärajaksi otetaan 127,49 (= 160,00 / 1,255), hyvitykseksi tulee 7,97 ja hinnaksi 3,53.
Taulun todellinen yläraja on kuitenkin 128,28, jolloin hyvitys on 8,76. 127,49 on kahden *jälkimmäisen* bracketin leveys (255,77 − 128,28), ei 2 kk:n yläraja.
Skriptin 136,25 = 8,76 (oikea huoltohyvitys) + 127,49 (kaksi jälkiveloituskuukautta, R1). Korjauskohta: `lib_gbb_redemption_price.js:170`
(`brackets.find(b => b.prolongMonths === months)`) → käytä riviltä 141 `impliedBySum`-bracketia. Lähde `months` on `gbb_mr_send_end_redemption_paylink.js:359-360`.

R3: Avoimet jälkilaskut INVGBF1043356 ja INVGBF1043475 ovat yhteensä 185,20 € netto ≥ 139. Kun työnantaja maksaa ne, lunastus on katettu
ja asiakas on maksanut 3,45 € liikaa. Ennen sitä häneltä puuttuu 160,00 €.

Muut (N): SO **SOGBB0015113** (Billed) ja lasku **INVGBB1015009** (Paid In Full). Status 2, tapa 1, `paid_at` 1.10. **`liab_settled_at` on tyhjä**
(T38, ei R1:n seuraus). Status 2 pysäyttää jälkiveloituksen 1.11.

### B002668

R2:n ja R3:n lisäksi (N): **Käsin tehty lunastuslasku INVGBB1014923**. Tekijä *Operaatio GBB*, luotu 1.10. klo 15:52, eli
noin kolme tuntia sen jälkeen, kun skripti kirjasi tavan 3. Lasku on osoitettu työnantajalle *Alppis ky* (loppukäyttäjä Antti Seppä K1798301).
Item *Lunastus - Bike redemption* 40,15 € netto = 50,39 € brutto, eräpäivä 15.10., avoin.

- **Summaa ei saa toistettua** millään tässä lokissa käytetyllä kaavalla. Lähin on 148 − (383,26 − 275,04) = 39,78 (6 kk:n bracket,
  ero 0,37 €). Se vastaisi tilannetta, jossa vain syyskuun jälkiveloitus olisi laskettu pidennykseen.
- **Jos tapa on 2 (päätös 2.10.), lasku on todennäköisesti tuplaveloitus:** jälkiveloitusvuokrat 185,20 € netto kattavat 148 €:n hinnan jo yksinään.
- **Kysyttävä *Operaatio GBB*:ltä:** millä perusteella lasku tehtiin ja miten 40,15 laskettiin? Jos peruste oli tapa 3 tai linkin puuttuminen,
  lasku hyvitetään.
- Muut T32-pyörät: tällaista laskua ei ole (N, kaikki tapahtumat 1.12.2025 alkaen).

### B046508

R5 ja R6 (N). ITSEHANKINTA, sopimus A000332 *Storia Oy*. Vuokrarivit 1.6.–31.8.2026, 79,68 + 15,94 € netto/kk. Hinta 0, huoltosumma tyhjä.

| Mitä | Arvo |
|---|---|
| CR 6513, luotu 15.09. | jälkiveloitus syyskuulta, lasku **INVGBF1043392** 120 € Storia Oy, avoin. `subsc_end` 31.08. → 30.09. Luontipäivä 15.09. on extensionin override-ajon päivä (vrt. CLAUDE.md, CR:t 6511/6512 samana päivänä) (K) |
| CR 6972, luotu 1.10. | jälkiveloitus lokakuulta, lasku **INVGBF1043523** 120 € Storia Oy, avoin. `subsc_end` → 31.10. |
| RI-rivit | 1.9. *Ended* (oikein). **116228** 1.10. *Active* (CR 6513) ja **127711** 1.11. *Active* (CR 6972): palkkavähennys syys- ja lokakuun jälkiveloitukselta |
| Maksulinkki 1.10. | tapa 4, `liab_settled_at` 1.10. Status 2 (sweep) |

**Jos R5 vahvistetaan:** lunastus oli katettu jo 31.08., joten molemmat jälkiveloitukset ovat aiheettomia. Purettavat:
- laskut INVGBF1043392 ja INVGBF1043523, yhteensä 240 € brutto. Hyvitys tyypin 11 CR:llä, joka on ainoa hyvityspolku (ADR 0010).
- RI-rivit 116228 ja 127711. 1.10. rivi on voinut jo mennä lokakuun palkka-CSV:hen. Tarkistettava ennen korjausta.
- `subsc_end_date` 31.10. → 31.08. (sweepin statusmuutos 2 pysyy oikeana).
- Tapa 4 on oikea. `liab_settled_at` 1.10. on ADR 0009:n mukainen (*"maksulinkkiskriptin ajopäivä kelpaa"*), vaikka todellinen kattavuus oli 31.08.
