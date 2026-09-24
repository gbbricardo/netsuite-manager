# Status-sync hukkaa maksut, jotka näkyvät NetSuitessa yli 5 vrk myöhässä

**Havaittu:** 23.09.2026 · **Tila:** S1 ajettu 23.09. (27/27), **S1b tarvitaan** (5 uutta), pysyvä korjaus = [ADR 0007](../docs/adr/0007-status-sync-2-tasmaytysajo.md) lokakuussa · **Omistava repo:** `netsuite-bike-redemption-status-sync`
· **Vakavuus:** korkea — maksettu lunastus ei pääty koskaan, eikä mikään kerro siitä
**Liittyy:** [`2026-09-21-maksetut-active-pyorat-ilman-selvitystapaa.md`](2026-09-21-maksetut-active-pyorat-ilman-selvitystapaa.md),
[`2026-09-23-handler-lunastus-rikkoo-pykala-5-kun-maksu-on-aiempi.md`](2026-09-23-handler-lunastus-rikkoo-pykala-5-kun-maksu-on-aiempi.md),
[ADR 0004](../docs/adr/0004-paatospaivan-kirjoittaa-ue.md), [ADR 0006](../docs/adr/0006-historical-unknown-selvitystapa.md)
**Korjausehdotus:** [`../docs/status-sync-maksuhavainto-muutosspeksi.md`](../docs/status-sync-maksuhavainto-muutosspeksi.md)
**Korjauslista:** [`2026-09-23-status-sync-maksuikkuna-korjauslista.csv`](2026-09-23-status-sync-maksuikkuna-korjauslista.csv)

> [!IMPORTANT]
> **Tarkennettu 23.09. illalla, [ADR 0008](../docs/adr/0008-keskenkauden-lunastuksessa-cr-voittaa-maksun.md):**
> keskenkauden lunastuksessa CR:n vastuukirjaus voittaa maksun. Tästä seuraa kolme asiaa:
>
> 1. Alla mainitut *"§5-rikkomukset"* eivät ole virheitä niillä pyörillä, joilla on tyypin 2 CR.
>    Tämä koskee myös 140 Redeemed-pyörän joukkoa.
> 2. S1:n `TARKISTA`-rivien korjaus B018311 ja B031476 (17.09. → maksupäivä) oli **väärin**, ja
>    ne palautetaan 17.09.:ään.
> 3. Keskenkauden pyörille korjauslista kirjoitti tavan ja `liab_settled_at`:n, jotka kuuluvat
>    CR:lle.
>
> Maksujen havaitsemisen aukko itse on edelleen todellinen: `paid_at` puuttui, ja kauden lopun
> lunastukset jäivät päättymättä.

## Havainto

Osa A valitsee maksut ±5 vrk ikkunasta, joka lasketaan **tapahtuman omasta päivästä**
(Paylinkin `custrecord_pl_paid_at`, laskun `trandate`) — ei siitä päivästä jona maksu tuli
NetSuitessa näkyviin. Kun Paylink-pyyntö merkitään valmiiksi tai lasku kuittautuu *Paid In Full*
-tilaan vasta ikkunan sulkeuduttua, pyörä ei osu yhteenkään ajoon. `redemption_paid_at` ja
selvitystapa jäävät kirjaamatta, eikä kukaan yritä uudelleen.

21.09. löydös totesi saman ikkunan ongelmaksi pyörille, joilla `paid_at` **oli** jo. Tämä on
aukon toinen, pahempi puoli: maksua ei ole kirjattu rekisteriin lainkaan, joten mikään
rekisteripohjainen mittari ei näe sitä.

### Todennettu NetSuitesta 23.09.2026

Pyöriä, joilla on aito maksutodiste (valmis Paylink-pyyntö SO-tyypillä 3/4, tai skriptin ehdot
täyttävä *Paid In Full* -lunastuslasku, joka **ei** ole kokonaan hyvitetty), mutta
`custrecord_gbb_redemption_paid_at` on tyhjä:

| Status | Selvitystapa | kpl | Merkitys |
|---|---|---|---|
| 1 Active | tyhjä | **24** | **ei pääty koskaan** — sweep vaatii selvitystavan |
| 1 Active | 1 | 2 | päättyy (`liab_settled_at` on), mutta `paid_at` puuttuu ja §5 rikki |
| ei statusta | tyhjä | 1 | B036864, kausi päättyi 31.10.2025 |
| 2 Redeemed | 1 | 145 | `paid_at` puuttuu, koska osa A lukee vain Active-pyöriä. **140:llä maksu on aiempi kuin `liab_settled_at`**, eli §5-rikkomus, jota mittari ei näe, koska `paid_at` on tyhjä |
| 2 Redeemed | 8 `historical_unknown` | **134** | ks. *Sivulöydös 2* |
| 2 Redeemed | 6 | 52 | vakuutus; `paid_at` ei kuulu tälle tavalle — ei korjata |
| 2 / 3 | 2 / 5 | 1 + 3 | ei korjata |

Aineisto ja kyselyt: korjauslista (27 riviä = kolme ensimmäistä riviä) ja § *Kyselyt*.

### Miksi juuri nyt: Paylink-jonon purku 23.09.

Viidellä esimerkkipyörällä (12880, 27471, 43416, 44011, 46480) Paylink-maksu oli 07.–17.09.,
pyyntö luotiin NetSuiteen samana iltana, mutta **SO luotiin ja pyyntö merkittiin valmiiksi vasta
23.09. klo 13:45–13:57**, ja lasku luotiin klo 14:02–14:04 taannehtivalla päivämäärällä. Tämän
yön ajon ikkuna on 19.–29.09. Näistä 27 pyörästä siihen osuu **vain B024003** (lasku 21.09.).

Miksi pyynnöt jäivät jonoon, jää auki — kyse on `netsuite-paylink-order-tracking`-ketjusta (tila
4 *Error* tai 5 *Pending Bike* ennen purkua, **päätelty**). Status-sync ei saa olla riippuvainen
siitä, että ylävirta on ajallaan.

### Ongelma ei ole kertaluonteinen

Mitattu kaikista vuoden 2026 lunastusmaksuista:

| Lähde | Maksuja | Näkyviin yli 5 vrk maksupäivän jälkeen | Osuus |
|---|---|---|---|
| Lasku ilman Paylinkiä (`closedate − trandate`) | 495 | **269** | **54 %** |
| Paylink (`SO:n createddate − pl_paid_at`) | 8 942 | 402 | 4,5 % |

Laskupolulla ikkuna on siis rakenteellisesti väärin: **yli puolet** käsin laskutetuista
lunastuksista maksetaan myöhemmin kuin viisi päivää laskupäivästä. Vanhin tämän listan tapaus on
B046429, lasku 10.06., maksettu 01.07.

## Molemmat puolet

**Sääntö** — [`../docs/lunastuksen-kenttasaannot.md`](../docs/lunastuksen-kenttasaannot.md)
§ `custrecord_gbb_redemption_paid_at`:

| | |
|---|---|
| **Arvo** | lunastusmaksun todellinen maksupäivä |
| **Milloin** | kun maksu havaitaan, **riippumatta pyörän tilasta** |
| **Write-once** | kyllä (automaatiossa) |
| **Omistaja** | maksuvetoinen automaatio |

**Koodi** — `gbb_ss_bike_redemption_status_sync.js`, neljä poikkeamaa samasta säännöstä:

| # | Kohta | Koodi tekee | Sääntö sanoo |
|---|---|---|---|
| 1 | `:263` `PAID_WHERE_SQL` | valitsee maksut ±5 vrk ikkunasta **tapahtumapäivän** mukaan | kun maksu havaitaan |
| 2 | `:290`, `:357` `br.custrecord_sta_bike_status = ?` (Active) | ohittaa Redeemed-pyörät | riippumatta pyörän tilasta |
| 3 | `:333` `t.trandate AS eventdate` | kirjaa laskun **laatimispäivän** | todellinen maksupäivä |
| 4 | `:453` `alreadyStamped` vertaa vain yhtäsuuruutta | **ylikirjoittaa** eri päivän (toinen maksu, toinen Paylink) | write-once |

Lisäksi `:442` *"custrecord_gbb_liab_settled_at is still never written here: the run date is not the
real settlement date"* — perustelu on oikea ajopäivälle, mutta skripti tietää **maksupäivän**, joka
on §5:n mukaan juuri tämän kentän arvo selvitystavalla 1. ADR 0004 kohta 3: *"Kentän ainoaksi
korvaamattomaksi tehtäväksi jää pysyväistää se todiste joka ei asu pyörärekisterissä — maksettu
lunastuslasku ja valmis Paylink-pyyntö. … **Tätä ei tee tänään kukaan.**"* Status-sync on ainoa
skripti joka näkee molemmat todisteet.

