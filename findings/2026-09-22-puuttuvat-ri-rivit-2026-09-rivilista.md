# Rivilista: 171 pyörää joilta puuttuu 09/2026 raportointirivi

**Data:** [`2026-09-22-puuttuvat-ri-rivit-2026-09.csv`](2026-09-22-puuttuvat-ri-rivit-2026-09.csv)
(171 riviä, UTF-8 BOM, pilkkuerotin). Taustaraportti:
[`2026-09-22-puuttuvat-ri-rivit-2026-09.md`](2026-09-22-puuttuvat-ri-rivit-2026-09.md).

**Haettu NetSuitesta 22.09.2026, vain luku.** Mitään ei ole kirjoitettu. Tämä on *analyysilista*,
ei import-tiedosto: puuttuvaa riviä ei voi importata Internal ID:llä, ja kausi 09/2026 on jo
toimitettu (ks. *Varoitukset*).

## Populaatio

Sama kolmen ehdon rajaus kuin taustaraportissa: rekisterin `custrecord_sta_bike_status` ∈ {1,2,3}
(= `ri_creation`:n oma hakusuodatin), `custrecord_sta_subsc_start_date` ≤ 01.09.2026, ei yhtään
ei-Deleted riviä raportointipäivälle 01.09.2026, eikä Ended-riviä 01.09.2026:lle tai aiemmin
(sääntö A2 ⇒ puuttuu perustellusti). Tulos 171.

## Sarakkeet

| Sarake | Mitä on | Lähde |
|---|---|---|
| `bike_id` | pyörärekisterin Internal ID | todennettu |
| `reg_status`, `oomi` | rekisterin status (1/2/3), `oomi = kyllä` kun order type 3 | todennettu |
| `employer_id`, `employer` | `custrecord_sta_contract_employer` → RI:n `employer` (D2) | todennettu |
| `enduser_id`, `enduser` | `custrecord_sta_enduser` → RI:n `end_user` | todennettu |
| `lease_start` | `custrecord_sta_subsc_start_date` → RI:n `lease_start_date` | todennettu |
| `lease_end`, `end_source` | COALESCE(exceptional, oomi_exceptional, subsc_end) ja mistä kentästä se tuli | todennettu |
| `ehdotettu_status` | **päätelty** säännöistä A1–A4 (ks. alla) | päätelty |
| `ehdotettu_fee`, `fee_lahde` | item 30 -sopimusrivin `price_month` ja mistä rivistä | todennettu arvo, päätelty valinta |
| `tax_exemption` | `custrecord_gbb_verovapaa` (T/F) | todennettu |
| `cost_center`, `employee_id`, `additional_info` | rekisterin vastaavat kentät (D2) | todennettu |
| `liab_method`, `liab_settled_at` | velvoitetodiste — statuspäättelyn syöte | todennettu |
| `ri_name_ehdotus` | `Työnantaja_<bike_id>_2026-09` nimeämiskäytännön mukaan | päätelty |
| `syy` | **miksi rivi puuttuu** (L1/L2-L3/L4) + poistetun tai estävän rivin RI-id | todennettu |
| `poistetun_rivin_loki` | poistetun 09/2026-rivin `automation_logs`, 200 merkkiä | todennettu |

`ehdotettu_status`-sääntö: kausi ohi (`lease_end` < 01.09.2026) **ja** status 2/3 **ja**
`liab_settled_at` on ⇒ `4 Ended`; kausi ohi ilman todistetta ⇒ `1 Active` + A4:n lokimerkintä;
`lease_start` = 01.09.2026 ⇒ `2 Active/New`; muuten `1 Active`.
Jakauma: **169 × Active, 1 × Ended (11138), 1 × Active/A4 (17530, testipyörä)**.

## Vuokra-arvo on nyt johdettavissa 162/171 pyörälle

| Hintalähde | Pyöriä |
|---|---|
| Item 30 -rivi joka kattaa 01.09.2026 **ja on saman työnantajan** sopimuksella | **162** |
| A7:n "lähin" — ainoa item 30 -rivi alkaa vasta **01.11.2026**, hinta 79,681275 | 8 |
| Ei yhtään hintalähdettä | 1 (17530, testipyörä) |

Tämä on juurisyyn suora todiste: elokuun ajo kirjoitti Warningin `Vastaavaa tilausriviä ei
löytynyt`, ja ne sopimusrivit ovat nyt olemassa. **Tieto puuttui vain ajohetkellä.**

Ne 8 pyörää (46737, 46738, 46742, 46743, 46744, 46745, 46829, 46832) ovat eri tapaus: rekisterin
vuokra alkoi 06–08/2026 mutta sopimusrivi alkaa 01.11.2026. CSV:ssä niille on `A7 lahin`-arvo
79,681275, mutta **se on tulevaisuuden hinta — älä käytä sitä päättämättä ensin**, onko
kesä–lokakuu veloitukseton käyttöönottojakso vai puuttuuko sopimusrivi. Viisi näistä on jo saanut
kaudelle 2026-10 rivin (RI 116352–116356) arvolla **0**.

## Varoitukset

- Kausi 09/2026 on toimitettu. Rivin luonti jälkikäteen ei muuta toimitettua palkka-aineistoa;
  puuttuvien vähennysten hoito on hyvitys-/jälkiveloituspäätös.
- **Syyskuun CSV:tä ei saa ajaa uudelleen** (`PROJEKTIN_TILA.md`): backfillin 11 115 Ended-riviä
  ovat raportointipäivällä 01.09.2026 ja läpäisisivät T1-suodattimen.
- `ri_creation`-uusintaajo 01.09.2026:lle **luo myös ne 143 käsin siivottua riviä uudelleen** —
  Deleted-rivi ei osu duplikaattiavaimeen `bikeId|1`.
- RIVISAANNOT A9:n päätös 10.09.2026 kieltää ajot Oomi-pyörille ennen A9:n korjausta. Populaatio on
  lähes kokonaan Oomi.
- `employee_id` puuttuu 122 pyörältä — **sääntö D13: ei ole virhe**, ei estä rivin luontia.

## Todennettu vs. päätelty

Todennettu SuiteQL:llä 22.09.2026: kaikki rekisterikentät, RI-rivien id:t, statukset, päivämäärät
ja lokitekstit, sopimusrivien kaudet ja hinnat, populaation koko 171.
Päätelty: `ehdotettu_status`, `ri_name_ehdotus`, hintalähteen valinta A7:n mukaan, ja luokittelu
L1/L2/L4 (mekaaninen sääntö rivihistoriasta — poikkeaa muutamalla pyörällä taustaraportin
käsinluokittelusta, joka otti huomioon myös lokitekstin).
