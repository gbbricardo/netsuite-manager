# S4b — syyskuussa päättyneet OOMI-pyörät, kauden lopun lunastus — CSV-import syyskuu 2026

Kirjaa selvitystavan 78 OOMI-pyörälle, joiden kausi päättyy syyskuussa 2026, mutta joilla ei ole
selvitystapaa. Ilman importtia ne jäisivät Activeksi, ja RI-luonti tekisi niille **Active-rivin
lokakuulle**, vaikka sopimus on päättynyt. Vaihe 3:n todistehaara antaa Activen, kun päättymispäivä
on mennyt mutta todistetta ei ole (`docs/lunastus-tilanne.md`, vaihe 3 -todennus).

Sääntö: [ADR 0009](../../docs/adr/0009-kauden-lopun-lunastus.md) kohta 6. Tuoteomistaja vahvisti
25.09.2026: *"Kaikki syyskuussa luonnollisesti päättyvät OOMI-sopimukset voidaan asettaa Redeemed
statukselle CSV-importilla, koska säännöt sanovat niin."* Tämä on sama käsittely kuin
[S4:ssä](../2026-09-24-oomi-kauden-loppu/README.md). Tavaksi kirjataan 1 `redemption_paid`,
`liab_settled_at` = tunnistuspäivä ja `redemption_paid_at` jää tyhjäksi.

Oomi Fleet -raportin tila (`active`, `active_pending_redemption`, `ended` …) ei vaikuta rajaukseen.
Raportti on tietolähde, ei päätös.

**Tietue:** `customrecord_sta_bike_register` · **Import type:** Custom Record ·
**Data Handling:** `UPDATE`

## Tiedosto

| Tiedosto | Rivejä | Mitä kirjoitetaan |
|---|---|---|
| `01-oomi-syyskuu.csv` | **78** | selvitystapa 1 `redemption_paid` **ja** `liab_settled_at` |

> [!IMPORTANT]
> **`loppuvastuut_hoidettu` on importtipäivä.** Tunnistuspäivä on `MAX(1.9.2026, tänään)`, eli se
> päivä, jona import ajetaan. CSV:ssä on **25.09.2026**. Jos import ajetaan muuna päivänä, vaihda
> sarakkeen arvo ajopäiväksi.
>
> **Aja ensin T1c** ([`../2026-09-25-d9-fleet-paiva-pois/`](../2026-09-25-d9-fleet-paiva-pois/README.md)).
> B044271 täyttää ehdot vasta, kun sen Fleet-päivä on tyhjennetty. Ennen sitä tarkistuskysely
> palauttaa 77.
>
> **Aja viimeistään 29.09.** Sweep kääntää statuksen seuraavana yönä, ja kääntymisen on ehdittävä
> ennen T5:tä (S3, IC-päivät 30.09.) ja T6:ta (vanha status-sync pois).

**Älä valitse** *Overwrite Missing Fields* -asetusta. Tämä import ei tyhjennä mitään.

Import **ei** kirjoita statusta eikä IC-päivää:

- **Status 2** tulee sweepin (1440) seuraavasta yöajosta, samoin kuin S4:ssä. Kirjaston
  `onkoVelvoitteetHoidettu` hyväksyy `liab_settled_at`:n todisteeksi. Näin statuksella on edelleen
  yksi kirjoittaja, ja S4 todisti 25.09., että ketju toimii (34/34, 0 virhettä).
- **IC-päivä** tulee T5:ssä (S3) 30.09. samalla säännöllä kuin muille: `LAST_DAY(päättymisajankohta)`
  = 30.09.2026.

Syyskuu raportoidaan ja laskutetaan normaalisti, vaikka status kääntyy jo syyskuussa
(sopimusankkuri, ADR 0002). RI-rivi *Ended* tulee 1.10.

## Muoto

UTF-8 ilman BOM:ia · erotin `;` · päivämäärät `dd.mm.yyyy` · CRLF.

