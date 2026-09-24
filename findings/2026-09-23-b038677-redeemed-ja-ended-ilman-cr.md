# B038677: Redeemed + Ended RI ilman muutospyyntöä — mistä kombinaatio tuli

**Havaittu:** 23.09.2026 · **Tila:** selvitetty, ei vikaa koodissa. Yksi päätös auki (Oomi,
ks. lopussa) · **Liittyy:** [ADR 0008](../docs/adr/0008-keskenkauden-lunastuksessa-cr-voittaa-maksun.md),
[vaihe 3 -speksi](../docs/vaihe-3-muutosspeksi.md) rivi 461

## Kysymys

Pyörä B038677 on Redeemed-tilassa, ja sillä on Ended-tilainen RI-rivi. Pyörällä ei ole yhtään
muutospyyntöä. Mikä skripti voisi tuottaa tämän kombinaation?

## Vastaus: viisi eri kirjoittajaa, joista kaksi olimme me

Kaikki alla on todennettu `scriptnote`-taulusta ja pyörärekisteristä 23.09.2026. Lokin kello on
noin 10 h Helsinkiä jäljessä.

| # | Aika (loki) | Kuka | Mitä |
|---|---|---|---|
| 1 | 26.08. 04:23 | Suitelet 678, `actionType=createSalesOrder` (käyttäjän painike) | keskenkauden lunastuksen SO; `custrecord_sta_mid_red_so_created` = T |
| 2 | 26.08. 04:25 | skripti 688, *"updatedownpaystatus"* | proforma lähetetty, **SO-tyyppi 3 → 4** (*Mid-contract* → *End redemption*) |
| 3 | ei lokissa | Oomi-integraatio | `custrecord_gbb_oomi_exceptional_end_date` = **30.09.2026**, `custrecord_gbb_oomi_bike_status` = `active_pending_redemption`. `subsc_end_date` pysyi 04.10.2026:ssa |
| 4 | 17.09. 14:31 | status-sync (vanha versio, 1440) | lasku INVGBB1014318 maksettu → `redemption_paid_at` = 16.09.2026, status pysyi Activena |
| 5 | 21.09. | **CSV-import** [`imports/2026-09-21-selvitystapa-active/`](../imports/2026-09-21-selvitystapa-active/) rivi `38677` | selvitystapa 1, `liab_settled_at` = 16.09.2026 |
| 6 | 21.09. 01:56 | status-sync, kalenterisweep (1440) | **status → 2**: `päättymisajankohta=2026-09-30, tunnistuspäivä=2026-09-21` |
| 7 | 21.09. 02:03 | **`customscript1458`** *Bike status date backfill* (sisäinen id 1458) | `custrecord_gbb_date_to_non_active` = 21.09.2026 |
| 8 | 21.09. 10:18 | `mr_monthly_reporting_ri_creation` (1452), **⚠ TEST SCOPE: 38677, 38943, 37874, 4234** | **Ended RI 116459**, `reportingDate=2026-10-01` |

**Ended-rivi on meidän vaiheen 3 todennuksemme tulos.** B038677 valittiin testitapaukseksi
*"kirjasto ratkaisee päättymisajankohdan"*. Kirjasto lukee päättymisajankohdaksi
`COALESCE(exceptional, oomi_exceptional, subsc_end)` = 30.09., joten RI on Ended 01.10. Pelkkä
`subsc_end` 04.10. olisi antanut Activen (`vaihe-3-muutosspeksi.md:461`,
`lunastus-tilanne.md:169`). Rivi on siis tahallinen ja sääntöjen mukainen.

**Redeemed-status on kalenterisweepin**, ja sweep sai kaikki ehtonsa täyttymään kolmesta eri
lähteestä: selvitystapa tuli meidän CSV:stä, todiste status-syncin maksuleimasta ja
päättymisajankohta Oomi-integraatiolta. Mikään yksittäinen skripti ei tehnyt koko päätöstä.
Juuri siksi kombinaatio näytti selittämättömältä.

