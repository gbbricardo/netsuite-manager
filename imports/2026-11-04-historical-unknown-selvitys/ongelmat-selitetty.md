# Mitä `ongelmat.csv`:n 18 riviä sisältävät

> [!NOTE]
> **`ongelmat.csv` ei ole poissuljettujen lista.** 17 pyörää 18:sta on mukana korjaus-CSV:issä
> normaalisti; ne on merkitty vain siksi, että skripti joutui *valitsemaan* kahden suljetun
> tiketin välillä. Vain testipyörä B017530 on aidosti jätetty pois.

## Kuvio on sama kaikissa 17:ssä

Pyörällä on Hubspotissa kaksi (kerran kolme) tikettiä vaiheessa 8 "LUNASTETTU / PALAUTETTU":

- **vanhempi** on aina **GBB siirto** tai **Siirto toiselle työntekijälle** — pyörä ei päättynyt,
  se vaihtoi käyttäjää tai työnantajaa, ja vanha vuokrasopimustiketti suljettiin
- **uusin** on todellinen päättyminen

Skriptin sääntö "viimeisin vaiheeseen 8 siirtynyt" valitsi oikean kaikissa 17:ssä. Vanhemmasta
tiketistä ei olisi saanut tapaa lainkaan: niiden `vuokrasopimuksen_paattymistapa` on siirto, jolloin
päätöstaulukon rivi 5 olisi palauttanut "ei päättyminen".

## Rivit

| Pyörä | Valittu tiketti | Päättymistapa | → | Hylätty tiketti | Päättymistapa |
|---|---|---|---|---|---|
| B002102 | 25875259700 · 23.09.2025 | Kesken kauden lunastus | **1** | 2564691565 · 03.07.2025 | GBB siirto |
| B004306 | 26712867508 · 10.10.2025 | Varkaus tai vahinko | **7** | 1955611761 · 22.08.2025 | GBB siirto |
| B006041 | 25248286020 · 20.01.2026 | Kesken kauden lunastus | **1** | 1911359349 · 17.06.2025 | GBB siirto |
| B006054 | 22455868771 · 16.09.2025 | Loppulunastus | **1** | 2195695788 · 03.05.2025 | GBB siirto |
| B007718 | 22720322574 · 23.09.2025 | Kesken kauden lunastus | **1** | 2955450398 · 02.06.2025 | GBB siirto |
| B008581 | 22025486096 · 03.10.2025 | Loppulunastus | **1** | 2606692955 · 02.04.2025 | GBB siirto |
| B009020 | 22202725454 · 05.04.2026 | Loppulunastus | **jää 8** | 850473369 · 10.04.2025 | GBB siirto |
| B009568 | 23270943557 · 17.09.2025 | Kesken kauden palautus | **5** | 3058473743 · 13.05.2025 | GBB siirto |
| B015440 | 15650715547 · 16.09.2025 | Loppulunastus | **1** | 951918426 · 12.11.2024 | GBB siirto |
| B015669 | 2971808599 · 03.12.2025 | Kesken kauden lunastus | **1** | 1816521386 · 02.10.2024 | Siirto toiselle työntekijälle |
| B022913 | 2972384309 · 12.12.2025 | Varkaus tai vahinko | **7** | 2004433741 · 24.07.2024 | GBB siirto |
| B034452 | 2287793508 · 25.09.2025 | Kesken kauden lunastus | **1** | 1315976788 · 23.01.2024 | GBB siirto |
| B034560 | 2256259932 · 16.09.2025 | Loppulunastus | **1** | 1150956080 · 15.01.2024 | GBB siirto |
| B035210 | 2200708137 · 16.09.2025 | Loppulunastus | **1** | 860768883 · 21.12.2023 | GBB siirto |
| B035379 | 2252337180 · 03.12.2025 | Kesken kauden lunastus | **1** | 961661957 · 12.01.2024 | GBB siirto |
| B035490 | 2287068068 · 02.02.2026 | Loppulunastus | **2** | 704602955 · 22.01.2024 | GBB siirto |
| B036805 | 16849842952 · 07.05.2025 | Siirto toiselle palveluntarjoajalle | **6** | 1495531781 · 09.12.2024 | GBB siirto |

Päivämäärä on `hs_v2_date_entered_7025289`, eli tiketin siirtyminen vaiheeseen 8. Tiketin avaa
`https://app.hubspot.com/contacts/9053265/record/0-5/<id>`.

Kahdella pyörällä on lisäksi kolmas tiketti, joka ei ole vaiheessa 8 eikä siksi ollut ehdolla:
B002102 (2559275609) ja B022913 (2831281449), molemmat vaiheessa `93373012`
*Peruutettu – Virhe/muutos sopimuksessa*.

## B009020 — jää tavalle 8

Valittu tiketti on oikea, mutta sen `lunastus___lunastuslaskun_numero` on **"Hyvitetty
työntekijälle"** vaikka lunastushinta on 202 € ja status *Maksettu*. **Asiakaspalvelu päätti hyvittää
loppulunastusmaksun kokonaisuudessaan reklamaation takia** (käyttäjä 4.11.2026). Rahaa ei siis
tullut, joten tapa 1 `redemption_paid` olisi väärin, eikä listalla ole arvoa hyvitykselle. Pyörä jää
tavalle 8 samasta syystä kuin luottotappiot, ja on `tarkistettavat.csv`:ssä — ei korjaus-CSV:issä.
Tämä oli 505 tapa-1-ehdokkaasta ainoa jonka laskunumero ei ollut laskunumero.

## B017530 — testipyörä

Ainoa aidosti poissuljettu. Sen kaksi tikettiä (2564712121 vaiheessa `1611544` *6. VUOKRAKAUSI
ALKANUT*, 2363841599 vaiheessa `15346731` *ROBO – Peruutettu/palautettu myyjäliikkeelle*) eivät ole
päättyneitä lainkaan. Testipyörä jätetään pois importeista, mittareista ja löydöksistä.
