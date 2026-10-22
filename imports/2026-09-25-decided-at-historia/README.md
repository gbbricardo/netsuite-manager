# Päätöspäivän historiakorjaus: `decided_at` = uusimman Done-tilaisen tyypin 2 CR:n luontipäivä (CSV-import)

> [!NOTE]
> **Sijainti.** Tämä on luonnos tiedostosta `imports/2026-09-25-decided-at-historia/README.md`, ja
> `2026-09-24-decided-at-historia.csv` on luonnos tiedostosta `01-decided-at.csv`. Auditoija saa
> kirjoittaa vain hakemistoon `findings/`, joten tiedostot pitää siirtää ja nimetä uudelleen käsin.
> Sisältöä ei tarvitse muuttaa.

Kirjoittaa kenttään `custrecord_gbb_redemption_decided_at` keskenkauden lunastuksen päätöspäivän
kaikille pyörille, joilla on Done-tilainen tyypin 2 CR (*Keskenkauden lunastus*).

Sääntö: [ADR 0010](../../docs/adr/0010-keskenkauden-lunastus.md) kohdat Q4, Q11 ja Q18
(tuoteomistajan päätös 24.09.2026). Keskenkauden lunastuksen päätöspäivä on tyypin 2 CR:n
`custrecord_cr_created_date`. Jos pyörällä on useita Done-tilaisia tyypin 2 CR:iä, käytetään
uusinta eli `MAX(custrecord_cr_created_date)`. Myös arvot, jotka `ue_gbb_redemption_decided_at` on
jo leimannut ja jotka poikkeavat tästä, ylikirjoitetaan.

> [!WARNING]
> **Ristiriita dokumentin kanssa.** `docs/lunastuksen-kenttasaannot.md` § `custrecord_gbb_redemption_decided_at`
> sanoo yhä *"Ei backfillata"* ja *"päivämäärä 2 on aina 'nyt'"*. ADR 0010 kumoaa nämä, mutta
> sääntödokumenttia ei ole vielä päivitetty (tarkistettu 24.09.2026). Dokumentti on päivitettävä
> ennen importtia tai samassa yhteydessä. Muuten seuraava auditointi tulkitsee importin rikkomukseksi.

**Tietue:** `customrecord_sta_bike_register` · **Import type:** Custom Record ·
**Data Handling:** `UPDATE`

## Tiedosto

| Tiedosto | Rivejä | Mitä kirjoitetaan |
|---|---|---|
| `01-decided-at.csv` | **1 735** | vain `custrecord_gbb_redemption_decided_at` |

Import ei kirjoita statusta, selvitystapaa, `liab_settled_at`:ia, IC-päivää eikä muita
päivämääräkenttiä. Koska status ei muutu, `gbb_webhook_ue_status_changed.js` ei laukea.

## Muoto

UTF-8 ilman BOM:ia, erotin `;`, päivämäärät `dd.mm.yyyy`. Rivinvaihto on LF. Jos aiemmat importit
on ajettu CRLF:llä ja halutaan pitää sama käytäntö, muunna rivinvaihdot ennen importtia.

| Sarake | Mappaus |
|---|---|
| `internal_id` | **Internal ID** |
| `pyora` | jätä mappaamatta |
| `decided_at_uusi` | `custrecord_gbb_redemption_decided_at`: **mappaa** |
| `decided_at_nyt` | jätä mappaamatta (nykyinen arvo, tyhjä 1 711 rivillä) |
| `cr_created_lahde_cr_id` | jätä mappaamatta (sen CR:n id, josta päivä on otettu) |

## Joukko

Poimittu NetSuitesta 24.09.2026 (todennettu):

| | Pyöriä |
|---|---|
| Pyöriä, joilla on Done-tilainen tyypin 2 CR | 1 769 (`SUM(id)` 37 490 518) |
| … `decided_at` tyhjä | 1 711 → CSV:hen |
| … `decided_at` eri kuin `MAX(cr_created)` | 24 → CSV:hen |
| … `decided_at` jo oikein | 34 → ei CSV:hen |
| **CSV** | **1 735** |

Status-jakauma CSV:n pyörillä (todennettu):

