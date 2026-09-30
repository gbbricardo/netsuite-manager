# Verovapaus F:ksi Siirto TA -pyörille — CSV-import 30.09.2026 (ennen 1.10. ri_creationia)

T25 ([TASKS.md](../../TASKS.md)), [löydös](../../findings/2026-09-30-verovapaus-siirroissa.md), sääntö
[`docs/verovapaus-saannot.md`](../../docs/verovapaus-saannot.md). Tuoteomistaja päätti 30.09., että rekisteri korjataan.

Nykyarvot on todennettu NetSuitesta 30.09. ennen CSV:n rakentamista. Kaikilla 30 rekisterillä ja 14 RI-rivillä on nyt T.

| Tiedosto | Tietue | Kenttä | Rivejä |
|---|---|---|---|
| `01-rekisteri-testirivi.csv` | `customrecord_sta_bike_register` | `custrecord_gbb_verovapaa` | 1 (B018493) |
| `02-rekisteri-loput.csv` | `customrecord_sta_bike_register` | `custrecord_gbb_verovapaa` | 29 |
| `03-ri-lokakuu.csv` | `customrecord_gbb_monthly_reporting_item` | `custrecord_gbb_ri_tax_exemption` | 14 |

> [!NOTE]
> **Ajettu 30.09.2026 ja todennettu:** rekisterissä 29/30 on F ja RI-riveillä 13/14 on F.
> **Poikkeus: B030311 (CR 6734) ja sen RI 117083 jätettiin T:ksi.** CR:n selityksen mukaan kyse on liikkeenluovutuksesta,
> joten verovapaus säilyy ([sääntö](../../docs/verovapaus-saannot.md)).

**Import type:** Custom Record · **Data Handling:** `UPDATE` · mappaa vain `internal_id` ja arvosarake
(`verovapaa` / `tax_exemption` = F). Muut sarakkeet ovat tarkistusta varten. Jos checkbox ei hyväksy arvoa
`F`, käytä arvoa `No`.

**Järjestys:** 01 → tarkista → 02 → 03. Kaikki ennen 1.10. ri_creationia, jotta uudet rivit periytyvät F:nä.

## Rajattu pois

- **B017961 (CR 6818).** `official_end` on 31.10., joten RI:n työnantaja vaihtuu vasta 1.11. Lokakuun rivi kuuluu vielä
  vanhalle työnantajalle Asennuskolmio Oy:lle, ja se pysyy T:nä. F asetetaan lokakuun lopussa, ennen marraskuun ajoa.
- **Syyskuun 31 T-riviä** ovat toimitettuja ja historiallisia. Niitä ei korjata tässä, ellei erikseen päätetä.

## Huomio

B008409, B029874 ja B028437: rekisterissä on vielä vanha työnantaja, koska laskutuksen `start_date` on 1.11. Lokakuun
RI-rivi on jo uudella työnantajalla (`official_end` + 1). Tämä on siirtosäännön mukaan oikein
([transfer-cr-dates-split](../../CLAUDE.md)). Rekisterin F koskee siksi jo nyt uuden työnantajan riviä.

## Tarkistus importin jälkeen

```sql
SELECT custrecord_gbb_verovapaa, COUNT(*) FROM customrecord_sta_bike_register
WHERE id IN (18493,29015,11511,12832,33042,35626,5265,20454,11367,38350,43354,7243,34927,32028,36758,
             13794,26475,33371,28198,33554,8409,29874,33972,16298,26973,30311,12385,28437,9498,10548)
GROUP BY custrecord_gbb_verovapaa;   -- odotus: F 30

SELECT custrecord_gbb_ri_tax_exemption, COUNT(*) FROM customrecord_gbb_monthly_reporting_item
WHERE id IN (93011,94018,102811,115634,115742,116264,116598,116864,117083,117265,117387,117582,118075,118077)
GROUP BY custrecord_gbb_ri_tax_exemption;   -- odotus: F 14
```
