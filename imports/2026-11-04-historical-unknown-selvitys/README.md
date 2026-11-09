# `historical_unknown` (tapa 8) → oikea selvitystapa Hubspotin vuokrasopimustiketeistä

Korvaa selvitystavan 8 `historical_unknown` oikealla tavalla 778 pyörällä. Lähde on **Hubspot**,
joka oli ennen NetSuitea GoByBiken järjestelmä: pyörät olivat custom objekteja
(`p9053265_Bikes`, `2-5361578`) ja vuokrasopimukset tikettejä (`0-5`).

Purkaa sen mitä [`imports/2026-09-21-vaihe3-esiehto/`](../2026-09-21-vaihe3-esiehto/README.md)
osa **B** teki 21.09.2026: se merkitsi 1 211 päättynyttä pyörää arvolla 8, jotta vaiheen 3
esiehto "päättyneitä pyöriä ilman todistetta = 0" täyttyi. Arvo oli tarkoitettu väliaikaiseksi.

**Tietue:** `customrecord_sta_bike_register` · **Import type:** Custom Record ·
**Data Handling:** `UPDATE` · **Kirjoitettavat kentät:** `custrecord_gbb_liab_settle_method`,
`custrecord_gbb_liab_settled_at`, sekä tiedostossa `05-…` myös `custrecord_sta_bike_status`

> [!NOTE]
> **Kaikki 7 tiedostoa (01–07, yhteensä 778 pyörää) on ajettu 4.11.2026 ja tulos todennettu NetSuitesta.**
> Kaikkien 778 pyörän selvitystapa ja `custrecord_gbb_liab_settled_at` päivittyivät odotetusti,
> tiedoston 05 viisi pyörää saivat statuksen 3 (*Returned*), ja `custrecord_gbb_redemption_decided_at`
> pysyi tyhjänä (SuiteScriptit olivat pois päältä, joten ADR 0001:n kieltämää taannehtivaa leimausta ei tapahtunut).
> Tapa 8 jäi voimaan vain odotetuille 7 Hubspot-pyörälle (6 kpl `tarkistettavat.csv` + testipyörä B017530).

> [!WARNING]
> **Aja CSV-importtina, älä Mass Updatena.** `ue_gbb_redemption_decided_at` leimaa
> `custrecord_gbb_redemption_decided_at`-kentän aina kun selvitystapa **muuttuu** — sen ehto on
> `newMethod !== oldMethod`, joten myös 8 → 1 kelpaa ([`ue_gbb_redemption_decided_at.js:125-129`](
> ../../../netsuite-subscrption-cr-scripts/src/FileCabinet/SuiteScripts/cr-processor/ue_gbb_redemption_decided_at.js)).
> Mass Update ajaa XEDITinä ja laukaisisi UE:n, jolloin **tämän päivän päivämäärä leimautuisi 775
> vuosia sitten tehtyyn päätökseen** ja jäisi sinne write-oncen takia — juuri se backfill jonka
> ADR 0001 kieltää ja jota vastaan skripti on kirjoitettu. CSV-import ei laukaise UE:tä
> (CLAUDE.md, avoin kohta 3).

## Kohdejoukko

`custrecord_gbb_liab_settle_method = 8`, yhteensä **1 210 pyörää, kaikki statuksella 2**
(ADR 0006:n väärinkäyttömittari "tapa 8 Active-pyörällä" = 0).

| Osajoukko | kpl | Käsittely |
|---|---|---|
| ei-OOMI (`custrecord_sta_former_hubspot_bikeid` = `P<hubspot_object_id>`) | **785** | tässä importissa |
| OOMI (tunnus muotoa `MT2Y1GUV`) | **425** | **ei ratkea Hubspotista** — OOMI-pyörien tietoja ei ole koskaan ollut siellä |
| B017530 | 1 | testipyörä, jätetty pois |

Päättymisvuodet: 2024 → 4, 2025 → 632, 2026 → 574. Tapa 8 ei siis ole pelkkää vanhaa historiaa.

## Miten tapa päätellään

Avain on `custrecord_sta_former_hubspot_bikeid` ilman `P`-kirjainta = Hubspot-pyöräobjektin id.
Pyörään liittyvä tiketti löytyy tiketin kentästä `gobybike_pyoratunnus` (= sama `P…`-tunnus).
Päättyneen sopimuksen tiketti on vaiheessa **`7025289` = "8. LUNASTETTU / PALAUTETTU"** (putken
"Pyörän hankinta" ainoa CLOSED-vaihe).

Päätöstaulukko, **järjestyksessä** — ensimmäinen osuva ehto ratkaisee:

