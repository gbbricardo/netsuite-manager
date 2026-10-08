# mr_lease_fees_check_v2.js – Kategoria 1:n eräpäivähaku ei löydä Oomi-laskuja

> [!NOTE]
> **Päätetty 8.10.2026: [ADR 0016](../docs/adr/0016-kaikki-vuokrat-maksettu.md).** Sääntö on asiakastasoinen vuokrakuukausihaku
> (vaihtoehto C, ei suositusta A+B). Jälkiveloitus ei kuulu lippuun, laskun puuttuminen ei estä, eikä lippua aseteta käsin (ei G:tä).
> Tehtävät: TASKS T58–T60.

Päivämäärä: 2026-10-08 · Tutkittu: `C:\Users\Riku\Documents\GitHub\netsuite-br-lease-fees-check\mr_lease_fees_check_v2.js` · Menetelmä: vain lukevat SuiteQL-kyselyt tuotantoon (NetSuite 9771141) ja paikalliset lokit (`SuiteScripts/[GBB] Bike register vuokramaksujen tarkistus/logs/`, viimeisin paikallinen 2026-09-28). Dataa tai skriptiä ei muutettu.

## Yhteenveto

- **Juurisyy vahvistettu.** `custrecord_sta_ca_row_invoicehistory` -päivä on **laskutusjakson alkupäivä** (laskurivin `custcol_sta_so_revrec_start`), ei laskun eräpäivä. Skripti hakee `duedate = historiapäivä`. Tavallisilla laskuilla tämä toimii, koska laskutusmoottori päiväää laskun edellisen kuun 1. päivälle ja maksuehto on *Due 1st of Next Month*, jolloin eräpäivä osuu jakson alkuun. Oomi-laskuilla (syyskuu 2026 eteenpäin) eräpäivä ei osu jakson alkuun:
  - syyskuun Oomi-laskut tehtiin käsin 02.09.2026 ehdoilla Net 14/21/30 tai *Due 1st of Next Month*,
  - lokakuun Oomi-laskut päivättiin jo 01.09.2026 ehdoilla *Due 15th/21st of Next Month*, *Numera* tai Net 30.
- **Laajuus jonossa (2026-10-08):** Oomi-pyöriä, joilla on Part B -päiviä, on 275. Niistä **0 läpäisee** nykyisen logiikan. Jaksopohjaisella haulla **131 pyörää** läpäisisi sekä Part A:n että Part B:n, eikä niillä ole Jälkiveloitus-muutospyyntöjä (Kategoria 2). Ne ovat väärät negatiivit, ja B045898 on yksi niistä. Ei-Oomi-pyörissä virhe on pieni: 2 väärää negatiivia 83:sta.
- **Väärien positiivisten riski on todellinen:**
  - 36 Oomi-pyörää, joiden sopimus päättyi syys–lokakuussa, on jo saanut lipun True, koska eräpäivähaku osui **elokuun jakson** laskuihin, joiden eräpäivä on 01.09. Syyskuun jakson laskuja ei siis tarkistettu. Tulos on nyt oikea, koska syyskuun laskut on maksettu, mutta se on oikea sattumalta.
  - Jos korjaus tehtäisiin varahakuna (ensin eräpäivä, sitten jakso), **37 Oomi-pyörää** läpäisisi väärin: lokakuun päivä osuisi maksettuun syyskuun laskuun, jonka eräpäivä on 01.10, vaikka lokakuun lasku on avoin.
- **Suositus:** vaihda Oomi Part B:n haku jaksopohjaiseksi. Haetaan laskurivit, joilla `custcol_sta_so_revrec_start = historiapäivä`, tuote 30/31/33 ja sama asiakas. Ei-Oomi-pyörille pidetään nykyinen eräpäivähaku ja lisätään jaksopohjainen varahaku vain silloin, kun eräpäivällä ei löydy yhtään laskua.

## Juurisyy (todisteineen)

### 1. Historiapäivä on jakson alku

