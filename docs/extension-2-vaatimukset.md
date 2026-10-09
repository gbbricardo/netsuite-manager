# Extension 2.0 — vaatimusmäärittely

- **Päivämäärä:** 9.10.2026
- **Koskee:** `netsuite-subscription-extension` (script 1437 `customscript_gbb_bike_sub_extension`, deployment `customdeploy_gbb_sub_extension`, nyt `NOTSCHEDULED`) kirjoitetaan uudelleen.
- **Lähteet:** [ADR 0012](adr/0012-loppulunastushinta-ja-kattavuus.md), [ADR 0014](adr/0014-maksulinkin-korjaus-ja-yksinkertaistus.md), [ADR 0015](adr/0015-status-sync-2-tarkennukset.md), [kenttäsäännöt § 10–11](lunastuksen-kenttasaannot.md), [käsittelyloki R5–R6](../findings/2026-10-02-maksulinkki-kasittelyloki.md), sisarrepon README ja `mr_subscription_extension.js`.
- **Merkintä:** (V) = todennettu koodista tai dokumentista, (P) = päätelty, (K) = tuoteomistajan päätös, (?) = avoin, katso viimeinen osio.

## Tarkoitus

Skripti luo Pending-tilaisen tyypin 7 pidennys-CR:n (*jälkiveloitus*) pyörälle, jonka kauden lopun lunastus ei ole hoidettu ja jonka sopimus on päättynyt edellisessä kuussa. CR:n käsittelee CR-prosessori (`handler_jalki` laskuttaa kuukauden ja siirtää `subsc_end_date`:a). Skripti ei itse laske, laske laskuja tai siirrä päiviä.

Uudelleenkirjoitus korjaa kaksi vanhan skriptin vikaa ja yhdenmukaistaa säännöt maksulinkin (1479) kanssa: jälkiveloitus ei saa alkaa pyörälle, jonka lunastus on jo katettu.

## Päätökset

1. **Uudelleenkirjoitus on tuotannossa ennen 1.11.2026. Varasuunnitelmaa (käsin CSV) ei ole.** (K 9.10.)
2. **Valinta on ajopäivästä riippumaton ja idempotentti.** Ei tallennettua hakua (`customsearch_gbb_br_pidennykset` ja parametri `search_id` poistuvat). Valinta on SuiteQL koodissa. (K 9.10.)
3. **Vanhan skriptin viat (V, README):**
   - *Väärä ajankohta.* Ajo kuun 1. päivänä 01:00 ehtii ennen maksujen kirjautumista. Paylink-synkka ajaa noin 23:31, status-sync 00:31 ja extension 01:01 (ADR 0015 k. 11).
   - *Haku ja ajastus sitoivat toisensa.* Haun suodatin `subsc_end_date = eilen` toimii vain kuun 1. päivänä. Siksi ajoa ei voinut siirtää (esim. 7. arkipäivälle), ja `dayOfMonth 31` ohitti kokonaisia kuukausia ilman virhettä.
4. **Samat säännöt kuin maksulinkissä (K 2.10., 6.–7.10.):** hinta − huoltohyvitys (summasta), tapa asetettu = ei pidennystä, hinta 0 = ei pidennystä, kattavuus M1. *"Jos lunastushinta on 0 €, silloin ei tarvitse pidentää mitään."*
5. **Hintakirjasto on `lib_gbb_redemption_price.js`** (maksulinkkirepo, `src/`, File Cabinetissa 1479:n kansiossa). Uusi skripti lataa sen File Cabinet -polusta (absoluuttinen polku, kuten status-sync 2.0, ADR 0015 k. 5) eikä kopioi logiikkaa. Käytetään `prepareBrackets`, `maintenanceRemainder` ja `calculate`. Helsingin päivät tulevat `lib_gbb_helsinki_date.js`:stä (`helsinkiToday`, `shiftMonths`).
6. **Yksinkertainen skripti (ADR 0014 k. 7–11, 18):** ei digestiä, ei viikonpäiväsääntöjä, ei dry run -tilaa eikä testiympäristöä. Raportointi on erillinen skripti (T51), joka lukee rekisterin tilaa, ei tämän skriptin lokia.
7. **Parametrit poistuvat:** `search_id`, `bike_id`, `override_sub_end_date`, `log_folder_id`. Override-tila oli OOMI-vuotoa ja piti poistaa. Tiedostoloki poistuu, koska raportointi ei lue sitä. Parametreja ei jää yhtään. (P, ks. kysymys 6)
8. **OOMI ei kuulu skriptille millään reitillä.** Suodatin on SQL:ssä, ja sama suodatin on ainoa reitti (ei ohitusparametria).
9. **Skripti ei kirjoita pyörärekisteriin, ei Paylinkiin eikä laskuihin.** Se luo vain CR:n.

