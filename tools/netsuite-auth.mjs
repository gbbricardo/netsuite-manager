// Minimal, dependency-free NetSuite OAuth 2.0 M2M client.
//
// Mirrors cf-gbb-tools/src/app/lib/connectors/netsuite/client.ts (JWT client assertion,
// PS256, scope "restlets rest_webservices") but signs with node:crypto instead of jose,
// so this repo stays free of node_modules.
//
// Credentials are READ IN PLACE from cf-gbb-tools/.dev.vars. They are never copied into
// this repository — keep it that way.

import { createSign, constants as cryptoConstants } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const DEFAULT_DEV_VARS = join(
  process.env.GBB_TOOLS_DIR ?? join(process.cwd(), "..", "cf-gbb-tools"),
  ".dev.vars"
);

export function loadConfig(devVarsPath = DEFAULT_DEV_VARS) {
  let raw;
  try {
    raw = readFileSync(devVarsPath, "utf8");
  } catch {
    throw new Error(
      `Could not read NetSuite credentials from ${devVarsPath}.\n` +
        `Set GBB_TOOLS_DIR to the cf-gbb-tools checkout if it lives elsewhere.`
    );
  }

  const env = {};
  for (const line of raw.split(/\r?\n/)) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
    if (!match) continue;
    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[match[1]] = value;
  }

  const config = {
    accountId: env.NETSUITE_ACCOUNT_ID,
    clientId: env.NETSUITE_CLIENT_ID,
    certificateId: env.NETSUITE_CERTIFICATE_ID,
    // .dev.vars stores the PEM with literal \n escapes, as Cloudflare secrets require.
    privateKeyPem: (env.NETSUITE_PRIVATE_KEY ?? "").replace(/\\n/g, "\n"),
  };

  const missing = Object.entries(config)
    .filter(([, v]) => !v)
    .map(([k]) => k);
  if (missing.length > 0) {
    throw new Error(`NetSuite config missing from ${devVarsPath}: ${missing.join(", ")}`);
  }
  return config;
}

function host(accountId) {
  return accountId.toLowerCase().replace(/_/g, "-");
}

function base64url(input) {
  return Buffer.from(input).toString("base64url");
}

export async function getAccessToken(config) {
  const tokenUrl = `https://${host(config.accountId)}.suitetalk.api.netsuite.com/services/rest/auth/oauth2/v1/token`;
  const now = Math.floor(Date.now() / 1000);

  const header = base64url(
    JSON.stringify({ alg: "PS256", typ: "JWT", kid: config.certificateId })
  );
  const payload = base64url(
    JSON.stringify({
      iss: config.clientId,
      sub: config.clientId, // RFC 7523 §3: sub == client id for client-assertion JWTs
      aud: tokenUrl,
      scope: "restlets rest_webservices",
      iat: now,
      exp: now + 300,
    })
  );

  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${payload}`);
  signer.end();
  const signature = signer.sign({
    key: config.privateKeyPem,
    padding: cryptoConstants.RSA_PKCS1_PSS_PADDING,
    saltLength: cryptoConstants.RSA_PSS_SALTLEN_DIGEST, // PS256 => 32 bytes
  });
  const assertion = `${header}.${payload}.${signature.toString("base64url")}`;

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_assertion_type: "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
      client_assertion: assertion,
    }).toString(),
  });

  if (!response.ok) {
    throw new Error(`Token exchange failed (${response.status}): ${await response.text()}`);
  }
  const json = await response.json();
  if (!json.access_token) throw new Error("Token exchange returned no access_token");
  return json.access_token;
}

export function createClient(config, accessToken) {
  const base = `https://${host(config.accountId)}.suitetalk.api.netsuite.com/services/rest`;

  async function request(url, init = {}) {
    const response = await fetch(url, {
      ...init,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        ...(init.headers ?? {}),
      },
    });
    if (!response.ok) {
      throw new Error(`${init.method ?? "GET"} ${url} -> ${response.status}: ${await response.text()}`);
    }
    return response.json();
  }

  return {
    /** JSON-schema metadata catalog for one record type. */
    recordMetadata: (recordType) =>
      request(`${base}/record/v1/metadata-catalog/${encodeURIComponent(recordType)}`, {
        headers: { Accept: "application/schema+json" },
      }),

    /** SuiteQL, paging through every result. */
    async suiteQL(q) {
      const items = [];
      let offset = 0;
      for (;;) {
        const page = await request(`${base}/query/v1/suiteql?limit=1000&offset=${offset}`, {
          method: "POST",
          headers: { Prefer: "transient" },
          body: JSON.stringify({ q }),
        });
        items.push(...(page.items ?? []));
        if (!page.hasMore) return items;
        offset += 1000;
      }
    },
  };
}
