# Verovapaus (`custrecord_gbb_verovapaa`) — kenttäsääntö

Kirjattu 30.09.2026 tuoteomistajan ilmoituksen perusteella.

## Kentät

| Tietue | Kenttä | Tyyppi |
|---|---|---|
| Pyörärekisteri `customrecord_sta_bike_register` | `custrecord_gbb_verovapaa` | checkbox |
| RI `customrecord_gbb_monthly_reporting_item` | `custrecord_gbb_ri_tax_exemption` | checkbox |

RI-rivin arvo kopioidaan rekisteristä rivin luonnissa. Näin tekevät `mr_monthly_reporting_ri_creation.js:80`, `ri_update.js:100`,
`mr_backfill_missing_ended_rows.js:86` ja UE-skriptit (`bikeRec.getValue('custrecord_gbb_verovapaa')`). Päivämäärä 30.09.2026, päätelty koodista.

## Sääntö

**Verovapaus päättyy, kun työnantaja vaihtuu muuten kuin konsernin sisällä.**

| Muutos | CR-tyyppi | `verovapaa` T:stä |
|---|---|---|
| Siirto työnantajalta toiselle (Siirto TA, myös 2A-paketin siirto-CR) | 1 | **→ F** rekisterissä ja uuden työnantajan RI-riveillä |
| Siirto konsernin sisällä (Siirto konserni) | 9 | Säilyy T |
| Muut muutokset (lunastus, pidennys, välikuukaudet, …) | 2, 3, 7, … | Ei muutu |

- Sääntö koskee sekä pyörärekisteriä että RI-rivejä.
- **Tunnettu poikkeus: liikkeenluovutus.** Jos tyypin 1 CR:n selityksessä lukee *Liikkeenluovutus*, työsuhde siirtyy
  uudelle työnantajalle sellaisenaan, ja verovapaus säilyy. Esimerkki: B030311, CR 6734, 30.09.2026.
  Automaatiossa tämä pitää tunnistaa ennen F:n kirjoittamista, tai CR pitää ohjata Needs Review -tilaan.
- Poikkeukset ovat mahdollisia mutta harvinaisia. Jos siirron jälkeen on perustellusti T, se ratkaistaan tapauskohtaisesti, eikä sitä raportoida automaattisesti virheeksi ennen kuin asia on tarkistettu.

## Toteutuksen tila (30.09.2026)

Päätelty koodista, ei todennettu NetSuitesta. Mikään sibling-repo ei kirjoita `custrecord_gbb_verovapaa`-kenttää
siirron yhteydessä. `netsuite-subscrption-cr-scripts` ei viittaa kenttään lainkaan. Sääntöä ei siis automatisoida, vaan
F-arvo syntyy vain käsin. Monthly-reporting kopioi rekisterin arvon riveille, joten väärä T rekisterissä periytyy
uuden työnantajan RI-riveille.

## Milloin F alkaa (tuoteomistaja 30.09.2026)

**Kun siirron UE-skripti (`ue_reporting_item_transfers.js`) laukeaa tyypin 1 CR:stä ja luo uuden työnantajan
Active/New-rivin, rivin on oltava jo F.** Tyypin 9 CR:ssä UE säilyttää arvon. Käytännössä F alkaa siis siitä
kuukaudesta, jolloin RI:n työnantaja vaihtuu (`official_end_date` + 1, rajattuna seuraavan kuun 1. päivään).
Laskutuksen `start_date` ei vaikuta asiaan. Rekisterin F kuuluu samaan hetkeen, koska kaikki myöhemmät rivit kopioivat
arvon rekisteristä.

Vanhan työnantajan rivit (myös siirtoparin Ended-rivi) säilyttävät arvonsa. Tämä on oletus, jota ei ole vahvistettu.

**Toteutus puuttuu** (päätelty koodista). UE lukee arvon rekisteristä (`ss_reporting_item_transfers_for_testing.js:232`
ja deployattu vastine), ja rekisteriä ei päivitetä siirrossa. Korjaus kuuluu kahteen repoon:
- `netsuite-monthly-reporting`: UE asettaa uuden työnantajan riville F, kun CR-tyyppi on 1.
- `netsuite-subscrption-cr-scripts`: `cr_bike_register_apply` asettaa rekisteriin F tyypin 1 siirrossa.
