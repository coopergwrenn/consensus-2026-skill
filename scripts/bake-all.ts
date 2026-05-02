// Orchestrator: runs both bakers, emits a MANIFEST.json, fails fast on any
// validation error. CI runs this — exit-non-zero blocks the commit.

import { writeFile, mkdir, readFile } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { bakeEvents } from "./bake-events.ts";
import { bakeSessions } from "./bake-sessions.ts";

interface ManifestEntry {
  file: string;
  records: number;
  bytes: number;
  sha256: string;
  source_url: string;
  baked_at: string;
}

async function sha256File(path: string): Promise<{ hash: string; bytes: number }> {
  const buf = await readFile(path);
  const hash = createHash("sha256").update(buf).digest("hex");
  return { hash, bytes: buf.byteLength };
}

async function main(): Promise<void> {
  const here = dirname(fileURLToPath(import.meta.url));
  const dataDir = `${here}/../data`;
  await mkdir(dataDir, { recursive: true });

  console.log(`[bake-all] starting at ${new Date().toISOString()}`);
  console.log(`[bake-all] step 1/2: side events (plan.wtf)`);
  const events = await bakeEvents();
  await writeFile(`${dataDir}/events.json`, JSON.stringify(events, null, 2) + "\n", "utf8");

  console.log(`[bake-all] step 2/2: main agenda (CoinDesk)`);
  const { sessions, speakers } = await bakeSessions();
  await writeFile(`${dataDir}/sessions.json`, JSON.stringify(sessions, null, 2) + "\n", "utf8");
  await writeFile(`${dataDir}/speakers.json`, JSON.stringify(speakers, null, 2) + "\n", "utf8");

  // Manifest with hashes — useful for the VM-side cron to detect "no change"
  // and skip a needless reload, and for humans to verify an ingest finished.
  const entries: ManifestEntry[] = [];
  for (const [file, baked] of [
    ["events.json", events],
    ["sessions.json", sessions],
    ["speakers.json", speakers],
  ] as const) {
    const { hash, bytes } = await sha256File(`${dataDir}/${file}`);
    entries.push({
      file,
      records: baked.records.length,
      bytes,
      sha256: hash,
      source_url: baked.meta.source_url,
      baked_at: baked.meta.baked_at,
    });
  }
  const manifest = {
    schema_version: 1,
    generated_at: new Date().toISOString(),
    files: entries,
  };
  await writeFile(`${dataDir}/MANIFEST.json`, JSON.stringify(manifest, null, 2) + "\n", "utf8");

  console.log(`\n[bake-all] DONE`);
  for (const e of entries) {
    console.log(`  ${e.file.padEnd(16)} ${String(e.records).padStart(4)} records, ${(e.bytes / 1024).toFixed(1)} KiB, ${e.sha256.slice(0, 12)}…`);
  }
}

main().catch((err) => {
  console.error(`[bake-all] FAIL: ${(err as Error).message}`);
  process.exit(1);
});
