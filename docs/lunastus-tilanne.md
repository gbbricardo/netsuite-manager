# Lunastusprojektin tilanne

**Päivitetty:** 2026-09-21 (**vaihe 2 valmis** — handler, sweep ja UE tuotannossa) · **Suunnitelma:** [`lunastus-toteutussuunnitelma.md`](lunastus-toteutussuunnitelma.md)
· **Säännöt:** [`lunastuksen-kenttasaannot.md`](lunastuksen-kenttasaannot.md)

Tämä dokumentti kertoo **missä mennään**. Suunnitelma kertoo mitä tehdään ja säännöt miksi.

---

## Yhteenveto

**Lunastussäännöt ovat tuotannossa kahdella kolmesta polusta.** Kolmen päivän aikana (19.–21.09.2026)
projekti eteni suunnittelusta siihen, että tila *lunastus sovittu* on olemassa käsitteenä, kentässä
ja koodissa, ja että tunnistuspäivä ohjaa statusta oikeasti.

**Mikä on valmista ja tuotannossa:**

- **Jaettu kirjasto** `gbb_lunastus_lib.js` 1.0.0 — viisi predikaattia, 45 yksikkötestiä,
  File Cabinetissa `/SuiteScripts/gbb-lib/`. Kaikki alla oleva johtaa päätöksensä siitä, ei
  toistensa tuotoksesta.
- **Päätöspäivä** `custrecord_gbb_redemption_decided_at` ja sen User Event, Released. Todennettu
  laukeavan myös automaatiosta ja olevan leimaamatta silloin kun selvitystapa ei muutu.
- **Maksuvetoinen polku** kirjoittaa selvitystavan, joten maksettu lunastus ei enää katoa
  tunnistamattomaksi.
- **Kalenterisweep** — se puuttuva pala jota suunnitelma ei tuntenut. Tunnistuspäivä on
  kalenteritapahtuma, eikä yksikään tapahtumavetoinen skripti havainnut sitä. Ensimmäinen ajo
  21.09. käänsi 658 pyörää, 0 virhettä.
- **Datakorjaukset** — 997 pyörää (306 + 691) sai puuttuvan selvitystavan, kaikki todisteesta
  johdettuna eikä arvaamalla.

- **`handler_lunastus.js`** — statusportti, kohdestatus kirjastosta nimen sijaan, ja
  `liab_settled_at` CR:n luontipäivästä ajopäivän sijaan. Tämän myötä **vaihe 2 on kokonaan
  tuotannossa**: kumpikaan statuksen kirjoittaja ei enää päätä itse, vaan molemmat kysyvät
  kirjastolta.

**Mitä on jäljellä:**

Vaihe 3 — lukijat lakkaavat lukemasta `bike_status`-kenttää. Siellä odottaa suunnitelman tärkein
yksittäinen muutos ja sen ansa: raportointi kuuluu **sopimusankkuriin**, ei operatiiviseen.
Samassa yhteydessä korjattava että RI-luonti ei lue kumpaakaan poikkeuspäättymispäivää.
Sen jälkeen vaihe 4 (`cf-gbb-tools`) ja avoimet datapäätökset.

**Mitä matkalla opittiin — kolme asiaa jotka eivät olleet suunnitelmassa:**

| Havainto | Missä se olisi purrut |
|---|---|
| Siirtymää 2 → 3 ei tee kukaan, koska tunnistuspäivä on kalenteritapahtuma | 96 % lunastuksista olisi jäänyt pysyvästi Activeksi ja laskutus jatkunut |
| §8:n päämittari oli ristiriidassa §3:n kanssa | oikein toiminut ajo olisi luettu nelinkertaisena regressiona ja peruttu |
| Vaihe 3 sovelsi ADR 0002:ta väärin päin | viimeinen palkanpidätysrivi olisi kadonnut 8 427 pyörältä |

Yhteistä näille on, että **jokainen löytyi dokumentista eikä koodista**. Suunnitelma ja
sääntödokumentti olivat sisäisesti ristiriitaisia, ja ristiriidat paljastuivat vasta kun lukuja
mitattiin NetSuitesta toteutuksen sijaan.

---

## Mittarit

Todennettu NetSuitesta 21.09.2026.

| Mittari | 18.09. lähtötilanne | 21.09. sweepin jälkeen | Tavoite |
|---|---|---|---|
| **Lunastettu ennen tunnistuspäivää** *(§8, korjattu mittari)* | ei mitattu | **1** | ei kasva |
| Selvitystapa puuttuu, status 2/3 | 1 517 | **1 211** | 0 tai perusteltu |
| Selvitystapa puuttuu, status 2, maksettu | 60 | **0** | pysyy 0 |
| Selvitystapa puuttuu, status 1, maksettu | ei mitattu | **0** | pysyy 0 |
| Tila 2 *lunastus sovittu* | ei käsitteenä | **115** | kasvaa handlerin portin myötä |
| Päättyneitä (status 2/3) | 12 512 | **13 199** | — |
| `date_to_non_active` tyhjä (status 2/3) | 6 | **0** | ratkennut |
| Päätöspäivä kirjattu | kenttää ei ollut | 4 | kasvaa automaattisesti |
| Pyöriä ilman statusta | 148 | **141** | oma selvitys |

Päämittari 4 → 1: kolme neljästä palautettiin **käsin statukselle 1** 21.09. klo 14:10–14:11, mikä
on §4:n sallima korjaussiirtymä 3 → 1. Jäljellä oleva yksi (B021682) on 09.09. peräisin.