## Sivulöydös 1: *Paid In Full* ei tarkoita maksettua

Lasku saa tilan `B` myös silloin kun se **hyvitetään kokonaan**. Skripti ei erota näitä.
Todennettu `NextTransactionLineLink`-taulusta (`linktype = 'Payment'`, `CustCred`):

| | kpl |
|---|---|
| Vuoden 2026 *Paid In Full* -lunastuslaskuja, jotka on kuitattu **kokonaan** hyvityslaskulla | **22** |
| …osittain hyvitettyjä (loppu maksettu) | 9 |
| Tämän listan Active-pyöriä, joiden **ainoa** "maksu" on kokonaan hyvitetty lasku | 5 — 5931, 10417, 17703, 22238, 10316¹ |
| Redeemed-pyöriä, joiden `paid_at` = kokonaan hyvitetyn laskun päivä | 1 — B043001 (lasku 30.07., hyvitys 31.07.; Done-CR 4855 on) |

¹ B010316:lla on lisäksi myöhempi, aidosti maksettu lasku INVGBB1014060, joten se on
korjauslistalla.

Nuo viisi välttyivät väärältä `paid_at`-leimalta **vain siksi että ikkuna oli jo ohi**. Jos ikkuna
korjataan ilman hyvitystarkistusta, skripti kirjaa ne maksetuiksi ja sweep lunastaa ne ilman
maksua. **Korjaukset 1 ja tämä on tehtävä yhdessä.**

## Sivulöydös 2: 134 `historical_unknown`-pyörällä on maksu

ADR 0006 antoi arvon 8 pyörille, joilla *"ei yhtään todistetta"* — mutta määritelmä katsoi vain
rekisterin kenttiä (`liab_settled_at`, `paid_at`, selvitystapa). 134:llä näistä on aito
maksutodiste laskuilla tai Paylinkissä. Arvon 8 merkitys on *"miten velvoite hoidettiin **ei ole
tiedossa eikä rekonstruoitavissa**"*; näillä 134:llä se on rekonstruoitavissa.

Tämä ei vaikuta mihinkään toiminnallisesti (8 on maksuton todiste, status 2 pysyy), joten korjaus
ei ole kiireellinen. Se on päätöskysymys: kirjataanko ne tavalle 1 maksupäivineen vai jätetäänkö
historiatieto sellaisenaan. **Muutosehdotus ei koske niitä** — skripti ei saa kirjoittaa `paid_at`
pyörälle jonka selvitystapa on muu kuin 1 tai tyhjä.

## Seuraus nyt

- **24 + 1 pyörää** on tilassa 1 (*käynnissä*) kirjaston silmin. Sweep ei käsittele niitä koskaan.
  Kuukausiraportointi raportoi ne aktiivisina, ja laskutus jatkuu.
- Viiden pyörän päättymisajankohta on jo ohi tai tässä kuussa (3358, 10316: 31.08.; 5324, 20065:
  30.09.; 46480: 29.09.). Ne olisivat statuksella 2 heti tämän yön sweepissä.
- **Neljällä pyörällä on tänään luotu Pending 2C -CR** (7933, 10316, 24003, 26700). Jos CR
  käsitellään ennen korjausta, `handler_lunastus` kirjoittaa `liab_settled_at` = 23.09., vaikka
  maksu oli 22.09. — sama §5-rikkomus kuin B025325:llä. Jos korjauslista ajetaan ensin, handler
  jättää kentän rauhaan (write-once) eikä rikkomusta synny.

## Korjaus

**Heti:** CSV-import [`2026-09-23-status-sync-maksuikkuna-korjauslista.csv`](2026-09-23-status-sync-maksuikkuna-korjauslista.csv),
27 riviä, **UPDATE**. Kirjoittaa `custrecord_gbb_redemption_paid_at` = maksupäivä,
`custrecord_gbb_liab_settle_method` = 1 ja `custrecord_gbb_liab_settled_at` = maksupäivä.
Mappaus kuten [21.09. importissa](../imports/2026-09-21-selvitystapa-active/README.md) sekä
`maksupaiva` → `custrecord_gbb_redemption_paid_at`. `lahde` ja `peruste` jätetään mappaamatta.

Maksupäivä = aikaisin päivätty todiste: Paylinkin `custrecord_pl_paid_at`, muuten laskun
`closedate` (päivä jona lasku kuittautui kokonaan). **Ei** laskun `trandate`.

