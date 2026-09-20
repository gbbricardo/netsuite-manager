# ADR 0002 — Kaksi ankkuria: päättymisajankohta ja tunnistuspäivä

- **Päivämäärä:** 2026-09-18
- **Tila:** Hyväksytty
- **Koskee:** [`lunastuksen-kenttasaannot.md`](../lunastuksen-kenttasaannot.md), `netsuite-ic-calculators`

## Konteksti

Ennenaikaisen lunastuksen päättymisajankohta voi olla menneisyydessä. Tämä ei ole reunatapaus:
CR-tyypin 2 pyynnöistä **350/1782 (20 %)** on sellaisia joissa `custrecord_cr_contract_official_end_date`
on jo mennyt CR:n luontihetkellä. Suurin mitattu takautuvuus on 468 päivää.

Konkreettinen tapaus: tänään 18.09.2026 päätetään että sopimus päättyi 30.04.2026.

Tästä syntyy ristiriita. Kaksi asiaa johdetaan päättymisajankohdasta, ja ne vaativat eri kohtelun:

- **`custrecord_gbb_ic_redemption_dt`** on IC-lunastushinnan amortisaation katkaisukohta.
  `gbb_ic_redemption_calculator.js:122-125` laskee kokonaisten kalenterikuukausien määrän
  lunastuspäivän ja sopimuksen päättymisen välillä, ja tulos menee suoraan `periodsElapsed`-muuttujaan
  (`:134-137`). Jokainen kuukausi eteenpäin lisää yhden kuukauden maksettua pääomaa ja laskee hintaa.
  Huhtikuun korvaaminen syyskuulla olisi viisi kuukautta amortisaatiota liikaa — konkreettinen
  rahallinen virhe.

- **`custrecord_sta_bike_status`** ja **`custrecord_gbb_date_to_non_active`** ovat operatiivisia:
  niitä ei voi merkitä tapahtuneeksi taaksepäin. Huhtikuun 30. päivä on mennyt eikä statusta voi
  vaihtaa siihen.

Yhdellä ankkurilla toinen näistä rikkoutuu aina.

## Vaihtoehdot

**A. Yksi ankkuri, päättymisajankohta.** Status "vaihtuu" menneenä päivänä — käytännössä heti, ja
`date_to_non_active` valehtelee. Hylätty.

**B. Yksi ankkuri, tunnistuspäivä.** `ic_redemption_dt` osoittaisi käsittelykuukauteen, jolloin
IC-hinta laskettaisiin väärin kaikissa takautuvissa tapauksissa. Tämä oli alkuperäinen ehdotus ja se
hylättiin, koska kenttä kuvaa kauden päättymistä **rahoittajan näkökulmasta** — sen merkityksen
muuttaminen vaatisi laskentakaavan muuttamisen samalla.

**C. Kaksi ankkuria.** Valittu.

## Päätös

Käytetään kahta ankkuria, ja jokainen johdettu kenttä sidotaan eksplisiittisesti toiseen niistä.

**Sopimusankkuri — päättymisajankohta.** Saa olla menneisyydessä.

- sopimusrivien katkaisu
- laskutuksen päättyminen
- `custrecord_gbb_ic_redemption_dt` = `LAST_DAY(päättymisajankohta)`

**Operatiivinen ankkuri — tunnistuspäivä.** Ei koskaan menneisyydessä.

```
tunnistuspäivä = MAX(päättymisajankohdan kuukauden 1. päivä, tänään)
```

- `custrecord_sta_bike_status`
- `custrecord_gbb_date_to_non_active`

Esimerkki, päätös 18.09.2026, päättymisajankohta 30.04.2026:

| | |
|---|---|
| Sopimusrivit katkaistaan | 30.04.2026 |
| `ic_redemption_dt` | **30.04.2026** |
| Status → 2 | **18.09.2026** |
| `date_to_non_active` | 18.09.2026 |

Eteenpäin katsovassa tapauksessa ankkurit osuvat yhteen eikä eroa synny.

## Seuraukset

**Hyvät.** IC-hinta lasketaan oikein myös takautuvissa lunastuksissa. Status ja kirjausjälki
kertovat totuuden siitä milloin kone kirjasi päättymisen. Ankkurien ero on luettavissa suoraan
tietueelta ja se on takautuvan käsittelyn mittari:
`WHERE date_to_non_active > ic_redemption_dt`.

**Huonot.** Kaksi päivämäärää jotka näyttävät samalta mutta eivät ole. Lukija joka ei tunne tätä
päätöstä olettaa niiden olevan aina yhtä suuret ja pitää eroa virheenä. Siksi ero on dokumentoitava
jokaisessa paikassa jossa kentät esiintyvät, ei vain täällä.

**Ei tehdä.** `custrecord_gbb_ic_redemption_dt`:n merkitystä ei muuteta eikä IC-laskentakaavaan
kosketa. Jos kentän merkitystä joskus muutetaan, `gbb_ic_redemption_calculator.js` on muutettava
samassa yhteydessä — se on ainoa sisarrepo jolla on oma testisarja, joten muutos on testattavissa.