- Kaikilla 1 302 jonon pyörien tilausrivillä historiapäivät ovat kuun 1. päiviä (REGEXP-tarkistus: 0 poikkeusta, 12 tyhjää historiaa).
- Laskurivillä on jakso kentissä `custcol_sta_so_revrec_start` ja `custcol_sta_so_revrec_end`, ja memona esimerkiksi "Vuokrakausi 1.9.2026-30.9.2026". Moottorin tekemillä riveillä `custcol_sta_ca_product_id` osoittaa tilausriviin (`customrecord_sta_ca_agreement_row.id`). Esimerkiksi rivit 80748/80749 (pyörä 45888, historia `["2026-10-01"]`) ovat laskulla INVGBF1042787, jonka jakso on 01.10–31.10.
- Historiaan voi tulla myös tulevia päiviä (laskutus etukäteen): esimerkiksi B001314:n historiassa on 2026-11-01. Lisäksi Oomi-rivien historiaan on kirjattu touko–syyskuu, vaikka ne laskutettiin käsin (vrt. `[GBB] Oomi fleet - Laskutettu syyskuu käsin*.csv`).

### 2. Laskupäivän, eräpäivän ja jakson suhde

Lease-rivit (tuote 30/31/33), joiden jakso alkaa 01.09.2026 tai 01.10.2026, jaoteltuna maksuehdon ja laskupäivän mukaan (laskuja, ≥5):

| Jakso | Maksuehto | Laskupäivä | Eräpäivä = jakson alku? | Linkki tilausriviin | Laskuja |
|---|---|---|---|---|---|
| 01.09 | Due 1st of Next Month | 01.08 | **kyllä** | on | 3 353 |
| 01.09 | Net 14 | 02.09 | ei | ei | 209 |
| 01.09 | Net 30 / Net 21 / Due 1st NM | 02.09 | ei | ei | 34 / 34 / 41 |
| 01.09 | Net 30 (kesken kuun lisälaskut) | 13.–31.09 | ei | ei | ~70 |
| 01.10 | Due 1st of Next Month | 01.09 | **kyllä** | on | 3 320 |
| 01.10 | Due 15th of Next Month | 01.09 | ei | on | 244 |
| 01.10 | Numera / Due 21st NM | 01.09 | ei | on | 30 / 6 |
| 01.10 | Net 30 | 01.09 | kyllä (01.09 + 30 pv) | on | 34 |

Johtopäätökset:

- **Ei ole vakioviivettä.** Eräpäivä määräytyy laskun maksuehdosta (term 8 = Net 21, 10 = Due 1st of Next Month, 12 = Due 15th, 13 = Due 21st…).
- Laskupäivä on tavallisesti jakson alku miinus 1 kk. Syyskuun Oomi-käsilaskut päivättiin 02.09 eli jakson sisään.
- Linkitetyillä riveillä tilaustyypeittäin:
  - Oomi-pyörillä (order type 3) eräpäivä ≠ jakson alku 5 088/5 796 rivillä jaksolla 10/2026.
  - Tilaustyyppi null (suurin osa ei-Oomi-pyöristä): eräpäivä = jakson alku noin 99,8 %:ssa laskuista.
- Oomi-pyörille ei ole lainkaan linkitettyjä rivejä ennen jaksoa 10/2026. Syyskuun käsilaskuilla `custcol_sta_ca_product_id` ja `custcol_sta_bikeid_line` ovat tyhjiä, joten laskuriviä ei voi sitoa pyörään. Sidonta onnistuu vain asiakkaan ja jakson kautta.

### 3. B045898 (id 45898)

- OOMI. Subscription end 28.09.2026. Asiakas ja työnantaja 104291 Oulun poliisilaitos.
- Rivit 81240 (tuote 30) ja 81241 (tuote 31), lisenssi 01.09–30.09.2026, historia `["2026-09-01"]`.
- Asiakkaan laskut ja niiden jaksot:
  - INVGBF1039554 (id 711828): päivätty 02.09, eräpäivä 23.09 (Net 21), jakso 01.09–30.09, **status B**.
  - INVGBF1042787 (id 719715): päivätty 01.09, eräpäivä 21.10 (Due 21st NM), jakso 01.10–31.10, avoin.
  - INVGBF1046609: päivätty 01.10, eräpäivä 21.11, jakso 01.11–30.11, avoin.
- Haku `duedate = 01.09.2026` ei löydä mitään, joten tuloksena on "category1: no invoice found" (näkyy nyt Part B:ssä). Paikallisissa lokeissa 27.–28.09 pyörä jäi vielä Part A:han (INVGBF1039075 oli avoin). Se lasku on nyt maksettu, joten pyörä etenee Part B:hen ja kaatuu siellä.
- Jaksohaku `revrec_start = 01.09` löytäisi vain laskun INVGBF1039554 (B), joten pyörä läpäisisi oikein.

## Laajuus

### Menetelmä