## Miksi tämä ei ole ADR 0008:n rikkomus — mutta vaatii päätöksen

ADR 0008: *"pelkkä maksu ei saa olla riittävä todiste … ilman muutospyyntöä"*. Tässä ei päätetty
pelkällä maksulla. Päättymisajankohta 30.09. tuli **Oomi-integraatiolta**, ei maksusta.
OOMI-pyörillä keskenkauden lunastus kulkee Oomin kautta, ja `oomi_exceptional_end_date` on
käytännössä sama signaali, jonka tyypin 2 CR antaa muille pyörille: sopimus päättyy aiemmin.

**D8 (tuoteomistaja): kelpaako `custrecord_gbb_oomi_exceptional_end_date` OOMI-pyörillä
muutospyynnön veroiseksi vastuukirjaukseksi ADR 0008:n säännössä 3?** Jos kelpaa, B038677 on
oikein kaikilta osin. Jos ei kelpaa, OOMI-keskenkauden lunastukset tarvitsevat tyypin 2 CR:n, eikä
niitä ole nyt yhdelläkään. Tällöin kalenterisweepin on odotettava CR:ää, ja se on toteutettava
ADR 0007:ään.

## Sivulöydökset

**1. `date_to_non_active`-kentän "tunnistamaton prosessi" on `customscript1458`.** CLAUDE.md
sanoo, että kentän täyttää *"an unidentified process … still in no sibling repository"*. Todellisuudessa
kirjoittaja on `netsuite-bike-redemption-status-sync/gbb-bike-status-history/gbb_ss_bike_status_history_backfill.js`,
deployment `customdeploy_gbb_ss_bike_status_backfill` (*Scheduled*, `schemas/script-inventory.md:86`).
Se ajaa päivittäin noin klo 02:01 lokin kelloa (noin 12:01 Helsingin aikaa) ja lukee päivän
**System Noteista**, kun status on 2/3 ja kenttä tyhjä. Tämä selittää *"viiveellä, mutta oikein"*
-havainnon 21.09. Kenttään tulee statusmuutoksen oma päivä, joka oikein toimivassa järjestelmässä
on tunnistuspäivä. Sama repo, jonka ADR 0007 kirjoittaa uudelleen, joten status-sync 2.0:ssa on
päätettävä, jääkö skripti erilleen vai sulautetaanko se. Koodissa on lisäksi dokumentoitu,
korjaamaton riski, koska kysely on sivuttamaton ja 5 000 rivin raja on ylitetty.

**2. SO-tyyppi vaihtuu proformassa 3 → 4.** Skripti 688 (*updatedownpaystatus*) muutti
keskenkauden lunastuksen SO-tyypin *End redemption* -tyypiksi, kun proforma lähetettiin. Tämä
selittää, miksi syyskuun korjauslistan 2027–2029 päättyvät pyörät näkyvät Paylinkissä tyyppinä 4.
Samalla vahvistuu ADR 0008 D7:n johtopäätös: **SO-tyypillä ei voi erottaa keskenkauden
lunastusta kauden lopusta.** Skriptin 688 tunnistus (tiedosto ja repo) on vielä tekemättä.
Arvattavasti se on Staria-skriptejä.

## Todennettu vs. päätelty

**Todennettu 23.09.2026:** kaikki taulukon rivit 1, 2 ja 4–8 `scriptnote`sta. Pyörän kentät
`ns_getRecord`illa: `oomi_exceptional_end_date` 30.09., `subsc_end_date` = `org_end_date` 04.10.,
`order_type` 3 OOMI, `mid_red_so_created` T, ei yhtään CR:ää. CSV-rivi `38677` 21.09. importissa.
Skriptin 1458 lokirivit 01.–23.09. (1 118 kpl) ja sen koodi repossa.
**Päätelty:** rivi 3 (Oomi-integraatio kirjoitti poikkeuspäivän). Se ei näy lokissa, ja
`systemnote`n custom-record-suodatin on todettu epäluotettavaksi.
