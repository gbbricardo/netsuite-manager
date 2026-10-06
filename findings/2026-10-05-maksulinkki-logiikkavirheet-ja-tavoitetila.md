# Loppulunastuksen maksulinkki: ensimmäisen tuotantoajon paljastamat logiikkavirheet ja tavoitetila

Omistava repo: `netstuite-send-end-redemption-payment-link` (script 1479, `customscript_gbb_mr_eredem_paylink`). Koodiviitteet ovat versiosta
HEAD `210c82d`. Tuotannon tiedostoa ei ole verrattu repoon.
Kirjoitettu 5.10.2026. Lähteinä ensimmäinen tuotantoajo 1.10.2026, sen jälkiselvitykset 2.–5.10. ja tuoteomistajan päätökset samoilta päiviltä.
(N) = todennettu NetSuitesta, (K) = päätelty koodista. Päätökset on merkitty **[päätetty pv]**.

Raportti kuvaa säännöt ja skenaariot yleisellä tasolla, eikä niissä viitata yksittäisiin pyöriin. Pyöräkohtainen aineisto on liitteenä mainituissa tiedostoissa.

---

## 1. Yhteenveto

Ensimmäinen ajo oli teknisesti puhdas (N): 830 pyörää valittiin, 748 linkkiä lähti Paylinkiin, eikä yhtään virhettä, tuplaleimaa tai epäonnistunutta
sähköpostia syntynyt. Paylinkiin mennyt summa täsmäsi lokin laskelmaan jokaisella linkillä. **Liiketoimintalogiikassa paljastui kuitenkin kolme virhettä,
jotka vaikuttavat rahaan:**

| # | Virhe | Vaikutus 1.10. ajossa (N) |
|---|---|---|
| L1 | Huoltohyvitys lasketaan sopimuksen **pidennyksestä**, ei **huoltosummasta** | 6 linkkiä liian pienellä summalla, yhteensä noin 720 € brutto. 4 pyörää kirjattiin virheellisesti tavalla 3 (noin 598 €) |
| L2 | **Negatiivista huoltosummaa** ei hyvitetä, jos sopimusta ei ole pidennetty | 3 linkkiä liian suurella summalla, yhteensä noin 293 € brutto. Kahdelle niistä ei olisi pitänyt lähettää linkkiä lainkaan |
| L3 | Valinta päästää läpi pyörät, joille **lunastuspyyntö oli jo lähetetty** tai joiden **jälkiveloitus oli jo käynnissä** | 7 ylimääräistä maksulinkkiviestiä. Kuudella pyörällä kaksi maksettavaa tilausta |

Lisäksi löytyi viisi virhettä, jotka eivät suoraan vaikuta rahaan: L4 (tapa 3/4 kirjoitetaan jälkiveloituspyörälle), L5 (pidennyksen lähteitä verrataan
vain kyllä/ei-tasolla), L6 (samat ohitetut pyörät toistuvat joka päivän digestissä), L7 (testiajo kirjoittaa tuotantokenttiin) ja L8 (tuotenimi on
reititysavain).

Kaikki 739 muuta linkkiä noudattivat tavoitesääntöä (N): 643 täyttä hintaa ja 96 oikeaa huoltohyvitystä (0,78–63,74 € netto).

**Ennen seuraavaa kohorttiajoa 31.10.2026 on korjattava L1, L2 ja L3.** Ilman niitä marraskuun simulointi tuottaa samat virheluokat uudelleen (K):
3 negatiivisen summan pyörää saisi yhteensä 247,81 € liian suuren linkin, ja jälkiveloituspyörät palaavat valintaan joka kuukausi.

---

## 2. Prosessi, johon skripti kuuluu [päätetty 2.10.]

```
1. Maksulinkki (tämä skripti) lähtee ennen sopimuksen päättymistä: 30 päivän ikkuna, päivittäin
2. Loppukäyttäjä ei maksa ajoissa
3. netsuite-subscription-extension tekee jälkiveloituksen (tyypin 7 CR) → handler_jalki laskuttaa ylimääräisen kuukauden
   ja siirtää subsc_end_date:a kuukaudella
4a. Lunastusmaksu saapuu → tapa 1, pyörä lunastetuksi
4b. Maksua ei tule → vuokria laskutetaan, kunnes maksu saapuu tai ylimääräiset vuokrat kattavat lunastusmaksun (tapa 2)
```

