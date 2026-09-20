# ADR 0001 — Uusi päätöspäiväkenttä pyörärekisteriin

- **Päivämäärä:** 2026-09-18 · **Tarkistettu ja korjattu:** 2026-09-19
- **Tila:** Hyväksytty
- **Koskee:** `customrecord_sta_bike_register`, [`lunastuksen-kenttasaannot.md`](../lunastuksen-kenttasaannot.md)

## Konteksti

Pyörän ennenaikaisessa lunastuksessa on kolme eri päivämäärää:

1. **päättymisajankohta** — milloin vuokrakausi päättyy
2. **päätöspäivä** — milloin ennenaikaisesta päättymisestä päätettiin
3. **velvoitteet hoidettu** — milloin loppuvastuut katettiin

Pyörärekisterissä on kenttä ensimmäiselle (`custrecord_sta_subsc_end_date`, override
`custrecord_gbb_exceptional_end_date`) ja kolmannelle (`custrecord_gbb_liab_settled_at`,
`custrecord_gbb_redemption_paid_at`). **Toiselle ei ole kenttää.**

Puuttuminen ei ole ollut näkyvä ongelma niin kauan kuin pyörä merkittiin lunastetuksi heti
päätöshetkellä — silloin päätöspäivä ja päättymispäivä olivat sama asia. Sääntödokumentti erottaa
ne: pyörä viettää päätöspäivän ja tunnistuspäivän välisen ajan tilassa **lunastus sovittu**, jossa
laskutus ja kuukausiraportointi jatkuvat normaalisti. Se tila voi kestää kuukausia.

Havaittu nykytilasta: `handler_lunastus.js:199` leimaa `custrecord_gbb_liab_settled_at`-kenttään
`new Date()`, eli **ajopäivän**. Se on tosiasiassa päätöspäivä kirjoitettuna kenttään joka kantaa
päivämäärää 3. Koska kenttä on write-once, virhe jää pysyvästi — 53 tietuetta kantaa jo arvoa joka
eroaa maksupäivästä. Päätöspäivä siis jo kirjoitetaan, vain väärään kenttään.

### Mitä kenttä *ei* ratkaise

Aiempi versio tästä ADR:stä perusteli kenttää sillä, ettei tilaa *lunastus sovittu* voi tunnistaa
pyörärekisteristä ilman sen alkamishetkeä. **Se ei pidä paikkaansa**, ja perustelu on poistettu.
Tila on tunnistettavissa ilman uutta kenttää (todennettu NetSuitesta 19.09.2026, 82 pyörää):

```sql
SELECT COUNT(*) FROM customrecord_sta_bike_register
WHERE custrecord_gbb_liab_settle_method IS NOT NULL
  AND custrecord_sta_bike_status = 1
```

Kenttä tarvitaan siihen mitä tuo kysely **ei** kerro: kuinka kauan pyörä on ollut siinä tilassa.

## Vaihtoehdot

**A. Päätöspäivä elää CR-tietueella** (`created` tai `custrecord_cr_due_date`), eikä sitä monisteta
pyörärekisteriin. Hylätty: maksuvetoisella polulla CR:ää ei ole olemassa lainkaan, joten puolet
populaatiosta jäisi ilman päätöspäivää. Lisäksi tila jouduttaisiin päättelemään toisesta tietueesta
joka kerta.

**B. `custrecord_gbb_date_to_non_active` riittää likiarvoksi.** Hylätty: se täyttyy vasta kun status
vaihtuu, eli vasta kun tila *päättyy*. Todennettu 19.09.2026: niillä 82 pyörällä jotka ovat nyt
tilassa 2, kenttä on tyhjä **82/82**.

**C. Olemassa oleva `custrecord_sta_redemption_date` otetaan käyttöön.** Hylätty: sen kirjoittaminen
laukaisee `customscript_sta_mr_mid_life_redemption`:n hyvityslaskun niin kauan kuin
`custrecord_sta_redemption_cm_processed` on false. Kenttä on ansa, ei vapaa paikka.

**D. Uusi kenttä.** Valittu.

## Päätös

Pyörärekisteriin lisätään päivämääräkenttä päätöspäivälle.

| | |
|---|---|
| **Field ID** | `custrecord_gbb_redemption_decided_at` |
| **Otsikko** | LUNASTUS SOVITTU |
| **Tyyppi** | Date (ei Date/Time — kaikki muut lunastuskentät ovat Date) |
| **Pakollisuus** | ei pakollinen NetSuite-tasolla |

Nimi noudattaa sisarkenttien konventiota (`custrecord_gbb_liab_settled_at`,
`custrecord_gbb_redemption_paid_at`): `gbb`-etuliite ja `_at`-pääte tapahtumapäivälle.

