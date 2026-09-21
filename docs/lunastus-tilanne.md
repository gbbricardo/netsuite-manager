# Lunastusprojektin tilanne

**Päivitetty:** 2026-09-21 (**vaiheet 0–2 valmiit, vaihe 3 avoinna ilman esteitä**) · **Suunnitelma:** [`lunastus-toteutussuunnitelma.md`](lunastus-toteutussuunnitelma.md)
· **Säännöt:** [`lunastuksen-kenttasaannot.md`](lunastuksen-kenttasaannot.md)

Tämä dokumentti kertoo **missä mennään**. Suunnitelma kertoo mitä tehdään ja säännöt miksi.

---

## Yhteenveto

**Vaiheet 0–2 ovat tuotannossa ja vaihe 3 on avoinna ilman esteitä.** Neljässä päivässä
(18.–21.09.2026) projekti eteni suunnittelusta siihen, että tila *lunastus sovittu* on olemassa
käsitteenä, kentässä ja koodissa, ja että **jokainen päättynyt pyörä kantaa todisteen siitä miksi
se päättyi**.

**Tuotannossa:**

- **Jaettu kirjasto** `gbb_lunastus_lib.js` **1.1.0**, 50 yksikkötestiä, File Cabinetissa
  `/SuiteScripts/gbb-lib/`. Kaikki alla oleva johtaa päätöksensä siitä, ei toistensa tuotoksesta.
- **Päätöspäivä** `custrecord_gbb_redemption_decided_at` ja sen User Event, Released. Todennettu
  laukeavan myös automaatiosta.
- **Maksuvetoinen polku** kirjoittaa selvitystavan, joten maksettu lunastus ei enää katoa
  tunnistamattomaksi.
- **Kalenterisweep** — se puuttuva pala jota suunnitelma ei tuntenut. Tunnistuspäivä on
  kalenteritapahtuma, eikä yksikään tapahtumavetoinen skripti havainnut sitä.
- **`handler_lunastus.js`** — statusportti, kohdestatus kirjastosta nimen sijaan,
  `liab_settled_at` CR:n luontipäivästä. Kumpikaan statuksen kirjoittaja ei enää päätä itse.
- **Datakorjaukset, 2 412 pyörää** — 306 + 691 + 204 + 1 211, kaikki todisteesta johdettuna tai
  nimenomaisesti tuntemattomaksi merkittynä.

**Jäljellä:** vaihe 3 (lukijat), vaihe 4 (`cf-gbb-tools`), ja CR-ajastuksen palautus.

**Mitä matkalla opittiin — viisi asiaa jotka eivät olleet suunnitelmassa:**

| Havainto | Missä se olisi purrut |
|---|---|
| Siirtymää 2 → 3 ei tee kukaan, koska tunnistuspäivä on kalenteritapahtuma | 96 % lunastuksista olisi jäänyt pysyvästi Activeksi ja laskutus jatkunut |
| §8:n päämittari oli ristiriidassa §3:n kanssa | oikein toiminut ajo olisi luettu nelinkertaisena regressiona ja peruttu |
| Vaihe 3 sovelsi ADR 0002:ta väärin päin | viimeinen palkanpidätysrivi olisi kadonnut 8 427 pyörältä |
| 1 415 pyörällä status oli ainoa tieto päättymisestä | §6:n toteutus olisi palauttanut veronalaisen edun raportoinnin helmikuusta 2024 asti |
| Kirjaston lataus epäonnistui hiljaisesti | importit olisi ajettu kirjastolla joka ei tunnista arvoa 8, ja vika olisi löytynyt vasta vaiheessa 3 |

Neljä viidestä löytyi **dokumentista eikä koodista**: suunnitelma ja sääntödokumentti olivat
sisäisesti ristiriitaisia, ja ristiriidat paljastuivat vasta kun lukuja mitattiin NetSuitesta sen
sijaan että olisi luettu mitä dokumentti väittää. Viides löytyi versionumerosta, joka oli
kirjoitettu lokiin juuri tätä varten.

---

## Mittarit

Todennettu NetSuitesta 21.09.2026.

| Mittari | 18.09. lähtötilanne | 21.09. nyt | Tavoite |
|---|---|---|---|
| **Päättyneitä ilman todistetta** *(vaiheen 3 este)* | 1 415 | **0** | pysyy 0 |
| **Lunastettu ennen tunnistuspäivää** *(§8)* | ei mitattu | **1** | ei kasva |
| Selvitystapa puuttuu, status 2/3 | 1 517 | **0** | pysyy 0 |
| Selvitystapa puuttuu, status 1, maksettu | 691 | **0** | pysyy 0 |
| `historical_unknown` (8) käytössä | arvoa ei ollut | **1 211** | ei kasva |
| `historical_unknown` **Active-pyörällä** *(väärinkäyttö)* | — | **0** | **pysyy 0** |
| §5-rikkomukset selvitystavalla 1 | 53 | **53** | ei kasva |
| Tila 2 *lunastus sovittu* | ei käsitteenä | **117** | vaihtelee kuukausirytmissä |
| Päättyneitä (status 2/3) | 12 512 | **13 199** | — |
| `date_to_non_active` tyhjä | 6 | **0** | ratkennut |
| Päätöspäivä kirjattu | kenttää ei ollut | **7** | kasvaa automaattisesti |
| Pyöriä ilman statusta | 148 | **141** | oma selvitys |

