# Poikkeuspäivät `subsc_end_date`:iin — CSV-import syyskuu 2026

> [!IMPORTANT]
> **Muutettu 25.09.2026 (P1-päätös): 33 → 18 riviä.** D9:n 15 Active-pyörää on poistettu. Ilman CR:ää
> Fleet-päivä ei päätä pyörää, joten niiden `subsc_end_date` jää ennalleen, ja T1c tyhjentää niiden
> Fleet-päivän ([`../2026-09-25-d9-fleet-paiva-pois/`](../2026-09-25-d9-fleet-paiva-pois/README.md)).
> **Aja T1c ensin.** Ennen sitä tarkistuskysely palauttaa 33.

Siirtää 18 pyörän päättymisajankohdan poikkeuskentästä `custrecord_sta_subsc_end_date`-kenttään,
jotta lokakuun kirjastomuutos (päättymisajankohta = `subsc_end_date` ja vain se) ei muuta niiden
päättymistä.

Sääntö: [ADR 0010](../../docs/adr/0010-keskenkauden-lunastus.md) kohta 8. Poikkeuskentistä
luovutaan. Jos poikkeuspäivä on 30.09.2026 tai aiempi, se kopioidaan CSV:llä. Myöhemmät päivät
(1 pyörä, B044504) jätetään kirjastomuutoksen varaan.

**Tietue:** `customrecord_sta_bike_register` · **Import type:** Custom Record ·
**Data Handling:** `UPDATE`

> [!IMPORTANT]
> **Tämä import on ajettava ennen kuin kirjasto lakkaa lukemasta poikkeuskenttiä.** Jos
> järjestys on toisin päin, 16 päättyneen pyörän päättymisajankohta siirtyy myöhemmäksi, ja
> RI-luonti voi alkaa tuottaa niille Active-rivejä.

## Tiedosto

| Tiedosto | Rivejä | Mitä kirjoitetaan |
|---|---|---|
| `01-subsc-end-date.csv` | **18** | vain `custrecord_sta_subsc_end_date` ← `subsc_end_date_uusi` |

`subsc_end_date_uusi` = `COALESCE(exceptional_end_date, oomi_exceptional_end_date)`, eli pyörän
nykyinen päättymisajankohta kirjaston mukaan. **Päättymisajankohta ei muutu yhdelläkään
pyörällä.** Muuttuu vain se, mistä kentästä sen voi lukea.

Poikkeuskenttiin ei kosketa. `exceptional_end_date` jää historiaksi, ja `oomi_exceptional_end_date`
jää Fleet-raportin näkyvyyskentäksi.

## Muoto

UTF-8 ilman BOM:ia · erotin `;` · päivämäärät `dd.mm.yyyy` · CRLF.

| Sarake | Mappaus |
|---|---|
| `internal_id` | **Internal ID** |
| `subsc_end_date_uusi` | **Subscription End Date** (`custrecord_sta_subsc_end_date`) |
| `pyora`, `status`, `oomi_exceptional_end_date`, `subsc_end_date_nyt`, `exceptional_end_date` | jätä mappaamatta |

## Aineiston todennus

Poimittu NetSuitesta 24.09.2026.

| | CSV | NetSuite |
|---|---|---|
| Rivejä | 18 | 18 (T1c:n jälkeen; 24.09. ennen D9-poistoa 33) |
| `SUM(id)` | 758 492 | 758 492 (24.09.: 1 387 641) |
| `MIN(id)` / `MAX(id)` | 37 520 / 46 740 | 37 520 / 46 740 |

```sql
SELECT COUNT(*) AS rivit, SUM(b.id) AS id_summa, MIN(b.id) AS min_id, MAX(b.id) AS max_id
FROM customrecord_sta_bike_register b
WHERE (b.custrecord_gbb_exceptional_end_date IS NOT NULL OR b.custrecord_gbb_oomi_exceptional_end_date IS NOT NULL)
  AND (b.custrecord_sta_subsc_end_date IS NULL
       OR COALESCE(b.custrecord_gbb_exceptional_end_date, b.custrecord_gbb_oomi_exceptional_end_date) <> b.custrecord_sta_subsc_end_date)
  AND COALESCE(b.custrecord_gbb_exceptional_end_date, b.custrecord_gbb_oomi_exceptional_end_date) <= TO_DATE('2026-09-30','YYYY-MM-DD')
```

