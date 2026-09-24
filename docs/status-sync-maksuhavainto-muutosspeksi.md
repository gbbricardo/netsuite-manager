# Muutosspeksi: status-syncin osa A tilasta, ei ikkunasta

**Päivitetty:** 2026-09-23 · **Kohde:** `netsuite-bike-redemption-status-sync`,
`gbb-bike-redemption/gbb_ss_bike_redemption_status_sync.js` (script 1440) · **Tila:** hyväksytty osaksi status-sync 2.0:aa
([ADR 0007](adr/0007-status-sync-2-tasmaytysajo.md)): toteutetaan uuden skriptin vaiheena 1
lokakuussa 2026, **ei** erillisenä muutoksena nykyiseen skriptiin
**Peruste:** [`../findings/2026-09-23-status-sync-maksuikkuna-hukkaa-myohaiset-maksut.md`](../findings/2026-09-23-status-sync-maksuikkuna-hukkaa-myohaiset-maksut.md)

> [!NOTE]
> Tämä repo ei muokkaa sisarrepoja. Muutos tehdään omassa sessiossaan
> `netsuite-bike-redemption-status-sync`-repossa. Repo on 23.09. haarassa `feat/kalenterisweep`,
> ja siinä on kaksi commitoimatonta poistoa (`Bike-Redemption-Paid-At-CSV-Backfill.md`,
> `Bike-Redemption-Status-Sync-Plan.md`). Selvitä ne ennen kuin aloitat uuden haaran.

## Tavoite

Skriptin alkuperäinen tarkoitus on olla **se yksi skripti, joka pitää lunastukset ajan tasalla**:
kun maksu on tullut, rekisterissä lukee se, ja kun päättymisen aika koittaa, status kääntyy.

Osa B (kalenterisweep) täyttää tämän jo, koska se lukee **tilaa**: *"the sweep has no window to fall
out of, which is the whole reason it is safe to stop here"* (`:634`). Osa A lukee yhä
**tapahtumia** ±5 vrk ikkunasta. Siksi myöhässä näkyvä maksu putoaa pysyvästi pois, eikä sitä
huomaa kukaan.

Muutos tekee osasta A samanlaisen kuin osasta B. Kysymys ei enää ole *"mitkä maksut osuivat tähän
ikkunaan"*, vaan *"millä pyörillä on maksutodiste, jota rekisteri ei vielä kerro"*. Vastaus on
joukkoerotus. Se tyhjenee itsestään, ja se myös toipuu itsestään: ajo, joka jää väliin tai
keskeytyy, ei hukkaa mitään.

## Kuusi muutosta

| # | Muutos | Korjaa | Rivit nyt |
|---|---|---|---|
| M1 | Ikkuna → joukkoerotus: `paid_at IS NULL` + todiste on olemassa | myöhään näkyvät maksut | `:263–269`, `execute` |
| M2 | Maksupäivä = aikaisin päivätty todiste: `pl_paid_at` tai laskun **`closedate`**, ei `trandate` | väärä maksupäivä | `:333` |
| M3 | Kokonaan hyvitetty lasku ei ole maksu | väärä lunastus ilman maksua | `fetchInvoiceRedemptions` |
| M4 | Kirjoita `liab_settled_at` = maksupäivä, jos kenttä on tyhjä ja tapa on 1 | ADR 0004 kohta 3: *"Tätä ei tee tänään kukaan"* | `:442`, otsikko `:46` |
| M5 | Ei statusrajausta Active-tilaan; rajaus on **selvitystapa**, ei status. Ristiriitaista `liab_settled_at`:ia ei jätetä hiljaa: se lokitetaan | Redeemed-pyörät ilman `paid_at`:ia (3 korjautuu, 142 lokitetaan) | `:290`, `:357` |
| M6 | `paid_at` on write-once, eikä toinen maksu ylikirjoita sitä | kenttäsäännön rikkominen | `:453` |

Osa B, sen ehdot ja kirjasto eivät muutu. Ajojärjestys (A ennen B:tä samassa suorituksessa) säilyy,
joten maksu, joka havaitaan tänä yönä, voi kääntää statuksen samassa ajossa.

### M1 — joukkoerotus

Kandidaatti on pyörä, jolla

