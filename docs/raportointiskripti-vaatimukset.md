# Raportointiskripti — vaatimukset lunastusten poikkeamille

**Päivitetty:** 2026-10-07 · **Tila:** vaatimuslista, skriptiä ei ole määritelty eikä omistajaa nimetty
**Peruste:** [ADR 0015](adr/0015-status-sync-2-tarkennukset.md) k. 1 (status-sync 2.0 ei raportoi),
[ADR 0014](adr/0014-maksulinkin-korjaus-ja-yksinkertaistus.md) k. 10 (1479 ei raportoi)

Toiminnalliset skriptit (status-sync 2.0, 1479) eivät raportoi. Tämä lista kokoaa, mitä erillisen raportointiskriptin
on nostettava ihmiselle. Jokainen kohta on **joukkoerotus rekisterin ja CR:ien nykytilasta**, ei toiminnallisen
skriptin lokin luku. Siksi raportti on oikein, vaikka toiminnallinen ajo olisi jäänyt väliin.

## Status-sync 2.0:n jättämät tilat

| # | Ryhmä | Kenelle | Lähde |
|---|---|---|---|
| R1 | §5-ero: tapa 1, ei-OOMI, ei Done-tilaista tyypin 2 CR:ää, `liab_settled_at` ≠ `paid_at` | lunastusten omistaja | kenttäsäännöt §5, ADR 0008 |
| R2 | Status 2/3, mutta päättymiskuu ei ole alkanut (ennenaikainen) | lunastusten omistaja | statusportti |
| R3 | Status ≠ `kohdestatus(tapa)` (2 ↔ 3), status 2/3 ilman tapaa | lunastusten omistaja | ADR 0007 k. 5 |
| R4 | Status tyhjä, sopimus alkanut | lunastusten omistaja | ADR 0007 k. 5 |
| R5 | Status 1, ei tapaa, kausi päättynyt yli 2 kk sitten | lunastusten omistaja | jälkiveloitussilmukka |
| R6 | Status 1, mutta `ic_redemption_done` = T | taloustiimi | ADR 0011 |
| R7 | Done = T, mutta IC-päivä ≠ `LAST_DAY(subsc_end_date)` tai tapa tyhjä | taloustiimi | ADR 0011 k. 7 |
| R8 | Tapa asetettu, `subsc_end_date` tyhjä (IC-päivää ei voi kirjoittaa) | lunastusten omistaja | 2.0 vaihe 4 |
| R9 | Maksettu lunastus ja Pending-tilainen jälkiveloitus-CR (maksu päättymiskuun jälkeen, ennen CR:n käsittelyä) | asiakaspalvelu, taloustiimi | ADR 0015 k. 8 (Q20) |
| R10 | Tapa 2, 3 tai 4 ja avoin loppulunastustilaus Paylinkissä | asiakaspalvelu | ADR 0012 k. 9, T45 |
| R11 | Tapa 2 ja saman pyörän tyypin 11 CR | lunastusten omistaja | ADR 0015 k. 5 |
| R12 | IC-päivä asetettu, done ≠ T, hinta tyhjä yli vuorokauden | taloustiimi | ADR 0015 k. 7 (laskuri ei käynnistynyt) |
| R13 | Status 2/3 ja `date_to_non_active` tyhjä yli vuorokauden | lunastusten omistaja | 1458 |

## Keskenkauden lunastus (siirretty status-sync 2.0:sta)

| # | Ryhmä | Kenelle | Lähde |
|---|---|---|---|
| S1 | Tyypin 2 CR:t Needs Review -tilassa, luontipäivineen. Määräaika on luontikuun loppu | taloustiimi, asiakaspalvelu | ADR 0010 k. 7 |
| S2 | Keskenkauden maksu ilman tyypin 2 CR:ää (Paylinkin tuotenimi `kesken kauden`, päättymiskuu ei alkanut) | asiakaspalvelu | ADR 0010 k. 2 |
| S3 | Tyypin 10 CR Pending yli 30 päivää | asiakaspalvelu | ADR 0010 k. 9 |
| S5 | `custrecord_sta_redemption_date` asetettu (Staria-hyvitys) | lunastusten omistaja | ADR 0010 k. 3 |

## Maksulinkki (1479)

ADR 0014 k. 10 (digesti poistettu) sekä T46 (jälkiveloituspyörien avoimet tilaukset). Ryhmät määritellään erikseen.

## Kauppakirja

ADR 0013 k. 13: virheellisesti lähetetyt, tapa 8 -pyörät, estetyt, omistuksen siirtymispäivä ei koittanut yli 30 pv
päättymisestä. Ryhmät määritellään erikseen.

## Extension 2.0 (T61, tuoteomistaja 9.10.2026)

- Active-tilaiset ei-OOMI-pyörät, joiden sopimus on päättynyt ja joille ei ole lähetetty maksulinkkiä eikä ole jälkiveloitusketjua. Extension ohittaa ne, ja ihminen ratkaisee.
- Pyörät, joiden lunastushinta on 0 € ja joille ei ole kirjattu tapaa 4. Extension ohittaa ne, ja ihminen kirjaa tavan.

## Kuukausiraportoinnin ennakkovaroitukset (T23, T24, tuoteomistaja 9.10.2026)

- **T23, Ended voittaa:** kun samalla pyörällä on samassa kuussa sekä pidennys (tyypin 7 CR) että ennenaikainen päättyminen tai lunastus, **Ended-rivin on aina voitettava**. Raportti listaa ennen kuukausiajoa pyörät, joilla tällainen yhdistelmä on (Done-tilaiset tyypin 7 ja 2 CR:t samassa kuussa, vrt. 8893), jotta tuplarivi estetään ennen kuin se syntyy.
- **T24, saman pyörän useampi CR:** kun samalla pyörällä on useampi käsittelemätön tai samaan kuuhun osuva siirto-CR (tyypit 1 ja 9), raportti nostaa sen esiin **etukäteen**, ennen CR-käsittelijää (1196). 1196 käsittelee CR:t ilman järjestystä, joten lopputulos voi olla väärä työnantaja. Tämä on vahinko, joka pitää havaita ennen kuin se tapahtuu. Koodikorjausta ei tehdä.

## Avoinna

- toteuttaja ja ajotapa (sähköposti, saved search, dashboard)
- vastaanottajat ryhmittäin (taulukon *Kenelle* on ehdotus)
- kyselyt `queries/`-kirjastoon (`suiteql-rakentaja`)
