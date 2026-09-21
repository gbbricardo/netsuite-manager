# Kalenterisweepin ensimmäinen tuotantoajo — ja §8:n mittari joka olisi lukenut sen katastrofina

**Päivämäärä:** 2026-09-21 · **Tila:** ajo onnistui; §8:n mittari korjattu
**Liittyy:** [ADR 0005](../docs/adr/0005-tilasiirtyman-2-3-tekee-kalenterisweep.md),
[`2026-09-21-maksetut-active-pyorat-ilman-selvitystapaa.md`](2026-09-21-maksetut-active-pyorat-ilman-selvitystapaa.md)

## Ajo

`gbb_ss_bike_redemption_status_sync.js`, tuotantoajo käsin 21.09.2026 klo 01:49–01:57 (tilin aika),
`dryRun=false`, parametrit ennallaan.

```
Part A complete. 2 payment(s) recorded, 84 already recorded, 0 error(s), 86 total candidate(s)
Part B (calendar sweep) complete. 770 candidate(s), 658 status change(s) written,
112 still waiting, 0 error(s). 62 "not yet" explanation line(s) suppressed
```

| | Dry run | Tuotantoajo |
|---|---|---|
| Kandidaatteja | 769 | 770 |
| Käännettiin | 659 | **658** |
| Odottaa | 110 | 112 |
| Virheitä | 0 | **0** |
| Kesto | 2 s | **8 min** |
| Governance-pysäytys | — | **ei** |

Poikkeamat dry runiin ovat selitettyjä: osa A kirjoitti ensin kaksi selvitystapaa (+1 kandidaatti),
ja pyörä 46214 oli jo käännetty erillisessä yhden pyörän tuotantotestissä (−1 käännettävä).

**8 minuuttia 658 kirjoitukseen** = noin 730 ms per pyörä, mukaan lukien viisi UE-skriptiä ja
statuswebhook jokaista kohti. Governance ei katkaissut ajoa; arvio 6 600 yksiköstä 10 000:sta piti.

## Lopputila

| Mittari | Ennen | Jälkeen |
|---|---|---|
| Sweepin kandidaatit (tila 2 *lunastus sovittu*) | 770 | **112** |
| Päättyneitä (status 2/3) | 12 541 | **13 199** |
| Active, maksettu, ei selvitystapaa | 0 | **0** |
| Selvitystapa puuttuu (status 2/3) | 1 211 | **1 211** |
| §5-rikkomukset selvitystavalla 1 | 53 | **53** |

Yksikään sääntörikkomus ei kasvanut.

## Löydös: §8:n tärkein mittari oli ristiriidassa §3:n kanssa

Ajon jälkeen [§8:n](../docs/lunastuksen-kenttasaannot.md#8-tarkistuskyselyt) otsikkomittari
*"Lunastettu ennen päättymisajankohtaa"* hyppäsi **188 → 847**. Se näyttää katastrofilta. Se ei ole
sitä — **mittari oli väärä.**

```sql
-- vanha
WHERE custrecord_sta_bike_status = 2 AND custrecord_sta_subsc_end_date > CURRENT_DATE
```

Kysely mittasi "status 2 ennen päättymis**päivää**". [§3](../docs/lunastuksen-kenttasaannot.md#3-tunnistuspäivä)
kuitenkin sanoo että operatiivinen ankkuri on päättymiskuukauden **ensimmäinen päivä**, ei viimeinen
— ja perustelee sen sillä että 8 427 pyörällä vuokrakausi päättyy kesken kuuta. Kesken kuuta
päättyvä pyörä *saa siis olla lunastettu ennen päättymispäiväänsä*. Se on sääntö, ei poikkeama.

Lisäksi vanha kysely luki vain `custrecord_sta_subsc_end_date`:a, vaikka §2 sanoo poikkeuspäivien
ohittavan sen.

Sääntöjen mukainen mittari:

```sql
WHERE custrecord_sta_bike_status = 2
  AND TRUNC(COALESCE(custrecord_gbb_exceptional_end_date,
                     custrecord_gbb_oomi_exceptional_end_date,
                     custrecord_sta_subsc_end_date), 'MM') > TRUNC(CURRENT_DATE)
```

| | vanha | korjattu |
|---|---|---|
| Arvo 21.09.2026 ajon jälkeen | **847** | **4** |
| Erotus: kausi päättyy kuluvassa kuussa | 841 | — |

Ne 4 tarkistettiin yksitellen: kaikkien `lastmodified` on **02.09.–17.09.2026**, eli ne ovat ajoa
vanhempia. **Sweep tuotti nolla ennenaikaista lunastusta.**

### Miksi tämä on tärkeämpi kuin itse ajo

Mittari on tämän projektin **päämittari** — se luku jolla koko työn onnistuminen mitataan. Jos sitä
ei olisi tarkistettu sääntöjä vasten, oikein toiminut ajo olisi luettu nelinkertaisena
regressiona, ja luultavin reaktio olisi ollut perua muutos.

Sääntödokumentti kirjoitettiin ennen kuin §3:n kuukausiankkuri oli muotoiltu, eikä §8:aa
päivitetty sen mukana. Mittari ja sääntö erkanivat saman dokumentin sisällä.

## Avoin: `custrecord_gbb_date_to_non_active` tyhjä 664 tietueella

Ennen ajoa tyhjiä oli 6, jälkeen **664** (6 + 658). Kenttää ei siis kirjoiteta synkronisesti
statuksen muutoksesta, vaikka [kenttäsäännöt §5](../docs/lunastuksen-kenttasaannot.md) antaa sen
omistajaksi *"User Event -skriptin pyörärekisterillä"*.

Tämä **ei ole sweepin aiheuttama**: myös ne 5 pyörää jotka vanha skripti lunasti 20.–21.09. yöllä
jäivät ilman arvoa. Historiallisesti kenttä on täytetty 12 535/12 541:llä, joten jokin täyttää sen
viiveellä — mutta täyttäjää ei ole tunnistettu, eikä sitä ole yhdessäkään sisarrepossa.

**Tarkistettava 22.09.2026.** Jos luku ei palaudu lähelle nollaa, kyseessä on oma selvityksensä:
kenttä on write-once, ja 658 tietuetta jäisi pysyvästi ilman kirjausjälkeä.

```sql
SELECT COUNT(*) FROM customrecord_sta_bike_register
WHERE custrecord_sta_bike_status IN (2,3) AND custrecord_gbb_date_to_non_active IS NULL
```

## Todennettu vs. päätelty

**Todennettu lokista 21.09.2026:** ajon yhteenvetorivit, kesto, virheettömyys.
**Todennettu NetSuitesta 21.09.2026:** kaikki mittarit ennen ja jälkeen; ne 4 sääntöjen mukaan
ennenaikaista ja niiden `lastmodified`.
**Päätelty:** 730 ms/pyörä ja governance-arvio.
