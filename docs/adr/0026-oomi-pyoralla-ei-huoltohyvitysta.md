# ADR 0026 — OOMI-pyörän lunastushinnasta ei hyvitetä mitään

- **Päivämäärä:** 2026-11-11
- **Tila:** Hyväksytty (tuoteomistaja, liiketoimintapäätös ja grilling-istunto 11.11.2026, K1–K6)
- **Koskee:** `netstuite-send-end-redemption-payment-link` (1479), keskenkauden lunastuksen käsin tehdyt linkit
- **Kumoaa:** [ADR 0014](0014-maksulinkin-korjaus-ja-yksinkertaistus.md) k. 22 (OOMI-pyörän hyvitys = negatiivinen huoltosumma)
  ja [ADR 0024](0024-huoltohyvitys-keskenkauden-lunastuksessa-ja-lookup-kentta.md):n OOMI-pyörien osalta
- **Kenttätaso:** [kenttäsäännöt § 11](../lunastuksen-kenttasaannot.md#11-loppulunastushinnan-määräytyminen-ja-kattavuus)
- **Toteutus:** TASKS T109

## Konteksti

ADR 0014 k. 22 (26.10.2026) toi OOMI-pyörät maksulinkin piiriin ja vähensi niiden lunastushinnasta negatiivisen
huoltosumman ilman kattoa. 1479 toteuttaa sen `lib_gbb_redemption_price.js:151-158`:ssa: negatiivinen summa hyvitetään,
ja jos hyvitys kattaa hinnan, pyörä kuitataan tavalla 3 (`gbb_mr_send_end_redemption_paylink.js:609-613`).

OOMI-pyörät siirtyivät GoByBikelle yrityskaupassa. Niiden käyttäjien menettely halutaan pitää samana kuin OOMIn
palveluksessa, eikä OOMIlla lunastusmaksuista hyvitetty mitään.

## Päätös

1. **OOMI-pyörän huoltohyvitys on aina 0.** Maksettava netto = `end_redemption_price`. Huoltosumman etumerkki
   tai suuruus ei vaikuta. Ei poikkeuksia. (K1)
2. **Koskee kauden lopun ja keskenkauden lunastusta.** (K3)
3. **Tapa 3 (huoltohyvitys kattaa hinnan) ei enää synny OOMI-pyörälle.** Hinta 0 € kuitataan edelleen tavalla 4. (K1)
4. **Voimaantulo:** vain maksupyynnöt, jotka lähetetään muutoksen käyttöönoton jälkeen. Väliaikainen sääntö
   (ADR 0014 k. 22, 26.10.–11.11.2026) vähensi OOMI-pyörien hinnasta negatiivisen huoltosumman ja kuittasi osan tavalla 3.
   Niitä linkkejä ja kirjauksia ei muuteta eikä peruta. (K2)
5. **Sähköpostin budjettiarvot pysyvät ennallaan.** `kayttamaton_huoltobudjetti` ja `_num` lähetetään OOMI-pyörällekin
   huoltosummasta laskettuna (ADR 0014 k. 24). Brevo-pohjaan ei kosketa; piilotus tarvittaessa erikseen. (K4)
6. **cf-gbb-toolsiin ei tehdä muutoksia.** (K5)

## Seuraukset

- 1479:n OOMI-haara palauttaa hyvityksen 0; testit `test/run_tests.js:218-261` kirjoitetaan uudelleen.
- **Riski (K5):** pyörärekisterityökalu ja raportointitarkistukset (ML4, LU6, LU17) voivat yhä laskea tai odottaa
  OOMI-pyörälle vanhan säännön hyvitystä. Ei todennettu koodista. Asiakaspalvelu ei vähennä OOMI-pyörän
  käsin tehtyyn keskenkauden linkkiin hyvitystä, vaikka työkalu sen näyttäisi.
- **Riski (K4):** OOMI-asiakkaan sähköposti voi näyttää käyttämätöntä huoltobudjettia, jota hinnasta ei vähennetä.