Seurauksia skriptille:
- **Linkki lähtee kerran ja vain vaiheessa 1.** Pyörä, joka on jo vaiheessa 3–4, ei saa linkkiä.
- **Skripti ei koskaan vähennä jälkiveloitusvuokria hinnasta.** Kun linkki lähtee oikeaan aikaan, vuokria ei vielä ole. Vuokrien ja lunastuksen
  välinen kattavuus on jälkiveloitusketjun asia.
- **Kattavuuden vertailukohta on sama luku, jonka linkki pyytää** [päätetty 2.10.]: maksetut jälkivuokrat (vuokra + toimistokulu, veroton) ≥
  *lunastushinta − huoltohyvitys*. ADR 0009 k. 5:n sanamuoto (*≥ `end_redemption_price`*) päivitetään tähän.
- **Symmetria:** `netsuite-subscription-extension` kirjoitetaan uudelleen niin, että se lukee samat säännöt (TASKS § *Auki, ei päivää*). Jos selvitystapa
  on asetettu tai lunastushinta on 0 €, pyörää ei pidennetä [päätetty 5.10.].

---

## 3. Hinnoittelu

### 3.1 Käsitteet

| Käsite | Lähde | Huom. |
|---|---|---|
| Lunastushinta | `custrecord_sta_end_redemption_price` | netto |
| Huoltosumma | `custrecord_sta_maintenance_sum` | netto. Voi olla 0, tyhjä tai **negatiivinen** (hyvitetty huolto). Tyhjä tulkitaan nollaksi |
| Huoltoporrastaulu | `customrecord_sta_maint_extending_months` | rivit 0–N kk. Yläraja brutto: 0 kk 0,00; 1 kk 80,99; sen jälkeen +80,00 €/kk (160,99; 240,99; …). Netto = brutto / 1,255 (1 kk 64,53; 2 kk 128,28; 3 kk 192,02; 4 kk 255,77; 5 kk 319,51; 6 kk 383,26; 7 kk 447,00). **Ensimmäinen porras on 0,99 € brutto muita leveämpi** |
| Pidennys | `ROUND(MONTHS_BETWEEN(subsc_end_date, subsc_org_end_date))` | **kaikki** päättymispäivän siirrot: huolto **ja** jälkiveloitus |
| Huoltopidennysrivit | `customrecord_sta_ca_agreement_row.custrecord_sta_is_prolongation_line = 'T'` | todistaa, että huolto on pidentänyt sopimusta |

### 3.2 Tavoitekaava [päätetty 2.–5.10.]

```
huoltoporras   = pienin porras, jonka netto-yläraja ≥ huoltosumma        (vain kun huoltosumma > 0)
huoltohyvitys  = huoltoporras.yläraja − huoltosumma                       kun huoltosumma > 0
               = 0 − huoltosumma  (= |huoltosumma|, kokonaan, ei kattoa)  kun huoltosumma ≤ 0
linkin netto   = lunastushinta − huoltohyvitys
linkin brutto  = round2(linkin netto × 1,255)                             puoli senttiä ylöspäin
```

- **Pidennys ei vaikuta hyvitykseen.** Hyvitys määräytyy pelkästä huoltosummasta.
- Kun huoltosumma > 0, hyvitys on aina pienempi kuin portaan leveys, eli enintään 64,52 € netto.
- **Negatiivinen huoltosumma hyvitetään kokonaan** [päätetty 5.10.]. Sille ei ole ylärajaa.
- Jos linkin netto ≤ 0 tai brutto alittaa Paylinkin minimin 0,65 €, linkkiä ei lähetetä. Tilalle kirjataan tapa 3 (kohta 4, S4).

**Laskuesimerkit (keksityt luvut):**

| Tilanne | Lunastushinta | Huoltosumma | Huoltoporras | Hyvitys | Linkki netto | Linkki brutto |
|---|---|---|---|---|---|---|
| Ei huoltoa | 140,00 | 0 | — | 0,00 | 140,00 | 175,70 |
| Huoltoa, yksi porras | 140,00 | 50,00 | 1 kk (64,53) | 14,53 | 125,47 | 157,46 |
| Huoltoa, kaksi porrasta | 140,00 | 100,00 | 2 kk (128,28) | 28,28 | 111,72 | 140,21 |
| Huolto täsmälleen portaan rajalla | 140,00 | 128,28 | 2 kk (128,28) | 0,00 | 140,00 | 175,70 |
| Negatiivinen summa, osittain | 140,00 | −50,00 | — | 50,00 | 90,00 | 112,95 |
| Negatiivinen summa kattaa hinnan | 60,00 | −80,00 | — | 80,00 | ≤ 0 | **ei linkkiä, tapa 3** |
| Hyvitys kattaa hinnan | 20,00 | 70,00 | 2 kk (128,28) | 58,28 | ≤ 0 | **ei linkkiä, tapa 3** |

