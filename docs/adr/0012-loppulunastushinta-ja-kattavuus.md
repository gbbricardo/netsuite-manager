# ADR 0012 — Loppulunastushinta, huoltohyvitys ja kattavuus

- **Päivämäärä:** 2026-10-06
- **Tila:** Hyväksytty (tuoteomistaja, grilling-istunto 6.10.2026)
- **Koskee:** kauden lopun lunastus muilla kuin OOMI-pyörillä. `netstuite-send-end-redemption-payment-link` (1479),
  status-sync 2.0, `netsuite-subscription-extension` (uudelleenkirjoitus)
- **Muuttaa:** [ADR 0009](0009-kauden-lopun-lunastus.md) kohdat 3 (tavan 2 päivä) ja 5 (kattavuusehto)
- **Kumoaa:** maksulinkkirepon 14.9.2026 päätöksen, jossa huoltohyvitys ankkuroitiin sopimuksen pidennykseen
- **Kenttätaso:** [kenttäsäännöt § 11](../lunastuksen-kenttasaannot.md#11-loppulunastushinnan-määräytyminen-ja-kattavuus)

## Konteksti

Maksulinkin ensimmäinen tuotantoajo 1.10.2026 hinnoitteli huoltohyvityksen pidennyksestä
(`subsc_end_date − subsc_org_end_date`). Pidennys sisältää kuitenkin myös jälkiveloituskuukaudet, joten
jokainen jälkiveloituskuukausi kasvatti hyvitystä yhdellä portaalla. Tuloksena oli 6 liian pientä linkkiä
ja 4 aiheetonta tapa 3 -kirjausta ([löydös](../../findings/2026-10-05-maksulinkki-logiikkavirheet-ja-tavoitetila.md)).
Samalla kävi ilmi, että ADR 0009 k. 5 vertasi jälkiveloitusvuokria koko loppulunastushintaan. Linkki
pyytää kuitenkin hintaa, josta huoltohyvitys on vähennetty. Kaksi sääntöä luki samaa asiaa eri luvuista.

## Päätökset

1. **Huoltohyvitys lasketaan huoltosummasta, ei pidennyksestä.** Positiivisella summalla se on pienimmän
   kattavan portaan yläraja miinus summa, eli aina alle yhden portaan välin. Negatiivinen summa
   hyvitetään kokonaan ilman kattoa (ei OOMI). Pidennys on vain eheystarkistus, eikä se estä pyyntöä.
2. **Maksettava summa lasketaan kerran**, pyynnön lähetyshetkellä, eikä sitä tallenneta uuteen kenttään.
   Myöhemmät kattavuustarkistukset laskevat saman kaavan tarkistushetken tiedoista.
3. **Hinta 0 € tarkoittaa, että käsiraha kattaa lunastuksen** (portaalin oletus). Tapa 4, ei pyyntöä eikä
   jälkiveloitusta.
4. **Paylink-maksu kattaa aina.** Maksettu loppulunastustilaus on tapa 1, eikä summaa verrata, koska
   tilausta ei voi maksaa vajaana.
5. **Jälkiveloituskuukausi kattaa kiinteät 80,00 € brutto (63,75 € netto)**, laskun summasta riippumatta.
   Laskutettu, hyvittämätön lasku riittää, eikä maksu ole ehto. Lasketaan vain *pidennys*-CR:ien laskut.
   Kattavuus: kuukaudet × 63,75 ≥ maksettava netto. `liab_settled_at` = rajan ylittävän laskun luontipäivä.
6. **Lähteitä ei yhdistetä.** Selvitystapa on yksi, ja se on ensimmäinen tapa, joka yksin kattaa.
7. **Tyypin 2 tai 10 CR (Pending/Done)** tarkoittaa, ettei loppulunastuspyyntöä lähetetä eikä pyörää
   jälkiveloiteta. Asiakaspalvelu luo tyypin 2 CR:n vasta, kun keskenkauden lunastus on hoidettu.
8. **Aikaikkuna** on tavoitteena 60 päivää ennen päättymisajankohtaa – päättymisajankohta. Järjestelmän
   raja on päättymiskuun loppu (ADR 0009 k. 2 ennallaan).
9. **Avoimet pyynnöt.** Jälkiveloituksen aikana asiakaspalvelu päivittää avoimen tilauksen summan käsin.
   Kun velvoite hoidetaan tavalla 2, 3 tai 4, avoimet tilaukset perutaan. Raporttiskripti on erillinen,
   myöhemmin määriteltävä, ja se käyttää samaa hintakirjastoa kuin maksulinkki.

## Vaihtoehdot, joita ei valittu

- **Maksettavan summan tallentaminen rekisteriin.** Torjuttu: uusia kenttiä ei haluta. Hinta: jos huolto-
  tai hintatiedot muuttuvat lähetyksen jälkeen, kattavuus seuraa nykyisiä tietoja eikä pyydettyä summaa.
- **Jälkiveloituslaskun todellinen veroton summa kattavuutena** (ADR 0009 k. 5). Torjuttu: jälkiveloitus-
  ja vuokrakuukausi ovat eri asioita, ja lunastusta kattaa kiinteä 80 € brutto kuukaudessa.
- **Uuden, pienemmän pyynnön lähettäminen joka kuukausi.** Torjuttu: yksi pyyntö per pyörä, ja päivitys
  tehdään käsin.

## Seuraukset

- 1479 tarvitsee korjaukset L1, L2 ja L3 sekä ohituksen 4 (tyyppi 2/10) ja 60 päivän ikkunan (TASKS T43).
- Status-sync 2.0:n tavan 2 toteutus (K2) tehdään tämän ADR:n mukaan, ei ADR 0009 k. 5:n mukaan.
- `netsuite-subscription-extension`in uudelleenkirjoitus lukee samat ohitukset (hinta 0, tapa asetettu,
  tyypin 2 tai 10 CR).
- Jos `handler_jalki` alkaa laskuttaa useita kuukausia yhdellä laskulla, kohta 5 avataan uudelleen.
