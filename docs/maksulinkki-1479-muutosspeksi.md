# Maksulinkki (1479): muutosmäärittely julkaisuille A ja B

Luovutus omistavan repon `netstuite-send-end-redemption-payment-link` istunnolle. Päätökset: [ADR 0014](adr/0014-maksulinkin-korjaus-ja-yksinkertaistus.md)
(sekä [ADR 0012](adr/0012-loppulunastushinta-ja-kattavuus.md)). Taustat: [logiikkavirheet ja tavoitetila 5.10.](../findings/2026-10-05-maksulinkki-logiikkavirheet-ja-tavoitetila.md).
Rivinumerot ovat versiosta HEAD `210c82d` (K = luettu koodista 7.10.2026). Tuotannon tiedostoa ei ole verrattu repoon.

Tämä repo ei muuta sisar-repoa. Muutokset tehdään omistavan repon istunnossa sen omien sääntöjen mukaan.

---

## Julkaisu A — ennen 31.10.2026 (tavoite tuotannossa noin 24.10.)

### A1. Hintakirjasto `src/lib_gbb_redemption_price.js` (L1, L2)

Tavoitekaava (löydös 5.10. § 3.2):

```
huoltosumma > 0:  porras = pienin, jonka maxNet ≥ summa;  hyvitys = porras.maxNet − summa
huoltosumma ≤ 0:  hyvitys = −summa   (tyhjä = 0, ei kattoa)
linkki_netto = hinta − hyvitys;  linkki_brutto = round2(netto × 1,255)
netto ≤ 0 tai brutto < 0,65 € → noPaymentDue (tapa 3)
```

- `maintenanceRemainder` (`:126-190`): ankkuri `brackets.find(b => b.prolongMonths === months)` (`:170`) korvataan `impliedBySum`:lla (`:141`).
- *"pidennys 0 → hyvitys 0"* (`:163-165`) poistetaan.
- S10 (`:154-159`, *extension shorter than the spend*) ei ole enää virhe. Kirjasto palauttaa sen eheyshavaintona (esim. `integrity: ['S10']`), ja hinta lasketaan.
- S11 (`:142-147`, summa yli ylimmän portaan) pysyy virheenä → NOT_PRICED.
- Uusi eheyshavainto: hyvitys > yhden portaan leveys (vain negatiivisella summalla mahdollinen) → `integrity: ['HYVITYS_YLI_PORTAAN']`.
- `extensionMonths` jää parametriksi vain eheystarkistusta varten.
- Dokumentaatio `:21-34` (*"The anchor is the lease extension"*) päivitetään.

**Testit `test/run_tests.js`:** löydöksen § 3.2:n seitsemän esimerkkiä sekä:
- L1: pidennys 4 kk, huolto 100 → hyvitys 28,28 (ei 155,77)
- L2: pidennys 0, summa −50 → hyvitys 50
- S10: pidennys 0, summa 100 → hinnoitellaan, eheys S10
- T31:n ja T32:n pyörien hinnat (TASKS) toistuvat

### A2. Valinta `getInputData` (`:266-337`) (L3, ohitus 4)

Lisätään kolme `NOT EXISTS`-ehtoa. Ajetaan lisäksi kolme laskentakyselyä (tai yksi `CASE`-kysely), jotta `selection`-rivi voi kertoa rajatut lukumäärät:

```sql
-- S4: mikä tahansa loppulunastustilaus, tilasta riippumatta
AND NOT EXISTS (SELECT 1 FROM customrecord_payment_requests pr
                WHERE pr.custrecord_pl_product_name = 'Työsuhdepyörän loppulunastus'
                  AND (pr.custrecord_pl_ns_bike_id = br.id OR pr.custrecord_pl_notes = br.externalid))
-- S5: jälkiveloitus käynnissä
AND NOT EXISTS (SELECT 1 FROM customrecord_subscrption_change_request cr
                WHERE cr.custrecord_cr_bike_registry = br.id AND cr.custrecord_cr_type = 7
                  AND cr.custrecord_cr_status IN (1, 2)
                  AND LOWER(cr.altname) LIKE '%pidennys%' AND LOWER(cr.altname) NOT LIKE '%2a%')
-- Ohitus 4: keskenkauden lunastus (tyyppi 2) tai tyyppi 10, kaikki paitsi Cancelled
AND NOT EXISTS (SELECT 1 FROM customrecord_subscrption_change_request cr
                WHERE cr.custrecord_cr_bike_registry = br.id AND cr.custrecord_cr_type IN (2, 10)
                  AND (cr.custrecord_cr_status IS NULL OR cr.custrecord_cr_status <> 7))
```