| # | Ehto | Tapa |
|---|---|---|
| 1 | `lunastus___lunastuslaskun_numero` sisältää "varastettu" tai "vakuutustapau" | **7** `bike_stolen_or_destroyed` |
| 2 | `vuokrasopimuksen_paattymistapa` = *Varkaus tai vahinko* | **7** |
| 3 | päättymistapa = *Loppupalautus* tai *Kesken kauden palautus* | **5** `bike_returned` |
| 4 | päättymistapa = *Siirto toiselle palveluntarjoajalle* | **6** `bike_sold_to_competitor` |
| 5a | päättymistapa = *GBB siirto* · *Siirto toiselle työntekijälle* · *Siirto/lunastus – uusi työnantaja*, **ja** lunastushinta > 0 ja status *Maksettu* | **1** |
| 5b | sama päättymistapa, ei maksettua lunastuslaskua | **ei päättyminen** → ei kirjata (0 osumaa) |
| 6 | `lunastus___lunastuslaskun_status` = *Luottotappio* | **jää 8** |
| 7 | lunastus/loppulunastus, lunastushinta > 0, laskunro sisältää "hyvitet" | **jää 8** |
| 8 | lunastus/loppulunastus, lunastushinta > 0, status *Maksettu* | **1** `redemption_paid` |
| 9 | lunastushinta 0, laskunro sisältää "vuokralaskutuksella" | **2** `redemption_extra_rent` |
| 10 | lunastushinta 0, laskunro sisältää "huoltobudjet" | **3** `redemption_maint_budget` |
| 11 | lunastushinta 0, laskunro "Lunastushinta 0 e" ja käsiraha > 0 | **4** `redemption_down_payment` |
| 12 | lunastushinta 0, laskunro tyhjä, `epatarkka_huoltobudjettia_jaljella` > 0 | **3** |
| 13 | lunastushinta 0, laskunro tyhjä, käsiraha > 0 | **4** |

`loppuvastuut_hoidettu` (`custrecord_gbb_liab_settled_at`) = **`hs_v2_date_entered_7025289`**, eli
hetki jona tiketti siirtyi vaiheeseen 8. Kaikilla 778:lla tämä aikaleima on olemassa.

> [!NOTE]
> **Rivi 5a: maksettu lunastuslasku voittaa päättymistavan.** `vuokrasopimuksen_paattymistapa`
> kertoo *tilanteen* jossa sopimus päättyi — esimerkiksi että työntekijä vaihtoi työnantajaa — ei
> sitä miten loppuvastuu hoidettiin. Kolmella pyörällä (B000925, B010447, B025882) päättymistapa on
> siirto, mutta tiketillä on maksettu lunastuslasku, `laskutettava_tuote` = *10 GBF Lunastukset* ja
> `gbf_status` = *Laskutettu*. Ne ovat lunastuksia. Käyttäjän päätös 4.11.2026.

> [!WARNING]
> **Kolmikko päättymistapa + lunastuslaskun status + käsiraha ei yksin riitä.** Testattiin 40
> pyörän otoksella: `kasiraha__sis__alv_` oli **tyhjä kaikilla 40:llä**, koska ne ovat vuoden 2021
> sopimuksia joissa käsirahaa ei vielä ollut. Ratkaiseva erotin on vapaateksti
> `lunastus___lunastuslaskun_numero`, joka kantaa vähintään kolmea eri NetSuite-tapaa. Koko kannassa
> suljettuja, lunastushinta-0 -tikettejä: "kuittaantunut vuokralaskutuksella" **207**, tyhjä **142**,
> "kuittaantunut huoltobudjetista" **140**, "lunastushinta 0 e" **1**. Jos tavasta 4 olisi
> yleistetty sääntö "hinta 0 + käsiraha > 0", satoja vuokralla ja huoltobudjetilla kuitattuja
> pyöriä olisi merkitty väärin.

## Tiedostot

| Tiedosto | Rivejä | Tapa |
|---|---|---|
| `01-tapa-1-lunastus-maksettu.csv` | **505** | 1 `redemption_paid` |
| `02-tapa-2-kuittaantunut-vuokralaskutuksella.csv` | **78** | 2 `redemption_extra_rent` |
| `03-tapa-3-kuittaantunut-huoltobudjetista.csv` | **60** | 3 `redemption_maint_budget` |
| `04-tapa-4-kasiraha-kattoi.csv` | **1** | 4 `redemption_down_payment` |
| `05-tapa-5-palautus.csv` | **5** | 5 `bike_returned` — **kirjoittaa myös `tila` = 3** |
| `06-tapa-6-toinen-palveluntarjoaja.csv` | **42** | 6 `bike_sold_to_competitor` |
| `07-tapa-7-varkaus-tai-vahinko.csv` | **87** | 7 `bike_stolen_or_destroyed` |
| `tarkistettavat.csv` | 6 | **ei importoida** — jäävät tavalle 8: 5 luottotappiota + B009020 |
| `ongelmat.csv` | 18 | 17 pyörää joilla kaksi suljettua tikettiä + testipyörä — **ei poissuljettujen lista**, ks. [`ongelmat-selitetty.md`](ongelmat-selitetty.md) |

