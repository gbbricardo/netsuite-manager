# ADR 0007 — Status-sync 2.0: yksi täsmäytysajo omistaa lunastusten lopputilan ja IC-kauden

- **Päivämäärä:** 2026-09-23
- **Tila:** Hyväksytty (rakenne ja käyttöönottoajankohta). Päätös D1 on auki
- **Koskee:** `netsuite-bike-redemption-status-sync` (korvataan kokonaan),
  `netsuite-subscrption-cr-scripts` (`gbb_lunastus_lib` 1.2.0), `netsuite-ic-calculators`
  (lukija), taloustiimin saved search **797**
- **Tarkennus:** [ADR 0005](0005-tilasiirtyman-2-3-tekee-kalenterisweep.md) (kalenterisweep
  säilyy vaiheena 2), [kenttäsäännöt](../lunastuksen-kenttasaannot.md) § `ic_redemption_dt`
  (omistaja muuttuu: CSV-import → tämä skripti)
- **Suunnitelma:** [`../status-sync-2-tasmaytysajo.md`](../status-sync-2-tasmaytysajo.md)
- **Osittain muutettu:** [ADR 0015](0015-status-sync-2-tarkennukset.md) (7.10.2026). Vaihe 4 (raportti) ja D5 poistuvat,
  raportointi on erillinen skripti. Käyttöönotto tehdään heti valmistuttua, ei kuunvaihteessa. Vaiheen 3 laukaisija ja
  write-once on muutettu jo ADR 0011:llä. Ristiriidassa ADR 0015 voittaa.

## Konteksti

`netsuite-bike-redemption-status-sync` on nimensä mukaan se skripti, joka pitää lunastukset ajan
tasalla. Nykyinen toteutus tekee siitä osan:

- **Status:** kalenterisweep kääntää 1 → 2/3 oikein, mutta maksuhavainto (osa A) lukee ±5 vrk
  ikkunaa ja hukkaa pysyvästi maksut, jotka näkyvät NetSuitessa myöhässä
  ([löydös 23.09.](../../findings/2026-09-23-status-sync-maksuikkuna-hukkaa-myohaiset-maksut.md)).
  Mitattuna 23.09.: 24 maksettua Active-pyörää ei pääty koskaan.
- **IC:** `custrecord_gbb_ic_redemption_dt`:tä ei kirjoita yksikään koodi. Mitattuna 23.09.:
  **1 356 lunastettua IC-myytyä pyörää puuttuu** taloustiimin listalta, joista noin 350
  kesä–elokuulta.
- **Poikkeamat**, joita automaatio ei saa korjata (esim. status 3 väärällä selvitystavalla),
  eivät näy kenellekään.

### IC-päivän merkitys (tuoteomistaja 23.09.2026)

- `custrecord_gbb_ic_redemption_dt` on **kirjanpitokausi**, jolle IC-lunastus kuuluu. Kun kenttä
  täytetään, `netsuite-ic-calculators` laskee pyörälle IC-lunastushinnan tälle päivälle.
- Taloustiimi ottaa **saved searchilla 797** kuukausittain, **ennen kuun loppua**, tiedon siitä
  mitkä pyörät voidaan IC-lunastaa, millä hinnalla ja mille kaudelle.
- Taloustiimiä **ei kiinnosta, milloin** IC-lunastus teknisesti tehdään. Kiinnostaa kausi.
- Toteutuksen on sallittava **historia**: myöhässä tunnistettu lunastus saa IC-päivän omalle,
  menneelle kaudelleen, eikä sitä siirretä kuluvaan kuukauteen.

Tämä vahvistaa kenttäsäännön `ic_redemption_dt = LAST_DAY(päättymisajankohta)` ja ADR 0002:n
sopimusankkurin: IC-päivä seuraa päättymisajankohtaa, ei tunnistuspäivää eikä ajopäivää.

## Päätös

### 1. Skripti kirjoitetaan uudelleen täsmäytysajoksi

