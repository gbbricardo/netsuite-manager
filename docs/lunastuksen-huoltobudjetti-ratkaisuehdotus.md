# Ratkaisuehdotus: lunastuksen ennakko ja lopullinen selvitys

**Päivä:** 5.11.2026 · **Tila:** ehdotus, ei hyväksytty ADR eikä toteutettu muutos.

Tausta: [löydös](../findings/2026-11-05-huoltobudjetti-kuitataan-ennen-kauden-loppua.md).
Tutkimus perustuu sisarrepojen paikalliseen koodiin ja dokumentteihin sekä vain lukeviin tuotantokyselyihin. Kaikkien paikallisten tiedostojen vastaavuutta tuotantoon, workflow-määrittelyjä ja kaikkia huoltokanavia ei varmistettu.

## Suositus

**Muuttuvaa huoltohyvitystä ei käytetä lopulliseen lunastushintaan ennen kuin huolto-oikeus on sulkeutunut ja aiemmin tilatut huollot on selvitetty.**

Kaksi kuukautta ennen päättymistä lähetetään ennakkoviesti ja arvio niille, joiden hyvitys voi vielä muuttua. Heille lähetetään lopullinen maksulinkki vasta selvityksen valmistuttua. Niiden pyörien nykyinen ennakkolinkki voidaan säilyttää, joiden hinta on jo vahvistettavissa. Pelkkä tämänhetkinen nollahyvitys ei todista hintaa pysyväksi: myös kuukausikertymä, avoimet työt, hyvityslaskut ja pidennykset on huomioitava.

Tavoitteena on yksi loppuselvitys pyörän sopimukselle, josta asiakaspalvelu näkee **mitä luvattiin, mitä hyvitettiin, mitä maksettiin ja mitä vielä odotetaan**. Pyörärekisterin selvitystapa on tämän vahvistettu tulos. Lähetysmerkintä tai maksuhavainto ei yksin ole lopputulos.

## Tutkimuksessa löytyneet riippuvuudet

