# kuukausiajo-tarkistuslista — kuukausiraportoinnin (1452 → 1453 → CSV) tarkistukset ennen palkka-CSV:tä

**Tarkoitus:** yhdellä listalla kaikki, mitä kuun 1. päivän aamuna tarkistetaan ri_creationin (1452) ja ri_updaten (1453) jälkeen, **ennen**
palkka-CSV:tä (`mr_monthly_reporting_csv.js`, 1451). Kirjoitettu 1.11.2026 ajoa varten (T28, T29, T11, T67). Kuukausikohtaiset odotukset ovat
osiossa *1.11.2026*. Kyselyt ovat yleisiä: vaihda `<D>` = raportointipäivä (`2026-11-01`).
**Käyttäjät:** pääsessio kuukausiajon aamuna, ri-auditoija.
**Parametrit:** `<D>` = raportointipäivä `YYYY-MM-DD` (kuun 1. päivä).
**Todennettu:** 2026-10-22, kyselyt 1–4 ajettu `<D>` = 2026-10-01 (tulokset alla), 5–6 ja lokikyselyt vastaavat 1.10. lokirivejä.
Kohdan 7 kyselyt ovat työohjeesta `docs/monthly-reporting-korjaukset-t28-t29.md` § 3B, eikä niitä ole ajettu marraskuun datalla.

> [!IMPORTANT]
> **Pysäytä ennen CSV:tä, jos kohta 1, 2 tai 4 poikkeaa.** Puuttuva Active-rivi on tekemättä jäänyt palkanpidätys, ja Warning-rivi pidättää koko
> työnantajan aineiston (D8). Lokin tila ei kerro tätä: hiljainen virhe on talon tyyli (CLAUDE.md).

## 0. Ennen ajoa (31.10. tai 1.11. ennen 1452:ta)

- **Koodi File Cabinetissa** (kansio 33843): `mr_monthly_reporting_ri_creation.js` (394006) **88 959 B** ja `mr_monthly_reporting_ri_update.js` (394008)
  **106 538 B**, ladattu 21.10. (T28/T29). `gbb_lunastus_lib.js` (470259) **21 949 B**, 1.2.0, ladattu 21.10. (T11).
  ```sql
  SELECT id, name, filesize, TO_CHAR(lastmodifieddate,'DD.MM.YYYY HH24:MI') lm FROM file WHERE id IN (394006, 394008, 470259)
  ```
- **Testipyöräparametrit tyhjinä** (`custscript_gbb_ri_test_bike_id`, `custscript_gbb_update_test_bike_id`). SuiteQL ei näe parametreja, joten tarkista
  käyttöliittymästä. Varmistus jälkikäteen kohdassa 5: lokissa ei saa olla `⚠ TEST SCOPE`.
- **CR-jono:** `customdeploy_gbb_change_request_hdl_2` ajaa kuun 1. päivänä klo 01:33 Helsingin aikaa. Pending-, Error- ja Needs Review -CR:t ennen 1452:ta:
  ```sql
  SELECT id, altname, custrecord_cr_type, custrecord_cr_status FROM customrecord_subscrption_change_request WHERE custrecord_cr_status IN (1,5,6)
  ```
  22.10.: vain CR 4652 (tyyppi 13, Error 25.07., vanha).
- **Ei konsernisiirtoja kesken ajon.** 1.10. tyypin 13 paketit (Metsä Board → Metsä Fibre, CR 6974–6981) käsiteltiin klo 10, ri_creationin
  (01:02) ja CSV:n (04:03) välissä ja jälkeen. Ks. *Havainto* alla.

## 1. Päättymiskuun pyörillä tasan yksi Active-rivi (ADR 0002, T27)

Pyörä, jonka `subsc_end_date` on raportointikuussa ja jolla on selvitystapa, raportoidaan vielä Active (Ended vasta seuraavana kuuna).
Status voi olla jo 2/3, koska 2.0 kääntää sen kuun 1. päivänä klo 00:30. **Odotus 0.**