**Ensimmäistä kertaa jokaisella päättyneellä pyörällä on selvitystapa ja kirjaston hyväksymä
todiste.** Se oli vaiheen 3 ainoa este.

> **Vanha §8-mittari** (`status = 2 AND subsc_end_date > CURRENT_DATE`) näyttää ~847 eikä 1. Se on
> vanhentunut ja korjattiin 21.09.2026 — se oli ristiriidassa §3:n kuukausiankkurin kanssa ja olisi
> lukenut oikein toimineen sweep-ajon nelinkertaisena regressiona. Ks.
> [`../findings/2026-09-21-kalenterisweepin-ensimmainen-tuotantoajo.md`](../findings/2026-09-21-kalenterisweepin-ensimmainen-tuotantoajo.md).

## Vaiheet

| # | Vaihe | Tila |
|---|---|---|
| 0 | Päätöspäiväkenttä `custrecord_gbb_redemption_decided_at` | **valmis** 19.09. |
| 0 | Päätöspäivä-UE `ue_gbb_redemption_decided_at` | **Released** 20.09. (script 2125) |
| 1 | Jaettu kirjasto `gbb_lunastus_lib.js` **1.1.0** | **valmis** 21.09., 50/50 testiä |
| 2 | status-sync: selvitystapa maksun mukana (PR #2) | **tuotannossa** 20.09. |
| 2 | status-sync: kalenterisweep (PR #3) | **tuotannossa** 21.09. — ensimmäinen ajo 658 kääntöä, 0 virhettä |
| 2 | `handler_lunastus.js` (PR #7) | **tuotannossa** 21.09. — statusportti, kohdestatus kirjastosta, CR:n luontipäivä |
| 3 | Lukijat: kuukausiraportointi, laajennus | **seuraava** — esteet poistettu 21.09. |
| 4 | `cf-gbb-tools` | tekemättä — tarvitsee myös arvon 8 |
| 5 | Datakorjaukset | **valmis** — 306 + 691 + 204 + 1 211 = 2 412 pyörää |

## Todennettu tuotannossa

| Mitä | Milloin | Todiste |
|---|---|---|
| Kirjasto latautuu File Cabinetista | 21.09. | `gbb_lunastus_lib=1.1.0` handlerin yhteenvetorivillä |
| UE laukeaa käsin tehdystä muokkauksesta (EDIT) | 20.09. | B000058 |
| UE laukeaa inline-muokkauksesta (XEDIT) | 20.09. | B036668 |
| UE **ei** leimaa kun selvitystapa ei muutu | 20.09. | B014152, system note 14:53 |
| UE laukeaa **automaatiosta** (`-System-`, submitFields) | 21.09. | B038358, B043864 — päätöspäivä 21.09. |
| status-sync kirjoittaa selvitystavan automaatiosta | 21.09. | samat kaksi pyörää |
| Sweep lukee samaa todellisuutta kuin SuiteQL | 21.09. | dry run 769/659/110 = kysely 769/659 |
| Sweepin tuotantoajo | 21.09. | 658 kääntöä, 0 virhettä, 8 min, ei governance-pysäytystä |
| Handlerin statusportti **aukeaa** | 21.09. | pyörät 6496, 10146 — tunnistuspäivä tänään |
| Handlerin statusportti **pysyy kiinni** | 21.09. | pyörä 30672 — tunnistuspäivä 01.11., `DEFERRED` |
| Kohdestatus tulee tavasta eikä nimestä | 21.09. | CR `- 2B` → tapa 6 → status 2 |
| `liab_settled_at` = CR:n luontipäivä | 21.09. | kolme CR:ää, kaikilla luontipäivä eikä ajopäivä |

## Seuraavat taskit

> [!WARNING]
> **CR-ajastus on pois päältä 21.09.2026 alkaen** (tuoteomistaja, CSV-importteja varten). Jonossa
> on **31+ Pending Type 2 -CR:ää** joita ei käsitellä ennen kuin ajastus palautetaan. Tämä on
> tilapäinen tila eikä sitä saa unohtaa — laskutus ja sopimusrivit eivät päivity sillä välin.

### 1. Palauta CR-ajastus ja todenna statusportti — **seuraava**

Kun ajastus on päällä, ne 31 Pending Type 2 -CR:ää käsitellään. **Kaikilla 31:llä tunnistuspäivä on
tulevassa kuukaudessa**, joten oikea lopputulos on **31 lykkäystä ja nolla statuksen kirjoitusta**.
Ohje ja kyselyt: `CLAUDE.md` *Read First*.

Portti on jo todennettu kolmella CR:llä TEST MODE -ajossa 21.09., mutta ei massana.

### 2. Vaihe 3 — lukijat lakkaavat lukemasta `bike_status`-kenttää

Este poistui 21.09.: jokaisella päättyneellä pyörällä on nyt kirjaston hyväksymä todiste.

**`mr_monthly_reporting_ri_creation.js:1002-1005`** — tämä on suunnitelman tärkein yksittäinen
muutos:

```js
// ei:   bikeStatus === REDEEMED || bikeStatus === RETURNED || liabSettledAndPeriodOver
// vaan: onkoVelvoitteetHoidettu(bike).hoidettu && reportingDate > paattymisajankohta(bike)
```

> [!IMPORTANT]
> **`saakoMerkitaPaattyneeksi` ei kuulu tähän skriptiin.** RI-luonti ankkuroituu **sopimusankkuriin**
> ([ADR 0002](adr/0002-kaksi-ankkuria.md)), ei operatiiviseen. Operatiivisen ankkurin käyttö
> poistaisi viimeisen palkanpidätysrivin jokaiselta kesken kuuta päättyvältä pyörältä — **8 427
> kpl**. Ajoituksen pitää säilyä ennallaan: vuokrakauden päättyessä 15.10. Ended-rivi on marraskuun,
> vaikka status kääntyy jo 01.10.
> Ks. [`../findings/2026-09-19-tunnistuspaiva-vs-ri-luonnin-paattymisehto.md`](../findings/2026-09-19-tunnistuspaiva-vs-ri-luonnin-paattymisehto.md).

Kirjastosta tulee mukaan kaksi asiaa, molemmat aitoja korjauksia:

| Kirjastosta | Korvaa | Miksi |
|---|---|---|
| `paattymisajankohta(bike)` | `bike.endDate` (`:73`, `:910`) | RI-luonti lukee vain `custrecord_sta_subsc_end_date`:a eikä kumpaakaan poikkeuspäättymispäivää. **30 pyörällä** OOMI-poikkeuspäivä eroaa siitä. Vaatii molempien kenttien lisäämisen hakuun (`:831`) |
| `onkoVelvoitteetHoidettu(bike)` | `liabSettled` | neljä rinnakkaista todistetta pelkän `liab_settled_at`-kentän olemassaolon sijaan |

Samassa vaiheessa käsiteltävät, kaikki lukevat statusta:

- `mr_monthly_reporting_ri_update.js:717-720` — demotoi rivin Warningiksi pelkän statuksen perusteella
- `mr_backfill_missing_ended_rows.js:24, 91`
- `tools/warning_triage.js:47`
- `netsuite-subscription-extension` · `mr_subscription_extension.js:271-274` — päättelee velvoitteiden hoidon omasta evidenssistään; korvataan `onkoVelvoitteetHoidettu`:lla

**Kirjasto ladataan absoluuttipolulla** `/SuiteScripts/gbb-lib/gbb_lunastus_lib` ja versio (1.1.0)
lokitetaan — se on ainoa tapa havaita epäonnistunut lataus.

### 3. Vaihe 4 — `cf-gbb-tools`

TypeScript Cloudflare Workersilla, ei voi ladata kirjastoa. Toteuttaa samat säännöt erikseen.
**Tarvitsee myös arvon 8** `historical_unknown`, muuten sen käsitys päättyneestä pyörästä eroaa
kirjaston käsityksestä 1 211 pyörän osalta. Lisäksi `plan.ts:381-388`:n varoitus
`BIKE_ALREADY_REDEEMED` ei enää riitä: käyttöliittymän on erotettava *lunastus on sovittu* ja
*pyörä on lunastettu*.

### 4. Sweepin päivittäinen ajastus

Ensimmäinen ajo tehtiin käsin 21.09. Varmista että ajastus on päällä ja seuraava yöajo menee läpi
ilman käsiohjausta.

## Avoimet päätökset

| Asia | kpl | Kysymys |
|---|---|---|
| ~~Selvitystapa puuttuu, ei todistetta~~ | ~~1 211~~ | **ratkaistu 21.09.** → `historical_unknown`, [ADR 0006](adr/0006-historical-unknown-selvitystapa.md) |
| Pyörät ilman statusta | **141** | eivät Active eivätkä päättyneitä, putoavat jokaisen skriptin suodattimesta |
| Selvitystapa 5 `bike_returned` | 178 | kirjasto pitää maksuttomana todisteena; vahvistettava tietoisesti |
| `docs/scripts/ue_...md` cr-scripts-repossa | — | huomautus "ADR should be updated" on vanhentunut, PR #6 korjaa testi 3:n |
