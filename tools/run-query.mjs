import { loadConfig, getAccessToken, createClient } from "./netsuite-auth.mjs";

const sql = process.argv[2];
if (!sql) {
  console.error("Usage: node tools/run-query.mjs \"<SQL>\"");
  process.exit(1);
}

try {
  const config = loadConfig();
  const token = await getAccessToken(config);
  const client = createClient(config, token);
  const rows = await client.suiteQL(sql);
  console.log(JSON.stringify(rows, null, 2));
} catch (e) {
  console.error(e);
  process.exit(1);
}
