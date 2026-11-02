# Työohje — nykyisen työnantajan vuokrakauden alkupäivä RI-riville

- **Päätös:** [ADR 0025](adr/0025-ri-vuokrakauden-alkupaiva.md) · **Todisteet:** [löydös 2.11.2026](../findings/2026-11-02-ri-vuokrakauden-alkupaiva-palautuu-siirron-jalkeen.md)
- **Tehtävät:** T95 (kenttä + `handler_siirto_ta`), T96 (raportoinnin luku), T97 (kertatäydennys)
- **Omistavat repot:** `netsuite-subscrption-cr-scripts`, `netsuite-monthly-reporting`. Toteutus tehdään siellä, erillisissä istunnoissa.

> [!IMPORTANT]
> **Laajuus (ADR 0025 k. 6, päätetty 2.11.2026):** kentän nollaavat tyyppi **1** *Siirto TA*
> (`handler_siirto_ta.js`) ja tyyppi **6** *Siirto TT* (`handler_siirto_tt.js`). Tyyppi **9**
> *Siirto konserni* **ei** nollaa — konsernin sisällä työntekijän osalta mikään ei muutu, sama
> jatkuvuustulkinta kuin verovapaussäännössä.

## Vaihe 1 — kenttä NetSuiteen — **tehty 2.11.2026 (käyttäjä)**

Pyörärekisteriin (`customrecord_sta_bike_register`) uusi kenttä:

| | |
|---|---|
| Script ID | `custrecord_gbb_employer_lease_start` |
| Otsikko | Nykyisen työnantajan vuokrakauden alku |
| Tyyppi | Date |
| Oletus | tyhjä |

Tyhjä = pyörä ei ole vaihtanut työnantajaa; rekisterin `custrecord_sta_subsc_start_date` on oikea.
Kenttä ei saa koskaan olla ennen `subsc_start_date`:a (ADR 0025 k. 5).

Todennettu SuiteQL:ssä 2.11.2026: kenttä on kyseltävissä, 46 771 pyörää, **0 arvoa**.
`schemas/records/customrecord_sta_bike_register.md` päivitetty samana päivänä.

## Vaihe 2 — T96: raportointi lukee kentän (`netsuite-monthly-reporting`)

Sääntö on joka paikassa sama:

```js
startDate: employerLeaseStart || subscStart
```

`COALESCE` on turvallinen jo ennen täydennystä: tyhjällä kentällä käytös on täsmälleen nykyinen.
Siksi T96 voi mennä tuotantoon ennen T95:tä ja T97:ää.

Yhdeksän lukukohtaa seitsemässä tuotantoskriptissä. Kussakin on lisäksi otettava uusi kenttä mukaan
hakuun tai `record.load`-lukuun:

| Skripti | Kohta |
|---|---|
| `mr_monthly_reporting_ri_creation.js` | hakusarakkeet `:1001`, luku `:1082` (`startDate: resultCol(result, BIKE.subscStart)`) |
| `mr_monthly_reporting_ri_update.js` | `loadBikeData` `:324` |
| `mr_backfill_missing_ended_rows.js` | hakusarakkeet `:251`, luku `:269` |
| `ue_reporting_item_transfers.js` | `loadBikeData` `:418` |
| `ue_reporting_item_intermediary_months.js` | `loadBikeData` `:133` |
| `ue_reporting_item_late_redemption_prolongation.js` | `loadBikeData` `:91` |
| `ue_reporting_item_mid_term_redemption_return_theft_loss.js` | `loadBikeData` `:133` |
| `ue_reporting_item_maintenance_prolongation.js` | `:309` ja `:329` — ei `loadBikeData`-funktiota, kaksi erillistä lukua |

Jokaisessa skriptissä on myös kenttäkartta (`BIKE`-objekti), johon uusi script id lisätään:
`ri_creation:78`, `ri_update:98`, `backfill:84`, `maintenance_prolongation:72`. Neljä muuta UE-skriptiä
lukevat kentän nimen suoraan `getValue`-kutsussa.

> [!NOTE]
> Viisi `ss_*_for_testing.js`-tiedostoa ovat testikopioita samasta logiikasta. Ne eivät ole tuotannossa,
> mutta jos ne pidetään ajan tasalla, sama muutos kuuluu niihinkin.

**Älä** koske `ue_reporting_item_transfers.js:873`:een (tyyppi 1) tai `:940`:een (tyyppi 6): ne kirjoittavat jo
siirtokuukaudelle `official_end_date` + 1:n, eli juuri sen arvon, jonka uusi kenttä tekee pysyväksi.
`:466` (Warning-rivit) saa `bike.startDate`-arvonsa `loadBikeData`sta ja korjautuu itsestään.

**Valmis kun:** kuukausiajon jälkeen pyörällä, jolla kenttä on asetettu, RI-rivin `lease_start_date` on kentän
arvo — eikä `subsc_start_date`. Tarkistus kuukausiajon jälkeen:

