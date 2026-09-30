# S1c — myöhässä näkyneet lunastusmaksut, `redemption_paid_at` 47 pyörälle — CSV-import 30.09.2026

T4 ([TASKS.md](../../TASKS.md)) ja rivi S1c [status-sync 2.0:n suunnitelmassa](../../docs/status-sync-2-tasmaytysajo.md).
Paylink-jonon purku toistui 29.09. klo 10:02–10:07: maksut 08.–24.09., laskut luotiin vasta 29.09.
taannehtivalla päivällä. Vanhan status-syncin osa A lukee maksut ±5 vrk ikkunasta tapahtumapäivän
mukaan, joten se ei kirjannut näitä ([löydös 23.09.](../../findings/2026-09-23-status-sync-maksuikkuna-hukkaa-myohaiset-maksut.md)).

**Import kirjoittaa vain `custrecord_gbb_redemption_paid_at`:n.** Selvitystapaan ja
`liab_settled_at`:iin ei kosketa:

| Ryhmä | kpl | Miksi vain `paid_at` |
|---|---|---|
| Done-tilainen tyypin 2 CR | 31 + B006299 | Tapa ja `liab_settled_at` tulivat CR:ltä, ja CR voittaa maksun ([ADR 0008](../../docs/adr/0008-keskenkauden-lunastuksessa-cr-voittaa-maksun.md)). `paid_at` ≠ `liab_settled_at` on näillä oikein |
| Ei tyypin 2/10 CR:ää | 15 | Päättymiskuu ei ole alkanut (aikaisin 30.11.2026), joten tapa ja `liab_settled_at` odottavat ([ADR 0009](../../docs/adr/0009-kauden-lopun-lunastus.md) kohta 4) |

B006299 on status 2 (CR 6682), joten poimintakysely ei näe sitä. Se on mukana, koska S1b nimesi sen
([ADR 0008](../../docs/adr/0008-keskenkauden-lunastuksessa-cr-voittaa-maksun.md) § S1b).

> [!NOTE]
> **Ajettu 30.09.2026 klo 15:00–15:01 (NetSuiten kello) ja todennettu: 47/47.** Jokaisen pyörän `paid_at`,
> tapa ja `liab_settled_at` vastaavat CSV:tä rivi riviltä. Tapa ja `liab_settled_at` pysyivät
> ennallaan, ja CR:ttömillä 15 pyörällä ne ovat yhä tyhjiä (kysely b = 0). `02-loput.csv`:iä
> muokattiin klo 15:00, ja B003488 on myös sen viimeisellä rivillä, joten se tuotiin kahdesti samalla
> arvolla. Tiedostossa on siis 47 riviä, ja `SUM(id)` on 1 115 808.
>
> **B046580 ratkesi erikseen:** Paylink 5005 linkitettiin 30.09. uuteen SO:hun SOGBB0015014 ja
> talletukseen CDEPGBB0012206, eikä pyörä ole enää poimintakyselyssä.
>
> **Poimintakysely importin jälkeen: 8 uutta pyörää**, jotka eivät ole myöhässä näkyviä maksuja.
> B001220, B014289, B020743, B023083, B026911, B031196, B040304 ja B045628: Paylink-tuote
> *Työsuhdepyörän kesken kauden lunastus*, maksettu 29.09., SO ja lasku luotu 30.09., ei tyypin 2/10
> CR:ää, päättyvät 2027–2028. Ne ovat vanhan osa A:n tämän yön ikkunassa. **1.10. aamulla** tarkistetaan
> kysely b) sekä se, mitä osa A kirjoitti näille kahdeksalle.

**Tietue:** `customrecord_sta_bike_register` · **Import type:** Custom Record ·
**Data Handling:** `UPDATE`

## Rajattu pois

- **B046580.** Poimintakysely osuu siihen, mutta Paylink 5005 on *Itsehankinnan käsiraha*
  (528,59 €), ei lunastus. Pyörälinkki on oikein. Pyyntö osui kyselyyn, koska sen
  `custrecord_pl_ns_so_id` (482359) ja `custrecord_pl_ns_deposit_id` (482360) osoittavat B031057:n
  lunastuksen tositteisiin. Käsirahalla ei ole NetSuitessa omaa SO:ta eikä talletusta (virhelokin
  SO 755597:ää ei ole olemassa). Korjaus kuuluu Paylink-ketjulle ja taloustiimille. Pyörä jää
  poimintakyselyyn, kunnes linkki on korjattu.
- **95 status 2/3 -pyörää**, joilla on syyskuun maksu mutta ei `paid_at`:ia. Nämä ovat erillinen
  tehtävä (päätetty 30.09.).

## Tiedostot

| Tiedosto | Rivejä | `SUM(id)` |
|---|---|---|
| `01-testirivi.csv` | 1 (B003488) | 3 488 |
| `02-loput.csv` | 46 | 1 112 320 |
| **Yhteensä** | **47** | **1 115 808** |

Sarakkeet `lahde`, `peruste`, `tapa_ennen`, `loppuvastuut_hoidettu_ennen` ja `paattymisajankohta`
ovat vain dokumentaatiota, eikä niitä mapata. `*_ennen`-sarakkeet ovat tila 30.09. ennen importtia,
ja jälkitarkistus vertaa niihin.

Maksupäivä on Paylinkin `custrecord_pl_paid_at`. Ainoa poikkeus on B017450: sillä ei ole Paylinkiä,
joten maksupäivä on laskun INVGBB1014599 `closedate`. Laskun `trandate` ei kelpaa maksupäiväksi.

## Ennen importtia — aja juuri ennen

**1. Rivit ovat yhä ajankohtaisia.** Odotus on **0 riviä**. Jos jollakin on jo `paid_at`, poista
rivi CSV:stä ja päivitä tarkistussumma.

