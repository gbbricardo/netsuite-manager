# Työohje: keskenkauden lunastuksen käsittelijä, vaatimukset H1–H6 (ennen 1.11.2026)

**Repo:** `../netsuite-subscrption-cr-scripts` (SuiteScript 2.x, ei SDF-objekteja repossa, auktoriteetti `CHANGELOG.md`). Rivinumerot: HEAD `6c388c2`, 9.10.2026.
**Lähteet:** [`keskenkauden-lunastus-vaatimukset.md`](keskenkauden-lunastus-vaatimukset.md), [ADR 0008](adr/0008-keskenkauden-lunastuksessa-cr-voittaa-maksun.md),
[ADR 0010](adr/0010-keskenkauden-lunastus.md) k. 4, 7, 8, [ADR 0015](adr/0015-status-sync-2-tarkennukset.md). Älä muokkaa muita sisarrepoja. Kirjaa muutos `CHANGELOG.md`:hen.
**Korjaus toimeksiantoon:** `ue_gbb_redemption_decided_at.js` on **tässä samassa repossa** (`cr-processor/`), ei monthly-reportingissa. Sitä ei tarvitse koodata uudelleen (kohta 3, H5).
H7 ja H8 eivät muutu. H4 ei vaadi koodimuutosta handlerissa (kohta 2).

## 1. Muutokset funktiotasolla (`cr-processor/handler_lunastus.js`)

**Rakenne.** Lisää puhdas moduuli `cr_lunastus_plan.js` (kuten `cr_pause_plan.js`; testit `tests/cr_lunastus_plan.test.js`, ajo `npm test`) funktiolla
`tarkistaCr({official, created, createdRecord, currentEnd, today})` -> `{ok:true}` tai `{ok:false, koodi, syy}`. Näin H1–H3 saa yksikkötestit, vaikka handleria ei voi ajaa paikallisesti.
Ladataan ennen `handler_lunastus.js`:ää (kuten `cr_pause_plan` ennen `handler_vali`:a).

| # | Nykyinen käytös | Oikea käytös | Muutos |
|---|---|---|---|
| H1 | `contractEndDate` luetaan `:97` ja kirjoitetaan `:148-149` ilman tarkistusta. `mergeForLunastusLib` `:252` kiertää tyhjän vain statusportille | Tyhjä virallinen päättymispäivä: Needs Review, **ei yhtään kirjoitusta** | `process()`: tarkistus heti `:102` jälkeen, **ennen** sopimusrivihakua `:105` ja rivikirjoituksia `:112-124`. Poista `:252`:n truthy-vartija ja päivitä kommentti `:226-231` |
| H2 | `:339-346` korvaa tyhjän luontipäivän ajopäivällä ja lokittaa `log.error`:in, status silti Done | Tyhjä `custrecord_cr_created_date`: Needs Review, ajopäivällä ei paikata | Sama esitarkistus kuin H1. Poista fallback `:340-346`; `addLiabilitySettlementFields` (`:312`) saa olettaa luontipäivän olemassaolon (varalle `throw`) |
| H3 | Kirjoittaa ehdoitta (`:148`) | Needs Review, jos CR:n virallinen päivä on **myöhempi** kuin pyörän nykyinen päättymisajankohta. Sama päivä kelpaa | Esitarkistukseen: lue pyörän kolme päättymiskenttää (`LUNASTUS_LIB_FIELDS` `:25-32` jo määritelty), `lunastus.paattymisajankohta(...)`. Vertaa **päivinä** (vuosi*10000+kk*100+pv), ei `Date`-millisekunteina. Nykyinen tyhjä: ei estä, lokita |
| H4 | Kirjoittaa vain `subsc_end_date` (`:147-149`) | Ei muutosta | Älä lisää poikkeuskenttien kirjoitusta. `LUNASTUS_LIB_FIELDS` ja `explainStatusDeferral` `:269` siivotaan K1:n kanssa (kirjasto) |
| H5 | Kenttää `custrecord_gbb_redemption_decided_at` ei kirjoiteta; UE leimaa käsittelyhetken | `decided_at` = `custrecord_cr_created_date`, **samassa `submitFields`:ssä** (`:192`) kuin tapa | `addLiabilitySettlementFields`: `values.custrecord_gbb_redemption_decided_at = crCreatedDate`. **Ei write-once**: ylikirjoittaa UE:n tai maksupolun aiemman leiman. Lisää kenttä `written`-palautteeseen ja `describeSettlementWrite`:en (`:280`) |
| H6 | Tapa (`:348-353`) ja `liab_settled_at` (`:355-360`) vain tyhjään kenttään | Aina CR:ltä. Poikkeus: arvo on peräisin **aiemmasta Done-tilaisesta tyypin 2 CR:stä** (silloin säilyy, kuten ennen) | Poista `currentMethodValue`/`currentSettledAt`-vartijat. Uusi `edellinenTyyppi2Cr(bikeId, crId)` (haku: tyyppi 2, tila 2 Done, `id` ≠ tämä, `isinactive` F). Löytyy: kirjoita ei tapaa, `settled_at`:ia eikä `decided_at`:ia, lokita. Muuten kirjoita ja kirjaa vanhat arvot automation_logs:iin (palautettavuus) |

