# 162 lokakuussa päättyvää pyörää: sweep kääntää 1.10., raportoinnin pitää pysyä Active (30.09.2026)

Tarkistus: TASKS T14 Q3 (f) ja T27. Omistava repo: `netsuite-monthly-reporting` (ri_creation) ja
`netsuite-bike-redemption-status-sync` (sweep 1440).

**Rajaus (todennettu NetSuitesta 30.09. illalla):** pyörät, joilla `custrecord_sta_bike_status` = 1,
`custrecord_gbb_liab_settle_method` on asetettu ja `custrecord_sta_subsc_end_date` on 1.–31.10.2026. Testipyörä B017530 on rajattu pois.
Tuloksena 162 pyörää.

## Odotettu tulos

| Hetki | Mitä tapahtuu | Odotus |
|---|---|---|
| 1.10. ~00:30 | Sweep 1440 (anchor on päättymiskuun 1. päivä) | status 1 → **2 Redeemed** kaikille 162:lle (tai 3 Returned, jos tapa sitä vaatii) |
| 1.10. ri_creation | Päättyminen päätetään todisteista, ei statuksesta (`mr_monthly_reporting_ri_creation.js:1106-1145`, ADR 0002 sopimusankkuri) | **lokakuun rivi on Active** kaikille 162:lle. Ei Ended- eikä Warning-riviä, eikä toista riviä |
| 1.10. ri_update | Ei lue statusta (vaihe 3). Alentaa vain, jos kausi on ohi | 162:n lokakuun rivit pysyvät Active |
| 1.11. ri_creation | raportointipäivä > päättymispäivä | Ended-rivi. 45 pyörällä se on jo olemassa (alla) |

**Päätelty koodista, ja tuotannossa todennettu yhdellä pyörällä:** 37874 (kausi päättyy 15.10.) sai 21.09. testissä
Active 1.10. + Ended 1.11. Koko populaatiota ei ole ajettu ([CLAUDE.md](../CLAUDE.md) avoin kohta 2).

## Ryhmät

| Ryhmä | Kpl | Erityistä |
|---|---|---|
| Lokakuun rivi jo olemassa (Active) | 2 | B037874 (116458), B038677 (116459). ri_creation ei saa luoda toista riviä |
| Done-tilainen tyypin 2 CR ja **marraskuun Ended-rivi jo olemassa**, ei lokakuun riviä | 45 | UE loi Ended-rivin 1.11. etukäteen. ri_creationin A2-korjaus (`:1146-1175`) ohjaa lokakuun Active-polulle, koska 1.10. < aikaisin Ended-rivi 1.11. **Tämä on ryhmä, jossa virhe todennäköisimmin näkyisi.** |
| Lokakuun **Deleted**-rivi | 1 | B046434 (103913 Deleted). Tarkista, että uusi Active-rivi syntyy eikä Deleted estä sitä |
| `liab_settled_at` tyhjä (sisältyy muihin) | 17 | tapa on asetettu, mutta päivä puuttuu. Ei vaikuta lokakuun Active-riviin; vaikuttaa 1.11. Endediin, jos kirjasto vaatii päivän |
| Muut | 114 | ei riviä, ei CR:ää; normaali Active-polku |

B037874:llä on lisäksi marraskuun Deleted-rivi 116461 testiajosta. Se ei vaikuta lokakuuhun.

## Tarkistuskysely 1.10. ri_creationin ja ri_updaten jälkeen

```sql
-- odotus: status_10 = 'Active' 162:lla; ei 'ei_rivia', 'Ended', 'Warning'; rivit = 1
SELECT br.name,
       BUILTIN.DF(br.custrecord_sta_bike_status) bike_status,
       (SELECT COUNT(*) FROM customrecord_gbb_monthly_reporting_item ri
         WHERE ri.custrecord_gbb_ri_bike = br.id
           AND ri.custrecord_gbb_ri_reporting_date = TO_DATE('2026-10-01','YYYY-MM-DD')
           AND BUILTIN.DF(ri.custrecord_gbb_ri_reporting_status) <> 'Deleted') rivit,
       (SELECT LISTAGG(BUILTIN.DF(ri.custrecord_gbb_ri_reporting_status), ',')
          FROM customrecord_gbb_monthly_reporting_item ri
         WHERE ri.custrecord_gbb_ri_bike = br.id
           AND ri.custrecord_gbb_ri_reporting_date = TO_DATE('2026-10-01','YYYY-MM-DD')) status_10
FROM customrecord_sta_bike_register br
WHERE br.id IN (/* br_id-sarake alta */)
```

