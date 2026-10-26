# ADR 0020 — Kuukausiraportointiin vaikuttavat tiedot

- **Päivämäärä:** 2026-10-23
- **Tila:** Hyväksytty (tuoteomistaja, grilling-istunto 23.10.2026, kysymykset Q1–Q15)
- **Koskee:** kuukausiraportointirivit (`customrecord_gbb_monthly_reporting_item`, RI), niiden lähteenä olevat item 30 -sopimusrivit
  (`customrecord_sta_ca_agreement_row`) ja muutospyynnöt; poikkeamaraportoinnin tarkistukset RI1–RI8
- **Täydentää:** [ADR 0017](0017-poikkeamaraportointi.md) (P3: tarkistus vain kirjatusta säännöstä), TASKS T65 (luokat A2–A5, A7, A10, A11)
- **Käsitteet:** [CONTEXT.md](../../CONTEXT.md) § *Poikkeamaraportoinnin käsitteet*

## Konteksti

Poikkeamaraportointi tekee tarkistuksen vain kirjatusta säännöstä (ADR 0017, P3). Kuukausiraportoinnin toistuvilta
virheluokilta sääntö puuttui tästä reposta: säännöt olivat vain `netsuite-monthly-reporting`-repon kehitysdokumenteissa
(`docs/rules/RIVISAANNOT.md`, `TULOSTUSSAANNOT.md`). Ne kirjoitettiin kehitystä varten. Nyt repoa hallitaan tämän repon
kautta, joten niihin viittaava tarkistus voisi nojata dokumenttiin, jota ei enää päivitetä. (Q1, Q9)

Tunnetut luokat: RI-rivin vuokra ≠ sopimusrivin hinta (OOMI-hinnat 1.10.2026), Active-rivi 0 €:lla (5 OOMI-pyörää
30.9.2026), Warning-rivit, jotka pidättävät koko työnantajan palkka-CSV:stä, puuttuvat rivit (syyskuun auditointi
22.9.2026) sekä Ended-rivin turhat tekstit (T28: 202 riviä, T29: 32 riviä 1.10.2026).

## Päätökset

1. **ADR on itsenäinen.** Säännöt kirjataan tähän kokonaan. Tarkistukset eivät viittaa monthly-reportingin
   sääntödokumentteihin. Jos koodin käytös ja tämä ADR eroavat, ADR on tavoitetila. (Q1, Q9)

2. **Raportointi seuraa laskutusta, mutta itsenäisesti.** Työnantaja perii laskutetun vuokran työntekijän palkasta, joten
   RI-rivin vuokran on oltava sama kuin kuukauden laskutettava vuokra. Raportointi saa jatkua, vaikka laskutus on katkennut
   (esim. B010533:n marraskuu 2026: tapa 2, `subsc_end_date` 30.11., ei marraskuun laskutusta, RI Active). **Laskutus ei saa
   jatkua ilman raportointia.** (Q2, Q11)

3. **Raportointipäivän 1.M rivi on kuukauden M vähennys.**

4. **Vuokran ainoa lähde on item 30 -sopimusrivi**: raportointikuun 1. päivänä voimassa oleva rivi (OOMI-pyörän
   viimeisenä kuukautena päiväsuhteutettu osarivi), tai jos sellaista ei ole, viimeksi päättynyt rivi. Sama sääntö
   hinnoittelee jälkiveloituksen (`handler_jalki.js` `priceForMonth`), joten jälkiveloituskuukaudenkin vertailuarvo on
   sopimusrivi eikä lasku. Laskua ei käytetä myöskään siksi, että OOMI-pyörän vuokraa ei voi seurata laskuriviltä
   (todennettu 23.10.: B041634:llä ei ole yhtään laskua, jonka pyöräkenttä osoittaisi siihen). (Q10, Q13)

5. **Laskutettu kuukausi.** Kuukausi M on pyörälle laskutettu, kun
   - pyörällä on 1.M voimassa oleva item 30 -sopimusrivi **tai** Done-tilainen pidennys-CR (tyyppi 7, *pidennys*) kaudelle M,
   - **eikä** Done-tilainen tyypin 11 CR hyvitä kuukautta M.

   Hyvitysehto on välttämätön: keskenkauden lunastuksessa ja tauossa sopimusrivi kattaa yhä kuukauden, ja raha korjataan
   tyypin 11 CR:llä (ADR 0010). Lokakuussa 2026 ilman ehtoa olisi raportoitu 208 pyörää, joista 206:lla on tyypin 2/3 ja
   11 CR:t. (Q14)