> **Vanha §8-mittari** (`status = 2 AND subsc_end_date > CURRENT_DATE`) näyttää **847**. Se on
> vanhentunut ja korjattiin 21.09.2026 — se oli ristiriidassa §3:n kuukausiankkurin kanssa ja olisi
> lukenut oikein toimineen sweep-ajon nelinkertaisena regressiona. Ks.
> [`../findings/2026-09-21-kalenterisweepin-ensimmainen-tuotantoajo.md`](../findings/2026-09-21-kalenterisweepin-ensimmainen-tuotantoajo.md).

## Vaiheet

| # | Vaihe | Tila |
|---|---|---|
| 0 | Päätöspäiväkenttä `custrecord_gbb_redemption_decided_at` | **valmis** 19.09. |
| 0 | Päätöspäivä-UE `ue_gbb_redemption_decided_at` | **Released** 20.09. (script 2125) |
| 1 | Jaettu kirjasto `gbb_lunastus_lib.js` 1.0.0 | **valmis** 20.09., 45/45 testiä |
| 2 | status-sync: selvitystapa maksun mukana (PR #2) | **tuotannossa** 20.09. |
| 2 | status-sync: kalenterisweep (PR #3) | **tuotannossa** 21.09. — ensimmäinen ajo 658 kääntöä, 0 virhettä |
| 2 | `handler_lunastus.js` (PR #7) | **tuotannossa** 21.09. — statusportti, kohdestatus kirjastosta, CR:n luontipäivä |
| 3 | Lukijat: kuukausiraportointi, laajennus | **avautunut** — vaihe 2 on valmis |
| 4 | `cf-gbb-tools` | tekemättä |
| 5 | Datakorjaukset | 306 + 691 tehty; **1 211 avoinna** |

## Todennettu tuotannossa

| Mitä | Milloin | Todiste |
|---|---|---|
| Kirjasto latautuu File Cabinetista | 21.09. | `gbb_lunastus_lib=1.0.0` sweepin aloitusrivillä |
| UE laukeaa käsin tehdystä muokkauksesta (EDIT) | 20.09. | B000058 |
| UE laukeaa inline-muokkauksesta (XEDIT) | 20.09. | B036668 |
| UE **ei** leimaa kun selvitystapa ei muutu | 20.09. | B014152, system note 14:53 |
| UE laukeaa **automaatiosta** (`-System-`, submitFields) | 21.09. | B038358, B043864 — päätöspäivä 21.09. |
| status-sync kirjoittaa selvitystavan automaatiosta | 21.09. | samat kaksi pyörää |
| Sweep lukee samaa todellisuutta kuin SuiteQL | 21.09. | dry run 78/26/52 = kysely 78/26 |

## Seuraavat taskit

### 1. Todenna handlerin statusportti seuraavassa CR-ajossa — **seuraava**

Käyttöönoton hetkellä jonossa oli **31 Pending Type 2 -CR:ää, ja kaikilla 31:llä tunnistuspäivä on
tulevassa kuukaudessa**. Oikea lopputulos on siis **31 lykkäystä ja nolla statuksen kirjoitusta** —
poikkeuksellisen selkeä ensimmäinen testi. Ohje ja kyselyt ovat `CLAUDE.md`:n *Read First* -osiossa.

Jos yksikin pyörä kääntyy statukselle 2 käsittelyhetkellä, portti ei pidä — se on syy pysäyttää
ennen kuin lisää CR:iä ajetaan.

### 2. Varmista sweepin päivittäinen ajastus

Ensimmäinen ajo tehtiin käsin 21.09. Varmista että ajastus on päällä ja seuraava yöajo menee läpi
ilman käsiohjausta. Kandidaattijoukko kasvaa nyt handlerin portin myötä, joten sweepin kuorma
kasvaa vähitellen — seuraa sitä.

| Rivi | Muutos |
|---|---|
| `:106` | kohdestatus nimestä → `kohdestatus(method)`; `bikeStatus`in kaksoisrooli purettava presedenssi säilyttäen |
| `:108` | statusportti `saakoMerkitaPaattyneeksi`:n taakse |
| `:209` | `new Date()` → `custrecord_cr_created_date` |
| `:185-215` | write-once-vahti yksinkertaistuu, päätöspäivä on UE:n vastuulla |

### 4. Vaihe 3 — lukijat lakkaavat lukemasta statusta

Estetty kunnes vaihe 2 on valmis. Muista:
[**sopimusankkuri, ei operatiivinen**](../findings/2026-09-19-tunnistuspaiva-vs-ri-luonnin-paattymisehto.md) —
`saakoMerkitaPaattyneeksi` RI-luonnissa poistaisi viimeisen palkanpidätysrivin 8 427 pyörältä.
Samassa yhteydessä korjattava että RI-luonti ei lue kumpaakaan poikkeuspäättymispäivää (30 pyörällä
arvo eroaa).

## Avoimet päätökset

| Asia | kpl | Kysymys |
|---|---|---|
| Selvitystapa puuttuu, ei todistetta | **1 211** | oletus 1, uusi listan arvo `historical_unknown`, vai tyhjäksi? |
| Pyörät ilman statusta | **141** | eivät Active eivätkä päättyneitä, putoavat jokaisen skriptin suodattimesta |
| Selvitystapa 5 `bike_returned` | 178 | kirjasto pitää maksuttomana todisteena; vahvistettava tietoisesti |
| `docs/scripts/ue_...md` cr-scripts-repossa | — | huomautus "ADR should be updated" on vanhentunut, PR #6 korjaa testi 3:n |
