# IC-lunastushinta: NetSuite alihinnoittelee kesken kauden lunastetut OOMI-pyörät (ei FAM-omaisuuserää)

**Päivä:** 29.10.2026
**Omistava repo:** `netsuite-ic-calculators`
**Tiedostot:** `src/lib/gbb_ic_redemption_calculator.js:41-47` (`resolveAmortizationStartDate`),
`:63-105` (`resolveTermEndDate`), `:181` (kutsu)
**Lähdeaineisto:** `findings/2026-10-29-ic-lunastukset-taloustiimiltä.csv` (788 riviä, lokakuun ajo),
`findings/2026-10 IC Lunastus Oomi - ei FAM_IC redemption price.xlsx` (7 961 riviä, talouden laskenta)
**Poimitut rivit:** [`2026-10-29-ic-hinta-erot-oomi-ei-fam.csv`](2026-10-29-ic-hinta-erot-oomi-ei-fam.csv)
**Liittyy:** [`2026-10-27-ic-hinnat-tarkistuslista.csv`](2026-10-27-ic-hinnat-tarkistuslista.csv)
ryhmä B (200 pyörää). Se tarkisti vain, että tallennettu hinta **täsmää laskurin omaan tulokseen** —
tämä löydös osoittaa, että sama haara on silti väärin taloustiimin laskentaa vasten.

---

## 1. Mitä aineistosta löytyi

Taloustiimin CSV:n 788 rivistä (kaikki OOMI):

| `IC redeption price diff` | Rivejä | Summa |
|---|---|---|
| **> 0** (NetSuite liian matala) | **98** | **41 478,69 €** |
| < 0 (NetSuite liian korkea) | 1 | −8,67 € |
| = 0 | 538 | — |
| tyhjä (NetSuitessa `-1` = laskenta epäonnistui, talous ei laskenut) | 151 | — |

Ero ei jakaudu satunnaisesti. Ristiintaulukointi talouden xlsx:n `Periods remaining`
-sarakkeen kanssa (= montako kuukautta lunastuksesta on vielä sopimuskauden loppuun):

| | `Periods remaining` = 0 | `Periods remaining` > 0 |
|---|---|---|
| **diff = 0** | **538** | 0 |
| **diff ≠ 0** | 1 (B044311, oma syynsä) | **97** |

**Jokainen kauden lopussa lunastettu pyörä täsmää ja jokainen kesken kauden lunastettu pyörä on
väärin.** Ero on 0,72 €–756,73 € per pyörä.

Kaikilla 99 poikkeavalla rivillä on NetSuitessa `custrecord_sta_asset_id = NULL`, eli
**FAM-omaisuuserää ei ole** — juuri se joukko, jonka takia talous laskee hinnat käsin Excelissä.
*(Todennettu NetSuitesta 29.10.2026.)*

## 2. Miten talous laskee (xlsx)

Sarakkeen `IC redemption Price` kaava on joka rivillä sama:

```excel
=ROUND(E2 + IFERROR(CUMPRINC(7,5%/12; G2; E2-F2; 1; G2-P2; 0); 0); 2)
```

| | Sarake | Sisältö |
|---|---|---|
| `E` | Original Cost | hankintahinta — **sama kuin `custrecord_gbb_ic_sale_price / 1,255`** |
| `F` | Residual value | jäännösarvo — **sama kuin `custrecord_sta_end_redemption_price`** |
| `G` | Lifetime | poistoaika kuukausina |
| `I` | Depreciation start date | **1.5.2026 kaikilla riveillä** = IC-kaupan päivä |
| `N` | Original end date | `=EOMONTH(I; G-1)` |
| `O` | Redemption end month | `=EOMONTH(M; 0)`, missä `M` = toteutunut lunastuspäivä |
| `P` | Periods remaining | `=(YEAR(N)-YEAR(O))*12 + MONTH(N)-MONTH(O)` |

`CUMPRINC` palauttaa negatiivisen luvun, joten kaava on auki kirjoitettuna

```
hinta = net_cost − (net_cost − jäännösarvo) × ((1+r)^(G−P) − 1) / ((1+r)^G − 1),  r = 7,5 % / 12
```

eli **täsmälleen sama annuiteettikaava kuin NetSuitessa** (`calculateRedemptionPrice`,
`gbb_ic_redemption_calculator.js:148-162`). Kun `P = 0`, kumulatiivinen lyhennys on koko
`net_cost − jäännösarvo` ja hinnaksi jää jäännösarvo — siksi kauden lopun rivit täsmäävät.

