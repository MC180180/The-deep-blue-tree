import assert from "node:assert/strict";
import { test } from "node:test";
import * as Accel from "../src/accel/index.js";

function close(actual, expected, epsilon = 1e-9) {
  assert.ok(Math.abs(actual - expected) <= epsilon, `${actual} != ${expected}`);
}

test("小矩阵走 JS 后端并给出正确点积", async () => {
  Accel.setForcedBackend("auto");
  const result = await Accel.matvec(
    Float64Array.from([1, 2, 3]),
    Float64Array.from([1, 4, 7, 2, 5, 8, 3, 6, 9]),
    3, 3
  );
  assert.deepEqual(Array.from(result), [14, 32, 50]);
  assert.equal(Accel.getBackendName(), "js");
});

test("长矩阵自动切换到 wasm 增强后端", async () => {
  Accel.setForcedBackend("auto");
  const n = 100;
  const m = 120;
  const vector = Float64Array.from({ length: n }, (_, i) => i + 1);
  const matrix = Float64Array.from({ length: n * m }, (_, i) => (i % 7) + 1);

  const result = await Accel.matvec(vector, matrix, n, m);
  assert.equal(result.length, m);
  assert.equal(Accel.getBackendName(), "wasm");

  let expected = 0;
  for (let i = 0; i < n; i++) expected += (i + 1) * ((i % 7) + 1);
  close(result[0], expected);
});

test("强制 js 与 wasm 后端结果一致", async () => {
  const a = Float64Array.from({ length: 64 * 64 }, (_, i) => (i % 13) - 6);
  const b = Float64Array.from({ length: 64 * 64 }, (_, i) => (i % 17) - 8);

  Accel.setForcedBackend("js");
  const jsResult = await Accel.matmul(a, [64, 64], b, [64, 64]);
  Accel.setForcedBackend("wasm");
  const wasmResult = await Accel.matmul(a, [64, 64], b, [64, 64]);
  Accel.setForcedBackend("auto");

  assert.equal(jsResult.length, wasmResult.length);
  for (let i = 0; i < jsResult.length; i++) close(wasmResult[i], jsResult[i], 1e-9);
});

test("batch matmul 支持广播", async () => {
  Accel.setForcedBackend("auto");
  const a = Float64Array.from({ length: 2 * 2 * 3 }, (_, i) => i + 1);
  const b = Float64Array.from([1, 0, 0, 1, 1, 1]);
  const result = await Accel.batchMatmul(a, [2, 2, 3], b, [3, 2]);

  assert.deepEqual(result.shape, [2, 2, 2]);
  assert.equal(result.data.length, 8);
  close(result.data[0], 1 * 1 + 2 * 0 + 3 * 1);
  close(result.data[1], 1 * 0 + 2 * 1 + 3 * 1);
});

test("阈值可以通过 API 调整", () => {
  const before = Accel.getStatus().threshold;
  const next = Accel.setEnhanceThreshold(8192);
  assert.equal(next, 8192);
  Accel.setEnhanceThreshold(before);
});
