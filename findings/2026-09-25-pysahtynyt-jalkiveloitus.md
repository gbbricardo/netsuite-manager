# Neljä päättynyttä sopimusta ilman selvitystapaa: raportointi jatkuu, laskutus ei — 25.09.2026

**Kenelle:** taloustiimi (ja asiakaspalvelu CR:ien osalta) · **Määräaika:** ennen 30.09.2026, jotta
lokakuun palkka-CSV voidaan korjata · **Liite:** [`2026-09-25-pysahtynyt-jalkiveloitus.csv`](2026-09-25-pysahtynyt-jalkiveloitus.csv)
(UTF-8 BOM:in kanssa, erotin `;`, avautuu Exceliin. Yksi rivi per pyörä, ja mukana ovat kaikki
selvitystä helpottavat tiedot: työnantaja, työntekijä, runkonumero, CR:t, myyntitilaukset, laskut,
hyvitykset ja raportointirivit.)

> [!IMPORTANT]
> **Tilanne 29.09.2026 (tuoteomistaja):**
> - **ProMet Oy on asetettu konkurssiin.** Siksi päivämäärät näyttävät oudoilta. Kyse ei ole
>   keskenkauden lunastuksesta, jossa CR olisi unohtunut. **Taloustiimi päättää**, mitä kolmelle
>   sopimukselle tehdään. Alla oleva tulkinta *"keskenkauden lunastus ennen CR-käytäntöä"* on
>   kumottu.
> - **B016555 on kunnossa.** Lunastusmaksupyyntöä ei ole maksettu, joten **laskutusta jatketaan
>   lokakuuhun 2026 asti**. Ehdotus tavasta 2 on hylätty: laskun INVGBF1039336 kuukaudet 5–8/2026
>   kuuluvat sopimuskauteen (alkuperäinen loppu 31.08.2026), joten ne eivät ole ylimääräistä vuokraa.
>   Jäljellä on käytännön asia: syyskuun jälkiveloitus CR-6488 on Error-tilassa (Fortacon
>   sopimusrivit päättyvät 31.07.2026), ja 1.10. jälkiveloitusajo löytää pyörän vain, jos CR-6488 on
>   käsitelty sitä ennen. Muuten `subsc_end_date` on yhä 31.08.

## Mitä löytyi

Neljä pyörää on NetSuitessa tilassa **Active**. Niiden sopimuskausi on päättynyt, eikä niille ole
kirjattu selvitystapaa. Mikään automaatio ei käsittele niitä:

- kalenterisweep ei näe pyörää, jolla ei ole selvitystapaa
- jälkiveloitus ei ota niitä enää käsittelyyn (B016555:n viimeisin CR kaatui virheeseen, ja
  ProMet Oy:n kolmelle pyörälle jälkiveloitusta ei ole tehty koskaan)
- kuukausiraportointi jatkaa Active-rivejä 4.9.2026 päätetyn säännön mukaan: *raportointi jatkuu,
  kunnes velvoitteet on hoidettu*. Lokakuun rivit on jo luotu ProMet Oy:n pyörille.

**Seuraus:** ProMet Oy:n kolmelle työntekijälle raportoidaan palkanpidätystä (80,65 € alv 0 / kk),
vaikka sopimus päätettiin 30.11.2025, eikä työnantajaa ole laskutettu joulukuun 2025 jälkeen
(B023198: helmikuun 2026 jälkeen). Raportointi ja laskutus ovat keskenään ristiriidassa.

| Pyörä | Työnantaja | Työntekijä | Kausi päättyi | Mitä datassa on |
|---|---|---|---|---|
| B016555 | Fortaco Finland Oy | tommi koivisto | 31.08.2026 (normaali loppu) | jälkiveloitus 5/6/8/2026 **maksettu**, syyskuun CR-6488 kaatui (*No agreement rows*). Kaksi työnantajaa (Konetuuli Oy ja Fortaco). Syyskuulle 2 Ended-riviä ja 1 Active-rivi |
| B023198 | ProMet Oy | Jukka Virtanen | 30.11.2025 (alkuperäinen 31.07.2027) | ei CR:ää. Vuokraennakon myyntitilaus **Ferros Oy:lle** 01.05.2026 |
| B024587 | ProMet Oy | Markku Palviainen | 30.11.2025 (alkuperäinen 30.06.2027) | ei CR:ää. Lunastuksen myyntitilaus SOGBB0002727 12.12.2025, **ei maksua NetSuitessa** |
| B024908 | ProMet Oy | Heikki Mykkänen | 30.11.2025 (alkuperäinen 31.07.2027) | ei CR:ää. Lunastuksen myyntitilaus SOGBB0002755 12/2025, 1 976,63 €, **ei maksua NetSuitessa** |

Kaikki yllä oleva on **todennettu NetSuitesta 25.09.2026**: pyörärekisteri, muutospyynnöt,
transaktiot, Paylink-maksupyynnöt (ei yhtään) ja raportointirivit.

## Tulkinta 25.09. (päätelty, osittain kumottu 29.09., ks. yllä)

