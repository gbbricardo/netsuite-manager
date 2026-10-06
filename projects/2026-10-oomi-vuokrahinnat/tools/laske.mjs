// Laskee ehdotetut sopimusrivihinnat ja RI-erot snapshotista. Vain luku, ei NetSuite-yhteyttä.
// Totuus on Oomin brutto-hinta (Fleet). init_subs_rent_fee on siitä pyöristetty netto, joten
// bruttoehdokkaita on 1–2 (sentti). Jo korjatun rivin arvo katsotaan käyttäjän päätökseksi.
import { readFileSync, writeFileSync } from 'node:fs';
const VAT = 1.255;
const r = (x, n) => Math.round((x + Number.EPSILON) * 10 ** n) / 10 ** n;
const lines = readFileSync(process.argv[2] ?? 'data/2026-10-01-snapshot-rivit.csv', 'utf8').trim().split('\n');
const head = lines.shift().split(';');
const H = ['bike','ext','employer','init_rent','sub_end','tila','long_row','long_nyt','brutto_ehdokkaat','long_oikea_lo','long_oikea_hi','partial_row','paiva','kk_paivat','partial_nyt','partial_oikea_lo','partial_oikea_hi','ri_syys_id','ri_loka_id','syys_ri_ero_lo','syys_ri_ero_hi','loka_ri_ero_lo','loka_ri_ero_hi'];
const out = [H];
const tot = { sepLo: 0, sepHi: 0, octLo: 0, octHi: 0 };
const per = {};
// RI-rivit kopioivat rivin vanhan hinnan, myös niiltä viideltä, joiden sopimusrivi on jo korjattu käsin 1.10.
const RI_FEE_KORJATUILLE = { B043392: 79.6813, B043958: 79.6813, B043962: 78.8526, B043963: 79.6653, B043899: 40.3586 };
let nBad = 0, nFixed = 0;
for (const line of lines) {
  const v = Object.fromEntries(line.split(';').map((x, i) => [head[i], x]));
  const init = +v.init_rent, nyt = +v.long_price;
  const consistent = Math.abs(r(nyt, 2) - init) < 0.001;
  let cands = [];
  for (let g = Math.floor(init * VAT * 100) - 3; g <= Math.ceil(init * VAT * 100) + 3; g++)
    if (Math.abs(r(g / 100 / VAT, 2) - init) < 0.001) cands.push(g / 100);
  let lo, hi;
  if (consistent) { lo = hi = nyt; nFixed++; } else { lo = r(cands[0] / VAT, 5); hi = r(cands.at(-1) / VAT, 5); nBad++; }
  const [y, m, d] = v.sub_end.split('-').map(Number);
  const dim = new Date(y, m, 0).getDate();
  const hasP = !!v.partial_row;
  const pLo = hasP ? r(lo * d / dim, 4) : '', pHi = hasP ? r(hi * d / dim, 4) : '';
  const octIsPartial = v.sub_end.startsWith('2026-10');
  const riNyt = RI_FEE_KORJATUILLE[v.bike] ?? nyt;
  const octNyt = octIsPartial ? +v.partial_price : riNyt;
  const sepD = [r((lo - riNyt) * VAT, 4), r((hi - riNyt) * VAT, 4)];
  const octD = octIsPartial ? [r((pLo - octNyt) * VAT, 4), r((pHi - octNyt) * VAT, 4)] : sepD;
  if (v.riid_sep) { tot.sepLo += sepD[0]; tot.sepHi += sepD[1]; }
  tot.octLo += octD[0]; tot.octHi += octD[1];
  per[v.employer] = per[v.employer] || { n: 0, lo: 0, hi: 0 };
  per[v.employer].n++; per[v.employer].lo += sepD[0]; per[v.employer].hi += sepD[1];
  out.push([v.bike, v.ext, v.employer, init, v.sub_end, consistent ? 'KORJATTU' : 'VIRHEELLINEN', v.long_row, nyt, cands.join('|'), lo, hi, v.partial_row, hasP ? d : '', hasP ? dim : '', v.partial_price, pLo, pHi, v.riid_sep, v.riid_oct, sepD[0], sepD[1], octD[0], octD[1]].map(String));
}
console.log({ pyöriä: lines.length, korjattu: nFixed, virheellinen: nBad });
console.log('RI-ero verollisena yhteensä (€/kk, alaraja..yläraja):', { syys: [r(tot.sepLo, 2), r(tot.sepHi, 2)], loka: [r(tot.octLo, 2), r(tot.octHi, 2)] });
console.log('työnantajittain (syys, vero 25,5 %):', Object.fromEntries(Object.entries(per).map(([k, x]) => [k, { pyöriä: x.n, lo: r(x.lo, 2), hi: r(x.hi, 2) }])));
writeFileSync(process.argv[3] ?? 'data/laskelma-ehdotus.csv', '﻿' + out.map(x => x.join(';')).join('\n') + '\n');
