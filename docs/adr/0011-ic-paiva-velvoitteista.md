# ADR 0011 — IC-päivä velvoitteista, ei statuksesta, ja se seuraa lähtötietoja IC-käsittelyyn asti

- **Päivämäärä:** 2026-10-06
- **Tila:** Hyväksytty (käyttäjä, grilling-istunto 6.10.2026)
- **Koskee:** [`lunastuksen-kenttasaannot.md`](../lunastuksen-kenttasaannot.md) § 4 ja § `ic_redemption_dt`,
  [`status-sync-2-tasmaytysajo.md`](../status-sync-2-tasmaytysajo.md) vaihe 3, haku 797, `netsuite-ic-calculators`
- **Ratkaisee:** status-sync 2.0:n D1 sekä D7:n kaksi avointa kohtaa (ehto ja tapa 8)
- **Tarkennettu:** [ADR 0015](0015-status-sync-2-tarkennukset.md) (7.10.2026). *Velvoitteet hoidettu* = selvitystapa
  asetettu. Pelkkä `paid_at` ei riitä. IC-laskurille ei tehdä varmistusajastusta (T42).

## Konteksti

Taloustiimi IC-lunastaa pyörät haun 797 listalta kuun toiseksi viimeisenä arkipäivänä. Listalle
pyörän nostaa `custrecord_gbb_ic_redemption_dt`. IC-laskuri lukee vain sen, eikä mitään muuta
(status, selvitystapa, CR), ja laskee `ic_redemption_pr`:n. Syyskuussa IC-päivät täytettiin käsin
CSV:llä, ja 325 pyörää jäi silti ilman päivää ([löydös](../../findings/2026-09-30-t5-ic-paiva-puuttuu.md)).

Aiempi sääntö oli tämä: IC-päivä kirjoitetaan, kun pyörä on status 2/3, kerran ja vain IC-myydyille.
Kolme ongelmaa:

- Keskenkauden lunastuksessa velvoitteet on hoidettu CR:n luontipäivänä, mutta status kääntyy vasta
  tunnistuspäivänä, joskus kuukausia myöhemmin. Taloustiimi ei näe pyörää, vaikka se voidaan jo
  lunastaa rahoittajalta.
- Kerran kirjoitettu päivä jää vääräksi, kun päättymisajankohta siirtyy myöhemmin (rivikatkaisu,
  jälkiveloitus, K4-tyyppinen selvitystavan tyhjennys). 30.09. löytyi 11 tällaista pyörää.
- IC-myynnin rajaus siirsi automaatioon päätöksen, joka kuuluu taloustiimille.

## Päätös

1. **Automaatio määrittää vain, milloin IC-lunastuksen voi tehdä.** Se ei päätä, tehdäänkö se.
   Taloustiimi päättää, mitkä pyörät, minkä kuun pyörät ja mitkä takautuvat lunastetaan. Tähän
   tarvittavat tiedot ovat NetSuitessa.
2. **IC-päivä kirjoitetaan, kun velvoitteet on hoidettu** (`onkoVelvoitteetHoidettu`), ei kun status on
   2/3. Arvo on aina `LAST_DAY(päättymisajankohta)`. Se kirjoitetaan heti, myös tulevaisuuteen
   osoittavana. Tapa 8 (`historical_unknown`) on hoidettu velvoite, ja se saa IC-päivän.
3. **IC-myynti ei ole ehto.** Jos IC-lunastushintaa ei voida laskea (esimerkiksi koska IC-myyntiä ei
   ole), hinta on `-1`. Myös `-1` on laskettu hinta.
4. **IC-lunastettavissa = velvoitteet hoidettu ∧ IC-päivä asetettu ∧ hinta asetettu (myös `-1`) ∧
   `ic_redemption_done` ≠ T.** Haku 797 näyttää täsmälleen nämä, ja kustakin hinnan, IC-päivän ja
   done-tiedon. Tuleva IC-päivä ei estä listalle nousua. Taloustiimi rajaa kuukauden itse
   (lähtökohtaisesti kuluva ja aiemmin lunastamatta jääneet, ei tulevia).
5. **Hinta on laskettu, kun pyörä nousee listalle.** Status-sync 2.0 käynnistää IC-laskurin ajonsa
   lopuksi (D4). Hakuehto (kohta 4) piilottaa välitilan, jossa päivä on jo kirjoitettu mutta hintaa
   ei vielä ole.
6. **Ennen IC-käsittelyä IC-päivä seuraa lähtötietoja.** Jos päättymisajankohta muuttuu tai velvoitteet
   eivät enää ole hoidettu, IC-päivä ja hinta tyhjennetään, ja pyörä poistuu listalta. Se palaa
   automaattisesti uusilla arvoilla, kun ehdot täyttyvät. Tämä korvaa aiemman write-once-säännön.
7. **IC-käsittelyn jälkeen mitään ei muuteta.** Kun `ic_redemption_done` = T, IC-päivä ja hinta ovat
   lopullisia. Done-merkinnän tekee taloustiimi käsin.
8. **Käyttöönotto kerralla.** Status-sync 2.0:n ensimmäinen ajo käsittelee kaikki pyörät, joiden
   velvoitteet on hoidettu ja joita ei ole IC-käsitelty. Säännöstä poikkeavat olemassa olevat
   IC-päivät korjataan kohdan 6 mukaisesti.

## Hylätyt vaihtoehdot

- **Status 2/3 laukaisijana** (aiempi sääntö). Se pitää listan puhtaana CR:istä, joita voidaan vielä
  perua, mutta piilottaa keskenkauden lunastukset kuukausiksi. Peruutus hoidetaan nyt kohdalla 6.
- **IC-lunastettavissa vasta IC-päivän kuussa.** Hylätty, koska kuukauden valinta kuuluu taloustiimille.
- **Write-once.** Hylätty, koska väärä päivä ei korjautuisi koskaan ilman käsityötä.

## Seuraukset

- Tilakone (§ 4) ei enää ole lineaarinen: IC-lunastettavissa voi alkaa jo tilassa *Lunastus sovittu*
  (status 1). Status-sync 2.0:n tarkistus *status 1, mutta IC-päivä asetettu* ei siksi enää ole poikkeama.
  *Status 1, mutta done = T* on yhä poikkeama.
- Status-sync 2.0 tarvitsee tyhjennyslogiikan (kohta 6). Kirjoituksia tulee myös pyörille, joita ei
  käännetä.
- IC-laskuri kirjoittaa jo nyt `-1`:n, kun kustannuslähdettä ei ole, joten laskuriin ei tarvita
  muutosta. Hinnan tyhjentäminen riittää uudelleenlaskentaan, koska laskuri suodattaa
  `ic_redemption_pr IS NULL`.
- Avoin, ei päätetty: laskurin päivittäinen ajastus varmistukseksi, jos status-sync 2.0:n käynnistys
  epäonnistuu, sekä esiajon CSV taloustiimille ennen ensimmäistä ajoa.
