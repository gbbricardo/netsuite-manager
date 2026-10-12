# ADR 0015 — Status-sync 2.0: toiminnallinen skripti, `subsc_end_date` ja tapa 2 muutospyyntötasolla

- **Päivämäärä:** 2026-10-07
- **Tila:** Hyväksytty (tuoteomistaja, grilling-istunto 6.–7.10.2026, kysymykset Q1–Q29)
- **Koskee:** `netsuite-bike-redemption-status-sync` (status-sync 2.0)
- **Muuttaa:** [ADR 0007](0007-status-sync-2-tasmaytysajo.md) (vaihe 4, käyttöönotto, D4–D5),
  [ADR 0009](0009-kauden-lopun-lunastus.md) k. 6 (`paid_at` OOMI:lla),
  [ADR 0011](0011-ic-paiva-velvoitteista.md) k. 2 (*velvoitteet hoidettu* = tapa asetettu),
  [ADR 0012](0012-loppulunastushinta-ja-kattavuus.md) k. 5 (kuukaudet muutospyynnöistä)
- **Rakennusohje:** [`../status-sync-2-tasmaytysajo.md`](../status-sync-2-tasmaytysajo.md)
- **Raportointi:** [`../poikkeamaraportointi-vaatimukset.md`](../poikkeamaraportointi-vaatimukset.md)

## Konteksti

ADR 0007 määritteli status-sync 2.0:n 23.09. Sen jälkeen ADR:t 0008–0014 muuttivat maksun, vastuiden ja IC-päivän
sääntöjä, eikä skriptiä ollut rakennettu 6.10. mennessä. Vanha skripti 1440 poistettiin ajastuksesta 6.10.
Tuoteomistajan linja (ADR 0014) on yksinkertainen skripti: yksi tehtävä, ei raportointia, vähän tiloja.

## Päätökset

1. **Skripti on puhtaasti toiminnallinen.** ADR 0007:n vaihe 4 (poikkeamaraportti) ja sähköposti (D5) poistuvat.
   Kaikki raportointi kuuluu erilliseen raportointiskriptiin, joka lukee rekisterin tilaa eikä tämän skriptin lokia.
   Myös keskenkauden vaatimukset S1–S3 siirtyvät sinne. Skripti lokittaa jokaisen kirjoituksen ja virheen. (Q6, Q7, Q15)
2. **Käyttöönotto heti, kun skripti on valmis ja dry run on käyty läpi**, kesken kuunkin. Virheet korjataan
   erillisessä istunnossa. Takarajat ovat 29.10. (IC-lunastus) ja 1.11. (extension). (Q1, Q12)
3. **Päättymisajankohta on `subsc_end_date`.** `exceptional_end_date` ja `oomi_exceptional_end_date` eivät
   tarkoita tälle skriptille mitään. Kirjastolle annetaan vain `subsc_end_date`, joten K1:n (T11) aikataulu ei vaikuta
   skriptiin. Todennettu 7.10.: kentät eroavat vain kahdella pyörällä, joiden status on tyhjä. (Q22)
4. **`paid_at` on maksun fakta.** Se kirjoitetaan tyhjään kenttään aina, kun lunastuksen maksutodiste on olemassa
   (maksettu loppu- tai keskenkauden Paylink-tilaus tai maksettu, hyvittämätön lunastuslasku), selvitystavasta,
   statuksesta ja OOMI:sta riippumatta. Poikkeus on tapa 5. Vastuut (tapa, `liab_settled_at`) kirjataan omilla
   säännöillään. Vanhan speksin §5-ohitus poistuu. (Q2, Q3, Q13, Q14, Q25)
5. **Tapa 2 lasketaan muutospyyntötasolla.** Jälkiveloituskuukausi = Done-tilainen tyypin 7 CR, jonka nimessä on
   *pidennys* (ei *2a*). Kattavuus: määrä × 63,75 € ≥ maksettava netto. `liab_settled_at` = rajan ylittäneen CR:n
   `closed_date` Helsingin päivänä. Hyvityksiä ei huomioida, koska jälkiveloituskuukausia ei hyvitetä tavallisessa
   työnkulussa. Maksettava netto lasketaan 1479:n kirjastolla `lib_gbb_redemption_price.js` absoluuttisella polulla.
   Jos tapa 1 ja tapa 2 täyttyvät samassa ajossa, aikaisempi päivä voittaa, tasapelissä tapa 1. (Q4, Q17, Q18, Q23,
   Q26, Q27)
6. **IC-päivän laukaisija on asetettu selvitystapa** (tavat 1–8). Pelkkä `paid_at` ei riitä, vaikka kirjaston
   `onkoVelvoitteetHoidettu` hyväksyy sen, koska keskenkauden maksu ilman CR:ää ei hoida velvoitteita (ADR 0008
   sääntö 3). Kun `ic_redemption_done` = T, IC-kenttiin ei kosketa. (Q5, Q6)