6. **`custrecord_sta_init_subs_rent_fee` ei ole tarkistettava tieto.** Kenttä siirtää tilausjärjestelmän vuokran NetSuiteen
   alkutietona, ja se saa poiketa sopimusrivistä sopimusmuutosten jälkeen. (Q3)

7. **Raportoitava pyörä** kuukaudelle M: `subsc_start_date` ≤ 1.M, pyörällä ei ole Ended-riviä raportointipäivälle 1.M
   tai aiemmalle, `isinactive` = F, eikä se ole testipyörä B017530. Pyörän statusta ei lueta. (Q6)

8. **Tarkistukset** (lajit ADR 0017:n mukaan: V = virhe, E = ennakkovaroitus):

   | ID | Ehto | Laji | Ajankohta |
   |---|---|---|---|
   | RI1 (A2a) | Active- tai Active/New-rivin `lease_fee_vat0` poikkeaa kohdan 4 vertailuarvosta yli 0,01 € netto | V | päivittäin |
   | RI2 (A3) | Active- tai Active/New-rivin `lease_fee_vat0` on 0 tai tyhjä. Ended- ja Paused-rivit eivät kuulu tähän (kertaluonteisen backfillin Ended-rivit ovat 0 €:n arvoisia tarkoituksella). | V | päivittäin |
   | RI3 (A4a) | Warning-rivi seuraavaksi palkka-CSV:hen menevällä raportointipäivällä. Yksikin Warning-rivi pidättää koko työnantajan aineiston CSV:stä. | E: palkka-CSV-ajo | kuukausiajon ja CSV:n välillä |
   | RI4 (A4b) | Warning-rivi aiemmalla raportointipäivällä: rivi jäi ratkaisematta, ja kuukauden aineisto lähti ilman työnantajaa | V | päivittäin |
   | RI5 (A5) | Kohdan 7 raportoitavalla pyörällä ei ole kuukaudelle yhtään riviä, joka ei ole Deleted (vähintään yksi riittää, koska siirtokuussa Ended + Active/New on oikein). Myös pyörä, jonka `subsc_start_date` on tyhjä. | V | kuukausiajon jälkeen |
   | RI6 (A10) | Ended-rivin ilmoitustekstissä on jälkiveloituksen myöhästymislause (*"Pyörän lunastus on myöhässä. Vuokralaskutus ja pyöräedun käsittely palkoissa jatkuu …"*) tai pidennyslause (*"Vuokrakauden päättymispäivä on muuttunut: pp.kk.vvvv → pp.kk.vvvv."*). Ended-rivi ei kanna niitä, koska lunastus on hoidettu. Vain raportointipäivät ≥ 1.11.2026. | V | kuukausiajon jälkeen |
   | RI7 (A11) | Ended-rivillä on huomio *"Tarkastakaa työntekijän palkoista tehdyt vähennykset."*, vaikka raportointikuu on päättymiskuuta seuraava kuu. Ended-rivi raportoidaan päättymiskuuta seuraavana kuuna riippumatta päivästä, ja huomio kuuluu vain myöhästyneelle riville. Vain raportointipäivät ≥ 1.11.2026. | V | kuukausiajon jälkeen |
   | RI8 (uusi) | Kohdan 5 laskutettu kuukausi, jolla pyörän rivi on Ended tai Paused (kohta 2) | V | kuukausiajon jälkeen |

9. **Rajat (ADR 0017, P16).** Rivi, joka täyttää sekä RI1:n että RI2:n, raportoidaan vain RI2:na. Laskutettu kuukausi ilman
   yhtään riviä on RI5, ei RI8. Warning-rivi on RI3/RI4, ei RI8. (Q4, Q15)

