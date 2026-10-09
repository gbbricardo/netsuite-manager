# T58: Oomin toukokuun 2026 laskujen tuloutuskausi (lista taloustiimille)

Päivä: 9.10.2026. Lähde: NetSuite SuiteQL (luettu, ei kirjoitettu). Lista: `2026-10-09-t58-oomi-toukokuu-tuloutuskausi.csv` (erotin `;`).

## Luvut (todennettu NetSuitesta 9.10.2026)

- **332 laskua**, 6 346 vuokrariviä (tuote 30/31/33), joilla `custcol_sta_so_revrec_start` = 1.5.2025 ja `revrec_end` = 31.5.2025, vaikka lasku on päivätty 2026.
  - 331 laskua päivätty 1.5.2026 (48) tai 7.5.2026 (283). Tämä vastaa T58:n lukua 331.
  - 1 lisälasku **INVGBF1043393** (Oomi Oy, päivätty 16.9.2026, memo "05-2026: Etelä-Karjalan hyvinvointialue", 75 350,05 EUR, maksettu). Se ei ollut T58:n alkuperäisessä luvussa. Samalla asiakkaalla on 1.5. lasku INVGBF1026370 (75 350,03 EUR, maksettu): tarkista, onko 16.9. lasku uudelleenlasku vai kaksoiskirjaus.
- **Avoimia 12** (T58:n odotus oli 13): 6 päivätty 1.5. ja 6 päivätty 7.5. Yksi on sittemmin maksettu tai odotus oli yläkanttiin. Muut 320 on maksettu.
- Pyörä-sarake on tyhjä: laskujen otsikon `custbody_sta_bike_id` on tyhjä kaikilla 332 laskulla (Oomin käsilaskuilla rivit eivät kanna pyörää).

Avoimet: INVGBF1026386, 1026390, 1026391, 1026402, 1026421, 1026533 (1.5.) sekä 1026382, 1026413, 1026486, 1026569, 1026603, 1026693 (7.5.).

## Taloustiimin tehtävä

Korjaa jokaisen listan laskun vuokririvien (tuote 30/31/33) tuloutuskausi **2025-05 -> 2026-05**: `custcol_sta_so_revrec_start` = 1.5.2026 ja `custcol_sta_so_revrec_end` = 31.5.2026 (muistion mukainen kausi). Tee avoimille ensin, koska ne ratkaisevat lease fees checkin tuloksen. Muuta vain kausi-kentät, ei summia.

Syy: lease fees check (ADR 0016) lukee vuokrakuukauden `revrec_start`:sta. Väärällä vuodella lasku jää asiakkaan kauden ulkopuolelle, eikä sille tehdä Oomi-poikkeusta. Korjaus ennen T59:n käyttöönottoa.

## Valmis kun

Tämä kysely palauttaa 0:

```sql
SELECT COUNT(DISTINCT t.id) FROM transaction t JOIN transactionline tl ON tl.transaction = t.id
WHERE t.type = 'CustInvc' AND t.trandate >= TO_DATE('2026-01-01','YYYY-MM-DD') AND tl.item IN (30,31,33)
  AND (TO_CHAR(tl.custcol_sta_so_revrec_start,'YYYY-MM') = '2025-05' OR TO_CHAR(tl.custcol_sta_so_revrec_end,'YYYY-MM') = '2025-05')
```

Nyt: 332 laskua. Huom: rajaus kattaa kaikki 2026-päivätyt laskut, ei vain Oomin.