`cr_bike_snapshot.capture` (`:191`) tallentaa vain viisi kenttää (`cr_bike_snapshot.js:34-40`) ja suodattaa saapuvat avaimet: uusi `decided_at` ei vaikuta, eikä muutosta tarvita.
`cr_bike_register_apply` ei kuulu tähän handleriin (importtina vain siirtohandlereissa). `handler_lunastus` ei kirjoita eikä saa kirjoittaa `paid_at`:ia (S4).

## 2. Needs Review -polku

- `process()` palauttaa `{ needsReview: true }` (kuten `handler_hyvitys.js:133`). `cr_dispatcher.js:85-95` asettaa tilan 6 ja `closed_date`:n. **Ennen paluuta** `process()` kirjoittaa
  `custrecord_cr_automation_logs`:iin (dispatcher tyhjentää kentän vain ennen ajoa, `:35-41`), muoto kiinteä: `NEEDS REVIEW H1: custrecord_cr_contract_official_end_date is empty. Nothing written.`
  Koodit: `H1`, `H2`, `H2b` (luontipäivä ennen tietueen luontia), `H3` (+ päivät: `CR 2026-12-31 > bike 2026-11-30`). Kiinteä etuliite on S1-raportin (erillinen skripti) tunniste.
- Lisäksi `log.audit('handler_lunastus', 'CR <id> bike <id> -> NEEDS REVIEW <koodi>: <syy>')`. Kirjoituksia ei ole: ei rivejä, ei pyörän kenttiä, ei sähköpostia, ei snapshotia.
- **Test-/suora ajo `execute()` `:436-475` merkitsee nyt aina Done:ksi (`:455-463`).** Kopioi `handler_hyvitys.js:366-395` -malli (`CR_STATUS_NEEDS_REVIEW = 6`, `result.needsReview`), muuten testi todistaa väärää.
- Needs Review -CR ei lähde uudelleen jonoon itsestään (`cr_scheduler` hakee vain tilan 1, `closed_date` on asetettu). Korjauksen jälkeen: tila Pending, `closed_date` tyhjä, lokikenttä tyhjä, käsin.
  Omistajat: talous + asiakaspalvelu, määräaika luontikuun loppu (ADR 0010 k. 7).

## 3. H5/H6 ja UE (`ue_gbb_redemption_decided_at.js`), koodista päätelty, todennettava ajossa

- Handler kirjoittaa `submitFields`:llä, eli UE saa XEDIT:n. UE vertaa uutta tapaa `oldRecord`:iin (`:118-122`) ja lukee tallennetun `decided_at`:n **tallennuksen jälkeen** (`:137-144`, `:169-175`).
  Kun tapa ja `decided_at` ovat samassa tallennuksessa, UE näkee täytetyn arvon ja lokittaa *"left untouched (write-once)"*. UE ei kirjoita päälle. Koodimuutosta ei tarvita.
- Kun H6 ylikirjoittaa maksupolun tavan 1 samaksi arvoksi (1 -> 1), UE ei laukea lainkaan. Kun tapa vaihtuu (1 -> 6), laukeaa mutta jättää arvon. Kumpikin on oikein, **vain jos H5 kirjoittaa arvon samassa tallennuksessa**.
  Jos H5 kirjoitettaisiin erillisellä `submitFields`:llä tapa-kirjoituksen jälkeen, UE ehtisi leimata ajopäivän ensin. Älä jaa kirjoitusta.