**ProMet Oy (3 pyörää).** Kolme sopimusta on päätetty samana päivänä 19–20 kk ennen alkuperäistä
loppua. Kahdelle on tehty lunastuksen myyntitilaus joulukuussa 2025. Tämä näyttää **keskenkauden
lunastukselta, joka tehtiin ennen CR-käytäntöä**: loppupäivä muutettiin käsin, mutta CR:ää ei tehty.
Lunastusmaksu on voitu maksaa NetSuiten ohi (SOGBB0002727:n muistio `M40572581383` voi olla
maksuviite). ADR 0010:n mukaan keskenkauden lunastusta ei ole ilman CR:ää, joten skriptien kannalta
pyörät ovat yhä käynnissä.

**B016555.** ADR 0009:n kohdan 5 mukaan kattavuusehto täyttyy: maksettu, hyvittämätön tyypin 7
lasku INVGBF1039336 on **274,89 € alv 0** (vuokra 239,04 + kulut 35,85), ja lunastushinta on
**84,00 € alv 0**. CR-6108:n hyvitys kohdistuu toiseen laskuun, Konetuuli Oy:n INVGBF1029302:een.
Jos taloustiimi hyväksyy tämän, velvoitteet on hoidettu ylimääräisellä vuokralla, ja pyörä voidaan
merkitä lunastetuksi.

## Kysymykset taloustiimille

Pyöräkohtaiset kysymykset ovat CSV:n sarakkeessa `kysymys_taloustiimille`. Tärkeimmät:

1. **ProMet Oy:** miksi kaikki kolme sopimusta päätettiin 30.11.2025? Onko B024587:n ja B024908:n
   lunastus maksettu, milloin ja mihin? Onko B023198:n työntekijä siirtynyt Ferros Oy:lle?
2. **ProMet Oy:** onko työntekijöiltä pidätetty pyöräetua joulukuun 2025 jälkeen? Jos sopimus on
   päättynyt, raportointi on ollut väärin.
3. **B016555:** kumpi on oikea työnantaja 5–8/2026, ja hyväksytäänkö maksettu jälkiveloitus
   lunastusmaksun kattajaksi?

## Ehdotettu ratkaisu, kun vastaukset on saatu

| Pyörä | Jos | Toimenpide | Kuka |
|---|---|---|---|
| B016555 | (päätetty 29.09.) laskutus jatkuu lokakuuhun | Fortacon sopimusrivit 9/2026 alkaen, sitten CR-6488 Error → Pending ennen 1.10. Muuten lokakuun tyypin 7 CR käsin. Syyskuun RI-rivit tarkistetaan: Fortacon Ended-rivi 63387 on ristiriidassa jatkuvan laskutuksen kanssa | taloustiimi / asiakaspalvelu |
| ProMet × 3 | (29.09.) konkurssi | taloustiimi päättää sopimusten käsittelyn. Asiakaspalvelu kirjaa päätöksen CR:llä | taloustiimi |

> [!WARNING]
> **Lokakuun rivit.** Lokakuun Active-rivit on jo luotu ProMet Oy:n pyörille (RI 104318, 104319,
> 104320). Jos CR tehdään ja pyörä merkitään päättyneeksi, `ri_update` alentaa rivin Warningiksi
> (`mr_monthly_reporting_ri_update.js`, sopimusankkuri). **Warning-rivi pidättää koko ProMet Oy:n
> palkka-CSV:n.** Jos korjaus tehdään ennen palkka-CSV:n poimintaa, poista lokakuun rivit tai merkitse
> ne käsin *Deleted*-tilaan. Muuten muiden ProMet Oy:n työntekijöiden pidätykset jäävät pois.

## Miksi tämä ei korjaannu itsestään

- **ProMet Oy:** jälkiveloitushaku (`customsearch_gbb_br_pidennykset`) etsii 1. päivänä pyörät,
  joiden loppupäivä oli eilen. 1.12.2025 haun olisi pitänyt löytää nämä kolme, mutta tyypin 7
  CR:ää ei syntynyt. Todennäköinen syy on se, että jokin skriptin poistumisehdoista (esim. avoin
  lunastusmyyntitilaus) pysäytti käsittelyn hiljaa. Pyörä ei enää koskaan palaa hakuun
  (CLAUDE.md § *The extension loop has no owner and exits silently*). **Päätelty, ei todennettu:**
  vuoden 2025 ajolokeja ei ole tarkistettu.
- **B016555:** CR-6488 on Error-tilassa, koska Fortacon sopimusrivit päättyvät 31.07.2026.
  Error-tilaista CR:ää ei yritetä uudelleen, ja silmukka loppuu tähän ilman ilmoitusta.
- **Status-sync 2.0** (lokakuu) raportoi tällaiset pyörät, mutta ei ratkaise niitä: päätös vaatii
  ihmisen.

## Tarkistuskysely

Joukko, josta nämä neljä löytyivät. Odotus selvityksen jälkeen: 0 riviä.

```sql
SELECT br.id, br.name, br.custrecord_sta_subsc_end_date
FROM customrecord_sta_bike_register br
WHERE br.custrecord_sta_bike_status = 1 AND br.custrecord_gbb_liab_settle_method IS NULL
  AND NVL(br.custrecord_sta_bike_order_type,0) <> 3
  AND COALESCE(br.custrecord_gbb_exceptional_end_date, br.custrecord_gbb_oomi_exceptional_end_date,
               br.custrecord_sta_subsc_end_date) < TO_DATE('2026-09-01','YYYY-MM-DD')
```

25.09.2026 kysely palautti 5 riviä. Viides, B038492, on D9-pyörä, joka käsitellään T1c:ssä.
