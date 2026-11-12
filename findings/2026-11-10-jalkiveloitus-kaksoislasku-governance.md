# Jälkiveloitus (tyyppi 7) kahdentaa laskun, kun CR-ajo katkeaa governance-rajaan

**Päivä:** 10.11.2026
**Omistava repo:** `netsuite-subscrption-cr-scripts` (korjaus tehdään siellä, ei tästä projektista)
**Tapaus:** pyörä B023108, CR 7779, laskut INVGBF1050845 ja INVGBF1050846
**Vakavuus:** korkea. Asiakkaalle syntyy toinen todellinen lasku, eikä kumpikaan vahti huomaa sitä.
**Liittyy:** [`2026-11-03-jalkiveloituksen-laskuvahti-ei-katso-asiakasta.md`](2026-11-03-jalkiveloituksen-laskuvahti-ei-katso-asiakasta.md) (sama vahti, eri vika)

## Tiivistelmä

CR-ajo (skripti 1199) päättyi 5.11. virheeseen `Script Execution Usage Limit Exceeded` juuri sen jälkeen,
kun `handler_jalki` oli tallentanut laskun CR:lle 7779. CR ei ehtinyt Processed-tilaan ja jäi todennäköisesti
Pendingiksi. Seuraava ajo otti sen uudelleen ja loi toisen, identtisen laskun.

## Todennettu NetSuitessa

| Fakta | Lähde |
|---|---|
| Ensimmäinen 1199-ajo käsitteli 123 CR:ää (7657–7779). CR 7779 oli 123. ja viimeinen. | `scriptnote` (1199) |
| `ERROR: CR 7779 failed: Script Execution Usage Limit Exceeded`, 4 s laskun tallennuksen jälkeen | `scriptnote` |
| Seuraava ajo aloitti CR 7779:stä (43 CR:ää, 7779–7821) ja kirjasi `CR 7779 → Processed` | `scriptnote` |
| Kaksi identtistä Open-laskua (item 30 −80,65, item 31 −11,95, item 6 −23,61, brutto 116,21 €) | `transaction`, `transactionline` |
| CR 7779:n `automation_logs` mainitsee vain INVGBF1050846:n | `customrecord_subscrption_change_request` |
| Naapuri CR 7778:lla on yksi lasku | `transaction` |

## Pääteltyä koodista (ei todennettu NetSuitessa)

- CR pysyi Pendingissä katkon jälkeen. CR:n tilahistoriaa ei voi lukea, mutta toisen ajon alku täsmälleen
  CR:stä 7779 sopii tähän ilman käsin tehtyä nollausta.
- `catch`-haarakin kaatui todennäköisesti samaan rajaan, joten Error-tilaa ei kirjattu.

## Vikaketju koodissa

1. `handler_jalki.js:149` `inv.save()` luo laskun. Rekisterin päivitys (154–160), vahti (165) ja CR:n loki (171–175)
   tulevat vasta sen jälkeen. Dispatcher merkitsee Processed-tilan vielä myöhemmin (`cr_dispatcher.js:96`).
   Rollbackia ei ole, joten katkenneesta ajosta jää lasku ilman CR-merkintää.
2. `cr_scheduler.js` hakee `status = Pending AND closed_date IS NULL` eikä tarkista governancea lainkaan. Ajo
   kuluttaa rajan loppuun asti ja kaatuu keskellä CR:ää.
3. Kaksoislaskun vahdit eivät näe tyypin 7 laskuja. `assertNotAlreadyBilled` (`handler_jalki.js:74`) ja
   `cr_invoice_guard.checkNoDoubleBilling` lukevat vain sopimusrivin `custrecord_sta_ca_row_invoicehistory`-kenttää.
   Laskutusmoottori 701 kirjoittaa sen, `handler_jalki` ei. Ensimmäinen lasku ei jätä jälkeä, jonka vahti löytäisi.
4. Dispatcher tyhjentää `automation_logs`-kentän ennen jokaista yritystä (`cr_dispatcher.js:40-46`). CR:n lokiin
   kirjattu merkintä ei siis kelpaa idempotenssimerkiksi.