Varoitus: SuiteQL:n `LIKE`:ssa `_` on jokerimerkki (CLAUDE.md). Yllä olevissa kuvioissa sitä ei ole. Todenna kyselyt NetSuitessa ennen koodiin vientiä.
Tuotenimen sarake `custrecord_pl_product_name` on lainattu löydöksen 5.10. hyväksymiskyselystä: todenna se `schemas/records/`:stä.

- `not_before`-ehto (`:296`) poistetaan.
- `test_bike_id`-haara (`:281-284`) saa ehdon `AND br.custrecord_sta_subsc_end_date >= TO_DATE(<tänään>)`.

### A3. Map-vaihe (`:389-514`)

- Tarkistusten järjestys säilyy (otsikkokommentti `:6-16` päivitetään).
- Tarkistus 7, *extension sources disagree* (`:477-483`), ei enää palauta NOT_PRICED-tilaa. Se lisää `eheys=S9` ja jatkaa hinnoitteluun.
- `settle()` (`:530-546`): ennen kirjoitusta kysytään S5-ehto pyörälle. Jos se osuu, kirjoitusta ei tehdä, ja status on `SKIP_EXTENSION_RUNNING` (`log.audit`).
  Lisätään `OUTCOMES`-listaan (`:93`).

### A4. Parametrit ja tilat

Poistetaan `readConfig`ista (`:133-149`), `configProblems`ista (`:157-181`) ja `DEPLOYMENT.md`:n parametritaulukosta:

| Parametri | Korvaus |
|---|---|
| `custscript_gbb_eredem_paylink_url` | vakio `paylink.BASE_URL_PROD`. `paylinkEnvironment()` (`:183`) poistetaan |
| `custscript_gbb_eredem_email_to` | ei korvausta. Vastaanottaja on aina loppukäyttäjä tai `NO_EMAIL_FALLBACK` |
| `custscript_gbb_eredem_not_before` | ei korvausta (ks. A2) |
| `custscript_gbb_eredem_item_title` | vakio `ITEM_TITLE = 'Työsuhdepyörän loppulunastus'` |
| `custscript_gbb_eredem_report_to`, `_email_author` | poistuvat digestin mukana |

Säilyvät: `dry_run`, `test_bike_id`, `days_before` (B:hen asti), `due_days` (B:hen asti), `vat_pct`, `paylink_key`, `brevo_key`, `brevo_tmpl`.
Parametrit poistetaan myös NetSuiten script-tietueelta julkaisun yhteydessä.

### A5. Digesti pois, loki ainoaksi raportiksi

- `digestBody` (`:731-`) ja `summarize`n (`:668-`) sähköpostilähetys poistetaan. `run complete` -lokirivi lukumäärineen säilyy.
- Jokainen `finish()` (`:396-411`) kirjoittaa detailiin kiinteän `avain=arvo`-listan aina samassa järjestyksessä. Tyhjä arvo = tyhjä, ei avaimen poistoa:

```
syy=<miksi tämä status>
hinta_netto=… huoltosumma=… porras=<id/maxNet tai tyhjä> hyvitys=…
linkki_netto=… linkki_brutto=… eraapaiva=YYYY-MM-DD
paylink_tilaus=<orderId/displayId> brevo_id=<messageId>
eheys=<S9,S10,HYVITYS_YLI_PORTAAN tai tyhjä>
```

- Otsikko säilyy: `<SCRIPT_NAME>: [DRY RUN ]<STATUS> <pyörä>`. Taso säilyy (`:406`): `ERROR`, `STAMP_FAILED` ja `EMAIL_FAILED` → `log.error`.
- Brevon `messageId` tallennetaan `sendEmail`-vastauksesta (`:643-`).
- `selection`-rivi (`:316-`) saa rajatut lukumäärät: `rajattu tilaus=<n> jalkiveloitus=<n> cr_2_10=<n>`.

### A6. Ennen A:n ensimmäistä tuotantoajoa (tämä repo)

- `link_sent = T` -kertatäyttö CSV:llä kaikille Active-pyörille, joilla on loppulunastustilaus (TASKS T37 K-b0).

### A — hyväksymiskriteerit