Aja kysely uudelleen juuri ennen importtia. Jos luvut eroavat, Fleet-CSV tai jokin muu on
muuttanut joukkoa, ja CSV on tehtävä uudelleen.

Jakauma:

| Status | Pyöriä | Huomio |
|---|---|---|
| 2 Redeemed | 16 | päättyneet. Suoja RI-luonnin Active-riveille |
| ~~1 Active~~ | ~~15~~ | **Poistettu 25.09.** D9 ratkaistu: Fleet-päivä tyhjennetään (T1c), eikä `subsc_end_date`:a muuteta |
| tyhjä | 2 | B046739, B046740 |

**Erityistapaukset:**

- **B044906:** `subsc_end_date` siirtyy **myöhemmäksi** (31.07. → 31.08.), koska
  `exceptional_end_date` 31.08. voittaa `oomi`-päivän 31.07. `COALESCE`:ssa jo nyt.
  Päättymisajankohta ei siis muutu.
- **B038492:** tilaustyyppi on tyhjä, joten sitä ei ole merkitty OOMI-pyöräksi.

## Mitä import ei laukaise

Päätelty, ei todennettu:

- **Kalenterisweep:** päättymisajankohta ei muutu, ja Active-pyöriltä puuttuu selvitystapa, joten
  statusta ei käännetä.
- **`netsuite-subscription-extension`:** haku ottaa *OOMI:t pois* ja `subsc_end_date` = eilen.
  Yksikään rivi ei osu tähän.
- **Sopimusrivit:** niitä ei muuteta, eikä laskutus lue `subsc_end_date`:a.
- **Tarkistettava ennen ajoa:** lukeeko jokin skripti `subsc_end_date`:a suoraan kirjaston ohi
  (esim. `mr_bike_data_validity_check.js`, Staria-UE:t), ja reagoiko se muutokseen.

## Jälkitarkistus

Odotus: 0 riviä.

```sql
SELECT id, name FROM customrecord_sta_bike_register
WHERE COALESCE(custrecord_gbb_exceptional_end_date, custrecord_gbb_oomi_exceptional_end_date) <= TO_DATE('2026-09-30','YYYY-MM-DD')
  AND (custrecord_sta_subsc_end_date IS NULL
       OR COALESCE(custrecord_gbb_exceptional_end_date, custrecord_gbb_oomi_exceptional_end_date) <> custrecord_sta_subsc_end_date)
```

## Päivitys 9.10.2026: uusi CSV `01-subsc-end-date-2026-10-09.csv` (15 riviä)

Korvaa `01-subsc-end-date.csv`:n (18 riviä). Poistetut rivit:

| Pyörä | Syy |
|---|---|
| B046739, B046740 | inaktivoidaan T19:ssä |
| B040468 | esitarkistus ei enää palauta sitä: `subsc_end_date` = 30.06.2026 = poikkeuspäivä (todennettu 9.10.). Joku on jo korjannut |

Esitarkistuskysely ajettu uudelleen 9.10.2026: palauttaa 17 riviä, eli 15 tämän CSV:n pyörää + B046739 + B046740.
Kaikilla 15:llä `subsc_end_date` ≠ CSV:n arvo ja nykyinen arvo vastaa `subsc_end_date_nyt`-saraketta.
Uusi CSV: 15 riviä, `SUM(id)` 624 545, `MIN` / `MAX` 37 520 / 46 675. Odotus esitarkistukselle T19:n jälkeen:
15 / 624 545 / 37 520 / 46 675. Jälkitarkistuksen odotus 0.

Huom: tehtävänannossa odotettiin 16 riviä. Tulos on 15, koska B040468 oli jo kunnossa.
