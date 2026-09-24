# Hyvityslasku (Credit Memo) — CSV-import -määrittely

Tämä tiedosto kertoo, millaisen CSV:n agentti saa tuottaa, kun NetSuiteen luodaan hyvityslaskuja
**CSV Import** -työkalulla. Sarakerivi on tiedostossa
[`hyvityslasku-creditmemo.csv`](hyvityslasku-creditmemo.csv), yhden hyvityslaskun mittainen
esimerkki tiedostossa
[`hyvityslasku-creditmemo-esimerkki.csv`](hyvityslasku-creditmemo-esimerkki.csv).

> [!IMPORTANT]
> **Hyvityslasku lähtee asiakkaalle.** Kaikki 330 tällä muodolla luotua hyvityslaskua on
> verkkolaskutettu (`custbody_sta_einvoicing_send_confirmed = T`, 330/330), niille on muodostunut
> viitenumero (330/330) ja Starian uudelleenluokittelutosite (330/330). Tämä ei ole hiljainen
> rekisteripäivitys kuten `imports/`-kansion importit — väärä rivi on väärä lasku asiakkaalle.
> Pyydä käyttäjältä hyväksyntä ennen ajoa, aina.

## Todistusaineisto

Muoto on **käänteismallinnettu tuotannossa läpi menneestä ajosta**, ei NetSuiten dokumentaatiosta.
Lähde: `Hyvityslaskut Oomi 06-2026 - FINAL.csv`, 6 136 riviä / 330 hyvityslaskua, ajettu 05.06.2026.

> [!NOTE]
> **Ajo meni läpi, mutta sen ALV-tulkinta ja muutama sarakearvo olivat väärin.** Rakenne, kentät ja
> asetukset on otettu siitä; säännöt sarakkeille **4, 5, 6, 14, 20 ja 21** tulevat käyttäjältä ja
> **poikkeavat lähdetiedostosta**. Erot on merkitty sarakkeittain alla. Lisäksi sarake 17
> (`Bike id`) ei ollut lähdetiedostossa lainkaan.

Todennettu NetSuitea vasten 23.09.2026:

| | CSV | NetSuite |
|---|---|---|
| Hyvityslaskuja | 330 | **330** (`recordtype = 'creditmemo'`, `externalid LIKE 'CR1626-%'`) |
| Rivejä, item 30 (Vuokra) | 5 806 | **5 806** |
| Rivejä, item 31 (Toimistomaksu) | 330 | **330** |
| Item 30 netto yhteensä | 547 096,76 (brutto / 1,255) | **547 096,90** |
| Item 31 netto yhteensä | 68 764,43 (brutto / 1,255) | **68 764,42** |
| `originator` | — | `CSV` |

Erot 0,14 € ja 0,01 € ovat rivikohtaista 2 desimaalin pyöristystä 6 136 rivillä, eivät virhe.

Yksittäisen tietueen kenttätason todennus tehtiin hyvityslaskuista **519288** (`CR1626-4420`) ja
**519299** (`CR1626-103939`) `ns_getRecord`-kutsulla. Kaikki alla *todennettu*-merkityt
kenttätunnukset ovat näiden tietueiden vastauksesta.

## Tiedostomuoto

| | |
|---|---|
| Merkistö | **UTF-8 BOM:in kanssa** (`EF BB BF`) — ä ja ö esiintyvät kuvauksissa ja kustannuspaikoissa |
| Rivinvaihto | CRLF |
| Kenttäerotin | `;` |
| Desimaalierotin | **pilkku** (`80,64542`) |
| Tuhaterotin | **ei yhtään** — `6697,94914`, ei `6.697,94914` |
| Lainausmerkit | ei yhtään — lähdetiedostossa 0 kpl |
| Päivämäärä | `DD.MM.YYYY`. Etunollat ovat valinnaiset: lähdetiedoston `3.6.2026` meni läpi |
| Kappalemäärä | kokonaisluku ilman desimaaleja |

Nämä eivät ole tiedoston ominaisuuksia vaan **sopimus käyttäjän NetSuite-asetusten kanssa** — ks.
§ *Käyttäjän formatointiasetukset*. Jos asetukset ja tiedosto eivät täsmää, import joko kaatuu tai,
pahemmassa tapauksessa, lukee luvut ja päivät väärin ilman virhettä.

> [!WARNING]
> **Kustannuspaikka on asiakkaan syöttämää vapaata tekstiä** (2 741 eri arvoa: `Turku`,
> `004201.3051`, `Sivistystoimiala: varhaiskasvatus`, `wpd construction Finland Oy`). Jos arvo
> sisältää `;`- tai `"`-merkin, lainaa kenttä RFC 4180 -sääntöjen mukaan **tai** hylkää rivi ja
> raportoi se. Älä poista merkkiä hiljaisesti — kustannuspaikka menee asiakkaan laskulle.

## Sarakkeet

**Taso** kertoo, onko arvo hyvityslaskun otsikkotietoa (*runko*, sarakkeet 1–17) vai
hyvityslaskun item-rivin tietoa (*rivi*, sarakkeet 18–26).

> [!IMPORTANT]
> **Jos hyvityslaskulla on useita item-rivejä, kaikkien 17 runkosarakkeen on täsmättävä näillä
> riveillä.** Poikkeava arvo rungossa tarkoittaa CSV-importille joko eri hyvityslaskua tai
> ristiriitaa. Vain sarakkeet 18–26 saavat vaihdella rivien välillä.

