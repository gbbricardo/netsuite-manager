# OOMI-pyörien lokakuun RI-riveillä `lease_fee_vat0` = 0 (30.09.2026)

**Omistava repo:** `netsuite-monthly-reporting` (RI-rivin luonti). **Tila:** rivit korjattu käsin
30.09.2026, syy selvittämättä. **Luokka:** bugikandidaatti, hiljainen virhe: rivi ei mene Warningiksi,
ja palkka-CSV:hen olisi mennyt 0 €:n vähennys.

## Havainto (todennettu NetSuitesta 30.09.)

| RI-rivi | Pyörä | Työnantaja | Status | fee ennen → jälkeen |
|---|---|---|---|---|
| 116352 | B046738 | Hilti (Suomi) Oy | Active | 0 → 79,6813 |
| 116353 | B046744 | Vaisala Oyj | Active | 0 → 79,6813 |
| 116354 | B046743 | Vaisala Oyj | Active | 0 → 79,6813 |
| 116355 | B046745 | Itä-Uudenmaan poliisilaitos | Active | 0 → 79,6813 |
| 116356 | B046829 | Konecranes Finland Oy | Active | 0 → 79,6813 |

- Rivit luotiin 18.09.2026 klo 14:32–14:34 (`created`), noin minuutin välein. Omistaja on Ricardo Oksa.
  `custrecord_gbb_ri_subscription_line`, `custrecord_gbb_ri_order_type` ja `custrecord_gbb_ri_automation_logs` ovat tyhjiä.
- Syyskuun rivien fee oli 79,681275. Pyörien sopimusriveillä hinta oli oikein (tuoteomistaja 30.09.).
  Item 30 -rivi alkaa näillä 1.11.2026, joten lokakuun kattavaa item 30 -riviä ei ole.
- Sama joukko on saman OOMI-aukon kuin E2 (B046737, B046742, B046832; rivit 117974–117976 tehty käsin
  29.09.). E2 kattoi kolme kahdeksasta.

## Päätelty, ei todennettu

- Tyhjä `automation_logs` ja käyttäjäomistaja viittaavat siihen, ettei riviä luonut normaali ri_creation-erä.
  Luoja voi olla täydennysajo, testiajo tai käsin tehty luonti syyskuussa.
- Jos luoja haki hinnan lokakuun kattavalta item 30 -riviltä (vrt. `findLeaseFee` tiedostossa
  `ue_reporting_item_transfers.js:194-230`), rivin puuttuminen antaa 0:n eikä Warningia. **Tämä on
  todennäköisin mekanismi, ja se toistuu**, kun OOMI-pyörän item 30 -rivi alkaa myöhemmin kuin raportointikuu.

## Selvitettävä

1. Mikä prosessi loi rivit 18.09. klo 14:32? Käy läpi `scriptnote` 18.09. klo 04:00–05:00 lokiaikaa
   (≈ 10 h Helsingin jäljessä) skripteille 1452, 1453 ja UE:ille sekä systemnote-luontimerkinnät.
2. Palauttaako kyseinen koodipolku 0:n eikä Warningia, kun sopimusriviä ei löydy? Jos palauttaa, se on
   korjattava omistavassa repossa: puuttuva hinta → Warning, ei 0.
3. Aja jokaisen kuukausiajon jälkeen tarkistus: Active-/Active/New-rivit, joiden `lease_fee_vat0` = 0 tai tyhjä.