| Sarake | Mappaus |
|---|---|
| `internal_id` | **Internal ID** |
| `pyora_id` | jätä mappaamatta |
| `selvitystapa_nimi` | `custrecord_gbb_liab_settle_method` — **mappaa** |
| `selvitystapa_id` | jätä mappaamatta, varalla |
| `loppuvastuut_hoidettu` | `custrecord_gbb_liab_settled_at` — **mappaa** |
| `paattymisajankohta`, `oomi_redemption_status`, `peruste` | jätä mappaamatta |

## Aineiston todennus

Poimittu NetSuitesta 25.09.2026. 77 pyörää täytti ehdot poimintahetkellä, ja **B044271** lisättiin T1c:n
perusteella (P1-päätös 25.09.: ilman CR:ää Fleet-päivä ei päätä pyörää, joten sen päättymisajankohta on
`subsc_end_date` 05.09.2026). Kaikki 78:

- ovat OOMI-pyöriä (`order_type = 3`)
- ovat status 1, eikä niillä ole selvitystapaa
- ovat `subsc_end_date` 01.09.–30.09.2026
- eivät kanna `exceptional_end_date`:a. `oomi_exceptional_end_date` on tyhjä tai vähintään yhtä myöhäinen
  kuin `subsc_end_date`, eli Fleet-raportti ei ole päättänyt niitä aikaisemmin
- eivät ole Pending- eivätkä Done-tilaisen tyypin 2/10 CR:n kohteita
- eivät kanna `paid_at`:ia eivätkä `liab_settled_at`:ia

Fleet-tila: `active_pending_redemption` 41, `ended` 23, `ended_pending_payment` 8, `active` 5.

**Rajattu pois:** P1:n (D9) muut 14 pyörää. Niiden `subsc_end_date` on tulevaisuudessa, joten ne
raportoidaan Active-tilaisina (T1c).

| | CSV | NetSuite |
|---|---|---|
| Rivejä | 78 | 78 (T1c:n jälkeen) |
| `SUM(id)` | 3 311 692 | 3 311 692 (ennen T1c:tä 77 / 3 267 421) |
| `MIN(id)` / `MAX(id)` | 37 453 / 46 337 | 37 453 / 46 337 |

**Aja tämä juuri ennen importtia.** Jos luvut eroavat, joukkoon on tullut uusia pyöriä tai siitä on
poistunut pyöriä, esimerkiksi CR:n tai maksun vuoksi. Tee poiminta uudelleen, älä importoi.

```sql
SELECT COUNT(*) AS rivit, SUM(br.id) AS id_summa, MIN(br.id) AS min_id, MAX(br.id) AS max_id
FROM customrecord_sta_bike_register br
WHERE br.custrecord_sta_bike_status = 1 AND br.custrecord_gbb_liab_settle_method IS NULL
  AND br.custrecord_sta_bike_order_type = 3 AND br.custrecord_gbb_exceptional_end_date IS NULL
  AND br.custrecord_sta_subsc_end_date >= TO_DATE('2026-09-01','YYYY-MM-DD')
  AND br.custrecord_sta_subsc_end_date <  TO_DATE('2026-10-01','YYYY-MM-DD')
  AND (br.custrecord_gbb_oomi_exceptional_end_date IS NULL
       OR br.custrecord_gbb_oomi_exceptional_end_date >= br.custrecord_sta_subsc_end_date)
  AND NOT EXISTS (SELECT 1 FROM customrecord_subscrption_change_request cr
                  WHERE cr.custrecord_cr_bike_registry = br.id
                    AND cr.custrecord_cr_type IN (2,10) AND cr.custrecord_cr_status IN (1,2))
```

## Jälkitarkistus

Heti importin jälkeen tarkistuskysely palauttaa **0**, ja kaikilla 78:lla on tapa 1 ja
`liab_settled_at` = ajopäivä. Seuraavana aamuna, sweepin ajon jälkeen, kaikki 78 ovat **status 2**.
Kysely on sama kuin T1:ssä: id-lista CSV:n ensimmäisestä sarakkeesta.