| # | Sarake | Taso | NetSuite-kenttä | Sääntö | Näyttö |
|---|---|---|---|---|---|
| 1 | `ORIGIN INVOICE EXTERNAL ID` | runko | Apply-alilista, hyvitettävä lasku | Hyvitettävän laskun **External ID** (esim. `1626-4420`). Hyvityslasku kohdistuu tähän laskuun. | kohdistus todennettu, mappaus **varmistettava** — ks. § *Mitä ei ole todennettu* |
| 2 | `External ID` | runko | `externalId` | `'CR'` + sarake 1. Erottaa hyvityslaskut toisistaan — **tämä on ryhmittelyavain**. | todennettu |
| 3 | `Invoice #` | runko | `tranId` | **Jätä tyhjäksi.** NetSuite numeroi itse (`CRMGBF…`). | todennettu (tyhjä 6 136/6 136) |
| 4 | `TEXT FOR INVOICE` | runko | `custbodycustbody_sta_textforinvoice` | **Vapaa teksti, sovitaan tapauskohtaisesti käyttäjän kanssa.** Näkyy asiakkaan laskulla, joten älä keksi sitä itse. Yleisin muoto on `Hyvittää laskua nro <hyvitettävän laskun tranid>`, esim. `Hyvittää laskua nro INVGBF1030395` — käytä sitä oletuksena ja kysy, jos tapaus on muu. Kenttätunnuksen kaksinkertainen `custbody`-etuliite on oikein. | todennettu |
| 5 | `Invoice Ref. No.` | runko | `custbody_fin_invoicereferencenumber` | **Jätä aina tyhjäksi**, jotta NetSuite muodostaa viitenumeron itse. Ei poikkeuksia. | todennettu (tyhjä 6 136/6 136; 330/330 sai viitenumeron) |
| 6 | `Do not trigger invoice ref number` | runko | `custbody_sta_loc_no_refno` | **Aina `FALSE`.** `TRUE` tarkoittaa *"viitenumero on jo olemassa, älä luo"* — silloin viitenumero pitäisi antaa sarakkeessa 5, mitä ei tehdä. Lähdetiedostossa arvo oli virheellisesti `TRUE`; se ei mennyt läpi (330/330 sai `F`:n ja viitenumeron), mutta älä toista sitä. | todennettu |
| 7 | `Customer` | runko | `entity` | Asiakkaan **internal id** (`4420`). Lähdetiedostossa sama kuin sarakkeen 1 loppuosa, koska laskun External ID on muotoa `<ajo>-<asiakas>` — **älä silti johda sitä siitä**, vaan ota asiakas laskulta. | todennettu |
| 8 | `Subsidiary` | runko | `subsidiary` | `2` = Gobybike Finance Oy. | todennettu |
| 9 | `Memo main` | runko | `memo` | **Jätä tyhjäksi.** | todennettu (tyhjä 6 136/6 136) |
| 10 | `Date` | runko | `tranDate` | Hyvityslaskun päivä. Määrää kirjauskauden (`postingPeriod`). | todennettu |
| 11 | `Due Date` | runko | `dueDate` | **Jätä tyhjäksi** — johdetaan maksuehdosta. | todennettu (tyhjä 6 136/6 136) |
| 12 | `Currency` | runko | `currency` | `EUR`. | todennettu |
| 13 | `Exchange Rate` | runko | `exchangeRate` | `1`. | todennettu |
| 14 | `Account` | runko | `account` | **`119`** = internal id, tili *1701 Accounts Receivable*. Lähdetiedostossa luki `1701`, joka on saman tilin **numero** — ks. § *Kaikki tietueviittaukset internal id:llä*. | todennettu (tili), arvo **muutettu** internal id:ksi |
| 15 | `[STA] EXCLUDE FROM REMINDER` | runko | `custbody_sta_exclude_from_rem` | `No`. Luoduista 330:sta `T`-arvoisia **0**. | todennettu |
| 16 | `Invoice is sent` | runko | `custbody_sta_email_sent` | `No`. | todennettu |
| 17 | `Bike id` | runko | `custbody_sta_bike_id` | **Pyörärekisterin internal id** (esim. `35268`), select → `customrecord_sta_bike_register`. Täytä, kun hyvityslasku koskee yhtä pyörää; jätä tyhjäksi, kun se kattaa useita. Kenttä on runkotasolla, joten **yhdelle hyvityslaskulle mahtuu vain yksi pyörä**. | todennettu |
| 18 | `Item` | rivi | rivin `item` | `31` = *Toimisto- ja käskulu / Admin fee subs*, `30` = *Vuokra - Rent subs*. Muita ei tässä muodossa esiinny. | todennettu |
| 19 | `Description` | rivi | rivin `description` | Muoto A: item 31 `Toimistomaksu <N> pyörää`, item 30 `Vuokrakausi <alku>-<loppu>`. Muoto B: **molemmat nimeävät kuukauden**, `Toimistomaksu <alku>-<loppu>` / `Vuokrakausi <alku>-<loppu>`. Päivät `d.m.yyyy`. Ks. § *Rivirakenne*. | todennettu |
| 20 | `Unit price` | rivi | **`Credit Memo → Items → Rate`** | **Aina yhden kappaleen nettohinta (ALV 0)**, enintään 5 desimaalia. Ks. § *Netto, brutto ja 06/2026:n ansa*. | todennettu |
| 21 | `Gross Amt` | rivi | rivin **Gross Amount** (sis. ALV) | **`Unit price × Quantity × 1,255`** — koko rivin **bruttosumma**, aina. Ei koskaan sama luku kuin `Unit price`, paitsi jos rivin ALV olisi 0. | sääntö käyttäjältä |
| 22 | `Quantity` | rivi | rivin `quantity` | Positiivinen kokonaisluku. Hyvityslaskulla **ei negatiivinen** — etumerkin hoitaa tietuetyyppi. | todennettu |
| 23 | `Enduser cost center` | rivi | `custcol_sta_endusercostcenter`, otsikko **"End user cost center"** | Vapaa teksti, **rivikohtainen**. Kun hyvitys peilaa olemassa olevaa tositetta, kopioi arvo **jokaiselle riville siltä lähderiviltä**, myös item 31:lle. Tyhjä on sallittu vain jos lähderivikin on tyhjä. **Ei ole tietueviittaus** — ks. varoitus alla. | todennettu |
| 24 | `Tax Code` | rivi | rivin `taxCode` | `6` = *VAT:S-FI 25.5%* (internal id). | todennettu |
| 25 | `RevRec start date` | rivi | `custcol_sta_so_revrec_start` | Hyvitettävän kauden alku. | todennettu |
| 26 | `RevRec end date` | rivi | `custcol_sta_so_revrec_end` | Hyvitettävän kauden loppu. | todennettu |

