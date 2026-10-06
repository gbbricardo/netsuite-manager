# Kauppakirjan lähetys: nykytila vs ADR 0013 (6.10.2026)

**Omistava repo:** `netsuite-send-bill-of-sale-pdf` (`gbb-mr-send-bill-of-sale-pdf.js`, haku 793) ja
`netsuite-br-lease-fees-check` (`mr_lease_fees_check_v2.js`, haku 796). Tavoitetila: [ADR 0013](../docs/adr/0013-kauppakirjan-lahetys.md).
Tämä repo ei korjaa mitään. Korjaukset tehdään omistavissa repoissa erillisessä istunnossa.

## Miten lähetys toimii nyt

| Väite | Lähde | Todennettu? |
|---|---|---|
| Skriptissä ei ole kelpoisuussääntöä, vaan kaikki ehdot ovat haussa 793 | `gbb-mr-send-bill-of-sale-pdf.js:108-111` | koodi |
| Haun 793 ehtoja ei saa SuiteQL:llä (`Record 'savedsearch' was not found`, ns_getRecord 404) | MCP-kysely 6.10. | NetSuite |
| Ehto on käytännössä status 2 + kielto F + *kaikki vuokrat maksettu* T. Kesä–lokakuun ei-OOMI-kohorteissa jako on täysin puhdas | kenttäjakaumat | **päätelty** |
| Haku 796 asettaa lipun vain, kun pyörällä on *Paid In Full* lunastus-SO (*Mid-contract* tai *End redemption*) ja päättymispäivä on alle 24 päivän päässä | `../netsuite-br-lease-fees-check/lease_fees_check_solution_v2.md` §3.1 | dokumentti |
| Lippu *kaikki vuokrat maksettu* ei palaa koskaan F:ksi | `mr_lease_fees_check_v2.js` | koodi |
| PDF:n omistuspäivä on hakukaava *Today*, ei lunastus- eikä päättymispäivä | suunnitteludokumentti §3.1.3 | dokumentti |
| 1433 on Scheduled. v4.0 (1431) on Not Scheduled, eikä sillä ole lokirivejä elokuun jälkeen | `scriptdeployment`, `scriptnote` | NetSuite |
| 1.10. lähti 806 kauppakirjaa (yksi `PDF date fields` -rivi per lähetys). Muina päivinä rivejä oli 1–16 | `scriptnote`, scripttype 1433 | NetSuite |

## Poikkeamat tavoitteesta

Kaikki luvut on todennettu NetSuitesta 6.10.2026 (sent = T yhteensä 11 227).

| # | ADR 0013 | Nykytila | Pyöriä |
|---|---|---|---|
| N1 | Ehtona velvoitteet hoidettu, ei SO (k. 6) | Kauppakirja vaatii maksetun SO:n. 120 OOMI- ja 176 ei-OOMI-pyörää (status 2, hoidettu, ei SO:ta) ei saa kauppakirjaa koskaan. OOMI-pyörät ovat ADR 0013 k. 8:n mukaan oikein ilman maksua, joten ei-OOMI 176 on varsinainen poikkeama | 176 (+120 tarkistettava maksun osalta) |
| N2 | Odotetaan päättymisajankohtaa (k. 3) | Ei odoteta: 3 lokakuussa päättyvää OOMI-pyörää on jo saanut kauppakirjan | 3 |
| N3 | Tavat 5–7 suljetaan pois (k. 1) | B045683 on status 3 ja sai kauppakirjan. Tapa 7: 1 pyörä | 2 |
| N4 | Tapa 8 vain asiakaspalvelun päätöksellä (k. 2) | 96 OOMI-pyörää, tapa 8, sai kauppakirjan | 96 |
| N5 | OOMI vain työntekijän maksulla (k. 8) | 601 OOMI-pyörää, tapa 1, sai kauppakirjan. Maksun olemassaoloa ei ole tarkistettu | 601 (tarkistettava) |
| N6 | Esto pitää (k. 10) | B004255 sai kauppakirjan, vaikka kieltolippu on T | 1 |
| N7 | Estolla on syy (k. 10) | Kieltolippu on 15 pyörällä, joista yhdelläkään ei ole syytä. 3 on Active (B014327, B031661, B036155) | 15 |
| N8 | Vuokrat tarkistetaan (k. 4) | Ennen 25.06.2026 lähti 6 916 kauppakirjaa ilman lippua. ADR 0013:n mukaan niitä ei käydä läpi takautuvasti | 6 916 |

N3, N4 (jos selvitystapa osoittautuu 5–7:ksi), N5 (jos maksua ei ole) ja N6 ovat ADR 0013 k. 12:n
mukaan **virheellisesti lähetettyjä**. Ne raportoidaan asiakaspalvelulle.

## Avoimet

- Haun 793 tarkat ehdot on luettava NetSuiten käyttöliittymästä, koska SuiteQL ei näe niitä.
- Hinta PDF:ssä tulee liitoksesta *Transaction (Bike ID) : Amount*. Jos liitoksessa ei ole main line- ja
  SO-tyyppiehtoa, se voi osua myös laskuun tai ostolaskuun. Asia on päätelty eikä todennettu.
