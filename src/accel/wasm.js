import { registerBackend, markAvailable } from "./common.js";
import { WASM_BASE64 } from "./wasm-b64.js";

const A_DOUBLES = 0;
const B_DOUBLES = 8 * 1024 * 1024 / 8;
const O_DOUBLES = 16 * 1024 * 1024 / 8;
const SLOT_DOUBLES = 8 * 1024 * 1024 / 8;

let wasm = null;
let initError = null;

function instantiate() {
  if (typeof WebAssembly === "undefined") throw new Error("WebAssembly unavailable");
  const bytes = Uint8Array.from(atob(WASM_BASE64), (ch) => ch.charCodeAt(0));
  const module = new WebAssembly.Module(bytes);
  const instance = new WebAssembly.Instance(module, {});
  const exports = instance.exports;
  if (!exports.memory || !exports.matmul_f64 || !exports.elementwise_f64) {
    throw new Error("wasm exports missing");
  }
  return exports;
}

try {
  wasm = instantiate();
} catch (error) {
  initError = error;
}

markAvailable("wasm", !!wasm);

function ensureMemory(exports, neededBytes) {
  const memory = exports.memory;
  const pages = Math.ceil(neededBytes / 65536);
  const current = memory.buffer.byteLength / 65536;
  if (pages > current && memory.grow(pages - current) === -1) {
    throw new Error("wasm memory.grow failed");
  }
  return new Float64Array(memory.buffer);
}

function taskOutputLength(task) {
  if (task.op === "matmul") return task.aShape[0] * task.bShape[1];
  if (task.op === "elementwise") return task.a.length;
  return 1;
}

registerBackend("wasm", (task) => {
  if (!wasm) throw initError || new Error("wasm unavailable");

  const outLen = taskOutputLength(task);
  if (task.a.length > SLOT_DOUBLES || (task.b && task.b.length > SLOT_DOUBLES) || outLen > SLOT_DOUBLES) {
    throw new Error("input exceeds wasm slot size");
  }

  const neededBytes = 24 * 1024 * 1024;
  const mem = ensureMemory(wasm, neededBytes);
  mem.set(task.a, A_DOUBLES);
  if (task.b) mem.set(task.b, B_DOUBLES);
  mem.fill(0, O_DOUBLES, O_DOUBLES + outLen);

  let code;
  if (task.op === "matmul") {
    code = wasm.matmul_f64(
      task.aShape[0], task.aShape[1], task.bShape[0], task.bShape[1]
    );
  } else if (task.op === "elementwise") {
    const opCode = { add: 0, sub: 1, mul: 2, div: 3 }[task.subOp];
    code = wasm.elementwise_f64(task.a.length, opCode ?? -1);
  } else {
    throw new Error(`wasm backend does not support ${task.op}`);
  }
  if (code !== 0) throw new Error(`wasm kernel returned ${code}`);

  return mem.slice(O_DOUBLES, O_DOUBLES + outLen);
});
