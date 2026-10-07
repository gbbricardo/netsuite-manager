# CONTEXT

Tämän repon sanasto. Vain käsitteet — ei kenttä-ID:itä, ei skriptinimiä, ei toteutusta.
Kenttätason säännöt ovat [`docs/lunastuksen-kenttasaannot.md`](docs/lunastuksen-kenttasaannot.md).

Liiketoiminnan kieli on suomi. Käsitteet pidetään suomeksi myös silloin kun koodi on englanniksi,
koska käsittelijätiedostot on nimetty niiden mukaan (lunastus, siirto, välikuukaudet, jälkiveloitus,
hyvitys).

## Pyörän päättymiseen liittyvät käsitteet

### Päättymisajankohta

Päivä jona pyörän vuokrakausi päättyy. Sopimusoikeudellinen fakta: se määrää mihin asti
laskutetaan, mihin asti sopimusrivit ovat voimassa, ja minkä kauden rahoittaja laskee.

Päättymisajankohta voi olla menneisyydessä silloin kun päättymisestä sovitaan takautuvasti. Se ei
ole sama asia kuin päivä jona pyörä merkitään päättyneeksi — sitä varten on **tunnistuspäivä**.

Ennenaikaisesti päätetty sopimus päättyy aina kuun viimeisenä päivänä. Päättymisajankohtaa
muutetaan vain muutospyynnöllä.

Päättymisajankohta voi puuttua. Silloin pyörä ei voi päättyä, ja se on havaittava tila — ei syy
arvata päivämäärää jostain muusta.

### Tunnistuspäivä

Ensimmäinen päivä jona pyörä voidaan merkitä lunastetuksi. Se on päättymisajankohdan kuukauden
ensimmäinen päivä, tai tämä päivä jos se on jo mennyt.

Tunnistuspäivä on olemassa siksi, että päättymisajankohta voi olla menneisyydessä eikä mitään voi
merkitä tapahtuneeksi taaksepäin. Eteenpäin katsovassa tapauksessa se ei tee mitään: vuokrakauden
päättyessä 23.12.2026 tunnistuspäivä on 01.12.2026, ja pyörä merkitään lunastetuksi silloin kun
kuukausiraportointi ja laskutus ovat kyseisen kuukauden osalta käsitelleet sen normaalisti.

Tunnistuspäivä ei yksin riitä: pyörän saa merkitä lunastetuksi vasta kun **velvoitteet on hoidettu**.

### Päätöspäivä

Päivä jona pyörän ennenaikaisesta päättymisestä päätettiin. Eri asia kuin päättymisajankohta ja eri
asia kuin tunnistuspäivä: päätös voidaan tehdä kuukausia ennen päättymistä tai kuukausia sen
jälkeen.

Päätöspäivä on se hetki josta alkaen pyörä on tilassa **lunastus sovittu**.

Keskenkauden lunastuksessa päätöspäivä on muutospyynnön luontipäivä: muutospyyntö *on* päätös.
Se ei riipu siitä, milloin muutospyyntö käsiteltiin.

Kauden lopun lunastuksessa päätöspäivällä ei ole liiketoiminnallista merkitystä, eikä mikään sääntö
saa lukea sitä: mitään ei päätetä, sopimus vain päättyy. Jos päivä on tallentunut, se kertoo
ainoastaan milloin automaatio havaitsi velvoitteen hoidetuksi.

### Velvoitteet hoidettu

Se hetki jona pyörän loppuvastuut rahoittajaan nähden on katettu. Lunastuksessa tämä on tavallisesti
lunastusmaksun maksupäivä, mutta velvoitteet voidaan hoitaa myös ilman maksua — ylimääräisenä
vuokrana, huoltobudjetista, käsirahalla, vakuutuskorvauksena tai myymällä pyörä.

Kauden lopun lunastuksessa hoitopäivä riippuu tavasta:

- **lunastusmaksu**: maksupäivä
- **ylimääräinen vuokra**: päivä jona maksetut jälkiveloituslaskut kattavat lunastusmaksun summan
- **huoltobudjetti** ja **käsiraha**: päivä jona kattavuus todettiin. Päivällä ei ole merkitystä —
  ratkaisevaa on vain, että velvoite on hoidettu

