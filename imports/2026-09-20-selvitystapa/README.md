# Selvitystavan täydennys — CSV-import 20.09.2026

Täydentää `custrecord_gbb_liab_settle_method`-kentän päättyneille pyörille joilta se puuttuu.
Tausta ja päätös: [`../../findings/2026-09-20-selvitystavan-taydennys-paattyneille.md`](../../findings/2026-09-20-selvitystavan-taydennys-paattyneille.md).

**Tietue:** `customrecord_sta_bike_register` · **Import type:** Custom Record ·
**Data Handling:** `UPDATE` (ei `ADD`, ei `ADD OR UPDATE`)

> [!NOTE]
> **Molemmat tiedostot on ajettu 20.09.2026 ja tulos todennettu.** Kaikki mittarit täsmäsivät
> ennusteeseen eikä yhtään uutta sääntörikkomusta syntynyt. Tulostaulukko:
> [`../../findings/2026-09-20-selvitystavan-taydennys-paattyneille.md`](../../findings/2026-09-20-selvitystavan-taydennys-paattyneille.md).
> Tiedostot säilytetään sellaisenaan jäljitettävyyden vuoksi — **älä aja niitä uudelleen.**

## Tiedostot

| Tiedosto | Rivejä | Mitä kirjoitetaan | Luottamus |
|---|---|---|---|
| `01-korkea-luottamus.csv` | **102** | selvitystapa + 60:lle myös `liab_settled_at` | **korkea** — jokaisella on suora todiste |
| `02-handlerin-oletus.csv` | **204** | selvitystapa 1 | keskitaso — handlerin oletus, ei suoraa todistetta |

Jaottelu on tarkoituksellinen: **aja 01 ensin, todenna, ja päätä vasta sitten ajetaanko 02.**

### `01-korkea-luottamus.csv` — mistä arvot tulevat

| n | Tapa | Todiste |
|---|---|---|
| 60 | 1 `redemption_paid` | `custrecord_gbb_redemption_paid_at` on asetettu — maksu on itse todiste. Näille kirjoitetaan myös `custrecord_gbb_liab_settled_at` = sama maksupäivä, koska kenttäsääntöjen §5 vaatii tavalla 1 kenttien olevan identtiset |
| 37 | 6 `bike_sold_to_competitor` | Done-tilainen Type 2/7 CR, jonka nimi **päättyy** `" - 2B"` tai `" - 2B uusi TA"` |
| 3 | 7 `bike_stolen_or_destroyed` | Done-tilainen Type 2/7 CR, jonka nimi **päättyy** `"vakuutus"` |
| 2 | 5 `bike_returned` | `bike_status = 3 Returned` |

### `02-handlerin-oletus.csv`

204 pyörää joilla on Done-tilainen Type 2/7 CR ilman tunnistettavaa suffiksia. Arvo 1 tulee
`handler_lunastus.js:28` `DEFAULT_SETTLE_METHOD_BY_STATUS = {2: 1}` -oletuksesta. Se on sama arvo
jonka handler olisi kirjoittanut, jos ominaisuus olisi ollut olemassa CR:n käsittelyhetkellä
(julkaistu 02.09.2026) — mutta se on oletus, ei todiste. `liab_settled_at` jätetään näillä tyhjäksi:
päivättyä todistetta ei ole, eikä ajopäivää saa leimata.

## Muoto

UTF-8 ilman BOM:ia · erotin `;` · desimaalierotin `,` · päivämäärät `dd.mm.yyyy` · rivinvaihto CRLF.

| Sarake | Mappaus |
|---|---|
| `internal_id` | **Internal ID** (tietueen tunniste) |
| `pyora_id` | **jätä mappaamatta** — vain ihmissilmää varten. Todennettu: `name` = `B` + id 6 numeroon täytettynä kaikilla 46 737 tietueella |
| `selvitystapa_nimi` | `custrecord_gbb_liab_settle_method` — **mappaa tämä** |
| `selvitystapa_id` | **jätä mappaamatta** — sama arvo sisäisenä ID:nä, varalla jos nimihaku ei osu |
| `loppuvastuut_hoidettu` | `custrecord_gbb_liab_settled_at` — vain tiedostossa 01, 60 rivillä arvo, muilla tyhjä |
| `peruste` | **jätä mappaamatta** — dokumentaatio |