| Repo / työ | Havainto | Vaikutus ratkaisuun |
|---|---|---|
| `GoByBike` – huoltotilaus ja käyttäjän budjettinäkymä | `src/services/bikeServiceOrderService.ts:63–135` sallii normaalin huoltotilauksen, kun portaalin `order.end`-päivään on yli 30 päivää. OOMI-budjettitarkistus (`netsuiteService.ts:2872`) lukee tyypin ja huoltosumman; se ei lue NetSuiten huoltokieltoa tai lunastukseen käytettyä hyvitystä. Virheessä tarkistus palauttaa ei-OOMI-tuloksen. | 60 päivän linkki ja 30 päivän huoltoraja jättävät päällekkäisen jakson. Yksi yhteinen huolto-oikeuden päättymishetki ja sama saldo kaikille kanaville. Virhettä ei saa tulkita luvaksi käyttää hyvitettyä budjettia. |
| `GoByBike` – keskeneräinen huolto | `bikeServiceOrderService.ts:297` alkaen sekä `netsuiteService.ts:2967`: huolto synkronoidaan NetSuiteen vasta GBB:n hyväksynnässä. Ennen sitä työ voi olla portaalissa ilman NetSuite-ostotilausta. | NetSuiten avoimien ostotilausten tarkistus yksin ei todista huoltojen valmistumista. Myös portaalin työt ja synkronointivirheet on tuotava selvitykselle. |
| `netsuite-staria-suitescripts` – huoltobudjetin kertymä | `sta_ss_monthly_maintenance_budget.js:43–89` vähentää kuukausibudjetin huoltosummasta eli kasvattaa käytettävissä olevaa budjettia. Valinta käyttää Active-statusta ja päättymispäivää. | Jo lähetetyn hinnan hyvitys voi myöhemmin myös kasvaa. Kertyminen pitää laskea ansaintajakson mukaan ja kirjata kerran pyörää ja kuukautta kohti. |
| Sama repo – toteutunut kustannus ja pidennys | `sta_mr_vendor_bill_logic.js:326–350` lisää ostolaskun nettosumman rekisteriin ja leimaa laskun erikseen; `sta_ue_bike_register_hook.js:1189` alkaen voi luoda huoltopidennyksen ja siirtää päättymispäivää. | Hyvitys ei ole lopullinen ennen töiden kohdistusta. Myöhäinen ostolasku ja muuttuva päättymispäivä on tunnistettava. Raakahuoltosumman muuttaminen lunastusvaraukseksi sotkisi tämän laskennan. |
| `netstuite-send-end-redemption-payment-link` – 1479 | Kirjoittaa tavan 3 jo ennakkoikkunassa; maksullisen linkin hinta ja hyvitys jäävät lähetyshetkeen. | Erota ennakkoviesti ja lopullinen linkki. Poista ennakkolaskennan oikeus kirjata lopullinen huoltokuittaus. Tallenna hinnan perusteet pysyvästi. |
| `netsuite-paylink-order-tracking` | Maksupyyntö saa oman SO:n ja talletuksen. Maksupyynnön Completed on tämän integraatiokäsittelyn lopputila (`docs/bike-so-deposit-completion-matching.md`), ei huoltojen valmistumisen tarkistus. | Säilytä maksufakta ja nykyiset duplikaattisuojat. Kohdista maksu loppuselvityksen tiettyyn maksupyyntöön. Älä päättele kokonaisvastuun kattavuutta vain Completed-tilasta. |
| `netsuite-bike-redemption-status-sync-rss2` – 1480 | Päätösmoduulin vaihe 2 ei avaa tapaa 3 uudelleen. OOMI saa päättymiskuussa tavan 1 ilman käyttäjän maksua, koska Oomi kattaa maksamattomat maksut. Vaiheet 3–4 johtavat statuksen ja IC:n kirjatuista kentistä. | Loppuselvitys luettava myös olemassa olevan tavan ja päättyneen statuksen jälkeen. OOMI:n työnantajavastuu on erotettava käyttäjän maksusta; se ei ole maksuhavainto eikä osoitus huoltosaldon lopullisuudesta. |
| `netsuite-subscrption-cr-scripts` – jaettu kirjasto ja CR-käsittely | `gbb_lunastus_lib.js:312–340` luottaa suorituspäivään/maksuttomaan tapaan; `handler_lunastus.js` saa keskenkauden kuittauksen CR:stä. `handler_jalki` siirtää loppupäivää. | Lopullinen taloudellinen selvitys ja sopimusmuutoksen valtuutus ovat eri asioita. Keskenkauden manuaalilinkit käyttävät samaa hyvitystä (ADR 0024), joten nekin liitetään selvitykseen. |
| `netsuite-subscription-extension` – T61 | Ehdokasvalinta edellyttää tyhjää tapaa; päätös käyttää muuttuvaa huoltosaldoa. Ilman linkkiä pyörä voidaan ohittaa. | Uusi odotustila täytyy tunnistaa. Järjestelmän odottama huoltolasku tai linkin viive ei saa laukaista asiakasta laskuttavaa pidennystä. Varsinainen maksamaton lunastus käsitellään edelleen erikseen. |
| `netsuite-monthly-reporting` | `mr_monthly_reporting_ri_creation.js:1175–1220` päättää Ended-rivin sopimuspäivän ja velvoitetodisteen avulla. Pelkkä tavan lykkäys voi muuttaa raportointikäytöstä. | Sopimuksen päättymistä ja loppuselvityksen valmistumista ei saa pakottaa samaksi päiväksi. Palkkavähennyksiä ei jatketa teknisen selvitysjonon takia; olemassa olevat sopimuspäivän ankkurit säilytetään erillisinä. |
| `netsuite-ic-calculators` | Syöte on rekisteriin kirjoitettu IC-päivä. | Asiakkaan selvitysviive ei saa sattumalta siirtää IC-kauppaa. IC:n oman ajankohdan ja edellytysten sääntö vahvistetaan erikseen. |
| `netsuite-br-lease-fees-check` ja `netsuite-send-bill-of-sale-pdf` – T48/T49 | Vuokramaksulippu kertoo vuokralaskuista. Kauppakirjaskripti luottaa tallennettuun hakuun; nykyisissä ehdoissa on jo tunnistettu laskuttomien lunastusten aukko. | Vuokrien tarkistus ei todista lunastushyvityksen oikeellisuutta. Kauppakirjan ehtoihin tuodaan vahvistettu loppuselvitys ja sovitut OOMI-poikkeukset. |
| `cf-gbb-tools` – T51 ja T83 | ML4 vaatii tyhjän tavan. Hyvitysnäkymä näyttää nykyisestä summasta laskettua arvoa, ei vahvistettua käytettyä hyvitystä. | Näytä arvio ja vahvistettu hyvitys erikseen. Lisää selvitysjonot ja muuttuneiden perusteiden hälytykset. |
| `netsuite-webhook` | Sisältää pyörärekisterin kenttien välityksen; pelkkä kentän lähettäminen ei ole huolto-oikeuden valvonta. | Välitä selvityksen tila ja voimassa oleva oikeus myös portaaliin, mutta lopullisen päätöksen on perustuttava ajantasaiseen tarkistukseen. |

