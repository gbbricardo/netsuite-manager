# Active-rivit päättymiskuun jälkeen: kuka saa tiedon palkkavähennyksen oikaisusta (22.10.2026)

**Lähtökohta.** T66:ssa B036379:n lokakuun RI-rivi 143495 oli Active ja raportoitu 1.10., vaikka keskenkauden lunastus
(CR 7292, luotu 21.10.) päätti sopimuksen 30.09.2026. Kysymys: kuinka monella pyörällä palkkavähennys on raportoitu kuukaudelta,
joka on jo virallisen päättymisen jälkeen, ja saako työnantaja niistä tiedon?

**Omistava repo:** `netsuite-monthly-reporting`. Tämä on analyysi, ei korjausta.

## Suunniteltu korjauspolku (koodista todettu)

`mr_monthly_reporting_ri_update.js:953-989` (vaihe 1c): kun Ended-rivin raportointikuukausi on myöhempi kuin päättymiskuuta
seuraava kuukausi (`endIdx + 1 < repIdx`, T28-korjaus 21.10.), riville lisätään teksti
*"Tarkastakaa työntekijän palkoista tehdyt vähennykset."* (`STATUS_CHANGE_WARNING_TEXT`, rivi 134). Työnantaja oikaisee
liian suuret vähennykset tämän perusteella. Takautuva päättyminen ei siis ole virhe sinänsä, jos pyörälle syntyy myöhemmin Ended-rivi,
joka saa lipun.

## Joukko (NetSuitesta todettu 22.10.2026)

RI-rivit, joiden status on 1/2, raportointipäivä 01.09. tai 01.10.2026 ja raportointipäivä > `LAST_DAY(subsc_end_date)`, aktiiviset pyörät:
**81 riviä, 75 pyörää, `lease_fee_vat0` yhteensä 5 838 € (netto).**

| Luokka | Rivejä | Netto € | Tila |
|---|---|---|---|
| **A** Samassa kuussa (09) myös Ended-rivi, joka on luotu **04.09.** (item Q -backfill). Lokakuun riviä ei ole. | **20** | **1 606** | ❌ **Aukko**, ks. alla |
| **B** Myöhemmässä kuussa on Ended-rivi, jolla on lippu | 37 | 2 300 | ✅ hoidettu (lokakuun Ended-rivit 1.10.) |
| **C** Marraskuun Ended-rivi on olemassa, mutta siinä ei vielä ole lippua | 13 (11 pyörää) | 1 046 | ⏳ `ri_update` lisää lipun 1.11. Todennettava |
| **D** Myöhempi Ended-rivi ilman lippua | 2 | 161 | ⚠ rekisteri ja CR ristiriidassa |
| **E** Ei Ended-riviä | 9 | 725 | tunnetut tapaukset + B020053 |

Luokka C: B003182, B007696, B024380 (09 + 10), B027918, B029495 (09 + 10), B030544, B033466, **B036379**, B040768, B043365 ja B044884.
Kaikkien marraskuun Ended-rivien `lease_end` on 31.08. tai 30.09., joten ehto `endIdx + 1 < 11` täyttyy (koodista päätelty, ei vielä ajettu).

## Luokka A: 20 pyörää, joiden päättymisestä työnantaja ei ole saanut tietoa

B002971, B006689, B008579, B008961, B011961, B019294, B023575, B024022, B025101, B026252, B037859, B038735, B038940, B039962,
B042269, B042350, B044437, B044561, B044644, B046071. Näistä 10 on OOMI-pyöriä ja 4 status 3.

**Todettu NetSuitesta (rivihistoria, kaikki 20 samaa kuviota):**
- Syyskuun Active-rivi on luotu ennen 1.9. (24.07.–31.08.). Pyörän `subsc_end_date` on 30.06.–31.08.2026.
- Syyskuun Ended-rivi (sama työnantaja) on luotu **04.09.2026**, eli syyskuun CSV:n jälkeen.
- Lokakuun riviä ei ole (ei mitään statusta), eikä myöhempää Ended-riviä.