Kauden lopun lunastuksessa velvoitteiden on oltava hoidettu **päättymiskuun loppuun mennessä**.
Jos ne ovat, pyörä merkitään lunastetuksi; jos eivät, seuraavan kuun ensimmäisenä päivänä alkaa
jälkiveloitus. Sillä, minä päivänä kuun sisällä tai kenen toimesta velvoite hoidettiin, ei ole
merkitystä.

Etukäteen maksettu lunastusmaksu hoitaa velvoitteen mutta ei päätä sopimusta ennen
päättymisajankohtaa.

Käsite on ratkaiseva, koska raportointi ja laskutus jatkuvat siihen asti kunnes velvoitteet on
hoidettu — riippumatta siitä mitä päättymisestä on sovittu.

## Pyörän tilat lunastuksessa

### Käynnissä

Vuokrasopimus on voimassa eikä päättymisestä ole sovittu.

### Lunastus sovittu

Päättymisestä on sovittu ja velvoitteet on hoidettu, mutta vuokrakausi on yhä kesken. Pyörä on
tässä tilassa päätöspäivästä tunnistuspäivään — mahdollisesti kuukausia.

Tämä on se tila jonka puuttuminen aiheuttaa ennenaikaisen päättymisen: laskutuksen ja
kuukausiraportoinnin **on jatkuttava normaalisti** koko tämän tilan ajan, vaikka lunastusmaksu olisi
jo maksettu tai asiakaspalvelija olisi jo kirjannut päätöksen.

### Lunastettu

Vuokrakausi on päättynyt ja pyörä on merkitty lunastetuksi. Laskutus ja kuukausiraportointi ovat
päättyneet.

### IC-käsitelty

Taloustiimi on tehnyt pyörän IC-lunastuksen ja merkinnyt sen tehdyksi. Ennen sitä pyörä ei ole
IC-käsitelty, vaikka sen IC-lunastushinta olisi jo laskettu.

## IC-käsitteet

### IC-myynti

Pyörän konsernisisäinen myynti rahoittavalle yhtiölle sopimuksen alussa. Automatisoitu, eikä se
kuulu lunastusprosessiin. IC-myynti on tapahtunut, kun pyörällä on käyttöomaisuustietue tai kun sen
IC-myyntihinta ja IC-myyntipäivä ovat molemmat kirjattu.

### IC-lunastus

IC-myydyn pyörän konsernisisäinen takaisinosto sopimuksen päätyttyä. Sen tekee taloustiimi.
Automaatio määrittää vain, **milloin IC-lunastuksen voi tehdä**. Sitä, tehdäänkö se, automaatio ei
päätä. Päätös on taloustiimin, ja päätöksen tarvitsemien tietojen on löydyttävä NetSuitesta.

_Vältä_: IC-myynti (eri suunta), lunastus (työntekijän ja rahoittajan välinen)

### IC-päivä

Sopimuksen päättymiskuun viimeinen päivä eli päättymisajankohdan kuun viimeinen päivä, ei koskaan
mikään muu. Se kirjataan heti, kun velvoitteet on hoidettu, vaikka päivä olisi vielä tulevaisuudessa.
Se voi osoittaa myös menneeseen kauteen, ja silloin IC-lunastus on takautuva. Takautuvasta
IC-lunastuksesta päättää taloustiimi.

IC-päivä seuraa lähtötietoja siihen asti, kunnes pyörä on IC-käsitelty. Jos päättymisajankohta
muuttuu tai velvoitteet eivät enää ole hoidettu, IC-päivä ja IC-lunastushinta poistetaan. Ne
kirjataan uudelleen nykyisistä tiedoista, kun ehdot täyttyvät taas. IC-käsitellyn pyörän IC-päivää ja
hintaa ei muuteta koskaan.

### IC-lunastushinta

Hinta, jolla pyörä ostetaan takaisin rahoittajalta IC-päivän kaudella. Sen on oltava laskettu, kun
pyörä tulee IC-lunastettavaksi. Jos hintaa ei voida laskea (esimerkiksi koska IC-myyntiä ei ole
tapahtunut), hinta on −1. Myös −1 on laskettu hinta, ja taloustiimi päättää, mitä pyörälle tehdään.

