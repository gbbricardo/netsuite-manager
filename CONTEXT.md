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

### Velvoitteet hoidettu

Se hetki jona pyörän loppuvastuut rahoittajaan nähden on katettu. Lunastuksessa tämä on tavallisesti
lunastusmaksun maksupäivä, mutta velvoitteet voidaan hoitaa myös ilman maksua — ylimääräisenä
vuokrana, huoltobudjetista, vakuutuskorvauksena tai myymällä pyörä.

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

### Takautuva päättyminen

Päättyminen jonka päättymisajankohta on jo mennyt päätöshetkellä. Ei poikkeus vaan normaali
työnkulku: joka viides ennenaikainen lunastus on takautuva.

Takautuvassa päättymisessä päättymisajankohta ja tunnistuspäivä eroavat, ja se ero on ainoa asia
joka kertoo tietuetta lukevalle että käsittely on ollut takautuva.

### OOMI-pyörä

Oomi-etuintegraation kautta toimitettu pyörä. Sen sopimus päättyy aina täsmälleen
päättymisajankohtanaan eikä sitä jatketa hoitamattomien velvoitteiden vuoksi. Riittävän monta
sääntöä poikkeaa, että OOMI on rinnakkainen prosessi eikä yksittäinen poikkeus.