- `custrecord_gbb_redemption_paid_at IS NULL`, ja
- `custrecord_gbb_liab_settle_method IS NULL OR = 1` (§ *`redemption_paid_at`*: *"Kenttä on
  olemassa **vain** selvitystavalla `redemption_paid`"*), ja
- on vähintään yksi todiste M2:n ja M3:n mukaan.

Kyselyssä ei ole päivämääräehtoa. Kun maksu on kirjattu, pyörä putoaa joukosta pois, joten
`updateBikeRegister`:in `skipped`-haaraa ja päivittäistä turhaa UE-laukaisua ei tarvita. Tämä on
sama ominaisuus, jota osan A nykyinen `alreadyStamped`-vertailu yrittää tavoitella.

Parametrit `custscript_gbb_bikeredemp_days_back` / `_days_fwd` jäävät käyttämättä. Poista ne
deploymentilta vasta, kun uusi versio on tuotannossa, ja kirjaa asia README:hen.

Valinnainen lattia `custscript_gbb_bikeredemp_paid_since` (päivämäärä) rajaa ensimmäisen ajon
historiaan, jos sitä halutaan. Ilman lattiaa ensimmäinen ajo kirjoittaa noin 170 riviä (ks.
*Odotetut luvut*). Governance kestää sen.

### M2 — maksupäivä

| Lähde | Päivä | Miksi |
|---|---|---|
| Paylink, `custrecord_pl_ns_status = 3` | `custrecord_pl_paid_at` | Paylinkin oma maksuhetki |
| Lasku *Paid In Full* | **`transaction.closedate`** | päivä, jona lasku kuittautui kokonaan. `trandate` on laatimispäivä, ja 54 % vuoden 2026 käsin laskutetuista lunastuksista maksettiin yli 5 vrk sen jälkeen |

Jos pyörällä on useita todisteita, arvoksi tulee aikaisin (§5, *"Velvoite hoitui silloin kun
ensimmäinen todiste syntyi"*). Sama sääntö on jo kirjastossa: `onkoVelvoitteetHoidettu(bike,
{lunastuslaskuMaksettu, paylinkValmis}).todistepaiva`. **Käytä kirjastoa**, älä laske minimiä
uudelleen skriptissä. Silloin sääntö pysyy yhdessä paikassa, ja samat todisteet voi myöhemmin
antaa myös handlerille.

> [!WARNING]
> **Aikavyöhyke tarkistettava.** `custrecord_pl_paid_at` on aikaleima (esim. `2026-09-17 14:25`).
> Kun `TO_CHAR(…, 'YYYY-MM-DD')` tehdään SuiteQL:ssä, se muotoilee arvon käyttäjän tai tilin
> aikavyöhykkeellä. Helsingin iltamaksu voi siis päätyä edelliselle päivälle. Todenna yhdellä
> tunnetulla pyynnöllä UI:ta vasten ennen tuotantoa. `closedate` on päivämäärä ilman kellonaikaa,
> joten siinä tätä ongelmaa ei ole.

### M3 — hyvitetty lasku ei ole maksu

Lasku saa tilan `B` myös silloin, kun se kuitataan hyvityslaskulla. Vuonna 2026 tällaisia
lunastuslaskuja on 22 kokonaan hyvitettyä ja 9 osittain hyvitettyä. Ikkunan poistaminen ilman tätä
ehtoa leimaisi viisi hyvitettyä Active-pyörää maksetuiksi, ja sweep lunastaisi ne.

```sql
AND NOT EXISTS (
    SELECT 1 FROM NextTransactionLineLink l
    JOIN transaction cm ON cm.id = l.nextdoc
    WHERE l.previousdoc = t.id
      AND l.linktype = 'Payment'
      AND cm.type = 'CustCred'
      AND -cm.foreigntotal >= t.foreigntotal
)
```

Osittain hyvitetty lasku, jonka loppuosa on maksettu, on maksu, ja sen maksupäivä on `closedate`.
Rajatapaus on hyvitys, joka on suurempi kuin laskun loppusumma, mutta joka on jaettu useammalle
laskulle. Se tulkitaan hyvitykseksi eli ei maksuksi, ja se lokitetaan (ks. M-loki).

### M4 — `liab_settled_at`

Tavalla 1 kenttäsääntö vaatii, että `liab_settled_at` on identtinen `paid_at`:in kanssa. Tämä
skripti on ainoa, joka näkee kummankin todisteen, joka ei asu pyörärekisterissä (ADR 0004 kohta 3).
Kirjoita siis:

```js
values.custrecord_gbb_liab_settled_at = paidAt;   // vain jos kenttä on tyhjä
```

Kirjoitusehto on, että selvitystapa on tai siitä tulee tässä kirjoituksessa 1. Otsikkokommentti
`:46` ja `:442` (*"never written by this script"*) sekä README `:78`, `:382` ja `:485` on
päivitettävä: kielto koski **ajopäivää**, ja se pysyy voimassa, mutta maksupäivä on eri asia.

**Sivuvaikutus, joka korjaa toisen löydöksen puoliksi:** kun maksu kirjataan ennen tyypin 2 CR:ää,
`handler_lunastus` näkee kentän täytettynä ja jättää sen rauhaan (write-once). Silloin B025325:n
tapausta ([löydös](../findings/2026-09-23-handler-lunastus-rikkoo-pykala-5-kun-maksu-on-aiempi.md))
ei synny. Handlerin oma korjaus tarvitaan silti niihin tapauksiin, joissa CR käsitellään ennen
tämän skriptin ajoa.

### M5 — rajaus selvitystavan mukaan, ei statuksen

| Status | Tapa | Mitä kirjoitetaan |
|---|---|---|
| 1 Active | tyhjä | `paid_at`, tapa 1, `liab_settled_at` (tyhjään) |
| 1 Active | 1 | `paid_at`, `liab_settled_at` (tyhjään) |
| 2 / 3 | 1 | `paid_at`, `liab_settled_at` (tyhjään). **Statusta ei kosketa** |
| mikä tahansa | 1, `liab_settled_at` ≠ maksupäivä | **ei mitään.** Lokitetaan nimeltä *§5-ristiriitana*, ks. alla |
| mikä tahansa | 2–8 | ei mitään (kysely suodattaa pois) |
| tyhjä | tyhjä | ei mitään. Lokitetaan nimeltä, koska pyörä ei ole kirjaston tilakoneessa |

> [!IMPORTANT]
> **Kun `liab_settled_at` on jo täytetty eri päivällä, `paid_at`:ia ei kirjoiteta.** Mitattu
> 23.09.: tapa 1 on 145 Redeemed-pyörällä ilman `paid_at`:ia. Kaikilla niillä on
> `liab_settled_at`, ja se on
>
> | Maksupäivä verrattuna `liab_settled_at`:iin | kpl |
> |---|---|
> | aiempi (`liab_settled_at` = CR:n luontipäivä, joka on maksun jälkeen) | **140** |
> | sama | 3 |
> | myöhempi | 2 |
>
> Jos `paid_at` kirjoitettaisiin ehdoitta, §5-mittari (`paid_at <> liab_settled_at` tavalla 1)
> nousisi 54:stä noin 196:een. Kyse ei olisi regressiosta vaan jo olemassa olevan virheen
> näkyviin tulosta. Skripti ei kuitenkaan saa korjata `liab_settled_at`:ia (write-once
> automaatiossa), joten se jättäisi tietueen ristiriitaiseen tilaan. Siksi näissä tapauksissa
> skripti **lokittaa ja ohittaa**. Korjaus on dataratkaisu: kertaluonteinen CSV, joka kirjoittaa
> molemmat kentät maksupäivään, samaan tapaan kuin 23.09. korjauslistan `TARKISTA`-rivit.
>
> Kaksi *myöhempi*-tapausta ovat ristiriidassa handlerin oletuksen kanssa (*"CR luodaan vasta kun
> maksu on tehty"*). Ne on katsottava erikseen.

Status 2/3 + tapa tyhjä: tällaisia pyöriä on 23.09. **0**. Jos niitä ilmestyy, ne käsitellään kuten
Active + tyhjä, mutta niille kirjoitetaan vain `paid_at` ja tapa. Status säilyy, ja sen päättää
osa B.

`custrecord_sta_redemption_date` jätetään edelleen kirjoittamatta (`sta_mr_mid_life_redemption`).

### M6 — write-once

M1 takaa write-onceisuuden, koska kandidaatilla `paid_at` on tyhjä. Poista `alreadyStamped`-vertailu
(`:453`). Sen nykyinen seuraus on, että toinen maksu tai toinen Paylink-pyyntö samalle pyörälle
**siirtää** `paid_at`:ia.

### Loki (M-loki)

Yhteenvetorivi korvaa nykyisen *"Part A complete"* -rivin:

```
Part A complete. 27 payment(s) recorded (24 with settle method written, 27 liab_settled_at),
144 skipped: liab_settled_at already differs from the payment date (§5, fix by hand),
5 credited invoice(s) ignored, 1 bike(s) without a status skipped, 0 error(s).
Oldest payment recorded: 2026-07-01. 21 recorded payment(s) were older than 5 days — upstream lag.
```

Viimeinen lause on se hälytys, jota nykyinen skripti ei pysty antamaan. Kun joukkoerotus löytää
vanhan maksun, se tarkoittaa, että jokin ylävirrassa (Paylink-jono, pankkitäsmäytys) oli myöhässä.
Rivi on `log.audit`. Jos osuus on yli puolet, se kirjoitetaan `log.error`-tasolla, jotta se
erottuu.

## Koodiluonnos

Kysely yhdistää todisteet `UNION ALL`:lla (toimii SuiteQL:ssä, todennettu 23.09.). Pyöräkohtainen
minimi lasketaan kirjastolla JS:ssä.

```js
function fetchUnrecordedPayments(testBikeId, paidSince) {
    let sql = `
        SELECT br.id AS bikeid,
               br.name AS name,
               br.custrecord_sta_bike_status AS bikestatus,
               br.custrecord_gbb_liab_settle_method AS settlemethod,
               TO_CHAR(br.custrecord_gbb_liab_settled_at, 'YYYY-MM-DD') AS settledat,
               e.lahde AS lahde,
               e.viite AS viite,
               TO_CHAR(e.paiva, 'YYYY-MM-DD') AS paiva
        FROM customrecord_sta_bike_register br
        JOIN (
            SELECT pr.custrecord_pl_ns_bike_id AS bikeid, 'paylink' AS lahde,
                   pr.custrecord_pl_display_id AS viite, pr.custrecord_pl_paid_at AS paiva
            FROM customrecord_payment_requests pr
            JOIN transaction so ON so.id = pr.custrecord_pl_ns_so_id
            WHERE pr.custrecord_pl_ns_status = ?
              AND so.custbody_sta_is_so_type IN (?, ?)
            UNION ALL
            SELECT t.custbody_sta_bike_id, 'invoice', t.tranid, t.closedate
            FROM transaction t
            WHERE t.type = 'CustInvc'
              AND t.status = ?
              AND EXISTS (SELECT 1 FROM transactionline tl WHERE tl.transaction = t.id AND tl.item = ?)
              AND ( t.custbody_sta_is_so_type IN (?, ?)
                 OR ( t.custbody_sta_is_so_type IS NULL
                      AND (SELECT COUNT(*) FROM transactionline c
                           WHERE c.transaction = t.id AND c.mainline = 'F' AND c.taxline = 'F') = 1 ) )
              AND NOT EXISTS (SELECT 1 FROM NextTransactionLineLink l
                              JOIN transaction cm ON cm.id = l.nextdoc
                              WHERE l.previousdoc = t.id AND l.linktype = 'Payment'
                                AND cm.type = 'CustCred' AND -cm.foreigntotal >= t.foreigntotal)
        ) e ON e.bikeid = br.id
        WHERE br.custrecord_gbb_redemption_paid_at IS NULL
          AND (br.custrecord_gbb_liab_settle_method IS NULL
               OR br.custrecord_gbb_liab_settle_method = ?)
          AND e.paiva IS NOT NULL
    `;
    const params = [
        PAYMENT_REQUEST_STATUS_COMPLETED, SO_TYPE_MID_CONTRACT_REDEMPTION, SO_TYPE_END_REDEMPTION,
        INVOICE_STATUS_PAID_IN_FULL, REDEMPTION_ITEM_ID,
        SO_TYPE_MID_CONTRACT_REDEMPTION, SO_TYPE_END_REDEMPTION,
        LIAB_SETTLE_REDEMPTION_PAID
    ];
    if (paidSince) { sql += ` AND e.paiva >= TO_DATE(?, 'YYYY-MM-DD')`; params.push(paidSince); }
    if (testBikeId) { sql += ' AND br.id = ?'; params.push(testBikeId); }
    sql += ' ORDER BY br.id';
    // runSuiteQLPaged kuten fetchSweepCandidates; ryhmittele bikeid:n mukaan ja anna
    // todisteet kirjastolle: lunastus.onkoVelvoitteetHoidettu(bike, {
    //     lunastuslaskuMaksettu: <aikaisin invoice-päivä>, paylinkValmis: <aikaisin paylink-päivä> })
    //     .todistepaiva  → paidAt
}
```

Kuitattujen hyvitysten määrä (M-lokin *"credited invoice(s) ignored"*) saadaan samasta kyselystä
ilman `NOT EXISTS`-ehtoa, kun siihen lisätään `EXISTS`-ehto. Jos lisäkysely ei ole governancen
arvoinen, jätä luku lokista pois.

`updateBikeRegister(row)`:

```js
if (row.bikeStatus == null) return 'no_status';                 // lokitetaan nimeltä
if (row.settledAt && row.settledAt !== row.paidAt) return 'p5_conflict';  // lokitetaan nimeltä, ei kirjoitusta
const values = { custrecord_gbb_redemption_paid_at: row.paidAt };
if (!row.settleMethod) values.custrecord_gbb_liab_settle_method = LIAB_SETTLE_REDEMPTION_PAID;
if (!row.settledAt)    values.custrecord_gbb_liab_settled_at    = row.paidAt;
// status: EI koskaan tässä. custrecord_sta_redemption_date: EI koskaan.
```

Lisää governance-vahti kuten sweepissä (`SWEEP_USAGE_RESERVE`). Kesken jäänyt joukko jatkuu
seuraavassa ajossa, koska ikkunaa, josta pudota, ei enää ole.

## Odotetut luvut

Mitattu 23.09.2026. Ensimmäisen dry runin pitäisi osua näihin:

| | Ilman 23.09. korjauslistaa | Korjauslistan jälkeen |
|---|---|---|
| Kandidaatteja, status 1 / tyhjä | 27 (24 + 2 + 1) | 0 |
| …kirjoitetaan | 24 | 0 |
| …§5-ristiriitana ohitetaan (B018311, B031476) | 2 | 0 |
| Kandidaatteja, status 2/3 + tapa 1 | 145 | 145 |
| …kirjoitetaan (`liab_settled_at` = maksupäivä) | 3 | 3 |
| …§5-ristiriitana ohitetaan | 142 | 142 |
| Hyvitettyjä laskuja ohitettu | ≥ 5 | ≥ 5 |
| Statuksettomia ohitettu | 1 (B036864) | 0 (import täytti `paid_at`:in) |

Kandidaattiluvut on todennettu ajamalla koodiluonnoksen kysely NetSuitessa 23.09.: 24 + 2 + 145 + 1.

Jos dry run antaa selvästi enemmän status 2 -kandidaatteja, tarkista ensin M3 ja `so_type`-ehto.
Älä aja tuotantoon ennen kuin ero on selitetty.

## Todennus tuotannossa

1. **Dry run** (`custscript_gbb_bikeredemp_dry_run`). Vertaa lukuja yllä olevaan taulukkoon ja
   löydöksen poimintakyselyyn.
2. **`test_bike_id`**, yksi Active-pyörä listalta. Tarkista, että `paid_at` = Paylinkin tai
   `closedate`:n päivä, tapa 1, `liab_settled_at` = sama päivä, päätöspäivä-UE laukesi ja status on
   ennallaan osan A jälkeen.
3. **`test_bike_id`**, B010316-tyyppinen pyörä (hyvitetty ja maksettu lasku): `paid_at` =
   maksetun laskun `closedate`, ei hyvitetyn.
4. **`test_bike_id`**, yksi hyvitetty Active-pyörä (5931, 10417, 17703 tai 22238): **ei kirjoitusta**.
5. Täysi ajo. Sen jälkeen:
   - löydöksen poimintakysely palauttaa 0
   - §5-rikkomusten määrä (`paid_at <> liab_settled_at` tavalla 1) **ei kasva**
   - CLAUDE.md:n statusporttikvadrantti on ennallaan: *2/3 + tulevaisuudessa* = 0.
6. Seuraavana päivänä: *"Part A complete"* -rivillä `recorded` on pieni, ja `older than 5 days`
   kertoo, onko ylävirta ajallaan.

## Vaikutukset muihin repoihin

| Repo | Vaikutus |
|---|---|
| `netsuite-subscrption-cr-scripts` · `handler_lunastus` | lukee `liab_settled_at`:n write-oncena. Aiemmin kirjattu maksupäivä voittaa CR:n luontipäivän, mikä on §5:n mukaista. Ei muutosta koodiin |
| `netsuite-monthly-reporting` | `onkoVelvoitteetHoidettu` saa todisteen useammalle pyörälle, ja Active-pyörät, joiden kausi on ohi, päättyvät oikein. Oikea lopputulos |
| `ue_gbb_redemption_decided_at` | laukeaa niille 24:lle, joille tapa kirjoitetaan. Päätöspäivä = ajopäivä, mikä on säännön mukaista (ADR 0004) |
| `gbb_webhook_ue_status_changed` | ei laukea osasta A. Osa B laukaisee sen kuten ennenkin |
| `sta_mr_mid_life_redemption` | ei vaikutusta, koska `custrecord_sta_redemption_date` jää kirjoittamatta |
