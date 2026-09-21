# Vaihe 3 — muutosspeksi: lukijat lakkaavat lukemasta `bike_status`-kenttää

**Laadittu:** 2026-09-21 · **Tila:** valmis toteutettavaksi · **Toteutus:** omistavissa repoissa,
erillisessä istunnossa (tämä repo on read-only analyysi)
· **Tilanne:** [`lunastus-tilanne.md`](lunastus-tilanne.md) · **Säännöt:** [`lunastuksen-kenttasaannot.md`](lunastuksen-kenttasaannot.md)

Kaikki rivinumerot ja kenttätiedot on luettu koodista 21.09.2026. Ne ovat **koodista todennettuja**;
missä nojaan NetSuiten dataan, se on merkitty erikseen.

> [!IMPORTANT]
> **Ajojärjestys:** tämä vaihe menee tuotantoon **ennen** kuin kalenterisweepin tai CR:n ajastus
> laitetaan päälle. Perustelu ja ketju: [`lunastus-tilanne.md`](lunastus-tilanne.md) § *Ajojärjestys*.

---

## 0. Mitä tämä vaihe on

Neljä skriptiä päättelee tällä hetkellä pyörän päättymisen `custrecord_sta_bike_status`-kentästä,
eli **toisen skriptin tuotoksesta**. Vaihe 3 vaihtaa ne lukemaan samaa todistetta josta kirjoittajat
päättävät: jaettua kirjastoa `gbb_lunastus_lib.js`. Sen jälkeen kirjoittajien ajojärjestys ei enää
vaikuta lukijoiden tulokseen.

**Kirjaston API** (versio 1.1.0, `netsuite-subscrption-cr-scripts/src/FileCabinet/SuiteScripts/gbb-lib/gbb_lunastus_lib.js`):

| Funktio | Palauttaa | Lukee pyörästä |
|---|---|---|
| `paattymisajankohta(bike)` | `?Date` | `exceptional_end_date` → `oomi_exceptional_end_date` → `subsc_end_date` (COALESCE-järjestys) |
| `onkoVelvoitteetHoidettu(bike, lisatodisteet)` | `{hoidettu, todistepaiva, todisteet}` | `liab_settled_at`, `redemption_paid_at`, `liab_settle_method` |
| `saakoMerkitaPaattyneeksi(bike, today, lisatodisteet)` | `boolean` | edelliset + tunnistuspäivä |
| `tunnistuspaiva(bike, today, lisatodisteet)` | `?Date` | `MAX(päättymiskuukauden 1. pv, today)` |
| `kohdestatus(method)` | `?number` | tapa 5 → 3 Returned, muu → 2 Redeemed |
| `tanaanHelsinki()` | `Date` | — |

`lisatodisteet` on `{lunastuslaskuMaksettu?, paylinkValmis?}`, kumpikin `Date`, `'dd.mm.yyyy'`,
`'yyyy-mm-dd'`, `true` tai `false`. Ne ovat säännön §5 todistetyypit 1 ja 2, jotka eivät ole
pyörärekisterissä vaan tapahtumilla ja maksupyynnöillä — kutsuja välittää ne itse.

**Lataus.** Absoluuttipolku, ja `VERSION` lokitetaan. Se on ainoa tapa havaita epäonnistunut lataus:

```js
define(['N/search', 'N/record', /* … */ '/SuiteScripts/gbb-lib/gbb_lunastus_lib'],
       (search, record, /* … */ lunastus) => {
  // ajon yhteenvetorivillä:
  log.audit({ title: `${SCRIPT_NAME} | summary`,
              details: `gbb_lunastus_lib=${lunastus.VERSION} | …` });
```

> [!WARNING]
> **Kirjasto heittää** tuntemattomasta päivämääräformaatista (`tarkistaBike` / `lueDate`). Se on
> tahallista: väärin luettu kuukausi siirtäisi tunnistuspäivää. Map/Reduce-skriptissä tämä kaataa
> yhden `map`-kutsun eikä koko ajoa, mutta **jokainen kutsu on silti käärittävä try/catch:iin joka
> kirjaa pyörän id:n** — muuten hiljainen puuttuva rivi näyttää samalta kuin oikea päätös olla
> luomatta riviä. Tämä on talon tyyli ja sen ansa (`CLAUDE.md` § *Silent failure is the house style*).

---

