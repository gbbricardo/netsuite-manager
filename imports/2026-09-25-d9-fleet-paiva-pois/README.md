# T1c — D9: Fleetin ennenaikainen päivä pois 15 Active-pyörältä — CSV-import syyskuu 2026

Tyhjentää `custrecord_gbb_oomi_exceptional_end_date`:n 15 pyörältä. B044271:ltä tyhjennetään myös
`custrecord_gbb_exceptional_end_date`. Pyörät ovat ADR 0010:n D9-joukko: Fleet-raportti on päättänyt ne
ennenaikaisesti, mutta niillä ei ole tyypin 2/10 CR:ää eikä selvitystapaa.

**Päätös (tuoteomistaja 25.09.2026, P1):** *"Ilman CR:ää ei ole todistetta ennenaikaisesta
päättymisestä, joten ne raportoidaan aktiivisena lokakuussa. Jos lokakuussa huomataan, että ne
menivät väärin, luodaan CR oikealle päivämäärälle, jolloin korjaus tapahtuu itsestään oikein, vain
myöhässä. Jos on tekninen mahdollisuus, että raportointi menee väärin, ne pitää korjata."*

Sääntö: [ADR 0010](../../docs/adr/0010-keskenkauden-lunastus.md) kohta 8, jonka mukaan
päättymisajankohta = `subsc_end_date`, ja Fleet-päivä ei saa päättää pyörää ilman CR:ää.

## Miksi kenttä tyhjennetään, vaikka kirjasto muuttuu lokakuussa

Kirjasto lukee `COALESCE(exceptional, oomi_exceptional, subsc_end_date)` siihen asti, kunnes T11
on tuotannossa. Niin kauan Fleet-päivä on näillä pyörillä kirjaston päättymisajankohta, ja se on jo
mennyt. Tämä on vaaraton vain niin kauan kuin pyörällä ei ole todistetta velvoitteista.

Päätelty koodista:

| Tapahtuma ennen T11:tä | Mitä tapahtuisi ilman tyhjennystä |
|---|---|
| Maksu saapuu (5 pyörää on `cancelled_pending_payment`). Vanha osa A kirjoittaa tavan 1 30.09. asti, ja sen jälkeen sen tekee status-sync 2.0 | Sweep kääntää pyörän statukseen 2, koska tunnistuspäivä on mennyt. `ri_creation` tekee **Ended**-rivin (`isEndedBike`, `mr_monthly_reporting_ri_creation.js:1141`). Tämä on päättyminen ilman CR:ää |
| Status-sync 2.0:n OOMI-haara (K3) lukee kirjaston päättymisajankohdan | Tapa 1 ja status 2 Fleet-päivän perusteella. Sama lopputulos |
| T8 kopioisi Fleet-päivän `subsc_end_date`:iin (alkuperäinen suunnitelma) | `ri_creation`:n OOMI-haara (`:1214`, lukee `subsc_end_date`:a) tekisi 1.10. **Ended**-rivin |

Tyhjennyksen jälkeen kaikki lukijat näkevät säännön mukaisen päättymisajankohdan eli
`subsc_end_date`:n. Tämä ei riipu T11:n aikataulusta.

**Lokakuun ajo tyhjennyksen jälkeen** (päätelty koodista, todennetaan 1.10. ajon jälkeen):

- **14 pyörää:** `subsc_end_date` on tulevaisuudessa ja sopimusrivit kattavat lokakuun (tarkistettu
  NetSuitesta: 2 riviä kullakin). RI-luonnissa ne kulkevat Active-polun kautta, ja lokakuu
  raportoidaan **Active**-rivinä ilman Warningia. Syyskuun Active-rivi on jo kaikilla.
- **B044271:** `subsc_end_date` on 05.09.2026, eli sopimus päättyi omana päättymisajankohtanaan
  syyskuussa. Pyörä on kauden lopun lunastus, ja se on lisätty S4b:hen
  ([`../2026-09-25-oomi-syyskuu/`](../2026-09-25-oomi-syyskuu/README.md)). Sopimusrivit päättyvät
  30.09.
