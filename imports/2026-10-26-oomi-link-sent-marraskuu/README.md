# `link_sent` = T marraskuussa päättyville OOMI-pyörille, joilla on käsin tehty linkki — CSV-import 26.10.2026

Päätös 26.10.2026 (käyttäjä): NetSuite valmistellaan niin, että OOMI-pyörien loppulunastuslinkit voidaan lähettää maksulinkkiskriptillä 1479.
Tämä on ensimmäinen import. Se leimaa ne marraskuussa päättyvät OOMI-pyörät, jotka ovat jo saaneet käsin tehdyn Paylink-loppulunastustilauksen,
jotta 1479 ei lähetä niille toista linkkiä, kun OOMI-rajaus poistetaan.

Tämä kumoaa linkkileiman OOMI-rajauksen, jonka tuoteomistaja teki 7.10. ([`2026-10-07-link-sent-kertataytto`](../2026-10-07-link-sent-kertataytto/README.md)).
Rajauksen syy oli T38:n täydennyskysely (`link_sent = T` ja tapa 1 → `liab_settled_at` = `paid_at`). Se oli kertaluonteinen ajo, ja se on tehty
12.10. Tarkistettu koodista 26.10.: kaikki muut kentän lukijat rajaavat OOMI-pyörät pois, joten leima ei muuta niiden toimintaa. Lukijat ovat
extension 2.0 (`gbb_ext2_paatos.js:93`) sekä cf-gbb-toolsin poikkeamatarkistukset ML1, ML4 ja EX1 (`NOT_OOMI`).

> [!NOTE]
> **Ajettu 26.10.2026 (käyttäjä) ja todennettu SuiteQL:llä:** 220/220 pyörällä `link_sent` = T (`SUM(id)` 9 248 454). Kaikki ovat
> edelleen status 1. Tapa 1 on 76 pyörällä, ja 144:llä ei ole tapaa, eli tavat eivät muuttuneet.
> Leimatta jäi 7 marraskuun OOMI-pyörää, ja kaikki ovat status 1:
> - Keskenkauden lunastukset (Done-tilainen tyypin 2 CR, lokakuussa tapa kirjattu ja kirjaus siirretty päättymiskuuhun):
>   B038131, B041336, B043704, B044413 ja B044849 (tapa 1) sekä B040064 (tapa 5). 1479 ohittaa ne tavan ja CR:n perusteella.
> - **B046669:** ei tapaa, ei tilausta eikä leimaa. Hinta 132,22 €. `org_end` on 11.11. ja `subsc_end` 30.11. CR 4693 on *V484DS9K - Jälkiveloitus*
>   (tyyppi 7, Done, alkaa 1.6.). S5-ehto ei pysäytä pyörää, koska nimessä ei ole sanaa *pidennys* ja CR alkaa ennen `org_end`:ia.
>   Pyörä saa siis linkin, kun OOMI-rajaus poistetaan 1479:stä.

**Tietue:** `customrecord_sta_bike_register` · **Import type:** Custom Record · **Data Handling:** `UPDATE` · avain **Internal ID**.

## Tiedostot

| Tiedosto | Rivejä | Mitä tehdään |
|---|---|---|
| `01-testirivi.csv` | 1 (B037385) | `link_sent` = T |
| `02-loput.csv` | 219 | sama |

Tarkistussumma: **220 riviä, `SUM(internal_id)` = 9 248 454**.

UTF-8 ilman BOM:ia, erotin `;`, CRLF. Mappaa vain `internal_id` → **Internal ID** ja `link_sent` → `custrecord_gbb_eredem_link_sent`.
Sarakkeet `pyora_id`, `paattyy`, `status`, `tapa` ja `tilaus` ovat vain tarkistusta varten, joten **älä mappaa niitä**. Jos checkbox ei hyväksy
arvoa `T`, käytä arvoa `Yes`.

## Aineisto (NetSuitesta 26.10.2026)

Rajaus on sama kuin 1479:n S4-ehto (`gbb_mr_send_end_redemption_paylink.js:149-151`). Tuotteen on oltava täsmälleen *Työsuhdepyörän loppulunastus*,
ja tilaus yhdistetään pyörään joko kentällä `pl_ns_bike_id` tai kentällä `notes` = `externalid`.

```sql
SELECT br.id, br.name FROM customrecord_sta_bike_register br
WHERE br.isinactive = 'F' AND br.custrecord_sta_bike_order_type = 3
  AND br.custrecord_sta_subsc_end_date BETWEEN TO_DATE('2026-11-01','YYYY-MM-DD') AND TO_DATE('2026-11-30','YYYY-MM-DD')
  AND NVL(br.custrecord_gbb_eredem_link_sent,'F') = 'F'
  AND EXISTS (SELECT 1 FROM customrecord_payment_requests pr
              WHERE pr.custrecord_pl_product_name = 'Työsuhdepyörän loppulunastus'
                AND (pr.custrecord_pl_ns_bike_id = br.id OR pr.custrecord_pl_notes = br.externalid))
```

- Kaikki 220 pyörää ovat status 1 (Active), ja jokaisella on tasan yksi tilaus (Paylink-id:t 17832–19839, luotu 21.9.–2.10.).
- 76 pyörällä on jo tapa 1 (tilaus maksettu). Lopuilla 144:llä ei ole tapaa. Niistä 42:n tilaus on `completed`, vaikka tapaa ei ole
  (sarake `tilaus`). **Selvitetty 26.10.: tämä on määrittelyn mukaista.** Status-sync 2.0 kirjoittaa OOMI-pyörälle tavan vasta
  päättymiskuun alussa (sääntö 2a). Kaikilla 42:lla `paid_at` on kirjattu (6.–23.10.). Tarkistus on kuukausiajon tarkistuslistalla 1.11.

**Ei tässä importissa:**
- Marraskuun OOMI-pyörät, joilla ei ole tilausta: **7 pyörää**. Yhdellä ei ole tapaa, joten se saisi linkin 1479:ltä heti, kun OOMI-rajaus
  poistetaan. Viidellä on tapa 1 ja yhdellä tapa 5, joten 1479 ohittaa ne.
- Joulukuun OOMI-pyörät: 204 Active-pyörää, joilla ei ole loppulunastustilausta. Yhdellä on tilaus tuotteella *Työsuhdepyörän lunastus*,
  jota S4-ehto ei tunnista.
- Settle method, `end_red_so_created` ja status jäävät ennalleen.

## Esitarkistus (odotus 220 / 9 248 454)

Aja kysely `SELECT COUNT(*), SUM(br.id)` edellisen kyselyn ehdoilla. Jos tulos poikkeaa, joku on muuttanut pyöriä 26.10. jälkeen. Älä aja importtia
ennen kuin ero on selvitetty.

## Jälkitarkistus

```sql
-- odotus 220 / 9 248 454
SELECT COUNT(*), SUM(id) FROM customrecord_sta_bike_register
WHERE custrecord_gbb_eredem_link_sent = 'T' AND custrecord_sta_bike_order_type = 3
  AND custrecord_sta_subsc_end_date BETWEEN TO_DATE('2026-11-01','YYYY-MM-DD') AND TO_DATE('2026-11-30','YYYY-MM-DD')
```

Varmista lisäksi, ettei yhdenkään pyörän status tai tapa muuttunut. Tapa 1 pitää olla edelleen 76 pyörällä.