Kolme riviä on merkitty `TARKISTA`:

| Pyörä | Miksi |
|---|---|
| B018311, B031476 | `liab_settled_at` on jo 17.09. (automaation kirjoittama), maksu 07.09. / 04.09. CSV korjaa sen §5:n mukaiseksi. Käsin tehty korjaus on sallittu (write-once koskee automaatiota), mutta se on päätös. Jätä sarake mappaamatta näiltä, jos et halua korjata. |
| B036864 | Pyörällä ei ole statusta lainkaan. Import kirjaa maksun, mutta sweep lukee vain status 1:tä, joten pyörä ei silti pääty. Kuuluu 137 statuksettoman pyörän selvitykseen. |

**Ajojärjestys:** import **ennen** seuraavaa CR-ajoa (4 × 2C) ja ennen seuraavaa sweep-ajoa.
Import laukaisee `ue_gbb_redemption_decided_at`:n (päätöspäivä = importtipäivä), ja seuraava
sweep kääntää ne viisi pyörää, joiden tunnistuspäivä on jo ohi.

**Pysyvästi:** muutosspeksi [`../docs/status-sync-maksuhavainto-muutosspeksi.md`](../docs/status-sync-maksuhavainto-muutosspeksi.md).

## S1:n tila — tarkistettu 23.09.2026 illalla

**Import on ajettu.** Kaikilla 27 pyörällä oli `lastmodified` 23.09. klo 17:21 (NetSuiten kello), ja
arvot vastaavat CSV:tä rivi riviltä: `paid_at`, tapa 1 ja `liab_settled_at` = maksupäivä. Myös
`TARKISTA`-rivit korjautuivat: B018311 07.09. ja B031476 04.09. (aiemmin 17.09.). B036864 sai
maksun, mutta sillä ei edelleenkään ole statusta.

**2C-CR:t ovat yhä Pending** (6684–6690, viimeksi muokattu 23.09. aamulla). Ajojärjestys siis
toteutui: kun handler käsittelee ne, `liab_settled_at` on jo maksupäivä, ja write-once pitää sen.

### Kolme havaintoa

**1. Paylink-jonon purku jatkui importin jälkeen, ja 5 uutta pyörää putosi samaan aukkoon.**
Pyynnöt merkittiin valmiiksi klo 17:31–17:44 ja laskut luotiin klo 18:04–18:05, eli 10–40
minuuttia importin jälkeen. Poimintakysely palauttaa nyt **5** eikä 0:

| Pyörä | Tapa | `liab_settled_at` | Päättymisajankohta | Aikaisin todiste | Tämän yön ikkuna 19.–29.09. |
|---|---|---|---|---|---|
| B003280 | — | — | 30.09.2026 | Paylink 17036, 14.09. | **ei osu** |
| B003403 | — | — | 30.09.2026 | Paylink 17412, 17.09. | **ei osu** |
| B006299 | — | — | 31.05.2029 | Paylink 17925, 22.09. | osuu |
| B042663 | — | — | 20.06.2029 | Paylink 17514, 18.09. | **ei osu** |
| B044934 | 1 | 17.09. | 31.10.2026 | Paylink 17189, 15.09. | ei osu. §5-ristiriita jo olemassa (17.09. ≠ 15.09.) |

B003280 ja B003403 päättyvät tässä kuussa. Ilman täydennystä ne jäävät Activeksi eivätkä pääse
syyskuun IC-listalle. **Tarvitaan täydentävä S1b-CSV samalla säännöllä, ja poimintakysely on
ajettava uudelleen vielä 30.09. ennen S3:a**, koska jonon purku voi jatkua.

**2. CSV-import ei laukaissut päätöspäivä-UE:ta.** `custrecord_gbb_redemption_decided_at` on tyhjä
25 pyörällä 27:stä. Kahdella se on 21.09., eli arvo on vanha eikä tämän importin. Sama näkyy
aiemmista importeista: pyörillä, joilla on selvitystapa ja joita on muokattu 19.09. jälkeen,
päätöspäivä on tyhjä **2 304** status 2 -pyörällä ja on asetettu vain 120:llä. ADR 0004
perusteli UE:n juuri sillä, että *"UE kattaa myös käsin tehdyt muutokset, **CSV-importit** ja
cf-gbb-toolsin kirjoitukset"*. Tuotannossa todennettiin kuitenkin vain EDIT, XEDIT ja automaatio
(`lunastus-tilanne.md` § *Todennettu tuotannossa*), ei CSV:tä.
**Todennäköinen syy (päätelty):** CSV-importin *Advanced Options → Run Server SuiteScript and
Trigger Workflows* on pois päältä. Vaikutus on nyt pieni, koska tavalla 1 kirjasto ei lue
päätöspäivää. Maksuttomilla tavoilla kenttäsääntö kuitenkin lukee päivän juuri siitä, joten CSV:llä
kirjattu maksuton tapa jää ilman päivää.

