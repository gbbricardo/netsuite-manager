# Työohje: lease fees check ADR 0016:n mukaiseksi (T59)

Kohde: `../netsuite-br-lease-fees-check` (`mr_lease_fees_check_v2.js`, 506 riviä). NetSuite: skripti 1432
`customscript_gbb_lease_fee_check`, deployment `customdeploy_gbb_lease_fee_check`, **SCHEDULED**, haku 796
(`customsearch_gbb_br_vuokramaksut`). Säännöt: [ADR 0016](adr/0016-kaikki-vuokrat-maksettu.md), taustalla
[ADR 0013](adr/0013-kauppakirjan-lahetys.md). **Valmis ennen 1.11.2026.** Tämä ohje ei muuta mitään; työ tehdään sisarreposta.
Huom: sisarrepon README nimeää skriptin `..._v2`, NetSuite-inventaario ilman päätettä. Tarkista oikea tunnus UI:sta ennen deploya.

## 0. Tee ensin (todennus ennen koodia)

1. **`custcol_sta_so_revrec_start` hakusuodattimena.** SuiteQL:llä todennettu 9.10.2026: kenttä on `transactionline`-taulun tallennettu
   sarake, ja suodatus toimii (`>= 1.9.2026 AND < 1.10.2026`: 28 936 riviä, 3 916 laskua, tuotteet 30/31/33).
   SuiteQL ei todista `N/search`-tilaa. Aja ensin 10 rivin koeskripti, jossa `search.create({type:INVOICE, filters:[['custcol_sta_so_revrec_start','onorafter',...],'AND',['item','anyof',30,31,33],'AND',['mainline','is','F']]})`
   ja sarake `custcol_sta_so_revrec_start`. Jos suodatin hylätään (`SSS_INVALID_SRCH_FILTER`) tai palauttaa 0, vaihda `N/query` (`query.create({type:'transactionline'...})`)
   tai SuiteQL (`N/query.runSuiteQL`), jossa sama ehto toimii. **Kirjaa havainto sisarrepon `NETSUITE_RECORDS_AND_FIELDS.md` §5:een.**
2. **T58 valmis.** 332 laskulla (331 Oomin 1.5./7.5. + INVGBF1043393 16.9.) kausi on 2025-05. Ilman korjausta ne putoavat asiakkaan kauden ulkopuolelle: ks.
   `findings/2026-10-09-t58-oomi-toukokuu-tuloutuskausi.csv`. Älä tee Oomi-poikkeusta.
3. **Haun 793 ehdot.** Lue UI:sta (SuiteQL ei näe). Ks. §4.

## 1. Nykyinen logiikka vs. ADR 0016

| ADR 0016 | Nyt (tiedosto:rivi) | Muutos |
|---|---|---|
| k4: vuokrakuukausi = rivin `revrec_start` | `checkCategory1` hakee laskun `duedate on` historiapäivä (l. 139-150); Oomi Part A `trandate`-kuukausi (l. 218-230) | Suodata rivit `custcol_sta_so_revrec_start` kuukausi = tarkistettava kuukausi, `item anyof 30,31,33`, `mainline F` |
| k3: viimeisin laskutettava asiakas | Kaikkien rivien asiakkaat (l. 125-129, `customerDateMap`); Oomilla bike employer (l. 381) | Valitse sopimusriveistä (`customrecord_sta_ca_agreement_row.custrecord_sta_bikeid`) emosopimuksen `custrecord_sta_ca_customer`, jolle vuokraa on viimeksi laskutettu; vain sen laskut. Aiemmat asiakkaat (siirto, tyypit 1/9) eivät estä |
| k5: koko kausi `subsc_end_date`:en asti | Ikkuna `max(minDate, nyt - 5*30 pv)` (l. 14, 72-73); lähde `invoicehistory`-JSON | Poista `SIX_MONTHS_MS`. Kuukaudet: asiakkaan ensimmäinen vuokrakuukausi … `custrecord_sta_subsc_end_date` (l. 375-376; tyhjä = ei ylärajaa, tarkista) |
| k7: ei vaatimusta laskusta jokaiselle kuukaudelle | "no invoice found" = fail (l. 167-173, 238-244) | Poista molemmat. Ehto: ei yhtään maksamatonta vuokralaskua kaudella |
| Oomi ei Part A/B | `OOMI_*`-vakiot (l. 20-23), haara l. 380-405, `checkCategory1OomiDateBased` (l. 200-265) | Poista kokonaan; kaikki pyörät samalla säännöllä |
| k2: ei luokkaa 2 | `checkCategory2` (l. 272-355) ja `allPass = cat1 && cat2` (l. 411) | Poista luokka 2 ja sen lokirivit (summarize l. 461-492). Jälkiveloitus kuuluu velvoitteisiin (ADR 0012) |
| k2: vuokralasku ei pyöräkohtainen | Ei rajausta | Ota vain laskut, joilla `custbody_sta_bike_id` tyhjä ja `custbody_sta_is_so_type` tyhjä (ADR:n tunnistustaulu). Jälkimmäinen ei nyt rajaa mitään (tyhjä kaikilla 53 430 laskulla), mutta ehto säilytetään |
| k6/k1: maksettu = lasku Paid In Full, koko asiakas | `inv.status !== 'paidInFull'` (l. 177, 248) | Pidä, mutta käy läpi kaikki asiakkaan tarkistettavan kauden vuokralaskut (myös muiden pyörien rivit ja erääntymättömät). Osittain maksettu = maksamaton |
| k5: kauden ulkopuoliset laskut eivät estä | n/a | Rivit, joiden `revrec_start` > `subsc_end_date`, jätetään pois |
| k10: lippu lopullinen | Haku 796 rajaa lippu = F; skripti vain asettaa | Pidä. Älä koskaan palauta F:ksi |
| k11: ei käsin asetusta | README "Manual override"; solution §7 (l. 243-247) | Poista §7 ja README-osio; kirjaa: lähetys käsin ADR 0013 k10-11 mukaan |
| k9: lippu kun status 2 | Haku 796: status 2 AND SO Paid In Full AND SO-tyyppi AND `subsc_end_date` < 24 pv päästä (solution §3.1, l. 47-60) | Poista SO-ehdot (Main Line, SO Status, SO Type) **ja** päättymispäiväehto. Jäljelle: status 2, ei lähetetty, ei estetty, lippu F |
| Dokumentit | `NETSUITE_RECORDS_AND_FIELDS.md` §2 ja §5 (`duedate on`); `lease_fees_check_solution_v2.md` §4.1 (l. 110-115) | Korjaa: historiapäivä on vuokrakuukauden alku, ei eräpäivä; päivitä §3.1, §4.2-4.4, §7, §11 ja README:n kaavio/rajoitukset |

