# Kuukausiraportointiajo 1.10.2026 — ajosuunnitelma

Laadittu 28.09.2026 kolmen agentin NetSuite-tutkimuksen pohjalta (RI-ennuste, CR-jono, ajojärjestys).
Tavoite: lokakuun RI-rivit ja palkka-CSV syntyvät ilman lunastuksista johtuvia vääriä rivejä, eikä
yksikään työnantaja jää Warningin takia pois CSV:stä.

Listat: [`findings/2026-09-28-tilannekatsaus/`](../findings/2026-09-28-tilannekatsaus/)
(`ri-ennuste-2026-10-*.csv`).

> [!IMPORTANT]
> **Tärkein tulos:** lunastus- ja päättymispolku tuottaa 1.10. oikean tuloksen lähes kaikille
> joukoille (vaihe 3 toimii: ri_creation ei lue statusta). Riskit ovat muualla:
> 1. **Testirajaus** voi olla yhä päällä ri_creationin ja ri_updaten deploymentissa (25.09. ajo oli
>    `⚠ TEST SCOPE`). Silloin lokakuun rivejä ei synny lainkaan.
> 2. **32 ennustettua Warning-riviä pidättäisivät 15 työnantajaa (~1 270 pyörää).** *Mitattu uudelleen
>    29.09.:* 27 niistä korjaa `cr_bike_register_updater` (1196) kuun viimeisenä päivänä ennen
>    ri_creationia — **edellyttäen, että 1196 todella ajaa 30.09.** (ks. E1). Jäljelle jää 5.
> 3. **Ajojärjestys:** jos jälkiveloitus siirtää 48 maksamattoman pyörän `subsc_end_date`:n ennen
>    ri_creationia, ne saavat Warningin (~44 työnantajaa lisää).
> 4. **T6 sammuttaisi sweepin** koko lokakuuksi, koska status-sync 2.0:aa ei ole vielä rakennettu.

## 1. Todennettu ajojärjestys kuunvaihteessa

Mitattu `scriptnote`-taulusta 1.9.2026 kuunvaihteesta, Helsingin aikaa (lokiaika + 10 h).

| Aika (Hki) | Skripti | Huom. |
|---|---|---|
| 00:01 | 1458 date backfill | täyttää `date_to_non_active` |
| 00:31 | 1440 sweep + vanha osa A | kääntää status 1 → 2/3 |
| 00:37–01:31 | 1199 CR-käsittely | hakee Pending-CR:t ajon alussa |
| 01:01 | 1437 subscription-extension | luo tyypin 7 CR:t **Pending**-tilaan |
| 01:32 | 1452 ri_creation | 1.9. ajettu tässä kohdassa; deployment on Testing |
| 03:05 | 1451 CSV | |
| 23:31 | 1196 bike-register updater | |
| 2 h välein | 966 Staria mid-life redemption | |

**Päätelty:** extension ajaa 24 min CR-käsittelyn alun jälkeen, joten sen luomat tyypin 7 CR:t
käsitellään vasta seuraavana yönä (2.10. ~00:37). ri_creation, joka ajetaan 1.10. päivällä, näkee
siis vielä vanhan `subsc_end_date` 30.09.:n ja A4-haara laukeaa oikein. **Tämä varmistetaan
aamulla kyselyllä Q2 ennen ajoa.**

## 2. Joukot ja ennuste 1.10. (RI-ennusteagentti)