- UE:n otsikkokommentit (`:14`, `:17` "always now") vanhenevat ADR 0010 k. 4:n myötä keskenkaudella. Päivitä kommentti ja `docs/scripts/ue_gbb_redemption_decided_at.md`; ei logiikkamuutosta.
- CSV-importit eivät laukaise UE:tä (CLAUDE.md kohta 3), joten historiakorjaus (`imports/2026-09-25-decided-at-historia/`) ei kilpaile handlerin kanssa.

## 4. status-sync 2.0 (`feat/status-sync-2`, 845f658, `gbb-redemption-sync-2/`): havainnot

1. **Ei kilpailua `decided_at`:sta.** 2.0 ei lue eikä kirjoita sitä (`gbb_mr_redemption_sync2.js:42-45`, `gbb_rss2_paatos.js` `FIELDS`). Vain handler ja UE kirjoittavat.
2. **Ei kilpailua tavasta ja `liab_settled_at`:sta Pending/Done-CR:n jälkeen.** Vaihe 2 (`gbb_rss2_paatos.js:365`) koskee vain `kaudenLoppu`-pyöriä, eli ilman tyypin 2/10 CR:ää tilassa 1/2
   (`gbb_mr_redemption_sync2.js:376-380`). Vaihe 1 kirjoittaa vain `paid_at`:n (`:359`, S4), jota H6 ei koske. H6:n "CR voittaa maksun" pitää.
3. **Yksi ikkuna, ja se on tarkoituksellinen:** pyörällä ei vielä CR:ää, päättymiskuu alkanut, 2.0 kirjoittaa tavan 1 ja `settled_at = paid_at` (2c/2d) tai OOMI:lle tavan 1 ja ajopäivän (2a). UE leimaa `decided_at`:n.
   Takautuva CR myöhemmin: H5/H6 ylikirjoittavat kaikki kolme CR:n luontipäivällä. Tämän jälkeen 2.0 pysyy erossa (`cr_2_10` > 0). **Siksi H5 ei saa olla write-once.**
4. **Havainto, päätettävä:** 2.0:n `cr_2_10` laskee vain tilat Pending ja Done (`:380`). Needs Review -CR:n pyörä näyttää 2.0:lle kauden lopun pyörältä: päättymiskuun alettua 2.0 voi kirjoittaa tavan
   ja kääntää statuksen ennen kuin CR on korjattu. Korjauksen jälkeen H6 ylikirjoittaa, joten lopputulos oikaistuu, mutta välillä status voi olla väärä. Ks. kysymys 3.
5. **Vaihe 4 (IC):** kun handler siirtää `subsc_end_date`:a, 2.0 siirtää `ic_redemption_dt`:n ja **tyhjentää `ic_redemption_pr`:n** (`:412`). Odotettu, ei ristiriita.
6. **Vaihe 3** käyttää samaa kirjastoporttia (`saakoMerkitaPaattyneeksi`) kuin handler `:181`, joten status ei eroa. 2.0 syöttää kirjastolle vain `subsc_end_date`:n; handler antaa kolme kenttää. Eroa ei synny, kun T8 on ajettu, mutta ennen T8:aa kyllä.

## 5. Ehdotus: luontipäivä selvästi ennen tietueen luontia (päätettävä, tuoteomistaja)

**Tausta 9.10.:** käsin kopioidulla CR:llä `custrecord_cr_created_date` voi olla kopioitu lähteestä. H2 tarkistaa vain tyhjän, joten kopioitu päivä menisi `liab_settled_at`:iin ja `decided_at`:iin.
**Mitattu 9.10. (SuiteQL, tyyppi 2):** 1 969 CR:stä 1 964:llä `created_date` on ±1 vrk tietueen `created`-päivästä, myöhempiä 0. Yli 30 pv aikaisempia 5: CR 4542, 4544 (Cancelled), 4545, 4634, 4637
(luontipäivä 25.2. tai 15.6., tietue luotu 20.–24.7.).
**Ehdotus (`H2b`):** Needs Review, jos `created_date` < tietueen `created` (Helsingin päivä) − N pv. Ehdotettu N = 1 (historia: 0 väärää hälytystä). Samalla `created_date` > `created` + 1: Needs Review (tulevaisuuden päivä).
Toteutus: `search.lookupFields({type: CR, id, columns:['created']})`, `lunastus.tanaanHelsinki(instant)`; **todenna ajossa**, että `created` palautuu custom recordilla. ADR 0010 k. 2 tukee tulkintaa: takautuvankin CR:n luontipäivä on todellinen luontipäivä.

