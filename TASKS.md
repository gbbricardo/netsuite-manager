# TASKS

Päivätyt työtehtävät. Tämä on **tehtävälista**: mitä tehdään ja milloin. Tilannekuva ja mittarit
ovat [`docs/lunastus-tilanne.md`](docs/lunastus-tilanne.md):ssä ja säännöt
[`docs/lunastuksen-kenttasaannot.md`](docs/lunastuksen-kenttasaannot.md):ssä.

Kun tehtävä on tehty, merkitse se `[x]`, kirjaa päivä ja tulos, ja päivitä tilannedokumentti.
Poista tehtävä vasta kun se on ollut tehtynä viikon.

---

## 25.09.2026 (pe) — aamulla

### [ ] T1 — Todenna S4:n statuskääntö

S4 ajettiin 24.09. ([import](imports/2026-09-24-oomi-kauden-loppu/README.md)). Sweepin (1440) yöajo
kääntää 34 OOMI-pyörää statukseen 2.

```sql
SELECT custrecord_sta_bike_status, COUNT(*) FROM customrecord_sta_bike_register
WHERE id IN (40788,38578,46136,38234,42604,40191,41859,37626,43907,39891,38188,40155,38130,44755,
             40461,45363,45169,45371,44058,40679,45211,40368,45836,44907,43900,41608,45193,41761,
             39499,42580,43611,37743,46285,43395)
GROUP BY custrecord_sta_bike_status
```

**Valmis kun** kaikki 34 ovat status 2. Jos yksikin on yhä status 1, lue sweepin loki
(`scriptnote`, `scripttype = 1440`, aikaväli 24.–25.09.) ennen kuin jatkat. Tee S2 silti, koska
kääntymättömät pyörät siirtyvät S3:een.

### [ ] T2 — S2: IC-päivät CSV:llä

Suunnitelma: [`docs/status-sync-2-tasmaytysajo.md`](docs/status-sync-2-tasmaytysajo.md) § Syyskuu,
rivi S2. Sääntö: `ic_redemption_dt = LAST_DAY(päättymisajankohta)` ([ADR 0007](docs/adr/0007-status-sync-2-tasmaytysajo.md),
[ADR 0009](docs/adr/0009-kauden-lopun-lunastus.md): jälkiveloitetulla pyörällä kyse on siirretystä
päättymisajankohdasta).

- Joukko: status 2/3, IC-myyty (`ic_sale_dt` tai `ic_sale_price` asetettu), `ic_redemption_dt`
  tyhjä, `ic_redemption_done` ≠ T ja `ic_redemption_pr` tyhjä. **24.09.: 1 366**, ja T1:n jälkeen
  noin +33.
- Päättymisajankohta = `COALESCE(exceptional_end_date, oomi_exceptional_end_date, subsc_end_date)`.
  Jos se puuttuu, pyörä listataan eikä sitä importoida.
- **D1 on auki** (taloustiimi): kirjoitetaanko IC-päivä myös IC-myymättömille (24.09.: 176)? Jos
  vastausta ei ole, ajetaan vain IC-myydyt.
- Tee kansioon `imports/2026-09-25-s2-ic-paivat/` CSV ja README, jossa on tarkistussumma (rivit,
  `SUM(id)`), samaan tapaan kuin aiemmissa importeissa.
- Anna CSV käyttäjälle ajettavaksi. **Älä kirjoita NetSuiteen itse.**

**Valmis kun** import on ajettu ja kysely *status 2/3, IC-myyty, ei IC-päivää …* palauttaa 0.
Kerro taloustiimille, että laskuri (`customdeploy_gbb_ic_redemption_pr`, Not Scheduled) on
ajettava ja `-1`-rivit käytävä läpi ennen 30.09.

---

## 28.09.2026 (ma)

### [ ] T3 — K4:n uusintatarkistus (B029495)

Vanhan status-syncin osa A voi kirjoittaa tavan 1 takaisin B029495:lle 27.09. asti. Kysely on
[importin README:ssä](imports/2026-09-24-s1-ennenaikainen-tapa/README.md) § Jälkitarkistus, ja
odotus on 0 riviä. Poikkeus: B016666 saa CR 6718:n arvot, jos CR on käsitelty.

**Laajennettu 24.09. ([ADR 0010](docs/adr/0010-keskenkauden-lunastus.md) kohta 2):** tarkista samalla
kaikki 19 keskenkauden maksun pyörää ilman CR:ää ([löydös](findings/2026-09-24-keskenkauden-maksu-ilman-cr.md),
luokat A1 ja A2). Onko jollekin ilmestynyt tapa 1 tai `liab_settled_at` 24.09. jälkeen? Odotus:
vain B013550, B029483, B040838 ja B041610 kantavat tapaa 1, kuten 24.09. Niihin ei kosketa, sillä
ne hoidetaan lokakuussa.

---

## 30.09.2026 (ke)

### [ ] T4 — S1c: maksujen poimintakysely uudelleen

