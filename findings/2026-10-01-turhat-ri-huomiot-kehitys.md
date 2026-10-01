# Turhat ja harhaanjohtavat huomiotekstit lokakuun RI-riveillä — käsikorjaukset 1.10.2026 ja kehitystarve

**Omistava repo:** `netsuite-monthly-reporting`. **Tila:** lokakuun rivit korjattu CSV-importeilla 1.10.2026.
Skriptien korjaus on tekemättä. **Aloita vasta, kun lokakuun raportit on lähetetty** (TASKS.md T28, T29).

Lokakuun ajossa (`reporting_date` 1.10.2026) kaksi sääntöä tuotti `custrecord_gbb_ri_gbb_notification`-tekstin
riveille, joilla se on väärä. Teksti menee palkka-CSV:ssä (1451) työnantajalle. Molemmat korjattiin käsin
ennen CSV:tä. **Ilman skriptikorjausta sama toistuu joka kuu**, ja joka kuu tarvitaan samat importit.

## Virhe 1 — ri_updaten vaihe 1c liputtaa kesken kuuta päättyneet Ended-rivit (*Ended retrospectively*)

**Koodi** (päätelty): `mr_monthly_reporting_ri_update.js:953-957`, `applyStage1cToRow()`.

```js
} else if (item.status === STATUS_ENDED) {
  if (item.endDate && addDays(new Date(item.endDate), 1).getTime() < targetMs) {
    flagType = 'Ended retrospectively';   // → appendNotification(STATUS_CHANGE_WARNING_TEXT)
```

Sääntö olettaa, että vuokra päättyy kuun viimeisenä päivänä. Jos vuokra päättyy 27.9., ehto on 28.9. < 1.10.,
ja rivi liputetaan. Ended raportoidaan kuitenkin päättymiskuuta seuraavassa kuussa (ADR 0002:n ankkuri),
joten lokakuu on oikea kuu. Rivi saa tekstin *"Tarkastakaa työntekijän palkoista tehdyt vähennykset."*,
vaikka syyskuun pidätykset ovat oikein.

**Todennettu NetSuitesta 1.10.2026:**
- ri_updaten (1453) laskurit `c_flagged=285 | c_not_flagged=1074`.
- 202 liputetun Ended-rivin `lease_end_date` on 1.–29.9.2026, ja **kaikilla 202 pyörällä on syyskuun Active-rivi**.
  Ended-rivi on siis ajallaan.
- Esimerkki: B045359 / RI 151164, vuokra päättyi 27.9., syyskuun rivi 101522 on Active.

**Korjausehdotus:** vertaa päättymiskuuta, ei päättymispäivää. Liputa vain, jos päättymiskuuta seuraavan kuun
1. päivä < `reporting_date`:

```js
const end = new Date(item.endDate);
const firstOfMonthAfterEnd = new Date(end.getFullYear(), end.getMonth() + 1, 1);
if (firstOfMonthAfterEnd.getTime() < targetMs) { ... }
```

Huomioi aikavyöhyke. Päivämäärät on luettava Helsingin kalenteripäivinä, kuten repo muualla tekee.

**Sama sääntö, mutta jätetty tarkoituksella ennalleen (tuoteomistaja 1.10.2026):**
- **35 konsernisiirron Active/New-riviä** (*Active/New started retrospectively*). `lease_start_date` on
  alkuperäisen sopimuksen alku, joten sääntö laukeaa jokaiselle konsernisiirrolle. Tuoteomistajan mukaan huomio
  on konsernisiirrossa *"ihan ok"*, joten käytöstä ei tarvitse muuttaa. Jos sääntöä kuitenkin muutetaan, tämä
  pitää päättää erikseen.
- 42 Ended-riviä, joiden vuokra päättyi ennen syyskuuta, ja 5 takautuvaa Siirto TA -riviä. Niillä huomio on
  aiheellinen.