### 3.3 Nykyinen kaava (14.9.2026 päätös) ja miksi se on väärä

```
pidennys = päivämäärien ero (kuukausina)
jos pidennys = 0              → hyvitys 0                                            ← L2
muuten  porras = se, jonka prolong_months = pidennys                                 ← L1
        hyvitys = porras.yläraja − huoltosumma
```
(`lib_gbb_redemption_price.js:141-183`, pidennyksen lähde `gbb_mr_send_end_redemption_paylink.js:359-360`.)

**L1, pidennys ankkurina.** Pidennys sisältää myös jälkiveloituskuukaudet, koska `handler_jalki` siirtää päättymispäivää jokaisella kuukaudella.
Jokainen jälkiveloituskuukausi nostaa hyvitystä yhdellä portaalla, eli noin 63,75 € netto (80,00 € brutto).
*Esimerkki:* hinta 140, huolto 100 (2 kk) ja kaksi jälkiveloituskuukautta, jolloin pidennys on 4 kk. Nykyinen hyvitys on 255,77 − 100 = 155,77,
joten hinta leikkautuu nollaan ja skripti kirjaa tavan 3. Tavoite on 28,28 €:n hyvitys ja 140,21 €:n linkki.
14.9. päätöksen tarkoitus oli hyvittää tilanne, jossa huoltolasku hyvitetään mutta pidennys jää voimaan. Tavoitekaava hoitaa saman tilanteen
suoraan huoltosummasta: hyvitetty huolto pienentää summaa, ja negatiivinen summa hyvitetään kokonaan.

**L2, negatiivinen summa ilman pidennystä.** Rivi `lib:163-165` palauttaa hyvitykseksi 0, eikä se katso summaa.
*Esimerkki:* hinta 140 ja summa −50. Nykyinen linkki on 175,70 €, tavoite 112,95 €.

**Korjauskohdat:**
- `lib_gbb_redemption_price.js:170`: `brackets.find(b => b.prolongMonths === months)` korvataan rivin 141 `impliedBySum`:lla. Kun summa ≤ 0, yläraja on 0.
- `lib:163-165`: *"pidennys 0 → hyvitys 0"* poistetaan.
- `extensionMonths` jää vain eheystarkistukseen (S11).
- Lib:n dokumentaatio (`:21-34`, *"The anchor is the lease extension"*) ja `docs/DEPLOYMENT.md:268` (*Refund anchor*) päivitetään. **Muut 14.9. päätökset jäävät voimaan** [päätetty 2.10.].

**Testitapaukset** (`test/run_tests.js`, kohdan 3.2 taulukko sekä L1-esimerkki): pidennys 4 kk, huolto 100 → hyvitys 28,28 (ei 155,77). Pidennys 0, summa −50 → hyvitys 50.

---

## 4. Valinta ja tarkistukset: skenaariot

Järjestys on merkitsevä. Ensimmäinen täyttyvä ehto ratkaisee, eikä pyörää käsitellä pidemmälle.

