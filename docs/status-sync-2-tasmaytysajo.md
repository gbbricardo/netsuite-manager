# Status-sync 2.0 — lunastusten päivittäinen täsmäytysajo

**Päivitetty:** 2026-09-23 · **Kohde:** `netsuite-bike-redemption-status-sync` (korvaa
`gbb_ss_bike_redemption_status_sync.js`:n) · **Tila:** rakenne hyväksytty
([ADR 0007](adr/0007-status-sync-2-tasmaytysajo.md)), käyttöönotto lokakuussa 2026 yhdellä kertaa,
päätökset D1 ja D5 auki
**Sisältää:** [`status-sync-maksuhavainto-muutosspeksi.md`](status-sync-maksuhavainto-muutosspeksi.md)
(= vaihe *Maksu* alla) · **Säännöt:** [`lunastuksen-kenttasaannot.md`](lunastuksen-kenttasaannot.md)

## Tehtävä yhdellä lauseella

> **Joka yö koko pyörärekisteri on lunastusten osalta oikeassa tilassa, ja jokainen lunastettu
> pyörä on taloustiimin IC-listalla — ja se mikä ei korjaudu automaattisesti, on nimeltä
> jonkun listalla.**

Nykyinen skripti tekee tästä kolmanneksen: se kääntää statuksen 1 → 2/3 (osa B) ja havaitsee osan
maksuista (osa A, ±5 vrk ikkuna). IC-päivää se ei kirjoita lainkaan, eikä kukaan muukaan koodissa
([kenttäsäännöt](lunastuksen-kenttasaannot.md) § `ic_redemption_dt`: *"Omistaja: CSV-import (ei
yhtään kirjoittajaa koodissa)"*).

## Nykytila, mitattu 23.09.2026

### Status

| Poikkeama kirjaston sääntöihin nähden | kpl | Kuka korjaa nyt |
|---|---|---|
| Maksettu Active-pyörä, jolla ei ole selvitystapaa → ei pääty koskaan | **24** | ei kukaan ([löydös](../findings/2026-09-23-status-sync-maksuikkuna-hukkaa-myohaiset-maksut.md)) |
| Status 1, selvitystapa ja todiste kunnossa, tunnistuspäivä ohi | 5 | osa B tänä yönä |
| Status 3, mutta selvitystapa ei ole 5 | 3 | ei kukaan |
| Status 1, ei selvitystapaa, kausi päättyi yli 2 kk sitten | 6 | ei kukaan (jatkolaskutussilmukka tai unohtunut) |
| Status 1, mutta IC-lunastus on tehty | 1 | ei kukaan |
| Status tyhjä, sopimus alkanut | 6 | ei kukaan |
| Status tyhjä, tilaus kesken (*In Progress / Deliverable / Delivered*) | 131 | ei kuulu lunastuksille, status asetetaan aktivoinnissa |
| Status 2/3, mutta päättyminen vasta tulevassa kuussa (ennenaikainen) | **0** | — |
| Status 2/3 ilman selvitystapaa | **0** | — |

Status on siis **lähes oikein**. Vaiheiden 0–3 työ on tehnyt tehtävänsä. Jäljellä on pieniä
joukkoja, joista suurinta osaa ei korjaa kukaan eikä kukaan näe.

### IC-lista

Taloustiimin IC-prosessi ([`netsuite-ic-calculators/README.md`](../../netsuite-ic-calculators/README.md)):
*finance asettaa `custrecord_gbb_ic_redemption_dt` → `customscript_gbb_ic_redemption_pr`
laskee `custrecord_gbb_ic_redemption_pr`:n → finance vie CSV:nä IC-myyntitilauksiksi → merkitsee
`custrecord_gbb_ic_redemption_done`*. MR on **Not Scheduled**, eli se ajetaan käsin.