```sql
SELECT br.id, br.name, br.custrecord_sta_bike_status
FROM customrecord_sta_bike_register br
WHERE br.isinactive = 'F' AND br.custrecord_gbb_liab_settle_method IS NOT NULL
  AND br.custrecord_sta_subsc_end_date >= TO_DATE('<D>','YYYY-MM-DD')
  AND br.custrecord_sta_subsc_end_date <  ADD_MONTHS(TO_DATE('<D>','YYYY-MM-DD'),1)
  AND (SELECT COUNT(*) FROM customrecord_gbb_monthly_reporting_item ri
       WHERE ri.custrecord_gbb_ri_bike = br.id AND ri.custrecord_gbb_ri_reporting_date = TO_DATE('<D>','YYYY-MM-DD')
         AND ri.custrecord_gbb_ri_reporting_status IN (1,2)) <> 1
```
Todennus 1.10.: **0** (162/162, T27). Joukon koko 22.10. marraskuulle: **80** pyörää (kasvaa lokakuun aikana).

## 2. Edellisenä kuuna päättyneillä Ended-rivi

Status 2/3, `subsc_end_date` edellisessä kuussa → Ended-rivi raportointipäivälle **tai** aiempi Ended-rivi (OOMI päättyy samassa kuussa, item Q, T67).

```sql
SELECT br.id, br.name, br.custrecord_sta_bike_status, br.custrecord_gbb_liab_settle_method, TO_CHAR(br.custrecord_sta_subsc_end_date,'DD.MM.YYYY') e
FROM customrecord_sta_bike_register br
WHERE br.isinactive = 'F' AND br.custrecord_sta_bike_status IN (2,3)
  AND br.custrecord_sta_subsc_end_date >= ADD_MONTHS(TO_DATE('<D>','YYYY-MM-DD'),-1)
  AND br.custrecord_sta_subsc_end_date <  TO_DATE('<D>','YYYY-MM-DD')
  AND NOT EXISTS (SELECT 1 FROM customrecord_gbb_monthly_reporting_item ri
                  WHERE ri.custrecord_gbb_ri_bike = br.id AND ri.custrecord_gbb_ri_reporting_status = 4
                    AND ri.custrecord_gbb_ri_reporting_date >= TO_DATE('2026-09-01','YYYY-MM-DD')
                    AND ri.custrecord_gbb_ri_reporting_date <= TO_DATE('<D>','YYYY-MM-DD'))
```
Todennus 1.10. (ilman aiemman Ended-rivin ehtoa): 18, kaikki selitettyjä: 9 takautuvaa (T67 luokka C, marraskuun Ended valmiina), 6 OOMI-pyörää,
joiden Ended on syyskuussa, B021208 ja B046675 (syyskuun Ended), B046667 (T34). Aiemman Ended-rivin ehdolla jäljelle jäävät vain luokka C ja B046667.
**Odotus 1.11.:** vain tunnetut, eli B046667, jos T34 on auki. Joukon koko 22.10.: **971** lokakuussa päättyvää status 2/3 -pyörää, joista 181:llä on jo
marraskuun Ended-rivi (UE, CR-käsittely) ja 7:llä aiempi Ended-rivi.

## 3. Ei Active-riviä päättymiskuun jälkeen (T67)

Active-rivi kuukaudelle, joka on jo päättymiskuun jälkeen, on liikaa raportoitu palkanpidätys. **Odotus 0** (tunnetut: ProMet B023198, B024587 ja B024908,
jos T1d on auki).

```sql
SELECT br.name, ri.id, TO_CHAR(br.custrecord_sta_subsc_end_date,'DD.MM.YYYY') e, BUILTIN.DF(ri.custrecord_gbb_ri_employer) emp
FROM customrecord_gbb_monthly_reporting_item ri JOIN customrecord_sta_bike_register br ON br.id = ri.custrecord_gbb_ri_bike
WHERE ri.custrecord_gbb_ri_reporting_status IN (1,2) AND ri.custrecord_gbb_ri_reporting_date = TO_DATE('<D>','YYYY-MM-DD')
  AND ri.custrecord_gbb_ri_reporting_date > LAST_DAY(br.custrecord_sta_subsc_end_date) AND br.isinactive = 'F'
```
Syys–lokakuun luokittelu ja tausta: [`findings/2026-10-22-raportoitu-paattymisen-jalkeen.md`](../findings/2026-10-22-raportoitu-paattymisen-jalkeen.md).

## 4. Warning-rivit = pidätetyt työnantajat (D8)

