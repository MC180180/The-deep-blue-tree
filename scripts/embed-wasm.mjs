import { readFile, writeFile } from "node:fs/promises";

const wasmPath = new URL("../src/wasm/matmul.wasm", import.meta.url);
const outPath = new URL("../src/accel/wasm-b64.js", import.meta.url);
const bytes = await readFile(wasmPath);
const b64 = bytes.toString("base64");

const source = `// 由 scripts/embed-wasm.mjs 生成，请勿手改\nexport const WASM_BASE64 = "${b64}";\nexport const WASM_BYTES = ${bytes.length};\n`;
await writeFile(outPath, source);
console.log(`embedded wasm: ${bytes.length} bytes`);
