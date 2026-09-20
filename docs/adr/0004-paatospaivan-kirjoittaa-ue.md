# ADR 0004 — Päätöspäivän kirjoittaa User Event -skripti, ei handler

- **Päivämäärä:** 2026-09-19
- **Tila:** Hyväksytty
- **Koskee:** `custrecord_gbb_redemption_decided_at`, `custrecord_gbb_liab_settled_at`,
  [ADR 0001](0001-uusi-paatospaiva-kentta.md), [kenttäsäännöt §5](../lunastuksen-kenttasaannot.md)

## Konteksti

`custrecord_gbb_liab_settled_at` luotiin alun perin toista tarkoitusta varten kuin mitä
[kenttäsäännöt](../lunastuksen-kenttasaannot.md) sille antoivat. Alkuperäinen suunnitelma
(tuoteomistaja, 19.09.2026): **User Event -skripti leimaa kuluvan päivän kun
`custrecord_gbb_liab_settle_method` päivittyy.** Se on päivämäärä 2 — päätöspäivä — ei päivämäärä 3.

UE:ta ei koskaan rakennettu. `handler_lunastus.js:209` tekee sen käsin ja väärään kenttään:

```js
values.custrecord_gbb_liab_settled_at = new Date();
```

Kenttäsäännöt julistivat kentän päivämääräksi 3 ja sen jälkeen 53 tietuetta "virheellisiksi". Ne
eivät olleet virheellisiä alkuperäistä tarkoitusta vasten — kenttä kantoi kahta merkitystä, ja
yhtäkään kirjoittajaa ei ollut kerrottu kumpaa. [ADR 0001](0001-uusi-paatospaiva-kentta.md) loi
päivämäärälle 2 oman kentän 19.09.2026, jolloin alkuperäinen idea sai vihdoin oikean kohteen.

### Miksi kenttiä tarvitaan yhä kaksi

Mitattu NetSuitesta 19.09.2026, kaikki 11 100 pyörää joilla on selvitystapa:

| Mistä "velvoitteet hoidettu" johdetaan | kpl |
|---|---|
| Selvitystapa itse (2, 3, 5, 6, 7 — maksuton) | 388 |
| `custrecord_gbb_redemption_paid_at` (tavat 1, 4) | 10 573 |
| **Vain `custrecord_gbb_liab_settled_at`** | **139** |
| Ei todistetta lainkaan | 0 |

`liab_settled_at` on ainoa todiste 1,25 %:ssa tapauksista. Kenttää ei siis voi poistaa — mutta sen
**ei tarvitse olla kattava**, koska `gbb_lunastus_lib.onkoVelvoitteetHoidettu` lukee neljää
rinnakkaista todistetta eikä yhtä. 98,7 % vastataan oikein ilman kenttää.

Kentän vajaa täyttöaste on ongelma vain niin kauan kuin joku lukija nojaa siihen **yksin**, kuten
`mr_monthly_reporting_ri_creation.js:1003` tänään tekee. Kirjasto poistaa sen rakenteellisesti.

## Päätös

**1. Päätöspäivän kirjoittaa User Event -skripti.** Uusi UE pyörärekisterillä leimaa
`custrecord_gbb_redemption_decided_at`-kenttään Helsingin kalenteripäivän silloin kun
`custrecord_gbb_liab_settle_method` saa arvon ja päätöspäivä on tyhjä.

Perustelu: päivämäärä 2 on määritelmällisesti aina "nyt", joten UE ei voi laskea sitä väärin eikä
se tarvitse tietää mistään muusta. UE kattaa myös käsin tehdyt muutokset, CSV-importit ja
cf-gbb-toolsin kirjoitukset — kaikki polut joita yksikään handler ei kata. Kenttäsäännöt toteavat
§5:ssä että "osaa ei voi teknisesti pakottaa"; tämän voi.

**2. `handler_lunastus.js:209` poistuu, ei siirry.** Handlerin ei tarvitse kirjoittaa kumpaakaan
päivämäärää: UE hoitaa päivämäärän 2, ja päivämäärän 3 kirjoittaa vain se joka näkee **päivätyn**
todisteen. Tämä kumoaa [ADR 0001](0001-uusi-paatospaiva-kentta.md):n kohdan *"automaatio täyttää
sen aina kun se kirjaa selvitystapa-arvon"*.

