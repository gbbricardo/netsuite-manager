# import-templates

Uudelleenkäytettävät NetSuite **CSV Import** -muodot: sarakerivi, esimerkkiaineisto ja rivitarkka
määrittely jokaisesta muodosta, jonka agentti saa tuottaa.

Ero `imports/`-kansioon: siellä on **kertaluonteisia, ajettuja aineistoja** (tietty korjauserä,
tietty päivä, ajettu tai ei). Täällä on **muoto**, jonka pohjalta uusi aineisto rakennetaan.

| Muoto | Tiedostot | Mitä syntyy |
|---|---|---|
| Hyvityslasku (Credit Memo) | [`hyvityslasku-creditmemo.md`](hyvityslasku-creditmemo.md) · [`.csv`](hyvityslasku-creditmemo.csv) · [esimerkki](hyvityslasku-creditmemo-esimerkki.csv) | Monirivinen hyvityslasku, joka kohdistuu alkuperäiseen laskuun |

## Säännöt kaikille muodoille

- Määrittely erottaa **NetSuitesta todennetun** ja **koodista pääteltävän**, kuten juuren
  `CLAUDE.md` vaatii. Jokainen kenttämappaus kantaa sen merkinnän.
- `*.csv`-pohjatiedostossa on **vain sarakerivi**. Esimerkkirivit ovat erillisessä
  `-esimerkki.csv`-tiedostossa, jotta niitä ei vahingossa ajeta sisään.
- Transaktioita luova import **ei ole peruutettavissa** ja voi lähteä asiakkaalle. Pyydä
  hyväksyntä ennen ajoa ja todenna jälkeenpäin määrittelyn kyselyillä.
