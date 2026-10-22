# Kyselykirjasto

Todennettuja SuiteQL-kyselyjä, jotka `suiteql-rakentaja`-agentti on rakentanut ja ajanut NetSuitea
vasten, ja joita auditoija-agentit (`lunastusauditoija`, `ri-auditoija`, `sopimusriviauditoija`, `muutospyyntoauditoija`)
käyttävät hakuihinsa. Yksi tiedosto per kysely.

**Miksi kirjasto on olemassa.** Aliagentit eivät voi kutsua toisiaan. Kun auditoija tarvitsee
monimutkaisen kyselyn (ikkunafunktio, monen tietueen liitos, aukko- tai päällekkäisyystarkistus),
pääsessio kutsuu ensin `suiteql-rakentaja`-agenttia, joka rakentaa ja todentaa kyselyn ja tallentaa
sen tänne. Auditoija lukee sen tästä. Seuraavan kerran kyselyä ei rakenneta uudelleen.

**Mikä täällä ei ole.** Ei kyselytuloksia, ei henkilötietoja, ei findings-raportteja (ne ovat
`findings/`-hakemistossa). Kirjasto sisältää kyselyn, sen todennustiedot ja käyttöohjeen.

## Ennen kuin kirjoitat kyselyn

Lue [`suiteql-tuki.md`](suiteql-tuki.md): mikä SQL-rakenne toimii tällä tilillä ja mikä kaatuu,
todennettu koekyselyillä. Erityisesti: `GROUP BY` + `ORDER BY <alias>` kaatuu, `BUILTIN.DF` ei
kelpaa `GROUP BY`:hin, `systemnote` ei ryhmity, ja CTE:t **toimivat** vaikka työkalun oma kuvaus
väittää muuta.

## Hakemisto

| Tiedosto | Tarkoitus | Käyttäjät | Todennettu | Rivejä todennuksessa |
|---|---|---|---|---|
| [`lease-fees-vaarat-liput.md`](lease-fees-vaarat-liput.md) | Lease fees check (1432): onko PAID-lippu asetettu pyörälle, jonka asiakkaalla on avoin vuokralasku kaudella | pääsessio (T60) | 2026-10-22 | 841 pyörää, 0 osumaa |
| [`pyoran-sopimusrivit.md`](pyoran-sopimusrivit.md) | Yhden pyörän kaikki sopimusrivit emosopimuksen asiakkaan, nimikkeen ja statuksen nimillä | sopimusriviauditoija, ri-auditoija | 2026-09-18 | 6 (pyörä 5296) |
| [`kuukausiajo-tarkistuslista.md`](kuukausiajo-tarkistuslista.md) | Kuun 1. päivän tarkistukset ri_creationin ja ri_updaten jälkeen ennen palkka-CSV:tä (Active/Ended-kattavuus, D8, lokit, T28/T29) | pääsessio, ri-auditoija | 2026-10-22 | kohdat 1–4, 6 `<D>` = 2026-10-01 |
| [`sopimusrivien-aukot.md`](sopimusrivien-aukot.md) | Pyörän sopimusrivien vierekkäisyys per nimike: aukko- ja päällekkäisyyspäivät `LAG`-ikkunalla | sopimusriviauditoija | 2026-09-18 | 6 (pyörä 5296, yksi pyörä) |

## Kirjastomerkinnän muoto

Jokainen tiedosto noudattaa tätä runkoa. Kentät joita ei voi täyttää jätetään näkyviin tyhjinä —
tyhjä *Todennettu* tarkoittaa että kyselyä ei ole ajettu, eikä sitä saa esittää todennettuna.

```markdown
# <slug> — <otsikko yhdellä lauseella>

**Tarkoitus:** mihin kysymykseen tämä vastaa, yhdellä kappaleella.
**Käyttäjät:** mikä auditoija ja mihin sen löydöstyyppiin (esim. sopimusriviauditoija K3/K4).
**Parametrit:** `<BIKE_ID>` = pyörärekisterin sisäinen id; `<DATE>` = `YYYY-MM-DD` …
**Todennettu:** YYYY-MM-DD, N riviä, populaatio jolla ajettu (yksi pyörä / koko taulu).
**Sarakkeet:** nimi → merkitys → muoto (esim. `e` → rivin päättymispäivä → `YYYY-MM-DD`).

```sql
-- kysely, parametrit merkittyinä <NÄIN>
```

**Tarkistukset:** fan-out (COUNT(*) vs COUNT(DISTINCT id) ennen ja jälkeen liitosten),
tunnettu luku johon tulos verrattiin (PROJEKTIN_TILA.md, CLAUDE.md), NULL-käsittely.
**Huomiot:** mitä tulos ei kerro; mitkä tunnetut poikkeamaluokat pitää sulkea pois käsin
(OOMI-tyngät, pidennysrivit, tauot); suorituskyky.
```

Nimeä tiedosto `kebab-case`-suomeksi ilman ääkkösiä, aiheen mukaan (`sopimusrivien-aukot`, ei
`kysely-3`). Kun päivität kyselyä, päivitä *Todennettu* ja hakemiston rivi — vanha versio ei jää
talteen, joten kirjoita *Huomiot*-kohtaan mitä muuttui ja miksi.