| Status | Rivejä | `SUM(id)` | MIN / MAX id |
|---|---|---|---|
| 1 Active (lykätty, päättymiskuu tulevaisuudessa) | 12 | 253 444 | 3 488 / 44 934 |
| 2 Redeemed | 1 638 | 34 905 233 | 114 / 46 560 |
| 3 Returned | 85 | 1 594 095 | 597 / 46 502 |
| **Yhteensä** | **1 735** | **36 752 772** | **114 / 46 560** |

## Tarkistussumma

| | CSV | NetSuite |
|---|---|---|
| Rivejä | 1 735 (laskettu grepillä, kaikki rivit ovat muotoa `id;B######;pvm;[pvm];crid`) | 1 735 |
| Rivejä, joilla `decided_at_nyt` on täytetty | 24 | 24 |
| `SUM(id)` | **ei laskettu paikallisesti**, katso alla | 36 752 772 |
| `MIN(id)` / `MAX(id)` | 114 / 46 560 (ensimmäinen ja viimeinen rivi) | 114 / 46 560 |

> [!IMPORTANT]
> **CSV:n `SUM(id)`:tä ei ole laskettu.** Auditoijalla ei ollut komentoriviä. CSV on kirjoitettu
> suoraan samasta kyselystä, jonka NetSuite-summa on 36 752 772 (sivutus 4 × 500, `ORDER BY id`),
> mutta summaa ei ole laskettu tiedostosta. Laske se ennen importtia, esimerkiksi näin:
> `Import-Csv 01-decided-at.csv -Delimiter ';' | Measure-Object internal_id -Sum`.
> Tuloksen pitää olla **36 752 772**.

Kysely, jolla NetSuite-puoli tarkistetaan uudelleen juuri ennen importtia:

```sql
SELECT COUNT(*) AS rivit, SUM(x.id) AS id_summa, MIN(x.id) AS min_id, MAX(x.id) AS max_id
FROM (SELECT br.id, br.custrecord_gbb_redemption_decided_at AS decided,
             MAX(cr.custrecord_cr_created_date) AS cr_created
      FROM customrecord_sta_bike_register br
      JOIN customrecord_subscrption_change_request cr ON cr.custrecord_cr_bike_registry = br.id
      WHERE cr.custrecord_cr_type = 2 AND cr.custrecord_cr_status = 2
      GROUP BY br.id, br.custrecord_gbb_redemption_decided_at) x
WHERE x.decided IS NULL OR x.decided <> x.cr_created
```

Odotus: 1 735 / 36 752 772 / 114 / 46 560. Jos luvut eroavat, CR-käsittely on ajanut uusia tyypin 2
CR:iä tai joku on muuttanut `decided_at`:ia. Älä silloin importoi. Tee poiminta uudelleen.
Päivittäinen CR-ajo lisää joukkoon uusia pyöriä: ne jäävät tämän CSV:n ulkopuolelle, ja UE leimaa
niille ajopäivän. Jos päätös koskee myös niitä, poiminta tehdään uudelleen importtipäivänä.

## Kilpailu UE:n kanssa

CSV-import ei laukaise skriptiä `ue_gbb_redemption_decided_at` (todettu S1-importissa 23.09.2026,
ks. CLAUDE.md, avoin kohta 3). UE ei siis ylikirjoita importin arvoa eikä leimaa sen päälle
importtipäivää, joten kilpailua ei ole. Tämän takia `decided_at` jäi aikanaan tyhjäksi
CSV:llä importoiduille riveille.

## Poikkeamat, jotka ajaja tarvitsee tietää

1. **Usean Done-CR:n pyörät (6 kpl, todennettu).** Pyörille otetaan uusin päivä:
   B008391 (CR:t 2627 29.04. ja 2673 30.04. → 30.04.2026), B012538 (2156, 2289 → 09.04.2026),
   B012635 (4462, 4470 → 13.07.2026), B017206 (5028, 5131, 5138 → 14.08.2026), B021702 (4631,
   4645 → 24.07.2026) ja B042228 (5314, 6034 → 31.08.2026).
   Pyörällä **B017206** on kaksi CR:ää samalla uusimmalla päivällä (5131 ja 5138). Sarakkeeseen
   `cr_created_lahde_cr_id` on valittu isompi id (5138). Päivämäärä on kummassakin sama.
   B012538 ja B021702 ovat 2D-palautuksia (status 3). Muut ovat 2C-lunastuksia.