[`docs/status-sync-2-tasmaytysajo.md`](docs/status-sync-2-tasmaytysajo.md), rivi S1c. Ennen S3:a.
Huomaa [ADR 0009](docs/adr/0009-kauden-lopun-lunastus.md) kohta 4: tapa 1 ja `liab_settled_at`
kirjataan vain, jos pyörän päättymiskuu on alkanut eikä pyörällä ole tyypin 2/10 CR:ää. Muuten
kirjataan pelkkä `paid_at`.

### [ ] T5 — S3: täydentävä IC-CSV

Sama sääntö ja sama joukkoehto kuin T2:ssa. Mukaan tulevat pyörät, jotka ovat kääntyneet T2:n
jälkeen (CR:t, maksut, T1:n kääntymättömät). **Valmis kun** sama kysely palauttaa 0 ennen
kuunvaihdetta.

### [ ] T6 — Vanha status-sync pois ajastuksesta

30.09. illalla `customdeploy_gbb_redemption_sync` → *Not Scheduled*
([suunnitelma § Lokakuu](docs/status-sync-2-tasmaytysajo.md#lokakuu--käyttöönotto-kerralla)).
Tämä tehdään vasta T5:n jälkeen.

---

## Syyskuu, käyttäjä ajaa (ADR 0010)

### [ ] T7 — `decided_at`-historia CSV:llä

[`imports/2026-09-25-decided-at-historia/`](imports/2026-09-25-decided-at-historia/README.md). Noin
1 735 pyörää saa arvon `decided_at` = uusimman Done-tilaisen tyypin 2 CR:n luontipäivä. **Valmis
kun** kenttäsääntöjen § 10:n kysely *Päätöspäivä ≠ CR:n luontipäivä* palauttaa 0.

### [ ] T8 — Poikkeuspäivät `subsc_end_date`:iin CSV:llä

[`imports/2026-09-25-poikkeuspaivat-subsc/`](imports/2026-09-25-poikkeuspaivat-subsc/README.md), 33
pyörää. **Ennen T11:tä.** Aja README:n tarkistuskysely juuri ennen importtia. **Valmis kun**
jälkitarkistus palauttaa 0.

---

## Lokakuu 2026 (ADR 0010)

### [ ] T9 — Staria-hyvitysskripti pois ajastuksesta

`customdeploy_sta_mr_mid_life_redemption` → *Not Scheduled*. Skripti ajaa 24.09. kahden tunnin
välein, eikä se osaa tehdä hyvityksiä oikein. Tyypin 11 CR on ainoa hyvityspolku. Selvitä samalla
B031217 (`sta_redemption_date` 30.11.2025, `cm_processed` F). **Valmis kun** `scriptnote` ei näytä
uusia ajoja (`scripttype = 966`).

### [ ] T10 — 19 keskenkauden maksua ilman CR:ää, yksitellen

Omistaja on asiakaspalvelu. Lista on [löydöksessä](findings/2026-09-24-keskenkauden-maksu-ilman-cr.md)
(A1 12 kpl, A2 7 kpl). CR:t tehdään käsin, ei importilla. Luontipäivä on todellinen luontipäivä.
Aikaisin päättyy B010162 (31.12.2026). Myös B013550, B029483, B040838 ja B041610 käsitellään
tässä: niillä on tapa 1 ilman CR:ää.

### [ ] T11 — Kirjasto: päättymisajankohta = `subsc_end_date`

Vaatimus K1 [vaatimuslistassa](docs/keskenkauden-lunastus-vaatimukset.md). Tämä toteutetaan
omistavassa repossa, ja **vasta T8:n jälkeen**. Päivitä samalla tämän repon `queries/` ja
kenttäsääntöjen `COALESCE`-kyselyt.

### [ ] T12 — D9: 15 Fleet-päättynyttä Active-pyörää ilman selvitystapaa

[ADR 0010](docs/adr/0010-keskenkauden-lunastus.md) § Avoin päätös. Tuoteomistaja päättää: OOMI:n
kauden lopun käsittely (tapa 1) vai CR? T8 kopioi niiden päivän `subsc_end_date`:iin, joten
päätös ei riipu T11:n ajoituksesta. Pyörät ovat jumissa, kunnes päätös on tehty.

### [ ] T13 — Handlerin vaatimukset H1–H6

[Vaatimuslista](docs/keskenkauden-lunastus-vaatimukset.md). Toteutetaan `netsuite-subscrption-cr-scripts`:ssä.

---

## Auki, ei päivää

- **D1** (taloustiimi): IC-päivä IC-myymättömille lunastetuille pyörille? Vaikuttaa T2:een ja T5:een.
- **Vaatimukset S1–S3** (status-sync 2.0, [ADR 0010](docs/adr/0010-keskenkauden-lunastus.md)): Needs Review -jono, maksu ilman CR:ää, tyyppi 10 yli 30 pv.
- **K1–K3** (status-sync 2.0): maksuvaiheen kuukausiehto, jälkiveloituksen kattavuus ja OOMI-haara
  ([ADR 0009](docs/adr/0009-kauden-lopun-lunastus.md)). Nämä toteutetaan omistavassa repossa, ei
  täällä.