| Joukko | kpl | Ennuste | Väärin |
|---|---|---|---|
| OOMI, status 1, päättyi 9/2026 ilman tapaa (S4b) | 77 | OOMI-ohitus tekee Ended-rivin | 0 — S4b:llä ei ole RI-vaikutusta |
| Ei-OOMI maksamaton, päättynyt | 94 | 46:lla lokakuun rivi jo; 48 saa Active-rivin + A4 | 0–48 Warningia, ks. § 1 |
| Tapa 1 ennen päättymiskuuta (K1) | 178 | Active-polku, Ended vasta 11/2026+ | 0 |
| D9 | 14 | Active | 0 |
| Syyskuussa Redeemed/Returned | 1 089 | 794 uutta Ended-riviä | 7 lokakuun Active C3-riviä muuttuvat Endediksi **vain täydessä ajossa**; 3 tupla-Ended-riviä |
| Status tyhjä | 5 | haku ohittaa | B046830 (OOMI, alkanut 1.8.) ei saa riviä |
| Warning, 1196 korjaa 30.09. (luokka b) | 27 | Oikea työnantaja, ei Warningia — jos 1196 ajaa | **0 / 27** |
| Warning, ei siirto-CR:ää (luokka c) | 2 | Warning | **2** |
| Warning, OOMI item 30 alkaa vasta 1.11. (luokka d) | 3 | Warning | **3** |

**Mittaus 29.09.** ([`warning-32-kohtalo-2026-09-29.csv`](../findings/2026-09-28-tilannekatsaus/warning-32-kohtalo-2026-09-29.csv)):
28.09. ennusteen "vanha työnantaja" ei ole virhe vaan siirto, joka tulee voimaan 1.10.
`cr_bike_register_updater.js:73-81` hakee kuun viimeisenä päivänä tyypin 1/9 CR:t, joiden tila on
Done ja `custrecord_cr_start_date` = seuraavan kuun 1. päivä, ja `cr_bike_register_apply.js:41-65`
kirjoittaa rekisteriin `contract_employer` = `bill_to_cus` = CR:n `next_billto_customer` (+ kustannuspaikka).
Kaikilla 27:llä on tällainen Done-CR alkupäivällä 1.10.2026, ja lokakuun item 30 -rivi on juuri sillä
asiakkaalla (todennettu). Mukana 3 pyörää, jotka 28.09. luokiteltiin virheellisesti aukoiksi
(B013794 CR 6036, B026475 CR 6042, B032028 CR 5991).

> [!WARNING]
> **Ajastettu 1196 ei kirjoittanut elokuun lopussa.** `scriptnote` 29.08.–1.9.: ajastetut ajot
> ~13:31 lokiaikaa ohittivat (*Not last day of month*), mutta **31.08. klo 13:31 ei ole riviä
> lainkaan**. Työnantajat kirjoitti ajo 31.08. 05:02 lokiaikaa (≈ 15:02 Hki, todennäköisesti käsin),
> 14 CR:ää. Ajastetun ajon toimivuus kuun viimeisenä päivänä on siis todentamatta. Tarkistus käyttää
> runtime-päivää (PDT), joten käsiajo 30.09. klo 10–24 Hki osuu oikeaan päivään.

Koodin kohdat (`netsuite-monthly-reporting`, päätelty koodista):
- päättymispäätös `mr_monthly_reporting_ri_creation.js:1128-1145` (ei lue statusta), hakusuodatin
  `:924` lukee yhä statusta 1/2/3
- kirjasto `gbb_lunastus_lib.js:267`/`:305`: `COALESCE` voimassa, tapa 1 ilman maksua ei ole todiste
- kirjasto heittää tunnistamattomasta päivästä `:175`; ri_creation `:1132-1141` ohittaa pyörän
  `log.error`illa, **ei näy `mapErrors`issa** → hae `scriptnote`sta `rejected bike fields`
- ri_update `:769-773`: status 2/3 -demotio poistunut; `[To-add…]`-rivejä 0

## 3. Tehtävät ennen ajoa

### 29.09. (ti)