**Lista on saved search 797.** Siitä taloustiimi ottaa kuukausittain, **ennen kuun loppua**, tiedon
siitä, mitkä pyörät voidaan IC-lunastaa, millä hinnalla ja mille kirjanpitokaudelle
(`ic_redemption_dt`). Milloin lunastus teknisesti tehdään, ei kiinnosta. Historia on sallittu:
myöhässä tunnistettu lunastus saa oman, menneen kautensa (tuoteomistaja 23.09.,
[ADR 0007](adr/0007-status-sync-2-tasmaytysajo.md)). Haun ehtoja ei voi lukea SuiteQL:llä, joten ne
on todennettava UI:sta.

**IC-päivä on se kenttä, joka nostaa pyörän listalle.** Status 2/3 -pyörät:

| | IC-myyty¹ | ei IC-myyntiä |
|---|---|---|
| IC-päivä + done | 9 313 | 281 |
| IC-päivä, ei done (**listalla nyt**) | 1 095 | 43 |
| ei IC-päivää, done (vanha, käsin) | 1 000 | 0 |
| **ei IC-päivää, ei done → puuttuu listalta** | **1 356** | **175** |

¹ `custrecord_gbb_ic_sale_dt` tai `_price` asetettu.

Puuttuvista 1 346 on Redeemed-tilassa. Ne jakautuvat statuksen vaihtumiskuukauden
(`date_to_non_active`) mukaan näin: 9/2026 **990**, 8/2026 51, 7/2026 115, 6/2026 **189**,
2/2026 1. Syyskuun erä on normaali kuunvaihteen jono, **mutta kesä–elokuun noin
350 pyörää on jäänyt kokonaan listalta pois.**

Nykyiset IC-päivät (2026, 7 742 kpl) noudattavat sääntöä `LAST_DAY(päättymisajankohta)` 93 %:ssa
tapauksista. Muut: 350 = päättymisajankohta sellaisenaan, 42 = edellisen kuun viimeinen päivä,
173 muu. Ks. D2.

## Arkkitehtuuri

### Periaate: täsmäytys, ei tapahtumat

Jokainen vaihe on **joukkoerotus**: *mitkä pyörät eivät ole siinä tilassa, jossa kirjaston
mukaan pitäisi olla*. Kun kanta on kunnossa, joukot ovat tyhjiä ja ajo ei kirjoita mitään.
Väliin jäänyt ajo ei hukkaa mitään, koska seuraava näkee saman eron. Sama ominaisuus teki
kalenterisweepistä turvallisen (`:634`: *"the sweep has no window to fall out of"*), ja nyt se
laajennetaan koko skriptiin.

### Map/Reduce eikä Scheduled Script

| | Scheduled (nyt) | **Map/Reduce (ehdotus)** |
|---|---|---|
| Governance | 10 000 yksikköä koko ajolle, oma vahti | per map-kutsu, NetSuite jakaa itse |
| Kuunvaihde (noin 1 000 kääntöä + 1 000 IC-päivää) | reunoilla | ei ongelma |
| Virhe yhdessä pyörässä | try/catch per rivi | eristetty, `summarize` listaa |
| Rinnakkaisuus | ei | kyllä |

Script-tyyppiä ei voi vaihtaa, joten syntyy **uusi script-tietue ja uusi sisäinen id**.
`scriptnote.scripttype = 1440` ei enää näytä uusia ajoja. Päivitä `CLAUDE.md`, muisti
[[gbb-script-internal-ids]] ja `schemas/script-inventory.md`. Nimi voi pysyä samana.

### Vaiheet yhdessä map-kutsussa, yksi kirjoitus per pyörä

```
getInputData   SuiteQL: UNION kaikista poikkeamajoukoista → bikeId + syy
map(bike)      lue pyörän kentät (lookupFields) → aja vaiheet järjestyksessä muistissa
                 1 Maksu    → paid_at, selvitystapa 1, liab_settled_at
                 2 Status   → saakoMerkitaPaattyneeksi ? kohdestatus(tapa)
                 3 IC       → ic_redemption_dt = icLunastuspaiva(bike)
                 4 Poikkeamat, joita ei korjata → emit('poikkeama', …)
               → YKSI submitFields kaikille muuttuneille kentille
reduce         kokoa poikkeamat syittäin
summarize      yhteenvetoloki + raportti (D5) + valinnainen IC-MR:n käynnistys (D4)
```

