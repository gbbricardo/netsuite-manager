# Lunastusprojektin tilanne

**Päivitetty:** 2026-09-21 · **Suunnitelma:** [`lunastus-toteutussuunnitelma.md`](lunastus-toteutussuunnitelma.md)
· **Säännöt:** [`lunastuksen-kenttasaannot.md`](lunastuksen-kenttasaannot.md)

Tämä dokumentti kertoo **missä mennään**. Suunnitelma kertoo mitä tehdään ja säännöt miksi.

## Mittarit

Todennettu NetSuitesta 21.09.2026.

| Mittari | 18.09. lähtötilanne | 21.09. | Tavoite |
|---|---|---|---|
| Lunastettu, vuokrakausi kesken | 189 | **188** | ei kasva |
| Selvitystapa puuttuu, status 2/3 | 1 517 | **1 211** | 0 tai perusteltu |
| Selvitystapa puuttuu, status 2, maksettu | 60 | **0** | pysyy 0 |
| Selvitystapa puuttuu, status 1, maksettu | ei mitattu | **691** | 0 importin jälkeen |
| Tila 2 *lunastus sovittu* tunnistettavissa | ei käsitteenä | **78** | kasvaa portin myötä |
| Päätöspäivä kirjattu | kenttää ei ollut | 2 | kasvaa automaattisesti |
| Pyöriä ilman statusta | 148 | **141** | oma selvitys |

## Vaiheet

| # | Vaihe | Tila |
|---|---|---|
| 0 | Päätöspäiväkenttä `custrecord_gbb_redemption_decided_at` | **valmis** 19.09. |
| 0 | Päätöspäivä-UE `ue_gbb_redemption_decided_at` | **Released** 20.09. (script 2125) |
| 1 | Jaettu kirjasto `gbb_lunastus_lib.js` 1.0.0 | **valmis** 20.09., 45/45 testiä |
| 2 | status-sync: selvitystapa maksun mukana (PR #2) | **tuotannossa** 20.09. |
| 2 | status-sync: kalenterisweep (PR #3) | **File Cabinetissa**, dry run tehty — **oikea ajo tekemättä** |
| 2 | `handler_lunastus.js` (3 muutosta) | **tekemättä** — odottaa sweepin todennusta |
| 3 | Lukijat: kuukausiraportointi, laajennus | **estetty** kunnes vaihe 2 on valmis |
| 4 | `cf-gbb-tools` | tekemättä |
| 5 | Datakorjaukset | 306/1 517 tehty; 691 valmisteltu; 1 211 avoinna |

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

### 1. CSV-import: 691 maksettua Active-pyörää — **seuraava**

Aineisto valmiina: [`../imports/2026-09-21-selvitystapa-active/`](../imports/2026-09-21-selvitystapa-active/),
todennettu tarkistussummalla. Esiehto sweepin oikealle ajolle, koska ilman selvitystapaa nämä ovat
sweepin katvealueessa. Löydös:
[`../findings/2026-09-21-maksetut-active-pyorat-ilman-selvitystapaa.md`](../findings/2026-09-21-maksetut-active-pyorat-ilman-selvitystapaa.md).

### 2. Kalenterisweepin ensimmäinen oikea ajo

Importin jälkeen kandidaatteja on 769 ja kääntyviä ~659. **Aja käsin ja valvottuna**, älä jätä
yöajastukselle: jokainen kääntö laukaisee `gbb_webhook_ue_status_changed.js`:n. Tarkista dry run
ensin ja vertaa kandidaattikyselyyn.

### 3. `handler_lunastus.js` — vaiheen 2 viimeinen osa

Vasta kun sweep on todennettu oikeassa ajossa.

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
