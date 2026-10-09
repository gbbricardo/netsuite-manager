# P2: kopioitujen keskenkauden lunastus -CR:ien luontipäivät ja nimet (CSV-import)

Tuoteomistajan päätös 9.10.2026. Valmisteltu 9.10.2026, **ei ajettu**. Ajaja: käyttäjä.

## Tarkoitus

Viisi tyypin 2 CR:ää (*Keskenkauden lunastus*) on luotu käsin kopioimalla vanhasta CR:stä, ja kopio
peri kentän `custrecord_cr_created_date` (ja osin nimen) lähteestä. Korjaus: `cr_created_date` =
CR:n todellinen luontipäivä (`created`, Helsingin aikaa). Koska ADR 0010 määrää päätöspäiväksi
`cr_created_date`:n, korjaus vaikuttaa T7:n (`decided_at`) arvoihin.

**Ajojärjestys: P2 ensin, sitten T7** (`../2026-09-25-decided-at-historia/01-decided-at-2026-10-09.csv`,
joka sisältää jo korjatut päivät). Jos T7 ajetaan ensin, pyörät B040467, B040468, B040469 ja B012845
saavat `decided_at`-arvon, joka ei vastaa CR:n korjattua päivää.

**Tietue:** `customrecord_subscrption_change_request` · **Import type:** Custom Record ·
**Data Handling:** `UPDATE` · avainsarake **Internal ID**.

## Tiedostot

| Tiedosto | Rivejä | `SUM(id)` | Mitä kirjoitetaan |
|---|---|---|---|
| `01-cr-created-date.csv` | **5** | 18 902 | vain `custrecord_cr_created_date` |
| `02-altname.csv` | **3** | 13 885 | vain `altname` (Name) |

UTF-8 ilman BOM:ia, erotin `;`, päivämäärät `dd.mm.yyyy`, CRLF.

| Tiedosto / sarake | Mappaus |
|---|---|
| 01 `internal_id` | **Internal ID** |
| 01 `cr_created_date_uusi` | `custrecord_cr_created_date`: **mappaa** |
| 01 `cr`, `pyora`, `tyyppi`, `tila`, `cr_created_date_nyt` | jätä mappaamatta |
| 02 `internal_id` | **Internal ID** |
| 02 `altname_uusi` | Name (`altname`): **mappaa** |
| 02 muut sarakkeet | jätä mappaamatta |

## Rivit (todennettu NetSuitesta 9.10.2026)

| CR | Pyörä | Tyyppi / tila | Nimi nyt | `cr_created_date` nyt | `created` (todellinen) | Owner |
|---|---|---|---|---|---|---|
| 4542 | B040469 | 2 / Done | `EWQUSV8Q - 2C` | 25.02.2026 | 20.07.2026 17:23 | Sanna Kokkonen |
| 4544 | B040468 | 2 / Cancelled | `M58317518612 - 2C` | 25.02.2026 | 20.07.2026 17:31 | Sanna Kokkonen |
| 4545 | B012845 | 2 / Done | `M56690950044 - 2C` | 15.06.2026 | 20.07.2026 17:57 | Sanna Kokkonen |
| 4634 | B040468 | 2 / Done | `B040468 - Lunastus - Poikkkeus` | 25.02.2026 | 24.07.2026 14:33 | Sanna Kokkonen |
| 4637 | B040467 | 2 / Done | `B040467 - Lunastus - Poikkeus` | 25.02.2026 | 24.07.2026 14:38 | Sanna Kokkonen |

4544 on Cancelled. Sen päivä korjataan johdonmukaisuuden vuoksi, eikä se vaikuta `decided_at`:iin
(T7 lukee vain Done-CR:t).

## Nimet (`02-altname.csv`)

| CR | Nyt | Uusi | Peruste |
|---|---|---|---|
| 4545 (tyyppi 2, Done) | `M56690950044 - 2C` | `B012845 - 2C` | Tilausnumero M56690950044 kuuluu B030338:n CR:lle 3830 (Cancelled), josta 4545 kopioitiin. |
| 4546 (tyyppi 11, Done) | `M56690950044 - 2C - Hyvitys` | `B012845 - 2C - Hyvitys` | sama |
| 4794 (tyyppi 11, Cancelled) | `M56690950044 - 2C - Hyvitys` | `B012845 - 2C - Hyvitys` | sama |

Loppuosa (`2C`, `Hyvitys`) säilyy, koska monthly-reporting reitittää nimen lopun mukaan.

**Nimet, joihin ei ehdoteta muutosta (todennettu):**
- **4542 `EWQUSV8Q - 2C`:** samannimistä CR:ää ei ole millään muulla pyörällä. Ainoa muu `EWQUSV8Q`-CR on 4635, samalla pyörällä B040469.
- **4544 `M58317518612 - 2C`:** sama nimi on vain pyörän B040468 omilla CR:illä (4349, 4549, 4543, 4550). Nimi on oikea.