Vaiheet ajetaan **muistissa peräkkäin samalle pyörälle**. Tänä yönä havaittu maksu voi siksi
kääntää statuksen ja nostaa pyörän IC-listalle samassa kirjoituksessa. Yksi `submitFields`
laukaisee UE:t kerran eikä kolmesti.

### Vaihe 1 — Maksu

> [!IMPORTANT]
> **Täydennetty 24.09.2026 ([ADR 0009](adr/0009-kauden-lopun-lunastus.md)).** Kolme lisäsääntöä:
>
> 1. **Kuukausiehto (ratkaisee ADR 0008 D7).** `paid_at` kirjoitetaan heti, mutta tapa 1 ja
>    `liab_settled_at` vasta kun päättymiskuu on alkanut **ja** pyörällä ei ole tyypin 2 tai 10 CR:ää
>    tilassa Pending/Done. Muuten vain `paid_at`.
> 2. **Jälkiveloituksen kattavuus.** Σ veroton (item 30 + 31) maksetuilla, hyvittämättömillä,
>    tämän pyörän tyypin 7 CR:istä syntyneillä laskuilla ≥ `custrecord_sta_end_redemption_price` →
>    tapa 2, `liab_settled_at` = rajan ylittävän laskun maksupäivä.
> 3. **OOMI-haara.** OOMI-pyörä (`order_type = 3`), kauden lopun lunastus, tunnistuspäivä koittanut,
>    ei tapaa → tapa 1, `liab_settled_at` = tunnistuspäivä, `paid_at` ei kosketa. Myöhässä saapuva
>    OOMI-maksu ei kirjoita mitään.
>
> Kaikki kolme ovat sääntöjä, joten ne kuuluvat kirjastoon (`gbb_lunastus_lib`), eivät skriptiin.

Kuten [muutosspeksi](status-sync-maksuhavainto-muutosspeksi.md) M1–M6: joukkoerotus ikkunan sijaan,
`closedate` `trandate`:n sijaan, hyvitetyt laskut pois, `liab_settled_at` = maksupäivä tyhjään
kenttään ja §5-ristiriita lokiin eikä kirjoitukseen.

### Vaihe 2 — Status

| Havainto | Toiminto |
|---|---|
| Status 1, `saakoMerkitaPaattyneeksi` = tosi | **kirjoita** `kohdestatus(tapa)` (nykyinen osa B) |
| Status 2/3, `saakoMerkitaPaattyneeksi` = epätosi | **raportoi**. Kenttäsäännöt: *"3 → 1 vain korjauksena, käsin"* |
| Status ≠ `kohdestatus(tapa)` (2 ↔ 3) | **raportoi** (D6: automaattinen korjaus mahdollinen) |
| Status tyhjä, sopimus alkanut | **raportoi**. Aktivointi ei kuulu tälle skriptille |
| Status tyhjä, tilaus kesken | ohita hiljaa, sillä tämä on normaali tila |
| Status 1, ei tapaa, kausi päättynyt yli 2 kk sitten | **raportoi** |

Automaatio kulkee **vain eteenpäin** (1 → 2/3). Taaksepäin menevä siirtymä on aina ihmisen päätös,
koska `gbb_webhook_ue_status_changed` ja kuukausiraportointi reagoivat jokaiseen muutokseen.

`handler_lunastus` saa kirjoittaa statuksen edelleen. Molemmat kysyvät kirjastolta, joten
kirjoittajia voi olla useita, mutta **tämä skripti on se, joka takaa lopputuloksen**.

### Vaihe 3 — IC-lista

Kirjoita `custrecord_gbb_ic_redemption_dt`, kun **kaikki** seuraavat ehdot täyttyvät:

- status (vaiheen 2 jälkeen) on 2 tai 3 — tila 3 *Lunastettu*
- `ic_redemption_dt` on tyhjä (write-once)
- `ic_redemption_done` ei ole `T` eikä `ic_redemption_pr` ole asetettu, koska finance on jo
  käsitellyt sen