## Valintaehto (SQL-luonnos)

Ajopäivä lasketaan Helsingin ajassa (`lib_gbb_helsinki_date`). `:kk_alku` = kuluvan Helsingin kuukauden 1. päivä, `:ed_kk_alku` = edellisen kuukauden 1. päivä (ISO, parametrisoituna). Kenttien nimet: [`schemas/records/`](../schemas/records/README.md).

```sql
SELECT br.id AS bike_id,
       br.custrecord_sta_contract_external_id AS contract_id,
       br.custrecord_sta_contract_employer AS employer_id,
       br.custrecord_sta_subsc_end_date AS end_date,
       br.custrecord_sta_end_redemption_price AS price_net,
       br.custrecord_sta_maintenance_sum AS maint_sum_net
FROM customrecord_sta_bike_register br
WHERE br.isinactive = 'F'
  AND br.custrecord_sta_bike_status = 1                                   -- Active
  AND (br.custrecord_sta_bike_order_type IS NULL OR br.custrecord_sta_bike_order_type <> 3)  -- ei OOMI
  AND br.custrecord_gbb_liab_settle_method IS NULL                        -- ei selvitystapaa
  AND br.custrecord_sta_subsc_end_date >= TO_DATE(:ed_kk_alku, 'YYYY-MM-DD')
  AND br.custrecord_sta_subsc_end_date <  TO_DATE(:kk_alku,    'YYYY-MM-DD')   -- edellinen kalenterikuu
  AND NOT EXISTS (                                                        -- ei jo pidennys-CR:ää tälle kuukaudelle
        SELECT 1 FROM customrecord_subscrption_change_request cr
        WHERE cr.custrecord_cr_bike_registry = br.id
          AND cr.custrecord_cr_type = 7
          AND LOWER(cr.altname) LIKE '%pidennys%' AND LOWER(cr.altname) NOT LIKE '%2a%'
          AND cr.custrecord_cr_status IN (1, 2)                           -- Pending tai Done
          AND cr.custrecord_cr_start_date >= TO_DATE(:kk_alku, 'YYYY-MM-DD'))
```

Huomioita:
- `LIKE '%pidennys%'`: `_` on SuiteQL:ssä jokerimerkki, mutta tässä ei ole alaviivaa. `LOWER()` poistaa case-herkkyyden (monthly-reporting on case-sensitiivinen, ks. kysymys 1).
- Tyypin 2/10 CR:n ohitus (ADR 0012 k. 7, ADR 0014 k. 3) tehdään SQL:ssä toisella `NOT EXISTS`:llä: tyyppi 2 tai 10, tila ≠ Cancelled (7).
- Jos `getInputData` ajaa kyselyn sivutettuna, järjestys on `ORDER BY br.id` (vakaa).
- Kuukausi-ikkuna on **"päättynyt ennen kuluvan kuun 1. päivää"** (päätös 3). Myöhästynyt pyörä saa yhden CR:n, joka kattaa kaikki laskuttamattomat kuukaudet.

## Ohitussäännöt järjestyksessä

SQL hoitaa ensimmäiset kuusi. Ne eivät näy map-vaiheessa (ADR 0014 k. 3: ei SKIP-rivejä pyörille, jotka kuuluvat toisten prosessien omistukseen). Map-vaihe hoitaa 7–10. Ensimmäinen täyttyvä ratkaisee.

