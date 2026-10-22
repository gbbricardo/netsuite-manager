# lease-fees-vaarat-liput — onko yksikään "Kaikki vuokrat maksettu" -lippu asetettu, vaikka kaudella on avoin vuokralasku

**Tarkoitus:** T60:n tarkistus *"ei yhtään väärää T:tä"*. Lease fees check (1432, ADR 0016/0018) kirjaa jokaisen live-ajon PAID-pyörälle
lokiin asiakkaan ja kauden (`asiakas=<id[,id]> kausi=<YYYY-MM>..<YYYY-MM>`). Tarkistus ajaa skriptin oman estävän laskun ehdon
kaikille asiakkaille kerralla ja vertaa tulosta lokin kausiin. Tarkistus tehdään paikallisesti, koska kausi on pyöräkohtainen.
**Käyttäjät:** pääsessio (T60, kuukausittainen jälkitarkistus).
**Parametrit:** ei. Lokin aikaväli valitaan kyselyssä 1.
**Todennettu:** 2026-10-22: 841 live-PAID-pyörää (ajot 12.–20.10.), 332 asiakasta, 3 821 avointa asiakas- ja kuukausiryhmää. **Osumia 0.**
**Sarakkeet:** kysely 2: `entity` → asiakkaan id, `kk` → vuokrakuukausi `YYYY-MM` (`custcol_sta_so_revrec_start`), `n` → laskuja, `esim` → yksi tranid.

```sql
-- 1. Live-PAID-rivit lokista (suuri tulos, tallentuu tiedostoon; DRY RUN -rivit ja NO_CUSTOMER suodatetaan paikallisesti)
SELECT type, TO_CHAR(date,'DD.MM.YYYY HH24:MI') d, title, SUBSTR(detail,1,500) detail FROM scriptnote
WHERE scripttype = 1432 AND date >= TO_DATE('2026-10-12','YYYY-MM-DD') AND type = 'AUDIT' AND title NOT LIKE 'B0%'

-- 2. Kaikki avoimet vuokralaskut asiakkaan ja vuokrakuukauden mukaan (sama ehto kuin skriptin estävä lasku). pageSize 1000, 4 sivua 22.10.
SELECT x.entity, x.kk, COUNT(*) n, MIN(x.tranid) esim FROM (
  SELECT DISTINCT t.entity, t.tranid, TO_CHAR(tl.custcol_sta_so_revrec_start,'YYYY-MM') kk
  FROM transaction t JOIN transactionline tl ON tl.transaction = t.id
  WHERE t.type = 'CustInvc' AND tl.item IN (30, 31, 33)
    AND tl.custcol_sta_so_revrec_start >= TO_DATE('2025-05-01','YYYY-MM-DD')
    AND t.custbody_sta_bike_id IS NULL AND t.custbody_sta_is_so_type IS NULL AND t.status <> 'B') x
GROUP BY x.entity, x.kk
```

Vertailu: jokaiselle `PAID <pyörä>` -riville ja jokaiselle sen asiakkaalle osuma, jos kyselyn 2 ryhmä (asiakas, kk) on kauden sisällä
(`alku ≤ kk ≤ loppu`). Odotus 0.

**Tarkistukset:** ryhmiä luettiin 3 821/3 821 (kaikki sivut). Kysely 1 palautti 8 764 riviä 8 853:sta (MCP jättää osan pois), joten live-PAID-joukko
voi olla vajaa. Puuttuvat rivit ovat todennäköisesti 21.10. ajon rivejä.
**Huomiot:**
- ⚠ **Sokea piste (22.10.):** tarkistus käyttää samaa `revrec_start`-sääntöä kuin skripti, joten se ei näe laskuja, joiden kausi on kirjattu väärin (T58: kausi 2025-05
  laskuilla, jotka on päivätty 2026). Aja lisäksi T58-kysely (`findings/2026-10-09-t58-oomi-toukokuu-tuloutuskausi.md`) ja vertaa sen avoimien laskujen asiakkaita PAID-pyöriin.
  22.10. tämä löysi 2 väärää T:tä (B038995, B045780).
- REST-integraatio (`tools/netsuite-auth.mjs`) ei pysty lukemaan `transactionline`-kyselyä (*Invalid or unsupported search*), mutta MCP pystyy.
  Siksi kysely 2 ajetaan MCP:llä.
- Tulos kertoo nykyhetken. Lippua ei palauteta F:ksi (ADR 0016 k10), joten myöhemmin luotu lasku kaudelle olisi uusi löydös, ei skriptin virhe.
- Samalla todennetaan portti (PAID-pyörät: status 2, `subsc_end_date` < ajopäivä) ja `NO_CUSTOMER`-pyörien lippu F, jotka ovat yksinkertaisia rekisterikyselyjä.