Erotin `;`, päivämäärät `DD.MM.YYYY`. Kirjoitettavat sarakkeet ovat `selvitystapa_id`,
`loppuvastuut_hoidettu` ja — vain tiedostossa `05-…` — `tila`. Muissa tiedostoissa `tila` on tyhjä,
koska pyörät ovat jo statuksella 2; **älä mäppää sitä niissä**. Loput sarakkeet ovat perusteita ja
jäljitettävyyttä varten (`hubspot_ticket` avaa tiketin osoitteessa
`https://app.hubspot.com/contacts/9053265/record/0-5/<id>`).

**Tapa 5 vaihtaa myös statuksen.** Kenttäsääntö on *5 → status 3, kaikki muut → 2*, ja nämä viisi
ovat nyt statuksella 2. Status kirjoitetaan samassa importissa (käyttäjän päätös 4.11.2026), koska
vanha kalenterisweep (1440) on NOTSCHEDULED eikä mikään muu kirjoittaisi sitä.

## Validointi

- **Kattavuus 785/785.** Jokaiselle ei-OOMI-pyörälle löytyi tiketti `P`-tunnuksella.
- **Aikaleima 775/775.** Yhdelläkään korjattavalla ei puutu vaihe-8-aikaleima.
- **Tyhjän laskunumeron sääntö (rivi 12):** luettiin 30 tapausta, **30/30** oli
  `epatarkka_huoltobudjettia_jaljella` > 0 (37–200 €) ja **0/30** sisälsi käsirahaa. Varaus:
  jäljellä oleva budjetti ei *todista* että se kuittasi lunastuksen — osalla
  `kaytetty_huoltobudjetti` = 0 — mutta yhdistelmä hinta 0 + *Maksettu* + ei laskunroa + ei
  käsirahaa ei jätä muuta rahoituslähdettä.
- **Kaksoistiketit 17/17.** Jokaisella vanhempi tiketti on *GBB siirto* tai *Siirto toiselle
  työntekijälle* ja uusin on todellinen päättyminen. Sääntö "viimeisin vaiheeseen 8 siirtynyt" osui
  oikein kaikissa. Nämä on silti listattu `ongelmat.csv`:ssä tarkistettaviksi.
- **Tapa 1:n laskunumerot.** 505 rivistä vain yksi ei ollut laskunumero: B009020
  "Hyvitetty työntekijälle" — se jää tavalle 8.
- **Kohdekentät ovat tyhjiä.** Kaikilla 785:llä sekä `custrecord_gbb_liab_settled_at` että
  `custrecord_gbb_redemption_decided_at` ovat tyhjiä (todennettu NetSuitessa 4.11.2026). Import ei
  siis ylikirjoita mitään, eikä write-once-törmäystä tule. Samalla se korjaa nykyisen §5-rikkeen,
  jossa näillä on selvitystapa mutta ei päivää.
- **Ei tietuetason vahtia.** Pyörärekisterillä ei ole `beforeSubmit`-skriptiä joka estäisi
  selvitystavan muuttamisen; write-once elää vain automaation logiikassa.

## Ratkaistut luokittelukysymykset (käyttäjän päätökset 4.11.2026)

| Kysymys | Päätös |
|---|---|
| Onko *Siirto/lunastus – toinen palveluntarjoaja* päättyminen (42 pyörää)? | **Kyllä, tapa 6.** |
| Tapa 5:n viisi pyörää ovat statuksella 2, sääntö vaatii 3 | **Status 3 kirjataan samassa importissa.** |
| B009020, lunastuslasku "Hyvitetty työntekijälle" | **Asiakaspalvelu hyvitti loppulunastusmaksun kokonaisuudessaan reklamaation takia.** Rahaa ei tullut eikä listalla ole arvoa hyvitykselle → jää 8, kuten luottotappio. |
| Kolme siirto-päättymistapaa joilla maksettu lunastuslasku | **Tapa 1** — ks. rivi 5a. |
| Luottotappiot (5 pyörää) | **Jäävät tavalle 8** kunnes `customlist_gbb_liab_settle_method`iin lisätään oma arvo. |

