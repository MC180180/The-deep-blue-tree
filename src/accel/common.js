export const CONFIG = Object.freeze({
  enhancedThreshold: 4096,   // 输入元素数超过这个值就强制走增强后端
  flopsThreshold: 65536,     // 小矩阵直接 JS，避免 GPU 启动开销
  wasmSlotDoubles: 1048576,  // wasm 每个槽位最多 8 MiB = 1,048,576 个 f64
  webgpuMinFlops: 262144,
  webglMinFlops: 131072,
  maxTextureSize: 8192,
});

const registry = new Map();
const availability = {
  js: true,
  wasm: false,
  webgl2: false,
  webgpu: typeof navigator !== "undefined" && !!navigator.gpu,
};

const counters = { js: 0, wasm: 0, webgl2: 0, webgpu: 0 };
const state = {
  lastBackend: "未调用",
  lastMs: 0,
  force: null,
  threshold: CONFIG.enhancedThreshold,
};

export function registerBackend(name, fn) {
  registry.set(name, fn);
}

export function markAvailable(name, value) {
  availability[name] = !!value;
}

export function setForcedBackend(name) {
  const normalized = String(name || "").toLowerCase();
  if (normalized === "auto" || normalized === "自动" || !normalized) {
    state.force = null;
  } else if (registry.has(normalized) && availability[normalized]) {
    state.force = normalized;
  }
  return state.force || "auto";
}

export function setEnhanceThreshold(value) {
  const n = Number(value);
  if (Number.isFinite(n) && n > 0) state.threshold = Math.max(64, Math.floor(n));
  return state.threshold;
}

export function getStatus() {
  return {
    lastBackend: state.lastBackend,
    lastMs: state.lastMs,
    force: state.force || "auto",
    threshold: state.threshold,
    availability: { ...availability },
    calls: { ...counters },
  };
}

export function getBackendName() {
  return state.lastBackend;
}

function flatten(input, out) {
  if (Array.isArray(input)) {
    for (let i = 0; i < input.length; i++) flatten(input[i], out);
    return;
  }
  const n = Number(input);
  out.push(Number.isFinite(n) ? n : 0);
}

export function toFlatFloat64(input) {
  const out = [];
  let value = input;
  if (typeof value === "string") {
    const text = value.trim();
    if (!text) return new Float64Array(0);
    try {
      value = JSON.parse(text);
    } catch {
      value = text.split(/[\s,;]+/).filter(Boolean);
    }
  }
  if (Array.isArray(value)) flatten(value, out);
  else {
    const n = Number(value);
    if (Number.isFinite(n)) out.push(n);
  }
  return Float64Array.from(out);
}

export function validShape(shape, length) {
  if (!Array.isArray(shape) || shape.length === 0) return false;
  let total = 1;
  for (const d of shape) {
    const n = Number(d);
    if (!Number.isInteger(n) || n <= 0) return false;
    total *= n;
  }
  return total === length;
}

function taskMetrics(task) {
  if (task.op === "matmul") {
    const [ar, ac] = task.aShape;
    const [, bc] = task.bShape;
    return {
      flops: ar * ac * bc,
      outLength: ar * bc,
      dims: [ar, ac, bc],
    };
  }
  if (task.op === "elementwise" || task.op === "dot") {
    return {
      flops: task.a.length,
      outLength: task.op === "dot" ? 1 : task.a.length,
      dims: [task.a.length],
    };
  }
  return { flops: 0, outLength: 0, dims: [] };
}

export function chooseBackend(task, options = {}) {
  if (state.force && availability[state.force] && registry.has(state.force)) {
    return state.force;
  }
  if (options.force && availability[options.force] && registry.has(options.force)) {
    return options.force;
  }

  const { flops, outLength, dims } = taskMetrics(task);
  const elements = Math.max(task.a.length, task.b ? task.b.length : 0, outLength);
  const longInput = elements > state.threshold;
  const smallTask = elements <= state.threshold && flops <= CONFIG.flopsThreshold;

  if (options.prefer && availability[options.prefer] && registry.has(options.prefer) && longInput) {
    return options.prefer;
  }
  if (smallTask) return "js";

  const maxDim = Math.max(0, ...dims);
  if (
    longInput &&
    flops >= CONFIG.webgpuMinFlops &&
    availability.webgpu &&
    maxDim <= 16384
  ) {
    return "webgpu";
  }
  if (longInput && elements <= CONFIG.wasmSlotDoubles && availability.wasm) return "wasm";
  if (
    longInput &&
    flops >= CONFIG.webglMinFlops &&
    availability.webgl2 &&
    maxDim <= CONFIG.maxTextureSize
  ) {
    return "webgl2";
  }
  return "js";
}

function assertResult(data, task) {
  if (!(data instanceof Float64Array)) {
    throw new Error(`backend returned invalid result for ${task.op}`);
  }
  const expected = taskMetrics(task).outLength;
  if (data.length !== expected) {
    throw new Error(`backend result length ${data.length}, expected ${expected}`);
  }
}

function fallbackOrder(primary, task) {
  const order = [primary];
  for (const name of ["webgpu", "wasm", "webgl2", "js"]) {
    if (name === primary || !availability[name] || !registry.has(name)) continue;
    if (name === "webgpu" && task.op === "elementwise") continue;
    order.push(name);
  }
  return order;
}

export async function compute(task, options = {}) {
  const primary = chooseBackend(task, options);
  let lastError = null;

  for (const name of fallbackOrder(primary, task)) {
    const fn = registry.get(name);
    if (!fn) continue;
    try {
      const started = performance.now();
      let data = await fn(task);
      data = Float64Array.from(data);
      assertResult(data, task);
      const elapsed = performance.now() - started;

      state.lastBackend = name;
      state.lastMs = elapsed;
      counters[name] = (counters[name] || 0) + 1;
      return data;
    } catch (error) {
      lastError = error;
      if (typeof console !== "undefined" && console.warn) {
        console.warn(`[DeepBlueAccel] ${name} failed, falling back:`, error);
      }
    }
  }
  throw lastError || new Error("no usable backend");
}

export function makeMatmulTask(a, aShape, b, bShape) {
  if (!validShape(aShape, a.length)) throw new Error(`invalid aShape ${JSON.stringify(aShape)}`);
  if (!validShape(bShape, b.length)) throw new Error(`invalid bShape ${JSON.stringify(bShape)}`);
  if (aShape[1] !== bShape[0]) throw new Error("inner dimensions do not match");
  return {
    op: "matmul",
    a: Float64Array.from(a),
    aShape: [...aShape],
    b: Float64Array.from(b),
    bShape: [...bShape],
  };
}

export function makeElementwiseTask(op, a, b) {
  if (a.length !== b.length) throw new Error("elementwise length mismatch");
  return {
    op: "elementwise",
    subOp: op,
    a: Float64Array.from(a),
    b: Float64Array.from(b),
  };
}