## Esitarkistus

Odotus: 5 riviä, `SUM(id)` 18 902.

```sql
SELECT COUNT(*) AS rivit, SUM(cr.id) AS id_summa
FROM customrecord_subscrption_change_request cr
WHERE cr.id IN (4542,4544,4545,4634,4637)
  AND cr.custrecord_cr_created_date < cr.created - 3
```

Nimet (odotus 3 riviä):

```sql
SELECT id, altname FROM customrecord_subscrption_change_request
WHERE id IN (4545,4546,4794) AND altname LIKE 'M56690950044%'
```

## Jälkitarkistus

Odotus **0** (kumpikin):

```sql
SELECT COUNT(*) AS poikkeavat FROM customrecord_subscrption_change_request cr
WHERE cr.id IN (4542,4544,4545,4634,4637)
  AND TRUNC(cr.custrecord_cr_created_date) <> TRUNC(cr.created)
```

```sql
SELECT COUNT(*) AS poikkeavat FROM customrecord_subscrption_change_request
WHERE id IN (4545,4546,4794) AND altname LIKE 'M56690950044%'
```

Kaikki viisi CR:ää luotiin klo 14–18, joten ajonaikaisen kellon ja Helsingin päivän ero ei koske niitä.

## Riskit

- **UE-skriptit:** monthly-reporting-UE:t laukeavat Done-tilaisen CR:n EDIT/XEDIT-tapahtumassa. CSV-import ei todetusti
  laukaise UE:ta (S1-import 23.09.2026), mutta tarkista jälkeenpäin, ettei CR:ille 4542, 4545, 4546, 4634, 4637
  syntynyt uusia RI-rivejä.
- Päätös koskee vain tyypin 2 päiviä. Samaan kopiosarjaan kuuluvien tyypin 11 CR:ien (4543, 4546, 4635, 4636, 4794)
  `cr_created_date` jää ennalleen (26.02. / 15.06.2026), ellei toisin päätetä.

## Muut mahdolliset kopiot (laajennettu haku, EI CSV:ssä)

Haku: `cr_created_date < created - 3 pv`, owner ei ole *Staria  Integration user*. Tulos **44 CR:ää**. Niistä 5 tyypin 2
CR:ää on yllä. **Muita tyypin 2 CR:iä ei löytynyt.** Jäljellä 39 CR:ää (tyypit 1, 3, 7, 10, 11) ovat mahdollisia kopioita
tai tarkoituksellisia takautuvia päiviä (jälkiveloitus, hyvitys). Samaan kopiosarjaan kuuluvat selvästi 4543, 4546, 4635,
4636 ja 4794 (20.–24.07. ja 4.8.). Päätös tarvitaan ennen kuin yhtäkään lisätään CSV:hen.