- pyörä kuuluu IC-piiriin (D1)
- `paattymisajankohta(bike)` on olemassa. Jos ei ole, pyörä raportoidaan

Arvo tulee kirjastosta, ei skriptistä. **Kirjastoon lisätään uusi funktio** (omistaja
`netsuite-subscrption-cr-scripts`, `VERSION` → 1.2.0, yksikkötestit):

```js
/** IC-lunastuspäivä — sopimusankkuri (ADR 0002), ei tunnistuspäivä. Saa osoittaa menneeseen. */
function icLunastuspaiva(bike) {
    var loppu = paattymisajankohta(bike);
    return loppu ? kuunViimeinenPaiva(loppu) : null;
}
```

Kirjaston otsikko mainitsee jo `ic_redemption_dt`:n sopimusankkurin lukijana (`:19`). Tämä vain
toteuttaa sen, ja sääntö pysyy yhdessä paikassa.

IC-päivä kuuluu **sopimusankkuriin**, ei tunnistuspäivään: takautuvassa lunastuksessa se osoittaa
menneeseen kauteen, ja niin kuuluukin ([kenttäsäännöt §1](lunastuksen-kenttasaannot.md), esimerkki
30.04. vs. 18.09.).

**Valinnainen (D4):** jos yksikin IC-päivä kirjoitettiin, `summarize` käynnistää
`customdeploy_gbb_ic_redemption_pr`:n `N/task`-moduulilla. Silloin hinta on laskettu jo aamulla,
kun finance avaa listan. Laskuri suodattaa itse `ic_redemption_pr IS NULL`, joten käynnistäminen
on idempotenttia.

### Vaihe 4 — Poikkeamaraportti

`log.audit` ei riitä, koska [talon tyyli on hiljainen epäonnistuminen](../CLAUDE.md) eikä lokia
lue kukaan. `summarize` kokoaa poikkeamat syittäin ja lähettää ne (D5). Esimerkki:

```
Lunastusten täsmäytys 24.09.2026 — kirjoitettu: 27 maksua, 31 statusta, 1 012 IC-päivää.
Vaatii ihmisen (12):
  3  status 3 mutta selvitystapa ei ole 5 ............ B00xxxx, B00xxxx, B00xxxx
  6  Active, kausi päättynyt yli 2 kk, ei selvitystapaa  B00xxxx …
  2  §5-ristiriita: liab_settled_at ≠ maksupäivä ........ B018311, B031476
  1  status 1 mutta IC-lunastus tehty ................... B00xxxx
Ylävirran viive: 21 maksua näkyi yli 5 vrk myöhässä (vanhin 01.07.2026).
```

Jos kaikki on kunnossa, raportti on yksi rivi. Rivi lähtee silti, koska raportin puuttuminen on
ainoa merkki siitä, että ajo ei käynnistynyt.

### getInputData — kaikki poikkeamajoukot yhdellä kyselyllä

```sql
SELECT id, 'maksu'  AS syy FROM ( … muutosspeksin kandidaattikysely … )
UNION ALL
SELECT id, 'status' FROM customrecord_sta_bike_register
 WHERE custrecord_sta_bike_status = 1 AND custrecord_gbb_liab_settle_method IS NOT NULL
UNION ALL
SELECT id, 'ic'     FROM customrecord_sta_bike_register
 WHERE custrecord_sta_bike_status IN (2,3) AND custrecord_gbb_ic_redemption_dt IS NULL
   AND NVL(custrecord_gbb_ic_redemption_done,'F') = 'F' AND custrecord_gbb_ic_redemption_pr IS NULL
UNION ALL
SELECT id, 'tarkistus' FROM customrecord_sta_bike_register
 WHERE (custrecord_sta_bike_status = 3 AND NVL(custrecord_gbb_liab_settle_method,0) <> 5)
    OR (custrecord_sta_bike_status = 2 AND custrecord_gbb_liab_settle_method = 5)
    OR (custrecord_sta_bike_status IN (2,3) AND COALESCE(…päättymisajankohta…) >= ADD_MONTHS(TRUNC(CURRENT_DATE,'MM'),1))
    OR (custrecord_sta_bike_status = 1 AND (custrecord_gbb_ic_redemption_dt IS NOT NULL OR custrecord_gbb_ic_redemption_done = 'T'))
    OR (custrecord_sta_bike_status IS NULL AND custrecord_sta_subsc_start_date <= CURRENT_DATE)
    OR (custrecord_sta_bike_status = 1 AND custrecord_gbb_liab_settle_method IS NULL
        AND COALESCE(…) < ADD_MONTHS(TRUNC(CURRENT_DATE,'MM'),-2))
```

