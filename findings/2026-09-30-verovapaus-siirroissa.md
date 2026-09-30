# Verovapaus jäi T:ksi syyskuun Siirto TA -siirroissa (30.09.2026)

Sääntö: [`docs/verovapaus-saannot.md`](../docs/verovapaus-saannot.md). Tyypin 1 siirron jälkeen `verovapaa` = F
rekisterissä ja uuden työnantajan RI-riveillä. Omistava repo korjaukselle: automaatio puuttuu kaikista
repoista (paras paikka `netsuite-subscrption-cr-scripts`, `cr_bike_register_apply`). Data on korjattava käsin / CSV:llä.

**Rajaus:** tyypin 1 Done-CR:t, joilla siirtopäivä (`official_end` + 1) on syyskuussa 2026, TAI `start_date` on 1.9./1.10.2026,
TAI CR on luotu syyskuussa. Osumia 58. Pending- tai Needs Review -tilaisia osumia ei ole. Tyypin 9 CR on vain pyörillä
B033697 ja B026614, ja molemmilla on F. **Yksikään T-tapaus ei selity konsernisiirrolla.**

## Rekisteri (todennettu NetSuitesta)

- **31/58 pyörällä on T**, 27:llä F.
- Neljällä siirto ei ole vielä toteutunut rekisterissä (vanha työnantaja): B008409 (CR 6092), B029874 (6181),
  B017961 (6818, alkaa 1.11.) ja B028437 (6832).
- **Systemnote, 3 esimerkkiä (B008409, B017961, B029874):** `verovapaa` F → T **06.08.2026 klo 16:59–17:11**, eli
  ennen siirto-CR:ien luontia (9.9.–28.9.). Päätelty: T tuli massapäivityksestä tai tuonnista 6.8., ei siirrosta.
  **Avoin: mitä 6.8. ajettiin, ja koskiko se muitakin kuin siirtopyöriä?**

## RI-rivit (todennettu NetSuitesta)

| Kuukausi | Uuden työnantajan elävät rivit | T | F |
|---|---|---|---|
| 9/2026 (toimitettu) | 41 | 31 | 10 |
| 10/2026 | 21 | **14** | 7 |

- 30 T-riviä on pyörillä, joilla rekisterissä on T (periytyi). 15 syyskuun T-riviä on pyörillä, joilla rekisteri on jo F
  (vain rivikorjaus).
- Vanhan työnantajan rivejä, joilla F ja rekisterissä T: 0.

## Huominen ajo (päätelty koodista)

- `mr_monthly_reporting_ri_creation.js:80`, `:498`, `:616`, `:828`, `:884` kopioivat rekisterin arvon jokaiseen uuteen riviin.
  `:723` kirjoittaa sen myös Ended-päivitykseen.
- `ri_update.js:725-734` kirjoittaa arvon vain `[To-add:`-riveille.
- **Jos rekisteriä ei korjata ennen 1.10. ajoa, lisää T-rivejä syntyy noin 10:lle Active-pyörälle.** Lisäksi 1.11. syntyy
  T-rivejä pyörille 32028, 13794, 26475 ja 17961, jos rekisteri on silloin yhä T.
- Olemassa olevat 14 lokakuun T-riviä vaativat erillisen rivikorjauksen. Rekisterin korjaus ei korjaa niitä.

## Rekisterin T-tapaukset (31)

```
pyora,br_id,cr_id,vanha_ta,uusi_ta,siirtopaiva
B018493,18493,4270,,Martela Oyj,2026-07-01
B029015,29015,4279,,Sofokus Oy,2026-07-01
B011511,11511,4301,,Tuusulanjärven Lämpö Oy,2026-06-01
B012832,12832,4406,,Polarel Oy,2026-02-01
B033042,33042,4552,,Auto-Mäenpää Oy,2026-04-01
B035626,35626,4917,,Napapiirin Kuituverkot Oy,2026-08-01
B005265,5265,4920,,Napapiirin Kuituverkot Oy,2026-08-01
B020454,20454,4923,,Napapiirin Kuituverkot Oy,2026-08-01
B011367,11367,4926,,Napapiirin Kuituverkot Oy,2026-08-01
B038350,38350,5272,,Tampereen Vuokra-asunnot Oy,2026-10-01
B043354,43354,5317,,Lapin Yliopisto,2026-08-01
B007243,7243,5465,,Jungheinrich Lift Truck Oy,2026-08-01
B034927,34927,5484,,Tabox Services Oy,2026-08-01
B032028,32028,5991,,LVI-Aitta Oy,2026-06-01
B036758,36758,5994,,Mikkelin Valokuvausliike Oy,2026-07-01
B013794,13794,6036,,Jsb Rakennus Ab,2026-06-01
B026475,26475,6042,,Nuikos Oy,2026-07-01
B033371,33371,6045,,Zalaris HR Services Finland Oy,2026-10-01
B028198,28198,6050,,Lapin ammattikorkeakoulu Oy,2026-09-01
B033554,33554,6054,,Zalaris HR Services Finland Oy,2026-10-01
B008409,8409,6092,Aurajoki Oy,ATA-Henkilöstöpalvelut Oy,2026-07-01
B029874,29874,6181,Spbox Oy,KL-Kuljetuspalvelut Oy,2026-10-01
B033972,33972,6537,,Metso Finland Oy (FI01),2026-10-01
B016298,16298,6599,,VK-Murskaus Oy,2026-10-01
B026973,26973,6652,,Sweco PM Oy,2026-10-01
B030311,30311,6734,,Metso Finland Oy (FI01),2026-10-01
B012385,12385,6807,,Quant Finland Oy,2026-10-01
B017961,17961,6818,Asennuskolmio Oy,Steel-Prisma-Metallit Oy,2026-11-01
B028437,28437,6832,Snellmanin Kokkikartano Oy,Quant Finland Oy,2026-10-01
B009498,9498,6859,,Oy Nautor Ab,2026-06-01
B010548,10548,6862,,Pirkan Rakentajapalvelu Oy,2026-09-01
```