## Laajuus

- Ensimmäisen 164 CR:n erän pyöritys ylitti yhden ajon rajan. Se tapahtuu uudelleen aina, kun erä on yli ~120 CR:ää.
- Seuraava iso erä on 10.12.: marraskuussa päättyvät pyörät saavat uuden jälkiveloituserän.
- **Tutkimatta:** samanpäiväiset tuplat pyörillä B018026 (11.9.), B026535 (10.8.) ja B039531 (31.8.). Syy voi olla sama tai eri.
- **Epäluotettava mittari:** `scriptnote`-suodatus `LIKE '%Usage Limit%'` ja `type = 'ERROR'` palauttaa tyhjää, vaikka rivi on olemassa.
  Toistuvuutta ei siksi voitu laskea lokista.

## Korjausehdotus, joka voidaan tehdä tänään (päivitetty 10.11. käyttäjän ehdotuksella)

Kaksi pientä muutosta cr-scripts-repoon. Ne eivät muuta liiketoimintasääntöjä.
**Päätetty suunta:** CR:n tila `3 In Progress` otetaan käyttöön (A), ja scheduler saa governance-lattian (B).
Memo-merkki (alla) on valinnainen lisäsuoja eikä kuulu tämän päivän muutokseen.
CR-tilat: -1 New, 1 Pending, 2 Done, 3 In Progress, 5 Error, 6 Needs Review, 7 Cancelled.

### A. CR varataan tilaan In Progress ennen handleria (`cr_dispatcher.js`) — tärkein

Scheduler hakee vain tilan 1 (`cr_scheduler.js:33`), joten tilaan 3 jäänyt CR ei tule uudelleen käsittelyyn.
Jos ajo katkeaa governance-rajaan kesken CR:n, CR jää tilaan 3 eikä lasku kahdennu. 5.11. CR 7779 olisi jäänyt tähän tilaan.

```js
var CR_STATUS_IN_PROGRESS = 3;
...
// Claim the CR before the handler runs: a run cut off by the governance limit leaves it
// In Progress, which the scheduler (Pending only) never picks up again.
record.submitFields({
    type: 'customrecord_subscrption_change_request',
    id: crId,
    values: {
        custrecord_cr_status:          CR_STATUS_IN_PROGRESS,
        custrecord_cr_automation_logs: ''
    }
});
```

Tämä korvaa ehdollisen `automation_logs`-tyhjennyksen (`cr_dispatcher.js:40-46`), joten kirjoituksia ei tule lisää.
Catch-haara ja onnistunut polku kirjoittavat uuden tilan (Error, Processed, Needs Review) ennallaan.

**Hinta:** katkennut CR ei korjaudu itse. Se jää tilaan 3 ja vaatii ihmisen tarkistuksen, koska lasku voi olla tehty ilman
rekisterin päivitystä. Tämä on tarkoituksella parempi kuin toinen lasku asiakkaalle. Tarvitaan kysely, joka listaa tilassa 3
yli tunnin olleet CR:t (kuukausitarkistuslistalle), muuten jumiutunut CR jää huomaamatta.

**Todentamatta, tarkistetaan sisarrepoista ennen koodimuutosta:**
- laukaiseeko jokin UE-skripti tai työnkulku tilan vaihdon arvoon 3
- kulkeeko jokin CR-polku dispatcherin ohi (handlerit kirjoittavat `custrecord_cr_status` itse: `handler_jalki.js:425-447`, `handler_hyvitys.js:388-410`, `handler_lunastus.js:536-558` ym.)
- lukeeko jokin muu skripti tai tallennettu haku CR-tilaa niin, että 3 muuttaa tulosta (maksulinkki lukee vain tilat 1 ja 2, `gbb_mr_send_end_redemption_paylink.js:159`)

### B. Governance-lattia schedulerissa (`cr_scheduler.js`)