## 1. `netsuite-monthly-reporting` · `mr_monthly_reporting_ri_creation.js`

**Tämä on suunnitelman tärkein yksittäinen muutos.** Haara `dev`.

### 1.1 Päättymisehto — `:1002-1005`

Nykyinen koodi:

```js
const liabSettledAndPeriodOver =
  liabSettled && !!bike.endDate && reportingDate.getTime() > bike.endDate.getTime();
const isEndedBike = bikeStatus === BIKE_STATUS_REDEEMED || bikeStatus === BIKE_STATUS_RETURNED
  || liabSettledAndPeriodOver;
```

Uusi:

```js
const paattyminen = lunastus.paattymisajankohta(bike);
const velvoitteet = lunastus.onkoVelvoitteetHoidettu(bike);
const isEndedBike = velvoitteet.hoidettu
  && !!paattyminen
  && reportingDate.getTime() > paattyminen.getTime();
```

Kolme asiaa muuttuu ja kaikki kolme ovat aitoja korjauksia:

| Muutos | Miksi |
|---|---|
| `bikeStatus`-haarat poistuvat | status on toisen skriptin tuotos; tämä on koko vaiheen tarkoitus |
| `bike.endDate` → `paattymisajankohta(bike)` | RI-luonti lukee vain `subsc_end_date`:a eikä kumpaakaan poikkeuspäättymispäivää. **30 pyörällä** OOMI-poikkeuspäivä eroaa siitä *(luku dokumentista, ei uudelleen mitattu)* |
| `liabSettled` → `onkoVelvoitteetHoidettu` | neljä rinnakkaista todistetta pelkän `liab_settled_at`:n olemassaolon sijaan |

> [!IMPORTANT]
> **`saakoMerkitaPaattyneeksi` ei kuulu tähän skriptiin.** RI-luonti ankkuroituu
> **sopimusankkuriin** ([ADR 0002](adr/0002-kaksi-ankkuria.md)), ei operatiiviseen. Operatiivinen
> ankkuri poistaisi viimeisen palkanpidätysrivin jokaiselta kesken kuuta päättyvältä pyörältä —
> **8 427 kpl**. Ajoituksen pitää säilyä ennallaan: vuokrakauden päättyessä 15.10. Ended-rivi on
> marraskuun, vaikka status kääntyy jo 01.10. Ks.
> [`../findings/2026-09-19-tunnistuspaiva-vs-ri-luonnin-paattymisehto.md`](../findings/2026-09-19-tunnistuspaiva-vs-ri-luonnin-paattymisehto.md).
>
> Ehto `reportingDate > paattyminen` on nimenomaan se sopimusankkuri. Älä vaihda sitä
> `saakoMerkitaPaattyneeksi`-kutsuun edes siltä näyttävän yksinkertaistuksen vuoksi.

### 1.2 Hakuun **viisi** uutta kenttää — `:830-838`

> [!WARNING]
> **Tämä on isompi kuin `lunastus-tilanne.md` sanoi.** Dokumentti puhui kahdesta
> poikkeuspäättymispäivästä. Kirjasto lukee myös kolme todistekenttää, ja `ri_creation` hakee tällä
> hetkellä vain **booleanin** `liabSettled` erillisestä hausta, ei raakoja arvoja. Kirjaston
> sopimus (ADR 0003) on että syöte on olio jonka avaimet ovat pyörärekisterin kenttätunnuksia —
> boolean ei käy.

`BIKE`-karttaan (`:69-81`) lisätään:

```js
exceptionalEnd:     'custrecord_gbb_exceptional_end_date',
oomiExceptionalEnd: 'custrecord_gbb_oomi_exceptional_end_date',
redemptionPaidAt:   'custrecord_gbb_redemption_paid_at',
liabSettleMethod:   'custrecord_gbb_liab_settle_method',
// liabSettledAt on jo kartassa :80
```

`columns`-listaan (`:830-838`) lisätään kaikki viisi, myös `BIKE.liabSettledAt`. Kommentti joka
selittää miksi `liab_settledAt` **ei** ole sarakkeena on poistettava samalla — se lakkaa olemasta
totta.

Enrichaukseen (`:905-920`) tulee raa'at arvot kirjastolle:

