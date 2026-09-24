# ADR 0010 — Keskenkauden lunastus: CR on päätös, todiste ja ainoa päättymisen lähde

- **Päivämäärä:** 2026-09-24
- **Tila:** Hyväksytty (tuoteomistaja, grilling-sessio 24.09.2026, kysymykset Q1–Q26)
- **Koskee:** **keskenkauden lunastusta** (CR-tyyppi 2 *Keskenkauden lunastus*, päätteet 2B, 2C,
  2D ja vakuutus). Kauden lopun lunastus jatkuu [ADR 0009](0009-kauden-lopun-lunastus.md):n mukaan.
- **Täydentää:** [ADR 0008](0008-keskenkauden-lunastuksessa-cr-voittaa-maksun.md), jonka säännöt 1–3
  ovat voimassa
- **Muuttaa:** [ADR 0001](0001-uusi-paatospaiva-kentta.md) ja [ADR 0004](0004-paatospaivan-kirjoittaa-ue.md)
  (päätöspäivän arvo ja kirjoittaja keskenkauden lunastuksessa, ja historiaa korjataan)
  sekä [ADR 0009](0009-kauden-lopun-lunastus.md) kohdan 1 (`oomi_exceptional_end_date` ei ole enää
  päättymisajankohdan lähde)
- **Kenttätaso:** [kenttäsäännöt § 10](../lunastuksen-kenttasaannot.md#10-keskenkauden-lunastus)
- **Toteutusvaatimukset omistaville repoille:** [`../keskenkauden-lunastus-vaatimukset.md`](../keskenkauden-lunastus-vaatimukset.md)

## Konteksti

ADR 0008 päätti, että keskenkauden lunastuksessa CR voittaa maksun. Se jätti auki, mitä CR itse
todistaa, mistä päättymispäivä tulee ja mitä tapahtuu, kun CR puuttuu tai on puutteellinen.
Koodiselvitys 24.09. (`handler_lunastus.js`, cf-gbb-tools `plan.ts`, monthly-reportingin UE)
paljasti lisäksi:

- CR:ssä on kaksi päättymispäivää, jotka ohjaavat eri asioita.
- Käsittelijä kirjoittaa CR:n tyhjän virallisen päättymispäivän rekisteriin ilman vartijaa. Tyhjä
  arvo on 521:llä 2 495:stä Done-tilaisesta CR:stä.
- Kirjaston päättymisajankohta on kolmen kentän `COALESCE`, joten olemassa oleva poikkeuspäivä
  ohittaa CR:n päivän.

## Päätökset

### 1. CR yksin riittää todisteeksi velvoitteiden hoitamisesta (Q1)

CR:n luo asiakaspalvelija, ja se on riittävä todiste siitä, että loppuvastuut on hoidettu. Tämä
pätee kaikilla päätteillä, myös 2C:llä (tapa 1). Käsitelty CR kirjoittaa selvitystavan ja
`liab_settled_at`:n. Kalenterisweep kääntää pyörän tunnistuspäivänä, **vaikka maksua ei olisi
havaittu.** Maksun perintä on taloustiimin asia, eikä maksun puuttuminen pidätä statusta.

### 2. Keskenkauden lunastus vaatii aina CR:n (Q2, Q14, Q15)

Pelkkä maksu ei päätä mitään (ADR 0008 sääntö 3). Jos maksu on tullut ilman CR:ää, CR luodaan
takautuvasti **yksitellen käsin**, ei importilla, koska jokainen tapaus on katsottava erikseen.

24.09. löytyi 19 Active-pyörää, joilla on keskenkauden maksu mutta ei CR:ää (12 muuta, 7 OOMI)
([löydös](../../findings/2026-09-24-keskenkauden-maksu-ilman-cr.md)). Ne käsitellään **lokakuun
erikoiskäsittelyssä** asiakaspalvelun kanssa tämän projektin ulkopuolella. Aikaisin niistä
päättyy 31.12.2026. Neljällä (B013550, B029483, B040838, B041610) on jo maksusta tullut tapa 1.
Niihin ei kosketa nyt, koska ne kääntyisivät vasta päättymiskuussaan 2027–2028.

Takautuvasti luodun CR:n luontipäivä on sen todellinen luontipäivä (ks. kohta 4). Maksupäivä
säilyy `paid_at`:ssa.

### 3. Hyvitys tehdään erillisellä tyypin 11 CR:llä (Q3, Q12)

Takautuvassa lunastuksessa päättymisajankohdan jälkeen laskutetut kuukaudet hyvitetään tyypin 11
CR:llä (*"… – hyvitys"*), jonka cf-gbb-tools luo rinnalle. **Se on ainoa sallittu hyvityspolku.**

Staria-skripti `customscript_sta_mr_mid_life_redemption` ei osaa tehdä hyvityslaskuja oikein, eikä
sitä saa käyttää. Todennettu 24.09.: deployment `customdeploy_sta_mr_mid_life_redemption` on
**Scheduled** ja ajaa kahden tunnin välein. Käyttö on 0, koska jonossa ei ole mitään. Vuonna 2026
kenttä `custrecord_sta_redemption_date` on asetettu 100 pyörälle, ja kaikilla on
`cm_processed = T`. **Deployment poistetaan ajastuksesta** (TASKS.md), ja valvontakysely hälyttää,
jos kenttä asettuu.

### 4. Päätöspäivä on CR:n luontipäivä (Q4, Q11, Q18)

Keskenkauden lunastuksessa `custrecord_gbb_redemption_decided_at` = `custrecord_cr_created_date`.
Silloin `decided_at` = `liab_settled_at` = CR:n luontipäivä, eikä päivä riipu siitä, milloin jono
purkautui.

- **Kirjoittaja:** `handler_lunastus` samassa tallennuksessa kuin selvitystapa. UE:n
  write-once-vartija jättää sen rauhaan.
- **Historia korjataan CSV:llä**, toisin kuin ADR 0001 linjasi. Kaikki pyörät, joilla on Done-tilainen
  tyypin 2 CR, saavat arvon **uusimman** Done-tilaisen tyypin 2 CR:n luontipäivästä. UE:n
  leimaamat eri arvot ylikirjoitetaan. Mitattu 24.09.: 1 769 pyörää, joista 1 711 tyhjää, 34 jo
  oikein ja 24 eri ([`imports/2026-09-25-decided-at-historia/`](../../imports/2026-09-25-decided-at-historia/README.md)).

### 5. Ennenaikainen päättyminen on aina kuun viimeinen päivä (Q5)

Keskenkauden päättyminen ei voi osua keskelle kuuta. Päättymiskuu laskutetaan ja raportoidaan
kokonaan, eikä osakuukausia ole.

### 6. CR:n kaksi päivää pidetään erillään (Q7)

| CR:n kenttä | Merkitys | Mihin |
|---|---|---|
| `custrecord_cr_contract_official_end_date` | sopimuksen päättymisajankohta, aina kuunloppu | rekisterin `subsc_end_date`, RI:n Ended-rivi, `ic_redemption_dt` |
| `custrecord_cr_end_date_of_old_sub` | päivä johon asti on jo laskutettu | sopimusrivien loppupäivä |

Sopimusrivit katkaistaan **laskutettuun päivään**, ja raha korjataan hyvityksellä. Muuten
laskutusrivit ja hyvitys kertoisivat eri asiaa. Takautuvassa lunastuksessa sopimusrivin
loppupäivä on siis myöhempi kuin päättymisajankohta, **eikä se ole virhe**.

### 7. Puutteellinen CR menee Needs Review -tilaan (Q8, Q10, Q20)

Käsittelijä ei kirjoita mitään ja asettaa CR:n tilaan **6 Needs Review**, jos:

- `custrecord_cr_contract_official_end_date` on tyhjä
- `custrecord_cr_created_date` on tyhjä (ajopäivällä ei saa paikata)
- CR:n päivä on **myöhempi** kuin pyörän nykyinen päättymisajankohta. Keskenkauden lunastus voi
  vain aikaistaa päättymistä, ja sama päivä kelpaa.

**Jonon omistavat taloustiimi ja asiakaspalvelu. Määräaika on CR:n luontikuun loppu.** Muuten
virheellinen kuukausi ehditään laskuttaa ja raportoida. Status-sync 2.0:n päivittäinen raportti
listaa jonon.

### 8. Päättymisajankohta on `subsc_end_date`, ja poikkeuskentistä luovutaan (Q9, Q17, Q22–Q26)

**Tavoitetila:** päättymisajankohta = `custrecord_sta_subsc_end_date` ja vain se. Kaikki
päättymisen muutokset tulevat CR:n kautta. CR kirjoittaa vain `subsc_end_date`:n.
Alkuperäinen päivä on `custrecord_sta_subsc_org_end_date`:ssa, ja ennenaikaisuuden kertoo tyypin
2 CR.

- **`custrecord_gbb_exceptional_end_date`: käytöstä luovutaan.** Mikään skripti ei lue eikä
  kirjoita sitä. Vanhat arvot jäävät historiaksi. (Q17:n välivastaus *"täytetään aina"* kumottiin
  Q26:ssa.)
- **`custrecord_gbb_oomi_exceptional_end_date` jäädytetään skripteiltä, ei käsin.** Fleet-raportin
  CSV-viennit päivittävät sitä edelleen, jotta Fleet-raportin tiedot näkyvät NetSuitessa. Juuri
  siksi yksikään skripti ei saa enää lukea sitä päättymisajankohdaksi, koska silloin CSV voisi
  päättää pyörän ilman CR:ää.
- **Kirjaston `paattymisajankohta` supistuu yhteen kenttään** lokakuussa 2026. Kolmen kentän
  järjestysansa katoaa kaikilta lukijoilta (sweep, RI-luonti, IC-päivä, statusportti).

Kaksi kenttää, joiden pitää aina olla samat, on juuri sellainen asymmetria, jota tämä projekti
etsii. Lisäksi `handler_jalki` siirtää jälkiveloituksessa vain `subsc_end_date`:a, joten asetettu
poikkeuspäivä jäädyttäisi päättymisen huomaamatta.

**Siirtymä (Q25).** Mitattu 24.09.: poikkeuskenttiä on 235 pyörällä, joista 201:llä ne ovat samat
kuin `subsc_end_date`. Ero on 34:llä:

| Poikkeuspäivä | Pyöriä | Toimenpide |
|---|---|---|
| ≤ 30.09.2026 | **33** | CSV ennen kirjastomuutosta: `subsc_end_date` = nykyinen päättymisajankohta ([`imports/2026-09-25-poikkeuspaivat-subsc/`](../../imports/2026-09-25-poikkeuspaivat-subsc/README.md)). Päättymisajankohta ei muutu, joten kirjastomuutos on näille neutraali |
| > 30.09.2026 | **1** (B044504, 31.10.2026) | ei CSV:tä. Kirjastomuutoksen jälkeen pyörä seuraa `subsc_end_date`:a (01.04.2027). Jos Fleetin ennenaikainen päättyminen on todellinen, se tehdään CR:llä kuten kaikki lokakuusta alkaen |

**Järjestys: CSV ensin, sitten kirjasto.** Jos kirjasto muuttuu ensin, 16 päättyneen pyörän
päättymisajankohta siirtyy myöhemmäksi, ja RI-luonti voi alkaa tuottaa niille Active-rivejä.

### 9. Tyyppi 10 (reklamaatio/peruutus) rajataan ulos (Q6, Q13)

Tyyppi 10 on monimutkainen ja harvinainen, ja se vaatii ihmisen. Mikään skripti ei käsittele sitä
(dispatcherissa ei ole haaraa, ajastus ei ota sitä erään, eikä UE laukea). ADR 0009:n sääntö
pidetään: Pending- tai Done-tilainen tyypin 10 CR tekee pyörästä ennenaikaisen, jolloin se ei saa
kauden lopun tapaa. Pyörä odottaa ihmistä. **Valvonta:** tyypin 10 CR Pending yli 30 päivää.

## Avoin päätös

**D9 — 15 Active-pyörää, joilla on Fleetin ennenaikainen päättyminen ja joilta puuttuu
selvitystapa.** 13 pyörän `oomi_exceptional_end_date` on 31.05.–31.08.2026, eli päättymisajankohta
on mennyt. Kahden päivä on 30.09.2026. Selvitystapaa ei ole, joten sweep ei käännä niitä. S4 rajasi ne tarkoituksella pois (ADR
0009 kohta 1: *"käsitellään vanhalla tavalla"*), mutta vanhaa tapaa ei ole kukaan toteuttanut:

B038492, B045304, B039331, B045053, B037449, B045139, B044256, B044271, B043367, B046189,
B042654, B038978, B039948 sekä 30.09. päättyvät B039775 ja B038943.

B038492:n tilaustyyppi on tyhjä, joten sitä ei ole merkitty OOMI-pyöräksi. Ratkaistava
lokakuussa: saavatko pyörät ADR 0009:n kohdan 6 OOMI-käsittelyn (tapa 1,
`liab_settled_at` = tunnistuspäivä), vai onko Fleetin päättyminen keskenkauden lunastus, jolloin
tarvitaan CR? Kohdan 8 CSV ei ratkaise tätä, vaan pitää vain niiden päättymisajankohdan ennallaan.

## Seuraukset

- **Vaatimukset `netsuite-subscrption-cr-scripts`:lle** (handler ja kirjasto) sekä status-sync
  2.0:lle ja cf-gbb-toolsille: [`keskenkauden-lunastus-vaatimukset.md`](../keskenkauden-lunastus-vaatimukset.md).
- **Syyskuun importit** (käyttäjä ajaa): `decided_at`-historia ja 33 pyörän `subsc_end_date`.
- **Lokakuu:** 19 CR:ää yksitellen, Staria-skripti pois ajastuksesta, kirjastomuutos poikkeuskenttien
  jälkeen ja D9.
- **Kenttäsäännöt** § 2, § 5, § 8 ja uusi § 10 päivitetty. Myös `CONTEXT.md` päivitetty.

## Todennettu vs. päätelty

**Tuoteomistajalta 24.09.2026:** päätökset 1–9.

**Todennettu NetSuitesta 24.09.2026:**

- 19 pyörää ilman CR:ää, lähteineen
- Staria-deploymentin tila ja ajot (`scriptnote`, script 966) ja `sta_redemption_date`-jakauma
- `decided_at`-joukon koko
- poikkeuskenttien 235/201/34-jakauma ja 34 pyörän päivät

**Todennettu koodista (sub-agentin selvitys 24.09.):**

- käsittelijän kentät ja vartijat: `handler_lunastus.js:94-102`, `:147-149`, `:226-231`, `:312-367`
- cf-gbb-toolsin CR-luonti: `plan.ts:113-150`, `:393-433`
- monthly-reportingin UE ja RI-luonti: `ue_reporting_item_mid_term_redemption_return_theft_loss.js:113-120`,
  `mr_monthly_reporting_ri_creation.js:1126-1143`
- tyypin 10 käsittelyn puuttuminen: `cr_dispatcher.js:53-83`

**Päätelty:**

- 521 tyhjää virallista päättymispäivää on historiaa eikä tuoretta. Tätä ei ole mitattu
  aikajakaumana.
- Kirjastomuutos ei muuta muiden lukijoiden tulosta niillä 201 pyörällä, joilla kentät ovat samat.
