# Palautuneet pyorat ja status Returned (3) — mittaus 29.09.2026

Tehtava: onko kaikki palautuneet pyorat merkitty statukselle Returned (`custrecord_sta_bike_status` = 3)?
Lukutehtava, NetSuiteen ei kirjoitettu. Kaikki luvut ovat **todennettu NetSuitessa 29.09.2026** (SuiteQL),
ellei toisin sanota. Korjausehdotus: `2026-09-29-returned-statukset-korjausehdotus.csv` (vain ehdotus).

## Lyhyesti

- Status 3 on kaytossa **189 pyoralla** (Active 33 280, Redeemed 13 156, tyhja **121**).
- **Palautus-CR:n perusteella status on oikein lahes kaikilla**: Done-tilaisia tyypin 2 CR:ia, joiden nimi
  sisaltaa `2D`, on 94, ja 92 niiden pyorasta on status 3. Vain **2** on Redeemed (B021850, B039536).
- Selvitystapa 5 (`bike_returned`) ja status 3 osuvat taysin yhteen: method 5 -pyoria joilla status <> 3 on **0**;
  status 3 -pyoria joilla method <> 5 on **3**.
- Suurin epavarmuus: **98/189 Returned-pyoralla ei ole Done-tilaista tyypin 2 CR:aa** (97:lla ei mitaan CR:aa).
  Ne ovat historiaa (date_to_non_active 2025-2026) eika niita voi todentaa NetSuitesta; ks. luokka B3.
- Toinen todistelahde on Oomin `cancellation_reason` = 4 (returned): **18 pyoraa** ei ole statuksella 3
  (15 Redeemed, 2 Active, 1 tyhja). Ne ovat epavarmoja, ei todistettuja virheita.

## Menetelma ja tunnistus

- Palautus tunnistetaan handlerista: `handler_lunastus.js:146` — CR:n `altname` sisaltaa `2D` -> status 3, method 5.
  Kaikki 94 `2D`-CR:aa ovat tyyppia 2 ja tilassa Done; lisaksi 83 tyypin 11 (Done ja Cancelled) hyvitys-CR:n nimessa on `2D`
  (`... - 2D - hyvitys`), ne eivat ole palautuspaatoksia.
- Tyypin 2 CR:ia ei ole Pending-tilassa lainkaan; ryhmittely `2B` 57, `2C` 1 465 (+39 Cancelled), `vakuutus` 127,
  `2D` 94, muu 82 (Done). Ei tyyppia jonka nimessa olisi palaut/return/varka/kado (0 osumaa, `UPPER(altname) LIKE`).
- 82 "muuta" nimea (79 niista Notion) ovat `Notion-nnn` (11.09.2026, 79 kpl) — nimesta ei nae onko 2C vai 2D. Kaikki ovat status 2
  + method 1, eli handler on kayttanyt oletusta (2C). **Pääteltyna koodista**, ettei yksikaan ole palautus;
  nimipohjaisella reitityksella palautus olisi jaanyt `2D`-nimen varaan.
- Suodattimen validointi: `LIKE '%2D%'` palautti rivit (94 + 82), status 3 -haku tasmasi ryhmittelyyn (189 = 186 + 3),
  ja tyhjat tulokset (esim. method 5 & status <> 3 = 0) on ristiintarkistettu toisella kyselylla (`bike_status`
  -ryhmittely method-kentalla). Kyselyt eivat kayttaneet `systemnote`-tauluja.

## 1. Palautus todistettu, mutta status <> 3

| Luokka | Maara | Tila |
|---|---|---|
| A1 Done 2D-CR (tyyppi 2), bike status 2 | **2** | todennettu |
| A1 Done 2D-CR, bike status 1 tai tyhja | **0** | todennettu |
| Tyypin 2 CR Pending/Error/Needs Review ja `2D` | **0** | todennettu |
| Tyypin 10 (Reklamaatio/peruutus) CR palautukseen viittaavalla nimella | ei osumia | todennettu (nimihaku) |
| A2 Oomi `cancellation_reason`=4 returned, status 2 | **15** | todennettu kentat; palautus **paateltyna** |
| A3 sama, status 1 | **2** | sama |
| A4 sama, status tyhja | **1** | sama |
| `return_status` (customlist535) taytetty, status <> 3 | 17 | 14 Redeemed rs=2 processing, 1 Redeemed rs=3, 2 Active rs=2; paallekkain A-luokkien kanssa |
| method 5 mutta status <> 3 | **0** | todennettu |

### A1 — kaksi pyoraa (todennettu)

| Pyora | CR | CR luotu | Nykytila |
|---|---|---|---|
| B021850 | 3275 `M32197707445 - 2D` (Done), hyvitys 3276 Done | 28.05.2026 | status 2, method **1**, liab_settled_at 28.05.2026, dna 29.05.2026, ic 31.08.2026 |
| B039536 | 4419 `M55719393295 - 2D` (Done), hyvitys 4420 Cancelled | 10.07.2026 | status 2, method **1**, liab_settled_at 10.07.2026, OOMI, cancellation_reason 4, return_status 3 |

