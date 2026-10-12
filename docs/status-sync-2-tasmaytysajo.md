# Status-sync 2.0 — rakennusohje

**Päivitetty:** 2026-10-07 · **Kohde:** `netsuite-bike-redemption-status-sync` (korvaa script 1440:n,
`gbb_ss_bike_redemption_status_sync.js`) · **Tila:** määritelty (grilling 6.–7.10.2026), ei rakennettu
**Päätökset:** [ADR 0007](adr/0007-status-sync-2-tasmaytysajo.md) (rakenne) ·
[ADR 0015](adr/0015-status-sync-2-tarkennukset.md) (tämän ohjeen tarkennukset, ohittaa ADR 0007:n ristiriidoissa) ·
[ADR 0008](adr/0008-keskenkauden-lunastuksessa-cr-voittaa-maksun.md), [0009](adr/0009-kauden-lopun-lunastus.md),
[0010](adr/0010-keskenkauden-lunastus.md), [0011](adr/0011-ic-paiva-velvoitteista.md),
[0012](adr/0012-loppulunastushinta-ja-kattavuus.md), [0014](adr/0014-maksulinkin-korjaus-ja-yksinkertaistus.md)
**Säännöt:** [`lunastuksen-kenttasaannot.md`](lunastuksen-kenttasaannot.md) · **Sanasto:** [`../CONTEXT.md`](../CONTEXT.md)
**Raportointi:** ei tässä skriptissä → [`poikkeamaraportointi-vaatimukset.md`](poikkeamaraportointi-vaatimukset.md)

> [!NOTE]
> Tämä dokumentti korvaa 23.09. version. Vanha versio on gitin historiassa (`git log -- docs/status-sync-2-tasmaytysajo.md`).
> Poistuneet osat: vaihe 4 (poikkeamaraportti), sähköposti, IC-laskurin varmistusajastus, `date_to_non_active`,
> poikkeuskenttien luku ja syyskuun CSV-suunnitelma (S1–S4, toteutettu).

## Tehtävä yhdellä lauseella

> **Joka yö jokainen pyörä on lunastuskenttiensä osalta siinä tilassa, jonka säännöt määräävät:
> maksu kirjattu, vastuut kirjattu kun ne kuuluu kirjata, status käännetty kun tunnistuspäivä on koittanut,
> ja IC-päivä oikein kunnes taloustiimi on IC-käsitellyt pyörän.**

Skripti on puhtaasti toiminnallinen. Se ei raportoi, ei lähetä sähköpostia, ei koske CR:iin eikä Paylinkiin.

## Takarajat

1440:n ajastus poistettiin 6.10.2026. Siitä asti kukaan ei kirjaa maksuja, käännä statuksia eikä kirjoita
IC-päiviä.

| Päivä | Miksi |
|---|---|
| **to 29.10.2026** | Taloustiimi IC-lunastaa kuun toiseksi viimeisenä arkipäivänä. Lokakuussa hoidettujen IC-päivien ja hintojen on oltava valmiina |
| **su 1.11.2026 klo 03:00** | Extension ajaa. Jos ajoissa maksaneilla ei ole tapaa 1, ne saavat tyypin 7 CR:n |
| **varasuunnitelma 28.10.** | Jos 2.0 ei ole tuotannossa: T26:n CSV (maksut + tavat) ja IC-päivät CSV:llä ADR 0011:n ehdolla |

Käyttöönotto tehdään heti, kun skripti on valmis ja dry run on käyty läpi. Virheet korjataan erillisessä istunnossa.

## Arkkitehtuuri

| | |
|---|---|
| Tyyppi | Map/Reduce, SuiteScript 2.1. **Uusi script-tietue ja uusi sisäinen id** (1440 ei näytä uusia ajoja) |
| Ajastus | joka yö **00:30 Helsingin aikaa**. Riippuvuus: Paylink-synkka (noin 23:30) → **2.0** → extension (**siirretään 03:00:aan**, nyt 01:00) |
| Tilat | **dry run** ja **live**. Lisäksi `test_bike_id`. Ei muita tiloja (sama linja kuin ADR 0014 k. 7) |
| Periaate | joukkoerotus: valitaan pyörät, joiden kentät voivat poiketa säännöistä, ja päätetään mapissa. Kun kanta on kunnossa, ajo ei kirjoita mitään. Väliin jäänyt ajo ei hukkaa mitään |
| Kirjoitus | **yksi `record.submitFields` per pyörä**, kaikki muuttuneet kentät kerralla (UE:t laukeavat kerran) |
| Säännöt | `/SuiteScripts/gbb-lib/gbb_lunastus_lib.js` (tunnistuspäivä, statusportti, kohdestatus, Helsingin päivä) ja `/SuiteScripts/[GBB] Send end redemption payment link/lib_gbb_redemption_price.js` (maksettava netto, ADR 0012) |

