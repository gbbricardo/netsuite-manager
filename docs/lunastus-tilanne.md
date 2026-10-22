# Lunastusprojektin tilanne

**Päivitetty:** 2026-09-23 (**vaiheet 0–3 tuotannossa, molemmat ajastukset päällä**) · **Suunnitelma:** [`lunastus-toteutussuunnitelma.md`](lunastus-toteutussuunnitelma.md)
· **Säännöt:** [`lunastuksen-kenttasaannot.md`](lunastuksen-kenttasaannot.md)
· **Vaihe 3:** [`vaihe-3-muutosspeksi.md`](vaihe-3-muutosspeksi.md)

Tämä dokumentti kertoo **missä mennään**. Suunnitelma kertoo mitä tehdään ja säännöt miksi.

> [!IMPORTANT]
> **12.10.2026: status-sync 2.0 on tuotannossa** ([ADR 0015](adr/0015-status-sync-2-tarkennukset.md),
> [rakennusohje](status-sync-2-tasmaytysajo.md)). Script `customscript_gbb_mr_redemption_sync2` = **1480**. Ajo joka yö
> klo 00:30 Helsingin aikaa, ja se korvaa vanhan 1440:n (osa A ja kalenterisweep, *Not Scheduled* 6.10. alkaen).
> - **Ensimmäinen live-ajo 10.10.:** 1 944 kirjoitusta, 0 virhettä.
> - **Seuraavat yöt:** 18 ja 8 kirjoitusta.
> - **Todennuskyselyt:** 0 (T55).
> - **IC-päivät:** 2.0 kirjoittaa ne nyt ADR 0011:n mukaan, ja IC-laskuri käynnistyy ajon lopussa. CSV-täytöt (S2/S3) ovat historiaa.
> - **12.10. lisätty:** K2-rajaus ja CR-tila 6 (PR #5).
>
> Alla olevat syyskuun luvut ja ajojärjestykset ovat historiaa.

> [!IMPORTANT]
> **24.09.2026: keskenkauden lunastuksen säännöt vahvistettu** ([ADR 0010](adr/0010-keskenkauden-lunastus.md),
> kenttäsäännöt § 10). Kaksi syyskuun CSV:tä: T7 `decided_at`-historia (*ajettu 22.10.2026, 1 749 pyörää, jälkitarkistus 1 = B023943, peruttu lunastus*) ja
> T8 poikkeuspäivät (33 pyörää, **ennen kirjastomuutosta**; *peruttu 21.10.2026, `subsc_end_date` on oikein, ADR 0010 k. 8*). Lokakuun tehtävät T9–T13 ovat
> [`../TASKS.md`](../TASKS.md):ssä. Mitattu 24.09.:
> - 19 Active-pyörää, joilla keskenkauden maksu ilman CR:ää
> - Staria-hyvitysskripti yhä ajastettuna, 1 käsittelemätön pyörä (B031217)
> - tyypin 2 CR:itä Needs Review -tilassa yli kuun: 0
> - tyypin 10 CR:itä Pending-tilassa yli 30 päivää: 1
> - `decided_at` ≠ CR:n luontipäivä: 1 735
>
> Avoin **D9**: 15 Fleet-päättynyttä Active-pyörää ilman selvitystapaa.

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
| §5-rikkomukset selvitystavalla 1 | 53 | 53 | **54** | **määriteltävä uudelleen** ([ADR 0008](adr/0008-keskenkauden-lunastuksessa-cr-voittaa-maksun.md)): pyörät, joilla on Done-tilainen tyypin 2 CR, eivät ole rikkomuksia |
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

> [!NOTE]
> **Kumottu 23.09. illalla ([ADR 0008](adr/0008-keskenkauden-lunastuksessa-cr-voittaa-maksun.md)):**
> keskenkauden lunastuksessa CR:n luontipäivä on oikea `liab_settled_at`, vaikka maksu olisi
> aiempi. B025325 ei ole rikkomus. Alla oleva teksti on säilytetty historiaksi.

> [!WARNING]
> **§5-rikkomukset kasvoivat 53 → 54, ja se on ainoa mittari joka liikkui väärään suuntaan.**
> Uusi on pyörä **25325**: maksu kirjattu 17.09., mutta `handler_lunastus` kirjoitti
> `liab_settled_at`-kenttään CR:n luontipäivän **22.09.** §5 vaatii aikaisimman todisteen. Kirjasto
> osaa tämän jo (`onkoVelvoitteetHoidettu().todistepaiva`), mutta handler ei käytä sitä tähän
> kenttään. **Jonossa on 1 CR joka tuottaa seuraavan rikkomuksen.** Korjaus ja ennakoiva kysely:
> [`../findings/2026-09-23-handler-lunastus-rikkoo-pykala-5-kun-maksu-on-aiempi.md`](../findings/2026-09-23-handler-lunastus-rikkoo-pykala-5-kun-maksu-on-aiempi.md).

> [!NOTE]
> **Seuraava iso pala: status-sync 2.0** ([`status-sync-2-tasmaytysajo.md`](status-sync-2-tasmaytysajo.md)).
> Tavoite on päivittäinen täsmäytys, joka pitää statuksen oikeana koko kannassa **ja** kirjoittaa
> `ic_redemption_dt`:n. Tätä ei tee yksikään koodi, ja **1 356 lunastettua IC-pyörää puuttuu
> taloustiimin listalta** (saved search 797), joista noin 350 kesä–elokuulta.
> **Rakenne hyväksytty 23.09.** ([ADR 0007](adr/0007-status-sync-2-tasmaytysajo.md)). **Syyskuu
> hoidetaan CSV:illä** (S1 maksut, S2 IC-päivät, S3 täydennys 30.09.). **Käyttöönotto 1.10.
> kerralla**, ja lokakuu on testikuukausi. Auki: D5 (raportin vastaanottaja).
> **6.10.2026: IC-lunastuksen tavoitetila määritelty ([ADR 0011](adr/0011-ic-paiva-velvoitteista.md)).**
> IC-päivä kirjoitetaan, kun velvoitteet on hoidettu, ei status 2/3:sta. Se kirjoitetaan myös IC-myymättömille (D1 ratkaistu)
> ja tavalle 8. Se seuraa lähtötietoja, kunnes taloustiimi merkitsee done:n. Tehtävät T39–T42.
>
> **S1 ajettu 23.09. klo 17:21: 27/27 oikein**, ja 2C-CR:t olivat yhä Pending. Paylink-jonon purku
> jatkui importin jälkeen, ja **5 uutta pyörää** putosi samaan aukkoon (S1b tarvitaan, kaksi niistä
> päättyy 30.09.). **CSV-import ei laukaise päätöspäivä-UE:ta:** päätöspäivä on tyhjä 25/27:llä, ja
> sama koskee 2 304 aiemmin importattua. ADR 0004:n oletus *"UE kattaa CSV-importit"* ei pidä
> nykyisillä import-asetuksilla.

> [!CAUTION]
> **Maksettuja lunastuksia jää kirjaamatta pysyvästi (23.09.).** Status-syncin osa A lukee maksut
> ±5 vrk ikkunasta maksu- tai laskupäivän mukaan. Maksu, joka näkyy NetSuitessa myöhemmin, ei osu
> yhteenkään ajoon. **24 maksettua Active-pyörää** on nyt ilman selvitystapaa, eikä sweep päätä
> niitä koskaan. Mittari *"Selvitystapa puuttuu, status 1, maksettu = 0"* ei näe niitä, koska se
> tunnistaa maksun `paid_at`-kentästä. Tämän vuoden käsin laskutetuista lunastuksista 54 %
> maksettiin yli 5 vrk laskupäivän jälkeen. Korjauslista (27 riviä, ajettava **ennen** 4 × 2C
> -CR:ää), muutosspeksi ja hyvitettyjen laskujen ansa:
> [`../findings/2026-09-23-status-sync-maksuikkuna-hukkaa-myohaiset-maksut.md`](../findings/2026-09-23-status-sync-maksuikkuna-hukkaa-myohaiset-maksut.md).

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

## Kauden lopun lunastus — säännöt vahvistettu 24.09.2026

Tuoteomistajan kanssa käyty läpi, miten kauden lopun lunastuksen pitää NetSuitessa toimia
([ADR 0009](adr/0009-kauden-lopun-lunastus.md), [kenttäsäännöt § 9](lunastuksen-kenttasaannot.md#9-kauden-lopun-lunastus)).
Tunnistus tehdään CR:n perusteella (ei tyypin 2/10 CR:ää Pending/Done). Määräaika on päättymiskuun
loppu. OOMI-pyörä merkitään lunastetuksi päättymiskuussa ilman maksua, ja jälkiveloitus päättyy
automaattisesti kattavuusehdolla. Ratkaisee ADR 0008:n D7:n ja D8:n.

| # | Tehtävä | Milloin | Tila |
|---|---|---|---|
| S4 | 34 jumissa olevaa OOMI-pyörää: tapa 1 + `liab_settled_at` CSV:llä ([import](../imports/2026-09-24-oomi-kauden-loppu/README.md)). Sweep kääntää, S3 antaa IC-päivän | ennen S3:a (30.09.) | ✔ **ajettu 24.09., 34/34 oikein** (tapa 1, `liab_settled_at` 24.09., `paid_at` tyhjä). Status kääntyy sweepin yöajossa, todennettava 25.09. aamulla |
| K1 | Status-sync 2.0, maksuvaihe: tapa 1 + `liab_settled_at` vasta päättymiskuussa ja vain ilman tyypin 2/10 CR:ää (ADR 0009 k. 4) | lokakuun käyttöönotto | speksi päivitetty, ei toteutettu |
| K2 | Status-sync 2.0: jälkiveloituksen kattavuustarkistus → tapa 2 (k. 5) | lokakuun käyttöönotto | uusi, ei toteutettu |
| K3 | Status-sync 2.0 / kirjasto: OOMI-haara → tapa 1, `liab_settled_at` = tunnistuspäivä ilman maksua (k. 6) | lokakuun käyttöönotto | uusi, ei toteutettu |
| K4 | S1:n 16 CR:töntä pyörää (kausi 10/2026–2029) saivat tavan 1 ennen päättymiskuuta → tapa ja `liab_settled_at` tyhjennetään CSV:llä ([import](../imports/2026-09-24-s1-ennenaikainen-tapa/README.md)). **B016666:n CR 6718 on Pending — aja ennen seuraavaa CR-ajoa.** Tarkista uudelleen 28.09. (B029495) | heti | ✔ **ajettu 24.09., 16/16 oikein** (tapa ja `liab_settled_at` tyhjiä, `paid_at` ennallaan, CR 6718 yhä Pending). Uusintatarkistus 28.09. |

### Maksulinkki tuotannossa 1.10.2026 (vaihe 1, `netstuite-send-end-redemption-payment-link`)

Kauden lopun lunastuksen ensimmäinen vaihe on nyt automaattinen: script 1479 lähettää 30 päivää ennen
`subsc_end_date`:a Paylink-linkin Brevolla ja kirjaa tavan 3/4, kun hinta on nolla.
Ensimmäinen ajo ([löydös](../findings/2026-10-02-maksulinkki-ensimmainen-ajo.md)) lähetti **748 linkkiä, 0 virhettä**.
**215 maksettiin 1.10.**, ja niillä on status 2, tapa 1 ja `paid_at` 1.10. (N). Niiltä puuttuu `liab_settled_at`, koska
vanha osa A ei kirjoita sitä (T26).

**Mittarivaikutus:** tapoja 3 ja 4 kirjoitetaan nyt automaattisesti, kun ennen 1.10. niitä oli 4 ja 0. Tavat 3/4 kääntyvät
statukseen 2 sweepissä päättymiskuun alussa.

**Virhe:** jälkiveloituskuukaudet lasketaan huoltopidennykseksi. Tämän takia 6 linkkiä on liian pieniä, ja 4 tapa 3 -kirjausta
on tehty pyörille, jotka eivät ole ilmaisia. Lisäksi 69 jälkiveloituspyörää on `NOT_PRICED`-tilassa. → TASKS T30–T38 (takaraja 31.10.).

## Avoimet päätökset

| Asia | kpl | Kysymys |
|---|---|---|
| ~~Selvitystapa puuttuu, ei todistetta~~ | ~~1 211~~ | **ratkaistu 21.09.** → `historical_unknown`, [ADR 0006](adr/0006-historical-unknown-selvitystapa.md) |
| Pyörät ilman statusta | **141** | eivät Active eivätkä päättyneitä, putoavat jokaisen skriptin suodattimesta |
| Selvitystapa 5 `bike_returned` | 178 | kirjasto pitää maksuttomana todisteena; vahvistettava tietoisesti |
| `docs/scripts/ue_...md` cr-scripts-repossa | — | huomautus "ADR should be updated" on vanhentunut, PR #6 korjaa testi 3:n |
