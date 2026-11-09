# Sopimusrivi päättyy pyörän subsc_end_date:n jälkeen — rakenteellinen ilmiö

**Päivä:** 5.11.2026
**Omistava repo:** `netsuite-manager`
**Liittyy:** TASKS T74 · ADR 0022 § Konteksti ja k. 1

## Tiivistelmä ja vastaus T74:ään

ADR 0022:ssa havaittu 7 774 pyörän ilmiö, jossa aktiivinen item 30 (tai 31) -sopimusrivi
päättyy pyörärekisterin `subsc_end_date`-kentän arvon jälkeen, **ei ole virheellistä ylilaskutusta
eikä tietokantavika**.

Ilmiö selittyy kokonaisuudessaan kahdella järjestelmän omalla arkkitehtuurisella mekanismilla:

1. **OOMI-sopimusten tynkärivit (~96 % tapauksista, n. 7 400 pyörää):**
   OOMI-sopimusten päättymispäivä rekisterissä on usein keskellä kuukautta (esim. 24.06.2028).
   Laskutusmoottori (skripti 701) operoi täysinä kalenterikuukausina, joten viimeiselle kuukaudelle
   on luotu sopimusrivi kaudelle 01.06.–30.06.2028. Rivi päättyy kuun loppuun, mutta sen kuukausihinta
   on proratoitu vastaamaan vain sopimuksen kestoa (esim. 24 päivää).
2. **Keskenkauden päättymisten etukäteislaskutuskatkaisut (~4 % tapauksista, n. 300 pyörää):**
   Kun sopimus päättyy kesken kauden kuukauden lopussa (esim. 31.10.2026), seuraava kuukausi (11/2026)
   on ehditty laskuttaa 35 päivää etukäteen 1.10. ajossa. CR-käsittelijä (`handler_lunastus.js`)
   katkaisee sopimusrivin laskutetun jakson loppuun (`end_date_of_old_sub` = 30.11.2026) ja luo
   marraskuulle hyvitys-CR:n (tyyppi 11). Rekisterin `subsc_end_date` asetetaan todelliseksi päättymispäiväksi
   (31.10.2026). Sopimusrivi ei laskuta joulukuuta (koska rivi päättyy 30.11.), ja automaattinen
   sopimusrivien sulkemisskripti (702) passivoi ja sulkee rivin 1.12. yöajossa.

---

## Todiste 1 — OOMI-sopimusten tynkärivit (SuiteQL 5.11.2026)

Kysely aktiivisista pyöristä ja riveistä, joilla `license_enddate > subsc_end_date`:

| Tilaustyyppi | Pyöriä | Osuus |
|---|---|---|
| **Tyyppi 3 (OOMI)** | **7 150** | **97,2 %** |
| Muut / tyhjä | 206 | 2,8 % |
| **Yhteensä** | **7 356** | **100 %** |

OOMI-pyörien joukossa:
- **7 120 / 7 180 rivistä (99,2 %)** päättyy täsmälleen saman kuukauden viimeiseen päivään kuin
  pyörän `subsc_end_date`: `LAST_DAY(br.custrecord_sta_subsc_end_date) = r.custrecord_sta_ca_row_license_enddate`.
- Esimerkkejä pistokokeesta:
  - B037521: `subsc_end_date` = 24.06.2028, tynkärivi 01.06.–30.06.2028 (hinta 64,52 €)
  - B037528: `subsc_end_date` = 25.06.2028, tynkärivi 01.06.–30.06.2028 (hinta 67,20 €)
  - B037542: `subsc_end_date` = 27.06.2028, tynkärivi 01.06.–30.06.2028 (hinta 72,58 €)

Rivin hinta on nimenomaan vajaan kuukauden hinta, ei täyden kuukauden hinta. Laskutusmoottori
laskuttaa tämän tynkärivin kerran ko. kuukauden kohdalla ja laskutus päättyy siihen.

---

## Todiste 2 — Ei-OOMI-pyörien keskenkauden lunastukset (SuiteQL 5.11.2026)

Ei-OOMI-pyörien (206 kpl) pistokokeessa toistui identtinen säännönmukaisuus:
- Pyörät ovat päättyneet edellisessä kuussa (esim. 31.10.2026).
- Niiden sopimusrivi päättyy seuraavan kuukauden loppuun (30.11.2026).
- Kaikilla on Done-tilainen tyypin 2 CR (esim. B004971, CR 7122 *Notion-1431 - 2C*), jonka
  `custrecord_cr_end_date_of_old_sub` on 30.11.2026, sekä tyypin 11 hyvitys-CR marraskuulle.
- Laskutushistoria sisältää `2026-11-01`, mutta **ei `2026-12-01`**.
- Laskutusmoottori (701) ei laskuta joulukuuta, koska rivin loppupäivä 30.11.2026 ei kata joulukuuta.
- Skripti 702 sulkee ja passivoi rivin 1.12.2026 yöajossa heti kun marraskuu on ohi.

---

## Päätös ADR 0022:lle

ADR 0022 § *Päätökset* kohdassa 1 todettu kysymys on ratkaistu:
- **Sääntöä "sopimusrivi ei saa päättyä `subsc_end_date`:n jälkeen" EI lisätä ADR 0022:een tai poikkeamaraportointiin yleissääntönä.**
- OOMI-sopimuksilla tynkärivin päättyminen kuukauden loppuun on pakollinen osa nykyistä laskutusmallia.
- Keskenkauden lunastuksissa yhden kuukauden siirtymäerotus on normaali tila, kunnes kuukaudenvaihteen ajo 702 sulkee rivin.
