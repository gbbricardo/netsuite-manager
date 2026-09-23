# Lunastusprojektin tilanne

**Päivitetty:** 2026-09-23 (**vaiheet 0–3 tuotannossa, molemmat ajastukset päällä**) · **Suunnitelma:** [`lunastus-toteutussuunnitelma.md`](lunastus-toteutussuunnitelma.md)
· **Säännöt:** [`lunastuksen-kenttasaannot.md`](lunastuksen-kenttasaannot.md)
· **Vaihe 3:** [`vaihe-3-muutosspeksi.md`](vaihe-3-muutosspeksi.md)

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

Todennettu NetSuitesta **23.09.2026** (sarake *21.09.* on säilytetty vertailukohdaksi).

| Mittari | 18.09. lähtötilanne | 21.09. | **23.09. nyt** | Tavoite |
|---|---|---|---|---|
| **Päättyneitä ilman todistetta** *(vaiheen 3 este)* | 1 415 | 0 | **0** | pysyy 0 |
| **Lunastettu ennen tunnistuspäivää** *(§8)* | ei mitattu | 0 | **0** | ei kasva |
| Selvitystapa puuttuu, status 2/3 | 1 517 | 0 | **0** | pysyy 0 |
| Selvitystapa puuttuu, status 1, maksettu | 691 | 0 | **0** | pysyy 0 |
| `historical_unknown` (8) käytössä | arvoa ei ollut | 1 211 | **1 211** | ei kasva |
| `historical_unknown` **Active-pyörällä** *(väärinkäyttö)* | — | 0 | **0** | **pysyy 0** |
| §5-rikkomukset selvitystavalla 1 | 53 | 53 | **54** ⚠ | ~~ei kasva~~ — **kasvoi, ks. löydös** |
| Tila 2 *lunastus sovittu* | ei käsitteenä | 117 | **164** | vaihtelee kuukausirytmissä |
| Päättyneitä (status 2/3) | 12 512 | 13 199 | **13 263** | — |
| `date_to_non_active` tyhjä | 6 | 2 | **0** | ratkennut |
| Päätöspäivä kirjattu | kenttää ei ollut | 7 | **120** | kasvaa automaattisesti |
| Pyöriä ilman statusta | 148 | 140 | **137** | oma selvitys |

**Ensimmäistä kertaa jokaisella päättyneellä pyörällä on selvitystapa ja kirjaston hyväksymä
todiste.** Se oli vaiheen 3 ainoa este.

> **`date_to_non_active` ratkesi.** 21.09. illalla kaksi pyörää (6496, 10146) oli ilman arvoa;
> 23.09. luku on **0**. Viiveellä täyttävä tuntematon prosessi ehti niihin, kuten `CLAUDE.md`
> ennusti. Se prosessi on yhä tunnistamatta — jos kentän käytöstä pitää joskus muuttaa, se on
> ensin löydettävä.

> [!WARNING]
> **§5-rikkomukset kasvoivat 53 → 54, ja se on ainoa mittari joka liikkui väärään suuntaan.**
> Uusi on pyörä **25325**: maksu kirjattu 17.09., mutta `handler_lunastus` kirjoitti
> `liab_settled_at`-kenttään CR:n luontipäivän **22.09.** §5 vaatii aikaisimman todisteen. Kirjasto
> osaa tämän jo (`onkoVelvoitteetHoidettu().todistepaiva`), mutta handler ei käytä sitä tähän
> kenttään. **Jonossa on 1 CR joka tuottaa seuraavan rikkomuksen.** Korjaus ja ennakoiva kysely:
> [`../findings/2026-09-23-handler-lunastus-rikkoo-pykala-5-kun-maksu-on-aiempi.md`](../findings/2026-09-23-handler-lunastus-rikkoo-pykala-5-kun-maksu-on-aiempi.md).

> **CR-jono purkautuu.** 22.09. jonossa oli 33, 23.09. enää **16** (1 tyyppi 1, 6 tyyppi 2,
> 1 tyyppi 3, 1 tyyppi 7, 1 tyyppi 10, 6 tyyppi 11). Governance katkaisee erän, joten loput menevät
> seuraavissa ajoissa.

> [!NOTE]
> **39 CR:ää on tilassa Error (5), ja ne ovat kaikki vanhoja** — yhtäkään ei ole muokattu 22.09.
> jälkeen. 37 on tyyppiä 11 ja vanhin on **26.02.2026**, loput tyyppiä 7 (15.09.) ja 13 (25.07.).
> Ajastuksen palautus **ei** siis tuottanut niitä. Ne ovat oma, koskematon kasaumansa jota kukaan ei
> ole purkanut, ja ne kannattaa auditoida erikseen — `muutospyyntoauditoija`-agentti on tähän.

