# T5 (S3): 336 lunastettua IC-myytyä pyörää ilman IC-päivää 30.09.2026

**Mitattu:** 30.09.2026 iltapäivällä · **Tekijä:** pääsessio (vain luku, NetSuiteen ei kirjoitettu)
**Rivilista:** [`2026-09-30-t5-ic-paiva-puuttuu.csv`](2026-09-30-t5-ic-paiva-puuttuu.csv) (336 riviä, `SUM(id)` 13 808 918)
**Tehtävä:** T5 ([TASKS.md](../TASKS.md)). Käyttäjä täytti IC-päivät käsin 29.09. taloustiimin kiireellisen
tarpeen vuoksi. Tämän listan tarkoitus on selvittää, miksi nämä 336 pyörää eivät olleet mukana.

## Joukko

T2:n ja T5:n joukkoehto: status 2/3, IC-myyty (`ic_sale_dt` tai `ic_sale_price`), `ic_redemption_dt`
tyhjä, `ic_redemption_done` ≠ T ja `ic_redemption_pr` tyhjä. **336 pyörää** (24.09.: 1 366). Kaikilla on
sekä `ic_sale_dt` että `ic_sale_price`, ja kaikilla on päättymisajankohta.

## Ryhmät

Sarake `ryhma` CSV:ssä. Ryhmä on johdettu `date_to_non_active`:sta ja selvitystavasta, ei eilisen
täytön valintaehdosta, jota en tiedä.

| Ryhmä | kpl | IC-kausi (`LAST_DAY`) | Mitä ne ovat |
|---|---|---|---|
| **K1** historical_unknown (tapa 8) | **281** | 05/2026: 188, 06/2026: 91, 07/2026: 1, 01/2025: 1 | 280 OOMI-pyörää, jotka käännettiin 02.06. ja 01.–02.07. Tapa 8 on ADR 0006:n import 21.09. `paid_at` ja `liab_settled_at` ovat tyhjiä. 50:llä päättymisajankohta tulee `oomi_exceptional_end_date`:sta, mutta se on sama kuin `subsc_end_date` |
| **K2** kääntyi 29.–30.09. | **10** | 09/2026: 9, **08/2026: 1** (B008893) | Kääntyi eilisen täytön aikana tai jälkeen: 5 kääntyi 29.09. ja 5 30.09. |
| **K3** S4 OOMI, kääntyi 25.09. | **14** | 07/2026 | S4-importin pyöriä (tapa 1, `liab_settled_at` 24.09.). S4:n 34 pyörästä 20 sai IC-päivän |
| **K4** kääntyi 02–08/2026 | **27** | 05/2026: 3, 06/2026: 7, 07/2026: 16, 10/2025: 1 | 23 OOMI-pyörää tavalla 1 ja maksulla. Lisäksi B013284 (tapa 6, 10/2025), B037157 (tapa 7), B037349 ja B046502 (status 3, tapa 5) |
| **K5** kääntyi 01.–24.09. | **4** | 05–07/2026 | B006119, B033449, B043074 ja B046509 |

**Kaksi K1:n poikkeusta:**
- **B045304** on T1c:n testirivi, ja sen tila odottaa pyöräkohtaista päätöstä (Active vai tapa 1). Se kannattaa
  jättää pois, kunnes päätös on tehty.
- **B017530** päättyi 31.01.2025, ja status kääntyi vasta 31.08.2026. IC-kausi 01/2025 on hyvin vanha.

**IC-päivä ei riipu päättymisajankohdan valinnasta** näillä 336 pyörällä: `LAST_DAY(COALESCE(…))` =
`LAST_DAY(subsc_end_date)` jokaisella (sarake `ic_paivat_eroavat` on tyhjä kaikilla).

## Eilinen täyttö — mitä NetSuite näyttää

**Päätelty `lastmodified`-kentästä:** jos pyörää on muokattu 29.09. jälkeen jostain muusta syystä, se
näkyy tässä väärin. Tarkkaa ajon rajausta en tiedä.

- Noin **1 204** status 2/3 -pyörää sai IC-päivän 29.09. alkaen. Niistä **1 164 on kausilla 08–09/2026**, ja
  05–07/2026 kausille osui vain 39 ja 04/2026 kaudelle 1. Tämän listan pyöristä **324/336 kuuluu
  kausille 05–07/2026**. Todennäköisin selitys on, että täyttö rajautui elo- ja syyskuun kausiin.
  Varmista se omasta rajauksestasi.
