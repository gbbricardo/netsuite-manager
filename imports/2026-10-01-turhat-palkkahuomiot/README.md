# Turhat palkkahuomiot pois 202 lokakuun Ended-riviltä — CSV-import 1.10.2026

> [!NOTE]
> **Ajettu 1.10.2026, 202 riviä päivitetty, todennettu.** Jälkitarkistus palauttaa 0. Lokakuun
> huomiollisia rivejä on jäljellä 83 (kaikki tarkoituksella jätetyt). Pistokokeissa 151164, 144183 ja
> 152109 status Ended, loppupäivä ja vuokra ennallaan.

Tyhjentää `custrecord_gbb_ri_gbb_notification`:n 202 lokakuun (`reporting_date` 1.10.2026) Ended-riviltä.
Kentässä on pelkkä teksti *"Tarkastakaa työntekijän palkoista tehdyt vähennykset."*, jonka ri_update (1453)
lisäsi 1.10. ajossa vaiheessa 1c. **Aja ennen palkka-CSV:tä (1451).**

## Miksi huomio on turha

Ri_update liputtaa Ended-rivin, kun `lease_end_date + 1 pv < reporting_date`
(`netsuite-monthly-reporting/mr_monthly_reporting_ri_update.js:953-957`). Sääntö olettaa, että vuokra päättyy
kuun viimeisenä päivänä. Kesken kuuta päättyvä vuokra näyttää aina myöhästyneeltä, vaikka se raportoidaan
oikeassa kuussa.

Todennettu NetSuitesta 1.10.2026:

- Kaikkien 202 rivin `lease_end_date` on 1.–29.9.2026.
- **Kaikilla 202 pyörällä on syyskuun (1.9.) Active-rivi.** Ended lokakuussa on siis ajallaan (ADR 0002:n
  päättymiskuuankkuri). Edellisen kuun pidätyksissä ei ole korjattavaa.
- Kentässä ei ole muuta tekstiä (`notification` = pelkkä huomio), joten kentän tyhjennys palauttaa tilan,
  jossa ri_creation rivin jätti.
- Teksti on ri_updaten tämän ajon kirjoittama. Lähdekoodissa sitä ei kirjoita mikään muu skripti, ja
  ajon loki (`scriptnote`, `scripttype = 1453`) listaa `stage1c | flagged` 285 riviä, joihin nämä 202 kuuluvat.
- Esimerkki: B045359 / RI 151164, vuokra päättyi 27.9., syyskuun rivi 101522 Active.

Ajon laskurit: `c_flagged=285 | c_not_flagged=1074`.

## Mitä ei korjata (83 liputettua riviä jätetään ennalleen)

| Joukko | Rivejä | Miksi ei mukana |
|---|---|---|
| Ended, vuokra päättyi ennen 1.9.2026 | 42 | Todennäköisesti aito myöhästyminen: keskenkauden lunastukset (päättyneet 31.8., UE-rivi luotu syyskuussa), Siirto TA:n Ended-puoli, 18 OOMI-pyörää S4:stä (päättyneet heinäkuussa, raportoidaan vasta nyt). Syyskuun pidätys voi olla oikeasti väärin. |
| Active/New, Siirto TA ("Sopimus alkanut takautuvasti") | 5 | Aito takautuva alku. |
| Active/New, Siirto konserni | 35 | **Päätettävä erikseen.** `lease_start_date` on alkuperäinen sopimuksen alku, joten sääntö laukeaa jokaiselle konsernisiirrolle. Konsernisiirto ei normaalisti muuta palkanpidätystä, mutta osa UE-teksteistä sanoo *"siirtynyt … 01.09.2026"*. Ne voisivat siis olla oikeasti myöhässä. |
| B017530 (RI 117469) | 1 | Testipyörä. |

Poikkeama samasta joukosta: **B046509 / RI 116142** on Ended, ja alku 1.6.2026 on sen lopun 31.5.2026 jälkeen.
Rivi on tarkistettava erikseen.

**Tietue:** `customrecord_gbb_monthly_reporting_item` · **Import type:** Custom Record ·
**Data Handling:** `UPDATE`

## Tiedostot

| Tiedosto | Rivejä | Mitä tehdään |
|---|---|---|
| `01-testirivi.csv` | 1 (RI 151164, B045359) | tyhjennetään `gbb_notification` |
| `02-loput.csv` | 201 | sama |

Tarkistussumma: **202 riviä, `SUM(internal_id)` = 29 975 472** (todennettu NetSuitesta).

Sarakkeet `pyora_id`, `notification_nyt`, `lease_end_date` ja `syyskuun_rivi` ovat vain tarkistusta
varten. **Älä mappaa niitä.**

## Ajo

1. Aja `01-testirivi.csv`. Mappaa `internal_id` → **Internal ID** ja `gbb_notification` →
   `custrecord_gbb_ri_gbb_notification` (*Gobybike notification for reporting*). Valitse *Advanced
   Options* → **Overwrite Missing Fields**, muuten tyhjä arvo ei tyhjennä kenttää.
2. Tarkista:
   ```sql
   SELECT id, custrecord_gbb_ri_gbb_notification, BUILTIN.DF(custrecord_gbb_ri_reporting_status) st,
          custrecord_gbb_ri_lease_end_date, custrecord_gbb_ri_automation_logs
   FROM customrecord_gbb_monthly_reporting_item WHERE id = 151164
   ```
   Odotus: notification tyhjä, status **Ended**, loppupäivä **27.09.2026**. Jos jokin muu kenttä muuttui,
   mappaus poimi väärän sarakkeen. Korjaa se ennen kuin jatkat.
3. Aja `02-loput.csv` samoilla asetuksilla.

## Jälkitarkistus

```sql
SELECT COUNT(*) FROM customrecord_gbb_monthly_reporting_item ri
JOIN customrecord_sta_bike_register br ON ri.custrecord_gbb_ri_bike = br.id
WHERE ri.custrecord_gbb_ri_reporting_date = TO_DATE('2026-10-01','YYYY-MM-DD')
  AND BUILTIN.DF(ri.custrecord_gbb_ri_reporting_status) = 'Ended'
  AND ri.custrecord_gbb_ri_lease_end_date BETWEEN TO_DATE('2026-09-01','YYYY-MM-DD') AND TO_DATE('2026-09-30','YYYY-MM-DD')
  AND ri.custrecord_gbb_ri_gbb_notification LIKE '%Tarkastakaa työntekijän palkoista%'
  AND br.name <> 'B017530'
```

Odotus: **0**. Lisäksi lokakuun huomiollisten rivien kokonaismäärä on 285 − 202 = **83**.

> [!WARNING]
> **Jos ri_update ajetaan uudelleen ennen palkka-CSV:tä, se kirjoittaa huomion takaisin.** Vaihe 1c ei
> tarkista, onko huomio poistettu. Aja tämä import ri_updaten *viimeisen* ajon jälkeen.

## Juurisyy ja korjaus

Korjaus kuuluu `netsuite-monthly-reporting`-repoon, ja se tehdään erillisessä istunnossa. Vaiheen 1c
Ended-sääntön pitää verrata **päättymiskuuta**, ei päättymispäivää: liputetaan vain, jos päättymiskuuta
seuraavan kuun 1. päivä < `reporting_date`. Sama ankkuriansa on CLAUDE.md:n § *One trap to know before you
measure anything*. Ilman korjausta sama toistuu joka kuu kaikille kesken kuuta päättyville pyörille
(lokakuussa 202 kpl).