| # | Skenaario | Nykyinen toiminta | Tavoite |
|---|---|---|---|
| S1 | OOMI-pyörä | rajattu pois valinnassa (`:292`) | **ennallaan.** OOMI:lla on oma prosessi |
| S2 | Pyörä ei ole Active | rajattu pois (`:291`) ja tarkistettu uudelleen (`:422`) | ennallaan |
| S3 | Selvitystapa on jo asetettu | rajattu pois (`:294`) ja tarkistus 2 (`:435`) | ennallaan. Tapaa ei koskaan ylikirjoiteta |
| S4 | **Linkki on jo lähetetty, joko tällä skriptillä tai aiemmin käsin** | vain skriptin oma lippu `custrecord_gbb_eredem_link_sent` (`:293`, `:428`). Käsin lähetetyt eivät näy → **L3** | **Ohita, jos pyörällä on mikä tahansa Paylink-tilaus tuotteella *Työsuhdepyörän loppulunastus*, tilasta riippumatta** (`customrecord_payment_requests`: `custrecord_pl_ns_bike_id` tai `custrecord_pl_notes` = pyörän `externalid`). Lisäksi kertaluontoinen täyttö: `link_sent` = T kaikille, joille linkki oli lähetetty edellisellä järjestelmällä [päätetty 2.10.]. *Edellytys täyttyi 3.10.: paylink-order-tracking tuo nyt myös maksamattomat tilaukset NetSuiteen* |
| S5 | **Jälkiveloitus on jo käynnissä** (Done-tilainen tyypin 7 CR *pidennys – jälkiveloitus*) | ei tarkistusta. Pyörä palaa valintaan, kun `handler_jalki` siirtää päättymispäivän ikkunaan, koska lattia `not_before` rajaa liikkuvaa päivää → **L3** | **Ohita.** Pyörä on prosessin vaiheessa 4b, ja sen loppu ratkeaa jälkiveloitusketjussa. Tunnistus: CR-tyyppi 7, tila Done, `altname` sisältää *pidennys*. Siirtopaketin *2A - jälkiveloitus* ei ole jälkiveloitus tässä mielessä. **Lattiaa ei vaihdeta `org_end`:iin**, koska silloin oikeat pyörät, joiden huolto siirsi päättymisen ikkunaan, putoaisivat pois (1.10.: 95 pyörää) |
| S6 | Lunastus-SO on jo olemassa tai `end_red_so_created` = T | ohitetaan (`:443-454`) | ennallaan. Huom. L7: lippu vaihtui yhdellä pyörällä ajojen välissä T:stä F:ksi. Tarkistettava paylink-post-processorin ja muiden kirjoittajien osalta |
| S7 | Lunastushinta puuttuu tai on negatiivinen | ohitetaan ja raportoidaan (`:458-466`) | ennallaan |
| S8 | **Lunastushinta = 0 €** (esim. itsehankinta, jossa käsiraha on maksettu) | tapa 4 `redemption_down_payment` + `liab_settled_at` = ajopäivä, ei linkkiä (`:470-474`) | ennallaan. Hinta 0 = ei maksettavaa eikä pidennystä [päätetty 5.10.] |
| S9 | Pidennyksen lähteet ovat ristiriidassa (päivät sanovat pidennetty, huoltorivit eivät, tai päinvastoin) | NOT_PRICED (`:477-483`) | **Säilytetään eheystarkistuksena** (L5), mutta S4 ja S5 ajetaan ennen sitä. Silloin jälkiveloituspyörät eivät enää päädy tähän. Tarkenne: vertailun pitää koskea **huoltopidennystä** (pidennys miinus jälkiveloituskuukaudet), ei kaikkia siirtoja |
| S10 | Pidennys on lyhyempi kuin huoltosumma edellyttää | NOT_PRICED (`lib:154-159`) | **Avoin päätös.** Tavoitekaava ei tarvitse pidennystä, joten pyörä voitaisiin hinnoitella. Datan eheyden kannalta tämä on kuitenkin poikkeama (huoltopidennys puuttuu) |
| S11 | Huoltosumma ylittää ylimmän portaan | NOT_PRICED (`lib:142-147`) | ennallaan |
| S12 | **Hyvitys kattaa koko hinnan** (linkin netto ≤ 0 tai brutto < 0,65 €) | tapa 3 `redemption_maint_budget` + `liab_settled_at` = ajopäivä (`:501-505`) | ennallaan, mutta tavoitekaavalla. Koskee myös negatiivista summaa, joka kattaa hinnan [päätetty 5.10.]. Ei linkkiä eikä viestiä |
| S13 | Muu: linkki | `sendPaymentLink` (`:509`) | linkki tavoitekaavan summalla. Leima `link_sent` = T |

**L4, tapa 3/4 jälkiveloituspyörälle.** Kun S5 lisätään ennen S8:aa ja S12:ta, tapaa 3/4 ei enää kirjoiteta pyörälle, jonka jälkiveloitus on käynnissä.
Tällainen pyörä päättyy tavalla 2. Erillistä vartijaa ei tarvita, jos järjestys pidetään.

---

## 5. Muut korjattavat

| # | Virhe | Nykyinen | Tavoite / ehdotus |
|---|---|---|---|
| L6 | Digestin toisto | NOT_PRICED- ja SKIP-pyöriä ei leimata, joten samat rivit toistuvat joka päivä (1.10. ja 2.10.: 69) | S4:n ja S5:n jälkeen joukko pienenee olennaisesti. Jäljelle jääneet näytetään vain ensimmäisellä kerralla tai erillisenä *uudet tänään* -osiona. **Avoin** |
| L7 | Testiajo kirjoittaa tuotantoon | live-ajo `test_bike_id`:llä Paylink-testiympäristöä vasten kirjoitti silti oikean tavan 3 ja `liab_settled_at`:n, koska settlement ei ole Paylink-kutsu | testiympäristön ajossa ei kirjoiteta rekisteriin (tai vain `dry_run`). **Avoin** |
| L8 | Tuotenimi on reititysavain | parametri `custscript_gbb_eredem_item_title` reitittää paylink-order-trackingin `PRODUCT_MAP`:issa (`paylink_ns_processor.ue.js:28`) | lukitaan arvo tai varoitetaan poikkeamasta. S4:n tunnistus käyttää samaa nimeä |
| — | `liab_settled_at` tapa 1:llä | status-syncin osa A kirjoittaa tavan 1 ilman päivää (3.10.: 279 pyörää) | ei tämän repon vika. Korjataan status-sync 2.0:ssa tai CSV:llä (TASKS T38) |