Sarakkeiden järjestys on vapaa — CSV Import tunnistaa ne otsikkorivin nimestä — mutta käytä yllä
olevaa järjestystä, jotta tallennettu mappaus kelpaa sellaisenaan.

### Kaikki tietueviittaukset internal id:llä

> [!IMPORTANT]
> **Jokainen sarake, joka osoittaa toiseen NetSuite-tietueeseen, kirjoitetaan internal id:nä.**
> Ei nimeä, ei koodia, ei näyttöarvoa. Mappauksen reference type on vastaavasti **Internal ID**.
> Nimihaku on epädeterministinen: se kaatuu duplikaattinimiin ja osuu hiljaisesti väärään
> tietueeseen, jos nimi on muuttunut.

| Sarake | Arvo | Mihin viittaa |
|---|---|---|
| `Customer` | `4420` | `customer` |
| `Subsidiary` | `2` | `subsidiary` — Gobybike Finance Oy |
| `Account` | `119` | `account` — *1701 Accounts Receivable* |
| `Bike id` | `35268` | `customrecord_sta_bike_register` — pyörä B035268 |
| `Item` | `30` / `31` | `item` — Vuokra / Toimisto- ja käsittelykulu |
| `Tax Code` | `6` | `salestaxitem` — VAT:S-FI 25,5 % |

Poikkeuksia sääntöön on kaksi, eivätkä ne ole tietueviittauksia vaan tekstiavaimia:
`ORIGIN INVOICE EXTERNAL ID` (laskun External ID) ja `External ID` (hyvityslaskun oma).

> [!WARNING]
> **`Account` on ainoa sarake, jossa tämä sääntö muuttaa arvoa lähdetiedostoon nähden.**
> Kesäkuun ajossa sarakkeessa luki `1701`, joka on tilin **numero**; saman tilin internal id on
> **119**. Molemmat tunnistavat saman tilin, mutta vain toinen kelpaa kulloisellekin reference
> typelle. Tilinumeroa `119` tai internal id:tä `1701` ei ole olemassa, joten väärä yhdistelmä
> kaatuu näkyvään virheeseen eikä osu väärään tiliin — **tarkista silti mappauksen reference type
> ennen ajoa.**

Sarakkeet `Enduser cost center` ja `TEXT FOR INVOICE` ovat vapaata tekstiä, eivät viittauksia.
`Enduser cost center` erityisesti **näyttää** usein koodilta (`004201.3051`, `1703`) mutta ei
osoita mihinkään tietueeseen — se menee laskulle sellaisenaan.

### Yhden pyörän hyvityslasku

Kun hyvitys koskee yhtä pyörää, `Bike id` täytetään ja hyvityslaskulla on **kaksi riviä jokaista
hyvitettävää kuukautta kohti** (vuokra + toimistomaksu). Rakennettu esimerkki, ei tuotantorivi:

```
…;No;No;35268;30;Vuokrakausi 1.10.2026-31.10.2026;80,64542;101,21;1;Turku;6;1.10.2026;31.10.2026
…;No;No;35268;31;Toimistomaksu 1.10.2026-31.10.2026;11,95219;15,00000;1;Turku;6;1.10.2026;31.10.2026
```

`80,64542 × 1 × 1,255 = 101,21` ja `11,95219 × 1 × 1,255 = 15,00`. `Unit price` on netto,
`Gross Amt` brutto — ne eivät ole sama luku.

Molemmilla riveillä on oltava **sama** `Bike id` ja sama runko — se on yksi hyvityslasku. Myös
`Enduser cost center` kuuluu molemmille riveille, ja `Description` nimeää kuukauden kummallakin.
Säännöt ovat § *Rivirakenne* muoto **B**.

## Rivirakenne

Yksi hyvityslasku = yksi `External ID` = N peräkkäistä riviä. **Pidä saman hyvityslaskun rivit
peräkkäin** — CSV Import ryhmittelee ne tässä järjestyksessä.

Rivirakenteita on **kaksi**, eivätkä toisen säännöt päde toiseen. Valitse kumpi on kyseessä ennen
kuin rakennat aineiston.

### A — Massahyvitys: yksi hyvityslasku per asiakas, monta pyörää

Kesäkuun 2026 muoto. `Bike id` jää tyhjäksi.

| Sääntö | Lähdetiedostossa |
|---|---|
| Tasan yksi item 31 -rivi hyvityslaskua kohti | 330/330 |
| Item 31 -rivi on **ensimmäinen** | 330/330 |
| Item 31:n `Quantity` = pyörien määrä = kuvauksen `<N>` = item 30 -rivien `Quantity`-summa | 330/330 |
| Item 30: yksi rivi per (kustannuspaikka, yksikköhinta) | 5 806 riviä; mediaani 5 riviä per hyvityslasku, suurin 738 |

Kaksi eri pyörää **samalla** kustannuspaikalla mutta eri hinnalla ovat eri rivejä; sama
kustannuspaikka esiintyy saman hyvityslaskun useammalla rivillä 828 kertaa. Se on oikein, ei
duplikaatti.

### B — Pyöräkohtainen hyvitys: yksi hyvityslasku per pyörä, rivit per kuukausi

`handler_hyvitys.js`:n muoto, ja se johon myös CSV-korjaukset rakennetaan. `Bike id` täytetään.