Koodiin ei tarvita `N/record.load` joka laskulle: yksi haku asiakkaan kaikista vuokrariveistä
(`entity`, `custcol_sta_so_revrec_start` välillä, `status`) riittää ja säästää governancea. Ryhmittele pyörä- ja asiakastason tulokset
`map`-vaiheessa, mutta asiakas voidaan myös välimuistittaa `reduce`-vaiheessa, jotta samaa asiakasta ei haeta 100 kertaa.

## 2. Käyttöönotto

1. Koodi ja dokumentit sisarrepon haaraan. Dry-run (ei `submitFields`) ensin: loki kertoo, mitkä pyörät saisivat lipun.
2. Aja tuotannossa kerran lokitilassa (ilman kirjoitusta). Vertaa T60:n odotukseen (§3).
3. Muuta haku 796 (SO-ehdot ja 24 pv ehto pois) vasta, kun skripti on ladattu. Käänteisesti haku laajenee ja vanha skripti ajaisi 296+ pyörää väärällä logiikalla.
4. Deploya skripti, pidä ajastus ennallaan. Siirtymä tehdään yhdellä kertaa.
5. Päivitä `schemas/script-inventory.md` ja TASKS T59.

## 3. T60: todennus ensimmäisen ajon jälkeen

- 131 Oomi-pyörää sekä B006141 ja B034775 saavat lipun T (löydös `findings/2026-10-08-lease-fees-check-duedate-findings.md`).
- Yksikään lippu T -pyörä ei ole asiakkaalla, jolla on avoin vuokralasku pyörän tarkistettavalla kaudella (`revrec_start` <= `subsc_end_date`, status muu kuin Paid In Full).
  Pidä tämä SuiteQL-kyselynä `queries/`-kansiossa.
- 58 pysäytettyä asiakasta pysyvät odottamassa (ADR 0016 k6), eikä odotus ole virhe.
- Todenna: lippu T ei ole asetettu yhdellekään pyörälle, jonka status on muu kuin 2.
- T58-kyselyn on palautettava 0 ennen ajoa, muuten Oomi-asiakkaat jäävät kauden ulkopuolelle.

## 4. Riski: lähetysskripti (haku 793, 1433) ja päättymisajankohta

**On riski.** ADR 0013 k3 edellyttää, ettei kauppakirja lähde ennen päättymisajankohtaa.
- Lähetysskriptissä ei ole kelpoisuussääntöä: `gbb-mr-send-bill-of-sale-pdf.js:108-111` vain lataa haun 793 (`search.load`). Kaikki ehdot ovat haussa, jota ei näe SuiteQL:llä (`findings/2026-10-06-kauppakirja-nykytila.md`).
- Nykyisin päättymispäivän läheisyyden takaa vain haun **796** ehto "subsc_end_date alle 24 päivän päässä". Kun se poistetaan (k9), lippu tulee T:ksi status 2:ssa. Jos haku 793 suodattaa vain lippua, lähetysta ja estoa, **kauppakirja lähtee ennen päättymisajankohtaa**. Kerran lähetettyä ei voi perua.
- Toimi: lue 793:n ehdot UI:sta ennen kuin 796 muutetaan. Jos siinä ei ole `subsc_end_date` < nyt (tai vastaavaa), lisää se 793:een **ennen** 796:n muutosta. Pidä 796:n 24 pv ehto, kunnes tämä on todennettu. 3 lokakuussa päättyvää OOMI-pyörää on jo saanut kauppakirjan (löydös N2), joten tämä ei ole teoreettinen.

## 5. Riskit

- Skripti ajaa vanhalla logiikalla (SCHEDULED) siihen asti. Älä muuta hakua 796 ennen koodia.
- `N/search`-suodatin voi hylätä kustomisarakkeen: ks. §0.
- Governance: asiakas voi olla iso (Kymenlaakson hyvinvointialue 448 riviä yhdellä laskulla). Haku asiakas+kausi, ei rivi riviltä.
- Lippu on lopullinen (k10): virheellinen T ei korjaannu skriptillä. Siksi dry-run ensin.
- Päättymisajankohta siirtyy jälkiveloituksessa (`handler_jalki`): kausi pitenee, mutta lippu ei palaudu (hyväksytty seuraus, k10).
