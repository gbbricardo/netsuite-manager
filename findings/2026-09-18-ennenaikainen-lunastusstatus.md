# Ennenaikainen lunastusstatus — mitatut poikkeamat

**Päivämäärä:** 2026-09-18 · **Sääntö:** [`docs/lunastuksen-kenttasaannot.md`](../docs/lunastuksen-kenttasaannot.md)

Kaikki luvut **todennettu NetSuitesta** SuiteQL-kyselyillä 18.09.2026, ellei toisin mainita.
Kirjoittajien tunnistus on **pääteltyä** kenttäjäljistä ja koodista, ei todennettu execution logista.

## Ydinhavainto

`custrecord_sta_bike_status` vaihdetaan arvoon 2 (Redeemed) sillä hetkellä kun lunastus käsitellään,
ei sillä hetkellä kun vuokrakausi päättyy. Kummallakaan kirjoittajalla ei ole päivämääräporttia joka
vertaisi päättymisajankohtaan.

Statusta kirjoittaa koodissa **vain kaksi riviä**:

| Kirjoittaja | Rivi | Laukaisin |
|---|---|---|
| `handler_lunastus.js` | `:108` | CR:n käsittely |
| `gbb_ss_bike_redemption_status_sync.js` | `:434` | maksun saapuminen |

`cf-gbb-tools` lukee statuksen viidessä paikassa mutta ei kirjoita sitä kertaakaan.

## Populaatiot

### 189 — lunastettu, vuokrakausi yhä kesken

```sql
SELECT COUNT(*) FROM customrecord_sta_bike_register
WHERE custrecord_sta_bike_status = 2
  AND custrecord_sta_subsc_end_date > CURRENT_DATE
```

Päättymispäivät 30.09.2026 – 30.06.2027.

### 10 — näistä kuukausiraportoinnin suojan ulkopuolella

`mr_monthly_reporting_ri_creation.js:1004` reitittää pyörän `processEndedBike`-haaraan pelkän
statuksen perusteella, ilman päivämäärävertailua. Ainoa suoja on `isBeforeExistingEndedRow`
(`:1022-1024`, T-A2-korjaus 2026-09-03), joka vaatii Ended-RI:n päivättynä sopimuksen päättymisen
jälkeen.

| Tilanne | Pyöriä |
|---|---|
| Ended-RI päivätty sopimuksen päättymisen jälkeen — suoja pitää | 179 |
| Ended-RI jo menneisyydessä, sopimus jatkuu — **aukko** | 7 |
| Ei yhtään Ended-RI:tä — **suojaamaton** | 3 |

Seitsemällä aukkopyörällä sopimus päättyy 30.09.2026, eli altistus on yksi kuukausi. Kolme on
vakavia:

| Pyörä | Sopimus päättyy | Aikaisin Ended-RI | RI-rivejä yht. |
|---|---|---|---|
| B021682 | 31.10.2026 | 01.09.2026 | 2 |
| B008485 | 28.02.2027 | 01.09.2026 | 2 |
| B040468 | 30.06.2027 | 01.09.2026 | 1 |

**Nämä kolme eivät tule CR-polulta.** B008485:lla ja B021682:lla ei ole yhtään CR:ää, ja kaikilla
kolmella on `custrecord_gbb_redemption_paid_at` asetettuna (24.08., 01.08., 02.07.2026) ja
`custrecord_gbb_liab_settle_method = redemption_paid`. Se on maksuvetoisen synkronoinnin
allekirjoitus.

B040468:n päivämäärät ovat muutenkin ristiriitaiset: CR-4634 sanoo `official_end = 30.06.2026`,
rekisteri sanoo 30.06.2027, ja peruttu CR-4544 kantoi arvoa 21.12.2027. Sitä ei pidä käyttää tämän
ilmiön esimerkkitapauksena ilman erillistä selvitystä.