| Sääntö | |
|---|---|
| **Yksi item 30 -rivi ja yksi item 31 -rivi jokaista hyvitettävää kuukautta kohti** | kolmen kuukauden hyvitys = 6 riviä |
| `Quantity` on aina **1** | hinta on kuukausihinta, ei kerrottava |
| Kuukausi tunnistetaan `RevRec start/end` -päivistä | `Description`in on kerrottava sama kuukausi |
| `Enduser cost center` kopioidaan **molemmille** riveille lähderiviltä | ei tyhjää item 31:llä |

> [!WARNING]
> **Muodossa B item 31 -rivejä on yhtä monta kuin kuukausia, eikä `Quantity` kerro pyörien määrää.**
> Muodon A säännöt "tasan yksi item 31 -rivi" ja "item 31:n `Quantity` = pyörien määrä" **eivät
> päde** tähän — niiden soveltaminen tuottaa väärän aineiston.
>
> Koska rivit erottaa toisistaan vain kuukausi, **`Description`in on nimettävä kuukausi kummallakin
> itemillä** — muuten asiakkaan laskulla on kaksi identtistä riviä samalla tekstillä ja summalla,
> eikä hyvityksen kohdekuukausi näy mistään. `handler_hyvitys` kirjoittaa molemmille riveille
> `Vuokrakausi <alku> - <loppu>`; teksti `Toimistomaksu 1 pyörää` ei kelpaa monen kuukauden
> hyvityksellä.

## Netto, brutto ja 06/2026:n ansa

Rivillä on **kaksi lukua, joiden on oltava eri suuret**:

| Sarake | Kohdekenttä | Arvo |
|---|---|---|
| `Unit price` | `Credit Memo → Items → Rate` | **yhden kappaleen nettohinta (ALV 0)** |
| `Gross Amt` | rivin **Gross Amount** | **koko rivin bruttosumma** = `Unit price × Quantity × 1,255` |
| `Tax Code` | rivin `taxCode` | `6` = VAT:S-FI 25,5 % — määrää kertoimen |

NetSuiten oma laskenta rivillä:

```
amount   = grossAmt / 1,255   ≈ ROUND(rate × quantity, 2)     rivin nettosumma
tax1Amt  = grossAmt − amount
```

Todennettu hyvityslaskusta **725787** (`CRMGBF0003686`, 04.09.2026):

| item | `rate` | `quantity` | `amount` (netto) | `grossAmt` | `tax1Amt` |
|---|---|---|---|---|---|
| 31 Toimistomaksu | 10,0797 | 1 | **10,08** | **12,65** | 2,57 |
| 30 Vuokra | 79,6813 | 1 | **79,68** | **100,00** | 20,32 |

`10,0797 × 1,255 = 12,65` ja `79,6813 × 1,255 = 100,00`. Näin rivin kuuluu näyttää.

Nettohinnat tulevat sellaisenaan sopimusriviltä (`custrecord_sta_ca_row_price_month`) ja
pyörärekisterin `curr_subs_*` / `init_subs_*` -maksuista, jotka ovat kaikki nettoja nimistään
huolimatta (juuren `CLAUDE.md` § *"Gross" field that holds net*). Ne menevät **sellaisenaan**
`Unit price` -sarakkeeseen; kerroin 1,255 käytetään vain `Gross Amt` -saraketta laskettaessa.

> [!CAUTION]
> **`Unit price` ja `Gross Amt` eivät saa olla sama luku.** Jos ovat, rivi väittää ALV:n olevan
> nolla. NetSuite ei hylkää sitä — se uskoo `Gross Amt`-saraketta ja laskee netoksi
> `Gross Amt / 1,255`, jolloin **hyvitys jää 20,3 % vajaaksi täysin hiljaa**. Ainoa tilanne, jossa
> luvut saavat olla yhtä suuret, on `Unit price = 0`.

### Näin kävi 06/2026:lle

Lähdetiedostossa kummassakin sarakkeessa oli sama luku, eli `Gross Amt` oli jäänyt korottamatta.
Hyvityslasku 519288, item 31 — `Unit price` oli 12,9004, mutta netoksi kirjautui:

```
rate = 12,9004   quantity = 1   grossAmt = 12,90   amount = 10,28   tax1Amt = 2,62
```

Sama koko erässä. Todennettu 23.09.2026 laskujen item 30 -riveiltä koko vuodelta 2026
(`netamount` vs. `rate × quantity`):

| Kuukausi | netto oikein | netto 20,3 % vajaa |
|---|---|---|
| 01–05/2026 | 71 201 | **0** |
| **06/2026** | 18 877 | **5 806** |
| 07–09/2026 | 64 650 | **0** |

Ne 5 806 riviä ovat **täsmälleen ne 330 laskua, joiden External ID on `1626-*`** — eli juuri ne,
jotka tämä hyvitysajo hyvittää. **Koko vuoden ainoa poikkeama on se laskuerä, joka jouduttiin
perumaan.** Hyvityslaskut itse ovat oikein: ne peilaavat laskun rivit sellaisina kuin ne oli
kirjattu.

> [!IMPORTANT]
> **Ajon tärkein tarkistus.** Tuo yksi hyvityslasku sisään ja katso rivin nettosumma:
>
> | Rivin `amount` | Merkitys |
> |---|---|
> | `= Unit price × Quantity` | oikein, jatka |
> | `= Unit price × Quantity / 1,255` | **pysäytä** — `Gross Amt` on korottamatta tai mapattu väärään kenttään |

### Sama ansa toisella polulla — `handler_hyvitys.js`

`handler_hyvitys.js` (CR-tyyppi 11, `netsuite-subscrption-cr-scripts`) asettaa rivilleen sekä
`rate`- että `amount`-kentän samaan sopimusrivin nettohintaan, eli se noudattaa yllä olevaa sääntöä.
Todennettu NetSuitesta molemmilta puolilta 23.09.2026:

| Polku | `rate` | `netamount` | Tulkinta |
|---|---|---|---|
| CSV-import 06/2026 (hyvityslasku 519299, item 30) | 80,64542 | **64,26** | brutto — **väärin** |
| `handler_hyvitys` (hyvityslasku 746608, item 30) | 80,64541833 | **80,65** | netto — sääntö |

Molempien lähdeluku on sama sopimusrivin `custrecord_sta_ca_row_price_month` (rivi 44104,
`80,64541833`, pyörä 35268). Ero on 25,5 %.

### Kaksi hyvityslaskujen kirjoittajaa — muutkin erot

| | CSV-import (tämä muoto) | `handler_hyvitys.js` (CR-tyyppi 11) |
|---|---|---|
| `custbody_sta_do_not_send_inv` | `false` → **lähtee asiakkaalle** (330/330 verkkolaskutettu) | `true` → **ei lähde** |
| `custbodycustbody_sta_textforinvoice` | tapauskohtainen, yleensä `Hyvittää laskua nro <tranid>` | `Vuokrasopimus:  <hubspot-sopimustunnus>` |
| Rivikuvaus | `Vuokrakausi 1.6.2026-30.6.2026` (ei välilyöntejä) | `Vuokrakausi 01.10.2026 - 31.10.2026` (välilyönnit, etunollat) |
| `custbody_sta_bike_id` | sarake 17, täytetään yhden pyörän hyvityksille | asetetaan aina |
| Kohdistus laskuun | kyllä | ei |

Jos kirjoitat kyselyn, joka etsii hyvityslaskuja, **rajaa aina se polku jota tarkoitat** —
esimerkiksi `externalid LIKE 'CR%'` (tämä import) tai CR-viite (skripti).

### Desimaalit ja pyöristys

`Unit price` kirjoitetaan enintään 5 desimaalilla. `Gross Amt` lasketaan siitä
(`× Quantity × 1,255`) ja pyöristetään **5 desimaaliin**: laske ensin, pyöristä vasta lopuksi.
NetSuite pyöristää rivin netto- ja bruttosumman 2 desimaaliin, joten 5 desimaalia riittää
tuottamaan oikean sentin — `Gross Amt / 1,255` pyöristyy samaan senttiin kuin
`Unit price × Quantity`.

Tarkista se: jokaiselle riville `ROUND(Gross Amt / 1,255, 2)` **on oltava**
`ROUND(Unit price × Quantity, 2)`. Jos ei ole, pyöristys on tehty liian aikaisin.

Lähdetiedostossa `Gross Amt` oli laskettu erikseen lähdejärjestelmässä, jolloin se poikkesi
kaavasta **58 rivillä 6 136:sta** (suurin ero 0,0034 €). Esimerkki (`CR1626-819`, item 31):
`9,93761 × 674 = 6 697,94914`, mutta tiedostossa luki `6 697,94821`. Kumpikaan ei ollut korotettu
ALV:llä, joten koko erä oli joka tapauksessa väärin — mutta kaava on kaava: **`Gross Amt`
lasketaan, sitä ei kopioida lähdejärjestelmästä.**


## Kohdistus hyvitettävään laskuun

Sarake 1 nimeää hyvitettävän laskun sen External ID:llä. Hyvityslaskusta 519288 (`CR1626-4420`)
todennettu apply-alilista:

```
apply.items[0] = { doc: 516178, refNum: "INVGBF1030395", amount: 93,55, apply: true }
transaction 516178 → recordtype 'invoice', externalid '1626-4420'
```

330 hyvityslaskusta **325 on tilassa *Fully Applied***. Loput 5 (`CR1626-104183`, `-104184`,
`-104252`, `-104253`, `-104260`) ovat *Open*; samoilla viidellä `trandate` on käsin muutettu
01.06.2026:ksi CSV:n 3.6.2026:n sijaan. Kymmenen hyvityslaskua on myöhemmin kohdistettu käsin saman
asiakkaan toiselle laskulle (`2626-*`, `1726-*`, `5826-*`). Molemmat ovat importin jälkeistä käsityötä,
eivät importin ominaisuuksia.

Hyvityslaskun rivit ovat **1:1 kopio hyvitettävän laskun riveistä**. Todennettu vertaamalla laskua
516189 hyvityslaskuun 519299: sama `item`, `rate`, `quantity`, `description` ja
`custcol_sta_endusercostcenter` rivi riviltä. Tästä seuraa, että aineiston voi generoida suoraan
hyvitettävistä laskuista — **kunhan hyvitettävä lasku itse on nettopohjainen**, ks. seuraavan luvun
tarkistussarake.

## Aineiston generointi hyvitettävistä laskuista

```sql
SELECT t.externalid                     AS origin_invoice_external_id,
       'CR' || t.externalid             AS external_id,
       'Hyvittää laskua nro ' || t.tranid AS text_for_invoice,
       t.entity                         AS customer,
       tl.item,
       tl.memo                          AS description,
       tl.rate                          AS unit_price,
       ABS(tl.quantity)                 AS quantity,
       ROUND(tl.rate * ABS(tl.quantity) * 1.255, 5) AS gross_amt,
       ABS(tl.netamount)                AS laskun_netto_tarkistukseen,
       tl.custcol_sta_endusercostcenter AS enduser_cost_center,
       tl.custcol_sta_so_revrec_start   AS revrec_start,
       tl.custcol_sta_so_revrec_end     AS revrec_end
FROM transactionline tl
JOIN transaction t ON t.id = tl.transaction
WHERE t.recordtype = 'invoice'
  AND t.externalid IN ( /* hyvitettävät laskut */ )
  AND tl.itemtype = 'Service'
ORDER BY t.id, tl.id
```

`laskun_netto_tarkistukseen` ei mene CSV:hen. Se on siellä, jotta näet heti, onko hyvitettävä lasku
nettopohjainen: **`ROUND(rate × quantity, 2)` on oltava sama kuin `ABS(netamount)`**. Jos se on
`netamount × 1,255`, lasku kuuluu bruttoerään (kuten `1626-*`) eikä sen `rate` kelpaa
`Unit price` -sarakkeeseen sellaisenaan — lue § *Netto, brutto ja 06/2026:n ansa*.

