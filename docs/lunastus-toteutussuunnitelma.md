# Lunastussääntöjen toteutus — mitä muutetaan ja missä

**Päivämäärä:** 2026-09-18 · **Sääntö:** [`lunastuksen-kenttasaannot.md`](lunastuksen-kenttasaannot.md)

Tämä dokumentti kertoo mitä muutoksia [kenttäsäännöt](lunastuksen-kenttasaannot.md) vaativat
kussakin sisarrepossa. **Muutoksia ei tehdä täältä** — tämä repo on lukutilassa. Jokainen kohta on
tehtävä omistavassa repossa sen omilla konventioilla.

Järjestys on riippuvuusjärjestys, ei kiireysjärjestys.

> **Missä mennään:** [`lunastus-tilanne.md`](lunastus-tilanne.md) — mittarit, vaiheiden tila,
> tuotannossa todennetut asiat ja seuraavat taskit. Tämä dokumentti kertoo *mitä tehdään*,
> tilannedokumentti *missä mennään*.

---

## Vaihe 0 — NetSuite-konfiguraatio (ei repoa)

| Muutos | Peruste | Tila |
|---|---|---|
| Uusi päivämääräkenttä **päätöspäivä** tietueelle `customrecord_sta_bike_register`, ei pakollinen | [ADR 0001](adr/0001-uusi-paatospaiva-kentta.md) | **valmis 19.09.2026** |
| Script-tietue ja deployment `ue_gbb_redemption_decided_at.js`:lle, CREATE/EDIT/XEDIT | [ADR 0004](adr/0004-paatospaivan-kirjoittaa-ue.md) | **Released 20.09.2026** (script 2125) |

`custrecord_gbb_redemption_decided_at` · otsikko LUNASTUS SOVITTU · tyyppi Date · suodatettavissa ·
tyhjä 46 737/46 737. Todennettu NetSuitesta 19.09.2026.

Kaikki muu riippuu tästä vain osittain: kirjasto ja statusportti toimivat ilmankin. Kenttää **ei
backfillata**, eikä tilan *lunastus sovittu* tunnistaminen riipu siitä — se tunnistetaan
selvitystavasta ja statuksesta. Kenttä kertoo kuinka kauan tila on kestänyt.

---

## Vaihe 1 — Jaettu kirjasto

**Repo:** `netsuite-subscrption-cr-scripts` (omistaja, ks. [ADR 0003](adr/0003-jaetun-kirjaston-sijainti.md))
**Uusi tiedosto:** `src/FileCabinet/SuiteScripts/gbb-lib/gbb_lunastus_lib.js`
**Tila:** **valmis** — File Cabinetissa `/SuiteScripts/gbb-lib/` 20.09.2026, 45/45 yksikkötestiä läpi

Viisi predikaattia, ei enempää:

```js
paattymisajankohta(bike)            // COALESCE(exceptional, oomi_exceptional, subsc_end) — ei fallbackia
onkoVelvoitteetHoidettu(bike)       // { hoidettu, todistepaiva }
tunnistuspaiva(bike, today)         // MAX(päättymisajankohdan kuun 1. pv, today)
saakoMerkitaPaattyneeksi(bike, today)
kohdestatus(method)                 // 5 → 3, muut → 2
```

Kaksi asiaa jotka on helppo toteuttaa väärin:

- **`tunnistuspaiva` palauttaa `null` jos päättymisajankohtaa ei ole.** Ei tämän päivän
  oletusarvoa — puuttuva päättymisajankohta on virhe, ei lunastuslupa. Tämä on koko nykyisen
  vikatilan juurisyy maksuvetoisella polulla.
- **Aikavyöhyke.** `today` on `Europe/Helsinki` -päivä, ei SuiteScriptin ajonaikainen paikallinen
  aika (~10 h ero). Kuukauden ensimmäisen päivän laskenta menee muuten pieleen kuukausirajalla.

Kirjastolle on syytä kirjoittaa Jest-testit `netsuite-ic-calculators`in mallin mukaan — se on ainoa
sisarrepo jolla testit jo ovat, ja nämä predikaatit ovat puhtaita funktioita.

---

## Vaihe 2 — Kirjoittajat kysyvät luvan

### `netsuite-subscrption-cr-scripts` · `handler_lunastus.js`

