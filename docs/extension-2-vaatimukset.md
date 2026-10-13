# Extension 2.0 — vaatimusmäärittely

- **Päivämäärä:** 9.10.2026 (muutettu 13.10.2026)
- **Koskee:** `netsuite-subscription-extension` (script 1437 `customscript_gbb_bike_sub_extension`, deployment `customdeploy_gbb_sub_extension`, nyt `NOTSCHEDULED`) kirjoitetaan uudelleen.
- **Lähteet:** [ADR 0012](adr/0012-loppulunastushinta-ja-kattavuus.md), [ADR 0014](adr/0014-maksulinkin-korjaus-ja-yksinkertaistus.md), [ADR 0015](adr/0015-status-sync-2-tarkennukset.md), [kenttäsäännöt § 10–11](lunastuksen-kenttasaannot.md), [käsittelyloki R5–R6](../findings/2026-10-02-maksulinkki-kasittelyloki.md), sisarrepon README ja `mr_subscription_extension.js`.
- **Merkintä:** (V) = todennettu koodista tai dokumentista, (P) = päätelty, (K) = tuoteomistajan päätös, (?) = avoin, katso viimeinen osio.

> [!IMPORTANT]
> **Muutettu 13.10.2026 ([ADR 0019](adr/0019-extension-2-ei-kiinnikurontaa.md), grilling-istunto).** Ylemmät osiot on päivitetty. Muutokset:
> 1. **Ei kiinnikurontaa.** CR on aina kuluva kuukausi (1. – viimeinen päivä). Pyörä, jonka `subsc_end_date` on ennen edellisen kuun
>    1. päivää, saa virherivin `MISSED_MONTHS` eikä CR:ää. Kumoaa 9.10. päätökset 2 (`start`) ja 3 sekä alla olevan 12.10.-laatikon kohdat 2–3.
> 2. Päättymispäivä edellisessä kuussa mutta ei kuun viimeinen päivä: virherivi `END_NOT_MONTH_END`, ei CR:ää.
> 3. **Avoin pidennys-CR estää kaudesta riippumatta:** Pending, In Progress, Error, Needs Review tai tyhjä tila millä tahansa kaudella estää, Done vain jos `end_date` ≥ kuluvan kuun 1. (ehto 5).
> 4. **Ehto 6 (maksutodiste) on SQL:ssä** samoilla määrittelyillä kuin status-sync 2.0:ssa (1480).
> 5. Armonaika ajopäivään asti on tietoinen päätös (9.10. päätös 4), ja Error-tilainen tyypin 2/10 CR estää kuten 1479:ssä (ehto 4).