Yksi Map/Reduce, ajetaan joka yö. Jokainen vaihe on **joukkoerotus**: *mitkä pyörät eivät ole
siinä tilassa, jossa jaetun kirjaston mukaan pitäisi olla*. Kun kanta on kunnossa, ajo ei kirjoita
mitään. Väliin jäänyt ajo ei hukkaa mitään, koska seuraava ajo näkee saman eron.

### 2. Neljä vaihetta, yksi kirjoitus per pyörä

| # | Vaihe | Kirjoittaa | Sääntö |
|---|---|---|---|
| 1 | **Maksu** | `redemption_paid_at` aina. Selvitystapa 1 ja `liab_settled_at` **vain kauden lopun lunastukselle** ([ADR 0008](0008-keskenkauden-lunastuksessa-cr-voittaa-maksun.md)): keskenkauden lunastuksessa ne tulevat CR:ltä | [muutosspeksi](../status-sync-maksuhavainto-muutosspeksi.md) M1–M3 ja M6: ei ikkunaa, `closedate` eikä `trandate`, hyvitetty lasku ei ole maksu. M4 rajautuu kauden loppuun. Keskenkauden tunnistus = ADR 0008 D7 |
| 2 | **Status** | `custrecord_sta_bike_status` 1 → `kohdestatus(tapa)` | `saakoMerkitaPaattyneeksi`. **Vain eteenpäin**: 2/3 → 1 ja 2 ↔ 3 raportoidaan |
| 3 | **IC-kausi** | `custrecord_gbb_ic_redemption_dt` | `icLunastuspaiva(bike)` = `LAST_DAY(paattymisajankohta)`, kun status on 2/3, kenttä tyhjä, `ic_redemption_done` ≠ T ja `ic_redemption_pr` tyhjä. Write-once. Saa osoittaa menneeseen kauteen |
| 4 | **Poikkeamat** | ei mitään | raportti nimeltä syittäin, joka yö, myös tyhjänä |

Vaiheet ajetaan muistissa peräkkäin samalle pyörälle, ja muutokset kirjoitetaan yhdellä
`submitFields`-kutsulla. Tänä yönä havaittu maksu voi siis kääntää statuksen ja nostaa pyörän
IC-listalle samassa kirjoituksessa.

**Miksi IC-päivä ehtii listalle ennen kuun loppua:** tunnistuspäivä on päättymiskuukauden
ensimmäinen päivä (kenttäsäännöt §3). Pyörä, jonka kausi päättyy lokakuussa, kääntyy tilaan 3
viimeistään 1.10. yön ajossa ja saa IC-päivän 31.10. samassa kirjoituksessa. Se on siis haussa
797 koko lokakuun. Myöhässä tunnistettu lunastus saa menneen kauden päivän (ks. *Seuraukset*).

### 3. Sääntö on kirjastossa, ei skriptissä

`gbb_lunastus_lib` saa funktion `icLunastuspaiva(bike)` ja `VERSION` 1.2.0. Omistaja on
`netsuite-subscrption-cr-scripts`, ja muutokseen kuuluvat yksikkötestit. Kirjaston otsikko nimeää
jo `ic_redemption_dt`:n sopimusankkurin lukijaksi.

### 4. Käyttöönotto lokakuussa yhdellä kertaa; lokakuu on testikuukausi

- **Syyskuu hoidetaan CSV-importeilla.** Vanha skripti ajaa syyskuun loppuun.
- **Lokakuussa** uusi skripti otetaan käyttöön **kaikkine vaiheineen kerralla**, ja vanha
  deployment poistetaan käytöstä samana päivänä. Kaksi skriptiä ei kirjoita samaa kenttää eri
  säännöillä.
