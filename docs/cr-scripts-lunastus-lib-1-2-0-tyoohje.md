# Työohje: `gbb_lunastus_lib` 1.2.0, päättymisajankohta = `subsc_end_date` (T11, K1)

**Repo:** `../netsuite-subscrption-cr-scripts`, `main` (HEAD `0fbbff0`, 14.10.2026). Tee muutokset omaan haaraan, esim. `feat/lunastus-lib-1-2-0`.
**Päätökset:** [ADR 0010](adr/0010-keskenkauden-lunastus.md) k. 8 (poikkeuskentistä luovutaan, kumottu siirtymä-CSV 21.10.), ADR 0015 k. 3, vaatimus K1
([`keskenkauden-lunastus-vaatimukset.md`](keskenkauden-lunastus-vaatimukset.md)). Tuoteomistaja 21.10.2026: tehdään nyt.
Älä muokkaa muita sisarrepoja.

## 1. Mitä muutetaan

**Kirjasto** `src/FileCabinet/SuiteScripts/gbb-lib/gbb_lunastus_lib.js`:
1. `KENTAT.PAATTYMISAJANKOHTA` (`:124-130`): jäljelle jää vain `'custrecord_sta_subsc_end_date'`. Säilytä taulukkomuoto, jotta `paattymisajankohta()`:n
   silmukka (`:268-273`) ja mahdolliset muut `KENTAT.PAATTYMISAJANKOHTA`-lukijat toimivat sellaisinaan. Vaihtoehto: muuta kentäksi merkkijono ja yksinkertaista funktio.
   Valitse se, joka vaatii vähiten muutoksia kutsujiin, ja `grep`aa kaikki käyttökohdat repoista ennen valintaa (lista § 2).
2. Kommentit `:124-125` ja `:255-258`: COALESCE-kuvaus korvataan. Kirjaa ADR 0010 k. 8 ja päivä. Kirjoita näkyviin, että poikkeuskentät ovat
   tarkoituksella pois ja että `oomi_exceptional_end_date` on Fleet-CSV:n näkyvyyskenttä, jota ei saa lukea päättymisajankohdaksi.
3. `VERSION` `'1.1.0'` → `'1.2.0'` (`:62`). Kutsujat lokittavat version, ja siitä latauksen todentaminen nähdään.
4. Säilytä toiminta, jossa puuttuva päivä palauttaa `null`:n eikä käytä varapäivää.

**Testit** `tests/gbb_lunastus_lib.test.js` (9 viittausta poikkeuskenttiin, `:30-45`):
- Poikkeuskenttiä ei lueta: pyörä, jolla on `exceptional_end_date` 31.05. ja `subsc_end_date` 30.06., saa päättymisajankohdaksi 30.06.
- Pelkkä poikkeuskenttä ilman `subsc_end_date`:a antaa `null`.
- Molemmat aiemmat järjestystestit poistetaan tai käännetään.
- `npm test` vihreä.

**Handler** `src/FileCabinet/SuiteScripts/cr-processor/handler_lunastus.js`:
- `:27-28`: poista kaksi poikkeuskenttää haettavista kentistä (kirjasto ei enää lue niitä).
- `:332`: hälytysteksti mainitsee kolme kenttää. Uusi muoto: `no päättymisajankohta on the bike register (custrecord_sta_subsc_end_date is empty) …`.
- Tarkista `cr_lunastus_plan.js` ja sen testit (`grep exceptional` = 0 osumaa 21.10., tarkista silti).

**`ue_gbb_redemption_decided_at.js`** käyttää kirjastoa, mutta ei poikkeuskenttiä (`grep` 21.10.). Ei muutosta, tarkista vain.

## 2. Kuka lataa kirjaston (yksi tiedosto, kaikki kerralla)

Kaikki lataavat saman File Cabinet -tiedoston `/SuiteScripts/gbb-lib/gbb_lunastus_lib.js` (id 470259, 21 291 B, 21.9.2026).