## 6. Testaus NetSuitessa (ei testiajuria)

Pure-moduulin testit: `npm test` (H1–H3, H2b). Handler: testipyörä B017530 (poissuljetaan mittareista), käsin luodut Pending-CR:t. Aseta handler-skriptin parametri
`custscript_lunastus_test_cr_id` (tai `cr_scheduler`:n `custscript_cr_test_id`), aja kerran. Tarkista ennen, että pyörällä on aktiivinen sopimusrivi, muuten `:106` heittää. Rivit ja kentät palautetaan käsin.
Tapaukset: (a) virallinen päivä tyhjä; (b) luontipäivä tyhjä; (c) virallinen päivä > pyörän päättymispäivä; (d) sama päivä (kelpaa); (e) luontipäivä 60 pv ennen tietuetta; (f) normaali 2C, pyörällä
ennalta tapa 1 + `decided_at` = eilinen (UE-leima): odotus tapa 1 (tai 6), `settled_at` = `decided_at` = CR:n luontipäivä; (g) toinen CR pyörälle, jolla on jo Done-tyypin 2 CR: arvot säilyvät.
Positiivinen kontrolli: (a)–(e) -CR:t ovat tilassa 6, lokikenttä alkaa `NEEDS REVIEW`. UE-loki (`scriptnote`) näyttää (f):ssä *left untouched*.

Jälkitarkistus (kaikki **0 riviä**; 1 ja 2 laskevat vain ajon jälkeen suljetut CR:t, korvaa `<DEPLOY>`):
```sql
-- 1 Done-CR:llä ei saa olla tyhjiä pakollisia päiviä
SELECT cr.id FROM customrecord_subscrption_change_request cr WHERE cr.custrecord_cr_type = 2 AND cr.custrecord_cr_status = 2
  AND cr.custrecord_cr_closed_date >= TO_DATE('<DEPLOY>','YYYY-MM-DD')
  AND (cr.custrecord_cr_contract_official_end_date IS NULL OR cr.custrecord_cr_created_date IS NULL)
-- 2 decided_at ja settled_at = CR:n luontipäivä (pyörät, joilla vain yksi Done-tyypin 2 CR)
SELECT br.id FROM customrecord_sta_bike_register br JOIN customrecord_subscrption_change_request cr ON cr.custrecord_cr_bike_registry = br.id
WHERE cr.custrecord_cr_type = 2 AND cr.custrecord_cr_status = 2 AND cr.custrecord_cr_closed_date >= TO_DATE('<DEPLOY>','YYYY-MM-DD')
  AND (br.custrecord_gbb_redemption_decided_at <> cr.custrecord_cr_created_date OR br.custrecord_gbb_redemption_decided_at IS NULL
       OR br.custrecord_gbb_liab_settled_at <> cr.custrecord_cr_created_date)
```
Lisäksi: portin kvadrantti (CLAUDE.md, solu "2 tai 3 + tuleva päättymispäivä" = 0) ja `scriptnote` (`scripttype = 1199`, ajon `handler_lunastus`-rivit): ei `has no custrecord_cr_created_date`-riviä. Poikkeuskenttien muuttumattomuus
todennetaan lokista, ei `systemnote`:sta (suodatin epäluotettava). Kontrolli > 0: tilan 6 tyypin 2 CR:t ajon jälkeen.

## 7. Käyttöönotto ja ajoitus

1. Tiedostot: `cr_lunastus_plan.js` ensin, sitten `handler_lunastus.js` samaan kansioon (File Cabinet, ylikirjoitus; repossa ei ole SDF-objekteja, README § Deployment). Päivitä `docs/scripts/handler_lunastus.md`, `CHANGELOG.md`.
2. **Ennakkomittaus (SuiteQL, 26.10.):** montako nykyistä Pending tyypin 2 CR:ää menisi Needs Review:hin (tyhjä virallinen päivä, tyhjä luontipäivä, H3, H2b). Historiassa tyhjä virallinen päivä on 521/2 495:llä, joten jono voi olla suuri. Omistajille tieto ennen latausta.
3. **Aikataulu:** koodi valmis 26.10., kylvetty testi 26.–27.10., lataus **ti 27.10.** heti CR-ajon (6 h välein) jälkeen, ei ajon aikana. Tarkista deploymentin kellonajat skriptitietueelta.
   T8:n CSV ajetaan ennen latausta (H3 vertaa päättymisajankohtaan). Ei latausta 30.10.–2.11. Viimeinen CR-ajo ennen MONTHLY-ajoa 1.11. 01:33 muuttaa `subsc_end_date`:a, jota RI-luonti lukee; se on odotettua.
