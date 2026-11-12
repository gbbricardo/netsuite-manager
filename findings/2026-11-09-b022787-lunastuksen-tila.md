# B022787 — miksi pyörä on yhä Active ja mitä lunastettuun tilaan pääsy vaatii

- **Päivämäärä:** 9.11.2026
- **Pyörä:** B022787 (rekisteri-id 22787), työnantaja Lempi Kodinhoito Oy
- **Perustuu:** ADR 0009 (k. 2, 3, 4), ADR 0012 (k. 1, 4, 5, 6, 9), ADR 0015 (k. 5), `docs/lunastuksen-kenttasaannot.md` § 11
- **Todennettu NetSuitesta 9.11.2026** ellei toisin mainita. Laskelmat ovat johdettu ADR:n kaavasta.

## 1. Tilanne NetSuitessa (todennettu)

| Tieto | Arvo |
|---|---|
| `custrecord_sta_bike_status` | 1 Active |
| `liab_settle_method`, `liab_settled_at`, `redemption_paid_at`, `redemption_decided_at` | kaikki tyhjiä |
| `subsc_org_end_date` → `subsc_end_date` | 31.8.2026 → 30.11.2026 (+3 kk) |
| `custrecord_sta_end_redemption_price` (netto) | 83,87 € |
| `custrecord_sta_maintenance_sum` (netto) | 111,55 € |
| `eredem_link_sent`, `end_red_so_created`, `ic_redemption_done` | T, F, F |
| Paylink 19345 *Työsuhdepyörän loppulunastus* | pending, 4,42 € brutto / 3,5219 € netto, eräpäivä 15.10.2026, ei maksettu, ei NetSuite-tapahtumaa |
| CR-7807 (tyyppi 7, `S2769033369 - pidennys - jälkiveloitus`) | Done 5.11.2026, luonut laskun INVGBF1050874 |
| INVGBF1050874 | 116,21 €, Open, maksamatta; hyvityslaskuja ei ole linkitetty |
| Tyypin 2 / 10 / 11 CR:t | ei yhtään |

## 2. Alkuperäinen lunastusmaksu (kaava, ADR 0012 k. 1, kenttäsäännöt § 11)

Huoltoporrastaulun ylärajat (todennettu): 64,53 / 128,28 / 192,02 …

```
huoltosumma 111,55  →  pienin kattava porras 128,28
huoltohyvitys       =  128,28 − 111,55            =  16,73 €
maksettava netto    =  83,87 − 16,73              =  67,14 €
maksettava brutto   =  round2(67,14 × 1,255)      =  84,26 €
```

**Alkuperäinen lunastusmaksu on 67,14 € netto / 84,26 € brutto** nykyisillä rekisteriarvoilla.

### Täsmäytys Paylink-pyyntöön

- Pyynnön summa 3,5219 € netto + 63,75 € (80 € brutto, yksi jälkiveloituskuukausi) = **67,27 € netto**, eli 84,42 € brutto.
  Oletus pitää: pyyntöä on alennettu 80 € brutto, ja alennus vastaa yhtä jälkiveloituskuukautta.
  Alennus on todennäköisesti tehty käsin (ADR 0012 k. 9: asiakaspalvelu päivittää avoimen tilauksen summan).
- Ero laskelmaan on **0,13 € netto (0,16 € brutto)**. Se vastaa huoltosummaa 111,68 €, kun rekisterissä on nyt 111,55 €
  (johdettu, ei todennettu). Huoltosumma on siis todennäköisesti muuttunut pyynnön lähetyksen jälkeen. ADR 0012 k. 2:n mukaan
  summa lasketaan vain kerran lähetyshetkellä, joten pyyntö ei seuraa muutosta.
- Jäljellä oleva summa nykyisillä arvoilla: 67,14 − 63,75 = **3,39 € netto / 4,25 € brutto**. Pyynnössä on 4,42 €.

## 3. Miksi pyörä on yhä Active

Status-sync 2.0 (script 1480) kääntää statuksen 2:ksi vasta, kun pyörällä on selvitystapa (ADR 0009 k. 2, 3). Tapaa ei ole,
koska mikään tapa ei vielä kata velvoitetta:

| Tapa | Ehto | B022787 |
|---|---|---|
| 1 `redemption_paid` | maksettu loppulunastustilaus (`pl_ns_status` = 3), summaa ei verrata (ADR 0012 k. 4) | **Ei täyty.** Paylink 19345 on pending, eräpäivä 15.10. ohi |
| 2 `redemption_extra_rent` | Done *pidennys*-CR:t × 63,75 € ≥ maksettava netto (ADR 0012 k. 5, ADR 0015 k. 5) | **Ei täyty.** CR-7807 laskee yhden kuukauden: 63,75 < 67,14 (vajaa 3,39 € netto) |
| 3 `redemption_maint_budget` | huoltohyvitys kattaa hinnan | Ei: hyvitys 16,73 < 83,87 |
| 4 `redemption_down_payment` | loppulunastushinta = 0 € | Ei: 83,87 € |

