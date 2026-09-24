# `handler_lunastus` rikkoo §5:ttä kun maksu on kirjattu ennen CR:ää

> [!IMPORTANT]
> **Ei virhe — kumottu 23.09.2026 ([ADR 0008](../docs/adr/0008-keskenkauden-lunastuksessa-cr-voittaa-maksun.md)).**
> Keskenkauden lunastuksessa muutospyynnön vastuukirjaus voittaa maksutodisteen. B025325:n
> `liab_settled_at` = CR:n luontipäivä 22.09. on **oikein**, vaikka maksu oli 17.09. Alla ehdotettua
> korjausta (`todistepaiva` handleriin) **ei tehdä**. Tilalle tulee päinvastainen vaatimus:
> handlerin on ylikirjoitettava maksusta johdettu arvo CR:n arvolla (ks. ADR 0008).

**Havaittu:** 23.09.2026 · **Tila:** kumottu (ADR 0008) · **Omistava repo:** `netsuite-subscrption-cr-scripts`
· **Vakavuus:** matala vaikutukseltaan, korkea periaatteeltaan — mittari joka ei saanut kasvaa, kasvoi

## Havainto

§5-rikkomusten määrä oli **53** koko projektin ajan ja tavoite oli *"ei kasva"*. Ensimmäisen
ajastetun CR-ajon jälkeen se on **54**.

Uusi rikkomus on **pyörä 25325 (B025325)**:

| Kenttä | Arvo |
|---|---|
| `custrecord_gbb_liab_settle_method` | 1 (`redemption_paid`) |
| `custrecord_gbb_redemption_paid_at` | **17.09.2026** |
| `custrecord_gbb_liab_settled_at` | **22.09.2026** |
| `custrecord_sta_bike_status` | 2 |

Maksu oli siis kirjattu **viisi päivää ennen** kuin CR luotiin ja käsiteltiin.

## Molemmat puolet

**Sääntö** — [`../docs/lunastuksen-kenttasaannot.md`](../docs/lunastuksen-kenttasaannot.md)
§ `custrecord_gbb_liab_settled_at`:

> **Arvo:** aikaisin todiste siitä että velvoitteet on hoidettu
> …
> **Arvoksi kirjataan aikaisin niistä.** Velvoite hoitui silloin kun ensimmäinen todiste syntyi, ei
> silloin kun järjestelmä huomasi sen.

`custrecord_gbb_redemption_paid_at` on nimenomaisesti todiste 3. Aikaisin todiste on siis
**17.09.2026**.

**Koodi** — `handler_lunastus.js` kirjoittaa `liab_settled_at`-kenttään **CR:n luontipäivän**
ehdoitta. Se korjattiin 21.09. ajopäivästä luontipäiväksi, ja se korjaus oli oikea — mutta se ei
riitä: luontipäivä on oikea arvo vain silloin kun aiempaa päivättyä todistetta ei ole.

**Kirjasto osaa tämän jo.** `onkoVelvoitteetHoidettu` palauttaa `todistepaiva`-kentässä
**aikaisimman** päivätyn todisteen, ja sen dokumentaatio sanoo sen suoraan:

> `todistepaiva` is the EARLIEST dated evidence: the liabilities were settled when the first proof
> arose, not when a script noticed. For method 1 this makes it equal to
> `custrecord_gbb_redemption_paid_at`, which is what the rule requires the write-once
> `custrecord_gbb_liab_settled_at` to hold.

Handler siis lataa kirjaston ja käyttää sitä kohdestatuksen päättelyyn, mutta **ei tähän kenttään**.

## Miksi tämä meni läpi 21.09. todennuksesta

21.09. todennettiin *"`liab_settled_at` = CR:n luontipäivä"* läpäisseeksi kolmella CR:llä. Se
todennus oli epätäydellinen: kaikilla kolmella testipyörällä ei ollut aiempaa `redemption_paid_at`-
arvoa, joten luontipäivä **oli** aikaisin todiste. Sääntö ja toteutus eroavat vain silloin kun maksu
on kirjattu ennen CR:ää, ja sitä tapausta ei ollut otoksessa.

Tämä koskee myös `CLAUDE.md`:n todennuskyselyä, joka tarkistaa
`liab_settled_at <> cr_created_date` — se **ei löydä tätä vikaa**, koska se etsii nimenomaan
poikkeamia luontipäivästä. Vika on päinvastainen: luontipäivä kirjoitettiin silloinkin kun sen ei
olisi pitänyt.

## Korjausehdotus

`handler_lunastus.js`, siinä kohdassa joka kirjoittaa `liab_settled_at`:

```js
// ei:   settledAt = crCreatedDate
// vaan:
var velvoitteet = lunastus.onkoVelvoitteetHoidettu(bike);
var settledAt = velvoitteet.todistepaiva || crCreatedDate;
```

`todistepaiva` on `null` kun ainoa todiste on päivämäärätön (maksuton selvitystapa), ja silloin
luontipäivä on oikea arvo — eli fallback säilyttää nykyisen oikean käytöksen ja korjaa vain sen
tapauksen jossa aiempi päivätty todiste on olemassa.

**Korjaus tehdään omistavassa repossa**, ei täältä.

## Oikea mittari

Nykyinen §8-kysely löytää tämän, mutta vasta jälkikäteen. Ennakoiva versio — pyörät joilla maksu on
kirjattu ja CR on yhä käsittelemättä, eli seuraavat rikkomukset:

```sql
SELECT br.id, br.name, br.custrecord_gbb_redemption_paid_at, cr.id AS cr_id, cr.custrecord_cr_created_date
FROM customrecord_sta_bike_register br
JOIN customrecord_subscrption_change_request cr ON cr.custrecord_cr_bike_registry = br.id
WHERE cr.custrecord_cr_type = 2 AND cr.custrecord_cr_status = 1
  AND br.custrecord_gbb_redemption_paid_at IS NOT NULL
  AND br.custrecord_gbb_redemption_paid_at < cr.custrecord_cr_created_date
```

Jokainen rivi on rikkomus joka syntyy kun tuo CR käsitellään. **Mitattu 23.09.2026: 1 jonossa.**
Rikkomuksia syntyy siis hitaasti, mutta ne syntyvät automaattisesti eikä mikään NetSuitessa
valita niistä.
