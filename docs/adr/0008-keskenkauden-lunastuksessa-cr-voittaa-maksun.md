# ADR 0008 — Keskenkauden lunastuksessa muutospyynnön vastuukirjaus voittaa maksutodisteen

- **Päivämäärä:** 2026-09-23
- **Tila:** Hyväksytty (tuoteomistaja)
- **Täydennetty:** [ADR 0010](0010-keskenkauden-lunastus.md) (24.09.2026): CR yksin riittää todisteeksi, päätöspäivä = CR:n luontipäivä, Needs Review -ehdot ja poikkeuskentistä luopuminen
- **Koskee:** vain **keskenkauden lunastusta** (CR-tyyppi 2 *Keskenkauden lunastus*).
  Kauden lopun lunastus ei muutu.
- **Muuttaa:** [kenttäsäännöt](../lunastuksen-kenttasaannot.md) § `custrecord_gbb_liab_settled_at`
  (*"aikaisin todiste"*), § 5 -mittari, [ADR 0007](0007-status-sync-2-tasmaytysajo.md) vaihe 1
- **Kumoaa löydöksen:** [`2026-09-23-handler-lunastus-rikkoo-pykala-5-kun-maksu-on-aiempi.md`](../../findings/2026-09-23-handler-lunastus-rikkoo-pykala-5-kun-maksu-on-aiempi.md)
  — kuvattu tilanne ei ole virhe

## Päätös (tuoteomistaja 23.09.2026)

> Muutospyynnön kautta tullut vastuukirjaus on tärkeämpi kuin maksutodistus. Erityisesti kun
> kyseessä on keskenkauden lunastus: mikäli maksu kirjautuu NetSuitessa ennen kuin muutospyyntö on
> käsitelty, se on ok, mutta se ei ole virhe. Muutospyynnöltä tulleet tiedot ovat yhtä oleelliset.
> Lisäksi pelkkä maksun kirjaus ei saa olla riittävä todiste laskutuksen ja kuukausiraportoinnin
> päättämiseen ilman muutospyyntöä.
>
> *Tarkennus:* kyse on vain keskenkauden lunastuksista.

### Säännöt

| # | Sääntö | Kauden lopun lunastus |
|---|---|---|
| 1 | **Selvitystapa ja `liab_settled_at` tulevat muutospyynnöltä**: tapa CR:n nimestä ja `liab_settled_at` = `custrecord_cr_created_date`. Ne ohittavat maksusta johdetut arvot | ennallaan: maksu → tapa 1, `liab_settled_at` = maksupäivä |
| 2 | **Maksu ennen CR:n käsittelyä on normaali järjestys, ei virhe.** `redemption_paid_at` kirjataan maksupäivästä kuten ennenkin. Se on maksun fakta, ei vastuukirjaus | ennallaan |
| 3 | **Pelkkä maksu ei riitä** päättämään laskutusta eikä kuukausiraportointia. Vaaditaan tyypin 2 CR | maksu riittää |

Kauden lopun lunastuksessa CR:ää ei tavallisesti ole lainkaan. Mitattu 23.09.: 21.09. jälkeen
statukselle 2 tavalla 1 kääntyneistä **687/687** kauden lopun lunastuksesta ei ole tyypin 2
CR:ää, kun taas keskenkauden lunastuksista **32/33**:lla on. Siksi sääntö 3 ei voi koskea kauden
loppua.

## Mitä tämä muuttaa

### Kenttäsäännöt § `liab_settled_at`

*"Arvoksi kirjataan aikaisin todiste"* ja *"tavalla 1 kentän on oltava identtinen `paid_at`:n
kanssa"* koskevat **vain kauden lopun lunastusta**. Keskenkauden lunastuksessa arvo on CR:n
luontipäivä, vaikka maksu olisi aiempi.

**§5-mittari** (`paid_at <> liab_settled_at` tavalla 1, 54 kpl 23.09.) on määriteltävä uudelleen
niin, että pyörät, joilla on Done-tilainen tyypin 2 CR, jäävät pois. Mitattua lukua ei voi enää
lukea virhemääränä. B025325 ei ole rikkomus. Myöskään 140 Redeemed-pyörää, joilla maksu on
aiempi kuin `liab_settled_at` ([löydös](../../findings/2026-09-23-status-sync-maksuikkuna-hukkaa-myohaiset-maksut.md)),
eivät ole virheitä siltä osin kuin niillä on tyypin 2 CR.

