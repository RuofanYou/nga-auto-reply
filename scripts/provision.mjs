#!/usr/bin/env node
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const cwd = resolve(import.meta.dirname, "..");
const deploy = process.argv.includes("--deploy");
const configPath = resolve(cwd, "wrangler.jsonc");
const tokenPath = resolve(cwd, ".admin-token.local");

function run(args, { allowFailure = false, input } = {}) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(process.platform === "win32" ? "npx.cmd" : "npx", ["wrangler", ...args], {
      cwd,
      stdio: [input ? "pipe" : "inherit", "pipe", "pipe"],
      env: process.env,
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; process.stdout.write(chunk); });
    child.stderr.on("data", (chunk) => { stderr += chunk; process.stderr.write(chunk); });
    if (input) { child.stdin.write(input); child.stdin.end(); }
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0 || allowFailure) resolvePromise({ code, stdout, stderr });
      else reject(new Error(`wrangler ${args.join(" ")} failed with exit code ${code}`));
    });
  });
}

async function findDatabase() {
  const result = await run(["d1", "list", "--json"]);
  const parsed = JSON.parse(result.stdout);
  const rows = Array.isArray(parsed) ? parsed : parsed.result || [];
  return rows.find((row) => row.name === "jojo-creative-radar-db") || null;
}

async function ensureD1() {
  let database = await findDatabase();
  if (!database) {
    console.log("\n[provision] Creating D1 database in APAC…");
    await run(["d1", "create", "jojo-creative-radar-db", "--location", "apac"]);
    database = await findDatabase();
  }
  const id = database?.uuid || database?.id || database?.database_id;
  if (!id) throw new Error("Could not resolve D1 database UUID after creation");
  let config = readFileSync(configPath, "utf8");
  config = config.replace(
    /"database_id"\s*:\s*"[^"]+"/,
    `"database_id": "${id}"`,
  );
  writeFileSync(configPath, config);
  console.log(`[provision] D1 binding patched: ${id}`);
}

async function ensureNamedResource(args, label) {
  const result = await run(args, { allowFailure: true });
  if (result.code !== 0 && !/already exists|already been taken|code\s*10014|duplicate/i.test(`${result.stdout}\n${result.stderr}`)) {
    throw new Error(`Could not create ${label}`);
  }
  console.log(`[provision] ${label} ready`);
}

function ensureAdminTokenFile() {
  let token;
  if (existsSync(tokenPath)) token = readFileSync(tokenPath, "utf8").trim();
  if (!token || token.length < 24) {
    token = randomBytes(32).toString("hex");
    writeFileSync(tokenPath, `${token}\n`, { mode: 0o600 });
  }
  console.log(`[provision] ADMIN_TOKEN generated locally: ${tokenPath}`);
  return token;
}

async function main() {
  console.log("[provision] Checking Cloudflare login…");
  await run(["whoami"]);
  await ensureD1();
  await ensureNamedResource(
    ["r2", "bucket", "create", "jojo-creative-radar-artifacts", "--location", "apac"],
    "R2 bucket",
  );
  await ensureNamedResource(["queues", "create", "jojo-creative-radar-pipeline"], "pipeline Queue");
  await ensureNamedResource(["queues", "create", "jojo-creative-radar-dead"], "dead-letter Queue");
  const adminToken = ensureAdminTokenFile();
  console.log("[provision] Applying D1 migrations…");
  await run(["d1", "migrations", "apply", "DB", "--remote"]);
  console.log("[provision] Generating binding types…");
  await run(["types"]);
  console.log("[provision] Running deployment dry-run…");
  await run(["deploy", "--dry-run"]);
  if (deploy) {
    console.log("[provision] Deploying Worker…");
    await run(["deploy"]);
    console.log("[provision] Uploading ADMIN_TOKEN after the initial deployment…");
    await run(["secret", "put", "ADMIN_TOKEN"], { input: `${adminToken}\n` });
  } else {
    console.log("[provision] Dry provisioning only; ADMIN_TOKEN was not uploaded.");
    console.log(`After the first deploy run: cat ${tokenPath} | npx wrangler secret put ADMIN_TOKEN`);
  }
  console.log("\nProvisioning complete.");
  console.log("Optional Tencent login secret: npx wrangler secret put ADMUSE_COOKIE");
  console.log(`Dashboard admin token is stored in: ${tokenPath}`);
}

main().catch((error) => {
  console.error(`\nProvisioning failed: ${error.message}`);
  process.exitCode = 1;
});
