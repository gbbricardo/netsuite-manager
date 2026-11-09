# Jälkiveloituksen laskuvahti ei katso asiakasta — konsernisiirto päätyy aina Needs Review'hun

**Päivä:** 3.11.2026
**Omistava repo:** `netsuite-subscrption-cr-scripts`
**Liittyy:** TASKS T87, T78 · ADR 0010 · CLAUDE.md avoin kohta 1

## Väite

Konsernisiirtopaketin tyypin 7 *jälkiveloitus* -CR **laskee laskun ensin ja jää sitten aina
Needs Review -tilaan**, koska laskuvahti etsii päällekkäistä laskutushistoriaa **kaikilta** pyörän
sopimusriveiltä asiakkaasta riippumatta. Siirrossa vanhan työnantajan rivit kantavat aina saman
kuukauden laskutushistorian, joten varoitus on rakenteellinen, ei poikkeus.

## Todiste 1 — koodi (luettu 3.11.2026, `master`)

`cr_invoice_guard.js:88` kommentoi rajauksen itse auki:

> *Queries ALL subscription lines for the bike regardless of customer or active status.*

`checkNoDoubleBilling` (`:95-118`) hakee `custrecord_sta_ca_agreement_row`-rivit pelkällä
`custrecord_sta_bikeid`-ehdolla. Saman tiedoston `checkWasBilled` (tyypin 11 hyvitys, `:135-`)
rajaa saman kyselyn **asiakkaalla** — eli vahdeissa on tahaton epäsymmetria.

`handler_jalki.js:163-176` ajaa vahdin **vasta kun lasku on jo luotu ja pyörärekisterin
`subsc_end_date` päivitetty**, ja palauttaa varoituksesta `{ needsReview: true }`. `:403` ja
`:420-425` kääntävät sen CR-tilaksi **6 (Needs Review)**. Polku on deterministinen: varoitus ⇒
Needs Review, lasku jää voimaan.

## Todiste 2 — tuotanto (SuiteQL 3.11.2026)

30.10.2026 syntyi 18 tyypin 7 CR:ää (7560, 7593, 7596, 7599, 7602, 7605, 7608, 7611, 7614, 7617,
7620, 7623, 7626, 7629, 7632, 7635, 7638, 7641). Jokaisen lokissa on sama rivi:

> `Invoice INVGBF10471xx created | WARNING: subscription line(s) for bike N already have billing
> history for period(s) 2026-11.`

Jokainen loi laskun (INVGBF1047162–1047179) ja jäi tilaan 6. Kausi on kaikilla 1.–30.11.2026, joka
oli laskutettu vanhalle työnantajalle **1.10. ajossa** — juuri se historia, jonka vahti näkee.

**Lopputulos on silti rahassa oikein.** Jokaisella 18 pyörällä on pari: lasku uudelle työnantajalle
ja hyvitys vanhalle, molemmat tositepäivällä 30.10.2026.

| Pyöriä | Lasku ≠ hyvitys | Selitys |
|---|---|---|
| 17 | 0,00 € | summat täsmäävät sentilleen |
| 1 (12572) | **5,00 €** | vuokra sama 79,68 €, **hallintomaksu 15,94 € vs 11,95 € netto** — vastaanottavan työnantajan oma hinta, ei virhe |

## Todiste 3 — T78 ei ollut poikkeus

TASKS T87 oletti, että T78:n **CR 7447** käyttäytyi toisin (päätyi Doneen). Ei pidä paikkaansa:
7447:n lokissa on **sama varoitus** samalle kuukaudelle 2026-11. Ero on vain siinä, kuka siivosi ja
milloin — 7447 siirrettiin Doneksi käsin 27.10.2026 klo 08:44 ja nämä 18 **2.11.2026 klo 13:18–13:30**
(sama henkilö, `lastmodifiedby`). Skripti 1199 ei koskenut niihin: sen loki 1.–3.11. sisältää vain
CR 7644/7645:n käsittelyn.

## Seuraus

Jokainen konsernisiirtopaketti tuottaa yhtä monta käsin kuitattavaa Needs Review -CR:ää kuin siinä on
pyöriä, ja lasku on silloin jo lähtenyt. 30.10. se oli 18 CR:ää; seuraava erä tuottaa saman uudelleen.
Riski ei ole raha vaan se, että aito kaksoislaskutus hukkuu rutiinivarotukseen.

## Tarkennus 3.11.2026 — vahdit ovat olleet keskenään eri mieltä

`handler_jalki.js:273-284` `assertNotAlreadyBilled()` tekee **jo nyt** saman tarkistuksen
**asiakkaalla rajattuna**, **ennen** laskun luontia, ja se **heittää** (lasku jää luomatta).
Juuri siksi 18 CR:ää saivat laskun: uudella työnantajalla ei ollut marraskuun historiaa, joten
`assertNotAlreadyBilled` päästi läpi — ja heti perään pyörätasoinen `checkNoDoubleBilling` näki
vanhan työnantajan historian ja varoitti. **Kaksi vahtia samasta asiasta eri rajauksella** on siis
varsinainen vika, ja se vahvistaa tämän löydöksen: varoitus oli näissä määritelmällisesti väärä.

## Korjaus (omistavassa repossa, ei tässä)

`checkNoDoubleBilling` rajataan asiakkaalla kuten `checkWasBilled`, tai vaihtoehtoisesti vahti katsoo
myös saman kauden hyvityksen. Lisäksi harkittava, pitäisikö vahdin ajaa **ennen** laskun luontia —
nyt varoitus ei estä mitään, se vain merkitsee CR:n jälkikäteen.