- **65 pyörää ilman IC-myyntiä** sai IC-päivän (lähinnä OOMI-pyöriä tavalla 1). D1 (IC-päivä
  IC-myymättömille) on TASKS.md:ssä yhä auki. Jos taloustiimi päätti D1:n eilen, kirjaa päätös.
- **23 päivää poikkeaa** säännöstä `LAST_DAY(COALESCE(exc, oomi_exc, subsc_end_date))`:
  - **12** noudattaa `LAST_DAY(subsc_end_date)`:a, kun poikkeuspäivä on aiempi. Näin sanoo ADR 0010 kohta 8,
    jonka kirjastoon vieminen on T11, joten nämä ovat linjassa tulevan säännön kanssa: B037520,
    B037916, B038366, B038758, B039116, B039319, B039324, B043381, B045099, B045901, B046201 ja B046675.
  - **11 ei noudata kumpaakaan:** IC-päivä on 31.08.2026, vaikka päättymisajankohta on 30.09.2026.
    Nämä ovat B004669, B011157, B011958, B012709, B013532, B014652, B030629, B032657, B033143 ja
    B035544, kaikki keskenkauden lunastuksia, jotka käännettiin elokuussa ja joiden alkuperäinen loppu on 2027–2029.
    Lisäksi B006082: IC 31.08., päättymisajankohta 31.07. **Tarkista nämä 11.** Jos päättymispäivä
    on siirtynyt kääntymisen jälkeen (esimerkiksi CR:n rivikatkaisu 30.09.), IC-kausi on syyskuu, ei elokuu.

## Uusintamittaus 30.09. illalla

Käyttäjä täytti käsin klo 15:54–16:13 ne pyörät, jotka vaativat ihmisen silmää. **Jäljellä on 325:**

| Tapa | OOMI | Muu | Yhteensä |
|---|---|---|---|
| 8 `historical_unknown` | 280 | 1 (B017530, testipyörä) | 281 |
| 1 | 38 | 1 (B037349) | 39 |
| 7 | – | 3 (B016438, B017830, B037157) | 3 |
| 5 (status 3) | – | 1 (B046502) | 1 |
| 6 | – | 1 (B013284) | 1 |

- **Täytettiin 13:** K2:n 9 pyörää (B004761, B006540, B008893, B013242, B014244, B015851, B017184,
  B019999, B032744) sekä B006119, B033449, B043074 ja B046509. Kaikilla päivä = `LAST_DAY(päättymisajankohta)`,
  paitsi B043074, jolle oli kirjattu 30.07.2026. **Korjattu 31.07.2026:ksi 30.09. klo 16:20 (todennettu).**
- **Tulivat joukkoon:** B017830 (tapa 7) ja B044026 (OOMI, tapa 1), molemmat päättyvät 30.09. ja kääntyivät
  30.09. Lisäksi B016438 kääntyi 30.09. eikä sillä ole vielä päivää. Joukko kasvaa kuunvaihteessa
  noin tuhannella (lokakuun kääntöjä), minkä vuoksi IC-päivä kuuluu status-sync 2.0:lle
  ([D7](../docs/status-sync-2-tasmaytysajo.md#päätökset)).
- **B045304** on Fleet-raportin vakuutustapaus. Se olisi pitänyt päättää 31.07.2026, ja korvaava pyörä on
  B046829, jonka sopimus alkoi takautuvasti 01.08.2026 (käyttäjä 30.09.). IC-päivä on sääntöjen mukaan
  31.07.2026, mutta selvitystapa 8 on tarkistettava ensin (ks. TASKS.md, pyöräkohtaiset).
- **B017530** on testipyörä, ja se jätetään pois (käyttäjä 30.09.).

## Todennettu vs. päätelty

**Todennettu NetSuitesta 30.09.2026:** joukko (336), ryhmien luvut, jokaisen rivin kentät, 23 poikkeavaa
IC-päivää ja 65 IC-myymätöntä, joilla on IC-päivä.
**Päätelty:** eilisen täytön rajaus (kaudet 08–09/2026) ja se, että K1 jäi pois tavan 8 tai kauden takia.
Molemmat on luettu `lastmodified`:sta ja jakaumasta, ei ajon omasta rajauksesta.
