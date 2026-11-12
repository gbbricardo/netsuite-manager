# Brevo: onko transaktioviesti lähetetty ja vastaanotettu?

Työkalu vastaa kysymyksiin "lähetettiinkö asiakkaalle viesti X, mitä siinä luki, milloin se lähti ja
tuliko se perille". Se on **vain lukeva**: se tekee pelkkiä `GET`-kutsuja eikä voi lähettää viestejä
tai muuttaa mitään Brevossa.

Lähde: <https://developers.brevo.com/reference/quickstart-reference>. Rajapinnan tiedot tarkistettiin
9.11.2026 Brevon referenssisivuilta (ei OpenAPI-specistä).

## Käyttöönotto

Tarvitaan Brevon API-avain (Brevo: *SMTP & API → API Keys*). Avain luetaan, ei kopioida tähän repoon:

1. ympäristömuuttujasta `BREVO_API_KEY`, tai
2. riviltä `BREVO_API_KEY=...` tiedostosta `../cf-gbb-tools/.dev.vars` (`GBB_TOOLS_DIR` ohittaa kansion).

> [!NOTE]
> Avainta **ei ollut** `.dev.vars`-tiedostossa 9.11.2026, joten se pitää lisätä ensin. Tämä työkalu
> tarvitsee vain lukuoikeuden transaktiolokeihin.

## Käyttö

```bash
node tools/brevo-email-check.mjs asiakas@example.com                 # viimeiset 30 pv, JSON
node tools/brevo-email-check.mjs asiakas@example.com --days 90 --text
node tools/brevo-email-check.mjs asiakas@example.com --subject kauppakirja --content
node tools/brevo-email-check.mjs --message-id "<202611051000.123@smtp-relay.mailin.fr>" --content
node tools/brevo-email-check.mjs asiakas@example.com --from 2026-10-01 --to 2026-10-31
```

| Valinta | Merkitys |
|---|---|
| `--days N` | Katsotaan N päivää taakse (oletus 30, enintään 90) |
| `--from`, `--to` | Päivämääräväli (YYYY-MM-DD, UTC), enintään 90 pv |
| `--subject TEKSTI` | Suodatin otsikon osalla (kirjainkoolla ei väliä) |
| `--template ID` | Vain tämä Brevon pohja |
| `--message-id ID` | Yksi viesti; sähköpostiosoite ei tällöin pakollinen |
| `--content` | Hakee lisäksi lähetetyn HTML-rungon (muutettuna tekstiksi) ja tapahtumahistorian |
| `--max-content N` | Enintään N viestin sisältö, uusin ensin (oletus 3) |
| `--body-max N` | Katkaisee tekstin N merkkiin (oletus 4000, 0 = ei rajaa) |
| `--html` | Sisällytä sisältöön myös raaka HTML |
| `--text` | Ihmisluettava tuloste JSONin sijaan |

## Mitä tulosteessa on

Jokaisesta viestistä: `sentAt`, `subject`, `from`, `templateId`, `messageId`, `uuid`, `verdict`,
`deliveredAt`, `firstOpenedAt`, `clicks`, `problems` (pomppaukset syineen) ja `events`
(aikajärjestyksessä). `--content` lisää `content.text` ja `content.timeline`.

**`verdict`:**

| Arvo | Tulkinta |
|---|---|
| `delivered` | Vastaanottajan postipalvelin hyväksyi viestin |
| `delivered_with_later_problem` | Toimitettu, mutta myöhemmin spam-ilmoitus tms. |
| `failed` | Pomppasi tai estettiin (`hardBounces`, `softBounces`, `blocked`, `invalid`, `spam`, `error`) |
| `deferred` | Toimitus viivästyy, ei vielä lopullista tulosta |
| `sent_no_delivery_confirmation` | Brevo otti viestin lähetettäväksi, toimituksesta ei tapahtumaa |
| `no_events_found` | Viesti on lokissa, mutta tapahtumia ei löytynyt |

## Rajoitukset, jotka vaikuttavat tulkintaan

- **"Toimitettu" ei tarkoita "luettu".** `delivered` on postipalvelimen kuittaus. `opened`-tapahtumat
  voivat tulla myös tietosuojaproxyistä (`loadedByProxy`, esim. Applen Mail Privacy Protection), ja
  puuttuva `opened` ei todista, ettei viestiä luettu.
- **Tyhjä tulos ≠ viestiä ei lähetetty.** Brevo ei dokumentoi lokien säilytysaikaa. Viesti voi olla
  vanhempi kuin lokit, tai se on lähetetty toiselta Brevo-tililtä tai muuta kautta kuin Brevon
  transaktiorajapinnalla.
- **Kutsukiintiö on pieni.** `/v3/smtp/statistics/events` ja `/v3/smtp/emails/{uuid}` jakavat
  *300 kutsua/tunti* (General-taso); lista-kutsu 7 200/h ja 2/s. Siksi `--content` hakee oletuksena
  vain 3 viestin rungon. Työkalu yrittää 429-vastauksen jälkeen uudelleen kaksi kertaa.
- **Listan päivämääräväli on Brevossa enintään kuukausi.** Työkalu pilkkoo pidemmät haut
  30 päivän ikkunoihin automaattisesti.
- **Sisältö voi sisältää henkilötietoja ja maksulinkkejä.** Älä liitä `--content`-tulostetta
  findings-tiedostoihin sellaisenaan; lainaa vain tarvittava ja peitä tunnisteet.

## Tiedostot

- `tools/brevo-client.mjs`: riippuvuudeton GET-client (avaimen luku, 429-uudelleenyritys, sivutus,
  päivämääräikkunat).
- `tools/brevo-email-check.mjs`: komentorivityökalu, jota agentit ajavat.