| # | Ehto | Seuraus | Missä |
|---|---|---|---|
| 1 | Inaktiivinen tietue tai status ≠ 1 | ei CR:ää | SQL |
| 2 | OOMI (`order_type` = 3) | ei CR:ää | SQL |
| 3 | `liab_settle_method` asetettu (tavat 1–8) | ei CR:ää | SQL |
| 4 | Tyypin 2 tai 10 CR, tila ≠ Cancelled | ei CR:ää | SQL |
| 5 | Pidennys-CR (Pending/Done) jo olemassa tälle kuukaudelle | ei CR:ää | SQL |
| 6 | Maksettu loppulunastus-Paylink-tilaus tai maksettu lunastuslasku (vanhat tarkistukset 1 ja 2) | ei CR:ää (P: status-sync 2.0 kirjaa tavan 1 seuraavassa yössä) | map |
| 7 | `end_redemption_price` tyhjä tai negatiivinen | ei CR:ää, `NOT_PRICED`-rivi lokiin (hinta tuntematon: ei arvata) | map |
| 8 | `end_redemption_price` = 0 | ei CR:ää (tapa 4 kuuluu maksulinkille/sweepille). B046508-tyyppinen tapaus (R5, R6) | map |
| 9 | Hinta − huoltohyvitys ≤ 0 tai brutto < 0,65 € (`noPaymentDue`) | ei CR:ää (tapa 3 kuuluu maksulinkille). Kattavuus M1 | map |
| 10 | Kirjasto palauttaa virheen (huoltosumma yli ylimmän portaan, portaat käyttökelvottomat, ALV puuttuu) | ei CR:ää, `NOT_PRICED` | map |
| 11 | Työnantaja (`custrecord_sta_contract_employer`) tyhjä | ei CR:ää, `NO_EMPLOYER`-rivi (vanhassa tuli Error-CR, `handler_jalki` heittää) | map |
| 12 | muu | luo CR | map |

Kattavuus ei estä uutta kuukautta, vaikka aiemmat pidennys-CR:t kattaisivat summan osittain. Tapa 2 on status-sync 2.0:n (1480) asia: kun Done-pidennyksiä × 63,75 € ≥ maksettava netto, 1480 kirjaa tavan 2 ja pyörä poistuu valinnasta ehdolla 3 seuraavassa ajossa (ADR 0015 k. 5). Extension ei laske tapaa 2:ta itse.

## Luotavan CR:n kentät

Kentät kuten vanhassa skriptissä (V, `mr_subscription_extension.js:178-191`), koska `handler_jalki` ja monthly-reporting lukevat niitä:

| Kenttä | Arvo |
|---|---|
| `custrecord_cr_status` | 1 Pending |
| `custrecord_cr_type` | 7 |
| `altname` | `<contract_id> - pidennys - jälkiveloitus` (tarkka kirjoitusasu säilytetään, päätös 1) |
| `custrecord_cr_bike_registry` | pyörän id |
| `custrecord_cr_next_billto_customer` | `custrecord_sta_contract_employer` |
| `custrecord_cr_former_hubspot_contract_id` | `custrecord_sta_contract_external_id` |
| `custrecord_cr_start_date` | kuluvan Helsingin kuukauden 1. päivä |
| `custrecord_cr_end_date` | kuluvan Helsingin kuukauden viimeinen päivä |
| `custrecord_cr_contract_official_end_date` | sama kuin `end_date` (`handler_jalki` kirjoittaa sen `subsc_end_date`:ksi) |
| `custrecord_cr_due_date` | ajopäivä Helsingin ajassa (vanhassa `new Date()`, ajoajan aikavyöhyke) |

- Kuukausi lasketaan Helsingin ajassa `lib_gbb_helsinki_date`:lla, ei `new Date().getDate()`:lla. Vanha skripti käytti ajon aikavyöhykettä, joka on ~10 h Helsingistä.
- Kenttiin ei lisätä mitään uutta (ADR 0012: ei uusia kenttiä). CR:ää ei linkitetä laskuun (`handler_jalki` ei sitä tee).

