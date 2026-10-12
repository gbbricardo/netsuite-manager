# ADR 0017 — Poikkeamaraportointi: sääntöpohjainen, vain ilmoittava, yhteinen vastuu

- **Päivämäärä:** 2026-10-12
- **Tila:** Hyväksytty (tuoteomistaja, grilling-istunto 9.–12.10.2026, Q1–Q28)
- **Koskee:** tuleva raportointitoteutus (repo ja tekniikka avoinna). cf-gbb-toolsin NetSuite Alerts -näkymä vain kohdan 5 osalta.
- **Tarkentaa:** [ADR 0014](0014-maksulinkin-korjaus-ja-yksinkertaistus.md) k. 10 ja [ADR 0015](0015-status-sync-2-tarkennukset.md) k. 1
  (toiminnalliset skriptit eivät raportoi; raportointi on erillinen)
- **Käsitteet:** [CONTEXT.md](../../CONTEXT.md) § *Poikkeamaraportoinnin käsitteet*
- **Vaatimukset:** [`docs/poikkeamaraportointi-vaatimukset.md`](../poikkeamaraportointi-vaatimukset.md) (periaatteet P1–P19,
  ajokalenteri, tarkistusluettelo)

## Konteksti

Syys- ja lokakuussa 2026 tämä projekti löysi NetSuitesta toistuvasti sääntöjen vastaisia tietueita ja korjasi ne
käsin ajetuilla import-tiedostoilla (19 import-kansiota). Viidellätoista niistä virheen tuottaja on yhä käynnissä:
Fleet-CSV, käsin kopioidut CR:t, ri_update, manuaaliset Paylink-tilaukset, siirrot ilman verovapausautomaatiota.
Virheet havaittiin vasta, kun joku sattui katsomaan, usein kuukausiajon jälkeen.

Toiminnalliset skriptit on tarkoituksella riisuttu raportoinnista (ADR 0014, ADR 0015). Sen tilalle tarvitaan
päivittäinen tarkistus, joka nostaa poikkeamat esiin ennen kuin ne aiheuttavat väärän laskun, palkkapidätyksen
tai kirjanpidon.

## Päätökset

1. **Sisältö on kanavasta riippumaton.** Raportti määritellään tarkistuksina ja poikkeamina. Sama sisältö
   esitetään sekä näkymänä että sähköpostina. (Q1)
2. **Ei tarkistusta ilman kirjattua sääntöä.** Jokainen tarkistus viittaa ADR:n kohtaan tai sääntödokumentin
   pykälään. Työohje, TASKS-merkintä tai löydös ei riitä. Jos sääntö puuttuu, kirjoitetaan ADR ensin (T65). (Q3, Q10, Q24)
3. **Raportti vain ilmoittaa.** Se ei kirjoita NetSuiteen eikä tarjoa korjaus-CSV:tä, vaikka oikea arvo olisi
   johdettavissa säännöstä. Ihminen korjaa oikeaa reittiä pitkin. (Q6)
4. **Ei omistajia.** Kaikki käyttäjät vastaavat kaikista poikkeamista yhtä lailla. Kaikki näkyy kaikille, myös
   kuittaukset: kuka, milloin, miksi ja mihin päätökseen vedoten. (Q7)
5. **Erillinen näkymä.** Raportointi ei laajenna eikä ime NetSuite Alerts -näkymää. Alertsin omat tarkistukset jäävät
   sinne, ja raportissa on niistä vain määrärivi ja linkki. (Q12, Q14)
6. **Tila, ei loki.** Tarkistukset lukevat tietueiden nykytilaa. Ainoa poikkeus on ajovahti, joka toteaa
   ajokalenterin mukaisen ajon puuttumisen. (Q19, Q26)
7. **Kuittaus vaatii jäljitettävän viitteen**: ADR, sääntöpykälä, TASKS-tunniste tai TASKSiin kirjattu
   pyöräkohtainen päätös. Kuittaus raukeaa, kun tarkistuksen lukemat tiedot muuttuvat. (Q9, Q27)

## Hylätyt vaihtoehdot

- **Omistajaroolit tarkistuksittain** (lunastukset, talous, asiakaspalvelu, kuukausiraportointi). Hylätty: tiimi on
  pieni, ja roolijako jättäisi poikkeaman katveeseen, kun roolin haltija on poissa. Läpinäkyvyys korvaa vastuunjaon.
- **Korjaus-CSV raportista.** Hylätty: automaattisesti johdettu korjaus ohittaisi harkinnan juuri niissä tapauksissa,
  joissa sääntö ja todellisuus eroavat (sallitut poikkeamat, pyöräkohtaiset päätökset).
- **Tarkistus ilman sääntöä, kokemukseen nojaten.** Hylätty: raportista tulisi mielipidelista, eikä kukaan voisi
  sanoa, onko rivi virhe.
- **Vakavuus- tai vaikutusluokka.** Hylätty (Q13). Järjestys tulee määräajasta ja iästä.
- **Pelkkä näkymä ilman sähköpostia** (T51:n linjaus 9.10. aamulla). Hylätty: näkymä, jota kukaan ei avaa, ei ole
  päivittäinen tarkistus.

## Seuraukset

- Raportin kattavuus seuraa sääntödokumentaation kattavuutta. Tunnetut aukot ovat T65:ssä (A1–A11), ja niistä
  osa koskee kuukausiraportointia, jolla ei vielä ole yhtään tarkistusta.
- Raportti tarvitsee pysyvän tallennuksen (ensihavainto, kuittaukset) ja ajastuksen klo 7:00. cf-gbb-toolsissa ei
  9.10.2026 ollut kumpaakaan (ei cronia, ei D1:tä, ei sähköpostia).
- Kun säännöt muuttuvat ADR:llä, myös tarkistus muuttuu. ADR:n *Seuraukset*-osioon kirjataan jatkossa, mitä
  tarkistuksia päätös koskee.
