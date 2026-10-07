# `link_sent` = T aiemmin linkin saaneille — CSV-import 7.10.2026

> [!NOTE]
> **Ajettu 7.10.2026 ja todennettu:** 61/61 pyörällä `link_sent` = T (`SUM(id)` 980 821), ehdokaskysely palauttaa 0,
> eikä yhdenkään pyörän status tai selvitystapa muuttunut.

TASKS T37 K-b0, [ADR 0014](../../docs/adr/0014-maksulinkin-korjaus-ja-yksinkertaistus.md) k. 12,
[muutosmäärittely](../../docs/maksulinkki-1479-muutosspeksi.md) A6. Tehdään ennen 1479:n julkaisun A ensimmäistä tuotantoajoa.

Kirjoittaa `custrecord_gbb_eredem_link_sent = T` jokaiselle Active-pyörälle, jolla on Paylink-tilaus tuotteella
*Työsuhdepyörän loppulunastus* mutta ei leimaa. Tilaus on tullut manuaaliprosessista tai muusta reitistä kuin 1479:stä.
Kentän merkitys on ADR 0014:n jälkeen *"pyörä on saanut loppulunastuspyynnön"* reitistä riippumatta.

**Rajaus (tuoteomistaja 7.10.): vain muut kuin OOMI-pyörät.**
- Ehdokkaita oli 354, ja niistä 293 on OOMI-pyöriä (tilaukset 332xxx ja 347xxx).
- 1479 ohittaa OOMI-pyörät joka tapauksessa.
- Leima OOMI-pyörällä vääristäisi T38:n täydennyskyselyn (`link_sent = T` ja tapa 1 → `liab_settled_at` = `paid_at`), koska
  OOMI:lla `liab_settled_at` on tunnistuspäivä ([ADR 0009](../../docs/adr/0009-kauden-lopun-lunastus.md) k. 6).

**Tietue:** `customrecord_sta_bike_register` · **Import type:** Custom Record · **Data Handling:** `UPDATE`

## Tiedostot

| Tiedosto | Rivejä | Mitä tehdään |
|---|---|---|
| `01-testirivi.csv` | 1 (B003747) | `link_sent` = T |
| `02-loput.csv` | 60 | sama |

Tarkistussumma: **61 riviä, `SUM(internal_id)` = 980 821**.

Mappaa vain `internal_id` → **Internal ID** ja `link_sent` → `custrecord_gbb_eredem_link_sent`. Sarakkeet `pyora_id`,
`paattyy`, `tapa` ja `tilaukset` ovat vain tarkistusta varten, joten **älä mappaa niitä**. Jos checkbox ei hyväksy arvoa `T`, käytä arvoa `Yes`.

## Aineisto

Kysely ajettu NetSuitessa 7.10.2026 (N):

```sql
SELECT br.id, br.name FROM customrecord_sta_bike_register br
WHERE br.isinactive = 'F' AND br.custrecord_sta_bike_status = 1
  AND (br.custrecord_sta_bike_order_type IS NULL OR br.custrecord_sta_bike_order_type <> 3)
  AND (br.custrecord_gbb_eredem_link_sent IS NULL OR br.custrecord_gbb_eredem_link_sent = 'F')
  AND EXISTS (SELECT 1 FROM customrecord_payment_requests pr
              WHERE pr.custrecord_pl_product_name = 'Työsuhdepyörän loppulunastus'
                AND (pr.custrecord_pl_ns_bike_id = br.id OR pr.custrecord_pl_notes = br.externalid))
```

Jokaisella pyörällä on täsmälleen yksi tilaus:
- **52 pyörää:** tilaus on `pending`, päättymispäivä 31.10.2026 ja tapa tyhjä. Nämä ovat T36:n jälkiveloituspyöriä, joilla on manuaalitilaus.
- **5 pyörää:** tilaus on `completed`, ja tapa 1 on jo kirjattu: B000991, B004234, B011005, B033069 ja B035208. 1479 ohittaa ne jo tavan perusteella.
- **3 pyörää:** tilaus on `completed`, päättymispäivä 31.10.2026, mutta tapa on tyhjä: **B003462, B004531 ja B012880** (T35). Maksu on tullut,
  mutta selvitystapa puuttuu. Tämä on status-syncin asia (T38 ja maksuikkunalöydös), eikä se estä tätä importtia.
- **1 pyörä, B030361:** tilaus on `pending`, mutta sopimus päättyy vasta **31.03.2027**. Todennäköisesti keskenkauden lunastus loppulunastustuotteella. Leima ei muuta 1479:n toimintaa, koska S4 rajaisi pyörän joka tapauksessa. Kirjattu tiedoksi asiakaspalvelulle.

## Tarkistus importin jälkeen

Odotus on **0 riviä** (sama kysely kuin yllä, `COUNT(*)`):

```sql
SELECT COUNT(*) FROM customrecord_sta_bike_register br
WHERE br.isinactive = 'F' AND br.custrecord_sta_bike_status = 1
  AND (br.custrecord_sta_bike_order_type IS NULL OR br.custrecord_sta_bike_order_type <> 3)
  AND (br.custrecord_gbb_eredem_link_sent IS NULL OR br.custrecord_gbb_eredem_link_sent = 'F')
  AND EXISTS (SELECT 1 FROM customrecord_payment_requests pr
              WHERE pr.custrecord_pl_product_name = 'Työsuhdepyörän loppulunastus'
                AND (pr.custrecord_pl_ns_bike_id = br.id OR pr.custrecord_pl_notes = br.externalid))
```

Ja leiman saaneet (odotus 61 / 980 821):

```sql
SELECT COUNT(*), SUM(id) FROM customrecord_sta_bike_register
WHERE custrecord_gbb_eredem_link_sent = 'T' AND id IN (991,3462,3747,4076,4121,4234,4271,4513,4531,4543,4566,4630,4667,4852,4857,5057,5224,5300,5359,6263,6728,7218,7263,7326,9045,10681,11005,11244,12132,12880,13198,14017,14671,14826,16491,16535,16591,17920,20339,21401,22581,23015,24260,25070,25313,26058,26345,29068,29828,30349,30361,30615,30725,33069,33147,33376,33546,35208,35615,36062,36435)
```
