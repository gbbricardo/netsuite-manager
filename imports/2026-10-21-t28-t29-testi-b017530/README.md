# T28 + T29: kylvetty testi testipyörällä B017530 (21.10.2026)

Korvaa työohjeen `docs/monthly-reporting-korjaukset-t28-t29.md` § 3A:n. Koodi: `netsuite-monthly-reporting` `dev` `f4640a0`, File Cabinet 21.10. 13:41.
Testipyörä B017530 = rekisteri **17530**, työnantaja **1676** (Testi Yritys Oy), loppukäyttäjä **54033**. Se rajataan pois kaikista mittareista.

## Miksi § 3A ei toimi sellaisenaan (koodista todettu 21.10.)

1. **Kaksi Active-riviä samalla päivällä ei muunnu.** `convertActiveRowToEnded` (`ri_creation.js:742-756`) ei tee mitään, jos Active-rivejä on yli yksi
   (`⚠ ambiguous, not converting`). Siksi `can_be_updated` T ja F testataan peräkkäin, ei yhtä aikaa.
2. **B017530:llä on jo Ended-rivi 117469 (1.10.2026).** `processEndedBike` (`:852`) palauttaa `ended_already_reported` ennen muunnosta, joten muunnos ei käynnisty.
   `loadBikesWithAnyEndedRi` katsoo vain statusta 4. Siksi 117469 asetetaan testin ajaksi tilaan 6, ja se palautetaan lopuksi tilaan 4.
   ri-skriptit ovat `TESTING`-tilassa eivätkä aja itsestään, joten muut ajot eivät näe välitilaa.

Odotettu reitti ri_creationissa: tapa 8 → velvoitteet hoidettu, `subsc_end_date` 31.01.2025 < 1.11.2026, aiempia rivejä on (`hasAnyRiEver`) →
myöhästynyt päättyminen siirtyy raportointipäivälle 1.11.2026 → muunnos (bucket `ended_converted_late`).

## Testitekstit

Kaikilla kylvetyillä riveillä on tämä ilmoitusteksti (`custrecord_gbb_ri_gbb_notification`). Vain ensimmäinen lause vaihtelee:

```
<TESTILAUSE> Pyörän lunastus on myöhässä. Vuokralaskutus ja pyöräedun käsittely palkoissa jatkuu kunnes GoByBike vastaanottaa suorituksen. Vuokrakauden päättymispäivä on muuttunut: 31.10.2026 → 30.11.2026.
```

`<TESTILAUSE>` erottaa säilyvän tekstin poistettavista. Palkkatarkistuslausetta ei kylvetä, jotta T28:n lippu näkyy tuloksesta yksiselitteisesti.

## Ajoparametrit (molemmissa vaiheissa)

| Skripti | Parametri | Arvo |
|---|---|---|
| ri_creation (1452) | `custscript_gbb_ri_test_bike_id` | 17530 |
| ri_creation | `custscript_gbb_ri_reporting_date` | 1.11.2026 |
| ri_update (1453) | `custscript_gbb_update_test_bike_id` | 17530 |
| ri_update | `custscript_gbb_update_reporting_date` | 1.11.2026 |

Kirjaa parametrien vanhat arvot ennen muutosta. Palauta ne testin jälkeen. **Tyhjä testipyörä tarkoittaa koko kannan ajoa.**

## Vaihe 0 — valmistelu

- RI **117469**: status 4 → **6**.

## Vaihe 1 — `can_be_updated` F, T28 negatiivinen

Luo rivi **R1**:

| Kenttä | Arvo |
|---|---|
| name | `TESTI_T29_B017530_2026-11_F` |
| bike / employer / end user | 17530 / 1676 / 54033 |
| reporting date | 1.11.2026 |
| reporting status | 1 Active |
| can be updated | F |
| lease start / end | 1.10.2024 / **10.10.2026** |
| lease fee vat0 | 80.64541833 |
| notification | `TESTI-F: tämä lause säilyy.` + vakiolauseet |

Aja **ri_creation** ja sen jälkeen **ri_update**.

Odotus:
- R1: status 4, `can_be_updated` F, notification **= `TESTI-F: tämä lause säilyy.`**, lease end yhä **10.10.2026** (F → kenttiä ei päivitetä).
- R1 automation logs päättyy: `… Jälkiveloitus- ja huoltojatkoteksti poistettu, koska rivi on päättynyt.`
- `scriptnote` 1452: `Active row converted to Ended … prolongationTextsRemoved=true`, bucket `ended_converted_late`, `mapErrors=0`.
- **T28:** ri_update ei lisää palkkatarkistuslausetta, koska päättymiskuu 10/2026 + 1 = 11/2026 = raportointikuu. `scriptnote` 1453: `1c flagged=0`.

### Tulos vaihe 1 (21.10.2026, ajot klo 14:21 ja 14:25 Helsingin aikaa): **läpi**

R1 = RI **154181**. Loppukäyttäjä korjattiin ennen ajoa 12225 → 54033.
- ri_creation: `scanned=1 created=0 converted=1 mapErrors=0 | ended_converted_late=1`, `naturalReportingDate=2025-02-01`,
  `fieldsRefreshed=false | prolongationTextsRemoved=true`, `gbb_lunastus_lib=1.1.0`.
- 154181: status 4, `can_be_updated` F, notification **`TESTI-F: tämä lause säilyy.`**, lease end 10.10.2026 ennallaan. Lokin loppu:
  `… Rivin muita kenttiä ei päivitetty (can_be_updated = F). Jälkiveloitus- ja huoltojatkoteksti poistettu, koska rivi on päättynyt.`