`status`-haara palauttaa noin 170 pyörää (tila 2 *lunastus sovittu*), joista suurin osa odottaa.
Se on oikein: SQL ei tiedä tunnistuspäivää, vaan kirjasto päättää sen mapissa. `CURRENT_DATE`
SQL:ssä on palvelimen päivä, joten `tarkistus`-haaran rajat voivat erota yhdellä päivällä. Ne vain
**valitsevat** tarkastettavat. Päätös tehdään mapissa `tanaanHelsinki()`:lla.

Kun kanta on kunnossa, kysely palauttaa noin 170 odottavaa + 0 muuta. Kuunvaihteessa se palauttaa
noin 1 000 × 2.

## Käyttöönotto

Päätetty 23.09. ([ADR 0007](adr/0007-status-sync-2-tasmaytysajo.md) kohta 4): **syyskuu hoidetaan
CSV-importeilla, ja uusi skripti otetaan lokakuussa käyttöön kokonaisena yhdellä kertaa. Lokakuu on
testikuukausi.**

### Syyskuu — CSV:t, vanha skripti ajaa

| # | Mitä | Milloin | Valmis kun |
|---|---|---|---|
| S1 | Maksujen korjauslista, 27 pyörää ([CSV](../findings/2026-09-23-status-sync-maksuikkuna-korjauslista.csv)) | **ennen** kuin 4 × 2C -CR:ää käsitellään | ✔ **ajettu 23.09. klo 17:21**, 27/27 oikein, ja 2C-CR:t olivat yhä Pending. [Tila](../findings/2026-09-23-status-sync-maksuikkuna-hukkaa-myohaiset-maksut.md#s1n-tila--tarkistettu-23092026-illalla) |
| S1b | Täydennys ADR 0008:n mukaan: B003280 ja B003403 (kauden loppu 30.09.) kuten S1. B006299, B042663 ja B044934 (keskenkauden) **vain `paid_at`**, ja B044934:n `liab_settled_at` 17.09. jätetään | ennen 30.09. Kaksi päättyy syyskuussa | poimintakysely → 0 |
| S1-korjaus | ADR 0008: **B018311 ja B031476 `liab_settled_at` takaisin 17.09.2026** (CR:n päivä, jonka S1 ylikirjoitti). B007933, B010316, B024003 ja B026700 → 23.09.2026, kun niiden 2C-CR:t on käsitelty | heti / CR:ien jälkeen | arvo = CR:n `custrecord_cr_created_date` |
| S1c | Poimintakysely uudelleen ja tarvittaessa uusi täydennys | 30.09., ennen S3:a | poimintakysely → 0 |
| S2 | IC-päivät CSV:llä: status 2/3, IC-piirissä, `ic_redemption_dt` tyhjä, ei done, ei hintaa → `LAST_DAY(päättymisajankohta)`. 23.09. noin 1 356 kpl, joista noin 350 kesä–elokuulta | niin aikaisin, että finance ehtii ajaa laskurin ja haun 797 ennen 30.09. | `Status 2/3, ei IC-päivää …` → 0; laskuri ajettu, `-1`-rivit käyty läpi |
| S4 | 34 jumissa olevaa OOMI-pyörää: tapa 1 + `liab_settled_at` ([import](../imports/2026-09-24-oomi-kauden-loppu/README.md), ADR 0009) | ennen S3:a | sweep kääntää, S3 antaa IC-päivän |
| S3 | Täydentävä IC-CSV samalla säännöllä niille, jotka ovat kääntyneet S2:n jälkeen (CR:t, maksut) | 30.09. | sama kysely → 0 ennen kuunvaihdetta |

S2:n ja S3:n rajaus riippuu päätöksestä D1. Jos siihen ei ole vastausta ennen S2:ta, ajetaan vain
IC-myydyt, koska niille laskurilla on kustannuslähde varmasti.

### Rakentaminen syyskuussa — ei tuotantokirjoituksia

| # | Mitä | Repo |
|---|---|---|
| R1 | `icLunastuspaiva` + yksikkötestit, kirjasto 1.2.0. Voidaan ladata File Cabinetiin jo syyskuussa: lisäys ei muuta olemassa olevia funktioita, ja nykyiset kutsujat lokittavat uuden `VERSION`in | `netsuite-subscrption-cr-scripts` |
| R2 | Uusi Map/Reduce-skripti ja deployment tilassa *Not Scheduled*. Parametrit `dry_run` ja `test_bike_id` säilyvät | `netsuite-bike-redemption-status-sync` |
| R3 | Raportin vastaanottaja (D5) ja IC-laskurin käynnistys (D4) konfiguroitu parametreina | sama |

Yksi `dry_run`-ajo tuotantodataa vasten ennen 1.10. on sallittu, koska se vain lukee, eikä se ole
käyttöönotto. Sen yhteenvedon pitää olla linjassa syyskuun CSV:iden jälkeisen tilan kanssa, eli
lähes tyhjä.

### Lokakuu — käyttöönotto kerralla

| Hetki | Mitä |
|---|---|
| 30.09. ilta | S3 ajettu. Vanha `customdeploy_gbb_redemption_sync` → *Not Scheduled* |
| 1.10. yö | uusi deployment → *Scheduled*, kaikki neljä vaihetta päällä. Ensimmäinen ajo on kuunvaihde: noin 1 000 statuskääntöä ja saman verran IC-päiviä lokakuun kaudelle |
| 1.10. aamu | ensimmäinen raportti. Päivitä `CLAUDE.md`:n ja muistin script-id, sillä `scriptnote.scripttype` ≠ 1440 |

**Paluu vanhaan:** uusi → *Not Scheduled*, vanha → *Scheduled*. Uuden kirjoittamat kentät jäävät
paikalleen. Ne ovat write-once-kenttiä ja sääntöjen mukaisia, joten niitä ei tarvitse perua.

### Lokakuu — testi

**Joka aamu** (kyselyt § *Todennus*):

- raportti saapui, ja sen luvut selittyvät edellisen päivän tapahtumilla
- statusporttikvadrantti *2/3 + tulevaisuudessa* = 0
- §5-rikkomukset eivät kasva
- maksettu Active ilman selvitystapaa = 0
- status 2/3 IC-piirissä ilman IC-päivää = 0
- uusista IC-päivistä 100 % = `LAST_DAY(päättymisajankohta)`
- IC-laskurin `-1`-rivit eivät kasva (jos D4 on päällä)
- `scriptnote`: ei `ERROR`-rivejä, `summarize` listaa 0 epäonnistunutta mapia

**Viikoittain:** otos 10 pyörästä, joille ajo kirjoitti jotain. Tarkista käsin, että kirjoitettu
arvo on sama kuin kenttäsääntö antaa.

**Kuun lopussa, ennen financen ajoa:** taloustiimi käy haun 797 lokakuun kauden läpi. Pyörien
määrän on vastattava lokakuussa päättyviä lunastuksia ja lisäksi myöhässä tunnistettuja
aiemmille kausille. Hintojen on oltava laskettuja.

**Hyväksytty kun** lokakuu on mennyt ilman yhtään selittämätöntä poikkeamaa ja haku 797 on
taloustiimin mielestä oikein. Vasta sitten vanha skripti poistetaan tililtä ja sen README
arkistoidaan.

## Todennus

| Kysely | Ennen | Jälkeen |
|---|---|---|
| Maksettu Active ilman selvitystapaa | 24 | 0 |
| Status 1, tunnistuspäivä ohi | 5 | 0 |
| Status 2/3, ei IC-päivää, ei done, IC-piirissä | 1 356 (+175) | 0 |
| CLAUDE.md:n statusporttikvadrantti *2/3 + tulevaisuudessa* | 0 | **0** |
| §5-rikkomukset | 54 | ei kasva |
| IC-päivä ≠ `LAST_DAY(päättymisajankohta)` uusissa kirjoituksissa | — | 0 |
| Raportti saapui | — | joka aamu |

## Päätökset

| # | Kysymys | Suositus | Peruste |
|---|---|---|---|
| **D1** | Kirjoitetaanko IC-päivä vain IC-myydyille pyörille vai kaikille lunastetuille? | **Kysy financelta.** Oletus: vain IC-myydyt | 281 ei-IC-myytyä on IC-päivällä ja done-merkinnällä, joten finance on käsitellyt niitäkin. Laskuri tarvitsee kustannuslähteen (FAM tai `ic_sale_price`) ja merkitsee muut `-1`:ksi |
| **D2** | `LAST_DAY(päättymisajankohta)` kaikille? | **Ratkaistu 23.09.:** kyllä | IC-päivä on kirjanpitokausi (ADR 0007). Nykyisiä 7 % poikkeamia ei muuteta (write-once) |
| **D3** | Kirjoitetaanko IC-päivä heti tilaan 3 tultaessa? | **Ratkaistu 23.09.:** kyllä | Taloustiimi tarvitsee tiedon ennen kuun loppua, ja tunnistuspäivä on kuun ensimmäinen. Historia on sallittu |
| **D4** | Käynnistetäänkö IC-laskuri automaattisesti? | kyllä, mukana lokakuun käyttöönotossa | idempotentti, ja hinta on valmiina aamulla. Muuten haussa 797 on rivejä ilman hintaa, kunnes joku ajaa laskurin käsin |
| **D5** | Kenelle raportti menee? | financen vastaava + lunastusten omistaja, sähköposti `N/email` | [Vastuurekisteri](../../Second%20brain/35-Systems/Vastuurekisteri.md) nimeää financen vastaavan. Automaatiolle ei ole omistajaa |
| **D6** | Korjataanko 2 ↔ 3 -ristiriita automaattisesti? | ei aluksi, vain raportti | 3 tapausta. Katso ne ensin käsin: onko vika statuksessa vai selvitystavassa |

## Mitä tämä ei tee

- **Ei aktivoi pyöriä.** Status tyhjä → 1 kuuluu tilausketjulle (131 keskeneräistä tilausta)
- **Ei kirjoita `custrecord_sta_redemption_date`:a** (`sta_mr_mid_life_redemption`:n hyvityslasku)
- **Ei kirjoita `custrecord_gbb_date_to_non_active`:a.** Sen täyttää `customscript1458` (*Bike status
  date backfill*, samassa repossa `gbb-bike-status-history/`) System Noteista noin vuorokauden
  viiveellä ([löydös](../findings/2026-09-23-b038677-redeemed-ja-ended-ilman-cr.md)). **Päätettävä
  ennen lokakuuta:** jätetäänkö 1458 erilleen vai kirjoittaako 2.0 kentän itse samassa
  `submitFields`-kutsussa kuin statuksen, koska kirjoittaja tietää päivän varmasti. 1458:n kysely
  on sivuttamaton, ja sen 5 000 rivin rajan riski on dokumentoitu mutta korjaamatta. Raportoi joka
  tapauksessa, jos kenttä on tyhjä yli vuorokauden statuksen vaihdon jälkeen
- **Ei kirjoita `custrecord_gbb_redemption_status`:ta** (`finalised`, `waiting_for_payment` …).
  Kentän kirjoittaja ja käyttäjä on selvitettävä erikseen. Jos se on financen oma tila, se voi
  myöhemmin kuulua tänne
- **Ei korjaa 134 `historical_unknown`-pyörää**, joilla on maksu. Se on dataratkaisu
