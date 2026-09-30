# CR-riski kuukausiajolle 1.10.2026 (tilanne 30.09.2026, päivällä)

> [!WARNING]
> **Korjaus 30.09. illalla:** tämän raportin hälytys B009498:n ja B010548:n (E1) "väärästä" siirrosta on **väärä hälytys**. Siirto-CR:n `official_end_date` + 1 vaihtaa raportoinnin työnantajan, ja `start_date` (1.11.) vaihtaa vain laskutuksen. CR:t 6859 ja 6862 sekä RI-rivit 118074–118077 ovat oikein, ja 29.09. suunnitelma oletti suunnan väärin päin. Ks. [`2026-09-30-kuukausiajo-rekisteri-riski.md` § 6](2026-09-30-kuukausiajo-rekisteri-riski.md).


Rajaus: Pending/Error/Needs Review kokonaan; Done-CR:t luotu tai suljettu 1.9. alkaen. Vain lukua NetSuiteen.
Ei toisteta `docs/kuukausiajo-2026-10-suunnitelma.md`:n todentamaa.

## Jono (todennettu)
| Tyyppi | Tila | kpl | Huom. |
|---|---|---|---|
| 2 | Pending | 2 | CR 6869 (B017830), 6871 (B046753); luotu 30.09.; nimet `- vakuutus`, official_end 30.09.2026 |
| 11 | Pending | 2 | CR 6870, 6872; jakso 01.10.-31.10. (hyvitys, vakuutus) |
| 10 | Pending | 1 | CR 4692 (B023888), ei kuulu erään; tunnettu |
| 13 | Error | 4 | 4652 (bike 39986, ei aktiivisia rivejä), 6699/6703/6705 (asiakas 57940484411 puuttuu); tunnettu |
| 7 | Pending/Error/NR | 0 | ei OOMI-riskiä (kohta 4 = 0); Needs Review = 0 |

## E1 (todennettu, poikkeaa suunnitelmasta)
B009498 ja B010548:lle EI ole luotu suunnitelman mukaista tyypin 1 CR:ää (alku 01.10., vanhan loppu 30.09.).
Sen sijaan luotu 30.09. klo 08:24-08:27 "2A"-paketit, kaikki Done klo 10:01-10:02:
- B009498: CR 6859 tyyppi 1 (next_billto 2017, **start 01.11., old_end 31.10.**), 6860 hyvitys 11 (asiakas 5323, jakso alkaen 01.06.), 6861 jälkiveloitus 7 (asiakas 2017). Altname `Notion- - 2A` (Notion-numero puuttuu).
- B010548: CR 6862 tyyppi 1 (next_billto 147782, start 01.11., old_end 31.10.), 6863 hyvitys (4622, alkaen 01.09.), 6864 jälkiveloitus (147782). Altname `Notion-488 - 2A`.
- Rekisterin contract_employer nyt 2017 / 147782. Item 30 -rivit lokakuulle yhä vanhalla asiakkaalla: rivi 50399 (5323) ja 49472 (4622) päättyvät 31.10.; klooni uudelle alkaa 01.11. (rivit 116424, 116426).
- UE on jo luonut lokakuun RI-rivit (reporting_date 01.10.): 118074 Ended (emp 5323) + 118075 Active/New (emp 2017); 118076 Ended (4622) + 118077 Active/New (147782). Siirtorivit kirjattu lokakuulle vaikka CR:n siirto on 01.11.
- Riski (PÄÄTELTY): rekisterin työnantaja (2017/147782) != lokakuun item 30 -rivin asiakas (5323/4622) -> ri_creation voi tehdä Warningin tai toisen rivin (vrt. suunnitelman luokka c); lisäksi RI-rivit ovat kuukautta etuajassa. Kumpi työnantaja lokakuussa on oikea (vanha rivi vs. rekisteri) vaatii ihmisen päätöksen.

## Done-CR:t 1.9. alkaen, RI-seuraus (todennettu)
| Tyyppi | Done | ilman RI | Arvio |
|---|---|---|---|
| 1 | 16 | 0 | ok (2 riviä/CR) |
| 2 | 258 | 0 | ok; 6226 ja 6484:llä lisäksi Deleted-rivejä |
| 3 | 5 | 0 | ok (Paused-rivejä useita = kuukaudet) |
| 7 | 125 | 49 | 49 = ei-pidennys (jälkiveloitus), RI:tä ei odoteta; kaikilla `pidennys`-nimisillä RI |
| 9 | 33 | 0 | ok |
| 11 | 272 | 272 | odotettu, ei laukaise |
| 13 | 33 | 0 | ok |
- Tuplat samalla CR:llä + statuksella: 5 CR:ää, kaikki tyypin 3 Paused (6694, 6695, 6697, 6728, 6732) = monta kuukautta, odotettu.
- `[To-add: ...]`-rivejä (aktiiviset, päiväys >= 1.9.): 0. CR-linkitettyjä Warning-rivejä: 2, molemmat testipyörä B017530 (CR 6831, 6837).

## Nimireititys (todennettu)
- Tyyppi 2: ~81 Done-CR:ää (id >= 6147, esim. 6147, 6184-6269) ei sisällä vakuutus/2b/2c/2d, mutta RI-rivi on silti olemassa (80 Ended, 1 Deleted) -> ei hiljaista epäonnistumista tällä otannalla. Pending-tyypin 2 nimet ok.
- Tyyppi 7: `Pidennys` isolla (väärä kirjainkoko): 0. Pidennys-CR:t: kaikki RI:llä.

## Tänä yönä käsiteltävät Pending-CR:t (PÄÄTELTY)
6869/6871 (vakuutus, official_end 30.09.) käsitellään 1.10. ~00:37 ennen ri_creationia -> UE luo Ended-rivin, ja ri_creation voi luoda toisen (tupla-Ended kuten B008217, B045099, B018137). Tarkista Q3:ssa. Tyypin 11 CR:t 6870/6872 (lokakuu): tarkista että lokakuu on laskutushistoriassa (L4) ennen ajoa; en tarkistanut.

## Todennettu vs. päätelty
Todennettu: kaikki luvut, CR-/RI-/rivi-id:t yllä. Päätelty: ri_creationin käytös E1-pyörille, tupla-Ended-riski, CR:ien käsittelyjärjestys.
