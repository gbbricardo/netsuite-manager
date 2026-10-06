// Käsin korjattujen pitkien rivien jälkeen (1.10.2026): tarkistaa pitkät rivit tapea vasten ja tekee
// osarivien ja RI-rivien (lease_fee_vat0) tuontitiedostot NetSuitesta luetuista pitkien rivien hinnoista.
// node tools/tee-osat-ja-ri.mjs  ->  ../../imports/2026-10-01-oomi-hinnat/*.csv. Vain luku NetSuiteen nähden.
import { readFileSync, writeFileSync, rmSync } from 'node:fs';
const VAT = 1.255;
const r = (x, n) => Math.round((x + Number.EPSILON) * 10 ** n) / 10 ** n;
const num = s => parseFloat((s || '').replace(',', '.'));
function parse(t) { const rows = []; let row = [], f = '', q = false;
  for (let i = 0; i < t.length; i++) { const c = t[i];
    if (q) { if (c === '"') { if (t[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true; else if (c === ';') { row.push(f); f = ''; }
    else if (c === '\n') { row.push(f.replace(/\r$/, '')); rows.push(row); row = []; f = ''; } else f += c; }
  if (f || row.length) { row.push(f); rows.push(row); } return rows; }
const tape = parse(readFileSync('data/OOMI DATA TAPE BIKES.csv', 'utf8').replace(/^﻿/, ''));
tape.shift();
const tapeBy = {}; for (const t of tape) if (!tapeBy[t[0]]) tapeBy[t[0]] = t;
const read = f => { const [h, ...rs] = readFileSync(f, 'utf8').replace(/^﻿/, '').trim().split(/\r?\n/).map(l => l.split(';'));
  return rs.map(x => Object.fromEntries(x.map((v, i) => [h[i], v]))); };
const snap = Object.fromEntries([...read('data/2026-10-01-snapshot-rivit.csv'), ...read('data/2026-10-01-snapshot-lisapyorat.csv')].map(b => [b.bike, b]));
const ns = read('data/2026-10-01-ns-tila-kasinkorjauksen-jalkeen.csv');
const VAHVISTETTU_BRUTTO = { B041634: 101.21, B043384: 101.21, B043392: 101.21 };
// V9 ratkaistu 1.10.2026 (käyttäjä selvitti): vahvistettu netto, ohittaa tapen ja NetSuiten pitkän rivin hinnan.
const VAHVISTETTU_NETTO = { B044817: 80.64542, B044889: 80.64542, B045487: 57.96813 };
const ODOTTAA = new Set(); // hinta vahvistamatta, ei tiedostoihin
const tarkistus = [], part = [], ri = [], ohitetut = [], pitkat = [];
for (const n of ns) {
  const b = snap[n.bike], ns_pm = +n.long_pm_ns, tx = num(tapeBy[b.ext][49]);
  const vn = VAHVISTETTU_NETTO[n.bike];
  const target = vn != null ? r(vn * VAT, 2) : VAHVISTETTU_BRUTTO[n.bike] ?? r(tx * VAT, 2), nyt = r(ns_pm * VAT, 2);
  tarkistus.push([n.bike, n.long_row, ns_pm, nyt, target, nyt === target ? 'OK' : 'POIKKEAA']);
  // Päätös 1.10.2026: jos brutto on sama sentilleen, NetSuiten arvo jää (desimaalien määrää ei korjata).
  const pm = vn != null && nyt !== target ? vn : ns_pm;
  if (pm !== ns_pm) pitkat.push([n.long_row, n.bike, pm, r(pm * 12, 2), ns_pm, '', target]);
  if (ODOTTAA.has(n.bike)) { ohitetut.push(n.bike); continue; }
  const [y, m, d] = b.sub_end.split('-').map(Number), dim = new Date(y, m, 0).getDate();
  let partial = null;
  if (b.partial_row) { partial = r(pm * d / dim, 4); part.push([b.partial_row, n.bike, partial, r(partial * 12, 4), +b.partial_price, `${d}/${dim}`, pm]); }
  // RI-maksu = kuukauden laskutettava rivihinta: pitkä rivi, paitsi päättymiskuussa osarivi.
  const fee = (yyyymm) => (y * 100 + m === yyyymm ? partial : pm);
  for (const [id, cur, kk] of [[n.riid_sep, n.fee_sep_ns, 202609], [n.riid_oct, n.fee_oct_ns, 202610]]) {
    const uusi = fee(kk);
    if (Math.abs(uusi - +cur) > 0.00001) ri.push([id, n.bike, kk === 202609 ? '2026-09-01' : '2026-10-01', uusi, +cur, r(uusi * VAT, 2), r(+cur * VAT, 2), r((uusi - +cur) * VAT, 2)]);
  }
}
const dir = '../../imports/2026-10-01-oomi-hinnat';
// Tilin muotoiluasetukset: erotin ';', desimaalierotin ',', päivämäärä DD.MM.YYYY, ei tuhaterotinta.
const fmt = v => typeof v === 'number' ? String(v).replace('.', ',')
  : /^\d{4}-\d{2}-\d{2}$/.test(v) ? v.split('-').reverse().join('.') : v;
const w = (f, head, rows) => writeFileSync(`${dir}/${f}`, '﻿' + [head, ...rows.map(x => x.map(fmt).join(';'))].join('\n') + '\n');
const PH = 'internal_id;pyora_id;price_month;price_year;price_month_nyt_1_10;paiva_kk;pitka_netto_ns';
const RH = 'internal_id;pyora_id;reporting_date;lease_fee_vat0;lease_fee_vat0_nyt;brutto_uusi;brutto_nyt;erotus_brutto';
const TEST = 'B045661';
if (pitkat.length) w('02-pitkat-rivit.csv', 'internal_id;pyora_id;price_month;price_year;price_month_nyt_1_10;tape_taxable;brutto', pitkat);
else rmSync(`${dir}/02-pitkat-rivit.csv`, { force: true });
w('01-testirivi.csv', PH, part.filter(x => x[1] === TEST));
w('03-osarivit.csv', PH, part.filter(x => x[1] !== TEST));
w('04-ri-testirivi.csv', RH, ri.filter(x => x[1] === TEST && x[2] === '2026-10-01'));
w('05-ri-lease-fee.csv', RH, ri.filter(x => !(x[1] === TEST && x[2] === '2026-10-01')));
writeFileSync('data/2026-10-01-pitkat-tarkistus.csv', '﻿bike;long_row;price_month_ns;brutto_ns;brutto_tavoite;tulos\n' + tarkistus.map(x => x.join(';')).join('\n') + '\n');
const sum = rs => rs.reduce((s, x) => s + +x[0], 0);
console.log('pitkät:', tarkistus.filter(x => x[5] === 'OK').length, 'OK /', tarkistus.length);
console.log(tarkistus.filter(x => x[5] !== 'OK').map(x => x.join(' ')).join('\n'));
console.log({ pitkat: pitkat.map(x => x.join(' ')), osarivit: part.length, sumOsa: sum(part), ri: ri.length, sumRi: sum(ri), ohitetut });
const byMonth = {}; for (const x of ri) { const k = x[2]; byMonth[k] = r((byMonth[k] || 0) + x[7], 2); }
console.log('erotus brutto / kk', byMonth);
const byEmp = {}; for (const x of ri) { const e = snap[x[1]].employer; byEmp[e] = r((byEmp[e] || 0) + x[7], 2); }
console.log('erotus brutto / työnantaja (syys+loka)', byEmp);