| Rivi | Nyt | Pitäisi |
|---|---|---|
| `:106` | kohdestatus päätellään CR:n nimestä (`crName.indexOf('2D')`) | `kohdestatus(method)` — nimi ei enää ohjaa. **Huom:** `bikeStatus` on kahdessa roolissa, se on myös syöte `resolveLiabilitySettlement`ille. Kehä on purettava säilyttäen nykyinen presedenssi |
| `:108` | status kirjoitetaan ajohetkellä | vain jos `saakoMerkitaPaattyneeksi`. **Esiehto: kalenterisweep tuotannossa** ([ADR 0005](adr/0005-tilasiirtyman-2-3-tekee-kalenterisweep.md)) |
| `:209` | `liab_settled_at = new Date()` | **`custrecord_cr_created_date`** — päivä jona asiakaspalvelija vahvisti kaiken tehdyksi. Handler **ei** hae maksutodistetta: CR luodaan vasta kun kaikki keskenkauden lunastuksen toimenpiteet maksu mukaan lukien on tehty (tuoteomistaja 20.09.2026), joten CR:n olemassaolo **on** todiste. Kenttä on myös pakko jatkaa kirjoittamista, koska kuukausiraportointi lukee sitä päättymissignaalina kunnes vaihe 3 on tehty |

> **Miksi ei `new Date()` eikä tyhjä.** Ajopäivä on mitattavasti väärä: `custrecord_cr_created_date`
> eroaa sulkemispäivästä **2 327/2 495** Done-CR:llä (93 %), eli CR odottaa jonossa. Kenttä on
> täytetty kaikilla 2 495:llä. Tyhjäksi jättäminen taas katkaisisi statusportin, koska selvitystapa
> 1 ei ole todiste ilman maksua — todennettu: selvitystapa 1 ilman `paid_at`:ia **ja** ilman
> `settled_at`:ia = **0** tietuetta, eli ketju toimii tänään vain koska handler itse leimaa kentän.

Kaikki muu mitä handler tekee — sopimusrivit, laskut, selvitystapa, `ic_redemption_dt` — tapahtuu
edelleen heti. **Vain status ja `date_to_non_active` lykkääntyvät.** Tämä on tarkoitus: laskutus ja
kuukausiraportointi jatkuvat normaalisti tilassa *lunastus sovittu*.

Nimipohjainen reititys (` - 2B`, `vakuutus`) jää selvitystavan päättelyyn; vain kohdestatus
irrotetaan siitä.

### `netsuite-bike-redemption-status-sync` · `gbb_ss_bike_redemption_status_sync.js`

Tämä on kahdesta kirjoittajasta se joka tuottaa ne kolme vakavaa aukkopyörää.

