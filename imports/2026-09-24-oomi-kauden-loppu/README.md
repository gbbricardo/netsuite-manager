# S4 — jumissa olevat OOMI-pyörät, kauden lopun lunastus — CSV-import syyskuu 2026

Kirjaa selvitystavan 34 OOMI-pyörälle, joiden kausi päättyi heinä–elokuussa 2026 mutta jotka ovat
yhä Active, koska niillä ei ole selvitystapaa. Kalenterisweep ei näe pyörää ilman selvitystapaa,
joten ilman tätä importtia ne pysyisivät Activena pysyvästi.

Sääntö: [ADR 0009](../../docs/adr/0009-kauden-lopun-lunastus.md) kohta 4. OOMI-pyörän velvoitteet
katsotaan hoidetuiksi tunnistuspäivänä, koska Oomi vastaa maksamattomista lunastusmaksuista.
Tavaksi kirjataan 1 `redemption_paid`, `liab_settled_at` = tunnistuspäivä ja `redemption_paid_at`
jää tyhjäksi.

**Tietue:** `customrecord_sta_bike_register` · **Import type:** Custom Record ·
**Data Handling:** `UPDATE`

## Tiedosto

| Tiedosto | Rivejä | Mitä kirjoitetaan |
|---|---|---|
| `01-oomi-kauden-loppu.csv` | **34** | selvitystapa 1 `redemption_paid` **ja** `liab_settled_at` |

> [!IMPORTANT]
> **`loppuvastuut_hoidettu` on importtipäivä.** Päättymiskuu on jo mennyt, joten tunnistuspäivä on
> `MAX(päättymiskuun 1. päivä, tänään)` = se päivä, jona import ajetaan. CSV:ssä on **24.09.2026**.
> Jos import ajetaan muuna päivänä, vaihda sarakkeen arvo ajopäiväksi.

Tämä import **ei** kirjoita statusta eikä IC-päivää:

- **Status** vaihtuu kalenterisweepin (1440) seuraavassa yöajossa. Kirjaston `onkoVelvoitteetHoidettu`
  hyväksyy todisteeksi `liab_settled_at`:n. Näin statuksella on yksi kirjoittaja, ja webhook laukeaa
  kerran.
- **IC-päivä** tulee S3:ssa 30.09. samalla säännöllä kuin muille: `LAST_DAY(päättymisajankohta)`,
  eli 31.07. tai 31.08. Nämä ovat menneitä kausia, mikä on sallittua (ADR 0007).

## Muoto

UTF-8 ilman BOM:ia · erotin `;` · päivämäärät `dd.mm.yyyy` · CRLF.

| Sarake | Mappaus |
|---|---|
| `internal_id` | **Internal ID** |
| `pyora_id` | jätä mappaamatta |
| `selvitystapa_nimi` | `custrecord_gbb_liab_settle_method` — **mappaa** |
| `selvitystapa_id` | jätä mappaamatta, varalla |
| `loppuvastuut_hoidettu` | `custrecord_gbb_liab_settled_at` — **mappaa** |
| `paattymisajankohta`, `oomi_redemption_status`, `peruste` | jätä mappaamatta |

## Aineiston todennus

Poimittu NetSuitesta 24.09.2026. Kaikki 34:
- ovat OOMI-pyöriä (`order_type = 3`)
- ovat status 1, eikä niillä ole selvitystapaa
- ovat `subsc_end_date` 05.07.–31.08.2026
- eivät kanna `oomi_exceptional_end_date`:a eivätkä `exceptional_end_date`:a
- eivät ole Pending- eivätkä Done-tilaisen tyypin 2/10 CR:n kohteita
- ovat Fleet-raportilla päättyneitä: `oomi_bike_status` on `ended` (12) tai `ended_pending_payment`
  (22)
- eivät kanna `paid_at`:ia, IC-päivää eivätkä IC-done-merkintää

Q18:n 15 Fleet-historian pyörää (`oomi_exceptional_end_date` < `subsc_end_date`) **eivät** ole tässä
joukossa.

| | CSV | NetSuite |
|---|---|---|
| Rivejä | 34 | 34 |
| `SUM(id)` | 1 434 040 | 1 434 040 |
| `MIN(id)` / `MAX(id)` | 37 626 / 46 285 | 37 626 / 46 285 |

Tarkistettu uudelleen 24.09.2026 ennen importtia. Joukko on sama, eikä yhdellekään 34 pyörälle ole
tullut `liab_settled_at`:ia, `paid_at`:ia, poikkeuspäättymispäivää, IC-päivää eikä tyypin 2/10 CR:ää
(Pending/Done).

```sql
SELECT COUNT(*) AS rivit, SUM(id) AS id_summa, MIN(id) AS min_id, MAX(id) AS max_id
FROM customrecord_sta_bike_register
WHERE custrecord_sta_bike_status = 1 AND custrecord_gbb_liab_settle_method IS NULL
  AND custrecord_sta_bike_order_type = 3
  AND custrecord_sta_subsc_end_date < TO_DATE('2026-09-01','YYYY-MM-DD')
```

Jos luvut eroavat, joukkoon on tullut uusia pyöriä tai siitä on poistunut pyöriä. Tee poiminta
uudelleen, älä importoi.

> [!NOTE]
> **Ajettu 24.09.2026 ja todennettu:** 34/34 pyörällä on tapa 1 ja `liab_settled_at` 24.09.2026.
> `paid_at`, `decided_at` ja IC-päivä ovat tyhjiä, ja status on vielä 1, koska sweep ajaa yöllä.
> 33 pyörää on IC-myytyjä ja yksi ei ole (D1).

## Jälkitarkistus

Importin jälkeisenä aamuna (sweepin ajon jälkeen) ajetaan sama kysely → **0**. Lisäksi näiden 34
pyörän pitää olla status 2.

> [!NOTE]
> **Todennettu 25.09.2026:** kysely palauttaa 0, ja kaikki 34 ovat status 2 sweepin yöajon jälkeen.
> Lokissa on 34 riviä `status -> 2`, virheitä 0.