**Täyttö.** *Muutettu [ADR 0004](0004-paatospaivan-kirjoittaa-ue.md):lla 19.09.2026.* Kentän
kirjoittaa **User Event -skripti** pyörärekisterillä, ei yksittäinen handler: UE leimaa
`gbb_lunastus_lib.tanaanHelsinki()`:n silloin kun `custrecord_gbb_liab_settle_method` saa arvon ja
päätöspäivä on tyhjä. Näin kenttä täyttyy myös käsin tehdyissä muutoksissa, CSV-importeissa ja
cf-gbb-toolsin kirjoituksissa — poluilla joita yksikään handler ei kata.

> Tämän ADR:n alkuperäinen muotoilu oli *"automaatio täyttää sen aina kun se kirjaa
> selvitystapa-arvon — eli `handler_lunastus.js` ja `netsuite-bike-redemption-status-sync`"*.
> Se olisi jättänyt käsin ja CSV:llä tehdyt päätökset kentän ulkopuolelle.

Kenttä ei ole NetSuite-tasolla pakollinen: pakollisuus estäisi 12 339 olemassa olevan tietueen
muokkaamisen.

**Write-once, mutta tyhjennettävissä.** Automaatio ei koskaan ylikirjoita olemassa olevaa arvoa.
Siirtymässä 3 → 1 (käsin tehty peruutus, sääntödokumentti §4) kenttä tyhjennetään yhdessä
`custrecord_gbb_liab_settle_method`:n kanssa, jolloin seuraava päätös saa kirjata oman päivänsä.
Tyhjennys on käsin tehtävä operaatio; automaatio ei tee sitä.

**Tyhjän merkitys.** Tyhjä päätöspäivä tarkoittaa:

- jos `custrecord_gbb_date_to_non_active` on täytetty → **päätöspäivä = `date_to_non_active`**
  (historiatietue, jonka päätös on tehty ennen kentän olemassaoloa);
- jos sekin on tyhjä → **päätöspäivä ei ole tiedossa**. Se ei ole virhe eikä este: tila 2
  tunnistetaan selvitystavasta ja statuksesta, ei tästä kentästä. Vain tilan iän mittaus jää
  tekemättä.

Tämä tarkennus korvaa aiemman muotoilun *"tyhjä tarkoittaa päätöspäivä = `date_to_non_active`"*,
joka antoi tyhjän arvon juuri sille populaatiolle jota varten kenttä luodaan.

**Ei taannehtivaa täyttöä.** Olemassa olevia tietueita ei backfillata. Niiden päätöspäivä luetaan
yllä olevan säännön mukaan. Ne 82 pyörää jotka ovat nyt tilassa 2 jäävät siis pysyvästi ilman
päätöspäivää — se on hyväksytty hinta, koska niiden päätöspäivää ei ole missään tallessa.

## Seuraukset

**Hyvät.** `custrecord_gbb_liab_settled_at` vapautuu tarkoittamaan yksinomaan päivämäärää 3, jolloin
sen on oltava identtinen `custrecord_gbb_redemption_paid_at`:n kanssa selvitystavalla 1 — sääntö
jota ei voisi kirjoittaa niin kauan kuin kenttä kantaa kahta eri merkitystä. Tilan *lunastus
sovittu* ikä tulee mitattavaksi, jolloin jumiin jääneistä (päätös tehty, tunnistuspäivä ohitettu,
status ei vaihtunut) voi hälyttää.

**Huonot.** Yksi kenttä lisää käsin ylläpidettävää. Kenttä on tyhjä kaikilla vanhoilla tietueilla,
joten sitä lukevan koodin on aina käsiteltävä tyhjä tapaus. Uusi kenttä on peruuttamaton: sen
poistaminen myöhemmin on 46 736 tietueen operaatio.

**Riski.** Jos automaatio ei täytä kenttää luotettavasti, tilan ikää ei voi mitata eikä jumiin
jääneistä voi hälyttää. Tämän mittari on
[tarkistuskysely](../lunastuksen-kenttasaannot.md#8-tarkistuskyselyt) joka etsii pyöriä joilla on
selvitystapa mutta ei päätöspäivää.

## Todennettu vs. päätelty

**Todennettu NetSuitesta 19.09.2026:** 82 pyörää tilassa 2; niistä 82/82 ilman
`date_to_non_active`-arvoa ja 82/82 `liab_settled_at` täytettynä.
**Todennettu skeemasta:** `custrecord_sta_redemption_date`:n hyvityslaskukytkentä
(`schemas/records/customrecord_sta_bike_register.md`).
**Päätelty:** 53 poikkeavaa `liab_settled_at`-arvoa (mitattu 18.09.2026) ja rivinumero `:199`.