> [!NOTE]
> **Rivi `:433` on tehty 20.09.2026.** PR
> [GobybikeFinland/netsuite-bike-redemption-status-sync#2](https://github.com/GobybikeFinland/netsuite-bike-redemption-status-sync/pull/2)
> hyväksytty ja tiedosto viety File Cabinetiin. Skripti kirjoittaa nyt
> `custrecord_gbb_liab_settle_method = 1` statuksen mukana, write-once-vartioituna ja vain
> `statusDue`-haarassa. Ensimmäinen ajo 20.09. klo 11:22–11:24 ei osunut yhteenkään
> `statusDue`-pyörään (0/151), joten kirjoituspolku on vielä todentamatta — mutta muokattu SQL
> ajautui virheittä (148 + 110 riviä), mikä oli muutoksen ainoa tekninen riski. Seuraava
> koeponnistus on kuun vaihteessa, jolloin iso erä `schedule_date = 30.09.2026` erääntyy.
>
> Kolme muuta riviä (`:245`, `:256`/`:330`, `:434`) odottavat yhä kirjaston käyttöönottoa — ne
> eivät ole tehtävissä ilman `saakoMerkitaPaattyneeksi`-predikaattia.

| Rivi | Nyt | Pitäisi |
|---|---|---|
| `:245` | `COALESCE(overridedate, subscenddate, eventdate)` | maksupäivä-fallback **poistetaan** |
| `:256`, `:330` | `subscenddate` populoituu vain `so_type = 4` | myös `so_type = 3` (keskenkauden lunastus) |
| `:433` | ei kirjoita selvitystapaa | kirjoittaa `liab_settle_method = 1` ja päätöspäivän |
| `:434` | `if (row.statusDue)` | `saakoMerkitaPaattyneeksi` |

> [!IMPORTANT]
> **Nämä neljä riviä eivät ole erillisiä korjauksia vaan saman muutoksen osia**, ja niihin kuuluu
> viides jota tämä suunnitelma ei tuntenut: **kalenterisweep**
> ([ADR 0005](adr/0005-tilasiirtyman-2-3-tekee-kalenterisweep.md)). Kun statuspäätös siirtyy
> kirjastolle, se ei enää tarvitse maksudataa, jolloin `MATCH_WHERE_SQL`, `statusDue` ja
> aikataulupäivän laskenta — **maksupäivä-fallback mukaan lukien** — käyvät kuolleiksi ja
> poistuvat. Statuksen kirjoitus siirtyy kokonaan pyörärekisteriin kohdistuvaan sweepiin.
>
> **Sweep on `handler_lunastus.js`:n statusportin esiehto.** Ilman sitä 96 % lunastuksista jäisi
> pysyvästi Activeksi.

Fallbackin poisto tarkoittaa että pyörä jolta päättymisajankohta puuttuu **ei lunastu lainkaan**.
Se on oikea lopputulos, mutta se on hiljainen — polulle tarvitaan jokin näkyvä jälki, ettei pyörä
katoa jonosta kuten laajennussilmukassa käy nyt.

Rivien `:261` ja `:335` suodatin `bike_status = 1` muuttuu samalla ongelmasta ratkaisuksi: kun
status ei enää käänny etuajassa, suodatin lakkaa sulkemasta pyöriä ulos `redemption_paid_at`
-leimasta.

---

## Vaihe 3 — Lukijat lakkaavat lukemasta statusta

### `netsuite-monthly-reporting` · `mr_monthly_reporting_ri_creation.js:1004`

```js
const isEndedBike = bikeStatus === BIKE_STATUS_REDEEMED || …   // nyt
```

**RI-luonti lakkaa lukemasta `bike_status`-kenttää** — se on sääntödokumentin §6:n vaatimus, ja
perustelu pätee: niin kauan kuin RI-luonti lukee statusta, statuksen kirjoitushetki vaikuttaa
raportointiin ja kaksi ajoa kilpailee saman päivän sisällä.

**Ajoitus ei muutu.** Korvaava ehto rakennetaan **sopimusankkurista** ([ADR 0002](adr/0002-kaksi-ankkuria.md)),
ei tunnistuspäivästä:

```js
// ei:   bikeStatus === REDEEMED || bikeStatus === RETURNED || liabSettledAndPeriodOver
// vaan: onkoVelvoitteetHoidettu(bike).hoidettu && reportingDate > paattymisajankohta(bike)
```

> [!IMPORTANT]
> `saakoMerkitaPaattyneeksi` ja `tunnistuspaiva` **eivät kuulu tähän skriptiin.** Ne ovat
> operatiivinen ankkuri ja ohjaavat vain `bike_status`-kenttää ja `date_to_non_active`:ia.
> Raportointi ja laskutus ankkuroituvat päättymisajankohtaan. Vuokrakauden päättyessä 15.10.
> Ended-rivin raportointipäivä on 01.11. vaikka status saa kääntyä jo 01.10. — ero on ADR 0002:n
> tarkoitus, ei virhe. *Tämän dokumentin aiempi versio määräsi tähän `saakoMerkitaPaattyneeksi`:n;
> se olisi pudottanut viimeisen palkanpidätysrivin jokaiselta kesken kuuta päättyvältä pyörältä
> (8 427 kpl).*

Kirjastosta tulee siis mukaan kaksi asiaa, molemmat aitoja korjauksia:

| Kirjastosta | Korvaa | Miksi |
|---|---|---|
| `paattymisajankohta(bike)` | `bike.endDate` (`:73`, `:910`) | RI-luonti lukee vain `custrecord_sta_subsc_end_date`:a eikä kumpaakaan poikkeuspäättymispäivää. 30 pyörällä OOMI-poikkeuspäivä eroaa siitä. Vaatii molempien kenttien lisäämisen hakuun (`:831`) |
| `onkoVelvoitteetHoidettu(bike)` | `liabSettled` | neljä rinnakkaista todistetta pelkän `liab_settled_at`-kentän olemassaolon sijaan |

Yksityiskohdat ja mittaukset:
[`findings/2026-09-19-tunnistuspaiva-vs-ri-luonnin-paattymisehto.md`](../findings/2026-09-19-tunnistuspaiva-vs-ri-luonnin-paattymisehto.md).

Sama `bike_status`-luku on myös `mr_backfill_missing_ended_rows.js`:ssä ja
`tools/warning_triage.js:47`:ssä.

> [!IMPORTANT]
> **Esiehto: selvitystapa on täydennettävä ensin.** 1 515 pyörää on statuksella 2 ja 2 statuksella
> 3 ilman selvitystapaa (todennettu 20.09.2026). Kun status-luku poistuu, ne eivät enää ole
> päättyneitä kirjaston mielessä. **Varaehtoa `|| bike_status IN (2,3)` ei lisätä** — se olisi juuri
> se toisen skriptin tuotoksesta päättely jonka kirjasto poistaa (tuoteomistajan päätös
> 20.09.2026). Sen sijaan data täydennetään:
> [`findings/2026-09-20-selvitystavan-taydennys-paattyneille.md`](../findings/2026-09-20-selvitystavan-taydennys-paattyneille.md).
> 306:lle tapa täydennettiin CSV-importilla **20.09.2026** (todennettu: kaikki mittarit täsmäsivät,
> ei uusia sääntörikkomuksia). **1 211 on yhä ilman tapaa** — avoin liiketoimintapäätös.

Muutoksen jälkeen `isBeforeExistingEndedRow` (`:1022-1024`) jää paikalleen, mutta lakkaa olemasta
ainoa suoja — se on T-A2-korjauksen paikkaus, ei sääntö.

Myös `mr_monthly_reporting_ri_update.js:717-720` demotoi rivin Warningiksi pelkän statuksen
perusteella. Sama muutos.

### `netsuite-subscription-extension` · `mr_subscription_extension.js:271-274`

Skripti päättelee velvoitteiden hoidon **omasta itsenäisestä evidenssistään**
(`isRedemptionInvoicePaid`, `isPaymentRequestCompleted`) eikä pyörärekisteristä. Tämä korvataan
`onkoVelvoitteetHoidettu`-predikaatilla.

Suodatin `:220` (`bike_status = 1`) muuttuu tässäkin vaarattomaksi kun status ei enää käänny
etuajassa. Sama koskee normaaliajon tallennettua hakua `customsearch_gbb_br_pidennykset`, jonka
ehdot on nyt luettu (`BIKE STATUS is Active` · `SUBSCRIPTION END DATE is on 1 days ago` ·
`Order type is not OOMI`, ks. [`../schemas/saved-searches.md`](../schemas/saved-searches.md)): se
**suodattaa statuksella**, joten etuajassa käännetty pyörä katoaa siitä — ja statusportin jälkeen se
ei enää katoa. Hakua itseään ei tarvitse muuttaa.

### `netsuite-ic-calculators`

`gbb_ic_redemption_calculator.js`iin **ei kosketa.** `ic_redemption_dt` säilyttää merkityksensä
sopimusankkurina ([ADR 0002](adr/0002-kaksi-ankkuria.md)). Muutos on vain se, että kentän
*kirjoittaja* johtaa arvon `LAST_DAY(paattymisajankohta(bike))`-kaavalla kirjaston kautta.

Tällä hetkellä kenttää ei kirjoita mikään skripti — arvot tulevat CSV-importeista. Kirjoittajan
lisääminen on erillinen päätös, ei tämän suunnitelman osa.

---

## Vaihe 4 — `cf-gbb-tools`

TypeScript Cloudflare Workersilla; **ei voi käyttää kirjastoa**. Toteuttaa samat säännöt erikseen
`src/app/lib/`-puolella, `helsinki-date.ts`in rinnalla, vitest-testein.

Konkreettinen käyttäytymismuutos: CR:n luonnin varoitus `BIKE_ALREADY_REDEEMED`
(`plan.ts:381-388`) ei enää riitä. Kun pyörä voi olla laillisesti tilassa *lunastus sovittu*,
käyttöliittymän on erotettava "lunastus on jo sovittu" ja "pyörä on jo lunastettu" — nyt ne ovat
sama status.

---

## Vaihe 5 — Datakorjaukset

Erillinen [korjausjärjestys](../findings/2026-09-18-ennenaikainen-lunastusstatus.md#korjausjärjestys).
Tiivistetysti: ne 10 aukkopyörää käsin ennen koodimuutoksia, 189 niiden jälkeen, 3 278 historiallista
ei lainkaan. Statuksen kirjoitus laukaisee `gbb_webhook_ue_status_changed.js`:n, joten
massa-CSV-import ei sovi.

---

## Mitä tässä suunnitelmassa ei ole

- **Ajojärjestystä ei muuteta.** Kirjasto tekee siitä tarpeettoman.
- **Nimipohjaista reititystä ei pureta.** Se on oma asymmetriansa, ei tämän säännön ongelma.
- **`ic_redemption_dt`:n kirjoittajaa ei lisätä.** Kenttä täytetään yhä CSV:llä; sen
  automatisointi vaatii oman päätöksensä.
- **Taannehtivaa korjausta ei tehdä** siellä missä vuokrakausi on jo päättynyt.

## Todennettu vs. päätelty

**Todennettu NetSuitesta 18.09.2026:** kaikki luvut (189, 10, 3 278, 53, 8 427, selvitystapajakauma)
— ks. findings-dokumentti.

**Luettu NetSuiten käyttöliittymästä 18.09.2026:** tallennetun haun
`customsearch_gbb_br_pidennykset` kolme suodatinta
([`../schemas/saved-searches.md`](../schemas/saved-searches.md)). Tämä sulkee vaiheen 3 aiemmin
avoimen oletuksen.

**Päätelty koodista:** rivinumerot ja se, mitä kukin muutos aiheuttaa.