`docs/sisarrepot.md`:n vanhat kuvaukset (30 päivän lähetys, OOMI-rajaukset, vanha status-sync ja puuttuvat testiajurit) eivät kaikilta osin vastaa nykykoodia. Yllä oleva kartta perustuu varsinaisiin toteutuksiin ja uudempaan tehtävähistoriaan.

## Tuotantorajaus

5.11. luettu Active-pyörien joukko, jonka loppu on 5.11.2026–5.1.2027 ja jolla on negatiivinen huoltosumma tai positiivinen kuukausibudjetti:

| Ryhmä | Määrä |
|---|---:|
| OOMI, tapa 3, ei lähetysmerkintää | 15 |
| OOMI, ei tapaa, lähetysmerkintä | 4 |
| Muu / tyhjä pyörätyyppi, ei tapaa, lähetysmerkintä | 3 |
| OOMI, tapa 1, ei lähetysmerkintää | 1 |
| **Yhteensä** | **23** |

Kaikilla 15 tavan 3 pyörällä on myös positiivinen kuukausibudjetti. Aiempi havainto pitää: niiden tämänhetkinen hyvitys kattaa hinnan vielä. Seitsemän lähetysmerkittyä pyörää ovat lisätutkittavia, eivät todiste vajaasta maksusta tai siitä, että linkistä varmasti vähennettiin huoltohyvitys. Myös tavan 1 alkuperä pitää selvittää.

Tämä on käyttöönoton alkulista, ei koko riskipopulaatio: positiivinen huoltosumma voi oikeuttaa porrashyvitykseen, ja päättyneitä tai jo Redeemed-tilaisia pyöriä ei ole tässä rajauksessa. Kysely: [`queries/2026-11-05-huoltobudjetti-lunastuksen-ikkunassa.sql`](../queries/2026-11-05-huoltobudjetti-lunastuksen-ikkunassa.sql). Tulos: [`lifecycle-cohort.json`](../artifacts/2026-11-05-maintenance-settlement/lifecycle-cohort.json).

## Asiakkaan ja asiakaspalvelun uusi kulku

1. **Ennakko noin 2 kk ennen loppua.** Asiakas saa päättymispäivän, lunastuksen perushinnan, tämänhetkisen arvioidun huoltohyvityksen ja tiedon siitä, milloin lopullinen hinta vahvistetaan. Arvio ei lupaa nollalunastusta. Pysyvän hinnan pyörälle voidaan lähettää lopullinen linkki jo tässä.
2. **Huolto-oikeus sulkeutuu yhtenä päivänä kaikissa kanavissa.** Nykyinen portaali käyttää 30 päivän rajaa, mutta se ei yksin osoita kaikkien sopimusten oikeaa huolto-oikeutta. NetSuiteen tallennetaan oikean sopimussäännön mukainen päättymishetki. Raja tarkistetaan uutta työtä hyväksyttäessä; sen yli voidaan käsitellä jo hyväksytyt työt.
3. **Aiemmat työt selvitetään.** Portaalin aloitetut työt, NetSuite-ostotilaukset, ostolaskut ja hyvitykset yhdistetään samaan työhön. Työ on joko peruttu tai sen lopullinen asiakkaan budjettia rasittava kustannus on vahvistettu. Lasku voi saapua myöhemmin, jos sen kustannus on jo luotettavasti vahvistettu: samaa kulua ei lasketa kahdesti. Pelkkä odotusajan kuluminen ei todista valmiutta.
4. **Lopullinen hinta vahvistetaan ja säilytetään.** Perushinta, käytetty hyvitys, huoltosaldo, käytetty porrastus, ALV ja senttipyöristys kirjataan selvitykselle. Mahdollinen loppupäivän muutos tarkistetaan ennen vahvistusta. Käyttämättömän budjetin ylijäämää ei tulkita automaattisesti palautettavaksi rahaksi.
5. **Maksu tai maksuton lunastus.** Positiiviselle lopulliselle summalle yksi aktiivinen maksupyyntö. Todellinen nollahinta voidaan kuitata tavalla 3, jos syy on huoltohyvitys; perushinnan 0 ja käsirahan tapa 4 pidetään erillään. Alle Paylink-minimin jäävä pieni saatava kirjataan omalla syyllään, eikä esitetä täytenä huoltobudjetin kattavuutena.
6. **Automaattinen loppuselvityksen täsmäytys jatkuu.** Maksu kohdistetaan tiettyyn selvitykseen ja sen summaan. Myöhäinen lasku, hyvitys, hintakorjaus tai sopimusmuutos luo poikkeaman ja jäljitettävän korjauksen. Historiallista hyväksyttyä hintaa ei korvata nykyarvolla.