- ri_update: `stage1c=1`, `1c flagged=0`, `c_not_flagged=1`, `mapErrors=0 reduceErrors=0`, `3a groups=1 deleted=0 warned=0`. Palkkatarkistuslausetta ei lisätty (T28 negatiivinen ✓).

## Vaihe 2 — `can_be_updated` T, T28 positiivinen, priority 0 -siirto

1. R1: status → **6**.
2. Luo **R2** kuten R1, mutta name `TESTI_T29_B017530_2026-11_T`, **can be updated T** ja notification `TESTI-T: tämä lause säilyy.` + vakiolauseet.
3. Aja **ri_creation**.
4. Luo **W** (Warning, ri_creationin jälkeen): name `TESTI_T29_B017530_2026-11_W`, sama pyörä, työnantaja, loppukäyttäjä ja päivä,
   **reporting status 5**, can be updated T, notification `TESTI-W: siirtyy Ended-riville.` + vakiolauseet.
5. Aja **ri_update**.

Odotus:
- ri_creationin jälkeen R2: status 4, `can_be_updated` F, notification **= `TESTI-T: tämä lause säilyy.`**. Kentät on päivitetty rekisteristä,
  joten lease end = **31.01.2025**. Lokissa on poistolause.
- ri_updaten jälkeen W: status 6. R2:n notificationissa on `TESTI-W: siirtyy Ended-riville.`, mutta **ei** C3- eikä C4-lausetta.
  R2:n lokissa on `[Ilmoitus siirretty poistetulta riviltä <W>]`. `scriptnote` 1453 sisältää rivin `deleted (superseded by Ended row …) … prolongationTextsStripped=true`.
- **T28:** R2 saa palkkatarkistuslauseen, koska päättymiskuu 1/2025 + 1 < 11/2026 (`1c flagged=1`).

### Tulos vaihe 2 (21.10.2026): **läpi**

R2 = **154182**, W = **154183**. R2 tehtiin kopioimalla, joten ilmoitusteksti ja loki korjattiin käsin ennen ajoa. W:n teksti lisättiin jälkikäteen.
- ri_creation (15:18): `converted=1 mapErrors=0`, `fieldsRefreshed=true | prolongationTextsRemoved=true`. R2 status 4, F, notification
  `TESTI-T: tämä lause säilyy.`, lease end 31.01.2025 (päivitetty rekisteristä), vuokra 80,64541833 → 80,64583333 (sopimusriviltä).
- **ri_update 1. ajo (15:27): priority 0 ei käynnistynyt testisuunnitelman virheen takia.** W:n loppupäivä 10.10.2026 ≠ R2:n 31.01.2025, joten
  `employerFieldCheck` ohitti 3a:n (`stage 3a SKIPPED … resolve manually`). Koodi toimi oikein. Ohjeessa W:n loppupäivän olisi pitänyt olla sama kuin R2:n
  päivitetty loppupäivä. T28 positiivinen todentui jo tässä ajossa (`stage1c | flagged … Ended retrospectively`, `c_flagged=1`).
- **ri_update 2. ajo (15:31)** W:n loppupäivä 31.01.2025 ja loki tyhjennetty:
  `deleted (superseded by Ended row) riId=154183 … supersededByEndedRi=154182 | prolongationTextsStripped=true`,
  `mapErrors=0 reduceErrors=0 | 3a deleted=1 warned=0 | employerCheck flagged=0`.
  - W: status 6.
  - R2 notification: `TESTI-T: tämä lause säilyy. Tarkastakaa työntekijän palkoista tehdyt vähennykset. TESTI-W: siirtyy Ended-riville.`.
    C3 ja C4 eivät siirtyneet. Palkkatarkistuslause ei monistunut, vaikka 1c liputti uudelleen.
  - R2 loki: `… [Ilmoitus siirretty poistetulta riviltä 154183]`. Ensimmäisen ajon `Tarkista Employer kenttä` jäi lokiin, mikä ei haittaa.

**Kaikki odotukset täyttyivät (T28 negatiivinen ja positiivinen, T29 muunnos F ja T sekä priority 0 -siirto).**

## Vaihe 3 — siivous (pakollinen)

- R1, R2 ja W → status 6 (W on jo 6).
- RI **117469**: status 6 → **4**. Tarkista, että se on taas status 4. Muuten seuraava kuukausiajo tekee B017530:lle rivejä uudelleen.
- Palauta kaikkien neljän parametrin vanhat arvot.

### Tulos vaihe 3 (21.10.2026): **tehty**

117469 on status 4 (15:33), ja 154181, 154182 ja 154183 ovat status 6. Parametrit palautti käyttäjä.

## Tarkistuskysely

```sql
SELECT ri.id, ri.name, ri.custrecord_gbb_ri_reporting_status st, ri.custrecord_gbb_ri_can_be_updated cbu,
       ri.custrecord_gbb_ri_lease_end_date led, ri.custrecord_gbb_ri_gbb_notification nt,
       SUBSTR(ri.custrecord_gbb_ri_automation_logs, -300) lg
FROM customrecord_gbb_monthly_reporting_item ri
WHERE ri.custrecord_gbb_ri_bike = 17530
  AND (ri.custrecord_gbb_ri_reporting_date = TO_DATE('2026-11-01','YYYY-MM-DD') OR ri.id = 117469)
ORDER BY ri.id
```

Kattamatta jää: konsernisiirron Active/New-rivi ja Paused-rivi T28:ssa. Niitä ei muutettu, joten niitä ei testata.
