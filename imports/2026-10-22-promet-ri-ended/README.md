# ProMet Oy (konkurssi): lokakuun RI-rivit Endediksi (CSV-import, T1d)

Päätös 22.10.2026 (käyttäjä): ProMet-pyörät **B023198, B024587 ja B024908** asetetaan Endediksi. Tämä on T1d:n varasuunnitelma
(TASKS T1d, T64), joka tehdään ennen marraskuun palkka-CSV:tä. Valmisteltu 22.10.2026.

> [!NOTE]
> **Tehty 22.10.2026 klo 13:38 käyttöliittymästä (käyttäjä), CSV:tä ei ajettu.** Todennettu SuiteQL:llä: 104318, 104319 ja 104320 status 4 (Ended).
> Syyskuun rivit (68509, 94428, 94429) ja pyörärekisteri ennallaan. Jälkitarkistus palauttaa 0. Jäljellä 1.11. tarkistus (alla).

**Tietue:** `customrecord_gbb_monthly_reporting_item` · **Import type:** Custom Record · **Data Handling:** `UPDATE` · avain **Internal ID**.

## Tiedosto

| Tiedosto | Rivejä | `SUM(id)` | Mitä kirjoitetaan |
|---|---|---|---|
| `01-ri-ended.csv` | **3** | **312 957** | vain `custrecord_gbb_ri_reporting_status` = **4** (Ended) |

UTF-8 ilman BOM:ia, erotin `;`, CRLF. Mappaa `internal_id` → **Internal ID** ja `custrecord_gbb_ri_reporting_status` → *Reporting status*
(arvo 4 = Ended, `customlist_gbb_reporting_status`; jos importti odottaa nimeä, käytä `Ended`). Jätä `ri_nimi`, `pyora` ja `status_nyt` mappaamatta.

## Peruste (todennettu 22.10.2026)

- Rivit 104318–104320 (raportointipäivä 01.10.2026, ProMet Oy, `lease_end` 30.11.2025) ovat **Active**. Kaikki kolme pyörää olivat Active sekä
  syyskuun (68509, 94428, 94429) että lokakuun palkka-CSV:ssä (Shared drive Archive, 101,21 €/kk).
- Pyörät: B023198 ja B024908 ovat status 1, B024587 on status 3. Tapaa ei ole, ja `subsc_end_date` on 30.11.2025.
- Ilman muutosta 1.11. `ri_creation` tekisi B023198:lle ja B024908:lle taas Active-rivin (status 1, kausi ohi, ei tapaa). Kun rivi on Ended,
  `loadBikesWithAnyEndedRi` ohittaa pyörän (ämpäri `ended_already_reported`), eikä marraskuun riviä synny. Pyörät puuttuvat siis marraskuun aineistosta.
- RI-tietueella ei ole User Event -skriptejä, jotka laukeaisivat. Monthly-reportingin UE:t ovat CR- ja pyörärekisteritietueilla.

**Ei tässä importissa:**
- Pyörärekisterin status ja tapa jäävät ennalleen.
- Syyskuun rivit (raportoitu Active) jäävät ennalleen.
- Liikaa raportoitujen kuukausien oikaisu ja saatavien valvonta (T1d kysymykset 2–3) jäävät taloustiimille.

## Esitarkistus (odotus 3 riviä, kaikki status 1)

```sql
SELECT id, name, custrecord_gbb_ri_reporting_status FROM customrecord_gbb_monthly_reporting_item WHERE id IN (104318, 104319, 104320)
```

## Jälkitarkistus

```sql
-- odotus 0
SELECT id FROM customrecord_gbb_monthly_reporting_item WHERE id IN (104318, 104319, 104320) AND custrecord_gbb_ri_reporting_status <> 4
```

**1.11. (kuukausiajon tarkistuslista):** näille kolmelle pyörälle ei saa syntyä marraskuun riviä (odotus 0):
```sql
SELECT ri.id FROM customrecord_gbb_monthly_reporting_item ri JOIN customrecord_sta_bike_register br ON br.id = ri.custrecord_gbb_ri_bike
WHERE br.name IN ('B023198','B024587','B024908') AND ri.custrecord_gbb_ri_reporting_date = TO_DATE('2026-11-01','YYYY-MM-DD') AND ri.custrecord_gbb_ri_reporting_status <> 6
```
