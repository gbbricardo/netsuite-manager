# ADR 0024 — Huoltohyvitys myös keskenkauden lunastuksessa, ja sen näyttö pyörärekisterityökalussa

- **Päivämäärä:** 2026-10-27
- **Tila:** Hyväksytty (tuoteomistaja, grilling-istunto 27.10.2026, K1–K9)
- **Koskee:** `cf-gbb-tools` bike-register-lookup (*Lunastushinta*-osio). Ei NetSuite-skriptejä.
- **Laajentaa:** [ADR 0012](0012-loppulunastushinta-ja-kattavuus.md) k. 1 (huoltohyvitys) keskenkauden lunastukseen ([ADR 0010](0010-keskenkauden-lunastus.md))
- **Kenttätaso:** [kenttäsäännöt § 11](../lunastuksen-kenttasaannot.md#11-loppulunastushinnan-määräytyminen-ja-kattavuus)
- **Toteutus:** TASKS T83

## Konteksti

Huoltohyvityksen kaava on määritelty vain kauden lopun lunastukselle (ADR 0012 k. 1, ADR 0014 k. 22). Asiakaspalvelu
on laskenut keskenkauden lunastuksissa huoltohyvityksen itse, eikä sääntöä ole kirjattu NetSuiteen eikä tähän repoon.
Lunastushinnan tarkistus tapahtuu cf-gbb-toolsin pyörärekisterityökalussa (`BuyoutPanel`, hinta vuokrasopimuksen PDF:stä),
mutta huoltosumma ja porrastaulu on katsottava muualta. Tavoite: asiakaspalvelu näkee hyvityksen samassa näkymässä.

Asiakaspalvelun nykyinen työnkulku keskenkauden lunastuksessa (käyttäjä 27.10.2026):

1. Asiakaspalvelu saa tiedon, että sopimus päätetään tietylle kuulle.
2. Se tarkistaa päättymiskuun lunastushinnan (vuokrasopimuksen taulukko, cf-gbb-toolsin `BuyoutPanel`).
3. Se tarkistaa hyvityksen suuruuden (tähän asti muualta, tämän ADR:n jälkeen samasta näkymästä).
4. Se luo Paylink-tilauksen lunastushinnalla, josta mahdollinen hyvitys on vähennetty.
5. Kun Paylink-tilaus on maksettu, NetSuiteen luodaan muutospyyntö (tyyppi 2, ADR 0010).

Hyvitys vähennetään siis **Paylink-tilauksen summasta**, ennen kuin CR on olemassa. NetSuitessa hyvitys näkyy vain
maksetun tilauksen summassa (`customrecord_payment_requests`), ei omana tietonaan.

## Päätökset

1. **Huoltohyvitys koskee myös keskenkauden lunastusta.** (K1)
2. **Kaava on sama kuin kauden lopussa** (KS § 11): huoltosumma > 0 → pienimmän kattavan portaan yläraja − summa;
   huoltosumma ≤ 0 → −summa kokonaan, ilman kattoa; OOMI → vain negatiivinen summa (ADR 0014 k. 22). Tyhjä summa = 0. (K2)
   Kaava ei riipu lunastuspäivästä eikä lunastushinnasta.
3. **Kenttä näyttää vain hyvityksen**, ei maksettavaa hintaa. Asiakaspalvelu vähentää sen itse. (K3)
4. **Sijainti:** *Lunastushinta*-osion ylin rivi, `BuyoutPanel`in yläpuolella ja siitä riippumaton: näkyy heti haun jälkeen
   eikä odota PDF:n lukua. Oma lähdemerkintä *NetSuite (huoltosumma)*, koska osion lähde on *vuokrasopimus (PDF)*. (K4)
5. **Esitys:** otsikko **"Huoltohyvitys lunastushinnasta"**, pelkkä bruttosumma (ei nettoa). Positiivisella hyvityksellä
   selitysrivi, jonka luvut ovat bruttona: huoltosumma ja porras (esim. *"Huoltosumma 125,50 €, porras 2 kk (160,99 €)"*;
   negatiivisella summalla *"Käyttämätön huoltobudjetti (huoltosumma −100,40 €)"*). (K5)
   - hyvitys brutto = round2(hyvitys netto × 1,255), kuten KS § 11
   - selitysrivin huoltosumma bruttona samalla muunnoksella kuin *Huoltokustannukset yhteensä* -kenttä, porras taulun bruttoylärajana
     (`custrecord_sta_me_max_amt_incl_vat`). Selitysrivin luvuista laskettu erotus voi poiketa hyvityksestä sentillä; hyvitys on totuus.
6. **Reunatapaukset ilman selitysriviä** (K6):
   | Tilanne | Näytetään |
   |---|---|
   | huoltosumma tyhjä tai 0; summa täsmälleen portaan yläraja; OOMI ja summa > 0 | **0,00 €** |
   | huoltosumma > ylin porras (3 060,55 € netto) | oranssi **"Ei laskettavissa"** |
   | rekisterin haku epäonnistui | punainen **"—"** |

   Suurelle negatiiviselle summalle ei varoitusta. Kenttä näytetään **kaikissa statuksissa**.
7. **Porrastaulu kovakoodataan** cf-gbb-toolsiin (taulu ei ole muuttumassa). (K7) **Arvot kopioidaan NetSuitesta 48 arvon
   taulukkona**, ei kaavana, ja kommenttiin lähde `customrecord_sta_maint_extending_months` ja päivä 27.10.2026. (K8)
8. **Pelkkä näyttö.** NetSuiteen ei kirjoiteta mitään, eikä keskenkauden hyvitystä automatisoida tässä. (K9)

## Porrastaulu (todennettu NetSuitesta 27.10.2026)

Taulu ei ole lineaarinen: bruttoyläraja = 80 € × kk + 0,99 €, nettoyläraja = round2(brutto / 1,255). Kaava täsmää kaikkiin
48 riviin, mutta KS § 11:n aiempi "+63,75/kk" poikkesi 3 kk:sta alkaen (1 snt) ja 48 kk:ssa 23 snt. Nettoylärajat, kk 1–48:

```
64.53, 128.28, 192.02, 255.77, 319.51, 383.26, 447.00, 510.75, 574.49, 638.24, 701.98, 765.73,
829.47, 893.22, 956.96, 1020.71, 1084.45, 1148.20, 1211.94, 1275.69, 1339.43, 1403.18, 1466.92, 1530.67,
1594.41, 1658.16, 1721.90, 1785.65, 1849.39, 1913.14, 1976.88, 2040.63, 2104.37, 2168.12, 2231.86, 2295.61,
2359.35, 2423.10, 2486.84, 2550.59, 2614.33, 2678.08, 2741.82, 2805.57, 2869.31, 2933.06, 2996.80, 3060.55
```

Taulun rivi 0 kk (yläraja 0) vastaa summaa 0. Kaikki rivit on viimeksi muokattu 28.–29.9.2026 (`lastmodifiedby` = −5); arvot ovat johdonmukaiset.

## Toteutus cf-gbb-toolsissa (työohje T83)

- **Data:** `search.ts` hakee jo `custrecord_sta_maintenance_sum`in, mutta palauttaa sen vain muotoiltuna bruttona.
  Lisää raakanettoarvo ja `custrecord_sta_bike_order_type` (OOMI = 3) `BikeRegisterRecord`iin. Uutta API-reittiä ei tarvita.
- **Logiikka:** puhdas funktio omaan tiedostoon (esim. `lib/tools/bike-register-lookup/maintenance-refund.ts`), joka palauttaa
  `{ kind: "refund", grossCents, … } | { kind: "zero" } | { kind: "over_top" }`. Pyöristys samoin kuin 1479:n
  `lib_gbb_redemption_price.js`, jotta tulos täsmää maksulinkin `hyvitys`-lokikenttään.
- **Testit (vitest):** KS § 11:n esimerkit, portaan rajat (64,53 / 64,54), täsmälleen yläraja → 0, ylin porras ja sen ylitys,
  tyhjä summa, negatiivinen summa ilman kattoa, OOMI positiivisella ja negatiivisella summalla, ja kaikki 48 porrasta yllä
  olevaa listaa vasten.
- **Vertailu:** ennen julkaisua lasketaan muutamalle pyörälle, joilla on 1479:n `SENT`-lokirivi, sama `hyvitys` kuin lokissa.

## Vaihtoehdot, joita ei valittu

- **Kenttä vain kauden lopun hinnalle (`after_end`).** Torjuttu: hyvitys kuuluu myös keskenkauden lunastukseen (k. 1).
- **Kertyneen budjetin kaava keskenkauden lunastukselle** (kuluneet kk × kuukausibudjetti − maksetut huollot). Torjuttu: yksi sääntö molemmille.
- **Maksettava hinta (taulukon hinta − hyvitys) näkyviin.** Torjuttu: asiakaspalvelu vähentää itse.
- **Kenttä *Muut tiedot* -osioon tai PDF-hinnan alle.** Torjuttu: kuuluu lunastushinnan tarkistukseen, eikä saa odottaa PDF:ää.
- **Porrastaulu SuiteQL:llä jokaisella haulla.** Torjuttu: taulu ei muutu. Hinta: jos taulu muuttuu, cf-gbb-tools näyttää väärää lukua
  hiljaa, ja kopioita on kolme (1479:n kirjasto, IC-laskuri, cf-gbb-tools).
- **Automaatio** (hyvitys CR:lle tai laskulle). Torjuttu tästä päätöksestä: muuttaisi ADR 0010 k. 3:n hyvityspolkua.

## Avoimet

- ~~Mistä summasta asiakaspalvelu vähentää keskenkauden huoltohyvityksen?~~ **Vastattu 27.10.2026:** Paylink-tilauksen summasta
  (työnkulku kontekstissa). Kenttä osuu työnkulun vaiheeseen 3.
- Keskenkauden huoltohyvityksen automaatio (CR-käsittelijät, ADR 0010 k. 3) on oma päätöksensä.
- Jos `customrecord_sta_maint_extending_months` muuttuu, cf-gbb-toolsin kopio päivitetään käsin. Kolmen kopion asymmetria on tiedossa.