Olennainen ero on **poistoaika ja sen alkupäivä**:

- Poisto alkaa **IC-kaupan päivästä 1.5.2026**, ei alkuperäisestä tilausalusta.
- `Lifetime` on vain **jäljellä olevat kuukaudet** sopimuksen loppuun, ei koko alkuperäistä
  vuokrakautta. Todennettu: `Lifetime = MONTHS_BETWEEN(TRUNC(custrecord_sta_subsc_org_end_date,'MM'),
  DATE '2026-05-01') + 1` tuottaa xlsx:n arvon joka rivillä.

## 3. Miten NetSuite laskee

`custrecord_sta_asset_id` on tyhjä → kirjasto putoaa varapoluille
(`gbb_ic_redemption_calculator.js:19-33`):

- `netCost = round(custrecord_gbb_ic_sale_price / 1,255; 2)` — **sama luku kuin taloudella**
- `leaseStartDate = custrecord_gbb_ic_sale_dt` = 1.5.2026 — **sama päivä kuin taloudella**
- `residualValue = custrecord_sta_end_redemption_price` → `wasOverride = true`

Sitten `resolveTermEndDate` (`:63-105`):

`custrecord_sta_subsc_end_date` on kirjoitettu lunastuspäivään, joten se poikkeaa
`subsc_org_end_date`:stä. Vertailukohdaksi lasketaan `leaseStartDate + rentMonths`, missä
`rentMonths` on **koko alkuperäinen vuokrakausi** (48, 57, 60 kk). Kun 1.5.2026 + 48 kk = 2030,
päättymispäivä on aina tätä aiemmin → haara **`ignored-mid-termination`** ja paluuarvo `null`.

Nolla-arvo laukaisee `resolveAmortizationStartDate`-kutsun ehdolla
`residualResult.wasOverride && !termEndResult.value` = `true` (`:181`), jolloin

> **poistolaskenta siirretään alkamaan `custrecord_sta_subsc_start_date`:sta** — vuodesta 2021–2025 —
> ja `rentMonths` jää koko alkuperäiseksi kaudeksi.

### Todennus: kirjasto ajettiin tuotannon syötteillä

`node` + `src/lib/gbb_ic_redemption_calculator.js`, syötteet suoraan pyörärekisteristä:

| Pyörä | Kirjaston tulos | NetSuitessa | `amortStart` | `rentMonths` | `elapsed` | haara |
|---|---|---|---|---|---|---|
| B037464 | 759,33 | 759,33 ✓ | 2024-06-06 | 48 | 24 | `ignored-mid-termination` |
| B037566 | 843,79 | 843,79 ✓ | 2024-07-15 | 48 | 22 | `ignored-mid-termination` |
| B039775 | 116,56 | 116,56 ✓ | 2025-11-02 | 13 | 11 | `ignored-mid-termination` |
| B044217 | 115,32 | 115,32 ✓ | 2023-09-27 | 33 | 32 | `ignored-mid-termination` |
| B044311 | 193,70 | 193,70 ✓ | 2026-04-30 | 5 | 5 | `subsc_end_date`, `endOfLifecycle` |
| B046521 | 10,84 | 10,84 ✓ | 2026-04-30 | 6 | 6 | `subsc_end_date`, `endOfLifecycle` |

6/6 täsmää sentilleen — **tuotannon hinnat ovat tämän koodipolun tuotos, eivät arvaus.**

### Todennus: talouden kaava NetSuiten omista kentistä

Sama annuiteetti SuiteQL:llä, `G` ja `P` johdettuna `subsc_org_end_date`:sta ja `ic_sale_dt`:stä:

```sql
ROUND(net_cost - (net_cost - residual)
      * (POWER(1+rate/12, g-p) - 1) / (POWER(1+rate/12, g) - 1), 2)
-- net_cost = ROUND(custrecord_gbb_ic_sale_price/1.255, 2)
-- residual = NVL(custrecord_sta_end_redemption_price, ROUND(net_cost*0.05, 2))
-- g = MONTHS_BETWEEN(TRUNC(custrecord_sta_subsc_org_end_date,'MM'), TRUNC(custrecord_gbb_ic_sale_dt,'MM')) + 1
-- p = MONTHS_BETWEEN(TRUNC(custrecord_sta_subsc_org_end_date,'MM'), TRUNC(custrecord_gbb_ic_redemption_dt,'MM'))
```