### Kentät, joita skripti ei lue

`custrecord_gbb_exceptional_end_date` ja `custrecord_gbb_oomi_exceptional_end_date` eivät tarkoita tälle skriptille
mitään (ADR 0015 k. 3). **Päättymisajankohta = `custrecord_sta_subsc_end_date`.** Kirjastolle annettava pyöräolio
sisältää vain sen, jolloin kirjaston nykyinen `COALESCE` (versio 1.1.0) palauttaa aina `subsc_end_date`:n. Kun K1 (T11)
on tuotannossa, mitään ei tarvitse muuttaa.

### Kentät, joita skripti kirjoittaa

| Kenttä | Vaihe |
|---|---|
| `custrecord_gbb_redemption_paid_at` | 1 Maksu |
| `custrecord_gbb_liab_settle_method` | 2 Vastuut |
| `custrecord_gbb_liab_settled_at` | 2 Vastuut |
| `custrecord_sta_bike_status` | 3 Status |
| `custrecord_gbb_ic_redemption_dt` | 4 IC |
| `custrecord_gbb_ic_redemption_pr` (vain tyhjennys) | 4 IC |

**Ei koskaan:** `custrecord_sta_redemption_date` (Staria-hyvitys), `custrecord_gbb_date_to_non_active` (1458),
`custrecord_gbb_redemption_decided_at` (UE / handler), `custrecord_gbb_ic_redemption_done` (taloustiimi),
poikkeuskentät, CR-tietueet, Paylink-tietueet.

## getInputData

Yksi SuiteQL, `UNION` alla olevista joukoista. Palauttaa vain pyörä-id:t. Duplikaatit poistetaan JS:ssä ennen
emittointia. Sivutus `runSuiteQLPaged`, 1 000 riviä. Testipyörä B017530 ja inaktiiviset tietueet (`isinactive` = T)
rajataan pois (ADR 0015 k. 13). `test_bike_id` rajaa
kyselyn yhteen pyörään.

| Joukko | Ehto (SuiteQL) | Miksi |
|---|---|---|
| **M** maksu | `paid_at IS NULL` ∧ `NVL(method,0) <> 5` ∧ maksutodiste on olemassa (ks. *Maksutodiste*) | `paid_at` puuttuu |
| **V** vastuut, maksettu | `status = 1` ∧ `paid_at IS NOT NULL` ∧ (`method IS NULL` ∨ (`method = 1` ∧ `liab_settled_at IS NULL`)) | etukäteen maksettu: tapa odottaa päättymiskuuta |
| **O** OOMI | `order_type = 3` ∧ `status = 1` ∧ `method IS NULL` ∧ `subsc_end_date < ADD_MONTHS(TRUNC(CURRENT_DATE,'MM'),1)` | kauden lopun OOMI ilman tapaa |
| **J** jälkiveloitus | `status = 1` ∧ `method IS NULL` ∧ `NVL(order_type,0) <> 3` ∧ on Done-tilainen tyypin 7 CR, jonka `LOWER(altname)` sisältää `pidennys` eikä `2a` | tapa 2 voi täyttyä |
| **S** status | `status = 1` ∧ `method IS NOT NULL` | tila *lunastus sovittu*, odottaa tunnistuspäivää |
| **I** IC | `NVL(ic_redemption_done,'F') = 'F'` ∧ (`method IS NOT NULL` ∨ `ic_redemption_dt IS NOT NULL` ∨ `ic_redemption_pr IS NOT NULL`) | IC-päivä kirjoitetaan, korjataan tai tyhjennetään |

Kyselyn `CURRENT_DATE` on palvelimen päivä. Joukot vain **valitsevat**. Jokainen päätös tehdään mapissa
`tanaanHelsinki()`:lla, joten yhden päivän ero rajalla ei aiheuta väärää kirjoitusta.

