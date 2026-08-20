#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const sentinel = resolve(root, "src/index.ts");
const expectedSha256 = "2220d9647f808169a646c3dd45ff878089f1f1eacfdd99d1a7d286ebca1ceca2";
const partNames = [
  "part-00",
  "part-01",
  "part-02",
  "part-03-0",
  "part-03-1",
  "part-04",
  "part-05-0",
  "part-05-1",
  "part-06",
];

if (existsSync(sentinel)) {
  console.log("[unpack] source tree already present");
  process.exit(0);
}

const buffers = partNames.map((partName) => {
  const path = resolve(root, "payload.parts", partName);
  if (!existsSync(path)) {
    throw new Error(`payload part is missing: ${partName}`);
  }
  return readFileSync(path);
});
const archive = Buffer.concat(buffers);
const actualSha256 = createHash("sha256").update(archive).digest("hex");
if (actualSha256 !== expectedSha256) {
  throw new Error(
    `payload integrity check failed: expected ${expectedSha256}, got ${actualSha256}`,
  );
}

const archivePath = resolve(root, ".payload.reconstructed.tgz");
writeFileSync(archivePath, archive);
try {
  execFileSync("tar", ["-xzf", archivePath, "-C", root], { stdio: "inherit" });
} finally {
  rmSync(archivePath, { force: true });
}
if (!existsSync(sentinel)) {
  throw new Error("payload extraction completed without src/index.ts");
}
console.log(`[unpack] source tree restored; SHA-256 ${actualSha256}`);
