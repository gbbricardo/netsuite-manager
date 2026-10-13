# ADR 0019 — Extension 2.0: ei kiinnikurontaa, avoin CR estää, maksutodiste kuten 1480:ssä

- **Päivämäärä:** 2026-10-13
- **Tila:** Hyväksytty (tuoteomistaja, grilling-istunto 13.10.2026, kysymykset Q1–Q10)
- **Koskee:** `netsuite-subscription-extension` (script 1437, uudelleenkirjoitus)
- **Muuttaa:** [extension-2-vaatimukset.md](../extension-2-vaatimukset.md) § *Päätökset avoimiin kysymyksiin* kohdat 2 ja 3
  (tuoteomistaja 9.10.2026) sekä saman dokumentin 12.10. yhtenäistyksen kohdat 2–3
- **Tarkentaa:** [ADR 0009](0009-kauden-lopun-lunastus.md) k. 2 (määräaika), [ADR 0015](0015-status-sync-2-tarkennukset.md) k. 8
  (myöhästynyt maksu)
- **Käsitteet:** [CONTEXT.md](../../CONTEXT.md) § *Velvoitteet hoidettu* (armonaika), *Kauden lopun lunastus*, *Jälkiveloitus*

## Konteksti

Tuoteomistaja päätti 9.10., että ajamatta jäänyt kuukausi kirii kiinni: yksi CR kattaa kaikki laskuttamattomat
kuukaudet (esim. 1.10.–31.12.). Grillauksessa 13.10. kävi ilmi, että päätös on ristiriidassa kattavuussäännön kanssa.
Status-sync 2.0 (1480) laskee tavan 2 kattavuuden Done-tilaisten pidennys-CR:ien **lukumääränä**
(`gbb_mr_redemption_sync2.js:142–146`, ADR 0015 k. 5), ja sanaston mukaan *yksi muutospyyntö on yksi kuukausi*. Kolmen
kuukauden CR olisi kattavuudessa yksi kuukausi. ADR 0012 oli varautunut tähän: *"jos `handler_jalki` alkaa laskuttaa
useita kuukausia yhdellä laskulla, kohta 5 avataan uudelleen."*

Kiinnikuronnan korjaaminen usealla CR:llä olisi tuonut uusia ongelmia. CR-prosessorin `cr_scheduler.js` ei järjestä
CR:iä, ja `handler_jalki` kirjoittaa jokaisen CR:n `official_end_date`:n pyörän `subsc_end_date`:ksi. Käsittelyjärjestys
ratkaisisi siis päättymispäivän. Lisäksi erän luonnin pitäisi olla "kaikki tai ei mitään", ja kuukausimäärä pitäisi
rajata kattavuuden mukaan.

## Päätökset

1. **Ei kiinnikurontaa.** Yksi ajo luo pyörälle enintään yhden pidennys-CR:n, ja se kattaa aina kuluvan Helsingin
   kuukauden (1. – viimeinen päivä). `official_end_date` = CR:n `end_date`. CR luodaan vain pyörälle, jonka
   `subsc_end_date` on edellisen kuun viimeinen päivä. (Q5, Q6)
2. **Pyörä, joka tarvitsisi kiinnikurontaa, on virhe.** Jos `subsc_end_date` on ennen edellisen kuun 1. päivää, skripti
   kirjaa `log.error`-rivin `MISSED_MONTHS <pyörä>` (`subsc_end_date`, `puuttuvia_kk`) ja laskurin. Se ei luo CR:ää, Error-tilaista CR:ää eikä mitään
   muuta tietuetta. Ehto arvioidaan **viimeisenä**, kaikkien ohitusehtojen jälkeen, joten virhe tarkoittaa aina pyörää,
   joka olisi muuten jälkiveloitettu. Ihminen ratkaisee pyörän. (Q8, Q9)
3. **Avoin pidennys-CR estää kaudesta riippumatta.** Pending-, In Progress-, Error- tai Needs Review -tilainen (tai tilaton) pidennys-CR millä
   tahansa kaudella estää uuden CR:n. Done estää, jos sen `end_date` ≥ kuluvan kuun 1. päivä. Ilman tätä käsittelemätön
   lokakuun CR (pyörän `subsc_end_date` yhä 30.9.) jäisi marraskuun ajossa huomaamatta, ja lokakuu laskutettaisiin
   kahdesti. (Q2)
4. **Päättymispäivä, joka ei ole kuun viimeinen päivä,** on virhe `END_NOT_MONTH_END`, eikä CR:ää luoda. Mittausten mukaan
   tapauksia ei pitäisi olla, koska vain OOMI-pyörät päättyvät kesken kuun (ADR 0009). (Q10)
5. **Maksutodiste (ehto 6) on SQL:ssä** status-sync 2.0:n määrittelyillä `PAYLINK_EVIDENCE` ja `INVOICE_EVIDENCE`
   muuttamattomina. Vanhan skriptin tuotenimeen perustuva varahaku poistuu. Ehto on puolustus siltä varalta, että 1480
   ei ole kirjannut tapaa 1. (Q7)
6. **Error-tilainen tyypin 2 tai 10 CR estää** jälkiveloituksen, kuten maksulinkissä (ADR 0014 k. 3), vaikka se ei
   sanaston mukaan tee lunastuksesta ennenaikaista. Ihminen ratkaisee CR:n ensin. (Q4)
7. **Armonaika on tietoinen.** Jälkiveloitus todetaan seuraavan kuun 10. päivänä. Jos velvoitteet hoidetaan sitä ennen,
   CR:ää ei luoda, ja sopimus päättyy alkuperäisessä päättymiskuussaan. Tämä tarkentaa ADR 0009 k. 2:ta (*"seuraavan kuun
   1. päivänä alkaa jälkiveloitus"*) ja ADR 0015 k. 8:aa. (Q3)

## Vaihtoehdot, joita ei valittu

- **Yksi CR, joka kattaa kaikki puuttuvat kuukaudet** (9.10. päätös 3). Hylätty: 1480 laskee sen yhdeksi kuukaudeksi,
  ja tapa 2 viivästyy.
- **Yksi CR per puuttuva kuukausi.** Hylätty: käsittelyjärjestys, erän atomisuus ja kattavuusrajaus tekisivät skriptistä
  monimutkaisen harvinaisen tapauksen takia. Linja on sama kuin ADR 0014:ssä: yksinkertainen skripti.
- **1480 laskee kuukaudet CR:n alku- ja loppupäivän väliltä.** Hylätty: vaatisi muutoksen tuotannossa olevaan
  skriptiin ja ADR 0015:een.
- **Error-tilainen CR virheen merkkinä** lokirivin sijaan. Hylätty: se olisi CR, jota kukaan ei pyytänyt, ja se laskettaisiin
  päätöksen 3 mukaan estäväksi.

## Seuraukset

- **Ajamatta jäänyt kuukausi on käsityötä.** Jos 10. päivän ajo epäonnistuu, se on ajettava uudelleen saman kuun aikana.
  Muuten seuraavan kuun ajossa jokainen kyseisen kuun pyörä saa `MISSED_MONTHS`-rivin.
- Kunnes raportointi (T51, ADR 0017) on olemassa, `MISSED_MONTHS`- ja `END_NOT_MONTH_END`-rivit luetaan käsin `scriptnote`-taulusta.
- ADR 0012:n kohta 5 (*yksi CR = yksi kuukausi*) pysyy voimassa, eikä 1480:aan tarvita muutosta.
- Vaatimusmäärittelyn testit T10b ja T15 muuttuvat, ja uudet testit T10f ja T10g lisätään.