- **Jono** on rakennettu SuiteQL:llä uudelleen. Ehdot:
  - `custrecord_sta_bike_status = 2`
  - bill_of_sale_sent = F, no_bill_of_sale = F, all_lease_fees_paid = F
  - `subsc_end_date < 2026-11-01`
  - pyörään liittyy (`custbody_sta_bike_id`) maksettu (status B) lasku tai käteismyynti, jonka `custbody_sta_is_so_type` on 3 tai 4.
  - Tulos: **367 pyörää** (282 Oomi, 85 muuta).
- **Kategoria 1** on toistettu bike × kuukausi -tasolla:
  - Historiapäivät on haettu LIKE-ehdolla kuukausille 06–10/2026.
  - Ikkuna: `now − 150 pv = 2026-05-11`, joten käytännössä mukana ovat kesäkuu ja sitä myöhemmät kuukaudet. Ylärajana `≤ subscEnd`. Oomilla alaraja on 01.09.
- **Vertailtavat logiikat:**
  - **CUR** = nykyinen: asiakkaan lasku, jossa duedate = päivä ja lease-rivi. Ainakin yksi lasku pitää löytyä, ja kaikkien pitää olla B.
  - **PER** = jakso: asiakkaan laskut, joissa on lease-rivi ja `revrec_start = päivä`. Ainakin yksi lasku, kaikki B.
  - **LINK** = rivilinkki: `custcol_sta_ca_product_id = tilausrivi` ja `revrec_start = päivä`.
  - **HYB** = ensin CUR; jos laskuja ei löydy, PER.
  - **TRAN** = laskupäivä samassa kuussa kuin historiapäivä.
- **Oomi Part A** on toistettu erikseen: työnantajan kaikki laskut, joiden laskupäivä osuu kuukausiin 05–08 (≤ subscEnd). Jokaiselle kuukaudelle pitää löytyä lasku, ja kaikkien pitää olla B.

### Tulokset – Oomi (order type 3), 275 pyörää, joilla on Part B -päiviä

| Part A | CUR | PER | PER-tilanne | Pyöriä |
|---|---|---|---|---|
| ok | ✗ | **✓** | kaikki jakson laskut maksettu | **131** (väärä negatiivi) |
| ok | ✗ | ✗ | 10/2026-jakson lasku avoin, ei vielä erääntynyt | 109 |
| ok | ✗ | ✗ | 09/2026-jakson lasku avoin, ei vielä erääntynyt | 14 |
| ✗ | ✗ | ✓ | – | 5 |
| ✗ | ✗ | ✗ | erääntynyt avoin 09 tai 10 | 14 |
| ✗ | ✗ | ✗ | avoin, ei erääntynyt | 2 |

- CUR läpäisee 0/275. Syyskuun kuukausista 271/275 ei löydä laskua lainkaan, ja 4 löytää.
- PER läpäisee 136/275. Näistä 131:llä myös Part A on ok, ja **kaikilta 136:lta puuttuvat Jälkiveloitus-CR:t**. Lippu siis kääntyisi Trueksi 131 pyörällä. Pyöristä 122 päättyy syyskuussa ja 14 lokakuussa (Part A -hylätyt mukaan lukien).
- LINK läpäisee 0/275, koska syyskuun käsilaskuilla ei ole linkkiä.
- HYB läpäisee 173, joista **37 on vääriä positiivisia** PER:iin verrattuna. Lokakuun päivä osuu syyskuun jakson maksettuun laskuun (ehto *Due 1st of Next Month* → eräpäivä 01.10), vaikka lokakuun lasku on avoin. Näitä on esimerkiksi Kymenlaakson hva:n, Keski-Uudenmaan hva:n ja Rovaniemen kaupungin pyörissä.
- TRAN ei kelpaa: syyskuun bike-kuukausista vain 27/290 läpäisisi. Lokakuun jakson laskut on päivätty 01.09, joten avoin lokakuun lasku osuu syyskuun hakuun.
- Nykyinen eräpäivähaku osuu jo nyt väärään jaksoon: Oomin lokakuun päivistä 38 pyörällä duedate 01.10 -haku löytää syyskuun jakson laskun.

### Tulokset – muut (order type null tai 1/2), 83 pyörää, joilla on päiviä ikkunassa

| | Pyöriä |
|---|---|
| CUR läpäisee | 54 |
| PER läpäisee | 43 |
| HYB läpäisee | 56 |
| CUR ✗ / PER ✓ (väärä negatiivi) | 2 (B006141, B034775) |
| CUR ✓ / PER ✗ | 13 |