Mittakaava: I on suurin joukko (kaikki tavalliset, IC-käsittelemättömät pyörät, joilla on tapa). Ensimmäinen ajo
käsittelee sen kokonaan (ADR 0011 k. 8). Sen jälkeen suurin osa I:n pyöristä ei tuota kirjoitusta.

### Maksutodiste

Sama kuin [maksuhavainnon speksin](status-sync-maksuhavainto-muutosspeksi.md) M1–M3, ilman ikkunaa:

| Lähde | Ehto | Päivä |
|---|---|---|
| Paylink | `customrecord_payment_requests`, `custrecord_pl_ns_status = 3`, `custrecord_pl_ns_bike_id` = pyörä, SO (`custrecord_pl_ns_so_id`) `custbody_sta_is_so_type IN (3, 4)` | `custrecord_pl_paid_at`, **muunnettuna Helsingin päiväksi** |
| Lasku | `CustInvc`, `status = 'B'`, `custbody_sta_bike_id` = pyörä, rivillä item 46, ja `custbody_sta_is_so_type IN (3, 4)` tai (tyhjä ja täsmälleen yksi rivi). **Ei** kokonaan hyvitetty (`NextTransactionLineLink`, `CustCred`, `-cm.foreigntotal >= t.foreigntotal`) | `closedate` |

Maksupäivä = aikaisin todiste (`onkoVelvoitteetHoidettu(bike, {lunastuslaskuMaksettu, paylinkValmis}).todistepaiva`
tai suora minimi, sama tulos).

> [!WARNING]
> **Aikaleimat.** `custrecord_pl_paid_at` ja `custrecord_cr_closed_date` ovat aikaleimoja, ja ajoympäristön kello on
> noin 10 h Helsingistä jäljessä. Muunna Helsingin päiväksi JS:ssä (`tanaanHelsinki(instant)`), älä `TO_CHAR`:lla.
> Todenna yhdellä tunnetulla Paylink-pyynnöllä ja yhdellä CR:llä UI:ta vasten dry runissa.

## map — päätös yhdelle pyörälle

Lue pyörän kentät (yksi SuiteQL tai `lookupFields`) ja pyöräkohtaiset faktat:

| Fakta | Lähde |
|---|---|
| `tanaan` | `lunastus.tanaanHelsinki()` |
| `loppu` | `custrecord_sta_subsc_end_date` |
| `paattymiskuuAlkanut` | `loppu` ≠ tyhjä ∧ `loppu`:n kuun 1. päivä ≤ `tanaan` |
| `ennenaikainen` | pyörällä on tyypin 2 tai 10 CR tilassa 1 Pending tai 2 Done |
| `kaudenLoppu` | `paattymiskuuAlkanut` ∧ ¬`ennenaikainen` |
| `oomi` | `custrecord_sta_bike_order_type = 3` |
| `maksupaiva` | aikaisin maksutodiste (yllä), tai tyhjä |
| `pidennykset` | Done-tilaiset tyypin 7 CR:t, `LOWER(altname)` sisältää `pidennys` eikä `2a`, `closed_date`n (Helsinki) mukaan nousevasti. Vain J-joukon pyörille |

Vaiheet ajetaan **muistissa peräkkäin**, ja jokainen vaihe näkee edellisten muutokset.

### Vaihe 1 — Maksu

| Ehto | Kirjoitus |
|---|---|
| `paid_at` tyhjä ∧ `maksupaiva` ∧ tapa ≠ 5 | `paid_at` = `maksupaiva` |
| muu | ei mitään |

`paid_at` on maksun fakta (ADR 0015 k. 4). Se kirjoitetaan selvitystavasta, statuksesta, OOMI:sta ja CR:istä
riippumatta, eikä sitä koskaan ylikirjoiteta. Tapa 5 jätetään pois, koska palautetun pyörän maksu voi olla
vahingonkorvaus.

### Vaihe 2 — Vastuut (tapa ja `liab_settled_at`)

Ajetaan vain, kun **status on 1** (ADR 0015 k. 12) ja `kaudenLoppu` on tosi. Status 2/3 tai tyhjä ilman tapaa on
poikkeama raportointiskriptille (R3, R4), ei automaation paikattava. Keskenkauden lunastuksessa (tyypin 2/10 CR) vastuut tulevat CR:ltä, eikä
tämä vaihe kirjoita mitään (ADR 0008).