```js
[BIKE.exceptionalEnd]:     resultCol(result, BIKE.exceptionalEnd),
[BIKE.oomiExceptionalEnd]: resultCol(result, BIKE.oomiExceptionalEnd),
[BIKE.subscEnd]:           resultCol(result, BIKE.subscEnd),
[BIKE.liabSettledAt]:      resultCol(result, BIKE.liabSettledAt),
[BIKE.redemptionPaidAt]:   resultCol(result, BIKE.redemptionPaidAt),
[BIKE.liabSettleMethod]:   resultCol(result, BIKE.liabSettleMethod),
```

Kirjasto lukee kenttätunnuksilla, joten nämä on annettava **kenttätunnusavaimilla**, ei
camelCase-aliaksilla. Olemassa olevat camelCase-kentät (`endDate`, `startDate`, …) jäävät paikoilleen
muuta koodia varten — tämä on lisäys, ei uudelleennimeäminen.

### 1.3 `loadBikesWithLiabSettled()` poistuu — `:418-431`

Kun `liab_settled_at` tulee sarakkeena, tämä koko apufunktio, sen kutsu ja `liabSettled`-kenttä
(`:919`) ovat tarpeettomia. **Yksi koko tilikauden laajuinen haku vähemmän per ajo.** Tarkista
ettei `liabSettled` ole käytössä muualla samassa tiedostossa ennen poistoa.

### 1.4 Mitä **ei** muuteta

Haun suodatin `:828` rajaa `[BIKE.bikeStatus, 'anyof', [1, 2, 3]]`. Se on yhä statuksen luku, ja
se pudottaa ne **140 statuksetonta pyörää** *(mitattu NetSuitesta 21.09.)* jokaisen skriptin
ulkopuolelle.

**Jätä suodatin ennalleen tässä vaiheessa.** Vaihe 3 irrottaa *päätöksen* statuksesta; ehdokkaiden
*valinnan* laajentaminen on eri muutos, jolla on oma säde: se tuo 140 pyörää raportointiin
ensimmäistä kertaa. Se on jo dokumentin *Avoimet päätökset* -taulussa omana kysymyksenään, ja se
pitää mitata ennen kuin se tehdään. Kirjaa tämä toteutuksen yhteydessä kommenttina suodattimeen,
ettei seuraava lukija pidä sitä unohduksena.

---

## 2. `netsuite-monthly-reporting` · `mr_monthly_reporting_ri_update.js`

**Tämä on se rivi joka aiheuttaa menetetyn palkanpidätyksen** jos sweep laitetaan päälle ennen tätä
vaihetta.

`:717-720`, funktiossa joka täydentää merkkauksen `[To-add: Data from bike register]`:

```js
if (bike.bikeStatus === BIKE_STATUS_REDEEMED || bike.bikeStatus === BIKE_STATUS_RETURNED) {
  ri.setValue({ fieldId: F.status, value: STATUS_WARNING });
  appendLog(ri, BIKE_ENDED_BEFORE_COMPLETION_TEXT);
}
```

Ongelma on että **status 2 on nyt normaali tila kesken vuokrakautta**. Kalenterisweep kääntää
pyörän statukselle 2 päättymiskuukauden ensimmäisenä päivänä, kuukausia ennen kuin RI-rivi kuuluu
demotoitavaksi. Demotointi Warningiksi jättää rivin sääntö T2:n mukaan pois palkka-CSV:stä.

Uusi ehto — demotoi vain jos pyörä on päättynyt **sopimusankkurin** mukaan, ei operatiivisen:

```js
const paattyminen = lunastus.paattymisajankohta(bike);
const velvoitteet = lunastus.onkoVelvoitteetHoidettu(bike);
if (velvoitteet.hoidettu && paattyminen && riReportingDate.getTime() > paattyminen.getTime()) {
  ri.setValue({ fieldId: F.status, value: STATUS_WARNING });
  appendLog(ri, BIKE_ENDED_BEFORE_COMPLETION_TEXT);
}
```

Sama ankkuri kuin kohdassa 1.1, ja tarkoituksella: rivi demotoidaan täsmälleen silloin kun
`ri_creation` olisi lakannut luomasta sitä.

**Kentät.** `loadBikeData(bikeId)` (`:303-320`) lataa pyörän `record.load`illa ja poimii kentät
käsin. Sinne lisätään samat kuusi kenttätunnusavainta kuin kohdassa 1.2. `record.load` antaa koko
tietueen, joten uutta hakua ei tarvita — vain `getValue`-rivit.