4. Jälkitarkistus heti seuraavan CR-ajon jälkeen ja uudelleen 2.11. MONTHLY-ajon jälkeen. Takaisinotto: lataa edellinen `handler_lunastus.js` (commit `6c388c2`); tilaan 6 menneet CR:t jäävät sinne ja nostetaan jonoon käsin.

## 8. Riskit

- **Needs Review -jonon koko ja omistajuus** (talous + asiakaspalvelu). Ilman S1-raporttia jono ei näy kenellekään. Määräaika luontikuun loppu on aito: virheellinen kuukausi ehditään laskuttaa.
- **H6 on ylikirjoitus.** Käsin kirjattua tapaa (esim. 3/4 Payment Linkistä) ei voi erottaa maksupolun tavasta. Vanhat arvot menevät automation_logs:iin; muuta palautusreittiä ei ole.
- **Ei atomista:** rivit kirjoitetaan (`:112`) ennen pyörää (`:192`). Esitarkistus siirtää kaikki NR-tapaukset ennen kirjoituksia, mutta myöhempi heitto jättää rivit kirjoitetuiksi (ennallaan).
- **Kirjaston heitto** tunnistamattomasta päivämuodosta esitarkistuksessa -> tila 5 Error ilman kirjoituksia; ei Needs Review. Hyväksyttävä, mutta mainitaan lokissa.
- **Aikavyöhyke:** vertaa Helsingin päiviä (`tanaanHelsinki`), ei `getDate()`-lukuja ajoympäristön vyöhykkeellä (~10 h).
- **K1 (kirjasto, lokakuu):** H3 käyttää `paattymisajankohta`:a, joten se seuraa K1:tä automaattisesti. Jos K1 ja H3 ladataan eri aikaan, H3:n tulos voi muuttua pyörillä, joilla on poikkeuspäivä (16 pyörää, T8).
- **Kirjoitus jaetaan vain `submitFields`:llä**; jos toteutus siirtyy `record.save`:en, UE:n `oldRecord`-vertailu muuttuu (EDIT).

## Avoimet kysymykset tuoteomistajalle

1. H2b: otetaanko luontipäivän tarkistus mukaan, ja mikä on toleranssi N (ehdotus 1 vrk; tulevaisuuden päivä myös Needs Review)?
2. Toinen tyypin 2 CR samalle pyörälle: pitääkö `decided_at` säilyä aiemman CR:n arvona (H6:n trio `decided_at` = `settled_at` = CR:n päivä) vai kuuluuko se päivittyä uusimman mukaan, kuten
   historia-CSV tekee (ADR 0010 k. 4)? Ohje olettaa trion pysyvän yhdessä; CSV ja H6 ovat nyt ristiriidassa.
3. Pitääkö 2.0:n `cr_2_10` laskea myös tila 6 (Needs Review), jotta 2.0 ei käsittele pyörää kauden lopun pyöränä? Muutos kuuluisi status-sync-repoon.
4. H3, nykyinen päättymisajankohta tyhjä: sallitaanko kirjoitus (ohjeen oletus) vai Needs Review?
5. H6: ylikirjoitetaanko myös käsin kirjattu tapa (ohjeen oletus, koska erottelua ei ole), vai vain tavat 1 ja `liab_settled_at`?

## Tuoteomistajan päätökset 9.10.2026

1. **H2b ei toteuteta.** Luontipäivää ei verrata tietueen `created`-päivään.
2. H3: jos pyörän nykyinen päättymisajankohta on tyhjä, kirjoitus sallitaan.
3. H6: CR ylikirjoittaa myös käsin kirjatun tavan.
4. Toinen tyypin 2 CR samalle pyörälle: `decided_at` säilyy ensimmäisen CR:n arvona (H6:n kolmikko). Historia-CSV noudattaa samaa.
5. Status-sync 2.0:n `cr_2_10` laskee mukaan myös tilan 6. Muutos tehdään status-sync-repossa (TASKS T54).
6. Needs Review -jonon käsittelee tuoteomistaja.