> [!NOTE]
> **Yhtenäistetty 12.10.2026.** *Kohdat 2–3 on kumottu 13.10. (ADR 0019).* Ylemmät osiot (valintaehto, ohitussäännöt, CR:n kentät, testit) on päivitetty vastaamaan 9.10. päätöksiä
> (§ *Päätökset avoimiin kysymyksiin*) ja `handler_jalki`n koodia. Korjatut kohdat:
> 1. **`custrecord_cr_contract_official_end_date` = CR:n `end_date`** (kuluvan kuun viimeinen päivä), ei pyörän nykyinen `subsc_end_date`.
>    `handler_jalki.js:153-154` kirjoittaa tämän arvon pyörän `subsc_end_date`:ksi. Pyörän nykyisellä päivällä päättymispäivä ei siirtyisi,
>    ja seuraavan kuun kiinnikurova CR laskuttaisi samat kuukaudet uudelleen. Vanha skripti asettaa CR:n loppupäivän
>    (`mr_subscription_extension.js:189`). Todennettu tuotannosta 12.10.: kaikki 339 pidennys-CR:ää 7–10/2026 on tehty näin
>    (kesäkuun 90 CR:ää on luotu muulla tavalla).
> 2. Valinnan alaraja (edellisen kuun 1. päivä) on poistettu, jotta ajamatta jäänyt kuukausi kirii kiinni (päätös 3).
> 3. `start` = `subsc_end_date`:a seuraavan kuun 1. päivä (päätös 2). Kun ajo kiirii kiinni, CR alkaa ennen kuluvaa kuuta.
>    Siksi ehto 5 katsoo CR:n **loppupäivää** (`end_date` ≥ kuluvan kuun 1.), ei alkupäivää.
> 4. Ehto 5:n tiloihin on lisätty Error (5) ja Needs Review (6) (päätös 5).
> 5. Linkki- ja ketjuehto (päätös 7) sekä K2 (päätös 9) on lisätty ohitussääntöihin (ehto 5b).

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
6. **Yksinkertainen skripti (ADR 0014 k. 7–11, 18):** ei digestiä, ei viikonpäiväsääntöjä, ei dry run -tilaa eikä testiympäristöä. **Muutettu 13.10.2026 (Q15):** kaksi valinnaista testausparametria, ks. § *Testausparametrit*. Raportointi on erillinen skripti (T51), joka lukee rekisterin tilaa, ei tämän skriptin lokia.
7. **Parametrit poistuvat:** `search_id`, `bike_id`, `override_sub_end_date`, `log_folder_id`. Override-tila oli OOMI-vuotoa ja piti poistaa. Tiedostoloki poistuu, koska raportointi ei lue sitä. Parametreja ei jää yhtään. (P, ks. kysymys 6) **Muutettu 13.10.2026 (Q15):** tilalle tulee kaksi uutta, suojia ohittamatonta testausparametria (§ *Testausparametrit*). Vanha `bike_id` ei palaa: se ohitti tila-, OOMI- ja tyyppisuojat.
8. **OOMI ei kuulu skriptille millään reitillä.** Suodatin on SQL:ssä, ja sama suodatin on ainoa reitti (ei ohitusparametria).
9. **Skripti ei kirjoita pyörärekisteriin, ei Paylinkiin eikä laskuihin.** Se luo vain CR:n.
10. **Ei kiinnikurontaa (K 13.10., ADR 0019).** Yksi ajo luo pyörälle enintään yhden CR:n, ja se on aina kuluva kuukausi. Jos pyörän jälkiveloitus on jäänyt kuukaudeltakin tekemättä, skripti ei käsittele pyörää vaan kirjaa virherivin `MISSED_MONTHS`. Ihminen ratkaisee pyörän.

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
  AND br.custrecord_sta_subsc_end_date < TO_DATE(:kk_alku, 'YYYY-MM-DD')    -- päättynyt ennen kuluvaa kuuta; ennen :ed_kk_alku = MISSED_MONTHS map-vaiheessa
  AND NOT EXISTS (                                                        -- ehto 4: tyypin 2/10 CR, ei Cancelled
        SELECT 1 FROM customrecord_subscrption_change_request cr
        WHERE cr.custrecord_cr_bike_registry = br.id
          AND cr.custrecord_cr_type IN (2, 10)
          AND (cr.custrecord_cr_status IS NULL OR cr.custrecord_cr_status <> 7))
  AND NOT EXISTS (                                                        -- ehto 5: pidennys-CR estää (ADR 0019 k. 3)
        SELECT 1 FROM customrecord_subscrption_change_request cr
        WHERE cr.custrecord_cr_bike_registry = br.id
          AND cr.custrecord_cr_type = 7
          AND LOWER(cr.altname) LIKE '%pidennys%' AND LOWER(cr.altname) NOT LIKE '%2a%'
          AND (cr.custrecord_cr_status IS NULL                            --   avoin (tyhjä, Pending, In Progress, Error, Needs Review)
               OR cr.custrecord_cr_status IN (1, 3, 5, 6)                 --   millä tahansa kaudella (Q11, 13.10.2026)
               OR (cr.custrecord_cr_status = 2                            --   tai Done, joka kattaa jo kuluvan kuun
                   AND cr.custrecord_cr_end_date >= TO_DATE(:kk_alku, 'YYYY-MM-DD'))))
  AND (br.custrecord_gbb_eredem_link_sent = 'T'                           -- ehto 5b: linkki lähetetty
       OR EXISTS (                                                        --   tai käynnissä oleva ketju (päätös 7, K2)
        SELECT 1 FROM customrecord_subscrption_change_request cr
        WHERE cr.custrecord_cr_bike_registry = br.id
          AND cr.custrecord_cr_type = 7 AND cr.custrecord_cr_status = 2
          AND LOWER(cr.altname) LIKE '%pidennys%' AND LOWER(cr.altname) NOT LIKE '%2a%'
          AND cr.custrecord_cr_start_date > br.custrecord_sta_subsc_org_end_date))
  AND NOT EXISTS (SELECT 1 <PAYLINK_EVIDENCE> AND pr.custrecord_pl_ns_bike_id = br.id)   -- ehto 6: maksutodiste (ADR 0019 k. 5)
  AND NOT EXISTS (SELECT 1 <INVOICE_EVIDENCE> AND t.custbody_sta_bike_id = br.id)
