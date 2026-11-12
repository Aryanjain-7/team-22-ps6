import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { parseEnv } from "node:util";

const root = fileURLToPath(new URL("../", import.meta.url));
const dotenv = new URL("../.env.local", import.meta.url);
const oldEnv = existsSync(dotenv) ? readFileSync(dotenv, "utf8") : "";
const existing = parseEnv(oldEnv);

function command(bin, args, options = {}) {
  const result = spawnSync(bin, args, { cwd: root, encoding: "utf8", ...options });
  if (result.status !== 0) {
    throw new Error(`${bin.split("/").at(-1)} failed. ${result.error?.message ?? result.stderr?.trim() ?? ""}`);
  }
  return result.stdout.trim();
}

function localURL(value, protocols) {
  const url = new URL(value);
  if (!protocols.includes(url.protocol) || !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) {
    throw new Error("Local setup only supports loopback services.");
  }
  return url;
}

try {
  if (existing.SUPABASE_URL) localURL(existing.SUPABASE_URL, ["http:", "https:"]);
  const cli = process.env.SUPABASE_BIN || "supabase";
  const output = command(cli, ["status", "--env"]);
  const status = output.startsWith("{") ? JSON.parse(output) :
    parseEnv(output.split("\n").filter((line) => /^[A-Z][A-Z0-9_]*=/.test(line)).join("\n"));
  const api = localURL(status.API_URL || status.SUPABASE_URL, ["http:", "https:"]);
  const db = localURL(status.DB_URL, ["postgresql:", "postgres:"]);
  const key = status.SECRET_KEY || status.SERVICE_ROLE_KEY || status.SUPABASE_SECRET_KEY;
  if (!key) throw new Error("Supabase status did not return a local server key.");
  const postgres = {
    ...process.env,
    PGHOST: db.hostname.replace(/^\[|\]$/g, ""),
    PGPORT: db.port || "5432",
    PGDATABASE: decodeURIComponent(db.pathname.slice(1)),
    PGUSER: decodeURIComponent(db.username),
    PGPASSWORD: decodeURIComponent(db.password),
    PGCONNECT_TIMEOUT: "5",
  };
  const psql = (args, input) => command("psql", ["-X", "-w", "-v", "ON_ERROR_STOP=1", ...args], { env: postgres, input });
  const existingTables = psql(["-Atc", `select count(*) from pg_tables
    where schemaname = 'public' and tablename in ('tasks','profiles','jobs','shortlists')`]);
  if (existingTables === "0") {
    const sql = command(process.execPath, ["scripts/database-sql.mjs"]);
    psql(["-q"], sql);
  } else if (existingTables === "4") {
    const sql = readFileSync(new URL("../supabase/production.sql", import.meta.url), "utf8");
    psql(["-q"], `begin;\n${sql}\ncommit;\n`);
  } else {
    throw new Error("Some CareerMatch tables already exist. Review this database before applying the schema.");
  }

  const values = {
    SUPABASE_URL: api.origin,
    SUPABASE_SECRET_KEY: key,
    APP_PASSCODE: existing.APP_PASSCODE || randomBytes(12).toString("hex"),
    GEMINI_MODEL: existing.GEMINI_MODEL || "gemini-3.8-flash",
    GEMINI_API_KEY: existing.GEMINI_API_KEY || "",
  };
  const retained = oldEnv.split("\n").filter((line) => {
    const name = line.match(/^\s*(?:export\s+)?([A-Z][A-Z0-9_]*)\s*=/)?.[1];
    return !name || !Object.hasOwn(values, name);
  }).join("\n").trim();
  const settings = Object.entries(values).map(([name, value]) => `${name}=${JSON.stringify(value)}`).join("\n");
  writeFileSync(dotenv, [retained, settings].filter(Boolean).join("\n\n") + "\n", { mode: 0o600 });
  console.log("Local Supabase is seeded. Connection settings are in .env.local.");
} catch (error) {
  console.error(error instanceof Error ? error.message : "Local Supabase setup failed.");
  process.exitCode = 1;
}