- **Väärät negatiivit:** asiakas 137654 (siirto uudelle asiakkaalle). Ensimmäinen lasku INVGBF1029888 on päivätty 01.06 jaksolle 01.06 ja eräpäivä on 01.07 (lisäksi INVGBF1026838/-841 eräpäivillä 27.06/29.06). Kesäkuun eräpäivälle 01.06 ei siis ole laskua.
- **CUR ✓ / PER ✗:** PER kaatuu kesken kuun tehtyihin avoimiin Net 30 -lisälaskuihin samalla työnantajalla (esim. 487, 2244, 2054, 2215; laskut INVGBF10433xx/-434xx). Niillä ei ole pyörän omia linkkirivejä. Asiakastason jaksohaku olisi ei-Oomi-pyörille liian tiukka.
- **Ajoitushavainto:** 54 CUR-läpäisijän joukossa on pyöriä, joiden end date on 31.10. Ne tulevat todennäköisesti jonoon vasta seuraavassa ajossa: saved searchin "24 days from now" lasketaan palvelimen aikavyöhykkeellä, ja ajo tehdään klo 03 UTC eli PDT:n mukaan edellisenä päivänä. Osa pyöristä maksettiin vasta tänään (esim. B002980, lunastuslasku muutettu 08.10). Ne eivät ole virhe.

### Rajoitukset

- Jono on rakennettu uudelleen, saved searchia 796 ei ladattu. "Transaction (Bike ID)" -liitos on tulkittu `custbody_sta_bike_id`-kentäksi ja tilaksi Paid In Full (lasku). Lokien mukaan 28.09 käsiteltiin 194 pyörää. Tämän päivän lokin koko (325 kt, vs. 134 kt) viittaa noin 450–480 pyörään, joten rakentamani 367 on todennäköisesti hieman alakanttiin. NetSuiten lokitiedostojen sisältöä ei voinut lukea SuiteQL:llä.
- Kategoria 2 on arvioitu vain CR:ien olemassaolon perusteella (type 7, status ≠ 7). CR-laskujen maksutilaa ei tarkistettu.
- Simulaatio on asiakastasoinen kuten skriptikin, ja tilan B oletetaan vastaavan tilaa paidInFull.
- Kuukausiraja Oomille: skripti vertaa `date >= 2026-09-01` ja `<= subscEnd`. Simulaatio tekee saman.
- True-lipulliset pyörät tarkistettiin vain Oomi-pyöristä, jotka päättyvät syyskuussa tai myöhemmin (41 kpl).

## Miksi nykyinen logiikka toimii useimmille (ja miksi True on asetettu)

- **Tavalliset sopimukset:** laskutusmoottori tekee jakson M laskun päivälle *M−1 kk, 1. päivä* ehdolla *Due 1st of Next Month*, joten duedate = jakson alku = historiapäivä. Esimerkiksi asiakas 6067: INVGBF1038273 on päivätty 01.08 ja eräpäivä on 01.09 jaksolle 01.09. Sama päätee noin 3 300–3 550 laskuun kuukaudessa. Lipun True saaneita ei-Oomi-pyöriä on 3 947 (end 05–10/2026). Paikallisissa lokeissa on satoja SUCCESS-rivejä (esim. 747 kpl 31.08 ja 607 kpl 22.09).
- **Oomi, päättynyt ennen syyskuuta:** Part B ohitetaan, joten Part A (laskupäivä ja kuukausi) riittää. Tällaisia pyöriä on 486 (end 05–08/2026).
- **Oomi, päättynyt syys–lokakuussa ja True (41 kpl):**
  - 5 pyörällä ei ole Part B -päiviä.
  - 36 läpäisi, koska asiakkaalla sattui olemaan elokuussa päivätty lasku ehdolla *Due 1st of Next Month* eli eräpäivällä 01.09. Esimerkkejä: 819 Etelä-Karjalan hva INVGBF1038857 (jakso **01.08**, 570 riviä), 104139 Itä-Suomen yliopisto INVGBF1039185/-187 (jaksot 01.08 ja 01.06), 4182 INVGBF1038862 ja 62540 INVGBF1038866 (jakso 01.08).
  - Näillä pyörillä syyskuun jakson laskuja ei tarkistettu. Tarkistin jälkikäteen, ettei niillä ole avoimia syyskuun jakson laskuja, joten lopputulos on oikea, mutta vain sattumalta.