### 3 278 — historiallisesti lunastettu ennen päättymistä

`custrecord_gbb_date_to_non_active` on täytetty **100-prosenttisesti** kaikilla 12 339 lunastetulla
pyörällä (kirjoittaja `gbb_ss_bike_status_history_backfill.js:118`, lähde NetSuiten oma
`systemnote`). Sen vertaaminen sopimuksen päättymispäivään antaa ilmiön historiallisen koon:

| | Pyöriä |
|---|---|
| Status vaihtui **ennen** sopimuksen päättymistä | **3 278** |
| Status vaihtui päättymisen jälkeen | 7 281 |
| Tasan päättymispäivänä | 1 780 |

Sääntödokumentti **ei vaadi näiden korjaamista**: vuokrakausi on jo ohi eikä korjaus muuta mitään.
Ne 189 ovat eri asia — ne vaikuttavat yhä tuleviin raportointiriveihin ja laskutukseen.

## Kenttäkohtaiset havainnot

### `redemption_paid_at` on olemassa vain selvitystavalla 1

| Selvitystapa | Pyöriä | Joilla `paid_at` tyhjä |
|---|---|---|
| 1 `redemption_paid` | 10 712 | 139 |
| 2 `redemption_extra_rent` | 68 | **68** |
| 3 `redemption_maint_budget` | 4 | **4** |
| 5 `bike_returned` | 178 | **178** |
| 6 `bike_sold_to_competitor` | 16 | **16** |
| 7 `bike_stolen_or_destroyed` | 122 | **121** |

Selvitystavalla 1 kentät `paid_at` ja `liab_settled_at` ovat identtiset 10 520 tapauksessa ja
eroavat **53:ssa**. Ero johtuu siitä että `handler_lunastus.js:199` leimaa `liab_settled_at`-kenttään
`new Date()` eli ajopäivän, kun maksupäivä on toinen. Kenttä on write-once, joten virhe on pysyvä.

### Selvitystapa määrää kohdestatuksen

| Selvitystapa | → status 2 | → status 3 |
|---|---|---|
| 1 `redemption_paid` | 10 620 | 3 |
| 2, 3, 6, 7 | 210 | 0 |
| 5 `bike_returned` | 0 | 178 |

Sääntö **5 → 3, kaikki muut → 2** pitää kolmea poikkeusta lukuun ottamatta 11 000 tietueesta.
Kohdestatusta ei siis tarvitse päätellä CR:n nimestä, kuten `handler_lunastus.js:107` tekee
(`crName.indexOf('2D')`).

### `ic_redemption_dt` seuraa sopimuksen päättymiskuukautta

Lunastetuista 10 569:stä joilla kenttä on täytetty:

| Kuukausi vastaa | Osuvuus |
|---|---|
| `subsc_end_date`:n kuukautta | 10 356 (98 %) |
| `liab_settled_at`:n kuukautta | 7 413 (70 %) |
| `redemption_paid_at`:n kuukautta | 7 281 (69 %) |
| on kuun viimeinen päivä | 10 219 (97 %) |

Päiväjakauma: 31. → 6 147, 30. → 3 319, 28. → 928, 29. → 19. Loput hajaantuvat.

### Kaksi kenttää joita mikään koodi ei kirjoita

`custrecord_gbb_ic_redemption_dt` ja `custrecord_gbb_exceptional_end_date` eivät saa arvoaan
mistään skriptistä seitsemässä sisarrepossa. `systemnote` vahvistaa: kaikki muutokset on tehty
entiteetillä `-5` (System), eli CSV-importilla.

| Kenttä | Ensiasetuksia | Ylikirjoituksia |
|---|---|---|
| `custrecord_gbb_ic_redemption_dt` | 10 705 | **2** |
| `custrecord_gbb_exceptional_end_date` | 78 | 16 |