**97 / 99 riviä tuottaa taloustiimin luvun sentilleen.** Talouden laskenta ei siis tarvitse yhtään
uutta tietoa — se on kokonaan johdettavissa pyörärekisteristä.

## 4. Juurisyy

`custrecord_gbb_ic_sale_price` **ei ole pyörän alkuperäinen hankintahinta** vaan 1.5.2026 sovittu
konsernin sisäinen kauppahinta, eli jo poistettu kirja-arvo kyseisenä päivänä. NetSuite poistaa
tätä arvoa uudelleen alkuperäisen vuokrakauden koko matkalta (`amortStart` = tilauksen alku 2021–2025,
`rentMonths` = 48–60 kk), jolloin 1.5.2026 mennessä kertynyt poisto **lasketaan kahteen kertaan**.
Siksi hinta on systemaattisesti liian matala ja virhe kasvaa sitä suuremmaksi, mitä kauemmin pyörä
oli vuokralla ennen IC-kauppaa.

Kauden lopussa virhe ei näy, koska `unbilledMonths <= 0` oikaisee tuloksen suoraan jäännösarvoon
(`:187-209`).

## 5. Vaikutuslaajuus (todennettu NetSuitesta 29.10.2026)

OOMI-pyörät joilla on IC-lunastushinta kirjoitettuna, ei FAM-omaisuuserää:

| Tilanne | Pyöriä | NetSuiten summa |
|---|---|---|
| Kesken kauden (`P > 0`) — **virheellinen laskentapolku** | **240** | 195 070,69 € |
| Kauden lopussa (`P <= 0`) — oikein | 1 318 | 141 108,21 € |
| `-1` (laskenta epäonnistui) | 155 | — |
| *(vertailuksi: FAM-omaisuuserä + kesken kauden)* | 21 | 36 111,56 € |

Näistä 240:stä, verrattuna talouden kaavaan:

| | Pyöriä | Summa |
|---|---|---|
| NetSuite alihinnoittelee | **110** | **46 468,77 €** |
| NetSuite ylihinnoittelee | 21 | −1 467,56 € |
| Täsmää | 109 | 0,00 € |

Täsmäävistä 24:llä `custrecord_gbb_interest_rate` on tyhjä, mikä viittaa siihen että hinta on
kirjoitettu CSV-importilla eikä skriptillä — eli talous on jo korjannut osan aiemmista kuukausista
käsin. Lokakuun ajossa korjauksia ei ole tehty: kaikki 97 kesken kauden -riviä poikkeavat.

## 6. Kaksi erillistä tapausta

| Pyörä | NetSuite | Talous | Syy |
|---|---|---|---|
| **B044311** | 193,70 | 392,83 | Kaava on sama ja `Periods remaining = 0`, mutta **jäännösarvo eroaa**: `custrecord_sta_end_redemption_price` = 193,70, talouden xlsx:ssä 392,83. Ei laskentavirhe vaan kentän arvo. Kysyttävä taloudelta, kumpi on oikein. |
| **B046521** | 10,84 | 2,17 | `custrecord_sta_end_redemption_price` on **tyhjä**, joten NetSuite käyttää varasääntöä 5 % × net_cost = 10,84 (`RESIDUAL_RATE`, `:8`). Talous on käyttänyt 1 % × net_cost = 2,17. Pyörää ei ole xlsx:ssä lainkaan. Jäännösarvon varasääntö on sopimuskysymys. |

## 7. Avoimet kysymykset

1. **Mikä on oikea laskentatapa?** Talouden logiikka (poisto IC-kaupan päivästä, vain jäljellä
   olevat kuukaudet) on konsernin sisäisen kauppahinnan luonteen kanssa yhteensopiva. Vahvistus
   taloudelta tarvitaan ennen kuin koodia muutetaan.
2. **Takautuva korjaus:** 110 pyörää, 46 468,77 €. Onko IC-myyntitilaukset jo luotu näiden
   hintojen pohjalta?
3. **155 kpl `-1`** — laskenta epäonnistuu, talous ei ole laskenut näitä. Osa näistä on
   `2026-10-27-ic-hinnat-tarkistuslista.csv`:n ryhmässä A.
4. **21 FAM-omaisuuserällistä kesken kauden -pyörää** kulkee eri polun (`famDeprStartDate`
   käytössä). Ei tarkistettu tässä.
5. Korjaus tehdään `netsuite-ic-calculators`-repossa sen omilla käytännöillä, ei täältä.