## Esimerkit (väärät negatiivit, Oomi; jakso 09/2026 maksettu, CUR "no invoice found")

| Pyörä | id | End | Asiakas | Historiapäivä | Jakson 09 lasku (päivätty / eräpäivä / status) | Huom. |
|---|---|---|---|---|---|---|
| B045898 | 45898 | 28.09 | 104291 Oulun poliisilaitos | 2026-09-01 | INVGBF1039554 02.09 / 23.09 / B | lokakuun INVGBF1042787 eräpäivä 21.10, avoin, ei koske pyörää |
| B040708 | 40708 | 30.09 | 104205 Kymenlaakson hva | 2026-09-01 | INVGBF1039483 02.09 / 01.10 / B; INVGBF1043397 / B | |
| B041265 | 41265 | 25.09 | 104353 Rovaniemen kaupunki | 2026-09-01 | INVGBF1039593 02.09 / 01.10 / B | |
| B038524 | 38524 | 18.10 | 104139 Itä-Suomen yliopisto | 2026-09-01, 2026-10-01 | INVGBF1039427 02.09 / 23.09 / B | lokakuu: INVGBF1042649 eräpäivä 21.10, avoin, joten oikein kesken |
| B042270 | 42270 | 05.10 | 104156 KELA | 2026-09-01, 2026-10-01 | INVGBF1039443 02.09 / 23.09 / B | lokakuu: INVGBF1042666 eräpäivä 21.10, avoin, joten oikein kesken |
| B045209 | 45209 | 11.10 | 104183 Konecranes Finland | 2026-09-01, 2026-10-01 | INVGBF1039465 02.09 / 17.10 / B | lokakuu: INVGBF1042689 eräpäivä 15.10, avoin |
| B044934 | 44934 | 31.10 | 104169 Keski-Uudenmaan hva | 2026-09-01, 2026-10-01 | INVGBF1039454 02.09 / 01.10 / B | **HYB-väärä positiivi:** lokakuun päivä osuisi tähän (eräpäivä 01.10), vaikka lokakuun INVGBF1042677 (eräpäivä 01.11) on avoin |
| B037378 | 37378 | 30.09 | 103959 CGI Suomi | 2026-09-01 | INVGBF1039367 02.09 / 02.10 / **A** | oikein kesken myös PER:llä (erääntynyt) |
| B006141, B034775 | 6141, 34775 | 30.06 | 137654 (ei-Oomi) | 2026-06-01 | INVGBF1029888 01.06 / 01.07 / B | siirtoasiakkaan ensimmäinen lasku, jakso samassa kuussa |

Osa taulukon pyöristä on korjauksenkin jälkeen oikein kesken lokakuun avoimen laskun vuoksi. Ne ovat mukana havainnollistamassa, ettei jaksohaku päästä niitä läpi.

## Korjausehdotukset ja suositus

| Vaihtoehto | Korjaa väärät negatiivit | Väärien positiivisten riski | Arvio |
|---|---|---|---|
| A. Jaksohaku (`custcol_sta_so_revrec_start on päivä`) **vain Oomi Part B:lle** | 131 Oomi | pieni: kaikki asiakkaan saman jakson laskut tarkistetaan | **suositus** |
| B. A + ei-Oomi-pyörille jaksohaku varalla, jos eräpäivähaku ei löydä mitään | 131 + 2 | pieni: varahaku käynnistyy vain "no invoice found" -tilanteessa | **suositus (lisäksi)** |
| C. Jaksohaku kaikille | 131 + 2 | ei väärä positiivi, mutta 11–13 ei-Oomi-pyörää jäisi turhaan kesken muiden pyörien lisälaskujen takia | ei |
| D. Ensin eräpäivä, varalla jakso kaikille (HYB) | 136 Oomi | **37 Oomi väärää positiivia** | ei |
| E. Laskupäivä samassa kuussa | ~27/290 | lisäksi väärää jaksoa | ei |
| F. Rivilinkki `custcol_sta_ca_product_id` | 0 Oomi (syyskuun käsilaskuilla ei linkkiä), ei-Oomi 11/83 (rivit on ryhmitelty) | – | ei nyt |
| G. Lippu käsin 131 pyörälle | välitön | käsityö | väliaikaisratkaisu, jos koodimuutos viivästyy |

Riskit ja varmistettavat asiat ennen käyttöönottoa:

- Varmista sandboxissa, että `custcol_sta_so_revrec_start` toimii N/search-suodattimena (`'on'`) invoice-haussa line-tasolla (mainline F). SuiteQL:ssä kenttä toimii.
- Jaksohaku on asiakastasoinen. Isolla työnantajalla mikä tahansa saman jakson avoin lasku (myös toisen pyörän lisälasku) estää lipun. Oomilla tämä on hyväksyttävää, koska jakson päälasku sisältää kaikki pyörät. Ei-Oomi-pyörille jaksohaku on siksi vain varahaku.
- Jos jakson kenttä puuttuu käsin tehdyiltä laskuilta, jaksohaku ei löydä niitä. Jonon Oomi-pyörillä jokaiselle bike-kuukaudelle löytyi vähintään yksi jakson lasku.
- Myös nykyiset True-liput, jotka asetettiin osumalla väärän jakson laskuun (36 Oomi-pyörää), on tarkistettu: avoimia syyskuun jakson laskuja ei löytynyt.

Ehdotettu muutos (ei toteutettu). Hakuehdot vaihdetaan tilan mukaan:

```javascript
// checkCategory1(bikeId, subscEndDate, minDate, matchMode)
//   matchMode: 'period'          -> Oomi Part B
//              'dueThenPeriod'   -> standard (default)

function findLeaseInvoices(customerId, dateFormatted, byPeriod) {
  const dateFilter = byPeriod
    ? ['custcol_sta_so_revrec_start', 'on', dateFormatted] // laskurivin jakson alku
    : ['duedate', 'on', dateFormatted];
  const seen = new Set();
  const invoices = [];
  search.create({
    type: search.Type.INVOICE,
    filters: [
      ['entity', 'anyof', customerId], 'AND',
      dateFilter, 'AND',
      ['item', 'anyof', [ITEM_RENT, ITEM_ADMIN, ITEM_LEASE]], 'AND',
      ['mainline', 'is', 'F']
    ],
    columns: ['internalid', 'status', 'tranid']
  }).run().each((inv) => {
    if (!seen.has(inv.id)) {
      seen.add(inv.id);
      invoices.push({ id: inv.id, tranid: inv.getValue('tranid'), status: inv.getValue('status') });
    }
    return true;
  });
  return invoices;
}

// silmukassa:
let invoices = findLeaseInvoices(customerId, dueDateFormatted, matchMode === 'period');
if (invoices.length === 0 && matchMode === 'dueThenPeriod') {
  invoices = findLeaseInvoices(customerId, dueDateFormatted, true);
}

// map(): Oomi Part B
const partB = checkCategory1(bikeId, subscEndDate, OOMI_SUBSCRIPTION_START, 'period');
// muut
cat1 = checkCategory1(bikeId, subscEndDate, null, 'dueThenPeriod');
```

Päivitä samalla dokumentaatio, joka nyt väittää historiapäivän olevan eräpäivä: `NETSUITE_RECORDS_AND_FIELDS.md` §2 ("A JSON array of invoice due dates") ja `lease_fees_check_solution_v2.md` §4.1. Lisää myös lokiriville tieto hakutavasta (due/period).

## Avoimet kysymykset

1. Onko `custcol_sta_so_revrec_start` N/searchissa haettava kenttä invoice-tyypillä (Store Value / Show in list)? Kenttä pitää varmistaa ennen toteutusta.
2. Jatketaanko Oomi-laskutusta ehdoilla *Due 15th/21st of Next Month* ja laskupäivällä M−1 kk? Jos Oomi siirtyy myöhemmin ehtoon *Due 1st of Next Month*, eräpäivähaku alkaisi taas osua oikein, mutta jaksohaku on silti luotettavampi.
3. Pitäisikö Oomi Part A:n (kaikki työnantajan laskut kuukaudelta, ilman tuotesuodatinta) myös siirtyä jaksopohjaiseksi? Nyt yksittäinen ei-vuokralasku voi estää lipun koko työnantajan pyöriltä (vrt. 14 + 2 Part A -hylättyä).
4. Saved searchin 796 tarkat liitosehdot ja tämän päivän lokin sisältö jäivät tarkistamatta. Jonon koko (367 vs. lokin perusteella arvioitu ~450–480) kannattaa varmistaa ajamalla haku käyttöliittymästä.
5. Merkitäänkö 131 Oomi-pyörää käsin (vaihtoehto G) ennen koodikorjausta? Ne odottavat nyt kauppakirjaa.
