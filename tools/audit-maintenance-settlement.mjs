// Read-only audit: current method-3 bikes whose lease has not ended.
// Reads credentials in place through netsuite-auth; never writes NetSuite.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import vm from 'node:vm';
import { loadConfig, getAccessToken, createClient } from './netsuite-auth.mjs';

const today = process.argv[2];
if (!/^\d{4}-\d{2}-\d{2}$/.test(today ?? '')) throw new Error('Usage: node tools/audit-maintenance-settlement.mjs YYYY-MM-DD');
const q = `SELECT br.id, br.name, br.custrecord_sta_bike_status AS status,
  br.custrecord_sta_bike_order_type AS order_type,
  TO_CHAR(br.custrecord_sta_subsc_end_date,'YYYY-MM-DD') AS end_date,
  TO_CHAR(br.custrecord_gbb_liab_settled_at,'YYYY-MM-DD') AS settled_at,
  br.custrecord_sta_end_redemption_price AS price_net,
  br.custrecord_sta_maintenance_sum AS maintenance_net,
  NVL(br.custrecord_sta_maintenances_not_allowed,'F') AS maintenance_blocked,
  br.custrecord_gbb_eredem_link_sent AS link_sent
FROM customrecord_sta_bike_register br
WHERE br.isinactive='F' AND br.custrecord_gbb_liab_settle_method=3
  AND br.custrecord_sta_subsc_end_date >= TO_DATE('${today}','YYYY-MM-DD')
ORDER BY br.custrecord_sta_subsc_end_date, br.id`;

const config = loadConfig();
const client = createClient(config, await getAccessToken(config));
const rows = (await client.suiteQL(q)).map(({ links, ...row }) => row);
let pricing;
vm.runInNewContext(readFileSync('../netstuite-send-end-redemption-payment-link/src/lib_gbb_redemption_price.js', 'utf8'), {
  define: (_deps, factory) => { pricing = factory(); },
});
// Current cohort is OOMI: no bracket table needed. Other types remain explicitly unpriced.
const price = (p, sum) => pricing.calculate({ endRedemptionPriceNet: p, maintenanceSumNet: sum,
  brackets: [], vatPct: 25.5, oomi: true, minOrderTotalEur: 0.65 });
const bikes = rows.map(row => ({ ...row, current_price: Number(row.order_type) === 3
  ? price(row.price_net, row.maintenance_net) : null }));
const exampleBike = bikes.find(row => row.name === 'B043000');
const example = exampleBike ? {
  description: 'Hypothetical EUR 100 net maintenance spend after the recorded settlement; not an observed transaction.',
  bike: exampleBike.name,
  before: price(exampleBike.price_net, exampleBike.maintenance_net),
  after: price(exampleBike.price_net, Number(exampleBike.maintenance_net) + 100),
} : null;
const result = { captured_at: new Date().toISOString(), as_of: today, query: q, bikes, example };
const dir = `artifacts/${today}-maintenance-settlement`;
mkdirSync(dir, { recursive: true });
writeFileSync(`${dir}/audit.json`, JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ evidence: `${dir}/audit.json`, bikes: bikes.length,
  maintenance_allowed: bikes.filter(row => row.maintenance_blocked === 'F').length,
  current_payable: bikes.filter(row => row.current_price && !row.current_price.noPaymentDue).length,
  base_price_net: Math.round(bikes.reduce((sum, row) => sum + Number(row.price_net), 0) * 100) / 100,
  example: example && { bike: example.bike, before_gross: example.before.finalPriceGross,
    after_gross: example.after.finalPriceGross } }, null, 2));