| CR | Nimi | Tyyppi | Tila | Pyörä | `cr_created_date` | `created` | Owner |
|---|---|---|---|---|---|---|---|
| 4006 | M53706053470 - 2A - jälkiveloitus | 7 | Done | B033922 | 16.03.2026 | 26.06.2026 | Sanna Kokkonen |
| 4007 | M53706053470 - 2A | 1 | Done | B033922 | 16.03.2026 | 26.06.2026 | Sanna Kokkonen |
| 4030 | S37731598498 - Hyvitys | 11 | Done | B036992 | 27.05.2026 | 29.06.2026 | Beeda Viittanen |
| 4043 | 2F - jälkiveloitus | 7 | Done | B034775 | 21.05.2026 | 30.06.2026 | Sanna Kokkonen |
| 4288 | M54435529820 - Jälkiveloitus | 7 | Done | B038492 | 30.06.2026 | 03.07.2026 | Beeda Viittanen |
| 4289 | M56690945339 - 2A | 1 | Done | B039986 | 30.06.2026 | 03.07.2026 | Beeda Viittanen |
| 4290 | M56690945339 - Jälkiveloitus | 7 | Done | B039986 | 30.06.2026 | 03.07.2026 | Beeda Viittanen |
| 4291 | S536024601 - Hyvitys | 11 | Cancelled | B000156 | 25.02.2026 | 03.07.2026 | Sanna Kokkonen |
| 4292 | S536024588 - Hyvitys | 11 | Done | B000157 | 25.02.2026 | 03.07.2026 | Sanna Kokkonen |
| 4543 | M58317518612 - 2C - hyvitys | 11 | Done | B040468 | 26.02.2026 | 20.07.2026 | Sanna Kokkonen |
| 4546 | M56690950044 - 2C - Hyvitys | 11 | Done | B012845 | 15.06.2026 | 20.07.2026 | Sanna Kokkonen |
| 4635 | EWQUSV8Q - Hyvitys - Poikkeus | 11 | Cancelled | B040469 | 26.02.2026 | 24.07.2026 | Sanna Kokkonen |
| 4636 | B040467 - Hyvitys - Poikkeus | 11 | Done | B040467 | 26.02.2026 | 24.07.2026 | Sanna Kokkonen |
| 4695 | S536024601 - Hyvitys | 11 | Cancelled | B000156 | 25.02.2026 | 29.07.2026 | Sanna Kokkonen |
| 4776 | M56693490077 - 2A - hyvitys | 11 | Done | B028817 | 10.07.2026 | 03.08.2026 | Beeda Viittanen |
| 4777 | M56693490077 - 2A - jälkiveloitus | 7 | Done | B028817 | 10.07.2026 | 03.08.2026 | Beeda Viittanen |
| 4793 | S878756959 - poikkeus - jälkiveloitus | 7 | Done | B002321 | 01.08.2026 | 04.08.2026 | Beeda Viittanen |
| 4794 | M56690950044 - 2C - Hyvitys | 11 | Cancelled | B012845 | 15.06.2026 | 04.08.2026 | Beeda Viittanen |
| 5037 | M53706053470 - Hyvitys ja jälkiveloitus - Poikkeus | 7 | Done | B033922 | 16.03.2026 | 12.08.2026 | Sanna Kokkonen |
| 5038 | M58768501109 - Hyvitys - Poikkeus | 11 | Done | B029923 | 24.07.2026 | 12.08.2026 | Sanna Kokkonen |
| 5039 | B046587 - jälkiveloitus | 7 | Done | B046587 | 11.03.2026 | 12.08.2026 | Beeda Viittanen |
| 5040 | B046587 - jälkiveloitus | 7 | Done | B046587 | 11.03.2026 | 12.08.2026 | Beeda Viittanen |
| 5094 | B046667 - Jälkiveloitus | 7 | Done | B046667 | 11.03.2026 | 13.08.2026 | Beeda Viittanen |
| 5095 | B045683 - hyvitys | 11 | Done | B045683 | 31.07.2026 | 13.08.2026 | Beeda Viittanen |
| 5124 | M58439210359 - 2C - Hyvitys | 11 | Done | B011138 | 11.08.2026 | 14.08.2026 | Beeda Viittanen |
| 5247 | M57951800246 - 2H - jälkiveloitus | 7 | Done | B009379 | 13.08.2026 | 20.08.2026 | Beeda Viittanen |
| 6152 | M56690945339 - Jälkiveloitus - Poikkeus | 7 | Done | B039986 | 30.06.2026 | 09.09.2026 | Sanna Kokkonen |
| 6153 | M48299859340 - Hyvitys - Poikkeus | 11 | Done | B011961 | 10.08.2026 | 09.09.2026 | Sanna Kokkonen |
| 6694 | Jenni Kotisaari - välikuukaudet | 3 | Done | B008294 | 28.08.2026 | 23.09.2026 | Beeda Viittanen |
| 6732 | Välikuukaudet 1.10. - 31.12.2026 | 3 | Done | B000049 | 26.08.2026 | 24.09.2026 | Beeda Viittanen |
| 6737 | Notion 1211 - hyvitys | 11 | Done | B027115 | 11.03.2026 | 24.09.2026 | Beeda Viittanen |
| 6812 | S3092358448 - pidennys - jälkiveloitus | 7 | Done | B018845 | 15.09.2026 | 25.09.2026 | Beeda Viittanen |
| 6813 | S1081429392 - pidennys - jälkiveloitus | 7 | Done | B004646 | 15.09.2026 | 25.09.2026 | Beeda Viittanen |
| 6814 | S1055276189 - pidennys - jälkiveloitus | 7 | Done | B005081 | 15.09.2026 | 25.09.2026 | Beeda Viittanen |
| 6815 | S956434460 - pidennys - jälkiveloitus | 7 | Done | B002893 | 15.09.2026 | 25.09.2026 | Beeda Viittanen |
| 6840 | Notion 367 - jälkiveloitus | 7 | Done | B043001 | 11.08.2026 | 28.09.2026 | Beeda Viittanen |
| 7019 | Notion-800 hyvitys 2 | 11 | Done | B025982 | 11.09.2026 | 01.10.2026 | Beeda Viittanen |
| 7028 | notion 794 | 11 | Pending | B020053 | 11.09.2026 | 01.10.2026 | Beeda Viittanen |
| 7152 | Vakuutuslunastuksen peruminen | 10 | Done | B023943 | 25.08.2026 | 08.10.2026 | Beeda Viittanen |