Sarake `siirtopaiva` on agentin raportoima. Osa arvoista on selvästi ennen syyskuuta (ehto C: CR luotu syyskuussa). Tarkista
tarkka päivä CR:stä ennen CSV:tä.

## Uuden työnantajan T-rivit (45)

```
pyora_br_id,ri_id,kuukausi,status,tyonantaja,cr_id,rekisteri_verovapaa
28817,73019,2026-09,1,Admicom Oyj,4416,F
23695,88511,2026-09,2,Arctic Drilling Company Group Oy,5140,F
33042,76454,2026-09,1,Auto-Mäenpää Oy,4552,T
19737,88713,2026-09,4,Avesco Oy,5261,F
19737,89110,2026-09,1,Avesco Oy,5261,F
26550,71187,2026-09,1,Bravida Finland Oy,4267,F
28518,89911,2026-09,2,ESE-Tekniikka Oy,5285,F
33665,76953,2026-09,1,Finnos Oy,4403,F
27942,72305,2026-09,1,Isännöitsijätoimisto Hanninen Oy,4537,F
23356,68639,2026-09,1,Jekotek Oy,4409,F
43354,93511,2026-09,1,Lapin Yliopisto,5317,T
18493,64910,2026-09,1,Martela Oyj,4270,T
36758,92712,2026-09,4,Mikkelin Valokuvausliike Oy,5994,T
36758,92911,2026-09,1,Mikkelin Valokuvausliike Oy,5994,T
5265,88517,2026-09,1,Napapiirin Kuituverkot Oy,4920,T
11367,88521,2026-09,1,Napapiirin Kuituverkot Oy,4926,T
20454,88519,2026-09,1,Napapiirin Kuituverkot Oy,4923,T
35626,88515,2026-09,1,Napapiirin Kuituverkot Oy,4917,T
20514,88509,2026-09,1,Nostoykköset Ab,5168,F
6540,88525,2026-09,1,Oulunkylän kuntoutuskeskus sr,4980,F
12832,60433,2026-09,1,Polarel Oy,4406,T
35122,88523,2026-09,1,Riikinvoima Oy,4970,F
29015,94444,2026-09,4,Sofokus Oy,4279,T
16347,63221,2026-09,1,Someron Säästöpankki,4273,F
33697,90711,2026-09,2,Stora Enso Oyj,5282,F
34927,91611,2026-09,4,Tabox Services Oy,5484,T
34927,91812,2026-09,1,Tabox Services Oy,5484,T
28198,102812,2026-09,2,Lapin ammattikorkeakoulu Oy,6050,T
7243,91831,2026-09,2,Jungheinrich Lift Truck Oy,5465,T
11511,59399,2026-09,1,Tuusulanjärven Lämpö Oy,4301,T
25055,69986,2026-09,1,Virra Talotekniikka Oy,4421,F
8409,115634,2026-10,2,ATA-Henkilöstöpalvelut Oy,6092,T
29874,115742,2026-10,2,KL-Kuljetuspalvelut Oy,6181,T
43354,117265,2026-10,1,Lapin Yliopisto,5317,T
30311,117083,2026-10,2,Metso Finland Oy (FI01),6734,T
33972,116264,2026-10,2,Metso Finland Oy (FI01),6537,T
9498,118075,2026-10,2,Oy Nautor Ab,6859,T
10548,118077,2026-10,2,Pirkan Rakentajapalvelu Oy,6862,T
12385,117387,2026-10,2,Quant Finland Oy,6807,T
28437,117582,2026-10,2,Quant Finland Oy,6832,T
26973,116864,2026-10,2,Sweco PM Oy,6652,T
38350,93011,2026-10,2,Tampereen Vuokra-asunnot Oy,5272,T
16298,116598,2026-10,2,VK-Murskaus Oy,6599,T
33371,94018,2026-10,2,Zalaris HR Services Finland Oy,6045,T
33554,102811,2026-10,2,Zalaris HR Services Finland Oy,6054,T
```