2. **`cr_created` tulevaisuudessa: 0 pyörää (todennettu).**
3. **`cr_created_date` ei vastaa CR:n luontihetkeä 5 CR:llä (todennettu), 4 niistä CSV:ssä:**

   | Pyörä | CR | `cr_created_date` | `created` (järjestelmä) |
   |---|---|---|---|
   | B040467 | 4637 *Lunastus - Poikkeus* | 25.02.2026 | 24.07.2026 |
   | B040468 | 4634 *Lunastus - Poikkkeus* | 25.02.2026 | 24.07.2026 |
   | B040469 | 4542 `EWQUSV8Q - 2C` | 25.02.2026 | 20.07.2026 |
   | B012845 | 4545 `M56690950044 - 2C` | 15.06.2026 | 20.07.2026 |
   | B007353 | 3016 | 18.05.2026 | 19.05.2026 (1 päivä, merkityksetön) |

   CSV noudattaa ADR 0010:n sääntöä (`custrecord_cr_created_date`), joten neljälle ensimmäiselle
   kirjoitetaan taannehtiva päivä. Päätelty: kenttä on asetettu CR:ää luotaessa käsin
   poikkeuskäsittelyssä. Jos päätöspäiväksi halutaan järjestelmän luontipäivä, rivit
   40467–40469 ja 12845 pitää **poistaa CSV:stä** ja päättää erikseen. Tämä **vaatii ihmisen
   päätöksen**.
4. **UE:n leimaamat eri arvot (24 kpl, todennettu).** Kaikissa nykyinen arvo on 21.09.2026, eli
   UE:n ensimmäinen ajopäivä. CR:n päivä on 17.–18.09. tai 22.09. Päätelty: UE leimasi ajopäivän,
   kun CR-käsittely kirjoitti selvitystavan, eli CR:n luontipäivä ja käsittelypäivä eroavat.
   **B025325** on poikkeus: `decided_at` 21.09. on *aiempi* kuin CR:n `cr_created` 22.09.2026 (CR
   6646). Päätelty: UE leimasi selvitystavan kirjoitushetken jo ennen tätä CR:ää, ehkä aiemman
   kirjoituksen tai Helsingin ja ajonaikaisen kellon eron vuoksi. Syytä ei ole todennettu.
   Import korvaa arvon 22.09.2026:lla sääntöjen mukaisesti.
5. **Palautukset ja lykätyt mukana.** Sääntö koskee kaikkia pyöriä, joilla on Done-tilainen
   tyypin 2 CR. Mukana on siksi 85 palautusta (status 3, 2D) ja 12 Active-pyörää, joiden
   tunnistuspäivä on tulevaisuudessa. Päätöspäivä on olemassa myös niillä. Jos ADR 0010 rajaa
   palautukset pois, 85 riviä pitää poistaa (status-3-rivien id-summa 1 594 095).
6. **Havainto, ei osa tätä importtia:** B018311 (`liab_settled_at` 07.09.2026) ja B031476
   (04.09.2026) kantavat `liab_settled_at`:ia, joka on aiempi kuin niiden Done-tyypin 2 CR:n
   `cr_created` (17.09.2026). ADR 0008:n mukaan keskenkauden pyörällä sen pitäisi olla CR:n päivä.
   Päätelty: arvo on tullut maksusta (vanha status-sync osa A). Kumpikin on status 1. Molemmat
   kuuluvat ADR 0008 -auditointiin, eivät tähän CSV:hen.

## Ajaja

Käyttäjä. Tätä importtia ei ole ajettu.

## Jälkitarkistus

Heti importin jälkeen:

```sql
SELECT COUNT(*) AS poikkeavat
FROM (SELECT br.id, br.custrecord_gbb_redemption_decided_at AS decided,
             MAX(cr.custrecord_cr_created_date) AS cr_created
      FROM customrecord_sta_bike_register br
      JOIN customrecord_subscrption_change_request cr ON cr.custrecord_cr_bike_registry = br.id
      WHERE cr.custrecord_cr_type = 2 AND cr.custrecord_cr_status = 2
      GROUP BY br.id, br.custrecord_gbb_redemption_decided_at) x
WHERE x.decided IS NULL OR x.decided <> x.cr_created
```

