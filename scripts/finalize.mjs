import { readFile, writeFile } from "node:fs/promises";

const distPath = new URL("../dist/SLZS.optimized.js", import.meta.url);
const rootPath = new URL("../SLZS.optimized.js", import.meta.url);
const source = await readFile(distPath, "utf8");

for (const marker of [
  "DeepBlueAccel",
  "ACCEL_STATUS_block",
  "WebGL2 backend",
  "WebGPU storage buffer",
  "wasm kernel returned",
]) {
  if (!source.includes(marker)) throw new Error(`build verification failed: missing ${marker}`);
}

await writeFile(rootPath, source);
console.log(`final bundle: ${source.length} chars -> ${rootPath.pathname}`);