Nykyinen eräpäivä on 14 päivää ennen loppua. Jos lopullinen hinta valmistuu ajoissa, sääntö voidaan säilyttää. Jos se valmistuu myöhemmin, ehdotan asiakkaalle **14 päivän maksuaikaa lopullisen pyynnön lähetyksestä**. Järjestelmän viive ei saa tehdä laskusta heti myöhässä olevaa. Tämä muuttaa nykyistä sääntöä ja kirjataan uuteen ADR:ään.

## NetSuiteen tarvittava pienin yhtenäinen rakenne

Ehdotan uutta **lunastuksen loppuselvitystietuetta**, yhtä sopimuksen lunastustapahtumaa kohti. Tarkkoja kenttätunnuksia ei ole vielä päätetty tai luotu.

- Pyörä, sopimuksen tunniste ja lunastuksen laji; päättymispäivä sekä huolto-oikeuden päättymishetki.
- Tila: **ennakko → odottaa huoltoja → hinta vahvistettu → odottaa maksua → selvitetty**, lisäksi **poikkeama** ja **peruttu**. Sopimuksen tila on erillinen.
- Vahvistettu hinta ja käytetty hyvitys perusteineen; laskentasäännön versio. Ennakkoarvio erikseen.
- Avoimien huoltojen/integraatiovirheiden esteet sekä seuraava toimenpide ja vastuuhenkilö poikkeamassa.
- Viittaukset huoltoihin, Paylink-tilauksiin, maksuihin ja korjauksiin; myös käsin luodut linkit mukaan.
- Todellinen maksaja ja suorituksen peruste: käyttäjän maksu, hyväksytty huoltohyvitys, sovittu jälkiveloituskattavuus tai OOMI-vastuu. Näitä ei päätellä toisistaan.

Pyörärekisterin nykyiset loppukentät jäävät muiden skriptien tarvitsemaksi yhteenvedoksi. Niitä ei tyhjennetä sokkona, eikä suorituspäivää käytetä alustavan arvion tallentamiseen. `redemption_paid_at` säilyy todellisena maksuhavaintona.

Loppuselvitykselle tulee **yksi kirjoittava omistaja**: ehdotan sen sijoittamista maksulinkkirepoon uutena selvitysmoduulina ja ajona, koska se omistaa jo loppulunastuksen hinnoittelun ja asiakasviestin. Paylink-integraatio toimittaa maksut, huoltoprosessi toimittaa työt/kustannukset ja status-sync soveltaa vahvistettua tulosta. Omistajuus koskee tässä taloudellista loppuselvitystä; CR-käsittelijä valtuuttaa edelleen sopimusmuutokset.

Ajastus auttaa viiveisiin, mutta oikeellisuus ei saa riippua siitä, mikä skripti sattui ajamaan ensin. Tapahtumat merkitsevät selvityksen tarkistettavaksi; toistuva täsmäytys löytää myös puuttuneen tapahtuman. Sama työ, kustannus, kuukausikertymä, viesti ja maksupyyntö käsitellään kerran omalla pysyvällä tunnisteellaan. Ulkoisen Paylink-luonnin ja viestin lähetyksen väliin tarvitaan tallennettu työvaihe, jotta keskeytynyt ajo ei luo toista tilausta tai jätä viestiä pysyvästi lähettämättä.

## Kolme asiaa pidetään erillään

**Sopimuksen päättyminen** kertoo vuokrakauden ja palkkaraportoinnin ajan. **Huolto-oikeuden päättyminen** kertoo, voiko uutta huoltoa vielä käyttää. **Taloudellisen loppuselvityksen valmistuminen** kertoo, mikä lopullinen lunastushinta on ja miten se on katettu.