## Ajastus

- **Ajopäivä on vapaa**, koska valinta ei riipu ajopäivästä. Päätetty: **kuun 10. päivä, 03:00 Helsinki** (ks. päätös 4), jolloin 1480 (ajaa joka yö 00:30) on ajanut vähintään kerran uuden kuun puolella ja maksut sekä tavat 1–4 on kirjattu (P). 
- Ajo kuun 1. päivänä ennen 1480:tä on kielletty (vika 3a). Jos ajastus sallii vain `MonthlyEvent`, ei `dayOfMonth` 29–31 (ei ole joka kuussa).
- **Myöhästynyt ajo kirii kiinni**: ikkuna on koko edellinen kuukausi, joten ajo mihin tahansa päivään kuluvassa kuussa tuottaa saman joukon. Myös ajamatta jäänyt kuukausi kirii kiinni (päätös 3).
- Deployment ei sisällä parametreja. 1437 siirretään `NOTSCHEDULED`:stä `SCHEDULED`:iin vasta hyväksymistestien jälkeen.

## Idempotenssi

- Toistuva ajo samassa kuussa ei luo tuplia: ehto 5 (`NOT EXISTS` Pending/Done pidennys-CR kuluvalle kuukaudelle) estää toisen CR:n sekä ennen että jälkeen sen, kun CR-prosessori on siirtänyt `subsc_end_date`:a.
- Jos CR on ehtinyt Done-tilaan, `handler_jalki` on siirtänyt `subsc_end_date`:n kuluvan kuun loppuun, jolloin pyörä ei enää täytä päättymiskuuehtoa. Ehto 5 on vyö ja henkselit.
- Cancelled-tilainen CR ei estä uutta (peruttu CR ei laskuta). Error- ja Needs Review -tilainen CR estää (päätös 5).
- Kaksi samanaikaista ajoa (kaksi deploymenttia tai käsin käynnistys ajon aikana) voi ohittaa `NOT EXISTS`:n. Skriptille on vain yksi deployment, ja reduce-vaihe tarkistaa ehdon 5 uudelleen juuri ennen `record.save()`:a.
- Skripti on turvallinen ajaa uudelleen myös siksi, että se ei kirjoita pyörärekisteriin.

## Lokitus

- Yksi `log.audit`-yhteenvetorivi ajon lopussa (`summarize`): `selection: ikkuna=<alku>–<loppu>, ehdokkaita=<n>; luotu=<n>, ohitettu_hinta0=<n>, ohitettu_katettu=<n>, ohitettu_maksettu=<n>, NOT_PRICED=<n>, NO_EMPLOYER=<n>, virheet=<n>`.
- Yksi `log.audit`-rivi per luotu CR: `CREATED <pyörän nimi> cr=<id>, kk=<yyyy-mm>, hinta_netto, huoltohyvitys, maksettava_netto`.
- `log.error` vain: CR:n tallennus epäonnistui (`CR_FAILED`), `NOT_PRICED`, `NO_EMPLOYER`. Muut ohitukset eivät saa omaa riviä (lukumäärä yhteenvedossa riittää).
- Ei sähköpostia, ei File Cabinet -lokia. Kunnes raportointiskripti (T51) on olemassa, lokia luetaan käsin `scriptnote`-taulusta (`scripttype` = 1437).

## Hyväksymistestit

Jokainen todennetaan live-ympäristössä, koska dry runia ei ole: testi tehdään vertaamalla `getInputData`:n SQL:ää ja map-vaiheen päätöksiä erillisellä lukukyselyllä ennen ensimmäistä ajoa, ja ensimmäinen ajo kuluvan kuun CR-luonnilla tarkistetaan lukemalla. Tarkat pyörät päivitetään ajopäivän datalla.

