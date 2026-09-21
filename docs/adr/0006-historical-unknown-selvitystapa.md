# ADR 0006 — `historical_unknown`-selvitystapa vapauttaa RI-luonnin statuksesta

- **Päivämäärä:** 2026-09-21
- **Tila:** Hyväksytty · **toteutettu 21.09.2026**
- **Koskee:** `customlist_gbb_liab_settle_method`, `gbb_lunastus_lib.js`,
  `mr_monthly_reporting_ri_creation.js`, [kenttäsäännöt §6](../lunastuksen-kenttasaannot.md)

## Konteksti

[§6](../lunastuksen-kenttasaannot.md) vaatii että kuukausiraportoinnin RI-luonti **lakkaa lukemasta
`custrecord_sta_bike_status`-kenttää**. Perustelu on kilpailutilanne: niin kauan kuin raportointi
lukee statusta, statuksen kirjoitushetki vaikuttaa siihen ja kaksi ajoa kilpailee saman päivän
sisällä.

Vaatimus ei ole toteutettavissa sellaisenaan. Mitattu NetSuitesta 21.09.2026:

| | kpl |
|---|---|
| Pyöriä joilla status on 2/3 mutta **ei yhtään todistetta** jonka kirjasto hyväksyisi | **1 415** |
| …joiden vuokrakausi on jo ohi | 1 414 |
| Vanhin päättyminen | 29.02.2024 |
| Todisteen saavia vastakkaiseen suuntaan | 2 |

"Ei todistetta" = `custrecord_gbb_liab_settled_at` tyhjä, `custrecord_gbb_redemption_paid_at` tyhjä,
eikä maksutonta selvitystapaa. Näillä **statuskenttä on ainoa jäljellä oleva tieto päättymisestä.**

Jos status-luku poistetaan ilman muuta muutosta, nuo 1 415 putoavat RI-luonnin Active-polulle ja
niistä alettaisiin raportoida veronalaista etua uudelleen — osasta helmikuusta 2024 asti. Muutos on
siis käytännössä yksisuuntainen: se menettää 1 415 päättynyttä pyörää ja voittaa 2.

### Populaatio jakautuu kahtia, ja vain toinen puoli tarvitsee uuden arvon

| Ryhmä | kpl | Status | Done Type 2/7 CR luontipäivineen |
|---|---|---|---|
| Selvitystapa 1, ei päivämääriä | **204** | kaikki 2 | **204/204** |
| Ei selvitystapaa lainkaan | **1 211** | kaikki 2 | **0** |

