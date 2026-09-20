# ADR 0003 — Jaetun lunastuskirjaston sijainti ja omistajuus

- **Päivämäärä:** 2026-09-18
- **Tila:** Ehdotus
- **Koskee:** [`lunastuksen-kenttasaannot.md`](../lunastuksen-kenttasaannot.md) kohta 6, kaikki kuusi SuiteScript-sisarrepoa

## Konteksti

Sääntödokumentin kohta 6 vaatii että päättymisen ehdot toteutetaan **yhtenä kirjastona** jota
jokainen kirjoittaja ja lukija käyttää. Ilman sitä jokainen skripti päättelee tilan omalla
tavallaan ja ajojärjestys alkaa vaikuttaa lopputulokseen — juuri se ongelma jonka takia 189 pyörää
on nyt merkitty lunastetuksi kesken vuokrakauden.

Kirjaston tarvitsevat ainakin:

| Repo | Käyttö |
|---|---|
| `netsuite-subscrption-cr-scripts` | `handler_lunastus` päättää saako statuksen kirjoittaa |
| `netsuite-bike-redemption-status-sync` | sama, maksuvetoisella polulla |
| `netsuite-monthly-reporting` | RI-luonti kysyy päättymistä statuksen sijaan |
| `netsuite-subscription-extension` | velvoitteiden hoito yhdestä lähteestä |
| `netsuite-ic-calculators` | `ic_redemption_dt`:n johtaminen päättymisajankohdasta |
| `netsuite-paylink-order-tracking` | ei toistaiseksi, mutta lukee samoja faktoja |

Rakenteellinen este: **millään sisarrepolla ei ole toimivaa deployment-työkalua.**
`netsuite-subscrption-cr-scripts` noudattaa SDF:n kansiorakennetta (`src/FileCabinet/…`), mutta
siinä ei ole `manifest.xml`:ää, `deploy.xml`:ää eikä `Objects/`-kansiota — sen oma README kirjaa
tämän aukoksi (`:217`). Kaikki kuusi repoa ladataan File Cabinettiin käsin.

> *Tämän ADR:n alkuperäinen muotoilu oli "vain CR-repolla on oikea deployment-työkalu (SDF)".
> Todennettu 20.09.2026: väite ei pidä paikkaansa. Valinta ei kuitenkaan muutu — perustelu on
> omistajuus ja kansiorakenne, ei työkalu.* Kirjasto on kuitenkin File
Cabinetissa yksi tiedosto, jonka jokainen skripti hakee poluttain `define`-riippuvuutena — NetSuite
ei tunne repo-rajoja, joten lataaja ja käyttäjä voivat olla eri repoja.

## Vaihtoehdot

**A. Kirjasto asuu CR-repossa, omassa File Cabinet -kansiossaan.** Valittu.

**B. Uusi kahdeksas repo pelkälle kirjastolle.** Puhtain omistajuus, mutta lisää kahdeksannen
deployment-polun projektiin jossa viidellä repolla ei ole yhtäkään. Hylätty toistaiseksi —
harkitaan uudelleen jos kirjastoon tulee muutakin kuin lunastuslogiikkaa.

**C. Sama logiikka kopioituna jokaiseen repoon.** Hylätty: se on nykytila toisella nimellä.

## Päätös

Kirjasto on **yksi File Cabinet -moduuli** polussa

```
/SuiteScripts/gbb-lib/gbb_lunastus_lib.js
```

> **Polku muuttui 20.09.2026.** Tämän ADR:n alkuperäinen muotoilu oli `/SuiteScripts/lib/`. Kansio
> luotiin nimellä `gbb-lib`, linjassa `gbb-cr-processor/`:n kanssa, ja **live-polku voittaa** —
> NetSuite on totuus, dokumentti seuraa. Muutos oli ilmainen tehdä, koska yksikään kutsuja ei vielä
> lataa kirjastoa; ensimmäisen kutsujan jälkeen se olisi ollut kuuden repon yhtäaikainen
> rikkoutuminen. Sen jälkeen **polkua ei saa enää muuttaa** — ks. *Seuraukset*.

**Omistaja on `netsuite-subscrption-cr-scripts`.** Se on ainoa repo joka deployaa sen. Muut repot
viittaavat siihen `define(['/SuiteScripts/gbb-lib/gbb_lunastus_lib'], …)` eivätkä koskaan muokkaa tai
lataa tiedostoa.

**Rajapinta on sääntödokumentin kohdan 6 taulukko** — viisi predikaattia, ei enempää. Kirjasto ei
kirjoita NetSuiteen eikä tee hakuja joita kutsuja ei odota; se ottaa syötteensä pyörärekisterin
kenttinä ja palauttaa päätöksen.

**`cf-gbb-tools` toteuttaa samat säännöt erikseen TypeScriptillä.** Se ajaa Cloudflare Workersissa
eikä voi ladata SuiteScript-moduulia. Sen toteutus on rinnakkainen, ei johdettu, ja sen
yhdenmukaisuus todetaan vain testeillä ja tällä dokumentilla.

## Seuraukset

**Hyvät.** Ajojärjestys lakkaa vaikuttamasta lopputulokseen: kaikki kirjoittajat johtavat päätöksen
samoista lähtöfaktoista sen sijaan että lukisivat toistensa tuotosta. Sääntömuutos on yhden
tiedoston muutos kuudessa repossa.

**Huonot.** Viisi repoa saa riippuvuuden johon niillä ei ole kirjoitusoikeutta. Jos CR-repon
lataus poistaa tai nimeää tiedoston uudelleen, viisi muuta repoa hajoaa kerralla, eikä
mikään niistä huomaa sitä ennen ajoa. Kirjastolla on siksi oltava versionumero jonka kutsuja voi
lokittaa.

**Riski.** `cf-gbb-tools`in rinnakkaistoteutus erkaantuu hiljaa. Sen mittari on
sääntödokumentin kohdan 8 tarkistuskyselyt — erkaantuminen näkyy datassa ennen kuin se näkyy
koodissa.