1. `node test/run_tests.js` menee läpi A1:n tapauksilla.
2. Kertatäyttö on tehty: yksikään Active-pyörä, jolla on loppulunastustilaus, ei jää ilman `link_sent`-leimaa.
3. Koko 30.11. kohortin dry run (`days_before` väliaikaisesti ≥ 30):
   - yhdelläkään `DRY_RUN`-pyörällä ei ole jälkiveloitus-CR:ää, loppulunastustilausta tai tyypin 2/10 CR:ää (muu kuin Cancelled)
   - jokainen hinta on tavoitekaavan mukainen (löydöksen [hintapoikkeamat](../findings/2026-10-03-maksulinkki-hintapoikkeamat.md) § *Menetelmä*)
   - tavat 3 ja 4 syntyvät vain S8:n ja S12:n ehdoilla
   - jokaisella lokirivillä on kaikki A5:n avaimet
4. Ensimmäisen live-ajon jälkeen tuplatilauskysely (löydös 5.10. § 6, k. 4) palauttaa 0 uutta riviä.
5. Ajossa ei lähde yhtään digestisähköpostia.

---

## Julkaisu B — A:n jälkeen

### B1. `months_before` korvaa `days_before`:n

- Uusi parametri `custscript_gbb_eredem_months_before` (kokonaisluku). `configProblems`: arvon on oltava **1 tai 2**, ja muu arvo tai tyhjä keskeyttää ajon ennen valintaa.
- `days_before` ja `DEFAULT_DAYS_BEFORE` (`:82`) poistetaan.
- `lib_gbb_helsinki_date.js` saa puhtaan funktion `sendDate(endIso, n)`: sama päivä n kk aiemmin, ja jos päivää ei ole, kuun viimeinen päivä.
- **Sääntö:** pyörä valitaan, kun `sendDate(subsc_end_date, N) ≤ tänään ≤ subsc_end_date`. Jos lähetyspäivä on jo mennyt, pyörä valitaan seuraavassa ajossa.
- **Ikkunaa ei voi laskea muodossa `tänään + N kk`.** 30.09. + 1 kk = 30.10., mutta 31.10. päättyvän pyörän lähetyspäivä on 30.09.
  SuiteQL:n `ADD_MONTHS` ei myöskään käy, koska se vie kuun viimeisen päivän kohdekuun viimeiseksi (30.11. − 1 → 31.10., päätös on 30.10.).
  Toteutus (`:274-284`): SuiteQL hakee väljällä ylärajalla (`subsc_end_date BETWEEN tänään AND tänään + N kk + 3 pv`), ja `getInputData`
  suodattaa rivit JS:ssä `sendDate`-säännöllä ennen map-vaihetta. Suodatettujen määrä kirjataan `selection`-riville.
- **Testitapaukset:** arvolla 1 31.10. → 30.09., 30.11. → 30.10. ja 31.3. → 28./29.2. Arvolla 2 30.4. → 28./29.2. ja 31.12. → 31.10.
- Piikki: arvon vaihto 1 → 2 voi poimia noin kaksi kohorttia kerralla (noin 1 600 pyörää). Map/Reduce-rakenne kestää sen. Todenna governance dry runilla arvolla 2.

### B2. Eräpäivä

- `dueDate = bike.end_date` (`:580`). `due_days` ja `DEFAULT_DUE_DAYS` (`:83`) poistetaan.
- Eräpäivä menee vain Paylinkiin, ei Brevo-parametreihin (`:582-588` ennallaan). Pohja 65 on kunnossa (tuoteomistaja 7.10.).

### B — hyväksymiskriteerit

1. Testit kattavat `sendDate`n B1:n testitapaukset sekä karkausvuoden ja tavallisen vuoden helmikuun.
2. Dry run arvolla 1 ja arvolla 2: valitut pyörät vastaavat ikkunaa, ja `eraapaiva` = `subsc_end_date` jokaisella rivillä.
3. Ensimmäisessä live-ajossa Paylink hyväksyy noin kahden kuukauden päässä olevan eräpäivän. Paylinkin dokumentaatio ei kerro ylärajaa (`docs/PAYLINK_API.md:75`).

---

## Ei kuulu tähän

- Raportointiskripti (ADR 0014 k. 18, TASKS T51).
- Vanhat SO:t (S6, T35, käsin).
- Hintakirjaston siirto jaettuun kirjastoon (ADR 0003).
- Avoimien tilausten peruminen tavoilla 2–4 (T45, käsin).
