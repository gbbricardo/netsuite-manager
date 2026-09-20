# Selvitystavan täydennys päättyneille pyörille

**Päivämäärä:** 2026-09-20 · **Tila:** **toteutettu 20.09.2026** — molemmat CSV-importit ajettu ja todennettu
**Edeltäjä:** [`2026-09-17-liab-settle-method-coverage.md`](2026-09-17-liab-settle-method-coverage.md)

## Päätös

Kun `mr_monthly_reporting_ri_creation.js` lakkaa lukemasta `custrecord_sta_bike_status`-kenttää
([toteutussuunnitelma](../docs/lunastus-toteutussuunnitelma.md) vaihe 3), **varaehtoa
`|| bike_status IN (2,3)` ei lisätä.** Perustelu (tuoteomistaja 20.09.2026): varaehto olisi
täsmälleen se "päättele tila toisen skriptin tuotoksesta" jonka jaettu kirjasto on rakennettu
poistamaan. Sen sijaan **puuttuvat selvitystavat täydennetään dataan.**

Tämä tekee täydennyksestä vaiheen 3 esiehdon, ei siivousta sen jälkeen.

## Lopputulos (todennettu NetSuitesta 20.09.2026 importin jälkeen)

Molemmat importit ajettiin. Jokainen mittari täsmäsi ennusteeseen:

| Mittari | Ennuste | Todennettu |
|---|---|---|
| Selvitystapa 1 koko rekisterissä | 10 712 + 264 = 10 976 | **10 976** |
| Tapa 6, status 2/3 | 16 + 37 = 53 | **53** |
| Tapa 7, status 2/3 | 122 + 3 = 125 | **125** |
| Tapa 5, status 2/3 | 178 + 2 = 180 | **180** |
| Aukko jäljellä (status 2/3, tapa tyhjä) | 1 517 − 306 = 1 211 | **1 211** |
| Ryhmä 1: status 2, maksettu, ei tapaa | 0 | **0** |
| §5-rikkomukset tavalla 1 (`settled_at` ≠ `paid_at`) | 53, ei kasva | **53** — import ei lisännyt yhtään |
| Maksupäivä tavalla ≠ 1 | 1, ei kasva | **1** — ei muutosta |

Kaksi viimeistä ovat tärkeimmät: import **ei tuottanut yhtään uutta sääntörikkomusta.** Ne 53 ja
se 1 ovat ennestään olemassa olevia, ja sääntödokumentti on päättänyt olla korjaamatta niitä
taannehtivasti.

Ryhmän 1 nollaantuminen on tämän työn mittari. Se pysyy nollassa vain jos status-sync kirjoittaa
selvitystavan — jos luku alkaa kasvaa, PR #2:n muutos ei toimi, ja se näkyy tässä luvussa vaikka
suorituslokissa ei näkyisi mitään.

## Jäljellä

**1 211 pyörää** ilman selvitystapaa: ne 1 208 joille ei ole todistetta, plus kolme joiden ainoa
Type 2/7 CR ei ole Done-tilassa. Avoin liiketoimintapäätös, ks. *Avoin*-kohta alla.
Lisäksi erikseen **141 pyörää ilman statusta** — eivät korjaannu selvitystavalla.

---

## Populaatio

Todennettu NetSuitesta 20.09.2026. Koko pyörärekisteri, 46 737 tietuetta:

| `bike_status` | Tietueita | Selvitystapa tyhjä |
|---|---|---|
| 1 Active | 34 060 | 33 979 *(oikein — ei päättynyt)* |
| **2 Redeemed** | 12 353 | **1 515** |
| **3 Returned** | 183 | **2** |
| **tyhjä** | 141 | **141** |

Ne 141 statuksetonta ovat oma ongelmansa (17.09. löydös kohta 4): ne eivät ole Active eivätkä
päättyneitä ja putoavat jokaisen skriptin suodattimesta. Ne eivät korjaannu selvitystapaa
täydentämällä.

## Ne 1 515: mille selvitystapa on pääteltävissä

| Ryhmä | kpl | Päätelty tapa | Todiste | Luottamus |
|---|---|---|---|---|
| `custrecord_gbb_redemption_paid_at` asetettu | **60** | 1 `redemption_paid` | maksu on itse todiste | korkea |
| Type 2/7 CR, nimessä `vakuutus` | **3** | 7 `bike_stolen_or_destroyed` | `handler_lunastus.js:54` `SETTLE_METHOD_OVERRIDES` | korkea |
| Type 2/7 CR, nimessä ` - 2B` | **37** | 6 `bike_sold_to_competitor` | sama | korkea |
| Type 2/7 CR, muu nimi | **207** | 1 `redemption_paid` | `handler_lunastus.js:28` `DEFAULT_SETTLE_METHOD_BY_STATUS = {2:1, 3:5}` | keskitaso |
| Vain `custrecord_sta_redemption_date` | **431** | — | ei todistetta | — |
| Ei mitään todistetta | **777** | — | ei todistetta | — |

