# ADR 0027 — Käytetty huoltohyvitys kulutetaan huoltosummasta ja maksettava summa tallennetaan pyöräkortille

- **Päivämäärä:** 2026-11-17
- **Tila:** Hyväksytty (tuoteomistaja, grilling-istunto 16.–17.11.2026, K1–K8)
- **Koskee:** `netstuite-send-end-redemption-payment-link` (1479 ja `lib_gbb_redemption_price.js`),
  `netsuite-subscription-extension` (1437, `gbb_ext2_paatos.js`), `netsuite-bike-redemption-status-sync-rss2` (1480, `gbb_rss2_paatos.js`)
- **Kumoaa:** [kenttäsäännöt § 11](../lunastuksen-kenttasaannot.md#11-loppulunastushinnan-määräytyminen-ja-kattavuus):n
  periaatteen, ettei lunastuksen hyvitystä tallenneta rekisteriin. Ei kumoa ADR 0012/0014/0024/0026:n hyvityskaavaa.
- **Käsitteet:** [`CONTEXT.md`](../../CONTEXT.md) *Käytetty huoltohyvitys*, *Maksettava loppulunastussumma*
- **Toteutus:** TASKS T111 vaihe B; seuranta T112 (S10), jatko T113 (keskenkauden lunastus)

## Konteksti

T111 vaihe A (16.11.2026, PR #8) näyttää huoltohyvityksen Paylink-tilauksella *Hyvitys*-rivinä. Hubi näyttää käyttäjälle
huoltobudjetin suoraan `custrecord_sta_maintenance_sum`-kentästä (`GoByBike/src/utils/maintenanceBudget.ts:96`), joten
lunastuslinkissä vähennetty budjetti olisi yhä käytettävissä huoltoon: sama budjetti käytettäisiin kahdesti.

Kulutus huoltosummaan hävittää tiedon alkuperäisestä hyvityksestä. 1437 ja 1480 laskevat maksettavan summan uudelleen
1479:n kirjastolla nykyisestä huoltosummasta (`gbb_ext2_paatos.js:312`, `gbb_rss2_paatos.js:285`); ilman muuta tietoa ne
näkisivät kulutuksen jälkeen hyvityksen 0 ja vaatisivat liikaa jälkiveloituskuukausia.

## Päätös

1. **Kulutetaan vain linkissä vähennetty määrä.** Käytetty huoltohyvitys = min(huoltohyvitys, loppulunastushinta), netto.
   Uusi huoltosumma = vanha + käytetty. Negatiivisen summan ylijäämä jää asiakkaan huoltobudjetiksi. (K2, K4)
2. **Kirjataan lähetyshetkellä**, samassa kohdassa kuin `custrecord_gbb_eredem_link_sent` ja tapa 3. Peruttu lunastus
   palautetaan käsin, ei automaatiota. (K3)
3. **Koskee linkkiä ja tapaa 3.** Tapa 4, OOMI (hyvitys 0, ADR 0026) ja alle 0,65 €:n anteeksi annettu osuus eivät kuluta. (K4)
4. **Positiivinen summa nostetaan portaan ylärajaan kaikilla pyörillä, myös S10-pyörillä.** Staria-hookin mahdollisesti
   luomat aiheettomat pidennykset korjataan käsin (T112). (K5)
5. **Vain kauden lopun lunastus (1479).** Keskenkauden lunastus pysyy ADR 0024 K9:n mukaisena; työkalu on T113. (K6)
6. **Uusi kenttä `custrecord_gbb_eredem_payable_net`** (*Maksettava loppulunastussumma (netto)*, valuutta). 1479 kirjoittaa
   siihen aina loppulunastushinta − käytetty huoltohyvitys, myös tavalla 3 (minimin alittava osuus jää näkyviin, esim. 0,40;
   päätös 17.11.2026, jotta palautussääntö pitää aina), samassa kirjoituksessa kuin huoltosumman. Arvo ei muutu, vaikka
   lunastushintaa tai huoltosummaa myöhemmin korjattaisiin. (K7)
7. **Sääntö on yhdessä paikassa, kirjastossa.** `lib_gbb_redemption_price` ottaa valinnaisen maksettavan summan; jos se on
   annettu, se on `finalPriceNet` eikä hyvitystä lasketa uudelleen. 1437 ja 1480 lisäävät kentän kyselyynsä ja välittävät
   sen. Kirjasto ei hae NetSuitesta itse (pysyy puhtaana laskimena). (K8)

**Hylätyt:** käytetyn hyvityksen kenttä (kirjastoon olisi tarvittu uusi takaisinlisäyssääntö); maksettava summa
Paylink-tilaukselta (lukijat riippuisivat maksujen seurannasta); lunastushinnan ylikirjoitus (rikkoo IC-laskurin
`gbb_ic_redemption_price_mr.js:142` ja § 11:n totuuslähteen); kirjasto hakee kentän itse (haku per pyörä, epäpuhdas);
kulutus maksuhetkellä (tuplakäytön ikkuna Hubissa).

## Seuraukset

- **Käyttöönottojärjestys:** kenttä NetSuiteen, sitten kirjasto, 1437 ja 1480; 1479:n kirjoitus vasta sen jälkeen.
- Lukijat, joihin kulutus ei vaikuta (päätelty koodista): IC-laskuri (sama porras / sama ≤ 0 -haara), Hubi (näyttää halutun 0),
  cf-gbb-toolsin haku (näyttää lunastetulle 0), kuukausibudjettiskripti (vain OOMI).
- Brevon `kayttamaton_huoltobudjetti` lasketaan ennen kirjoitusta (ADR 0014 k. 24 ennallaan).
- **Riski (K5):** Staria-hook `sta_ue_bike_register_hook.js:1213` voi luoda pidennysrivit ja IC-laskun positiivisen summan
  kirjoituksessa; `ignoreTriggers`-esto todentamatta. Seuranta T112.
- **Käsin palautus:** huoltosumma −= (loppulunastushinta − `eredem_payable_net`), `eredem_payable_net` tyhjäksi.
