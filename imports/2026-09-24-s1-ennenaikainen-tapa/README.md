# K4 — S1:n liian aikaisin kirjaama selvitystapa pois 16 pyörältä — CSV-import 24.09.2026

S1-import 23.09.2026 kirjoitti 16 pyörälle selvitystavan 1 ja `liab_settled_at`:n. Näillä pyörillä
ei ollut tyypin 2 CR:ää, ja niiden kausi päättyy 10/2026–2029. [ADR 0009](../../docs/adr/0009-kauden-lopun-lunastus.md)
kohdan 4 mukaan tapa ja `liab_settled_at` kirjoitetaan vasta, kun päättymiskuu on alkanut, eikä
pyörällä saa olla tyypin 2 tai 10 CR:ää. Ennen sitä pyörällä on pelkkä `redemption_paid_at`.
Tuoteomistaja päätti 24.09.2026, että kentät tyhjennetään CSV:llä.

**Miksi:** kun tapa on kirjattu, pyörä on tilassa *lunastus sovittu*, ja sweep kääntää sen
Redeemed-tilaan päättymiskuussa, vaikka CR:ää ei koskaan tulisi. Jos taas tyypin 2 CR tulee, sen
tapa ja päivä eivät voita write-once-kenttiä ([ADR 0008](../../docs/adr/0008-keskenkauden-lunastuksessa-cr-voittaa-maksun.md)
§ `handler_lunastus.js`).

> [!NOTE]
> **Ajettu 24.09.2026 ja todennettu:** 16/16 pyörällä `liab_settle_method` ja `liab_settled_at`
> ovat tyhjiä, `redemption_paid_at` on ennallaan, status on 1 ja CR 6718 (B016666) on yhä Pending,
> eli import ehti ennen CR-ajoa. Uusintatarkistus 28.09. on vielä tekemättä.

**Tietue:** `customrecord_sta_bike_register` · **Import type:** Custom Record ·
**Data Handling:** `UPDATE`

## Tiedostot

| Tiedosto | Rivejä | Mitä tehdään |
|---|---|---|
| `01-testirivi.csv` | 1 (B005492) | tyhjennetään `liab_settle_method` ja `liab_settled_at` |
| `02-loput.csv` | 15 | sama |

`redemption_paid_at` **jää paikalleen**, koska se on maksun fakta (ADR 0008 sääntö 2). Sarake
`redemption_paid_at_sailyy` on mukana vain ihmissilmää varten.

## Kenttien tyhjentäminen CSV:llä — testaa ensin yhdellä rivillä

Tässä tilissä ei ole aiempaa importtia, joka olisi tyhjentänyt kenttiä, joten toimintatapaa ei ole
todennettu. NetSuite ohittaa tyhjät solut oletuksena. Tyhjentäminen vaatii, että sarakkeet on
mapattu ja että *Advanced Options* -kohdassa on valittu **Overwrite Missing Fields**.

1. Aja `01-testirivi.csv`. Mappaa `internal_id` → **Internal ID**, `selvitystapa_nimi` →
   `custrecord_gbb_liab_settle_method` ja `loppuvastuut_hoidettu` → `custrecord_gbb_liab_settled_at`.
   Valitse **Overwrite Missing Fields**. Jätä muut sarakkeet mappaamatta.
2. Tarkista:
   ```sql
   SELECT custrecord_gbb_liab_settle_method, custrecord_gbb_liab_settled_at, custrecord_gbb_redemption_paid_at
   FROM customrecord_sta_bike_register WHERE id = 5492
   ```
   Odotus: tyhjä, tyhjä, **05.09.2026**. Jos `paid_at` tyhjeni, mappaus poimi väärän kentän tai
   asetus tyhjensi mappaamattoman kentän: korjaa `paid_at` takaisin ennen kuin jatkat.
3. Vasta sitten aja `02-loput.csv` samoilla asetuksilla.

## Kiireellisyys — B016666

**B016666:lla on Pending-tilainen tyypin 2 CR 6718.** CR-ajastin käsittelee sen yöllä. Jos handler
ehtii ensin, write-once-vartija säilyttää S1:n tavan 1 ja päivän 16.09., ja CR:n arvot hylätään.
**Aja importti ennen seuraavaa CR-ajoa.** Jos CR ehtii käsittelyyn ensin, korjaa pyörä käsin:
CR:n nimen mukainen tapa ja `liab_settled_at` = CR:n `custrecord_cr_created_date` (kuten S1-korjaus).

## Jälkitarkistus — ja B029495

Vanha status-sync (1440) ajaa syyskuun loppuun. Sen osa A kirjoittaa tavan 1 tyhjään kenttään,
kun maksu osuu ±5 vrk ikkunaan. **B029495 maksoi 22.09.**, joten se on ikkunassa **27.09. asti**, ja
osa A voi kirjoittaa tavan takaisin. Muut 15 ovat jo ikkunan ulkopuolella.

Aja tämä kysely importin jälkeen ja uudelleen **28.09.** Odotus on **0 riviä**:

```sql
SELECT id, name, custrecord_gbb_liab_settle_method, custrecord_gbb_liab_settled_at
FROM customrecord_sta_bike_register
WHERE id IN (5492,10162,12880,14042,16666,21319,24292,26437,27393,27471,29495,32764,43416,44011,46058,46429)
  AND (custrecord_gbb_liab_settle_method IS NOT NULL OR custrecord_gbb_liab_settled_at IS NOT NULL)
```

Poikkeukset, jotka eivät ole virheitä:

- **B016666**: jos CR 6718 on käsitelty importin jälkeen, sillä kuuluu olla CR:n tapa ja päivä.
- **B012880** (kausi päättyy 31.10.): status-sync 2.0 kirjoittaa sille tavan 1 1.10. alkaen, jos
  tyypin 2 CR:ää ei ole tullut.

Jos B029495 palasi tapaan 1, aja sen rivi uudelleen `02-loput.csv`:stä.

## Aineisto

Tila tarkistettu NetSuitesta 24.09.2026:

- kaikki 16 ovat status 1
- kaikilla on tapa 1 ja `liab_settled_at` = `paid_at`
- yhdelläkään ei ole `decided_at`:ia eikä poikkeuspäättymispäivää
- B043416, B044011, B046058 ja B046429 ovat OOMI-pyöriä. Niiden keskenkauden päättyminen tehdään
  lokakuusta alkaen CR:llä (ADR 0009 kohta 1)

| | Arvo |
|---|---|
| Rivejä | 16 (1 + 15) |
| `SUM(id)` | 428 327 (testirivi 5 492 + loput 422 835) |