**Käsikorjaus:** [`imports/2026-10-01-turhat-palkkahuomiot/`](../imports/2026-10-01-turhat-palkkahuomiot/README.md),
202 riviä, `SUM(id)` 29 975 472. Ajettu ja todennettu 1.10.2026.

## Virhe 2 — jälkiveloituksen teksti jää Ended-riville (säännöt C3 + C4)

**Teksti:**

> Vuokrakauden päättymispäivä on muuttunut: 31.08.2026 → 30.09.2026. Pyörän lunastus on myöhässä.
> Vuokralaskutus ja pyöräedun käsittely palkoissa jatkuu kunnes GoByBike vastaanottaa suorituksen.

Teksti kertoo, että käsittely palkoissa *jatkuu*, vaikka rivi raportoi sopimuksen **päättyneeksi**. Teksti on
harhaanjohtava.

**Koodi** (päätelty):
- C3: `ue_reporting_item_late_redemption_prolongation.js:16` määrittää lauseen *"Pyörän lunastus on myöhässä …"*.
  `mergeIntoExistingRi()` (`:281-290`) liittää sen olemassa olevalle riville, eikä se tarkista rivin statusta.
- C4: `ue_reporting_item_maintenance_prolongation.js:120` lisää lauseen *"Vuokrakauden päättymispäivä on muuttunut …"*.
- Kun rivi myöhemmin muuttuu Ended-tilaan (ri_creation / ri_update / käsin), kumpaakaan tekstiä ei poisteta.
  Rivien `lastmodified` on 16.09., 22.09. tai 1.10.

**Todennettu NetSuitesta 1.10.2026:**
- 32 lokakuun Ended-riviä. Kaikilla `lease_end_date` 30.09.2026, rekisterissä pyörän status 2, linkki tyypin 7
  CR:ään ja kentässä vain yllä oleva teksti.
- Kaikilla 32 pyörällä on syyskuun Active-rivi, ja siellä teksti on oikein (jälkiveloitettu kuukausi).
- Sama teksti on 44 lokakuun Active-rivillä (loppu 31.10., status 1). **Niillä se on oikein**, koska
  jälkiveloitus jatkuu.

**Korjausehdotus**, kaksi vaihtoehtoa:
1. C3:n ja C4:n merge ohittaa Ended- ja Paused-rivit, tai kirjoittaa niille oman päättymistekstin.
2. Ended-polku (ri_creation / ri_update) poistaa C3- ja C4-lauseet, kun rivi on tai muuttuu Ended-tilaan.

Vaihtoehto 2 kattaa myös rivit, jotka muuttuvat Ended-tilaan vasta mergen jälkeen, eli tämän tapauksen.
**Huom.:** `OWN_SCRIPT_NOTIFICATION_TEXTS` (`mr_monthly_reporting_ri_update.js:176`) on sopimus samasta
lauseesta. Jos tekstiä muutetaan, sopimus päivitetään samalla.

**Käsikorjaus:** [`imports/2026-10-01-myohassa-teksti-ended/`](../imports/2026-10-01-myohassa-teksti-ended/README.md),
32 riviä, `SUM(id)` 3 699 035. Ajettu ja todennettu 1.10.2026.

## Testattava korjauksen jälkeen

Lokakuun rivit kelpaavat testiaineistoksi:
- RI 151164 (B045359, Ended, vuokra päättyi 27.9.) ei saa huomiota.
- RI 104312 (B021374, Ended jälkiveloituksen jälkeen) ei saa C3- tai C4-tekstiä.
- Ended-rivi, jonka vuokra päättyi ennen edellistä kuuta (esim. RI 147156, B040788, päättyi 5.7.), saa huomion
  yhä.
- Active-rivi, jolla jälkiveloitus jatkuu (esim. RI 116163, B001767), säilyttää C3-tekstin.

Marraskuun ajossa (1.11.) laske ennen CSV:tä: kuinka moni Ended-rivi, jonka vuokra päättyi lokakuussa, kantaa
jompaakumpaa tekstiä. Jos skriptejä ei ole korjattu, sama import tarvitaan uudelleen.