| # | Tehtävä | Kuka | Valmis kun |
|---|---|---|---|
| E1 | **Ei CSV:tä 27 luokan b pyörälle** — 1196 hoitaa ne (29.09. mittaus). CSV samalla arvolla olisi idempotentti mutta tarpeeton, ja se laukaisisi turhaan rekisterin UE:t (699, `ue_reporting_item_maintenance_prolongation`). **Luokka c, 2 pyörää ilman siirto-CR:ää:** B009498 (rekisterissä Oy Nautor Ab, item 30 -rivi 50399 asiakkaalla Erikssons Bolagen Ab 5323) ja B010548 (Pirkan Rakentajapalvelu Oy → rivi 49472 asiakkaalla Infra Kiri Oy 4622). Oikea työnantaja vahvistetaan asiakaspalvelulta; syyskuun RI-rivi voi kantaa samaa vanhaa virhettä. Sitten joko rekisterikorjaus käsin tai siirto-CR. | Tuoteomistaja / asiakaspalvelu | päätös ja korjaus kirjattu |
| E2 | **3 OOMI-pyörää, item 30 -rivi alkaa vasta 1.11.2026:** B046737 (rivi 116109), B046742 (116123), B046832 (116121). Ei työnantajakysymys eikä 1196:n asia. Joko lokakuun item 30 -rivi puuttuu (OOMI-tuonnin ajoitus) tai lokakuu ei kuulu raportoitaviin. Jos ei ratkaista ennen ajoa, Warning pidättää työnantajan: päätä poistetaanko rivi ennen CSV:tä. | Tuoteomistaja | päätös kirjattu |
| E3 | **B046830** `bike_status` → 1 (OOMI, alkanut 1.8.2026, ei yhtään RI-riviä). Kirjoitus laukaisee `gbb_webhook_ue_status_changed.js`:n. | Käyttäjä | pyörällä status 1 |
| E4 | T1b (S4b) ajetaan kuten suunniteltu — ei RI-vaikutusta, mutta estää Active-jumittumisen. Poista B041564; tyhjennä B044271:n `exceptional_end_date` ensin. | Käyttäjä | TASKS T1b |
| E5 | **Extension-deploymentin parametrit UI:sta** (`customdeploy_gbb_sub_extension`): `custscript_gbb_ext_override_sub_end_date` tyhjä, ei testipyörää, toisto 1. päivä (ei 31.). 97 kandidaattia, joista 7 OOMI (B039007, B040393, B042039, B043989, B044063, B044311, B046310) saisi väärän tyypin 7 CR:n, jos override on asetettu. | Käyttäjä | kuvakaappaus/merkintä |

### 30.09. (ke)

| # | Tehtävä | Kuka |
|---|---|---|
| E1b | **1196 käsin 30.09. päivällä** (klo 10–22 Hki, runtime-päivä 30.09.), kuten elokuussa. Heti perään Q0: `scriptnote` 1196 näyttää `Running for start date 01.10.2026`, `Found N CR(s)` (N ≥ 27) ja `Updated bike register …` kullekin; ja kysely: 27 pyörän `custrecord_sta_contract_employer` = CR:n `next_billto_customer`. Ajastettu yöajo kirjoittaa samat arvot uudelleen (idempotentti). | Käyttäjä ajaa, Claude tarkistaa |
| E6 | **Päätös T6:sta ennen iltaa.** `customdeploy_gbb_redemption_sync` on sama deployment kuin sweep (1440). Jos se sammutetaan, lokakuussa mikään ei käännä statusta 1 → 2/3, ja 1.11. extension luo tyypin 7 CR:n lokakuussa lunastetuille pyörille (haku vaatii Active). **Suositus: T6 siirretään** status-sync 2.0:n käyttöönottoon; osa A:n ennenaikainen tapa 1 on sallittu poikkeama (kenttäsäännöt § 9), ja S1c/K1-ryhmän korjaukset tehdään CSV:llä. | Tuoteomistaja |
| E7 | T4 (S1c), T2/T5 (IC-päivät) kuten TASKS — eivät vaikuta RI-riveihin, mutta kuuluvat kuunvaihteeseen. | Käyttäjä |
| E8 | CR 6834 / lasku INVGBF1043422 (B028437): mahdollinen lokakuun kaksoislasku → taloustiimi. P3 (Staria 966, B031217) päätös. | Käyttäjä → talous |

## 4. Ajopäivä 1.10. (to)