### `handler_lunastus.js` — CR:n on voitettava, nyt se häviää

Handler kirjoittaa tavan ja `liab_settled_at`:n **vain tyhjään kenttään** (write-once,
`addLiabilitySettlementFields`). Jos maksupolku ehti ensin, CR:n tiedot hylätään:

- `liab_settled_at` jää maksupäiväksi eikä saa CR:n luontipäivää
- tapa jää arvoon 1, vaikka CR:n nimi määräisi muun. Esimerkiksi `" - 2B"` → 6 (vakuutus) katoaa

Tämä on ristiriidassa säännön 1 kanssa. **Vaatimus omistavalle repolle**
(`netsuite-subscrption-cr-scripts`): tyypin 2 CR kirjoittaa tavan ja `liab_settled_at`:n aina.
Ainoa poikkeus on arvo, joka on peräisin **aiemmasta tyypin 2 CR:stä**. Maksusta johdettu arvo on
ylikirjoitettava. Toteutustapa on repon päätös. Yksi vaihtoehto: ylikirjoita, jos pyörällä ei ole
muuta Done-tilaista tyypin 2 CR:ää.

### Maksupolku (nykyinen status-sync osa A ja ADR 0007 vaihe 1)

Nykyinen osa A kirjoittaa maksusta tavan 1 **jokaiselle** maksulle. Keskenkauden lunastuksessa se
estää nykyisellä handlerilla CR:n tavan (ks. yllä).

**ADR 0007 vaihe 1 muuttuu:**

| Tilanne maksun havaitsemishetkellä | Vaihe 1 kirjoittaa |
|---|---|
| Kauden lopun lunastus | `paid_at`, tapa 1, `liab_settled_at` = maksupäivä (ennallaan) |
| Keskenkauden lunastus, CR:ää ei vielä käsitelty | **vain `paid_at`**. Tapa ja `liab_settled_at` tulevat CR:ltä |
| Keskenkauden lunastus, CR on jo käsitelty | vain `paid_at`, jos se puuttuu. CR:n arvoihin ei kosketa |

> **D7 ratkaistu 24.09.2026** ([ADR 0009](0009-kauden-lopun-lunastus.md) kohta 4): vaihtoehto 3.
> Tapa ja `liab_settled_at` kirjoitetaan vasta päättymiskuussa ja vain ilman tyypin 2/10 CR:ää.

**D7 (ratkaistu, alkuperäinen kysymys):** miten maksuhetkellä tunnistetaan, onko lunastus keskenkauden? Ennen CR:ää
päättymisajankohta on vielä alkuperäinen, joten päivämäärät eivät kerro sitä, eikä SO-tyyppi ole
luotettava. Syyskuun korjauslistan pyörät, joiden kausi päättyy 2027–2029, ovat Paylinkissä
SO-tyyppiä 4 (*End redemption*). Ehdokkaita:

1. *Päättymisajankohdan kuukausi on myöhempi kuin maksukuukausi + N* ⇒ keskenkauden. Yksinkertainen,
   mutta N pitää valita. Esimerkiksi B012880 päättyy 31.10. ja maksoi 07.09.: onko se keskenkauden
   vai ennakkoon maksettu kauden loppu?
2. Paylinkin tai SO:n oma tieto, jos sellainen löytyy luotettavana.
3. Maksupolku ei kirjoita tapaa koskaan, jos kausi ei ole päättynyt, vaan odottaa. Silloin kauden
   lopun ennakkomaksu saa tavan vasta kun kausi päättyy. Tämän voi hoitaa vaihe 1 itse seuraavana
   yönä, koska täsmäytysajo näkee eron.

Vaihtoehto 3 sopii täsmäytysajoon luontevimmin, ja sillä ei tarvitse arvata.

### Kirjasto

`onkoVelvoitteetHoidettu` hyväksyy `paid_at`:n todisteeksi. Keskenkauden lunastuksessa se ei
käytännössä riitä päättämään mitään, koska ilman CR:ää päättymisajankohta on alkuperäinen eikä
siirry. Maksu ei siis voi aikaistaa päättymistä. Siksi **kirjastoon ei tarvita muutosta säännön 3
toteuttamiseen**, kunhan mikään muu kuin CR ei siirrä `custrecord_sta_subsc_end_date`- tai
`custrecord_gbb_exceptional_end_date`-kenttää aikaisemmaksi. Tämä on oletus, ja se on todennettava
([`gbb_lunastus_lib.md`](../../../netsuite-subscrption-cr-scripts/docs/scripts/gbb_lunastus_lib.md)).