Työnantaja, jolla on yksikin Warning-rivi raportointipäivälle, puuttuu palkka-CSV:stä **kokonaan**. **Odotus:** vain Testi Yritys Oy (B017530).

```sql
SELECT BUILTIN.DF(ri.custrecord_gbb_ri_employer) emp, COUNT(*) warn
FROM customrecord_gbb_monthly_reporting_item ri
WHERE ri.custrecord_gbb_ri_reporting_date = TO_DATE('<D>','YYYY-MM-DD') AND ri.custrecord_gbb_ri_reporting_status = 5
GROUP BY BUILTIN.DF(ri.custrecord_gbb_ri_employer)
```
Todennus 1.10. (tila 22.10.): 1 työnantaja, Testi Yritys Oy (2 riviä).

## 5. Lokit (`scriptnote`, `date` on ajonaikaista aikaa noin 10 h Helsinkiä jäljessä, joten 1.11. aamun ajot ovat lokissa 31.10.)

```sql
SELECT scripttype, type, TO_CHAR(date,'DD.MM.YYYY HH24:MI') d, title, SUBSTR(detail,1,900) detail FROM scriptnote
WHERE scripttype IN (1452,1453) AND date >= TO_DATE('<D>','YYYY-MM-DD') - 2
  AND (title LIKE '%summarize%' OR title LIKE '%TEST SCOPE%' OR title LIKE '%getInputData%' OR type IN ('ERROR','EMERGENCY'))
ORDER BY date
```
| Rivi | Odotus | 1.10. vertailu |
|---|---|---|
| 1452 `getInputData started` | `reportingDate=<D>`, ei `⚠ TEST SCOPE` | `reportingDate=2026-10-01` |
| 1452 `summarize \| done` | **`gbb_lunastus_lib=1.2.0`** (T11), `mapErrors=0` | `1.1.0`, `scanned=46626 created=33862 converted=8 mapErrors=0` |
| 1452 ämpärit | samaa suuruusluokkaa, `error`-ämpäriä ei ole | `active_created_continuing=32887`, `ended_created=658`, `ended_created_late=148`, `oomi_ended_created=75`, `ended_already_reported=12546` |
| 1453 `⚠ TEST SCOPE ACTIVE` | **ei riviä** | ei riviä |
| 1453 `summarize \| finished` | **`gbb_lunastus_lib=1.2.0`**, `mapErrors=0`, `reduceErrors=0` | |
| 1453 `stage counters` | `c_flagged` **selvästi alle 285** (T28) | `c_flagged=285` (202 väärin), `c_not_flagged=1074` |
| ERROR/EMERGENCY | 0 | |

CLAUDE.md:n avoin kohta 2 ("ei koskaan ajettu koko populaatiolle") on vanhentunut: 1.10. ajo oli koko populaation ajo (ei `TEST SCOPE`, `scanned=46626`).

## 6. Tuplarivit samalle pyörälle ja työnantajalle

**Odotus 0.** Eri työnantajien siirtopari (Ended vanhalle ja New uudelle) ei näy tässä, koska ryhmittely on pyörä + työnantaja.

```sql
SELECT BUILTIN.DF(x.b) bike, x.n, x.sts FROM (
  SELECT ri.custrecord_gbb_ri_bike b, COUNT(*) n, LISTAGG(ri.custrecord_gbb_ri_reporting_status, ',') WITHIN GROUP (ORDER BY ri.id) sts
  FROM customrecord_gbb_monthly_reporting_item ri
  WHERE ri.custrecord_gbb_ri_reporting_date = TO_DATE('<D>','YYYY-MM-DD') AND ri.custrecord_gbb_ri_reporting_status <> 6
  GROUP BY ri.custrecord_gbb_ri_bike, ri.custrecord_gbb_ri_employer HAVING COUNT(*) > 1) x
```
Todennus 1.10. (tila 22.10.): 9 ryhmää, joista 8 on Metsä Board -pyöriä, joilla on Active + Ended (ks. *Havainto*).

## 7. T28, T29 ja Ended voittaa (työohje § 3B)

