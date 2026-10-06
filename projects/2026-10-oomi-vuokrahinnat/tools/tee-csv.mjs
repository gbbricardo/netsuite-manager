// Tekee tuontitiedostot tapen Taxable valuesta (päätös 1.10.2026). Vain luku NetSuiteen nähden.
// node tools/tee-csv.mjs  ->  ../../imports/2026-10-01-oomi-hinnat/*.csv
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
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
const tapeBy = {}; for (const t of tape) if (!tapeBy[t[0]]) tapeBy[t[0]] = t; // ensimmäinen rivi = voimassa oleva
const snap = f => readFileSync(f, 'utf8').replace(/^﻿/, '').trim().split(/\r?\n/).map(l => l.split(';'));
const read = f => { const [h, ...rs] = snap(f); return rs.map(x => Object.fromEntries(x.map((v, i) => [h[i], v]))); };
const bikes = [...read('data/2026-10-01-snapshot-rivit.csv'), ...read('data/2026-10-01-snapshot-lisapyorat.csv')];
// Käyttäjä tarkisti 1.10.2026: B041634, B043384 ja B043392 vuokra on brutto 101,21 (tape on näillä väärässä, init_rent 80,65 oikein).
const VAHVISTETTU_BRUTTO = { B041634: 101.21, B043384: 101.21, B043392: 101.21 };
// Tape poikkeaa init_rentistä, mutta oikeaa hintaa ei ole vahvistettu: ei oteta mukaan ennen tarkistusta.
const ODOTTAA = new Set(['B044817', 'B044889']);
const long = [], part = [], init = [];
for (const b of bikes) {
  if (ODOTTAA.has(b.bike)) continue;
  const tx = num(tapeBy[b.ext][49]);
  const gross = VAHVISTETTU_BRUTTO[b.bike] ?? r(tx * VAT, 2), net = r(gross / VAT, 5);
  const [y, m, d] = b.sub_end.split('-').map(Number);
  const dim = new Date(y, m, 0).getDate();
  const isB043909 = b.bike === 'B043909';
  if (!isB043909) long.push([b.long_row, b.bike, net, r(net * 12, 2), b.long_price, tx, gross]);
  if (b.partial_row) { const p = r(net * d / dim, 4); part.push([b.partial_row, b.bike, p, r(p * 12, 4), b.partial_price, `${d}/${dim}`, net]); }
  const initOk = VAHVISTETTU_BRUTTO[b.bike] ? true : Math.abs(+b.init_rent - tx) <= 0.0068;
  if (!initOk) init.push([b.bike.slice(1).replace(/^0+/, ''), b.bike, r(tx, 2), b.init_rent]);
}
const dir = '../../imports/2026-10-01-oomi-hinnat'; mkdirSync(dir, { recursive: true });
const w = (f, head, rows) => writeFileSync(`${dir}/${f}`, '﻿' + [head, ...rows.map(x => x.join(';'))].join('\n') + '\n');
const LH = 'internal_id;pyora_id;price_month;price_year;price_month_nyt_1_10;tape_taxable;tape_brutto';
const PH = 'internal_id;pyora_id;price_month;price_year;price_month_nyt_1_10;paiva_kk;pitka_netto';
w('01-testirivi.csv', LH, long.filter(x => x[1] === 'B045661'));
w('02-pitkat-rivit.csv', LH, long.filter(x => x[1] !== 'B045661'));
w('03-osarivit.csv', PH, part);
w('04-init-rent.csv', 'internal_id;pyora_id;init_subs_rent_fee;init_nyt', init);
console.log({ pitkat: long.length, osarivit: part.length, init: init.length });
console.log('SUM(id) pitkat', long.reduce((s, x) => s + +x[0], 0), 'osarivit', part.reduce((s, x) => s + +x[0], 0), 'init', init.reduce((s, x) => s + +x[0], 0));
console.log(init.map(x => x.join(' ')).join('\n'));
