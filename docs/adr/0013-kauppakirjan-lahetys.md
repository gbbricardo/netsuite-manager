# ADR 0013 — Kauppakirjan lähetys: milloin lähetetään, milloin odotetaan, milloin ei koskaan

- **Päivämäärä:** 2026-10-06
- **Tila:** Hyväksytty (tuoteomistaja, grilling-istunto 6.10.2026)
- **Koskee:** `netsuite-send-bill-of-sale-pdf` (`customscript_gbb_mr_send_email_2`, internal id 1433, haku 793),
  `netsuite-br-lease-fees-check` (`customscript_gbb_lease_fee_check`, 1432, haku 796, lippu *kaikki vuokrat maksettu*)
- **Luonne:** tavoitetila. Skripteihin ei tehdä muutoksia tämän ADR:n perusteella ilman erillistä päätöstä.
- **Käsitteet:** [CONTEXT.md](../../CONTEXT.md) § *Kauppakirja* … *Virheellisesti lähetetty kauppakirja*
- **Nykytila:** [löydös 6.10.2026](../../findings/2026-10-06-kauppakirja-nykytila.md)

## Konteksti

Kauppakirjan lähetyksen ehdot asuvat vain haussa 793, jota ei ole dokumentoitu eikä voi lukea SuiteQL:llä.
Kenttäjakaumista päätelty ketju on: status 2 → maksettu lunastus-SO (*Mid-contract* tai *End redemption*) →
lippu *kaikki vuokrat maksettu* = T → kauppakirja. Ketju sitoo kauppakirjan maksettuun SO:hon. Siksi
296 lunastettua pyörää, joiden velvoitteet hoidettiin ilman SO:ta, ei saa kauppakirjaa koskaan. Lisäksi
ketju päästää läpi pyöriä, joille kauppakirjaa ei kuulu (palautettu B045683, kielletty B004255). Kerran
lähetettyä kauppakirjaa ei voi perua, joten sääntö kirjataan ennen kuin automaatioon kosketaan.

## Päätökset

1. **Piiri: vain työntekijän itse lunastama pyörä.** Selvitystapa 1–4 (lunastusmaksu, ylimääräinen vuokra,
   huoltobudjetti, käsiraha). Tavat 5–7 (palautus, kilpailijalle myynti, varkaus tai tuho) eivät saa
   kauppakirjaa koskaan, vaikka status olisi 2.
2. **Tapa 8 (`historical_unknown`) ei saa kauppakirjaa automaattisesti.** Asiakaspalvelu päättää
   pyöräkohtaisesti. Päätös tehdään korjaamalla selvitystapa oikeaksi, ei erillisellä hyväksynnällä.
3. **Omistuksen siirtymispäivä** on päivä, jona kaikki kolme pätevät:
   - velvoitteet on hoidettu
   - päättymisajankohta on mennyt
   - pyörän kaikki vuokralaskut on maksettu

   Status 2 (tunnistuspäivä) ei riitä, koska sopimus on voimassa päättymisajankohtaan asti.
4. **Kaikki vuokralaskut, myös erääntymättömät.** Yksikin maksamaton lasku pitää kauppakirjan odottamassa,
   ja lippu *kaikki vuokrat maksettu* on sääntö. Esimerkki: päättymisajankohta 30.11. ja lasku erääntyy
   14.12. Jos lasku maksetaan 5.12., kauppakirja lähtee 5.12. Jos lasku on maksamatta, kauppakirja odottaa.
5. **Laskun tila luetaan NetSuiten saldosta hyvitysten kohdistamisen jälkeen.** Kohdistukset tekee
   taloustiimi NetSuitessa, ei skripti. Kohdistamaton hyvitys pitää kauppakirjan odottamassa.
6. **Maksettu lunastus-SO ei ole sääntö**, vaan yksi todiste siitä, että maksu on kirjattu oikein.
   Tavoitetilassa ehto on selvitystapa ja *velvoitteet hoidettu*.
7. **Keskenkauden lunastuksessa muutospyyntö riittää** myös kauppakirjaa varten, eikä työntekijän maksua
   odoteta (sama kuin [ADR 0010](0010-keskenkauden-lunastus.md)).
8. **OOMI on poikkeus:** Oomin vastuu ([ADR 0009](0009-kauden-lopun-lunastus.md) k. 6) ei riitä.
   OOMI-pyörä saa kauppakirjan vain, jos työntekijä on maksanut lunastuksen GoByBikelle. Todiste on
   lunastusmaksun maksupäivä pyörärekisterissä.
9. **Ehto arvioidaan joka ajolla nykyisistä tiedoista.** Kun ehdot täyttyvät myöhemmin (lasku maksetaan,
   esto poistetaan, selvitystapa korjataan), kauppakirja lähtee silloin, myös takautuvasti.
   Automaatio lähettää kerran.
10. **Käsin asetettava tila on vain yksi: esto.** Sen asettaa ja poistaa asiakaspalvelu tai taloustiimi.
    Erillistä lykkäystä ei ole: väliaikaisen odotuksen hoitaa automaattinen *kauppakirja odottaa*, joka
    päättyy itsestään.
11. **Käsin lähetys** on sallittu uudelleenlähetyksenä ja ilman, että kaikki ehdot täyttyvät. Se kirjataan
    lähetetyksi, jottei automaatio lähetä toista. Tietoinen poikkeus ei ole virhe.
12. **Virheellisesti lähetetty** tarkoittaa kahta tapausta:
    - automaattinen lähetys, jonka ehdot eivät täyttyneet lähetyshetkellä
    - mikä tahansa kauppakirja, jonka pyörä putoaa myöhemmin piiristä (status 3, tapa 5–7)

    Lähetyksen jälkeen syntynyt maksamaton vuokralasku on perintää, ei kauppakirjan virhe.
13. **Raportti asiakaspalvelulle** (toteuttaja avoin) näyttää:
    - virheellisesti lähetetyt
    - tapa 8 -pyörät, joista on päätettävä
    - estetyt
    - pyörät, joiden omistuksen siirtymispäivä ei ole koittanut yli 30 päivää päättymisajankohdan jälkeen

    OOMI-pyörä ilman työntekijän maksua on normaali tila, eikä se kuulu raporttiin.

## Hylätyt vaihtoehdot

- **Vain erääntyneet maksamattomat vuokrat estävät.** Hylätty: maksamaton lasku tarkoittaa, että rahoittajan
  saatava on auki. Erääntymätön lasku viivästyttää kauppakirjaa vain maksuun asti.
- **Kauppakirja tunnistuspäivänä (status 2).** Hylätty, koska omistus ei voi siirtyä, kun sopimus on voimassa.
- **Erillinen lykkäys päivämäärällä.** Hylätty, koska automaattinen odotus kattaa tarpeen eikä käsin
  poistettava lykkäys saa unohtua estoksi.

## Seuraukset

- Nykyinen ketju poikkeaa tavoitteesta neljässä kohdassa: SO-ehto, päättymisajankohtaa ei odoteta,
  tapoja 5–8 ei suljeta pois eikä OOMI-pyörältä vaadita maksua. Nämä luetellaan löydöksessä.
- Kieltolippu `custrecord_gbb_no_bill_of_sale_to_user` vastaa estoa, mutta syytä ei kirjata mihinkään.
- Lippu *kaikki vuokrat maksettu* ei koskaan palaa F:ksi. Päätöksen 4 kannalta se on oikein vain, jos
  lippu tarkistetaan uudelleen, kun pyörälle tulee uusi lasku ennen lähetystä.