1. **Q1 — yöajot kunnossa:** `scriptnote` 1440, 1199, 1437 ajoivat, 0 virhettä; sweepin rivi
   `… status changes written …` ja CR-käsittelyn erä luettu. **1196:** jos E1b:tä ei tehty, 30.09.
   ~13:31 lokiajan ajo on kirjoittanut 27 työnantajaa (kuten E1b:n Q0). Jos ei, **pysähdy**: 1196:n
   ajaminen ei enää auta (runtime-päivä on 1.10.), vaan 27 korjataan CSV:llä
   (`warning-32-kohtalo-2026-09-29.csv`, sarake `oikea_tyonantaja`) ennen ri_creationia.
2. **Q2 — extensionin CR:t yhä Pending:** tyypin 7 CR:t, luotu 1.10., kaikki status 1. Jos
   yksikin on Done, **pysähdy**: 48 maksamatonta saa Warningin (ks. § 2). Silloin ajetaan
   ri_creation vasta kun asia on arvioitu.
3. **Deployment:** tyhjennä `custscript_gbb_ri_test_bike_id` ja `custscript_gbb_update_test_bike_id`
   (UI, ei näy SuiteQL:ssä). Raportointipäivä 01.10.2026.
4. Aja **ri_creation (1452)** täytenä ajona, sitten **ri_update (1453)**.
5. **Q3 — jälkitarkistus ennen CSV:tä** (`scriptnote` 1452 ja RI-taulu):
   - summarize: bucketit `ended_created` + `oomi_ended_created` ≈ **880**,
     `active_created_warning` ≈ **5** (luokat c ja d, jos niitä ei ole korjattu; 27 luokan b
     pyörää eivät saa Warningia). `mapErrors` = 0.
   - `rejected bike fields` -rivit `scriptnote`sta: odotus 0, jokainen on kadonnut rivi.
   - Lokakuun Warning-rivit työnantajittain: vain E2:n ja testipyörän B017530 (Testi Yritys Oy)
     työnantajat.
   - 7 Redeemed-pyörän lokakuun C3-rivit (116175, 117366, 117368, 116193, 116176, 117367, 117365)
     ovat nyt Ended.
   - Gate: yhdelläkään pyörällä, jonka status on 2/3 ja päättymisajankohta ≥ 1.10., ei Active-riviä
     lokakuulle.
6. Päätä ennen CSV:tä: 3 tupla-Ended-riviä (B008217 108439+115872, B045099 115214+115922,
   B018137 90511+115904) ja testipyörän B017530 rivit — poistetaanko.
7. Aja **CSV (1451)**.

## 5. Tunnetut asiat, jotka eivät kaada ajoa

- CR 4636 (hyvitys) ja 6488 (B016555 jälkiveloitus) kaatuvat joka ajolla juurisyyhyn
  (sopimusrivi 81806:n invoice-historia; ei sopimusrivejä pyörälle 16555). Puuttuva kirjaus, ei
  väärä RI-rivi. Resetointi Pending-tilaan ei auta.
- 7 uutta tyypin 2 CR:ää (luotu 28.09., nimet `- 2C` oikein) käsitellään yöllä normaalisti.
- CR 4692 (tyyppi 10, B023888) ei kuulu mihinkään erään — harmiton, siivottavissa Cancelled-tilaan.
- 3 tyypin 13 Error-CR:ää (6699, 6703, 6705): sama puuttuva asiakas `57940484411`.
- 48 lokakuun maksamattoman rivin huomioteksti (*Pyörän lunastus on myöhässä*) puuttuu; vain C3
  -riveillä se on. Liiketoimintapäätös, ei virhe.
- `handler_jalki` ei luo item 30 -riviä pidennetylle kaudelle → sama Warning-riski toistuu 1.11.
  kaikille syyskuussa pidennetyille. **Korjattava omistavassa repossa ennen marraskuuta.**

## Todennettu vs. päätelty

- **Todennettu NetSuitessa 28.09.:** kaikki luvut, rivi- ja CR-id:t, ajoajat 1.9. kuunvaihteesta,
  deploymentien tilat, tiedostojen muutospäivät.
- **Päätelty:** ri_creationin tulos 1.10. (koodista), extensionin CR:ien käsittely vasta 2.10.
  (ajoajoista), deploymentien parametriarvot (ei kyselyllä nähtävissä).