**307 on pääteltävissä todisteesta, 1 208 ei.** Päättelysäännöt ovat handlerin omia sääntöjä, eivät
tätä varten keksittyjä — täydennys tuottaa saman arvon jonka handler olisi kirjoittanut jos
ominaisuus olisi ollut olemassa (julkaistu 02.09.2026, `uusi TA` -haara 09.09.2026).

Ryhmä 1 **kasvaa**: 44 kpl 17.09., 60 kpl 20.09. — noin viisi päivässä. Kasvun pysäyttää
[17.09. löydöksen](2026-09-17-liab-settle-method-coverage.md#m1--status-sync-kirjoittaa-metodin-1-statuksen-mukana-ainoa-joka-estää-uutta-velkaa)
muutos M1 (status-sync kirjoittaa tavan 1 statuksen mukana), joka on
[toteutussuunnitelman](../docs/lunastus-toteutussuunnitelma.md) vaiheessa 2 rivillä `:433`.
**M1 on tehtävä ennen täydennystä**, muuten täydennys jättää jälkeensä kasvavan hännän.

## Avoin: ne 1 208 ilman todistetta

Näille ei ole teknistä vastausta. Vaihtoehdot ovat liiketoimintapäätöksiä:

1. **Oletus 1 `redemption_paid`** — handlerin oma status-2-oletus. Nopein. Riski: kenttäsäännöt §5
   sanovat että tavalla 1 `custrecord_gbb_liab_settled_at` on oltava identtinen
   `custrecord_gbb_redemption_paid_at`:n kanssa — ja näillä 1 208:lla kumpikin on tyhjä. Syntyisi
   1 208 tietuetta jotka rikkovat säännön heti kirjaamishetkellä, ellei sääntöä samalla rajata
   koskemaan vain tietueita joilla `paid_at` on asetettu.
2. **Uusi listan arvo, esim. `historical_unknown`** — rehellinen: emme tiedä. Kirjasto lukisi sen
   maksuttomana todisteena (`MAKSUTTOMAT_SELVITYSTAVAT`), jolloin nämä pyörät käyttäytyvät
   päättyneinä ilman että keksimme niille maksutapahtuman jota ei ollut. Hinta: yksi listan arvo
   lisää ja sen merkitys on selitettävä jokaiselle lukijalle.
3. **Jätetään tyhjiksi** — ja hyväksytään että ne eivät ole "päättyneitä" kirjaston mielessä.
   Vaatii tarkistuksen siitä mitä RI-luonti tekee niille vaihtoen 3 jälkeen: kaikkien 1 208:n
   vuokrakausi on jo ohi, joten uusia RI-rivejä ei todennäköisesti synny — mutta tämä on
   **todennettava ennen kuin siihen luotetaan.**

## Toteutustapa

Selvitystapa on `custrecord_gbb_liab_settle_method`, ja sen kirjoittaminen **ei** laukaise
`gbb_webhook_ue_status_changed.js`:ää — se reagoi statukseen, jota tässä ei kosketa. CSV-import on
siis mahdollinen, toisin kuin
[18.09. löydöksen](2026-09-18-ennenaikainen-lunastusstatus.md) statuskorjauksissa.

Huomaa kuitenkin [ADR 0004](../docs/adr/0004-paatospaivan-kirjoittaa-ue.md): kun päätöspäivän UE on
julkaistu, **jokainen selvitystavan kirjoitus leimaa päätöspäivän ajohetkellä**. Jos täydennys
ajetaan UE:n jälkeen, 307–1 515 tietuetta saa päätöspäiväkseen täydennyspäivän, joka on väärä.
Kaksi vaihtoehtoa: aja täydennys **ennen UE:n julkaisua**, tai anna CSV:ssä päätöspäivälle
eksplisiittinen arvo (`custrecord_gbb_date_to_non_active`) jonka UE:n write-once jättää rauhaan.

## Todennettu vs. päätelty

**Todennettu NetSuitesta 20.09.2026:** kaikki luvut (34 060 / 12 353 / 183 / 141; 1 515 / 2 / 141;
60 / 3 / 37 / 207 / 431 / 777).
**Todennettu koodista:** `handler_lunastus.js:28` ja `:54` päättelysääntöinä.
**Päätelty:** ryhmän 4 (207) tapa 1 — handlerin oletus, ei suora todiste.