Syy (**paateltyna koodista + todennettu**): kentta `liab_settle_method` on write-once, ja pyoralla oli jo method 1;
handler laskee kohdestatuksen `kohdestatus(method)`:sta (1 -> 2), joten 2D-nimi ei anna statusta 3. Molemmilla
on hyvitys-CR, eli asiakas on palauttanut pyoran ja laskutus on hyvitetty, mutta rekisteri sanoo Redeemed.
Vaikutus: IC-laskenta kohtelee pyoraa lunastettuna (`ic_redemption_dt` asetettu).

### A2-A4 — Oomi-palautusmerkinnat (epavarma)

15 Redeemed-pyoraa, kaikilla oomi_bike_status 5 (cancelled), cancellation_reason 4, return_status 2 (processing)
ja pääosin **method 8 (historical_unknown)** ilman liab_settled_at-arvoa; end date 30.04. tai 31.05.2026, dna 02.06. tai
10.06.2026: B037700, B038259, B039043, B039133, B039189 (method 1, settled 31.08.2026), B039391, B039401, B039656,
B040254, B040400, B040848, B041627, B042343, B042715 (+ B039536 yllä). Ne ovat status 2 selvitystavalla
"historiallinen tuntematon", eli edellinen korjausajo (`2026-09-20-selvitystavan-taydennys-paattyneille`) on
tayttanyt tavan tietamatta tapaa. **Onko pyora palautettu vai lunastettu, ei selvia NetSuitesta** — vaatii
Oomi/Fleet-vahvistuksen ennen mitaan muutosta. Kaksi Active-pyoraa (B039331, ed 24.04.2028; B039948, ed 14.01.2030)
ja B046740 (status tyhja, return_status 1 completed) ovat samaa joukkoa.

## 2. Status = 3, mutta todiste puuttuu tai ristiriita

| Tarkistus | Maara | Tila |
|---|---|---|
| Returned yhteensa | 189 | todennettu |
| Done 2D-CR loytyy | 90 | todennettu |
| Ei Done 2D -CR:aa | **99** | todennettu |
| ...joista ei yhtaan tyypin 2 Done -CR:aa | 98 | todennettu |
| ...joista ei mitaan CR:aa lainkaan | **97** | todennettu |
| method <> 5 (method 1) | **3** | todennettu |
| `redemption_paid_at` taytetty | **3** (samat) | todennettu |
| Paattymisankkuri (kuun 1. pv) tulevaisuudessa | **0** | todennettu (§3) |
| Paattymispaiva tyhja | 0 | todennettu |
| `date_to_non_active` tyhja | **0** | todennettu |
| `date_to_non_active` ennen paattymiskuun 1. pv:aa | 1 (B036997, dna 31.08.2026, ed 30.09.2026) | todennettu; 1 paiva, ei sisallollinen |
| `ic_redemption_dt` tyhja | **11** | todennettu |
| OOMI-pyoria | 9 | todennettu |

Odotus "ankkuri ei tulevaisuudessa" ja "dna taytetty" toteutuvat taydellisesti (0/0). Kalenterisweep ei ole kaantanyt
tulevia paattymisia palautetuiksi.

### B1 — Returned + lunastuskentat (3, todennettu)

- **B036124**: method 1, paid_at = liab_settled_at = 22.12.2025, dna 27.03.2026, ei CR:aa. Status 3 ja maksettu lunastus.
- **B037996** (OOMI): method 1, paid_at = settled_at 20.08.2026, Paylink 14409 completed 21.08.2026, dna 02.09.2026, ei CR:aa.
- **B045683** (OOMI): CR 5481 `... - 2D` Done 26.08.2026 (voimassaolopaiva 31.08.), mutta method 1 + paid_at 20.08.2026,
  Paylink 14332 completed; hyvitys-CR 5482 Cancelled, aiempi hyvitys 5095 Done 31.07.2026.
  Kaksi todistetta ristiin: sekä palautus-CR etta maksettu lunastus. Kumpikin status (2/3) on perusteltavissa.

Kahdella ensimmaisella maksun ja method 1:n perusteella oikea status olisi todennakoisesti 2 (**pääteltyna**, eika
CR:aa ole joka kertoisi palautuksesta). Syy, miksi status on silti 3, ei selvia NetSuitesta (ei kirjoittajaa
tunnistettu; `systemnote` ei kaytetty).

### B2 — Returned ilman 2D-CR:aa mutta jokin tyypin 2 CR

B011615: CR 6147 `M56693490026 - Paatospaivan muokkaus - Poikkeus` (tyyppi 2, Done 07.09.2026, virallinen loppu
30.09.2026) + hyvitys 6146 + siirto 5706. Status 3, method 5, settled_at 06.09.2026, decided_at ja dna
28.09.2026 (eilen). Kasin tehty poikkeus; palautusta ei voi todentaa CR:n nimesta.