Näiden erottaminen on tärkeämpää kuin uusi kenttä tai skripti. Odottava huoltolasku ei itsessään jatka vuokrasopimusta tai palkkavähennystä. Toisaalta maksettu ennakkolinkki ei todista, että kaikki sopimus- ja huoltovelvoitteet ovat lopullisesti tiedossa. Tarkat raportoinnin ja IC:n päätössäännöt sovitetaan tähän ennen käyttöönottoa.

**OOMI:** nykyinen sääntö, jonka mukaan Oomi vastaa maksamattomasta lunastuksesta, on tietoinen liiketoimintapäätös (ADR 0009). Sitä ei poisteta virhekorjauksena. Sopimus voi sovitun vastuun nojalla päättyä, vaikka työntekijä ei maksaisi. Loppuselvityksen on silti tuotettava lopullinen hinta ja oikea vastuutaho; automaattinen tapa 1 ei saa sulkea tätä työjonoa eikä muodostaa tekaistua työntekijän maksua.

## Miksi en suosittele muita vaihtoehtoja ensisijaisiksi

| Vaihtoehto | Arvio |
|---|---|
| Muuta lähetys 2 kk → 1 kk | Pienentää päällekkäistä jaksoa, mutta avoin työ, myöhäinen lasku ja tuleva budjettikertymä jäävät. |
| Laske vain tapa 3 uudelleen joka yö | Hyvä väliaikainen vahti. Ei korjaa jo maksetun alennetun linkin hintaa eikä selitä, mikä hyvitys asiakkaalle luvattiin. |
| Aseta huoltokielto linkin lähetyksessä | Katkaisisi nykyistä huolto-oikeutta aiemmin; portaali ei nyt edes lue kieltoa budjettitarkistuksessa. Ei käsittele avoimia töitä. |
| Varaa hyvitys lunastukselle 2 kk etukäteen | Voi toimia, jos kaikkien kanavien saldot, avoimet työt, tulevat kertymät, peruutukset ja yhtäaikaiset hyväksynnät hallitaan varauksilla. Tässä ympäristössä tämä on laajempi ja asiakkaan huoltokäyttöä rajoittava muutos kuin hyvityksen vahvistaminen myöhemmin. |
| Lähetä perushinta heti ja palauta hyvitys lopuksi | Poistaa alihinnoittelua mutta lisää asiakkaan ennakkomaksua ja palautuksia. En valitse oletukseksi. |
| Lähetä uusi erotuslinkki aina saldon muuttuessa | Tarpeen vanhojen tapausten poikkeamissa. Huono tavallinen asiakaspolku: monta hintaa ja linkkiä samasta lunastuksesta. |

## Toteutusjärjestys ja riippuvat tehtävät

1. **Välitön rajattu suoja 1479:ään ja raporttiin:** muuttuvaan hyvitykseen perustuvaa uutta tapaa 3 ei enää kirjoiteta lopullisena ilman loppuselvitystä. Näille tehdään näkyvä odotusjono. Vastaava sääntö maksulliselle linkille, josta vähennetään muuttuva hyvitys. Pelkkä ohitus ilman jonoa ei ole korjaus. Suoja otetaan käyttöön yhdessä status-syncin OOMI-polun ja extensionin odotuskäsittelyn kanssa; muuten toinen automaatio voi sulkea tai laskuttaa odottavan pyörän.
2. **Aiemmat tapaukset käsitellään erikseen:** aloita 15 tavan 3 pyörästä ja yllä olevista seitsemästä linkkimerkitystä. Tallenna alkuperäinen tarjous/tilaus ja kuittaus ennen korjauksia. Selvitä myös jo päättyneet lunastukset ja manuaalilinkit. Tarjottua hintaa tai jo luovutettua omistusta ei muuteta automaattisesti.
3. **Yhteinen huolto-oikeus ja työn tilat:** `GoByBike` + Staria-skriptit + integraatio. Lue avoimet työt myös ennen NetSuite-synkkaa. Huollon hyväksyntä ja loppuselvityksen vahvistus eivät saa yhtä aikaa käyttää samaa saldoa. Budjettitiedon lukuhäiriö siirtää huollon tarkistukseen sen sijaan, että se tulkittaisiin vapaaksi budjetiksi. Vakuutus- ja reklamaatiotyöt kohdistetaan maksajalleen, eikä niitä suljeta tavallisena budjettihuoltona.
4. **Loppuselvitys, hinnan tallennus ja maksujen kohdistus:** 1479-repo + Paylink-repo + 1480. Sopimus päättynyt -rajaus ei saa poistaa odottavaa selvitystä. Sovitaan erikseen avoimen vanhan Paylink-tilauksen korvaaminen/peruminen ja maksun kanssa kilpaileva muutos; API:n päivitysmahdollisuus ei yksin todista tämän turvallisuutta.
5. **Kuluttavat automaatiot:** CR-kirjasto, kuukausiraportointi, extension, IC ja kauppakirja. **T61:n 10.11. ajoon** tehdään yhteensopivuustarkistus ennen tätä muuttavaa tuotantojulkaisua. T61:tä ei pidä pysäyttää kaikilta pyöriltä tämän suppean ryhmän vuoksi.
6. **T51/T83 sekä T48/T49:** asiakaspalvelun näkymä näyttää lopullisen hinnan, hyvityksen, kohdistetut maksut, puuttuvat huollot ja seuraavan toimenpiteen. Kauppakirjahaku ja vuokramaksuvahti tarkastetaan, jotta niitä ei tulkita saman asian todisteiksi.