**Koodista todettu:** `mr_backfill_missing_ended_rows.js` (item Q, kertaluonteinen 04.09.) loi Ended-rivit raportointipäivälle 01.09.
Ne pidettiin **tarkoituksella pois asiakasaineistosta ajojärjestyksellä** (otsakekommentti: *"Do not run mr_monthly_reporting_csv.js for
reporting date 2026-09-01 after this script has run"*). Skriptin kohdejoukko oli pyörät, joita ei ollut koskaan raportoitu.
Näillä 20:llä oli kuitenkin jo syyskuun Active-rivi, ja ne tulivat mukaan vartijoiden (`hasAnyEndedRiEver`) läpi.

**Seuraus (päätelty):**
1. Syyskuun palkka-CSV:ssä pyörä oli Active, joten syyskuun vähennys tehtiin. CSV:n sisältöä ei ole todennettu täältä:
   jos työnantaja oli D8-pidätyksessä, rivi ei lähtenyt.
2. Ended-rivi on syyskuussa ja raportoitu ajallaan, joten vaihe 1c ei liputa sitä. Se ei myöskään koskaan mennyt asiakkaalle.
3. Olemassa oleva Ended-rivi estää `ri_creation`ia luomasta uutta riviä (`loadBikesWithAnyEndedRi`), joten **mikään automaatio ei
   tuota oikaisupyyntöä 1.11. tai myöhemmin.**
4. Lokakuun CSV:ssä pyörää ei ollut, joten vähennykset loppuivat lokakuussa. Liikaa vähennetty on siis syyskuu (B024022:lla,
   B025101:llä ja B023575:llä päättyminen on 6–7/2026, mutta raportointi alkoi vasta 9/2026).

**Rahassa:** 20 × syyskuun vuokra = 1 606 € netto ≈ 2 016 € brutto (× 1,255).

**Ehdotus (tuoteomistaja päättää):** työnantajille ilmoitus käsin (pyörä, päättymispäivä, "tarkastakaa syyskuun vähennys"),
tai syyskuun Active-rivin muuttaminen niin, että seuraava ajo kantaa tiedon. Jälkimmäinen vaatii monthly-reporting-istunnon,
koska status Deleted ei kanna viestiä (D12). Pelkkä Active → Deleted -muutos ei korjaa mitään asiakkaan päässä.

## Luokka D

B010316 (CR 6684) ja B025982 (CR 6266): CR:n virallinen päättymispäivä on 30.09.2026, ja lokakuun Ended-rivin `lease_end` on 30.09.
Rekisterin `subsc_end_date` on kuitenkin **31.08.2026**. Jos CR on oikein, syyskuun Active-rivi on oikein, ja virhe on rekisterissä.
Selvitettävä, kumpi on oikein (vaikuttaa IC-päivään).

## Luokka E

- B023198, B024587 ja B024908: ProMet, T1d (varasuunnitelma ennen 1.11.).
- B046667: T34 (jälkiveloitus-CR 6973 lokakuulle, rekisterin päättymispäivä 30.09.).
- **B020053:** status 2 ja tapa 5, joka on status 3:n oletus. `subsc_end_date` on 31.08.2026, ja syys- ja lokakuun Active-rivit puuttuvat Ended-riviltä.
  Tyypin 11 CR 7028 (*notion 794*) on Pending. Odotus: 1.11. `ri_creation` luo myöhästyneen Ended-rivin (`ended_created_late`), ja
  1c liputtaa sen. Todennettava 1.11. Status ja tapa ovat ristiriidassa: palautus vai lunastus?

## Tarkistus 1.11. (lisätään T28:n todennukseen)

```sql
-- Luokan C marraskuun Ended-rivien pitää saada lippu 1.11. ri_updatessa (odotus: 11/11 'LIPPU')
SELECT br.name, ri.id, CASE WHEN ri.custrecord_gbb_ri_gbb_notification LIKE '%Tarkastakaa%' THEN 'LIPPU' ELSE '-' END
FROM customrecord_gbb_monthly_reporting_item ri JOIN customrecord_sta_bike_register br ON br.id = ri.custrecord_gbb_ri_bike
WHERE ri.custrecord_gbb_ri_reporting_status = 4 AND ri.custrecord_gbb_ri_reporting_date = TO_DATE('2026-11-01','YYYY-MM-DD')
  AND br.name IN ('B003182','B007696','B024380','B027918','B029495','B030544','B033466','B036379','B040768','B043365','B044884')
```

Luokittelukysely (koko joukko) on sama kuin tämän löydöksen taulukossa: Active-rivi > `LAST_DAY(subsc_end_date)`, ja luokka sen mukaan,
onko pyörällä samassa kuussa Ended-rivi, myöhempi liputettu Ended-rivi, marraskuun Ended-rivi vai ei mitään.

## Todennettu vs. päätelty

- **Todennettu NetSuitesta 22.10.:** joukko ja luokat, A-luokan rivihistoria (luontipäivät, ei lokakuun riviä), B-luokan liput, D-luokan päivät.
- **Todennettu koodista:** vaiheen 1c ehto ja teksti, item Q -skriptin tarkoitus ja ajojärjestyssääntö.
- **Päätelty:** että A-luokan syyskuun Active-rivit todella lähtivät syyskuun CSV:ssä (D8-pidätystä ei tarkistettu), ja että C-luokka
  liputetaan 1.11.
