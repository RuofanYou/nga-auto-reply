#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const sentinel = resolve(root, "src/index.ts");
if (existsSync(sentinel)) {
  console.log("[unpack] source tree already present");
  process.exit(0);
}
const archive = resolve(root, "payload.tgz");
if (!existsSync(archive)) {
  throw new Error("payload.tgz is missing");
}
execFileSync("tar", ["-xzf", archive, "-C", root], { stdio: "inherit" });
if (!existsSync(sentinel)) {
  throw new Error("payload extraction completed without src/index.ts");
}
console.log("[unpack] source tree restored");