| # | Tilanne | Kirjoitus |
|---|---|---|
| 2a | `oomi` ∧ tapa tyhjä | tapa 1, `liab_settled_at` = `tanaan` (= tunnistuspäivä, koska päättymiskuu on alkanut) |
| 2b | `oomi` ∧ tapa 1 ∧ `liab_settled_at` tyhjä | `liab_settled_at` = `tanaan` |
| 2c | ¬`oomi` ∧ tapa 1 ∧ `liab_settled_at` tyhjä ∧ `paid_at` | `liab_settled_at` = `paid_at` |
| 2d | ¬`oomi` ∧ tapa tyhjä | ehdokkaat alla, aikaisin päivä voittaa |
| — | tapa jo asetettu ja `liab_settled_at` asetettu | ei mitään. Tapaa ei koskaan vaihdeta |

**2d:n ehdokkaat:**

| Tapa | Täyttyy kun | Päivä |
|---|---|---|
| 1 | `paid_at` (vaiheen 1 jälkeen) on asetettu | `paid_at` |
| 2 | `netto` > 0 ∧ `pidennykset`-määrä × 63,75 ≥ `netto` | `pidennykset[N − 1].closed_date`, kun N = `ceil(netto / 63,75)` |

`netto` = `pricing.calculate({endRedemptionPriceNet, maintenanceSumNet, brackets, vatPct: 25.5}).finalPriceNet`.
Jos `calculate` palauttaa `error`in, hinta on tyhjä tai ≤ 0, tai `finalPriceNet` = 0, tapaa 2 ei kirjoiteta (tavat 3 ja
4 kuuluvat 1479:lle). Lokiriville `eheys`-kenttään syy.

Jos molemmat täyttyvät, **aikaisempi päivä voittaa, ja tasapelissä tapa 1**. Ei yhdistelyä (ADR 0012 k. 6). Hyvityksiä
ei huomioida (ADR 0015 k. 5). Skripti ei peru avoimia Paylink-tilauksia.

Huoltoportaat luetaan kerran `getInputData`ssa tai mapin moduulitasolla samalla kyselyllä kuin 1479
(`customrecord_sta_maint_extending_months`: `custrecord_sta_me_max_rate_excl_vat`, `_max_amt_incl_vat`, `_vat`,
`_prolong_months`) ja syötetään `pricing.prepareBrackets`:lle. `extensionMonths`-argumenttia ei anneta (vain eheys).

### Vaihe 3 — Status

| Ehto | Kirjoitus |
|---|---|
| status 1 ∧ `lunastus.saakoMerkitaPaattyneeksi(bike, tanaan)` | status = `lunastus.kohdestatus(tapa)` |
| muu | ei mitään |

Vain eteenpäin. 2/3 → 1 ja 2 ↔ 3 ovat ihmisen päätöksiä (ADR 0007 k. 5). Tyhjää statusta ei aseteta.

### Vaihe 4 — IC

**Velvoitteet hoidettu = selvitystapa on asetettu** (tavat 1–8, ADR 0015 k. 6). Pelkkä `paid_at` ei riitä, koska
keskenkauden maksu ilman CR:ää ei hoida mitään (ADR 0008 sääntö 3).

| Ehto | Kirjoitus |
|---|---|
| `ic_redemption_done` = T | **ei mitään koskaan** |
| tapa asetettu ∧ `loppu` tyhjä | ei mitään, `log.error` |
| tapa asetettu ∧ `ic_redemption_dt` ≠ `LAST_DAY(loppu)` | `ic_redemption_dt` = `LAST_DAY(loppu)`, `ic_redemption_pr` = tyhjä |
| tapa tyhjä ∧ (`ic_redemption_dt` ∨ `ic_redemption_pr` asetettu) | molemmat tyhjiksi |
| muu | ei mitään |

Jälkiveloituksessa `loppu` siirtyy kuukausittain, joten IC-päivä seuraa sitä. Ohimenevä väärä IC-päivä yhden yön ajan
(maksu ennen Pending tyypin 7 CR:n käsittelyä) on hyväksytty (ADR 0015 k. 8).

### Kirjoitus ja loki

Jos yksikin kenttä muuttui: `record.submitFields({type: 'customrecord_sta_bike_register', id, values,
options: {enableSourcing: false, ignoreMandatoryFields: true}})`. Dry runissa kutsu ohitetaan.