### IC-lunastettavissa

Pyörä voidaan lunastaa rahoittajalta, kun sen velvoitteet on hoidettu, IC-päivä on kirjattu eikä
pyörä ole IC-käsitelty. IC-myynti ei ole ehto. Tulevaisuuteen osoittava IC-päivä ei estä tilaa.
Taloustiimi päättää itse, minkä kuukausien pyörät se lunastaa. Lähtökohtaisesti se lunastaa
kuluvan kuun ja aiemmin lunastamatta jääneet, ei tulevia. Se tekee lunastukset kuun toiseksi
viimeisenä arkipäivänä.

Taloustiimin lista on täsmälleen IC-lunastettavissa olevat pyörät, ja jokaisesta näkyy kolme asiaa:
IC-lunastushinta, IC-päivä ja se, onko IC-lunastus tehty.

_Vältä_: IC-listalla (käytä tätä), lunastettu (eri tila)

## Loppulunastushinta ja sen kattaminen

Koskee vain **kauden lopun lunastusta**. Keskenkauden lunastuksella ja OOMI-pyörällä on omat
sääntönsä.

### Loppulunastushinta

Vuokrasopimuksen mukainen summa, jonka työntekijä maksaa pyörästä kauden lopussa. Veroton.
Totuus on vuokrasopimus. Asiakaspalvelu ja taloustiimi saavat korjata tai yliajaa hinnan, ja
korjattu hinta on silloin se, jota sovelletaan.

Käsiraha on jo vähennetty hinnasta. Oletuksena käsiraha kattaa koko loppulunastusmaksun, joten
uuden pyörän hinta on 0 €, ellei sitä erikseen kirjata. Hinta kirjataan vain silloin, kun käsiraha ei
kata koko maksua.

Hinta 0 € tarkoittaa, ettei loppulunastusmaksua veloiteta: velvoitteet on hoidettu käsirahalla.

_Vältä_: lunastushinta ilman tarkennetta (sekoittuu IC-lunastushintaan), brutto

### Huoltosumma

Pyörän sopimuskauden aikana kertynyt huoltojen arvo verottomana. Voi olla nolla tai negatiivinen.

### Huoltoporras

Huoltobudjetin kuukausiportaat. Jokaisella portaalla on yläraja. Pyörän huoltoporras on pienin
porras, jonka yläraja kattaa huoltosumman.

### Huoltohyvitys

Käyttämätön huoltobudjetti, joka vähennetään loppulunastushinnasta: huoltoportaan yläraja miinus
huoltosumma. Hyvitys on siksi aina pienempi kuin yhden portaan väli. Jos huoltosumma on
negatiivinen, koko negatiivinen summa hyvitetään ilman ylärajaa.
OOMI-pyörä on poikkeus: sen negatiivista summaa ei hyvitetä.

Hyvitys määräytyy pelkästä huoltosummasta. Sopimuksen pidennys ei vaikuta siihen, koska pidennys
sisältää myös jälkiveloituskuukaudet.

_Vältä_: hyvitys (yksinään se tarkoittaa hyvitysmuutospyyntöä)

### Maksettava loppulunastussumma

Loppulunastushinta miinus huoltohyvitys. Summa lasketaan kerran, lunastusmaksupyynnön
lähetyshetkellä, sen hetkisistä tiedoista. Sitä ei kiinnitetä eikä lasketa uudelleen, jos tiedot
myöhemmin muuttuvat. Sama summa on vertailukohta, kun todetaan ovatko velvoitteet hoidettu.

### Lunastusmaksupyyntö

Työntekijälle lähetettävä maksulinkki maksettavan loppulunastussumman maksamiseen. Se lähetetään
kerran, aikaisintaan kaksi kuukautta ennen päättymisajankohtaa ja viimeistään päättymisajankohtana.
Pyörä, jolla on jo yksikin loppulunastuksen maksupyyntö, ei saa toista.