```sql
SELECT id, name, custrecord_gbb_redemption_paid_at
FROM customrecord_sta_bike_register
WHERE id IN (3488,6065,8151,9155,10117,11627,13315,14365,14549,15281,16327,16856,17450,18611,22372,
             22719,23113,24397,24454,26690,26967,29676,29767,30672,33097,34439,36117,36135,39534,42663,
             44934,6299,10751,11008,11870,22920,24210,24380,25132,25490,26350,30772,35703,36379,37963,
             40757,42721)
  AND custrecord_gbb_redemption_paid_at IS NOT NULL
```

**2. Uusia maksuja ei ole tullut.** Aja [löydöksen poimintakysely](../../findings/2026-09-23-status-sync-maksuikkuna-hukkaa-myohaiset-maksut.md#kyselyt).
Odotus on nämä 46 pyörää ja B046580. Jos tulee uusia pyöriä, ne luokitellaan samalla säännöllä
(onko Done-tyypin 2 CR? onko päättymiskuu alkanut?) ja lisätään CSV:hen ennen importtia. Jos uudella
pyörällä ei ole CR:ää ja sen päättymiskuu on alkanut, se ei kuulu tähän CSV:hen, vaan sille
kirjoitetaan myös tapa 1 ja `liab_settled_at`. Pysähdy ja kysy.

## Ajo

1. Aja `01-testirivi.csv`. Mappaa `internal_id` → **Internal ID** ja `maksupaiva` →
   `custrecord_gbb_redemption_paid_at` (*Redemption paid at*). Jätä muut sarakkeet mappaamatta.
   **Älä valitse *Overwrite Missing Fields*.** Tämä poikkeaa T1c:stä: asetus tyhjentäisi
   mappaamattomat kentät. Muut *Advanced Options* kuten S1:ssä 23.09.
2. Tarkista testirivi:
   ```sql
   SELECT custrecord_gbb_redemption_paid_at, custrecord_gbb_liab_settle_method, custrecord_gbb_liab_settled_at,
          custrecord_sta_bike_status
   FROM customrecord_sta_bike_register WHERE id = 3488
   ```
   Odotus: **10.09.2026**, **1**, **17.09.2026**, **1**. Jos tapa tai `liab_settled_at` muuttui, pysähdy.
   Mappaus tai asetus on väärin, ja arvot on palautettava ennen kuin jatkat.
3. Aja `02-loput.csv` samoilla asetuksilla.

## Jälkitarkistus

**Heti importin jälkeen:**

```sql
-- a) kaikilla 47:llä on paid_at. Odotus: 0 riviä
SELECT id, name FROM customrecord_sta_bike_register
WHERE id IN (3488,6065,8151,9155,10117,11627,13315,14365,14549,15281,16327,16856,17450,18611,22372,
             22719,23113,24397,24454,26690,26967,29676,29767,30672,33097,34439,36117,36135,39534,42663,
             44934,6299,10751,11008,11870,22920,24210,24380,25132,25490,26350,30772,35703,36379,37963,
             40757,42721)
  AND custrecord_gbb_redemption_paid_at IS NULL

-- b) CR:ttömillä ei ole tapaa eikä liab_settled_at:ia. Odotus: 0 riviä
SELECT id, name, custrecord_gbb_liab_settle_method, custrecord_gbb_liab_settled_at
FROM customrecord_sta_bike_register
WHERE id IN (10751,11008,11870,22920,24210,24380,25132,25490,26350,30772,35703,36379,37963,40757,42721)
  AND (custrecord_gbb_liab_settle_method IS NOT NULL OR custrecord_gbb_liab_settled_at IS NOT NULL)
```

Lisäksi vertaa 32 CR-pyörän `paid_at`, tapa ja `liab_settled_at` CSV:n sarakkeisiin `maksupaiva`,
`tapa_ennen` ja `loppuvastuut_hoidettu_ennen` rivi riviltä. Poimintakyselyn pitää palauttaa enää
B046580.

**1.10. aamulla:** aja kysely b) uudelleen. Vanha osa A ajaa vielä yöllä. Ikkuna alkaa 25.09. tai
26.09., ja CR:ttömien pyörien Paylink- ja laskupäivät ovat 14.–24.09., joten osumia ei odoteta.
Osa A kirjoittaa tavan 1, vaikka `paid_at` olisi jo asetettu
(`gbb_ss_bike_redemption_status_sync.js:453-474`).

**Odotettu sivuvaikutus:** §5-mittari (`paid_at` ≠ `liab_settled_at`) kasvaa noin 31:llä. Done-CR:n
pyörillä ero on ADR 0008:n mukaan oikein.

## Aineisto

Tila tarkistettu NetSuitesta 30.09.2026:

- Poimintakysely palautti 47 pyörää. Kaikki ovat status 1, ja 46 on otettu mukaan.
- 31 poiminnan pyörällä on Done-tilainen tyypin 2 CR ja tapa 1. Päättymisajankohta on 29 pyörällä
  31.10.2026 ja kahdella (B011627, B030672) 30.11.2026.
- 15 pyörällä ei ole tyypin 2/10 CR:ää tilassa Pending tai Done, eikä tapaa. 12 ei ole OOMI-pyöriä,
  ja 3 on (B037963, B040757, B042721).
- CR:ttömien laskut on luotu 24.09. (B024380, B036379) tai 29.09. klo 10:02–10:07, ja niiden
  `trandate` on 14.–24.09.
- S1b: B003280 ja B003403 ovat jo kunnossa (29.09. klo 10:36). B042663 ja B044934 ovat tässä
  CSV:ssä, ja B006299 on lisätty erikseen.