## Ennen ajoa

1. **Ota "Run Server SuiteScript and Trigger Workflows" pois päältä.** Pyörärekisterillä on neljä
   RELEASED User Event -skriptiä, joista kolmeen ei ole lähdekoodia
   (`ue_gbb_redemption_decided_at.js:31`). Ks. yllä oleva varoitus päätöspäivän leimautumisesta.
2. ~~Varmista ettei status-sync 2.0 (1480) reagoi odottamattomasti.~~ **Tarkistettu 4.11.2026 —
   import on turvallinen, ks. alla.**

## Status-sync 2.0 (1480) — tarkistettu 4.11.2026

Luettu lähde: `/SuiteScripts/gbb-redemption-sync-2/gbb_mr_redemption_sync2.js` (file 499674) ja
`gbb_rss2_paatos.js` (499675). File Cabinetiin ei ole lukuoikeutta, mutta **tavukoot täsmäävät
paikalliseen `GitHub\SuiteScripts`-puuhun tarkalleen** (30 364 ja 24 828 tavua, CRLF säilynyt), ja
puun kopio `netsuite-bike-redemption-status-sync-rss2`:ssa on identtinen. Deployed-versiot ovat
12.10.2026 ja 8.10.2026.

**Sync 2.0 ei kumoa importtia eikä import riko sync 2.0:aa.** Neljä syytä:

| Vaihe | Kirjoittaa | Miksi ei koske meitä |
|---|---|---|
| 1 Maksu | `redemption_paid_at` | Ehto `paid_at === null && maksupäivä && tapa ≠ 5`. Ei lue selvitystapaa muuten. |
| 2 Vastuut | `liab_settle_method`, `liab_settled_at` | **Portti `s.status === STATUS_ACTIVE`** (`gbb_rss2_paatos.js:366`, tuoteomistajan päätös Q28). Kaikki kohdepyörät ovat statuksella 2 tai (tapa 5:n jälkeen) 3 → vaihe 2 ei kirjoita niille koskaan. Sync 2.0 **ei siis ylikirjoita** importin kirjaamia tapoja eikä päiviä. |
| 3 Status | `sta_bike_status` | Sama Active-portti → ei käännä tapa 5:n viittä pyörää takaisin statukseen 2. |
| 4 IC | `ic_redemption_dt`, `ic_redemption_pr` | **Ei lue `liab_settled_at`ia lainkaan.** Tavoite on `LAST_DAY(custrecord_sta_subsc_end_date)`, eikä import koske päättymispäivään. Ainoa ehto selvitystavalle on "ei tyhjä", ja arvo 8 on jo nyt ei-tyhjä → vaiheen 4 tulos on identtinen ennen ja jälkeen importin. |

**Valintajoukot.** Kuudesta joukosta V, O, J ja S vaativat `status = 1` (Active) — kohdepyörät eivät
ole. Joukko I vaatii `ic_redemption_done = 'F'`: **780/785 on jo `T`**, joten ne eivät edes valikoidu.
Viidestä `F`-pyörästä yksi on testipyörä B017530 (jonka sync 2.0 suodattaa itse pois nimellä) ja
neljällä muulla (B000104, B000123, B000129, B036927) `ic_redemption_dt` on jo tavoitteessa → nolla
kirjoitusta.

**Ainoa muutos** on joukko M, joka vaatii `tapa ≠ 5`. Tiedoston `05-…` viisi pyörää putoavat siitä
pois, eli sync 2.0 ei enää voisi kirjata niille lunastuksen `paid_at`-päivää. Tämä on sääntöjen
mukainen suunta — palautetulle pyörälle ei kuulu lunastusmaksua — eikä sillä ole käytännön
vaikutusta: kaikilla viidellä `paid_at` on tyhjä, ja sync 2.0 on ollut live 10.10.2026 alkaen, joten
maksutodistetta ei ole olemassa.

## Toisto

Luokittelu tehtiin kertakäyttöisellä skriptillä, joka lukee Hubspot-hakujen tallennetut
JSON-tulokset ja hakee pyörärekisterin `tools/netsuite-auth.mjs`:n kautta. Skripti ei ole osa repoa.
Hubspot-haku: `search_crm_objects` objektityypille `TICKET`, suodatin `gobybike_pyoratunnus IN (…)`,
**enintään 100 tunnusta per haku** — isompi erä palauttaa vaiti vain 100 ensimmäistä, mikä näkyy
pelkkänä puuttuvana rivinä eikä virheenä.