Pyyntö lähetetään vain, kun sille on tarve: kyseessä on kauden lopun lunastus, velvoitteita ei ole
hoidettu eikä niitä hoideta muuten, eikä pyörällä ole aiempaa pyyntöä tai jälkiveloitusta.
Keskenkauden lunastus, reklamaatio tai peruutus odottamassa tai käsiteltynä tarkoittaa, ettei
tarvetta ole.

Työntekijälle voi ilmoittaa eräpäiväksi päättymisajankohdan, mutta velvoitteiden hoitamisen raja on
päättymiskuun loppu.

Kun velvoitteet hoidetaan muulla tavalla kuin maksamalla pyyntö, pyörän avoimet maksupyynnöt perutaan.

_Vältä_: maksulinkki (puhekieli, kelpaa), lasku

### Selvitystapa

Tapa jolla velvoitteet hoidettiin. Pyörällä on aina täsmälleen yksi selvitystapa: ensimmäinen tapa,
joka yksin kattaa maksettavan loppulunastussumman. Lähteitä ei yhdistetä.

## Muut käsitteet

### Kauden lopun lunastus

Sopimus päättyy omana päättymisajankohtanaan eikä ennenaikaisesti. Pyörän sopimus on kauden
lopun lunastus tiettynä kuukautena, kun molemmat pätevät:

- päättymisajankohta osuu kyseiseen kuukauteen
- mikään kauden aikana tehty muutospyyntö ei osoita, että sopimus päätetään ennenaikaisesti.
  Ennenaikaisuuden osoittaa vain keskenkauden lunastus- tai reklamaatio/peruutus-muutospyyntö, joka
  odottaa käsittelyä tai on käsitelty. Virheeseen päätynyt tai peruttu ei osoita.
  OOMI-pyörällä ennenaikaisuuden kertoi syyskuuhun 2026 asti **Oomi Fleet -raportti**; lokakuusta
  2026 alkaen OOMI-pyörän ennenaikainen päättyminen tehdään muutospyynnöllä kuten muillakin.

Pyörän saa merkitä lunastetuksi, kun kauden lopun lunastuksen ehdot täyttyvät, velvoitteet on
hoidettu ja tunnistuspäivä on koittanut. OOMI-pyörä on poikkeus, ks. **OOMI-pyörä**.

Vastakohta on **keskenkauden lunastus**: muutospyyntö osoittaa, että sopimus päätetään ennen
päättymisajankohtaansa.

_Vältä_: luonnollinen päättyminen, normaali lunastus

### Keskenkauden lunastus

Sopimus päätetään ennen päättymisajankohtaansa, ja sen osoittaa aina muutospyyntö. Ilman
muutospyyntöä keskenkauden lunastusta ei ole, vaikka lunastusmaksu olisi maksettu: silloin maksu
odottaa, kunnes muutospyyntö luodaan.

Asiakaspalvelijan luoma muutospyyntö on sekä päätös että todiste siitä, että velvoitteet on
hoidettu. Maksua ei odoteta ennen kuin pyörä merkitään lunastetuksi, ja perintä on taloustiimin
asia.

Jo laskutetut kuukaudet, jotka jäävät päättymisajankohdan jälkeen, hyvitetään erillisellä
hyvitysmuutospyynnöllä. Muuta hyvityspolkua ei ole.

_Vältä_: ennenaikainen lunastus ilman muutospyyntöä, maksulla päätetty sopimus

### Takautuva päättyminen

Päättyminen jonka päättymisajankohta on jo mennyt päätöshetkellä. Ei poikkeus vaan normaali
työnkulku: joka viides ennenaikainen lunastus on takautuva.

Takautuvassa päättymisessä päättymisajankohta ja tunnistuspäivä eroavat, ja se ero on ainoa asia
joka kertoo tietuetta lukevalle että käsittely on ollut takautuva.

### OOMI-pyörä

Oomi-etuintegraation kautta toimitettu pyörä. Sen sopimus päättyy aina täsmälleen
päättymisajankohtanaan eikä sitä jatketa hoitamattomien velvoitteiden vuoksi.