Odotus **0**. Jos tulos on suurempi, tarkista ensin, ovatko ylimääräiset pyörät CR:iä, jotka
käsiteltiin poiminnan (24.09.) jälkeen. Niille UE leimaa käsittelypäivän. Jos CR luotiin eri
päivänä kuin se käsiteltiin, tämä on ADR 0010:n mukainen jatkuva poikkeama, eikä se johdu
importista.

Lisäksi:
- status-jakauma ei muutu importissa (1 = 12, 2 = 1 638, 3 = 85 CSV:n pyörillä)
- `systemnote`: 1 735 muutosriviä kenttään `custrecord_gbb_redemption_decided_at`, `name = -5`
  (CSV-import). Muista, että `systemnote`-suodatin custom recordeilla on epäluotettava (MEMORY).
  Tyhjä tulos ei todista mitään.

## Päivitys 9.10.2026: uusi CSV `01-decided-at-2026-10-09.csv`

> [!IMPORTANT]
> **Ajojärjestys: P2-CSV ensin** (`../2026-10-09-p2-cr-luontipaivat/`), **sitten tämä**. Korvaa `01-decided-at.csv`
> (vanhaa ei ajeta). Tarkistussumma kohdasta *Esitarkistus* nyt NetSuitessa (9.10.2026, ennen P2:ta):

| | Uusi CSV | NetSuite |
|---|---|---|
| Rivejä | **1 750** | 1 750 |
| `SUM(id)` | **37 171 556** | 37 171 556 |
| `MIN(id)` / `MAX(id)` | 114 / 46 560 | 114 / 46 560 |
| Rivejä, joilla `decided_at_nyt` täytetty | 36 | |

Muutokset 24.09. versioon: 15 uutta pyörää (uusia Done-tyypin 2 CR:iä), `decided_at_nyt`/`uusi` päivitetty niille
pyörille, joilla UE on leimannut arvon tai CR on muuttunut, ja neljän pyörän päivä **korjattu todelliseen
luontipäivään** (P2):

| Pyörä | CR | Päivä ennen | Päivä nyt (= `created`) |
|---|---|---|---|
| B040467 | 4637 | 25.02.2026 | 24.07.2026 |
| B040468 | 4634 | 25.02.2026 | 24.07.2026 |
| B040469 | 4542 | 25.02.2026 | 20.07.2026 |
| B012845 | 4545 | 15.06.2026 | 20.07.2026 |

Koska CSV:n arvot vastaavat P2:n jälkeistä tilaa, jälkitarkistuskyselyn odotus 0 pätee vasta P2:n **jälkeen**.
Esitarkistuskysely palauttaa 1 750 / 37 171 556 / 114 / 46 560 myös ennen P2:ta (kysely lukee vanhat CR-päivät).
Päivittäinen CR-ajo lisää uusia rivejä: jos luvut eroavat, tee poiminta uudelleen. Muut ohjeet (muoto, mappaus,
poikkeamat 1–6) pätevät sellaisenaan.

## Päivitys 22.10.2026: uusi CSV `01-decided-at-2026-10-22.csv` (ajettava versio)

> [!NOTE]
> **Ajettu 22.10.2026 (käyttäjä), P2:n jälkeen.** Jälkitarkistus palauttaa **1** (B023943), kuten odotettiin. Tänään muuttuneiden CR-pyörien statusjakauma
> sisältää CSV:n 2 / 1 659 / 88 (status 1 -summa 54 628 = B011627 + B043001). Uusia RI-rivejä ei syntynyt tänään (0).

> [!IMPORTANT]
> **Aja tämä, ei 9.10. eikä 24.09. versiota.** Ajojärjestys on ennallaan: **P2 ensin** (`../2026-10-09-p2-cr-luontipaivat/`,
> esitarkistus 22.10.: 5 riviä, `SUM(id)` **22 902**, nimiä 3), **sitten tämä**.

