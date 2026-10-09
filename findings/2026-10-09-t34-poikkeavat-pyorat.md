# T34 — NOT_PRICED: poikkeavat pyörät (B010533, B046667, B015132)

Ajettu 9.10.2026, vain luku. Todennettu = NetSuite-kysely tänään. Päätelty = merkitty erikseen.

## B010533 (id 10533) — huoltopidennyksestä puuttuu 3 kk, summa on oikein

Todennettu:
- `maintenance_sum` 265,93; status 1; `subsc_org_end_date` 30.06.2026; `subsc_end_date` 31.10.2026; hinta 49,40.
- Bracket-taulu `customrecord_sta_maint_extending_months`: 265,93 € ei osu brutto-riviin (241–320,99 = 4 kk), mutta osuu netto-riviin
  (255,78–319,51 = 5 kk). Taulun 5 kk -rivi on siis netto-sarakkeella; sama tulkinta kuin ad-hocs-korjausprojektissa (tavoite 5 kk).
- Huoltoa vastaavat sopimusrivit: vain SL071688 (Rent) ja SL071689 (Admin), 01.07.–31.08.2026, prolongation = T, Closed. Muita jatkorivejä ei ole.
- Jälkiveloitus-CR:t Done: CR-6480 (syys, lasku INVGBF1043363, 115 €) ja CR-6931 (loka, INVGBF1043482, 115 €). Ne siirsivät loppupäivän 30.09. ja 31.10.
- Ad-hocs-repon README (`netsuite-fix-bike-register-prolongations`, kohta d) kuvaa pyörän: summa nousi 100,6 -> 265,93 (ostolasku 165,33 €, 28.8.2026),
  joten tavoite 5 kk, katettu 2, uusia 3. Pyörä poistettiin automaatiosta ja sovittiin käsin: syys + loka kuluttajalle jälkiveloituksena, marraskuu
  uusina Rent + Admin -jatkoriveinä (01.11.–30.11.), loppupäivä 30.11. ja IC-lasku 3 x 63,75 €.

Juurisyy:
- Todennettu: marraskuun jatkorivejä ja 30.11. loppupäivää ei ole vielä olemassa. Pidennys on 4 kk, huoltosumma edellyttää 5 kk.
  Ero 4 vs 5 johtuu siitä, että 2 kk on huoltoa ja 2 kk jälkiveloitusta, ei siitä että summa olisi väärä.
- Päätelty: koska syys- ja lokakuun jälkiveloitus korvaa kaksi kolmesta puuttuvasta huoltokuukaudesta, jäljellä on vielä 1 kk (marraskuu).
  Maksulinkin hinta (`MONTHS_BETWEEN(end, org_end)` = 4) ei erota huolto- ja jälkiveloituskuukausia, siksi NOT_PRICED.

Korjausehdotus: ei kenttäkorjausta rekisteriin ennen kuin ihminen on tehnyt marraskuun jatkorivit (ad-hocs-suunnitelma kohta d). Sen jälkeen
`subsc_end_date` = 30.11.2026 tulee olemaan oikein, ja Payment Link voidaan hinnoitella. Vaatii tuoteomistajan päätöksen: että suunnitelma
(marraskuu jatkoriveinä) yhä pätee, koska lokakuu laskutettiin CR-6931:llä eikä "erillisenä kertalaskuna". Samalla päätettävä, miten
Payment Link hinnoittelee pyörän, jolla on sekä huolto- että jälkiveloituskuukausia (sama ankkuri-ongelma kuin T30–T38).

## B046667 (id 46667) — ei tupla, ei puuttuvaa päivänsiirtoa

Todennettu:
- Vuokra-aika 2 kk (`rent_months` 2), `subsc_start_date` 01.08.2026, `org_end_date` 30.09.2026, `subsc_end_date` 31.10.2026 (pidennys 1 kk), `maintenance_sum` tyhjä.
- CR-5094 (Done, jälkiveloitus): 01.08.–31.08.2026, `created_date` 11.03.2026, automaatiologi tyhjä, lasku INVGBF1039185 13.08.2026, 112,91 €,
  muistio "Jälkiveloitus 8/2026", tila Paid In Full. Huomautus: "Hankittu vakuutukset turvin, vuokra-aika vain kaksi kuukautta."
