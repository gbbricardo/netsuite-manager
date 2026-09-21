# 691 maksettua Active-pyörää ilman selvitystapaa — sweepin katvealue

**Päivämäärä:** 2026-09-21 · **Tila:** korjattavissa CSV-importilla, **kalenterisweepin esiehto**
**Liittyy:** [`2026-09-17-liab-settle-method-coverage.md`](2026-09-17-liab-settle-method-coverage.md),
[`2026-09-20-selvitystavan-taydennys-paattyneille.md`](2026-09-20-selvitystavan-taydennys-paattyneille.md),
[ADR 0005](../docs/adr/0005-tilasiirtyman-2-3-tekee-kalenterisweep.md)

## Löydös

Todennettu NetSuitesta 21.09.2026:

| | kpl |
|---|---|
| Active-pyöriä joilla `custrecord_gbb_redemption_paid_at` on asetettu mutta selvitystapa puuttuu | **691** |
| …joista tunnistuspäivä on **jo ohitettu** | **633** |
| …joista `custrecord_gbb_liab_settled_at` on tyhjä | 633/633 |
| …joiden maksu osuu osan A ±5 vrk ikkunaan juuri nyt | **59** |

Näiltä 633:lta puuttuu **vain selvitystapa**. Kaikki muu `saakoMerkitaPaattyneeksi`-ehto täyttyy:
päättymisajankohta on olemassa, maksu on todiste velvoitteiden hoidosta (§5, todiste 3), ja
tunnistuspäivä on koittanut. Ne kuuluisivat siis statukselle 2 jo tänään.

**Tämä ei ole vanha jämä vaan kuluvan kuun aalto.** Maksut ovat 27.08.–20.09.2026 ja
`kausi_paattyi_yli_2kk_sitten = 0` — jokaisen vuokrakausi on päättynyt alle kahdessa kuukaudessa.

## Miksi kalenterisweep ei tavoita niitä

Sweepin kandidaattiehto on `bike_status = 1 AND custrecord_gbb_liab_settle_method IS NOT NULL`
(ADR 0005). Selvitystapa on siis **välttämätön välivaihe**, ja sen kirjoittaa osa A vain pyörille
joiden maksu tai lasku osuu ±5 vuorokauden ikkunaan.

Ikkunan ulkopuolelle jäänyt pyörä ei koskaan palaa siihen: ikkuna liikkuu eteenpäin, maksupäivä ei.
Eli **~574 pyörää jää pysyvästi sweepin katvealueeseen** ja Activeksi, vaikka ne on maksettu ja
vuokrakausi on ohi.

Havaittu 21.09.2026 dry runin lokirivistä *"Part A: 86 payment(s) recorded, **0 already
recorded**"* — yksikään 86:sta ei ollut jo käsitelty, eli kaikilta puuttui selvitystapa.

## Tämä ei ole regressio vaan vanhan aukon toinen puoli

Sama ilmiö kuin [20.09. löydöksessä](2026-09-20-selvitystavan-taydennys-paattyneille.md): maksuvetoinen
automaatio ei kirjoittanut selvitystapaa ennen 20.09.2026. Silloin katsottiin päättyneitä pyöriä
(status 2, 1 517 kpl); tämä on sama aukko **Active-puolella**.

Ero on seurauksessa. Status-2-puolella puuttuva selvitystapa oli kirjanpidollinen aukko — pyörä oli
jo päättynyt. Active-puolella se **estää päättymisen kokonaan**, koska uudessa arkkitehtuurissa
selvitystapa on statuksen esiehto. Aukko muuttui passiivisesta aktiiviseksi sillä hetkellä kun
statuspäätös siirtyi kirjastolle.

Kasvu on pysäytetty 20.09.2026 (PR #2): status-sync kirjoittaa selvitystavan jokaiselle havaitulle
maksulle. Olemassa oleva 691 ei kuitenkaan korjaudu itsestään.

## Korjaus

CSV-import, `custrecord_gbb_liab_settle_method = 1` kaikille 691:lle. Perustelu on yksikäsitteinen
ja sama jota handler ja status-sync käyttävät: `redemption_paid_at` on asetettu, eli maksu on
tapahtunut, ja maksuvetoinen lunastus on aina `redemption_paid`.

Samalla kirjoitetaan `custrecord_gbb_liab_settled_at = custrecord_gbb_redemption_paid_at`, koska
[§5](../docs/lunastuksen-kenttasaannot.md) vaatii kenttien olevan identtiset selvitystavalla 1.
Tämä on sama käsittely jonka 20.09. importin ryhmä 1 (60 pyörää) sai.

Aineisto: [`imports/2026-09-21-selvitystapa-active/`](../imports/2026-09-21-selvitystapa-active/).

### Vaikutus ja järjestys

**Import on ajettava ennen sweepin ensimmäistä oikeaa ajoa.** Sen jälkeen sweep tavoittaa ne 633
ja kääntää ne statukselle 2 — yhdellä ajolla. Lisäksi osa A kirjoittaa saman ajon alussa ~86
selvitystapaa, ja osa B ajetaan **samassa suorituksessa sen jälkeen**, joten ensimmäinen oikea ajo
on selvästi isompi kuin dry run antaa ymmärtää.

Jokainen statuksen kirjoitus laukaisee `gbb_webhook_ue_status_changed.js`:n. Ensimmäinen oikea ajo
kannattaa siksi tehdä **käsin ja valvottuna**, ei yöllä ajastettuna.

`liab_settled_at`:n kirjoitus vaikuttaa myös kuukausiraportointiin: `mr_monthly_reporting_ri_creation.js`
päättää vuokrasuhteen ehdolla `liabSettled && reportingDate > endDate`. Nämä 633 päättyisivät siis
RI-luonnissa seuraavassa kuukausiajossa. **Se on oikea lopputulos** — ne ovat maksettuja ja kausi on
ohi — ja se tapahtuisi joka tapauksessa statuksen kääntymisen kautta.

## Todennettu vs. päätelty

**Todennettu NetSuitesta 21.09.2026:** 691 / 633 / 59; `settled_at` tyhjä 633/633; maksujen
vaihteluväli 27.08.–20.09.2026; ei yhtään yli 2 kk vanhaa kautta.
**Todennettu lokista 21.09.2026:** dry runin osan A ja B yhteenvetorivit.
**Päätelty:** ~574 = 633 − 59, eli ikkunan ulkopuolelle jäävien määrä.