- **B043367:** lokakuulle on jo Ended- ja Active/New-rivi siirto-CR:stä 6777 (Siirto konserni,
  Done). Ne eivät liity lunastukseen, eikä tämä import muuta niitä.
- **B038492:** tilaustyyppi on tyhjä, joten skriptit eivät käsittele sitä OOMI-pyöränä. Pyörä
  kulkee Active-polkua (`subsc_end_date` 08.07.2028).

Fleet-näkyvyys säilyy kentissä `oomi_bike_status` (esim. `cancelled`) ja `redemption_status`.

> [!WARNING]
> **Maanantain Fleet-import (28.09.) voi kirjoittaa päivän takaisin.** ADR 0010 kohdan 8 mukaan
> Fleet-CSV päivittää `oomi_exceptional_end_date`:a edelleen. Kunnes T11 on tuotannossa, aja
> jälkitarkistus jokaisen Fleet-importin jälkeen. Vielä parempi on jättää sarake mappaamatta
> näiden 15 pyörän osalta.

**Tietue:** `customrecord_sta_bike_register` · **Import type:** Custom Record ·
**Data Handling:** `UPDATE`

## Tiedostot

| Tiedosto | Rivejä | Mitä tehdään |
|---|---|---|
| `01-testirivi.csv` | 1 (B045304) | tyhjennetään `oomi_exceptional_end_date` (ja `exceptional_end_date`, joka on jo tyhjä) |
| `02-loput.csv` | 14 | sama. B044271:llä molemmat kentät ovat oikeasti arvollisia |

## Tyhjentäminen — kuten K4:ssä

1. Aja `01-testirivi.csv`. Mappaa `internal_id` → **Internal ID**, `oomi_exceptional_end_date` →
   `custrecord_gbb_oomi_exceptional_end_date` ja `exceptional_end_date` →
   `custrecord_gbb_exceptional_end_date`. Valitse *Advanced Options* → **Overwrite Missing Fields**.
   Jätä muut sarakkeet mappaamatta.
2. Tarkista:
   ```sql
   SELECT custrecord_gbb_oomi_exceptional_end_date, custrecord_gbb_exceptional_end_date,
          custrecord_sta_subsc_end_date, custrecord_sta_bike_status
   FROM customrecord_sta_bike_register WHERE id = 45304
   ```
   Odotus: tyhjä, tyhjä, **31.08.2028**, **1**. Jos `subsc_end_date` tyhjeni, mappaus poimi
   väärän kentän. Korjaa se ennen kuin jatkat.
3. Aja `02-loput.csv` samoilla asetuksilla.

## Aineisto

Tarkistettu NetSuitesta 25.09.2026:

- kaikki 15 ovat status 1 ilman selvitystapaa, `paid_at`:ia ja IC-päivää
- yhdelläkään ei ole tyypin 2 tai 10 CR:ää. Muita CR:itä: B038492:lla Siirto TA 4044 ja
  Jälkiveloitus 4288 (Done), B043367:lla CR:t 6775–6777
- `oomi_exceptional_end_date` < `subsc_end_date` kaikilla

| | Arvo |
|---|---|
| Rivejä | 15 (1 + 14) |
| `SUM(id)` | 629 149 (testirivi 45 304 + loput 583 845) |
| `MIN(id)` / `MAX(id)` | 37 449 / 46 189 |

## Jälkitarkistus

Odotus: **0 riviä**. Aja importin jälkeen ja jokaisen Fleet-importin jälkeen, kunnes T11 on
tuotannossa.

```sql
SELECT id, name, custrecord_gbb_oomi_exceptional_end_date, custrecord_gbb_exceptional_end_date
FROM customrecord_sta_bike_register
WHERE id IN (37449,38492,38943,38978,39331,39775,39948,42654,43367,44256,44271,45053,45139,45304,46189)
  AND (custrecord_gbb_oomi_exceptional_end_date IS NOT NULL OR custrecord_gbb_exceptional_end_date IS NOT NULL)
```

Tämän jälkeen:

1. S4b:n tarkistuskysely palauttaa **78** (77 + B044271).
2. T8:n tarkistuskysely palauttaa **18**.
