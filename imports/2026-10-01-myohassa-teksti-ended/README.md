# Myöhästyneen lunastuksen teksti pois 32 lokakuun Ended-riviltä — CSV-import 1.10.2026

Tyhjentää `custrecord_gbb_ri_gbb_notification`:n 32 lokakuun (`reporting_date` 1.10.2026) Ended-riviltä.
Kentässä on täsmälleen teksti:

> Vuokrakauden päättymispäivä on muuttunut: 31.08.2026 → 30.09.2026. Pyörän lunastus on myöhässä.
> Vuokralaskutus ja pyöräedun käsittely palkoissa jatkuu kunnes GoByBike vastaanottaa suorituksen.

**Aja ennen palkka-CSV:tä (1451).**

> [!NOTE]
> **Ajettu 1.10.2026, todennettu.** 32/32 riviä: huomio tyhjä, status Ended, loppupäivä 30.09.2026, CR-linkki
> tallella (`SUM(id)` 3 699 035). Jälkitarkistus: Active 44, Deleted 7, ei Ended-riviä.

## Miksi teksti on harhaanjohtava

Teksti kertoo työnantajalle, että pyöräedun käsittely palkoissa *jatkuu*, mutta rivi raportoi sopimuksen
**päättyneeksi**. Pyörät on lunastettu, ja jälkiveloitettu syyskuu oli niiden viimeinen kuukausi.

Todennettu NetSuitesta 1.10.2026:

- Kaikilla 32 rivillä on status Ended, `lease_end_date` 30.09.2026 ja rekisterissä pyörän status 2.
- Kentässä on täsmälleen yllä oleva teksti, ei muuta. Tyhjennys ei siis hävitä mitään muuta tietoa.
- **Jokaisella 32 pyörällä on syyskuun (1.9.) Active-rivi.** Syyskuun rivillä teksti oli oikein
  (jälkiveloitettu kuukausi), ja siellä se myös säilyy.
- Jokainen rivi on linkitetty tyypin 7 *Jälkiveloitus* -CR:ään (sarake `lahde_cr`).

Lähde (päätelty koodista): teksti on kahden säännön yhdistelmä.

- Sääntö C3, `netsuite-monthly-reporting/ue_reporting_item_late_redemption_prolongation.js:16`: *"Pyörän
  lunastus on myöhässä …"*. `mergeIntoExistingRi()` (`:281-290`) liittää lauseen olemassa olevalle riville
  statuksesta riippumatta.
- Sääntö C4, `ue_reporting_item_maintenance_prolongation.js:120`: *"Vuokrakauden päättymispäivä on
  muuttunut …"*.

Rivi päätyi Ended-tilaan myöhemmin (`lastmodified` 16.09., 22.09. tai 1.10.), mutta tekstiä ei poistettu
statuksen muuttuessa.

Ulkopuolelle jäävät samaa tekstiä kantavat rivit:

| Joukko | Rivejä | Miksi ei mukana |
|---|---|---|
| Active, `lease_end_date` 31.10.2026, rekisterissä status 1 | 44 | Jälkiveloitus jatkuu lokakuussa, joten teksti on oikein |
| Deleted | 7 | Ei mene CSV:hen |

**Tietue:** `customrecord_gbb_monthly_reporting_item` · **Import type:** Custom Record ·
**Data Handling:** `UPDATE`

## Tiedostot

| Tiedosto | Rivejä | Mitä tehdään |
|---|---|---|
| `01-testirivi.csv` | 1 (RI 104312, B021374) | tyhjennetään `gbb_notification` |
| `02-loput.csv` | 31 | sama |

Tarkistussumma: **32 riviä, `SUM(internal_id)` = 3 699 035** (todennettu NetSuitesta).

Sarakkeet `pyora_id`, `lease_end_date`, `lahde_cr` ja `syyskuun_rivi` ovat vain tarkistusta varten.
**Älä mappaa niitä.**

## Ajo

1. Aja `01-testirivi.csv`. Mappaa `internal_id` → **Internal ID** ja `gbb_notification` →
   `custrecord_gbb_ri_gbb_notification`. Valitse *Advanced Options* → **Overwrite Missing Fields**.
2. Tarkista:
   ```sql
   SELECT id, custrecord_gbb_ri_gbb_notification, BUILTIN.DF(custrecord_gbb_ri_reporting_status) st,
          custrecord_gbb_ri_lease_end_date, custrecord_gbb_ri_change_request
   FROM customrecord_gbb_monthly_reporting_item WHERE id = 104312
   ```
   Odotus: notification tyhjä, status **Ended**, loppupäivä **30.09.2026**, CR **6491**.
3. Aja `02-loput.csv` samoilla asetuksilla.

## Jälkitarkistus

```sql
SELECT BUILTIN.DF(custrecord_gbb_ri_reporting_status) st, COUNT(*)
FROM customrecord_gbb_monthly_reporting_item
WHERE custrecord_gbb_ri_reporting_date = TO_DATE('2026-10-01','YYYY-MM-DD')
  AND custrecord_gbb_ri_gbb_notification LIKE '%lunastus on myöhässä%'
GROUP BY BUILTIN.DF(custrecord_gbb_ri_reporting_status)
```

Odotus: **Active 44, Deleted 7, ei Ended-riviä.**

## Juurisyy

Korjaus kuuluu `netsuite-monthly-reporting`-repoon, ja se tehdään erillisessä istunnossa. Jälkiveloituksen
tekstiä ei pidä jättää riville, joka on (tai muuttuu) Ended-tilaan. Joko C3:n merge ohittaa Ended-rivit, tai
Ended-polku (ri_creation / ri_update) tyhjentää C3- ja C4-tekstit. Ilman korjausta sama toistuu joka kuu
jälkiveloitettujen ja lunastettujen pyörien kohdalla.
