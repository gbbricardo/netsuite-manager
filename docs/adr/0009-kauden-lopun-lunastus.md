# ADR 0009 — Kauden lopun lunastus: määräaika, jälkiveloituksen päättyminen ja OOMI-takuu

- **Päivämäärä:** 2026-09-24
- **Tila:** Hyväksytty (tuoteomistaja, grilling-sessio 24.09.2026)
- **Osittain muutettu:** [ADR 0010](0010-keskenkauden-lunastus.md) kohta 8. `oomi_exceptional_end_date` ei ole lokakuusta 2026 alkaen päättymisajankohdan lähde. Kohdan 1 *"15 Active-pyörää käsitellään vanhalla tavalla"* on ADR 0010:n avoin D9.
- **Osittain muutettu:** [ADR 0012](0012-loppulunastushinta-ja-kattavuus.md) (6.10.2026). Kohdan 5 kattavuusehto
  on nyt *laskutetut pidennys-kuukaudet × 63,75 € ≥ hinta − huoltohyvitys*, eikä maksu ole ehto. Kohdan 3 tavan 2
  päivä on laskun luontipäivä.
- **Osittain muutettu:** [ADR 0015](0015-status-sync-2-tarkennukset.md) (7.10.2026). Kohta 6: myöhässä saapuva OOMI-maksu
  kirjoittaa `paid_at`:n (maksun fakta, ADR 0013 k. 8), mutta ei muuta tapaa eikä `liab_settled_at`:ia. Kohdan 5
  kuukaudet lasketaan Done-tilaisista pidennys-CR:istä, ja päivä on rajan ylittäneen CR:n sulkemispäivä.
- **Koskee:** vain **kauden lopun lunastusta** ([CONTEXT.md](../../CONTEXT.md)). Keskenkauden
  lunastus jatkuu ADR 0008:n mukaan.
- **Tarkentaa:** [ADR 0004](0004-paatospaivan-kirjoittaa-ue.md) (ei koske kauden loppua),
  [ADR 0007](0007-status-sync-2-tasmaytysajo.md) vaihe 1 (uusi kattavuustarkistus ja
  kuukausiehto), [ADR 0008](0008-keskenkauden-lunastuksessa-cr-voittaa-maksun.md) (**ratkaisee D7:n
  ja D8:n**)
