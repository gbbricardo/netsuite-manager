# Huoltobudjetilla kuitattu lunastus voi muuttua maksulliseksi ennen päättymistä

Tutkittu 5.11.2026. Lähteet: sisarrepositorioiden paikallinen koodi, voimassa olevat ADR:t ja NetSuiten vain lukevat SuiteQL-kyselyt. Ei tuotantokirjoituksia eikä skriptimuutoksia.

**Jatkotutkimus 5.11.:** [ratkaisuehdotus ja riippuvuuskartta](../docs/lunastuksen-huoltobudjetti-ratkaisuehdotus.md). Portaalin normaalin uuden huoltotilauksen raja on 30 päivää ennen portaalin omaa päättymispäivää; NetSuiten huoltokieltokenttä ei yksin kuvaa todellista tilausoikeutta. Kaksi kuukautta ennen lähetetty linkki jättää silti päällekkäisen jakson. Keskeneräinen huolto voi olla vasta portaalissa, ja kuukausibudjetti voi kasvattaa hyvitystä linkin jälkeenkin.

## Johtopäätös

Käyttäjän kuvaama aukko on olemassa: muuttuva huoltosaldo käsitellään lähetyshetkellä lopullisena lunastuksen suorituksena. Skripti kirjoittaa selvitystavan 3 ja suorituspäivän mutta ei varaa tai vähennä hyvitykseen käytettyä huoltobudjettia. Kirjattu tapa estää myöhemmän maksulinkin, vaikka käytettävissä oleva hyvitys pienenee ja lunastukseen syntyy maksettavaa.

Ongelma syntyy jo yhden kuukauden ennakolla. Kahden kuukauden ennakko pidentää altistusaikaa. Seuraava ketju perustuu tutkittuun koodiin; tuotannon kaikkien File Cabinet -tiedostojen vastaavuutta paikallisiin versioihin ei tarkistettu.

## Ketju repositorioiden yli

| Kohta | Toteutus ja seuraus |
|---|---|
| Lähetysikkuna | `netstuite-send-end-redemption-payment-link/src/gbb_mr_send_end_redemption_paylink.js:337–412`: pyörä tulee käsittelyyn 1 tai 2 kk ennen päättymistä. Valinta vaatii tyhjän selvitystavan. |
| Hinta | Saman repon `src/lib_gbb_redemption_price.js:254–282`: hyvitys lasketaan nykyisestä huoltosummasta. Nollahinta ja alle 0,65 € brutto tuottavat `noPaymentDue`-tuloksen. |
| Kuittaus | `src/gbb_mr_send_end_redemption_paylink.js:609–615,633–654`: `settle()` kirjoittaa tavan 3 ja `liab_settled_at = tänään`. Huoltosaldoa, varausta tai huoltokieltoa ei kirjoiteta. Linkkiä tai asiakasviestiä ei lähetetä. |
| Seuraava ajo | `src/gbb_mr_send_end_redemption_paylink.js:377,537–541`: tapa 3 sulkee pyörän pois valinnasta; myös map-vaiheen tarkistus ohittaa sen. |
| Status ja IC | `netsuite-bike-redemption-status-sync-rss2/gbb-redemption-sync-2/gbb_rss2_paatos.js:367–425`: olemassa olevaa tapaa 3 ei arvioida uudelleen. Status ja IC etenevät kirjattuun kuittaukseen luottaen. |
| Todistekirjasto | `netsuite-subscrption-cr-scripts/src/FileCabinet/SuiteScripts/gbb-lib/gbb_lunastus_lib.js:312–340`: suorituspäivä ja maksuton selvitystapa kelpaavat todisteeksi. Kirjasto ei lue huoltosummaa. |
| Jälkiveloitus | `netsuite-subscription-extension/gbb_ext2_paatos.js:94`: valinta edellyttää tyhjää selvitystapaa, joten tapa 3 estää myös tämän reitin. OOMI on lisäksi rajattu erikseen pois. |
| Puuttuvan linkin raportti | `cf-gbb-tools/src/app/lib/tools/netsuite-reporting/checks/ml4.ts:55`: tarkistus edellyttää tyhjää selvitystapaa. Tavan 3 nykyistä kattavuutta ei tarkisteta. |
| Huoltosumman muutos | `netsuite-staria-suitescripts/sta_ue_bike_register_hook.js:1189` alkaen käsittelee huoltosumman muutosta ja huoltopidennyksiä. Tutkitusta koodista ei löytynyt selvitystavan uudelleenavausta. |

Nykyinen käytös on myös kirjattu sääntöihin: `docs/lunastuksen-kenttasaannot.md` §11 toteaa tavan 3 kattavuuden lähetyshetkellä ja käyttää ajopäivää suorituspäivänä. ADR 0014 k. 23 ulottaa tämän OOMI-pyöriin. Korjaus edellyttää siten myös sääntömuutosta.

## Tuotantohavainto 5.11.2026

Kysely: aktiiviset tietueet (`isinactive = F`), selvitystapa 3, `subsc_end_date >= 5.11.2026`. Tuloksia **15**:

- Kaikki ovat OOMI-pyöriä, status 1 (Active).
- Päättymispäivät 1.12.2026–1.1.2027, kuittauspäivät 1.11. tai 4.11.2026.
- Kaikilla `link_sent = F` ja `NVL(maintenances_not_allowed,'F') = F`.
- Nykyinen huoltohyvitys kattaa hinnan edelleen kaikilla: **0 nykyistä maksuvajetta** tässä joukossa.
- Rekisterien loppulunastushintojen summa on **1 623,88 € netto**. Tämä on hintapohja, ei todettu tappio tai ennuste.

Huoltokieltokenttä osoittaa, ettei budjettia ole näillä pyörillä estetty tämän kentän kautta. Huollon kaikkien ulkoisten tilauskanavien toimintaa tai workflow-määrittelyjä ei tarkastettu. Myös 3.11. tehdyn huolto-oikeuden alustuksen säännöt (`imports/2026-11-03-huolto-oikeus/README.md`) sallivat huollon aktiivisille negatiivisen huoltosumman pyörille.

Todiste ja koko pyöräjoukko: [`audit.json`](../artifacts/2026-11-05-maintenance-settlement/audit.json). Uusinta vain lukevana: `node tools/audit-maintenance-settlement.mjs YYYY-MM-DD`.

### Konkreettinen esimerkki: B043000

Tuotannossa: päättyy **1.1.2027**, kuittaus **4.11.2026**, loppulunastushinta **128,99 € netto**, huoltosumma **−184,06 € netto**, ei huoltokieltoa, ei lähetysmerkintää.

Nykyisellä hintakirjastolla:

| Tilanne | Huoltosumma netto | Hyvitys netto | Maksettava brutto |
|---|---:|---:|---:|
| Nyt | −184,06 € | 184,06 € | 0,00 € |
| Jos huoltoon käytetään 100 € netto | −84,06 € | 84,06 € | **56,39 €** |

Toinen rivi on hypoteettinen laskenta, ei havaittu huoltotapahtuma. Hintakirjaston suoritus vahvisti tuloksen. Selvitystapa pysyy koodin mukaan 3:ssa, joten 1479 ei lähetä erotukselle linkkiä.

## Sama ongelma koskee jo lähetettyjä maksullisia linkkejä

Sääntöjen §11 mukaan Paylink-hinta määräytyy lähetyshetkellä eikä tilausta hinnoitella uudelleen. Jos huoltohyvitys pienentää positiivista linkkisummaa ja sama budjetti jää myöhemmin käytettäväksi, myös maksettu linkki voi kattaa lopullista hintaa pienemmän summan. Tavan 3 uudelleenarviointi yksin ei korjaa tätä. Tässä auditissa ei laskettu näiden linkkien joukkoa tai toteutunutta vajetta.

## Korjauksen suunnittelurajat

Tarvitaan päätös siitä, milloin huoltohyvitys muuttuu lopulliseksi ja mitä sen jälkeen saa käyttää huoltoon. Kaksi johdonmukaista vaihtoehtoa:

1. **Varaa lunastukseen käytettävä hyvitys hinnoitteluhetkellä.** Jos linkit pidetään 2 kk ennakossa, hyvitetty summa poistetaan myöhemmän huollon käytettävissä olevasta budjetista. Varauksen on katettava sekä maksuton että maksullinen lunastus ja toimittava kaikissa huoltokanavissa. Kirjanpidollista huoltosummaa ei pidä vain muuttaa varaukseksi ilman erillistä suunnittelua.
2. **Pidä hyvitys alustavana huolto-oikeuden päättymiseen asti.** Lopullinen hyvitys, kuittaus ja mahdollinen maksuero ratkaistaan vasta, kun saldo ei enää voi muuttua huollon tai myöhässä saapuvan laskun vuoksi. Kahden kuukauden ennakkolinkkien muutos- ja lisäveloituskäytös täytyy määritellä samalla.

Pelkkä tavan 3 siirtäminen päättymispäivälle jättää aukkoja:

- **OOMI:** status-sync 2.0:n vaihe 2a kirjoittaa tavan 1 ja suorituspäivän päättymiskuukauden alussa, jos tapa on tyhjä. Tämäkin sääntö on sovitettava valittuun ratkaisuun.
- **Lähetysikkuna:** 1479 ei käsittele jo päättyneitä sopimuksia. Lopulliselle tarkistukselle on oltava toimiva reitti myös päättymisen jälkeen.
- **Olemassa olevat linkit:** `link_sent`, Paylink-tilaus ja vanha SO voivat estää uuden linkin, vaikka tapa tyhjennettäisiin.
- **Jo kuitatut:** edellä löydetty 15 pyörän joukko tarvitsee erillisen käsittelyn. Historiallisten tavan 3 pyörien nykyinen saldo ei yksin todista alkuperäisen kuittauksen virhettä.
- **Valvonta:** tarvitaan tarkistus tavan 3 nykyiselle kattavuudelle sekä hyvityksen jälkeiselle budjetin käytölle. ML4 ei nykyisellään havaitse näitä.

Tässä tutkimuksessa ei valittu uutta rahankäsittelysääntöä eikä muutettu tuotantodataa.
