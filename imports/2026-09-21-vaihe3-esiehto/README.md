# Vaiheen 3 esiehto — todiste kaikille päättyneille pyörille

Ilman tätä RI-luonti **ei voi lakata lukemasta `custrecord_sta_bike_status`-kenttää**, mikä on
[kenttäsääntöjen §6:n](../../docs/lunastuksen-kenttasaannot.md) vaatimus. Tausta ja mittaukset:
[ADR 0006](../../docs/adr/0006-historical-unknown-selvitystapa.md).

**Esiehto tälle työlle:** `gbb_lunastus_lib` **1.1.0** on File Cabinetissa (todennettu lokista
21.09.2026 klo 15:13). Ilman sitä kirjasto ei tunnista arvoa 8 todisteeksi ja koko operaatio on
hyödytön — eikä se näkyisi mitenkään.

## Kaksi osaa, kaksi työkalua

| Osa | kpl | Työkalu | Mitä kirjoitetaan |
|---|---|---|---|
| **A** | **204** | CSV-import, `01-cr-luontipaiva.csv` | `custrecord_gbb_liab_settled_at` = CR:n luontipäivä |
| **B** | **1 211** | **Mass Update**, ei CSV | `custrecord_gbb_liab_settle_method` = `historical_unknown` (8) |

Työkalut eroavat tarkoituksella, ks. perustelu osan B kohdalla.

---

## Osa A — CSV-import, 204 riviä

Pyörät joilla on selvitystapa 1 mutta ei yhtään päivämäärää. Jokaisella on **Done Type 2/7 CR
luontipäivineen** (204/204), ja [ADR 0004](../../docs/adr/0004-paatospaivan-kirjoittaa-ue.md) sekä
`handler_lunastus.js` sanovat että CR:n olemassaolo on todiste ja sen luontipäivä on päivä jona
asiakaspalvelija vahvisti kaiken tehdyksi. Tämä on siis olemassa olevan säännön soveltamista
taannehtivasti, ei uusi sääntö.

Jos pyörällä on useampi Done-CR, arvoksi otetaan **aikaisin** luontipäivä — §5:n "aikaisin todiste".

**Data Handling:** `UPDATE`. Muoto: UTF-8 ilman BOM:ia, erotin `;`, päivämäärät `dd.mm.yyyy`, CRLF.

| Sarake | Mappaus |
|---|---|
| `internal_id` | **Internal ID** |
| `pyora_id` | jätä mappaamatta |
| `loppuvastuut_hoidettu` | `custrecord_gbb_liab_settled_at` — **mappaa tämä** |
| `peruste` | jätä mappaamatta |

Aineisto on todennettu NetSuitea vasten tarkistussummalla 21.09.2026:

| | CSV | NetSuite |
|---|---|---|
| Rivejä | 204 | 204 |
| `SUM(id)` | 3 370 894 | 3 370 894 |

> **Päätöspäivä-UE laukeaa** jos *Run Server SuiteScript and Trigger Workflows* on merkitty. **Älä
> merkitse sitä** — ADR 0001 kieltää päätöspäivän backfillin, ja näiden todellinen päätöspäivä on
> CR:n luontipäivä, ei importin päivä. 20.09. importissa ruutu oli merkitsemättä ja lopputulos oli
> oikea.

---

## Osa B — Mass Update, ei CSV

| | |
|---|---|
| **Tietue** | `customrecord_sta_bike_register` |
| **Ehto 1** | `custrecord_sta_bike_status` is any of **2, 3** |
| **Ehto 2** | `custrecord_gbb_liab_settle_method` **is empty** |
| **Aseta** | `custrecord_gbb_liab_settle_method` = `historical_unknown` |
| **Odotus** | **1 211** tietuetta |

### Miksi Mass Update eikä CSV

**CSV on tilannekuva, Mass Update arvioi ehdot ajohetkellä.** Jos 1 211 rivin tiedosto rakennetaan
nyt ja ajetaan myöhemmin, väliin mahtuva CR-käsittely voi antaa jollekin pyörälle **oikean**
selvitystavan — ja import ylikirjoittaisi sen arvolla `historical_unknown`. Kenttä on write-once,
joten oikea tieto katoaisi pysyvästi. 21.09.2026 käsiteltiin kolme Type 2 -CR:ää, joten riski ei
ole teoreettinen.

Mass Update ei voi tehdä tuota virhettä: ehto *"selvitystapa on tyhjä"* suojaa jokaista pyörää joka
on saanut arvon sillä välin.

Toinen syy: ryhmän B ehto ei riipu pyöräkohtaisesta datasta lainkaan. Yksi arvo, kaksi ehtoa — juuri
se mitä Mass Update on. Ryhmä A ei ole, koska jokaisella rivillä on oma päivämäärä.

**Mass Update ei laukaise User Event -skriptejä**, joten päätöspäivä jää tyhjäksi. Se on ADR 0001:n
mukaista: ei backfillia, ja tyhjä luetaan *ei tiedossa*.

---

## Ajon jälkeen — todennus

Kaikkien kolmen pitää olla **0**:

```sql
-- 1. Yksikaan paattynyt pyora ei jaa ilman todistetta
SELECT COUNT(*) FROM customrecord_sta_bike_register
WHERE custrecord_sta_bike_status IN (2,3)
  AND custrecord_gbb_liab_settled_at IS NULL
  AND custrecord_gbb_redemption_paid_at IS NULL
  AND (custrecord_gbb_liab_settle_method IS NULL OR custrecord_gbb_liab_settle_method IN (1,4));

-- 2. ADR 0006:n vaarinkayton mittari: arvo 8 ei saa olla Active-pyoralla
SELECT COUNT(*) FROM customrecord_sta_bike_register
WHERE custrecord_gbb_liab_settle_method = 8 AND custrecord_sta_bike_status = 1;

-- 3. section 5 ei saa rikkoutua: tapa 1, paid_at asetettu, settled_at eri
SELECT COUNT(*) FROM customrecord_sta_bike_register
WHERE custrecord_gbb_liab_settle_method = 1
  AND custrecord_gbb_redemption_paid_at IS NOT NULL
  AND custrecord_gbb_liab_settled_at <> custrecord_gbb_redemption_paid_at;
-- odotus: pysyy 53:ssa, ei kasva
```

Ja arvon 8 kayttoonotto:

```sql
SELECT COUNT(*) FROM customrecord_sta_bike_register
WHERE custrecord_gbb_liab_settle_method = 8;
-- odotus: 1 211
```

Kun kysely 1 on **0**, vaiheen 3 este on poistunut ja RI-luonti voi lakata lukemasta statusta.