### B3 — Returned ilman mitaan CR:aa (97) ja muut

Historialliset joukkopaivitykset: dna-paivat kasautuvat samoille paiville (mm. 03.11.2025, 27.03.2026, 17.03.2026, 28.01.2026
jne. esimerkeissa), eli status 3 asetettu kasin erissa. Esimerkit: B002658 (ed 31.12.2025), B003151 (30.11.2025), B005097
(30.11.2025), B007585 (31.10.2025), B013905 (31.05.2025), B020880 (ed 31.12.2024, ic tyhja), B030360 (ed 01.01.2025).
Naista ei loydy NetSuitesta palautusta tukevaa todistetta (ei CR:aa, ei cancellation_reasonia, ei Paylinkia).
Ne eivat ole todistetusti vaarin; **todennus vaatii Fleet/varastotiedon**. Method 5 on 96 %:lla (186/189) —
`liab_settle_method` on todennäköisesti täytetty samasta joukkoajosta, joten se ei ole itsenäinen todiste.

Muut: **ic_redemption_dt tyhja 11** (B002826, B005459, B005951, B012956, B020880, B021702, B023575, B023602, B029923,
B038316, B046502; jälkimmäiset sisältävät heinä-elokuun 2026 CR-palautukset) — IC-laskenta ei näe niitä
(kuuluu status-sync 2.0:n `ic_redemption_dt`-vaiheeseen). Useimmat 2D-CR:t ovat kesan 2026 ajalta ja niissä dna on
CR-kasittelypäivä.

## 3. Paallekkaisyydet (Returned- ja Redeemed-todisteet)

| Tapaus | Maara |
|---|---|
| Status 3 + method 1 + paid_at | 3 (B036124, B037996, B045683) |
| Status 3, sekä 2D-CR että lunastusmaksu | 1 (B045683) |
| Status 3 + Paylink completed | 12 pyoraa; osalla 2D-CR (mm. B004578, B007240, B007867, B011236, B025092, B043876, B045683), osa OOMI-pyoria. Paylink-pyynnon tarkoitusta ei voitu erottaa (**pääteltyna**: mahdollisesti loppulunastus tai vahingonkorvaus) |
| Status 2 + Done 2D-CR | 2 (B021850, B039536) |
| Status 3 + Done ei-2D tyypin 2 -CR | 1 (B011615) |
| Status 3 + tyypin 2 CR jonka nimessa 2C/2B/vakuutus | 0 |

## Ehdotetut toimet

1. **B021850 ja B039536**: vahvista palautus (molemmilla hyvitys-CR) ja korjaa status 3:ksi kasin. Huomioi:
   write-once-tapa on 1 — kayttaja paatta, halutaanko method 5 (tyhjennys + asetus) vai jatketaanko kayttajan
   pysyvana. Korjaus laukaisee `gbb_webhook_ue_status_changed`:n.
2. **Handler-korjaus** (`netsuite-subscrption-cr-scripts`, oma sessio): jos CR:n nimessa on `2D` ja
   pyoralla on jo method 1, kirjoita silti status 3, tai nosta Needs Review. Nykyinen write-once-suojaus
   vaientaa palautuksen (pääteltynä koodista + kaksi todennettua tapausta).
3. **Oomi-joukko (18 pyoraa)**: pyydä Oomilta/Fleetilta lista palautetuista pyorista ja vertaa. Ala muuta
   statusta ennen vahvistusta. Nama ovat myos IC-hinnoitteluun vaikuttavia (status 2 -> `ic_redemption_dt`).
4. **B036124, B037996, B045683**: ristiriita Returned vs. maksettu lunastus. Selvita ensin todellinen tapaus.
5. **97 CR-ton Returned-pyoraa**: tarkista otoksena Fleetista; jos ne ovat oikeita, kirjaa historiaselvitys
   (mika tahansa) ja ala niita muuta. Tayta `ic_redemption_dt` 11 pyoralta.
6. **Ei tarvetta**: ankkuri/dna-tarkistukset ovat kunnossa; 121 tyhjan statuksen pyoraa ei kuulu tahan (eivat
   sisalla 2D-CR:ia).

## Rajaukset

- Todisteena ei kaytetty `systemnote`-historiaa eika agreement row -tietoja (esim. sopimusrivien paattyminen
  palautuspaivana), eika laskuja/hyvityksia (paitsi CR-nimet); lisaselvitys voisi loytaa lisaa.
- `2D` tunnistetaan nimesta (kayttajan kirjoittama teksti); nimessa voi teoriassa olla `2D` muusta syysta.
  Kaikki 94 osumaa ovat tyyppia 2 ja nimen muoto `Mnnn... - 2D`.
- Aiempi arvio "171/178 palautetusta pyorasta ei kanna liab_settled_at" (`lunastuksen-kenttasaannot.md`) on
  vanhentunut: status 3 on nyt 189 pyoraa, joista settled_at on taytetty vain osalla (tarkkaa lukua ei laskettu).