| # | Pyörä / tilanne | Odotettu |
|---|---|---|
| T1 | **B046508** (ITSEHANKINTA, hinta 0, päättyi 31.8., huoltosumma tyhjä) | Ei CR:ää (ehto 8). Vanha skripti loi CR:t 6513 ja 6972 |
| T2 | Active, ei-OOMI, päättyi edellisessä kuussa, ei tapaa, hinta 399 €, huoltosumma 0 | CR luodaan, `start` = kuluvan kuun 1., `end` = viimeinen |
| T3 | Sama pyörä, toinen ajo samana päivänä | Ei toista CR:ää (ehto 5) |
| T4 | Sama pyörä, ajo CR:n Done-käsittelyn jälkeen (`subsc_end_date` siirtynyt kuluvaan kuuhun) | Ei CR:ää |
| T5 | Pyörä, jonka hinta − huoltohyvitys ≤ 0 tai brutto < 0,65 € (esim. kuin B006488 tai B021054 1479:n tapauksessa, päivitettävä ajopäivän datalla) | Ei CR:ää (ehto 9) |
| T6 | Pyörä, jolla on tapa 3 tai 4 (esim. maksulinkin 1.10. kirjaama, kuten B046755) | Ei CR:ää (ehto 3) |
| T7 | Pyörä, jolla on tyypin 2 CR Pending tai Done | Ei CR:ää (ehto 4) |
| T8 | Pyörä, jolla on maksettu loppulunastus-Paylink tai maksettu lunastuslasku, tapa vielä tyhjä | Ei CR:ää (ehto 6) |
| T9 | OOMI-pyörä (`order_type` = 3, esim. 43395 / RG944ZY1, 44686 / EZK64ZT2 15.9.:n tapauksesta) | Ei CR:ää, ei millään ajotavalla |
| T10 | Pyörä, jonka `subsc_end_date` on kuluvassa kuussa tai kuukautta aiemmin kuin edellinen | Ei valita (ikkuna) |
| T11 | Pyörä, jonka työnantaja on tyhjä | `NO_EMPLOYER`, ei CR:ää |
| T12 | Hinta tyhjä tai negatiivinen | `NOT_PRICED`, ei CR:ää |
| T13 | Pyörä, jolla on Done-pidennys-CR aiemmalta kuukaudelta ja jonka tapaa ei ole asetettu, päättymispäivä on edellisessä kuussa (jatkuva ketju) | CR luodaan seuraavalle kuukaudelle |
| T14 | Ajo 31. päivänä tai kuukauden 7. päivänä | Sama joukko kuin 2. päivänä (ajopäivästä riippumattomuus) |
| T15 | Ajo, kun CR-prosessori ei ole vielä käsitellyt aiempaa Pending CR:ää | Ei tuplaa |

Yhteenvedon luvut täsmäävät: ehdokkaat = luodut + map-vaiheen ohitukset + virheet.

## Käyttöönotto ennen 31.10.

1. Rakennus ja koodikatselmointi sisarrepossa (oma istunto, ei tässä repossa). Hintakirjasto ladataan, ei kopioida.
2. Hyväksymistestit T1–T15 lukukyselyillä (SQL-valinta vs. odotettu), tavoite **ma 19.10.**
3. 1437:n script-tietue: poista parametrit, deployment `customdeploy_gbb_sub_extension` yksi ajastus: Monthly, kuun 10. päivä, 03:00. Poista aikaisempi päivittäinen/kuukausiajastus.
4. Ensimmäinen tuotantoajo marraskuussa. Kun 1.11. on pyhäpäivä (su), 1480 ehtii ajaa ennen. TASKS T54:n oletus "extension 1.11. 03:00" raukeaa, ja se korvataan tämän suosituksella.
5. Ajon jälkeen: lue `scriptnote` (script 1437), vertaa luotuja CR:iä lukukyselyyn ja tarkista, ettei yhdelläkään ole OOMI-pyörää, tapaa 3/4 tai hintaa 0. Ajo ennen CR-prosessoria (1199) antaa mahdollisuuden poistaa virheellinen Pending-CR ennen laskutusta.
6. Päivitä: sisarrepon README (poistuvat parametrit, hakuun liittyvät varoitukset), `schemas/script-inventory.md` (T63), tämän repon CLAUDE.md:n kohta *The extension loop has no owner*, TASKS T54 ja T61-tehtävä ("extension 2.0").
7. Ennen ajoa: B046508:n aiemmat jälkiveloitukset (CR 6513, 6972; laskut INVGBF1043392 ja INVGBF1043523) puretaan erillisen tehtävän T33 mukaan. Se ei kuulu tämän skriptin vastuulle.