7. **IC-laskuri käynnistetään ajon lopuksi**, kun IC-kentät muuttuivat. Varmistusajastusta ei tehdä: taloustiimi ajaa
   laskurin käsin tarvittaessa. (Q10, Q16)
8. **Skripti ei koske CR:iin eikä Paylinkiin.** Se ei peru avoimia tilauksia tavalla 2 eikä Pending-tilaista
   jälkiveloitus-CR:ää, kun maksu tulee päättymiskuun jälkeen. Määräaika on päättymiskuun loppu (ADR 0009 k. 2), ja
   myöhästynyt maksu saa seuraavan kuun kaudekseen. (Q9, Q20)
9. **Ei kirjoita `date_to_non_active`:a.** Se jää 1458:lle. (Q8)
10. **Tilat ovat dry run ja live, lisäksi `test_bike_id`.** Dry run ajaa kaiken ja lokittaa, mutta ei kirjoita eikä
    tuota tiedostoja. (Q11, Q21)
11. **Ajojärjestys:** Paylink-synkka → 2.0 (00:30) → extension (siirretään 03:00:aan). (Q19)
12. **Vastuut kirjataan vain Active-pyörälle (status 1).** Status 2/3 tai tyhjä ilman tapaa on poikkeama, jonka
    raportointi nostaa esiin. Muuten esimerkiksi palautettu pyörä saisi tavan 1 lunastusmaksusta. (Q28)
13. **Inaktiiviset rekisteritietueet rajataan pois**, kuten 1479:ssä. (Q29)

## Hylätyt vaihtoehdot

- **Raportti samassa skriptissä** (ADR 0007 vaihe 4). Hylätty: toiminnallinen skripti ja raportointi ovat eri
  vastuita, ja raportointi tarvitsee oman omistajansa.
- **Jälkiveloituslaskujen tunnistus CR:n automaatiolokista** tai uusi CR-linkkikenttä laskulle. Hylätty: automaatio luo
  sekä CR:n että laskun, joten CR-taso riittää.
- **Tapa 2 parametrin takana**, kunnes 1479:n kirjasto on korjattu. Tarpeeton: korjattu kirjasto oli File Cabinetissa
  7.10. (tavukoko sama kuin repon `master`, 40 testiä läpi).
- **Väliaikainen vartija poikkeuskentille.** Hylätty: kenttiä ei lueta lainkaan.

## Seuraukset

- ADR 0009 k. 6: *"myöhässä saapuva maksu ei muuta mitään, ei edes `paid_at`:ia"* → *ei muuta tapaa eikä
  `liab_settled_at`:ia; `paid_at` kirjataan*. Tämä tukee ADR 0013 k. 8:aa (OOMI-kauppakirja vaatii maksupäivän).
- ADR 0012 k. 5: *"laskutetut, hyvittämättömät laskut"* → *Done-tilaiset pidennys-CR:t*.
- Kenttäsäännöt § `redemption_paid_at`: *"kenttä on olemassa vain tavalla 1"* ei enää päde.
- Kunnes raportointiskripti on olemassa, poikkeamat (Needs Review -CR:t, §5-erot, keskenkauden maksu ilman CR:ää)
  eivät näy kenellekään automaattisesti. Ne luetaan käsin kyselyillä.
- 1440:n osa A ja sweep ovat pois päältä 6.10. alkaen. Jos 2.0 ei ole tuotannossa 28.10., välipäivät hoidetaan
  CSV:llä (T26).

## Todennettu vs. päätelty

**Tuoteomistajalta 6.–7.10.2026:** päätökset 1–13 (12 ja 13 PR #4:n tarkistuksen jälkeen).
**Todennettu NetSuitesta 6.–7.10.2026:**
- 1440 ajoi joka yö 25.9.–6.10. (`scriptnote`)
- maksettuja lunastuslaskuja ilman maksettua Paylinkiä 26–59 kuussa (esim. B024083, INVGBB1014083)
- poikkeuskenttien ero `subsc_end_date`:sta 2 pyörällä (status tyhjä)
- ajoajat 30.9.→1.10.: Paylink-synkka noin 23:31, 1440 00:31, extension 01:01 (Helsinki)
- 1479:n kirjasto File Cabinetissa 7.10.

**Todennettu koodista:**
- `handler_jalki` ei linkitä laskua CR:ään (`handler_jalki.js:91-175`)
- kirjasto 1.1.0 ilman `icLunastuspaiva`a, kuukausiehtoa, OOMI-haaraa ja tapaa 2
- IC-laskurin syöte (`gbb_ic_redemption_price_mr.js:24-27`)
- 1479:n hintakirjasto (`lib_gbb_redemption_price.js:142-272`)

**Päätelty:** I-joukon koko ensimmäisessä ajossa.
