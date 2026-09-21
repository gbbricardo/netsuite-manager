# Selvitystavan täydennys maksetuille Active-pyörille — CSV-import 21.09.2026

Täydentää `custrecord_gbb_liab_settle_method`-kentän **Active**-pyörille joilla maksu on jo
havaittu. Tausta: [`../../findings/2026-09-21-maksetut-active-pyorat-ilman-selvitystapaa.md`](../../findings/2026-09-21-maksetut-active-pyorat-ilman-selvitystapaa.md).

Tämä on 20.09. importin sisarjoukko: sama aukko, mutta Active-puolella.

**Tietue:** `customrecord_sta_bike_register` · **Import type:** Custom Record ·
**Data Handling:** `UPDATE` (ei `ADD`, ei `ADD OR UPDATE`)

> [!IMPORTANT]
> **Tämä import on kalenterisweepin ensimmäisen oikean ajon esiehto.** Sweepin kandidaattiehto on
> `bike_status = 1 AND liab_settle_method IS NOT NULL`, joten ilman selvitystapaa nämä pyörät ovat
> sweepin katvealueessa. Osa A tavoittaa niistä vain ne joiden maksu osuu ±5 vrk ikkunaan (59
> kpl) — loput ~574 eivät palaa ikkunaan koskaan.

## Tiedosto

| Tiedosto | Rivejä | Mitä kirjoitetaan |
|---|---|---|
| `01-active-maksetut.csv` | **691** | selvitystapa 1 `redemption_paid` **ja** `liab_settled_at` = maksupäivä |

Arvo on yksikäsitteinen eikä perustu päättelyyn: `custrecord_gbb_redemption_paid_at` on asetettu,
eli maksu on tapahtunut, ja maksuvetoinen lunastus on aina `redemption_paid`. Sama sääntö jota
`gbb_ss_bike_redemption_status_sync.js` käyttää 20.09.2026 alkaen ja jota 20.09. importin ryhmä 1
(60 pyörää) käytti.

`liab_settled_at` kirjoitetaan koska [kenttäsäännöt §5](../../docs/lunastuksen-kenttasaannot.md)
vaativat sen olevan identtinen `redemption_paid_at`:n kanssa selvitystavalla 1.

## Muoto

UTF-8 ilman BOM:ia · erotin `;` · desimaalierotin `,` · päivämäärät `dd.mm.yyyy` · rivinvaihto CRLF.

| Sarake | Mappaus |
|---|---|
| `internal_id` | **Internal ID** |
| `pyora_id` | **jätä mappaamatta** — ihmissilmää varten |
| `selvitystapa_nimi` | `custrecord_gbb_liab_settle_method` — **mappaa tämä** |
| `selvitystapa_id` | **jätä mappaamatta** — varalla jos nimihaku ei osu |
| `loppuvastuut_hoidettu` | `custrecord_gbb_liab_settled_at` — **mappaa tämä** |
| `peruste` | **jätä mappaamatta** |

## Aineiston todennus

Poiminta on todennettu NetSuitea vasten tarkistussummalla 21.09.2026 — CSV ja kysely palauttavat
saman joukon:

| | CSV | NetSuite |
|---|---|---|
| Rivejä | 691 | 691 |
| `SUM(id)` | 13 196 542 | 13 196 542 |
| `MIN(id)` / `MAX(id)` | 322 / 46 316 | 322 / 46 316 |

```sql
SELECT COUNT(*) AS rivit, SUM(id) AS id_summa, MIN(id) AS min_id, MAX(id) AS max_id
FROM customrecord_sta_bike_register
WHERE custrecord_sta_bike_status = 1
  AND custrecord_gbb_liab_settle_method IS NULL
  AND custrecord_gbb_redemption_paid_at IS NOT NULL
```

## Vaikutus — lue tämä ennen ajoa

**1. Päätöspäivä-UE laukeaa jokaiselle riville.** `ue_gbb_redemption_decided_at` on Released ja
laukeaa CSV-importin kirjoituksesta. Kaikki 691 saavat `custrecord_gbb_redemption_decided_at` =
importin ajopäivä. Se on **hyväksytty**: näiden pyörien todellista päätöspäivää ei ole missään
tallessa, ja [ADR 0001](../../docs/adr/0001-uusi-paatospaiva-kentta.md):n tyhjä-sääntö antaisi
niille `date_to_non_active`:n, joka on Active-pyörällä tyhjä. Importin päivä on lähin totuus joka
on saatavilla. Kirjaa tämä muistiin: näiden 691:n päätöspäivä **ei ole liiketoiminnallinen fakta**.

**2. Statusta ei kirjoiteta.** Import ei kosketa `custrecord_sta_bike_status`-kenttää, joten
`gbb_webhook_ue_status_changed.js` ei laukea. Pyörät siirtyvät tilaan 2 *lunastus sovittu* ja
odottavat sweepiä.

**3. Sweepin seuraava ajo kääntää ~633 pyörää.** Niiden tunnistuspäivä on jo ohitettu. Jokainen
kääntö laukaisee statuswebhookin. **Aja sweep käsin ja valvottuna importin jälkeen**, älä jätä
yöajastukselle.

**4. Kuukausiraportointi.** `mr_monthly_reporting_ri_creation.js` päättää vuokrasuhteen ehdolla
`liabSettled && reportingDate > endDate`, joten nämä päättyvät RI-luonnissa seuraavassa
kuukausiajossa. Se on oikea lopputulos ja tapahtuisi joka tapauksessa statuksen kautta.

## Ajon jälkeen — todennus

Aukon pitää nollaantua (odotus **0**):

```sql
SELECT COUNT(*) FROM customrecord_sta_bike_register
WHERE custrecord_sta_bike_status = 1
  AND custrecord_gbb_liab_settle_method IS NULL
  AND custrecord_gbb_redemption_paid_at IS NOT NULL
```

Sweepin kandidaattijoukon pitää kasvaa 78 → **769** (78 + 691):

```sql
SELECT COUNT(*) FROM customrecord_sta_bike_register
WHERE custrecord_sta_bike_status = 1 AND custrecord_gbb_liab_settle_method IS NOT NULL
```

§5 ei saa rikkoutua (odotus: ei kasva 53:sta):

```sql
SELECT COUNT(*) FROM customrecord_sta_bike_register
WHERE custrecord_gbb_liab_settle_method = 1
  AND custrecord_gbb_redemption_paid_at IS NOT NULL
  AND custrecord_gbb_liab_settled_at <> custrecord_gbb_redemption_paid_at
```

Sen jälkeen **sweepin dry run**: kandidaatteja 769, kääntyviä ~659 (633 + 26). Jos luvut täsmäävät,
aja oikea ajo.
