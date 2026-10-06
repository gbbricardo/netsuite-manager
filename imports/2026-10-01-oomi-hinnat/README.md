# OOMI-vuokrahintojen korjaus — osarivit ja RI-rivit (1.10.2026, ei ajettu)

Alihanke: [`projects/2026-10-oomi-vuokrahinnat/`](../../projects/2026-10-oomi-vuokrahinnat/README.md).
Luo: `cd projects/2026-10-oomi-vuokrahinnat && node tools/tee-osat-ja-ri.mjs`.

**Pitkät rivit korjattiin käsin 1.10.2026, ja ne on todennettu NetSuitesta samana päivänä.** Kaikki 50 ovat bruttona oikein
(tapen Taxable value tai käyttäjän vahvistama hinta, ks. projektin README § Vahvistetut hinnat). Luettu tila:
`projects/.../data/2026-10-01-ns-tila-kasinkorjauksen-jalkeen.csv`, vertailu: `data/2026-10-01-pitkat-tarkistus.csv`.
Pitkiin riveihin ei tarvita korjauksia. **Päätös 1.10.2026:** jos brutto on sentilleen sama, desimaalien määrää ei korjata.
Siksi B045487:n rivi 112416 jää arvoon 57,9677 (= 72,75, kuten vahvistettu 57,96813), samoin Frendsin rivit 112412 ja 112418.

Tiedostojen arvot lasketaan **NetSuitesta luetuista pitkien rivien hinnoista**, ei tapesta, paitsi vahvistetuilla hinnoilla
(`VAHVISTETTU_NETTO` skriptissä), kun brutto poikkeaa: B044817 ja B044889 80,64542 (käyttäjä 1.10.2026, V9). Kaikki 50 pyörää ovat mukana.

**Import type:** Custom Record · **Data Handling:** `UPDATE` · UTF-8 (BOM)

**Muotoilu tilin asetusten mukaan (1.10.2026):** sarake-erotin `;`, desimaalierotin `,` (esim. `80,64542`), päivämäärä
`DD.MM.YYYY` (`01.10.2026`), ei tuhaterotinta. Import Assistantissa: *CSV column delimiter* Semicolon, *decimal delimiter* Comma.

## Tiedostot

| Tiedosto | Tietue | Rivejä | `SUM(internal_id)` | Mappaa |
|---|---|---|---|---|
| `01-testirivi.csv` | `customrecord_sta_ca_agreement_row` | 1 (B045661, 113002) | 113 002 | `internal_id`, `price_month` → `custrecord_sta_ca_row_price_month` (valinnainen `price_year` → `custrecord_sta_ca_row_price`) |
| `03-osarivit.csv` | sama | 47 | 5 032 662 | sama |
| `04-ri-testirivi.csv` | `customrecord_gbb_monthly_reporting_item` | 1 (B045661, loka 151403) | 151 403 | `internal_id`, `lease_fee_vat0` → `custrecord_gbb_ri_lease_fee_vat0` |
| `05-ri-lease-fee.csv` | sama | 99 | 12 370 281 | sama |

Yhteensä osarivejä 48 (SUM 5 145 664; B044817:llä ja B045487:llä ei ole osariviä, koska sopimus päättyy kuun viimeisenä päivänä)
ja RI-rivejä 100 (SUM 12 521 684) = 50 pyörää × syys + loka. Muut sarakkeet ovat vain tarkistusta varten.

**Laskusäännöt**
- Osarivi = pitkän rivin `price_month` (NetSuite) × päättymispäivä / kuun päivät, 4 desimaalia. `price_year` = osarivi × 12.
  Mukana on B043909:n lokakuun rivi 106888 (13/31 × 80,01594 = 33,5551). Pitkä rivi 106886 päättyi 30.9.
- RI `lease_fee_vat0` = kuukauden laskutettava hinta: pitkän rivin `price_month`, paitsi päättymiskuussa osarivin hinta.
  Ainoa päättymiskuu tällä välillä on B043909, lokakuu (RI 149925 → 33,5551).
- Mukana myös Frendsin 4 pyörää (V5): niiden pitkät rivit on jo korjattu käsin.

**Raportoinnin erotus (verollinen, uusi − nyt):** syyskuu +58,76 €, lokakuu +58,06 €. Työnantajittain (syys + loka):
Lapin Hyvinvointialue 86,08 €, Oomi Oy 12,10 €, Frends 8,96 €, Junkkari 7,26 €, HiQ 2,42 €.

## Ajojärjestys (päätetty 1.10.2026)

**Syys- ja lokakuun palkka-CSV:t on jo lähetetty vanhoilla hinnoilla.** Siksi:

1. Aja `04-ri-testirivi.csv`, tarkista RI 151403 (80,64542), sitten `05-ri-lease-fee.csv`. Aja tarkistuskysely (alla): 0 riviä.
2. Käyttäjä ajaa **uudet syys- ja lokakuun palkka-CSV:t korjatuilla tiedoilla viidelle asiakkaalle**: Lapin Hyvinvointialue,
   Junkkari Oy, Oomi Oy, HiQ Oy ja Frends Technology Oy.
3. Osarivit (01, 03) voi ajaa milloin tahansa. Ne vaikuttavat vasta sopimuksen viimeiseen kuuhun, aikaisintaan B043909:n
   lokakuun laskuun (rivi 106888).

Syyskuun `Deleted`-rivejä (fee 0) ei kosketa. Kaikilla korjattavilla RI-riveillä `can_be_updated` = T. Jos `ri_update` lukee
hinnan uudelleen riviltä, se saa nyt saman arvon (pitkät rivit on korjattu), mutta tätä ei ole todennettu koodista. Siksi
tarkistuskysely ajetaan vielä juuri ennen palkka-CSV:iden muodostamista.

## Avoimet

1. **Osarivien muut kentät:** käsin korjatulla pitkällä rivillä `price_year` täyttyi (967,75). Aja `01-testirivi.csv` ja katso,
   päivittyvätkö `custrecord_sta_ca_row_price` ja kustannuskentät vai pitääkö `price_year` mapata mukaan.
2. **`custrecord_sta_curr_subs_rent`** on yhä vanha. Se ei kuulu näihin tiedostoihin, joten päätä erikseen, päivitetäänkö se.

## Tarkistus ajon jälkeen

```sql
-- odotus: 0 riviä. Generoi CASE-lista tiedostosta (internal_id -> lease_fee_vat0 / price_month).
SELECT ri.id, ri.custrecord_gbb_ri_lease_fee_vat0 FROM customrecord_gbb_monthly_reporting_item ri
WHERE ri.id IN (/* 04+05 internal_id */)
  AND ABS(ri.custrecord_gbb_ri_lease_fee_vat0 - CASE ri.id /* WHEN id THEN arvo ... */ END) > 0.000005
```
Sama osariveille (`customrecord_sta_ca_agreement_row`, `custrecord_sta_ca_row_price_month`).
