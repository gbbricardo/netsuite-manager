# `custrecord_gbb_liab_settle_method` — kattavuus ja automaatioaukko

**Päivä:** 2026-09-17
**Omistavat repot:** `netsuite-subscrption-cr-scripts` (ainoa kirjoittaja),
`netsuite-bike-redemption-status-sync` (aukko), `cf-gbb-tools` (lukija)
**Tila:** jakaumat **varmennettu NetSuitesta** SuiteQL:llä; kirjoittajien kartoitus ja ajoitusselitys
**päätelty koodista ja git-historiasta**.

---

## 1. Kuka kirjoittaa kenttää

| Repo | Rooli | Todiste |
|---|---|---|
| `netsuite-subscrption-cr-scripts` | **Ainoa kirjoittaja.** `handler_lunastus.js:28` `DEFAULT_SETTLE_METHOD_BY_STATUS = {2:1, 3:5}`, `:54` `SETTLE_METHOD_OVERRIDES` (` - 2B uusi TA`→6, ` - 2B`→6, `vakuutus`→7). Kirjoitus on **write-once**: `addLiabilitySettlementFields` (`:185–214`) lukee nykyarvon ja jättää sen koskematta, lokittaen `kept`-rivin. | koodi |
| `cf-gbb-tools` | Vain lukija. `queries.ts:71` hakee kentän, `:116–118` johtaa `liabilityAlreadySettled`-lipun; `reference.ts:54–69` näyttää lomakkeella minkä metodin kukin tapaus *tulee* saamaan. Ei kirjoita. | koodi |
| `netsuite-bike-redemption-status-sync` | **Ei viittaa kenttään lainkaan**, vaikka on toinen statuksen `2` kirjoittaja (`gbb_ss_bike_redemption_status_sync.js:433–434`). | grep: 0 osumaa |
| monthly-reporting, paylink, subscription-extension, ic-calculators | Eivät viittaa kenttään. | grep: 0 osumaa |

## 2. Listan arvot ja todellinen käyttö

`customlist_gbb_liab_settle_method`, koko pyörärekisteri 2026-09-17:

| ID | Arvo | Rivejä | Kirjoittaja |
|---|---|---|---|
| 1 | redemption_paid | 10 712 | automaatti (status 2 default) + massabackfill |
| 2 | redemption_extra_rent | 68 | **vain käsin** (11.06.→16.09.2026) |
| 3 | redemption_maint_budget | 4 | **vain käsin** (30.06.→31.08.2026) |
| 4 | redemption_down_payment | **0** | ei kukaan — kuollut arvo |
| 5 | bike_returned | 178 | automaatti (status 3 default) |
| 6 | bike_sold_to_competitor | 16 | automaatti (` - 2B`, ` - 2B uusi TA`) |
| 7 | bike_stolen_or_destroyed | 122 | automaatti (`vakuutus`) |
| – | tyhjä | 35 633 | – |

Lisäksi: **171 riviä, joilla on metodi mutta ei `custrecord_gbb_liab_settled_at`** — kentät on
vartioitu toisistaan riippumatta, joten tämä on odotettua, ei bugi.

## 3. Aukko: `bike_status != Active` ja metodi tyhjä — **1 656 pyörää**

| Status | Yhteensä | Metodi tyhjä | Osuus |
|---|---|---|---|
| 2 Redeemed | 12 329 | 1 506 | 12,2 % |
| 3 Returned | 183 | 2 | 1,1 % |
| *status itsekin tyhjä* | 148 | 148 | 100 % |

Status-2-tyhjien 1 506 hajotus:

| Ryhmä | n | Selitys |
|---|---|---|
| On type 2/7 CR, CR suljettu **ennen 2026-09-02** | ~245 | Ominaisuus ei ollut vielä olemassa. Write-once ei korjaa näitä jälkikäteen. |
| On type 2/7 CR, CR suljettu **syyskuussa 2026** | 9 | Tutkittava yksitellen — voi olla aito bugi. |
| Ei CR:ää, `custrecord_gbb_redemption_paid_at` asetettu | **44** | **status-syncin maksuvetoiset lunastukset** (päättymiset 19.07.–16.09.2026). Kasvava joukko. |
| Ei CR:ää, vain `custrecord_sta_redemption_date` | 431 | Käsin/importilla asetettu status (01/2025–02/2026). |
| Ei CR:ää, ei kumpaakaan päivää | 777 | Käsin/importilla asetettu status (02/2024–09/2026). |

### Kumottu hypoteesi

Oletus *"handler käsittelee vain ennenaikaisia päättymisiä, luonnolliset kauden lopun lunastukset
jäävät katveeseen"* **ei pidä paikkansa**. Kun status-2-pyörät jaetaan sen mukaan osuuko
`redemption_date` yli 31 pv ennen `subsc_end_date`:a:

| | `early_midterm` | `natural_at_end` | `no_red_date` | `late_after_end` |
|---|---|---|---|---|
| metodi asetettu | 24 | 916 | 9 874 | 9 |
| metodi tyhjä | **0** | 431 | 1 073 | 2 |

Handler hoitaa nimenomaan kauden lopun lunastukset, ja tyhjien joukossa ei ole yhtään
ennenaikaista. Jako ei erottele populaatioita — **todellinen erottelija on ajoitus** (ominaisuus
julkaistiin `handler_lunastus.js`-commitissa **2026-09-02**, `uusi TA` -haara 2026-09-09) **ja
se, onko lunastus ylipäätään kulkenut CR:n kautta** (1 252 / 1 506 = 83 % ei ole).

Kaikilla 1 506:lla `lastmodified` on 08–09/2026, eli edellinen massapäivitys on jo kertaalleen
ajettu ja jättänyt nämä väliin — `lastmodified` ei siis kelpaa erottelijaksi.

## 4. Sivulöydös: 148 pyörää ilman statusta

`custrecord_sta_bike_status` on **tyhjä** 148 pyörällä. Ne eivät ole Active eivätkä päättyneitä ja
putoavat jokaisen skriptin suodattimesta: status-sync filtteröi `custrecord_sta_bike_status = 1`
alikyselyssä (`gbb_ss_bike_redemption_status_sync.js:272, :357`), handler kirjoittaa statuksen itse.
Erillinen selvitettävä, ei osa tätä löydöstä.

---

## 5. Ehdotetut skriptimuutokset

> Muutokset tehdään **omistavissa repoissa**, eivät täällä. Alla oleva on ehdotus, ei toteutus.
> Kummallakaan repolla ei ole testiajuria — verifiointi tarkoittaa NetSuite-ajoa.

### M1 — status-sync kirjoittaa metodin `1` statuksen mukana *(ainoa, joka estää uutta velkaa)*

**Repo:** `netsuite-bike-redemption-status-sync`
**Tiedosto:** `gbb-bike-redemption/gbb_ss_bike_redemption_status_sync.js`
**Vaikutus:** ~44 pyörää on jo jäänyt ilman metodia, ja määrä kasvaa joka päivä.

Skripti kirjoittaa `updateBikeRegister`issa (`:433–434`) vain kaksi kenttää:

```js
const values = { custrecord_gbb_redemption_paid_at: row.paidAt };
if (row.statusDue) values.custrecord_sta_bike_status = BIKE_STATUS_REDEEMED;
```

Ehdotus:

1. Lisää molempiin hakukyselyihin (`fetchPaymentRequestRedemptions:254`,
   `fetchInvoiceRedemptions:328`, `existingpaidat`-sarakkeen viereen)
   `br.custrecord_gbb_liab_settle_method AS existingsettlemethod`.
2. Lisää vakio `const LIAB_SETTLE_REDEMPTION_PAID = 1;` `BIKE_STATUS_*`-vakioiden viereen (`:119`).
3. Kirjoita metodi **vain kun status oikeasti flipataan** ja **vain jos kenttä on tyhjä** — sama
   write-once-vartiointi kuin `handler_lunastus.js:185–214`:

```js
if (row.statusDue) {
    values.custrecord_sta_bike_status = BIKE_STATUS_REDEEMED;
    // Write-once, kuten handler_lunastus.js: maksuvetoinen lunastus on aina
    // redemption_paid, mutta käsin kirjattu tai handlerin kirjoittama metodi
    // voi olla 2/3/6/7 — sitä ei saa yliajaa.
    if (!row.existingSettleMethod) {
        values.custrecord_gbb_liab_settle_method = LIAB_SETTLE_REDEMPTION_PAID;
    }
}
```

4. Lisää kirjoitettu/säilytetty metodi `detail`-lokiriville, jotta ajo on jälkikäteen luettavissa
   (sama idiomi kuin `describeSettlementWrite`, `handler_lunastus.js:155`).

**Miksi metodi vain `statusDue`-haarassa:** phase 1 (pelkkä `paid_at`-leima) jättää pyörän
tarkoituksella Activeksi. Loppuvastuu ei ole vielä hoidettu, joten metodia ei pidä kirjata.

**Miksi `custrecord_gbb_liab_settled_at` jätetään koskematta:** handlerin kommentti (`:166–181`)
varoittaa nimenomaan siitä, että ajopäivä ei ole todellinen selvityspäivä. Status-syncillä olisi
tähän parempi ehdokas (`row.paidAt`), mutta se on erillinen päätös — älä niputa sitä tähän.