- CR-6973 (Done): 01.10.–31.10.2026, `created_date` 01.10.2026, lasku INVGBF1043524 112,91 €, loki "subsc_end_date updated to 31.10.2026".
- Sopimusrivit: SL080382 / SL080383, 01.09.–30.09.2026, Closed. Elokuulle ei ole sopimusriviä.
- Kuukaudet eivät mene päällekkäin (elo vs loka), laskut ovat eri (INVGBF1039185 vs INVGBF1043524). Tuplalaskutusta ei löydy.

Juurisyy:
- Todennettu: CR-5094 on elokuun laskutus, joka kuuluu alkuperäiseen vuokra-aikaan (elo + syys), ei pidennys. Se on tehty käsin (ei automaatiologia),
  eikä se ole siirtänyt `subsc_end_date`:a. Tehtävän oletus "2 tyypin 7 CR:ää = 2 kk pidennystä" on siis väärä: pidennys on 1 kk (CR-6973).
- Päätelty: elokuu laskutettiin CR:llä, koska rivit alkavat vasta 01.09. (vakuutusjärjestelyn vuoksi); asiaa ei voi vahvistaa muusta kuin muistiosta.
- Kattavuuslaskennassa 2 x 80 € = 160 € on virheellinen. Oikea pidennyskattavuus on 1 kk, ja hinta 132,27 € on todennäköisesti siksi NOT_PRICED.

Korjausehdotus: ei korjausta rekisteriin. Linkin hinnoittelussa kattavuus pitää laskea vain CR:istä, joiden jakso on alkuperäisen `org_end_date`:n jälkeen
(skriptimuutos kuuluu omistavaan repoon). Vaatii tuoteomistajan päätöksen: onko pyörä hinnoiteltava normaalisti (1 kk jälkiveloitus) vai jätetäänkö käsin.

## B015132 (id 15132) — maksu täsmää lunastushintaan, mutta `liab_settled_at` puuttuu

Todennettu:
- Status 2, tapa 1 (redemption_paid), `redemption_paid_at` 01.10.2026, `redemption_decided_at` 02.10.2026, `date_to_non_active` 02.10.2026,
  `liab_settled_at` TYHJÄ, `end_redemption_price` 131,45 (netto), `maintenance_sum` 0, `eredem_link_sent` false, `end_red_so_created` true.
- Paylink-rivi 19037: tuote "Työsuhdepyörän loppulunastus", Paylink-tilaus 340954, maksettu 01.10.2026, yhteensä 164,97 € (netto 131,45 + alv 33,52),
  ns_status 3, rivi luotu 02.10.2026. SO SOGBB0015264 (id 765018) 164,97 €, Customer Deposit CDEPGBB0012453 (id 765020) 164,97 €, asiakas 39930 (loppukäyttäjä).
- 131,45 x 1,255 = 164,97, eli maksu vastaa tallennettua lunastushintaa täsmälleen (huoltohyvitystä ei ole, summa 0).
- CR-6940 (Done, jälkiveloitus) 01.10.–31.10.2026, lasku INVGBF1043491 (116,21 €, avoin); lisäksi INVGBF1044256 (116,21 €, 01.10., avoin) ja SO SOGBF0039980 samalle yritykselle.

Juurisyy:
- Todennettu: maksu tuli Paylink-tilauksena, jota Payment Link -skripti ei lähettänyt (`eredem_link_sent` false). Lähettäjää ei voi lukea datasta.
- Päätelty: linkki lähetettiin vanhalla/käsin-prosessilla ennen 1.10. ajoa tai ohi skriptin; skripti ohitti pyörän, koska CR-6940 oli siirtänyt loppupäivän.
- Todennettu poikkeama: tapa 1 ilman `liab_settled_at`:ia rikkoo säännön (tapa 1: `liab_settled_at` = `paid_at`, kenttäsäännöt §5).

Korjausehdotus (vain rekisteri):
| Pyörä | Kenttä | Nykyinen | Ehdotettu | Peruste |
|---|---|---|---|---|
| B015132 | `custrecord_gbb_liab_settled_at` | tyhjä | 01.10.2026 | kenttäsäännöt: tapa 1, kauden loppu, ei Done-tyypin 2 CR:ää, = `paid_at` |
Write-once-kenttä, tietoinen poikkeus. Vaatii tuoteomistajan päätöksen myös siihen, onko lokakuun kaksi avointa laskua (INVGBF1043491 ja INVGBF1044256)
tuplalaskutusta lunastetulle pyörälle. Sitä ei ole tässä todennettu, ja korjaus kuuluu laskuihin, ei rekisteriin.