> Jos mappaat `selvitystapa_id`:n nimen sijaan, aseta kentän Reference Type = *Internal ID*.

## Ennen ajoa

1. **Aja ensin vaiheen 2 muutos `netsuite-bike-redemption-status-sync`:iin** (`:433`, kirjoittaa
   tavan 1 statuksen mukana). Muuten tiedoston 01 ensimmäinen ryhmä kasvaa noin **viidellä
   pyörällä päivässä** ja sama työ on tehtävä uudestaan. Mitattu: 44 kpl 17.09. → 60 kpl 20.09.
2. **Aja import ennen kuin [ADR 0004](../../docs/adr/0004-paatospaivan-kirjoittaa-ue.md):n
   päätöspäivä-UE julkaistaan.** UE leimaa `custrecord_gbb_redemption_decided_at`-kentän aina kun
   selvitystapa saa arvon — importin jälkeen kaikilla 306:lla päätöspäiväksi tulisi importin
   ajopäivä, joka on väärä. ADR 0001 kieltää päätöspäivän backfillin, joten kenttää **ei** ole
   tässä CSV:ssä; oikea järjestys on import ensin, UE sitten.
3. Importti kirjoittaa vain `custrecord_gbb_liab_settle_method`-kenttää (ja 60 rivillä
   `liab_settled_at`). **Statusta ei kosketa**, joten `gbb_webhook_ue_status_changed.js` ei laukea.

## Ajon jälkeen — todennus

Täydennettyjen määrä (odotus 102, tiedoston 02 jälkeen 306):

```sql
SELECT custrecord_gbb_liab_settle_method AS tapa, COUNT(*) AS kpl
FROM customrecord_sta_bike_register
WHERE custrecord_sta_bike_status IN (2,3) AND custrecord_gbb_liab_settle_method IS NOT NULL
GROUP BY custrecord_gbb_liab_settle_method ORDER BY 1
```

Jäljellä oleva aukko (odotus 1 517 → 1 415 → 1 211):

```sql
SELECT COUNT(*) FROM customrecord_sta_bike_register
WHERE custrecord_sta_bike_status IN (2,3) AND custrecord_gbb_liab_settle_method IS NULL
```

Kenttäsääntöjen §5 ei saa rikkoutua — tavalla 1 päivien on oltava identtiset (odotus 0):

```sql
SELECT COUNT(*) FROM customrecord_sta_bike_register
WHERE custrecord_gbb_liab_settle_method = 1
  AND custrecord_gbb_redemption_paid_at IS NOT NULL
  AND custrecord_gbb_liab_settled_at <> custrecord_gbb_redemption_paid_at
```

Maksupäivä tavalla jolla ei ole maksua (odotus: ei kasva importista):

```sql
SELECT COUNT(*) FROM customrecord_sta_bike_register
WHERE custrecord_gbb_liab_settle_method <> 1
  AND custrecord_gbb_redemption_paid_at IS NOT NULL
```

## Mitä tämä ei kata

| | kpl | Miksi |
|---|---|---|
| Ei todistetta lainkaan | **1 208** | Avoin liiketoimintapäätös, ks. löydösdokumentti |
| Pyörät ilman statusta | **141** | `bike_status` tyhjä — eivät Active eivätkä päättyneitä, oma ongelmansa |
| Type 2/7 CR joka ei ole Done | 3 | CR ei ole mennyt läpi, joten sen nimestä ei saa päätellä mitään |

## Lähde

Rivit on tuotettu SuiteQL:llä 20.09.2026. Luokittelusäännöt ovat `handler_lunastus.js:28` ja `:54`
sanatarkasti — suffiksit **ankkuroituna nimen loppuun** ja kirjainkoosta riippumatta, kuten
handlerissa, koska Type 11 -CR:t kantavat samoja merkkijonoja keskellä nimeä
(`" - 2B - hyvitys"`, `"vakuutus - hyvitys"`). Yhdelläkään pyörällä ei ollut keskenään
ristiriitaisia CR:iä (todennettu: `COUNT(DISTINCT method) = 1` kaikilla).