**Riski:** jokainen `submitFields` pyörärekisteriin laukaisee
`webhooks/gbb_webhook_ue_status_changed.js` -käyttäytymisen. Muutos ei lisää kirjoituksia, vain
kenttiä olemassa olevaan kirjoitukseen, joten webhook-kuorma ei kasva.

**Verifiointi:** aja `custscript_gbb_bikeredemp_test_bike_id` + dry run yhdellä
`statusDue`-pyörällä, tarkista lokirivi, sitten oikea ajo ja SuiteQL-tarkistus samalle pyörälle.

---

### M2 — metodien 2 ja 3 tunnistussääntö handleriin

**Repo:** `netsuite-subscrption-cr-scripts`, `handler_lunastus.js:54`
**Vaikutus:** 72 riviä kirjattu käsin; käyttö alkoi 06/2026 ja jatkuu.

`redemption_extra_rent` (2) ja `redemption_maint_budget` (3) eivät ole automaation ulottuvilla:
handler kirjoittaa status 2:lle aina oletuksen `1`. Koska kirjoitus on write-once, näiden tapausten
metodi on pakko olla paikallaan **ennen** CR:n ajoa — muuten ne leimautuvat väärin
`redemption_paid`iksi eikä virhettä näy missään.

Kaksi vaihtoehtoa, kummankin valinta on liiketoimintapäätös:

- **(a) Nimipääte** — uusi rivi `SETTLE_METHOD_OVERRIDES`iin samaan tapaan kuin `vakuutus`.
  Halpa, mutta lisää kuormaa jo valmiiksi hauraaseen nimipohjaiseen reititykseen
  (ks. CLAUDE.md § *Name-based routing*: monthly-reporting reitittää samoja CR-tyyppejä
  `altname`in tekstillä, joten uusi pääte osuu molempiin polkuihin).
- **(b) Oma kenttä CR-tietueelle** *(suositus)* — esim. `custrecord_cr_liab_settle_method_override`,
  jonka handler lukee ja käyttää sellaisenaan jos asetettu. Ei kosketa nimikonventiota, on
  tarkastettavissa ennen ajoa ja näkyy cf-gbb-toolsin lomakkeelle.

### M3 — metodi 4 (`redemption_down_payment`): päätä tai poista

Nolla riviä, nolla kirjoittajaa, mutta näkyy valintalistassa ja `reference.ts`in kautta
käyttäjälle. Joko määritellään sääntö tai inaktivoidaan listalta.

### M4 — backfill, ei skriptityötä

Jäljelle jäävät ~1 450 riviä (CR:t ennen 2026-09-02 ja CR:ttömät lunastukset) korjataan CSV-importilla
samaan tapaan kuin `Bike-Redemption-Paid-At-CSV-Backfill.md` kuvaa. Sen varoitus pätee sellaisenaan:
**importissa ei saa olla `custrecord_sta_bike_status` -saraketta**, tai
`gbb_webhook_ue_status_changed.js` uudelleenlaukeaa jokaiselle riville.

Ennen importtia: tutki ne **9 syyskuussa suljettua CR:ää**, joiden pyörällä metodi on yhä tyhjä —
jos syy on muu kuin deploy-ajoitus, se on aito bugi, joka backfill peittäisi näkyvistä.

---

## 6. Toistettavat kyselyt

```sql
-- Jakauma metodeittain
SELECT custrecord_gbb_liab_settle_method AS id, COUNT(*) AS n
FROM customrecord_sta_bike_register GROUP BY custrecord_gbb_liab_settle_method ORDER BY 2 DESC;

-- Aukko statuksittain
SELECT custrecord_sta_bike_status AS st, COUNT(*) AS total,
       SUM(CASE WHEN custrecord_gbb_liab_settle_method IS NULL THEN 1 ELSE 0 END) AS no_method
FROM customrecord_sta_bike_register GROUP BY custrecord_sta_bike_status ORDER BY 1;

-- M1:n kohdejoukko: status-syncin jättämät (ei CR:ää, paid_at asetettu, metodi tyhjä)
SELECT br.id, br.custrecord_sta_subsc_end_date, br.custrecord_gbb_redemption_paid_at
FROM customrecord_sta_bike_register br
LEFT JOIN (SELECT DISTINCT custrecord_cr_bike_registry AS bikeid
           FROM customrecord_subscrption_change_request
           WHERE custrecord_cr_type IN (2,7)) cr ON cr.bikeid = br.id
WHERE br.custrecord_sta_bike_status = 2
  AND br.custrecord_gbb_liab_settle_method IS NULL
  AND cr.bikeid IS NULL
  AND br.custrecord_gbb_redemption_paid_at IS NOT NULL;
```