Uusi ADR muuttaa ainakin ADR 0012 k. 2/4:n oletuksia (hintaperusteita ei tallenneta; maksu kattaa aina), ADR 0014 k. 23:n ennakkokuittausta, tarvittaessa nykyistä eräpäivää ja linkin päättymisrajausta. ADR 0024:n keskenkauden manuaalipolku sekä ADR 0009:n OOMI-sääntö sovitetaan mukaan. Ehdotus uusien tietojen tallentamisesta poikkeaa tietoisesti aiemmasta uusien kenttien välttämisestä: nykyinen aukko osoittaa, että pelkkä muuttuva saldo ei riitä todisteeksi hyvityksestä.

## Todennus ennen tuotantoa

- B043000: ennakossa 0 €, myöhempi 100 € nettohuolto → lopullinen 56,39 €; yksi lopullinen linkki eikä ennenaikaista tapaa 3.
- Jo maksettu alennettu vanha linkki + uusi huolto → säilytetty maksuhavainto ja näkyvä erotus, ei automaattista täyskuittausta tai uutta täyshintaista linkkiä.
- Keskeneräinen työ vain portaalissa, hyväksytty mutta synkka epäonnistunut työ ja vastaanottamaton ostolasku estävät perusteettoman lopullisuuden.
- Vahvistettu työkustannus ja myöhemmin kirjattu vastaava ostolasku lasketaan yhdeksi kuluksi; peruutus ja hyvitys purkavat oikean kulun.
- Kuukauden vaihde ja saman kuukausiajon uusinta: ansaittu budjetti kerran, ei tulevien kuukausien hyvitystä etukäteen.
- Huollon hyväksyntä ja loppuselvitys yhtä aikaa; NetSuite-lukuvirhe; lähetyksen katkeaminen Paylink-luonnin jälkeen; kahden ajon päällekkäisyys.
- Huoltoporras ylittyy ja päättymispäivä siirtyy: aiempi ennakko vanhenee näkyvästi; lopullinen hinta tarkistetaan oikean sopimusversion mukaan.
- OOMI ilman käyttäjän maksua mutta voimassa olevalla vastuulla, keskenkauden CR, hinta 0/käsiraha ja pieni alle-minimin saatava luokitellaan oikein.
- Odottaa huoltoja -tila ei aiheuta jälkiveloitusta tai ylimääräistä palkkavähennystä. Todellinen maksamaton lunastus ei jää samaan odotusluokkaan.
- Päättynyt sopimus pysyy selvitysjonossa; vuokramaksulippu, IC ja kauppakirja seuraavat omia hyväksyttyjä ehtojaan.

Ensin puhtaan päätöslogiikan testit, sitten rajatun kohortin read-only-täsmäytys ja NetSuite-dry run. Lopuksi yhden pyörän läpimeno asiakkaan viestistä huoltoon, maksuun ja loppukenttiin ennen koko kohorttia. Tässä tutkimuksessa näitä uusia toimintatapoja ei ole toteutettu eikä testattu tuotannossa.