| Skripti | Repo | Välittääkö poikkeuskentät? | Vaikutus 1.2.0:sta |
|---|---|---|---|
| 1199 `handler_lunastus` (6 h välein + 1. pv 01:33) | cr-scripts | **kyllä** (`:27-28`) | ainoa käytöksen muutos |
| `ue_gbb_redemption_decided_at` | cr-scripts | ei | ei |
| 1480 status-sync 2.0 (yöllä 00:30) | bike-redemption-status-sync | ei (ADR 0015 k. 3) | ei |
| 1452 ri_creation, 1453 ri_update | monthly-reporting | ei 21.10. lähtien (`f4640a0`) | ei |
| 1440 vanha status-sync | bike-redemption-status-sync | kyllä | `NOTSCHEDULED` 6.10. lähtien, ei aja |

**Mittakaava (SuiteQL 21.10.):** `COALESCE` ≠ `subsc_end_date` vain **16 pyörällä**: 14 status 2 (päättyneet ≤ 30.09.2026, IC done) ja B046739, B046740 (status tyhjä, inaktivoidaan T19:ssä).
Handlerin käytös muuttuu vain, jos joku niistä saa tyypin 2 CR:n, mikä on epätodennäköistä. H3:n tulos ("CR:n päivä myöhempi kuin pyörän") lasketaan jatkossa `subsc_end_date`:a vasten.

## 3. Lataus

- **Ajankohta:** ei ke 28.10. klo 22 – to 29.10. (status-sync 2.0:n yöajo ennen taloustiimin IC-lunastusta 29.10.) eikä 30.10.–2.11. (kuunvaihde: 1199 MONTHLY 1.11. klo 01:33, ri-ajot).
  Paras ajankohta on arkipäivä heti testien jälkeen, ennen 28.10.
- **Järjestys:** kirjasto ja `handler_lunastus.js` samalla kertaa. Kirjasto yksinään on turvallinen (handler välittäisi ylimääräiset kentät, joita kirjasto ei lue), mutta hälytysteksti olisi silloin harhaanjohtava.
- Ei SDF-julkaisua, käsin File Cabinetiin. Kirjaa tavukoot, jotta ne voidaan verrata repoon (CRLF).

## 4. Todennus latauksen jälkeen

1. File Cabinet: kirjaston ja handlerin koot = commit (CRLF huomioiden).
2. Seuraavissa ajoissa lokissa `gbb_lunastus_lib=1.2.0`:
   - 1199: `handler_lunastus`-AUDIT-rivi, kun tyypin 2 CR käsitellään.
   - 1480: yöajon summary.
   - 1452/1453: seuraava ajo, viimeistään 1.11.
3. 1480:n yöajo latauksen jälkeen: ei ERROR-rivejä. Kirjoitusmäärä on samaa suuruusluokkaa kuin edellisinä öinä, koska 2.0 ei välitä poikkeuskenttiä.
4. Seuraava tyypin 2 CR (T13:n tarkistukset): `decided_at` = `liab_settled_at` = CR:n luontipäivä, ja porttikvadrantin solu "2/3 + tuleva" on 0.
5. Mittakysely, odotus on 16 ja vähenee T19:n jälkeen 14:ään. Kysely ei muutu latauksessa, mutta kertoo, ketä ero koskee:
```sql
SELECT COUNT(*) FROM customrecord_sta_bike_register b
WHERE COALESCE(b.custrecord_gbb_exceptional_end_date, b.custrecord_gbb_oomi_exceptional_end_date, b.custrecord_sta_subsc_end_date)
      <> b.custrecord_sta_subsc_end_date
```

## 5. Samalla tässä repossa (netsuite-manager, ei cr-scripts-istunnossa)

`docs/lunastuksen-kenttasaannot.md`: `:31`, `:449-450`, `:521-522`, `:547-548`, `:560`, `:630` sekä CLAUDE.md:n porttikvadranttikysely (`COALESCE(...)` → `custrecord_sta_subsc_end_date`)
ja `.claude/agents/lunastusauditoija.md`. Tehdään, kun 1.2.0 on ladattu.