> **Vanha §8-mittari** (`status = 2 AND subsc_end_date > CURRENT_DATE`) näyttää ~847 eikä 0. Se on
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
| 2 | status-sync: kalenterisweep (PR #3) | **koodi tuotannossa** 21.09. — ensimmäinen ajo 658 kääntöä, 0 virhettä, **mutta deployment on `Testing` eikä aja yöllä** |
| 2 | `handler_lunastus.js` (PR #7) | **tuotannossa** 21.09. — statusportti, kohdestatus kirjastosta, CR:n luontipäivä |
| 3 | Lukijat: `ri_creation` + `ri_update` | **tuotannossa ja todennettu** 21.09. — säännöt A1, A2, B1, D3 |
| 3 | Lukijat: täysi regressioajo | **tekemättä** — kaikki 9 ajoa olivat `TEST SCOPE` |
| 3 | Lukijat: `subscription-extension`, `warning_triage` | **tekemättä** — speksin kohdat 5 ja 4 |
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
| **Statusportti massana** | 22.09. | 43 CR:ää: 14 lykkäystä (päättyminen tulevaisuudessa), 29 statuksen kirjoitusta (tunnistuspäivä tullut), **0 väärässä neljänneksessä**, 0 virhettä |
| **Sweep ajastettuna** | 22.09. | `171 candidates, 20 status changes, 151 waiting, 0 errors` |
| **`tanaanHelsinki()` korjaa kelloeron** | 22.09. | sweep kirjasi `tunnistuspäivä=2026-09-22` lokirivien päiväyksen ollessa 21.09. |
| **Vaihe 3:** kirjasto latautuu RI-skripteihin | 21.09. | `gbb_lunastus_lib=1.1.0`, `mapErrors=0`, molemmat skriptit, 9 ajoa |
| **Vaihe 3:** kirjasto ratkaisee päättymisajankohdan | 21.09. | pyörä 38677 — OOMI-poikkeuspäivä 30.09. → **Ended** 01.10.; `subsc_end` 04.10. olisi antanut Activen, ja A3 ei voinut laueta |
| **Vaihe 3:** todistehaara pitää | 21.09. | pyörä 38943 — päättymispäivä mennyt mutta ei todistetta → **Active** |
| **Vaihe 3:** ADR 0002:n sopimusankkuri säilyy | 21.09. | pyörä 37874, kausi päättyy 15.10. → **Active 01.10. + Ended 01.11.**, loki `finalPartialMonth=true` |
| **Vaihe 3:** `ri_update` alentaa kun kuuluu | 21.09. | rivi 116169 (pyörä 2849, kausi ohi 30.09.) Active → **Warning** ja **uusi** varoitusteksti — teksti todistaa että uusi haara ajoi |
| **Vaihe 3:** `ri_update` **ei** alenna kun kausi on kesken | 21.09. | rivi 104321 (pyörä 4234, kausi 31.03.2027) — loki `scanned=1 resolved=1 errors=0`, status pysyi **Active**, ei tekstiä |

## Seuraavat taskit

> [!NOTE]
> **Molemmat ajastukset ovat päällä 22.09.2026 alkaen.** CR-käsittely palautettiin ja kalenterisweep
> vaihdettiin `Testing` → `Scheduled`. Kumpikin on ajanut ilman virheitä; tulokset alla ja
> *Todennettu tuotannossa* -taulussa. **Jonossa on yhä 33 CR:ää** (15 tyyppi 2, 16 tyyppi 11,
> 1 tyyppi 1, 1 tyyppi 7) — governance katkaisee erän, joten backlog purkautuu useassa ajossa.


### Ajojärjestys — päätetty 21.09.2026

**Vaihe 3 ensin, ajastukset vasta sen jälkeen.** Järjestys on 1 → 2 → 3 alla, ja se on
tietoinen päätös eikä prioriteettijärjestys: kytkimet 2 ja 3 kirjoittavat tai synnyttävät dataa
jota vaiheen 3 vanha logiikka lukee väärin, ja synnytettyä dataa ei saa poistetuksi CR:ää
poistamalla.

**Ketju joka pakottaa järjestyksen** — todennettu koodista 21.09.:

| # | Mitä tapahtuu | Lukeeko statusta |
|---|---|---|
| 1 | CR Pending → Done (dispatcher) | — |
| 2 | Viisi UE-skriptiä laukeaa, `RELEASED` — monthly-reportingin **ainoa automaattisesti laukeava osa** | **ei** — grep `bike_status\|liab_settle` viiteen tiedostoon antaa 0 osumaa |
| 3 | UE luo RI-rivin merkkauksella `[To-add: Data from bike register]` | ei |
| 4 | Joku ajaa `ri_update`:n käsin (deployment on `Testing`) → täydentää pyörärekisterin tiedot | **kyllä**, `:717-720` |
| 5 | Jos pyörän status on 2 tai 3, rivi **demotoidaan Warningiksi** | — |

Warning-rivi jää sääntö T2:n mukaan pois palkka-CSV:stä, eli **vaihe 5 on menetetty
palkanpidätys**.

Niillä 28 jonossa olevalla Type 2 -CR:llä statusportti lykkää, joten pyörä jää statukselle 1 ja
vaihe 5 ei laukea heti. Mutta **kaikilla 28:lla päättymispäivä on ≥ 01.10.2026**, eli niiden
tunnistuspäivä osuu juuri siihen väliin: jos rivit syntyvät nyt ja sweep kääntää pyörät statukselle
2 lokakuun alussa, seuraava `ri_update`-ajo demotoi ne. Altistumaa ei ole tällä hetkellä lainkaan —
yksikään ei-poistettu RI-rivi ei kanna merkkausta (todennettu SuiteQL:llä 21.09.) — vaan se syntyy
vasta kun CR:t menevät Doneksi.

**Sweep on näistä vaarallisin kytkin**, koska se on statuksen kirjoittaja. CR-ajastus on
vaarattomin, koska sen automaattinen vaikutus rajoittuu statusblindeihin UE-skripteihin — mutta se
silti synnyttää rivit jotka odottavat `ri_update`:a, joten sekin jää vaiheen 3 jälkeen.

> [!IMPORTANT]
> **Vaihe 3 on nyt kriittisellä polulla aikarajan kanssa.** CR-ajastus on ollut pois 17.09. asti,
> jono kasvaa, eivätkä sopimusrivit ja laskutus päivity sillä välin. Vaiheen 3 pitäisi olla
> tuotannossa **ennen lokakuun raportointiajoa**, jotta ketju ei jää pidemmäksi aikaa purettuna.

> [!NOTE]
> Aiempi revisio tästä tiedostosta piti CR-ajastuksen palautusta taskina 1 ja sweepin ajastusta
> taskina 4. Se oli väärä järjestys: se olisi laittanut statuksen kirjoittajan päälle ennen kuin
> lukijat lakkasivat päättelemästä statuksesta.


### 1. Vaihe 3 — lukijat lakkaavat lukemasta `bike_status`-kenttää — **seuraava**

> [!IMPORTANT]
> **Rivitarkka muutosspeksi:** [`vaihe-3-muutosspeksi.md`](vaihe-3-muutosspeksi.md) (21.09.2026).
> Se on toteutuksen lähde — lue se tämän osion sijaan ennen kuin koskette koodiin. Se korjaa kolme
> epätarkkuutta tähän osioon: hakuun tarvitaan **viisi** kenttää eikä kahta ja
> `loadBikesWithLiabSettled()` poistuu; laajennuksen omat maksutarkistukset **syötetään**
> `onkoVelvoitteetHoidettu`:lle `lisatodisteet`-parametrina eikä korvata sillä; ja `ri_update`:n
> korjaus tarvitsee sopimusankkurin, ei pelkkää kirjaston predikaattia.

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

### 2. ~~Sweepin päivittäinen ajastus~~ — **päällä ja ajanut 22.09.2026**

> [!NOTE]
> Deployment `customdeploy_gbb_redemption_sync` vaihdettiin `Testing` → **`Scheduled`**, ja ajo meni
> läpi: **171 kandidaattia, 20 statuksen kirjoitusta, 151 yhä odottamassa, 0 virhettä.**
>
> Ajo todensi myös aikavyöhykeansan korjatuksi: se kirjasi `tunnistuspäivä=2026-09-22`, vaikka sen
> omat lokirivit ovat päiväyksellä 21.09. — ajonaikainen kello on ~10 h Suomen ajasta jäljessä, ja
> `tanaanHelsinki()` korjaa sen. Kuukausirajalla tuo ero olisi siirtänyt tunnistuspäivää kokonaisen
> kuukauden.
>
> Alla oleva alkuperäinen kuvaus on säilytetty, koska se kertoo miksi tämä oli este.



> [!WARNING]
> `customscript_gbb_bike_redemption_status` / `customdeploy_gbb_redemption_sync` on statuksella
> **`Testing`**, ei `Scheduled`. Testing-tilassa vain skriptin omistaja voi käynnistää sen käsin
> **eikä toistuvuus laukea lainkaan**, joten kalenterisweep ei aja yöllä. Siirtymä *lunastus
> sovittu* (tila 2) → *lunastettu* ei siis tapahdu automaattisesti, vaan vain silloin kun joku
> ajaa sweepin käsin.

Tämä on se sama puuttuva pala jonka koko vaihe 2 rakensi: tunnistuspäivä on kalenteritapahtuma, ja
kalenterisweep on ainoa asia joka sen havaitsee. Testing-tilassa se ei havaitse.

**Tehtävä:** vaihda deployment `Scheduled`-tilaan, varmista toistuvuus (päivittäin) ja todenna että
seuraava yöajo menee läpi ilman käsiohjausta. Sen jälkeen sweep-kandidaattien määrän (nyt **117**)
pitää laskea kuukausirytmissä ilman että kukaan koskee skriptiin.

Todennus:

```sql
SELECT s.scriptid, sd.scriptid AS depid, sd.status
FROM script s JOIN scriptdeployment sd ON sd.script = s.id
WHERE s.scriptid = 'customscript_gbb_bike_redemption_status'
-- pitää lukea SCHEDULED, ei TESTING
```

`schemas/script-inventory.md` väitti tätä Scheduled-tilaiseksi 21.09. asti; rivi on korjattu.

> [!NOTE]
> **CR-käsittelijän ajastusta ei voi todentaa SuiteQL:llä.** `customscript1199` /
> `customdeploy_gbb_change_request_hdl_2` näyttää statuksen `SCHEDULED`, mutta
> `scriptdeployment.recurrence` ei ole hakukanavan käytettävissä (`NOT_EXPOSED`). Se että 28 CR:ää
> on jonossa 17.09. asti viittaa siihen että **toistuvuus on nollattu statuksen sijaan** — eli
> deployment-status ei kerro onko ajastus päällä. Tämä on katsottava käyttöliittymästä.

### 3. ~~Palauta CR-ajastus ja todenna statusportti~~ — **tehty 22.09.2026**

Ajastus on päällä ja **portti on todennettu massana**, mikä oli tämän kohdan koko tarkoitus.
43 tyypin 2 CR:ää käsiteltiin, **0 virhettä**, 0 Needs Review.

| Pyörän status jälkeen | Päättymispäivä | kpl |
|---|---|---|
| 1 Active (lykätty) | tulevaisuudessa | **14** |
| 2 Redeemed | nyt tai menneessä | **28** |
| 3 Returned | nyt tai menneessä | **1** |
| **2 tai 3** | **tulevaisuudessa** | **0 — tämän solun on pysyttävä tyhjänä** |

> **Lue tulos neljännestaulukkona, älä kappalemääränä.** Ennuste oli "28 lykkäystä"; toteutuma oli
> 14. Sääntö piti täydellisesti — luku oli vanhentunut, koska uusia tyypin 2 CR:iä syntyi mittauksen
> jälkeen. Kappalemäärä ei kerro portista mitään, neljännestaulukko kertoo.

`liab_settled_at` on CR:n luontipäivä eikä ajopäivä, todennettuna sekä lokista
(`settled … (CR created date)`) että datasta: lykätyillä pyörillä päivät ovat 17.–21.09. vaikka ajo
oli myöhemmin. Jokaisella uudella lykkäysrivillä `gbb_lunastus_lib=1.1.0`.

**Jäljellä:** 33 CR:ää on yhä Pending. Aja neljännestaulukko uudelleen kun jono on tyhjä.

### 4. Vaihe 4 — `cf-gbb-tools`

TypeScript Cloudflare Workersilla, ei voi ladata kirjastoa. Toteuttaa samat säännöt erikseen.
**Tarvitsee myös arvon 8** `historical_unknown`, muuten sen käsitys päättyneestä pyörästä eroaa
kirjaston käsityksestä 1 211 pyörän osalta. Lisäksi `plan.ts:381-388`:n varoitus
`BIKE_ALREADY_REDEEMED` ei enää riitä: käyttöliittymän on erotettava *lunastus on sovittu* ja
*pyörä on lunastettu*.

## Avoimet päätökset

| Asia | kpl | Kysymys |
|---|---|---|
| ~~Selvitystapa puuttuu, ei todistetta~~ | ~~1 211~~ | **ratkaistu 21.09.** → `historical_unknown`, [ADR 0006](adr/0006-historical-unknown-selvitystapa.md) |
| Pyörät ilman statusta | **141** | eivät Active eivätkä päättyneitä, putoavat jokaisen skriptin suodattimesta |
| Selvitystapa 5 `bike_returned` | 178 | kirjasto pitää maksuttomana todisteena; vahvistettava tietoisesti |
| `docs/scripts/ue_...md` cr-scripts-repossa | — | huomautus "ADR should be updated" on vanhentunut, PR #6 korjaa testi 3:n |