**Varoitusteksti.** `BIKE_ENDED_BEFORE_COMPLETION_TEXT` (`:186`) lukee *"Pyörä merkitty lunastetuksi
tai palautetuksi ennen tietojen täydentämistä"*. Ehto ei enää katso status-merkintää vaan
todistetta, joten teksti kannattaa päivittää vastaamaan uutta ehtoa. **Mutta:** `:145-149` kirjaa
`⚠ CROSS-SCRIPT CONTRACT` — tämän repon UE-skriptien kirjoittamia notifikaatiotekstejä luetaan
muualla osamerkkijonoina. **Tarkista `:141-149` ennen kuin muutat tekstiä**, ja jos se on
sopimuksen alainen, jätä teksti ennalleen ja lisää selitys kommenttiin.

---

## 3. `netsuite-monthly-reporting` · `mr_backfill_missing_ended_rows.js`

Kertaluontoinen backfill, mutta **sen deployment `customscript1458` on yhä elävällä ajastuksella**
(`schemas/script-inventory.md`) — eli se ei ole kertaluontoinen siinä mielessä että se ei enää ajaisi.

Kaksi kohtaa:

- **`:24` (dokumentaatio)** — päättymisehto on kirjoitettu auki prosana ja sanoo *"bike status
  Redeemed OR Returned OR (`liab_settled_at` set AND the leasing period is already over)"*, ja
  lupaa olevansa *"identical wording to mr_monthly_reporting_ri_creation.js (sääntö A1)"*. Kun
  kohta 1.1 on tehty, tämä lupaus rikkoutuu. Päivitä sanamuoto vastaamaan kirjaston predikaattia.
- **`:91` (`BIKE`-kartta ja ehto)** — sama muutos kuin 1.1: kirjasto tilalle, viisi kenttää hakuun.

Jos backfillin populaatio on jo ajettu loppuun, **harkitse deploymentin kääntämistä Not Scheduled
-tilaan** sen sijaan että ehtoa ylläpidetään kahdessa paikassa. Se on oma päätöksensä ja se kuuluu
tuoteomistajalle — nosta esiin, älä tee itse.

---

## 4. `netsuite-monthly-reporting` · `tools/warning_triage.js`

Paikallinen Node-analyysityökalu, ei NetSuite-skripti, **eikä se voi ladata kirjastoa** File
Cabinetista.

`:47`:

```js
const bikeEnded = r => r.bike_status === 'Redeemed' || r.bike_status === 'Returned' || !!r.liab_settled_at;
```

Kaksi vikaa: se lukee statusta, ja `|| !!r.liab_settled_at` hyväksyy pelkän kentän olemassaolon
ilman päättymisajankohdan tarkistusta — sama virhe joka korjattiin `ri_creation`ista aiemmin.

Työkalu lukee SuiteQL-tulosteesta merkkijonokenttiä (`bike_status` on tässä **näyttöarvo**
`'Redeemed'`, ei sisäinen id). Kaksi vaihtoehtoa:

1. **Suositus:** vie kirjaston predikaatti SuiteQL-kyselyyn joka syöttää työkalun, ja lue täältä
   valmis boolean. Kysely kuuluu tähän repoon — [`../queries/`](../queries/README.md),
   rakentaja-agentti `suiteql-rakentaja`.
2. Toista ehto käsin JS:ssä. Nopeampi, mutta luo neljännen rinnakkaisen toteutuksen samasta
   säännöstä, ja juuri niitä tämä projekti on olemassa poistamaan.

Tämä on vaiheen pienin ja vähiten kiireinen kohta: työkalu ei kirjoita mitään NetSuiteen.

---

## 5. `netsuite-subscription-extension` · `mr_subscription_extension.js`

Haara `master`. `:271-274`:

```js
if (isRedemptionInvoicePaid(bikeId)) {
  action = 'skipped_invoice_paid';
} else if (isPaymentRequestCompleted(bikeId)) {
  action = 'skipped_payment_completed';
} else if (hasActiveSubscriptionLine(bikeId, extensionStartDate)) {
```

> [!NOTE]
> **`lunastus-tilanne.md` sanoi että nämä "korvataan `onkoVelvoitteetHoidettu`:lla". Se on väärin
> päin.** `isRedemptionInvoicePaid` ja `isPaymentRequestCompleted` ovat täsmälleen säännön §5
> todistetyypit 1 ja 2, eivätkä ne ole pyörärekisterissä — ne ovat juuri se tieto jota kirjasto ei
> itse voi hakea ja jonka kutsujan on välitettävä. Ne **syötetään** kirjastolle, ei korvata sillä.