- **Kenttätaso:** [kenttäsäännöt § 9](../lunastuksen-kenttasaannot.md#9-kauden-lopun-lunastus)

## Konteksti

Kenttäsäännöt kirjoitettiin keskenkauden lunastusta varten. Kauden lopun lunastus nojasi
oletuksiin, joita kukaan ei ollut vahvistanut: mikä sen erottaa keskenkauden lunastuksesta, mikä
päivä kuuluu kenttään `liab_settled_at` maksuttomilla tavoilla, milloin jälkiveloitus loppuu ja mitä
OOMI-pyörälle tapahtuu, jos maksua ei tule. Mitattuna 24.09.2026: 34 OOMI-pyörää, joiden kausi
päättyi heinä–elokuussa, on yhä Active ilman selvitystapaa, eikä mikään automaatio koskaan käsittele
niitä.

## Päätökset

### 1. Tunnistus perustuu muutospyyntöön, ei maksuun eikä SO-tyyppiin

Pyörä on kauden lopun lunastus, kun päättymisajankohta osuu kuluvaan kuukauteen **eikä** pyörällä ole
tyypin **2 tai 10** muutospyyntöä tilassa **Pending tai Done**. Error- tai Cancelled-tilainen CR ei
tee lunastuksesta ennenaikaista.

OOMI-pyörillä syyskuuhun 2026 asti tehdyt ennenaikaiset päättymiset tulivat Oomi Fleet -raportilta
(`oomi_exceptional_end_date`, käsin CSV:llä). **Lokakuusta 2026 alkaen OOMI-pyörän ennenaikainen
päättyminen tehdään muutospyynnöllä**, eikä `oomi_exceptional_end_date`:a käytetä enää päätöksiin.
Historiaa ei korjata. 15 Active-pyörää, joilla on jo Fleet-raportin ennenaikainen päivä, käsitellään
vanhalla tavalla: kirjaston COALESCE lukee niiden päättymisajankohdaksi `oomi_exceptional_end_date`:n.
Tämä ratkaisee ADR 0008:n **D8:n**: `oomi_exceptional_end_date` kelpaa CR:n veroiseksi vain
historiassa.

### 2. Määräaika on päättymiskuun loppu, ja päivällä kuun sisällä ei ole merkitystä

Velvoitteiden on oltava hoidettu päättymiskuun loppuun mennessä. Jos ne on hoidettu, pyörä merkitään
Redeemed-tilaan tunnistuspäivänä (päättymiskuun 1. päivänä tai ensimmäisessä onnistuneessa ajossa
sen jälkeen). Jos niitä ei ole hoidettu, seuraavan kuun 1. päivänä alkaa jälkiveloitus (ei
OOMI-pyörillä). Sillä, minä päivänä velvoite kuun sisällä hoidettiin tai mikä skripti sen totesi, ei
ole merkitystä.

Päättymiskuu laskutetaan ja raportoidaan normaalisti, vaikka status on jo 2 (sopimusankkuri,
ADR 0002).

### 3. `liab_settled_at` täytetään kaikilla tavoilla; päätöspäivää ei lueta

| Tapa | `liab_settled_at` |
|---|---|
| 1 `redemption_paid` | maksupäivä |
| 2 `redemption_extra_rent` | sen jälkiveloituslaskun maksupäivä, jolla kattavuus täyttyy (kohta 5) |
| 3 `redemption_maint_budget`, 4 `redemption_down_payment` | päivä jona kattavuus todettiin. Maksulinkkiskriptin ajopäivä kelpaa |
| 1, OOMI ilman maksua | tunnistuspäivä (kohta 6) |

**ADR 0004:n sääntö** *"maksuttomilla tavoilla `liab_settled_at` jää tyhjäksi ja päivä luetaan
`decided_at`:sta"* **ei koske kauden lopun lunastusta.** Kauden lopun lunastuksessa
`custrecord_gbb_redemption_decided_at`:lla ei ole liiketoiminnallista merkitystä, eikä mikään sääntö
saa lukea sitä. UE saa leimata sen edelleen: se kertoo vain, milloin automaatio havaitsi
velvoitteen hoidetuksi.

### 4. Etukäteen maksettu lunastus saa selvitystavan vasta päättymiskuussa (ratkaisee D7:n)

Maksuvaihe kirjoittaa `redemption_paid_at`:n heti, kun maksu havaitaan. **Selvitystavan 1 ja
`liab_settled_at`:n se kirjoittaa vasta, kun päättymiskuu on alkanut, ja vain jos kohdan 1 mukaista
CR:ää ei ole.** Kauden lopun lunastuksessa tämä ei muuta mitään, koska tunnistuspäivä on joka
tapauksessa päättymiskuun 1. päivä ja status kääntyy samana päivänä. Keskenkauden lunastuksessa
CR ehtii voittaa (ADR 0008), eikä pelkkä maksu jätä pyörälle väärää write-once-tapaa.

Tämä on ADR 0008:n vaihtoehto 3. Muita vaihtoehtoja ei tarvita, koska tunnistus ei perustu
arvaukseen maksun ja päättymisen välisestä etäisyydestä.

### 5. Jälkiveloitus päättyy automaattisesti, kun ylimääräiset vuokrat kattavat lunastusmaksun

Jälkiveloitus siirtää päättymisajankohtaa kuukausi kerrallaan, joten tunnistuspäivä ja IC-kausi
seuraavat sitä kuukautta, jona velvoitteet lopulta hoidettiin. **IC-kausi on aina se kuukausi, jona
sopimus päättyy**, ei alkuperäinen `subsc_org_end_date`.

Kattavuusehto:

```
Σ veroton summa (vuokra + toimisto- ja käsittelykulu)
  maksetuilla, hyvittämättömillä laskuilla, jotka ovat syntyneet tämän pyörän tyypin 7 CR:istä
≥ custrecord_sta_end_redemption_price (netto)
```

Kun ehto täyttyy, kirjoitetaan tapa 2 ja `liab_settled_at` = rajan ylittävän laskun maksupäivä.
Tarkistuksen omistaa **status-sync 2.0** (vaihe *Maksu*). Mukaan lasketaan vain CR-linkitetyt
laskut. Kun joku tekee jälkiveloituksen käsin, hänen on tehtävä myös kattavuustarkistus.

Jatko noudattaa sopimusta. Jos asiakas maksaa myöhässä ja jo laskutettu kuukausi jää
tarpeettomaksi, siitä ei tehdä automaattisesti mitään. Se on asiakkaan ja taloustiimin välinen asia.

### 6. OOMI-pyörä merkitään lunastetuksi päättymiskuussa ilman maksua

Oomin kanssa on sovittu, että GoByBike veloittaa Oomilta maksamattomat lunastusmaksut. Siksi
OOMI-pyörän velvoitteet katsotaan hoidetuiksi tunnistuspäivänä:

| Kenttä | Arvo |
|---|---|
| `liab_settle_method` | 1 `redemption_paid` |
| `liab_settled_at` | tunnistuspäivä |
| `redemption_paid_at` | tyhjä, ellei maksua ole jo havaittu |
| `bike_status` | 2 |
| `ic_redemption_dt` | `LAST_DAY(päättymisajankohta)` |

Myöhässä saapuva maksu **ei muuta mitään**, ei edes `paid_at`:ia. OOMI-pyöriä ei jälkiveloiteta.
§5-tarkistus (`paid_at` ≠ `liab_settled_at` tavalla 1) rajaa OOMI-pyörät pois.

Tapa 1 valittiin uuden arvon (esim. `oomi_term_end`) sijaan, koska se kuvaa sopimuksen mukaista
tilannetta: lunastusmaksu maksetaan, ja maksajana on tarvittaessa Oomi.

### 7. Rajaus

Palautus kauden lopussa (status 3) on harvinainen ja tehdään käsin. Se ei kuulu tähän. Kesken kauden
palautus tehdään muutospyynnöllä.

## Seuraukset

- **S4 (syyskuu, CSV):** 34 jumissa olevaa OOMI-pyörää saavat tavan 1 ja `liab_settled_at`:n
  ([`imports/2026-09-24-oomi-kauden-loppu/`](../../imports/2026-09-24-oomi-kauden-loppu/README.md)).
  Sweep kääntää ne, ja S3 antaa IC-päivät heinä- ja elokuulle.
- **Status-sync 2.0** saa kaksi uutta vastuuta: jälkiveloituksen kattavuustarkistuksen (kohta 5) ja
  OOMI-haaran (kohta 6). Lisäksi maksuvaiheeseen tulee kuukausiehto (kohta 4). Kaikki kolme
  kuuluvat lokakuun käyttöönottoon, ellei toisin päätetä.
- **S1:n 16 CR:tön pyörää**, joiden kausi päättyy 10/2026–2029, saivat 23.09. tavan 1 ja
  `liab_settled_at`:n ennen päättymiskuuta. Se on kohdan 4 vastaista. Pyörät ovat
  *lunastus sovittu* -tilassa, joten ne kääntyvät päättymiskuussaan, vaikka CR:ää ei tulisi.
  **Päätetty 24.09.:** tapa ja `liab_settled_at` tyhjennetään CSV:llä, ja `paid_at` jää
  ([`imports/2026-09-24-s1-ennenaikainen-tapa/`](../../imports/2026-09-24-s1-ennenaikainen-tapa/README.md)).
- **Kirjasto:** kuukausiehto, OOMI-haara ja kattavuusehto ovat sääntöjä, joten ne kuuluvat
  `gbb_lunastus_lib`:iin eivätkä skriptiin. Tämän toteutus kuuluu omistavaan repoon.
- **Sisarrepo `netstuite-send-end-redemption-payment-link`:** sen 23.09. päätös (tapa 3/4,
  `liab_settled_at` = ajopäivä) on tämän ADR:n mukainen, joten muutosta ei tarvita. Tapa 4
  `redemption_down_payment` on nyt myös kenttäsääntöjen taulukossa.

## Todennettu vs. päätelty

**Tuoteomistajalta 24.09.2026:** kaikki päätökset 1–7.
**Todennettu NetSuitesta 24.09.2026:**
- 34 jumissa olevaa OOMI-pyörää
- 15 Active OOMI-pyörää, joilla `oomi_exceptional_end_date` < `subsc_end_date`
- seuraavan neljän kuukauden aikana kesken kuun päättyy vain OOMI-pyöriä (679 OOMI, 0 muita)
- muut kuin OOMI-pyörät päättyvät aina kuun viimeisenä päivänä, joten jälkiveloituksen haku
  *päättynyt eilen* ajettuna 1. päivänä ei jätä niitä väliin

**Todennettu koodista:**
- `onkoVelvoitteetHoidettu` hyväksyy `liab_settled_at`:n todisteeksi (`gbb_lunastus_lib.js:305-327`)
- `handler_jalki` siirtää `subsc_end_date`:n CR:n loppupäivään (`handler_jalki.js:153-160`)
- IC-laskurin hinta on jäännösarvo, kun laskuttamattomia kuukausia on ≤ 0
  (`gbb_ic_redemption_calculator.js:166-190`)