**B038677 on selvitetty** ([löydös](../../findings/2026-09-23-b038677-redeemed-ja-ended-ilman-cr.md)).
Se on OOMI-pyörä, jonka keskenkauden lunastus kulki Oomin kautta: `oomi_exceptional_end_date`
30.09. Tyypin 2 CR:ää ei ole. Ended RI syntyi vaiheen 3 testiajossamme. Tästä syntyy uusi
avoin kysymys:

> **D8 ratkaistu 24.09.2026** ([ADR 0009](0009-kauden-lopun-lunastus.md) kohta 1): kyllä, mutta
> vain historiassa. Lokakuusta 2026 alkaen OOMI-pyörän ennenaikainen päättyminen tehdään CR:llä.

**D8 (ratkaistu, alkuperäinen kysymys):** kelpaako `custrecord_gbb_oomi_exceptional_end_date` OOMI-pyörillä muutospyynnön
veroiseksi kirjaukseksi säännössä 3? Oletus on kyllä, koska Oomi-integraatio on OOMI-pyörien
sopimusmuutosten lähde. Päätöksen tekee tuoteomistaja.

## Vaikutus 23.09. tehtyyn S1-importtiin

S1 kirjoitti tavan 1 ja `liab_settled_at` = maksupäivä kaikille 27:lle. Tämän päätöksen valossa
se oli oikein kauden lopun lunastuksille, mutta väärin keskenkauden lunastuksille:

| Pyörät | Tilanne | Korjaus |
|---|---|---|
| **B018311, B031476** | Done-tilainen tyypin 2 CR (6571, 6570), luotu 17.09. S1 **ylikirjoitti CR:n päivän** 17.09. maksupäivällä | **palauta `liab_settled_at` = 17.09.2026** |
| B007933, B010316, B024003, B026700 | Pending 2C -CR (6689, 6684, 6687, 6685), luotu 23.09. S1 kirjoitti 22.09., ja nykyinen handler pitää sen | CR:ien käsittelyn jälkeen **`liab_settled_at` = 23.09.2026** (tai handlerin korjaus) |
| 16 pyörää ilman CR:ää, joiden kausi päättyy 10/2026–2029 (B005492, B010162, B012880, B014042, B016666, B021319, B024292, B026437, B027393, B027471, B029495, B032764, B043416, B044011, B046058, B046429) | todennäköisesti keskenkauden lunastuksia, jotka odottavat CR:ää | **ei korjausta nyt.** Kun CR tulee, sen arvojen on voitettava (handlerin korjaus tai CSV silloin). B012880:n tyyppi on epävarma (kausi päättyy 31.10.) |
| B003358, B005324, B020065, B046480, B036864 | kauden lopun lunastus | ei korjausta, sillä S1 oli oikein |

`paid_at` jää kaikille, koska se on maksun fakta (sääntö 2).

**S1b muuttuu:** B003280 ja B003403 (kausi päättyy 30.09.) kirjataan kuten S1. B006299 ja
B042663 (kausi päättyy 2029) saavat **vain `paid_at`**. B044934:llä on jo `liab_settled_at`
17.09., ja jos se on CR:n päivä, **sitä ei muuteta**.

## Todennettu vs. päätelty

**Tuoteomistajalta 23.09.2026:** päätös ja rajaus keskenkauden lunastukseen.
**Todennettu NetSuitesta 23.09.2026:** 687/0 ja 32/1 (CR-kattavuus 21.09. jälkeisissä kääntöjä
tavalla 1); S1-pyörien CR:t ja niiden luontipäivät; B038677:n päivämäärät.
**Todennettu koodista:** handlerin write-once-vartija (`handler_lunastus.js`
`addLiabilitySettlementFields`, `:316–358`).
**Päätelty:** 16 CR:ttömän pyörän luokittelu keskenkauden lunastuksiksi (kausi päättyy yli kuukauden
päästä maksusta). Oletus, ettei mikään muu kuin CR aikaista päättymisajankohtaa.