**Perusteen tarkistus tämän päivän datalla (22.10.2026, REST-poiminta, kaikki 1 986 Done-tilaista tyypin 2 CR:ää / 1 979 pyörää):**
- Poikkeava joukko P2:n korjatuilla päivillä on **täsmälleen 9.10. CSV**: 1 750 pyörää, `SUM(id)` 37 171 556. Jokaisella rivillä on sama
  kohdearvo ja sama lähde-CR. Sarake `decided_at_nyt` vastaa nykyarvoa kaikilla riveillä. Uusia poikkeamia ei ole syntynyt, koska
  `handler_lunastus` kirjoittaa `decided_at` = CR:n luontipäivä 14.10. alkaen (T13 H5). 20.–21.10. käsitellyt 37 CR:ää eivät ole joukossa.
- Muita kopioituja tyypin 2 CR:iä (`cr_created_date` yli 3 pv ennen `created`ia) ei ole P2:n neljän lisäksi.
- `decided_at`:ia ei lue mikään automaatio. 2.0 ei lue eikä kirjoita sitä (`gbb_mr_redemption_sync2.js:42`), ja `handler_lunastus` käyttää
  vanhaa arvoa vain `OVERWRITTEN`-lokitekstiin. Ainoa lukija on cf-gbb-toolsin tarkistus LU11, ja se odottaa juuri tätä arvoa.
  Ylikirjoituksella ei siis ole seurauksia laskutukseen, raportointiin eikä IC:hen.

**Muutos 9.10. versioon: B023943 poistettu (1 750 → 1 749).** Pyörän vakuutuslunastus-CR 5405 on peruttu tyypin 10 CR:llä 7152
(*Vakuutuslunastuksen peruminen*, Done). Pyörä on status 1, tapaa ei ole, ja `subsc_end_date` on 31.08.2028. Päätöspäivää ei ole, joten
`decided_at` jää tyhjäksi. Samasta syystä §10:n kysely ja LU11 näyttävät B023943:n poikkeamana myös importin jälkeen (väärä positiivinen):
kyselyt eivät huomioi tyypin 10 perumista.

| | Uusi CSV | NetSuite 22.10. |
|---|---|---|
| Rivejä | **1 749** | 1 750 − B023943 |
| `SUM(id)` | **37 147 613** | 37 171 556 − 23 943 |
| `MIN(id)` / `MAX(id)` | 114 / 46 560 | 114 / 46 560 |
| Rivejä, joilla on jo arvo (ylikirjoitetaan) | 36 | 36 |

Status-jakauma: 2 = 1 659, 3 = 88, 1 = 2 (B011627 ja B043001, lykätyt lunastukset). Inaktiivisia 0.

**Ylikirjoitettavat 36 arvoa** ovat UE:n leimaamia ajopäiviä.
- **24 myöhempää kuin CR:n päivä:** 23:lla arvo on 21.09. ja CR:n päivä 17.–18.09. B011615:llä arvo on 28.09. ja CR:n päivä 07.09.
  UE leimasi käsittelypäivän, ei luontipäivää.
- **12 aiempaa kuin CR:n päivä:** arvot ovat 21.09.–3.10., ja CR:t on luotu 22.09.–6.10. UE leimasi päivän, kun vanha osa A kirjoitti
  tavan maksusta ennen CR:ää. ADR 0008:n mukaan CR voittaa, joten arvo korvataan CR:n päivällä.

**Usean Done-CR:n pyörät (6, kaikilla `decided_at` tyhjä):** CSV käyttää uusinta CR:ää (ADR 0010 k. 4 ja LU11). 9.10. päätös 4
("ensimmäinen CR:n arvo säilyy") koski käsittelijää, ja 13.10. päätös korvasi sen (toinen CR → Error). Erot ovat 1–7 päivää:
B008391 (29.04. / **30.04.**), B012538 (02.04. / **09.04.**), B012635 (12.07. / **13.07.**), B017206 (11.08. / **14.08.**),
B021702 (23.07. / **24.07.**) ja B042228 (24.08. / **31.08.**).

**Esitarkistus juuri ennen importtia:** README:n kysely (*Tarkistussumma*) palauttaa **1 750 / 37 171 556 / 114 / 46 560** sekä ennen
P2:ta että sen jälkeen (B023943 on mukana, CSV:ssä ei). Jos luvut eroavat, tee poiminta uudelleen.
**Jälkitarkistus:** README:n jälkitarkistuskysely palauttaa **1** (B023943). Mikä tahansa muu rivi on poikkeama.
