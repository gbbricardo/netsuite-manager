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

| | |
|---|---|
| **Arvo** | aikaisin todiste siitä että velvoitteet on hoidettu |
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
| 5 | `bike_returned` | 3 | 178 *(rajattu ulos)* |
| 6 | `bike_sold_to_competitor` | 2 | 16 |
| 7 | `bike_stolen_or_destroyed` | 2 | 122 |

Selvitystapa määrää kohdestatuksen yksikäsitteisesti: **5 → 3, kaikki muut → 2.** Poikkeuksia on
kolme 11 000:sta. Kohdestatusta ei siis tarvitse päätellä CR:n nimestä.

Selvitystavan kirjaaminen on se tapahtuma joka siirtää pyörän tilaan 2 — se ei saa yksin vaihtaa
statusta.

> Tämän kentän kirjoittaa tänään vain CR-käsittely. Maksuvetoinen automaatio ei kirjoita sitä
> lainkaan, mikä tarkoittaa että sen käsittelemät pyörät eivät ole tunnistettavissa tilaan 2. Tämä
> on korjattava samalla kun statuksen kirjoitus siirretään tunnistuspäivään — muuten muutos vaihtaa
> liian aikaisen päättymisen siihen ettei päättymistä tule lainkaan.

### `custrecord_gbb_redemption_decided_at`

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
| **Omistaja** | CSV-import (ei yhtään kirjoittajaa koodissa) |

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
```

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