Katso alla. Lattia vähentää jumiutuneita CR:iä, koska ajo pysähtyy ennen rajaa. In Progress ei estä katkoja, vain katkon aiheuttaman tuplan.

### Valinnainen: idempotenssimerkki laskuun (`handler_jalki.js`)

Tee vasta, jos jumiutuneita CR:iä tulee usein. Merkki antaisi tavan tarkistaa turvallisesti, onko jumiutuneella CR:llä jo lasku.

Aseta laskulle ennen `inv.save()`:a muistiinpano `CR <crId>` (standardikenttä `memo`) ja tarkista heti ennen
tallennusta, onko sellaista laskua jo olemassa:

```js
var crTag = 'CR ' + crId;
var existing = query.runSuiteQL({
    query:  "SELECT id FROM transaction WHERE type = 'CustInvc' AND memo = ?",
    params: [crTag]
}).asMappedResults();
var invId;
if (existing.length > 0) {
    // Lasku on jo luotu aiemmassa katkenneessa ajossa: älä luo toista, tee vain jälkityöt.
    invId = existing[0].id;
} else {
    inv.setValue({ fieldId: 'memo', value: crTag });
    invId = inv.save({ enableSourcing: true, ignoreMandatoryFields: false });
}
```

Loput (rekisterin päivitys, loki) ajetaan molemmissa haaroissa, joten katkennut CR viimeistelee itsensä oikein
ilman uutta laskua. Tarvitaan `N/query` -riippuvuus. Tarkista ennen ajoa, että `memo` ei ole jo käytössä
laskulomakkeella (ei todennettu) ja että `type = 'CustInvc'` -suodatin toimii samoin kuin muissa kyselyissä.

Rajoitus: vanhoilla laskuilla ei ole merkkiä, joten suoja koskee vain uusia laskuja. Se riittää 10.12. eräälle.

### B (koodi). Governance-lattia schedulerissa (`cr_scheduler.js`)

Tarkista jäljellä oleva käyttö jokaisen CR:n välissä ja lopeta siististi:

```js
var MIN_USAGE = 1000;
...
if (runtime.getCurrentScript().getRemainingUsage() < MIN_USAGE) {
    log.audit('cr_scheduler', 'Stopping early, remaining usage low. Pending CRs continue on next run.');
    break;
}
```

Käytä samaa mallia kuin `cr_snapshot_backfill.js:169`. Kynnys on arvio: ensimmäinen ajo käsitteli 122 CR:ää
noin 10 000 yksiköllä, eli yksi CR kuluttaa noin 80 yksikköä. Mittaa kulutus
`getRemainingUsage()`-erotuksella ja säädä kynnys sen mukaan.

## Testaus ennen käyttöönottoa

1. Yksikkötesti (`handler_jalki`): kaksi peräkkäistä `process(crId)`-kutsua samalle CR:lle luo yhden laskun.
2. Sandbox: aja CR kahdesti ja varmista, että toinen ajo löytää `memo = 'CR <id>'` -laskun eikä luo uutta.
3. Mittaus tuotannossa seuraavan ajon jälkeen:

```sql
SELECT custbody_sta_bike_id, entity, trandate, COUNT(*)
FROM transaction
WHERE type = 'CustInvc' AND trandate >= TO_DATE('2026-11-10','YYYY-MM-DD') AND memo LIKE 'CR %'
GROUP BY custbody_sta_bike_id, entity, trandate
HAVING COUNT(*) > 1
```

Tulos on tyhjä, kun korjaus toimii.

## Muut toimet (ei koodia)

- **B023108:** toinen laskuista hyvitetään. CR:n loki mainitsee INVGBF1050846:n, joten hyvitettävä on
  INVGBF1050845. Molemmat ovat Open ja maksamattomia. Päätös ja toteutus kuuluvat taloustiimille.
- **10.12.:** älä käynnistä marraskuun jälkiveloituserää ennen kuin korjaukset 1 ja 2 ovat tuotannossa.
- **Tutki** B018026, B026535 ja B039531 samanpäiväiset tuplat.