Kauden lopun lunastuksessa OOMI-pyörän velvoitteet katsotaan hoidetuiksi tunnistuspäivänä, vaikka
lunastusmaksua ei olisi maksettu: Oomi vastaa sopimuksen perusteella maksamattomista
lunastusmaksuista. Pyörä merkitään lunastetuksi päättymiskuun ensimmäisenä päivänä, tai
ensimmäisenä onnistuneena ajona sen jälkeen. Myöhässä saapuva lunastusmaksu ei muuta selvitystapaa
eikä velvoitteiden hoitopäivää, toisin kuin muilla pyörillä. Maksupäivä kirjataan silti, koska se on
maksun fakta ja ratkaisee kauppakirjan.

Riittävän monta sääntöä poikkeaa, että OOMI on rinnakkainen prosessi eikä yksittäinen poikkeus.

### Oomi Fleet -raportti

Oomin viikoittain maanantaisin toimittama raportti OOMI-pyörien tilasta. Sen tiedot viedään
NetSuiteen käsin. Syyskuuhun 2026 asti se oli ainoa lähde OOMI-pyörän ennenaikaiselle
päättymiselle; lokakuusta 2026 alkaen ennenaikainen päättyminen otetaan sisäiseen käsittelyyn ja
tehdään muutospyynnöllä. Raportti on sen jälkeen tietolähde, ei päätös.

### Jälkiveloitus

Tila jossa kauden lopun lunastuksen velvoitteita ei ole hoidettu päättymisajankohtana, ja sopimusta
jatketaan kuukausi kerrallaan työnantajalle laskutettavana vuokrana. Jokainen jatko siirtää
päättymisajankohtaa kuukaudella, joten pyörä on joka kuukausi uudelleen kauden lopun lunastus.

Jatkaminen päättyy **automaattisesti** silloin kun laskutetut jälkiveloituskuukaudet kattavat
maksettavan loppulunastussumman, tai kun lunastusmaksu maksetaan. Jokainen laskutettu
jälkiveloituskuukausi kattaa kiinteästi 80,00 € brutto (63,75 € netto), laskun summasta
riippumatta. Laskutettu kuukausi tunnistetaan käsitellystä jälkiveloituksen muutospyynnöstä: yksi
muutospyyntö on yksi kuukausi. Jälkiveloituskuukausia ei hyvitetä tavallisessa työnkulussa. Laskun maksaminen ei ole ehto: perintä on taloustiimin asia. Sopimus päättyy sinä
kuukautena, jona velvoitteet hoidettiin. OOMI-pyörää ei jälkiveloiteta.

Työntekijän avoin lunastusmaksupyyntö päivitetään käsin vastaamaan jäljellä olevaa summaa.

### Jälkiveloituskuukausi

Jälkiveloituksessa laskutettu kuukausi. Eri asia kuin **vuokrakuukausi**: vuokrakuukausi lyhentää
pyörän pääomaa sopimuskauden aikana, jälkiveloituskuukausi kattaa työntekijän hoitamattomia
loppulunastuksen velvoitteita.

_Vältä_: ylimääräinen vuokra (kelpaa selvitystavan nimenä), pidennyskuukausi (sekoittuu
huoltopidennykseen)

Jatkaminen noudattaa sopimusta. Jos asiakas maksaa myöhässä ja jo laskutettu kuukausi jää
tarpeettomaksi, siitä ei tehdä automaattisesti mitään — se on asiakkaan ja taloustiimin välinen asia.

### Kauppakirja

Työntekijälle lähetettävä asiakirja siitä, että pyörän omistus on siirtynyt hänelle lunastuksen
myötä. Kauppakirja kuuluu vain pyörälle, jonka työntekijä itse lunasti: selvitystapa on
lunastusmaksu, ylimääräinen vuokra, huoltobudjetti tai käsiraha. Palautettu, kilpailijalle myyty,
varastettu tai tuhoutunut pyörä ei saa kauppakirjaa, vaikka se olisi merkitty lunastetuksi.
Pyörä, jonka selvitystapaa ei tiedetä (historiallinen), ei saa kauppakirjaa automaattisesti, vaan
asiakaspalvelu päättää pyöräkohtaisesti.

