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

Lunastuksen konsernisisäinen hinta on laskettu ja kirjattu. Seuraa lunastusta, ei korvaa sitä.

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
ensimmäisenä onnistuneena ajona sen jälkeen. Myöhässä saapuva lunastusmaksu ei laukaise mitään
toimenpidettä, toisin kuin muilla pyörillä.

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

Jatkaminen päättyy **automaattisesti** silloin kun maksetut jälkiveloituslaskut kattavat
lunastusmaksun summan, tai kun lunastusmaksu maksetaan. Kattavuus lasketaan nettona: laskujen
verottomat vuokra- sekä toimisto- ja käsittelykulurivit yhteensä vähintään lunastusmaksun netto.
Sopimus päättyy sinä kuukautena, jona velvoitteet hoidettiin. OOMI-pyörää ei jälkiveloiteta.

Jatkaminen noudattaa sopimusta. Jos asiakas maksaa myöhässä ja jo laskutettu kuukausi jää
tarpeettomaksi, siitä ei tehdä automaattisesti mitään — se on asiakkaan ja taloustiimin välinen asia.

### IC-kausi

Kirjanpitokausi jolle pyörän konsernisisäinen lunastus kuuluu. Se on aina se kuukausi jona sopimus
päättyy — jälkiveloitetulla pyörällä se kuukausi jona velvoitteet hoidettiin, ei alkuperäinen
päättymiskuukausi. Myöhässä tunnistettu lunastus saa oman, menneen kautensa.
