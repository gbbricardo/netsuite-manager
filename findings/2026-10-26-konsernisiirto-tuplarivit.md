# Konsernisiirto 2A-paketissa jättää korvatut sopimusrivit aktiivisiksi (26.10.2026)

**Omistava repo:** `netsuite-subscrption-cr-scripts` (konsernisiirron käsittelijä 2A-paketin kautta: tyyppi 13 → 7, 11, 9).
**Sääntö:** [ADR 0021](../docs/adr/0021-cr-ien-kasittelysaannot.md) k. 11, [ADR 0022](../docs/adr/0022-laskutuksen-paattaminen-tai-tauotus.md) k. 3–4.
**Tila:** 14/15 pyörää korjattu käsin 26.10.2026 (tuoteomistaja), todennettu SuiteQL:llä. B033217 auki (T72). Käsittelijä korjaamatta (T71).

## Mekanismi (todennettu datasta, koodia ei luettu)

2A-paketin konsernisiirto (tyyppi 9) luo uuden sopimuksen alle kloonin, joka kattaa koko jäljellä olevan kauden CR:n `end_date`:en
asti, eli myös huoltopidennyksen kuukaudet. Vanha, tulevaisuudessa alkava huoltopidennysrivi (`is_prolongation_line` = T) tai
OOMI-pyörän viimeisen kuun osarivi jää aktiiviseksi saman asiakkaan alle. Laskutusmoottori laskuttaisi ne kuukaudet kahdesti
(35 päivän etukäteislaskutus). Konsernikäsittelijän piti olla pidennystietoinen (idea-03), mutta 2A-paketin kautta se ei ollut:
yhtään päällekkäisyyttä ei löytynyt muista siirroista.

## Pyörät ja korjaukset

Kaikki todennettu NetSuitesta 26.10.2026 korjausten jälkeen. Koko tilin päällekkäisyyskysely palauttaa vain B033217:n.

| Pyörä | Paketti (konsernisiirto) | Käsitelty | Tupla olisi alkanut | Korjaus 26.10. |
|---|---|---|---|---|
| B006208 | CR 6749 | 24.09. | 1.12.2026 | pidennysrivit 74540 / 74539 passivoitu |
| B007273 | CR 5370 | 26.08. | 1.2.2027 | 74952 / 74951 passivoitu |
| B007442 | CR 6774 | 24.09. | 1.5.2027 | 72046 / 72047 passivoitu |
| B010048 | CR 6762 | 24.09. | 1.11.2028 | 78898 / 78899 passivoitu |
| B015872 | CR 5087 | 14.08. | 1.1.2028 | 77341 / 77342 passivoitu |
| B018493 | (heinäkuu) | 8.7. | 1.12.2028 | 78969 / 78968 passivoitu |
| B020577 | CR 6768 | 24.09. | 1.3.2028 | 80327 / 80328 passivoitu |
| B044562 (OOMI, päättyy 10.5.2027) | CR 6771 | 24.09. | 1.5.2027 | kloonit 116149 / 116150 → loppu 30.4.2027, osarivit 109252 / 109253 jäävät. Kloonien hinta muuttui samalla (80,2311 → 80,23083; 12,9004 → 12,90). |
| B023726 | CR 7449 | 26.10. | 1.12.2026 | 74516 / 74515 passivoitu |
| B020422 | CR 7433 | 26.10. | 1.7.2027 | 76252 / 76251 passivoitu |
| B034522 | CR 7405 | 26.10. | 1.12.2027 | 71946 / 71947 passivoitu |
| B021041 | CR 7420 | 26.10. | 1.3.2028 | 80355 / 80356 passivoitu |
| B031152 | CR 7414 | 26.10. | 1.5.2028 | 78074 / 78073 passivoitu |
| B037449 (OOMI) | CR 7423 | 26.10. | 1.6.2029 | kloonit 116573 / 116574 → loppu 31.5.2029, osarivit 83650 / 83651 jäävät. Kloonien hinnat asetettu 79,68167 ja 15,93667 (vanha item 31 -rivi 83649 oli 0 €). |

**B033217 (auki, T72):** vain item 31. Vanha rivi 22039 (1.12.2025–31.8.2027) ja pidennysrivi 76654 (alkaa **31.10.2026**,
loppu 31.10.2027). Molempien laskutushistoriassa on `2026-11-01`, joten **marraskuun 2026 hallintamaksu (11,95 € netto) on laskutettu
kahdesti.** Item 30 -pari 76653 alkaa oikein 1.9.2027, joten 76654:n alkupäivä on väärä. Pyöräkentällä ei löydy laskua
(todennäköisesti koontilasku).

## Avoimet

- **T71:** käsittelijän korjaus (ADR 0021 k. 11). Kaksi tyypin 13 CR:ää on Error-tilassa (26.10.). Jos ne käsitellään
  uudelleen ennen korjausta, ne tuottavat saman vian.
- **T72:** B033217: rivin 76654 alkupäivä → 1.9.2027 ja marraskuun tuplahallintamaksun hyvitys.
- **T73:** SR2 käsin jokaisen siirto- tai pakettiCR-ajon jälkeen, kunnes T71 on tuotannossa.

## Kysely (SR2)

```sql
SELECT br.name, a.custrecord_sta_ca_row_item it, a.id aid, b.id bid
FROM customrecord_sta_ca_agreement_row a
JOIN customrecord_sta_ca_agreement_row b ON b.custrecord_sta_bikeid = a.custrecord_sta_bikeid
     AND b.custrecord_sta_ca_row_item = a.custrecord_sta_ca_row_item AND b.id > a.id
JOIN customrecord_sta_bike_register br ON br.id = a.custrecord_sta_bikeid
WHERE a.isinactive = 'F' AND b.isinactive = 'F' AND a.custrecord_sta_ca_row_item IN (30,31)
  AND a.custrecord_sta_ca_row_license_startdate <= a.custrecord_sta_ca_row_license_enddate
  AND b.custrecord_sta_ca_row_license_startdate <= b.custrecord_sta_ca_row_license_enddate
  AND a.custrecord_sta_ca_row_license_startdate <= b.custrecord_sta_ca_row_license_enddate
  AND b.custrecord_sta_ca_row_license_startdate <= a.custrecord_sta_ca_row_license_enddate
```
