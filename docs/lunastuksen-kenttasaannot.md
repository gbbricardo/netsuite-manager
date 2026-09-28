# Lunastuksen kenttäsäännöt

Milloin pyörärekisterin päättymiskentät saavat päivittyä, ja mikä niiden arvon määrää.

**Auktoriteetti.** Tämä dokumentti on normatiivinen: se kertoo mitä *saa* tapahtua. Jos skripti,
työkalu tai käsin tehty muutos poikkeaa tästä, poikkeama on virhe ja se kuuluu korjattavaksi
omistavassa repossa. Nykytilan mitatut poikkeamat on lueteltu erikseen kohdassa
[Nykytilan poikkeamat](#nykytilan-poikkeamat) — dokumentti *ei* kuvaa nykytilaa.

**Sitoo kaikkia kirjoittajia.** SuiteScriptejä, cf-gbb-toolsia, CSV-importteja ja käsin tehtyjä
muutoksia. Osaa ei voi teknisesti pakottaa; se ei tee säännöstä vähemmän sitovaa, vaan tekee
[tarkistuskyselyistä](#8-tarkistuskyselyt) välttämättömiä.

**Rajaus.** Lunastukset, eli kaikki päättymiset jotka johtavat bike status = 2 (Redeemed).
Palautus (`bike_returned`, status 3) rajautuu ulos: sillä on eri kohdestatus ja se käyttäytyy jo nyt
eri tavalla — 171/178 palautetusta pyörästä ei kanna `custrecord_gbb_liab_settled_at`-arvoa
lainkaan.

Käsitteet on määritelty [`../CONTEXT.md`](../CONTEXT.md):ssä. Tämä dokumentti ei toista niitä vaan
sitoo ne kenttiin.

---

## 1. Kolme päivämäärää

Ennenaikaisessa lunastuksessa on kolme eri päivämäärää. Niiden sekoittaminen on tämän dokumentin
koko olemassaolon syy.

| | Käsite | Kenttä | Saa olla menneisyydessä |
|---|---|---|---|
| 1 | Päättymisajankohta | `custrecord_sta_subsc_end_date`, override `custrecord_gbb_exceptional_end_date` | kyllä |
| 2 | Päätöspäivä | `custrecord_gbb_redemption_decided_at` *(uusi, ks. [ADR 0001](adr/0001-uusi-paatospaiva-kentta.md))* | ei (on aina "nyt") |
| 3 | Velvoitteet hoidettu | `custrecord_gbb_liab_settled_at`, `custrecord_gbb_redemption_paid_at` | kyllä |

Esimerkki, päätös tehty 18.09.2026:

| | Eteenpäin katsova | Takautuva |
|---|---|---|
| Päättymisajankohta | 31.12.2026 | 30.04.2026 |
| Päätöspäivä | 18.09.2026 | 18.09.2026 |
| Velvoitteet hoidettu | 10.09.2026 | 10.09.2026 |
| Sopimusrivit katkaistaan | 31.12.2026 | 30.04.2026 |
| `custrecord_gbb_ic_redemption_dt` | 31.12.2026 | **30.04.2026** |
| Tunnistuspäivä | 01.12.2026 | **18.09.2026** |
| `custrecord_sta_bike_status` → 2 | 01.12.2026 | 18.09.2026 |
| `custrecord_gbb_date_to_non_active` | 01.12.2026 | 18.09.2026 |

Takautuvassa tapauksessa `ic_redemption_dt` ja `date_to_non_active` eroavat viidellä kuukaudella.
Se on tarkoituksellista, ks. [ADR 0002](adr/0002-kaksi-ankkuria.md).

---

## 2. Päättymisajankohta

```
päättymisajankohta = COALESCE(
    custrecord_gbb_exceptional_end_date,
    custrecord_gbb_oomi_exceptional_end_date,
    custrecord_sta_subsc_end_date
)
```

> [!IMPORTANT]
> **Tavoitetila lokakuusta 2026 ([ADR 0010](adr/0010-keskenkauden-lunastus.md) kohta 8):**
> `päättymisajankohta = custrecord_sta_subsc_end_date`, eikä muuta. Poikkeuskentistä luovutaan.
> `exceptional_end_date` jää historiaksi, ja `oomi_exceptional_end_date` on vain Fleet-raportin
> näkyvyyskenttä, jota Fleet-CSV päivittää ja jota yksikään skripti ei lue. Kaikki päättymisen
> muutokset tulevat CR:n kautta. Yllä oleva `COALESCE` on voimassa, kunnes kirjasto muutetaan, ja
> muutos tehdään vasta [`imports/2026-09-25-poikkeuspaivat-subsc/`](../imports/2026-09-25-poikkeuspaivat-subsc/README.md)
> -importin jälkeen. Sama koskee § 8:n kyselyitä.

**Ei fallbackia.** Jos mikään kolmesta ei ole asetettu, päättymisajankohtaa ei ole ja pyörä ei saa
päättyä. Se on havaittava tila (`status = 1`, selvitystapa täytetty, ei päättymisajankohtaa) josta
kuuluu saada hälytys — ei syy käyttää jotain muuta päivämäärää.

Erityisesti: **maksupäivä ei ole päättymisajankohta.** Lunastusmaksun saapuminen kertoo että
velvoitteet on hoidettu (päivämäärä 3), ei milloin sopimus päättyy (päivämäärä 1).

> Nykyinen toteutus `gbb_ss_bike_redemption_status_sync.js:245` päättyy juuri tuohon fallbackiin:
> `COALESCE(sub.overridedate, sub.subscenddate, sub.eventdate)`. Koska `subscenddate` populoidaan
> vain kauden lopun lunastuksille (`:256`, `:330`), keskenkauden lunastus putoaa aina maksupäivään.
> Tämä on sääntörikkomus, ks. [Nykytilan poikkeamat](#nykytilan-poikkeamat).

## 3. Tunnistuspäivä

```
tunnistuspäivä = MAX(
    päättymisajankohdan kuukauden ensimmäinen päivä,
    tänään
)
```

Ehtona että velvoitteet on hoidettu. Ilman sitä tunnistuspäivää ei ole.

Kuukauden ensimmäinen päivä eikä viimeinen, koska laskutus ja kuukausiraportointi ankkuroituvat
kuukauden alkuun eivätkä loppuun: vuokrakausi voi päättyä kesken kuuta, ja **8 427 pyörällä se
päättyykin** (7 535 Active, 888 jo lunastettua). Kuunloppusääntö olisi väärä joka viidennelle
pyörälle.

`MAX(..., tänään)` kattaa takautuvan päättymisen: mitään ei voi merkitä tapahtuneeksi taaksepäin.

---

## 4. Tilakone

| Tila | Tunnistetaan | `bike_status` | Laskutus ja raportointi |
|---|---|---|---|
| 1 Käynnissä | ei selvitystapaa | 1 | jatkuu |
| 2 Lunastus sovittu | selvitystapa täytetty, tunnistuspäivä ei vielä koittanut | **1** | **jatkuu** |
| 3 Lunastettu | tunnistuspäivä koittanut | 2 | päättynyt |
| 4 IC-käsitelty | `ic_redemption_pr` laskettu | 2 | päättynyt |

**Tila 2 on tämän dokumentin ydin.** Sitä ei ole tänään olemassa käsitteenä, ja sen puuttuminen on
se mekanismi jolla pyörä merkitään lunastetuksi kuukausia liian aikaisin. Tilassa 2 pyörä on
`bike_status = 1` — lunastus on sovittu ja maksettu, mutta vuokrakausi on kesken ja siitä
laskutetaan ja raportoidaan normaalisti.

### Siirtymät

| Siirtymä | Ehto |
|---|---|
| 1 → 2 | selvitystapa kirjataan **ja** velvoitteet on hoidettu |
| 2 → 3 | tunnistuspäivä on koittanut |
| 3 → 4 | IC-laskenta ajettu |
| 3 → 1 | vain korjauksena, käsin |

Siirtymän 2 → 3 saa tehdä **mikä tahansa** kirjoittaja kunhan ehto täyttyy. Omistajuutta ei
rajoiteta — sen sijaan ehto lasketaan [jaetusta kirjastosta](#6-jaettu-kirjasto), jolloin kaikki
kirjoittajat päätyvät samaan lopputulokseen eikä ajojärjestyksellä ole merkitystä.

> [!IMPORTANT]
> **Jonkun on silti tehtävä se.** Tämä muotoilu on oikea periaatteena ja harhaanjohtava
> käytännössä: molemmat statuksen kirjoittajat laukeavat *tapahtumasta* (CR:n käsittely, maksun
> saapuminen), mutta tunnistuspäivä on **kalenteripäivä** joka koittaa ilman tapahtumaa. Mitattuna
> 20.09.2026: 1 599/1 668 (**96 %**) Type 2 -CR:istä on käsittelyhetkellään tunnistuspäivä tulevassa
> kuukaudessa, eli ilman erillistä kalenterihakua ne jäisivät pysyvästi Activeksi.
> [ADR 0005](adr/0005-tilasiirtyman-2-3-tekee-kalenterisweep.md) antaa tehtävän
> `gbb_ss_bike_redemption_status_sync.js`:n kalenterisweepille.

---

## 5. Kenttäkohtaiset säännöt

### `custrecord_sta_bike_status`

| | |
|---|---|
| **Arvo** | 2 (Redeemed). Selvitystapa `bike_returned` → 3, mutta se rajautuu tämän dokumentin ulkopuolelle. |
| **Milloin** | tunnistuspäivänä tai sen jälkeen, ei koskaan aiemmin |
| **Write-once** | ei — status on nykytila ja sen on voitava korjaantua |
| **Omistaja** | mikä tahansa kirjoittaja, ehto jaetusta kirjastosta |

Jokainen muutos laukaisee `gbb_webhook_ue_status_changed.js`:n. Korjaus ei siis ole ilmainen, ja
turhaa uudelleenkirjoitusta samalla arvolla on vältettävä.

### `custrecord_gbb_redemption_paid_at`

| | |
|---|---|
| **Arvo** | lunastusmaksun todellinen maksupäivä |
| **Milloin** | kun maksu havaitaan, riippumatta pyörän tilasta |
| **Write-once** | kyllä (automaatiossa) |
| **Omistaja** | maksuvetoinen automaatio |

Kenttä on olemassa **vain** selvitystavalla `redemption_paid`. Kaikilla muilla tavoilla se on tyhjä
eikä sitä saa täyttää: mitattuna `redemption_extra_rent` 68/68 tyhjä, `redemption_maint_budget`
4/4, `bike_sold_to_competitor` 16/16, `bike_stolen_or_destroyed` 121/122.

Kentän täyttäminen **ei saa vaihtaa statusta.** Maksun saapuminen on päivämäärä 3, ei päivämäärä 1.

### `custrecord_gbb_liab_settled_at`

> [!IMPORTANT]
> **Keskenkauden lunastuksessa muutospyyntö voittaa maksun** ([ADR 0008](adr/0008-keskenkauden-lunastuksessa-cr-voittaa-maksun.md),
> 23.09.2026). Arvo on tyypin 2 CR:n `custrecord_cr_created_date` ja selvitystapa tulee CR:n
> nimestä, **vaikka maksu olisi kirjattu aiemmin**. Maksu ennen CR:ää ei ole virhe, eikä pelkkä maksu
> ilman CR:ää riitä päättämään laskutusta eikä raportointia. Alla olevat säännöt *"aikaisin
> todiste"* ja *"identtinen `paid_at`:n kanssa"* koskevat **vain kauden lopun lunastusta**.
>
> **Kauden lopun lunastuksessa kenttä täytetään kaikilla tavoilla** ([ADR 0009](adr/0009-kauden-lopun-lunastus.md),
> 24.09.2026). Alla oleva ADR 0004:n sääntö *"maksuttomilla tavoilla kenttä jää tyhjäksi"* ei koske
> kauden loppua. Päivät tapakohtaisesti: [§ 9](#9-kauden-lopun-lunastus).

| | |
|---|---|
| **Arvo** | kauden lopun lunastus: aikaisin todiste siitä että velvoitteet on hoidettu. Keskenkauden lunastus: CR:n luontipäivä (ADR 0008) |
| **Milloin** | kun ensimmäinen todiste syntyy |
| **Write-once** | kyllä (automaatiossa) |
| **Omistaja** | se joka havaitsee päivätyn todisteen — maksuvetoinen automaatio, lasku- ja Paylink-polut |

Todisteita on neljä ja ne ovat rinnakkaisia — mikä tahansa riittää:

1. lunastuslasku `paidInFull`
2. Paylink-maksupyyntö valmis
3. `custrecord_gbb_redemption_paid_at`
4. käsin kirjattu selvitystapa jolle ei ole maksua (ylimääräinen vuokra, huoltobudjetti, vakuutus,
   myynti)

**Arvoksi kirjataan aikaisin niistä.** Velvoite hoitui silloin kun ensimmäinen todiste syntyi, ei
silloin kun järjestelmä huomasi sen.

**Kenttä kirjoitetaan vain kun päivätty todiste on olemassa** ([ADR 0004](adr/0004-paatospaivan-kirjoittaa-ue.md),
19.09.2026) — maksupäivä, maksettu lunastuslasku tai valmis Paylink-pyyntö. Todiste 4, maksuton
selvitystapa, ei kanna päivämäärää: todiste *on* selvitystavan kirjaaminen. Silloin kenttä **jää
tyhjäksi ja päivä luetaan `custrecord_gbb_redemption_decided_at`-kentästä.**

Alla oleva ajopäiväkielto koskee siis kaikkia selvitystapoja, mutta eri syistä: tavoilla 1 ja 4
todempi päivä (`custrecord_gbb_redemption_paid_at`) on olemassa, ja kaikki 53 mitattua poikkeamaa
ovat tapaa 1; maksuttomilla tavoilla ajopäivä kuuluu päätöspäiväkenttään.

> Tämän dokumentin 19.09.2026 aamupäivän versio määräsi maksuttomilla tavoilla
> `liab_settled_at` = päätöspäivä. ADR 0004 korvasi sen: arvoa ei monisteta kahteen kenttään, vaan
> lukija lukee päätöspäivän. Nykyisiä 210 arvoa ei muuteta.

Kirjasto ei tee tätä fallbackia: `onkoVelvoitteetHoidettu` palauttaa rehellisesti
`todistepaiva = null` kun todiste on päivämäärätön, ja kirjoittaja soveltaa säännön itse
(`todistepaiva || päätöspäivä`). Kirjasto ei keksi päivämääriä.

Kun selvitystapa on `redemption_paid`, tämän kentän on oltava **identtinen**
`custrecord_gbb_redemption_paid_at`:n kanssa. Ajopäivän leimaaminen on kielletty: se kirjaa
päivämäärän 2 kenttään joka kantaa päivämäärää 3, ja koska kenttä on write-once, virhe jää
pysyvästi.

Tyhjä arvo silloin kun todiste on olemassa **on virhe** jos automaatio on käsitellyt pyörän. Se ei
estä mitään, mutta tilakone ei tyhjänä osaa erottaa tilaa 1 tilasta 2 — ja juuri siitä ennenaikainen
lunastus syntyy.

### `custrecord_gbb_liab_settle_method`

| | |
|---|---|
| **Arvo** | ks. taulukko alla |
| **Milloin** | kun päättymisestä sovitaan; tämä siirtää pyörän tilaan 2 |
| **Write-once** | kyllä (automaatiossa) |
| **Omistaja** | CR-käsittely, maksuvetoinen automaatio, käsin |

| ID | Arvo | Kohdestatus | Lukumäärä |
|---|---|---|---|
| 1 | `redemption_paid` | 2 | 10 712 |
| 2 | `redemption_extra_rent` | 2 | 68 |
| 3 | `redemption_maint_budget` | 2 | 4 |
| 4 | `redemption_down_payment` | 2 | *käsiraha kattaa lunastusmaksun; kirjoittaja `netstuite-send-end-redemption-payment-link` 10/2026 alkaen* |
| 5 | `bike_returned` | 3 | 178 *(rajattu ulos)* |
| 6 | `bike_sold_to_competitor` | 2 | 16 |
| 7 | `bike_stolen_or_destroyed` | 2 | 122 |
| 8 | `historical_unknown` | 2 | *uusi, [ADR 0006](adr/0006-historical-unknown-selvitystapa.md)* |

> **`historical_unknown` on varattu historiatietueille.** Se tarkoittaa: pyörä on päättynyt, mutta
> miten velvoite hoidettiin ei ole tiedossa eikä rekonstruoitavissa. **Sitä ei saa käyttää uusiin
> päätöksiin** — uudessa lunastuksessa selvitystapa tiedetään aina. Arvo kelpaa maksuttomana
> todisteena, joten Active-pyörälle asetettuna se saa kalenterisweepin kääntämään statuksen ilman
> että mitään on selvitetty.

Selvitystapa määrää kohdestatuksen yksikäsitteisesti: **5 → 3, kaikki muut → 2.** Poikkeuksia on
kolme 11 000:sta. Kohdestatusta ei siis tarvitse päätellä CR:n nimestä.

Selvitystavan kirjaaminen on se tapahtuma joka siirtää pyörän tilaan 2 — se ei saa yksin vaihtaa
statusta.

> Tämän kentän kirjoittaa tänään vain CR-käsittely. Maksuvetoinen automaatio ei kirjoita sitä
> lainkaan, mikä tarkoittaa että sen käsittelemät pyörät eivät ole tunnistettavissa tilaan 2. Tämä
> on korjattava samalla kun statuksen kirjoitus siirretään tunnistuspäivään — muuten muutos vaihtaa
> liian aikaisen päättymisen siihen ettei päättymistä tule lainkaan.

### `custrecord_gbb_redemption_decided_at`

> [!IMPORTANT]
> **Keskenkauden lunastuksessa arvo on tyypin 2 CR:n `custrecord_cr_created_date`, ja sen
> kirjoittaa `handler_lunastus`** ([ADR 0010](adr/0010-keskenkauden-lunastus.md) kohta 4,
> 24.09.2026). Alla oleva *"kirjoittaja on UE"* ja *"ei backfillata"* eivät koske keskenkauden
> lunastusta: historia korjataan CSV:llä uusimman Done-tilaisen tyypin 2 CR:n luontipäivästä
> ([`imports/2026-09-25-decided-at-historia/`](../imports/2026-09-25-decided-at-historia/README.md)).
> Kauden lopun lunastuksessa kenttää ei lueta (ADR 0009).

| | |
|---|---|
| **Arvo** | päivä jona ennenaikaisesta päättymisestä päätettiin (päivämäärä 2) |
| **Milloin** | samalla kun `custrecord_gbb_liab_settle_method` kirjataan |
| **Write-once** | kyllä automaatiossa; käsin tyhjennettävissä siirtymässä 3 → 1 |
| **Omistaja** | **User Event -skripti pyörärekisterillä** ([ADR 0004](adr/0004-paatospaivan-kirjoittaa-ue.md)) |

Uusi kenttä, [ADR 0001](adr/0001-uusi-paatospaiva-kentta.md). Tähän kuuluu se ajopäivä jonka
`handler_lunastus.js:209` tänään leimaa `custrecord_gbb_liab_settled_at`-kenttään — ja joka oli
tämän kentän alkuperäinen suunnittelutarkoitus. Arvo luetaan `gbb_lunastus_lib.tanaanHelsinki()`:stä,
ei `new Date()`:sta.

Kirjoittaja on **User Event -skripti**, ei handler ([ADR 0004](adr/0004-paatospaivan-kirjoittaa-ue.md)):
päivämäärä 2 on aina "nyt", joten UE ei voi laskea sitä väärin, ja se kattaa myös käsin tehdyt
muutokset, CSV-importit ja cf-gbb-toolsin. `handler_lunastus.js:209` **poistuu**, ei siirry.

Ei backfillata. Tyhjä tarkoittaa `custrecord_gbb_date_to_non_active`:a jos se on täytetty, muuten
*ei tiedossa* — mikä ei ole virhe. Tilaa *lunastus sovittu* ei tunnisteta tästä kentästä vaan
selvitystavasta ja statuksesta; tämä kenttä kertoo vain kuinka kauan tila on kestänyt.

### `custrecord_gbb_ic_redemption_dt`

| | |
|---|---|
| **Arvo** | `LAST_DAY(päättymisajankohta)` |
| **Milloin** | kun pyörä on tilassa 3; saa osoittaa menneeseen kauteen |
| **Write-once** | kyllä (automaatiossa) |
| **Omistaja** | status-sync 2.0 lokakuusta 2026 ([ADR 0007](adr/0007-status-sync-2-tasmaytysajo.md)); syyskuu 2026 ja sitä ennen CSV-import |

Kenttä kuvaa milloin kausi päättyy **rahoittajan näkökulmasta** ja se on IC-lunastushinnan
amortisaation katkaisukohta. Se seuraa päättymisajankohtaa, ei tunnistuspäivää — takautuvassa
lunastuksessa se osoittaa menneeseen kauteen, ja niin kuuluukin.

**Päivä on laskennalle merkityksetön.** `gbb_ic_redemption_calculator.js:122-125`:

```js
function calculateUnbilledMonths(redemptionDate, subscriptionEndDate) {
  return (subscriptionEndDate.getFullYear() - redemptionDate.getFullYear()) * 12
    + (subscriptionEndDate.getMonth() - redemptionDate.getMonth());
}
```

Vain vuosi ja kuukausi luetaan. Kuunloppu on siis konventio eikä vaatimus — mutta se pidetään,
koska se erottaa kentän visuaalisesti tapahtumapäivistä ja koska 10 219 tietuetta noudattaa sitä jo.
Päivän "korjaaminen" kuunlopusta todelliseen päivään ei muuta laskentaa eikä sitä pidä tehdä; niin
on jo kerran tehty (`09.07.2026` → `31.08.2026`).

Kuukauden siirtäminen sen sijaan muuttaa hintaa: jokainen kuukausi eteenpäin lisää yhden kuukauden
maksettua pääomaa ja **laskee** lunastushintaa.

### `custrecord_gbb_exceptional_end_date`

> [!WARNING]
> **Käytöstä luovutaan** ([ADR 0010](adr/0010-keskenkauden-lunastus.md) kohta 8, 24.09.2026).
> Kenttää ei kirjoiteta, eikä mikään skripti lue sitä lokakuun kirjastomuutoksen jälkeen. Vanhat
> arvot jäävät historiaksi. Alla oleva kuvaus on voimassa vain siirtymän ajan. Sama koskee
> `custrecord_gbb_oomi_exceptional_end_date`:a skriptien osalta, mutta Fleet-raportin CSV-viennit
> päivittävät sitä edelleen näkyvyyden vuoksi.

| | |
|---|---|
| **Arvo** | neuvoteltu ennenaikainen päättymispäivä |
| **Milloin** | kun poikkeuksesta sovitaan |
| **Write-once** | kyllä (automaatiossa) |
| **Omistaja** | käsin / CSV-import (ei yhtään kirjoittajaa koodissa) |

Tämä kenttä ei ole lunastuksen *tulos* vaan sen *syöte*: se on päättymisajankohdan ensisijainen
lähde ja ohittaa `custrecord_sta_subsc_end_date`:n. Sen muuttaminen siirtää sekä tunnistuspäivää
että `ic_redemption_dt`:tä.

Kaikki 79 nykyistä arvoa ovat OOMI-pyörillä. Sen sisar `custrecord_gbb_oomi_exceptional_end_date` on
sama käsite Oomi-integraation kautta tulleille pyörille ja tulee ketjussa heti tämän jälkeen.

### `custrecord_gbb_date_to_non_active`

| | |
|---|---|
| **Arvo** | päivä jona status vaihtui pois Activesta |
| **Milloin** | automaattisesti statuksen vaihtuessa |
| **Write-once** | kyllä |
| **Omistaja** | User Event -skripti pyörärekisterillä |

Koneen kirjausjälki, ei liiketoiminnallinen fakta. Koska statuksen saa vaihtaa mikä tahansa
kirjoittaja, kirjausjälkeä ei voi jättää yhdenkään kirjoittajan vastuulle — se kuuluu User Event
-skriptille, joka kattaa myös käsin tehdyt muutokset.

Oikein toimivassa järjestelmässä `date_to_non_active` on tunnistuspäivä. Sen ero
`ic_redemption_dt`:stä on takautuvan käsittelyn mittari, ei virhe.

---

## 6. Jaettu kirjasto

Säännöt toteutetaan **jaettuna kirjastona**, jota jokainen SuiteScript-kirjoittaja ja -lukija
käyttää. Näin mikään skripti ei päättele tilaa toisen skriptin tuotoksesta vaan kaikki johtavat sen
samoista lähtöfaktoista, ja ajojärjestyksellä lakkaa olemasta merkitystä.

Kirjaston on tarjottava vähintään:

| Predikaatti | Palauttaa |
|---|---|
| `paattymisajankohta(bike)` | päivä tai `null` |
| `onkoVelvoitteetHoidettu(bike)` | totuusarvo + aikaisin todistepäivä |
| `tunnistuspaiva(bike, today)` | päivä tai `null` |
| `saakoMerkitaPaattyneeksi(bike, today)` | totuusarvo |
| `kohdestatus(method)` | 2 tai 3 |

Erityisesti kuukausiraportoinnin RI-luonnin **ei pidä päätellä päättymistä `bike_status`-kentästä.**
Niin kauan kuin se lukee statusta, statuksen kirjoitushetki vaikuttaa raportointiin ja kaksi ajoa
kilpailee saman päivän sisällä.

**Lukija valitsee ankkurinsa** ([ADR 0002](adr/0002-kaksi-ankkuria.md)). Kirjaston viisi
predikaattia eivät ole keskenään vaihtokelpoisia:

| Lukija | Ankkuri | Predikaatit |
|---|---|---|
| `bike_status`, `date_to_non_active` | operatiivinen | `saakoMerkitaPaattyneeksi`, `tunnistuspaiva`, `kohdestatus` |
| laskutus, kuukausiraportointi, `ic_redemption_dt` | sopimus | `paattymisajankohta`, `onkoVelvoitteetHoidettu` |

RI-luonti kuuluu jälkimmäiseen: sen ehto on `onkoVelvoitteetHoidettu(bike).hoidettu &&
reportingDate > paattymisajankohta(bike)`. `saakoMerkitaPaattyneeksi` siellä siirtäisi
raportoinnin operatiiviselle ankkurille ja poistaisi viimeisen raportointikuukauden jokaiselta
kesken kuuta päättyvältä pyörältä. *Tämän dokumentin aiempi versio määräsi juuri niin; korjattu
19.09.2026.*

**Kirjasto yltää kuuteen repoon seitsemästä.** `cf-gbb-tools` on TypeScriptiä Cloudflare Workersilla
eikä voi käyttää SuiteScript-moduulia — sen on toteutettava samat säännöt erikseen. Tämä dokumentti
on siksi ainoa yhteinen lähde niiden kahden toteutuksen välillä, ja niiden erkaantuminen on
tulevaisuudessa juuri sellainen asymmetria jota tässä repossa etsitään.

---

## 7. OOMI-polku

> Kauden lopun lunastuksessa OOMI-pyörä merkitään lunastetuksi päättymiskuussa ilman maksua
> ([ADR 0009](adr/0009-kauden-lopun-lunastus.md) kohta 6, [§ 9](#9-kauden-lopun-lunastus)).
> Lokakuusta 2026 alkaen OOMI-pyörän ennenaikainen päättyminen tehdään muutospyynnöllä, eikä
> `custrecord_gbb_oomi_exceptional_end_date`:a käytetä enää päätöksiin. Olemassa olevia arvoja
> luetaan edelleen.

OOMI-pyörät ovat rinnakkainen prosessi, eivät yksittäinen poikkeus. Niillä on jo neljä omaa sääntöä:

| Sääntö | Missä |
|---|---|
| Sopimus päättyy aina täsmälleen päättymisajankohtanaan | `mr_monthly_reporting_ri_creation.js`, `processOomiEndOverride` (RIVISAANNOT A3) |
| Ei jatketa hoitamattomien velvoitteiden vuoksi | tämä dokumentti, kohta 4 |
| Oma poikkeuspäättymispäivä | `custrecord_gbb_oomi_exceptional_end_date` |
| Tietojen kelpoisuustarkistus lykätty | `mr_bike_data_validity_check.js:88` |

Kaikki 79 `custrecord_gbb_exceptional_end_date`-arvoa ovat OOMI-pyörillä.

---

## 8. Tarkistuskyselyt

Säännöistä osaa ei voi teknisesti pakottaa. Nämä kyselyt löytävät poikkeamat.

**Lunastettu ennen tunnistuspäivää** — tämän dokumentin tärkein mittari:

```sql
SELECT COUNT(*) FROM customrecord_sta_bike_register
WHERE custrecord_sta_bike_status = 2
  AND TRUNC(COALESCE(custrecord_gbb_exceptional_end_date,
                     custrecord_gbb_oomi_exceptional_end_date,
                     custrecord_sta_subsc_end_date), 'MM') > TRUNC(CURRENT_DATE)
```

> [!WARNING]
> **Tämän kyselyn aiempi versio oli ristiriidassa §3:n kanssa** ja korjattiin 21.09.2026. Se kuului:
>
> ```sql
> WHERE custrecord_sta_bike_status = 2 AND custrecord_sta_subsc_end_date > CURRENT_DATE
> ```
>
> Se mittasi "status 2 ennen päättymis**päivää**", mutta [§3](#3-tunnistuspäivä) sanoo että ankkuri
> on päättymiskuukauden **ensimmäinen päivä**. Kesken kuuta päättyvä pyörä saa siis olla lunastettu
> ennen päättymispäiväänsä — se on sääntö, ei poikkeama. Vanha kysely ei myöskään lukenut
> kumpaakaan poikkeuspäättymispäivää, vaikka §2 sanoo niiden ohittavan `subsc_end_date`:n.
>
> Ero ei ole teoreettinen. Kalenterisweepin ensimmäisen tuotantoajon jälkeen 21.09.2026 vanha
> kysely palautti **847** ja korjattu **4** — ja ne neljä olivat kaikki ajoa vanhempia. Vanha
> mittari olisi lukenut oikein toimivan järjestelmän katastrofaalisena regressiona.

**Velvoitteet hoidettu mutta merkintä puuttuu:**

```sql
SELECT id, name FROM customrecord_sta_bike_register
WHERE custrecord_gbb_redemption_paid_at IS NOT NULL
  AND custrecord_gbb_liab_settled_at IS NULL
```

**Kaksi päivämäärää jotka eivät saa erota (selvitystapa 1):**

```sql
SELECT id, name, custrecord_gbb_redemption_paid_at, custrecord_gbb_liab_settled_at
FROM customrecord_sta_bike_register
WHERE custrecord_gbb_liab_settle_method = 1
  AND custrecord_gbb_redemption_paid_at <> custrecord_gbb_liab_settled_at
  AND NVL(custrecord_sta_bike_order_type, 0) <> 3   -- OOMI rajataan pois, ADR 0009
```

Tulosta ei voi lukea suoraan virhemääränä. Myös ADR 0008 rajaa pois pyörät, joilla on Done-tilainen
tyypin 2 CR.

**Maksupäivä selvitystavalla jolla ei ole maksua:**

```sql
SELECT id, name FROM customrecord_sta_bike_register
WHERE custrecord_gbb_liab_settle_method <> 1
  AND custrecord_gbb_redemption_paid_at IS NOT NULL
```

**Takautuvan käsittelyn määrä** (ei virhe, mittari):

```sql
SELECT COUNT(*) FROM customrecord_sta_bike_register
WHERE custrecord_gbb_date_to_non_active > custrecord_gbb_ic_redemption_dt
```

**Selvitystapa kirjattu mutta päätöspäivä puuttuu** — ADR 0001:n riskin mittari:

```sql
SELECT COUNT(*) FROM customrecord_sta_bike_register
WHERE custrecord_gbb_liab_settle_method IS NOT NULL
  AND custrecord_gbb_redemption_decided_at IS NULL
  AND custrecord_gbb_date_to_non_active IS NULL
```

**Jumiin jäänyt lunastus sovittu** — tunnistuspäivä ohitettu, status ei vaihtunut:

```sql
SELECT id, name FROM customrecord_sta_bike_register
WHERE custrecord_gbb_liab_settle_method IS NOT NULL
  AND custrecord_sta_bike_status = 1
  AND COALESCE(custrecord_gbb_exceptional_end_date,
               custrecord_gbb_oomi_exceptional_end_date,
               custrecord_sta_subsc_end_date) < CURRENT_DATE
```

**`historical_unknown` Active-pyörällä** — ADR 0006:n väärinkäytön mittari, odotus **0**:

```sql
SELECT COUNT(*) FROM customrecord_sta_bike_register
WHERE custrecord_gbb_liab_settle_method = 8 AND custrecord_sta_bike_status = 1
```

**Päätöspäivä ilman selvitystapaa** — ADR 0004:n UE on leimannut väärään aikaan:

```sql
SELECT id, name FROM customrecord_sta_bike_register
WHERE custrecord_gbb_redemption_decided_at IS NOT NULL
  AND custrecord_gbb_liab_settle_method IS NULL
```

**Päättymisajankohta puuttuu vaikka lunastus on sovittu:**

```sql
SELECT id, name FROM customrecord_sta_bike_register
WHERE custrecord_gbb_liab_settle_method IS NOT NULL
  AND custrecord_sta_bike_status = 1
  AND COALESCE(custrecord_gbb_exceptional_end_date,
               custrecord_gbb_oomi_exceptional_end_date,
               custrecord_sta_subsc_end_date) IS NULL
```

---

## 9. Kauden lopun lunastus

Päätökset: [ADR 0009](adr/0009-kauden-lopun-lunastus.md). Käsite: [`CONTEXT.md`](../CONTEXT.md).

**Tunnistus.** Päättymisajankohta osuu kuluvaan kuukauteen, **eikä** pyörällä ole tyypin 2 tai 10
CR:ää tilassa 1 Pending tai 2 Done. OOMI-pyörillä ennen lokakuuta 2026 tehdyt Fleet-raportin
ennenaikaiset päivät (`oomi_exceptional_end_date`) luetaan edelleen päättymisajankohdaksi.

**Määräaika.** Velvoitteet on hoidettava päättymiskuun loppuun mennessä. Jos niitä ei ole hoidettu,
seuraavan kuun 1. päivänä alkaa jälkiveloitus (ei OOMI-pyörillä).

### Aikajana — muu kuin OOMI, kausi päättyy 15.10., maksu ajallaan

| Milloin | Mitä | Kuka |
|---|---|---|
| ~15.09. (30 pv ennen) | Paylink-linkki työntekijälle, eräpäivä 14 pv. Huoltobudjetti tai käsiraha kattaa → tapa 3/4 eikä linkkiä | `netstuite-send-end-redemption-payment-link` (1.10.2026 alkaen) |
| maksupäivä | `redemption_paid_at` = maksupäivä | status-sync 2.0, vaihe *Maksu* |
| 1.10. | tapa 1 ja `liab_settled_at` = maksupäivä (jos ei tyypin 2/10 CR:ää), status 2, `ic_redemption_dt` 31.10. — yksi kirjoitus | status-sync 2.0 |
| 1.10. → | IC-hinta lasketaan | IC-laskuri (D4) |
| ~2.10. | `date_to_non_active` = 1.10. | `customscript1458` |
| lokakuu | lokakuu laskutetaan ja raportoidaan normaalisti | laskutus, kuukausiraportointi |
| 1.11. | Ended-rivi RI:hin | kuukausiraportointi |
| lokakuun loppu | haku 797 → IC-lunastus | taloustiimi |
| 1.11., jos velvoitteita ei hoidettu | tyypin 7 CR → jälkiveloitus marraskuulta | `netsuite-subscription-extension` |

Etukäteen maksettu lunastus (esim. 20.09.) saa `paid_at`:n heti, mutta tavan 1 ja
`liab_settled_at`:n vasta 1.10. Siihen asti tyypin 2 CR ehtii voittaa (ADR 0008).

### `liab_settled_at` tavoittain

| Tapa | Arvo |
|---|---|
| 1 `redemption_paid` | maksupäivä (`closedate`, ei `trandate`) |
| 2 `redemption_extra_rent` | sen jälkiveloituslaskun maksupäivä, jolla kattavuus täyttyy |
| 3 `redemption_maint_budget`, 4 `redemption_down_payment` | päivä jona kattavuus todettiin |
| 1, OOMI ilman maksua | tunnistuspäivä |

`custrecord_gbb_redemption_decided_at`:ia **ei lueta** kauden lopun lunastuksessa mihinkään.

### Jälkiveloituksen kattavuus

```
Σ veroton (vuokra item 30 + toimisto- ja käsittelykulu item 31)
  maksetuilla, hyvittämättömillä laskuilla, jotka ovat syntyneet tämän pyörän tyypin 7 CR:istä
≥ custrecord_sta_end_redemption_price (netto)
```

Kun ehto täyttyy, kirjoitetaan tapa 2 ja `liab_settled_at`. Tunnistuspäivä on silloin jo mennyt,
joten status kääntyy samassa kirjoituksessa. Seuraavan kuun jälkiveloitusajo näkee statuksen 2 ja
ohittaa pyörän. Päättymisajankohta on viimeisen jatkokuukauden viimeinen päivä, ja
`ic_redemption_dt` seuraa sitä. Käsin laskutettuja jatkoja ei lasketa mukaan.

### OOMI-pyörä

| Kenttä | Arvo tunnistuspäivänä |
|---|---|
| `custrecord_gbb_liab_settle_method` | 1 `redemption_paid` |
| `custrecord_gbb_liab_settled_at` | tunnistuspäivä |
| `custrecord_gbb_redemption_paid_at` | tyhjä, ellei maksua ole jo havaittu |
| `custrecord_sta_bike_status` | 2 |
| `custrecord_gbb_ic_redemption_dt` | `LAST_DAY(päättymisajankohta)` |

Myöhässä saapuva maksu ei muuta mitään, ei edes `paid_at`:ia. OOMI-pyörä päättyy usein kesken kuun,
mutta tunnistuspäivä on silti päättymiskuun 1. päivä.

**Tarkistus — OOMI-pyörä, kausi päättynyt, ei selvitystapaa** (odotus 0):

```sql
SELECT id, name FROM customrecord_sta_bike_register
WHERE custrecord_sta_bike_order_type = 3 AND custrecord_sta_bike_status = 1
  AND custrecord_gbb_liab_settle_method IS NULL
  AND COALESCE(custrecord_gbb_exceptional_end_date, custrecord_gbb_oomi_exceptional_end_date,
               custrecord_sta_subsc_end_date) < TRUNC(CURRENT_DATE, 'MM')
```

24.09.2026: **34**, korjataan S4:llä ([`imports/2026-09-24-oomi-kauden-loppu/`](../imports/2026-09-24-oomi-kauden-loppu/README.md)).

---

### Sallittu poikkeama: tapa 1 ennen päättymiskuuta ilman `liab_settled_at`:ia (25.09.2026)

ADR 0009:n kohdan 4 mukaan tapa kirjoitetaan vasta päättymiskuussa. Vanha status-sync (osa A)
kirjoittaa kuitenkin tavan 1 heti maksun jälkeen 30.09.2026 asti. **Se ei ole korjattava virhe,
kun `liab_settled_at` on tyhjä.** Tuoteomistaja vahvisti 25.09.2026 pyöräkohtaisesti, että
lopputulos on silloin sama kuin säännön mukaan:

- **Keskenkauden lunastus, CR vielä luomatta** (maksu saapunut, asiakaspalvelu luo CR:n
  lokakuussa tai myöhemmin): sweep ei käännä pyörää ennen päättymiskuuta. Kun CR käsitellään,
  handler säilyttää tavan 1 ja kirjoittaa tyhjään `liab_settled_at`:iin CR:n luontipäivän
  (`handler_lunastus.js:348-360`, kentät suojattu erikseen). 25.09.: B005039, B015640,
  B035208 ja B036496.
- **Kauden lopun lunastus, maksu ajoissa**: sweep kääntää pyörän päättymiskuun 1. päivänä, koska
  `paid_at` on todiste (todennettu 25.09. B021648:lla). `liab_settled_at` = `paid_at` täytetään
  päättymiskuussa (status-sync 2.0, K1). 25.09.: B042831, B045266 ja B041552 (10/2026) sekä
  B038685 ja B044476 (11/2026).

**Korjattava** on vain tapaus, jossa ennen päättymiskuuta on kirjattu myös `liab_settled_at`, eikä
tyypin 2/10 CR:ää ole. Silloin kenttää ei voi enää korvata, ja se estäisi CR:n päivän (K4, 16
pyörää, tyhjennetty 24.09.). Auditointi ei raportoi yllä mainittua sallittua poikkeamaa §5-virheenä
eikä ennenaikaisena lunastuksena.

## 10. Keskenkauden lunastus

Päätökset: [ADR 0010](adr/0010-keskenkauden-lunastus.md) ja [ADR 0008](adr/0008-keskenkauden-lunastuksessa-cr-voittaa-maksun.md).
Toteutusvaatimukset: [`keskenkauden-lunastus-vaatimukset.md`](keskenkauden-lunastus-vaatimukset.md).

**Tunnistus.** Pyörällä on tyypin 2 CR tilassa Pending tai Done. Ilman CR:ää keskenkauden
lunastusta ei ole, vaikka maksu olisi tullut. Päätteet: ` - 2B` → tapa 6, `2C` → tapa 1, `2D` →
tapa 5 (status 3, rajattu ulos), `vakuutus` → tapa 7.

**CR on päätös ja todiste.** Asiakaspalvelijan luoma ja käsitelty CR riittää yksin todisteeksi
velvoitteiden hoitamisesta. Maksua ei odoteta. Perintä on taloustiimin asia.

### CR:n kentät

| CR:n kenttä | Rekisteriin / riveille | Huomio |
|---|---|---|
| `custrecord_cr_contract_official_end_date` | `custrecord_sta_subsc_end_date` | aina kuunloppu. Tyhjä → Needs Review. Myöhempi kuin nykyinen päättymisajankohta → Needs Review |
| `custrecord_cr_end_date_of_old_sub` | sopimusrivien `license_enddate` | laskutettu loppupäivä. Saa olla päättymisajankohtaa myöhempi takautuvassa lunastuksessa, eikä se ole virhe |
| `custrecord_cr_created_date` | `liab_settled_at` **ja** `redemption_decided_at` | tyhjä → Needs Review |
| `altname`-pääte | `liab_settle_method` | ks. yllä |

### Aikajana — eteenpäin katsova, CR luotu 10.09., virallinen loppu 31.12.

| Milloin | Mitä | Kuka |
|---|---|---|
| maksupäivä (jos maksu) | `redemption_paid_at`. Ei tapaa, ei `liab_settled_at`:ia | status-sync 2.0, vaihe *Maksu* |
| CR:n käsittely | `subsc_end_date` 31.12., tapa CR:n päätteestä, `liab_settled_at` = `decided_at` = 10.09., sopimusrivit `end_date_of_old_sub`:iin. Status **DEFERRED** | `handler_lunastus` |
| CR Done | Ended-RI, jonka raportointipäivä on 01.01. | monthly-reporting UE |
| 1.12. | status 2 | kalenterisweep |
| joulukuu | laskutetaan ja raportoidaan kokonaan | laskutus, kuukausiraportointi |
| status 2:n jälkeen | `ic_redemption_dt` 31.12. | status-sync 2.0 (syyskuussa CSV) |

### Takautuva — CR luotu 10.09., virallinen loppu 30.06., laskutettu 31.08. asti

| Mitä | Arvo |
|---|---|
| `subsc_end_date` | 30.06. |
| sopimusrivit | 31.08. (laskutettu) |
| hyvitys | tyypin 11 CR 01.07.–31.08. Tämä on ainoa hyvityspolku. `sta_redemption_date`:a ei aseteta |
| tunnistuspäivä, status 2 | CR:n käsittelypäivä (MAX(01.06., tänään)) |
| `ic_redemption_dt` | 30.06. (mennyt kausi, sallittu) |

### Needs Review -jono

Omistajat ovat taloustiimi ja asiakaspalvelu. **Määräaika on CR:n luontikuun loppu.** Niin kauan
kuin CR on jonossa, laskutus ja raportointi jatkuvat vanhalla päättymisajankohdalla.

### Tarkistuskyselyt

**Tyypin 2 CR Needs Review -tilassa, luontikuu päättynyt** (odotus 0):

```sql
SELECT cr.id, cr.altname, cr.custrecord_cr_created_date, cr.custrecord_cr_bike_registry
FROM customrecord_subscrption_change_request cr
WHERE cr.custrecord_cr_type = 2 AND cr.custrecord_cr_status = 6
  AND cr.custrecord_cr_created_date < TRUNC(CURRENT_DATE, 'MM')
```

24.09.2026: **0**.

**Tyypin 10 CR Pending yli 30 päivää** (odotus 0, pyörä odottaa ihmistä):

```sql
SELECT cr.id, cr.altname, cr.custrecord_cr_created_date, cr.custrecord_cr_bike_registry
FROM customrecord_subscrption_change_request cr
WHERE cr.custrecord_cr_type = 10 AND cr.custrecord_cr_status = 1
  AND cr.custrecord_cr_created_date < CURRENT_DATE - 30
```

24.09.2026: **1**.

**Staria-hyvityspolku laukaistu** (odotus 0; `sta_mr_mid_life_redemption` ei saa tehdä hyvityksiä):

```sql
SELECT id, name, custrecord_sta_redemption_date FROM customrecord_sta_bike_register
WHERE custrecord_sta_redemption_date IS NOT NULL
  AND NVL(custrecord_sta_redemption_cm_processed, 'F') = 'F'
```

24.09.2026: **1**, B031217 (`sta_redemption_date` 30.11.2025, status 2). Kahden tunnin välein
ajettava skripti ei ole ottanut sitä käsittelyyn, joten sen input rajaa pyörän jollain ehdolla
pois. Deploymentin poisto ajastuksesta poistaa riskin. Pyörä selvitetään erikseen.

**Päätöspäivä ≠ CR:n luontipäivä** (odotus 0 historiaimportin jälkeen):

```sql
SELECT br.id, br.name, br.custrecord_gbb_redemption_decided_at, MAX(cr.custrecord_cr_created_date) AS cr_created
FROM customrecord_sta_bike_register br
JOIN customrecord_subscrption_change_request cr ON cr.custrecord_cr_bike_registry = br.id
WHERE cr.custrecord_cr_type = 2 AND cr.custrecord_cr_status = 2
GROUP BY br.id, br.name, br.custrecord_gbb_redemption_decided_at
HAVING br.custrecord_gbb_redemption_decided_at IS NULL
    OR br.custrecord_gbb_redemption_decided_at <> MAX(cr.custrecord_cr_created_date)
```

24.09.2026 ennen importtia: **1 735**. Kaikki neljä kyselyä on ajettu NetSuitessa 24.09.

**Keskenkauden maksu ilman CR:ää:** menetelmä ja kyselyt ovat
[`../findings/2026-09-24-keskenkauden-maksu-ilman-cr.md`](../findings/2026-09-24-keskenkauden-maksu-ilman-cr.md):ssä.
24.09.: 19 Active-pyörää, jotka käsitellään yksitellen lokakuussa.

---

## Nykytilan poikkeamat

Mitattu NetSuitesta 18.09.2026. Yksityiskohdat ja pyöräkohtaiset listat:
[`../findings/2026-09-18-ennenaikainen-lunastusstatus.md`](../findings/2026-09-18-ennenaikainen-lunastusstatus.md).

| Poikkeama | Määrä | Korjataanko |
|---|---|---|
| Lunastettu, vuokrakausi yhä kesken | 189 | kyllä |
| Näistä raportoinnin suojan ulkopuolella | 10 | ensisijaisesti |
| Historiallisesti lunastettu ennen päättymistä | 3 278 | ei — kausi on jo ohi |
| `liab_settled_at` eroaa `paid_at`:sta selvitystavalla 1 | 53 | ei taannehtivasti |

**Säännöllä ei ole taannehtivaa voimaa siellä missä vuokrakausi on jo päättynyt.** Ne 3 278 ovat
mennyttä eikä niiden korjaaminen muuta mitään. Ne 189 vaikuttavat yhä tuleviin raportointiriveihin
ja laskutukseen, ja ne kuuluu korjata.

### Tunnetut sääntörikkomukset koodissa

| Rikkomus | Missä |
|---|---|
| Status kirjoitetaan CR:n ajohetkellä, ei tunnistuspäivänä | `netsuite-subscrption-cr-scripts`, `handler_lunastus.js:108` |
| `liab_settled_at` leimataan ajopäivällä | sama, `:199` |
| Keskenkauden lunastus putoaa maksupäivä-fallbackiin | `netsuite-bike-redemption-status-sync`, `gbb_ss_bike_redemption_status_sync.js:245`, `:256`, `:330` |
| Selvitystapaa ei kirjoiteta maksuvetoisella polulla | sama, `updateBikeRegister`, `:433` |
| Päättyminen päätellään `bike_status`-kentästä | `netsuite-monthly-reporting`, `mr_monthly_reporting_ri_creation.js:1004` |
| "Velvoitteet hoidettu" päätellään omasta datasta | `netsuite-subscription-extension`, `mr_subscription_extension.js:271-274` |

Korjaukset tehdään omistavissa repoissa niiden omilla konventioilla, ei täältä. Repokohtainen
muutoslista: [`lunastus-toteutussuunnitelma.md`](lunastus-toteutussuunnitelma.md).