- **Lokakuun aikana** tarkistetaan päivittäin, että skripti tekee asiat oikein
  ([suunnitelma § Käyttöönotto](../status-sync-2-tasmaytysajo.md#käyttöönotto)).
- Script-tyyppi vaihtuu (Scheduled → Map/Reduce), joten **sisäinen id vaihtuu.** Se on
  hyväksytty.

### 5. Automaatio ei korjaa taaksepäin

2/3 → 1, 2 ↔ 3 ja statuksen asettaminen tyhjästä ovat ihmisen päätöksiä. Skripti raportoi ne.
Aktivointi (tyhjä → 1) ei kuulu lunastuksille.

## Seuraukset

**Hyvät.** Lunastuksen lopputila ja IC-kausi ovat yhden skriptin vastuulla, ja se johtaa kaiken
samasta kirjastosta. Taloustiimin haku 797 täyttyy ilman käsityötä, historiallisetkin tapaukset
mukaan lukien. Hiljaiset poikkeamat muuttuvat nimetyksi listaksi.

**Hinnat.**

- **Myöhässä tunnistettu lunastus osuu jo suljetulle kaudelle.** Esimerkki: kausi päättyi 15.08.,
  mutta tyypin 2 CR käsitellään 10.10. IC-päivä on silloin 31.08., ja pyörä ilmestyy hakuun 797
  lokakuussa elokuun kaudella. Tämä on tuoteomistajan vaatimus (*"lunastus kattaa myös historiaa"*),
  mutta taloustiimin on tiedettävä, että haussa voi näkyä rivejä jo suljetuille kausille.
- **Kaikkien kolmen ankkurin on oltava kunnossa.** IC-päivä on juuri niin oikein kuin
  `paattymisajankohta`. Ennen tätä päätöstä virheellinen `exceptional_end_date` näkyi vain
  statuksessa, nyt se näkyy myös kirjanpitokaudessa.
- **Write-once estää korjaamasta automaattisesti.** Jos päättymisajankohta muuttuu IC-päivän
  kirjoittamisen jälkeen (esim. uusi CR), skripti ei siirrä IC-päivää, vaan raportoi eron.
  Laskuri laskisi hinnan uudelleen vain, jos finance tyhjentää hinnan
  ([ic-calculators README](../../../netsuite-ic-calculators/README.md): *"changing the redemption
  date will silently recalculate"*).
- **Lokakuu on samalla kuunvaihteen kuormatesti.** Ensimmäinen yö kääntää noin 1 000 statusta ja
  kirjoittaa saman verran IC-päiviä.
- 2026 IC-päivistä **7 % poikkeaa** säännöstä (350 = päättymispäivä sellaisenaan, 42 = edellisen
  kuun viimeinen päivä, 173 muu). Niitä ei muuteta (write-once). Uudet kirjoitukset noudattavat
  sääntöä ilman poikkeuksia.

## Auki

| # | Kysymys | Kenelle |
|---|---|---|
| D1 | Kirjoitetaanko IC-päivä myös pyörille, joita ei ole IC-myyty (`ic_sale_dt`/`_price` tyhjä)? Status 2/3: 175 kpl ilman IC-päivää, ja 281 tällaista on käsitelty aiemmin | taloustiimi |
| — | **Haun 797 ehdot** — SuiteQL ei näytä saved searchien määrityksiä (`savedsearch`-taulua ei ole). Oletus: `ic_redemption_dt` asetettu, `ic_redemption_done` ≠ T, ryhmittely kauden mukaan. Todenna UI:sta ennen lokakuuta | tuoteomistaja |

D4 (IC-laskurin automaattinen käynnistys), D5 (raportin vastaanottaja) ja D6 (2 ↔ 3) ovat
suunnitelmassa, ja niihin on valmis suositus.

## Todennettu vs. päätelty

**Todennettu NetSuitesta 23.09.2026:** statuspoikkeamien luvut, IC-kenttien jakauma
statuksittain (1 356 / 175 / 1 095 / 43 / 9 313 / 281 / 1 000) ja IC-päivien säännönmukaisuus
(7 177 / 350 / 42 / 173). `customdeploy_gbb_ic_redemption_pr` on *Not Scheduled*
(`schemas/script-inventory.md`).
**Tuoteomistajalta 23.09.2026:** IC-päivän merkitys kirjanpitokautena, haku 797, historian
salliminen, käyttöönotto lokakuussa kerralla ja syyskuu CSV:llä.
**Päätelty:** haun 797 ehdot.