```

`<PAYLINK_EVIDENCE>` ja `<INVOICE_EVIDENCE>` ovat status-sync 2.0:n fragmentit sellaisinaan (`gbb_mr_redemption_sync2.js:148–165`): valmis Paylink-tilaus, jonka SO-tyyppi on 3 tai 4, sekä maksettu, hyvittämätön lunastuslasku. Ne kopioidaan muuttamatta, jotta *maksettu* tarkoittaa molemmissa skripteissä samaa.

Ehtojen 5, 5b ja 6 ohitukset lasketaan yhteenvetoon (`ohitettu_avoin_cr`, `ohitettu_ei_linkkia`, `ohitettu_maksettu`) erillisillä laskentakyselyillä, kuten 1479:n `rajattu`-laskurit.

Huomioita:
- `LIKE '%pidennys%'`: `_` on SuiteQL:ssä jokerimerkki, mutta tässä ei ole alaviivaa. `LOWER()` poistaa case-herkkyyden (monthly-reporting on case-sensitiivinen, ks. kysymys 1).
- Tyypin 2/10 CR:n ohitus (ADR 0012 k. 7, ADR 0014 k. 3) on SQL:ssä: tyyppi 2 tai 10, tila ≠ Cancelled (7). Ehto on sama kuin 1479:n `EXCLUSIONS.cr_2_10`. Myös Error-tilainen estää (ADR 0019 k. 6).
- Ehto 5: avoin pidennys-CR estää kaudesta riippumatta. Muuten käsittelemätön lokakuun CR (pyörän `subsc_end_date` yhä 30.9.) jäisi marraskuun ajossa huomaamatta. CR-prosessorin `cr_scheduler.js` ei järjestä CR:iä, joten käsittelyjärjestykseen ei voi nojata.
- Jos `getInputData` ajaa kyselyn sivutettuna, järjestys on `ORDER BY br.id` (vakaa).
- Valinta ottaa kaikki ennen kuluvaa kuuta päättyneet, jotta myöhästyneet näkyvät virheinä (`MISSED_MONTHS`). CR luodaan vain pyörälle, jonka `subsc_end_date` on **edellisen kuun viimeinen päivä** (ADR 0019 k. 1–2).
- **Tilanne 12.10.2026 (V):** marraskuun ajon ehdokkaita olisi nyt 367 (Active, ei OOMI, ei tapaa, päättynyt ennen 1.11.): 365 päättyy 10/2026 ja 2 aiemmin.
  Ehto 5b ohittaisi 4: B011223 ja B031422 (päättyvät 31.10., ei linkkiä, lunastus käynnissä `end_red_so_created` = T) sekä B023198 ja B024908
  (`subsc_end_date` 30.11.2025, ei linkkiä eikä ketjua). B010533 ja B046667 jatkavat ketjua ilman linkkiä. (13.10.: B010533:n `subsc_end_date` siirrettiin käsin 30.11.:een 12.10., joten se ei ole marraskuun ajon ehdokas.) Yhdelläkään ei ole tyypin 2/10 CR:ää eikä hintaa 0.
  Luku pienenee lokakuun aikana, kun maksuja tulee.

## Ohitussäännöt järjestyksessä

SQL hoitaa ehdot 1–6. Ne eivät näy map-vaiheessa (ADR 0014 k. 3: ei SKIP-rivejä pyörille, jotka kuuluvat toisten prosessien omistukseen). Map-vaihe hoitaa 7–13. Ensimmäinen täyttyvä ratkaisee. Ajoitusvirheet 12–13 tarkistetaan viimeisinä, jotta virherivi tarkoittaa aina pyörää, joka olisi muuten jälkiveloitettu (ADR 0019 k. 2). Hinnoitteluvirhe (10) todetaan ennen ehtoa 9, koska `noPaymentDue` saadaan vasta onnistuneesta hinnoittelusta.

| # | Ehto | Seuraus | Missä |
|---|---|---|---|
| 1 | Inaktiivinen tietue tai status ≠ 1 | ei CR:ää | SQL |
| 2 | OOMI (`order_type` = 3) | ei CR:ää | SQL |
| 3 | `liab_settle_method` asetettu (tavat 1–8) | ei CR:ää | SQL |
| 4 | Tyypin 2 tai 10 CR, tila ≠ Cancelled (myös Error) | ei CR:ää | SQL |
| 5 | Pidennys-CR tilassa Pending, In Progress, Error, Needs Review tai tila tyhjä millä tahansa kaudella, tai Done-pidennys-CR, jonka `end_date` ≥ kuluvan kuun 1. | ei CR:ää, `ohitettu_avoin_cr` (avoimet) | SQL |
| 5b | `eredem_link_sent` ≠ T **eikä** Done-pidennys-CR:ää, joka alkaa `subsc_org_end_date`:n jälkeen (päätös 7, K2) | ei CR:ää, `ohitettu_ei_linkkia` | SQL |
| 6 | Maksutodiste 1480:n määrittelyllä: valmis Paylink-tilaus (SO-tyyppi 3 tai 4) tai maksettu, hyvittämätön lunastuslasku | ei CR:ää, `ohitettu_maksettu`. Tavallisesti 1480 on jo kirjannut tavan 1 (ehto 3); tämä on puolustus 1480:n epäonnistumista vastaan | SQL |
| 7 | `end_redemption_price` tyhjä tai negatiivinen | ei CR:ää, `NOT_PRICED`-rivi lokiin (hinta tuntematon: ei arvata) | map |
| 8 | `end_redemption_price` = 0 | ei CR:ää, `ohitettu_hinta0_ei_tapaa` (päätös 8: ihminen kirjaa tavan 4). B046508-tyyppinen tapaus (R5, R6) | map |
| 9 | Hinta − huoltohyvitys ≤ 0 tai brutto < 0,65 € (`noPaymentDue`) | ei CR:ää (tapa 3 kuuluu maksulinkille). Kattavuus M1 | map |
| 10 | Kirjasto palauttaa virheen (huoltosumma yli ylimmän portaan, ei yhtään käyttökelpoista porrasta, ALV puuttuu) | ei CR:ää, `NOT_PRICED` | map |
| 11 | Työnantaja (`custrecord_sta_contract_employer`) tyhjä | ei CR:ää, `NO_EMPLOYER`-rivi (vanhassa tuli Error-CR, `handler_jalki` heittää) | map |
| 12 | `subsc_end_date` ennen edellisen kuun 1. päivää (jälkiveloitus jäänyt kuukaudeltakin tekemättä) | ei CR:ää, `MISSED_MONTHS`-rivi (ADR 0019 k. 1–2) | map |
| 13 | `subsc_end_date` edellisessä kuussa mutta ei kuun viimeinen päivä | ei CR:ää, `END_NOT_MONTH_END`-rivi (ADR 0019 k. 4) | map |
| 14 | muu | luo CR | map |

Käyttökelvoton porrasrivi (`customrecord_sta_maint_extending_months`) ohitetaan kuten 1479:ssä ja 1480:ssä, ja siitä kirjataan yksi `log.error`-rivi ajoa kohden (`getInputData`:ssa): otsikko `mr_subscription_extension: unusable bracket rows`, detail `[{id, reason}]` kuten 1479:ssä ja 1480:ssä. Riviä ei lasketa `virheet`-laskuriin. Muut portaat ovat käytössä, eikä yksi viallinen rivi tee kaikista pyöristä `NOT_PRICED`-tapauksia (tuoteomistaja 13.10.2026, Q12).

Kattavuus ei estä uutta kuukautta, vaikka aiemmat pidennys-CR:t kattaisivat summan osittain. Tapa 2 on status-sync 2.0:n (1480) asia: kun Done-pidennyksiä × 63,75 € ≥ maksettava netto, 1480 kirjaa tavan 2 ja pyörä poistuu valinnasta ehdolla 3 seuraavassa ajossa (ADR 0015 k. 5). Extension ei laske tapaa 2:ta itse. Koska CR on aina yksi kuukausi ja 1480 ajaa joka yö, ylimääräisiä kuukausia ei synny.

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
| `custrecord_cr_start_date` | kuluvan Helsingin kuukauden 1. päivä (= `subsc_end_date` + 1 päivä, koska ehdot 12–13 takaavat, että `subsc_end_date` on edellisen kuun viimeinen päivä) |
| `custrecord_cr_end_date` | kuluvan Helsingin kuukauden viimeinen päivä |
| `custrecord_cr_contract_official_end_date` | **sama kuin CR:n `custrecord_cr_end_date`** (kuluvan kuun viimeinen päivä). `handler_jalki.js:153-154` kirjoittaa sen pyörän `subsc_end_date`:ksi, ja se siirtää ketjua eteenpäin. **Ei** pyörän nykyinen `subsc_end_date`, koska silloin päivä ei siirtyisi (V 12.10.: vanha skripti `:189`, tuotannon 339/339 CR:ää 7–10/2026) |
| `custrecord_cr_due_date` | ajopäivä Helsingin ajassa (vanhassa `new Date()`, ajoajan aikavyöhyke) |

- `end_date` on aina kuluvan Helsingin kuukauden viimeinen päivä.
- Kuukausi lasketaan Helsingin ajassa `lib_gbb_helsinki_date`:lla, ei `new Date().getDate()`:lla. Vanha skripti käytti ajon aikavyöhykettä, joka on ~10 h Helsingistä.
- Kenttiin ei lisätä mitään uutta (ADR 0012: ei uusia kenttiä). CR:ää ei linkitetä laskuun (`handler_jalki` ei sitä tee).

## Ajastus

- **Ajopäivä on vapaa**, koska valinta ei riipu ajopäivästä. Päätetty: **kuun 10. päivä, 03:00 Helsinki** (ks. päätös 4), jolloin 1480 (ajaa joka yö 00:30) on ajanut vähintään kerran uuden kuun puolella ja maksut sekä tavat 1–4 on kirjattu (P). 
- Ajo kuun 1. päivänä ennen 1480:tä on kielletty (vika 3a). Jos ajastus sallii vain `MonthlyEvent`, ei `dayOfMonth` 29–31 (ei ole joka kuussa).
- **Myöhästynyt ajo samassa kuussa toimii**: valinta kattaa kaiken ennen kuluvan kuun 1. päivää, joten ajo mihin tahansa päivään kuluvassa kuussa tuottaa saman joukon. **Ajamatta jäänyt kuukausi ei kiri kiinni** (ADR 0019): seuraavan kuun ajossa kaikki sen kuun pyörät saavat `MISSED_MONTHS`-rivin, ja ihminen ratkaisee ne. Epäonnistunut 10. päivän ajo on siksi ajettava uudelleen saman kuun aikana.
- Tuotantodeploymentin (`customdeploy_gbb_sub_extension`) testausparametrit ovat aina tyhjiä. 1437 siirretään `NOTSCHEDULED`:stä `SCHEDULED`:iin vasta hyväksymistestien jälkeen.

## Testausparametrit

Tuoteomistajan päätös 13.10.2026 (Q15). Poikkeus ADR 0014:n linjaan (ei dry runia): ilman näitä map-vaihetta (hinnoittelu, ehdot 7–13) ja CR:n tallennusta ei voi todentaa tuotantodatalla ennen ensimmäistä oikeaa ajoa. Kumpikaan parametri ei ohita yhtään ehtoa.

| Parametri | Tyyppi | Vaikutus |
|---|---|---|
| `custscript_gbb_ext_bike_id` | Kokonaisluku, valinnainen | Rajaa valinnan (ja ehtojen 5, 5b ja 6 laskentakyselyn) yhteen pyörään: `AND br.id = :bike_id`. Kaikki ehdot 1–13 pätevät kuten ilman rajausta. Pyörä, joka ei täytä ehtoja 1–6, ei tule valituksi (ehdokkaita = 0). |
| `custscript_gbb_ext_dry_run` | Valintaruutu, oletus pois | Skripti käy läpi koko valinnan ja kaikki päätökset (myös ehdon 5 uudelleentarkistuksen), mutta ei tallenna CR:ää. Jokaisesta pyörästä, jolle CR luotaisiin, kirjataan `log.audit`-rivi `WOULD_CREATE <pyörän nimi>`, jonka detail on sama kuin `CREATED`-rivillä ilman `cr=`-kenttää. |

- Yhteenvetorivi kertoo tilan: dry runissa otsikko on `mr_subscription_extension: summary (DRY RUN)` ja `luotu=<n>` korvautuu `would_create=<n>`:llä. Jos `bike_id` on asetettu, detailin alkuun lisätään `bike_id=<id>; `. Laskurien täsmäytys pätee kummassakin tilassa.
- Virherivit (`NOT_PRICED`, `NO_EMPLOYER`, `MISSED_MONTHS`, `END_NOT_MONTH_END`, porrasrivit) kirjataan dry runissakin, jotta ne voi todentaa ennen oikeaa ajoa.
- Testiajot tehdään **erillisellä deploymentilla** `customdeploy_gbb_sub_extension_test` (`NOTSCHEDULED`), jolle parametrit asetetaan. Tuotantodeploymentin parametrit pysyvät tyhjinä, joten unohtunut dry run -asetus ei voi estää 10. päivän oikeaa ajoa. Kaksi deploymenttia ei luo tuplia, koska ehto 5 tarkistetaan uudelleen juuri ennen tallennusta; testiajoa ei silti käynnistetä tuotantoajon aikana.
- Testijärjestys: (1) dry run koko joukolle ja tuloksen vertailu hyväksymistesteihin, (2) oikea ajo yhdellä pyörällä (`bike_id`, dry run pois) ja sen CR:n seuranta 1199:n läpi, (3) tuotantoajo 10.11.

## Idempotenssi

- Toistuva ajo samassa kuussa ei luo tuplia: ehto 5 (avoin pidennys-CR millä tahansa kaudella tai Done kuluvalle kuukaudelle) estää toisen CR:n sekä ennen että jälkeen sen, kun CR-prosessori on siirtänyt `subsc_end_date`:a.
- Käsittelemätön tai virheeseen päätynyt aiemman kuukauden CR estää uuden CR:n, joten sama kuukausi ei voi päätyä kahteen CR:ään (T15).
- Jos CR on ehtinyt Done-tilaan, `handler_jalki` on siirtänyt `subsc_end_date`:n kuluvan kuun loppuun, jolloin pyörä ei enää täytä päättymiskuuehtoa. Ehto 5 on vyö ja henkselit.
- Cancelled-tilainen CR ei estä uutta (peruttu CR ei laskuta). Error- ja Needs Review -tilainen CR estää (päätös 5).
- Kaksi samanaikaista ajoa (kaksi deploymenttia tai käsin käynnistys ajon aikana) voi ohittaa `NOT EXISTS`:n. Skriptille on vain yksi deployment, ja map-vaihe tarkistaa ehdon 5 uudelleen juuri ennen `record.save()`:a.
- Skripti on turvallinen ajaa uudelleen myös siksi, että se ei kirjoita pyörärekisteriin.

## Lokitus

- Yksi `log.audit`-yhteenvetorivi ajon lopussa (`summarize`): `selection: ikkuna=ennen <kk_alku>, ehdokkaita=<n>, ohitettu_avoin_cr=<n>, ohitettu_ei_linkkia=<n>, ohitettu_maksettu=<n>; luotu=<n>, ohitettu_hinta0_ei_tapaa=<n>, ohitettu_katettu=<n>, NOT_PRICED=<n>, NO_EMPLOYER=<n>, MISSED_MONTHS=<n>, END_NOT_MONTH_END=<n>, virheet=<n>`. Poikkeustilanteissa rivin loppuun lisätään `, ohitettu_avoin_cr_tallennushetki=<n>` (ehto 5 täyttyi vasta tallennushetkellä, vain kun > 0), `, EI_TASMAA (kasitelty=<n>)` (laskurit eivät täsmää) tai ` | ABORTED`.
- Yksi `log.audit`-rivi per luotu CR: `CREATED <pyörän nimi> cr=<id>, kk=<yyyy-mm>, hinta_netto, huoltohyvitys, maksettava_netto`.
- `log.error` vain: CR:n tallennus epäonnistui (`CR_FAILED`), `NOT_PRICED`, `NO_EMPLOYER`, `MISSED_MONTHS` (detail `subsc_end_date=<pvm>, puuttuvia_kk=<n>`) ja `END_NOT_MONTH_END` (detail `subsc_end_date=<pvm>`). Muut ohitukset eivät saa omaa riviä (lukumäärä yhteenvedossa riittää). Virheistä ei luoda CR:ää eikä mitään muuta tietuetta (ADR 0019 k. 2). Lisäksi odottamaton kaatuminen kirjataan `log.error`-rivinä, jottei se jää hiljaiseksi: `RUN ABORTED` (getInputData kaatui) ja `MAP_FAILED <pyörän id>` (odottamaton poikkeus mapissa, lasketaan virheisiin) (tuoteomistaja 13.10.2026, Q14). Käyttökelvottomista porrasriveistä tulee yksi `unusable bracket rows` -rivi ajoa kohden (Q12, ks. § Ohitussäännöt).
- Tyhjä sopimustunnus (`contract_external_id`) ei ole virhe: CR luodaan, ja nimeen ja `custrecord_cr_former_hubspot_contract_id`:hen tulee tyhjä merkkijono (` - pidennys - jälkiveloitus`), kuten vanhassa skriptissä (tuoteomistaja 13.10.2026, Q13).
- Ei sähköpostia, ei File Cabinet -lokia. Kunnes raportointiskripti (T51) on olemassa, lokia luetaan käsin `scriptnote`-taulusta (`scripttype` = 1437).

## Hyväksymistestit

Jokainen todennetaan live-ympäristössä: SQL-valinta lukukyselyllä ja map-vaiheen päätökset testideploymentin dry runilla (§ *Testausparametrit*) ennen ensimmäistä ajoa, ja ensimmäinen ajo kuluvan kuun CR-luonnilla tarkistetaan lukemalla. Tarkat pyörät päivitetään ajopäivän datalla.

| # | Pyörä / tilanne | Odotettu |
|---|---|---|
| T1 | **B046508** (ITSEHANKINTA, hinta 0, päättyi 31.8., huoltosumma tyhjä) | Ei CR:ää (ehto 8). Vanha skripti loi CR:t 6513 ja 6972 |
| T2 | Active, ei-OOMI, päättyi edellisessä kuussa, ei tapaa, hinta 399 €, huoltosumma 0 | CR luodaan, `start` = kuluvan kuun 1., `end` = viimeinen |
| T3 | Sama pyörä, toinen ajo samana päivänä | Ei toista CR:ää (ehto 5) |
| T4 | Sama pyörä, ajo CR:n Done-käsittelyn jälkeen (`subsc_end_date` siirtynyt kuluvan kuun loppuun) | Ei CR:ää |
| T5 | Pyörä, jonka hinta − huoltohyvitys ≤ 0 tai brutto < 0,65 € (esim. kuin B006488 tai B021054 1479:n tapauksessa, päivitettävä ajopäivän datalla) | Ei CR:ää (ehto 9) |
| T6 | Pyörä, jolla on tapa 3 tai 4 (esim. maksulinkin 1.10. kirjaama, kuten B046755) | Ei CR:ää (ehto 3) |
| T7 | Pyörä, jolla on tyypin 2 CR Pending tai Done | Ei CR:ää (ehto 4) |
| T8 | Pyörä, jolla on maksettu loppulunastus-Paylink tai maksettu lunastuslasku, tapa vielä tyhjä | Ei CR:ää (ehto 6) |
| T9 | OOMI-pyörä (`order_type` = 3, esim. 43395 / RG944ZY1, 44686 / EZK64ZT2 15.9.:n tapauksesta) | Ei CR:ää, ei millään ajotavalla |
| T10 | Pyörä, jonka `subsc_end_date` on kuluvassa kuussa | Ei valita (ikkuna) |
| T10b | Pyörä, joka päättyi kaksi kuukautta sitten, linkki lähetetty, ei pidennys-CR:ää (ajamatta jäänyt kuukausi) | Ei CR:ää, `MISSED_MONTHS`-rivi, `puuttuvia_kk=1` (ehto 12, ADR 0019) |
| T10f | Sama kuin T10b, mutta hinta 0 tai ei linkkiä eikä ketjua (esim. B023198) | Ei `MISSED_MONTHS`-riviä: ohitus `ohitettu_hinta0_ei_tapaa` / `ohitettu_ei_linkkia` (ajoitusvirhe arvioidaan viimeisenä) |
| T10g | Pyörä, jonka `subsc_end_date` on edellisen kuun 15. päivä, muuten jälkiveloitettava | Ei CR:ää, `END_NOT_MONTH_END`-rivi (ehto 13) |
| T10c | Luodun CR:n `official_end_date` | = CR:n `end_date`. Done-käsittelyn jälkeen pyörän `subsc_end_date` = kuluvan kuun viimeinen |
| T10d | Ilman linkkiä ja ilman ketjua (esim. B011223, B023198) / ilman linkkiä mutta ketjussa (B046667) | Ohitetaan, `ohitettu_ei_linkkia` / CR luodaan |
| T10e | Pidennys-CR tilassa Error tai Needs Review kuluvalle kuulle | Ei uutta CR:ää (ehto 5) |
| T11 | Pyörä, jonka työnantaja on tyhjä | `NO_EMPLOYER`, ei CR:ää |
| T12 | Hinta tyhjä tai negatiivinen | `NOT_PRICED`, ei CR:ää |
| T13 | Pyörä, jolla on Done-pidennys-CR aiemmalta kuukaudelta ja jonka tapaa ei ole asetettu, päättymispäivä on edellisessä kuussa (jatkuva ketju) | CR luodaan seuraavalle kuukaudelle |
| T14 | Ajo 31. päivänä tai kuukauden 7. päivänä | Sama joukko kuin 2. päivänä (ajopäivästä riippumattomuus) |
| T15 | Aiemman kuukauden pidennys-CR on yhä Pending, Error tai Needs Review (pyörän `subsc_end_date` ei ole siirtynyt) | Ei CR:ää, `ohitettu_avoin_cr` (ehto 5) |

Yhteenvedon luvut täsmäävät: ehdokkaat = luodut + map-vaiheen ohitukset + virheet.

## Käyttöönotto ennen 31.10.

1. Rakennus ja koodikatselmointi sisarrepossa (oma istunto, ei tässä repossa). Hintakirjasto ladataan, ei kopioida.
2. Hyväksymistestit T1–T15 (ml. T10b–T10g) lukukyselyillä (SQL-valinta vs. odotettu), tavoite **ma 19.10.**
3. 1437:n script-tietue: poista neljä vanhaa parametria ja luo kaksi testausparametria (§ *Testausparametrit*) sekä testideployment `customdeploy_gbb_sub_extension_test` (`NOTSCHEDULED`); deployment `customdeploy_gbb_sub_extension` yksi ajastus: Monthly, kuun 10. päivä, 03:00. Poista aikaisempi päivittäinen/kuukausiajastus.
4. Ensimmäinen tuotantoajo **ti 10.11.2026 klo 03:00** (päätös 4). TASKS T54:n oletus "extension 1.11. 03:00" on rauennut.
5. Ajon jälkeen: lue `scriptnote` (script 1437), vertaa luotuja CR:iä lukukyselyyn ja tarkista, ettei yhdelläkään ole OOMI-pyörää, tapaa 3/4 tai hintaa 0. Ajo ennen CR-prosessoria (1199) antaa mahdollisuuden poistaa virheellinen Pending-CR ennen laskutusta.
6. Päivitä: sisarrepon README (poistuvat parametrit, hakuun liittyvät varoitukset), `schemas/script-inventory.md` (T63), tämän repon CLAUDE.md:n kohta *The extension loop has no owner*, TASKS T54 ja T61-tehtävä ("extension 2.0").
7. Ennen ajoa: B046508:n aiemmat jälkiveloitukset (CR 6513, 6972; laskut INVGBF1043392 ja INVGBF1043523) puretaan erillisen tehtävän T33 mukaan. Se ei kuulu tämän skriptin vastuulle.

## Päätökset avoimiin kysymyksiin (tuoteomistaja 9.10.2026)

Nämä ohittavat ylempien osioiden suositukset, jos ne ovat ristiriidassa.

1. **CR:n nimi** pysyy täsmälleen samana: `<sopimus> - pidennys - jälkiveloitus`.
2. ~~**`start`/`end`** ovat kokonaisia kalenterikuukausia kuten ennen. `start` on `subsc_end_date`:a seuraavan kuun 1. päivä, ja `end` on kuluvan kuun viimeinen päivä (ks. kohta 3).~~
   **Muutettu 13.10.2026 (ADR 0019):** `start` ja `end` ovat kuluvan kuun 1. ja viimeinen päivä.
3. ~~**Myöhästynyt kuukausi kirii kiinni.**~~ **Kumottu 13.10.2026 (tuoteomistaja, ADR 0019):** skripti ei kuro kiinni, vaan kirjaa `MISSED_MONTHS`-virheen. Alkuperäinen päätös: Ikkuna on "`subsc_end_date` ennen kuluvan kuun 1. päivää" (Helsingin aikaa), ei vain edellinen kuukausi.
   Yksi CR kattaa kaikki laskuttamattomat kuukaudet `subsc_end_date`:sta kuluvan kuun loppuun (`handler_jalki` laskuttaa välin kaikki kuukaudet).
   Esimerkki: pyörä päättyi 30.9., ja marraskuun ajo jäi väliin. Joulukuun ajo luo yhden CR:n 1.10.–31.12., joka laskuttaa 3 kuukautta.
   Idempotenssiehto 5 koskee kuluvaa kuukautta, joten se tarkistaa, ettei Pending- tai Done-pidennys-CR kata kuluvaa kuukautta.
4. **Ajopäivä on kiinteä: kuun 10. päivä klo 03:00** (NetSuite Monthly, day 10). Tämä vastaa käytännössä 7. arkipäivää ilman
   viikonpäiväsääntöä (ADR 0014). Kirjanpidon kannalta lasku lähtee noin 10. päivä. 1.–9. päivänä maksaneet eivät saa CR:ää, koska 1480 on
   kirjannut maksun tapana 1.
5. **Error- tai Needs Review -tilainen pidennys-CR estää** uuden CR:n samalle kuukaudelle. Ihminen ratkaisee sen. Tämä estää tuplalaskun.
   **Laajennettu 13.10.2026 (ADR 0019 k. 3, Q11):** Pending-, In Progress-, Error- ja Needs Review -tilainen (tai tilaton) pidennys-CR estää kaudesta riippumatta.
6. **Ei tiedostolokia.** Yksi yhteenvetorivi ja yksi rivi per luotu CR `scriptnote`-tauluun riittävät.
7. **Pyörä, jolle ei ole lähetetty maksulinkkiä, ohitetaan, ja ihminen ratkaisee sen.** **Tulkinta vahvistettu 13.10.2026 (tuoteomistaja):** ohitus koskee
   pyörää, jolla `eredem_link_sent` ≠ T **eikä aiempaa Done-tilaista pidennys-CR:ää, joka alkaa `subsc_org_end_date`:n jälkeen** (K2). SQL: ehto 5b. Jo käynnissä oleva jälkiveloitusketju (esim. T53:n
   B046667, jolle 1479 ei linkkiä lähetä) jatkuu. Ohitetut pyörät nostetaan T51:n raportointiin (lokakuussa 16 pyörää).
8. **Hinta 0 ilman tapaa 4:** extension ohittaa pyörän, ja **T51:n raportointi nostaa sen esiin**. Ihminen kirjaa tavan 4 käsin.

Yhteenvedon lokirivi saa kaksi uutta laskuria: `ohitettu_ei_linkkia` ja `ohitettu_hinta0_ei_tapaa`.

9. **K2-rajaus (tuoteomistaja 9.10.2026, T34):** jälkiveloitukseksi ja kattavuuteen lasketaan **vain pidennys-CR:t, joiden jakso alkaa alkuperäisen päättymispäivän (`subsc_org_end_date`) jälkeen**. Esimerkki B046667: CR-5094 (elokuu) kuului 2 kk:n alkuperäiseen vuokra-aikaan, joten se ei ole pidennys. Myös *Jälkiveloitus - Poikkeus* -CR:t (esim. B016555:n CR-6107) jätetään pois. Sama sääntö on vietävä maksulinkkiin (1479) ja status-sync 2.0:n tavan 2 laskentaan.