> [!NOTE]
> `transactionline`-taulussa **ei ole `grossamount`-saraketta** — kysely kaatuu virheeseen
> `An unexpected SuiteScript error has occurred`, jos sen lisää. Laskun rivien `quantity` on
> **negatiivinen** (`-1`) — ota `ABS`. `itemtype = 'Service'` rajaa pois ALV-rivin (`TaxItem`) ja
> otsikkorivin. Kysely ei anna `Bike id`:tä: lasku ei kanna pyöräviitettä rivitasolla, joten se on
> haettava erikseen, jos hyvitys koskee yhtä pyörää. Muut SuiteQL-rajoitteet:
> [`queries/suiteql-tuki.md`](../queries/suiteql-tuki.md).

## Käyttäjän formatointiasetukset

CSV Import lukee tiedoston **sen käyttäjän asetuksilla, joka ajon käynnistää** — ei tiedostosta.
Tiedosto on rakennettu näille arvoille, ja ne on tarkistettava ennen jokaista ajoa kohdasta
*Home → Set Preferences → Formatting*:

| Asetus | Arvo |
|---|---|
| Date Format | **DD.MM.YYYY** |
| Long Date Format | DD Month YYYY |
| Time Format | hh:mm (24 hours) |
| **Number Format** | **1.000.000,00** |
| Negative Number Format | -100 |
| Auto Place Decimal | **ei päällä** |
| **CSV column delimiter** | **Semicolon** |
| **CSV decimal delimiter** | **Comma** |

Lihavoidut neljä ovat ne, joiden väärä arvo tuhoaa aineiston. *Number Format* `1.000.000,00`
tarkoittaa, että **piste on tuhaterotin ja pilkku desimaalierotin** — siksi CSV:hen ei kirjoiteta
tuhaterottimia lainkaan: `6697,94914`, ei `6.697,94914`. *Auto Place Decimal* päällä siirtäisi
desimaalipilkun kokonaisluvuissa kahden numeron päähän, eli `2` luettaisiin `0,02`:na.

> [!WARNING]
> Nämä ovat **rooliriippumattomia käyttäjäasetuksia** (*"This setting applies to all your roles"*).
> Jos importin ajaa joku muu kuin aineiston rakentaja, tarkista asetukset **hänen** tunnuksiltaan.
> Väärä *Date Format* kääntää päivän ja kuukauden hiljaisesti: `3.6.2026` luettaisiin maaliskuun
> 6. päiväksi, ja hyvitys osuisi väärälle kirjauskaudelle ilman yhtään virheilmoitusta.

## NetSuiten import-asetukset

| Asetus | Arvo |
|---|---|
| Import Type | Transactions |
| Record Type | **Credit Memo** |
| Data Handling | **Add** |
| Tiedostoja | yksi (ei erillistä rivitiedostoa) |
| Character Encoding | UTF-8 |

Erotin- ja desimaaliasetukset tulevat yllä olevista käyttäjäasetuksista, eivät import-lomakkeelta.

Saman `External ID`:n peräkkäiset rivit muodostavat yhden monirivisen hyvityslaskun.

### Kenttämappauksen kolme kriittistä valintaa

| Sarake | Kohde | Miksi |
|---|---|---|
| `Unit price` | **`Credit Memo → Items → Rate`** | Yhden kappaleen **nettohinta**. |
| `Gross Amt` | rivin **Gross Amount** | Koko rivin **bruttosumma** = `Unit price × Quantity × 1,255`. Kenttä on määritelmältään ALV:llinen: jos siihen laittaa netto­summan, NetSuite laskee netoksi `arvo / 1,255` ja hyvitys jää 20,3 % vajaaksi. Näin kävi 06/2026. |
| `Enduser cost center` | **`Credit Memo - Items : End user cost center`** | **Ei `Cost center`.** Ks. varoitus alla. |

> [!CAUTION]
> **`Cost center` kenttälistassa on uudelleennimetty Department, ei kustannuspaikkateksti.**
> Tässä tilissä NetSuiten osastotietue on nimetty *Cost center*, ja sillä on 13 GoByBiken **omaa**
> osastoa (`100 Palvelutuotanto` … `500 Hallinto`). Asiakkaan kustannuspaikka on vapaa teksti
> kentässä `custcol_sta_endusercostcenter`, jonka otsikko on **"End user cost center"**.
> Todennettu 23.09.2026: hyvityslaskuilla `department` on NULL ja arvo on tuossa sarakekentässä.
>
> CSV:n otsikko `Enduser cost center` (yhdyssana) ei täsmää kentän nimeen `End user cost center`
> (erikseen), joten **automaattimäppäys valitsee `Cost center`:in**. Näin kävi 23.09.2026:
> 10 hyvityslaskua 22:sta kaatui virheeseen `Invalid department reference key … for subsidiary 2`
> ja 12 meni läpi — ne joilla kustannuspaikka oli tyhjä.
>
> **Virhe ei aina ole näkyvä.** Arvo `101` on asiakkaan koodi, ja osastolistalla on
> `101 Työntekijäpalvelu`. Import hylkäsi sen vain siksi, ettei viiteavain täsmännyt koko nimeen.
> Jos kustannuspaikkateksti osuisi osaston nimeen tarkalleen, rivi kirjautuisi GoByBiken omalle
> osastolle ilman yhtään virhettä.
>
> Otsikolla **"End user cost center"** on kaksi osumaa kenttälistassa: runkokenttä
> (`custbody_sta_endusercostcenter_so`) ja rivikenttä. Valitse **Credit Memo - Items** -versio.
| Kaikki tietueviittaukset | reference type **Internal ID** | `Customer`, `Subsidiary`, `Account`, `Bike id`, `Item`, `Tax Code` — ks. § *Kaikki tietueviittaukset internal id:llä*. |