## Päätökset avoimiin kysymyksiin (tuoteomistaja 9.10.2026)

Nämä ohittavat ylempien osioiden suositukset, jos ne ovat ristiriidassa.

1. **CR:n nimi** pysyy täsmälleen samana: `<sopimus> - pidennys - jälkiveloitus`.
2. **`start`/`end`** ovat kokonaisia kalenterikuukausia kuten ennen. `start` on `subsc_end_date`:a seuraavan kuun 1. päivä, ja `end` on kuluvan kuun viimeinen päivä (ks. kohta 3).
3. **Myöhästynyt kuukausi kirii kiinni.** Ikkuna on "`subsc_end_date` ennen kuluvan kuun 1. päivää" (Helsingin aikaa), ei vain edellinen kuukausi.
   Yksi CR kattaa kaikki laskuttamattomat kuukaudet `subsc_end_date`:sta kuluvan kuun loppuun (`handler_jalki` laskuttaa välin kaikki kuukaudet).
   Esimerkki: pyörä päättyi 30.9., ja marraskuun ajo jäi väliin. Joulukuun ajo luo yhden CR:n 1.10.–31.12., joka laskuttaa 3 kuukautta.
   Idempotenssiehto 5 koskee kuluvaa kuukautta, joten se tarkistaa, ettei Pending- tai Done-pidennys-CR kata kuluvaa kuukautta.
4. **Ajopäivä on kiinteä: kuun 10. päivä klo 03:00** (NetSuite Monthly, day 10). Tämä vastaa käytännössä 7. arkipäivää ilman
   viikonpäiväsääntöä (ADR 0014). Kirjanpidon kannalta lasku lähtee noin 10. päivä. 1.–9. päivänä maksaneet eivät saa CR:ää, koska 1480 on
   kirjannut maksun tapana 1.
5. **Error- tai Needs Review -tilainen pidennys-CR estää** uuden CR:n samalle kuukaudelle. Ihminen ratkaisee sen. Tämä estää tuplalaskun.
6. **Ei tiedostolokia.** Yksi yhteenvetorivi ja yksi rivi per luotu CR `scriptnote`-tauluun riittävät.
7. **Pyörä, jolle ei ole lähetetty maksulinkkiä, ohitetaan, ja ihminen ratkaisee sen.** Tulkinta (vahvistettava katselmoinnissa): ohitus koskee
   pyörää, jolla `eredem_link_sent` ≠ T **eikä aiempaa Done-tilaista pidennys-CR:ää**. Jo käynnissä oleva jälkiveloitusketju (esim. T53:n
   B046667, jolle 1479 ei linkkiä lähetä) jatkuu. Ohitetut pyörät nostetaan T51:n raportointiin (lokakuussa 16 pyörää).
8. **Hinta 0 ilman tapaa 4:** extension ohittaa pyörän, ja **T51:n raportointi nostaa sen esiin**. Ihminen kirjaa tavan 4 käsin.

Yhteenvedon lokirivi saa kaksi uutta laskuria: `ohitettu_ei_linkkia` ja `ohitettu_hinta0_ei_tapaa`.

9. **K2-rajaus (tuoteomistaja 9.10.2026, T34):** jälkiveloitukseksi ja kattavuuteen lasketaan **vain pidennys-CR:t, joiden jakso alkaa alkuperäisen päättymispäivän (`subsc_org_end_date`) jälkeen**. Esimerkki B046667: CR-5094 (elokuu) kuului 2 kk:n alkuperäiseen vuokra-aikaan, joten se ei ole pidennys. Myös *Jälkiveloitus - Poikkeus* -CR:t (esim. B016555:n CR-6107) jätetään pois. Sama sääntö on vietävä maksulinkkiin (1479) ja status-sync 2.0:n tavan 2 laskentaan.
