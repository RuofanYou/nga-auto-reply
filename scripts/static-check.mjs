#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const required = [
  "package.json",
  "wrangler.jsonc",
  "migrations/0001_init.sql",
  "src/index.ts",
  "src/mcp.ts",
  "src/api.ts",
  "src/pipeline.ts",
  "src/collector.ts",
  "public/index.html",
  "public/app.js",
  "public/styles.css",
  "fixtures/sample-creatives.json",
  "docs/ARCHITECTURE.md",
  "docs/ADMUSE_SETUP.md",
  "docs/CHATGPT_SETUP.md",
  "docs/OPERATIONS.md",
  "docs/VALIDATION.md",
  "skills/jojo-creative-radar/SKILL.md",
  "README.md",
];

const failures = [];
for (const file of required) {
  if (!existsSync(resolve(root, file))) failures.push(`missing ${file}`);
}

const pkg = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));
const config = JSON.parse(readFileSync(resolve(root, "wrangler.jsonc"), "utf8"));
const fixtures = JSON.parse(
  readFileSync(resolve(root, "fixtures/sample-creatives.json"), "utf8"),
);
if (!pkg.dependencies?.agents) failures.push("agents dependency missing");
if (pkg.dependencies?.["@modelcontextprotocol/server"] !== "2.0.0") {
  failures.push("MCP SDK v2 must be pinned to 2.0.0");
}
if (pkg.dependencies?.["@cloudflare/puppeteer"] !== "1.3.0") {
  failures.push("Cloudflare Puppeteer must be pinned to 1.3.0");
}
if (!Array.isArray(fixtures) || fixtures.length < 10) {
  failures.push("demo fixture should contain at least 10 items");
}

const index = readFileSync(resolve(root, "src/index.ts"), "utf8");
const mcp = readFileSync(resolve(root, "src/mcp.ts"), "utf8");
const api = readFileSync(resolve(root, "src/api.ts"), "utf8");
if (!index.includes('url.pathname === "/mcp"')) failures.push("exact /mcp route missing");
if (!index.includes("createMcpHandler")) failures.push("stateless createMcpHandler missing");
if (!mcp.includes('"search"') || !mcp.includes('"fetch"')) {
  failures.push("standard search/fetch tools missing");
}
if (!mcp.includes("readOnlyHint: true")) failures.push("read-only annotations missing");
if (!api.includes("config_json: configJson")) {
  failures.push("public source response must omit raw config_json");
}

const configText = JSON.stringify(config);
for (const binding of ["DB", "ARTIFACTS", "PIPELINE_QUEUE", "AI", "BROWSER", "ASSETS"]) {
  if (!configText.includes(binding)) failures.push(`binding ${binding} missing`);
}
const crons = config.triggers?.crons;
if (!Array.isArray(crons) || crons.length === 0) failures.push("Cron triggers missing");
if (Array.isArray(crons) && crons.length > 5) failures.push("Free plan supports at most 5 Cron triggers");
if (config.compatibility_date !== "2026-08-20") failures.push("compatibility_date drifted from delivery date");

execFileSync(process.execPath, ["--check", resolve(root, "public/app.js")], {
  stdio: "inherit",
});
execFileSync(process.execPath, ["--check", resolve(root, "scripts/provision.mjs")], {
  stdio: "inherit",
});

if (failures.length) {
  console.error(`Static validation failed:\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log(
  "Static validation passed: repo shape, current package pins, MCP route/tools, bindings, frontend syntax, docs, and fixture JSON.",
);
if (configText.includes("00000000-0000-0000-0000-000000000000")) {
  console.warn("D1 database_id is still a placeholder. Run: npm run setup");
}
