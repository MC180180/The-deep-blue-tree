import {
  CONFIG,
  compute,
  getBackendName,
  getStatus,
  makeElementwiseTask,
  makeMatmulTask,
  setEnhanceThreshold,
  setForcedBackend,
  toFlatFloat64,
  validShape,
} from "./common.js";

import "./js.js";
import "./wasm.js";
import "./webgl.js";
import "./webgpu.js";

function product(shape) {
  return shape.reduce((a, b) => a * b, 1);
}

function broadcastShape(a, b) {
  const rank = Math.max(a.length, b.length);
  const out = new Array(rank);
  for (let i = 0; i < rank; i++) {
    const ia = i - (rank - a.length);
    const ib = i - (rank - b.length);
    const da = ia >= 0 ? a[ia] : 1;
    const db = ib >= 0 ? b[ib] : 1;
    if (da !== db && da !== 1 && db !== 1) return null;
    out[i] = Math.max(da, db);
  }
  return out;
}

function broadcastCoords(coords, shape) {
  const offset = coords.length - shape.length;
  return shape.map((d, i) => (d === 1 ? 0 : coords[offset + i]));
}

function flatOffset(coords, shape) {
  let offset = 0;
  for (let i = 0; i < coords.length; i++) offset = offset * shape[i] + coords[i];
  return offset;
}

function unravel(index, shape) {
  const coords = new Array(shape.length);
  let rest = index;
  for (let i = shape.length - 1; i >= 0; i--) {
    coords[i] = rest % shape[i];
    rest = Math.floor(rest / shape[i]);
  }
  return coords;
}

export async function matmul(a, aShape, b, bShape, options) {
  return compute(makeMatmulTask(a, aShape, b, bShape), options);
}

export async function matvec(vector, matrix, n, m, options) {
  if (vector.length !== n) throw new Error("vector length mismatch");
  if (matrix.length !== n * m) throw new Error("matrix length mismatch");
  return compute(makeMatmulTask(vector, [1, n], matrix, [n, m]), options);
}

export async function elementwise(op, a, b, options) {
  return compute(makeElementwiseTask(op, a, b), options);
}

export async function dot(a, b, options) {
  if (a.length !== b.length) throw new Error("dot length mismatch");
  return compute(makeMatmulTask(a, [1, a.length], b, [a.length, 1]), options);
}

export async function batchMatmul(a, aShape, b, bShape, options) {
  if (aShape.length < 2 || bShape.length < 2) throw new Error("batchMatmul needs rank >= 2");
  const aBatch = aShape.slice(0, -2);
  const bBatch = bShape.slice(0, -2);
  const batchShape = broadcastShape(aBatch, bBatch);
  if (!batchShape) throw new Error("batch dimensions cannot broadcast");

  const ar = aShape[aShape.length - 2];
  const ac = aShape[aShape.length - 1];
  const br = bShape[bShape.length - 2];
  const bc = bShape[bShape.length - 1];
  if (ac !== br) throw new Error("inner dimensions do not match");

  const batches = product(batchShape);
  const matrixASize = ar * ac;
  const matrixBSize = br * bc;
  const matrixOutSize = ar * bc;
  const out = new Float64Array(batches * matrixOutSize);

  for (let index = 0; index < batches; index++) {
    const coords = unravel(index, batchShape);
    const aCoord = broadcastCoords(coords, aBatch);
    const bCoord = broadcastCoords(coords, bBatch);
    const aOffset = flatOffset(aCoord, aBatch) * matrixASize;
    const bOffset = flatOffset(bCoord, bBatch) * matrixBSize;
    const result = await matmul(
      a.subarray(aOffset, aOffset + matrixASize), [ar, ac],
      b.subarray(bOffset, bOffset + matrixBSize), [br, bc],
      options
    );
    out.set(result, index * matrixOutSize);
  }

  return { data: out, shape: [...batchShape, ar, bc] };
}

export {
  CONFIG,
  compute,
  toFlatFloat64,
  validShape,
  getStatus,
  getBackendName,
  setForcedBackend,
  setEnhanceThreshold,
};

const api = globalThis.DeepBlueAccel || {};
Object.assign(api, {
  CONFIG,
  compute,
  matmul,
  matvec,
  elementwise,
  dot,
  batchMatmul,
  toFlatFloat64,
  validShape,
  getStatus,
  getBackendName,
  setForcedBackend,
  setEnhanceThreshold,
});

globalThis.DeepBlueAccel = api;
if (typeof window !== "undefined") window.DeepBlueAccel = api;