Kaikki **0 riviä**. Kontrollit (**> 0**, muuten testi ei todista mitään) ovat työohjeessa.
```sql
-- T28: raportointikuuta edeltävänä kuuna päättynyt Ended-rivi ei saa palkkatarkistushuomiota
SELECT id, name FROM customrecord_gbb_monthly_reporting_item
WHERE custrecord_gbb_ri_reporting_date = TO_DATE('<D>','YYYY-MM-DD') AND custrecord_gbb_ri_reporting_status = 4
  AND custrecord_gbb_ri_lease_end_date >= ADD_MONTHS(TO_DATE('<D>','YYYY-MM-DD'),-1)
  AND custrecord_gbb_ri_lease_end_date <  TO_DATE('<D>','YYYY-MM-DD')
  AND custrecord_gbb_ri_gbb_notification LIKE '%Tarkastakaa työntekijän palkoista%'
-- T29: Ended-rivillä ei C3- eikä C4-tekstiä
SELECT id, name FROM customrecord_gbb_monthly_reporting_item
WHERE custrecord_gbb_ri_reporting_date = TO_DATE('<D>','YYYY-MM-DD') AND custrecord_gbb_ri_reporting_status = 4
  AND (custrecord_gbb_ri_gbb_notification LIKE '%Pyörän lunastus on myöhässä%'
    OR custrecord_gbb_ri_gbb_notification LIKE '%Vuokrakauden päättymispäivä on muuttunut%')
```
Jos T28 tai T29 palauttaa rivejä, tee sama CSV-import kuin 1.10. (`imports/2026-10-01-turhat-palkkahuomiot/`, `…-myohassa-teksti-ended/`) ennen CSV:tä.

## 1.11.2026: erityistarkistukset

**T67 luokka C:** takautuvasti päättyneiden marraskuun Ended-riveille tulee lippu. **Odotus 11/11 `LIPPU`.**
```sql
SELECT br.name, ri.id, CASE WHEN ri.custrecord_gbb_ri_gbb_notification LIKE '%Tarkastakaa%' THEN 'LIPPU' ELSE '-' END lippu
FROM customrecord_gbb_monthly_reporting_item ri JOIN customrecord_sta_bike_register br ON br.id = ri.custrecord_gbb_ri_bike
WHERE ri.custrecord_gbb_ri_reporting_status = 4 AND ri.custrecord_gbb_ri_reporting_date = TO_DATE('2026-11-01','YYYY-MM-DD')
  AND br.name IN ('B003182','B007696','B024380','B027918','B029495','B030544','B033466','B036379','B040768','B043365','B044884')
```
**B020053:** saa myöhästyneen Ended-rivin (`ended_created_late`) ja lipun. Syys- ja lokakuu raportoitiin Active-tilaisina, vaikka `subsc_end_date` on 31.08.
**ProMet (T1d):** jos taloustiimi ei ole vastannut, RI-rivit 104318–104320 muutetaan Endediksi ennen CSV:tä (varasuunnitelma).
**B036939 (T20):** marraskuun rivin `lease_fee_vat0` on 59,76 (rekisteri korjattu 22.10.).

## Havainto (ei tarkistus): Metsä Boardin konsernisiirto kesken lokakuun ajon

Kahdeksan Metsä Board Oyj:n pyörää (B007427, B008050, B008338, B008794, B009475, B010178, B026174 ja B034821) siirtyi Metsä Fibre Oy:lle tyypin 13
paketeilla 1.10. (CR 6974–6981 → 9 *Siirto konserni*, `start_date` 01.11., + 11 + 7). Lokakuun rivit: Active Metsä Board (luotu 01:17–02:38),
Ended Metsä Board (04:01, teksti *"…siirtynyt toiselle konserniyhtiölle 30.09.2026"*) ja Active/New Metsä Fibre (10:01–10:02).
**Lokakuun palkka-CSV:ssä (04:03, Shared drive Archive) oli vain Metsä Boardin Active-rivi.** Ended- ja New-rivit eivät lähteneet. Lokakuun vähennys
on siis raportoitu Metsä Boardille, vaikka raportoinnin työnantaja vaihtui 1.10. Selvitettävä, tarvitaanko ilmoitus (sama konserni, voi olla harmiton).
Ei kirjattu aiemmin mihinkään. Marraskuussa pyörien pitäisi olla Active Metsä Fibrellä, ja kohta 6 näyttää, jäävätkö Metsä Boardin rivit tuplaksi.