Jokaisesta pyörästä, jolle kirjoitettiin tai jossa tapahtui virhe, kirjoitetaan **yksi lokirivi** (ADR 0014 k. 11:n
malli):

- otsikko `<TULOS> <pyörän nimi>`, dry runissa etuliite `DRY RUN`. Tulokset: `KIRJOITETTU`, `VIRHE`
- detail on kiinteä `avain=arvo`-lista samassa järjestyksessä: `joukot`, `paid_at`, `tapa`, `liab_settled_at`,
  `status`, `ic_dt`, `ic_pr_tyhjennetty`, `maksupaiva`, `pidennykset`, `netto`, `eheys`. Muuttunut arvo muodossa
  `vanha→uusi`
- `log.error` tulokselle `VIRHE`, muuten `log.audit`

Pyöriä, joille ei kirjoiteta mitään, ei lokiteta yksitellen (I-joukossa niitä on joka yö tuhansia). Ne näkyvät
yhteenvedon luvuissa.

`context.write({key: <tulos>, value: 1})` ja IC-muutos omalla avaimellaan, jotta summarize voi laskea.

## reduce

Ei tarvita. Summarize lukee mapin tulosteen.

## summarize

1. Yhteenvetorivi `run complete`: `tila=live|dry_run`, `valittu=…` joukoittain, `kirjoitettu=…`, kirjoitukset
   kentittäin (`paid_at`, tapa 1 / 2 / OOMI, `liab_settled_at`, status 2 / 3, IC asetettu / korjattu / tyhjennetty),
   `virheet=…`, `tanaan=…`.
2. Jokainen epäonnistunut map (`mapSummary.errors`) omana `log.error`-rivinään pyörä-id:n kanssa.
3. **IC-laskurin käynnistys** live-ajossa, jos yksikin IC-päivä kirjoitettiin tai hinta tyhjennettiin:
   `task.create({taskType: task.TaskType.MAP_REDUCE, scriptId: 'customscript_gbb_ic_redemption_pr',
   deploymentId: 'customdeploy_gbb_ic_redemption_pr'}).submit()`. Epäonnistuminen (esim. laskuri jo käynnissä) →
   `log.error`. Varmistusajastusta ei ole. Taloustiimi ajaa laskurin käsin tarvittaessa (ADR 0015 k. 7).

## Parametrit ja vakiot

| Parametri | Tyyppi | Oletus |
|---|---|---|
| `custscript_gbb_rss2_dry_run` | checkbox | **T** (deployment luodaan dry runina) |
| `custscript_gbb_rss2_test_bike_id` | integer | tyhjä |

Kaikki muu on vakiota koodissa: CR-tyypit (2, 7, 10) ja -tilat (1, 2), SO-tyypit 3 ja 4, item 46, Paylink-tila 3,
OOMI 3, testipyörä B017530, ALV 25,5, jälkiveloituskuukauden kattavuus 63,75, kirjastojen polut ja IC-laskurin
script- ja deployment-id. Ei ikkunaparametreja, ei sähköpostiparametreja.

## Testattavuus

Vaiheiden 1–4 päätös kirjoitetaan **puhtaaksi funktioksi** omaan moduuliinsa (esim. `gbb_rss2_paatos.js`:
syöte = pyörä + faktat + `tanaan`, tulos = muutettavat kentät + lokin avaimet). Se testataan Nodella samaan tapaan kuin
1479:n `test/run_tests.js`. Vähimmäistapaukset:

| # | Tapaus | Odotus |
|---|---|---|
| T1 | kauden loppu, maksu 20.09., kausi päättyy 31.10., tänään 25.09. | vain `paid_at` |
| T2 | sama, tänään 1.10. | tapa 1, `liab_settled_at` 20.09., status 2, IC 31.10. |
| T3 | maksu, tyypin 2 CR Pending | vain `paid_at`, ei IC:tä |
| T4 | OOMI, kausi 15.10., ei maksua, tänään 1.10. | tapa 1, `liab_settled_at` 1.10., status 2, IC 31.10. |
| T5 | OOMI, tapa 1 jo, myöhäinen maksu | vain `paid_at` |
| T6 | jälkiveloitus, netto 120, 1 pidennys-CR | ei tapaa |
| T7 | sama, 2 pidennys-CR:ää | tapa 2, `liab_settled_at` = toisen CR:n `closed_date` |
| T8 | 2 pidennys-CR:ää (2. suljettu 2.11.) ja Paylink maksettu 1.11. | tapa 1, `liab_settled_at` 1.11. |
| T9 | tapa 5, maksu | ei `paid_at`:ia |
| T10 | done = T, `loppu` muuttunut | ei IC-muutosta |
| T11 | IC 30.09., `loppu` 31.10., hinta asetettu | IC 31.10., hinta tyhjä |
| T12 | tapa tyhjennetty käsin, IC asetettu | IC ja hinta tyhjiksi |
| T13 | status 2, tapa 1, ei `paid_at`:ia, maksu löytyy | vain `paid_at`, status ennallaan |
| T14 | tapa 1, `liab_settled_at` tyhjä, päättymiskuu ei alkanut | ei mitään |
| T15 | hinta 0 € | ei tapaa 2 (1479:n tapa 4) |

## Käyttöönotto

> [!NOTE]
> Repo `netsuite-bike-redemption-status-sync` on haarassa `feat/kalenterisweep`, jossa on commitoimattomia poistoja
> (agentin havainto 6.10.). Selvitä ne ennen kuin teet uuden haaran `master`ista.

1. **Rakennus** omistavassa repossa: puhdas päätösmoduuli + Node-testit (T1–T15), MR-skripti, README.
2. **Lataus** File Cabinetiin, script-tietue ja deployment tilassa *Not Scheduled*, `dry_run` = T.
3. **Dry run `test_bike_id`:llä** kolmelle tunnetulle pyörälle (yksi OOMI, yksi jälkiveloitus, yksi maksettu kauden
   loppu). Tarkista Helsingin päivämuunnokset (Paylink, CR `closed_date`) UI:ta vasten.
4. **Dry run koko kannalle.** Vertaa yhteenvedon lukuja *Todennus*-kyselyihin (*Ennen*-sarake). Lue `VIRHE`-rivit.
5. **Live:** `dry_run` = F, ajastus 00:30 joka päivä. Siirrä extensionin (`customdeploy_gbb_sub_extension`) ajo
   klo 03:00:aan samana päivänä.
6. **Ensimmäisen live-ajon jälkeen:** *Todennus*-kyselyt, `scriptnote` (ei `ERROR`-rivejä), IC-laskuri ajoi.
7. **Päivitä** `CLAUDE.md` (script-id, open item 3), muisti *GoByBike script internal ids*,
   `schemas/script-inventory.md` ja `docs/lunastus-tilanne.md`. 1440:n deployment poistetaan tililtä vasta, kun 2.0 on
   ajanut kuukauden vaihteen 1.11. ilman korjattavaa.

**Paluu vanhaan** ei ole tarpeen eikä suositeltava: 1440:n osa A rikkoo ADR 0008:aa ja 0009:ää. Jos 2.0 on
rikki, se pysäytetään ja korjataan, ja välipäivät hoidetaan CSV:llä.

## Todennus

| Kysely | Odotus live-ajon jälkeen |
|---|---|
| Lunastustodiste olemassa, `paid_at` tyhjä, tapa ≠ 5 | 0 |
| Kauden loppu, päättymiskuu alkanut, `paid_at` asetettu, tapa tyhjä tai `liab_settled_at` tyhjä (ei tyypin 2/10 CR:ää) | 0 |
| OOMI, status 1, tapa tyhjä, päättymiskuu alkanut, ei tyypin 2/10 CR:ää | 0 |
| Status 1, tapa asetettu, tunnistuspäivä koittanut | 0 |
| CLAUDE.md:n statusporttikvadrantti *2/3 + tulevaisuudessa* | **0** |
| Tapa asetettu, done ≠ T, `ic_redemption_dt` ≠ `LAST_DAY(subsc_end_date)` tai tyhjä | 0 |
| Tapa tyhjä, done ≠ T, IC-päivä tai hinta asetettu | 0 |
| IC-päivä asetettu, done ≠ T, hinta tyhjä | 0 IC-laskurin ajon jälkeen |
| Done-tilaisten pidennys-CR:ien × 63,75 ≥ netto, tapa tyhjä, ei-OOMI | 0 |

Kyselyt kirjoitetaan `queries/`-kirjastoon (`suiteql-rakentaja`), ja raportointiskripti käyttää samoja.