Ne 204 ovat [20.09. importin](../../imports/2026-09-20-selvitystapa/) ryhmä `02`. Niille kirjattiin
tapa 1 mutta ei päivämäärää, koska päivättyä todistetta ei silloin tunnistettu. Nyt tunnistetaan:
jokaisella on Done-CR luontipäivineen, ja [ADR 0004](0004-paatospaivan-kirjoittaa-ue.md) sekä
`handler_lunastus.js` (PR #7) sanovat että **CR:n olemassaolo on todiste ja sen luontipäivä on
päivä jona asiakaspalvelija vahvisti kaiken tehdyksi.** Ne eivät siis tarvitse uutta arvoa vaan
olemassa olevan säännön soveltamisen taannehtivasti.

Kumpikaan ryhmä ei sisällä status 3 -pyöriä.

## Päätös

**1. Uusi arvo `historical_unknown`** listaan `customlist_gbb_liab_settle_method` (ID 8).
Merkitys: *pyörä on päättynyt, mutta miten velvoite hoidettiin ei ole tiedossa eikä
rekonstruoitavissa.*

**2. Kirjasto lukee sen maksuttomaksi todisteeksi.** `MAKSUTTOMAT_SELVITYSTAVAT` saa arvon 8, ja
`SELVITYSTAPA` saa nimetyn vakion. `kohdestatus(8)` = 2, koska 8 ei ole 5. **VERSION → 1.1.0.**

**3. Vain ne 1 211 saavat sen.** Ne 204 saavat `custrecord_gbb_liab_settled_at` = CR:n
luontipäivän, eivät uutta arvoa.

**4. Arvo on varattu historiatietueille.** Sitä **ei saa käyttää uusiin päätöksiin.** Uudessa
lunastuksessa selvitystapa tiedetään aina — se on juuri se tieto jonka asiakaspalvelija vahvistaa
CR:ää luodessaan.

> [!WARNING]
> **Jalkaan ampumisen mahdollisuus.** Koska arvo on maksuton todiste, se kelpaa
> `saakoMerkitaPaattyneeksi`-predikaatille. Niin kauan kuin se on vain näillä 1 211:llä, se on
> vaaraton — ne ovat jo statuksella 2 eikä kalenterisweep näe niitä (se suodattaa statuksen 1).
> Mutta **jos joku asettaa arvon Active-pyörälle, sweep kääntää sen statukselle 2** heti kun
> tunnistuspäivä koittaa, ilman että mitään on oikeasti selvitetty. Mittari:
>
> ```sql
> SELECT COUNT(*) FROM customrecord_sta_bike_register
> WHERE custrecord_gbb_liab_settle_method = 8 AND custrecord_sta_bike_status = 1
> ```
>
> Tämän pitää olla **0**. Jos ei ole, joku on käyttänyt arvoa väärin.

## Vaihtoehdot

**A. Oletus `redemption_paid` (1) niille 1 211:lle.** Hylätty: tapa 1 **ei ole todiste** ilman
maksua, joten ne jäisivät yhä ilman todistetta eikä §6 toteutuisi. Lisäksi se väittäisi 1 211
maksua joita ei ole.

**B. Lukijan varaehto — RI-luonti lukee statusta vain kun todistetta ei ole.** Puolustettavissa:
lukija tunnistaa jo päättyneen pyörän eikä päätä milloin päättyminen tapahtuu, joten §6:n
kilpailutilanne poistuisi kaikilta nykyisiltä pyöriltä. Hylätty ensisijaisena: varaehto jäisi
pysyväksi ellei dataa korjata, ja §6:n kirjain jäisi täyttymättä. Jää varasuunnitelmaksi jos
listan arvon luonti osoittautuu mahdottomaksi.

**C. Jätetään tyhjiksi.** Hylätty: vaihe 3 jäisi pysyvästi puolitiehen.

## Seuraukset

**Hyvät.** §6 toteutuu kirjaimellisesti: RI-luonti voi lakata lukemasta statusta kokonaan.
Tila *päättynyt* on johdettavissa pyörärekisterin faktoista jokaisella pyörällä, myös
historiatietueilla. Epätietoisuus on kirjattu näkyvästi kenttään eikä piilotettu tyhjään arvoon.

**Huonot.** Yksi listan arvo lisää, ja sen merkitys on selitettävä jokaiselle lukijalle.
Kirjaston VERSION nousee, mikä tarkoittaa uudelleenlatauksen File Cabinettiin. `cf-gbb-tools`
toteuttaa samat säännöt erikseen ja tarvitsee saman arvon.

**Riski.** Arvo leviää uusiin päätöksiin ja muuttuu "en jaksa selvittää" -oikotieksi. Sen mittari
on yllä oleva kysely, ja se kuuluu tarkistuskyselyiden joukkoon.

## Toteutus — valmis 21.09.2026

| # | Vaihe | Tila |
|---|---|---|
| 1 | Listan arvo `historical_unknown` = **8** NetSuiteen | ✔ todennettu, lista 1–8 ilman aukkoja |
| 2 | Kirjasto-PR #8: vakio, `MAKSUTTOMAT_SELVITYSTAVAT`, VERSION 1.1.0 | ✔ 50/50 testiä |
| 3 | Kirjasto File Cabinettiin | ✔ todennettu lokista `gbb_lunastus_lib=1.1.0` |
| 4 | CSV: 204 → `liab_settled_at` = CR:n luontipäivä | ✔ ryhmä tyhjeni |
| 5 | CSV: 1 211 → `historical_unknown` | ✔ arvo 8 käytössä 1 211:llä, Active-pyörillä 0 |
| 6 | Vaiheen 3 PR | **tekemättä — este poistunut** |

Kohdan 3 ensimmäinen yritys epäonnistui hiljaisesti: File Cabinettiin päätyi 1.0.0-tiedosto, eikä
mikään kaatunut. Ainoa asia joka paljasti sen oli lokirivin versionumero — juuri se mitä varten
ADR 0003 vaatii sen lokitusta.

## Alkuperäinen toteutusjärjestys

1. Listan arvo NetSuiteen (käsin)
2. Kirjasto-PR: `SELVITYSTAPA`, `MAKSUTTOMAT_SELVITYSTAVAT`, VERSION 1.1.0, testit
3. Kirjasto File Cabinettiin
4. CSV-import: 204 → `liab_settled_at` = CR:n luontipäivä
5. CSV-import: 1 211 → `historical_unknown`
6. **Vasta sitten** vaiheen 3 PR: RI-luonti lakkaa lukemasta statusta

Kohdat 4 ja 5 on tehtävä ennen kohtaa 6, muuten 1 415 pyörää putoaa Active-polulle.

## Todennettu vs. päätelty

**Todennettu NetSuitesta 21.09.2026:** 1 415 / 1 414 / 2; jako 204 + 1 211; 204/204 Done-CR
luontipäivineen; 0/1 211 Done-CR; ei status 3 -pyöriä kummassakaan; vanhin päättyminen 29.02.2024.
**Päätelty:** että 1 415 putoaisi Active-polulle — RI-luonnin haaroista luettu, ei ajettu.