---

## 6. Hyväksymiskriteerit ennen 31.10. ajoa

1. `test/run_tests.js` kattaa kohdan 3.2 esimerkit, L1-esimerkin ja L2-esimerkin.
2. Kertatäyttö `link_sent` = T on tehty. Tarkistus: yksikään Active-pyörä, jolla on loppulunastustilaus, ei jää ilman lippua.
3. Koko 30.11. kohortin dry run (`days_before` väliaikaisesti ≥ 30), jossa:
   - yksikään `DRY_RUN`/SENT-pyörä ei saa olla sellainen, jolla on Done-tilainen jälkiveloitus-CR tai olemassa oleva loppulunastustilaus.
   - jokainen hinta on tavoitekaavan mukainen. Kyselyt: [hintapoikkeamat](2026-10-03-maksulinkki-hintapoikkeamat.md) § *Menetelmä* ja
     [ylimääräiset viestit](2026-10-03-maksulinkki-ylimaaraiset-viestit.md).
   - tavat 3 ja 4 syntyvät vain S8:n ja S12:n ehdoilla.
4. Ensimmäisen korjatun ajon jälkeen tuplatilauskysely palauttaa 0 uutta riviä:

```sql
SELECT br.name, LISTAGG(pr.custrecord_pl_order_id || ' ' || pr.custrecord_pl_status || ' ' || pr.custrecord_pl_amount_total, ' | ') orders
FROM customrecord_sta_bike_register br
JOIN customrecord_payment_requests pr ON pr.custrecord_pl_ns_bike_id = br.id
     AND pr.custrecord_pl_product_name = 'Työsuhdepyörän loppulunastus'
WHERE br.custrecord_gbb_eredem_link_sent = 'T'
GROUP BY br.name HAVING COUNT(*) > 1
```

---

## 7. Päätökset ja avoimet kysymykset

**Päätetty:**
- 2.10.: työnkulku (kohta 2). Hyvitys huoltosummasta, ei pidennyksestä, ja muu 14.9. kaava ennallaan. `link_sent` olisi pitänyt täyttää kaikille aiemmin linkin
  saaneille. Kattavuus = hinta − huoltohyvitys.
- 5.10.: tavoitekaava on vahvistettu oikeaksi (kohta 3.2). Negatiivinen huoltosumma
  vähennetään kokonaan. Jos hyvitys kattaa hinnan, kirjataan tapa 3 ja `liab_settled_at` = ajopäivä, eikä linkkiä lähetetä. Hinta 0 → ei pidennystä.

**Avoinna:**
1. S10: hinnoitellaanko pyörä, jonka pidennys on lyhyempi kuin huoltosumma edellyttää, vai raportoidaanko se edelleen?
2. L6: digestin toiston käsittely.
3. L7: saako testiympäristön ajo kirjoittaa rekisteriin?
4. S9: lasketaanko eheystarkistuksen huoltopidennys vähentämällä jälkiveloitus-CR:t, vai riittääkö se, että S5 ajetaan ensin?

---

## Liitteet (pyöräkohtainen aineisto)

- [Ensimmäisen ajon löydös](2026-10-02-maksulinkki-ensimmainen-ajo.md): ajot, kirjoitukset, kytkökset muihin repoihin
- [Käsittelyloki](2026-10-02-maksulinkki-kasittelyloki.md): R1–R7, pyöräkohtaiset päätökset, asiakaspalvelun luovutus
- [Ylimääräiset viestit](2026-10-03-maksulinkki-ylimaaraiset-viestit.md) + [CSV](2026-10-03-maksulinkki-ylimaaraiset-viestit.csv): L3
- [Hintapoikkeamat](2026-10-03-maksulinkki-hintapoikkeamat.md) + [CSV](2026-10-03-maksulinkki-hintapoikkeamat.csv): kaikki 748 linkkiä tavoitekaavaa vasten, L1–L2, marraskuun simulointi
- TASKS T30–T38 ja § *Auki, ei päivää* (jälkiveloitusketjun uudelleenkirjoitus)