Toinen `ic_redemption_dt`:n ylikirjoituksista on `09.07.2026 → 31.08.2026` — joku korjasi keskellä
kuuta olevan päivän kuun viimeiseksi, vaikka `calculateUnbilledMonths` ei lue päivää lainkaan.

Importit tulevat jälkikäteen: 02.09.2026 kirjoitettiin arvo 31.08.2026 viidelle pyörälle.

### `exceptional_end_date` on OOMI-only ja se on ajoituksen syöte

Kaikki 79 arvoa ovat OOMI-pyörillä (74 Redeemed, 3 Returned, 2 Active), kaikki kuun viimeisiä
päiviä, 75/79 identtinen `subsc_end_date`:n kanssa.

`gbb_ss_bike_redemption_status_sync.js:255` ja `:329` lukevat sen:
`COALESCE(custrecord_gbb_exceptional_end_date, custrecord_gbb_oomi_exceptional_end_date)`.
Se on siis päättymisajankohdan ensisijainen lähde, ei lunastuksen tulos.

## Juurisyy maksuvetoisella polulla

`gbb_ss_bike_redemption_status_sync.js`:n `MATCH_WHERE_SQL` (`:202-216`) haarautuu kahtia. Toinen
haara vaatii päättymispäivän, mutta `subscenddate` populoidaan vain `so_type = 4`:lle (kauden lopun
lunastus, `:256` ja `:330`). Keskenkauden lunastuksella (`so_type = 3`) se on `NULL`, jolloin
`COALESCE(overridedate, subscenddate, eventdate)` putoaa maksupäivään ja pyörä päättyy sinä päivänä
jona raha saapui.

Skriptin oma otsikkokommentti (`:55-62`) lupaa päinvastaista: *"a resolved schedule date never
matches in the future — the bike must never redeem before its actual due date"*. Lupaus pätee vain
kun päättymispäivä on olemassa.

## Muut vaikutukset joita ei ole mitattu

Nämä on **päätelty koodista** eikä niiden kokoa ole kysytty NetSuitesta:

- `mr_monthly_reporting_ri_update.js:717-720` demotoi RI-rivin Warningiksi ja lisää tekstin
  *"Pyörä merkitty lunastetuksi tai palautetuksi ennen tietojen täydentämistä"*, jos rekisteri sanoo
  Redeemed kun rivin merkintöjä täydennetään. Warning-rivi pidättää koko työnantajan CSV:n.
- `gbb_ss_bike_redemption_status_sync.js:261` ja `:335` suodattavat `bike_status = 1` jo
  sisäkyselyssä, joten liian aikaisin käännetty pyörä ei enää koskaan saa
  `custrecord_gbb_redemption_paid_at`-leimaa.
- `mr_subscription_extension.js:220` suodattaa samoin `bike_status = 1`, joten maksamatonta
  lunastusta ei havaita eikä tyypin 7 CR:ää luoda. Tämä koskee varmuudella `overrideEndDate`-haaraa;
  normaaliajo käyttää tallennettua hakua (`search.load`), jonka suodattimia ei ole tarkistettu.
- `gbb_webhook_ue_status_changed.js` laukeaa kuukausia etuajassa.

## Korjausjärjestys

1. **Ei taannehtivaa korjausta niille 3 278:lle.** Kausi on ohi.
2. **Ne 10 aukkopyörää ensin.** Status takaisin 1:ksi ja puuttuvat RI-rivit — käsin, koska statuksen
   kirjoitus laukaisee webhookin. Ei massa-CSV-importilla.
3. **Ne 189** tarkistetaan sen jälkeen: suoja pitää tällä hetkellä 179:llä, mutta se nojaa yhden
   UE-skriptin luomaan Ended-riviin.
4. **Sääntömuutokset omistaviin repoihin** [`lunastuksen-kenttasaannot.md`](../docs/lunastuksen-kenttasaannot.md)
   kohdan *Tunnetut sääntörikkomukset koodissa* mukaan.
