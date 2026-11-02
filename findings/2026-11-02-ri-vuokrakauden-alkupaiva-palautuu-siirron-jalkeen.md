# RI-rivin vuokrakauden alkupäivä palautuu alkuperäiseen työnantajasiirron jälkeen

- **Päivä:** 2026-11-02
- **Lähtökohta:** käyttäjän havainto pyörästä **B034594** — ensimmäinen RI-rivi sai oikean alkamispäivän, seuraavat alkuperäisen, ja se hämmentää asiakkaita
- **Omistava repo:** `netsuite-monthly-reporting` (luku), `netsuite-subscrption-cr-scripts` (kirjoitus)
- **Päätös:** [ADR 0025](../docs/adr/0025-ri-vuokrakauden-alkupaiva.md) · **Työohje:** [`docs/ri-vuokrakauden-alkupaiva-tyoohje.md`](../docs/ri-vuokrakauden-alkupaiva-tyoohje.md) · **Tehtävät:** T95–T97

## Tiivistelmä

Palkka-CSV:n sarake 8 **"Vuokrakausi alkanut"** näyttää alkuperäisen vuokrasopimuksen alkupäivän myös silloin,
kun pyörä on siirtynyt työnantajalta toiselle. Oikea päivä kirjoitetaan **vain siirtokuukauden riville**;
jokainen seuraava kuukausi rakennetaan uudestaan pyörärekisteristä ja palaa alkuperäiseen päivään.

27.08.2026 tehtiin käsin massakorjaus 497 syyskuun riville. **Kaikki 497 katosivat lokakuun ajossa.**

## Todennettu NetSuitessa (2.11.2026)

### B034594

Muutospyyntöjä on tasan yksi:

| Kenttä | Arvo |
|---|---|
| id / nimi | 5514 / `CR-5514` |
| `altname` | `M11307992118 - 2A - vanha` |
| tyyppi / tila | 1 *Siirto TA* / 2 **Done** |
| `custrecord_cr_created_date` | 27.08.2026 |
| `custrecord_cr_contract_official_end_date` | **tyhjä** |
| `custrecord_cr_start_date`, `custrecord_cr_official_start_date` | **tyhjät** |
| omistaja | Taru Vikman |
| `custrecord_cr_notes` | *"Luotu CR statukseen 'Done', jotta raportointi hahmottaa, että kyseessä siirto (joka tapahtunut ennen Netsuiten CR aikaa)."* |

Pyörärekisteri: `custrecord_sta_subsc_start_date` = **01.09.2023**, työnantaja Rimic Oy (3676), kausi päättyi 31.10.2026.
Tietue on luotu NetSuiteen vasta **29.09.2025** (`custrecord_sta_former_hubspot_bikeid` = P7851426224), joten
1.2.2024 tapahtuneesta siirrosta ei ole tilissä mitään jälkeä. Sopimusrivit eivät kerro sitä myöskään: A002991:n
molemmat rivit (11729 hallintamaksu, 46434 vuokra) alkavat **01.12.2025**.

RI-rivit:

| Kausi | id | `lease_start_date` | Tila | Huom |
|---|---|---|---|---|
| 2026-08 | 28518 | 01.09.2023 | Deleted | |
| 2026-09 | 92216 | 01.09.2023 | Deleted | CR 5514:n luoma |
| **2026-09** | **77705** | **01.02.2024** | **Active** | luotu 18.08., muutettu **27.08.2026** |
| 2026-10 | 142220 | 01.09.2023 | Active | |
| 2026-11 | 178676 | 01.09.2023 | Active | |

### Laajuus

27.08.2026 tehtiin yksi massaoperaatio: **482 takautuvaa CR:ää** (kaikki tyyppiä 1 *Siirto TA*, 477 pyörää,
sama `custrecord_cr_notes`), ja samana päivänä korjattiin **497 syyskuun RI-rivin** alkupäivä.
Kaikkien 497 rivin `lastmodified` on 27.08.2026.

| Raportointikuukausi | Active-rivejä | `lease_start_date` ≠ rekisterin arvo |
|---|---|---|
| 01.09.2026 | 34 215 | **497** |
| 01.10.2026 | 33 052 | **0** |
| 01.11.2026 | 32 011 | **0** |

497:stä **471** on pyörällä, jolla on takautuva CR, ja **496**:ssa korjattu päivä on rekisterin päivää myöhäisempi.
Yksi poikkeaa: **B011413** (Wallac Oy), RI 01.04.2025 vs. rekisteri 01.05.2025 — *aikaisempi*. Käyttäjän selvitys
2.11.2026: työnantaja on vaihdettu takautuvasti ennen vuokrasopimuksen alkua, eli työntekijä on todennäköisesti
vaihtanut työpaikkaa tilauksen aikana. Tämä on täydennysaineiston validointisääntö, ks. ADR 0025 k. 5.

