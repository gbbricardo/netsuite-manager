# Tallennetut haut

**Käsin ylläpidetty.** `tools/export-schemas.mjs` **ei** vie tallennettuja hakuja — ne jäävät
skeemaviennin ulkopuolelle ([`README.md`](README.md)). Jokainen merkintä kertoo mistä ja milloin
ehdot on luettu, koska ne voi muuttaa kuka tahansa NetSuiten käyttöliittymästä ilman että mikään
repo huomaa sitä.

---

## `customsearch_gbb_br_pidennykset`

- **Tietue:** `customrecord_sta_bike_register`
- **Käyttäjä:** `netsuite-subscription-extension` · `mr_subscription_extension.js`, normaaliajo
  (`search.load({ id: params.searchId })`)
- **Ehdot luettu:** 2026-09-18, käyttäjän lukemana NetSuiten käyttöliittymästä

| Suodatin | Ehto |
|---|---|
| BIKE STATUS | is Active |
| SUBSCRIPTION END DATE | is on 1 days ago |
| Order type | is not OOMI |

Ei kaavasuodattimia.

### Miksi tällä on väliä

**Haku suodattaa statuksella.** Niin kauan kuin `bike_status` käännetään arvoon 2 ennen
vuokrakauden päättymistä, pyörä katoaa tästä hausta eikä maksamatonta lunastusta havaita — tyypin 7
CR:ää ei synny. Sama vaikutus kuin koodin rivillä `:220`, mutta eri paikassa ja eri repon
ulottumattomissa.

Kun [statusportti](../docs/lunastus-toteutussuunnitelma.md) on toteutettu, tämä suodatin muuttuu
vaarattomaksi: pyörä pysyy tilassa Active tunnistuspäivään asti, eli koko sen ajan jonka se on tässä
haussa. **Hakua ei siis tarvitse muuttaa** — mutta se on syytä tietää, koska muutoksen
toimivuus riippuu siitä.

**Ikkuna on yksi päivä.** `is on 1 days ago` — ei "on tai ennen". Jos ajo jää väliin, pyörä ei
palaa jonoon koskaan. Tämä on sama mekanismi jolla B013565 jäi väliin syyskuussa 2026
(`netsuite-subscription-extension/README.md`).

**Haku lukee vain `custrecord_sta_subsc_end_date`.** Se ei tunne
`custrecord_gbb_exceptional_end_date`- eikä `custrecord_gbb_oomi_exceptional_end_date`-kenttiä,
joten sen käsitys päättymisajankohdasta on suppeampi kuin
[kenttäsääntöjen](../docs/lunastuksen-kenttasaannot.md#2-päättymisajankohta) ketju. OOMI-pyörät on
tosin rajattu ulos, ja `exceptional_end_date` on mitattu OOMI-only (79/79), joten ero ei tällä
hetkellä osu mihinkään pyörään. Se on sattumaa, ei suojaa.

**Override-parametri ohittaa tämän haun kokonaan.**
`custscript_gbb_ext_override_sub_end_date` rakentaa oman hakunsa koodissa — myös OOMI-suodatin
katoaa silloin. Verifioitu ansa, ks. CLAUDE.md § *The extension loop has no owner*.