**3. `custrecord_gbb_liab_settled_at` kantaa vain päivämäärää 3.** Se kirjoitetaan **vain kun
päivätty todiste on olemassa** — maksupäivä, maksettu lunastuslasku tai valmis Paylink-pyyntö.
Päivämäärättömällä todisteella (maksuton selvitystapa) kenttä **jää tyhjäksi**, eikä tyhjä ole
virhe. Päivä luetaan silloin päätöspäivästä.

Kentän ainoaksi korvaamattomaksi tehtäväksi jää **pysyväistää se todiste joka ei asu
pyörärekisterissä** — maksettu lunastuslasku ja valmis Paylink-pyyntö. Map/Reduce joka käy läpi
46 737 pyörää ei voi hakea niitä per pyörä governance-rajan takia. Tätä ei tee tänään kukaan.

**4. Omistaja on `netsuite-subscrption-cr-scripts`** ([ADR 0003](0003-jaetun-kirjaston-sijainti.md):n
perustelu): ainoa sisarrepo jolla on deployment-polku (SDF). UE lataa `gbb_lunastus_lib`:n
`tanaanHelsinki()`:n vuoksi — SuiteScriptin ajonaikainen kello on ~10 h Suomen ajasta.

## Toteutusreunaehdot

Pyörärekisterillä on jo **neljä** RELEASED User Event -skriptiä (todennettu NetSuitesta 19.09.2026):

| Script ID | Nimi | Omistaja |
|---|---|---|
| `customscript_sta_ue_bike_register_hook` | [STA] UE - Bike Register Hook | Staria — ei lähdekoodia missään sisarrepossa |
| `customscript_gbb_wh_status_changed` | GBB Webhook - Status Changed | ei lähdekoodia missään sisarrepossa |
| `customscript_gbb_wh_subsc_dates` | GBB Webhook - Subscription Dates Changed | ei lähdekoodia missään sisarrepossa |
| `customscript_gbb_ri_maint_prolongation` | [GBB] RI maintenance prolongation | `netsuite-monthly-reporting` |

Viides UE on siis lisättävä pinoon jonka kolmesta skriptistä **ei ole lähdekoodia hallussamme**.
Siitä seuraa kaksi vaatimusta:

- **`afterSubmit`, ei `beforeSubmit`.** Päätöspäivä on kirjausjälki eikä saa vaikuttaa siihen mitä
  muut skriptit näkevät tallennushetkellä.
- **Ei koskaan ylikirjoita.** Jos kentässä on arvo, UE ei tee mitään. Tämä on
  [ADR 0001](0001-uusi-paatospaiva-kentta.md):n write-once-sääntö, ja se suojaa myös siltä että
  jokin tuntematon UE tallentaa tietueen uudelleen.
- Triggerit `CREATE`, `EDIT` ja **`XEDIT`** — inline-muokkaus ja `submitFields` ohittavat `EDIT`:n.
  Tämä on sama ansa jonka kuukausiraportoinnin UE-skriptit jo kiertävät.

## Seuraukset

**Hyvät.** Päätöspäivä täyttyy jokaisella polulla, myös käsin ja CSV:llä. `liab_settled_at`
vapautuu kantamaan yhtä merkitystä. `handler_lunastus.js` yksinkertaistuu: yksi kirjoitus vähemmän
ja write-once-vahti sen ympäriltä (`:185-215`) poistuu.

**Huonot.** Viides UE tuntemattomassa pinossa. UE:n kaatuminen estää pyörärekisterin tallennuksen,
joten sen on oltava triviaali ja `try/catch`-suojattu — se on kirjausjälki, ei liiketoimintalogiikka.

**Riski.** Jos jokin tuntematon UE kirjoittaa `liab_settle_method`-kentän, päätöspäivä leimautuu
sen ajohetkellä. Mittari on kenttäsääntöjen §8:n kysely joka etsii pyöriä joilla on selvitystapa
mutta ei päätöspäivää — ja sen käänteinen, päätöspäivä ilman selvitystapaa.

## Todennettu vs. päätelty

**Todennettu NetSuitesta 19.09.2026:** todistejakauma (388 / 10 573 / 139 / 0) ja neljä RELEASED
UE-deploymentia pyörärekisterillä.
**Todennettu koodista 19.09.2026:** `handler_lunastus.js:209`; `liab_settled_at`:n lukijat ovat
yksinomaan `netsuite-monthly-reporting`issa (`mr_monthly_reporting_ri_creation.js`,
`mr_backfill_missing_ended_rows.js`, `tools/warning_triage.js:47`); `cf-gbb-tools` ei lue sitä.
**Tuoteomistajalta 19.09.2026:** kentän alkuperäinen suunnittelutarkoitus.