**3. Kalenterisweep kääntää tänä yönä viisi.** B003358 ja B010316 (päättyi 31.08.), B005324 ja
B020065 (30.09.) sekä B046480 (29.09.) täyttävät nyt `saakoMerkitaPaattyneeksi`-ehdon.
Todenna huomenna: status 2, `date_to_non_active` täyttyy viiveellä, eikä yhtään kääntöä ole
kvadrantissa *2/3 + tulevaisuudessa*.

## Kyselyt

Korjauslistan poiminta (status 1 tai tyhjä, aito todiste, `paid_at` tyhjä):

```sql
SELECT br.id, br.name
FROM customrecord_sta_bike_register br
WHERE (br.custrecord_sta_bike_status = 1 OR br.custrecord_sta_bike_status IS NULL)
  AND br.custrecord_gbb_redemption_paid_at IS NULL
  AND ( EXISTS (SELECT 1 FROM customrecord_payment_requests pr
                JOIN transaction so ON so.id = pr.custrecord_pl_ns_so_id
                WHERE pr.custrecord_pl_ns_bike_id = br.id
                  AND pr.custrecord_pl_ns_status = 3
                  AND so.custbody_sta_is_so_type IN (3,4))
     OR EXISTS (SELECT 1 FROM transaction t
                WHERE t.custbody_sta_bike_id = br.id AND t.type = 'CustInvc' AND t.status = 'B'
                  AND EXISTS (SELECT 1 FROM transactionline tl WHERE tl.transaction = t.id AND tl.item = 46)
                  AND ( t.custbody_sta_is_so_type IN (3,4)
                     OR ( t.custbody_sta_is_so_type IS NULL
                          AND (SELECT COUNT(*) FROM transactionline c
                               WHERE c.transaction = t.id AND c.mainline = 'F' AND c.taxline = 'F') = 1))
                  AND NOT EXISTS (SELECT 1 FROM NextTransactionLineLink l
                                  JOIN transaction cm ON cm.id = l.nextdoc
                                  WHERE l.previousdoc = t.id AND l.linktype = 'Payment'
                                    AND cm.type = 'CustCred' AND -cm.foreigntotal >= t.foreigntotal)) )
ORDER BY br.id
```

Importin jälkeen tämä palauttaa **0** riviä. Jos se palauttaa rivejä myöhemmin, aukko on auki
(ennen muutosspeksin toteutusta se on odotettavaa).

## Todennettu vs. päätelty

**Todennettu NetSuitesta 23.09.2026:** populaatiotaulukko; 27 riviä maksupäivineen; Paylink-SO:iden
ja laskujen luontiajat 23.09.; 269/495 ja 402/8 942; 22 + 9 hyvitettyä laskua ja niiden summat;
B043001:n Done-CR 4855; neljä Pending 2C -CR:ää (6684, 6685, 6687, 6689); 145 Redeemed-pyörän
maksupäivä verrattuna `liab_settled_at`:iin: 140 aiempi, 3 sama, 2 myöhempi; muutosspeksin
kandidaattikysely ajettu, tulos 24 + 2 + 145 + 1.
**Todennettu lokista (`scriptnote`, 1440):** 21.09. ja 22.09. ajojen ikkunat ja yhteenvedot; yksikään
listan pyörä ei esiinny osan A riveillä.
**Todennettu koodista:** rivit `:263`, `:290`, `:333`, `:357`, `:442`, `:453`.
**Päätelty:** laskun `closedate` on paras saatavilla oleva maksupäivä — varsinaista CustPymt-tapahtumaa
ei löytynyt `NextTransactionLineLink`-taulusta eikä samalta asiakkaalta, joten pankkimaksun oma päivä
voi olla 0–1 päivää aiempi. Paylink-jonon syy (tila 4/5) on päätelty, ei todennettu `systemnote`sta.