Huom: 1.10. jälkeen rajausta ei voi ajaa uudelleen statuksella 1, koska sweep on kääntänyt pyörät. Käytä alla olevaa listaa.

## Pyörät (162)

`cr_2` = Done-tilainen tyypin 2 CR, `ri_11` = olemassa oleva marraskuun rivi.

```
pyora,br_id,loppu,tapa,liab_settled_at,tyonantaja,ri_10,cr_2,ri_11
B037913,37913,2026-10-01,redemption_paid,2026-09-02,Etelä-Karjalan hyvinvointialue,,,
B039752,39752,2026-10-01,redemption_paid,2026-08-24,Itä-Suomen yliopisto,,,
B042943,42943,2026-10-01,redemption_paid,2026-09-17,Kannuksen kaupunki,,,
B043755,43755,2026-10-01,redemption_paid,2026-09-15,Lapin ammattikorkeakoulu Oy,,,
B045175,45175,2026-10-01,redemption_paid,2026-09-02,Intrum Oy,,,
B040198,40198,2026-10-02,redemption_paid,2026-09-17,Pörhön Autoliike Oy,,,
B042063,42063,2026-10-02,redemption_paid,2026-09-18,Loviisan kaupunki,,,
B042831,42831,2026-10-02,redemption_paid,,Kannuksen kaupunki,,,
B044109,44109,2026-10-02,redemption_paid,2026-09-04,Fortaco Finland Oy,,,
B044533,44533,2026-10-02,redemption_paid,2026-09-07,Oral Hammaslääkärit Oy,,,
B045888,45888,2026-10-02,redemption_paid,2026-08-24,Oulun poliisilaitos,,,
B044098,44098,2026-10-03,redemption_paid,2026-08-21,Fortaco Finland Oy,,,
B045767,45767,2026-10-03,redemption_paid,2026-08-23,Porin kaupunki,,,
B038677,38677,2026-10-04,redemption_paid,2026-09-16,Etelä-Karjalan hyvinvointialue,116459,,
B039368,39368,2026-10-04,redemption_paid,2026-09-15,Etelä-Karjalan hyvinvointialue,,,
B041894,41894,2026-10-04,redemption_paid,2026-09-05,Kymenlaakson hyvinvointialue,,,
B044110,44110,2026-10-04,redemption_paid,,Fortaco Finland Oy,,,
B045104,45104,2026-10-04,redemption_paid,2026-08-21,NCC Suomi Oy,,,
B042270,42270,2026-10-05,redemption_paid,2026-08-20,Kansaneläkelaitos - KELA,,,
B043350,43350,2026-10-05,redemption_paid,2026-08-21,Valkeakosken kaupunki,,,
B040060,40060,2026-10-06,redemption_paid,2026-09-07,Etelä-Karjalan hyvinvointialue,,,
B041801,41801,2026-10-06,redemption_paid,2026-08-21,Kymenlaakson hyvinvointialue,,,
B043222,43222,2026-10-06,redemption_paid,2026-09-08,Kansaneläkelaitos - KELA,,,
B043620,43620,2026-10-06,redemption_paid,2026-08-21,Valkeakosken kaupunki,,,
B044027,44027,2026-10-06,redemption_paid,2026-08-31,"Specim, Spectral Imaging Oy Ltd",,,
B045355,45355,2026-10-06,redemption_paid,2026-09-01,Konecranes Finland Oy,,,
B046434,46434,2026-10-06,redemption_paid,2026-08-21,2M-IT Oy,103913 (Deleted),,
B041197,41197,2026-10-07,redemption_paid,2026-08-21,Kymenlaakson hyvinvointialue,,,
B041838,41838,2026-10-07,redemption_paid,2026-09-15,Kymenlaakson hyvinvointialue,,,
B043737,43737,2026-10-07,redemption_paid,2026-08-21,Lapin ammattikorkeakoulu Oy,,,
B045360,45360,2026-10-07,redemption_paid,2026-08-31,Konecranes Finland Oy,,,
B046079,46079,2026-10-07,redemption_paid,2026-08-24,Proventia Oy,,,
B038995,38995,2026-10-08,redemption_paid,2026-08-31,Noptel Oy,,,
B039067,39067,2026-10-08,redemption_paid,2026-08-20,Luvata Pori Oy,,,
B039630,39630,2026-10-08,redemption_paid,2026-09-16,CGI Suomi Oy,,,
B042938,42938,2026-10-08,redemption_paid,2026-08-20,Kannuksen kaupunki,,,
B037749,37749,2026-10-09,redemption_paid,2026-08-21,NCC Suomi Oy,,,
B038095,38095,2026-10-09,redemption_paid,2026-09-07,Etelä-Karjalan hyvinvointialue,,,
B041180,41180,2026-10-09,redemption_paid,2026-09-15,Valkeakosken seudun koulutuskuntayhtymä,,,
B045436,45436,2026-10-09,redemption_paid,2026-09-06,Konecranes Global Oy,,,
B043390,43390,2026-10-10,redemption_paid,2026-09-11,MSK Plast Oy,,,
B043471,43471,2026-10-10,redemption_paid,2026-09-11,Euran Kunta,,,
B045704,45704,2026-10-10,redemption_paid,2026-08-24,MSK Finland Oy,,,
B038542,38542,2026-10-11,redemption_paid,2026-08-21,Etelä-Karjalan hyvinvointialue,,,
B041751,41751,2026-10-11,redemption_paid,2026-08-20,Kymenlaakson hyvinvointialue,,,
B042187,42187,2026-10-11,redemption_paid,2026-09-17,Lapin Yliopisto,,,
B045209,45209,2026-10-11,redemption_paid,2026-09-04,Konecranes Finland Oy,,,
B045780,45780,2026-10-11,redemption_paid,2026-09-01,PRM-Trade Oy,,,
B039079,39079,2026-10-12,redemption_paid,2026-08-25,Lapin Hyvinvointialue,,,
B043568,43568,2026-10-12,redemption_paid,2026-09-04,Kansaneläkelaitos - KELA,,,
B044104,44104,2026-10-12,redemption_paid,2026-09-04,Fortaco Finland Oy,,,
B041364,41364,2026-10-13,redemption_paid,2026-09-04,Raahen Energia Oy,,,
B040439,40439,2026-10-14,redemption_paid,2026-08-24,Kemin kaupunki,,,
B041516,41516,2026-10-14,redemption_paid,2026-09-02,NCC Suomi Oy,,,
B042198,42198,2026-10-14,redemption_paid,2026-08-20,Lapin Yliopisto,,,
B044715,44715,2026-10-14,redemption_paid,2026-09-03,RTG Ground Handling Oy,,,
B046396,46396,2026-10-14,redemption_paid,2026-08-20,2M-IT Oy,,,
B037874,37874,2026-10-15,redemption_paid,2026-09-04,CGI Suomi Oy,116458,,116461 (Deleted)
B042554,42554,2026-10-15,redemption_paid,2026-09-16,Teleste Networks Oy,,,
B046316,46316,2026-10-15,redemption_paid,2026-09-03,Meltex Oy Plastics,,,
B045266,45266,2026-10-16,redemption_paid,,Konecranes Finland Oy,,,
B046088,46088,2026-10-16,redemption_paid,2026-09-15,Proventia Oy,,,
B041002,41002,2026-10-17,redemption_paid,2026-08-21,Vaisala Oyj,,,
B043447,43447,2026-10-17,redemption_paid,,Kymenlaakson hyvinvointialue,,,
B038056,38056,2026-10-18,redemption_paid,2026-08-21,Pörhön Autoliike Oy,,,
B038524,38524,2026-10-18,redemption_paid,,Itä-Suomen yliopisto,,,
B039520,39520,2026-10-18,redemption_paid,,2M-IT Oy,,,
B041527,41527,2026-10-18,redemption_paid,2026-08-21,Heinolan kaupunki,,,
B044499,44499,2026-10-18,redemption_paid,2026-09-15,Kuopion Energia Oy,,,
B040278,40278,2026-10-19,redemption_paid,,Etelä-Karjalan hyvinvointialue,,,
B041288,41288,2026-10-19,redemption_paid,,Rovaniemen kaupunki,,,
B046173,46173,2026-10-19,redemption_paid,2026-08-24,Itä-Suomen yliopisto,,,
B038870,38870,2026-10-20,redemption_paid,2026-08-21,Nanocomp Oy Ltd,,,
B040480,40480,2026-10-20,redemption_paid,2026-09-20,Kemin kaupunki,,,
B042361,42361,2026-10-20,redemption_paid,2026-09-04,Intrum Oy,,,
B040606,40606,2026-10-21,redemption_paid,,Kuopion Vesi Oy,,,
B042851,42851,2026-10-21,redemption_paid,,Valkeakosken kaupunki,,,
B039156,39156,2026-10-23,redemption_paid,,Hilti (Suomi) Oy,,,
B041491,41491,2026-10-23,redemption_paid,,NCC Suomi Oy,,,
B043946,43946,2026-10-23,redemption_paid,,Rovaniemen kaupunki,,,
B044266,44266,2026-10-23,redemption_paid,2026-08-24,Kymenlaakson hyvinvointialueen tuki- ja kiinteistöpalvelut Oy,,,
B044491,44491,2026-10-23,redemption_paid,2026-09-03,Servica Oy,,,
B044549,44549,2026-10-23,redemption_paid,2026-09-13,HiQ Oy,,,
B045314,45314,2026-10-23,redemption_paid,2026-08-26,Konecranes Finland Oy,,,
B040762,40762,2026-10-24,redemption_paid,2026-08-21,Servica Oy,,,
B043707,43707,2026-10-24,redemption_paid,,Koulutuskeskus Salpaus -kuntayhtymä,,,
B046210,46210,2026-10-24,redemption_paid,2026-08-20,Porin kaupunki,,,
B041971,41971,2026-10-25,redemption_paid,2026-09-02,Kymenlaakson hyvinvointialue,,,
B044392,44392,2026-10-25,redemption_paid,2026-08-21,Tiera Oy,,,
B045960,45960,2026-10-25,redemption_paid,2026-08-26,Porin kaupunki,,,
B042220,42220,2026-10-26,redemption_paid,2026-08-24,Rovaniemen koulutuskuntayhtymä,,,
B039642,39642,2026-10-27,redemption_paid,2026-08-20,Medisize Oy,,,
B042024,42024,2026-10-27,redemption_paid,2026-08-23,Jungheinrich Lift Truck Oy,,,
B042134,42134,2026-10-27,redemption_paid,2026-08-24,Lapin Yliopisto,,,
B043491,43491,2026-10-27,redemption_paid,2026-08-20,Hyria koulutus Oy,,,
B044410,44410,2026-10-27,redemption_paid,2026-09-08,Valkeakosken seudun koulutuskuntayhtymä,,,
B038298,38298,2026-10-28,redemption_paid,2026-09-02,Etelä-Karjalan hyvinvointialue,,,
B038977,38977,2026-10-28,redemption_paid,,Oy Apotti Ab,,,
B040093,40093,2026-10-28,redemption_paid,2026-09-19,Etelä-Karjalan hyvinvointialue,,,
B041552,41552,2026-10-28,redemption_paid,,Heinolan kaupunki,,,
B042256,42256,2026-10-28,redemption_paid,2026-08-31,Porvoon Kaupunki,,,
B045327,45327,2026-10-28,redemption_paid,2026-08-26,Konecranes Finland Oy,,,
B042588,42588,2026-10-29,redemption_paid,2026-09-14,Kymenlaakson hyvinvointialue,,,
B045010,45010,2026-10-29,redemption_paid,2026-09-02,Keski-Uudenmaan hyvinvointialue,,,
B039628,39628,2026-10-30,redemption_paid,,Itä-Suomen yliopisto,,,
B045546,45546,2026-10-30,redemption_paid,2026-09-05,Muovijaloste Oy,,,
B046326,46326,2026-10-30,redemption_paid,2026-08-20,Nestor Cables Oy,,,
B003488,3488,2026-10-31,redemption_paid,2026-09-17,Faba osk,,6572,116562
B005039,5039,2026-10-31,redemption_paid,2026-09-25,Oy Nautor Ab,,6806,117379
B006065,6065,2026-10-31,redemption_paid,2026-09-25,Tepsivo Oy,,6792,117369
B006956,6956,2026-10-31,redemption_maint_budget,2026-09-30,Etelä-Savon hyvinvointialue,,,
B007828,7828,2026-10-31,bike_sold_to_competitor,2026-09-25,FCG Rakennettu Ympäristö Oy,,6805,117378
B008151,8151,2026-10-31,redemption_paid,2026-09-21,Valtion koulukodit,,6624,116575
B009155,9155,2026-10-31,redemption_paid,2026-09-21,"Metsäliitto Osuuskunta, Metsä Wood",,6641,116588
B010117,10117,2026-10-31,redemption_paid,2026-09-17,Metsä Fibre Oy Keskushallinto ja Sellutehtaat,,6552,116272
B010162,10162,2026-10-31,redemption_paid,2026-09-25,Accenture Oy,,6795,117385
B010184,10184,2026-10-31,redemption_paid,2026-09-28,Annan Tilitoimisto Oy,,6835,117583
B010453,10453,2026-10-31,redemption_paid,2026-09-28,Apteekkien Eläkekassa,,6842,117774
B013315,13315,2026-10-31,redemption_paid,2026-09-21,Teollisen yhteistyön rahasto Oy,,6643,116587
B014365,14365,2026-10-31,redemption_paid,2026-09-25,Bravida Finland Oy,,6788,117382
B014549,14549,2026-10-31,redemption_paid,2026-09-25,Lappeenrannan kaupunki,,6781,117373
B015281,15281,2026-10-31,redemption_paid,2026-09-25,Etelä-Savon hyvinvointialue,,6787,117381
B016327,16327,2026-10-31,redemption_paid,2026-09-17,Keskinäinen Vakuutusyhtiö Fennia,,6569,116577
B016686,16686,2026-10-31,redemption_paid,2026-09-28,UPM-Kymmene Oyj Pulp,,6844,117776
B016856,16856,2026-10-31,redemption_paid,2026-09-25,Atea Finland Oy,,6794,117389
B017450,17450,2026-10-31,redemption_paid,2026-09-25,LapWall Oyj,,6789,117383
B018311,18311,2026-10-31,redemption_paid,2026-09-07,Metso Finland Oy (FI01),,6571,116566
B018611,18611,2026-10-31,redemption_paid,2026-09-25,Skandinaviska Enskilda Banken AB (publ) Helsingin sivukonttori,,6786,117380
B021321,21321,2026-10-31,redemption_paid,2026-09-28,Infratek Finland Oy (Omexom),,6843,117775
B021682,21682,2026-10-31,redemption_paid,2026-08-01,Colliers Finland Oy,,,
B022372,22372,2026-10-31,redemption_paid,2026-09-17,Legal Folks Oy,,6550,116270
B022719,22719,2026-10-31,redemption_paid,2026-09-21,Tampereen ammattikorkeakoulu Oy,,6642,116586
B023083,23083,2026-10-31,redemption_paid,2026-09-30,GA Telesis Engine Services Oy,,6875,118277
B023113,23113,2026-10-31,redemption_paid,2026-09-18,Metso Finland Oy (FI01),,6604,116582
B024292,24292,2026-10-31,redemption_paid,2026-09-25,Newsec Advisory Finland Oy,,6783,117374
B024397,24397,2026-10-31,redemption_paid,2026-09-28,Valtion koulukodit,,6841,117773
B024454,24454,2026-10-31,redemption_paid,2026-09-25,Ähtärin kaupunki,,6779,117371
B025076,25076,2026-10-31,redemption_paid,2026-09-21,LTP Group Oy,,6618,116596
B026437,26437,2026-10-31,redemption_paid,2026-09-25,Tikkurila Oyj,,6796,117377
B026690,26690,2026-10-31,redemption_paid,2026-09-25,"SEB Kort Bank AB, Helsingin sivuliike",,6784,117375
B026967,26967,2026-10-31,redemption_paid,2026-09-18,"Metsäliitto Osuuskunta, Konsernipalvelut",,6609,116563
B027393,27393,2026-10-31,redemption_paid,2026-09-25,Oy Lantmännen Unibake AB Finland,,6778,117394
B029676,29676,2026-10-31,redemption_paid,2026-09-25,Luumäen kunta,,6793,117384
B029767,29767,2026-10-31,redemption_paid,2026-09-25,Kuljetus Joni Koppo Oy,,6790,117390
B031476,31476,2026-10-31,redemption_paid,2026-09-04,Valmet Flow Control Oy,,6570,116601
B033097,33097,2026-10-31,redemption_paid,2026-09-18,Fibernet Finland Oy,,6605,116570
B034439,34439,2026-10-31,redemption_paid,2026-09-28,Sarlin Oy Ab,,6845,117777
B036117,36117,2026-10-31,redemption_paid,2026-09-28,Agco Suomi / Valtra Suolahti,,6839,117772
B036135,36135,2026-10-31,redemption_paid,2026-09-25,Logicor (Space) Manco Oy,,6780,117372
B038639,38639,2026-10-31,redemption_paid,2026-08-20,Tapojärvi Oy,,,
B039534,39534,2026-10-31,redemption_paid,2026-09-25,Keskusrikospoliisi,,6782,117370
B041739,41739,2026-10-31,redemption_paid,2026-08-20,Kymenlaakson hyvinvointialue,,,
B041752,41752,2026-10-31,redemption_paid,2026-08-21,Kymenlaakson hyvinvointialue,,,
B042289,42289,2026-10-31,redemption_paid,2026-09-07,Ammattiopisto Luovi Oy,,,
B042663,42663,2026-10-31,redemption_paid,2026-09-25,Sansia Oy,,6785,117376
B042907,42907,2026-10-31,redemption_paid,2026-08-28,Kansaneläkelaitos - KELA,,,
B042915,42915,2026-10-31,redemption_paid,2026-08-21,Ammattiopisto Luovi Oy,,,
B044497,44497,2026-10-31,redemption_paid,2026-08-26,Teleste Networks Oy,,,
B044792,44792,2026-10-31,redemption_paid,2026-08-24,Lakka Rakennustuotteet Oy,,,
B044934,44934,2026-10-31,redemption_paid,2026-09-17,Keski-Uudenmaan hyvinvointialue,,6551,116271
B046058,46058,2026-10-31,redemption_paid,2026-09-25,Notra Oy,,6791,117395
B046074,46074,2026-10-31,redemption_paid,2026-09-29,Konehuolto Hannu Hoppula Oy,,6848,117872
```

br_id-lista kyselyyn:

```
37913,39752,42943,43755,45175,40198,42063,42831,44109,44533,45888,44098,45767,38677,39368,41894,44110,45104,42270,43350,
40060,41801,43222,43620,44027,45355,46434,41197,41838,43737,45360,46079,38995,39067,39630,42938,37749,38095,41180,45436,
43390,43471,45704,38542,41751,42187,45209,45780,39079,43568,44104,41364,40439,41516,42198,44715,46396,37874,42554,46316,
45266,46088,41002,43447,38056,38524,39520,41527,44499,40278,41288,46173,38870,40480,42361,40606,42851,39156,41491,43946,
44266,44491,44549,45314,40762,43707,46210,41971,44392,45960,42220,39642,42024,42134,43491,44410,38298,38977,40093,41552,
42256,45327,42588,45010,39628,45546,46326,3488,5039,6065,6956,7828,8151,9155,10117,10162,10184,10453,13315,14365,14549,
15281,16327,16686,16856,17450,18311,18611,21321,21682,22372,22719,23083,23113,24292,24397,24454,25076,26437,26690,26967,
27393,29676,29767,31476,33097,34439,36117,36135,38639,39534,41739,41752,42289,42663,42907,42915,44497,44792,44934,46058,46074
```