10. **Kuukausiajon portti.** RI5–RI8 arvioidaan vasta, kun kuluvan kuun ajo on valmis: skriptillä 1453 (ri_update) on
    kuluvan kuun `run complete` -lokirivi. Ennen sitä RI5 raportoisi jokaisen pyörän. Portti on ainoa lokin luku ajovahdin
    (ADR 0017, P14) ulkopuolella, ja lokia luetaan vain porttina, ei tarkistuksen sisältönä. (Q8)

11. **Vertailu tehdään pyörän ja kuukauden perusteella.** Sopimusrivin asiakkaasta ja RI-rivin työnantajasta ei välitetä,
    koska siirtokuussa raportointi vaihtaa työnantajaa päivästä `official_end_date` + 1 ja laskutus vasta päivästä
    `start_date`. (Q12)

12. **RI6:n ja RI7:n päättymisehto puuttuu tarkoituksella.** Koodi korjattiin 21.10.2026 (T28, T29), mutta tarkistus
    huomaa taantuman. (Q7)

13. **Ended voittaa** (lisätty 23.10.2026, [ADR 0021](0021-cr-ien-kasittelysaannot.md) k. 10, T23, T65 A8). Samalla pyörällä,
    työnantajalla ja raportointipäivällä ei ole sekä Active- tai Active/New-riviä että Ended-riviä. Tuplarivi syntyy, kun tyypin 2
    CR käsitellään kuukauden rivien luonnin jälkeen (esim. 8893: CR 6867 käsiteltiin 30.9., lokakuun Active-rivi oli jo olemassa).

    | ID | Ehto | Laji | Ajankohta |
    |---|---|---|---|
    | RI9 | Active- tai Active/New-rivi ja Ended-rivi samalla pyörällä, työnantajalla ja raportointipäivällä. Seuraavan palkka-CSV:n raportointipäivällä ennakkovaroitus, aiemmalla virhe. | E: palkka-CSV / V | päivittäin |

    Rajat: jos Active-rivi on jo Warning, asia on RI3/RI4. Siirtokuun Ended-rivi vanhalle ja Active/New-rivi uudelle työnantajalle
    eivät ole tuplarivejä. (ADR 0021 Q8)

## Vaihtoehdot, joita ei valittu

- **Viittaukset monthly-reportingin sääntödokumentteihin.** Hylätty: dokumentteja ei enää ylläpidetä ensisijaisena lähteenä.
- **Laskurivi vuokran vertailuarvona** (myös jälkiveloituskuukaudella CR:n lasku). Hylätty: jälkiveloitus hinnoitellaan
  sopimusriviltä, ja OOMI-pyörillä pyöräkohtaista laskuriviä ei ole.
- **`init_subs_rent_fee` = sopimusrivin hinta** (A2b). Hylätty: alkutieto, joka saa poiketa.
- **Raportoitu mutta laskuttamaton kuukausi virheenä.** Hylätty: raportointi saa jatkua laskutuksen katkettua.
- **Oomin laskujen tuloutuskausi** (A7). Pudotettu kertaluokkana: T58 on suljettu.

## Seuraukset

- `docs/poikkeamaraportointi-vaatimukset.md` § *Kuukausiraportointi (RI)* saa tarkistukset RI1–RI8.
- T65:n luokat A2–A5, A7, A10 ja A11 on käsitelty. A8 ja A9 kuuluvat CR:ien käsittelysääntöjen ADR:ään.
- monthly-reportingin `docs/rules/`-dokumentteihin merkitään, että ne ovat kehityksen aikaisia ja ensisijainen lähde on
  tämä repo (TASKS T70).
- B010533:n marraskuun 2026 rivi on kohdan 2 mukaan sallittu.
- RI8:n hyvitysehto edellyttää, että tyypin 11 CR:n kausi (`custrecord_cr_start_date`–`custrecord_cr_end_date`) kertoo
  hyvitetyt kuukaudet. Tämä todennetaan, kun kysely rakennetaan (`suiteql-rakentaja`). **Todennettu 26.10.2026**
  ([ADR 0023](0023-leasingmaksujen-hyvitykset-ja-lisaveloitukset.md)): käsittelijä tekee yhden rivin jakson jokaiselle kuukaudelle,
  ja hyvitysrivien tuloutuskaudet vastaavat sitä.