Perusjoukko tulevaisuutta varten: **554 pyörää** on läpikäynyt Done-tilaisen tyypin 1 CR:n (508 niistä on yhä
status 1 *Active*), ja **259 pyörää** tyypin 9 *Siirto konserni* CR:n.

## Mekanismi (koodista)

1. **Kuukausittainen rakennus lukee rekisteriä.** `mr_monthly_reporting_ri_creation.js:78,1082` ja
   `mr_monthly_reporting_ri_update.js:98,324` ottavat RI-rivin alkupäivän suoraan kentästä
   `custrecord_sta_subsc_start_date`. Rivi rakennetaan joka kuukausi uudestaan, joten käsin tehty korjaus
   ei säily yli yhden ajon.
2. **Siirto ei päivitä sitä kenttää.** Koko `netsuite-subscrption-cr-scripts`-reposta vain
   `handler_siirto_pt.js:62` kirjoittaa `custrecord_sta_subsc_start_date`. Tyypin 1 *Siirto TA* -käsittelijä ei.
   Rekisterissä on siis vain yksi alkupäivä, ja se on alkuperäisen sopimuksen.
3. **Poikkeus on tasan yksi rivi.** `ue_reporting_item_transfers.js:873` (tyyppi 1) ja `:940` (tyyppi 6)
   asettavat luomalleen RI-riville `lease_start_date = custrecord_cr_contract_official_end_date + 1`,
   eli siirtopäivän. Tämä on ainoa kohta, joka tietää siirtopäivän — ja se koskee vain siirtokuukautta.
   Tästä syntyy havaittu kuvio. B034594:llä ei toiminut tämäkään, koska CR:n `official_end_date` on tyhjä.
4. **Näkyvyys asiakkaalle:** `mr_monthly_reporting_csv.js:34,84` vie kentän palkka-CSV:n sarakkeeseen 8
   *"Vuokrakausi alkanut"* (`docs/rules/TULOSTUSSAANNOT.md:265`).

## Miksi rekisterin kenttää ei voi ylikirjoittaa

`custrecord_sta_subsc_start_date` on myös **IC-lunastushinnan poistoankkuri**:
`netsuite-ic-calculators/src/gbb_ic_redemption_price_mr.js:143` (`originalSubscStartDate`, hankintakuukauden
sijoitus poistoaikatauluun) ja `src/lib/gbb_ic_redemption_calculator.js:165,196`. Kentän muuttaminen siirrossa
korruptoisi lunastushinnat. Alkuperäisen sopimuksen alkupäivän on säilyttävä omana tietonaan.

## Seuraus

Loka- ja marraskuun palkka-CSV:t lähtivät alkuperäisillä alkupäivillä. Korjausta ei tehty uudestaan kummassakaan
kuussa — se on käsityötä, joka on tehtävä joka kuukausi ri_creationin jälkeen ja CSV:n ennen, ja se unohtui.
Käyttäjän päätös 2.11.2026: **väliaikaista kuukausittaista korjausta ei tehdä**, vaan odotetaan varsinaista korjausta.

## Täydennysaineiston lähde

Syyskuun 497 riviä ovat ainoa kopio oikeista päivistä. Ne eivät ole purge-riskissä
(`mr_purge_deleted_reporting_items.js:403` poistaa vain tilan 6 *Deleted* rivejä), mutta aineisto on
rakennettava uudelleen vasta kun kenttä on olemassa, ja validoitava ADR 0025 k. 5:n mukaan:

```sql
SELECT br.name AS pyora, br.id AS pyora_id,
       TO_CHAR(ri.custrecord_gbb_ri_lease_start_date,'DD.MM.YYYY') AS uusi_alku,
       TO_CHAR(br.custrecord_sta_subsc_start_date,'DD.MM.YYYY')    AS rek_alku,
       BUILTIN.DF(ri.custrecord_gbb_ri_employer) AS tyonantaja
FROM customrecord_gbb_monthly_reporting_item ri
JOIN customrecord_sta_bike_register br ON br.id = ri.custrecord_gbb_ri_bike
WHERE ri.custrecord_gbb_ri_reporting_date = TO_DATE('2026-09-01','YYYY-MM-DD')
  AND ri.custrecord_gbb_ri_reporting_status = 1
  AND ri.custrecord_gbb_ri_lease_start_date <> br.custrecord_sta_subsc_start_date
ORDER BY br.name
```