```sql
SELECT COUNT(*) FROM customrecord_gbb_monthly_reporting_item ri
JOIN customrecord_sta_bike_register br ON br.id = ri.custrecord_gbb_ri_bike
WHERE br.custrecord_gbb_employer_lease_start IS NOT NULL
  AND ri.custrecord_gbb_ri_reporting_date = <kuukauden 1. pv>
  AND ri.custrecord_gbb_ri_reporting_status = 1
  AND ri.custrecord_gbb_ri_lease_start_date <> br.custrecord_gbb_employer_lease_start
-- odotus: 0
```

## Vaihe 3 — T95: siirtokäsittelijät kirjoittavat kentän (`netsuite-subscrption-cr-scripts`)

`handler_siirto_ta.js` (tyyppi 1) ja `handler_siirto_tt.js` (tyyppi 6) kirjoittavat pyörärekisteriin:

```js
custrecord_gbb_employer_lease_start = custrecord_cr_contract_official_end_date + 1
```

Sama päivä kuin `ue_reporting_item_transfers.js:873` (tyyppi 1) ja `:940` (tyyppi 6) kirjoittavat
siirtokuukauden riville — yksi sääntö, joka ei saa erota kirjoituskohtien välillä.
`handler_konserni.js` (tyyppi 9) **ei** kirjoita kenttää.

Reunaehdot:

- **`official_end_date` tyhjä** → kenttää ei kirjoiteta, CR ei mene Erroriin. Käytös on sama kuin ennen muutosta.
- **Laskettu päivä ≤ `subsc_start_date`** → kenttää ei kirjoiteta (ADR 0025 k. 5).
- Kenttä **ylikirjoitetaan** jokaisessa uudessa siirrossa: se kuvaa *nykyistä* työnantajasuhdetta, ei historiaa.

**Valmis kun:** uusi tyypin 1 ja tyypin 6 CR on käsitelty Doneksi, pyörän kenttä on `official_end_date` + 1,
ja seuraavan kuukausiajon RI-rivi kantaa saman päivän. Tyypin 9 CR:n jälkeen kenttä on muuttumaton.

## Vaihe 4 — T97: kertatäydennys (477 + 16 pyörää)

**Osa A — 477 pyörää tyypin 1 takautuvista CR:istä.** Lähde on syyskuun 2026 RI-rivit, joissa alkupäivä
korjattiin käsin 27.08.2026. Ne ovat ainoa kopio.

1. Aja löydöksen kysely (`findings/2026-11-02-…`, § *Täydennysaineiston lähde*). Odotus: 497 riviä.
2. **Validoi ADR 0025 k. 5:llä:** pudota rivit, joilla `uusi_alku` ≤ `rek_alku`. Tunnettu tapaus **B011413**
   (01.04.2025 < 01.05.2025) — työnantaja vaihdettu takautuvasti ennen vuokrasopimuksen alkua.
3. **Tarkista peruste uudelleen ennen ajoa:** aineisto on elokuulta, ja pyörien tilanne on muuttunut
   (osa on jo lunastettu, status 2). Kysy itseltäsi, onko korjaus yhä oikein jokaiselle riville.
4. CSV `imports/`-kansioon oman README:n kanssa: sarakkeet `Internal ID` (pyörän id) ja
   `custrecord_gbb_employer_lease_start`.
5. Tarkista ajon jälkeen, että kenttä on asetettu odotetulle määrälle pyöriä eikä yksikään arvo ole
   ennen pyörän `subsc_start_date`:a:

```sql
SELECT COUNT(*) FROM customrecord_sta_bike_register
WHERE custrecord_gbb_employer_lease_start < custrecord_sta_subsc_start_date
-- odotus: 0
```

**Osa B — 16 pyörää tyypin 6 CR:istä.** Kaikilla 16 Done-tilaisella tyypin 6 CR:llä on
`custrecord_cr_contract_official_end_date` asetettuna (todennettu 2.11.2026), joten arvo lasketaan suoraan
CR:stä eikä RI-riveistä:

```sql
SELECT br.id AS pyora_id, br.name AS pyora,
       TO_CHAR(cr.custrecord_cr_contract_official_end_date + 1,'DD.MM.YYYY') AS employer_lease_start,
       TO_CHAR(br.custrecord_sta_subsc_start_date,'DD.MM.YYYY') AS rek_alku
FROM customrecord_subscrption_change_request cr
JOIN customrecord_sta_bike_register br ON br.id = cr.custrecord_cr_bike_registry
WHERE cr.custrecord_cr_type = 6 AND cr.custrecord_cr_status = 2
ORDER BY br.name
```

Jos pyörällä on sekä tyypin 1 että tyypin 6 siirto, kenttään tulee **myöhäisempi** niistä: kenttä kuvaa
nykyistä vuokrasuhdetta, ei historiaa. Validointisääntö (k. 5) koskee myös osaa B.

## Mitä tämä ei korjaa

- **Jo lähteneet kuukaudet.** Loka- ja marraskuun palkka-CSV:t lähtivät alkuperäisillä alkupäivillä, eikä
  niitä korjata takautuvasti (ADR 0025 k. 7). Myöskään joulukuun ajoa ei korjata käsin.
- **Siirrot, joista ei ole CR:ää lainkaan.** 477 pyörän takautuvat CR:t kattavat ne, jotka tunnistettiin
  27.08.2026. Jos NetSuitea edeltäviä siirtoja on muitakin, ne löytyvät vain asiakaspalautteesta.
