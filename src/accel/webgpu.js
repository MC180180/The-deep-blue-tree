import { registerBackend, markAvailable } from "./common.js";

const SHADER = `
struct Params {
  ar: u32,
  ac: u32,
  bc: u32,
  n: u32,
  op: u32,
  p0: u32,
  p1: u32,
  p2: u32,
};

@group(0) @binding(0) var<storage, read> a: array<f32>;
@group(0) @binding(1) var<storage, read> b: array<f32>;
@group(0) @binding(2) var<storage, read_write> out: array<f32>;
@group(0) @binding(3) var<uniform> params: Params;

@compute @workgroup_size(8, 8, 1)
fn matmul_main(@builtin(global_invocation_id) gid: vec3<u32>) {
  let row = gid.x;
  let col = gid.y;
  if (row >= params.ar || col >= params.bc) { return; }
  var sum = 0.0;
  for (var k = 0u; k < params.ac; k = k + 1u) {
    sum = sum + a[row * params.ac + k] * b[k * params.bc + col];
  }
  out[row * params.bc + col] = sum;
}

@compute @workgroup_size(64, 1, 1)
fn elementwise_main(@builtin(global_invocation_id) gid: vec3<u32>) {
  let i = gid.x;
  if (i >= params.n) { return; }
  let av = a[i];
  let bv = b[i];
  var result = 0.0;
  if (params.op == 0u) { result = av + bv; }
  else if (params.op == 1u) { result = av - bv; }
  else if (params.op == 2u) { result = av * bv; }
  else if (params.op == 3u) {
    if (bv != 0.0) { result = av / bv; }
  }
  out[i] = result;
}
`;

let devicePromise = null;
let gpuContext = null;

async function initGPU() {
  if (gpuContext) return gpuContext;
  if (devicePromise) {
    await devicePromise;
    return gpuContext;
  }
  if (typeof navigator === "undefined" || !navigator.gpu) {
    markAvailable("webgpu", false);
    return null;
  }

  devicePromise = (async () => {
    try {
      const adapter = await navigator.gpu.requestAdapter({ powerPreference: "high-performance" });
      if (!adapter) throw new Error("no WebGPU adapter");
      const device = await adapter.requestDevice();
      const module = device.createShaderModule({ code: SHADER });
      const matmulPipeline = device.createComputePipeline({
        layout: "auto",
        compute: { module, entryPoint: "matmul_main" },
      });
      const elementwisePipeline = device.createComputePipeline({
        layout: "auto",
        compute: { module, entryPoint: "elementwise_main" },
      });
      gpuContext = { device, matmulPipeline, elementwisePipeline };
      markAvailable("webgpu", true);
    } catch (error) {
      markAvailable("webgpu", false);
      throw error;
    } finally {
      devicePromise = null;
    }
  })();

  await devicePromise;
  return gpuContext;
}

function outputLength(task) {
  if (task.op === "matmul") return task.aShape[0] * task.bShape[1];
  if (task.op === "elementwise") return task.a.length;
  throw new Error(`WebGPU backend does not support ${task.op}`);
}

registerBackend("webgpu", async (task) => {
  const c = await initGPU();
  if (!c) throw new Error("WebGPU unavailable");

  const { device } = c;
  const len = outputLength(task);
  const aData = Float32Array.from(task.a);
  const bData = task.b ? Float32Array.from(task.b) : new Float32Array(0);
  const outBytes = Math.max(4, len * 4);
  const limit = device.limits?.maxStorageBufferBindingSize ?? 134217728;
  if (aData.byteLength > limit || bData.byteLength > limit || outBytes > limit) {
    throw new Error("WebGPU storage buffer limit exceeded");
  }

  const usageIn = GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST;
  const aBuffer = device.createBuffer({ size: Math.max(4, aData.byteLength), usage: usageIn });
  const bBuffer = device.createBuffer({ size: Math.max(4, bData.byteLength), usage: usageIn });
  const outBuffer = device.createBuffer({ size: outBytes, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC });
  const staging = device.createBuffer({ size: outBytes, usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST });

  const params = new Uint32Array(8);
  let entry = "matmul_main";
  let pipeline = c.matmulPipeline;
  let workgroups = [1, 1, 1];

  if (task.op === "matmul") {
    const [ar, ac] = task.aShape;
    const [, bc] = task.bShape;
    params[0] = ar; params[1] = ac; params[2] = bc; params[3] = len;
    workgroups = [Math.ceil(ar / 8), Math.ceil(bc / 8), 1];
  } else {
    const opCode = { add: 0, sub: 1, mul: 2, div: 3 }[task.subOp] ?? -1;
    params[3] = len; params[4] = opCode >>> 0;
    pipeline = c.elementwisePipeline;
    entry = "elementwise_main";
    workgroups = [Math.ceil(len / 64), 1, 1];
  }

  const paramBuffer = device.createBuffer({
    size: params.byteLength,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  device.queue.writeBuffer(aBuffer, 0, aData);
  if (bData.length) device.queue.writeBuffer(bBuffer, 0, bData);
  device.queue.writeBuffer(paramBuffer, 0, params);

  const bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: aBuffer } },
      { binding: 1, resource: { buffer: bBuffer } },
      { binding: 2, resource: { buffer: outBuffer } },
      { binding: 3, resource: { buffer: paramBuffer } },
    ],
  });

  const encoder = device.createCommandEncoder();
  const pass = encoder.beginComputePass();
  pass.setPipeline(pipeline);
  pass.setBindGroup(0, bindGroup);
  pass.dispatchWorkgroups(workgroups[0], workgroups[1], workgroups[2]);
  pass.end();
  encoder.copyBufferToBuffer(outBuffer, 0, staging, 0, outBytes);
  device.queue.submit([encoder.finish()]);

  await staging.mapAsync(GPUMapMode.READ);
  const gpuResult = new Float32Array(staging.getMappedRange().slice(0));
  staging.unmap();

  aBuffer.destroy();
  bBuffer.destroy();
  outBuffer.destroy();
  staging.destroy();
  paramBuffer.destroy();

  const out = new Float64Array(len);
  for (let i = 0; i < len; i++) out[i] = gpuResult[i];
  return out;
});