Muut huomiot:

- Jälkiveloituslaskun maksamattomuus **ei** ole syy. Tavan 2 kattavuus ei vaadi maksua (ADR 0012 k. 5).
- Pyörä on jälkiveloituksessa, koska päättymiskuun (marraskuu) velvoitetta ei hoidettu ajoissa. Marraskuun 1. päivän
  tunnistuspäivä on jo ohi, joten statuksen vaihto tapahtuu heti seuraavassa yöajossa, kun tapa on asetettu (ADR 0009 k. 2).
- Hyvityksiä ei huomioida kattavuudessa (ADR 0015 k. 5), eikä hyvitystä ole tehty.

## 4. Mitä pitää tapahtua, jotta pyörä merkitään lunastetuksi

Kaksi reittiä, joista ensimmäinen tapahtuu ensin:

1. **Asiakas maksaa Paylink 19345:n** (4,42 €). Silloin tapa 1 asetetaan, `liab_settled_at` ja `redemption_paid_at` = maksupäivä,
   ja status-sync 2.0 kääntää statuksen 2:ksi seuraavassa yöajossa (00:30 Helsinki). Maksettu tilaus kattaa aina,
   vaikka summa olisi vajaa (ADR 0012 k. 4). Tämä on lyhin reitti.
2. **Toinen jälkiveloituskuukausi (joulukuu).** Jos velvoite ei ole hoidettu marraskuun loppuun mennessä (`subsc_end_date` 30.11.),
   `handler_jalki` laskuttaa uuden kuukauden. Kun toinen Done *pidennys*-CR on olemassa, 2 × 63,75 = 127,50 ≥ 67,14 ja tapa 2 asetetaan,
   `liab_settled_at` = uuden CR:n sulkemispäivä. Tämä maksaa asiakkaalle toisen n. 116 €:n laskun, eikä sitä kannata odottaa.

Tarkistettavaa ennen kumpaakaan reittiä:

- Onko Paylinkin 4,42 € oikea summa? Nykyisillä arvoilla pitäisi olla 4,25 €. Huoltosumman muutos on 0,17 €:n eron todennäköinen syy.
  Jos huoltosumma on muutettu käsin virheellisesti, korjaa se ensin.
- Paylinkin eräpäivä 15.10. on ohi. Tarkista, että linkki on yhä maksettavissa.
- Jos asiakas maksaa sen jälkeen, kun tapa 2 on jo asetettu, ylimääräinen maksu palautetaan tapauskohtaisesti (ADR 0012 k. 9, T45).

## 4b. Päätös ja toteutus 9.11.2026

- **Päätös (asiakaspalvelu, Slack 9.11.):** loppulunastuksen jäännös 4,42 € (alle 5 €) jätetään laskuttamatta työnantajalta
  Lempi Kodinhoito Oy:ltä, eikä toista jälkiveloituskuukautta (n. 115 €) laskuteta sen takia. Sopimus päätetään marraskuun
  loppuun. Asiakaspalvelun oma suunnitelma oli poistaa Paylink-maksupyyntö (Paylink-tilaus 351654, NetSuitessa 19345) ja
  tehdä päättäminen CR-työkalulla.
- **Toteutettu (käyttäjä):** pyörälle kirjattu käsin tapa 2 `redemption_extra_rent` ja `liab_settled_at` = 5.11.2026.
  `end_redemption_price` ja `maintenance_sum` jätettiin ennalleen.
- **Tarkistettu 9.11.:** tapa ja `liab_settled_at` oikein, `paid_at` tyhjä. `redemption_decided_at` = 9.11.2026
  (UE leimasi, ADR 0009 k. 3 sallii, ei merkitystä). Status yhä Active.
- **Perustelu CR-7807:n `custrecord_cr_notes`-kenttään:** käyttäjä kirjasi sen 9.11. (Claude Coden kirjoitus estettiin).
  Sisarrepot eivät lue kenttää (tarkistettu `grep`illa neljässä sisarrepossa).
- **Odotettu seuraavassa yöajossa (1480, 10.11. klo 00:30):** status 1 → 2 ja `ic_redemption_dt` = 30.11.2026. Todennettava 10.11.
- **Tunnettu poikkeama:** kattavuus 63,75 € < 67,14 € netto (tappio 3,39 €). Kattavuuskysely merkitsee pyörän poikkeamaksi.
- **Paylink 19345:** ADR 0012 k. 9 ei peruta avoimia tilauksia. Asiakaspalvelu poistaa sen itse. Se ei estä lunastusta,
  koska tapa on jo asetettu.

## 5. Rajaukset

- Huoltosumman arvoa pyynnön lähetyshetkellä ei todennettu, vain johdettu.
- Status-sync 2.0:n lokia ei luettu tälle pyörälle, joten väite "seuraavassa yöajossa" perustuu ADR:iin, ei lokiin.
- Hyvityksiä haettiin pyörän tunnuksella ja laskun linkeistä. Tunnuksettomia hyvityksiä haku ei löydä.