> [!CAUTION]
> **Run Server SuiteScript and Trigger Workflows.** Kesäkuun 2026 ajossa Starian verkkolaskutus-,
> viitenumero- ja uudelleenluokitteluketju kävi läpi kaikille 330:lle. Jos ajat testin, jonka ei ole
> tarkoitus lähteä asiakkaalle, ruutu on jätettävä merkitsemättä — mutta silloin lopputulos ei ole
> sama kuin tuotantoajossa, eikä testi todista lähetyspolkua.

## Ennen ajoa — tarkistukset

1. `External ID` yksilöi hyvityslaskun. Kun hyvitys peilaa laskua, käytä muotoa
   `'CR'` + `ORIGIN INVOICE EXTERNAL ID`; muussa tapauksessa oma, tunnistettava etuliite
   (esim. `LISA9-<cr_id>`).
2. Jokainen täytetty `ORIGIN INVOICE EXTERNAL ID` löytyy NetSuitesta laskuna ja sillä on riittävästi
   avointa saldoa: `SELECT externalid, foreignamountunpaid, BUILTIN.DF(status) FROM transaction
   WHERE recordtype = 'invoice' AND externalid IN (…)`. Tyhjä sarake on sallittu — hyvityslasku jää
   silloin *Open*-tilaan kohdistamattomana hyvityksenä.
3. Yksikään `External ID` ei ole jo käytössä:
   `SELECT externalid FROM transaction WHERE externalid IN (…)` → **0 riviä**.
   Data Handling *Add* + olemassa oleva External ID = virhe, ei päivitys.
4. **Rungon 17 saraketta ovat identtiset saman `External ID`:n kaikilla riveillä.**
5. `Invoice #`, `Invoice Ref. No.`, `Memo main` ja `Due Date` ovat tyhjiä joka rivillä.
6. `Do not trigger invoice ref number` = `FALSE` joka rivillä.
7. `Bike id` on joko tyhjä tai **sama** hyvityslaskun kaikilla riveillä, ja arvo löytyy
   pyörärekisteristä: `SELECT id FROM customrecord_sta_bike_register WHERE id IN (…)`.
8. **Rivirakenne on valittu tietoisesti** (§ *Rivirakenne*): muodossa A tasan yksi item 31 -rivi
   per `External ID` ja se ensimmäisenä, `Quantity` = pyörien määrä = kuvauksen `<N>`; muodossa B
   yksi item 30- ja yksi item 31 -rivi **per kuukausi**, `Quantity` aina 1.
9. Jos hyvitys peilaa olemassa olevaa tositetta, **jokainen rivi vastaa lähderiviä** myös
   `Enduser cost center`- ja `Description`-sarakkeissa. Nollaerotuksen rivit on jätetty pois.
   Kuvaus nimeää kuukauden, jos kuukausia on useampi.
10. **`Gross Amt` = `Unit price × Quantity × 1,255`** joka rivillä. Yksikään rivi ei saa olla
    sellainen, että `Unit price` = `Gross Amt` (paitsi jos molemmat ovat 0) — se tarkoittaisi
    nollaveroa ja 20,3 % vajaaksi jäävää hyvitystä.
11. `Unit price` on **netto**. Jos se on peräisin hyvitettävän laskun riviltä, varmista että kyseinen
    lasku itse on nettopohjainen: `netamount = rate × quantity`. Jos ei ole (kuten laskuerässä
    `1626-*`), ks. § *Netto, brutto ja 06/2026:n ansa* ennen kuin jatkat.
12. **Kaikki tietueviittaukset ovat internal id:itä** — `Customer`, `Subsidiary`, `Account`,
    `Bike id`, `Item`, `Tax Code` ovat kokonaislukuja, eivät nimiä tai koodeja. `Account` = `119`,
    ei `1701`. Tarkista että jokainen id on olemassa:
    `SELECT id FROM customer WHERE id IN (…)` ja vastaavasti muille.
13. Ei tuhaterottimia luvuissa, ei `;`- eikä `"`-merkkejä kustannuspaikoissa tai kuvauksissa.
14. Rivimäärä ja `SUM(Gross Amt)` kirjattu muistiin ajon jälkeistä täsmäytystä varten.
15. Käyttäjän formatointiasetukset tarkistettu sen tunnukselta, joka importin ajaa.

## Ajon jälkeen — todennus

**Aja tämä ensimmäisenä, mieluiten heti yhden koehyvityslaskun jälkeen.** Se on ainoa kysely, joka
paljastaa ALV-mappauksen menneen väärin:

```sql
-- ALV-tarkistus: rate_netto pitää olla rivimäärä, rate_brutto nolla
SELECT SUM(CASE WHEN ABS(ABS(tl.netamount) - ROUND(tl.rate * ABS(tl.quantity), 2)) <= 0.02
                THEN 1 ELSE 0 END) AS rate_netto,
       SUM(CASE WHEN ABS(ABS(tl.netamount) - ROUND(tl.rate * ABS(tl.quantity) / 1.255, 2)) <= 0.02
                THEN 1 ELSE 0 END) AS rate_brutto,
       COUNT(*) AS rivit
FROM transactionline tl
JOIN transaction t ON t.id = tl.transaction
WHERE t.recordtype = 'creditmemo' AND t.externalid LIKE 'CR<ajo>-%' AND tl.itemtype = 'Service'
```

Jos `rate_brutto` on nollaa suurempi, `Gross Amt` on mapattu Gross Amount -kenttään ja hyvitykset
ovat 20,3 % vajaita. **Pysäytä ajo, korjaa mappaus ja poista syntyneet hyvityslaskut** ennen kuin
jatkat — kertaalleen lähtenyttä hyvityslaskua ei saa pois muuten kuin uudella tositteella.