Keskenkauden lunastuksessa muutospyyntö riittää todisteeksi velvoitteista myös kauppakirjaa
varten: työntekijän maksua ei odoteta.

OOMI-pyörä on poikkeus: Oomin vastuu ei riitä. OOMI-pyörä saa kauppakirjan vain, jos työntekijä
on maksanut lunastuksen GoByBikelle. Todiste on lunastusmaksun maksupäivä.

Historiallisen pyörän kauppakirjasta päätetään korjaamalla sen selvitystapa oikeaksi, minkä
jälkeen normaalit säännöt pätevät.

### Omistuksen siirtymispäivä

Päivä, jona kaikki kolme pätevät: velvoitteet on hoidettu, päättymisajankohta on mennyt ja pyörän
kaikki vuokralaskut on maksettu. Kauppakirjan voi lähettää aikaisintaan tänä päivänä.

Lunastettu pyörä ei vielä ole omistettu pyörä: tunnistuspäivän ja päättymisajankohdan välillä
sopimus on yhä voimassa.

### Kauppakirja lähetettävissä

Pyörä kuuluu kauppakirjan piiriin, omistuksen siirtymispäivä on koittanut, eikä lähetystä ole
estetty. Kauppakirja lähetetään automaattisesti kerran.

Ehto arvioidaan joka kerta nykyisistä tiedoista. Jos pyörä täyttää ehdot myöhemmin, esimerkiksi
kun viimeinen vuokralasku maksetaan tai esto poistetaan, kauppakirja lähetetään silloin, myös
takautuvasti.

### Kauppakirja odottaa

Pyörä kuuluu kauppakirjan piiriin, mutta omistuksen siirtymispäivä ei ole koittanut. Yksikin
maksamaton vuokralasku pitää kauppakirjan odottamassa, myös erääntymätön.

Vuokralaskun tila luetaan NetSuiten laskusaldosta hyvitysten kohdistamisen jälkeen. Kohdistukset
tekee taloustiimi, ja kohdistamaton hyvitys pitää kauppakirjan odottamassa.

Odottaminen on automaattinen tila, jota kukaan ei aseta eikä poista: se päättyy itsestään, kun
kaikki ehdot täyttyvät.

### Kauppakirjan esto

Asiakaspalvelun tai taloustiimin päätös, ettei kauppakirjaa lähetetä. Esto ei tee pyörästä
pysyvästi kelvotonta: kun esto poistetaan, kauppakirja lähetetään, jos ehdot täyttyvät, myös
takautuvasti.

_Vältä_: lykkäys (väliaikaisen odotuksen hoitaa **kauppakirja odottaa**)

### Käsin lähetetty kauppakirja

Kauppakirja, jonka asiakaspalvelu lähettää itse. Käsin voi lähettää uudelleen tai ilman, että
kaikki ehdot täyttyvät. Käsin lähetetty kauppakirja on lähetetty: automaatio ei lähetä toista.
Tietoinen poikkeus ehdoista ei ole virhe.

### Virheellisesti lähetetty kauppakirja

Automaattisesti lähetetty kauppakirja, jonka ehdot eivät täyttyneet lähetyshetkellä, tai mikä
tahansa kauppakirja, jonka pyörä on lähetyksen jälkeen pudonnut kauppakirjan piiristä (esimerkiksi
todettu palautetuksi tai varastetuksi). Lähetettyä kauppakirjaa ei voi perua, mutta se
raportoidaan asiakaspalvelulle.

Lähetyksen jälkeen syntynyt maksamaton vuokralasku ei tee kauppakirjasta virheellistä. Se on
perintää, eri prosessi.

_Vältä_ (kauppakirjasta): lunastusvahvistus, luovutuskirja

### IC-kausi

Kirjanpitokausi jolle pyörän konsernisisäinen lunastus kuuluu. Se on aina se kuukausi jona sopimus
päättyy — jälkiveloitetulla pyörällä se kuukausi jona velvoitteet hoidettiin, ei alkuperäinen
päättymiskuukausi. Myöhässä tunnistettu lunastus saa oman, menneen kautensa.