```js
const velvoitteet = lunastus.onkoVelvoitteetHoidettu(bike, {
  lunastuslaskuMaksettu: isRedemptionInvoicePaid(bikeId),
  paylinkValmis:         isPaymentRequestCompleted(bikeId)
});
if (velvoitteet.hoidettu) {
  action = 'skipped_liabilities_settled';
} else if (hasActiveSubscriptionLine(bikeId, extensionStartDate)) {
```

Hyöty: pidennysluuppi päättyy myös silloin kun velvoitteet on hoidettu **pyörärekisterin**
todisteella (`redemption_paid_at`, maksuton selvitystapa) eikä vain näillä kahdella. Tällä hetkellä
sellainen pyörä jää luuppiin ja sitä laskutetaan kuukausi lisää.

**Kaksi asiaa vaatii lisätyötä tässä tiedostossa:**

1. **Pyörän kentät.** Skripti saa pyörät tallennetusta hausta
   `customsearch_gbb_br_pidennykset`, jota se ei omista. Jos haku ei palauta niitä kuutta kenttää,
   ne on joko lisättävä hakuun NetSuiten käyttöliittymässä *(haun muutos, ei koodimuutos — kirjaa
   se erikseen)* tai luettava `search.lookupFields`illa per pyörä. **Tarkista haun sarakkeet ensin.**
2. **Aikavyöhyke.** `:262` käyttää `new Date()`:a kuukausirajan laskentaan. SuiteScriptin
   ajonaikainen kello on ~10 h Suomen ajasta jäljessä, joten kuukausiraja menee väärin — ja tämä
   skripti ajetaan **kuun 1. päivänä**, eli pahimmassa mahdollisessa paikassa. Vaihda
   `lunastus.tanaanHelsinki()`:in. Tämä on erillinen vika samassa tiedostossa; korjaa se samalla
   käynnillä mutta **omana committina**, jotta se on peruutettavissa erikseen.

---

## 6. Testaus

Kirjastolla on 50 yksikkötestiä `netsuite-subscrption-cr-scripts/tests/`. **Näillä viidellä
tiedostolla ei ole testiajuria lainkaan** — todentaminen tarkoittaa NetSuite-ajoa. Älä raportoi
mitään näistä "testattuna" ilman ajoa (`CLAUDE.md` § *Working Commands*).

### 6.1 Ennen/jälkeen-mittarit

Talon tyyli on hiljainen epäonnistuminen: `ri_creation` ei kaadu, se jättää rivin luomatta tai
kirjoittaa Warningin. **Lokista ei näe onnistuiko muutos — laske hiljaiset tilat ennen ja jälkeen.**

Aja kukin ennen muutosta ja heti sen jälkeen, samalle raportointipäivälle:

```sql
-- 1. Rivit raportointikuukaudelle statuksittain: jakauman pitää pysyä ennallaan
SELECT custrecord_gbb_ri_reporting_status, COUNT(*)
FROM customrecord_gbb_monthly_reporting_item
WHERE custrecord_gbb_ri_reporting_date = TO_DATE('2026-10-01','YYYY-MM-DD')
GROUP BY custrecord_gbb_ri_reporting_status ORDER BY 1;

-- 2. Warning-rivit: EI saa kasvaa. Kasvu tarkoittaa että kohdan 2 ehto on liian löysä
SELECT COUNT(*) FROM customrecord_gbb_monthly_reporting_item
WHERE custrecord_gbb_ri_reporting_status = 5
  AND custrecord_gbb_ri_reporting_date = TO_DATE('2026-10-01','YYYY-MM-DD');

-- 3. Ended-rivit: EI saa kasvaa yhtäkkiä. Kasvu = operatiivinen ankkuri pääsi mukaan,
--    eli kohdan 1.1 varoitus ohitettiin ja kesken kuuta päättyvät menivät kuukauden liian aikaisin
SELECT COUNT(*) FROM customrecord_gbb_monthly_reporting_item
WHERE custrecord_gbb_ri_reporting_status = 4
  AND custrecord_gbb_ri_reporting_date = TO_DATE('2026-10-01','YYYY-MM-DD');
```