```sql
-- kpl, rivit ja summat; odota CSV:n lukuja
SELECT COUNT(DISTINCT t.id) AS memot, tl.item, COUNT(*) AS rivit, SUM(tl.netamount) AS netto
FROM transactionline tl
JOIN transaction t ON t.id = tl.transaction
WHERE t.recordtype = 'creditmemo' AND t.externalid LIKE 'CR<ajo>-%' AND tl.itemtype = 'Service'
GROUP BY tl.item
```

```sql
-- kohdistus: tämän pitäisi palauttaa 0 riviä
SELECT cm.externalid AS hyvitys, inv.tranid AS lasku, inv.externalid AS lasku_ext
FROM previoustransactionlink l
JOIN transaction cm  ON cm.id  = l.nextdoc
JOIN transaction inv ON inv.id = l.previousdoc
WHERE cm.recordtype = 'creditmemo' AND cm.externalid LIKE 'CR<ajo>-%'
  AND (inv.externalid IS NULL OR inv.externalid <> SUBSTR(cm.externalid, 3))
```

```sql
-- tilajakauma: kaikkien pitäisi olla Fully Applied
SELECT BUILTIN.DF(t.status) AS tila, COUNT(*) AS n
FROM transaction t
WHERE t.recordtype = 'creditmemo' AND t.externalid LIKE 'CR<ajo>-%'
GROUP BY BUILTIN.DF(t.status)
```

```sql
-- pyöräviite: odota täsmälleen niitä pyöriä jotka aineistossa oli
SELECT t.externalid, t.custbody_sta_bike_id AS pyora, br.name
FROM transaction t
LEFT JOIN customrecord_sta_bike_register br ON br.id = t.custbody_sta_bike_id
WHERE t.recordtype = 'creditmemo' AND t.externalid LIKE 'CR<ajo>-%'
  AND t.custbody_sta_bike_id IS NOT NULL
```

```sql
-- kustannuspaikka oikeaan kenttään ja lähetystila; odota osastoja = 0
SELECT SUM(CASE WHEN tl.department IS NOT NULL THEN 1 ELSE 0 END) AS osastoja,
       SUM(CASE WHEN tl.custcol_sta_endusercostcenter IS NOT NULL THEN 1 ELSE 0 END) AS kustannuspaikkoja,
       SUM(CASE WHEN t.custbody_sta_do_not_send_inv = 'T' THEN 1 ELSE 0 END) AS ei_laheteta
FROM transactionline tl
JOIN transaction t ON t.id = tl.transaction
WHERE t.recordtype = 'creditmemo' AND t.externalid LIKE 'CR<ajo>-%' AND tl.itemtype = 'Service'
```

`osastoja > 0` tarkoittaa, että `Enduser cost center` on mapattu Department-kenttään — korjaa
mappaus ja tarkista rivien GL-luokittelu. `ei_laheteta > 0` tarkoittaa, etteivät hyvityslaskut
lähde asiakkaalle; päätä onko se tarkoitus.

Tarkista lisäksi, ettei yksikään hyvityslasku saanut `custbody_sta_redemption = T`: hyvityslasku ei
ole lunastus, eikä sen pidä näkyä lunastusmittareissa.

## Mitä ei ole todennettu

Yksi kohta jäi auki. Se kannattaa tarkistaa NetSuiten tallennetusta import-mappauksesta ennen uuden
aineiston rakentamista:

**`ORIGIN INVOICE EXTERNAL ID` — mikä mappaus?** Todennettu on, että syntynyt hyvityslasku on
kohdistettu juuri siihen laskuun, jonka External ID sarakkeessa on. Todentamatta on, teki sen tämä
sarake (mapattuna Apply-alilistan laskuviitteeksi) vai NetSuiten oma *Automatically Apply Credits*
-asetus. Nämä kaksi antavat tässä aineistossa saman lopputuloksen, koska hyvityksen summa on tasan
yhden avoimen laskun summa.

Varmaa on, ettei mappaus käyttänyt **Created From** -kenttää: hyvityslaskuilla 519288 ja 519299 ei
ole `createdFrom`-arvoa lainkaan, vain apply-alilistan rivi. Vertailukohta on hyvityslasku 725787,
joka on tehty laskusta käsin — sillä on `createdFrom: Invoice #INVGBF1039658` **ja**
`custbody_credited_invoicenumber`. Kumpikaan ei täyty tällä importilla, joten hyvityksen ja laskun
yhteys jää pelkän kohdistuksen varaan. Jos yhteyden halutaan näkyvän tietueella, se on lisättävä
mappaukseen erikseen.

### Ratkennut: `Do not trigger invoice ref number`

Sarake osoittaa kenttään `custbody_sta_loc_no_refno`, jonka merkitys on *"viitenumero on jo luotu,
älä luo uudelleen"*. Starian toiminnallinen määrittely
(`netsuite-staria-suitescripts/docs/Gobybike_Functional-Specification.md:456`) käskee generoida
viitenumeron kenttään `custbody_fin_invoicereferencenumber` ja **merkitä sitten** tämän ruudun.
Kenttää kirjoittavat `sta_ue_bike_register_hook.js:907,975` ja `sta_ue_salesorder_hook.js:538`
(arvo `true`) sekä `handler_jalki.js:132` (arvo `false`, pakottaa generoinnin).

Siksi arvo on tässä muodossa **aina `FALSE`**: `TRUE` edellyttäisi, että viitenumero annetaan
sarakkeessa `Invoice Ref. No.`, jonka on määrä jäädä tyhjäksi. Lähdetiedoston `TRUE` oli virhe; se
ei mennyt läpi (330/330 sai `F`:n ja viitenumeron), mutta se ei ole peruste toistaa sitä.

### Sivuhuomio

`custbody_externalid` sisältää saman arvon kuin `externalId` (`CR1626-4420`), vaikka CSV:ssä on vain
yksi External ID -sarake. Sen täyttää jokin skripti tai workflow, ei tämä import.
