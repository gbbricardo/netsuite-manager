# Keskenkauden lunastus — toteutusvaatimukset omistaville repoille

Lähde: [ADR 0010](adr/0010-keskenkauden-lunastus.md) (24.09.2026) ja [ADR 0008](adr/0008-keskenkauden-lunastuksessa-cr-voittaa-maksun.md).
Tämä repo ei muuta sisarrepojen koodia. Muutokset tehdään omistavassa repossa sen omilla
konventioilla, ja toteutustapa on sen repon päätös. Rivinumerot ovat koodiselvityksestä 24.09.2026.

## `netsuite-subscrption-cr-scripts` — `handler_lunastus.js`

| # | Vaatimus | Nykytila | ADR 0010 |
|---|---|---|---|
| H1 | **Needs Review ilman kirjoituksia**, jos `custrecord_cr_contract_official_end_date` on tyhjä | tyhjä arvo kirjoitetaan `subsc_end_date`:iin ilman vartijaa (`:147-149`, `:226-231`) | 7 |
| H2 | **Needs Review**, jos `custrecord_cr_created_date` on tyhjä. Ajopäivällä ei saa paikata | käyttää Helsingin tämän päivän päivää ja kirjaa virheen lokiin (`:339-346`) | 4, 7 |
| H3 | **Needs Review**, jos CR:n virallinen päättymispäivä on **myöhempi** kuin pyörän nykyinen päättymisajankohta. Sama päivä kelpaa | kirjoittaa ehdoitta | 7 |
| H4 | Kirjoittaa päättymisajankohdan **vain** `custrecord_sta_subsc_end_date`:iin. Ei `exceptional_end_date`:a eikä `oomi_exceptional_end_date`:a | sama, eli ei muutosta. Muutos tulee kirjastosta (K1) | 8 |
| H5 | Kirjoittaa `custrecord_gbb_redemption_decided_at` = `custrecord_cr_created_date` **samassa tallennuksessa** kuin selvitystavan | kenttää ei kirjoiteta; UE leimaa käsittelyhetken (`ue_gbb_redemption_decided_at.js:155-203`) | 4 |
| H6 | Tapa ja `liab_settled_at` kirjoitetaan aina CR:ltä. Ainoa poikkeus on arvo, joka on peräisin **aiemmasta tyypin 2 CR:stä**. Maksusta johdettu arvo ylikirjoitetaan | write-once ja vain tyhjään kenttään (`:312-367`) | ADR 0008 |
| H7 | Sopimusrivit katkaistaan `custrecord_cr_end_date_of_old_sub`:iin, kuten nyt. Ei muutosta | `:112-124` | 6 |
| H8 | Handler ei tee hyvityksiä. Hyvitys tehdään aina tyypin 11 CR:llä | ei tee (oikein) | 3 |

**H5 ja UE:** UE:n write-once-vartijan on nähtävä handlerin kirjoittama arvo eikä ylikirjoitettava
sitä. Tämä on todennettava NetSuite-ajossa, koska koodista päätelty ei riitä.

**H6 ja H5 yhdessä:** kun maksupolku on kirjoittanut tavan 1 ennen CR:ää, H6 ylikirjoittaa sen, ja
UE:n vartija (*"vain kun tapa muuttuu"*) voi laueta. H5:n arvon on silti oltava CR:n luontipäivä.

## `netsuite-subscrption-cr-scripts` — `gbb_lunastus_lib.js`

| # | Vaatimus | Milloin |
|---|---|---|
| K1 | `paattymisajankohta(bike)` = `custrecord_sta_subsc_end_date`. Kentät `exceptional_end_date` ja `oomi_exceptional_end_date` poistetaan `COALESCE`:sta (`:126-130`, `:267-275`) | lokakuu 2026. ~~Vasta kun poikkeuspäivien CSV on ajettu~~: **CSV peruttiin 21.10.2026** (ADR 0010 k. 8). B044906 korjattu käsin 21.10., ei muita edellytyksiä |
| K2 | Kirjaston versio nostetaan, ja kaikki lukijat (sweep 1440, RI-luonti ja -päivitys, statusportti, IC) ladataan uudelleen | K1:n yhteydessä |

Kaikki SQL-kyselyt ja cf-gbb-tools käyttävät samaa `COALESCE`-muotoa (kenttäsäännöt § 2 ja § 8,
tämän repon `queries/`). Ne päivitetään K1:n kanssa samaan aikaan.

## `netsuite-bike-redemption-status-sync` — status-sync 2.0

> [!NOTE]
> **7.10.2026 ([ADR 0015](adr/0015-status-sync-2-tarkennukset.md) k. 1):** status-sync 2.0 ei raportoi. S1–S3 on siirretty
> erillisen raportointiskriptin vaatimuksiksi ([`poikkeamaraportointi-vaatimukset.md`](poikkeamaraportointi-vaatimukset.md)).
> S4 pysyy 2.0:ssa.

| # | Vaatimus | ADR 0010 |
|---|---|---|
| S1 | Päivittäinen raportti listaa **tyypin 2 CR:t Needs Review -tilassa** luontipäivineen. Luontikuun loppu on määräaika | 7 |
| S2 | Raportti listaa **keskenkauden maksut ilman tyypin 2 CR:ää**, eli maksu on havaittu ja päättymiskuu ei ole alkanut. Tunniste on Paylinkin tuotenimi (`kesken kauden`), ei SO-tyyppi | 2 |
| S3 | Raportti listaa **tyypin 10 CR:t, jotka ovat olleet Pending-tilassa yli 30 päivää** | 9 |
| S4 | Keskenkauden lunastuksessa maksu kirjoittaa vain `paid_at`:n (ADR 0008, ADR 0009 kohta 4). Ennallaan | ADR 0008 |

## `cf-gbb-tools`

| # | Vaatimus | ADR 0010 |
|---|---|---|
| C1 | Tyypin 2 CR:n `contract_official_end_date` on aina kuunloppu. Nykyinen `plan.ts` tekee näin; säilytetään | 5 |
| C2 | Takautuvassa lunastuksessa tyypin 11 hyvitys-CR luodaan aina, kun `end_date_of_old_sub` > virallinen päättymispäivä | 3 |
| C3 | Päättymisajankohdan logiikka (TS-toteutus) seuraa K1:tä samaan aikaan | 8 |

## NetSuite-asetukset (ei repoa)

| # | Vaatimus | ADR 0010 |
|---|---|---|
| N1 | `customdeploy_sta_mr_mid_life_redemption` → **Not Scheduled** | 3 |
| N2 | Fleet-raportin CSV-viennit saavat päivittää `oomi_exceptional_end_date`:a. Muut CSV-importit eivät saa päivittää eivätkä täyttää `exceptional_end_date`:a | 8 |