### 6.2 Yksittäiset tapaukset joilla ehto on aidosti erilainen

| Tapaus | Mistä löytyy | Odotettu ero |
|---|---|---|
| OOMI-poikkeuspäivä eroaa `subsc_end_date`:sta | ne **30 pyörää**; hae `oomi_exceptional_end_date IS NOT NULL AND <> subsc_end_date` | ainoa ryhmä jolla `paattymisajankohta` ≠ vanha `bike.endDate`. **Tämän pitää muuttua** — muuten kirjasto ei ole kytkeytynyt |
| Kesken kuuta päättyvä | `subsc_end_date` ei ole kuun viimeinen | Ended-rivi **säilyy** seuraavan kuun 1. päivänä. Jos se siirtyy kuukautta aiemmaksi, ADR 0002 on rikottu |
| Status 2, velvoitteet **ei** hoidettu | ei pitäisi olla olemassa; §8:n mittari | rivi säilyy — vanha koodi olisi pudottanut sen statuksen perusteella |
| `historical_unknown` (8) | ne **1 211 pyörää** | kirjasto pitää tätä maksuttomana todisteena → `hoidettu = true`. Kaikki ovat statuksella 2, joten lopputulos ei muutu. **Jos muuttuu, arvo 8 on päätynyt Active-pyörälle** — §8:n mittarin pitää olla 0 |
| Selvitystapa 1 ilman `paid_at` | §5-rikkomukset, **53 kpl** | `hoidettu = false` → ei Ended-riviä. Vanha koodi katsoi `liab_settled_at`:ia ja olisi tehnyt rivin |
| Ei päättymisajankohtaa lainkaan | `agreed_no_endpoint`, mitattu **0** | `paattymisajankohta = null` → ei koskaan päättynyt. Kirjasto ei oleta "tänään" |

### 6.3 Kirjaston lataus

Ensimmäinen asia joka tarkistetaan jokaisesta ajosta: **`gbb_lunastus_lib=1.1.0` yhteenvetorivillä.**
Jos versio puuttuu, lataus epäonnistui hiljaisesti ja koko ajon tulos on roskaa. Tämä ansa on
purrut jo kertaalleen tässä projektissa (`lunastus-tilanne.md`, opitut asiat, viides rivi).

---

## 7. Toteutusjärjestys

| # | Mitä | Miksi tässä järjestyksessä |
|---|---|---|
| 1 | `ri_update.js` (kohta 2) | Poistaa sen demotoinnin joka tekee sweepistä vaarallisen. Pienin diffi, suurin riskin poisto |
| 2 | `ri_creation.js` (kohta 1) | Päämuutos. Hakukentät ja ehto samassa committina — ehto ei toimi ilman kenttiä |
| 3 | `mr_backfill_missing_ended_rows.js` (kohta 3) | Pitää ehdon yhtenäisenä kahden skriptin välillä |
| 4 | `mr_subscription_extension.js` (kohta 5) | Eri repo, eri haara; kaksi committia (kirjasto + aikavyöhyke) |
| 5 | `tools/warning_triage.js` (kohta 4) | Ei kirjoita NetSuiteen; voi odottaa |

Vaiheiden 1 ja 2 jälkeen **sweepin ajastus voidaan laittaa päälle** — se on se este joka nyt
pitää sen pois. CR-ajastus vaatii koko listan, koska UE-skriptien synnyttämät rivit kulkevat
`ri_update`:n kautta.

## 8. Mitä tämä speksi korjaa aiempaan suunnitelmaan

Kolme kohtaa joissa `lunastus-tilanne.md` § *Seuraavat taskit* oli epätarkka. Ne on korjattu tähän,
ei sinne, jotta tilannedokumentti pysyy tilannekuvana:

| Väite siellä | Todellisuus |
|---|---|
| "Vaatii molempien kenttien lisäämisen hakuun" | **viisi** kenttää, ja `loadBikesWithLiabSettled()` poistuu (kohta 1.2–1.3) |
| Laajennuksen omat tarkistukset "korvataan `onkoVelvoitteetHoidettu`:lla" | ne **syötetään** sille `lisatodisteet`-parametrina (kohta 5) |
| `ri_update.js:717-720` "demotoi rivin Warningiksi pelkän statuksen perusteella" | oikein, mutta korjaus tarvitsee **sopimusankkurin**, ei pelkkää kirjaston predikaattia (kohta 2) |
