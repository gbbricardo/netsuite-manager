# T99 — Serres-siirtopaketin joulukuun RI/New-rivien hintakorjaus (4.11.2026)

Tausta: [`TASKS.md`](../../TASKS.md) T99, T94 (Serres-siirtopaketti 3.11.2026).

3.11.2026 ajetun Serres-siirtopaketin (CR:t 7646, 7649, 7652) yhteydessä `ue_reporting_item_transfers.js` loi
joulukuulle (01.12.2026) uudet raportointiparit. Ended-puoli (Paree) muodostui oikein, mutta kolmen pyörän
Active/New-puoli (Serres) sai vuokrahinnakseen (`custrecord_gbb_ri_lease_fee_vat0`) sopimuksen lopussa olevan
osan/tynkärivin hinnan oikean kuukausivuokran (~80 €) sijaan:

- **B041290** (RI 188803): 10,6242 € (oikea 79,6813 €)
- **B041292** (RI 188799): 51,0754 € (oikea 80,6454 €)
- **B042213** (RI 188801): 8,0645 € (oikea 80,6454 €)

## Juurisyy

1. **Sopimusrivien alkupäivä:** Joulukuu oli ehditty laskuttaa Pareelta 1.11.2026 laskutusajossa. Siksi Serresin
   uudet sopimusrivit luotiin alkamaan vasta seuraavalta laskuttamattomalta kaudelta eli **01.01.2027**.
   Kun raportointirivi syntyi päivälle **01.12.2026**, Serresillä ei ollut kyseisenä päivänä voimassa olevaa riviä.
2. **Päivämääräparsimisen bugi `findLeaseFee`-funktiossa (`ue_reporting_item_transfers.js:215-216`):**
   Funktio käytti `new Date(startDate)` ja `new Date(endDate)` suoraan NetSuiten hakutuloksen `DD.MM.YYYY`-merkkijonoon.
   Suomalaisessa päivämäärämuodossa `new Date("31.05.2028")` palauttaa JavaScriptissä `NaN` (Invalid Date).
   Koska päivämäärät olivat `NaN`, `ongoing`-suodatus ei löytänyt mitään, ja fallback-lajittelu
   `Math.abs(a.endMs - reportingMs) - Math.abs(b.endMs - reportingMs)` vertaili `NaN - NaN` = `NaN`, jolloin
   järjestys ei muuttunut. Funktio palautti NetSuiten hakutuloksen ensimmäisen rivin (`allLines[0]`).
3. **Tynkärivi hakutuloksen kärjessä:** Serresillä oli vanhempana sopimusrivinä luotu osakuukauden tynkärivi
   (esim. B041290: rivi 97540, 01.06.2028–30.06.2028, hinta 10,6242 €), jonka internal ID oli pienempi kuin uuden
   01.01.2027 alkavan rivin (116730). Hakutulos palautti sen ensimmäisenä, ja virheellinen hinta kirjattiin RI-riville.

## Miksi tämä korjataan CSV-importilla / suoralla päivityksellä

Vaikka `mr_monthly_reporting_ri_update.js`:n vaihe 1b päivittäisi hinnat 1.12.2026 ajossa (siellä päivämäärät
parsitaan oikein ja lähin päättymispäivä voittaa), arvojen jättäminen vääräksi tietokantaan aiheuttaa riskin,
jos marraskuun poikkeamatarkistukset tai vastaavat estävät rivien päivityksen. Korjaus varmistaa puhtaan tilan heti.

> [!NOTE]
> **Ajettu ja todennettu NetSuitesta 4.11.2026.** Kaikki 3 riviä päivitetty onnistuneesti oikeisiin kuukausihintoihin (188803: 79,6813 €, 188799: 80,6454 €, 188801: 80,6454 €). Jälkitarkistuskysely vahvistaa tilan.

**Tietue:** `customrecord_gbb_monthly_reporting_item` · **Import type:** Custom Record · **Data Handling:** `UPDATE`
· UTF-8 · sarake-erotin `;` · desimaalierotin `,`

## Tiedosto

| Tiedosto | Rivejä | `SUM(internal_id)` | Mitä kirjoitetaan |
|---|---|---|---|
| `01-ri-joulukuu-serres-hinnat.csv` | **3** | **566 403** | `custrecord_gbb_ri_lease_fee_vat0` oikeaan kuukausihintaan |

Mappaus Import Assistantissa:
- `internal_id` → **Internal ID**
- `custrecord_gbb_ri_lease_fee_vat0` → **Lease fee (vat 0)** (tai vastaava näyttönimi)

Jätä `ri_nimi`, `pyora` ja `hinta_nyt` mappaamatta.

## Esitarkistus (ennen korjausta)

```sql
SELECT id, name, custrecord_gbb_ri_bike AS bike, custrecord_gbb_ri_lease_fee_vat0 AS fee
FROM customrecord_gbb_monthly_reporting_item
WHERE id IN (188803, 188799, 188801)
```

Odotus:
- 188803: 10.6242
- 188799: 51.0754
- 188801: 8.0645

## Jälkitarkistus (korjauksen jälkeen)

```sql
SELECT id, name, custrecord_gbb_ri_bike AS bike, custrecord_gbb_ri_lease_fee_vat0 AS fee
FROM customrecord_gbb_monthly_reporting_item
WHERE id IN (188803, 188799, 188801)
```

Odotus:
- 188803: 79.6813
- 188799: 80.6454
- 188801: 80.6454
